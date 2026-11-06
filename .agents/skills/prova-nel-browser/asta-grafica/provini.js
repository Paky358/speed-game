// I PROVINI DELLA GRAFICA DELLA GIORNATA (6 nov 2026, il proprietario: «prepara prima le foto, così le guardo»).
// NON è il gioco: sopra la giornata VERA (campo, quadretti, risultati) si disegnano le proposte, per fotografarle.
// Lo usa foto.js (qui accanto, Edge invisibile): apre 4 telefoni finti, fa l'asta veloce, va alla giornata sul telefono
// di Paky (390x844) e la ferma nei momenti giusti. asta.js arriva con 6 agganci messi da foto.js (window.__RIV, __PV_*).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  var NOMI = ["Paky", "Giulia", "Luca", "Marta"], PV = W.PV = { log: [] };

  // ---------- la partita vera, fino alla giornata ----------
  // (6 nov, dopo la scelta del proprietario) PV.prepara("asta") si ferma alla terza carta all'asta col telefono di Paky già grande
  // (per la foto della maglia girata); poi PV.prepara() continua da lì
  var ST = null;
  PV.prepara = async function (stop) {
    var imp = { formato: "fanta", vs: !!PV.vs }, fino = Date.now() + 360000, visti = ST ? ST.visti : {}, P, C, carte = ST ? ST.carte : 0;
    if (!ST) {
      P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }); if (P.SG && P.SG.scaricaGioco) await P.SG.scaricaGioco("asta"); await W.dorme(500); C = await W.apriStanza(P, "L'Asta");
      for (var i = 1; i < NOMI.length; i++) await W.apriTel(NOMI[i], { hash: "gioco=asta&stanza=" + C, x: 600 + 200 * i });
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === NOMI.length; }, 15000)) no("non entrano tutti");
      W.clicca(P, /Comincia/);
      if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
      var f0 = document.getElementById("tel-Paky"); f0.style.cssText = "position:absolute;top:0;left:0;width:390px;height:844px;border:0;background:#000;transform:none;z-index:9"; P.dispatchEvent(new P.Event("resize"));
      ST = { P: P, C: C, visti: visti, carte: 0 };
    } else { P = ST.P; C = ST.C; }
    while (Date.now() < fino && vm(C).fase !== "fine") {
      if (stop === "asta" && vm(C).asta && vm(C).asta.nCarta >= 2 && q(P, ".st-maglia") && q(P, ".st-maglia").src) { await W.dorme(900); return "asta: carta " + vm(C).asta.nCarta; }
      var v = vm(C), a = v.asta;
      if (v.fase !== "asta" || !a || visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) { await W.dorme(200); continue; }
      visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
      var elegg = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
      if (!a.leaderId) { var pr = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; })[0]; if (pr) { if (pr.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else W.reteDi(pr.nome).invia({ t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta }); } }
      else elegg.forEach(function (n) { if ((n === "Paky" ? "host" : A.mioId(n)) === a.leaderId) return; if (n === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else W.reteDi(n).invia({ t: "passa", n: a.nCarta }); });
      await W.dorme(250);
    }
    if (vm(C).fase !== "fine") no("l'asta non finisce");
    PV.C = C; PV.cl = vm(C).classifica;
    var f = document.getElementById("tel-Paky");
    f.style.cssText = "position:absolute;top:0;left:0;width:390px;height:844px;border:0;background:#000;transform:none;z-index:9";
    P.dispatchEvent(new P.Event("resize"));
    for (var j = 0; j < NOMI.length; j++) { var wj = W.finestra(NOMI[j]); if (!await W.aspetta(function () { return q(wj, ".st-rivela"); }, 15000)) no("niente classifica delle rose"); W.clicca(wj, /Salta/); }   // (UN tocco: il secondo salterebbe la giornata)
    if (!await W.aspetta(function () { return q(P, ".st-gio-riga"); }, 20000)) no("la giornata non parte");
    tempo(P);
    return "giornata partita";
  };
  PV.veloce = function () { var b = q(PV.w(), ".st-bar-vel"); if (b && !b.classList.contains("on")) b.click(); };
  PV.w = function () { return W.finestra("Paky"); };

  // ---------- il tempo del telefono di Paky: si ferma e riparte (per fotografare un istante) ----------
  function tempo(w) {
    if (w.__T) return;
    var T = w.__T = { off: 0, fermo: null, coda: [] }, D = w.Date, dn = D.now.bind(D), pf = w.performance, pn = pf.now.bind(pf), st = w.setTimeout, raf = w.requestAnimationFrame;
    D.now = function () { return T.fermo != null ? T.fermo.d : dn() - T.off; };
    pf.now = function () { return T.fermo != null ? T.fermo.p : pn() - T.off; };
    w.setTimeout = function (f, ms) { var a = [].slice.call(arguments, 2); if (T.fermo) { T.coda.push([f, ms, a]); return -1; } return st.call(w, function () { if (T.fermo) { T.coda.push([f, 0, a]); return; } if (typeof f === "function") f.apply(w, a); }, ms); };
    w.requestAnimationFrame = function (f) { if (T.fermo) { T.coda.push(["raf", f]); return 0; } return raf.call(w, function (ts) { if (T.fermo) { T.coda.push(["raf", f]); return; } f(ts - T.off); }); };
    T.ferma = function () { if (T.fermo) return; T.fermo = { d: dn() - T.off, p: pn() - T.off, r: dn() }; };
    T.riparti = function () {
      if (!T.fermo) return; T.off += dn() - T.fermo.r; T.fermo = null;
      var c = T.coda.splice(0); c.forEach(function (x) { if (x[0] === "raf") w.requestAnimationFrame(x[1]); else w.setTimeout.apply(w, [x[0], x[1]].concat(x[2])); });
    };
  }
  PV.ferma = function () { PV.w().__T.ferma(); };
  PV.riparti = function () { togli(); PV.w().__T.riparti(); };

  // ---------- aspetta un momento della giornata e si ferma lì ----------
  function R() { return PV.w().__RIV; }
  function nostro(sc) { return sc && sc.attori.some(function (a) { return a.chi && a.chi.faccia; }); }
  var COND = {
    gol: function (r) { var a = r.az, sc = a && a.sc; return sc && !sc.replay && sc.rete != null && a.p >= sc.rete + 0.02 && sc.fest && sc.fest.chi && sc.fest.chi.faccia && sc.tipo !== "rig"; },
    azione: function (r) { var a = r.az, sc = a && a.sc; return sc && !sc.replay && sc.tipo !== "rig" && a.p > 0.35 && a.p < 0.5 && nostro(sc); },
    replay: function (r) { var a = r.az, sc = a && a.sc; return sc && sc.replay && a.p > 0.3; },
    pagella: function () { var p = q(PV.w(), ".st-pag.on:not(.live) .st-pag-tit"); return p && /La pagella/.test(p.textContent); }
  };
  PV.aspetta = async function (nome, ms) {
    var w = PV.w(), t0 = Date.now(), r;
    while (Date.now() - t0 < (ms || 240000)) {
      r = R();
      if (r && COND[nome](r)) { PV.ferma(); PV.sc = r.az && r.az.sc; PV.p = r.az && r.az.p; return "fermo su " + nome + (PV.sc ? " (" + PV.sc.tipo + "/" + PV.sc.v + ")" : ""); }
      await new Promise(function (res) { setTimeout(res, 15); });
    }
    return "NO: " + nome + " non arriva";
  };
  // un istante della stessa scena (p = 0-1), con la telecamera cambiata se serve
  PV.foto = function (p, cambi) {
    var r = R(), sc = PV.sc, s2 = sc;
    if (cambi) { s2 = {}; for (var k in sc) s2[k] = sc[k]; for (k in cambi) s2[k] = cambi[k]; }
    r.az.foto(s2, p);
  };

  // ---------- gli agganci dentro il campo (asta.js con gli agganci di foto.js) ----------
  function aggancia(o) { var w = PV.w(); ["__PV_MAGLIA", "__PV_FIG", "__PV_FONDO", "__PV_SOPRA", "__PV_PALLA"].forEach(function (k) { w[k] = o[k] || null; }); }
  // il numero sulla maglia (nel disegno dell'omino: la maglia è già ritagliata)
  function numeri(ctx, u, kit, o, dir) {
    if (!o.num) return;
    ctx.save(); ctx.scale(dir, 1);
    var chiaro = /^#(f|e|d|c)/i.test(kit.a) || kit.a === "#ffd400" || kit.a === "#f2d200";
    ctx.font = "900 " + (u * 0.5).toFixed(1) + "px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineWidth = u * 0.09; ctx.strokeStyle = chiaro ? "rgba(255,255,255,.7)" : "rgba(0,0,0,.55)"; ctx.strokeText(o.num, 0, -u * 1.42);
    ctx.fillStyle = chiaro ? "#14171f" : "#ffffff"; ctx.fillText(o.num, 0, -u * 1.42);
    ctx.restore();
  }
  function numeraTutti(fig) { fig.forEach(function (f, i) { if (!f.o.num) f.o.num = String(f.o.guanti ? 1 : [9, 10, 7, 8, 4, 5, 3, 2, 11, 6, 14, 21, 23, 17, 19, 20][i % 16]); }); }
  function chiSegna(fig) { var c = PV.sc.fest && PV.sc.fest.chi; return fig.filter(function (f) { return c && f.chi === c; })[0] || null; }
  function portaInAlto(sc) { var r = R(); r.az.foto(sc, sc.rete); return r.az.dove[1] < r.az.h / 2; }   // (dove entra il pallone: in alto o in basso sullo schermo)

  // ---------- le scritte di servizio sulla foto ----------
  function d() { return PV.w().document; }
  function nodo(html, css) { var n = d().createElement("div"); n.className = "pv-ov"; n.style.cssText = "position:fixed;z-index:9999;pointer-events:none;" + (css || ""); n.innerHTML = html; d().body.appendChild(n); return n; }
  function togli() { qa(PV.w(), ".pv-ov").forEach(function (n) { n.remove(); }); aggancia({}); var m = q(PV.w(), ".st-msg"); if (m) m.style.visibility = ""; var cv = q(PV.w(), "canvas.st-az"); if (cv) { cv.style.transform = ""; cv.style.transformOrigin = ""; } var bx = q(PV.w(), ".st-az-box"); if (bx) { bx.style.overflow = ""; bx.style.background = ""; } }
  PV.togli = togli;
  function etichetta(t) { nodo("<b>" + t + "</b>", "top:6px;right:6px;background:rgba(224,34,90,.92);color:#fff;font:900 12px system-ui,sans-serif;padding:3px 8px;border-radius:9px;box-shadow:0 2px 6px rgba(0,0,0,.4)"); }
  function box(sel) { var n = q(PV.w(), sel); return n ? n.getBoundingClientRect() : { left: 0, top: 0, width: 390, height: 300, right: 390, bottom: 300 }; }
  function ridisegna() { if (!PV.sc) return; PV.foto(PV.pp != null ? PV.pp : PV.p, PV.cambi); }
  function nascondiMsg() { var m = q(PV.w(), ".st-msg"); if (m) m.style.visibility = "hidden"; }

  // i dati del gol fermo: chi segna, la sua squadra, chi l'ha comprato
  function datiGol() {
    var r = R(), sc = PV.sc, chi = sc.fest.chi, id = Object.keys(r.colP).filter(function (k) { return r.colP[k] === chi.pc; })[0], riga = r.righe.filter(function (x) { return x.id === id; })[0] || r.righe[0];
    var bar = q(PV.w(), ".st-bar-in"), min = (q(PV.w(), ".st-bar-min") || {}).textContent || "";
    var cal = riga.kit.filter(function (c) { return c.nome.toUpperCase().indexOf(String(chi.nome).toUpperCase().split(" ")[0]) >= 0; })[0] || riga.kit[4];
    var sq = cal ? cal.squadra : "Inter", col = W.finestra("Paky").__PV.coloriSquadra(sq) || ["#0b4ea2", "#111"];
    return { nome: chi.nome, pc: chi.pc, compratore: riga.nome, id: id, sq: sq, col: col, min: min, partita: bar ? [].map.call(bar.children, function (x) { return x.textContent.trim(); }).filter(Boolean).join(" ") : "", busto: r.busti[id], riga: riga, cal: cal,
      maglia: W.finestra("Paky").__PV.maglia(sq) };
  }
  function scuroTesto(hex) { var n = parseInt(hex.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255) > 150; }

  // ---------- le proposte ----------
  var PROP = {};
  // 1A: la sovrimpressione come in TV (banda in basso), poi il +3 che vola sul quadretto
  PROP["1A"] = function () {
    var g = datiGol(), cb = box(".st-az-box"); nascondiMsg(); ridisegna();
    var tx = scuroTesto(g.col[0]) ? "#14171f" : "#fff";
    nodo('<div style="display:flex;align-items:stretch;height:74px;filter:drop-shadow(0 6px 14px rgba(0,0,0,.5))">' +
      '<div style="width:76px;background:linear-gradient(160deg,' + g.col[0] + ',' + g.col[1] + ');clip-path:polygon(0 0,100% 0,86% 100%,0 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;color:' + tx + '">' +
      '<img src="' + g.maglia + '" style="width:40px;height:40px;object-fit:contain"><b style="font:900 13px system-ui">' + g.min + '</b></div>' +
      '<div style="flex:1;margin-left:-10px;background:linear-gradient(90deg,#fff 70%,#eef1f7);clip-path:polygon(4% 0,100% 0,96% 100%,0 100%);padding:8px 10px 8px 22px;display:flex;flex-direction:column;justify-content:center;color:#14171f">' +
      '<span style="font:900 11px system-ui;letter-spacing:.14em;color:#e0225a">⚽ GOL · ' + g.sq.toUpperCase() + '</span>' +
      '<b style="font:900 24px/1.05 system-ui;letter-spacing:-.01em;text-transform:uppercase">' + g.nome + '</b>' +
      '<span style="font:700 11.5px system-ui;color:#4a5068">' + g.partita.replace(/\s+/g, " ") + '</span></div>' +
      '<div style="width:84px;margin-left:-12px;background:#14171f;clip-path:polygon(14% 0,100% 0,100% 100%,0 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px">' +
      '<img src="' + g.busto + '" style="width:40px;height:40px;border-radius:50%;background:#fff;border:3px solid ' + g.pc + '"><span style="font:900 10.5px system-ui;color:' + g.pc + '">di ' + g.compratore + '</span></div></div>' +
      '<div style="position:absolute;right:14px;top:-20px;background:linear-gradient(180deg,#ffd76a,#f0a92b);color:#3a2500;font:900 22px system-ui;padding:3px 12px;border-radius:14px;box-shadow:0 3px 0 #b67810,0 8px 18px rgba(0,0,0,.4)">+3</div>',
      "left:8px;right:8px;top:" + (cb.bottom - 96) + "px");
    etichetta("1A");
  };
  PROP["1A2"] = function () {   // il +3 che vola sul quadretto di chi l'ha comprato
    var g = datiGol(), cb = box(".st-az-box"); nascondiMsg(); ridisegna();
    var qd = qa(PV.w(), ".st-gio-riga").filter(function (z) { return z.querySelector(".st-gio-nome").textContent === g.compratore; })[0], qr = qd ? qd.getBoundingClientRect() : { left: 20, top: 20, width: 90, height: 40 };
    var x0 = cb.left + cb.width * 0.62, y0 = cb.top + cb.height * 0.55, x1 = qr.left + qr.width * 0.5, y1 = qr.top + qr.height * 0.5, h = "";
    for (var i = 0; i <= 5; i++) { var t = i / 5, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 70, s = 0.55 + 0.45 * t, o = i === 4 ? 1 : 0.18 + 0.12 * i; if (i === 5) continue;
      h += '<div style="position:fixed;left:' + (x - 26) + 'px;top:' + (y - 16) + 'px;transform:scale(' + s.toFixed(2) + ');opacity:' + o + ';background:linear-gradient(180deg,#ffd76a,#f0a92b);color:#3a2500;font:900 21px system-ui;padding:2px 10px;border-radius:14px;box-shadow:0 0 18px rgba(255,200,60,.8)">+3</div>'; }
    nodo(h, "left:0;top:0;width:0;height:0");
    if (qd) nodo("", "left:" + (qr.left - 4) + "px;top:" + (qr.top - 4) + "px;width:" + (qr.width + 8) + "px;height:" + (qr.height + 8) + "px;border-radius:14px;box-shadow:0 0 0 3px #ffd76a,0 0 26px 6px rgba(255,200,60,.75)");
    nodo('<b>la banda è scivolata via: il +3 vola sul quadretto di ' + g.compratore + ', che si accende d\'oro</b>', "left:10px;right:10px;top:" + (cb.bottom - 40) + "px;background:rgba(10,14,30,.82);color:#fff;font:800 12px system-ui;padding:7px 10px;border-radius:10px;text-align:center");
    etichetta("1A · dopo");
  };
  // 1B: il cartellone grande al centro, con la maglia, il nome e l'avatar di chi l'ha comprato che esulta
  PROP["1B"] = function () {
    var g = datiGol(), cb = box(".st-az-box"), w = PV.w(), av = w.__PV.srcAv(w.__PV.cfgDi(g.riga.nome, g.riga.omino), { braccia: "su" });
    nascondiMsg(); ridisegna();
    var tx = scuroTesto(g.col[0]) ? "#14171f" : "#fff", coriandoli = "";
    for (var i = 0; i < 34; i++) { var c = [g.col[0], g.col[1], "#ffd76a", "#fff"][i % 4]; coriandoli += '<i style="position:absolute;left:' + ((i * 37) % 100) + '%;top:' + ((i * 53) % 100) + '%;width:7px;height:11px;background:' + c + ';transform:rotate(' + (i * 47) + 'deg);border-radius:2px;opacity:.9"></i>'; }
    nodo(coriandoli, "left:" + cb.left + "px;top:" + cb.top + "px;width:" + cb.width + "px;height:" + cb.height + "px;background:rgba(6,10,24,.45)");
    nodo('<div style="position:relative;margin:0 auto;width:300px;padding:16px 14px 14px;border-radius:22px;background:linear-gradient(160deg,' + g.col[0] + ' 0%,' + g.col[1] + ' 100%);box-shadow:0 18px 40px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.35);text-align:center;color:' + tx + '">' +
      '<div style="font:900 46px/1 system-ui;letter-spacing:-.02em;text-shadow:0 3px 0 rgba(0,0,0,.25)">GOOOL!</div>' +
      '<img src="' + g.maglia + '" style="width:96px;height:96px;object-fit:contain;margin:6px 0 2px;filter:drop-shadow(0 6px 8px rgba(0,0,0,.4))">' +
      '<div style="font:900 25px/1.05 system-ui;text-transform:uppercase">' + g.nome + '</div>' +
      '<div style="font:800 12px system-ui;opacity:.85;margin-top:3px">' + g.min + ' · ' + g.partita.replace(/\s+/g, " ") + '</div>' +
      '<div style="display:inline-flex;align-items:center;gap:6px;margin-top:10px;background:rgba(255,255,255,.95);color:#14171f;border-radius:20px;padding:4px 12px 4px 4px;font:900 14px system-ui"><img src="' + g.busto + '" style="width:30px;height:30px;border-radius:50%;border:3px solid ' + g.pc + '">' + g.compratore + ' <span style="color:#d08a00">+3</span></div></div>' +
      '<img src="' + av + '" style="position:absolute;right:-6px;bottom:-60px;width:96px;transform:rotate(8deg);filter:drop-shadow(0 6px 10px rgba(0,0,0,.5))">',
      "left:" + (cb.left + 20) + "px;right:20px;top:" + (cb.top + cb.height * 0.16) + "px");
    etichetta("1B");
  };
  // 2A: maglie col numero, l'aeroplanino di chi segna (braccia larghe, si piega in curva) e la scia della corsa
  PROP["2A"] = function () {
    nascondiMsg(); PV.cambi = { zoomFine: 1.1, tz: 0 }; PV.pp = Math.min(1, PV.sc.rete + 0.2);
    aggancia({ __PV_MAGLIA: numeri, __PV_FIG: function (fig) {
      numeraTutti(fig); var s = chiSegna(fig); if (!s) return;
      s.o.braccia = 0.42; s.o.salto = 0; s.o.ruota = -0.32 * s.dir; s.o.num = "10"; s.aereo = true;
    }, __PV_SOPRA: function (ctx, A, cam, fig) {
      var s = (fig || []).filter(function (f) { return f.aereo; })[0]; if (!s) return;
      ctx.save(); ctx.translate(A.w / 2, A.h / 2); ctx.scale(cam.z, cam.z); ctx.translate(-cam.cx, -cam.cy);
      var u = A.u; ctx.lineCap = "round";
      for (var k = 0; k < 2; k++) { ctx.strokeStyle = "rgba(255,255,255," + (0.6 - k * 0.25) + ")"; ctx.lineWidth = u * (0.32 - k * 0.12); ctx.beginPath(); ctx.moveTo(s.x - s.dir * u * (1.2 + k * 0.4), s.y - u * (1.6 + k * 0.9)); ctx.quadraticCurveTo(s.x - s.dir * u * 5, s.y - u * (2 + k), s.x - s.dir * u * 8.5, s.y + u * (1.4 - k)); ctx.stroke(); }
      var th = s.o.ruota, cx = s.x, cy = s.y - u * 1.75, dx = Math.cos(th) * u * 1.7, dy = Math.sin(th) * u * 1.7;   // (le ali: le braccia larghe, inclinate come il corpo)
      [["rgba(0,0,0,.55)", u * 0.34], [s.kit.a, u * 0.22]].forEach(function (z) { ctx.strokeStyle = z[0]; ctx.lineWidth = z[1]; ctx.beginPath(); ctx.moveTo(cx - dx, cy - dy); ctx.lineTo(cx + dx, cy + dy); ctx.stroke(); });
      ctx.fillStyle = "#e7b58c"; [-1, 1].forEach(function (a) { ctx.beginPath(); ctx.arc(cx + a * dx * 1.08, cy + a * dy * 1.08, u * 0.15, 0, Math.PI * 2); ctx.fill(); });
      ctx.restore();
    } });
    ridisegna();
    nodo('<b>✈️ L\'AEROPLANINO</b><br><span style="font-weight:700">numeri sulle maglie · ogni bomber la sua esultanza</span>', "left:10px;right:10px;bottom:" + (844 - box(".st-az-box").bottom + 10) + "px;background:rgba(10,14,30,.82);color:#fff;font:900 13px system-ui;padding:7px 10px;border-radius:10px;text-align:center");
    etichetta("2A");
  };
  // 2B: la scivolata in ginocchio e i compagni che arrivano ad abbracciarlo
  PROP["2B"] = function () {
    nascondiMsg(); PV.cambi = { zoomFine: 1.1, tz: 0 }; PV.pp = Math.min(1, PV.sc.rete + 0.24);
    aggancia({ __PV_MAGLIA: numeri, __PV_FIG: function (fig) {
      numeraTutti(fig); var s = chiSegna(fig); if (!s) return;
      s.o.braccia = 1; s.o.salto = 0; s.o.giu = 0.28; s.o.ruota = -0.42 * s.dir; s.o.sw = 0; s.o.sv = 0; s.scivola = true;
      var u = PV.w().__RIV.az.u;
      [[-1.25, -0.25, 1], [1.3, 0.15, -1], [0.4, -0.9, 1]].forEach(function (z, i) {
        fig.push({ x: s.x + z[0] * u * 1.0, y: s.y + z[1] * u, kit: s.kit, dir: z[2], o: { braccia: 0.75, sw: 0.2, sv: 0.3, ruota: z[2] * 0.12, pelle: ["#c88a5a", "#f1c9a5", "#8d5a3b"][i], capelli: ["#1a1410", "#6b4a2b", "#111"][i], num: ["7", "23", "4"][i] } });
      });
      fig.sort(function (a, b) { return a.y - b.y; });
    }, __PV_FONDO: function (ctx, A) {
      var s = PV.w().__RIV.az.sc; if (!s) return;
    } });
    ridisegna();
    nodo('<b>🧎 SCIVOLATA IN GINOCCHIO + ABBRACCIO</b><br><span style="font-weight:700">i compagni corrono da lui · numeri sulle maglie</span>', "left:10px;right:10px;bottom:" + (844 - box(".st-az-box").bottom + 10) + "px;background:rgba(10,14,30,.82);color:#fff;font:900 13px system-ui;padding:7px 10px;border-radius:10px;text-align:center");
    etichetta("2B");
  };
  // 3A: la curva in festa dietro la porta: tifosi, bandiere e fumogeni coi colori di chi segna; i cartelloni LED a bordo campo
  PROP["3A"] = function () {
    var g = datiGol(), cb = box(".st-az-box"), w = PV.w(); nascondiMsg(); PV.cambi = null; PV.pp = Math.min(1, PV.sc.rete + 0.2); ridisegna();
    var cv = w.document.createElement("canvas"), dd = 2, H = 70; cv.width = cb.width * dd; cv.height = H * dd; var c = cv.getContext("2d"); c.scale(dd, dd);
    var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#090c18"); gr.addColorStop(1, "#151a2e"); c.fillStyle = gr; c.fillRect(0, 0, cb.width, H);
    for (var r = 0; r < 4; r++) for (var x = 4 + (r % 2) * 5; x < cb.width; x += 10) {
      var y = 16 + r * 15, cc = (x * 7 + r * 13) % 5 < 3 ? g.col[0] : (x % 3 ? g.col[1] : "#f4f5fb"), su = (x * 13 + r * 7) % 4 === 0;
      c.fillStyle = cc; c.beginPath(); c.ellipse(x, y + 7, 4.2, 5.5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = ["#e7b58c", "#c88a5a", "#8d5a3b", "#f1c9a5"][(x + r) % 4]; c.beginPath(); c.arc(x, y, 2.6, 0, Math.PI * 2); c.fill();
      if (su) { c.strokeStyle = c.fillStyle; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x - 3, y + 3); c.lineTo(x - 5, y - 4); c.moveTo(x + 3, y + 3); c.lineTo(x + 5, y - 4); c.stroke(); }
    }
    [0.18, 0.5, 0.8].forEach(function (fx, i) {   // le bandiere
      var bx = cb.width * fx, by = 8; c.strokeStyle = "#ddd"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx, by + 40); c.lineTo(bx, by); c.stroke();
      c.beginPath(); c.moveTo(bx, by); for (var k = 0; k <= 20; k++) c.lineTo(bx + k * 2.4, by + Math.sin(k * 0.45 + i) * 3); for (k = 20; k >= 0; k--) c.lineTo(bx + k * 2.4, by + 22 + Math.sin(k * 0.45 + i + 0.6) * 3); c.closePath();
      var fg = c.createLinearGradient(0, by, 0, by + 22); fg.addColorStop(0, g.col[0]); fg.addColorStop(0.5, g.col[0]); fg.addColorStop(0.5, g.col[1]); fg.addColorStop(1, g.col[1]); c.fillStyle = fg; c.fill();
    });
    var url = cv.toDataURL();
    var alto = portaInAlto(PV.sc); PV.foto(PV.pp);   // (la porta dove si è segnato: in alto o in basso)
    var fumo = "";
    for (var k = 0; k < 7; k++) fumo += '<i style="position:absolute;left:' + (k * 15 - 4) + '%;' + (alto ? "top" : "bottom") + ':' + (40 + (k % 3) * 18) + 'px;width:' + (90 + (k % 3) * 30) + 'px;height:' + (70 + (k % 2) * 40) + 'px;border-radius:50%;background:radial-gradient(closest-side,' + (k % 3 === 2 ? "rgba(255,255,255,.75)" : (k % 2 ? g.col[0] : g.col[1]) + "ee") + ',' + (k % 2 ? g.col[0] : g.col[1]) + '00);opacity:.9;mix-blend-mode:screen"></i>';
    nodo('<img src="' + url + '" style="position:absolute;left:0;' + (alto ? "top:0" : "bottom:0") + ';width:100%;height:' + H + 'px">' + fumo, "left:" + cb.left + "px;top:" + cb.top + "px;width:" + cb.width + "px;height:" + cb.height + "px;overflow:hidden");
    var led = function (lato) { return '<div style="position:absolute;' + lato + ':0;top:' + (H + 4) + 'px;bottom:4px;width:9px;background:repeating-linear-gradient(180deg,' + g.col[0] + ' 0 26px,' + g.col[1] + ' 26px 30px,#ffd76a 30px 34px);box-shadow:0 0 10px ' + g.col[0] + '"></div>'; };
    nodo(led("left") + led("right"), "left:" + cb.left + "px;top:" + cb.top + "px;width:" + cb.width + "px;height:" + cb.height + "px");
    etichetta("3A");
  };
  // 3B: notte di coppa: campo più scuro ai bordi, quattro riflettori, flash dei telefonini e i tifosi in piedi con le braccia al cielo
  PROP["3B"] = function () {
    var g = datiGol(), cb = box(".st-az-box"), w = PV.w(); nascondiMsg(); PV.cambi = null; PV.pp = PV.p; ridisegna();
    var cv = w.document.createElement("canvas"), dd = 2, W2 = cb.width, H2 = cb.height; cv.width = W2 * dd; cv.height = H2 * dd; var c = cv.getContext("2d"); c.scale(dd, dd);
    var v = c.createRadialGradient(W2 / 2, H2 / 2, H2 * 0.25, W2 / 2, H2 / 2, H2 * 0.75); v.addColorStop(0, "rgba(5,8,20,0)"); v.addColorStop(1, "rgba(5,8,20,.78)"); c.fillStyle = v; c.fillRect(0, 0, W2, H2);
    c.globalCompositeOperation = "lighter";
    [[0, 0], [W2, 0], [0, H2], [W2, H2]].forEach(function (p) {
      var l = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], H2 * 0.62); l.addColorStop(0, "rgba(255,248,220,.42)"); l.addColorStop(0.35, "rgba(255,248,220,.12)"); l.addColorStop(1, "rgba(255,248,220,0)");
      c.fillStyle = l; c.beginPath(); c.moveTo(p[0], p[1]); var a = Math.atan2(H2 / 2 - p[1], W2 / 2 - p[0]); c.arc(p[0], p[1], H2 * 0.62, a - 0.33, a + 0.33); c.closePath(); c.fill();
      c.fillStyle = "rgba(255,255,240,.95)"; c.beginPath(); c.arc(p[0] + (p[0] ? -6 : 6), p[1] + (p[1] ? -6 : 6), 5, 0, Math.PI * 2); c.fill();
    });
    c.globalCompositeOperation = "source-over";
    var base = H2 - 2;
    for (var x = 2; x < W2; x += 9) {   // i tifosi in piedi, in controluce
      var h = 15 + (x * 7) % 6, su = (x * 11) % 3 !== 0;
      c.fillStyle = "rgba(4,6,14,.96)"; c.beginPath(); c.ellipse(x, base - h / 2, 4.4, h / 2, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(x, base - h - 3, 3.3, 0, Math.PI * 2); c.fill();
      if (su) { c.strokeStyle = "rgba(4,6,14,.96)"; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 2, base - h + 2); c.lineTo(x - 5, base - h - 9); c.moveTo(x + 2, base - h + 2); c.lineTo(x + 5, base - h - 9); c.stroke(); }
      if ((x * 17) % 7 === 0) { c.fillStyle = "#fff"; c.shadowColor = "#fff"; c.shadowBlur = 8; c.beginPath(); c.arc(x + 5, base - h - 10, 1.8, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0; }
    }
    for (var s = 0; s < 3; s++) { c.fillStyle = s === 1 ? g.col[0] : "rgba(255,255,255,.85)"; c.fillRect(0, base - 34 - s * 3, 0, 0); }
    nodo('<img src="' + cv.toDataURL() + '" style="width:100%;height:100%">', "left:" + cb.left + "px;top:" + cb.top + "px;width:" + W2 + "px;height:" + H2 + "px");
    etichetta("3B");
  };
  // 4: il replay da dietro la porta (lo stesso gol, il campo inclinato come una telecamera dietro la rete)
  PROP["4"] = function (p) {
    var cb = box(".st-az-box"), w = PV.w(), cv = q(w, "canvas.st-az"); nascondiMsg();
    var alto = portaInAlto(PV.sc);   // (la porta in alto: si gira la scena, così la porta sta davanti a chi guarda)
    PV.cambi = { replay: false, zoomFine: 1.25, tz: 0, verso: alto ? -PV.sc.verso : PV.sc.verso }; PV.pp = p != null ? p : Math.max(0, PV.sc.rete - 0.05); ridisegna();
    q(w, ".st-az-box").style.overflow = "hidden"; q(w, ".st-az-box").style.background = "radial-gradient(circle,#46507a 1.6px,transparent 2.2px) 0 40px/9px 9px,radial-gradient(circle,#e0225a 1.4px,transparent 2px) 4px 44px/13px 11px,linear-gradient(#0b0f22,#1b2340 30%,#2f7a37 30%)";
    cv.style.transformOrigin = "50% 100%";
    cv.style.transform = "perspective(700px) rotateX(30deg) scale(1.18)";
    nodo('<div style="background:rgba(6,12,30,.84);padding:7px 10px;font:900 15px system-ui;color:#ffe066;text-align:center">🎬 IL GOL DELLA GIORNATA</div><div style="padding:5px 10px;font:900 11px system-ui;color:#fff"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#e03131;margin-right:6px"></span>REPLAY · DA DIETRO LA PORTA</div>', "left:" + cb.left + "px;top:" + cb.top + "px;width:" + cb.width + "px");
    var rete = ""; for (var i = 0; i < 26; i++) rete += '<i style="position:absolute;left:' + (i * 4) + '%;top:0;bottom:0;width:1px;background:rgba(255,255,255,.4)"></i>';
    for (i = 0; i < 5; i++) rete += '<i style="position:absolute;top:' + (i * 22) + '%;left:0;right:0;height:1px;background:rgba(255,255,255,.4)"></i>';
    nodo(rete, "left:" + (cb.left - 10) + "px;width:" + (cb.width + 20) + "px;top:" + (cb.bottom - 46) + "px;height:46px;border-top:4px solid #fff;background:linear-gradient(rgba(255,255,255,.08),rgba(255,255,255,.18))");
    etichetta("4");
  };
  // 5: il meteo della giornata (solo l'aspetto: mai i risultati)
  PROP["5"] = function (tipo) {
    var cb = box(".st-az-box"), w = PV.w(), W2 = cb.width, H2 = cb.height, cv = w.document.createElement("canvas"), dd = 2; cv.width = W2 * dd; cv.height = H2 * dd; var c = cv.getContext("2d"); c.scale(dd, dd);
    nascondiMsg(); PV.cambi = null; PV.pp = PV.p;
    aggancia({ __PV_PALLA: tipo === "neve" ? "#ff7a1a" : null });
    ridisegna();
    var chip = { sole: "☀️ Sole a Bergamo · 24°", pioggia: "🌧️ Pioggia battente a San Siro", nebbia: "🌫️ Nebbia al Tardini", neve: "❄️ Neve all'Olimpico · pallone arancione" }[tipo], i, x, y;
    if (tipo === "sole") {
      var gl = c.createLinearGradient(0, 0, W2, H2); gl.addColorStop(0, "rgba(255,214,120,.42)"); gl.addColorStop(0.45, "rgba(255,214,120,.08)"); gl.addColorStop(1, "rgba(30,20,0,.12)"); c.fillStyle = gl; c.fillRect(0, 0, W2, H2);
      c.globalCompositeOperation = "lighter"; var fl = c.createRadialGradient(18, 18, 0, 18, 18, 120); fl.addColorStop(0, "rgba(255,250,220,.95)"); fl.addColorStop(0.2, "rgba(255,230,160,.35)"); fl.addColorStop(1, "rgba(255,230,160,0)"); c.fillStyle = fl; c.fillRect(0, 0, 200, 200);
      [[0.35, 10, .25], [0.55, 16, .18], [0.75, 7, .3]].forEach(function (f) { c.fillStyle = "rgba(255,240,200," + f[2] + ")"; c.beginPath(); c.arc(W2 * f[0], H2 * f[0], f[1], 0, Math.PI * 2); c.fill(); });
      c.globalCompositeOperation = "source-over";
      c.fillStyle = "rgba(0,0,0,.18)"; for (i = 0; i < 6; i++) { c.save(); c.translate(0, H2 * (0.12 + i * 0.16)); c.rotate(-0.5); c.fillRect(-40, 0, W2 * 1.6, 10); c.restore(); }
    } else if (tipo === "pioggia") {
      c.fillStyle = "rgba(20,32,60,.38)"; c.fillRect(0, 0, W2, H2);
      c.strokeStyle = "rgba(210,225,255,.55)"; c.lineWidth = 1.1; c.lineCap = "round";
      for (i = 0; i < 260; i++) { x = (i * 97.3) % W2; y = (i * 57.7) % H2; var l = 9 + (i % 5) * 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x - l * 0.25, y + l); c.stroke(); }
      c.strokeStyle = "rgba(220,235,255,.45)"; for (i = 0; i < 30; i++) { x = (i * 131.1) % W2; y = (i * 83.3) % H2; c.beginPath(); c.ellipse(x, y, 5, 1.6, 0, 0, Math.PI * 2); c.stroke(); }
      var lu = c.createLinearGradient(0, 0, 0, H2); lu.addColorStop(0, "rgba(255,255,255,.08)"); lu.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = lu; c.fillRect(0, 0, W2, H2);
    } else if (tipo === "nebbia") {
      for (i = 0; i < 9; i++) { var ng = c.createRadialGradient((i * 83) % W2, (i * 131) % H2, 10, (i * 83) % W2, (i * 131) % H2, 150); ng.addColorStop(0, "rgba(230,235,240,.42)"); ng.addColorStop(1, "rgba(230,235,240,0)"); c.fillStyle = ng; c.fillRect(0, 0, W2, H2); }
      var nb = c.createLinearGradient(0, 0, 0, H2); nb.addColorStop(0, "rgba(225,230,236,.72)"); nb.addColorStop(0.5, "rgba(225,230,236,.25)"); nb.addColorStop(1, "rgba(225,230,236,.6)"); c.fillStyle = nb; c.fillRect(0, 0, W2, H2);
    } else if (tipo === "neve") {
      c.fillStyle = "rgba(240,246,255,.22)"; c.fillRect(0, 0, W2, H2);
      var bordo = c.createLinearGradient(0, 0, W2, 0); bordo.addColorStop(0, "rgba(255,255,255,.75)"); bordo.addColorStop(0.07, "rgba(255,255,255,0)"); bordo.addColorStop(0.93, "rgba(255,255,255,0)"); bordo.addColorStop(1, "rgba(255,255,255,.75)"); c.fillStyle = bordo; c.fillRect(0, 0, W2, H2);
      for (i = 0; i < 170; i++) { x = (i * 73.7) % W2; y = (i * 41.3) % H2; var r2 = 1 + (i % 4) * 0.7; c.fillStyle = "rgba(255,255,255," + (0.6 + (i % 3) * 0.13) + ")"; c.beginPath(); c.arc(x, y, r2, 0, Math.PI * 2); c.fill(); }
    }
    nodo('<img src="' + cv.toDataURL() + '" style="width:100%;height:100%">', "left:" + cb.left + "px;top:" + cb.top + "px;width:" + W2 + "px;height:" + H2 + "px");
    nodo(chip, "left:" + (cb.left + 8) + "px;top:" + (cb.top + 8) + "px;background:rgba(10,14,30,.8);color:#fff;font:800 12px system-ui;padding:5px 10px;border-radius:12px");
    etichetta("5 · " + tipo);
  };
  // 6A: i premi della giornata (sfottò sulla partita, non sull'asta)
  PROP["6A"] = function () {
    var r = R(), cl = PV.cl, w = PV.w(), righe = r.righe, peggio = null, saraci = null, fort = null, turista = null;
    righe.forEach(function (x) {
      var b = 0;
      x.gio.cal.forEach(function (c, k) {
        var cp = x.kit[k]; if (!peggio || c.fv < peggio.v) peggio = { v: c.fv, n: x.nome, c: cp };
        if (cp.ruolo === "P" && !c.ev.some(function (e) { return e.t === "sub"; }) && (!saraci || c.fv > saraci.fv)) saraci = { n: x.nome, c: cp, fv: c.fv };
        c.ev.forEach(function (e) { if (e.d > 0 && e.t !== "inv") b += e.d; });
      });
      if (!turista || b < turista.b) turista = { b: b, n: x.nome };
      if (!fort || x.gio.punti - x.totale * 0.5 > fort.v) fort = { v: x.gio.punti - x.totale * 0.5, n: x.nome };
    });
    function nm(s) { return String(s).split(" ")[0]; }
    var premi = [
      ["🗑️", "Il bidone della giornata", peggio ? peggio.n : "Paky", peggio ? nm(peggio.c.nome) + " · fantavoto " + String(peggio.v).replace(".", ",") : ""],
      ["🍀", "Il più fortunato", fort ? fort.n : "Giulia", "rosa da 2ª fila, punti da 1ª"],
      ["🧱", "La saracinesca", saraci ? saraci.n : "Luca", saraci ? nm(saraci.c.nome) + " · porta inviolata 🔒" : "nessuna porta inviolata"],
      ["😴", "Il turista", turista ? turista.n : "Marta", "neanche un bonus: tutti a 6 a guardare"],
      ["🎢", "Le montagne russe", "Paky e Giulia", "3 sorpassi in testa dal 75'"]
    ];
    var h = '<div style="background:#151a2e;border-radius:18px;padding:14px 12px;box-shadow:0 16px 40px rgba(0,0,0,.6);color:#f4f5fb;font-family:system-ui">' +
      '<div style="font:900 19px system-ui;text-align:center">🏅 I premi della giornata</div><div style="font:700 12px system-ui;color:#a6acc8;text-align:center;margin-bottom:10px">sfottò sulla partita, dopo il podio</div>';
    premi.forEach(function (p, i) {
      var rg = righe.filter(function (x) { return x.nome === p[2]; })[0], img = rg ? r.busti[rg.id] : "";
      h += '<div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.06);border-radius:14px;padding:8px 10px;margin:7px 0;border:1px solid rgba(255,255,255,.08)">' +
        '<div style="font-size:30px;width:38px;text-align:center">' + p[0] + '</div><div style="flex:1;min-width:0"><div style="font:900 14px system-ui;color:#ffc247">' + p[1] + '</div>' +
        '<div style="font:900 15px system-ui">' + p[2] + '</div><div style="font:700 12px system-ui;color:#a6acc8">' + p[3] + '</div></div>' + (img ? '<img src="' + img + '" style="width:42px;height:42px;border-radius:50%;background:#fff;border:3px solid ' + (r.colP[rg.id] || "#fff") + '">' : "") + '</div>';
    });
    h += '<div style="margin-top:10px;text-align:center"><span style="display:inline-block;background:#e0225a;color:#fff;font:900 14px system-ui;padding:10px 18px;border-radius:14px">📸 Manda la foto della squadra</span></div></div>';
    nodo(h, "left:12px;right:12px;top:110px");
    nodo("", "left:0;top:0;right:0;bottom:0;background:rgba(5,8,20,.55);z-index:9998");
    etichetta("6A");
  };
  // 6B: la foto della squadra vincente per WhatsApp
  PROP["6B"] = function () {
    var r = R(), righe = r.righe.slice().sort(function (a, b) { return b.gio.punti - a.gio.punti; }), x = righe[0], w = PV.w(), av = w.__PV.srcAv(w.__PV.cfgDi(x.nome, x.omino), { braccia: "su" });
    var pos = { P: [[50, 85]], D: [[50, 62]], C: [[24, 38], [76, 38]], A: [[50, 14]] }, usati = { P: 0, D: 0, C: 0, A: 0 };
    var campo = '<div style="position:relative;height:350px;margin:10px 4px 0;border-radius:14px;overflow:hidden;background:repeating-linear-gradient(180deg,#2f7a37 0 30px,#36873f 30px 60px);border:2px solid rgba(255,255,255,.5)">' +
      '<i style="position:absolute;left:0;right:0;top:50%;border-top:2px solid rgba(255,255,255,.6)"></i><i style="position:absolute;left:50%;top:50%;width:70px;height:70px;margin:-35px;border:2px solid rgba(255,255,255,.6);border-radius:50%"></i>';
    x.kit.forEach(function (c, k) {
      var pp = (pos[c.ruolo] || [[50, 50]])[usati[c.ruolo]++] || [50, 50], fv = x.gio.cal[k].fv, mg = w.__PV.maglia(c.squadra);
      campo += '<div style="position:absolute;left:' + pp[0] + '%;top:' + pp[1] + '%;transform:translate(-50%,-50%);text-align:center;width:96px"><img src="' + mg + '" style="width:42px;height:42px;object-fit:contain;filter:drop-shadow(0 3px 4px rgba(0,0,0,.4))">' +
        '<div style="font:900 11px system-ui;color:#fff;text-shadow:0 1px 2px #000">' + String(c.nome).split(" ")[0] + '</div><div style="display:inline-block;background:#fff;color:#14171f;font:900 11px system-ui;border-radius:8px;padding:0 6px">' + String(fv).replace(".", ",") + '</div></div>';
    });
    campo += '</div>';
    var h = '<div style="width:340px;margin:0 auto;background:linear-gradient(170deg,#1a1f3a,#0d1020 60%);border-radius:22px;padding:16px 12px 12px;box-shadow:0 18px 50px rgba(0,0,0,.7);color:#f4f5fb;font-family:system-ui;text-align:center;border:1px solid rgba(255,255,255,.12)">' +
      '<div style="font:900 12px system-ui;letter-spacing:.2em;color:#ffc247">CAMPIONE DELLA GIORNATA</div>' +
      '<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:6px"><img src="' + av + '" style="width:84px"><div style="text-align:left"><div style="font:900 30px/1 system-ui">' + x.nome + '</div><div style="font:900 22px system-ui;color:#ffc247">' + String(x.gio.punti).replace(".", ",") + ' <span style="font-size:13px;color:#a6acc8">fantapunti</span></div><div style="font:700 12px system-ui;color:#a6acc8">rosa da ' + x.totale + ' 💰 · ' + righe.length + ' amici</div></div></div>' +
      campo + '<div style="display:flex;justify-content:space-between;margin-top:9px;font:800 11px system-ui;color:#a6acc8"><span>SPeeD <b style="color:#e0225a">GAME</b> · Mini Asta Fantacalcio</span><span>6 nov 2026</span></div></div>';
    nodo(h, "left:0;right:0;top:120px");
    nodo("", "left:0;top:0;right:0;bottom:0;background:rgba(5,8,20,.7);z-index:9998");
    etichetta("6B");
  };
  // 7A: la telecronaca scritta sotto il campo (come i sottotitoli)
  PROP["7A"] = function () {
    var g = datiGol(), cb = box(".st-az-box"); nascondiMsg(); PV.cambi = null; PV.pp = PV.p; ridisegna();
    nodo('<div style="display:flex;gap:8px;align-items:flex-start"><span style="font-size:20px">🎙️</span><div><div style="font:900 10px system-ui;letter-spacing:.14em;color:#ffc247">LA TELECRONACA</div>' +
      '<div style="font:800 15px/1.3 system-ui">«…' + String(g.nome).split(" ")[0] + ' si gira, calcia… <b style="color:#ffe066">RETE! RETE! RETE!</b> E ' + g.compratore + ' salta sul divano!»</div></div></div>',
      "left:8px;right:8px;top:" + (cb.bottom - 86) + "px;background:rgba(6,10,24,.86);color:#fff;padding:9px 12px;border-radius:12px;border-left:4px solid #ffc247");
    etichetta("7A");
  };
  // 7B: la linea della partita: dallo 0' al 90' i momenti dei vostri calciatori, col colore di chi li ha
  PROP["7B"] = function () {
    var r = R(), cb = box(".st-az-box"), bb = box(".st-bar"), min = parseInt(((q(PV.w(), ".st-bar-min") || {}).textContent || "60"), 10) || 60; nascondiMsg(); PV.cambi = null; PV.pp = PV.p; ridisegna();
    var punti = "";
    r.righe.forEach(function (x) { x.gio.cal.forEach(function (c) { c.ev.forEach(function (e) {
      if (e.m > min || !/^(gol|ass|par|esp|rig|aut)$/.test(e.t)) return;
      var ic = { gol: "⚽", ass: "👟", par: "🧤", esp: "🟥", rig: "❌", aut: "🙈" }[e.t];
      punti += '<span style="position:absolute;left:' + (e.m / 95 * 100).toFixed(1) + '%;top:' + (e.t === "gol" ? -3 : 9) + 'px;transform:translateX(-50%);font-size:' + (e.t === "gol" ? 14 : 11) + 'px;filter:drop-shadow(0 0 3px ' + r.colP[x.id] + ') drop-shadow(0 0 2px ' + r.colP[x.id] + ')">' + ic + '</span>';
    }); }); });
    nodo('<div style="position:relative;height:26px;margin:0 6px"><div style="position:absolute;left:0;right:0;top:12px;height:3px;border-radius:2px;background:rgba(255,255,255,.18)"></div><div style="position:absolute;left:0;width:' + (min / 95 * 100).toFixed(1) + '%;top:12px;height:3px;border-radius:2px;background:#e0225a"></div>' +
      '<i style="position:absolute;left:47.4%;top:6px;width:1px;height:15px;background:rgba(255,255,255,.4)"></i><i style="position:absolute;left:78.9%;top:6px;width:1px;height:15px;background:rgba(255,120,150,.6)"></i>' + punti +
      '<span style="position:absolute;left:' + (min / 95 * 100).toFixed(1) + '%;top:7px;width:13px;height:13px;margin-left:-6px;border-radius:50%;background:#fff;box-shadow:0 0 8px #e0225a"></span></div>',
      "left:" + cb.left + "px;width:" + cb.width + "px;top:" + (bb.bottom + 1) + "px;background:rgba(10,14,30,.9);border-radius:0 0 10px 10px;padding:2px 0");
    etichetta("7B");
  };
  // 7C: il divano: l'avatar vero di chi ha comprato chi segna salta fuori dal bordo ed esulta
  PROP["7C"] = function () {
    var g = datiGol(), cb = box(".st-az-box"), w = PV.w(), av = w.__PV.srcAv(w.__PV.cfgDi(g.riga.nome, g.riga.omino), { braccia: "su" }); nascondiMsg(); PV.cambi = null; PV.pp = PV.p; ridisegna();
    nodo('<img src="' + av + '" style="width:150px;filter:drop-shadow(0 10px 14px rgba(0,0,0,.6))"><div style="position:absolute;left:118px;top:6px;background:#fff;color:#14171f;font:900 20px system-ui;padding:6px 12px;border-radius:16px;white-space:nowrap;box-shadow:0 6px 14px rgba(0,0,0,.4)">SIIIII! ⚽</div>',
      "left:-6px;top:" + (cb.bottom - 210) + "px;transform:rotate(-6deg)");
    nodo('<b>' + g.compratore + '</b> · ' + String(g.nome).split(" ")[0] + ' +3', "left:14px;top:" + (cb.bottom - 34) + "px;background:" + g.pc + ";color:#14171f;font:900 13px system-ui;padding:4px 10px;border-radius:10px");
    etichetta("7C");
  };
  COPIONE.aggiungi("pv0", { nome: "provini: la giornata vera fino al fischio d'inizio", fai: function () { return PV.prepara(); } });
  COPIONE.aggiungi("cap1", { nome: "il capitano: quanto vince la rosa più forte", fai: function (o) { return PV.capitano((o && o.n) || 1500); } });
  PV.mostra = function (k, x) { togli(); PV.cambi = null; PV.pp = null; PROP[k](x); return k; };
  PV.oggi = function () { togli(); ridisegna(); var m = q(PV.w(), ".st-msg"); if (m) m.style.visibility = ""; etichetta("oggi"); return "oggi"; };

  // ---------- 🎖️ IL CAPITANO: solo i numeri (simulazione, niente da costruire) ----------
  // 2 giocatori con rose a caso: quante volte vince la rosa che vale di più, senza capitano e col capitano (bonus e malus doppi
  // sul calciatore scelto: l'attaccante, o il calciatore che vale di più)
  PV.capitano = async function (n) {
    var w = PV.w() || await W.apriTel("Paky", { x: 0 });
    if (w.SG && w.SG.scaricaGioco) await w.SG.scaricaGioco("asta");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {};
    src = src.replace("function costruisciMazzoFanta(n) {", "FUORI.mazzo = costruisciMazzoFanta; FUORI.giornata = giornataSerieA; FUORI.valore = valoreCalc; function costruisciMazzoFanta(n) {");
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, F);
    var out = {};
    [2, 4].forEach(function (gioc) {
      var vinceForte = [0, 0, 0], pari = 0, giocate = 0, bonusCap = [0, 0];
      for (var i = 0; i < n; i++) {
        var m = F.mazzo(gioc), per = { P: [], D: [], C: [], A: [] }, righe = [];
        m.forEach(function (c) { c.valore = F.valore(c); per[c.ruolo].push(c); });
        for (var k = 0; k < gioc; k++) { var kit = [per.P[k], per.D[k], per.C[2 * k], per.C[2 * k + 1], per.A[k]].filter(Boolean); righe.push({ id: "g" + k, nome: "G" + k, kit: kit, totale: kit.reduce(function (s, c) { return s + c.valore; }, 0) }); }
        F.giornata(righe, {});
        var forte = righe.slice().sort(function (a, b) { return b.totale - a.totale; }); if (forte[0].totale === forte[1].totale) continue;
        giocate++;
        [0, 1, 2].forEach(function (modo) {   // 0 senza capitano, 1 capitano = l'attaccante, 2 capitano = chi vale di più
          var best = null;
          righe.forEach(function (r) {
            var pt = r.gio.punti;
            if (modo) { var kc = 0; r.kit.forEach(function (c, j) { if (modo === 1 ? c.ruolo === "A" : c.valore > r.kit[kc].valore) kc = j; }); var b = 0; r.gio.cal[kc].ev.forEach(function (e) { b += e.d; }); pt += b; if (r === forte[0]) bonusCap[modo - 1] += b; }
            if (!best || pt > best.pt || (pt === best.pt && r.totale > best.r.totale)) best = { pt: pt, r: r };
          });
          if (best.r === forte[0]) vinceForte[modo]++;
        });
      }
      out[gioc] = { giornate: giocate, senza: Math.round(1000 * vinceForte[0] / giocate) / 10, capAtt: Math.round(1000 * vinceForte[1] / giocate) / 10, capTop: Math.round(1000 * vinceForte[2] / giocate) / 10,
        bonusMedioCapAtt: Math.round(100 * bonusCap[0] / giocate) / 100, bonusMedioCapTop: Math.round(100 * bonusCap[1] / giocate) / 100 };
    });
    return JSON.stringify(out);
  };
  // ---------- (6 nov) le foto delle cose COSTRUITE davvero ----------
  PV.maglieRetro = function () {   // un foglio con alcune maglie girate (con e senza numero)
    var w = PV.w(), A = w.SGAstaArte, l = [["Juventus", 10, "YILDIZ"], ["Como", 10, "PAZ"], ["Inter", 10, "MARTINEZ"], ["Milan", 11, "PULISIC"], ["Roma", 21, "DYBALA"], ["Napoli", 8, "MCTOMINAY"], ["Lecce", null, "COULIBALY"], ["Genoa", 92, "EL SHAARAWY"], ["Atalanta", 13, "EDERSON"]];
    var h = l.map(function (x) { return "<div style=\"text-align:center;color:#fff;font:800 11px system-ui\"><img src=\"" + A.magliaRetroSrc(x[0], x[1], x[2]) + "\" style=\"width:116px;height:116px\"><br>" + x[0] + "</div>"; }).join("");
    nodo("<div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:18px 8px\">" + h + "</div>", "left:0;top:0;width:390px;height:844px;background:#0d1020");
  };
  PV.istante = function (p) { if (!PV.sc) return; R().az.foto(PV.sc, p); };   // la scena vera a un istante (l'esultanza, l'abbraccio)
  PV.fest = function () { return PV.sc && PV.sc.festT ? { t: PV.sc.festT, tipo: PV.sc.festTipo } : null; };
  PV.meteo = function (tipo, p) { if (!PV.sc) return; var s2 = {}; for (var k in PV.sc) s2[k] = PV.sc[k]; s2.meteo = tipo; R().az.foto(s2, p != null ? p : PV.p); };
  PV.salta = function () { var r = R(); if (r && r.salta) r.salta.click(); };
  PV.premi = function () { var b = q(PV.w(), ".st-premi-tasto"); if (!b) return "niente tasto dei premi"; b.click(); return "premi aperti"; };
  PV.fotoCampione = function () {
    var w = PV.w(), C = w.HTMLCanvasElement.prototype, old = C.toDataURL; w.__foto = null;
    C.toDataURL = function () { var u = old.apply(this, arguments); if (this.width === 1080) w.__foto = u; return u; };
    var b = [].slice.call(w.document.querySelectorAll(".st-premi button")).filter(function (x) { return /campione/.test(x.textContent); })[0]; if (b) b.click();
    return new Promise(function (res) { var t0 = Date.now(); (function giro() { if (w.__foto || Date.now() - t0 > 5000) { C.toDataURL = old; res(w.__foto); } else setTimeout(giro, 100); })(); });
  };
})();
