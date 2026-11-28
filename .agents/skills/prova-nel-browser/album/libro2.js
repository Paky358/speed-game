// 📖🏟️ IL LIBRO «IN TEMA STADIO» (28 nov 2026, PROPOSTA per l'album della Mini Asta; il gioco NON cambia). Si carica dopo
// album/prototipo.js e lavora nel telefono finto di Paky (le figurine prese e i numeri sono finti). Tre versioni: LIB2.liv = "A" (sobria),
// "B" (stadio), "C" (gran galà). Gli sfondi li disegna libro2-sfondi.js UNA volta quando nasce la pagina; poi restano fermi.
// Ogni squadra ha DUE pagine: la 1ª con la testata grande, la città e portieri e difensori; la 2ª con centrocampisti e attaccanti.
// Tutte le animazioni solo con transform e opacity.
// Uso: await LIB2.prepara(); LIB2.copertina(); await LIB2.accendi(f); await LIB2.apri(f); LIB2.indice(); LIB2.pagina("Inter", 1);
//      LIB2.gira(f); LIB2.trascina(f); LIB2.vola(nome, f); LIB2.tocca(nome); LIB2.completa(f); LIB2.lucida(f); LIB2.doppia(sq); LIB2.misura()
(function () {
  "use strict";
  var W = window, L2 = W.LIB2 = { liv: "B" };
  var P = null, A = null, C = null, el = null, ab = null, S = {};
  var RUOLI = { 1: ["P", "D"], 2: ["C", "A"] }, SEZ = { 1: "Portieri e difensori", 2: "Centrocampisti e attaccanti" }, RU = { P: "POR", D: "DIF", C: "CEN", A: "ATT" };
  var SAGOMA = '<svg viewBox="0 0 40 46" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="14" r="9"/><path d="M3 46 C4 32 11 26.5 20 26.5 C29 26.5 36 32 37 46 Z"/></svg>';
  var STELLA = '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="#fff6cf"/></svg>';
  var ICONA = "";   // (l'icona nostra dell'album, la stessa delle proposte di prima: libro.js)
  function stile() {
    if (P.document.getElementById("l2-stile")) return;
    var s = P.document.createElement("style"); s.id = "l2-stile";
    s.textContent = [
      ".l2 .contenuto{display:flex;flex-direction:column}",
      ".l2-scena{position:relative;flex:1;min-height:0;perspective:1500px;margin:0 -4px}",
      ".l2-foglio{position:absolute;inset:0;border-radius:5px 14px 14px 5px;overflow:hidden;transform-origin:0 50%;backface-visibility:hidden;-webkit-backface-visibility:hidden;will-change:transform;background:#0d1022;box-shadow:0 18px 30px -16px #000;contain:layout paint}",
      ".l2-sf{position:absolute;inset:0;width:100%;height:100%;display:block}",
      ".l2-cont{position:absolute;inset:0;display:flex;flex-direction:column;padding:12px 12px 0 16px}.l2-c .l2-cont{padding:14px 16px 0 20px}.l2-c .l2-pn{right:24px;bottom:7px}",
      ".l2-pn{position:absolute;bottom:5px;right:13px;font-size:.7rem;font-weight:800;color:rgba(255,255,255,.75);text-shadow:0 1px 2px #000}",
      // la testata della 1ª pagina: lo scudetto grande, il nome, il conto con la barretta
      ".l2-t1{display:flex;align-items:center;gap:12px;margin:2px 0 8px}",
      ".l2-t1 .scudetto{width:62px;height:auto;flex:0 0 auto;filter:drop-shadow(0 6px 8px rgba(0,0,0,.55))}",
      ".l2-t1 .nm{min-width:0;flex:1}.l2-t1 b{display:block;font-family:var(--o-tit);font-weight:800;font-size:1.75rem;line-height:1.05;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.6);padding-bottom:.12em;margin-bottom:-.12em}",
      ".l2-conto{display:flex;align-items:center;gap:8px;margin-top:5px}.l2-conto .n{font-weight:900;font-size:1rem;color:#fff;white-space:nowrap}",
      ".l2-barra{flex:1;height:7px;border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden;max-width:150px}.l2-barra i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#f2c230,#fff0a8)}",
      ".l2-chip{font-size:.72rem;font-weight:900;padding:3px 9px;border-radius:99px;white-space:nowrap}",
      ".l2-chip.manca{color:#0b0f26;background:linear-gradient(180deg,#fff3b8,#f2c230);box-shadow:0 0 12px rgba(242,194,48,.55)}",
      ".l2-chip.tutta{color:#0b0f26;background:linear-gradient(180deg,#fff3b8,#f2c230 50%,#c99a26)}",
      // la testata della 2ª pagina: piccola
      ".l2-t2{display:flex;align-items:center;gap:9px;margin:0 0 6px}.l2-t2 .scudetto{width:28px;height:auto;flex:0 0 auto}",
      ".l2-t2 b{font-family:var(--o-tit);font-weight:800;font-size:1.1rem;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.6)}.l2-t2 .l2-conto{margin:0 0 0 auto}",
      "@media (max-height:700px){.l2-t1{margin:0 0 5px;gap:10px}.l2-t1 .scudetto{width:50px}.l2-t1 b{font-size:1.5rem}.l2-sez{margin:0 0 6px}.l2-cont{padding-top:9px}}",
      ".l2-sez{display:flex;align-items:center;gap:8px;font-size:.68rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#ffe28a;margin:2px 0 8px;text-shadow:0 1px 3px rgba(0,0,0,.7)}",
      ".l2-sez:after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(242,194,48,.6),rgba(242,194,48,0))}",
      // le caselle: la figurina attaccata o il tassello che manca (bordo tratteggiato d'oro, sagoma, numero grande e nome)
      ".l2-gr{display:grid;gap:var(--gap,9px);justify-content:center;align-content:start}",
      ".l2-cas{position:relative;aspect-ratio:1/1.36;min-width:0;font:inherit;padding:0;border:0;background:none;color:inherit}",
      ".l2-vuoto{position:absolute;inset:0;border-radius:7px;border:1.6px dashed rgba(242,194,48,.62);background:radial-gradient(110% 80% at 50% 30%,rgba(255,255,255,.08),rgba(4,6,18,.62));display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}",
      ".l2-vuoto svg{width:52%;height:auto;fill:rgba(255,255,255,.13);position:absolute;top:22%}",
      ".l2-vuoto .n{position:relative;font-family:var(--o-tit);font-weight:800;font-size:calc(var(--fw,90px)*.3);line-height:1;color:#ffd979;text-shadow:0 2px 6px rgba(0,0,0,.8);margin-top:8%}",
      ".l2-vuoto .nm{position:relative;font-size:calc(var(--fw,90px)*.118 + 2px);font-weight:800;color:#fff;text-shadow:0 1px 3px #000;text-align:center;padding:0 3px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3%;padding-bottom:.2em;margin-bottom:-.2em}",
      ".l2-vuoto .ru{position:relative;font-size:calc(var(--fw,90px)*.085 + 2px);font-weight:900;letter-spacing:.08em;color:rgba(255,226,138,.75)}",
      ".l2-fig{position:absolute;inset:-1.5%;transform:rotate(var(--r,0deg))}",
      ".l2-fig canvas{width:100%;height:100%;display:block;filter:drop-shadow(1px 4px 3px rgba(0,0,0,.6))}",
      ".l2-lc{position:absolute;inset:2.5%;border-radius:6%/4.5%;overflow:hidden;pointer-events:none}.l2-lc i{position:absolute;top:-20%;bottom:-20%;left:0;width:45%;opacity:0;background:linear-gradient(100deg,rgba(255,255,255,0),rgba(255,255,255,.55) 45%,rgba(255,255,255,.8) 50%,rgba(255,255,255,.55) 55%,rgba(255,255,255,0));transform:translateX(-120%) skewX(-12deg)}",
      ".l2-lc.oro i{background:linear-gradient(100deg,rgba(255,240,170,0),rgba(255,236,150,.75) 45%,rgba(255,255,230,1) 50%,rgba(255,236,150,.75) 55%,rgba(255,240,170,0))}",
      // il fumetto «non l'hai ancora preso»
      ".l2-fum{position:absolute;z-index:8;left:50%;bottom:calc(100% + 8px);width:150px;margin-left:-75px;padding:8px 10px;border-radius:12px;background:#151a2e;border:1px solid rgba(242,194,48,.55);color:#fff;font-size:.74rem;font-weight:700;line-height:1.25;text-align:center;box-shadow:0 10px 20px -8px #000}",
      ".l2-fum b{display:block;color:#ffd979;font-size:.8rem;margin-bottom:2px}.l2-fum:after{content:'';position:absolute;left:50%;bottom:-6px;margin-left:-6px;border:6px solid transparent;border-bottom:0;border-top-color:rgba(242,194,48,.55)}",
      ".l2-cas.batte .l2-vuoto{border-color:#ffd979;box-shadow:0 0 0 2px rgba(255,217,121,.25),inset 0 0 18px rgba(255,217,121,.25)}",
      // la pagina che gira: il retro, l'ombra sulla pagina che gira e su quella sotto, il dito
      ".l2-retro{position:absolute;inset:0;transform:rotateY(180deg);backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:14px 5px 5px 14px;overflow:hidden}",
      ".l2-ombra{position:absolute;inset:0;background:linear-gradient(270deg,rgba(0,0,0,.65),rgba(0,0,0,.15) 40%,rgba(255,255,255,.06) 70%,rgba(0,0,0,0));opacity:0;pointer-events:none;z-index:6;will-change:opacity}",
      ".l2-sotto{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.7),rgba(0,0,0,.35));opacity:0;pointer-events:none;z-index:6;will-change:opacity}",
      ".l2-dito{position:absolute;z-index:9;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.55),rgba(255,255,255,.15) 60%,rgba(255,255,255,0) 70%);border:2px solid rgba(255,255,255,.65);pointer-events:none}",
      // la copertina
      ".l2-cop .l2-luce{position:absolute;inset:0;width:100%;height:100%;opacity:0}",
      ".l2-cop .tx{position:absolute;left:0;right:0;top:9%;display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;z-index:3}",
      ".l2-cop .an{font-family:var(--o-tit);font-weight:800;letter-spacing:.22em;font-size:.72rem;color:#ffe28a}",
      ".l2-cop .ti{font-family:var(--o-tit);font-weight:800;font-size:3rem;line-height:1;background:linear-gradient(180deg,#fffbe0,#ffd84a 40%,#c98a1a 75%,#ffe9a0);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 3px 0 rgba(90,50,0,.6)) drop-shadow(0 0 18px rgba(255,200,60,.35));padding-bottom:.1em}",
      ".l2-cop .st{font-weight:800;font-size:1.05rem;color:#e8ecff;letter-spacing:.06em}",
      ".l2-cop .pc{font-weight:900;font-size:.92rem;color:#0b0f26;background:linear-gradient(180deg,#fff3b8,#f2c230);border-radius:99px;padding:4px 14px;margin-top:6px}",
      ".l2-cop .tc{position:absolute;left:0;right:0;bottom:4.5%;text-align:center;font-size:.85rem;font-weight:800;color:#fff;z-index:3;text-shadow:0 1px 4px #000}",
      ".l2-cop .cor{position:absolute;inset:10px 10px 10px 18px;border:1.5px solid rgba(242,194,48,.7);border-radius:8px;z-index:2;pointer-events:none}",
      ".l2-cop .fig{position:absolute;left:50%;top:50%;width:30%;margin-left:-15%;transform:rotate(-7deg);z-index:3;filter:drop-shadow(0 12px 14px rgba(0,0,0,.6))}.l2-cop .fig canvas{width:100%;height:auto;display:block}",
      // l'indice: il campo dall'alto coi 20 scudetti
      ".l2-ind .l2-cont{padding:14px 14px 10px 18px}",
      ".l2-it{display:flex;align-items:center;gap:10px;margin:0 0 8px;padding:6px 10px;border-radius:12px;background:rgba(6,8,22,.72)}.l2-it b{font-family:var(--o-tit);font-weight:800;font-size:1.25rem;color:#fff}",
      ".l2-ig{display:grid;grid-template-columns:repeat(var(--col,4),minmax(0,1fr));gap:var(--ig,6px) 4px;flex:1;align-content:space-evenly}",
      ".l2-ig button{font:inherit;border:0;background:none;color:#fff;display:flex;flex-direction:column;align-items:center;gap:2px;padding:0;min-width:0}",
      ".l2-ig .scudetto{width:var(--sw,40px);height:auto;filter:drop-shadow(0 4px 4px rgba(0,0,0,.5))}",
      ".l2-ig .lab{display:flex;flex-direction:column;align-items:center;max-width:100%;background:rgba(6,8,22,.78);border-radius:8px;padding:1px 6px 2px}",
      ".l2-ig .lab b{font-size:.7rem;font-weight:800;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.15em;margin-bottom:-.15em}.l2-ig .lab i{font-style:normal;font-size:.62rem;font-weight:800;color:#c9cfe6}",
      ".l2-ig .lab i.tutta{color:#ffd979}.l2-ig .lab i.pg{font-size:.56rem;color:#ffe28a;opacity:.85}.l2-ig.compatto .lab i.pg{display:none}.l2-ig.compatto .lab{padding:1px 4px 2px}.l2-ig.compatto .lab b{font-size:.62rem;letter-spacing:-.01em}",
      // la figurina che vola, il lampo e le stelline
      ".l2-vola{position:fixed;z-index:60;pointer-events:none;will-change:transform}.l2-vola canvas{width:100%;height:auto;display:block;filter:drop-shadow(0 18px 22px rgba(0,0,0,.55))}",
      ".l2-lampo{position:absolute;inset:-25%;border-radius:50%;background:radial-gradient(circle,rgba(255,236,160,.9),rgba(255,214,90,.35) 40%,rgba(255,214,90,0) 70%);opacity:0;pointer-events:none;z-index:4}",
      ".l2-stella{position:absolute;width:28px;height:28px;margin:-14px 0 0 -14px;opacity:0;pointer-events:none;z-index:5}.l2-stella svg{width:100%;height:100%;display:block}",
      // la squadra completa: la luce del suo colore, i coriandoli, la scritta
      ".l2-festa{position:absolute;inset:0;opacity:0;pointer-events:none;z-index:4}",
      ".l2-cori{position:absolute;top:-12px;width:7px;height:11px;border-radius:2px;opacity:0;pointer-events:none;z-index:7}",
      ".l2-banda{position:absolute;left:50%;top:44%;z-index:8;transform:translate(-50%,-50%) scale(.6);opacity:0;font-family:var(--o-tit);font-weight:800;font-size:1.25rem;color:#0b0f26;background:linear-gradient(180deg,#fff7cc,#f2c230 55%,#c99a26);padding:9px 20px;border-radius:99px;white-space:nowrap;box-shadow:0 12px 30px -8px rgba(0,0,0,.7),0 0 30px rgba(255,210,80,.55)}",
      // la doppia pagina col telefono girato
      ".l2-aperto{position:fixed;inset:0;z-index:70;background:#060816;display:flex;flex-direction:column}",
      ".l2-aperto .bar{flex:0 0 auto;display:flex;align-items:center;gap:10px;height:40px;padding:0 14px;color:#fff;font-weight:800}.l2-aperto .bar span{color:#a6acc8;font-weight:700;font-size:.85rem}",
      ".l2-aperto .due{flex:1;min-height:0;display:flex;padding:0 12px 10px;position:relative}",
      ".l2-aperto .due>.l2-foglio{position:relative;inset:auto;flex:1}.l2-aperto .due>.l2-foglio:first-child{border-radius:14px 4px 4px 14px}",
      ".l2-aperto .dorso{position:absolute;left:50%;top:0;bottom:10px;width:30px;margin-left:-15px;background:linear-gradient(90deg,rgba(0,0,0,0),rgba(0,0,0,.55) 45%,rgba(255,255,255,.08) 50%,rgba(0,0,0,.45) 55%,rgba(0,0,0,0));pointer-events:none;z-index:5}"
    ].join("\n");
    P.document.head.appendChild(s);
  }
  async function carica(f) { P.eval(await (await fetch("/.agents/skills/prova-nel-browser/album/" + f + "?" + Date.now())).text() + "\n//# sourceURL=" + f); }
  L2.prepara = async function () {
    await W.ALB.prepara(); P = W.ALB.P(); A = W.ALB.A(); C = P.SGCuore; el = C.el; stile();
    if (!P.SG_SCUDETTI) await carica("scudetti.js");
    P.eval(await (await fetch("/js/album-sfondi.js?" + Date.now())).text());
    if (!W.LIB) await new Promise(function (ok) { var sc = document.createElement("script"); sc.src = "/.agents/skills/prova-nel-browser/album/libro.js?" + Date.now(); sc.onload = ok; document.head.appendChild(sc); });
    ICONA = W.LIB.ICONA;
  };
  function attesa(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function figura(c, w) { var src = A.figurinaCanvas(c, null, w, false); if (!src) return null; var cv = P.document.createElement("canvas"); cv.width = src.width; cv.height = src.height; cv.getContext("2d").drawImage(src, 0, 0); return cv; }
  function conta(l) { var p = 0; l.forEach(function (c) { if (c.preso) p++; }); return p; }
  function bordo(l) { return conta(l) === l.length ? "oro" : "argento"; }
  function numPag(sq, pag) { return 2 + ab.squadre.indexOf(sq) * 2 + (pag - 1); }
  function schermo() {
    var s = C.schermata({ icona: "", titolo: "Album", sotto: "Mini Asta · Serie A di oggi", indietro: function () {} });
    s.classList.add("l2"); s._menu = "trofei";
    var ic = s.querySelector(".testa span"); if (ic) { ic.textContent = ""; ic.innerHTML = ICONA; ic.style.width = "40px"; ic.style.display = "inline-block"; }
    s._contenuto.appendChild(el("div", { class: "alb-tab" }, [ el("button", { text: "🏆 Trofei" }), el("button", { class: "on", html: "<span style=\"display:inline-block;width:20px;vertical-align:-4px\">" + ICONA + "</span> Album" }) ]));
    var sc = el("div", { class: "l2-scena" }); s._contenuto.appendChild(sc); S = { s: s, scena: sc };
    C.mostra(s); return sc;
  }
  function contoNodo(l, piccolo) {
    var p = conta(l), t = l.length, kids = [ el("span", { class: "n", text: p + " / " + t }) ];
    if (!piccolo) kids.push(el("div", { class: "l2-barra" }, [ el("i", { style: "width:" + Math.round(p / t * 100) + "%" }) ]));
    if (t - p === 1) kids.push(el("span", { class: "l2-chip manca", text: "Ne manca 1!" }));
    else if (p === t) kids.push(el("span", { class: "l2-chip tutta", text: "✓ Completa" }));
    return el("div", { class: "l2-conto" }, kids);
  }
  // ---- la pagina di una squadra (1 = testata, città, portieri e difensori · 2 = centrocampisti e attaccanti) ----
  function paginaSquadra(sq, pag) {
    var l = ab.per[sq], lista = l.filter(function (c) { return RUOLI[pag].indexOf(c.ruolo) >= 0; });
    var f = el("div", { class: "l2-foglio l2-pag" + (L2.liv === "C" ? " l2-c" : "") }), cv = el("canvas", { class: "l2-sf" }), cont = el("div", { class: "l2-cont" });
    f.appendChild(cv); f.appendChild(cont); f.__sq = sq; f.__pag = pag;
    if (pag === 1) cont.appendChild(el("div", { class: "l2-t1" }, [ el("span", { class: "sc", html: P.SG_SCUDETTI.svg(sq, { bordo: bordo(l) }) }), el("div", { class: "nm" }, [ el("b", { text: sq }), contoNodo(l) ]) ]));
    else cont.appendChild(el("div", { class: "l2-t2", html: P.SG_SCUDETTI.svg(sq, { bordo: bordo(l) }) }, [ el("b", { text: sq }), contoNodo(l, true) ]));
    cont.appendChild(el("div", { class: "l2-sez", text: SEZ[pag] }));
    var gr = el("div", { class: "l2-gr" });
    lista.forEach(function (c) {
      var cas = el("button", { class: "l2-cas" }); cas.__c = c;
      if (c.preso) { var r = ((c.num * 37) % 7 - 3) * 0.8; cas.appendChild(el("div", { class: "l2-fig", style: "--r:" + r.toFixed(1) + "deg" })); }
      else cas.appendChild(el("div", { class: "l2-vuoto", html: SAGOMA }, [ el("div", { class: "n", text: c.num }), el("div", { class: "nm", text: c.nome }), el("div", { class: "ru", text: RU[c.ruolo] }) ]));
      cas.addEventListener("click", function () { if (!c.preso) fumetto(cas); });
      gr.appendChild(cas);
    });
    cont.appendChild(gr); f.appendChild(el("div", { class: "l2-pn", text: String(numPag(sq, pag)) }));
    return f;
  }
  function adatta(f) {   // la pagina intera nello spazio, con le figurine più grandi che ci stanno (e il prato libero in fondo)
    var gr = f.querySelector(".l2-gr"), n = gr.children.length, gap = 9, gw = gr.clientWidth || f.clientWidth - 28;
    var prato = L2.liv === "A" ? 16 : Math.max(26, f.clientHeight * 0.06), gh = f.clientHeight - gr.offsetTop - prato - 16, best = null;
    for (var col = Math.min(n, 2); col <= 6; col++) {
      if (col < 3 && n > 4) continue;
      var rows = Math.ceil(n / col), w = Math.min((gw - gap * (col - 1)) / col, gw * 0.34), need = rows * w * 1.36 + (rows - 1) * gap;
      if (need > gh) w = (gh - (rows - 1) * gap) / rows / 1.36;
      if (!best || w > best.w + 0.5) best = { col: col, w: Math.floor(w) };
    }
    gr.style.gridTemplateColumns = "repeat(" + best.col + "," + best.w + "px)"; gr.style.setProperty("--fw", best.w + "px"); gr.style.setProperty("--gap", gap + "px");
    f.__top = gr.offsetTop; f.__prato = prato;
  }
  function disegna(f, figurine) {   // lo sfondo una volta, poi le figurine (nel gioco: una per fotogramma)
    adatta(f);
    if (f.__sq) P.L2S.pagina(f.querySelector(".l2-sf"), f.__sq, f.__pag, L2.liv, { top: f.__top, pratoAlto: f.__prato });
    if (figurine !== false) [].forEach.call(f.querySelectorAll(".l2-fig"), function (x) { if (x.firstChild) return; var cv = figura(x.parentNode.__c, Math.round(x.parentNode.clientWidth)); if (cv) x.appendChild(cv); });
  }
  function fumetto(cas) {
    [].forEach.call(S.scena.querySelectorAll(".l2-fum"), function (x) { x.remove(); }); [].forEach.call(S.scena.querySelectorAll(".batte"), function (x) { x.classList.remove("batte"); });
    var c = cas.__c; cas.classList.add("batte");
    cas.appendChild(el("div", { class: "l2-fum", html: "<b>Non l'hai ancora preso…</b>" + c.nome + ": compralo all'asta e la figurina si attacca qui." }));
    try { if (P.navigator.vibrate) P.navigator.vibrate(10); } catch (e) {}
  }
  function casella(nome) { return [].filter.call(S.scena.querySelectorAll(".l2-cas"), function (x) { return x.__c && x.__c.nome === nome; })[0]; }
  L2.tocca = function (nome) { var c = casella(nome); if (c) fumetto(c); var fu = c && c.querySelector(".l2-fum"); if (fu) { var r = fu.getBoundingClientRect(), sr = S.scena.getBoundingClientRect(); if (r.left < sr.left + 4) fu.style.marginLeft = (-75 + sr.left + 4 - r.left) + "px"; if (r.right > sr.right - 4) fu.style.marginLeft = (-75 - (r.right - sr.right + 4)) + "px"; } };
  L2.pagina = function (sq, pag) { ab = W.ALB.album(); var sc = schermo(), f = paginaSquadra(sq, pag || 1); sc.appendChild(f); disegna(f); S.pg = f; S.sq = sq; S.pag = pag || 1; return f; };
  // ---- la copertina: lo stadio di notte; al tocco i riflettori si accendono uno dopo l'altro e il libro si apre ----
  L2.copertina = function () {
    ab = W.ALB.album(); var sc = schermo(), tot = ab.tutte.length, p = conta(ab.tutte);
    var f = el("div", { class: "l2-foglio l2-cop" }), base = el("canvas", { class: "l2-sf" }); f.appendChild(base);
    var luci = [0, 1, 2, 3, "campo"].map(function () { var c = el("canvas", { class: "l2-luce" }); f.appendChild(c); return c; });
    f.appendChild(el("div", { class: "cor" }));
    f.appendChild(el("div", { class: "tx" }, [ el("div", { class: "an", text: "ALBUM DELLA MINI ASTA" }), el("div", { class: "ti", text: "Serie A" }), el("div", { class: "st", text: "di oggi" }), el("div", { class: "pc", text: p + " / " + tot + " figurine" }) ]));
    f.appendChild(el("div", { class: "tc", text: "👆 Tocca per accendere le luci" }));
    sc.appendChild(f); S.cop = f; S.luci = luci;
    P.L2S.copertina(base, L2.liv, null); luci.forEach(function (c, i) { P.L2S.copertina(c, L2.liv, i < 4 ? i : "campo"); });
    if (L2.liv === "A") { luci.forEach(function (c) { c.style.opacity = "1"; }); f.querySelector(".tc").textContent = "👆 Tocca per aprire"; }
    if (L2.liv === "C") {   // la tua figurina d'oro più bella, attaccata sul prato
      var top = ab.tutte.filter(function (c) { return c.preso && c.met === "oro"; })[0], fg = el("div", { class: "fig", style: "top:56%" }); f.appendChild(fg);
      if (top) { var cv = figura(top, Math.round(f.clientWidth * 0.3)); if (cv) fg.appendChild(cv); }
    }
    return f;
  };
  L2.accendi = function (ferma) {   // le luci una dopo l'altra (≈1,3 s), poi il prato
    if (L2.liv === "A") return Promise.resolve();
    try { if (P.navigator.vibrate) P.navigator.vibrate(12); } catch (e) {}
    return tempo(1300, ferma, function (k) {
      S.luci.forEach(function (c, i) { var da = i < 4 ? 0.04 + [0, 2, 1, 3][i] * 0.16 : 0.66, v = Math.max(0, Math.min(1, (k - da) / 0.12)); c.style.opacity = v.toFixed(3); });
    });
  };
  function tempo(ms, ferma, fn) {   // un'animazione da 0 a 1 in ms (ferma: si ferma lì, per la foto)
    return new Promise(function (ok) {
      var t0 = P.performance.now();
      (function passo(t) { var k = Math.min(1, (t - t0) / ms); if (ferma != null && k >= ferma) k = ferma; fn(k); if ((ferma != null && k >= ferma) || k >= 1) return ok(); P.requestAnimationFrame(passo); })(t0);
    });
  }
  function morbido(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  // ---- l'indice: il campo dall'alto con le 20 squadre ----
  function paginaIndice() {
    var f = el("div", { class: "l2-foglio l2-ind" }), cv = el("canvas", { class: "l2-sf" }), cont = el("div", { class: "l2-cont" }); f.appendChild(cv); f.appendChild(cont);
    cont.appendChild(el("div", { class: "l2-it" }, [ el("b", { text: "Indice" }), contoNodo(ab.tutte) ]));
    cont.appendChild(el("div", { class: "l2-ig" }, ab.squadre.map(function (sq) {
      var l = ab.per[sq], tutta = conta(l) === l.length;
      return el("button", { "data-sq": sq, html: P.SG_SCUDETTI.svg(sq, { bordo: bordo(l) }) }, [ el("div", { class: "lab" }, [ el("b", { text: sq }), el("i", { class: tutta ? "tutta" : "", text: (tutta ? "✓ " : "") + conta(l) + "/" + l.length }), el("i", { class: "pg", text: "pag. " + numPag(sq, 1) }) ]) ]);
    })));
    f.appendChild(el("div", { class: "l2-pn", text: "1" }));
    return f;
  }
  function adattaIndice(f) {
    var g = f.querySelector(".l2-ig"), tent = [[4, 50], [4, 46], [4, 42], [4, 38], [4, 34], [5, 40, 1], [5, 36, 1], [5, 32, 1], [5, 28, 1]];
    for (var j = 0; j < tent.length; j++) { g.style.setProperty("--col", tent[j][0]); g.style.setProperty("--sw", tent[j][1] + "px"); g.classList.toggle("compatto", !!tent[j][2]); if (f.querySelector(".l2-cont").scrollHeight <= f.clientHeight + 1) break; }
    P.L2S.indice(f.querySelector(".l2-sf"), L2.liv);
  }
  L2.indice = function () { ab = W.ALB.album(); var sc = schermo(); S.ind = paginaIndice(); sc.appendChild(S.ind); adattaIndice(S.ind); return S.ind; };
  L2.apri = function (ferma) {   // la copertina gira e sotto c'è l'indice
    var ind = paginaIndice(); S.scena.insertBefore(ind, S.cop); S.ind = ind; adattaIndice(ind);
    var sotto = el("div", { class: "l2-sotto", style: "opacity:.7" }); ind.appendChild(sotto); S.cop.style.zIndex = 5;
    fruscio();
    return tempo(750, ferma, function (k) { var e = morbido(k); S.cop.style.transform = "rotateY(" + (-178 * e).toFixed(2) + "deg)"; sotto.style.opacity = (0.7 * (1 - e)).toFixed(3); }).then(function () { if (ferma == null) { S.cop.remove(); sotto.remove(); } });
  };
  // ---- si sfoglia: la pagina segue il dito, ha un peso, fruscia e si posa con un colpetto ----
  function prossima() { return S.pag === 1 ? [S.sq, 2] : [ab.squadre[(ab.squadre.indexOf(S.sq) + 1) % ab.squadre.length], 1]; }
  L2.preparaDopo = function () { var q = prossima(); S.dopo = paginaSquadra(q[0], q[1]); S.scena.insertBefore(S.dopo, S.pg); disegna(S.dopo); retroDi(S.pg); };   // (anche il retro e le ombre: pronti prima del dito)
  function retroDi(pg) { if (pg.querySelector(".l2-retro")) return; var re = el("div", { class: "l2-retro" }, [ el("canvas", { class: "l2-sf" }) ]); pg.appendChild(re); P.L2S.retro(re.firstChild, pg.__sq); pg.appendChild(el("div", { class: "l2-ombra" })); }
  function preparaGiro() {
    if (!S.dopo) L2.preparaDopo();
    retroDi(S.pg); if (!S.dopo.querySelector(".l2-sotto")) S.dopo.appendChild(el("div", { class: "l2-sotto" }));
    S.pg.style.zIndex = 5; return { om: S.pg.querySelector(".l2-ombra"), so: S.dopo.querySelector(".l2-sotto") };
  }
  function posa(ang, o) { var s = Math.sin(Math.min(90, -ang) * Math.PI / 180); S.pg.style.transform = "rotateY(" + ang.toFixed(2) + "deg)"; S.pg.style.opacity = ang < -100 ? "0" : "1";   /* (oltre il dorso la pagina esce dallo schermo: spenta, il telefono non la ridisegna) */ o.om.style.opacity = (0.75 * s).toFixed(3); o.so.style.opacity = (0.75 * (1 - Math.min(1, -ang / 178))).toFixed(3); }
  L2.trascina = function (frac) {   // per la foto: la pagina tenuta col dito a metà strada
    var o = preparaGiro(), ang = -178 * frac; posa(ang, o);
    var r = S.pg.getBoundingClientRect(), sr = S.scena.getBoundingClientRect(), d = el("div", { class: "l2-dito", style: "left:" + (r.right - sr.left - 6) + "px;top:" + (sr.height * 0.62) + "px" }); S.scena.appendChild(d);
  };
  L2.gira = function (ferma) {
    var q = prossima(), o = preparaGiro(), dopo = S.dopo; S.dopo = null; fruscio();
    [].forEach.call(S.scena.querySelectorAll(".l2-dito"), function (x) { x.remove(); });
    return tempo(620, ferma, function (k) { var e = 1 - Math.pow(1 - k, 2.2); posa(-178 * e, o); }).then(function () {
      if (ferma != null) return;
      var via = S.pg; via.style.visibility = "hidden"; P.setTimeout(function () { via.remove(); }, 400); S.pg = dopo; S.sq = q[0]; S.pag = q[1]; var so = dopo.querySelector(".l2-sotto"); if (so) so.style.opacity = "0";
      if (!L2.senzaVibra) try { if (P.navigator.vibrate) P.navigator.vibrate(9); } catch (e) {}   // (si posa: un colpetto)
      if (!L2.zitto) L2.lucida();
    });
  };
  // il riflesso lucido che passa una volta sulle figurine attaccate (più forte sull'oro)
  L2.lucida = function (ferma) {
    var figs = [].slice.call(S.pg.querySelectorAll(".l2-fig")); if (!figs.length) return Promise.resolve();
    var raggi = figs.map(function (f, i) { var lc = f.querySelector(".l2-lc"); if (!lc) { lc = el("div", { class: "l2-lc" + (f.parentNode.__c.met === "oro" ? " oro" : "") }, [ el("i") ]); f.appendChild(lc); } return { i: lc.firstChild, d: i * 0.045, oro: f.parentNode.__c.met === "oro" }; });
    return tempo(900 + figs.length * 40, ferma, function (k) {
      raggi.forEach(function (r) { var t = Math.max(0, Math.min(1, (k - r.d) / 0.55)); r.i.style.transform = "translateX(" + (-120 + 360 * t).toFixed(1) + "%) skewX(-12deg)"; r.i.style.opacity = (t > 0 && t < 1 ? (r.oro ? 1 : 0.6) : 0).toString(); });
    });
  };
  function fruscio() {   // il rumore della carta (un soffio filtrato)
    try {
      var ctx = C.audioCtx && C.audioCtx(); if (!ctx) return;
      var n = Math.round(ctx.sampleRate * 0.3), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.5) * (0.5 + 0.5 * Math.sin(i / n * Math.PI));
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = b; f.type = "bandpass"; f.frequency.value = 2400; f.Q.value = 0.6; g.gain.value = 0.2;
      s.connect(f); f.connect(g); g.connect(ctx.destination); s.start();
    } catch (e) {}
  }
  // ---- la figurina nuova: vola, si attacca col colpetto, il lampo e le stelline ----
  L2.vola = function (nome, ferma) {
    var cas = casella(nome); if (!cas) return Promise.resolve();
    var fg = cas.querySelector(".l2-fig"), vu = cas.querySelector(".l2-vuoto");
    if (!fg) { fg = el("div", { class: "l2-fig", style: "--r:" + (((cas.__c.num * 37) % 7 - 3) * 0.8).toFixed(1) + "deg" }); var c0 = figura(cas.__c, Math.round(cas.clientWidth)); if (c0) fg.appendChild(c0); cas.insertBefore(fg, cas.firstChild); cas.__c.preso = true; }
    fg.style.opacity = "0";
    var r = cas.getBoundingClientRect(), w = Math.round(P.innerWidth * 0.52), x0 = (P.innerWidth - w) / 2, y0 = P.innerHeight * 0.16, cv = figura(cas.__c, w);
    var v = el("div", { class: "l2-vola", style: "left:" + x0 + "px;top:" + y0 + "px;width:" + w + "px;transform-origin:0 0" }); if (cv) v.appendChild(cv); P.document.body.appendChild(v);
    var lampo = el("div", { class: "l2-lampo" }); cas.appendChild(lampo);
    var stelle = [0, 1, 2, 3, 4, 5].map(function (i) { var a = i / 6 * Math.PI * 2 + 0.4, s = el("div", { class: "l2-stella", html: STELLA, style: "left:" + (50 + Math.cos(a) * 62) + "%;top:" + (50 + Math.sin(a) * 52) + "%" }); cas.appendChild(s); return s; });
    var dx = r.left - x0, dy = r.top - y0, sc = r.width / w, fatto = false;
    return tempo(1350, ferma, function (k) {
      var kv = Math.min(1, k / 0.62), e = 1 - Math.pow(1 - kv, 3), su = Math.sin(kv * Math.PI) * -46;
      var sq = k > 0.62 && k < 0.78 ? Math.sin((k - 0.62) / 0.16 * Math.PI) * 0.07 : 0;   // il colpetto quando si attacca
      v.style.transform = "translate(" + (dx * e).toFixed(1) + "px," + (dy * e + su).toFixed(1) + "px) scale(" + ((1 + (sc - 1) * e) * (1 + sq)).toFixed(4) + "," + ((1 + (sc - 1) * e) * (1 - sq)).toFixed(4) + ") rotate(" + (-16 + 16 * e + ((cas.__c.num * 37) % 7 - 3) * 0.8 * e).toFixed(1) + "deg)";
      if (k >= 0.62 && !fatto) { fatto = true; if (vu) vu.style.opacity = "0"; try { if (P.navigator.vibrate) P.navigator.vibrate(14); } catch (er) {} }
      if (k >= 0.8) { fg.style.opacity = "1"; v.style.opacity = "0"; }
      lampo.style.opacity = (k < 0.6 ? 0 : k < 0.68 ? (k - 0.6) / 0.08 : Math.max(0, 1 - (k - 0.68) / 0.25)).toFixed(3);
      stelle.forEach(function (s, i) { var t = (k - 0.64 - i * 0.02) / 0.3; s.style.opacity = (t <= 0 || t >= 1 ? 0 : Math.sin(t * Math.PI)).toFixed(3); s.style.transform = "scale(" + (t <= 0 ? 0.2 : 0.4 + t * 0.9).toFixed(3) + ") rotate(" + (t * 90).toFixed(0) + "deg)"; });
      if (k >= 1) { v.remove(); fg.style.opacity = "1"; if (vu) vu.remove(); lampo.remove(); stelle.forEach(function (s) { s.remove(); }); }
    });
  };
  // ---- la squadra completa: la pagina si accende del suo colore, lo scudetto diventa d'oro, i coriandoli ----
  L2.completa = function (ferma) {
    var f = S.pg, sq = S.sq, T = P.L2S.tinte(sq), sc = f.querySelector(".l2-t1 .sc, .l2-t2"), vec = sc && sc.querySelector("svg");
    var festa = el("div", { class: "l2-festa", style: "background:radial-gradient(120% 70% at 50% 18%," + P.L2S.rgba(T.l1, 0.55) + "," + P.L2S.rgba(T.l1, 0.12) + " 45%,rgba(0,0,0,0) 75%)" }); f.appendChild(festa);
    var oro = null, anello = null;
    if (vec) { var box = el("div", { style: "position:absolute;inset:0;pointer-events:none" }); sc.style.position = "relative"; sc.appendChild(box);
      oro = el("div", { style: "position:absolute;inset:0;opacity:0", html: P.SG_SCUDETTI.svg(sq, { bordo: "oro" }) }); oro.firstChild.style.cssText = "width:100%;height:auto;display:block"; box.appendChild(oro);
      anello = el("div", { style: "position:absolute;inset:-12%;border-radius:50%;border:3px solid rgba(255,214,90,.95);opacity:0" }); box.appendChild(anello); }
    var cols = [T.c1, T.c2, "#ffd84a", "#ffffff"], cori = [];
    for (var i = 0; i < 44; i++) { var c = el("div", { class: "l2-cori", style: "left:" + (4 + (i * 37 % 92)) + "%;background:" + cols[i % 4] + ";" + (i % 3 ? "" : "width:5px;height:5px;border-radius:50%") }); f.appendChild(c); cori.push({ n: c, d: (i * 13 % 20) / 100, x: ((i * 29) % 21 - 10) * 2.2, rot: (i * 47) % 360, v: 0.8 + (i * 7 % 5) / 10 }); }
    [].forEach.call(f.querySelectorAll(".l2-chip.manca"), function (x) { x.className = "l2-chip tutta"; x.textContent = "✓ Completa"; });
    [].forEach.call(f.querySelectorAll(".l2-barra i"), function (x) { x.style.width = "100%"; }); [].forEach.call(f.querySelectorAll(".l2-conto .n"), function (x) { var l = ab.per[sq]; x.textContent = l.length + " / " + l.length; });
    var banda = el("div", { class: "l2-banda", text: "⭐ " + sq + " completa!" }); f.appendChild(banda);
    try { if (P.navigator.vibrate) P.navigator.vibrate([20, 50, 30]); } catch (e) {}
    var H = f.clientHeight;
    return tempo(2200, ferma, function (k) {
      festa.style.opacity = (k < 0.15 ? k / 0.15 : Math.max(0.35, 1 - (k - 0.15) * 0.8)).toFixed(3);
      if (oro) { var su = Math.min(1, k / 0.18); oro.style.opacity = su.toFixed(3); oro.style.transform = "scale(" + (1.3 - 0.3 * su).toFixed(3) + ")"; var g = Math.max(0, (k - 0.12) / 0.4); anello.style.opacity = (k < 0.12 ? 0 : Math.max(0, 1 - g)).toFixed(3); anello.style.transform = "scale(" + (0.9 + g).toFixed(3) + ")"; }
      cori.forEach(function (c) { var t = Math.max(0, (k - c.d) / (0.85 * c.v)); c.n.style.opacity = (t <= 0 ? 0 : t > 0.85 ? (1 - t) / 0.15 : 1).toFixed(3); c.n.style.transform = "translate(" + (Math.sin(t * 6 + c.rot) * 10 + c.x * t).toFixed(1) + "px," + (t * H * 1.02).toFixed(1) + "px) rotate(" + (c.rot + t * 540).toFixed(0) + "deg)"; });
      var b = k < 0.2 ? 0 : Math.min(1, (k - 0.2) / 0.12); banda.style.opacity = (k > 0.85 ? (1 - k) / 0.15 : b).toFixed(3); banda.style.transform = "translate(-50%,-50%) scale(" + (0.6 + 0.4 * (1 - Math.pow(1 - b, 3)) + (b >= 1 ? Math.sin((k - 0.32) * 18) * 0.015 : 0)).toFixed(4) + ")";
    });
  };
  // ---- col telefono girato: le due pagine affiancate come un album aperto ----
  L2.doppia = function (sq) {
    ab = W.ALB.album(); schermo();
    var ov = el("div", { class: "l2-aperto" }, [ el("div", { class: "bar" }, [ el("span", { text: "‹" }), el("b", { text: "Album" }), el("span", { text: "Mini Asta · Serie A di oggi · pagine " + numPag(sq, 1) + "-" + numPag(sq, 2) }) ]) ]);
    var due = el("div", { class: "due" }), a = paginaSquadra(sq, 1), b = paginaSquadra(sq, 2); due.appendChild(a); due.appendChild(b); due.appendChild(el("div", { class: "dorso" })); ov.appendChild(due);
    P.document.body.appendChild(ov); S.ov = ov; disegna(a); disegna(b); return ov;
  };
  L2.chiudiDoppia = function () { if (S.ov) S.ov.remove(); S.ov = null; };
  // ---- la misura: i fotogrammi mentre la pagina gira (col computer rallentato) ----
  L2.misura = async function () {
    L2.zitto = true; L2.preparaDopo(); await attesa(700);
    var dt = [], ts = [], ult = 0, via = true, t0 = P.performance.now();
    (function giro(t) { if (ult) { dt.push(t - ult); ts.push(Math.round(t - t0)); } ult = t; if (via) P.requestAnimationFrame(giro); })(0);
    await L2.gira(); var tf = Math.round(P.performance.now() - t0); await attesa(120); via = false; L2.zitto = false;
    dt = dt.filter(function (x) { return x > 0; }); var lenti = dt.filter(function (x) { return x > 34; }).length, dove = []; dt.forEach(function (x, i) { if (x > 34) dove.push("a " + ts[i] + " ms (" + Math.round(x) + ")"); }); dove.push("fine giro a " + tf);
    return { dove: dove.join(" "), fotogrammi: dt.length, medio: Math.round(dt.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, dt.length)), lenti: lenti, peggiore: Math.round(Math.max.apply(null, dt)) };
  };
  L2.tempoPagina = function (sq, pag) {   // quanto ci mette a nascere una pagina (sfondo + figurine)
    var t0 = P.performance.now(), f = paginaSquadra(sq, pag); S.scena.appendChild(f); f.style.visibility = "hidden";
    adatta(f); var t1 = P.performance.now(); P.L2S.pagina(f.querySelector(".l2-sf"), sq, pag, L2.liv, { top: f.__top, pratoAlto: f.__prato }); var t2 = P.performance.now();
    [].forEach.call(f.querySelectorAll(".l2-fig"), function (x) { var cv = figura(x.parentNode.__c, Math.round(x.parentNode.clientWidth)); if (cv) x.appendChild(cv); }); var t3 = P.performance.now(); f.remove();
    return { sfondo: Math.round(t2 - t1), figurine: Math.round(t3 - t2), tutto: Math.round(t3 - t0) };
  };
  L2.S = function () { return S; };
})();
