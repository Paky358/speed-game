// PROVE DELL'ASTA "FATTA PIÙ BELLA" (preferiti, 16 ott 2026): rilanci a salto, crediti e posti sotto ogni avatar,
// i 4 round diversi dei temi (normale, ✉️ busta chiusa, 📦 lotto doppio, 🎁 pacco a sorpresa), il voto a un tocco con la
// carta-scenario, il banditore che sfotte, i titoli scherzosi di fine partita, la 📸 foto della rosa / del kit.
// Il RIALZO DA SOLI resta sempre (regola fissa del proprietario): qui si riprova anche coi salti.
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.prova("pa1")
//
// pa0 Senza telefoni: riassunto, regole, ⚙️ «🎭 I round» (di base «Tutti diversi», riaprendo resta), scenari dei 17 temi.
// pa1 Stesso telefono, temi in 3: selettore «Rilancio di +1 +3» (+3 → 4, poi torna +1, rialzo da solo +3), nota «max» sotto gli
//     avatar; round 2 ✉️ busta chiusa passando il telefono (3, 5, 0 → vince 5; poi a pari offerta vince chi ha chiuso prima);
//     round 3 📦 lotto doppio (2 carte nel kit); round 4 🎁 pacco coperto che si scopre; voto a un tocco (3 passaggi); fasce
//     svelate con «⭐ da…», titoli e 📸 (la foto si fa davvero: un PNG); classifica.
// pa2 Stesso telefono, fantacalcio in 3: selettore +1 +2 +5 (+5 senza offerte → 5; +2 → 7), icone dei posti che mancano,
//     partita intera, podio con «📸 Foto», titoli dopo il podio, foto delle rose, classifica.
// pa3 Online temi, host + 2 amici + Bea che arriva tardi e guarda: tasti +1/+3 (e +3 spento oltre il massimo), offerta vecchia →
//     «Troppo tardi di un soffio», doppio messaggio non conta; ✉️ busta: nella foto mai le offerte, Giulia chiude la busta e
//     ricarica la pagina (ritrova «Busta chiusa: 4 💰»), Luca la chiude col tasto, Bea guarda; 📦 e 🎁 (coperto nella foto,
//     scoperto quando lo vince); voto a un tocco (Giulia ricarica e ritrova la sua ⭐, si cambia idea), titoli, «⭐ da…», 📸;
//     misure a 360x640 e 412x915 di busta e voto. Con { dieci: true } in 10 (8 giocano + 2 guardano).
// pa4 Online fantacalcio in 3: +5 senza offerte → 5, tasti +1/+2/+5/Passo, il +5 spento oltre il massimo, partita intera,
//     podio con «📸 Foto» e i titoli che girano sul maxischermo.
// paP La ripresa di Passo 5 (finta finché il core non ha t.ricorda / t.ripresa): l'host ricarica a busta chiusa (la busta si
//     riapre da capo e nella copia ricordata non ci sono le offerte segrete), a metà di un'asta (il lotto riparte da 1) e
//     durante il voto (continua coi voti già dati), fino alla classifica.
// paM 🧨 La carta maledetta sullo stesso telefono in 3 (paga 1, 2, 3, il primo se la prende) col voto a un tocco e il −0,5.
// paMo 🧨 La carta maledetta online in 3 + Bea che guarda, Luca che ricarica a metà, voto a un tocco e −0,5 in classifica.
//     (paM e paMo prendono il posto di g8a1 e g8a2, fatte per il voto a mezze stelle e i «Kit completi» che non ci sono più.)
// paR Le prove di prima (ar1-ar4, ac1-ac4, g8a0, 223, 223f) coi round dei temi «Tutti normali» dove serve:
//     await COPIONE.prova("paR") (lunga: 15-20 minuti; { solo: ["ar1", "ac1"] } per farne alcune).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function prezzo(w) { var b = q(w, ".sa-prezzo b, .st-prezzo b"); return b ? parseInt(b.textContent, 10) : null; }
  function persDi(w, nome) { return qa(w, ".sa-pers").filter(function (p) { var b = p.querySelector("b"); return b && b.textContent === nome; })[0] || null; }
  function capoNome(w) { var p = qa(w, ".sa-pers.guida")[0]; return p ? p.querySelector("b").textContent : null; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function senzaAnimazioni(w) { var st = w.document.createElement("style"); st.textContent = ".schermata,.as-mal-carta,.as-scen,.as-sorpresa,.as-buste .r{animation:none!important;opacity:1!important} .btn.as-auto::after{animation:none!important}"; w.document.head.appendChild(st); }

  // ---- la spia (apriTel(nome, { pa: true })): w.__t = il tavolo, w.__imp = le regole per la prova ----
  {   // (si rimette a ogni caricamento del file: la spia è sempre quella nuova)
    if (!W.__prepPA) W.__prepPA = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepPA(w, nome, opz);
      if (!opz || !opz.pa) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && g.id === "asta") {
            var av = g.avvia;
            g.avvia = function (t) {
              w.__t = t;
              if (w.__imp && t.impostazioni) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
              // la ripresa di Passo 5 finta (questo core non ha ancora t.ricorda / t.ripresa): la copia va in W.__ricordo
              // (col core di Passo 5 la copia si legge lo stesso, e il t.ricorda vero continua a lavorare)
              if (w.__ricordaSpia) { var ric0 = t.ricorda; t.ricorda = function (s) { W.__ricordo = s ? JSON.parse(JSON.stringify(s)) : null; if (ric0) return ric0.apply(t, arguments); }; }
              if (w.__ripresa && !t.ripresa) { t.ripresa = { stato: w.__ripresa, io: "host", gen: 1, eta: 1000, ora: function (x) { return x; } }; w.__ripresa = null; }
              return av.apply(this, arguments);
            };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }
  // la foto: invece di aprire la condivisione, la tengo (w.__foto = { nome, byte })
  function spiaFoto(w) {
    w.__foto = null;
    try {
      Object.defineProperty(w.navigator, "canShare", { configurable: true, value: function () { return true; } });
      Object.defineProperty(w.navigator, "share", { configurable: true, value: function (d) { var f = d && d.files && d.files[0]; w.__foto = { nome: f && f.name, byte: f && f.size, testo: d.text }; return Promise.resolve(); } });
    } catch (e) { no("non riesco a spiare la condivisione: " + e.message); }
  }
  async function fotoFatta(w, cosa) {
    if (!await W.aspetta(function () { return w.__foto; }, 3000)) no("la foto " + cosa + " non parte");
    if (!(w.__foto.byte > 20000) || !/\.png$/.test(w.__foto.nome || "")) no("la foto " + cosa + " è strana: " + JSON.stringify(w.__foto));
    if (!/paky358\.github\.io\/speed-game/.test(w.__foto.testo || "")) no("nella condivisione non c'è il sito: «" + w.__foto.testo + "»");
    var r = cosa + " " + Math.round(w.__foto.byte / 1024) + " KB"; w.__foto = null; return r;
  }
  function dentroSchermo(w, sels) {
    var d = w.document, x = [];
    if (d.scrollingElement.scrollHeight > w.innerHeight + 2) x.push("la pagina scorre (" + d.scrollingElement.scrollHeight + ")");
    sels.forEach(function (s) {
      var e = d.querySelector(s); if (!e) { x.push("manca " + s); return; }
      var r = e.getBoundingClientRect();
      if (r.width <= 0 || r.left < -1 || r.top < -1 || r.right > w.innerWidth + 1 || r.bottom > w.innerHeight + 1) x.push(s + " fuori schermo (" + Math.round(r.top) + "-" + Math.round(r.bottom) + " su " + w.innerHeight + ")");
    });
    return x.join(", ");
  }
  async function misura(nome, cosa, sels) {
    var f = document.getElementById("tel-" + nome), w = W.finestra(nome), out = [], M = [[360, 640], [412, 915]];
    for (var i = 0; i < M.length; i++) {
      f.style.width = M[i][0] + "px"; f.style.height = M[i][1] + "px"; void w.document.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
      await W.dorme(350);
      var e = dentroSchermo(w, sels); if (e) out.push(cosa + " a " + M[i][0] + "x" + M[i][1] + ": " + e);
    }
    f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize")); await W.dorme(150);
    return out;
  }
  async function caricaGioco() {
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), g = {};
    new Function("SG", src)({ registra: function (x) { Object.assign(g, x); }, bot: W.SG && SG.bot });
    return g;
  }
  var mk = function (tag, a, figli) { var e = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { if (k === "text") e.textContent = a[k]; else if (k === "class") e.className = a[k]; else if (k === "style") e.style.cssText = a[k]; else if (k === "onclick") e.onclick = a[k]; else if (k === "hidden") e.hidden = true; else if (k === "html") e.innerHTML = a[k]; else e.setAttribute(k, a[k]); }); (figli || []).forEach(function (f) { if (f) e.appendChild(f); }); return e; };
  function chipBox(box, re) { return [].find.call(box.querySelectorAll(".modo-chip"), function (b) { return re.test(b.textContent); }); }

  // stesso telefono: dalla home fino al gioco (nomi e regole della prova)
  async function partitaLocale(imp, nomi, prima) {
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; if (prima) prima(w); } });
    senzaAnimazioni(P); spiaFoto(P);
    var tess = await W.aspetta(function () { return A.tessera(P, "L'Asta"); }, 6000);
    if (!tess) no("non trovo la tessera dell'Asta");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
    await W.aspetta(function () { return q(P, ".sala-riga input"); }, 3000);
    while (qa(P, ".sala-riga input").length < nomi.length) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    qa(P, ".sala-riga input").forEach(function (c, k) { c.value = nomi[k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    for (var k = 0; k < 8 && !P.__t; k++) {
      await W.dorme(300);
      if (P.__t) break;
      var b = qa(P, ".schermata .piede button").filter(function (x) { return /Avanti|Comincia|Gioca|Inizia|Via|▶/.test(x.textContent) && !x.disabled; })[0];
      if (b) b.click();
    }
    if (!await W.aspetta(function () { return P.__t; }, 3000)) no("l'Asta non parte («" + T(P).slice(0, 70) + "»)");
    return P;
  }

  // ===================================================================== pa0
  COPIONE.aggiungi("pa0", { nome: "Asta: riassunto, regole, ⚙️ «🎭 I round», scenari dei temi", fai: async function () {
    var g = await caricaGioco(), x = [];
    var r0 = g.riassunto({ crediti: 15 }), r1 = g.riassunto({ crediti: 15, round: "normali" }), r2 = g.riassunto({ formato: "fanta" });
    if (!/🎭 round ✉️ 📦 🎁/.test(r0) || !/🔨 round tutti normali/.test(r1) || !/rilanci \+1 \+2 \+5/.test(r2)) no("riassunti: «" + r0 + "» / «" + r1 + "» / «" + r2 + "»");
    var reg = g.regole.join(" ");
    [/<b>\+1<\/b> o <b>\+3<\/b>/, /busta chiusa/, /lotto doppio/, /pacco a sorpresa/, /carta-scenario/, /rialzare da solo/, /titoli scherzosi/, /<b>\+5<\/b>/].forEach(function (re) { if (!re.test(reg)) no("le regole non dicono " + re); });
    var tieni = localStorage.getItem("sg_asta_formato"); localStorage.removeItem("sg_asta_formato");
    try {
      var box = document.createElement("div"), dove = {};
      g.impostazioni(box, dove, { el: mk, modo: "online" });
      if (dove.round !== "misti" || !/attiva/.test(chipBox(box, /Tutti diversi/).className)) no("di base i round non sono «Tutti diversi»: " + dove.round);
      chipBox(box, /Tutti normali/).click(); if (dove.round !== "normali") no("«Tutti normali» non si accende");
      var wrap = chipBox(box, /Tutti normali/).parentNode.parentNode;
      chipBox(box, /Mini asta Fantacalcio/).click(); if (!wrap.hidden) no("nel Fantacalcio «🎭 I round» si vede ancora");
      chipBox(box, /Temi classici/).click(); if (wrap.hidden) no("tornando ai temi «🎭 I round» non si vede");
      var box2 = document.createElement("div"); g.impostazioni(box2, dove, { el: mk, modo: "online" });
      if (dove.round !== "normali" || !/attiva/.test(chipBox(box2, /Tutti normali/).className)) no("riaprendo il ⚙️ i round tornano «Tutti diversi»");
    } finally { if (tieni == null) localStorage.removeItem("sg_asta_formato"); else localStorage.setItem("sg_asta_formato", tieni); }
    if (!W.SG_ASTA_TEMI || !W.SG_ASTA_TEMI.length) {   // (pagina vuota: i temi si caricano qui)
      var nomi = ["carte", "pizza", "panino", "rapina", "supereroi", "appuntamento", "giardino", "vacanza", "coinquilino", "calcetto", "palestra", "capodanno", "universita", "roadtrip", "playstation", "halloween", "natale"];
      for (var i = 0; i < nomi.length; i++) (0, eval)(await (await fetch("/data/asta-" + nomi[i] + ".js?" + Date.now())).text());
    }
    var temi = W.SG_ASTA_TEMI || [];
    if (temi.length !== 17) no("i temi sono " + temi.length);
    temi.forEach(function (tm) {
      var s = tm.scenari || [];
      if (s.length < 2) no("il tema " + tm.id + " ha " + s.length + " scenari");
      s.forEach(function (c) { if (!c.emoji || !c.testo || c.testo.length > 80 || !/\?$|»$/.test(c.testo)) no("scenario strano in " + tm.id + ": " + JSON.stringify(c)); });
    });
    x.push("«" + r0 + "»", temi.length + " temi con " + temi.reduce(function (a, t) { return a + t.scenari.length; }, 0) + " scenari");
    return x.join(" · ");
  } });

  // ===================================================================== pa1
  COPIONE.aggiungi("pa1", { nome: "Asta stesso telefono (temi in 3): salti, busta chiusa, lotto doppio, pacco, voto a un tocco, titoli, foto", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"];
    var P = await partitaLocale({ formato: "temi", crediti: 15, round: "misti", maledetta: false }, NOMI);
    var visto = { salti: "", buste: [], doppio: "", pacco: "", voto: 0, misure: [] }, fino = Date.now() + 240000, nBusta = 0, primaAsta = true;
    while (Date.now() < fino) {
      var d = P.document, tx = T(P);
      if (/Fasce svelate/.test(tx)) break;
      if (/Passa il telefono a/.test(tx)) { W.clicca(P, /^Sono /); await W.dorme(150); continue; }
      // ✉️ la busta di chi ha il telefono
      var bus = q(P, ".schermata.as-bus");
      if (bus) {
        var chi = (q(P, ".as-bus-testa span").textContent.split("· ")[1] || "").trim(), piu = bott(P, ".as-bst button", /^\+$/), piu3 = bott(P, ".as-bst button", /^\+3$/);
        var ok = bott(P, ".schermata .piede button", /Chiudo la busta|Non offro/);
        if (!ok || !piu) no("la busta non ha i tasti («" + T(P).slice(0, 120) + "»)");
        if (nBusta === 0 && !visto.buste.length) { visto.misure = visto.misure.concat(await misura("Paky", "la busta", [".as-bus-carta", ".as-bst", ".schermata .piede .btn"])); }
        var v0 = parseInt(q(P, ".as-bst .v").textContent, 10), k = visto.buste.length;
        // 1ª busta: chi ha scelto 3, il secondo 5, il terzo 0; 2ª busta: tutti e due 2 (vince chi ha chiuso prima)
        var vuoi = nBusta === 0 ? [3, 5, 0][k] : 2;
        if (k === 0 && v0 !== 1) no("chi ha scelto la carta non parte da 1 nella busta (" + v0 + ")");
        if (k === 1 && v0 !== 0) no("chi non ha scelto non parte da 0 (" + v0 + ")");
        if (vuoi - v0 >= 3) { piu3.click(); v0 += 3; }
        while (v0 < vuoi) { piu.click(); v0++; }
        visto.buste.push(chi + ":" + vuoi);
        ok.click(); await W.dorme(200); continue;
      }
      var buste = q(P, ".as-buste");
      if (buste && nBusta < 2 && !P.__bustaVista) {
        P.__bustaVista = true;
        var righe = qa(P, ".as-buste .r").map(function (r) { return r.textContent.replace(/\s+/g, " "); }), vince = (q(P, ".as-buste .r.vince") || {}).textContent || "";
        if (nBusta === 0) {
          var nome5 = visto.buste[1].split(":")[0];
          if (righe.length !== 3 || vince.indexOf(nome5) < 0 || vince.indexOf("5") < 0) no("1ª busta: righe " + JSON.stringify(righe) + " vince «" + vince + "» (voluto " + nome5 + " a 5)");
          if (!/per 5 💰/.test(T(P))) no("la 1ª busta non dice «per 5 💰»");
        } else {
          var primo = visto.buste[visto.buste.length - 2].split(":")[0];
          if (vince.indexOf(primo) < 0) no("2ª busta a pari offerta (2 e 2) non vince chi ha chiuso prima (" + primo + "): «" + vince + "»");
        }
        nBusta++; visto.buste.push("|");
        W.clicca(P, /Avanti/); await W.dorme(200); P.__bustaVista = false; continue;
      }
      // l'esito del pacco e del lotto doppio
      if (/Dentro il pacco c'era/.test(tx) && !visto.pacco) { var nm = (q(P, ".as-big .nm") || {}).textContent; if (!nm || /Pacco a sorpresa/.test(nm)) no("il pacco vinto non si scopre: «" + nm + "»"); visto.pacco = nm; }
      if (/Lotto doppio: tutte e due nel kit/.test(tx) && !visto.doppio) visto.doppio = (q(P, ".as-big .nm") || {}).textContent;
      // il voto a un tocco
      if (q(P, ".as-vk")) {
        if (!q(P, ".as-scen")) no("nel voto non c'è la carta-scenario");
        if (qa(P, ".as-vk").length !== 2) no("nel voto ci sono " + qa(P, ".as-vk").length + " kit invece di 2 (il proprio non si vota)");
        if (!visto.voto) visto.misure = visto.misure.concat(await misura("Paky", "il voto", [".as-scen", ".as-vk"]));
        qa(P, ".as-vk")[visto.voto === 1 ? 1 : 0].click(); visto.voto++;
        await W.dorme(700); continue;
      }
      if (q(P, ".as-scen") && /Si vota/.test(tx)) { W.clicca(P, /Si vota/); await W.dorme(200); continue; }
      // la scelta della carta: prima il lotto doppio e il pacco (se ci sono)
      var carte = qa(P, ".as-carta:not([disabled])");
      if (carte.length) {
        var dp = q(P, ".as-carta.doppio"), pc = q(P, ".as-carta.pacco");
        if (pc && /🎁/.test(pc.textContent) && !/Pacco a sorpresa/.test(pc.textContent)) no("il pacco non è coperto");
        (dp || pc || carte[0]).click(); await W.dorme(250); continue;
      }
      // la sala: alla prima asta i salti; poi passano tutti tranne chi guida
      if (q(P, ".sa-pers") && prezzo(P) != null && !q(P, ".sa-aggiudicato")) {
        if (primaAsta) {
          primaAsta = false;
          var sel = qa(P, ".as-sel button").map(function (b) { return b.textContent; }).join(",");
          if (sel !== "+1,+3") no("il selettore dei salti è «" + sel + "»");
          if (!qa(P, ".sa-pers small").some(function (s) { return /max \d/.test(s.textContent); })) no("sotto gli avatar non c'è «max» (" + qa(P, ".sa-pers small").map(function (s) { return s.textContent; }).join(",") + ")");
          var capo = capoNome(P), altro = NOMI.filter(function (n) { return n !== capo; })[0], p0 = prezzo(P);
          bott(P, ".as-sel button", /^\+3$/).click(); await W.dorme(80);
          if (!q(P, ".as-sel button.on") || q(P, ".as-sel button.on").textContent !== "+3") no("toccando +3 il selettore non si accende");
          persDi(P, altro).click(); await W.dorme(150);
          if (prezzo(P) !== p0 + 3 || capoNome(P) !== altro) no("+3 di " + altro + ": " + prezzo(P) + " di " + capoNome(P) + " (voluto " + (p0 + 3) + ")");
          if (q(P, ".as-sel button.on").textContent !== "+1") no("dopo il rilancio il salto non torna +1");
          bott(P, ".as-sel button", /^\+3$/).click(); persDi(P, altro).click(); await W.dorme(150);   // rialzo da solo, a salto
          if (prezzo(P) !== p0 + 6 || capoNome(P) !== altro) no("il rialzo da solo +3 di " + altro + ": " + prezzo(P));
          visto.salti = altro + " " + p0 + "→" + (p0 + 3) + "→" + (p0 + 6) + " (" + ((q(P, ".sa-bolla") || {}).textContent || "") + ")";
        }
        var c2 = capoNome(P);
        qa(P, ".sa-pers").forEach(function (p) { var b = p.querySelector("b").textContent, ps = p.querySelector(".sa-passo"); if (b !== c2 && ps && ps.style.visibility !== "hidden" && !p.classList.contains("fuori")) ps.click(); });
        await W.dorme(300); continue;
      }
      W.clicca(P, /Vedi le carte|Avanti ▶|Avanti/); await W.dorme(250);
    }
    if (!/Fasce svelate/.test(T(P))) no("la partita non arriva alle fasce svelate («" + T(P).slice(0, 100) + "»)");
    if (!visto.salti) no("i salti non si sono visti");
    if (nBusta < 2) no("le buste chiuse viste: " + nBusta);
    if (!visto.doppio || !/ \+ /.test(visto.doppio)) no("il lotto doppio non si è visto («" + visto.doppio + "»)");
    if (!visto.pacco) no("il pacco a sorpresa non si è scoperto");
    if (visto.voto !== 3) no("voti dati: " + visto.voto);
    // le fasce svelate: chi ha votato chi, un kit da 5 carte (il lotto doppio), i titoli, la foto
    var kits = qa(P, ".as-kit").map(function (k) { return k.querySelectorAll(".riga").length; });
    if (kits.indexOf(5) < 0) no("nessun kit ha 5 carte (lotto doppio): " + kits.join(","));
    if (qa(P, ".as-voti-da").length !== 3) no("«⭐ da…» non c'è in tutti i kit");
    var tot = qa(P, ".as-voti-da").reduce(function (a, e) { var m = e.textContent.match(/da (.*)$/); return a + (m ? m[1].split(",").length : 0); }, 0);
    if (tot !== 3) no("le stelle date sono " + tot + " invece di 3");
    var titoli = qa(P, ".as-tit").map(function (t) { return t.textContent; });
    if (!titoli.length) no("non c'è nessun titolo scherzoso");
    visto.misure = visto.misure.concat(await misura("Paky", "le fasce svelate", [".schermata .piede .btn-primario"]));
    W.clicca(P, /Foto dei kit/); var foto = await fotoFatta(P, "dei kit");
    W.clicca(P, /Classifica finale/); await W.dorme(400);
    if (qa(P, ".classifica li").length !== 3) no("la classifica non ha 3 righe («" + T(P).slice(0, 120) + "»)");
    if (!/⭐/.test(T(P))) no("la classifica non dice le stelle");
    if (visto.misure.length) no(visto.misure.join(" / "));
    return "salti " + visto.salti + " · buste " + visto.buste.join(" ") + " · doppio «" + visto.doppio + "» · pacco «" + visto.pacco + "» · titoli: " + titoli.join(" | ") + " · " + foto;
  } });

  // ===================================================================== pa2
  COPIONE.aggiungi("pa2", { nome: "Asta stesso telefono (fanta in 3): salti +1 +2 +5, posti che mancano, podio con 📸, titoli", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"];
    var P = await partitaLocale({ formato: "fanta" }, NOMI), x = [];
    var ok0 = await W.aspetta(function () { if (q(P, ".st-stadio .sa-pers")) return true; W.clicca(P, /Comincia l'asta/); return false; }, 8000);
    if (!ok0) no("non arrivo allo stadio");
    await W.dorme(300);
    var sel = qa(P, ".as-sel button").map(function (b) { return b.textContent; }).join(",");
    if (sel !== "+1,+2,+5") no("il selettore del fanta è «" + sel + "»");
    var manca = qa(P, ".sa-manca").map(function (m) { return m.textContent; });
    if (manca.length !== 3 || manca.some(function (m) { return m !== "🧤🛡️🎽🎽⚽"; })) no("i posti che mancano all'inizio: " + JSON.stringify(manca));
    var note0 = qa(P, ".sa-pers small").map(function (m) { return m.textContent; });
    if (note0.some(function (m) { return m !== "20 💰 · max 16"; })) no("sotto gli avatar all'inizio: " + JSON.stringify(note0) + " (voluto «20 💰 · max 16»)");
    var gara = qa(P, ".sa-pers.puo").map(function (p) { return p.querySelector("b").textContent; });
    if (gara.length < 2) no("all'inizio possono offrire in " + gara.length);
    bott(P, ".as-sel button", /^\+5$/).click(); persDi(P, gara[0]).click(); await W.dorme(150);
    if (prezzo(P) !== 5 || capoNome(P) !== gara[0]) no("+5 senza offerte: " + prezzo(P) + " di " + capoNome(P) + " (voluto 5)");
    bott(P, ".as-sel button", /^\+2$/).click(); persDi(P, gara[1]).click(); await W.dorme(150);
    if (prezzo(P) !== 7 || capoNome(P) !== gara[1]) no("+2 di " + gara[1] + ": " + prezzo(P));
    x.push(gara[0] + " 5, " + gara[1] + " 7 (" + ((q(P, ".st-ticker") || {}).textContent || "") + ")");
    // il resto: il primo che può lo prende, gli altri passano
    var fino = Date.now() + 200000, ruoliPieni = false;
    while (Date.now() < fino && !q(P, ".st-rivela")) {
      if (q(P, ".st-stadio .sa-pers") && !q(P, ".sa-aggiudicato") && prezzo(P) != null) {
        var c = capoNome(P);
        if (!c) { var pu = q(P, ".sa-pers.puo"); if (pu) pu.click(); }
        else qa(P, ".sa-pers").forEach(function (p) { var b = p.querySelector("b").textContent, ps = p.querySelector(".sa-passo"); if (b !== c && ps && ps.style.visibility !== "hidden" && !p.classList.contains("fuori")) ps.click(); });
        if (!ruoliPieni && qa(P, ".sa-manca").some(function (m) { return /[🧤🛡🎽⚽]/u.test(m.textContent) && m.textContent.indexOf("🧤🛡️🎽🎽⚽") < 0; })) ruoliPieni = true;
      }
      await W.dorme(250);
    }
    if (!q(P, ".st-rivela")) no("il fanta non arriva alla classifica delle rose");
    if (!ruoliPieni) no("le icone dei posti che mancano non calano");
    W.clicca(P, /Salta/);
    if (!await W.aspetta(function () { return bott(P, ".sa-testa .sa-tasto", /📸 Foto/); }, 4000)) no("sul podio non c'è «📸 Foto»");
    bott(P, ".sa-testa .sa-tasto", /📸 Foto/).click(); x.push(await fotoFatta(P, "delle rose (podio)"));
    W.clicca(P, /Avanti/); await W.dorme(300);
    if (!/I titoli della serata/.test(T(P))) no("dopo il podio non ci sono i titoli («" + T(P).slice(0, 80) + "»)");
    var tit = qa(P, ".as-tit").map(function (t) { return t.textContent; });
    x.push("titoli: " + (tit.join(" | ") || "(nessuno: " + T(P).slice(0, 60) + ")"));
    var m = await misura("Paky", "i titoli del fanta", [".schermata .piede .btn-primario"]); if (m.length) no(m.join(" / "));
    W.clicca(P, /Foto delle rose/); x.push(await fotoFatta(P, "delle rose"));
    W.clicca(P, /Classifica finale/); await W.dorme(300);
    if (qa(P, ".classifica li").length !== 3) no("la classifica del fanta non ha 3 righe");
    return x.join(" · ");
  } });

  // ===================================================================== pa3 (online temi)
  async function telefoniOnline(imp, nomi, guardano) {
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "L'Asta");
    senzaAnimazioni(P); spiaFoto(P);
    for (var i = 1; i < nomi.length; i++) { var w = await W.apriTel(nomi[i], { hash: "gioco=asta&stanza=" + C, x: 185 * i }); senzaAnimazioni(w); spiaFoto(w); }
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 12000)) no("non sono entrati in " + nomi.length + " (" + (vm(C).giocatori || []).length + ")");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    for (var j = 0; j < (guardano || []).length; j++) { var g = await W.apriTel(guardano[j], { hash: "gioco=asta&stanza=" + C, x: 185 * (nomi.length + j) }); senzaAnimazioni(g); }
    return { P: P, C: C };
  }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function nomeDiId(C, id) { var g = (vm(C).giocatori || []).filter(function (x) { return x.id === id; })[0]; return g ? g.nome : null; }
  function manda(nome, m) { if (nome === "Paky") return false; W.reteDi(nome).invia(m); return true; }

  COPIONE.aggiungi("pa3", { nome: "Asta online (temi): salti, busta chiusa segreta con ricarica, lotto doppio, pacco coperto, voto a un tocco, titoli, foto, chi guarda", fai: async function (opz) {
    var dieci = opz && opz.dieci;
    var NOMI = dieci ? ["Paky", "Giulia", "Luca", "Marta", "Sara", "Tommi", "Anna", "Pino"] : ["Paky", "Giulia", "Luca"], GUARDA = dieci ? ["Bea", "Ugo"] : ["Bea"];
    var o = await telefoniOnline({ formato: "temi", crediti: 15, round: "misti", maledetta: false }, NOMI, GUARDA), P = o.P, C = o.C, x = [], misure = [];
    var fatto = { salti: false, tardi: false, busta: false, ricarica: false, doppio: false, pacco: false, guarda: [] };
    var fino = Date.now() + (dieci ? 600000 : 300000);
    while (Date.now() < fino && vm(C).fase !== "voto" && vm(C).fase !== "fine") {
      var v = vm(C);
      // Bea (arrivata tardi) guarda: niente tasti, «Stai guardando»
      if (GUARDA.indexOf("Bea") >= 0 && fatto.guarda.indexOf(v.fase) < 0 && (v.fase === "asta" || v.fase === "busta")) {
        var B = W.finestra("Bea");
        if (await W.aspetta(function () { return /Stai guardando/.test(T(B)); }, 3000)) fatto.guarda.push(v.fase);
        if (qa(B, ".sa-piede .btn, .as-bus-piede .btn").length) no("Bea (guarda) ha dei tasti in fase " + v.fase);
      }
      if (v.fase === "scelta") {
        var dp = v.tavolo.findIndex(function (c) { return c.bonus; }), pc = v.tavolo.findIndex(function (c) { return c.pacco; }), idx = dp >= 0 ? dp : pc >= 0 ? pc : 0;
        if (pc >= 0) { var cp = v.tavolo[pc]; if (cp.nome !== "Pacco a sorpresa" || cp.tier !== "x" || cp.emoji !== "🎁" || Object.keys(cp).sort().join() !== "emoji,nome,pacco,tier") no("nella foto il pacco non è coperto: " + JSON.stringify(cp)); }
        if (v.sceglieId === "host") { var cc = qa(P, ".as-carta:not([disabled])")[idx]; if (cc) cc.click(); }
        else manda(nomeDiId(C, v.sceglieId), { t: "scegli", idx: idx, n: v.nScelta, nome: v.tavolo[idx].nome });
        await W.dorme(400); continue;
      }
      if (v.fase === "busta" && v.busta) {
        var b = v.busta, s0 = JSON.stringify(v.busta);
        if (/"q"|offert/.test(s0)) no("nella foto della busta ci sono le offerte: " + s0);
        if (!fatto.busta) {
          fatto.busta = true;
          // Giulia chiude la busta a 4 (a messaggio) e ricarica la pagina: ritrova la sua busta chiusa
          var gi = b.gara.indexOf(idDi("Giulia")) >= 0 ? "Giulia" : null;
          if (gi) {
            var gmax = (v.giocatori.filter(function (g) { return g.nome === "Giulia"; })[0] || {}).max, attesa = Math.max(b.chooserId === idDi("Giulia") ? 1 : 0, Math.min(4, gmax));
            manda("Giulia", { t: "busta", n: b.n, q: 4 });   // (l'host la tiene dentro il suo massimo)
            if (!await W.aspetta(function () { return (vm(C).busta || {}).chiusi && vm(C).busta.chiusi.indexOf(idDi("Giulia")) >= 0; }, 3000)) no("la busta di Giulia non arriva");
            if (!/✉️ chiusa/.test(T(P))) no("l'host non vede «✉️ chiusa» accanto a Giulia");
            await W.ricarica("Giulia"); var G = W.finestra("Giulia"); senzaAnimazioni(G);
            if (!await W.aspetta(function () { return new RegExp("Busta chiusa: " + attesa + " 💰").test(T(G)); }, 8000)) no("Giulia ricaricata non ritrova «Busta chiusa: " + attesa + " 💰» («" + T(G).slice(-160) + "»)");
            fatto.ricarica = true;
          }
          // Luca la chiude col tasto (+3, poi «Chiudo la busta»)
          if (b.gara.indexOf(idDi("Luca")) >= 0) {
            var L = W.finestra("Luca");
            misure = misure.concat(await misura("Luca", "la busta", [".as-bus-carta", ".as-bst", ".as-bus-piede .btn"]));
            var p3 = await W.aspetta(function () { return bott(L, ".as-bst button", /^\+3$/); }, 3000); if (!p3) no("Luca non ha il +3 nella busta");
            p3.click(); await W.dorme(100);
            var okL = bott(L, ".as-bus-piede .btn", /Chiudo la busta: 3 💰/); if (!okL) no("il tasto di Luca non dice «Chiudo la busta: 3 💰» («" + T(L).slice(-120) + "»)");
            okL.click();
          }
          if (b.chooserId === "host") { var okP = await W.aspetta(function () { return bott(P, ".as-bus-piede .btn", /Chiudo la busta|Non offro/); }, 2000); if (okP) okP.click(); }
          if (!await W.aspetta(function () { return vm(C).fase === "esito" && vm(C).esito && vm(C).esito.buste; }, 17000)) no("le buste non si aprono");
          var e = vm(C).esito;
          if (!await W.aspetta(function () { return qa(W.finestra("Luca"), ".as-buste .r").length === e.buste.length; }, 3000)) no("Luca non vede le buste aperte («" + T(W.finestra("Luca")).slice(0, 160) + "»)");
          x.push("busta: " + e.buste.map(function (z) { return z.nome + " " + z.q; }).join(", ") + " → " + e.chiNome + " per " + e.prezzo);
          continue;
        }
        // le altre buste: chi può la chiude a 1-2 (a messaggio), poi aspetto
        b.gara.forEach(function (id) { var n = nomeDiId(C, id); if (n && n !== "Paky" && b.chiusi.indexOf(id) < 0) manda(n, { t: "busta", n: b.n, q: 1 + (n.length % 2) }); });
        await W.aspetta(function () { return vm(C).fase !== "busta" || (vm(C).busta || {}).n !== b.n; }, 17000);
        continue;
      }
      if (v.fase !== "asta" || !v.asta) {
        if (v.fase === "esito" && v.esito && v.esito.carta) {
          if (v.esito.carta.bonus && !fatto.doppio) fatto.doppio = v.esito.chiNome + ": " + v.esito.carta.nome + " + " + v.esito.carta.bonus.nome;
          if (v.esito.carta.pacco && !fatto.pacco) {
            fatto.pacco = v.esito.chiNome + ": " + v.esito.carta.nome;
            if (v.esito.carta.nome === "Pacco a sorpresa") no("il pacco vinto non si scopre nella foto");
            var wv = W.finestra(v.esito.chiNome === "Paky" ? "Paky" : v.esito.chiNome);
            if (wv && !await W.aspetta(function () { return /Dentro il pacco c'era/.test(T(wv)); }, 4000)) no("chi ha vinto il pacco non legge «Dentro il pacco c'era…»");
          }
        }
        W.clicca(P, /Vedi le carte|Avanti/); await W.dorme(400); continue;
      }
      var a = v.asta, nA = a.n;
      if (!fatto.salti) {
        fatto.salti = true;
        // i tasti di Giulia: +1 grande, +3 e Passo accanto
        var G2 = W.finestra("Giulia");
        if (!await W.aspetta(function () { return bott(G2, ".as-salti .btn", /^\+3/); }, 3000)) no("Giulia non ha il tasto +3");
        if (!bott(G2, ".as-salti .btn", /^Passo$/) && a.leaderId !== idDi("Giulia")) no("Giulia non ha «Passo» accanto ai salti");
        manda("Giulia", { t: "rilancia", n: nA, prezzo: a.offerta + 3, vista: a.offerta });
        if (!await W.aspetta(function () { var y = vm(C).asta; return y && y.offerta === a.offerta + 3 && y.leaderId === idDi("Giulia"); }, 3000)) no("il +3 di Giulia non passa: " + JSON.stringify(vm(C).asta && [vm(C).asta.offerta, vm(C).asta.leaderNome]));
        // Luca manda un'offerta con l'offerta vecchia: «Troppo tardi di un soffio»
        manda("Luca", { t: "rilancia", n: nA, prezzo: a.offerta + 1, vista: a.offerta });
        if (!await W.aspetta(function () { return /Troppo tardi di un soffio/.test(T(W.finestra("Luca"))); }, 3000)) no("Luca (offerta vecchia) non legge «Troppo tardi di un soffio»");
        if (vm(C).asta.leaderId !== idDi("Giulia")) no("l'offerta vecchia di Luca ha contato");
        // il doppio messaggio di Giulia (stessa vista) non conta; un salto che non esiste (+2) neanche
        manda("Giulia", { t: "rilancia", n: nA, prezzo: a.offerta + 3, vista: a.offerta });
        manda("Luca", { t: "rilancia", n: nA, prezzo: a.offerta + 5, vista: a.offerta + 3 });
        await W.dorme(500);
        if (vm(C).asta.offerta !== a.offerta + 3) no("un messaggio doppio o un salto finto ha cambiato l'offerta: " + vm(C).asta.offerta);
        // l'host rilancia col suo +3 (tasto), Giulia rialza da sola col +3 (rialzo da solo, regola fissa)
        var h3 = await W.aspetta(function () { return bott(P, ".as-salti .btn", /^\+3/); }, 2000);
        if (h3 && !h3.disabled) { h3.click(); if (!await W.aspetta(function () { return vm(C).asta && vm(C).asta.leaderId === "host"; }, 2000)) no("il +3 dell'host non passa"); }
        var y2 = vm(C).asta; manda("Giulia", { t: "rilancia", n: nA, prezzo: y2.offerta + 3, vista: y2.offerta });
        await W.aspetta(function () { return vm(C).asta && vm(C).asta.leaderId === idDi("Giulia"); }, 2000);
        var y3 = vm(C).asta; manda("Giulia", { t: "rilancia", n: nA, prezzo: y3.offerta + 3, vista: y3.offerta });   // rialzo da solo, se ci arriva
        await W.dorme(500);
        var G3 = W.finestra("Giulia"), gg = (vm(C).giocatori || []).filter(function (g) { return g.nome === "Giulia"; })[0], ya = vm(C).asta;
        if (ya) {
          var t3 = bott(G3, ".as-salti .btn", /^\+3/), serve = ya.offerta + 3;
          if (t3 && t3.disabled !== (gg.max < serve)) no("il +3 di Giulia è " + (t3.disabled ? "spento" : "acceso") + " ma il suo massimo è " + gg.max + " (servono " + serve + ")");
        }
        x.push("salti: offerta " + a.offerta + " → " + ((vm(C).asta || {}).offerta || "chiusa") + " · bolla «" + ((q(P, ".sa-bolla") || {}).textContent || "") + "»");
      }
      // tutti passano tranne chi guida
      var z = vm(C); if (!z.asta || z.asta.n !== nA) continue;
      var capo = z.asta.leaderId;
      NOMI.forEach(function (n) { if (idDi(n) === capo) return; if (n === "Paky") { var bp = bott(P, ".sa-piede .btn", /^Passo$/); if (bp) bp.click(); } else manda(n, { t: "passa", n: nA }); });
      await W.aspetta(function () { return !vm(C).asta || vm(C).asta.n !== nA; }, 12000);
    }
    if (vm(C).fase !== "voto") no("non si arriva al voto (fase " + vm(C).fase + ")");
    if (!fatto.doppio) no("il lotto doppio non si è visto");
    if (!fatto.pacco) no("il pacco a sorpresa non si è visto");
    if (GUARDA.indexOf("Bea") >= 0 && fatto.guarda.length < 2) no("Bea non ha guardato asta e busta: " + fatto.guarda.join(","));
    // ---- il voto a un tocco ----
    var V = vm(C);
    if (!V.scenario || !V.scenario.testo) no("nel voto non c'è lo scenario");
    var Gw = W.finestra("Giulia"), Lw = W.finestra("Luca"), Bw = W.finestra("Bea");
    if (!await W.aspetta(function () { return qa(Gw, ".as-vk:not(.mio)").length === NOMI.length - 1; }, 4000)) no("Giulia non vede " + (NOMI.length - 1) + " kit da votare");
    misure = misure.concat(await misura("Luca", "il voto", [".as-scen", ".schermata .piede .as-msg"]));
    if (Bw && !/Stai guardando/.test(T(Bw))) no("Bea nel voto non legge «Stai guardando»");
    if (Bw && qa(Bw, ".as-vk:not([disabled])").length) no("Bea può votare");
    var kG = qa(Gw, ".as-vk:not(.mio)"); kG[0].click(); await W.dorme(300);
    var per1 = (vm(C).hannoVotato || []).indexOf(idDi("Giulia")) >= 0;
    if (!per1) no("il voto di Giulia non arriva");
    kG[1].click(); await W.dorme(300);   // cambia idea
    var nomeScelto = kG[1].querySelector(".n span").textContent;
    await W.ricarica("Giulia"); Gw = W.finestra("Giulia"); senzaAnimazioni(Gw);
    if (!await W.aspetta(function () { return new RegExp("La tua ⭐ va a " + nomeScelto).test(T(Gw)); }, 8000)) no("Giulia ricaricata non ritrova «La tua ⭐ va a " + nomeScelto + "» («" + T(Gw).slice(0, 160) + "»)");
    var bL = qa(Lw, ".as-vk:not(.mio)")[0]; if (bL) bL.click();
    NOMI.slice(3).forEach(function (n) { manda(n, { t: "voto", per: "host", s: V.sessione }); });
    var bP = qa(P, ".as-vk:not(.mio)")[0]; if (bP) bP.click();
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 8000)) no("votato tutti, il voto non si chiude");
    var F = vm(C), stelle = F.giocatori.reduce(function (s, g) { return s + g.stelle; }, 0);
    if (stelle !== NOMI.length) no("le stelle date sono " + stelle + " invece di " + NOMI.length);
    var gNome = F.giocatori.filter(function (g) { return g.nome === nomeScelto; })[0];
    if (!gNome || gNome.votiDa.indexOf("Giulia") < 0) no("il voto (cambiato) di Giulia non va a " + nomeScelto + ": " + JSON.stringify(gNome && gNome.votiDa));
    if (!F.titoli) no("nella foto di fine non ci sono i titoli");
    if (!await W.aspetta(function () { return /Classifica finale/.test(T(Lw)) && q(Lw, ".as-voti-da"); }, 4000)) no("Luca non vede la classifica con «⭐ da…»");
    var foto = bott(Lw, ".as-foto .btn", /📸 Foto/); if (!foto || !/Manda il tuo kit/.test(foto.title)) no("Luca non ha «📸 Foto» (manda il tuo kit)");
    foto.click(); x.push(await fotoFatta(Lw, "del kit di Luca"));
    misure = misure.concat(await misura("Luca", "la classifica", [".classifica", ".schermata .piede .btn"]));
    if (misure.length) no(misure.join(" / "));
    x.push("voto «" + F.scenario.testo + "»: " + F.classifica.map(function (r) { return r.nome + " " + r.punti; }).join(", "));
    x.push("titoli: " + (F.titoli || []).map(function (t) { return t.icona + " " + t.chi; }).join(" "));
    if (fatto.ricarica) x.push("ricariche ok (busta e voto)");
    return x.join(" · ");
  } });

  // ===================================================================== pa4 (online fanta)
  COPIONE.aggiungi("pa4", { nome: "Asta online (fantacalcio in 3): salti +1 +2 +5, partita intera, podio con 📸 e titoli", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"];
    var o = await telefoniOnline({ formato: "fanta" }, NOMI, []), P = o.P, C = o.C, x = [], primo = true, fino = Date.now() + 300000, visti = {};
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), a = v.asta;
      if (v.fase !== "asta" || !a || visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) { await W.dorme(250); continue; }
      visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
      var elegg = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
      if (primo && !a.leaderId && elegg.indexOf("Giulia") >= 0 && elegg.indexOf("Paky") >= 0) {
        primo = false;
        manda("Giulia", { t: "rilancia", n: a.nCarta, prezzo: 5, vista: 1 });
        if (!await W.aspetta(function () { var y = vm(C).asta; return y && y.offerta === 5 && y.leaderId === idDi("Giulia"); }, 3000)) no("il +5 di Giulia senza offerte non porta a 5: " + JSON.stringify(vm(C).asta && [vm(C).asta.offerta, vm(C).asta.leaderNome]));
        var tasti = await W.aspetta(function () { var t = qa(P, ".st-piede .btn").map(function (b) { return b.textContent.replace(/\s+/g, " ").trim(); }); return t.length >= 4 && t; }, 3000);
        if (!tasti || !/Rilancio: 6/.test(tasti[0]) || !tasti.some(function (t) { return /^\+2 ?7/.test(t); }) || !tasti.some(function (t) { return /^\+5 ?10/.test(t); }) || !tasti.some(function (t) { return t === "Passo"; })) no("i tasti dell'host: " + JSON.stringify(tasti));
        var hmax = vm(C).giocatori.filter(function (g) { return g.id === "host"; })[0].max, b5 = bott(P, ".st-piede .btn", /^\+5/);
        if (b5.disabled !== (hmax < 10)) no("il +5 dell'host (max " + hmax + ") è " + (b5.disabled ? "spento" : "acceso"));
        bott(P, ".st-piede .btn", /^\+2/).click();
        if (!await W.aspetta(function () { var y = vm(C).asta; return y && y.offerta === 7 && y.leaderId === "host"; }, 2000)) no("il +2 dell'host non porta a 7");
        manda("Luca", { t: "rilancia", n: a.nCarta, prezzo: 6, vista: 5 });   // offerta vecchia: troppo tardi
        if (!await W.aspetta(function () { return /Troppo tardi di un soffio/.test(T(W.finestra("Luca"))); }, 3000) && elegg.indexOf("Luca") >= 0) no("Luca non legge «Troppo tardi di un soffio»");
        x.push("Giulia +5 → 5, host +2 → 7, tasti " + tasti.join(" / "));
        continue;
      }
      // il resto: se nessuno ha offerto lo prende il primo che può, poi passano gli altri
      if (!a.leaderId) { var pr = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; })[0]; if (pr) { if (pr.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else manda(pr.nome, { t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta }); } }
      else elegg.forEach(function (n) { if (idDi(n) === a.leaderId) return; if (n === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else manda(n, { t: "passa", n: a.nCarta }); });
      await W.dorme(300);
    }
    if (vm(C).fase !== "fine") no("il fanta online non finisce");
    var F = vm(C);
    if (!F.titoli) no("nella foto di fine non ci sono i titoli");
    var L = W.finestra("Luca");
    await W.aspetta(function () { return W.clicca(L, /Salta/) || bott(L, ".sa-testa .sa-tasto", /📸 Foto/); }, 15000);
    if (!await W.aspetta(function () { return bott(L, ".sa-testa .sa-tasto", /📸 Foto/); }, 6000)) no("sul podio di Luca non c'è «📸 Foto»");
    bott(L, ".sa-testa .sa-tasto", /📸 Foto/).click(); x.push(await fotoFatta(L, "della rosa di Luca"));
    if ((F.titoli || []).length) { var tk = await W.aspetta(function () { var t = (q(L, ".st-ticker") || {}).textContent || ""; return /^(💎|🎯|💸|🧊|🤡|🔥|🛍️|🚀|📣) /.test(t) && t; }, 9000); if (!tk) no("i titoli non girano sul maxischermo"); else x.push("ticker «" + tk + "»"); }
    x.push("titoli: " + (F.titoli || []).map(function (t) { return t.icona + " " + t.titolo + " " + t.chi + " (" + t.dett + ")"; }).join(" | "));
    return x.join(" · ");
  } });

  // ===================================================================== paM / paMo: 🧨 la carta maledetta col voto a un tocco
  // (le prove g8a1 e g8a2 di prima erano fatte per il voto a mezze stelle e i «Kit completi», che non ci sono più: le rifanno queste)
  COPIONE.aggiungi("paM", { nome: "Asta stesso telefono in 3 con 🧨: paga 1, 2, 3, il primo se la prende; crediti, voto a un tocco col bordo nero, −0,5 in classifica", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"];
    var P = await partitaLocale({ formato: "temi", crediti: 15, round: "normali", maledetta: true }, NOMI, function (w) { w.__astaMalProva = { round: 1, quando: 2 }; });
    var visti = [], esito = "", cr = null, voto = null, fasce = null, misure = [], fino = Date.now() + 240000;
    while (Date.now() < fino) {
      var d = P.document, tx = T(P);
      if (/Fasce svelate/.test(tx)) break;
      if (/Passa il telefono a/.test(tx)) { W.clicca(P, /^Sono /); await W.dorme(150); continue; }
      var M = q(P, ".schermata.as-mal");
      if (M) {
        var paga = M.querySelector(".as-mal-tasti .btn-verde"), prendo = M.querySelector(".as-mal-tasti .btn-rosso"), chi = (M.querySelector(".as-mal-p.ora b") || {}).textContent;
        if (!visti.length) misure = misure.concat(await misura("Paky", "la carta maledetta", [".as-mal-carta", ".as-mal-tasti", ".as-mal-gente"]));
        if (visti.length < 3) {
          if (!paga || paga.disabled || paga.textContent.indexOf("Pago " + (visti.length + 1)) < 0) no("al giro " + (visti.length + 1) + " il tasto è «" + (paga && paga.textContent) + "»");
          visti.push(chi + ":paga" + (visti.length + 1)); paga.click();
        } else {
          if (chi !== visti[0].split(":")[0]) no("al 4° giro tocca a " + chi + " (non al primo)");
          visti.push(chi + ":prendo"); prendo.click(); await W.dorme(250);
          esito = T(P); cr = {}; qa(P, ".as-pt").forEach(function (p) { cr[p.querySelector(".n").textContent] = +p.querySelector(".c").textContent.replace(/\D/g, ""); });
        }
        await W.dorme(200); continue;
      }
      if (q(P, ".as-vk")) {
        var mr = q(P, ".as-vk.maled"); if (mr && !voto) voto = { badge: (mr.querySelector(".as-malus") || {}).textContent, carta: !!mr.querySelector(".as-mal-in") };
        qa(P, ".as-vk")[0].click(); await W.dorme(700); continue;
      }
      if (q(P, ".as-scen") && /Si vota/.test(tx)) { W.clicca(P, /Si vota/); await W.dorme(200); continue; }
      var carte = qa(P, ".as-carta:not([disabled])");
      if (carte.length) { carte[0].click(); await W.dorme(250); continue; }
      if (q(P, ".sa-pers") && prezzo(P) != null && !q(P, ".sa-aggiudicato")) {
        var c2 = capoNome(P);
        qa(P, ".sa-pers").forEach(function (p) { var b = p.querySelector("b").textContent, ps = p.querySelector(".sa-passo"); if (b !== c2 && ps && ps.style.visibility !== "hidden" && !p.classList.contains("fuori")) ps.click(); });
        await W.dorme(300); continue;
      }
      W.clicca(P, /Vedi le carte|Avanti ▶|Avanti/); await W.dorme(250);
    }
    if (visti.length !== 4) no("la carta maledetta: " + JSON.stringify(visti));
    var n1 = visti[3].split(":")[0];
    if (!new RegExp("😩 " + n1 + " se la prende!").test(esito)) no("l'esito non dice che se la prende " + n1);
    visti.slice(0, 3).forEach(function (v, i) { var nn = v.split(":")[0];
      if (nn === n1) { if (!new RegExp(nn + " si riprende i suoi " + (i + 1) + " 💰").test(esito)) no("l'esito non dice che " + nn + " si riprende " + (i + 1)); }
      else if (!new RegExp(nn + " paga " + (i + 1) + " 💰").test(esito)) no("l'esito non dice che " + nn + " paga " + (i + 1)); });
    if (!voto || voto.badge !== "🧨 −0,5 ⭐" || !voto.carta) no("nel voto la carta maledetta: " + JSON.stringify(voto));
    if (!/Fasce svelate/.test(T(P))) no("non arriva alle fasce svelate");
    fasce = { riga: !!q(P, ".as-kit .riga.maled"), tier: !!q(P, ".as-kit .riga.maled .tier-M") };
    if (!fasce.riga || !fasce.tier) no("nelle fasce svelate: " + JSON.stringify(fasce));
    W.clicca(P, /Classifica finale/); await W.dorme(400);
    var riga = qa(P, ".classifica li").filter(function (li) { return li.textContent.indexOf(n1) >= 0; })[0];
    if (!riga || !/🧨 −0,5/.test(riga.textContent)) no("in classifica " + n1 + " non ha il 🧨 −0,5 («" + (riga && riga.textContent) + "»)");
    if (misure.length) no(misure.join(" / "));
    return "giri " + visti.join(", ") + " · crediti " + JSON.stringify(cr) + " · voto " + voto.badge + " · " + riga.textContent.replace(/\s+/g, " ");
  } });

  COPIONE.aggiungi("paMo", { nome: "Asta online in 3 + Bea che guarda: 🧨 a turni, Luca ricarica a metà, voto a un tocco e −0,5 in classifica", fai: async function () {
    var IMP = { formato: "temi", crediti: 15, round: "normali", maledetta: true };
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = IMP; w.__astaMalProva = { round: 1, quando: 2 }; } }), C = await W.apriStanza(P, "L'Asta");
    senzaAnimazioni(P);
    for (var i = 1; i < 3; i++) { var w0 = await W.apriTel(["Paky", "Giulia", "Luca"][i], { hash: "gioco=asta&stanza=" + C, x: 185 * i }); senzaAnimazioni(w0); }
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 12000)) no("non sono entrati in 3");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    var B = await W.apriTel("Bea", { hash: "gioco=asta&stanza=" + C, x: 555 }); senzaAnimazioni(B);
    var x = [], giri = [], ricaricato = false, beaOk = false, fino = Date.now() + 240000;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C);
      if (v.fase === "round" || v.fase === "esito" || v.fase === "malEsito") { W.clicca(P, /Vedi le carte|Avanti/); await W.dorme(300); continue; }
      if (v.fase === "scelta") {
        if (v.sceglieId === "host") { var cc = qa(P, ".as-carta:not([disabled])")[0]; if (cc) cc.click(); }
        else { var n0 = nomeDiId(C, v.sceglieId); if (n0) manda(n0, { t: "scegli", idx: 0, n: v.nScelta, nome: v.tavolo[0].nome }); }
        await W.dorme(400); continue;
      }
      if (v.fase === "asta" && v.asta) {
        var a = v.asta;
        v.giocatori.forEach(function (g) { if (g.haCarta || g.id === a.leaderId || a.passati.indexOf(g.id) >= 0) return; if (g.nome === "Paky") { var bp = bott(P, ".sa-piede .btn", /^Passo$/); if (bp) bp.click(); } else manda(g.nome, { t: "passa", n: a.n }); });
        await W.dorme(400); continue;
      }
      if (v.fase === "maledetta" && v.mal) {
        var M = v.mal, chi = nomeDiId(C, M.turnoId);
        if (!beaOk) {
          if (!await W.aspetta(function () { return /Stai guardando/.test(T(B)); }, 4000)) no("Bea non legge «Stai guardando» alla carta maledetta («" + T(B).slice(-120) + "»)");
          if (qa(B, ".as-mal-tasti .btn").length) no("Bea (guarda) ha i tasti della carta maledetta");
          beaOk = true;
        }
        if (giri.length === 1 && !ricaricato) {   // Luca ricarica a metà e ritrova la carta maledetta
          ricaricato = true; await W.ricarica("Luca"); var L = W.finestra("Luca"); senzaAnimazioni(L);
          if (!await W.aspetta(function () { return q(L, ".schermata.as-mal") && /offre 1 💰/.test(T(L)); }, 8000)) no("Luca ricaricato non ritrova la carta maledetta con l'offerta di prima («" + T(L).slice(0, 160) + "»)");
          continue;
        }
        if (giri.length < 2) {
          if (chi === "Paky") { var bP = await W.aspetta(function () { return bott(P, ".as-mal-tasti .btn-verde", /Pago/); }, 3000); if (bP) bP.click(); }
          else manda(chi, { t: "mal", n: M.n, a: "paga", prezzo: M.prezzo + 1 });
          giri.push(chi + ":paga" + (M.prezzo + 1));
        } else {
          if (chi === "Paky") { var bR = await W.aspetta(function () { return bott(P, ".as-mal-tasti .btn-rosso", /Me la prendo/); }, 3000); if (bR) bR.click(); }
          else manda(chi, { t: "mal", n: M.n, a: "prendo", g: M.giro });
          giri.push(chi + ":prendo");
        }
        var g0 = M.giro; await W.aspetta(function () { var z = vm(C); return z.fase !== "maledetta" || (z.mal && z.mal.giro !== g0); }, 4000);
        continue;
      }
      if (v.fase === "voto") {
        v.giocatori.forEach(function (g) {
          if ((v.hannoVotato || []).indexOf(g.id) >= 0) return;
          var per = v.giocatori.filter(function (o) { return o.id !== g.id; })[0].id;
          if (g.nome === "Paky") { var kk = q(P, ".as-vk:not([disabled]):not(.mio)"); if (kk) kk.click(); } else manda(g.nome, { t: "voto", per: per, s: v.sessione });
        });
        await W.dorme(600); continue;
      }
      await W.dorme(300);
    }
    if (vm(C).fase !== "fine") no("la partita non finisce (fase " + vm(C).fase + ")");
    if (giri.length !== 3) no("i giri della carta maledetta: " + giri.join(", "));
    var F = vm(C), conMal = F.giocatori.filter(function (g) { return g.kit.some(function (c) { return c.maledetta; }); });
    if (conMal.length !== 1) no("la carta maledetta è in " + conMal.length + " kit");
    var r = (F.classifica || []).filter(function (z) { return z.nome === conMal[0].nome; })[0];
    if (!r || !/🧨 −0,5/.test(r.punti)) no("in classifica chi ha la carta maledetta non ha il 🧨: " + JSON.stringify(r));
    var Bc = await W.aspetta(function () { return q(B, ".classifica") && T(B); }, 5000); if (!Bc || !/🧨 −0,5/.test(Bc)) no("Bea non vede la classifica col 🧨");
    x.push("giri " + giri.join(", "), "Luca ricarica ok", "classifica " + F.classifica.map(function (z) { return z.nome + " " + z.punti; }).join(" | "));
    return x.join(" · ");
  } });

  // ===================================================================== paP: la ripresa (Passo 5) finta
  // Questo core non ha ancora t.ricorda / t.ripresa: la spia li finge (w.__ricordaSpia, w.__ripresa). L'host ricarica la pagina
  // 1) a busta chiusa (Giulia aveva già chiuso a 2): nella copia ricordata NON ci sono le offerte, la busta si riapre da capo;
  // 2) a metà di un'asta (+3 di Luca: 4): il lotto riparte da 1 da chi l'aveva scelto; 3) durante il voto (Giulia ha votato):
  // il voto continua col suo voto; si arriva alla classifica.
  COPIONE.aggiungi("paP", { nome: "Asta online: la ripresa finta di Passo 5 (busta da capo senza segreti, lotto da capo, voto che continua)", fai: async function () {
    var IMP = { formato: "temi", crediti: 15, round: "misti", maledetta: false };
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = IMP; w.__ricordaSpia = true; } }), C = await W.apriStanza(P, "L'Asta");
    senzaAnimazioni(P);
    var NOMI = ["Paky", "Giulia", "Luca"];
    for (var i = 1; i < NOMI.length; i++) { var w0 = await W.apriTel(NOMI[i], { hash: "gioco=asta&stanza=" + C, x: 185 * i }); senzaAnimazioni(w0); }
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 12000)) no("non sono entrati in 3");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    var x = [], fatto = { busta: false, asta: false, voto: false };
    async function ricaricaHost(cosa) {
      var R = W.__ricordo; if (!R) no("t.ricorda non ha ricevuto niente (" + cosa + ")");
      P = await W.ricarica("Paky", { pa: true, prima: function (w) { w.__imp = IMP; w.__ricordaSpia = true; w.__ripresa = R; } }); senzaAnimazioni(P);
      if (!await W.aspetta(function () { return P.__t; }, 8000)) no("dopo la ricarica l'Asta non riparte sull'host («" + T(P).slice(0, 100) + "»)");
      return R;
    }
    var fino = Date.now() + 260000;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C);
      if (v.fase === "round" || v.fase === "esito" || v.fase === "malEsito") { W.clicca(P, /Vedi le carte|Avanti/); await W.dorme(300); continue; }
      if (v.fase === "scelta") {
        if (v.sceglieId === "host") { var cc = qa(P, ".as-carta:not([disabled])")[0]; if (cc) cc.click(); }
        else { var n0 = nomeDiId(C, v.sceglieId); if (n0) manda(n0, { t: "scegli", idx: 0, n: v.nScelta, nome: v.tavolo[0].nome }); }
        await W.dorme(400); continue;
      }
      if (v.fase === "busta" && v.busta) {
        var b = v.busta;
        if (!fatto.busta && b.gara.indexOf(idDi("Giulia")) >= 0) {
          fatto.busta = true;
          manda("Giulia", { t: "busta", n: b.n, q: 2 });
          if (!await W.aspetta(function () { return (vm(C).busta || {}).chiusi && vm(C).busta.chiusi.indexOf(idDi("Giulia")) >= 0; }, 3000)) no("la busta di Giulia non arriva");
          await W.dorme(200);
          var R1 = await ricaricaHost("busta");
          if (!R1.busta || R1.fase !== "busta") no("la copia ricordata non è nella busta: " + R1.fase);
          else if (JSON.stringify(R1.busta.offerte) !== "{}") no("nella copia ricordata ci sono le offerte segrete: " + JSON.stringify(R1.busta.offerte));
          if (!await W.aspetta(function () { var z = vm(C); return z.fase === "busta" && z.busta && z.busta.n !== b.n; }, 8000)) no("dopo la ricarica la busta non si riapre da capo (fase " + vm(C).fase + ")");
          var z1 = vm(C).busta;
          if (z1.chiusi.length) no("la busta riaperta ha già delle buste chiuse: " + z1.chiusi.join());
          if (z1.chooserId !== b.chooserId || z1.carta.nome !== b.carta.nome) no("la busta riaperta non è la stessa carta o non l'ha scelta lo stesso");
          var G = W.finestra("Giulia");
          if (!await W.aspetta(function () { return bott(G, ".as-bus-piede .btn", /Chiudo la busta|Non offro/); }, 5000)) no("Giulia non può richiudere la busta riaperta («" + T(G).slice(-120) + "»)");
          x.push("busta riaperta da capo (n " + b.n + " → " + z1.n + ")");
        }
        var b2 = vm(C).busta;
        if (b2) b2.gara.forEach(function (id) { var n = nomeDiId(C, id); if (b2.chiusi.indexOf(id) >= 0) return; if (n === "Paky") { var ok = bott(P, ".as-bus-piede .btn", /Chiudo la busta|Non offro/); if (ok) ok.click(); } else if (n) manda(n, { t: "busta", n: b2.n, q: 1 }); });
        await W.aspetta(function () { return vm(C).fase !== "busta"; }, 6000);
        continue;
      }
      if (v.fase === "asta" && v.asta) {
        var a = v.asta, chooser = v.asta.leaderId;
        if (!fatto.asta && fatto.busta && a.offerta === 1) {
          // Luca (o Giulia, se Luca ha già la carta) rilancia di +3 (a 4), poi l'host ricarica
          var chi = ["Luca", "Giulia"].filter(function (n) { var g = v.giocatori.filter(function (y) { return y.nome === n; })[0]; return g && !g.haCarta && idDi(n) !== a.leaderId; })[0];
          if (chi) {
            fatto.asta = true;
            manda(chi, { t: "rilancia", n: a.n, prezzo: 4, vista: 1 });   // (+3)
            if (!await W.aspetta(function () { return (vm(C).asta || {}).offerta === 4; }, 3000)) no("il +3 di " + chi + " (a 4) non arriva");
            await W.dorme(200);
            var R2 = await ricaricaHost("asta");
            if (!R2.asta || R2.fase !== "asta") no("la copia ricordata non è nell'asta: " + R2.fase);
            if (!await W.aspetta(function () { var z = vm(C); return z.fase === "asta" && z.asta && z.asta.n !== a.n; }, 8000)) no("dopo la ricarica il lotto non riparte (fase " + vm(C).fase + ")");
            var z2 = vm(C).asta;
            if (z2.offerta !== 1 || z2.leaderId !== chooser || z2.carta.nome !== a.carta.nome) no("il lotto ripreso: " + JSON.stringify({ offerta: z2.offerta, leader: z2.leaderId, carta: z2.carta.nome }) + " (voluto 1 di " + chooser + ", " + a.carta.nome + ")");
            var cr = v.giocatori.map(function (g) { return g.crediti; }).join(), cr2 = vm(C).giocatori.map(function (g) { return g.crediti; }).join();
            if (cr !== cr2) no("i crediti sono cambiati con la ripresa: " + cr + " → " + cr2);
            x.push("lotto «" + a.carta.nome + "» ripartito da 1");
            continue;
          }
        }
        // gli altri passano
        v.giocatori.forEach(function (g) { if (g.haCarta || g.id === a.leaderId || a.passati.indexOf(g.id) >= 0) return; if (g.nome === "Paky") { var bp = bott(P, ".sa-piede .btn", /^Passo$/); if (bp) bp.click(); } else manda(g.nome, { t: "passa", n: a.n }); });
        await W.dorme(400); continue;
      }
      if (v.fase === "voto") {
        if (!fatto.voto) {
          fatto.voto = true;
          manda("Giulia", { t: "voto", per: idDi("Luca"), s: v.sessione });
          if (!await W.aspetta(function () { return (vm(C).hannoVotato || []).indexOf(idDi("Giulia")) >= 0; }, 3000)) no("il voto di Giulia non arriva");
          await W.ricarica("Giulia"); var G2 = W.finestra("Giulia"); senzaAnimazioni(G2);
          var R3 = await ricaricaHost("voto");
          if (R3.fase !== "voto") no("la copia ricordata non è nel voto: " + R3.fase);
          if (!await W.aspetta(function () { var z = vm(C); return z.fase === "voto" && (z.hannoVotato || []).indexOf(idDi("Giulia")) >= 0 && z.restaVoto > 0; }, 8000)) no("dopo la ricarica il voto non continua col voto di Giulia (" + JSON.stringify({ fase: vm(C).fase, hv: vm(C).hannoVotato }) + ")");
          x.push("voto ripreso (" + Math.round(vm(C).restaVoto / 1000) + " s)");
        }
        var vv = vm(C);
        if ((vv.hannoVotato || []).indexOf(idDi("Luca")) < 0) manda("Luca", { t: "voto", per: idDi("Giulia"), s: vv.sessione });
        if ((vv.hannoVotato || []).indexOf("host") < 0) { var kk = q(P, ".as-vk:not([disabled]):not(.mio)"); if (kk) kk.click(); }
        await W.dorme(500); continue;
      }
      await W.dorme(300);
    }
    if (vm(C).fase !== "fine") no("la partita ripresa non arriva alla classifica (fase " + vm(C).fase + ")");
    if (!fatto.busta || !fatto.asta || !fatto.voto) no("non ho provato tutto: " + JSON.stringify(fatto));
    var cl = vm(C).classifica || [];
    if (cl.length !== 3) no("la classifica ha " + cl.length + " righe");
    var sl = cl.map(function (r) { return r.nome + " " + r.stelle; }).join(", ");
    if (cl.reduce(function (s, r) { return s + r.stelle; }, 0) !== 3) no("le stelle non sono 3: " + sl);
    x.push("classifica " + sl);
    return x.join(" · ");
  } });

  // ===================================================================== paR: le prove di prima
  COPIONE.aggiungi("paR", { nome: "Le prove di prima dell'Asta (rialzo da soli, carta maledetta, Sala), coi round normali dove servono", fai: async function (opz) {
    var lista = (opz && opz.solo) || ["ar1", "ar2", "ar3", "ar4", "ac1", "ac2", "ac3", "ac4", "g8a0", 223, "223f"], out = [];
    if (!COPIONE.scenari.ar1) await COPIONE.carica("migliora/asta-rialzo.js");
    if (!COPIONE.scenari.ac1) await COPIONE.carica("migliora/asta-rialzo-controllo.js");
    if (!COPIONE.scenari.g8a0) await COPIONE.carica("migliora2/g8-asta-pesca.js");
    if (!COPIONE.scenari[223]) await COPIONE.carica("passo2/gruppo-c.js");
    // (le prove di prima sono fatte per l'asta a rilanci: i temi coi round «Tutti normali»)
    var apri = W.apriTel;
    W.apriTel = function (nome, o) {
      o = Object.assign({}, o || {}, { pa: true }); var prima = o.prima;
      o.prima = function (w) { if (prima) prima(w); w.__imp = Object.assign({ round: "normali" }, w.__imp || {}); };
      return apri.call(this, nome, o);
    };
    try {
      for (var i = 0; i < lista.length; i++) { var r = await COPIONE.prova(lista[i]); out.push(r.slice(0, 260)); }
    } finally { W.apriTel = apri; }
    var nos = out.filter(function (r) { return / NO · /.test(r); });
    if (nos.length) no(nos.join(" ||| "));
    return out.map(function (r) { return r.split(" · ")[0]; }).join(", ");
  } });
})();
