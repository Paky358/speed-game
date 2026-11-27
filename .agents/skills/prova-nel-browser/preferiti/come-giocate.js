// 🎮 «COME GIOCATE?» (26 nov 2026, chat «🎮 Come giocate?», il proprietario: «i rettangoli sono un po' piccoli… non le voglio
// giganti… togliamo l'avatar sotto»). Sullo stesso telefono, senza rete: la schermata di 4 giochi con un numero di modi diverso
// (Scarabocchio 2, Linea del tempo 3, Calcio Biliardo 5, Calcio Biliardo con la Compagnia 6) su 360x640, 360x780 e 412x915.
// cgf: le foto (con prezzo/difetti/foto.js: W.scatta), e intanto le misure in W.__pfLog.
// cg1: la prova. Nessun avatar sotto i riquadri; i riquadri alti uguali in TUTTI i giochi e su tutti i telefoni (mai sotto 84 px,
//      mai sopra 96: non si allungano per riempire); titolo e frase della stessa misura dappertutto; dove ci stanno, il blocco
//      sta al centro dello spazio (sopra e sotto lo stesso vuoto, ±12 px) e niente scorre; dove non ci stanno (360x640 da 5
//      modi) si scorre e «Come si gioca» resta in fondo; ogni riquadro ha il testo intero (niente tagliato).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  if (!W.scatta) W.scatta = async function () {};
  if (!W.misuraTel) W.misuraTel = function (nome, L, Al, x) {
    var f = document.getElementById("tel-" + nome); if (!f) return;
    f.style.transform = "none"; f.style.width = L + "px"; f.style.height = Al + "px"; f.style.left = (x || 0) + "px"; f.style.top = "0px";
    try { f.contentWindow.dispatchEvent(new f.contentWindow.Event("resize")); } catch (e) {}
  };
  var GIOCHI = [["Scarabocchio", "scarabocchio", 0], ["La linea del tempo", "linea", 0], ["Calcio Biliardo", "calcio", 0], ["Calcio Biliardo", "calcio-comp", 1]];
  var TEL = [[360, 640], [360, 780], [412, 915]];
  function conComp(w) {
    var ora = Date.now();
    w.localStorage.setItem("sg-compagnie", JSON.stringify([{ c: "KFRTPQ", n: "Quelli del giovedì", e: "🍻", rv: 0, t: ora - 9000, u: ora - 9000 }]));
  }
  function misure(w) {
    var d = w.document, s = d.querySelector(".schermata"), gr = d.querySelector(".modo-scelta");
    if (!s || !gr) return null;
    var tess = [].map.call(gr.querySelectorAll(".modo-grande"), function (b) {
      var r = b.getBoundingClientRect(), t = b.querySelector(".mg-tit"), so = b.querySelector(".mg-sotto");
      var cs = w.getComputedStyle(t), cs2 = so ? w.getComputedStyle(so) : null;
      return { testo: b.innerText.replace(/\s+/g, " ").trim(), h: Math.round(r.height), alto: Math.round(r.top), basso: Math.round(r.bottom),
        tit: cs.fontSize, sot: cs2 ? cs2.fontSize : "", tagliato: b.scrollHeight > b.clientHeight + 1 || (so && so.scrollHeight > so.clientHeight + 1) };
    });
    var c = gr.parentNode, rc = c.getBoundingClientRect(), rg = gr.getBoundingClientRect();
    var piede = d.querySelector(".schermata .piede"), rp = piede ? piede.getBoundingClientRect() : null;
    var H = w.innerHeight;
    return { tess: tess, avatar: !!d.querySelector(".modo-avatar"), sopra: Math.round(rg.top - rc.top + c.scrollTop), sotto: Math.round(c.scrollHeight - (rg.bottom - rc.top + c.scrollTop)),
      scorre: c.scrollHeight > c.clientHeight + 1 || d.documentElement.scrollHeight > H + 1, piedeIn: rp ? rp.bottom <= H + 1 && rp.top >= 0 : false, H: H };
  }
  async function giro(fai) {
    var dati = [];
    for (var q = 0; q < TEL.length; q++) for (var k = 0; k < GIOCHI.length; k++) {
      var L = TEL[q][0], Al = TEL[q][1], gi = GIOCHI[k], nm = "T" + q + k;
      var P = await W.apriTel(nm, { x: 0, salaSempre: true, prima: gi[2] ? conComp : null });
      W.misuraTel(nm, L, Al, 1150);
      await W.dorme(700);
      var tess = await W.aspetta(function () { return A.tessera(P, gi[0]); }, 8000); if (!tess) no("non trovo la tessera " + gi[0]);
      tess.click();
      if (!await W.aspetta(function () { return P.document.querySelector(".modo-scelta"); }, 5000)) no(gi[0] + ": non si apre «Come giocate?»");
      await W.dorme(1100);
      var m = misure(P); m.gioco = gi[1]; m.tel = L + "x" + Al; dati.push(m);
      await fai(nm, gi[1] + "-" + L + "x" + Al, m);
      var f = document.getElementById("tel-" + nm); if (f) f.remove();
    }
    return dati;
  }

  COPIONE.aggiungi("cgf", { nome: "Foto: «Come giocate?» in 4 giochi su 3 telefoni", fai: async function () {
    var diario = W.__pfLog = [];
    await giro(async function (nm, file, m) { diario.push({ file: file, m: m }); await W.scatta(nm, file); });
    return diario.length + " foto";
  } });

  COPIONE.aggiungi("cg1", { nome: "«Come giocate?»: riquadri uguali, niente avatar, al centro", fai: async function () {
    var dati = await giro(async function () {}), err = [], hs = {}, tit = {}, sot = {};
    dati.forEach(function (m) {
      var chi = m.gioco + " " + m.tel;
      if (m.avatar) err.push(chi + ": c'è ancora l'avatar");
      m.tess.forEach(function (t) {
        hs[t.h] = 1; tit[t.tit] = 1; if (t.sot) sot[t.sot] = 1;
        if (t.h < 84 || t.h > 96) err.push(chi + ": riquadro alto " + t.h + " px («" + t.testo.slice(0, 30) + "»)");
        if (t.tagliato) err.push(chi + ": testo tagliato in «" + t.testo.slice(0, 30) + "»");
      });
      var puoScorrere = m.tel === "360x640" && m.tess.length >= 5;   // (sul telefono basso da 5 modi in su si scorre: meglio che rimpicciolire)
      if (!puoScorrere && m.scorre) err.push(chi + ": scorre (" + m.tess.length + " riquadri)");
      if (!m.scorre && Math.abs(m.sopra - m.sotto) > 12) err.push(chi + ": non è al centro (sopra " + m.sopra + ", sotto " + m.sotto + ")");
      if (!m.piedeIn) err.push(chi + ": «Come si gioca» non si vede");
    });
    if (Object.keys(hs).length > 2) err.push("riquadri di altezze diverse: " + Object.keys(hs).join(", "));
    if (Object.keys(tit).length > 1) err.push("titoli di misure diverse: " + Object.keys(tit).join(", "));
    if (Object.keys(sot).length > 1) err.push("frasi di misure diverse: " + Object.keys(sot).join(", "));
    if (err.length) no(err.join(" · "));
    return dati.length + " schermate · riquadri " + Object.keys(hs).join("/") + " px · titolo " + Object.keys(tit).join("/") + " · frase " + Object.keys(sot).join("/");
  } });
})();
