/* =========================================================
   SCEGLIAMO INSIEME — "SGScegliamo"
   La schermata del voto (3 giochi proposti) e la ruota dei giochi che
   gira uguale su tutti i telefoni. Modulo SOLO DI DISEGNO: niente rete,
   niente Sala (il voto e la ruota li decide il core, pezzo p6-e).
   Al caricamento non usa SG né SGNet: solo dentro le sue funzioni.
   Stile in un <style> di questo file con prefisso "sgs-"; per la ruota
   si riusano le classi rg-velo, rg-scheda, rg-titolo, rg-sotto, rg-tutto,
   rg-bordo, rg-disco, rg-freccia, rg-esito di styles.css (quelle della
   Ruota del giorno).

   INTERFACCIA

   SGScegliamo.conta(giochi, voti) -> [{ g, n }]
     Gli spicchi pesati: per ogni gioco proposto (giochi = [id] oppure
     [{ id }], in quest'ordine) n = voti + 1. voti = { idMembro: idGioco }
     oppure { idMembro: { g: idGioco, ... } }. Es. voti 3-1-0 → 4, 2, 1.

   SGScegliamo.spicchi(giochi, conti) -> [{ g, icona, nome, colore }]
     Da [{ g, n }] agli spicchi uno per uno, nell'ordine in cui stanno sulla
     ruota (gli stessi su tutti i telefoni: niente caso). Gli spicchi dello
     stesso gioco hanno lo stesso colore (tavolozza fissa di 6, un colore per
     gioco proposto, nell'ordine di `giochi`) e stanno il più possibile
     lontani tra loro. giochi = [{ id, icona, nome }].
     L'indice `vince` della ruota si conta su QUESTA lista.

   SGScegliamo.disegna(cv, spicchi, lato)
     Disegna la ruota sul canvas cv (lato = misura in px), una volta sola:
     durante il giro ruota solo il canvas (transform: rotate).
     spicchi: [{ icona, nome, colore }] — emoji grande e nome corto
     (max 10 caratteri, poi "…"); colore = numero 0-5 della tavolozza.

   SGScegliamo.ruota({ spicchi, giochi, vince, theta, parte, scarto,
                       titolo, giaFinito, poi })
     Velo a tutto schermo "🎡 Si gira!": giro di 5,2 s fino allo spicchio
     numero `vince`. spicchi: quelli di SGScegliamo.spicchi, oppure [{ g, n }]
     (allora serve giochi = [{ id, icona, nome }] e si espandono qui).
     theta = dove si ferma la freccia dentro lo spicchio, da 0 a 1 (0,5 =
     in mezzo), deciso dall'host: uguale su tutti i telefoni.
     parte = ora dell'host (ms) in cui comincia il giro; scarto = quanto
     l'ora dell'host è avanti rispetto a questo telefono (ms: ora host ≈
     Date.now() + scarto). L'angolo dipende solo dall'ora: tutti i telefoni
     vedono la stessa ruota nello stesso momento; chi arriva a giro
     cominciato lo vede a metà, chi arriva dopo parte + 5,2 s la vede già
     ferma. Senza parte il giro comincia adesso.
     "Tic" con SG.audioCtx(), nessuna vibrazione, nessun tasto. Poi
     "🎉 Si gioca a <gioco>!" per 1,8 s e poi(g).
     giaFinito: true → mostra subito lo spicchio vincente.
     Torna il nodo del velo (velo.chiudi() lo toglie senza chiamare poi).
     poi() arriva SEMPRE dopo, mai dentro la chiamata.

   SGScegliamo.scheda({ giochi: [{ id, icona, nome, sotto }], mio, voti,
                        persone, secondi, scade, scarto, host, membri,
                        onVota, onChiudi })
     La schermata del voto (un nodo che il core mette in una sua schermata):
     "🗳️ Scegliamo insieme", conto alla rovescia, tre tessere grandi
     (foto da window.SG_FOTO o emoji, colore uguale ai suoi spicchi), sotto
     ognuna gli avatar di chi l'ha votata (max 6, poi "+2"); tocco →
     "✅ Il tuo voto" e onVota(id) (si può cambiare); all'host in fondo
     "🎡 Gira la ruota (3 su 5)" (acceso dal primo voto) → onChiudi().
     voti = { idMembro: { g, nome, omino } } (oppure { idMembro: idGioco }
     con nomi e avatar in persone = { idMembro: { nome, omino } });
     mio = id del gioco che ho votato io (o null); membri = quanti possono
     votare (per il "3 su 5"). Conto: secondi che mancano, oppure scade =
     ora dell'host in cui finisce (con scarto, come la ruota).
     Torna { nodo, aggiorna(voti, mio, ms, membri), chiudi() }:
     aggiorna cambia solo avatar, conto e tasto (niente lampeggio, le
     tessere restano le stesse). ms = millisecondi che mancano (facoltativo);
     membri può essere anche { membri, persone }. chiudi() ferma il conto e
     spegne le tessere.
   ========================================================= */
