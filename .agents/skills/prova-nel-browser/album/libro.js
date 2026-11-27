// 📖 PROTOTIPO DEL «LIBRO DA SFOGLIARE» (28 nov 2026, PROPOSTA per l'album della Mini Asta; il gioco NON cambia). Si carica dopo
// album/prototipo.js e album/scudetti.js e lavora nel telefono finto di Paky (le figurine prese e i numeri sono finti).
// La copertina della stagione si tocca e si apre; la prima pagina è l'indice con le squadre su carta da album; ogni squadra ha la sua
// pagina con le caselle numerate e le figurine attaccate un po' storte con l'ombra; si sfoglia col dito (la pagina che gira, il rumore
// della carta, una vibrazione leggera). Tutte le animazioni solo con transform e opacity.
// Uso: await LIB.copertina(); await LIB.apri(); LIB.indice(); LIB.pagina("Inter"); LIB.gira(+1, fermaA); LIB.vola(c, fermaA)
(function () {
  "use strict";
  var W = window, LIB = W.LIB = {};
  // l'icona dell'album (nostra): un album chiuso blu notte coi cantonali d'oro e una figurina d'oro sopra, un po' storta
  LIB.ICONA = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="ia-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2c3d86"/><stop offset="1" stop-color="#141c45"/></linearGradient>' +
    '<linearGradient id="ia-o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b8"/><stop offset=".35" stop-color="#f2c230"/><stop offset=".7" stop-color="#b07c1c"/><stop offset="1" stop-color="#f7d871"/></linearGradient></defs>' +
    '<rect x="9" y="8" width="44" height="52" rx="5" fill="#0b0f26"/>' +
    '<rect x="8" y="6" width="44" height="52" rx="5" fill="url(#ia-c)"/><rect x="8" y="6" width="8" height="52" rx="4" fill="#0f1636"/>' +
    '<rect x="16.5" y="6" width="1.4" height="52" fill="url(#ia-o)" opacity=".8"/>' +
    '<path d="M44 6 L52 6 Q52 6 52 11 L52 14 Z" fill="url(#ia-o)"/><path d="M44 58 L52 58 L52 50 Z" fill="url(#ia-o)"/>' +
    '<rect x="21" y="12" width="26" height="6" rx="1.5" fill="#0f1636" stroke="url(#ia-o)" stroke-width="1"/>' +
    '<g transform="rotate(-11 40 38)"><rect x="27" y="23" width="24" height="31" rx="3" fill="url(#ia-o)" stroke="#7a5310" stroke-width="1"/>' +
    '<rect x="30" y="26" width="18" height="18" rx="2" fill="#2a4fb0"/><circle cx="39" cy="33" r="4.2" fill="#f6d9b8"/><path d="M32.5 44 C33 39 36 37.5 39 37.5 C42 37.5 45 39 45.5 44 Z" fill="#f4f2ec"/>' +
    '<rect x="30" y="46" width="18" height="4" rx="1" fill="#7a5310" opacity=".55"/></g></svg>';
  var P = null, A = null, C = null, el = null, ab = null, S = null;
  function stile() {
    if (P.document.getElementById("lib-stile")) return;
    var s = P.document.createElement("style"); s.id = "lib-stile";
    s.textContent = [
      ".lib .contenuto{display:flex;flex-direction:column}",
      ".lib-scena{position:relative;flex:1;min-height:0;perspective:1600px;margin:0 -2px}",
      ".lib-foglio{position:absolute;inset:0;border-radius:6px 14px 14px 6px;overflow:hidden;transform-origin:0 50%;backface-visibility:hidden;will-change:transform}",
      // la copertina della stagione
      ".lib-cop{background:radial-gradient(130% 90% at 30% 10%,#2c3d86,#141c45 55%,#0b0f26);box-shadow:inset 10px 0 0 #0b1030,inset 12px 0 0 rgba(242,194,48,.55),0 24px 40px -18px #000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center}",
      ".lib-cop:before{content:'';position:absolute;inset:14px 14px 14px 24px;border:1.5px solid rgba(242,194,48,.7);border-radius:8px;pointer-events:none}",
      ".lib-cop .an{font-family:var(--o-tit);font-weight:800;letter-spacing:.2em;font-size:.8rem;color:#f2c230}",
      ".lib-cop .ti{font-family:var(--o-tit);font-weight:800;font-size:2.1rem;line-height:1;background:linear-gradient(180deg,#fff3b8,#f2c230 45%,#a8761a);-webkit-background-clip:text;background-clip:text;color:transparent}",
      ".lib-cop .st{font-weight:800;font-size:1.05rem;color:#dfe3f7}",
      ".lib-cop .fig{width:34%;transform:rotate(-7deg);filter:drop-shadow(0 10px 14px rgba(0,0,0,.55))}",
      ".lib-cop .fig canvas{width:100%;height:auto;display:block}",
      ".lib-cop .tc{font-size:.85rem;color:#a6acc8;margin-top:6px}",
      ".lib-cop .pc{font-weight:900;font-size:.95rem;color:#0b0f26;background:linear-gradient(180deg,#fff3b8,#f2c230);border-radius:99px;padding:4px 14px}",
      // la carta delle pagine
      ".lib-carta{background:linear-gradient(90deg,rgba(0,0,0,.16),rgba(0,0,0,0) 7%),radial-gradient(120% 80% at 60% 20%,#fbf6ea,#efe5cf 70%,#e6d9bd);color:#2b2418;box-shadow:0 20px 34px -18px #000;padding:14px 14px 12px 20px;display:flex;flex-direction:column}",
      ".lib-carta .tt{display:flex;align-items:center;gap:10px;margin:0 0 10px}.lib-carta .tt b{font-family:var(--o-tit);font-weight:800;font-size:1.35rem}.lib-carta .tt span{margin-left:auto;font-weight:900;font-size:.9rem;color:#6b5a3a}",
      ".lib-carta .tt .scudetto{width:34px;height:auto;flex:0 0 auto}",
      ".lib-carta .pn{position:absolute;bottom:6px;right:14px;font-size:.72rem;font-weight:800;color:#8a7a5a}",
      ".lib-ind{display:grid;grid-template-columns:repeat(var(--col,4),minmax(0,1fr));gap:6px 4px;flex:1;align-content:start}",
      ".lib-ind button{font:inherit;border:0;background:none;color:inherit;display:flex;flex-direction:column;align-items:center;gap:1px;padding:2px 0}",
      ".lib-ind .scudetto{width:var(--sw,42px);height:auto;filter:drop-shadow(0 3px 3px rgba(60,40,10,.35))}",
      ".lib-ind i.pg{font-size:.58rem;opacity:.75}",
      ".lib-ind b{font-size:.72rem;font-weight:800;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lib-ind i{font-style:normal;font-size:.66rem;font-weight:800;color:#8a7a5a}",
      ".lib-gr{display:grid;grid-template-columns:repeat(var(--col,3),minmax(0,1fr));gap:9px 8px;flex:1;align-content:start}",
      ".lib-cas{position:relative;aspect-ratio:1/1.36;min-width:0;border-radius:6px;border:1.5px dashed rgba(107,90,58,.45);background:rgba(107,90,58,.06);display:flex;flex-direction:column;align-items:center;justify-content:center}",
      ".lib-cas .n{font-family:var(--o-tit);font-weight:800;font-size:1.2rem;color:rgba(107,90,58,.6);line-height:1}.lib-cas .nm{font-size:.62rem;font-weight:800;color:rgba(107,90,58,.7);max-width:96%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}",
      ".lib-cas .fig{position:absolute;inset:-2%;transform:rotate(var(--r,0deg));filter:drop-shadow(1px 3px 2px rgba(60,40,10,.45))}",
      ".lib-cas .fig canvas{width:100%;height:100%;display:block}",
      ".lib-retro{background:linear-gradient(270deg,rgba(0,0,0,.16),rgba(0,0,0,0) 7%),radial-gradient(120% 80% at 40% 20%,#f6efdd,#e8dcc0);transform:rotateY(180deg)}",
      ".lib-dito{position:absolute;bottom:10px;left:0;right:0;text-align:center;font-size:.78rem;font-weight:800;color:#8a7a5a}",
      ".lib-vola{position:fixed;z-index:60;pointer-events:none;will-change:transform,opacity}.lib-vola canvas{width:100%;height:auto;display:block;filter:drop-shadow(0 16px 20px rgba(0,0,0,.5))}",
      ".lib-luce{position:absolute;inset:-12%;border-radius:12px;background:radial-gradient(circle,rgba(255,226,120,.75),rgba(255,226,120,0) 70%);opacity:0;pointer-events:none}"
    ].join("\n");
    P.document.head.appendChild(s);
  }
  LIB.prepara = async function () {
    await W.ALB.prepara(); P = W.ALB.P(); A = W.ALB.A(); C = P.SGCuore; el = C.el; stile();
    if (!P.SG_SCUDETTI) P.eval(await (await fetch("/.agents/skills/prova-nel-browser/album/scudetti.js?" + Date.now())).text());
  };
  function figura(c, w) { var src = A.figurinaCanvas(c, null, w, false); if (!src) return null; var cv = P.document.createElement("canvas"); cv.width = src.width; cv.height = src.height; cv.getContext("2d").drawImage(src, 0, 0); return cv; }
  function schermo() {
    var s = C.schermata({ icona: "", titolo: "Album", sotto: "Mini Asta · Serie A di oggi", indietro: function () {} });
    s.classList.add("lib"); s._menu = "trofei";
    var ic = s.querySelector(".testa span"); if (ic) { ic.textContent = ""; ic.innerHTML = LIB.ICONA; ic.style.width = "40px"; ic.style.display = "inline-block"; }
    s._contenuto.appendChild(el("div", { class: "alb-tab" }, [ el("button", { text: "🏆 Trofei" }), el("button", { class: "on", html: '<span style="display:inline-block;width:20px;vertical-align:-4px">' + LIB.ICONA + "</span> Album" }) ]));
    var sc = el("div", { class: "lib-scena" }); s._contenuto.appendChild(sc); S = { s: s, scena: sc };
    C.mostra(s); return sc;
  }
  function conta(l) { var p = 0; l.forEach(function (c) { if (c.preso) p++; }); return p; }
  // la copertina della stagione
  LIB.copertina = function () {
    ab = W.ALB.album(); var sc = schermo(), tot = ab.tutte.length, p = conta(ab.tutte);
    var top = ab.tutte.filter(function (c) { return c.preso && c.met === "oro"; })[0] || ab.tutte[0], f = el("div", { class: "fig" });
    var cop = el("div", { class: "lib-foglio lib-cop" }, [ el("div", { class: "an", text: "ALBUM DELLA MINI ASTA" }), el("div", { class: "ti", text: "Serie A" }), el("div", { class: "st", text: "di oggi" }), f,
      el("div", { class: "pc", text: p + " / " + tot + " figurine" }), el("div", { class: "tc", text: "👆 Tocca per aprire" }) ]);
    sc.appendChild(cop); S.cop = cop;
    P.requestAnimationFrame(function () { var cv = figura(top, Math.round(sc.clientWidth * 0.34)); if (cv) f.appendChild(cv); });
  };
  function paginaIndice() {
    var pg = el("div", { class: "lib-foglio lib-carta" }, [ el("div", { class: "tt" }, [ el("b", { text: "Indice" }), el("span", { text: conta(ab.tutte) + " / " + ab.tutte.length }) ]) ]);
    pg.appendChild(el("div", { class: "lib-ind" }, ab.squadre.map(function (sq, i) {
      var l = ab.per[sq]; return el("button", { html: P.SG_SCUDETTI.svg(sq) }, [ el("b", { text: sq }), el("i", { text: conta(l) + "/" + l.length }), el("i", { class: "pg", text: "pag. " + (i + 2) }) ]);
    })));
    pg.appendChild(el("div", { class: "pn", text: "1" }));
    return pg;
  }
  function paginaSquadra(sq, i, conFig) {
    var l = ab.per[sq], pg = el("div", { class: "lib-foglio lib-carta" }, [ el("div", { class: "tt", html: P.SG_SCUDETTI.svg(sq) }, [ el("b", { text: sq }), el("span", { text: conta(l) + " / " + l.length }) ]) ]);
    var col = l.length > 15 ? 4 : 3, gr = el("div", { class: "lib-gr", style: "--col:" + col });
    l.forEach(function (c) {
      var cas = el("div", { class: "lib-cas" }, [ el("div", { class: "n", text: c.num }), el("div", { class: "nm", text: c.nome }) ]); cas.__c = c;
      if (c.preso && conFig !== false) { var r = ((c.num * 37) % 7 - 3) * 0.9; cas.appendChild(el("div", { class: "fig", style: "--r:" + r.toFixed(1) + "deg" })); }
      gr.appendChild(cas);
    });
    pg.appendChild(gr); pg.appendChild(el("div", { class: "pn", text: String(i + 2) }));
    return pg;
  }
  function adatta(pg) {   // (la pagina intera nello spazio: senza scorrere né uscire)
    var gr = pg.querySelector(".lib-gr, .lib-ind"); if (!gr) return;
    function ci() { return pg.scrollHeight <= pg.clientHeight + 1; }
    if (gr.classList.contains("lib-ind")) { var tent = [[4, 42], [4, 36], [4, 32], [5, 32], [5, 28]]; for (var j = 0; j < tent.length; j++) { gr.style.setProperty("--col", tent[j][0]); gr.style.setProperty("--sw", tent[j][1] + "px"); if (ci()) return; } return; }
    for (var k = 3; k <= 6; k++) { gr.style.setProperty("--col", k); if (ci()) return; }
  }
  function riempi(pg) {
    adatta(pg);   // le figurine attaccate, disegnate dopo (una per fotogramma nel gioco vero)
    [].forEach.call(pg.querySelectorAll(".lib-cas .fig"), function (f) { if (f.firstChild) return; var cv = figura(f.parentNode.__c, Math.round(f.parentNode.clientWidth)); if (cv) f.appendChild(cv); });
  }
  // la copertina che si apre (gira a sinistra come una pagina) e sotto l'indice
  LIB.apri = function (ferma) {
    var ind = paginaIndice(); S.scena.insertBefore(ind, S.cop); S.ind = ind; adatta(ind);
    return anima(S.cop, 0, -178, 700, ferma);
  };
  LIB.indice = function () { ab = W.ALB.album(); var sc = schermo(); S.ind = paginaIndice(); sc.appendChild(S.ind); adatta(S.ind); };
  LIB.pagina = function (sq) { ab = W.ALB.album(); var sc = schermo(), pg = paginaSquadra(sq, ab.squadre.indexOf(sq)); sc.appendChild(pg); riempi(pg); S.pg = pg; S.sq = sq; return pg; };
  // si sfoglia: la pagina di sopra gira attorno al bordo sinistro e scopre quella dopo (transform), col fruscio e un colpetto
  LIB.preparaDopo = function () { var i = ab.squadre.indexOf(S.sq); S.dopo = paginaSquadra(ab.squadre[(i + 1) % ab.squadre.length], i + 1); S.scena.insertBefore(S.dopo, S.pg); riempi(S.dopo); };
  LIB.gira = function (ferma) {
    var i = ab.squadre.indexOf(S.sq); if (!S.dopo) LIB.preparaDopo(); var dopo = S.dopo; S.dopo = null;
    var retro = el("div", { class: "lib-foglio lib-retro" }); S.pg.appendChild(retro);
    fruscio(); try { if (P.navigator.vibrate) P.navigator.vibrate(8); } catch (e) {}
    return anima(S.pg, 0, -178, 650, ferma).then(function () { if (ferma == null) { S.pg.remove(); S.pg = dopo; S.sq = ab.squadre[(i + 1) % ab.squadre.length]; } });
  };
  function anima(nodo, da, a, ms, ferma) {   // rotateY da→a in ms (ferma: si ferma a quella frazione, per la foto)
    nodo.style.zIndex = 5;
    return new Promise(function (ok) {
      var t0 = P.performance.now();
      (function passo(t) {
        var k = Math.min(1, (t - t0) / ms); if (ferma != null && k >= ferma) k = ferma;
        var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, ang = da + (a - da) * e;
        nodo.style.transform = "rotateY(" + ang.toFixed(2) + "deg)";
        if ((ferma != null && k >= ferma) || k >= 1) return ok();
        P.requestAnimationFrame(passo);
      })(t0);
    });
  }
  function fruscio() {   // il rumore della carta: un soffio filtrato di un quarto di secondo
    try {
      var ctx = C.audioCtx && C.audioCtx(); if (!ctx) return;
      var n = Math.round(ctx.sampleRate * 0.26), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.6) * (0.6 + 0.4 * Math.sin(i / n * Math.PI));
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = b; f.type = "bandpass"; f.frequency.value = 2600; f.Q.value = 0.7; g.gain.value = 0.18;
      s.connect(f); f.connect(g); g.connect(ctx.destination); s.start();
    } catch (e) {}
  }
  // la figurina nuova che vola e si attacca (la prima volta che si apre l'album dopo averla presa)
  LIB.vola = function (nome, ferma) {
    var cas = [].filter.call(S.pg.querySelectorAll(".lib-cas"), function (x) { return x.__c && x.__c.nome === nome; })[0]; if (!cas) return Promise.resolve();
    var f = cas.querySelector(".fig"); if (f) f.style.opacity = "0";
    var r = cas.getBoundingClientRect(), w = Math.round(P.innerWidth * 0.5), cv = figura(cas.__c, w), v = el("div", { class: "lib-vola", style: "left:" + (P.innerWidth - w) / 2 + "px;top:" + P.innerHeight * 0.18 + "px;width:" + w + "px" });
    var luce = el("div", { class: "lib-luce" }); cas.appendChild(luce);
    if (cv) v.appendChild(cv); P.document.body.appendChild(v);
    var dx = r.left - (P.innerWidth - w) / 2, dy = r.top - P.innerHeight * 0.18, sc = r.width / w;
    return new Promise(function (ok) {
      var t0 = P.performance.now(), ms = 900;
      (function passo(t) {
        var k = Math.min(1, (t - t0) / ms); if (ferma != null && k >= ferma) k = ferma;
        var e = 1 - Math.pow(1 - k, 3), su = Math.sin(k * Math.PI) * -40;
        v.style.transform = "translate(" + (dx * e).toFixed(1) + "px," + (dy * e + su).toFixed(1) + "px) scale(" + (1 + (sc - 1) * e).toFixed(3) + ") rotate(" + (-14 + 12 * e).toFixed(1) + "deg)";
        luce.style.opacity = k > 0.85 ? String((1 - k) / 0.15) : String(k > 0.7 ? (k - 0.7) / 0.15 : 0);
        if ((ferma != null && k >= ferma) || k >= 1) { if (k >= 1) { v.remove(); if (f) f.style.opacity = "1"; } return ok(); }
        P.requestAnimationFrame(passo);
      })(t0);
    });
  };
  // la misura: i fotogrammi mentre la pagina gira (per il computer rallentato)
  LIB.misura = async function () {
    LIB.preparaDopo(); await new Promise(function (r) { setTimeout(r, 600); });
    var dt = [], ult = 0, via = true;
    (function giro(t) { if (ult) dt.push(t - ult); ult = t; if (via) P.requestAnimationFrame(giro); })(0);
    await LIB.gira(); await new Promise(function (r) { setTimeout(r, 100); }); via = false;
    dt = dt.filter(function (x) { return x > 0; }); var lenti = dt.filter(function (x) { return x > 34; }).length;
    return { fotogrammi: dt.length, medio: Math.round(dt.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, dt.length)), lenti: lenti, peggiore: Math.round(Math.max.apply(null, dt)) };
  };
})();
