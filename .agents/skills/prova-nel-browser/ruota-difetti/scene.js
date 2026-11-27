// LA RUOTA DELLA FORTUNA, la caccia ai difetti (23 nov 2026): partite intere giocate da sole, con le foto di ogni momento nuovo.
// Uso (dopo copione-prova.js e preferiti/ruota2.js, che dà la spia delle regole): await COPIONE.carica("ruota-difetti/scene.js");
//   await RDF.online(["Giulia","Luca","Sara"], { guarda: "Dina", tardi: "Bea" })   ·   await RDF.bot(3)   ·   await RDF.locale(["Paky","Giulia","Luca"])
// Le foto le fa lo strumento foto.js qui accanto: la pagina chiama window.__foto(nome del telefono, etichetta) e aspetta.
// Il pilota tocca i tasti veri del gioco (come una persona): gira, sceglie consonanti (anche una che non c'è), compra una vocale,
// risolve scrivendo con la tastiera, prenota nei giochi veloci, gioca la finale e apre la busta. Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti;
  function no(p) { throw new Error("NO: " + p); }
  var VOC = "AEIOU", CONS = "BCDFGHJKLMNPQRSTVWXYZ";
  function base(ch) { return { "À": "A", "È": "E", "É": "E", "Ì": "I", "Ò": "O", "Ù": "U" }[ch] || ch; }
  function eL(ch) { return /^[A-ZÀÈÉÌÒÙ]$/.test(ch); }
  function tocca(w, b) {
    if (!w || !b) return false;
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (t) { b.dispatchEvent(new Ev(t, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click(); return true;
  }
  function tasto(w, re) { return w && [].find.call(w.document.querySelectorAll(".ru-azioni button, .ru-scrivi-riga button, .ru-form button, .ru-prenoti button"), function (b) { return re.test(b.textContent) && !b.disabled && b.getClientRects().length > 0; }) || null; }
  function lettera(w, L) { return w && [].find.call(w.document.querySelectorAll(".ru-qwerty .ru-btn.lettera, .ru-azioni .ru-btn.lettera"), function (b) { return b.textContent === L && !b.disabled && b.getClientRects().length > 0; }) || null; }
  function Pdi(h) { return h.__RUOTA && h.__RUOTA.ultima; }
  async function foto(nome, cosa) { if (W.__foto && nome) { try { await W.__foto(nome, cosa); } catch (e) {} } }
  // scrive la soluzione con la tastiera del gioco (le lettere coperte, nell'ordine), poi «✓ Risolvi»
  async function scrivi(w, frase, tab, quante) {
    var n = 0;
    for (var i = 0; i < tab.length; i++) {
      if (tab.charAt(i) !== "_") continue;
      if (quante != null && n >= quante) return true;
      var b = lettera(w, base(frase.charAt(i)));
      if (!b) return false;
      tocca(w, b); n++; await W.dorme(60);
    }
    var ok = tasto(w, /✓ Risolvi|Risolvo|✓/); if (!ok) return false;
    tocca(w, ok); return true;
  }
  var RDF = W.RDF = { visti: {}, log: [], misura: [360, 640] };
  // un telefono nuovo, alla misura delle foto (così la foto non lo ridimensiona mai)
  async function apriTel(nome, opz) {
    var w = await W.apriTel(nome, Object.assign({ spiega: true }, opz)), f = document.getElementById("tel-" + nome);   // (le foto: anche le finestre che spiegano)
    if (f) { f.style.width = RDF.misura[0] + "px"; f.style.height = RDF.misura[1] + "px"; w.dispatchEvent(new w.Event("resize")); }
    return w;
  }
  function nota(s) { RDF.log.push(s); }
  // il pilota: H = telefono di chi tiene la partita, tel = { id: finestra } (gli umani), nomi = { id: nome del telefono }
  async function pilota(H, tel, nomi, opz) {
    opz = opz || {};
    var fine = Date.now() + (opz.ms || 420000), k0 = "", fermo = 0, finFatti = {}, sbaglio = {}, vocale = {}, giri = {};
    while (Date.now() < fine) {
      var P = Pdi(H);
      if (!P) { await W.dorme(200); continue; }
      if (opz.ogni) { var r = await opz.ogni(P); if (r === "basta") return P; }
      if (P.fase === "fine" || P.classifica && !H.document.querySelector(".ru-studio, .stp-vista, .ru-sopra")) return P;
      var f = P.fase, L = P.lampo, att = f === "lampo" ? L && L.chi : ["fbusta", "fesito"].indexOf(f) >= 0 ? P.busta && P.busta.id : ["fintro", "flettere", "frivela", "ftempo", "fcambio"].indexOf(f) >= 0 ? null : P.giocatori[P.turno] && P.giocatori[P.turno].id;
      if ((f === "flettere" || f === "ftempo") && P.fin) {   // 🏆 la finale per tutti: ognuno dal suo telefono
        for (var fid in tel) {
          var gf = P.fin.g[fid]; if (!gf || P.finFatto(fid) || (f === "flettere" && gf.scelte)) continue;
          var kf = f + ":" + P.fin.b + ":" + fid; if (finFatti[kf] && Date.now() - finFatti[kf] < 3000) continue;
          finFatti[kf] = Date.now();
          var wf = tel[fid];
          try {
            if (f === "flettere") {
              "BCDA".split("").forEach(function (ch) { var b = lettera(wf, ch); if (b) tocca(wf, b); });
              await W.dorme(120); var be = tasto(wf, /Ecco le mie lettere/); if (be) tocca(wf, be);
            } else if (Object.keys(tel).indexOf(fid) % 2 === 1 && P.fin.b === 2) { var bp = tasto(wf, /Passo/); if (bp) tocca(wf, bp); }   // (uno passa il Testacoda)
            else {
              if (P.fin.b === 3) { var bs2 = tasto(wf, /La so: scrivo/); if (bs2) { tocca(wf, bs2); await W.dorme(200); } }
              await W.dorme(1500 + 1200 * (Object.keys(tel).indexOf(fid)));
              await scrivi(wf, P.frase, P.finTab(gf.ch));
            }
          } catch (e) {}
        }
        await W.dorme(250); continue;
      }
      if (f === "spiega" && P.spg) {   // 📖 la finestra che spiega: la si legge un attimo (la foto), poi «⏩ Ho capito» su tutti i telefoni
        if (RDF.capito !== P.spg.n) { RDF.capito = P.spg.n; RDF.capitoDa = Date.now(); }
        if (Date.now() - RDF.capitoDa > (opz.leggi || 2600)) for (var tid in tel) { var hb = tel[tid].document.querySelector(".ru-spg.on .ru-btn.gira"); if (hb && !hb.disabled) tocca(tel[tid], hb); }
        await W.dorme(200); continue;
      }
      var w = att && tel[att], k = [f, P.manche, P.giroN, att, Object.keys(P.chiamate).length, L ? L.n + ":" + L.prove : ""].join("|");
      if (k === k0 && Date.now() - fermo < 1100) { await W.dorme(120); continue; }
      k0 = k; fermo = Date.now();
      try {
        if (f === "lampo" && L && !L.chi) {   // il primo umano prenota quando sono uscite un po' di lettere
          if (L.n >= 3 + (P.manche % 2)) { var ids = Object.keys(tel).filter(function (id) { return L.fuori.indexOf ? L.fuori.indexOf(id) < 0 && !L.fuori[id] : !L.fuori[id]; }).filter(function (id) { return P.trova(id) && !P.trova(id).via; });
            if (ids.length) { var wp = tel[ids[P.manche % ids.length]], np = nomi[ids[P.manche % ids.length]];
              var bpr = tasto(wp, /PRENOTO/) || tasto(wp, new RegExp("🔔 " + np)); if (bpr) tocca(wp, bpr); } }
        } else if (!w) { /* tocca a un Bot, o un momento che va avanti da solo */ }
        else if (f === "lampo" && L && L.chi) { await W.dorme(900); await scrivi(w, L.frase, P.lampoTab()); }
        else if (f === "gira") {
          var nc = Object.keys(P.chiamate).length, gk = P.manche + ":" + att, sold = (P.giocatori[P.turno] || {}).soldi || 0;
          if (!vocale[P.manche] && sold >= 250 && P.vocaliNascoste() > 0) {   // una vocale per manche
            var v = P.frase.split("").map(base).filter(function (ch) { return VOC.indexOf(ch) >= 0 && !P.chiamate[ch]; })[0];
            if (v && lettera(w, v)) { vocale[P.manche] = 1; tocca(w, lettera(w, v)); await W.dorme(700); var bc = tasto(w, /Compro/) || lettera(w, v); tocca(w, bc); }
            else if (v) { vocale[P.manche] = 1; }
          } else if (nc < 4 + (P.manche % 3) && P.consonantiNascoste() > 1 && w.document.querySelector(".ru-alto.tocca .ru-piatto-alto")) { giri[gk] = (giri[gk] || 0) + 1; await W.spingiRuota(w, 0.3 + 0.6 * ((P.giroN * 7) % 10) / 10); }
          else { var br = tasto(w, /💡 Risolvi/); if (br) tocca(w, br); }
        }
        else if (f === "consonante" || f === "express" || f === "vlettera") {
          var dentro = P.frase.split("").map(base).filter(function (ch) { return CONS.indexOf(ch) >= 0 && !P.chiamate[ch]; });
          var fuori = CONS.split("").filter(function (ch) { return !P.chiamate[ch] && dentro.indexOf(ch) < 0 && "JKWXY".indexOf(ch) < 0; });
          var sb = !sbaglio[P.manche] && P.manche % 2 === 0 && fuori.length;   // nelle manche pari una consonante che non c'è
          var c = sb ? fuori[0] : dentro[0];
          if (f === "express" && Object.keys(P.chiamate).length > 7) { var bf = tasto(w, /Mi fermo/); if (bf) { tocca(w, bf); c = null; } }
          if (c && lettera(w, c)) { if (sb) sbaglio[P.manche] = 1; tocca(w, lettera(w, c)); await W.dorme(700); var b2 = lettera(w, c); if (b2 && P.fase === f) tocca(w, b2); }
        }
        else if (f === "vocale") { var vv = P.frase.split("").map(base).filter(function (ch) { return VOC.indexOf(ch) >= 0 && !P.chiamate[ch]; })[0]; if (vv) { tocca(w, lettera(w, vv)); await W.dorme(600); var b3 = lettera(w, vv); if (b3 && P.fase === f) tocca(w, b3); } }
        else if (f === "mistero") tocca(w, tasto(w, /Apri il Mistero/));
        else if (f === "sceltaexp") tocca(w, tasto(w, P.manche % 2 ? /Prendo l'Express/ : /Gioco/));
        else if (f === "risolvi") { await W.dorme(600); await scrivi(w, P.frase, P.vista().tab); }
        else if (f === "vdecidi") tocca(w, tasto(w, /Risolvo/));
        else if (f === "fbusta") { await W.dorme(1500); var bb = [].find.call(w.document.querySelectorAll(".ru-btn.busta"), function (b) { return !b.disabled; }); if (bb) tocca(w, bb); }
        if (f === "finemanche" && opz.avanti) await opz.avanti(P);
      } catch (e) {}
      await W.dorme(250);
    }
    no("la partita non finisce (fase " + (Pdi(H) || {}).fase + ")");
  }
  RDF.pilota = pilota;
  // le foto: la prima volta che compare ogni momento (fase, gioco veloce), sui telefoni scelti
  function chiave(P) {
    var f = P.fase, L = P.lampo;
    if (f === "lampo" || f === "lampofine") return f + ":" + (L && L.tipo || "classica") + (L && L.chi ? ":chi" : "");
    if (f === "ftempo" && P.fin) return f + ":" + P.fin.b;
    if (f === "girando") return f + (P.veloce ? ":veloce" : "");
    if (f === "spiega" && P.spg) return f + ":" + P.spg.t;
    return f;
  }
  function attoreDi(P) {
    var f = P.fase, L = P.lampo;
    if (f === "lampo" || f === "lampofine") return L && (L.chi || L.vince);
    if (f === "fbusta" || f === "fesito") return P.busta && P.busta.id;
    return P.giocatori[P.turno] && P.giocatori[P.turno].id;
  }
  async function fotoMomento(P, nomi, extra) {
    var k = chiave(P);
    if (RDF.visti[k]) return;
    RDF.visti[k] = 1;
    var att = attoreDi(P), ids = Object.keys(nomi), chi = [];
    if (att && nomi[att]) chi.push(nomi[att]);
    var altro = ids.filter(function (id) { return id !== att; })[0]; if (altro && nomi[altro]) chi.push(nomi[altro]);
    if (!chi.length && ids[0]) chi.push(nomi[ids[0]]);
    if (P.fase === "girando") await W.dorme(1800);   // (la ruota che gira, non la partenza)
    if (P.fase === "lampo" && !P.lampo.chi) await W.dorme(1200);
    for (var i = 0; i < chi.length; i++) await foto(chi[i], k.replace(/:/g, "-") + (i ? "-altro" : "-chi"));
    (extra || []).forEach(function () {});
    for (var j = 0; j < (extra || []).length; j++) if (extra[j].quando(k)) await foto(extra[j].nome, k.replace(/:/g, "-") + "-" + extra[j].cosa);
  }
  // ---- online: Paky tiene la partita, gli amici col loro telefono; chi guarda col link e chi arriva tardi ----
  RDF.online = async function (amici, opz) {
    opz = opz || {}; RDF.visti = {};
    var imp = Object.assign({ manche: 4, prenota: true, express: true, veloce: true, mistero: true, finale: true }, opz.imp || {});
    var P = await apriTel("Paky", { x: 0, spiaRv: true, prima: function (w) { w.__impR = imp; } });
    var C = await W.apriStanza(P, "La Ruota della Fortuna"), tw = { Paky: P };
    for (var i = 0; i < amici.length; i++) tw[amici[i]] = await apriTel(amici[i], { hash: "gioco=ruota&stanza=" + C, x: 120 * (i + 1) });
    var n = amici.length + 1;
    if (!await W.aspetta(function () { return A.contaDentro(W.vmDi(C) || {}) >= Math.min(4, n); }, 15000)) no("in saletta non sono in " + n);
    await W.dorme(800);
    await foto("Paky", "saletta-host"); if (amici[0]) await foto(amici[0], "saletta-amico");
    if (n > 4) await foto(amici[amici.length - 1], "saletta-in-piu");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("niente «Comincia»");
    await W.dorme(1800); await foto("Paky", "sigla"); await W.dorme(2200); await foto(amici[0] || "Paky", "sigla-2");
    if (!await W.aspetta(function () { var Q = Pdi(P); return Q && Q.fase !== "lobby"; }, 60000)) no("la partita non comincia");
    var Q0 = Pdi(P), nomi = {}, tel = {};
    Q0.giocatori.forEach(function (g) { if (!g.bot && tw[g.nome]) { nomi[g.id] = g.nome; tel[g.id] = tw[g.nome]; } });
    var extra = [], guardaGia = false, tardiGia = false;
    if (n > 4) extra.push({ nome: amici[amici.length - 1], cosa: "in-piu-guarda", quando: function (k) { return /^(gira|girando|consonante|lampo:classica|finemanche|flettere|ftempo:1|fbusta)$/.test(k); } });
    var Pfin = await pilota(P, tel, nomi, { ogni: async function (G) {
      if (opz.guarda && !guardaGia && G.fase === "gira") {   // 👀 chi guarda col link
        guardaGia = true;
        tw[opz.guarda] = await apriTel(opz.guarda, { hash: "gioco=ruota&stanza=" + C + "&guarda=1", x: 700 });
        await W.dorme(2500); await foto(opz.guarda, "guarda-col-link");
        extra.push({ nome: opz.guarda, cosa: "guarda", quando: function (k) { return /^(girando|consonante|risolvi|lampo:|finemanche|flettere|ftempo:2|fbusta)/.test(k); } });
      }
      if (opz.tardi && !tardiGia && G.manche >= 2 && G.fase === "gira") {   // ✋ chi arriva a partita cominciata
        tardiGia = true;
        tw[opz.tardi] = await apriTel(opz.tardi, { hash: "gioco=ruota&stanza=" + C, x: 820 });
        await W.dorme(2500); await foto(opz.tardi, "arriva-tardi");
        extra.push({ nome: opz.tardi, cosa: "tardi", quando: function (k) { return /^(girando|consonante|finemanche|vgiro|flettere|fbusta|fesito)/.test(k); } });
      }
      // ⚠️ spoiler: la frase intera nella foto prima della fine della manche
      var v = W.vmDi(C) || {}, s = JSON.stringify(v), fr = G.frase && G.frase.length > 6 ? G.frase : "";
      if (fr && s.indexOf(fr) >= 0 && ["finemanche", "fine", "lampofine", "frivela", "fcambio", "fbusta", "fesito"].indexOf(v.fase) < 0 && !(v.fase === "lampo" && v.lampo && v.lampo.n >= (v.lampo.tot || 99))) nota("⚠️ SPOILER: la frase nella foto in fase " + v.fase);
      await fotoMomento(G, nomi, extra);
    } });
    await W.dorme(2500);
    await foto("Paky", "classifica-host"); if (amici[0]) await foto(amici[0], "classifica-amico");
    if (opz.tardi && tw[opz.tardi]) await foto(opz.tardi, "classifica-tardi");
    if (opz.guarda && tw[opz.guarda]) await foto(opz.guarda, "classifica-guarda");
    return "fine · " + (Pfin.classifica || []).map(function (r) { return r.nome + " " + r.punti; }).join(", ") + (RDF.log.length ? " · " + RDF.log.slice(0, 5).join(" | ") : "");
  };
  // ---- contro i Bot: Paky e N Bot ----
  RDF.bot = async function (nb, opz) {
    opz = opz || {}; RDF.visti = {};
    var P = await apriTel("Paky", { x: 0 });
    var tess = await W.aspetta(function () { return A.tessera(P, "La Ruota della Fortuna"); }, 8000); if (!tess) no("non trovo la Ruota"); tess.click(); await W.dorme(400);
    if (!await W.aspetta(function () { return W.clicca(P, /Contro i Bot/, ".modo-grande"); }, 6000)) no("niente «Contro i Bot»");
    await W.dorme(500);
    [].find.call(P.document.querySelectorAll(".modo-chip"), function (x) { return new RegExp("^" + nb + "$").test(x.textContent.trim()); }) && [].find.call(P.document.querySelectorAll(".modo-chip"), function (x) { return new RegExp("^" + nb + "$").test(x.textContent.trim()); }).click();
    await foto("Paky", "regole-bot");
    if (!W.clicca(P, /Comincia/)) no("niente «Comincia»");
    if (!await W.aspetta(function () { var Q = Pdi(P); return Q && Q.fase !== "lobby"; }, 60000)) no("la partita coi Bot non comincia");
    var Q0 = Pdi(P), nomi = {}, tel = {};
    Q0.giocatori.forEach(function (g) { if (!g.bot) { nomi[g.id] = "Paky"; tel[g.id] = P; } });
    var Pf = await pilota(P, tel, nomi, { ogni: async function (G) { await fotoMomento(G, nomi, []); } });
    await W.dorme(2500); await foto("Paky", "classifica-bot");
    return "fine · " + (Pf.classifica || []).map(function (r) { return r.nome + " " + r.punti; }).join(", ");
  };
  // ---- sullo stesso telefono ----
  RDF.locale = async function (nomiG, opz) {
    opz = opz || {}; RDF.visti = {};
    var P = await apriTel("Paky", { x: 0 });
    var tess = await W.aspetta(function () { return A.tessera(P, "La Ruota della Fortuna"); }, 8000); if (!tess) no("non trovo la Ruota"); tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Sullo stesso telefono/, ".modo-grande")) no("non c'è «Sullo stesso telefono»");
    if (!await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 4000)) no("non si scrivono i nomi");
    while (P.document.querySelectorAll(".sala-riga input").length < nomiG.length) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = nomiG[k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    W.clicca(P, /Avanti/); await W.dorme(400);
    await foto("Paky", "regole-locale");
    if (!W.clicca(P, /Comincia/)) no("niente «Comincia»");
    if (!await W.aspetta(function () { var Q = Pdi(P); return Q && Q.fase !== "lobby"; }, 60000)) no("la partita sullo stesso telefono non comincia");
    var Q0 = Pdi(P), nomi = {}, tel = {};
    Q0.giocatori.forEach(function (g) { if (!g.bot) { nomi[g.id] = "Paky"; tel[g.id] = P; } });
    var Pf = await pilota(P, tel, nomi, { ogni: async function (G) { await fotoMomento(G, { x: "Paky" }, []); } });
    await W.dorme(2500); await foto("Paky", "classifica-locale");
    return "fine · " + (Pf.classifica || []).map(function (r) { return r.nome + " " + r.punti; }).join(", ");
  };
})();
