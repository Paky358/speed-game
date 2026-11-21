// LE SCELTE DEL PROPRIETARIO SUL PREZZO È GIUSTO (21 nov 2026, dopo la v393). Si carica dopo prezzo/base.js e prezzo/difetti/scene.js.
// psc: una partita «Contro il Bot» per misura, fotografata nei momenti delle scelte:
//   A = la riga sotto il prodotto nell'Offerta a vista («si può offrire 1 € più di un altro»);
//   B = la Vetrina finale che si presenta un pezzo alla volta (al centro, non più in alto col vuoto sotto);
//   C = il titolo del pannello nei giochi a premi (una frase d'aiuto, non più il nome del gioco);
//   D = la scelta del gioco a premi: com'è (schede bianche) e, solo nella foto, col fondo scuro della Notte vivace (W.__pfOpz.scuro).
// psi: la scelta del gioco a premi con le immagini proposte al posto delle emoji (solo nella foto, il gioco non cambia):
//   W.__pfOpz = { strade: { foto: …, disegni: … }, est: { foto: ".jpg", disegni: ".svg" }, giri: [["emoji", false], ["foto", true]…] } (vedi sotto)
// Con prova.js W.scatta non fa niente: le scene restano prove (controllano che i momenti arrivino e che niente si tagli).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;
  if (!W.scatta) W.scatta = async function () {};
  function log(s) { try { console.log("[psc] " + s); } catch (e) {} }

  // D, solo per la foto: le schede della scelta col vetro scuro dell'app (stessi colori di css/styles.css, «🌙 Notte vivace»)
  var CSS_SCURO = [
    ".pz-sc.pz-scgioco{background:linear-gradient(160deg,#272e52,#161b31);color:#f4f5fb;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),inset 0 1px 0 rgba(255,255,255,.09),0 16px 32px -16px rgba(0,0,0,.9)}",
    ".pz-sc.pz-scgioco b{color:#f4f5fb}.pz-sc.pz-scgioco small{color:#a6acc8}",
    ".pz-sc.pz-scgioco .i{display:flex;align-items:center;justify-content:center;width:1.55em;height:1.55em;border-radius:24%;line-height:1;",
    "background:radial-gradient(circle at 32% 28%,rgba(255,79,134,.30),rgba(255,79,134,0) 68%),linear-gradient(160deg,#323a66,#1a1f3a);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12),0 8px 18px -10px rgba(224,34,90,.7)}",
    ".pz-sc.pz-scgioco .i span{font-size:.72em}",
    ".pz-sc.pz-scgioco.sel{background:linear-gradient(160deg,#3d2246,#211a33);box-shadow:inset 0 0 0 2px #ff4f86,0 0 26px -6px rgba(255,79,134,.65)}"
  ].join("");
  function metti(w, id, css) { var d = w.document, s = d.getElementById(id); if (!s) { s = d.createElement("style"); s.id = id; d.head.appendChild(s); } s.textContent = css; }
  function togli(w, id) { var s = w.document.getElementById(id); if (s) s.remove(); }
  // l'emoji della scheda dentro uno span, così sul fondo scuro sta nel suo quadratino
  function avvolgi(w) { [].forEach.call(w.document.querySelectorAll(".pz-sc.pz-scgioco .i"), function (i) { if (!i.querySelector("span,img")) { var s = w.document.createElement("span"); s.textContent = i.textContent; i.textContent = ""; i.appendChild(s); } }); }

  async function partita(premi, L, Al) {
    // (botCon di scene.js non è esportato: lo stesso giro qui)
    var w = await W.apriTel("Paky", { x: 0, spiaPrezzo: true, prima: function (w2) { w2.__imp = { formato: "tv", durata: "veloce", offerte: "vista", liv: "medio", nBot: 2 }; var f = w2.frameElement; if (f && L) { f.style.transform = "none"; f.style.width = L + "px"; f.style.height = Al + "px"; } } });
    W.misuraTel("Paky", L, Al, 0);
    await W.pzPronto(w);
    w.__tuttiPremi = Object.assign({}, w.SG_PREZZO_PREMI);   // (nomi e spiegazioni di tutti, per le foto di psi)
    Object.keys(w.SG_PREZZO_PREMI).forEach(function (k) { if (premi.indexOf(k) < 0) delete w.SG_PREZZO_PREMI[k]; });
    var tess = await W.aspetta(function () { return [].filter.call(w.document.querySelectorAll(".tessera"), function (t) { return /Prezzo è Giusto/.test(t.textContent); })[0]; }, 8000);
    if (!tess) no("in home non c'è la tessera del Prezzo è Giusto");
    tess.click(); await W.dorme(500);
    if (!await W.aspetta(function () { return W.clicca(w, /Contro il Bot/); }, 8000)) no("non trovo «Contro il Bot»");
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 8000)) no("la partita col Bot non parte");
    return w;
  }

  COPIONE.aggiungi("psc", { nome: "Foto: le scelte A, B, C, D del Prezzo è Giusto", fai: async function () {
    var o = W.__pfOpz || {}, misure = o.misure || [[360, 640], [412, 915]], coppie = o.coppie || [["ordine", "troppo"]], pre = o.pre || "dopo";
    var righe = [];
    for (var m = 0; m < misure.length; m++) for (var c = 0; c < coppie.length; c++) {
      var L = misure[m][0], Al = misure[m][1], tag = L + "x" + Al, coppia = coppie[c];
      var w = await partita(coppia, L, Al), d = w.document;
      var H = function () { return w.__prezzoH || {}; }, fatto = {}, fino = Date.now() + (o.ms || 420000), nB = 0, ultB = 0;
      while (Date.now() < fino) {
        var h = H(), f = h.fase + (h.sotto ? "." + h.sotto : "");
        // A: la riga sotto il prodotto, col pannello dell'offerta alzato
        if (f === "offerta.offri" && !fatto.A) {
          await W.dorme(1400); fatto.A = 1;
          var sotto = d.querySelector(".pz-sotto"), tx = sotto ? sotto.textContent : "";
          if (pre === "dopo" && !/si può offrire (1 €|10 centesimi) più di un altro/.test(tx)) no("A: la riga sotto il prodotto dice «" + tx + "»");
          if (sotto && sotto.getBoundingClientRect().bottom > (d.querySelector(".pz-pan.su") || { getBoundingClientRect: function () { return { top: 9999 }; } }).getBoundingClientRect().top + 1) no("A: la riga sotto il prodotto finisce sotto il pannello");
          righe.push(tag + " A: «" + tx + "»");
          await W.scatta("Paky", pre + "-A-offerta-" + tag);
        }
        // D: la scelta del gioco a premi (com'è, e col fondo scuro solo nella foto)
        if (f === "scegli" && !fatto["D" + h.k]) {
          fatto["D" + h.k] = 1; await W.dorme(1300);
          if (d.querySelector(".pz-sc.pz-scgioco")) {
            await W.scatta("Paky", pre + "-D-bianche-" + coppia.join("+") + "-" + tag);
            if (o.scuro) { avvolgi(w); metti(w, "provaScuro", CSS_SCURO); await W.dorme(250); await W.scatta("Paky", pre + "-D-scure-" + coppia.join("+") + "-" + tag); togli(w, "provaScuro"); }
          }
        }
        // C: il titolo del pannello del gioco a premi
        if (f === "premio.gioca" && h.premio && !fatto["C" + h.premio.tipo]) {
          fatto["C" + h.premio.tipo] = 1; await W.dorme(1500);
          var t = d.querySelector(".pz-pan.su .pz-pan-testa .tx"), tt = t ? t.textContent : "";
          var G = w.SG_PREZZO_PREMI && w.SG_PREZZO_PREMI[h.premio.tipo];
          if (pre === "dopo" && G && G.nome && tt.indexOf(G.nome) >= 0) no("C: nel pannello di «" + G.nome + "» c'è ancora il nome del gioco («" + tt + "»)");
          if (pre === "dopo" && G && G.aiuto && tt.indexOf(G.aiuto) < 0) no("C: nel pannello di «" + G.nome + "» non c'è la frase d'aiuto («" + tt + "»)");
          if (t && t.scrollWidth > t.clientWidth + 1 && !t.closest(".due")) no("C: il titolo del pannello è tagliato («" + tt + "»)");
          righe.push(tag + " C " + h.premio.tipo + ": «" + tt + "»");
          await W.scatta("Paky", pre + "-C-" + h.premio.tipo + "-" + tag);
        }
        // B: la Vetrina che si presenta, un pezzo alla volta (una foto ogni 1,4 s)
        if (f === "vetrina.mostra") {
          if (Date.now() - ultB > 1400 && nB < 8) {
            ultB = Date.now(); nB++;
            var tes = d.querySelector(".pz-sch .pz-tes"), vis = tes ? [].filter.call(tes.children, function (x) { return getComputedStyle(x).display !== "none" && getComputedStyle(x).visibility !== "hidden"; }) : [];
            if (pre === "dopo" && tes && vis.length) {
              // il gruppo dei pezzi già usciti al centro del suo spazio (± 12 px), e mai fuori dallo spazio
              // (misure senza le animazioni: il rimbalzo d'entrata e lo scivolamento allargano per un attimo il riquadro)
              var top0 = function (x) { return x.offsetParent === tes ? x.offsetTop : x.offsetTop - tes.offsetTop; }, rg = { top: 0, bottom: tes.clientHeight }, su = Math.min.apply(null, vis.map(top0)), giu = Math.max.apply(null, vis.map(function (x) { return top0(x) + x.offsetHeight; }));
              var sopra = su - rg.top, sotto2 = rg.bottom - giu;
              if (su < rg.top - 1 || giu > rg.bottom + 1) no("B: i pezzi escono dallo spazio della vetrina");
              if (Math.abs(sopra - sotto2) > 24 && d.querySelectorAll(".pz-tes > *").length > vis.length) righe.push(tag + " B: non al centro (sopra " + Math.round(sopra) + ", sotto " + Math.round(sotto2) + ")");
            }
            await W.scatta("Paky", pre + "-B-vetrina-" + tag + "-" + nB);
          }
        } else if (nB) break;   // finita la presentazione della Vetrina: basta così
        // si gioca: offre quasi giusto (così vince l'Offerta e sceglie), mai «Avanti»
        try { await W.PZ.agisci("Paky", { avanti: f === "punti", offerta: function (pr) { return pr; } }); } catch (e) {}
        await W.dorme(250);
      }
      if (!fatto.A) no(tag + ": non si arriva all'Offerta");
      if (!nB) no(tag + ": non si arriva alla Vetrina finale (fase " + H().fase + "." + H().sotto + ")");
      log(tag + " " + coppia.join("+") + " fatto");
    }
    return righe.join(" · ") + (W.erroriTel().length ? " · ERRORI: " + W.erroriTel().slice(0, 3).join(" / ") : "");
  } });

  // ===================== psi: le immagini proposte, sulla scheda della scelta =====================
  var COPPIE_I = [["piuomeno", "alpinista"], ["ordine", "troppo"], ["plinko", "spesa"], ["cassaforte", "dadi"], ["mirino", "prova5"], ["togli", "piuomeno"]];
  // W.__pfOpz = { strade: { foto: "http://localhost:8993/immagini/foto/", disegni: "http://localhost:8993/immagini/disegni/" },
  //   est: { foto: ".jpg", disegni: ".svg" }, giri: [["emoji", false], ["foto", true], …] (strada, scure), misure: [[360, 640]] }
  // Una partita nuova per ogni giro: la scelta dura 15 s, e in un giro si fanno 6 foto (le coppie di COPPIE_I).
  COPIONE.aggiungi("psi", { nome: "Foto: le immagini dei giochi a premi sulla scheda della scelta", fai: async function () {
    var o = W.__pfOpz || {}, misure = o.misure || [[360, 640]], strade = o.strade || {}, est = o.est || {};
    var giri = o.giri || [["emoji", false], ["emoji", true], ["foto", false], ["foto", true], ["disegni", false], ["disegni", true]];
    var n = 0, guai = [];
    for (var m = 0; m < misure.length; m++) for (var gi = 0; gi < giri.length; gi++) {
      var L = misure[m][0], Al = misure[m][1], tag = L + "x" + Al, st = giri[gi][0], scure = !!giri[gi][1];
      var w = await partita(["cassaforte", "dadi"], L, Al), d = w.document;
      var H = function () { return w.__prezzoH || {}; }, fino = Date.now() + 300000;
      // fino alla scelta (Paky vince l'Offerta: offre il prezzo giusto)
      while (Date.now() < fino && !(H().fase === "scegli" && d.querySelector(".pz-pan.su .pz-sc.pz-scgioco"))) {
        try { await W.PZ.agisci("Paky", { avanti: false, offerta: function (pr) { return pr; } }); } catch (e) {}
        await W.dorme(250);
      }
      if (!d.querySelector(".pz-pan.su .pz-sc.pz-scgioco")) { guai.push(tag + " " + st + ": non si arriva alla scelta"); continue; }
      await W.dorme(900);
      var bott = [].slice.call(d.querySelectorAll(".pz-pan.su .pz-sc.pz-scgioco"));
      if (scure) metti(w, "provaScuro", CSS_SCURO); else togli(w, "provaScuro");
      for (var c = 0; c < COPPIE_I.length; c++) {
        COPPIE_I[c].forEach(function (tipo, j) {
          var G = (w.__tuttiPremi || {})[tipo] || {}, b = bott[j]; if (!b) return;
          b.innerHTML = "";
          var i = d.createElement("span"); i.className = "i";
          if (st === "emoji") { var sp = d.createElement("span"); sp.textContent = G.icona || "🎁"; i.appendChild(sp); }
          else {
            // l'immagine al posto dell'emoji: quadrata, grande come la tessera scura dell'emoji (1,55 volte la sua misura)
            var im = d.createElement("img"); im.src = strade[st] + tipo + (est[st] || ".png");
            im.style.cssText = "display:block;width:1.55em;height:1.55em;object-fit:cover;border-radius:" + (st === "disegni" ? "0" : "24%") + ";box-shadow:" + (st === "disegni" ? "none" : (scure ? "inset 0 0 0 1px rgba(255,255,255,.12),0 6px 16px -8px rgba(0,0,0,.8)" : "0 3px 10px rgba(0,0,0,.28)"));
            i.style.background = "none"; i.style.boxShadow = "none"; i.style.width = "auto"; i.style.height = "auto";
            i.appendChild(im);
          }
          b.appendChild(i);
          var bb = d.createElement("b"); bb.textContent = G.nome || tipo; b.appendChild(bb);
          var sm = d.createElement("small"); sm.textContent = G.spiega || G.regola || ""; b.appendChild(sm);
        });
        await W.aspetta(function () { return [].every.call(d.querySelectorAll(".pz-sc.pz-scgioco img"), function (x) { return x.complete && x.naturalWidth > 0; }); }, 8000);
        await W.dorme(150);
        if (!d.querySelector(".pz-pan.su .pz-sc.pz-scgioco")) { guai.push(tag + " " + st + (scure ? " scure" : " bianche") + ": la scelta è finita alla coppia " + (c + 1)); break; }
        [].forEach.call(d.querySelectorAll(".pz-sc.pz-scgioco img"), function (x) { if (!x.naturalWidth) guai.push("immagine che non arriva: " + x.src); });
        await W.scatta("Paky", "psi-" + st + "-" + (scure ? "scure" : "bianche") + "-" + (c + 1) + "-" + tag); n++;
      }
      togli(w, "provaScuro");
      log(tag + " " + st + (scure ? " scure" : " bianche") + " fatto");
    }
    if (guai.length) no(guai.join(" · "));
    return n + " foto";
  } });
})();
