// =========================================================================================================================
// L'Asta dei temi dopo la serata vera in 8 (11 nov 2026: «l'asta normale un disastro»). Si carica dopo preferiti/asta.js.
// an1 Online in 8 (temi, round misti): tutte le schermate dei temi col vestito della notte (niente blu vecchio), le carte senza
//     foto curate, e alla scelta della carta chi resta sul tavolo NON cambia grandezza né posto quando un'altra se ne va.
//     Con W.__scatta (strumento asta-notte/foto.js) fa anche le foto a 360x640 e 412x915.
// an2 Stesso telefono in 4: alla scelta le carte che restano non cambiano grandezza né posto.
// Uso: await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-notte.js"); await COPIONE.prova("an1")
// =========================================================================================================================
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function senzaAnimazioni(w) { var st = w.document.createElement("style"); st.textContent = ".schermata,.as-mal-carta,.as-scen,.as-sorpresa,.as-buste .r{animation:none!important;opacity:1!important} .btn.as-auto::after{animation:none!important}"; w.document.head.appendChild(st); }
  var MISURE = [[360, 640], [412, 915]];
  var MORBIDO = null;   // (per le foto di prima: i difetti si scrivono e si va avanti)
  function segna(m) { if (MORBIDO) { if (MORBIDO.indexOf(m) < 0) MORBIDO.push(m); } else no(m); }

  // la foto di un telefono a misura vera (senza la riduzione a metà della pagina di prova)
  async function scatta(nome, cosa, misure) {
    if (!W.__scatta) return;
    var f = document.getElementById("tel-" + nome), w = W.finestra(nome), vecchio = f.style.cssText;
    for (var i = 0; i < (misure || MISURE).length; i++) {
      var m = (misure || MISURE)[i];
      f.style.cssText = "position:fixed;top:0;left:0;width:" + m[0] + "px;height:" + m[1] + "px;border:0;z-index:99999;background:#000;transform:none";
      w.dispatchEvent(new w.Event("resize")); await W.dorme(450);
      await W.__scatta(cosa + "-" + m[0] + "x" + m[1], m[0], m[1]);
    }
    f.style.cssText = vecchio; w.dispatchEvent(new w.Event("resize")); await W.dorme(150);
  }
  // le carte della scelta: nome → riquadro (posto e misura), per vedere che chi resta non si muove
  function riquadri(w) {
    var o = {};
    qa(w, ".as-griglia .as-carta").forEach(function (b) { if (b.classList.contains("via")) return; var n = b.querySelector(".nm"); if (!n) return; var r = b.getBoundingClientRect(); o[n.textContent] = [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; });
    return o;
  }
  function confronta(prima, dopo, dove) {
    var x = [];
    Object.keys(dopo).forEach(function (k) { var a = prima[k], b = dopo[k]; if (a && (Math.abs(a[0] - b[0]) > 1 || Math.abs(a[1] - b[1]) > 1 || Math.abs(a[2] - b[2]) > 1 || Math.abs(a[3] - b[3]) > 1)) x.push("«" + k + "» " + a.join(",") + " → " + b.join(",")); });
    if (x.length) segna(dove + ": le carte che restano cambiano posto o grandezza: " + x.slice(0, 3).join(" / "));
  }
  // il blu vecchio di SPeeD GAME: fondo della schermata e riquadri delle carte (#34479a, #191735, #1c1940…) non ci devono essere
  function colori(e, w) { var s = w.getComputedStyle(e); return (s.backgroundColor + " " + s.backgroundImage).replace(/\s+/g, " "); }
  function bluVecchio(w, cosa) {
    var x = [], vecchi = /52, 71, 154|25, 23, 53|28, 25, 64|58, 48, 96|42, 37, 80|159, 180, 255|84, 104, 199|90, 30, 110/;
    var sch = qa(w, ".schermata").filter(visibile).pop(); if (!sch) return;
    if (!sch.classList.contains("oro") && !sch.querySelector(".sa-sala")) x.push("la schermata non ha il vestito della notte");
    [sch].concat(qa(w, ".as-carta, .as-pt, .as-vk, .tier, .as-tbar, .as-esito-carta, .as-buste .r")).forEach(function (e) { if (visibile(e) && vecchi.test(colori(e, w))) x.push((e.className || e.tagName) + " ha il blu vecchio"); });
    var bg = w.getComputedStyle(w.document.body).backgroundColor; if (/52, 71, 154/.test(bg) && !w.document.body.classList.contains("tema-oro")) x.push("dietro la schermata c'è il fondo blu vecchio");
    if (x.length) segna(cosa + ": " + x.slice(0, 4).join(" / "));
  }

  async function telefoniOnline(imp, nomi) {
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "L'Asta");
    senzaAnimazioni(P);
    for (var i = 1; i < nomi.length; i++) { var w = await W.apriTel(nomi[i], { hash: "gioco=asta&stanza=" + C, x: 185 * i }); senzaAnimazioni(w); }
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 15000)) no("non sono entrati in " + nomi.length + " (" + (vm(C).giocatori || []).length + ")");
    return { P: P, C: C };
  }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function nomeDiId(C, id) { var g = (vm(C).giocatori || []).filter(function (x) { return x.id === id; })[0]; return g ? g.nome : null; }
  function manda(nome, m) { if (nome === "Paky") return false; W.reteDi(nome).invia(m); return true; }

  COPIONE.aggiungi("an1", { nome: "Asta online in 8 (temi): vestito della notte ovunque, carte senza foto curate, alla scelta chi resta non cambia grandezza", fai: async function (opz) {
    MORBIDO = opz && opz.morbido ? [] : null;
    var NOMI = ["Paky", "Giulia", "Luca", "Marta", "Sara", "Tommi", "Anna", "Pino"];
    var o = await telefoniOnline({ formato: "temi", crediti: 15, round: (opz && opz.round) || "misti", maledetta: !!(opz && opz.maledetta) }, NOMI), P = o.P, C = o.C, x = [];
    var G = W.finestra("Giulia");
    await scatta("Paky", "0-saletta", [[360, 640]]);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    var foto = {}, fino = Date.now() + 420000, rq = { P: null, G: null, k: null }, viste = 0, sceltaN = {};
    while (Date.now() < fino && vm(C).fase !== "voto" && vm(C).fase !== "fine") {
      var v = vm(C), r = v.roundIdx;
      if (v.fase === "round") { if (!foto["r" + r]) { foto["r" + r] = 1; await W.dorme(500); bluVecchio(P, "inizio round"); if (r < 2) await scatta("Paky", "1-round" + (r + 1)); } W.clicca(P, /Vedi le carte/); await W.dorme(300); continue; }
      if (v.fase === "scelta") {
        var k = r + "|" + v.nScelta;
        if (!sceltaN[k]) {
          sceltaN[k] = 1; await W.dorme(600);
          bluVecchio(P, "scelta"); bluVecchio(G, "scelta (Giulia)");
          var rp = riquadri(P), rg = riquadri(G);
          if (rq.k && rq.k.split("|")[0] === String(r)) { confronta(rq.P, rp, "scelta, telefono di Paky (" + v.tavolo.length + " carte)"); confronta(rq.G, rg, "scelta, telefono di Giulia (" + v.tavolo.length + " carte)"); viste++; }
          rq = { P: rp, G: rg, k: k };
          if (r === 0 && (v.tavolo.length === 8 || v.tavolo.length === 7 || v.tavolo.length === 6 || v.tavolo.length === 3)) await scatta(v.sceglieId === "host" ? "Giulia" : "Paky", "2-scelta-" + v.tavolo.length + "-carte");
          if (W.__FLUENT && r === 0 && v.tavolo.length === 8) {   // (la proposta: le emoji disegnate di Fluent Emoji 3D al posto di quelle del telefono, solo per la foto)
            var chiF = v.sceglieId === "host" ? "Giulia" : "Paky", wf = W.finestra(chiF), attese = [];
            qa(wf, ".as-griglia .as-carta").forEach(function (b, i) { var c = v.tavolo[i], m = c && W.__FLUENT[c.emoji] || W.__FLUENT[(c && c.emoji || "").replace(/️/g, "")], em = b.querySelector(".em"); if (!m || !em) return;
              var nome = m.name, cart = nome.charAt(0).toUpperCase() + nome.slice(1), f = nome.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
              var url = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@1ffb34c/assets/" + encodeURIComponent(cart) + "/" + (m.skin ? "Default/3D/" + f + "_3d_default.png" : "3D/" + f + "_3d.png");
              var im = wf.document.createElement("img"); im.src = url; im.style.cssText = "width:78%;height:78%;object-fit:contain"; em.textContent = ""; em.appendChild(im); attese.push(new Promise(function (ok) { im.onload = ok; im.onerror = ok; setTimeout(ok, 6000); })); });
            await Promise.all(attese); await scatta(chiF, "2-scelta-8-carte-PROPOSTA-fluent");
          }
        }
        var idx = 0;
        if (v.sceglieId === "host") { var cc = qa(P, ".as-griglia .as-carta:not([disabled])")[idx]; if (cc) cc.click(); }
        else manda(nomeDiId(C, v.sceglieId), { t: "scegli", idx: idx, n: v.nScelta, nome: v.tavolo[idx].nome });
        await W.aspetta(function () { return vm(C).fase !== "scelta" || vm(C).nScelta !== v.nScelta; }, 4000); continue;
      }
      if (v.fase === "busta" && v.busta) {
        var b = v.busta;
        if (!foto["b" + r]) { foto["b" + r] = 1; await W.dorme(500); await scatta("Giulia", "4-busta"); }
        b.gara.forEach(function (id) { var n = nomeDiId(C, id); if (n && n !== "Paky" && b.chiusi.indexOf(id) < 0) manda(n, { t: "busta", n: b.n, q: 1 + (n.length % 2) }); });
        var okP = bott(P, ".as-bus-piede .btn", /Chiudo la busta|Non offro/); if (okP) okP.click();
        await W.aspetta(function () { return vm(C).fase !== "busta" || (vm(C).busta || {}).n !== b.n; }, 17000);
        continue;
      }
      if (v.fase === "esito") {
        if (!foto["e" + r]) { foto["e" + r] = 1; await W.dorme(v.esito && v.esito.buste ? 4400 : 2200); bluVecchio(P, "esito"); bluVecchio(G, "esito (Giulia)"); if (r < 2) await scatta("Giulia", "5-esito-round" + (r + 1)); }
        W.clicca(P, /Avanti/); await W.dorme(400); continue;
      }
      if (v.fase === "maledetta") { if (!foto.mal) { foto.mal = 1; await W.dorme(900); bluVecchio(G, "carta maledetta (Giulia)"); await scatta("Giulia", "4-maledetta"); } await W.dorme(400); continue; }
      if (v.fase === "malEsito") { if (!foto.malE) { foto.malE = 1; await W.dorme(900); bluVecchio(G, "esito della carta maledetta (Giulia)"); await scatta("Giulia", "5-maledetta-esito"); } W.clicca(P, /Avanti/); await W.dorme(400); continue; }
      if (v.fase !== "asta" || !v.asta) { W.clicca(P, /Vedi le carte|Avanti/); await W.dorme(300); continue; }
      var a = v.asta, nA = a.n;
      if (!foto["a" + r]) {
        foto["a" + r] = 1;
        if (a.leaderId !== idDi("Giulia")) { manda("Giulia", { t: "rilancia", n: nA, prezzo: a.offerta + 1, vista: a.offerta }); await W.dorme(700); }
        if (r === 0) {
          await scatta("Luca", "3-sala-asta");
          var L = W.finestra("Luca"), tc = bott(L, ".sa-tasto, button", /Carte/);
          if (tc) { tc.click(); await W.dorme(400); var fg = q(L, ".sa-foglio"); if (!fg) no("il foglio «Le carte» non si apre"); else { if (/52, 71, 154|255, 248, 230/.test(colori(fg, L) + " " + qa(L, ".sa-foglio .as-palio, .sa-foglio .as-rose-p").map(function (e) { return colori(e, L); }).join(" "))) segna("il foglio «Le carte» ha i colori di prima"); await scatta("Luca", "3-sala-carte", [[360, 640]]); var x0 = bott(L, ".sa-foglio .sa-tasto", /✕/); if (x0) x0.click(); } }
        }
      }
      var z = vm(C); if (!z.asta || z.asta.n !== nA) continue;
      var capo = z.asta.leaderId;
      NOMI.forEach(function (n) { if (idDi(n) === capo) return; if (n === "Paky") { var bp = bott(P, ".sa-piede .btn", /^Passo$/); if (bp) bp.click(); } else manda(n, { t: "passa", n: nA }); });
      await W.aspetta(function () { return !vm(C).asta || vm(C).asta.n !== nA; }, 12000);
    }
    if (vm(C).fase !== "voto") no("non si arriva al voto (fase " + vm(C).fase + ")");
    if (viste < 6) no("ho confrontato solo " + viste + " scelte");
    // ⭐ la passerella: ogni kit in grande, tutti gli altri gli danno da 1 a 5 stelle (qui: il primo 5, poi 4, 3, 2, 1, 2, 3, 4)
    var V = vm(C), giri = 0, atteso = {}, tagli = [];
    while (vm(C).fase === "voto" && vm(C).voto && giri < NOMI.length + 2) {
      var Q = vm(C).voto, k0 = Q.k, per = nomeDiId(C, Q.per), dai = [5, 4, 3, 2, 1, 2, 3, 4][k0 % 8]; giri++;
      atteso[per] = dai;
      var chi = per === "Giulia" ? "Luca" : "Giulia", Wc = W.finestra(chi);
      if (!await W.aspetta(function () { return qa(Wc, ".as-pas-o").length >= 4 && qa(Wc, ".as-stelle button").length === 5; }, 5000)) no("il kit di " + per + " non si vede in grande con le 5 stelle");
      await W.dorme(700);
      bluVecchio(Wc, "passerella (" + chi + ")");
      qa(Wc, ".as-pas-o .nm").forEach(function (n) { if (n.scrollHeight > n.clientHeight + 2 || n.getBoundingClientRect().width < 40) tagli.push(n.textContent); });
      if (k0 === 0) { await scatta(chi, "6-passerella"); await scatta(per, "6-passerella-il-mio-kit", [[360, 640]]); }
      NOMI.forEach(function (n) {
        if (n === per) return;
        if (n === "Paky" || n === "Giulia" || n === "Luca") { var bs = qa(W.finestra(n), ".as-pas-sc .as-stelle button"); if (bs.length === 5) bs[dai - 1].click(); else no(n + " non ha le 5 stelle"); }
        else manda(n, { t: "voto", per: Q.per, v: dai, s: V.sessione });
      });
      if (k0 === 0) { await W.dorme(300); await scatta(chi, "6-passerella-votato", [[360, 640]]); }
      if (!await W.aspetta(function () { var z = vm(C); return z.fase !== "voto" || (z.voto && z.voto.k !== k0); }, 6000)) no("votato tutti, il kit di " + per + " non va avanti");
    }
    if (tagli.length) segna("nella passerella dei nomi sono tagliati: " + tagli.slice(0, 3).join(", "));
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 10000)) no("finita la passerella non arriva la classifica");
    vm(C).giocatori.forEach(function (g) { if (g.stelle !== atteso[g.nome]) no(g.nome + " ha la media " + g.stelle + " invece di " + atteso[g.nome]); });
    await W.dorme(1500);
    if (qa(G, ".classifica .as-cl-kit").length !== NOMI.length) no("nella classifica non ci sono i kit di tutti (" + qa(G, ".classifica .as-cl-kit").length + ")");
    await scatta("Giulia", "7-fine");
    x.push(viste + " scelte confrontate" + (MORBIDO && MORBIDO.length ? " · DIFETTI: " + MORBIDO.join(" | ") : ": le carte che restano sono ferme"));
    return x.join(" · ");
  } });

  COPIONE.aggiungi("an2", { nome: "Asta stesso telefono in 4 (temi): alla scelta le carte che restano non cambiano grandezza né posto", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = { formato: "temi", crediti: 15, round: "normali", maledetta: false }; } });
    senzaAnimazioni(P);
    var tess = await W.aspetta(function () { return A.tessera(P, "L'Asta"); }, 6000); if (!tess) no("non trovo la tessera dell'Asta");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
    await W.aspetta(function () { return q(P, ".sala-riga input"); }, 3000);
    var nomi = ["Paky", "Giulia", "Luca", "Marta"];
    for (var a = 0; a < 3 && qa(P, ".sala-riga input").length < 4; a++) { if (!W.clicca(P, /Aggiungi|➕|\+/)) break; await W.dorme(100); }
    qa(P, ".sala-riga input").forEach(function (c, k) { c.value = nomi[k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    var fino = Date.now() + 120000, prima = null, n = 0, giri = 0;
    while (Date.now() < fino && n < 3) {
      var g = q(P, ".as-griglia");
      if (g && qa(P, ".as-griglia .as-carta:not(.via)").length) {
        var r = riquadri(P);
        if (prima && Object.keys(r).length < Object.keys(prima).length) { confronta(prima, r, "stesso telefono"); n++; }
        prima = r;
        bluVecchio(P, "scelta (stesso telefono)");
        qa(P, ".as-griglia .as-carta:not(.via)")[0].click(); await W.dorme(300); continue;
      }
      if (qa(P, ".sa-pers").length) { var ps = bott(P, ".sa-piede .btn", /^Passo$/); if (ps) { ps.click(); await W.dorme(150); continue; } }
      var b = qa(P, "button").filter(function (x) { return visibile(x) && !x.disabled && /Avanti|Comincia|Vedi le carte|Inizia|Gioca|▶/.test(x.textContent); })[0];
      if (b) b.click();
      if (++giri % 20 === 0 && /Passa il telefono|Sono /.test(T(P))) W.clicca(P, /^Sono /);
      await W.dorme(250);
    }
    if (n < 3) no("ho visto solo " + n + " scelte dopo una vendita («" + T(P).slice(0, 160) + "»)");
    return n + " scelte confrontate: le carte che restano sono ferme";
  } });
  COPIONE.aggiungi("an3", { nome: "Asta stesso telefono in 8 (temi): la passerella dei kit coi giudici a tavola, medie e classifica", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca", "Marta", "Sara", "Tommi", "Anna", "Pino"];
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = { formato: "temi", crediti: 15, round: "normali", maledetta: false }; } });
    senzaAnimazioni(P);
    var tess = await W.aspetta(function () { return A.tessera(P, "L'Asta"); }, 6000); if (!tess) no("non trovo la tessera dell'Asta");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
    await W.aspetta(function () { return q(P, ".sala-riga input"); }, 3000);
    while (qa(P, ".sala-riga input").length < NOMI.length) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    qa(P, ".sala-riga input").forEach(function (c, k) { c.value = NOMI[k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    var fino = Date.now() + 300000, kit = 0, atteso = {}, foto = false;
    while (Date.now() < fino && !/Fasce svelate/.test(T(P))) {
      if (q(P, ".as-pas")) {
        var g = ((q(P, ".as-pas-chi b") || {}).textContent || "").replace("Il kit di ", ""), dai = [5, 4, 3, 2, 1, 2, 3, 4][kit % 8];
        if (qa(P, ".as-giudice").length !== NOMI.length - 1) no("nella passerella ci sono " + qa(P, ".as-giudice").length + " giudici invece di " + (NOMI.length - 1));
        if (!foto) { await W.dorme(800); bluVecchio(P, "passerella (stesso telefono)"); await scatta("Paky", "8-passerella-tavola"); }
        qa(P, ".as-giudice").forEach(function (gd, i) { if (i < 3 || kit) gd.querySelectorAll(".as-stelle button")[dai - 1].click(); });
        if (!foto) { foto = true; await W.dorme(200); var av0 = bott(P, ".schermata .piede .btn", /Mancano 4 voti/); if (!av0 || !av0.disabled) no("con 3 voti su 7 il tasto non dice «Mancano 4 voti» spento"); await scatta("Paky", "8-passerella-tavola-3-voti", [[360, 640]]); qa(P, ".as-giudice").forEach(function (gd) { gd.querySelectorAll(".as-stelle button")[dai - 1].click(); }); }
        atteso[g] = dai; kit++;
        await W.dorme(120); var av = bott(P, ".schermata .piede .btn", /Prossimo kit|Classifica/); if (!av || av.disabled) no("votato tutti, il tasto non va avanti"); else av.click();
        await W.dorme(400); continue;
      }
      var carte = qa(P, ".as-carta:not([disabled])");
      if (carte.length) { carte[0].click(); await W.dorme(250); continue; }
      if (q(P, ".sa-pers") && q(P, ".sa-prezzo b") && !q(P, ".sa-aggiudicato")) {
        var capo = (qa(P, ".sa-pers.guida b")[0] || {}).textContent;
        qa(P, ".sa-pers").forEach(function (p) { var b = p.querySelector("b").textContent, ps = p.querySelector(".sa-passo"); if (b !== capo && ps && ps.style.visibility !== "hidden" && !p.classList.contains("fuori")) ps.click(); });
        await W.dorme(300); continue;
      }
      W.clicca(P, /Vedi le carte|Avanti ▶|Avanti|Comincia|Gioca/); await W.dorme(250);
    }
    if (kit !== NOMI.length) no("nella passerella sono passati " + kit + " kit invece di " + NOMI.length);
    if (!/Fasce svelate/.test(T(P))) no("dopo la passerella non arrivano le fasce svelate");
    W.clicca(P, /Classifica finale/); await W.dorme(600);
    var righe = qa(P, ".classifica li");
    if (righe.length !== NOMI.length) no("la classifica ha " + righe.length + " righe");
    righe.forEach(function (li) { var nm = NOMI.filter(function (n) { return li.textContent.indexOf(n) >= 0; })[0], pt = (li.querySelector(".punti") || {}).textContent || ""; if (nm && atteso[nm] != null && pt.indexOf(atteso[nm] + " ⭐") !== 0) no(nm + ": in classifica «" + pt + "» invece di " + atteso[nm] + " ⭐"); });
    await scatta("Paky", "8-classifica-tavola", [[360, 640]]);
    return kit + " kit in passerella, medie giuste in classifica";
  } });
})();
