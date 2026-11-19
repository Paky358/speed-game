// 🎡 STUDIO DELLA RUOTA DELLA FORTUNA (19 nov 2026, chat «🪟 Saletta di vetro»): si gioca come una persona vera e si fotografa.
// Non è una prova che dice OK/NO: è un giro per trovare i difetti. Profili finti, mai account veri.
// rs1: contro i Bot (regole di partenza, tutto acceso), Paky gioca «da persona»: gira col dito, chiama consonanti (a volte sbaglia),
//      compra vocali, risolve quando ha visto abbastanza; foto alla prima volta di ogni momento e ogni 25 s; diario dei tempi.
// rs2: sullo stesso telefono in 2 (Paky e Giulia), regole di partenza.
// rs3: online in 3 (Paky apre, Luca, Giulia), regole di partenza; foto del telefono di Paky (anche quando aspetta gli altri).
// Uso: FILE=ruota-studio/giro.js node provavera.js <porta> <tag> rs1   (il diario torna nell'esito e in W.__diario)
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti;
  function no(p) { throw new Error(p); }
  async function foto(nome) { if (!W.__foto) return; W.__fotoOra = nome; await W.aspetta(function () { return W.__fotoFatta === nome; }, 60000); }
  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  function tasto(w, re) { return [].find.call(w.document.querySelectorAll(".ru-azioni button, .ru-scrivi-riga button, .ru-form button, button"), function (b) { return re.test(b.textContent) && !b.disabled && !b.hidden && b.getClientRects().length; }) || null; }
  function lettera(w, L) { return [].find.call(w.document.querySelectorAll(".ru-qwerty .ru-btn.lettera, .ru-azioni .ru-btn.lettera"), function (b) { return b.textContent === L && !b.disabled; }) || null; }
  function Pdi(h) { return h.__RUOTA && h.__RUOTA.ultima; }
  function base(ch) { return { "À": "A", "È": "E", "É": "E", "Ì": "I", "Ò": "O", "Ù": "U" }[ch] || ch; }
  function eL(ch) { return /^[A-ZÀÈÉÌÒÙ]$/.test(ch); }
  var CONS = "BCDFGHJKLMNPQRSTVWXYZ", FREQ = "NRTLSCDMPVGBFZHQ";
  async function trascina(w, gradi, ms) {
    var R = w.document.querySelector(".ru-alto .ru-piatto-alto");
    if (!R) return false;
    var r = R.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, rr = r.width * 0.36, a0 = -90, Ev = w.PointerEvent || w.MouseEvent, n = 8;
    function ev(t, a) { var x = cx + rr * Math.cos(a * Math.PI / 180), y = cy + rr * Math.sin(a * Math.PI / 180); R.dispatchEvent(new Ev(t, { bubbles: true, cancelable: true, pointerId: 9, pointerType: "touch", isPrimary: true, clientX: x, clientY: y })); }
    ev("pointerdown", a0);
    for (var k = 1; k <= n; k++) { await W.dorme(ms / n); ev("pointermove", a0 + gradi * k / n); }
    ev("pointerup", a0 + gradi);
    return true;
  }
  async function scrivi(w, frase, tab) {
    for (var i = 0; i < tab.length; i++) {
      if (tab.charAt(i) !== "_") continue;
      var b = lettera(w, base(frase.charAt(i))); if (!b) return false;
      tocca(w, b); await W.dorme(90);
    }
    var ok = tasto(w, /✓ Risolvi/); if (!ok) return false;
    tocca(w, ok); return true;
  }
  function quota(P) {   // quanto della frase si vede (0..1)
    var tot = 0, vis = 0; P.frase.split("").forEach(function (ch) { if (eL(ch)) { tot++; if (P.rivelate[base(ch)]) vis++; } }); return tot ? vis / tot : 0;
  }
  // il diario: ogni cambio di momento (fase, turno, messaggio) con l'ora
  function diario(H) {
    var D = { t0: Date.now(), righe: [], k: "", fasi: {} };
    D.segna = function (P) {
      var p = P.giocatori && P.giocatori[P.turno], k = [P.fase, P.manche, p && p.nome, P.msg].join("|");
      if (k === D.k) return null;
      var ora = Date.now(), prima = D.righe[D.righe.length - 1];
      if (prima) prima.dura = ora - prima.t;
      D.k = k;
      var r = { t: ora, s: ((ora - D.t0) / 1000).toFixed(1), fase: P.fase, manche: P.manche, chi: p ? p.nome + (p.bot ? "🤖" : "") : "", msg: String(P.msg || "").slice(0, 110), nuovaFase: !D.fasi[P.fase] };
      D.fasi[P.fase] = (D.fasi[P.fase] || 0) + 1;
      D.righe.push(r); return r;
    };
    D.testo = function () {
      var per = {}; D.righe.forEach(function (r) { per[r.fase] = (per[r.fase] || 0) + (r.dura || 0); });
      return "TEMPI PER FASE (s): " + Object.keys(per).map(function (f) { return f + " " + (per[f] / 1000).toFixed(1); }).join(", ") +
        "\nDIARIO:\n" + D.righe.map(function (r) { return r.s + "s +" + ((r.dura || 0) / 1000).toFixed(1) + " [" + r.fase + " m" + r.manche + "] " + r.chi + " · " + r.msg; }).join("\n");
    };
    return D;
  }
  // gioca «da persona» per tutti gli umani (tel = { id: finestra }) finché la partita finisce; foto a ogni momento nuovo
  async function gioca(H, tel, opz) {
    opz = opz || {};
    var D = diario(H), fine = Date.now() + (opz.ms || 900000), ultFoto = 0, nFoto = 0, k0 = "", fermo = 0, finFatti = {};
    W.__diario = D;
    while (Date.now() < fine) {
      var P = Pdi(H);
      if (!P) { await W.dorme(200); continue; }
      var r = D.segna(P);
      if (r && nFoto < 40 && (r.nuovaFase || Date.now() - ultFoto > 25000)) { ultFoto = Date.now(); nFoto++; await foto(String(nFoto).padStart(2, "0") + "-" + P.fase + "-m" + P.manche); }
      if (P.fase === "fine" || (H.document.querySelector(".classifica") && !H.document.querySelector(".ru-studio"))) { await W.dorme(1500); await foto("99-fine"); return D; }
      var f = P.fase, L = P.lampo;
      if ((f === "flettere" || f === "ftempo") && P.fin) {
        for (var fid in tel) {
          var gf = P.fin.g[fid]; if (!gf || P.finFatto(fid) || (f === "flettere" && gf.scelte)) continue;
          var kf = f + ":" + P.fin.b + ":" + fid; if (finFatti[kf] && Date.now() - finFatti[kf] < 3000) continue;
          finFatti[kf] = Date.now(); var wf = tel[fid];
          try {
            if (f === "flettere") { ["C", "D", "M", "O"].forEach(function (ch) { var b = lettera(wf, ch); if (b) tocca(wf, b); }); await W.dorme(300); var be = tasto(wf, /Ecco le mie lettere/); if (be) tocca(wf, be); }
            else {
              await W.dorme(4000 + Math.random() * 6000);   // (una persona ci pensa un po')
              if (P.fin.b === 3) { for (var q = 0; q < 3; q++) { var lx = P.frase.split("").map(base).filter(function (ch) { return CONS.indexOf(ch) >= 0; })[q]; var bl = lx && lettera(wf, lx); if (bl) { tocca(wf, bl); await W.dorme(700); } } var bs2 = tasto(wf, /La so: scrivo/); if (bs2) { tocca(wf, bs2); await W.dorme(300); } }
              await scrivi(wf, P.frase, P.finTab(gf.ch));
            }
          } catch (e) {}
        }
        await W.dorme(300); continue;
      }
      var att = f === "lampo" ? L && L.chi : ["fbusta", "fesito"].indexOf(f) >= 0 ? P.busta && P.busta.id : ["fintro", "flettere", "frivela", "ftempo", "fcambio"].indexOf(f) >= 0 ? null : P.giocatori[P.turno] && P.giocatori[P.turno].id;
      var w = att && tel[att], k = [f, P.manche, P.giroN, att, Object.keys(P.chiamate).length, L ? L.n + ":" + L.prove : ""].join("|");
      if (k === k0 && Date.now() - fermo < 1500) { await W.dorme(150); continue; }
      k0 = k; fermo = Date.now();
      try {
        if (f === "lampo" && L && !L.chi) {
          if (L.n >= Math.max(3, L.pos.length * 0.45)) {
            var ids = Object.keys(tel).filter(function (id) { return !L.fuori[id] && P.trova(id) && !P.trova(id).via; });
            if (ids.length) { var wp = tel[ids[0]], np = P.trova(ids[0]).nome; var bp = tasto(wp, /PRENOTO/) || tasto(wp, new RegExp("🔔 " + np)); if (bp) tocca(wp, bp); }
          }
        } else if (!w) { /* tocca a un Bot o va avanti da solo */ }
        else if (f === "lampo" && L && L.chi) { await W.dorme(1500); await scrivi(w, L.frase, P.lampoTab()); }
        else if (f === "gira") {
          await W.dorme(1200 + Math.random() * 1500);   // (una persona guarda il tabellone prima di decidere)
          var qu = quota(P), soldi = P.giocatori[P.turno].soldi;
          var vocNasc = P.frase.split("").map(base).filter(function (ch) { return "AEIOU".indexOf(ch) >= 0 && !P.chiamate[ch]; });
          if (qu >= 0.68 || !P.consonantiNascoste()) { var br = tasto(w, /💡 Risolvi/); if (br) tocca(w, br); }
          else if (soldi >= 300 && vocNasc.length && Math.random() < 0.35) { var bv = lettera(w, vocNasc[0]); if (bv) { tocca(w, bv); await W.dorme(300); } }
          else if (!(await trascina(w, 70 + Math.random() * 60, 120))) { var bg = tasto(w, /🎡 Gira/); if (bg) tocca(w, bg); }
        }
        else if (f === "consonante") {
          await W.dorme(1500 + Math.random() * 2000);
          var giuste = P.frase.split("").map(base).filter(function (ch) { return CONS.indexOf(ch) >= 0 && !P.chiamate[ch]; });
          var sbagliate = FREQ.split("").filter(function (ch) { return !P.chiamate[ch] && giuste.indexOf(ch) < 0; });
          var c = Math.random() < 0.72 || !sbagliate.length ? giuste[Math.floor(Math.random() * Math.min(3, giuste.length))] : sbagliate[0];
          var bc = c && lettera(w, c); if (bc) { tocca(w, bc); await W.dorme(250); var conf = lettera(w, c); if (conf && /sel|acces/.test(conf.className)) tocca(w, conf); }
        }
        else if (f === "vocale") { var v = P.frase.split("").map(base).filter(function (ch) { return "AEIOU".indexOf(ch) >= 0 && !P.chiamate[ch]; })[0] || "U"; var bvv = lettera(w, v); if (bvv) tocca(w, bvv); }
        else if (f === "mistero") { await W.dorme(1500); var ba = tasto(w, /Apri il Mistero/); if (ba) tocca(w, ba); }
        else if (f === "sceltaexp") { await W.dorme(1500); var bx = Math.random() < 0.5 ? tasto(w, /Express/) : tasto(w, /Gioco/); if (bx) tocca(w, bx); }
        else if (f === "express") {
          await W.dorme(1200);
          var gx = P.frase.split("").map(base).filter(function (ch) { return CONS.indexOf(ch) >= 0 && !P.chiamate[ch]; });
          if (quota(P) > 0.7) { var brx = tasto(w, /Risolvi/); if (brx) tocca(w, brx); }
          else if (gx.length) { var bgx = lettera(w, gx[0]); if (bgx) tocca(w, bgx); }
        }
        else if (f === "risolvi") { await W.dorme(1200); await scrivi(w, P.frase, P.vista().tab); }
        else if (f === "vlettera") { await W.dorme(1500); var x = P.frase.split("").map(base).filter(function (ch) { return /[A-Z]/.test(ch) && !P.chiamate[ch]; })[0]; if (x && lettera(w, x)) tocca(w, lettera(w, x)); }
        else if (f === "vdecidi") { await W.dorme(1000); var bd = quota(P) > 0.6 ? tasto(w, /Risolvo/) : tasto(w, /Passo|No/) || tasto(w, /Risolvo/); if (bd) tocca(w, bd); }
        else if (f === "fbusta") { await W.dorme(2500); var bb = [].find.call(w.document.querySelectorAll(".ru-btn.busta"), function (b) { return !b.disabled; }); if (bb) tocca(w, bb); }
        if (f === "finemanche" && opz.avanti) await opz.avanti(P);
      } catch (e) {}
      await W.dorme(200);
    }
    return D;
  }
  async function apriRuota(w) {
    var tess = await W.aspetta(function () { return A.tessera(w, "La Ruota della Fortuna"); }, 6000);
    if (!tess) no("non trovo la Ruota"); tess.click(); await W.dorme(400);
  }
  COPIONE.aggiungi("rs1", { nome: "Studio: contro i Bot, da persona, con le foto", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    await apriRuota(P); await foto("00-come-giocate");
    if (!W.clicca(P, /Contro i Bot/, ".modo-grande")) no("non c'è «Contro i Bot»");
    await W.dorme(500); await foto("00-regole");
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia»");
    var D = await gioca(P, { host: P }, { ms: 240000 });
    return D.testo();
  } });
  COPIONE.aggiungi("rs2", { nome: "Studio: sullo stesso telefono in 2", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    await apriRuota(P);
    if (!W.clicca(P, /Sullo stesso telefono/, ".modo-grande")) no("non c'è «Sullo stesso telefono»");
    if (!await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 3000)) no("non si scrivono i nomi");
    while (P.document.querySelectorAll(".sala-riga input").length < 2) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = ["Paky", "Giulia"][k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    W.clicca(P, /Avanti/); await W.dorme(400); await foto("00-regole");
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia»");
    var D = await gioca(P, { p0: P, p1: P }, { ms: 300000 });
    return D.testo();
  } });
  COPIONE.aggiungi("rs3", { nome: "Studio: online in 3", fai: async function () {
    var F = {}, P = F.Paky = await W.apriTel("Paky", { x: 0 });
    await apriRuota(P);
    if (!W.clicca(P, /apro io/, ".modo-grande")) no("non c'è «Online: apro io»");
    await W.dorme(400); await foto("00-regole-online");
    if (!W.clicca(P, /Apri la stanza/)) no("non c'è «Apri la stanza»");
    var C = await W.aspetta(function () { var b = P.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }, 6000);
    if (!C) no("niente codice");
    F.Luca = await W.apriTel("Luca", { hash: "gioco=ruota&stanza=" + C, x: 185 });
    F.Giulia = await W.apriTel("Giulia", { hash: "gioco=ruota&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (W.vmDi(C).giocatori || []).length === 3; }, 15000)) no("in saletta non sono in 3");
    await W.dorme(800); await foto("00-saletta");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("«Comincia» spento");
    var tel = {}; (W.vmDi(C).giocatori || []).forEach(function (g) { tel[g.id] = F[g.nome] || P; });
    var D = await gioca(P, tel, { ms: 420000, avanti: async function () { await W.dorme(2500); ["Luca", "Giulia", "Paky"].forEach(function (n) { var b = tasto(F[n], /Avanti/); if (b) tocca(F[n], b); }); } });
    return D.testo();
  } });
})();
