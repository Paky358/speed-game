// 📒 PROTOTIPO DELL'ALBUM DELLE FIGURINE DELLA MINI ASTA (27 nov 2026, SOLO per le foto delle proposte: il gioco NON cambia).
// Si carica nella pagina delle prove (dopo copione-prova.js) e lavora dentro il telefono finto di Paky: scarica i dati della Mini Asta,
// legge js/games/asta.js e lo fa girare in una copia che lascia usare le sue funzioni (figurinaCanvas, fasciaDi…) SENZA registrare il
// gioco. Le figurine «prese» e le statistiche «con te» qui sono FINTE (fisse, dal nome): servono solo a far vedere come sarebbe.
// Uso: await ALB.prepara(); await ALB.scena("indice", "A"); …  (lo usa album/foto.js)
(function () {
  "use strict";
  var W = window, ALB = W.ALB = {};
  var P = null, A = null, C = null, el = null;
  function q(s) { return P.document.querySelector(s); }
  function h01(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100000) / 100000; }
  function cifre(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function virgola(x, d) { return (Math.round(x * Math.pow(10, d || 1)) / Math.pow(10, d || 1)).toFixed(d == null ? 1 : d).replace(".", ","); }

  // ---- 1. i dati e le funzioni della Mini Asta, senza toccare il gioco ----
  async function script(src) { await new Promise(function (ok, ko) { var s = P.document.createElement("script"); s.src = "/" + src + "?alb"; s.onload = ok; s.onerror = ko; P.document.head.appendChild(s); }); }
  ALB.prepara = async function (opz) {
    P = W.finestra("Paky") || await W.apriTel("Paky", Object.assign({ x: 0 }, opz || {}));
    C = P.SGCuore; el = C.el;
    if (!P.__ALB_A) {
      var elenco = await (await fetch("/js/elenco-giochi.js")).text();
      var m = elenco.match(/pezzo\("asta",\s*"([^"]+)"/); if (!m) throw new Error("non trovo il pezzo asta");
      var files = m[1].split(/\s+/).filter(function (f) { return f && f !== "js/games/asta.js"; });
      for (var i = 0; i < files.length; i++) await script(files[i]);
      var src = await (await fetch("/js/games/asta.js")).text();
      var fuori = "window.__ALB_A = { figurinaCanvas: figurinaCanvas, fasciaDi: fasciaDi, chiaveCalc: chiaveCalc, usaStagione: usaStagione, caricaStagione: caricaStagione, " +
        "valoreCalc: valoreCalc, numeroMaglia: numeroMaglia, coloriSquadra: coloriSquadra, personaDi: personaDi, dorsoURL: dorsoURL, STAGIONI: STAGIONI, ELENCO: ELENCO_STAGIONI, nomeStagione: nomeStagione };";
      var nuovo = src.replace(/SG\.registra\(gioco\);\s*SG\.registra\(giocoFanta\);/, fuori);
      if (nuovo === src) throw new Error("non trovo dove finisce asta.js");
      P.eval(nuovo + "\n//# sourceURL=asta-album.js");
      P.__ALB_A = P.__ALB_A || P.__ALB_A;
    }
    A = P.__ALB_A;
    stile();
    return true;
  };
  ALB.stagione = async function (id) {
    if (id) await new Promise(function (ok) { A.caricaStagione(id, ok); });
    A.usaStagione(id || null); ALBUM = null;
  };

  // ---- 2. l'album di una stagione: i calciatori all'asta (gruppi A, B, C), per squadra, poi ruolo, poi quotazione ----
  var ALBUM = null, RUOLI = ["P", "D", "C", "A"], NOME_RUOLO = { P: "Portieri", D: "Difensori", C: "Centrocampisti", A: "Attaccanti" };
  function album() {
    if (ALBUM) return ALBUM;
    var D = P.SG_FANTA_CALCIATORI || {}, per = {}, tutte = [];
    RUOLI.forEach(function (r) { ["A", "B", "C"].forEach(function (f) { ((D[r] || {})[f] || []).forEach(function (k) {
      var mm = /^(.*) \((.*)\)$/.exec(k); if (!mm) return; var c = { nome: mm[1], squadra: mm[2], ruolo: r, k: k };
      (per[c.squadra] = per[c.squadra] || []).push(c);
    }); }); });
    var squadre = Object.keys(per).sort(function (a, b) { return a.localeCompare(b, "it"); }), n = 0;
    squadre.forEach(function (s) {
      per[s].sort(function (a, b) { return RUOLI.indexOf(a.ruolo) - RUOLI.indexOf(b.ruolo) || A.valoreCalc(b) - A.valoreCalc(a) || a.nome.localeCompare(b.nome); });
      per[s].forEach(function (c) { c.num = ++n; c.met = A.fasciaDi(c); c.preso = preso(c); tutte.push(c); });
    });
    ALBUM = { squadre: squadre, per: per, tutte: tutte };
    return ALBUM;
  }
  // (FINTO) quali figurine ha Paky: circa una su tre, di più nelle squadre «sue» (per le foto)
  var PREFERITE = { Napoli: 0.62, Inter: 0.55, Roma: 0.4 };
  function preso(c) { return h01("preso|" + c.k + "|" + (ALB.stag || "oggi")) < (PREFERITE[c.squadra] || 0.24); }
  function conta(l) { var o = { n: l.length, p: 0, oro: [0, 0], argento: [0, 0], bronzo: [0, 0] }; l.forEach(function (c) { if (c.preso) o.p++; var x = o[c.met]; if (x) { x[1]++; if (c.preso) x[0]++; } }); return o; }

  // (FINTO) le statistiche «con te» di un calciatore: come sarebbero dopo qualche partita
  function conTe(c) {
    var r = function (s) { return h01(c.k + "|" + s); }, part = 1 + Math.floor(r("p") * 6), volte = Math.max(1, Math.round(part * (0.5 + r("v") * 0.5)));
    var v = 5.6 + r("voto") * 1.6, gol = c.ruolo === "A" ? Math.round(part * r("g") * 0.9) : c.ruolo === "C" ? Math.round(part * r("g") * 0.35) : c.ruolo === "D" ? Math.round(part * r("g") * 0.12) : 0;
    var ass = c.ruolo === "P" ? 0 : Math.round(part * r("a") * 0.35), amm = Math.round(part * r("am") * 0.3), esp = r("es") > 0.9 ? 1 : 0;
    var fv = v + (gol * 3 + ass - amm * 0.5 - esp) / part + (c.ruolo === "P" ? -0.4 : 0);
    var vinte = Math.round(part * r("w") * 0.6), prezzo = Math.max(1, Math.round(A.valoreCalc(c) / 3 + r("pr") * 4));
    var dd = 3 + Math.round(r("mn") * 6), pMin = volte > 1 ? Math.max(1, prezzo - dd) : prezzo, pMax = volte > 1 ? prezzo + dd : prezzo, uff = r("uf") > 0.4 ? 1 : 0;
    var best = Math.max(fv + 1.5, 9 + r("b") * 4), avv = ["Lecce", "Torino", "Genoa", "Cagliari", "Udinese", "Parma"][Math.floor(r("av") * 6)];
    return { pMin: pMin, pMax: pMax, uff: uff, volte: volte, prezzo: prezzo, part: part, v: v, fv: fv, gol: gol, ass: ass, amm: amm, esp: esp, vinte: vinte, best: best, bestAvv: avv, bestData: "12 nov", bestGol: Math.min(gol, 2), stagioni: volte > 2 ? ["Oggi", "2017-18"] : ["Oggi"] };
  }

  // ---- 3. lo stile (Notte vivace) ----
  function stile() {
    if (P.document.getElementById("alb-stile")) return;
    var s = P.document.createElement("style"); s.id = "alb-stile";
    s.textContent = [
      ".alb .contenuto{padding-bottom:84px}",
      ".alb-testa{display:flex;flex-direction:column;gap:6px;margin:0 0 12px}",
      ".alb-tot{display:flex;align-items:baseline;gap:8px;font-family:var(--o-tit);font-weight:800}",
      ".alb-tot b{font-size:2rem;line-height:1;color:var(--o-testo)}.alb-tot span{color:var(--o-tenue);font-size:1rem}",
      ".alb-barra{height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}.alb-barra i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#e0225a,#ff9a4a)}",
      ".alb-met{display:flex;gap:6px;flex-wrap:wrap}.alb-met span{font-size:.8rem;font-weight:800;padding:3px 9px;border-radius:99px;border:1px solid}",
      ".alb-met .oro{color:#ffd84a;border-color:rgba(242,194,48,.55);background:rgba(92,74,12,.45)}",
      ".alb-met .argento{color:#e6ebf2;border-color:rgba(185,194,207,.5);background:rgba(58,66,80,.45)}",
      ".alb-met .bronzo{color:#f3a577;border-color:rgba(212,128,79,.55);background:rgba(90,50,32,.45)}",
      // l'indice delle squadre
      ".alb-sq{display:grid;grid-template-columns:repeat(var(--col,2),1fr);gap:8px}",
      ".alb-tess{position:relative;display:flex;align-items:center;gap:10px;padding:10px;border-radius:14px;background:var(--o-carta);border:1px solid var(--o-filo);color:var(--o-testo);font:inherit;text-align:left;overflow:hidden}",
      ".alb-tess .stemma{flex:0 0 auto;width:30px;height:36px;border-radius:6px 6px 15px 15px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.25)}",
      ".alb-tess .tx{min-width:0;flex:1}.alb-tess .tx b{display:block;font-size:.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".alb-tess .tx span{font-size:.8rem;color:var(--o-tenue)}.alb-tess .mini{height:4px;border-radius:99px;background:rgba(255,255,255,.08);margin-top:5px;overflow:hidden}.alb-tess .mini i{display:block;height:100%;background:#ff4f86}",
      ".alb-tess.piena{border-color:rgba(242,194,48,.6)}.alb-tess.piena .tx span{color:#ffd84a}",
      // la pagina di una squadra
      ".alb-pag{border-radius:18px;padding:12px 10px 14px;background:linear-gradient(180deg,var(--sqa),rgba(13,16,32,.2) 120px),var(--o-carta);border:1px solid var(--o-filo)}",
      ".alb-pag-t{display:flex;align-items:center;gap:10px;margin:0 2px 10px}.alb-pag-t .stemma{width:34px;height:40px;border-radius:7px 7px 17px 17px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.3)}",
      ".alb-pag-t b{font-family:var(--o-tit);font-size:1.35rem;font-weight:800}.alb-pag-t span{margin-left:auto;font-weight:800;color:var(--o-testo);background:rgba(0,0,0,.35);padding:3px 10px;border-radius:99px;font-size:.9rem}",
      ".alb-ruolo{font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--o-tenue);margin:10px 2px 6px}",
      ".alb-gr{display:grid;grid-template-columns:repeat(var(--col,3),1fr);gap:8px}",
      ".alb-slot{position:relative;aspect-ratio:1/1.36;border-radius:7%/5%;font:inherit;padding:0;border:0;background:none;color:inherit}",
      ".alb-slot canvas,.alb-slot img{position:absolute;inset:0;width:100%;height:100%}",
      ".alb-slot .n{position:absolute;left:0;right:0;top:6%;text-align:center;font-weight:900;font-size:.7rem;color:rgba(255,255,255,.55)}",
      // le figurine che mancano: A sagoma con numero e nome · B solo il numero · C il dorso col numero
      ".alb-vuota{position:absolute;inset:0;border-radius:inherit;border:1.5px dashed rgba(255,255,255,.22);background:radial-gradient(120% 90% at 50% 30%,rgba(255,255,255,.07),rgba(0,0,0,.25));display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}",
      ".alb-vuota .ombra{width:46%;aspect-ratio:1/1.15;opacity:.28}",
      ".alb-vuota .num{font-family:var(--o-tit);font-weight:800;font-size:1.25rem;color:rgba(255,255,255,.55);line-height:1}",
      ".alb-vuota .nm{font-size:.66rem;font-weight:800;color:rgba(255,255,255,.55);text-align:center;padding:0 4px;margin-top:3px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".alb-vuota .ru{font-size:.6rem;font-weight:800;letter-spacing:.06em;color:rgba(255,255,255,.4)}",
      ".alb-vuota.sola .num{font-size:1.9rem}",
      ".alb-dorso{position:absolute;inset:0;border-radius:inherit;overflow:hidden;filter:saturate(.6) brightness(.55)}.alb-dorso img{width:100%;height:100%}",
      ".alb-dorso-n{position:absolute;left:0;right:0;top:9%;text-align:center;font-family:var(--o-tit);font-weight:800;font-size:1.05rem;color:#ffd27a;text-shadow:0 1px 3px #000}",
      // le linguette delle stagioni (A) e lo scaffale (B)
      ".alb-ling{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 -4px 10px;padding:0 4px}.alb-ling::-webkit-scrollbar{display:none}",
      ".alb-ling button{flex:0 0 auto;font:inherit;font-weight:800;font-size:.85rem;padding:7px 12px;border-radius:99px;border:1px solid var(--o-filo);background:var(--o-carta);color:var(--o-tenue)}",
      ".alb-ling button.on{background:var(--o-scuro);color:var(--o-scuro-testo)}",
      ".alb-scaff{display:grid;grid-template-columns:repeat(var(--col,3),1fr);gap:10px}",
      ".alb-cop{position:relative;aspect-ratio:3/4;border-radius:10px 14px 14px 10px;padding:10px 8px;display:flex;flex-direction:column;justify-content:space-between;color:#fff;font:inherit;border:0;text-align:left;",
        "background:linear-gradient(160deg,var(--c1),var(--c2));box-shadow:inset 6px 0 0 rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.25),0 10px 20px -10px #000}",
      ".alb-cop b{font-family:var(--o-tit);font-size:1.05rem;line-height:1.05}.alb-cop small{font-size:.72rem;opacity:.85;font-weight:700}",
      ".alb-cop .pc{font-weight:900;font-size:.85rem;background:rgba(0,0,0,.35);border-radius:99px;padding:2px 8px;align-self:flex-start}",
      ".alb-cop.chiuso{filter:grayscale(.85) brightness(.6)}",
      // le frecce delle pagine (navigazione B)
      ".alb-sfoglia{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:10px 0 0}",
      ".alb-sfoglia button{font:inherit;font-weight:900;width:44px;height:44px;border-radius:50%;border:1px solid var(--o-filo);background:var(--o-carta);color:var(--o-testo);font-size:1.3rem}",
      ".alb-pallini{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;flex:1}.alb-pallini i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.2)}.alb-pallini i.on{background:#ff4f86;width:14px;border-radius:99px}",
      // la scheda «con te»
      ".alb-velo{position:fixed;inset:0;z-index:50;background:rgba(5,7,16,.72);display:flex;align-items:flex-end;justify-content:center}",
      ".alb-foglio{width:100%;max-width:520px;max-height:calc(var(--alt,100vh) - 24px);overflow:auto;background:var(--o-carta-piena);border-radius:22px 22px 0 0;border-top:1px solid var(--o-filo-oro);padding:14px 14px calc(16px + env(safe-area-inset-bottom));box-shadow:var(--o-ombra-alta)}",
      ".alb-foglio .chiudi{float:right;font:inherit;width:34px;height:34px;border-radius:50%;border:1px solid var(--o-filo);background:var(--o-carta);color:var(--o-testo);font-weight:900}",
      ".alb-sk-a{display:flex;flex-direction:column;align-items:center;gap:10px}.fig .alb-slot{display:block;width:100%}.alb-sk-a .fig{width:46%;max-width:190px}",
      ".alb-sk-b{display:flex;gap:12px;align-items:flex-start}.alb-sk-b .fig{width:36%;flex:0 0 auto}",
      ".alb-sk-tit{font-family:var(--o-tit);font-weight:800;font-size:1.3rem;line-height:1.1}.alb-sk-sot{color:var(--o-tenue);font-size:.86rem}",
      ".alb-num{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%}",
      ".alb-num div{background:var(--o-carta);border:1px solid var(--o-filo);border-radius:12px;padding:8px 6px;text-align:center}",
      ".alb-num b{display:block;font-family:var(--o-tit);font-size:1.25rem;font-weight:800;line-height:1.1}.alb-num span{font-size:.7rem;color:var(--o-tenue);font-weight:700}",
      ".alb-righe{width:100%;display:flex;flex-direction:column;gap:2px}",
      ".alb-righe div{display:flex;justify-content:space-between;gap:10px;padding:6px 2px;border-bottom:1px solid var(--o-filo);font-size:.9rem}.alb-righe div span{color:var(--o-tenue);white-space:nowrap}.alb-righe div b{text-align:right}",
      ".alb-best{width:100%;background:var(--o-crema);border:1px solid rgba(255,79,134,.35);border-radius:14px;padding:9px 11px;font-size:.88rem}.alb-best b{color:#ff9fbc}",
      ".alb-tutte{width:100%;background:var(--o-carta);border:1px solid var(--o-filo-oro);border-radius:14px;padding:9px 11px}",
      ".alb-mai{color:var(--o-tenue);font-size:.9rem;text-align:center;padding:10px}",
      // dove si apre: la riga dell'album sotto «Come si gioca» (A), il riquadro nel profilo (B), l'avviso dopo il podio (C)
      ".alb-entra{display:flex;align-items:center;gap:12px;width:100%;margin:12px 0 0;padding:12px 14px;border-radius:16px;border:1px solid rgba(242,194,48,.45);background:linear-gradient(135deg,rgba(92,74,12,.5),rgba(30,36,62,.6));color:var(--o-testo);font:inherit;text-align:left}",
      ".alb-entra .ic{font-size:1.8rem}.alb-entra b{display:block;font-family:var(--o-tit);font-size:1.05rem}.alb-entra span{font-size:.82rem;color:var(--o-tenue)}.alb-entra .fr{margin-left:auto;font-size:1.4rem;color:var(--o-tenue)}",
      ".alb-prof{margin:14px 0;padding:12px;border-radius:18px;background:var(--o-carta);border:1px solid var(--o-filo-oro)}",
      ".alb-prof .riga{display:flex;gap:6px;margin-top:10px}.alb-prof .alb-tot b{white-space:nowrap;font-size:1.7rem}.alb-prof .riga>*{flex:1}"
    ].join("\n");
    P.document.head.appendChild(s);
  }

  // ---- 4. i pezzi ----
  function stemma(sq) { var c = A.coloriSquadra(sq) || ["#445", "#889"]; return el("div", { class: "stemma", style: "background:linear-gradient(90deg," + c[0] + " 50%," + (c[1] || c[0]) + " 50%)" }); }
  function testata(l, titolo) {
    var o = conta(l), perc = Math.round(o.p * 100 / Math.max(1, o.n));
    return el("div", { class: "alb-testa" }, [
      el("div", { class: "alb-tot" }, [ el("b", { text: o.p + " / " + o.n }), el("span", { text: titolo || "figurine" }) ]),
      el("div", { class: "alb-barra" }, [ el("i", { style: "width:" + perc + "%" }) ]),
      el("div", { class: "alb-met" }, ["oro", "argento", "bronzo"].map(function (m) { return el("span", { class: m, text: { oro: "🥇", argento: "🥈", bronzo: "🥉" }[m] + " " + o[m][0] + "/" + o[m][1] }); }))
    ]);
  }
  // una figurina: presa = disegnata quando si vede (IntersectionObserver), mancante = la sagoma della scelta
  var OSS = null, TEMPI = [];
  function osserva() {
    if (OSS) OSS.disconnect();
    OSS = new P.IntersectionObserver(function (voci) { voci.forEach(function (v) { if (v.isIntersecting) { OSS.unobserve(v.target); disegna(v.target); } }); }, { rootMargin: "120px" });
  }
  function disegna(slot) {
    var c = slot.__c, w = Math.max(40, Math.round(slot.clientWidth)), t0 = P.performance.now();
    var src = A.figurinaCanvas(c, null, w, false); if (!src) return;
    var cv = P.document.createElement("canvas"); cv.width = src.width; cv.height = src.height; cv.getContext("2d").drawImage(src, 0, 0);
    slot.appendChild(cv); TEMPI.push(P.performance.now() - t0);
  }
  ALB.tempi = function () { var t = TEMPI.slice().sort(function (a, b) { return a - b; }); return t.length ? { n: t.length, med: Math.round(t[t.length >> 1]), max: Math.round(t[t.length - 1]), tot: Math.round(t.reduce(function (a, b) { return a + b; }, 0)) } : null; };
  var OMBRA = '<svg viewBox="0 0 100 115" class="ombra"><circle cx="50" cy="30" r="22" fill="#fff"/><path d="M8 115c2-34 18-50 42-50s40 16 42 50z" fill="#fff"/></svg>';
  function slot(c, mancante) {
    var b = el("button", { class: "alb-slot", onclick: function () { ALB.scheda(c, ALB.sceltaScheda || "A"); } }); b.__c = c;
    if (c.preso) { OSS.observe(b); return b; }
    var ru = { P: "POR", D: "DIF", C: "CEN", A: "ATT" }[c.ruolo];
    if (mancante === "B") b.appendChild(el("div", { class: "alb-vuota sola" }, [ el("div", { class: "num", text: c.num }), el("div", { class: "ru", text: ru }) ]));
    else if (mancante === "C") { var d = el("div", { class: "alb-dorso" }, [ el("img", { src: A.dorsoURL() }) ]); b.appendChild(d); b.appendChild(el("div", { class: "alb-dorso-n", text: "N. " + c.num })); }
    else b.appendChild(el("div", { class: "alb-vuota", html: OMBRA }, [ el("div", { class: "num", text: c.num }), el("div", { class: "nm", text: c.nome }), el("div", { class: "ru", text: ru }) ]));
    return b;
  }
  function colonne() { return P.innerWidth >= 400 ? 4 : 3; }
  function paginaSquadra(sq, mancante, perRuolo) {
    var l = album().per[sq], o = conta(l), cc = A.coloriSquadra(sq) || ["#334"];
    var pag = el("div", { class: "alb-pag", style: "--sqa:" + cc[0] + "88" }, [
      el("div", { class: "alb-pag-t" }, [ stemma(sq), el("b", { text: sq }), el("span", { text: o.p + "/" + o.n }) ])
    ]);
    if (perRuolo) RUOLI.forEach(function (r) {
      var lr = l.filter(function (c) { return c.ruolo === r; }); if (!lr.length) return;
      pag.appendChild(el("div", { class: "alb-ruolo", text: NOME_RUOLO[r] }));
      pag.appendChild(el("div", { class: "alb-gr", style: "--col:" + colonne() }, lr.map(function (c) { return slot(c, mancante); })));
    });
    else pag.appendChild(el("div", { class: "alb-gr", style: "--col:" + colonne() }, l.map(function (c) { return slot(c, mancante); })));
    return pag;
  }
  function schermataAlbum(sotto, indietro) {
    var s = C.schermata({ icona: "📒", titolo: "Album", sotto: sotto || "Mini Asta · " + (ALB.stag ? A.nomeStagione(ALB.stag) : "Serie A di oggi"), indietro: indietro || function () {} });
    s.classList.add("alb"); return s;
  }
  function linguette(s) {
    var tab = el("div", { class: "alb-ling" }, ["Oggi"].concat(A.ELENCO.slice().reverse()).map(function (x, i) {
      var id = i ? x : null, on = (ALB.stag || null) === id;
      return el("button", { class: on ? "on" : "", text: i ? x.replace("20", "") : "Oggi" });
    }));
    s._contenuto.appendChild(tab);
  }

  // ---- 5. le scene delle foto ----
  ALB.scena = async function (nome, scelta, opz) {
    opz = opz || {}; osserva(); TEMPI = [];
    var ch = P.document.querySelector(".alb-velo"); if (ch) ch.remove();
    var av = P.document.querySelectorAll(".avviso-trofeo"); [].forEach.call(av, function (x) { x.remove(); });
    var s, ab = album(), manc = opz.mancante || "A";
    if (nome === "indice") {   // 🧭 NAVIGAZIONE A: prima le squadre, poi la pagina
      s = schermataAlbum(); if (opz.linguette) linguette(s);
      s._contenuto.appendChild(testata(ab.tutte));
      s._contenuto.appendChild(el("div", { class: "alb-sq", style: "--col:2" }, ab.squadre.map(function (sq) {
        var o = conta(ab.per[sq]); return el("button", { class: "alb-tess" + (o.p === o.n ? " piena" : "") }, [ stemma(sq), el("div", { class: "tx" }, [ el("b", { text: sq }), el("span", { text: o.p + " / " + o.n }), el("div", { class: "mini" }, [ el("i", { style: "width:" + Math.round(o.p * 100 / o.n) + "%" }) ]) ]) ]);
      })));
    } else if (nome === "squadra") {   // la pagina di una squadra (dentro la navigazione A o C)
      s = schermataAlbum(opz.sq + " · " + (ALB.stag ? A.nomeStagione(ALB.stag) : "Serie A di oggi"));
      s._contenuto.appendChild(paginaSquadra(opz.sq, manc, scelta === "B"));
    } else if (nome === "sfoglia") {   // 🧭 NAVIGAZIONE B: una squadra per pagina, si sfoglia di lato
      s = schermataAlbum(); if (opz.linguette) linguette(s);
      s._contenuto.appendChild(testata(ab.tutte));
      s._contenuto.appendChild(paginaSquadra(opz.sq, manc, false));
      var i = ab.squadre.indexOf(opz.sq);
      s._contenuto.appendChild(el("div", { class: "alb-sfoglia" }, [ el("button", { text: "‹" }), el("div", { class: "alb-pallini" }, ab.squadre.map(function (x, j) { return el("i", { class: j === i ? "on" : "" }); })), el("button", { text: "›" }) ]));
    } else if (nome === "lista") {   // 🧭 NAVIGAZIONE C: tutte le squadre una sotto l'altra, si scorre
      s = schermataAlbum(); if (opz.linguette) linguette(s);
      s._contenuto.appendChild(testata(ab.tutte));
      ab.squadre.forEach(function (sq) { var p = paginaSquadra(sq, manc, false); p.style.marginBottom = "10px"; s._contenuto.appendChild(p); });
    } else if (nome === "scaffale") {   // 📅 STAGIONI B: lo scaffale degli album
      s = schermataAlbum("Mini Asta · i tuoi album");
      s._contenuto.appendChild(el("p", { class: "alb-sk-sot", text: "Un album per ogni stagione: si riempie giocando con quell'anno." }));
      var COL = [["#e0225a", "#5a1030"], ["#2c5f8a", "#0e2340"], ["#3a7d44", "#10301a"], ["#8a5cff", "#2a1660"], ["#c77a1d", "#4a2a08"], ["#1d8a8a", "#0a3333"]];
      var st = [null].concat(A.ELENCO.slice().reverse()), finte = { "2017-18": 41, "2022-23": 12, "2025-26": 3 };
      s._contenuto.appendChild(el("div", { class: "alb-scaff", style: "--col:" + (P.innerWidth >= 400 ? 3 : 3) }, st.map(function (id, i) {
        var tot = id ? { "2015-16": 191, "2016-17": 198, "2017-18": 202, "2018-19": 228, "2019-20": 198, "2020-21": 230, "2021-22": 228, "2022-23": 243, "2023-24": 232, "2024-25": 234, "2025-26": 237 }[id] : ab.n || ab.tutte.length;
        var p = id ? (finte[id] || 0) : conta(ab.tutte).p, cc = COL[i % COL.length];
        return el("button", { class: "alb-cop" + (p ? "" : " chiuso"), style: "--c1:" + cc[0] + ";--c2:" + cc[1] }, [
          el("small", { text: "Serie A" }), el("b", { text: id ? id : "Oggi" }), el("span", { class: "pc", text: p ? p + "/" + tot : "🔒 " + tot })
        ]);
      })));
    } else if (nome === "modo") {   // 🚪 DOVE SI APRE A: sotto «Come si gioca», nella prima schermata della Mini Asta
      var g = C.giochi.filter(function (x) { return x.id === "astafanta"; })[0];
      C.schermataModo(g); await W.dorme(200);
      var o = conta(ab.tutte), cont = q(".mg-come") && q(".mg-come").parentNode;
      cont.appendChild(el("button", { class: "alb-entra" }, [ el("div", { class: "ic", text: "📒" }), el("div", {}, [ el("b", { text: "Il tuo album" }), el("span", { text: o.p + " figurine su " + o.n + " · 🥇 " + o.oro[0] }) ]), el("div", { class: "fr", text: "›" }) ]));
      return;
    } else if (nome === "profilo") {   // 🚪 DOVE SI APRE B: nel profilo
      C.schermataHome(); await W.dorme(300);
      var bt = [].filter.call(P.document.querySelectorAll(".menu-sotto button, .menu-sotto a"), function (b) { return /Profilo/.test(b.textContent); })[0];
      if (bt) bt.click(); await W.dorme(400);
      var o2 = conta(ab.tutte), cnt = q(".schermata .contenuto"), dopo = q(".gt-profilo");
      var box = el("div", { class: "alb-prof" }, [ el("div", { class: "alb-tot" }, [ el("b", { text: "📒 " + o2.p + " / " + o2.n }), el("span", { text: "figurine della Mini Asta" }) ]),
        el("div", { class: "alb-barra", style: "margin-top:8px" }, [ el("i", { style: "width:" + Math.round(o2.p * 100 / o2.n) + "%" }) ]),
        el("div", { class: "riga" }, [ el("button", { class: "btn btn-primario", text: "📒 Apri l'album" }) ]) ]);
      if (dopo && dopo.nextSibling) cnt.insertBefore(box, dopo.nextSibling); else cnt.insertBefore(box, cnt.firstChild);
      return;
    } else if (nome === "avviso") {   // 🚪 DOVE SI APRE C: in più, dopo il podio un avviso «📒 Nuove figurine» (come quello dei trofei)
      C.schermataHome(); await W.dorme(300);
      var bx = el("div", { class: "avviso-trofeo oro tl-oro dentro" }, [ el("div", { class: "at-ico", text: "📒" }), el("div", { class: "at-corpo" }, [ el("div", { class: "at-su", text: "📒 Nell'album" }), el("div", { class: "at-nome", text: "2 figurine nuove" }), el("div", { class: "at-gioco", text: "Martinez L. e Dimarco · tocca per vederle" }) ]) ]);
      P.document.body.appendChild(bx); return;
    }
    C.mostra(s); await W.dorme(250);
  };
  // la scheda «con te» (A: figurina grande sopra e numeri a quadretti · B: figurina a sinistra e righe)
  ALB.scheda = function (c, scelta) {
    var vec = P.document.querySelector(".alb-velo"); if (vec) vec.remove();
    var x = conTe(c), fig = el("div", { class: "fig" }), cv = A.figurinaCanvas(c, null, scelta === "B" ? 120 : 170, false);
    if (cv && c.preso) { var cp = P.document.createElement("canvas"); cp.width = cv.width; cp.height = cv.height; cp.style.width = "100%"; cp.getContext("2d").drawImage(cv, 0, 0); fig.appendChild(cp); }
    else fig.appendChild(slot(Object.assign({}, c, { preso: false }), ALB.mancante || "A"));
    var tit = el("div", {}, [ el("div", { class: "alb-sk-tit", text: c.nome }), el("div", { class: "alb-sk-sot", text: "N. " + c.num + " · " + c.squadra + " · " + { P: "Portiere", D: "Difensore", C: "Centrocampista", A: "Attaccante" }[c.ruolo] }) ]);
    var corpo;
    if (!c.preso) { fig.style.width = "34%"; corpo = [ el("div", { class: "alb-sk-a" }, [ fig, tit, el("div", { class: "alb-mai", text: ALB.chi ? ALB.chi + " non l'ha ancora preso." : "Non l'hai ancora preso. Compralo all'asta e la figurina si attacca qui." }) ]) ]; }
    var paga = x.volte > 1 ? "pagato in media " + virgola(x.prezzo, 0) + " · da " + x.pMin + " a " + x.pMax : "pagato " + x.prezzo, uffT = x.uff ? "📋 " + x.uff + (x.uff === 1 ? " volta" : " volte") + " d'ufficio" : "";
    var stagT = "Con " + (ALB.chi || "te") + " nella " + (ALB.stag ? A.nomeStagione(ALB.stag) : "Serie A di oggi");
    if (!c.preso) { /* (mai presa: solo la sagoma e «Non l'hai ancora preso», sopra) */ } else if (scelta === "B") corpo = [ el("div", { class: "alb-sk-b" }, [ fig, el("div", { style: "flex:1;min-width:0" }, [ tit,
        el("div", { class: "alb-ruolo", text: stagT }),
        el("div", { class: "alb-righe" }, [
          riga("Comprato all'asta", x.volte + (x.volte === 1 ? " volta" : " volte")),
          riga("Pagato in media", virgola(x.prezzo, 0) + " 💰"), riga("Il più basso · alto", x.pMin + " · " + x.pMax),
          x.uff ? riga("D'ufficio", x.uff + (x.uff === 1 ? " volta" : " volte")) : null,
          riga("Voto", virgola(x.v, 1) + " · " + x.part + (x.part === 1 ? " partita" : " partite")),
          riga("Fantamedia", virgola(x.fv, 1)),
          riga("Gol", x.gol), riga("Assist", x.ass), riga("Cartellini", x.amm + (x.esp ? " + " + x.esp + " rosso" : "")),
          riga("Vinte con lui", x.vinte + " su " + x.part)
        ].filter(Boolean)) ]) ]), best(x) ];
    else corpo = [ el("div", { class: "alb-sk-a" }, [ fig, tit,
        el("div", { class: "alb-ruolo", style: "align-self:flex-start;margin:2px 2px 0", text: stagT }),
        el("div", { class: "alb-num" }, [ num(virgola(x.v, 1), "voto · " + x.part + (x.part === 1 ? " partita" : " partite")), num(virgola(x.fv, 1), "fantamedia"), num(x.vinte + "/" + x.part, "vinte con lui"),
          num(x.gol, "gol"), num(x.ass, "assist"), num(x.amm + (x.esp ? " · " + x.esp + "🟥" : ""), "gialli") ]),
        el("div", { class: "alb-righe" }, [ riga("Comprato all'asta", x.volte + (x.volte === 1 ? " volta" : " volte")), riga("💰 Prezzo", paga), uffT ? riga("Senza asta", uffT) : null ].filter(Boolean)),
        best(x) ].concat(scelta === "C" ? [ tutte(x) ] : [])) ];
    function tutte(x) { return el("div", { class: "alb-tutte" }, [ el("div", { class: "alb-ruolo", style: "margin:0 0 6px", text: "In tutte le stagioni" }),
        el("div", { class: "alb-righe" }, [ riga("Stagioni", "3 · Oggi, 2024-25, 2017-18"), riga("Partite · voto", (x.part + 8) + " · " + virgola(x.v + 0.2, 1)), riga("Gol · assist", (x.gol + 6) + " · " + (x.ass + 2)), riga("Comprato", (x.volte + 4) + " volte · in media " + virgola(x.prezzo + 2, 0) + " 💰") ]) ]); }
    var fo = el("div", { class: "alb-foglio" }, [ el("button", { class: "chiudi", text: "✕", onclick: function () { velo.remove(); } }) ].concat(corpo));
    var velo = el("div", { class: "alb-velo", onclick: function (e) { if (e.target === velo) velo.remove(); } }, [ fo ]);
    P.document.body.appendChild(velo);
    function riga(a, b) { return el("div", {}, [ el("span", { text: a }), el("b", { text: b }) ]); }
    function num(a, b) { return el("div", {}, [ el("b", { text: String(a) }), el("span", { text: b }) ]); }
    function best(x) { return el("div", { class: "alb-best", html: "⭐ La partita migliore: <b>" + virgola(x.best, 1) + "</b> di fantavoto contro il " + x.bestAvv + " (" + x.bestData + ")" + (x.bestGol ? " · " + x.bestGol + " gol" : "") }); }
  };
  ALB.trova = function (nome) { return album().tutte.filter(function (c) { return c.nome === nome; })[0] || null; };
  ALB.album = album; ALB.A = function () { return A; }; ALB.P = function () { return P; };
})();