(function () {
  "use strict";

  var DURATA = 5200, MOSTRA = 1800, GIRI = 6;
  // tavolozza fissa: un colore per gioco proposto (centro, bordo, colore della scritta)
  var TAV = [
    { a: "#ff7a6b", b: "#c3171f", t: "#fff" },
    { a: "#a58bff", b: "#4a2fb8", t: "#fff" },
    { a: "#ffe9a0", b: "#e39300", t: "#4a2a00" },
    { a: "#5ff0d0", b: "#0b8f78", t: "#fff" },
    { a: "#74c0fc", b: "#1864ab", t: "#fff" },
    { a: "#ff9ad5", b: "#c2255c", t: "#fff" }
  ];

  function crea(tag, cls, testo) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (testo != null) n.textContent = testo;
    return n;
  }
  function stile() {
    if (document.getElementById("sgs-stile")) return;
    var s = crea("style"); s.id = "sgs-stile";
    s.textContent = [
      // ruota: il perno al centro (non si tocca) e la scritta finale
      ".sgs-perno{ position:absolute; z-index:2; left:50%; top:50%; width:22%; height:22%; transform:translate(-50%,-50%); border-radius:50%;",
      "  border:4px solid #fff3bf; background:radial-gradient(circle at 35% 30%, #fff1b8, #f5b324 55%, #c27c00); box-shadow:0 6px 16px rgba(0,0,0,.45);",
      "  display:flex; align-items:center; justify-content:center; font-size:clamp(1.3rem, 7vw, 1.9rem); pointer-events:none; }",
      ".sgs-ruota .rg-esito b{ font-size:clamp(1.35rem, 7.2vw, 1.9rem); }",
      ".sgs-ruota .rg-sotto{ min-height:1.6em; margin-bottom:10px; }",
      // scheda del voto
      ".sgs-voto{ flex:1 1 auto; display:flex; flex-direction:column; gap:10px; box-sizing:border-box; color:#fff; }",
      ".contenuto:has(> .sgs-voto){ display:flex; flex-direction:column; }",   // (nella schermata del core: il tasto dell'host in fondo)
      ".sgs-testa{ display:flex; align-items:center; gap:10px; }",
      ".sgs-titoli{ flex:1; min-width:0; }",
      ".sgs-titolo{ font-size:1.3rem; font-weight:900; line-height:1.15; }",
      ".sgs-sotto{ font-size:.9rem; font-weight:700; opacity:.8; margin-top:2px; }",
      ".sgs-conto{ flex:0 0 auto; min-width:58px; padding:6px 10px; border-radius:16px; text-align:center; background:rgba(0,0,0,.28);",
      "  font-size:1.5rem; font-weight:900; font-variant-numeric:tabular-nums; line-height:1.1; }",
      ".sgs-conto small{ display:block; font-size:.62rem; font-weight:800; opacity:.75; letter-spacing:.03em; }",
      ".sgs-conto.poco{ background:#e03131; }",
      ".sgs-tessere{ display:flex; flex-direction:column; gap:10px; }",
      ".sgs-tessera{ position:relative; display:flex; align-items:stretch; gap:12px; width:100%; height:min(120px, 19vh); padding:8px; box-sizing:border-box;",
      "  border:3px solid rgba(255,255,255,.18); border-radius:20px; text-align:left; cursor:pointer; color:var(--sgs-t);",
      "  background:linear-gradient(135deg, var(--sgs-a), var(--sgs-b)); box-shadow:0 6px 16px rgba(0,0,0,.3);",
      "  font:inherit; -webkit-tap-highlight-color:transparent; transition:transform .15s ease, opacity .15s ease; }",
      ".sgs-tessera:active{ transform:scale(.98); }",
      ".sgs-tessera:disabled{ cursor:default; }",
      ".sgs-voto.votato .sgs-tessera{ opacity:.72; }",
      ".sgs-voto.votato .sgs-tessera.mia{ opacity:1; border-color:#fff3bf; box-shadow:0 0 0 3px #ffd43b, 0 8px 22px rgba(0,0,0,.4); }",
      ".sgs-foto{ position:relative; flex:0 0 auto; height:100%; aspect-ratio:1; border-radius:14px; overflow:hidden; background:rgba(0,0,0,.18);",
      "  display:flex; align-items:center; justify-content:center; font-size:clamp(2.2rem, 11vw, 3rem); }",
      ".sgs-foto img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }",
      ".sgs-info{ flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center; gap:3px; }",
      ".sgs-nome{ font-size:1.2rem; font-weight:900; line-height:1.1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }",
      ".sgs-riga{ font-size:.82rem; font-weight:700; opacity:.85; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }",
      ".sgs-facce{ display:flex; align-items:center; height:28px; margin-top:2px; }",
      ".sgs-faccia{ flex:0 0 auto; width:28px; height:28px; margin-right:-6px; border-radius:50%; overflow:hidden; background:#fff3bf;",
      "  border:2px solid rgba(255,255,255,.9); box-sizing:border-box; display:flex; align-items:center; justify-content:center;",
      "  font-size:.8rem; font-weight:900; color:#3a2200; }",
      ".sgs-faccia svg{ width:100%; height:100%; display:block; }",
      ".sgs-piu{ flex:0 0 auto; margin-left:10px; font-size:.85rem; font-weight:900; }",
      ".sgs-mio{ position:absolute; top:-9px; right:10px; padding:3px 9px; border-radius:12px; background:#fff3bf; color:#3a2200;",
      "  font-size:.78rem; font-weight:900; box-shadow:0 2px 6px rgba(0,0,0,.3); opacity:0; transform:scale(.6); transition:opacity .15s ease, transform .2s ease; }",
      ".sgs-tessera.mia .sgs-mio{ opacity:1; transform:none; }",
      ".sgs-piede{ margin-top:auto; display:flex; flex-direction:column; gap:8px; }",
      ".sgs-piede .btn{ width:100%; }",
      ".sgs-attesa{ text-align:center; font-size:.9rem; font-weight:700; opacity:.8; padding:8px 4px; }"
    ].join("\n");
    (document.head || document.documentElement).appendChild(s);
  }

  // ---- gli spicchi pesati ----
  function idDi(x) { return x && typeof x === "object" ? x.id : x; }
  function giocoDelVoto(v) { return v && typeof v === "object" ? v.g : v; }
  function conta(giochi, voti) {
    var ids = (giochi || []).map(idDi), n = {};
    ids.forEach(function (g) { n[g] = 1; });
    Object.keys(voti || {}).forEach(function (k) { var g = giocoDelVoto(voti[k]); if (n[g]) n[g]++; });
    return ids.map(function (g) { return { g: g, n: n[g] }; });
  }
  function spicchi(giochi, conti) {
    giochi = giochi || []; conti = conti || [];
    var info = {}, ordine = [];
    giochi.forEach(function (x, i) { var id = idDi(x); info[id] = { icona: x.icona || "🎲", nome: x.nome || id, colore: i % TAV.length }; ordine.push(id); });
    var resto = conti.map(function (c) { return Math.max(0, Math.floor(c.n) || 0); }), tot = 0, out = [], prec = -1;
    resto.forEach(function (r) { tot += r; });
    // il più numeroso che non sia uguale a quello di prima (e, all'ultimo, al primo): stesso ordine su tutti i telefoni
    for (var k = 0; k < tot; k++) {
      var scelto = -1;
      for (var pass = 0; pass < 3 && scelto < 0; pass++) {
        for (var j = 0; j < resto.length; j++) {
          if (!resto[j]) continue;
          if (pass < 2 && j === prec) continue;
          if (pass < 1 && k === tot - 1 && out.length && conti[j].g === out[0].g) continue;
          if (scelto < 0 || resto[j] > resto[scelto]) scelto = j;
        }
      }
      resto[scelto]--; prec = scelto;
      var g = conti[scelto].g, d = info[g] || { icona: "🎲", nome: String(g), colore: (ordine.length + scelto) % TAV.length };
      out.push({ g: g, icona: d.icona, nome: d.nome, colore: d.colore });
    }
    return out;
  }

  // ---- il disegno (una volta sola) ----
  function corto(s) {
    var c = Array.from(String(s || "").trim());
    return c.length > 10 ? c.slice(0, 9).join("").trim() + "…" : c.join("");
  }
  function disegna(cv, sp, lato) {
    if (!cv || !sp || !sp.length) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1), r = lato / 2, n = sp.length, passo = Math.PI * 2 / n;
    cv.width = cv.height = Math.round(lato * dpr); cv.style.width = cv.style.height = lato + "px";
    var c = cv.getContext("2d"); if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.translate(r, r);
    // misure delle scritte: stanno nello spicchio anche quando gli spicchi sono tanti
    var largo = function (rr) { return 2 * rr * Math.sin(Math.min(passo, Math.PI) / 2); };
    var fIcona = Math.round(Math.min(lato * 0.1, largo(r * 0.8) * 0.62));
    var fNome = Math.round(Math.max(9, Math.min(lato * 0.052, largo(r * 0.5) * 0.5)));
    sp.forEach(function (p, i) {
      var t = TAV[(p.colore | 0) % TAV.length] || TAV[0];
      var a0 = -Math.PI / 2 + i * passo, a1 = a0 + passo, g = c.createRadialGradient(0, 0, r * 0.15, 0, 0, r);
      g.addColorStop(0, t.a); g.addColorStop(1, t.b);
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r - 2, a0, a1); c.closePath();
      c.fillStyle = g; c.fill(); c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 2; c.stroke();
      // lungo il raggio: l'emoji grande verso il bordo, il nome verso il centro
      c.save(); c.rotate(a0 + passo / 2); c.textBaseline = "middle";
      c.textAlign = "center";
      c.font = fIcona + "px system-ui, \"Segoe UI Emoji\", \"Apple Color Emoji\", sans-serif";
      c.fillText(p.icona || "🎲", r - lato * 0.04 - fIcona * 0.6, 0);
      c.textAlign = "right";
      // il nome: finisce prima dell'emoji e non va sotto il perno al centro (se è lungo si rimpicciolisce)
      var nome = corto(p.nome), fine = r - lato * 0.04 - fIcona * 1.25, spazio = fine - r * 0.3, f = fNome;
      c.font = "900 " + f + "px system-ui, sans-serif";
      var largoNome = c.measureText(nome).width;
      if (largoNome > spazio && spazio > 0) { f = Math.max(8, Math.floor(f * spazio / largoNome)); c.font = "900 " + f + "px system-ui, sans-serif"; }
      c.fillStyle = t.t;
      if (t.t === "#fff") { c.shadowColor = "rgba(0,0,0,.4)"; c.shadowBlur = 3; }
      c.fillText(nome, fine, 0);
      c.restore();
    });
  }

  // ---- i suoni (le stesse note della Ruota del giorno), mai vibrazioni: la ruota non l'ha toccata chi guarda ----
  function suono(tipo) {
    var ctx = null;
    try { ctx = window.SG && SG.audioCtx && SG.audioCtx(); } catch (e) {}
    if (!ctx) return;
    try {
      var note = tipo === "tic" ? [[1900, 0, 0.035, 0.05]] : [[880, 0, .25, .18], [1175, .1, .25, .18], [1568, .2, .5, .18]];
      note.forEach(function (n) {
        var t0 = ctx.currentTime + n[1], o = ctx.createOscillator(), gn = ctx.createGain();
        o.type = tipo === "tic" ? "triangle" : "sine"; o.frequency.setValueAtTime(n[0], t0);
        gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(n[3], t0 + 0.008); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + n[2]);
        o.connect(gn); gn.connect(ctx.destination); o.start(t0); o.stop(t0 + n[2] + 0.05);
      });
    } catch (e) {}
  }

  // ---- la ruota che gira ----
  function ruota(o) {
    o = o || {};
    stile();
    // una ruota alla volta: se ce n'è già una (es. il messaggio arriva due volte) si toglie
    [].slice.call(document.querySelectorAll(".sgs-ruota")).forEach(function (v) { if (v.chiudi) v.chiudi(); });
    var sp = o.spicchi || [];
    if (sp.length && sp[0] && sp[0].n != null && sp[0].icona == null) sp = spicchi(o.giochi || [], sp);
    if (!sp.length) { if (typeof o.poi === "function") setTimeout(function () { o.poi(null); }, 0); return null; }
    var n = sp.length, passo = 360 / n, vince = Math.max(0, Math.min(n - 1, Math.floor(o.vince) || 0));
    var th = typeof o.theta === "number" && isFinite(o.theta) ? Math.max(0.15, Math.min(0.85, o.theta)) : 0.5;
    var meta = 360 * GIRI + (360 - (vince + th) * passo) % 360;   // lo spicchio vinto finisce sotto la freccia (in alto)
    var scarto = +o.scarto || 0;
    function oraHost() { return Date.now() + scarto; }
    var parte = typeof o.parte === "number" && isFinite(o.parte) ? o.parte : oraHost();
    var vh = window.innerHeight || 640;
    var lato = Math.max(200, Math.min(330, Math.round((window.innerWidth || 360) - 90), Math.round(vh * 0.46)));

    var cv = crea("canvas", "rg-disco");
    disegna(cv, sp, lato);
    var luci = "";
    for (var k = 0; k < 24; k++) {
      var a = k * Math.PI * 2 / 24, x = 50 + 48.3 * Math.sin(a), y = 50 - 48.3 * Math.cos(a);
      luci += '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="1.35" class="' + (k % 2 ? "rg-l2" : "rg-l1") + '"/>';
    }
    var bordo = crea("div", "rg-bordo"); bordo.innerHTML = '<svg viewBox="0 0 100 100">' + luci + "</svg>";
    var freccia = crea("div", "rg-freccia"), perno = crea("div", "sgs-perno", "🎮");
    var tutto = crea("div", "rg-tutto"); tutto.style.width = tutto.style.height = (lato + 22) + "px";
    [bordo, cv, freccia, perno].forEach(function (x) { tutto.appendChild(x); });
    var titolo = crea("div", "rg-titolo", o.titolo || "🎡 Si gira!");
    var sotto = crea("div", "rg-sotto", "Ogni voto è uno spicchio in più");
    var esito = crea("div", "rg-esito");
    var scheda = crea("div", "rg-scheda");
    [titolo, sotto, tutto, esito].forEach(function (x) { scheda.appendChild(x); });
    var velo = crea("div", "rg-velo sgs-ruota"); velo.appendChild(scheda);
    velo.setAttribute("data-vince", String(vince));

    var fermo = false, finito = false, tPoi = null, ang = 0, tacca = 0;
    function metti(g) { ang = g; cv.style.transform = "rotate(" + g.toFixed(2) + "deg)"; }
    function angoloA(t) { var k = Math.max(0, Math.min(1, (t - parte) / DURATA)); return meta * (1 - Math.pow(1 - k, 4)); }   // lo stesso easing della Ruota del giorno
    function fine(subito) {
      if (finito || fermo) return;
      finito = true; metti(meta);
      var g = sp[vince];
      tutto.classList.add("vinto");
      sotto.textContent = "Ha deciso la ruota!";
      esito.textContent = ""; esito.appendChild(crea("b", null, "🎉 Si gioca a " + (g.nome || "…") + "!"));
      esito.classList.add("su");
      if (!subito) suono("vinto");
      // la scritta resta 1,8 s (contati dalla fine del giro: chi arriva tardi la vede per meno, ma almeno un attimo)
      var resta = subito ? Math.max(900, Math.min(MOSTRA, parte + DURATA + MOSTRA - oraHost())) : MOSTRA;
      tPoi = setTimeout(function () {
        if (fermo) return;
        fermo = true; velo.classList.remove("su");
        setTimeout(function () { if (velo.parentNode) velo.parentNode.removeChild(velo); }, 260);
        if (typeof o.poi === "function") o.poi(g.g != null ? g.g : g);
      }, resta);
    }
    function giro() {
      if (fermo || finito) return;
      var t = oraHost();
      if (t - parte >= DURATA) { fine(false); return; }
      var g = angoloA(t); metti(g);
      var tq = Math.floor(g / passo);
      if (tq !== tacca) { tacca = tq; suono("tic"); freccia.classList.remove("tic"); void freccia.offsetWidth; freccia.classList.add("tic"); }
      requestAnimationFrame(giro);
    }
    velo.chiudi = function () {
      fermo = true; clearTimeout(tPoi);
      if (velo.parentNode) velo.parentNode.removeChild(velo);
    };
    document.body.appendChild(velo);
    if (o.giaFinito || oraHost() - parte >= DURATA) { velo.classList.add("su"); fine(true); }
    else {
      var g0 = angoloA(oraHost()); metti(g0); tacca = Math.floor(g0 / passo);   // chi arriva a metà giro: niente raffica di tic
      requestAnimationFrame(function () { requestAnimationFrame(function () { velo.classList.add("su"); }); });
      requestAnimationFrame(giro);
    }
    return velo;
  }

  // ---- la scheda del voto ----
  function scheda(o) {
    o = o || {};
    stile();
    var giochi = (o.giochi || []).slice(0, 6), persone = o.persone || {}, membri = o.membri || 0;
    var scarto = +o.scarto || 0, fineConto = null, chiusa = false, girata = false, mio = o.mio || null, ordine = {}, nOrd = 0;
    var nodo = crea("div", "sgs-voto");
    var testa = crea("div", "sgs-testa"), titoli = crea("div", "sgs-titoli");
    titoli.appendChild(crea("div", "sgs-titolo", "🗳️ Scegliamo insieme"));
    titoli.appendChild(crea("div", "sgs-sotto", "Tocca il gioco che vuoi"));
    var conto = crea("div", "sgs-conto"), contoN = crea("span", null, "");
    conto.appendChild(contoN); conto.appendChild(crea("small", null, "secondi"));
    testa.appendChild(titoli); testa.appendChild(conto);
    var lista = crea("div", "sgs-tessere"), tessere = {};
    giochi.forEach(function (gi, i) {
      var t = TAV[i % TAV.length];
      var b = crea("button", "sgs-tessera"); b.type = "button";
      b.setAttribute("data-g", gi.id);
      b.style.setProperty("--sgs-a", t.a); b.style.setProperty("--sgs-b", t.b); b.style.setProperty("--sgs-t", t.t);
      var foto = crea("span", "sgs-foto"); foto.appendChild(crea("span", null, gi.icona || "🎲"));
      if (!window.SG_FOTO || window.SG_FOTO[gi.id]) {   // (la versione online sa già quali foto ci sono)
        var img = crea("img"); img.alt = ""; img.src = "carte/giochi/" + gi.id + ".jpg";
        img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); };
        foto.appendChild(img);
      }
      var info = crea("span", "sgs-info");
      info.appendChild(crea("b", "sgs-nome", gi.nome || gi.id));
      if (gi.sotto) info.appendChild(crea("span", "sgs-riga", gi.sotto));
      var facce = crea("span", "sgs-facce"); info.appendChild(facce);
      b.appendChild(foto); b.appendChild(info); b.appendChild(crea("span", "sgs-mio", "✅ Il tuo voto"));
      b.addEventListener("click", function () {
        if (chiusa || mio === gi.id) return;
        mio = gi.id; segnaMio();
        if (typeof o.onVota === "function") o.onVota(gi.id);
      });
      tessere[gi.id] = { b: b, facce: facce, cache: {}, piu: null };
      lista.appendChild(b);
    });
    var piede = crea("div", "sgs-piede"), tasto = null;
    if (o.host) {
      tasto = crea("button", "btn btn-primario sgs-gira"); tasto.type = "button";
      tasto.addEventListener("click", function () {
        if (chiusa || girata || tasto.disabled) return;
        girata = true; tasto.disabled = true; tasto.textContent = "🎡 Si gira…";
        if (typeof o.onChiudi === "function") o.onChiudi();
      });
      piede.appendChild(tasto);
    } else piede.appendChild(crea("div", "sgs-attesa", "Quando hanno votato tutti, gira la ruota"));
    nodo.appendChild(testa); nodo.appendChild(lista); nodo.appendChild(piede);

    function segnaMio() {
      nodo.classList.toggle("votato", !!mio);
      Object.keys(tessere).forEach(function (g) { tessere[g].b.classList.toggle("mia", g === mio); });
    }
    function chiDi(id, v) {
      var p = (v && typeof v === "object" ? v : null) || persone[id] || {};
      return { nome: p.nome || "", omino: p.omino || null };
    }
    function faccia(T, id, chi) {
      var f = T.cache[id];
      if (!f) {
        f = T.cache[id] = crea("span", "sgs-faccia");
        if (chi.omino && window.SGOmino) { try { f.innerHTML = SGOmino.svg(chi.omino, { busto: true }); } catch (e) { f.textContent = ""; } }
        if (!f.firstChild) f.textContent = (Array.from(chi.nome || "?")[0] || "?").toUpperCase();
      }
      f.title = chi.nome;
      return f;
    }
    function aggiornaFacce(voti) {
      var per = {};
      Object.keys(voti || {}).forEach(function (id) {
        var g = giocoDelVoto(voti[id]); if (!tessere[g]) return;
        if (ordine[id] == null || ordine[id].g !== g) ordine[id] = { g: g, k: ++nOrd };   // chi vota per ultimo va in fondo
        (per[g] = per[g] || []).push(id);
      });
      Object.keys(tessere).forEach(function (g) {
        var T = tessere[g], ids = (per[g] || []).sort(function (a, b) { return ordine[a].k - ordine[b].k; });
        var vis = ids.length > 6 ? ids.slice(0, 6) : ids, voluti = vis.map(function (id) { return faccia(T, id, chiDi(id, voti[id])); });
        // solo quello che cambia: le facce già al loro posto restano lì
        voluti.forEach(function (f, i) { if (T.facce.children[i] !== f) T.facce.insertBefore(f, T.facce.children[i] || null); });
        while (T.facce.children.length > voluti.length) T.facce.removeChild(T.facce.lastChild);
        var piu = ids.length - vis.length;
        if (piu > 0) { if (!T.piu) T.piu = crea("span", "sgs-piu"); var tx = "+" + piu; if (T.piu.textContent !== tx) T.piu.textContent = tx; T.facce.appendChild(T.piu); }
        // (le facce di chi non vota più per questo gioco si buttano: se torna si rifanno)
        Object.keys(T.cache).forEach(function (id) { if (vis.indexOf(id) < 0) delete T.cache[id]; });
      });
      return Object.keys(voti || {}).filter(function (id) { return tessere[giocoDelVoto(voti[id])]; }).length;
    }
    function scriviTasto(n) {
      if (!tasto || girata) return;
      var tx = "🎡 Gira la ruota (" + (membri ? n + " su " + membri : n + (n === 1 ? " voto" : " voti")) + ")";
      if (tasto.textContent !== tx) tasto.textContent = tx;
      var spento = chiusa || n < 1;
      if (tasto.disabled !== spento) tasto.disabled = spento;
    }
    function scriviConto() {
      if (fineConto == null) { conto.style.visibility = "hidden"; return; }
      var s = Math.max(0, Math.ceil((fineConto - Date.now()) / 1000)), tx = String(s);
      conto.style.visibility = "";
      if (contoN.textContent !== tx) contoN.textContent = tx;
      conto.classList.toggle("poco", s <= 5);
    }
    if (typeof o.scade === "number") fineConto = o.scade - scarto;
    else if (typeof o.secondi === "number") fineConto = Date.now() + o.secondi * 1000;
    // il conto ogni 250 ms (solo il testo); se il core toglie la scheda senza chiuderla, si ferma da solo
    var visto = false, tConto = setInterval(function () {
      if (nodo.isConnected) visto = true; else if (visto) { clearInterval(tConto); return; }
      scriviConto();
    }, 250);
    var nVoti = aggiornaFacce(o.voti || {});
    segnaMio(); scriviTasto(nVoti); scriviConto();

    return {
      nodo: nodo,
      aggiorna: function (voti, nuovoMio, ms, extra) {
        if (extra && typeof extra === "object") { if (extra.persone) persone = extra.persone; if (extra.membri != null) membri = extra.membri; }
        else if (typeof extra === "number") membri = extra;
        if (nuovoMio !== undefined && nuovoMio !== mio) { mio = nuovoMio || null; segnaMio(); }
        if (typeof ms === "number" && isFinite(ms)) {
          var f = Date.now() + ms;
          if (fineConto == null || Math.abs(f - fineConto) > 400) fineConto = f;   // (piccole differenze di rete: il conto non salta avanti e indietro)
        }
        if (voti) nVoti = aggiornaFacce(voti);
        scriviTasto(nVoti); scriviConto();
      },
      chiudi: function () {
        if (chiusa) return;
        chiusa = true; clearInterval(tConto);
        Object.keys(tessere).forEach(function (g) { tessere[g].b.disabled = true; });
        if (tasto) tasto.disabled = true;
      }
    };
  }

  window.SGScegliamo = { conta: conta, spicchi: spicchi, disegna: disegna, ruota: ruota, scheda: scheda, TAVOLOZZA: TAV, DURATA: DURATA };
})();
