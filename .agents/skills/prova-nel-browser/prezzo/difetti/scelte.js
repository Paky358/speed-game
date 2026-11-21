// LE SCELTE DEL PROPRIETARIO SUL PREZZO È GIUSTO (21 nov 2026, novità v395). Si carica dopo prezzo/base.js e prezzo/difetti/scene.js.
// psc: una partita «Contro il Bot» per misura, fotografata e controllata nei momenti delle scelte:
//   A = la riga sotto il prodotto nell'Offerta a vista («si può offrire 1 € più di un altro», o 10 centesimi);
//   B = la Vetrina finale che si presenta un pezzo alla volta (al centro, non più in alto col vuoto sotto);
//   C = il titolo del pannello nei giochi a premi (una frase d'aiuto, non più il nome del gioco);
//   D = la scelta del gioco a premi: schede scure della Notte vivace, coi disegni dei giochi al posto delle emoji.
// psi: per ogni coppia di giochi a premi (tutti e 11) una partita: la scelta, le regole e la testata del gioco scelto,
//   tutte coi disegni di js/games/prezzo-disegni.js (W.__pfOpz.misure, di partenza 360x640 e 412x915).
// Con prova.js W.scatta non fa niente: le scene restano prove (controllano i momenti, i disegni e che niente si tagli).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;
  if (!W.scatta) W.scatta = async function () {};
  function log(s) { try { console.log("[psc] " + s); } catch (e) {} }

  // i disegni dei giochi a premi: c'è l'immagine (non l'emoji), è arrivata, è quadrata, non è minuscola e non esce dal suo riquadro
  function guaiDisegni(w, sel, dove, quanti) {
    var g = [], ims = [].slice.call(w.document.querySelectorAll(sel));
    if (ims.length < (quanti || 1)) g.push(dove + ": " + ims.length + " disegni invece di " + (quanti || 1));
    ims.forEach(function (im) {
      var r = im.getBoundingClientRect(), box = im.closest(".pz-sc,.pz-gioco,.pz-intro,.pz-testa"), rb = box ? box.getBoundingClientRect() : r;
      if (!im.complete || !im.naturalWidth) g.push(dove + ": il disegno non arriva");
      if (r.width < 20 || Math.abs(r.width - r.height) > 1) g.push(dove + ": disegno di " + Math.round(r.width) + "x" + Math.round(r.height));
      if (r.left < rb.left - 1 || r.right > rb.right + 1 || r.top < rb.top - 1 || r.bottom > rb.bottom + 1) g.push(dove + ": il disegno esce dal suo riquadro");
    });
    return g;
  }
  // D: le schede della scelta sono scure (il vetro #272e52 → #161b31) con le scritte chiare
  function guaiScure(w) {
    var g = [];
    [].forEach.call(w.document.querySelectorAll(".pz-pan.su .pz-sc.pz-scgioco"), function (b) {
      var cs = getComputedStyle(b), tit = b.querySelector("b");
      if (cs.backgroundImage.indexOf("rgb(39, 46, 82)") < 0) g.push("D: la scheda non è scura (" + cs.backgroundImage.slice(0, 60) + ")");
      if (tit && getComputedStyle(tit).color !== "rgb(244, 245, 251)") g.push("D: il nome sulla scheda non è chiaro (" + getComputedStyle(tit).color + ")");
      if (b.scrollHeight > b.clientHeight + 1) g.push("D: la scheda è tagliata");
    });
    return g;
  }

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
        // D: la scelta del gioco a premi, schede scure coi disegni
        if (f === "scegli" && !fatto["D" + h.k]) {
          fatto["D" + h.k] = 1; await W.dorme(1300);
          if (d.querySelector(".pz-pan.su .pz-sc.pz-scgioco")) {
            if (pre === "dopo") { var gd = guaiScure(w).concat(guaiDisegni(w, ".pz-pan.su .pz-sc.pz-scgioco .i.dis img.pz-ic", "D scelta", d.querySelectorAll(".pz-pan.su .pz-sc.pz-scgioco").length)); if (gd.length) no(tag + " " + gd.join("; ")); }
            await W.scatta("Paky", pre + "-D-scelta-" + coppia.join("+") + "-" + tag);
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

  // ===================== psi: i disegni dei giochi a premi nel gioco vero =====================
  // Una partita per ogni coppia (le 6 coppie coprono gli 11 giochi): Paky vince l'Offerta (offre il prezzo giusto) e sceglie;
  // foto e controlli della scelta (schede scure coi disegni), delle regole del gioco scelto e della sua testata mentre si gioca.
  var COPPIE_I = [["piuomeno", "alpinista"], ["ordine", "troppo"], ["plinko", "spesa"], ["cassaforte", "dadi"], ["mirino", "prova5"], ["togli", "piuomeno"]];
  COPIONE.aggiungi("psi", { nome: "Prezzo: i disegni dei giochi a premi nella scelta (schede scure), nelle regole e nella testata", fai: async function () {
    var o = W.__pfOpz || {}, misure = o.misure || [[360, 640], [412, 915]], coppie = o.coppie || COPPIE_I;
    var n = 0, guai = [], visti = {};
    for (var m = 0; m < misure.length; m++) for (var c = 0; c < coppie.length; c++) {
      var L = misure[m][0], Al = misure[m][1], tag = L + "x" + Al, coppia = coppie[c];
      var w = await partita(coppia, L, Al), d = w.document;
      var H = function () { return w.__prezzoH || {}; }, fino = Date.now() + 300000, fatto = {};
      while (Date.now() < fino && !fatto.gioco) {
        var h = H(), f = h.fase + (h.sotto ? "." + h.sotto : "");
        if (f === "scegli" && !fatto.scelta && d.querySelector(".pz-pan.su .pz-sc.pz-scgioco")) {
          fatto.scelta = 1; await W.dorme(1200);
          guai = guai.concat(guaiScure(w).map(function (x) { return tag + " " + x; }), guaiDisegni(w, ".pz-pan.su .pz-sc.pz-scgioco .i.dis img.pz-ic", tag + " scelta " + coppia.join("+"), 2));
          await W.scatta("Paky", "psi-scelta-" + coppia.join("+") + "-" + tag); n++;
        }
        if (f === "premio.intro" && h.premio && !fatto.regole) {
          fatto.regole = 1; await W.dorme(1500);
          guai = guai.concat(guaiDisegni(w, ".pz-sch .pz-intro .i.dis img.pz-ic", tag + " regole " + h.premio.tipo));
          await W.scatta("Paky", "psi-regole-" + h.premio.tipo + "-" + tag); n++;
        }
        if (f === "premio.gioca" && h.premio && !fatto.gioco) {
          fatto.gioco = 1; await W.dorme(1500); visti[h.premio.tipo] = 1;
          // la testata col disegno (col pannello alzato fin sotto il titolo si vede lo stesso: sta sopra il pannello)
          guai = guai.concat(guaiDisegni(w, ".pz-sch .pz-testa-ic .i.dis img.pz-ic", tag + " testata " + h.premio.tipo));
          await W.scatta("Paky", "psi-gioco-" + h.premio.tipo + "-" + tag); n++;
          break;
        }
        // si gioca: Paky offre il prezzo giusto (vince l'Offerta e sceglie), mai «Avanti» tranne sui punti
        try { await W.PZ.agisci("Paky", { avanti: f === "punti", offerta: function (pr) { return pr; } }); } catch (e) {}
        await W.dorme(250);
      }
      if (!fatto.scelta) guai.push(tag + " " + coppia.join("+") + ": non si arriva alla scelta (fase " + H().fase + "." + H().sotto + ")");
      if (!fatto.gioco) guai.push(tag + " " + coppia.join("+") + ": non si arriva a giocare (fase " + H().fase + "." + H().sotto + ")");
      log(tag + " " + coppia.join("+") + " fatto");
    }
    if (guai.length) no(guai.slice(0, 8).join(" · "));
    return n + " foto · giocati: " + Object.keys(visti).join(", ") + (W.erroriTel().length ? " · ERRORI: " + W.erroriTel().slice(0, 3).join(" / ") : "");
  } });
})();
