/* =========================================================
   😂 MEMATA — il nostro «Make It Meme» (chat «😂 Meme», 31 ott 2026)
   Esce un meme famoso coi riquadri vuoti: ognuno ci scrive il suo testo, poi si votano
   i meme degli altri (anonimi) e alla rivelazione si scopre chi li ha fatti.
   Solo online, ognuno dal suo telefono (nella Sala della serata). Niente Bot.
   - Partito dal modello dei giochi online (.agents/skills/nuovo-gioco/modello-gioco-online.js):
     saletta, ripresa, host di riserva, chi arriva tardi ("turno": dal round dopo), chi guarda, rivincita.
   - I meme: data/memata.js (SG_MEMATA, i modelli di Imgflip coi riquadri del loro generatore).
     Le immagini NON stanno sul nostro sito: il telefono le chiede a i.imgflip.com durante la partita.
     I telefoni si scambiano solo il modello (id, misure, riquadri) e il testo: mai l'immagine.
   - Il testo sta SOPRA l'immagine (riquadri in HTML), impaginato con la stessa funzione della foto
     per WhatsApp (canvas): quello che si vede è quello che si manda.
   - Carattere dei meme classici: Anton (licenza SIL Open Font, Google Fonts), dentro questo file.
   ========================================================= */
(function () {
  "use strict";

  var ID = "memata";
  var MIN = 3, MAX = 10;
  var RESPIRO = 5;            // i secondi di respiro quando la partita riprende
  var RITARDATARI = "turno";  // chi arriva a partita cominciata entra dal round dopo, con 0 punti
  var VOTO_S = 12;            // i secondi per votare un meme (si va avanti prima se hanno votato tutti)
  var ANTICIPO = 2000;        // l'host chiude scrittura e voto 2 s dopo lo zero (l'ultimo testo o voto deve arrivare)
  var PASSO_RIV = 2600;       // la rivelazione: un posto ogni 2,6 s (il primo con il rullo, più lungo)
  var AVANTI_S = 12;          // dopo la rivelazione: si va avanti da soli
  var PUNTI = [0, 100, 200];  // 😐 meh, 🙂 carino, 😂 fortissimo
  var BONUS = 200;            // 💯 tutti 😂
  var MAX_TESTO = 90;
  var MEM_USCITE = "sg-memata-uscite", MEM_ROTTE = "sg-memata-rotte", MEM_BOZZA = "sg-memata-bozza";
  var SITO = "paky358.github.io/speed-game";
  var FONT_A = "'Memata Anton', Impact, 'Arial Narrow', sans-serif";
  var FONT_B = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }   // 1.000
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function vibra(x) { try { if (navigator.vibrate) navigator.vibrate(x || 10); } catch (e) {} }
  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function leggi(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function scrivi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  // (si taglia per caratteri interi: un'emoji non si spezza a metà)
  function taglia(s, n) { var a = Array.from(s); return a.length > n ? a.slice(0, n).join("") : s; }
  function pulisci(s) { return taglia(String(s == null ? "" : s).replace(/[\u0000-\u0009\u000b-\u001f]/g, "").replace(/\n{3,}/g, "\n\n"), MAX_TESTO); }
  function vuoti(testi) { return !testi || !testi.some(function (x) { return String(x || "").trim(); }); }

  // =========================================================
  //  I MEMI: il modello (rec) = [id, estensione, larghezza, altezza, riquadri]
  //  riquadri: [[x, y, w, h, opz], …] in millesimi dell'immagine; opz (facoltativo):
  //  { r: gradi, f: "a" (Arial, il «moderno») | "i" (Anton, il classico), c: colore, o: bordo, cp: 0/1 maiuscole, al, va }
  //  senza riquadri = il classico sopra e sotto (come fa Imgflip quando non ne ha)
  // =========================================================
  var CLASSICO = [[25, 15, 950, 240, { va: "top" }], [25, 745, 950, 240, { va: "bottom" }]];
  function lista() { return window.SG_MEMATA || []; }
  function rec(m) { return [m[0], m[1], m[2], m[3], m[4] || null]; }   // (quello che viaggia: niente nome)
  function riquadri(r) { return (r && r[4] && r[4].length ? r[4] : CLASSICO); }
  function urlDi(r) { return "https://i.imgflip.com/" + r[0] + "." + (r[1] || "jpg"); }
  function stileDi(q) {
    var o = q[4] || {}, f = o.f || "i";
    return { f: f, font: f === "a" ? FONT_B : FONT_A, peso: f === "a" ? "700" : "400",
      c: o.c || (f === "a" ? "#000000" : "#ffffff"), o: o.o || (f === "a" ? "#ffffff" : "#000000"),
      cp: o.cp != null ? !!o.cp : f !== "a", al: o.al || "center", va: o.va || "middle", r: o.r || 0, lh: f === "a" ? 1.18 : 1.08 };
  }

  // ---------- l'impaginazione del testo in un riquadro (uguale sullo schermo e nella foto) ----------
  var MIS = null;
  function misuratore() { if (!MIS) { var c = document.createElement("canvas"); MIS = c.getContext("2d"); } return MIS; }
  // le righe del testo larghe al massimo w px con la grandezza fs; le parole troppo lunghe si spezzano
  function righe(ctx, testo, w) {
    var out = []; out.spezza = false;
    String(testo).split("\n").forEach(function (par) {
      var parole = par.split(/\s+/).filter(Boolean), r = "";
      if (!parole.length) { out.push(""); return; }
      parole.forEach(function (p) {
        var A = Array.from(p);   // (per caratteri interi: le emoji non si spezzano)
        while (ctx.measureText(p).width > w && A.length > 1) {   // parola più larga del riquadro: si spezza
          var k = A.length - 1; while (k > 1 && ctx.measureText(A.slice(0, k).join("")).width > w) k--;
          if (r) { out.push(r); r = ""; }
          out.push(A.slice(0, k).join("")); A = A.slice(k); p = A.join(""); out.spezza = true;
        }
        var prova = r ? r + " " + p : p;
        if (ctx.measureText(prova).width <= w || !r) r = prova; else { out.push(r); r = p; }
      });
      out.push(r);
    });
    return out;
  }
  // la grandezza più grande che ci sta (w, h in px); torna { fs, righe }. Le parole si spezzano a metà solo se non c'è altro modo
  // (larg = larghezza dell'immagine disegnata: il tetto della grandezza è in proporzione, uguale sullo schermo e nella foto)
  function impagina(testo, w, h, st, larg) {
    var ctx = misuratore(), t = st.cp ? String(testo).toUpperCase() : String(testo), best = null, sc = (larg || 330) / 330;
    [false, true].forEach(function (spezza) {
      if (best) return;
      var lo = 6 * sc, hi = Math.max(8 * sc, Math.min(h, w * 0.6, 120 * sc));
      for (var i = 0; i < 9; i++) {
        var fs = (lo + hi) / 2;
        ctx.font = st.peso + " " + fs + "px " + st.font;
        var rr = righe(ctx, t, w);
        if (rr.length * fs * st.lh <= h && (spezza || !rr.spezza)) { best = { fs: fs, righe: rr }; lo = fs; } else hi = fs;
      }
    });
    if (!best) { ctx.font = st.peso + " " + (6 * sc) + "px " + st.font; best = { fs: 6 * sc, righe: righe(ctx, t, w) }; }
    best.fs = Math.floor(best.fs * 10) / 10;
    return best;
  }
  // il bordo della scritta (testo bianco col bordo nero) con le ombre: va su tutti i telefoni
  function bordo(col, fs) {
    var s = Math.max(1, fs * 0.075), d = s * 0.71, a = [];
    [[s, 0], [-s, 0], [0, s], [0, -s], [d, d], [-d, d], [d, -d], [-d, -d]].forEach(function (p) { a.push(p[0].toFixed(1) + "px " + p[1].toFixed(1) + "px 0 " + col); });
    return a.join(",");
  }

  // ---------- il meme sullo schermo: immagine + riquadri sopra ----------
  // crea una volta il pannello; pannello.metti(rec, testi, opz) lo aggiorna (niente lampeggio: l'immagine cambia solo se cambia il meme)
  function pannelloMeme(t, opz) {
    opz = opz || {};
    var box = t.el("div", { class: "me-meme" }), quadro = t.el("div", { class: "me-quadro" }), img = t.el("img", { class: "me-img", alt: "", draggable: "false" });
    img.crossOrigin = "anonymous"; img.decoding = "async";
    var stato = t.el("div", { class: "me-carica", text: "Carico il meme…" });
    quadro.appendChild(img); box.appendChild(quadro); box.appendChild(stato);
    var P = { el: box, quadro: quadro, img: img, rec: null, testi: [], q: [], sel: -1, pronta: false, onRotta: null, onTocco: null };
    img.addEventListener("load", function () { P.pronta = true; stato.style.display = "none"; quadro.style.visibility = ""; quadro.classList.remove("senza"); P.adatta(); });
    // l'immagine non arriva: i riquadri restano (si scrive lo stesso) e chi tiene la partita, se può, dà un altro meme
    img.addEventListener("error", function () { P.pronta = false; stato.textContent = "📶 L'immagine non arriva"; stato.style.display = ""; quadro.style.visibility = ""; quadro.classList.add("senza"); if (P.onRotta && P.rec) P.onRotta(P.rec[0]); });
    // quando il posto cambia (compare un tasto, si apre la tastiera) il meme si rifà della misura giusta
    if (window.ResizeObserver) try { new ResizeObserver(function () { P.adatta(); }).observe(box); } catch (e) {}
    P.metti = function (r, testi, o2) {
      o2 = o2 || {};
      var nuovo = !P.rec || !r || P.rec[0] !== r[0] || JSON.stringify(P.rec[4]) !== JSON.stringify(r[4]);
      P.rec = r; P.testi = (testi || []).slice(); P.modifica = !!o2.modifica; P.sel = o2.sel == null ? -1 : o2.sel;
      if (!r) { box.style.visibility = "hidden"; return; }
      box.style.visibility = "";
      if (nuovo) {
        P.pronta = false; stato.textContent = "Carico il meme…"; stato.style.display = ""; quadro.style.visibility = "hidden";
        while (P.q.length) { var v = P.q.pop(); if (v.el.parentNode) v.el.parentNode.removeChild(v.el); }
        riquadri(r).forEach(function (q, i) {
          var st = stileDi(q), el = t.el("div", { class: "me-q" }), sp = t.el("span", { class: "me-qt" }), num = t.el("b", { class: "me-qn", text: String(i + 1) });
          el.style.left = q[0] / 10 + "%"; el.style.top = q[1] / 10 + "%"; el.style.width = q[2] / 10 + "%"; el.style.height = q[3] / 10 + "%";
          if (st.r) el.style.transform = "rotate(" + st.r + "deg)";
          el.style.alignItems = st.va === "top" ? "flex-start" : st.va === "bottom" ? "flex-end" : "center";
          el.style.justifyContent = st.al === "left" ? "flex-start" : st.al === "right" ? "flex-end" : "center";
          sp.style.textAlign = st.al; sp.style.fontFamily = st.font; sp.style.fontWeight = st.peso; sp.style.color = st.c; sp.style.lineHeight = st.lh;
          el.appendChild(sp); el.appendChild(num); quadro.appendChild(el);
          el.addEventListener("pointerdown", function (e) { if (P.modifica && P.onTocco) { e.preventDefault(); P.onTocco(i); } });
          P.q.push({ el: el, sp: sp, num: num, st: st, q: q, k: null });
        });
        img.src = urlDi(r);
        if (img.complete && img.naturalWidth) { P.pronta = true; stato.style.display = "none"; quadro.style.visibility = ""; }
      }
      P.adatta();
    };
    // l'immagine prende il posto che c'è (si vede tutta) e i testi si rifanno alla grandezza giusta
    P.adatta = function () {
      if (!P.rec || !box.isConnected) return;
      var aw = box.clientWidth, ah = box.clientHeight; if (!aw || !ah) return;
      var sc = Math.min(aw / P.rec[2], ah / P.rec[3]), w = Math.max(1, Math.floor(P.rec[2] * sc)), h = Math.max(1, Math.floor(P.rec[3] * sc));
      quadro.style.width = w + "px"; quadro.style.height = h + "px";
      P.q.forEach(function (v, i) {
        var tx = pulisci(P.testi[i] || ""), bw = v.q[2] / 1000 * w, bh = v.q[3] / 1000 * h, pad = Math.max(1, Math.min(bw, bh) * 0.04);
        v.el.classList.toggle("vuoto", !tx.trim());
        v.el.classList.toggle("modifica", !!P.modifica);
        v.el.classList.toggle("sel", P.modifica && P.sel === i);
        var k = tx + "|" + w + "|" + h;
        if (v.k === k) return; v.k = k;
        if (!tx.trim()) { v.sp.textContent = ""; return; }
        var lay = impagina(tx, Math.max(4, bw - pad * 2), Math.max(4, bh - pad * 2), v.st, w);
        v.sp.textContent = lay.righe.join("\n");
        v.sp.style.fontSize = lay.fs + "px";
        v.sp.style.textShadow = bordo(v.st.o, lay.fs);
        v.sp.style.padding = pad + "px";
      });
    };
    return P;
  }

  // ---------- la foto per WhatsApp (canvas: stessa impaginazione) ----------
  function disegnaMeme(x, img, r, testi, X, Y, W, H) {
    x.drawImage(img, X, Y, W, H);
    riquadri(r).forEach(function (q, i) {
      var tx = pulisci((testi || [])[i] || ""); if (!tx.trim()) return;
      var st = stileDi(q), bw = q[2] / 1000 * W, bh = q[3] / 1000 * H, pad = Math.max(1, Math.min(bw, bh) * 0.04);
      var lay = impagina(tx, Math.max(4, bw - pad * 2), Math.max(4, bh - pad * 2), st, W);
      x.save();
      x.translate(X + q[0] / 1000 * W + bw / 2, Y + q[1] / 1000 * H + bh / 2);
      if (st.r) x.rotate(st.r * Math.PI / 180);
      x.font = st.peso + " " + lay.fs + "px " + st.font; x.textBaseline = "middle"; x.textAlign = st.al;
      var lh = lay.fs * st.lh, tot = lay.righe.length * lh, y0 = st.va === "top" ? -bh / 2 + pad : st.va === "bottom" ? bh / 2 - pad - tot : -tot / 2;
      var xx = st.al === "left" ? -bw / 2 + pad : st.al === "right" ? bw / 2 - pad : 0;
      x.lineJoin = "round"; x.lineWidth = Math.max(2, lay.fs * 0.15); x.strokeStyle = st.o; x.fillStyle = st.c;
      lay.righe.forEach(function (rg, k) { var yy = y0 + lh * (k + 0.5); x.strokeText(rg, xx, yy); x.fillText(rg, xx, yy); });
      x.restore();
    });
  }
  function fotoMeme(m, nome, fatto) {
    var img = new Image(); img.crossOrigin = "anonymous";
    img.onload = function () {
      try {
        var W = 1080, mw = W - 80, mh = Math.round(mw * m.rec[3] / m.rec[2]);
        if (mh > 1150) { mh = 1150; mw = Math.round(mh * m.rec[2] / m.rec[3]); }
        var H = mh + 330, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
        var x = cv.getContext("2d"), F = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
        var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#151a2e"); g.addColorStop(1, "#0d1020"); x.fillStyle = g; x.fillRect(0, 0, W, H);
        x.textAlign = "center"; x.fillStyle = "#ffc247"; x.font = "900 46px " + F; x.fillText("⭐ Il meme della serata", W / 2, 76);
        x.fillStyle = "#f4f5fb"; x.font = "800 34px " + F; x.fillText("di " + nome, W / 2, 124);
        var X = (W - mw) / 2, Y = 160;
        disegnaMeme(x, img, m.rec, m.testi, X, Y, mw, mh);
        x.textAlign = "center"; x.fillStyle = "rgba(255,255,255,.92)"; x.font = "900 34px " + F; x.fillText("😂 Memata · SPeeD GAME", W / 2, H - 92);
        x.fillStyle = "rgba(166,172,200,.95)"; x.font = "700 24px " + F; x.fillText("Giocate con noi: " + SITO + " · modello da imgflip.com", W / 2, H - 50);
        if (window.__MEMATA) window.__MEMATA.foto = cv;   // (per le prove)
        condividi(cv, "memata.png", "Il meme della serata 😂");
      } catch (e) { if (fatto) fatto(false); return; }
      if (fatto) fatto(true);
    };
    img.onerror = function () { if (fatto) fatto(false); };
    img.src = urlDi(m.rec);
  }
  function condividi(cv, nomeFile, testo) {
    var url = cv.toDataURL("image/png");
    if (window.__MEMATA && window.__MEMATA.fotoFinta) { window.__MEMATA.fotoFinta(url); return; }   // (le prove: niente condivisione vera)
    try {
      var bin = atob(url.split(",")[1]), arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      var file = typeof File === "function" ? new File([arr], nomeFile, { type: "image/png" }) : null;
      if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], text: testo + " · " + SITO }).catch(function () {});
        return;
      }
    } catch (e) {}
    try { var a = document.createElement("a"); a.href = url; a.download = nomeFile; document.body.appendChild(a); a.click(); a.parentNode.removeChild(a); } catch (e2) {}
  }

  // =========================================================
  //  LA SCELTA DEI MEMI (sul telefono di chi tiene la partita)
  // =========================================================
  function Mazzo() {
    var L = lista(), usciti = leggi(MEM_USCITE, []), rotte = leggi(MEM_ROTTE, {}), oggi = Date.now();
    Object.keys(rotte).forEach(function (k) { if (oggi - rotte[k] > 7 * 864e5) delete rotte[k]; });   // un'immagine rotta si riprova dopo una settimana
    var ricorda = Math.min(1500, Math.floor(L.length * 0.7));
    var M = { verificati: {}, inProva: {}, inPartita: {} };
    function libero(m) { return m && !rotte[m[0]] && !M.inPartita[m[0]] && usciti.indexOf(m[0]) < 0; }
    // pesca un meme: i più famosi escono più spesso (peso che scende con la posizione nell'elenco di Imgflip: a memoria vuota
    // circa 6 volte su 10 uno dei primi 300, 3 su 10 uno dei primi 100; poi la memoria li mette da parte e arrivano gli altri)
    M.pesca = function (cond) {
      var c = [], tot = 0;
      for (var i = 0; i < L.length; i++) {
        var m = L[i]; if (!libero(m) || (cond && !cond(m, i))) continue;
        var w = Math.pow(1 + i / 150, -1.6) * (M.verificati[m[0]] ? 3 : 1); c.push([m, w]); tot += w;
      }
      if (!c.length) {
        if (cond) return null;   // finito solo un gruppo (per esempio i famosi): chi chiama ripiega su tutto l'elenco
        usciti = []; scrivi(MEM_USCITE, usciti);   // finito tutto l'elenco: si ricomincia a dimenticare
        for (var j = 0; j < L.length; j++) if (!rotte[L[j][0]] && !M.inPartita[L[j][0]]) { c.push([L[j], 1]); tot += 1; }
        if (!c.length) return null;
      }
      var r = Math.random() * tot;
      for (var k = 0; k < c.length; k++) { r -= c[k][1]; if (r <= 0) return c[k][0]; }
      return c[c.length - 1][0];
    };
    M.prendi = function (cond) { var m = M.pesca(cond); if (m) { M.inPartita[m[0]] = 1; M.esce(m[0]); } return m; };
    M.esce = function (id) { usciti = usciti.filter(function (x) { return x !== id; }); usciti.unshift(id); if (usciti.length > ricorda) usciti.length = ricorda; scrivi(MEM_USCITE, usciti); };
    M.rotta = function (id) { rotte[id] = Date.now(); scrivi(MEM_ROTTE, rotte); delete M.verificati[id]; };
    // si caricano in anticipo alcune immagini: quelle arrivate si usano prima, quelle che non arrivano non escono più
    M.prepara = function (n) {
      var quanti = Object.keys(M.verificati).length + Object.keys(M.inProva).length;
      for (var i = quanti; i < n; i++) {
        var m = M.pesca(function (x) { return !M.verificati[x[0]] && !M.inProva[x[0]]; }); if (!m) return;
        (function (m) {
          M.inProva[m[0]] = 1;
          var im = new Image(), to = setTimeout(function () { im.onload = im.onerror = null; delete M.inProva[m[0]]; }, 9000);
          im.onload = function () { clearTimeout(to); delete M.inProva[m[0]]; M.verificati[m[0]] = 1; };
          im.onerror = function () { clearTimeout(to); delete M.inProva[m[0]]; M.rotta(m[0]); };
          im.crossOrigin = "anonymous"; im.src = urlDi(m);
        })(m);
      }
    };
    M.trova = function (id) { for (var i = 0; i < L.length; i++) if (L[i][0] === id) return L[i]; return null; };
    return M;
  }

  // =========================================================
  //  HOST: tiene la partita vera e manda a tutti la "foto" (vm)
  // =========================================================
  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = Object.assign({}, t.impostazioni || {}, window.__MEMATA_IMP || {});   // (__MEMATA_IMP: le prove, tempi più corti)
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var IO = t.mioId || "host";   // io che tengo la partita (dopo un subentro l'id da amico del vice): MAI "host" fisso
    var MZ = Mazzo();
    var H = { fase: "lobby", codice: "…", pronta: false, giri: imp.giri || 3, tempo: imp.tempo || 75, giro: 0, partita: 0, stato: "attesa",
      scadenza: 0, to: null, rip: 0,
      fin: false,        // l'ultimo round: stesso meme per tutti, punti doppi
      mem: {},           // per giocatore: { r: rec, c: cambi usati, x: testi, f: consegnato }
      vot: null,         // { ord: [id autori], k, voti: { autore: { votante: v } } }
      riv: null,         // { lista: [...], passo }
      migliori: [],      // il meme migliore di ogni round (per «il meme della serata»)
      usati: [],
      classifica: null, serata: null,
      players: [{ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost), punti: 0 }],
      guarda: [], prossimi: [] };
    var R = t.ripresa, riprendo = !!(R && R.stato && R.stato.fase && R.stato.fase !== "lobby" && R.stato.players), attesi = [];
    if (riprendo) {
      H = R.stato;
      H.to = null; H.pronta = false; H.rip = H.rip || 0; H.prossimi = [];
      H.players.forEach(function (p) {
        if (p.id !== IO && !p.via && p.id !== (R.daRiserva && R.vecchioHost)) attesi.push(p.id);
        p.forse = false; p.via = p.id !== IO; if (p.id === IO) p.omino = t.mioOmino(p.nome);
      });
      if (H.scadenza) H.scadenza = R.ora(H.scadenza);
      if (H.scadenzaPrima) H.scadenzaPrima = R.ora(H.scadenzaPrima);   // (ricaricato durante il respiro di una ripresa)
      (H.usati || []).forEach(function (id) { MZ.inPartita[id] = 1; });
    }
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function inProssimi(id) { return H.prossimi.some(function (x) { return x.id === id; }); }
    function entrano() {
      H.prossimi.forEach(function (x) { if (!pById(x.id) && presenti().length < MAX) H.players.push({ id: x.id, nome: x.nome, omino: x.omino, punti: 0 }); });
      H.prossimi = [];
    }
    function ferma() { if (H.to) { clearTimeout(H.to); H.to = null; } }
    // la partita è ancora di questo telefono? Se il core l'ha portata via (il vice ha preso il posto e io rientro da
    // giocatore, Cambia gioco…) la mia schermata non è più nella pagina: i timer si fermano e non si disegna più niente
    var morto = false;
    function vivo() {
      if (morto) return false;
      if (H.fase !== "gioco") return true;
      if (UI && UI.t === t && document.body.contains(UI.s)) return true;
      morto = true; ferma(); return false;
    }
    function dopo(ms, fn) { ferma(); H.to = setTimeout(function () { H.to = null; if (vivo()) fn(); }, Math.max(0, ms)); }

    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.giri = im.giri || 3; H.tempo = im.tempo || 75; bd(); };

    var rete = SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onErrore: function () {
        if (H.pronta) return;
        ferma(); if (rete) rete.chiudi();
        erroreRete(t, "Non riesco ad aprire la stanza.", function () { host(t); });
      },
      onForse: function (id) { var p = pById(id); if (p && !p.forse) { p.forse = true; bd(); } },
      onTornato: function (id) { var p = pById(id); if (p && p.forse) { p.forse = false; bd(); } },
      onAddio: function (id) {
        if (H.guarda.some(function (x) { return x.id === id; })) { H.guarda = H.guarda.filter(function (x) { return x.id !== id; }); bd(); return; }
        if (inProssimi(id)) { H.prossimi = H.prossimi.filter(function (x) { return x.id !== id; }); bd(); return; }
        var p = pById(id); if (!p) return;
        p.forse = false;
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); bd(); return; }
        p.via = true;
        if (H.fase === "gioco" && H.stato !== "ripresa" && presenti().length < 2) return fine();
        bd(); controlla();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          var p = pById(id), nome = String(m.nome || "Amico").slice(0, 16);
          if (!p && !t.puoSedersi(id, nome)) {
            if (!H.guarda.some(function (x) { return x.id === id; })) H.guarda.push({ id: id, nome: nome });
            bd(); return;
          }
          if (!p && H.fase === "gioco") {   // a partita cominciata: entra dal round dopo, con 0 punti
            if (!inProssimi(id) && presenti().length + H.prossimi.length < MAX) H.prossimi.push({ id: id, nome: nome, omino: avatarValido(m.omino) });
            bd(); return;
          }
          if (!p && H.fase === "lobby" && H.players.length < MAX)
            H.players.push({ id: id, nome: nome, omino: avatarValido(m.omino), punti: 0 });
          if (p) { p.forse = false; if (p.via && H.fase !== "lobby") p.via = false; if (!p.omino) p.omino = avatarValido(m.omino); }
          // era uscito prima del round e torna mentre si scrive: ha anche lui il suo meme (nell'ultimo round quello di tutti)
          if (p && H.fase === "gioco" && H.stato === "scrivi" && !H.mem[id] && H.scadenza - Date.now() > 15000) {
            var unoDi = H.fin && Object.keys(H.mem)[0];
            H.mem[id] = { r: unoDi ? H.mem[unoDi].r : nuovoMeme(null), c: 0, x: [], f: false };
          }
          bd(); segreti(id);   // chi rientra ritrova il suo meme (e il suo testo)
          return;
        }
        if (H.fase !== "gioco" || !pById(id) || pById(id).via) return;
        mossa(id, m);
      }
    }, { ripresa: riprendo });
    if (!rete) return senzaRete(t);
    if (riprendo && rete.codice) H.codice = rete.codice;

    function secondi() { return H.scadenza ? Math.max(0, Math.ceil((H.scadenza - Date.now()) / 1000)) : 0; }
    // la "foto" per tutti: MAI chi ha scritto quale meme (fino alla rivelazione)
    function vm() {
      var v = { fase: H.fase, codice: H.codice, pronta: H.pronta, giri: H.giri, tempo: H.tempo, giro: H.giro, partita: H.partita, stato: H.stato,
        tiene: IO, rip: H.rip, fin: H.fin, resta: secondi(), tot: H.stato === "scrivi" ? H.tempo : H.stato === "vota" ? VOTO_S : 0,
        players: H.players.map(function (p) {
          var x = H.mem[p.id];
          return { id: p.id, nome: p.nome, punti: p.punti, via: !!p.via, forse: !!p.forse, fatto: !!(x && x.f),
            omino: H.fase === "lobby" || H.fase === "fine" ? (p.omino || null) : undefined };
        }),
        guarda: H.guarda, prossimi: H.prossimi.map(function (x) { return { id: x.id, nome: x.nome }; }),
        classifica: H.classifica };
      if (H.stato === "vota" && H.vot) {
        var a = H.vot.ord[H.vot.k], x = H.mem[a] || {};
        v.voto = { k: H.vot.k, n: H.vot.ord.length, rec: x.r, testi: x.x, hanno: Object.keys(H.vot.voti[a] || {}).length };
      }
      if (H.stato === "rivela" && H.riv) v.riv = H.riv;
      if (H.fase === "fine") v.serata = H.serata;
      return v;
    }
    function privato(id, m) {
      if (id === IO) { CB.ultimo = m; return CB.onPriv(m); }
      m.to = id; rete.inviaVeloce(m);
    }
    // i segreti di un giocatore: il suo meme (mentre si scrive) o «questo è il tuo» (mentre si vota)
    function segreti(id) {
      if (H.fase !== "gioco") return;
      var x = H.mem[id];
      if (H.stato === "scrivi" && x) privato(id, { t: "tuo", g: H.giro, p: H.partita, rec: x.r, cambi: x.c, testi: x.x || [], fatto: !!x.f, fin: H.fin });
      if (H.stato === "vota" && H.vot && H.vot.ord[H.vot.k] === id) privato(id, { t: "mio", g: H.giro, p: H.partita, k: H.vot.k });
    }
    function ricorda() {
      if (H.fase === "lobby") return t.ricorda(null);
      var s = {};
      Object.keys(H).forEach(function (k) { if (k !== "to" && k !== "prossimi") s[k] = H[k]; });
      s.players = H.players.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, via: !!p.via }; });
      t.ricorda(s);
    }
    function bd() { if (morto) return; var v = vm(); rete.invia({ t: "vm", vm: v }); ricorda(); disegna(t, v, CB); }

    // ----- la ripresa -----
    var nRespiri = 0;
    function riprendi() {
      if (H.fase !== "gioco") return bd();
      // (se si ricarica di nuovo durante il respiro, la fase da riprendere resta quella di prima)
      if (H.stato !== "ripresa") { H.statoPrima = H.stato; H.scadenzaPrima = H.scadenza; }
      H.stato = "ripresa"; H.rip++; H.scadenza = Date.now() + RESPIRO * 1000;
      bd(); dopo(RESPIRO * 1000, dopoRespiro);
    }
    function dopoRespiro() {
      var tutti = attesi.every(function (id) { var p = pById(id); return !p || !p.via; });
      if (!tutti && ++nRespiri < 4) { H.scadenza = Date.now() + RESPIRO * 1000; bd(); return dopo(RESPIRO * 1000, dopoRespiro); }
      if (presenti().length < 2) return fine();
      var era = H.statoPrima; delete H.statoPrima;
      if (era === "scrivi") {   // si continua a scrivere: almeno 20 secondi
        H.stato = "scrivi"; H.scadenza = Math.max(H.scadenzaPrima || 0, Date.now() + 20000); delete H.scadenzaPrima;
        bd(); H.players.forEach(function (p) { segreti(p.id); }); dopo(H.scadenza - Date.now() + ANTICIPO, chiudiScrittura); return;
      }
      delete H.scadenzaPrima;
      if (era === "vota" && H.vot) return votaMeme();   // il meme a metà riprende col tempo pieno (i voti già dati restano; un doppione si scarta)
      if (era === "rivela" && H.riv) { H.stato = "rivela"; H.riv.passo = H.riv.tot - 1; return fineRivela(); }   // (i punti erano già dati)
      prossimoGiro();
    }

    // ----- la partita -----
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MIN) return;
      H.fase = "gioco"; H.giro = 0; H.partita++; H.classifica = null; H.serata = null; H.migliori = []; H.usati = [];
      H.players.forEach(function (p) { p.punti = 0; });
      prossimoGiro();
    }
    function nuovoMeme(cond) {
      var m = MZ.prendi(cond) || MZ.prendi(null); if (!m) return null;
      H.usati.push(m[0]); MZ.prepara(8);
      return rec(m);
    }
    function prossimoGiro() {
      ferma();
      H.giro++;
      if (H.giro > H.giri) return fine();
      entrano();
      H.fin = H.giro === H.giri && H.giri > 1;
      t.aCheSiamo((H.fin ? "Ultimo round" : "Round " + H.giro) + " di " + H.giri);
      H.mem = {}; H.vot = null; H.riv = null; H.scadPronti = 0; H.rotteDa = {};
      // l'ultimo round: lo stesso meme per tutti, uno dei famosi con almeno due riquadri
      var uguale = H.fin ? nuovoMeme(function (m, i) { return i < 250 && (!m[4] || m[4].length >= 2); }) : null;
      presenti().forEach(function (p) { H.mem[p.id] = { r: uguale || nuovoMeme(null), c: 0, x: [], f: false }; });
      H.stato = "scrivi"; H.scadenza = Date.now() + H.tempo * 1000;
      bd(); presenti().forEach(function (p) { segreti(p.id); });
      dopo(H.tempo * 1000 + ANTICIPO, chiudiScrittura);
    }
    function mossa(id, m) {
      var x = H.mem[id];
      if (m.t === "testo" && H.stato === "scrivi" && x && m.g === H.giro) {
        var tt = (Array.isArray(m.testi) ? m.testi : []).slice(0, 8).map(pulisci);
        var era = x.f; x.x = tt; x.f = !!m.fatto && !vuoti(tt);
        if (era && !x.f && H.scadPronti) {   // «✏️ Modifica» mentre si stava per chiudere: torna il tempo di prima
          H.scadenza = H.scadPronti; H.scadPronti = 0; dopo(H.scadenza - Date.now() + ANTICIPO, chiudiScrittura);
        }
        if (era !== x.f) bd(); else ricorda();
        controlla(); return;
      }
      if (m.t === "cambia" && H.stato === "scrivi" && x && m.g === H.giro && !H.fin && x.c < 1) {
        x.c++; x.r = nuovoMeme(null); x.x = []; x.f = false; bd(); segreti(id); return;
      }
      if (m.t === "rotta" && H.stato === "scrivi" && x && m.g === H.giro && x.r && x.r[0] === m.id) {   // l'immagine non arriva a quel telefono: un altro meme, in silenzio
        x.rotte = (x.rotte || 0) + 1;
        if (x.rotte > 2) return;   // (quel telefono non riceve le immagini: scrive coi riquadri senza la foto)
        H.rotteDa = H.rotteDa || {}; var chi = H.rotteDa[m.id] = H.rotteDa[m.id] || [];
        if (chi.indexOf(id) < 0) chi.push(id);
        if (id === IO || chi.length >= 2) MZ.rotta(m.id);   // rotta davvero: non esce più per una settimana
        if (H.fin) { cambiaUguale(m.id); return; }
        x.r = nuovoMeme(null); x.x = []; x.f = false; bd(); segreti(id); return;
      }
      if (m.t === "voto" && H.stato === "vota" && H.vot && m.g === H.giro && m.k === H.vot.k) {
        var a = H.vot.ord[H.vot.k]; if (a === id) return;
        var v = m.v === 2 ? 2 : m.v === 1 ? 1 : 0, vv = H.vot.voti[a] = H.vot.voti[a] || {};
        if (vv[id] != null) return;
        vv[id] = v; bd();
        if (Object.keys(vv).length >= votanti(a).length) dopo(1100, prossimoVoto);
      }
    }
    // l'ultimo round ha un meme solo per tutti: se non arriva a qualcuno si cambia per tutti (si ricomincia a scrivere)
    function cambiaUguale(vecchio) {
      if (H.cambiUguale >= 2) return; H.cambiUguale = (H.cambiUguale || 0) + 1;
      var r = nuovoMeme(function (m, i) { return i < 250 && m[0] !== vecchio && (!m[4] || m[4].length >= 2); });
      Object.keys(H.mem).forEach(function (id) { var x = H.mem[id]; x.r = r; x.x = []; x.f = false; });
      H.scadenza = Math.max(H.scadenza, Date.now() + Math.min(H.tempo, 60) * 1000);
      bd(); presenti().forEach(function (p) { segreti(p.id); }); dopo(H.scadenza - Date.now() + ANTICIPO, chiudiScrittura);
    }
    // quando hanno consegnato tutti si va subito a votare
    function controlla() {
      if (H.fase !== "gioco" || H.stato !== "scrivi") return;
      var tutti = presenti().every(function (p) { var x = H.mem[p.id]; return !x || x.f; });
      if (tutti && !H.scadPronti) { H.scadPronti = H.scadenza; H.scadenza = Date.now() + 1200; bd(); dopo(1200, chiudiScrittura); }
    }
    function chiudiScrittura() {
      if (H.stato !== "scrivi") return;
      H.cambiUguale = 0; H.scadPronti = 0;
      var ord = mischia(Object.keys(H.mem).filter(function (id) { return !vuoti(H.mem[id].x); }));
      if (!ord.length) { H.stato = "vuoto"; H.scadenza = Date.now() + 5000; bd(); return dopo(5000, prossimoGiro); }
      H.vot = { ord: ord, k: 0, voti: {} };
      votaMeme();
    }
    function votanti(a) { return presenti().filter(function (p) { return p.id !== a; }); }   // (anche chi è tornato a metà round: ha i tasti)
    function votaMeme() {
      H.stato = "vota"; H.scadenza = Date.now() + VOTO_S * 1000;
      H.vot.voti[H.vot.ord[H.vot.k]] = H.vot.voti[H.vot.ord[H.vot.k]] || {};
      bd(); segreti(H.vot.ord[H.vot.k]);
      // chi non può votare nessuno (in due, il meme dell'altro: vota solo uno) va avanti lo stesso a tempo
      if (!votanti(H.vot.ord[H.vot.k]).length) return dopo(2500, prossimoVoto);
      dopo(VOTO_S * 1000 + ANTICIPO, prossimoVoto);
    }
    function prossimoVoto() {
      if (H.stato !== "vota") return;
      if (H.vot.k + 1 < H.vot.ord.length) { H.vot.k++; return votaMeme(); }
      rivela();
    }
    // i punti del round e la rivelazione dal meno votato al più votato
    function rivela() {
      var mol = H.fin ? 2 : 1, lista = H.vot.ord.map(function (a) {
        var vv = H.vot.voti[a] || {}, n = [0, 0, 0], pt = 0;
        Object.keys(vv).forEach(function (k) { n[vv[k]]++; pt += PUNTI[vv[k]]; });
        var bonus = n[2] >= 2 && n[2] === Object.keys(vv).length ? BONUS : 0;
        var p = pById(a), x = H.mem[a];
        return { id: a, nome: p ? p.nome : "?", rec: x.r, testi: x.x, v: n, bonus: bonus * mol, pt: (pt + bonus) * mol };
      });
      lista.sort(function (a, b) { return a.pt - b.pt; });
      lista.forEach(function (r) { var p = pById(r.id); if (p) p.punti += r.pt; });
      var top = lista[lista.length - 1];
      if (top && top.pt > 0) H.migliori.push({ rec: top.rec, testi: top.testi, nome: top.nome, id: top.id, pt: top.pt, giro: H.giro });
      // si svelano prima tutti insieme quelli sotto il podio, poi il 3°, il 2° e il 1°
      // ogni meme del podio in due tempi: prima si vede (passo pari), poi si scopre di chi è (passo dispari)
      var prima = Math.max(0, lista.length - 3);
      H.riv = { lista: lista, passo: 0, podio: prima, tot: 2 * (lista.length - prima) };
      H.stato = "rivela"; H.scadenza = 0;
      bd(); passoRivela();
    }
    function passoRivela() {
      var p = H.riv.passo;
      if (p >= H.riv.tot - 1) return fineRivela();   // l'ultimo (il primo posto) è svelato
      var primo = H.riv.podio + Math.floor(p / 2) === H.riv.lista.length - 1;
      var ms = p % 2 === 0 ? (primo ? PASSO_RIV + 800 : 1700) : PASSO_RIV;   // (il rullo del primo posto è più lungo)
      dopo(ms, function () { H.riv.passo++; bd(); passoRivela(); });
    }
    function fineRivela() {
      H.riv.finito = 1; H.scadenza = Date.now() + AVANTI_S * 1000; bd();
      dopo(AVANTI_S * 1000 + 400, avanti);
    }
    function avanti() { if (H.fase === "gioco" && H.stato === "rivela" && H.riv && H.riv.finito) prossimoGiro(); }
    function fine() {
      ferma();
      var ord = H.players.slice().sort(function (a, b) { return b.punti - a.punti; });
      H.classifica = ord.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, pos: 1 + ord.filter(function (q) { return q.punti > p.punti; }).length }; });
      // il meme della serata: quello coi punti più alti (a pari, il più recente)
      var best = null; (H.migliori || []).forEach(function (m) { if (!best || m.pt >= best.pt) best = m; });
      H.serata = best; H.fase = "fine"; H.stato = "fine"; H.scadenza = 0; bd();
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    function nuova() { if (H.fase !== "fine") return; ferma(); H.fase = "lobby"; H.stato = "attesa"; H.classifica = null; H.serata = null; H.players = presenti(); entrano(); H.players.forEach(function (p) { p.punti = 0; }); bd(); }
    t.onRivincita = nuova;

    var CB = { sonoHost: true, myId: IO, onComincia: comincia, onNuova: nuova, onAvanti: avanti,
      manda: function (m) { if (H.fase === "gioco") mossa(IO, m); },
      onPriv: function () {},   // (lo mette il disegno)
      onEsci: function () {
        function via() { ferma(); t.ricorda(null); rete.chiudi(); t.esci(); }
        if (H.fase === "gioco") return t.conferma("Chiudere la partita per tutti?", "Gli amici tornano alla home.", "Chiudi", via);
        via();
      } };
    MZ.prepara(10);
    if (riprendo) riprendi(); else bd();
  }

  // =========================================================
  //  OSPITE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null };
    var cb = { sonoHost: false, myId: null,
      manda: function (m) { if (S.rete) S.rete.invia(m); },
      onPriv: function () {},
      onEsci: function () {
        function via() { if (S.rete) S.rete.chiudi(); t.esci(); }
        if (t.guarda) return t.conferma("Smetti di guardare?", null, "Esci", via);
        if (S.vm && S.vm.fase === "gioco") return t.conferma("Uscire dalla partita?", null, "Esci", via);
        via();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();
    function chiediNome() {
      var s = t.schermata({ icona: "😂", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      attesa();
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;
          if (m.t === "vm") { S.vm = m.vm; disegna(t, m.vm, cb); }
          else if (m.t === "tuo" || m.t === "mio") { cb.ultimo = m; cb.onPriv(m); }
        },
        onChiuso: function (perche) { errore(t, perche && perche.sparito ? "L'host non è tornato: la stanza è chiusa." : "L'host ha chiuso la partita."); },
        onErrore: function () { if (S.rete) S.rete.chiudi(); erroreRete(t, "Non riesco a entrare nella stanza.", collega); }
      });
      if (!S.rete) senzaRete(t);
    }
    function attesa() {
      var s = t.schermata({ icona: "😂", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
  }

  // =========================================================
  //  DISEGNO (uguale per host e ospiti)
  // =========================================================
  var UI = null, FIN = null;
  function disegna(t, vm, cb) {
    if (vm.fase === "lobby") { UI = FIN = null; cb.ultimo = null; return lobby(t, vm, cb); }
    if (vm.fase === "fine") {
      UI = null; cb.ultimo = null;
      var kf = "fine|" + vm.partita;
      if (FIN && FIN.k === kf && FIN.t === t && document.body.contains(FIN.s)) return;
      FIN = { k: kf, t: t, s: finale(t, vm, cb) };
      return;
    }
    FIN = null;
    if (!UI || UI.t !== t || !document.body.contains(UI.s)) UI = creaSchermo(t, cb);
    UI.vm = vm;
    aggiorna(UI, vm, cb);
  }
  function lobby(t, vm, cb) {
    var dentro = vm.players.some(function (p) { return p.id === cb.myId; });
    var guardano = vm.guarda || [], guardo = guardano.some(function (p) { return p.id === cb.myId; });
    var extra = [];
    if (guardano.length) extra.push(t.el("p", { class: "modulo-nota", text: "👀 Guardano: " + guardano.map(function (p) { return p.id === cb.myId ? "tu" : p.nome; }).join(", ") }));
    extra.push(t.el("p", { class: "modulo-nota", text: "😂 Più siete, più si ride: da 3 a 10 amici." }));
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN,
      vuoti: Math.max(0, MIN - vm.players.length),
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: vm.tiene ? p.id === vm.tiene : i === 0, tu: p.id === cb.myId }; }),
      extra: extra,
      spettatore: t.guarda ? "👀 Guardi soltanto" : guardo ? "👀 Questa volta guardi" : !cb.sonoHost && !dentro && vm.players.length >= MAX ? "👀 La stanza è piena: guardi la partita" : false,
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  // un tasto che risponde al primo tocco (pointerup), vibra solo al tocco
  function bottone(t, classe, testo, fn) {
    var b = t.el("button", { class: "me-btn " + (classe || ""), type: "button", text: testo }), giu = false;
    b.addEventListener("pointerdown", function (e) { if (b.disabled) return; giu = true; e.preventDefault(); });
    b.addEventListener("pointerup", function (e) { if (!giu || b.disabled) return; giu = false; e.preventDefault(); try { SG.audioCtx && SG.audioCtx(); } catch (_) {} vibra(10); fn(); });
    b.addEventListener("pointercancel", function () { giu = false; });
    b.addEventListener("pointerleave", function () { giu = false; });
    b.addEventListener("click", function (e) { if (e.detail === 0 && !b.disabled) fn(); });
    return b;
  }
  function tx(el, s) { if (el.textContent !== s) el.textContent = s; }
  function mostraSe(el, si) { var d = si ? "" : "none"; if (el.style.display !== d) el.style.display = d; }

  function creaSchermo(t, cb) {
    stile(); caricaFont();
    var s = t.schermata({}); s.classList.add("me-piena");
    var el = t.el, ui = { t: t, s: s, cb: cb, kAvanti: null, kRiv: null, kVoto: null, mio: null, sel: 0, bozzaTo: null, faccine: null };
    ui.root = el("div", { class: "me-scena" + (t.guarda && !t.eliminazione ? " me-con-targa" : "") });
    ui.targa = !!t.guarda && !t.eliminazione;
    // la barra in alto: esci, round, tempo
    ui.giro = el("div", { class: "me-giro" });
    ui.tempo = el("div", { class: "me-tempo" });
    ui.root.appendChild(el("div", { class: "me-barra" }, [el("button", { class: "me-esci", "aria-label": "Esci", text: "‹", onclick: cb.onEsci }), ui.giro, ui.tempo]));
    ui.titolo = el("div", { class: "me-titolo" });
    ui.root.appendChild(ui.titolo);
    // il meme (uno solo per tutte le fasi)
    ui.P = pannelloMeme(t);
    ui.P.onRotta = function (id) { if (ui.mio && ui.mio.rec && ui.mio.rec[0] === id && UI && UI.vm && UI.vm.stato === "scrivi") cb.manda({ t: "rotta", g: ui.mio.g, id: id }); };
    ui.P.onTocco = function (i) { ui.sel = i; scegliRiquadro(ui); };
    ui.root.appendChild(ui.P.el);
    ui.cred = el("a", { class: "me-cred", href: "https://imgflip.com", target: "_blank", rel: "noopener", text: "modello da imgflip.com" });
    ui.root.appendChild(ui.cred);
    // --- scrivere ---
    ui.scrivi = el("div", { class: "me-scrivi" });
    ui.chips = el("div", { class: "me-chips" });
    ui.cambia = bottone(t, "me-cambia", "🔄 Cambia meme", function () { if (ui.mio && !ui.mio.cambi && !ui.mio.fin) { ui.mio.cambi = 1; cb.manda({ t: "cambia", g: ui.mio.g }); } });
    ui.campo = el("textarea", { class: "me-campo", rows: "2", maxlength: String(MAX_TESTO), placeholder: "Scrivi qui…", enterkeyhint: "next", autocomplete: "off", autocapitalize: "sentences", spellcheck: "false" });
    ui.fatto = bottone(t, "me-primario", "Fatto ✓", function () { consegna(ui, true); });
    ui.modifica = bottone(t, "me-vetro", "✏️ Modifica", function () { consegna(ui, false); });
    ui.aspetta = el("div", { class: "me-aspetta" });
    ui.scrivi.appendChild(el("div", { class: "me-riga" }, [ui.chips, ui.cambia]));
    ui.scrivi.appendChild(el("div", { class: "me-riga me-riga-campo" }, [ui.campo, ui.fatto]));
    ui.scrivi.appendChild(el("div", { class: "me-riga me-riga-fatto" }, [ui.aspetta, ui.modifica]));
    ui.root.appendChild(ui.scrivi);
    ui.campo.addEventListener("input", function () {
      if (!ui.mio) return;
      var v = ui.campo.value.replace(/\n{2,}/g, "\n"); if (v !== ui.campo.value) ui.campo.value = v;
      ui.mio.testi[ui.sel] = pulisci(v); salvaBozza(ui); anteprima(ui); mandaBozza(ui, !!ui.mio.mandatoFine);   // (dall'ultimo secondo ogni lettera parte subito)
    });
    // «invio» passa al riquadro dopo (sull'ultimo consegna)
    ui.campo.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || e.shiftKey) return; e.preventDefault();
      var n = riquadri(ui.mio && ui.mio.rec).length;
      if (ui.sel < n - 1) { ui.sel++; scegliRiquadro(ui); } else consegna(ui, true);
    });
    ui.campo.addEventListener("focus", function () { ui.root.classList.add("scrive"); setTimeout(function () { ui.P.adatta(); }, 60); });
    ui.campo.addEventListener("blur", function () { setTimeout(function () { if (document.activeElement !== ui.campo) { ui.root.classList.remove("scrive"); ui.P.adatta(); } }, 150); });
    // --- votare ---
    ui.vota = el("div", { class: "me-vota" });
    ui.vb = [[2, "😂", "Fortissimo"], [1, "🙂", "Carino"], [0, "😐", "Meh"]].map(function (d) {
      var b = bottone(t, "me-voto v" + d[0], "", function () { vota(ui, d[0]); });
      b.appendChild(el("span", { class: "me-ve", text: d[1] })); b.appendChild(el("span", { class: "me-vt", text: d[2] }));
      ui.vota.appendChild(b); return b;
    });
    ui.root.appendChild(ui.vota);
    // --- rivelazione ---
    ui.riv = el("div", { class: "me-riv" });
    ui.rivChi = el("div", { class: "me-rivchi" });
    ui.rivVoti = el("div", { class: "me-rivvoti" });
    ui.altri = el("div", { class: "me-altri" });
    ui.riv.appendChild(ui.rivChi); ui.riv.appendChild(ui.rivVoti); ui.riv.appendChild(ui.altri);
    ui.root.appendChild(ui.riv);
    ui.nota = el("div", { class: "me-nota" });
    ui.root.appendChild(ui.nota);
    ui.avanti = el("div", { class: "me-avanti" });
    ui.root.appendChild(ui.avanti);
    ui.punti = el("div", { class: "me-punti" });
    ui.root.appendChild(ui.punti);
    s._contenuto.appendChild(ui.root);
    t.mostra(s);
    // i segreti che arrivano solo a me
    cb.onPriv = function (m) {
      if (!UI || UI.cb !== cb) return;
      if (UI.vm && m.p != null && m.p !== UI.vm.partita) return;   // (di una partita di prima)
      if (m.t === "tuo") ricevoMeme(UI, m);
      else if (m.t === "mio") { UI.mioVoto = m.p + "|" + m.g + "|" + m.k; if (UI.vm) aggiorna(UI, UI.vm, cb); }
    };
    if (cb.ultimo) { var u = cb.ultimo; setTimeout(function () { if (UI === ui) cb.onPriv(u); }, 0); }
    // la tastiera di iPhone: lo schermo si abbassa e la pagina scorre; la scena resta attaccata a quello che si vede
    var vv = window.visualViewport;
    function segui() {
      if (!s.isConnected) { if (vv) { vv.removeEventListener("resize", segui); vv.removeEventListener("scroll", segui); } window.removeEventListener("resize", segui); clearInterval(ui.tick); return; }
      ui.root.style.transform = vv && vv.offsetTop ? "translateY(" + vv.offsetTop + "px)" : "";
      ui.P.adatta();
    }
    if (vv) { vv.addEventListener("resize", segui); vv.addEventListener("scroll", segui); }
    window.addEventListener("resize", segui);
    // il tempo che scorre (solo testo: niente ridisegni)
    ui.tick = setInterval(function () { if (!s.isConnected) return segui(); tempo(ui); }, 250);
    return ui;
  }
  function caricaFont() {
    if (caricaFont.fatto) return; caricaFont.fatto = true;
    try {
      var f = new FontFace("Memata Anton", "url(data:font/woff2;base64,d09GMgABAAAAAEi0ABEAAAAAqxQAAEhQAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGoJQG5YyHIhABmAAhUQIgT4JnAwRCAqB71yB0ikLhDgAATYCJAOIbAQgBYQMB4pPDIFhGwKZJWxcxex2EESCuoeHKErUrJhwY+hh44DR8zy/+P9vCZzIkLIb2umuwiXpgohSARGRRtOj3uhWKxqeLt3E5eRW6hbCpFCpUEat/u3U/+peaZfLzGVfbbF+MGC4wO4XIeyHPbi34B5+EAFl62ARGkUf5lHcfORendVFYOMyRrJy8vJ8tPb/79pVPT3z3v0BAhlWhIqIXFTiCCUBemLJcE/7D/w2/9z3Ho/IKUZjYxPayAcsFlXWKoJ1sqp2Xc5tX3v+/9dMu/c++L+qpEYyUJJB1pGpQwpgh2V1oKxZeTSw7FPB3drLGaBtdhaCbmIUohggCiIWKApioI1FCTaljU7FmFFzs3rGZuTm2m1OV/2urM3NXrvId/9z+b9tfh86pYgmBJMQrEDVzrvj385ebLHYjvV9/19/Kg9Tyipc9XWyz/8FCqBMQdArSvGPh9nDrG26Unh5u69kZplZuFIpV1sJBz2c2X9U1/SEMnmDA02VpfNf4InIkuU8+JbtCgTJg/Z22dptQv8/nZ/vzrxBjQANJFu2P/gDL5CWyAHusKs2XZOTotq2CSgwZ2P9WLjxiWHJaaWRiNJoudBdeWVN8Bq/uRACMA14u2H3yxRCF6Pt/fYhVrJc4OxVeU1SFaY3Pf9/Tf3avlsl2ZLz08cKfOD0R/800NnbDnQPa4BoX7rvlapevRJVWYkojm05OY4dkJR02rL/yagE/pLdEHBynAbC/EFbCjph/yGmFdGKcLHk3WyXs5v9zHI1+0X3duA/Wk7NPOqMWhwSYVzp++mrAHU4XOw5GSVLl7GxES4my8wdEOIwbEwULINMz1df9d3os32ROv38U8lJ8IKIZ0UGbwlzrGmdWdnW3ESl2CiDjDCIyfuaWW2yULUIqp9XJ4cco6OuxeOItPS0NeHB//ERDAVACgwtjhpxF4qEi0Hi6BEjC2KTiZUlB6mjDtJQI6S1NkiePKRQD6y++mENMASZYAIy0RSMGWZgzDUXcViItdxyZIWVWKttQrZwIjvsQHbZi3XIIeSYY8gJp5GzziLXXEeKFCHvvUc++4yUohQUUMBGSFJQFKQARUlKsFFFE8U92ghhwV3BjcFlETGbDD04LLDCSrsiAyJnk6lQX/04LLTCLrvtsTcAgtVXv0BB4CKtNpi73p3OAhTPeGymBFDggPWPgWCwT39iugSI/s0GAP9n9uALAmrQeEIisGmzOIKyH85w4YL70bJThnYSo+eL4dR4KkSCQUcuOzpSyYgk0lklUgh/nlwQ7M9HEo86pM4FVbT+7j4I9rcJIoSTQ4chGsHmyNQi9ERzmUZo1luKmFkyg2hhNLx5Ux/wqjSOnwjS78Xk9vEiMqaoY3+q9ygS4sHiULWoVSW4sT35e5vjjCjkEZyPOrwnX8EMHgTY/I8d2qrI0LaTJ8KZaJLJZuCECOFOghlheNSmuY4d3tREaBs+1zFDBh71mLmOM72xluX2w9ZkMl0y/nXf8Yxm0L877V2bUpPdKe658/EzI0l8BF0jwklw/D6wR6j3kWIb3CdGxyh6XTWjQiJa1UP2DKjC/yjGF+9ua7/w2F3X8y+izAC5lE4tUH4oDOoK8BgfjQYfpMwCq/IWhxrzcr9cuRfv+VlKC2MiP9gwrRsp5gmvea+F0DMNLCVWGlXFHpOGT/oHjlLOufovaowAXJ+sV0Mm5fQneFlBI5SbcNF8th2B5xBZPRnkyAjilbDnlLTblLy9lL63ktlWsmXfWNSmDnVpSCOa0JRmar6raKG2W4p26hz3l2aPCGyd5cIOGsxs7H3YLJv50Sf7k9nImzzLw9zOVXk/n5OZwHtjOZzh9Kazh29VWlK3da1IKZ7OT1bSkhhRosL96jO6pRZ6vOIap9maAOH5d+YxiX6uxz2qUSIOFWpQhnoJvvnglaI4oafuu+mys447+PWT3Zwo+7dllNt7AcojoZQo2JXI4+nu8JRXSZvr0OesJupBqtpXp8q96PJ3HyZ3t2+3IuGcMCFvaVFuYxFF8VayL8UvM1VzWZWqrm6l3hTFCpp+6b46H0L+n0p9IxW3YKUlh0rzR+55HVnIfV7yNv+oFeWaK+BqvO6UsTbwj5+cVxnsnLfvP9KMgIycgpI7D558BNAIFCRYiCgx4ujoGcVLkChJshSp0pn9xyJLthx1lj611uZ3Aww0yGBDTDDXcmuss94GG22yZf1HvD7khiecdEpn1/1virz3WSkJSURikpCUFKSKWtSjEc1ok0M+xHru6drBnclt32veczzcRrTIDPBeIJ8A1hAOv/q7tHZW7FhWj6txvNGSr/b53Wf2nNw+Fob3HNjeu2c+riMuh6jhcqlxGcvyXipZ5pO8TyrexojzBH92xSSkVGpx4UrNizcfvvz4CxVOK0KkKNGT7U9jmqoatVmWm1aI9z/112VwdXHdgUtXxcat9ZfbeIcQWuCNtOEeoD870s6DaNEIwY1Ja3Cq1rSNp4IfpfoHijwTns64qa73+rSSXU5XoxRIL89yTkVKwUCUkWL3Pdw7dwpmyl8PhgiTViQYa3CQK7pJTOTz4PVO6Ly9XnWs+x0cgkZ7JQc1mumVHR7PrQhMpnsodv85N9zmmnanP304LZF92kpi8ZnUwpDi+hMzeGKMAJ+Q3sdJFny5zIbIa9ed8MUtUitqBBhiK5nWJu7ciWQmKZTS6wWGgitfwyPee+DQjXiDvVePRUTdpAPFWOab16ITa453cOsZXoAQRCA+l4B+XZa8HkpZH6Up3AROLfTCN6+eqsxduLR62LvciWWE1HvV8zCC9gFN/I3g7qQhqUPGRsrJvfNugearaRchZNqxr/jxj09JA3L5kp8gSU0BOj0pnS8EWjwjIY4PNHpGqjAZqHOTM4vNzxqUkg4kgxcukIWySBZDLbO3MhVlV2T5PHWdqkLupJb1VeV9HscZSWLCCDW69tv09YxdJItEZ22uGkk+HrN0mc6Gmmqmw86567tiVBBLHr0xvUhMtgiEXQqE7CImnJcy32oTd0wwGSvTTpOONasRKqkZqTfasXgSbO9pYooh+PalDDPNLEec98MvVBJHnnqIdLvIl/ndP9x0sx11wU8lqCIBeSFkTpf1kqhFh9Ze+8q7/5ZCNMlwJw0g8ikQfwCfOx4CGffB2WonmgsXdx333/OpSfbmrMXYnIIPBLwGw9ua9pYR1K+2eUYDlpb/pabVXgyHPRg2Q1godqXuzEezbBya0ZbDaB5uXwhxb0lvWAotmpMPhhBub9HvgN1uenWGJ7EivdEWFbsK+wr1XbPCapsFUJuPuqeBSIpFcMeKGv0eTjoo3C4ijWi21JI1K8yDhVgBk12MvoEqjKA3jSRei6jH5i7MtTMNBLDdctwDb030Eq+W27sgHvAyeDJ4mvjN+qwnZmcCp+H6VxInnEfB2W2r/7qg1wHbz+YrcF0sKAh3XRGLfFzt5nd0PgF8717KaP/IJsw6XzerqJ41sRwrZoMbc12x0ZnRFTXeGn9NkCZMY9SkajI121lQ4DzmKF2C3P79tfFprFnNqHP3gW1WdNcVNJ4a3w/aoElJa23utdYDAc6XnLbX3ACE74X6569+9ekpFPjVdwH86javNPCrx7ya95LX1tfyX/xc7V/lggC3VQbkE7n/xfMxsMP8CAse5fCj6R8Y57njervD7p1bbqvvsc5Wues3eTgXFhWYaapifDfUYZ18s81oizzVAEdGTknlXbt78VCOxIJ5Vp4WWzfXWAt1sw3zmYGROlVcD82fKlx3w5NqXvRHs7ammmimHtZ47f2P3Ghp6asC3V2x2HZ/8MFO+Z6ERw2s9rnpgbYuu2qJSy6qxjNiPCEpEQkBBbVf4/6MccxNiEjwaA8HQ0lY28RgnhxfQ1m7srUxBKFNfjsxxrFGnRu/HknPeKTO+m+MXZWTWpgzuqnNwRYAH1ZohVFGeumVFw744tO8xYM933rAMJJYHu2I0wmmLsybrs8iHlE85gKR9+xEE8+SIrA8uXjQdGCWbN/k4KkKLzs5mejbK/bPrlPiBXZ06+/Te0Ajdrv1ZDpJfwCRTpT0k+8psPNAycUO9dUvz5s1Hj6EEdJP9xQeH62ARTiUS2Mt6TfSS+kWgtCCqwiwLSO+n4BYsWeVQHMt559OuA5LIthvfMIs5jsub5ov83k6BoMd19KJDfl8XESjweC4HL62ffklWZh88RotT1wpU2loJaRv/ZWWJolpCefJYE1PyiZpVL6vrEEDfj0n51/lMMXsDXvUO95Suh7/9k/yTfpV+e35De8Pi/fPd95/UORqMDY89GqbYpIujAtx8jUHI6Qv9YJ4HnSjFTD8uXRH7hJB9cEiFM7AIel7T/r4wK2qGy/NC+dH8SGTodhFHpQIVJuoRKjaQfQryIbitKICeiB7bEDDQ09jjlYkjbUPs6WidrpCJEaz6TnwoNGmMQKbxdSlN6TqWv+VJ1L79W+KfDG6IecjHw5NPFYvahXsrzwZBhx1QSeraEDHdiHhbWJznTkBqT5RpOiNiH6CpptTDtA5N+HwgUWQOVGqL8pph+7dmTyKmxNaz7Vs+JDIGU5mGCuJkOkA2YO2K3UVjcstmvhlD9s19m5LULrN7E70zMSDxLjeBapYkwTNuvLreEbkdg69NWK1ZSumyKKxw7/NgxUzZB1IpdweJvCZMKczbIPvRbZqJFdG6pqz4oFFmLrKnAHpdx0S5sQ/8gI7pz7zoKsfGA9lXLHEzpHfOemKGZvl8v4VMhU80ws5gaiOeahho8JdTp8hG0csCii9GtmJUfJNKn3RyQezrpXHwRbTCBEREPQ1V5lywAyBWRmfVePJ82ai0roESU9/kdLLN1mNiUzsnHoW5tBjYo6xUReHcD9cniQ1mRPnHAykmp+ouZrY8Z9Ye68+p0GmOgYykECGkiAjSZKxxGQiKTKVNJlJhswlSxaS699BVqEpddk59YKaeIkZJdWf8LQ3rvfup+1b18fbrcUELxPWDhP19gkrh5WwhBZWoNCBwhoUNqCwBYUDUDgEhSNQOAbNngHLYUvO8wOHBR25FB3P6mjGGXKjF7DokfXu+Ha5BDDAmg5JnJf0Xr2YYSAgV+xxKCdjO7hrxctuVmmh5z+preLaSTUIZm+A7/pvucVENcPOzGkiNKrYuyg1/0RE9GpV5vNNqi1+u9wByxhYkSC9jL+KKt5D/Xy54n2JKDEPPBr/AFmItqPmFKmLmZGt9GXP+miEvzTUO95cuZ+w8KTl8x+C1HwPvmPsb5Q7kYNczhuxfZXODFhO99HLoz7Uo0ap9aBKCvydWMb3F/6adbY1cjTPjtXR7ZgnUqcWlX45rOamNQLlsb1pAWZohIqxKTp/cKMYge7KKiajYOccWfpx3gg9+xT+Qec6YkBtSMVlbgSfJJVHUZY3Rc5LkZxLqdJpyYy6focfA8Ixi6tcJWR5fqH9iU0vpPeBU+Nahp8KUJMY3Ir+RD/6GstiTfDJgHYh5otp1xq2DjDMlxUxr66ZYYEffvaBaxB8NUKZU9bwoKcTPcSMUCri7AP6Q3OsHsta54tUtS09n3/gY3M484sRqlZ7vV+CD2Pa3Ffgo0jtgUibZbovkUfNmhd75LVNDUrNDH8iMhTmAHzT5eE21DI/S/4bZD/iDlMe2P8pBlhGy5DMXn1Z5o1FTdyqtuRtPz0MaPg7TTniVphqk+YIeG/Wm98qFOf63NRz112fDyMfkQlXMd4j/ZORP/ggn09HzY6gRj91FTJrj7CO8fNF3jcoRG8wMXwrKQvxOxAEEiT0Sd4QSZC4A0EikZ/iWgJoATIyJLsMQU6G5FdIMlCQIcVlCEoyRrkyeEoVJFLtQFCTIHWf5AMNCdLsQNCSEO3mwEPuYCDdZQh6MqIPBAxkyHAZgpHMnjGyjN9RTKQYneSagmvM/vWUwNPn9yGUZOFGXrohq80yrWHtMmHjMsUW9B126jvZuyEHN/z43W7ByWXB2WXBxWXBVQW5uSF3N/yBdhueLhteLhveLhs+KsjXDfm5yf5B8Rv52xzqtcKN8dJerLGqrk07ZHwWdZ+h/7O/xWNAaP21DuQaQN0Gcmu47LsRrvpUoH8AdVu4zUsg8PkRC7NsZqTM3EQF9lWqVWW1oBvDXtXCbkxpkURNBiZs1bU37TUYNAMnaJzLYr6mYYtLu2PEDICZgWlS68FRRSuoaI7l5VrWXp2tU3PHyGjv2nCdOkYzCEydX+0U5joqzUaYjEAETEej1GK5YThzpZZJjD6/InOynHHu/NK7kMR+GbiMdOyTqPCNeg2uyCp7YlNfmTg433rGwH3rV/UrYcy0eBDKhLnrrGUOq7LcGsNskFNls2moNjcHhueM93EzN/HhUP+YmkfnPwrqg66L5FeWF/E6b5rnm6s856dIkoiN3nB+yaFeR3OXM+UQOhv1yBW3PvZNKJL0IU8gc1EIXMUz5hg26MpxlRUmPOjwPGKTpenfzOXdIE8udiDDG228XiRrdjtjIRv4BF8xy1nc0S7X2LZZdm6RL1Rc1tk5zxrpmQ1ZtKge4+OqdohnTkIWp1MIMLDahHFhpl4mh2Yk7qagS1gIX93gBeO9NJgWm6Kl8Ql5hmh4LJ4gxV06VEBPRDSPMYzXdC6RbMYBidlQec45KMCdF53eLwz3UioGOzmdRwqjhmMq4ZIVBxJqZ2OOlNHutBdZBGrDUVUK5exstBV9bSlCgE/RtL2REitWHmqWZ3Sol8Ur7y3ysyYrH/WnSiixYEsvqUZxXcsW6EpmG8+gE3iT15PDWGt0BwMzxUH84B3luDOf0LyvoYoL01Np/XGATF2LcYENxw8UuZzA8QoVnvbiGwWXRJ/iw1Ex5RbHK449a8YH5O8tpJYUfw8yPgoc01HkbtiqIPpch6GQIXU0GMnEuBAjdV406KXuCn2hT1HbZ90F8YhDh5cLDV8XCoScpQxbxX8ALmXI2crAlwX72F7NAm40sWbN0JyJ1gww5M1Z7BvJDG4NeKcO0SjMGv22iZjc0rgDGBBqibKnG2nlZc6tDO0cwfHME4sKBa7UC10vZNNdW37DuSHUbztEbuJcZuD5v7bMGVzFpJjXL7SypfMy94uQf9dVupES+ufXMvqxtyjnt8CuOi/PnqmKucyq4tTpvNzt/B9JcC/9W37wO/ZW0QIVr+kxPFpJYMFiYyK0/89b/S+fbLFeqzv3QVmJhXuejsE2p/ioAyeZVwYzxAUJcsp77QonrOvbUNfHnZg5/Blo8A78jgG3YhPfHzrahycL+pGjb/qHt8wUbaqMhvkqpV0WGjoWDJP8rHOxRq0QF52Ieii0e49PkIBUI3ETBL4A3GeNN+bV5wFlG4F7htUd1gajC+qbMgJvZQdEPw1AXq2cmc/6HzscKV4SZrE66sntJlMlueBNL46mjOE7yiYxpjqX2D4ksyxgxIzsAxzOHwk0guSqsgq6laKI5Jwi38CgECvXL14RqxUSG6YT4WDbNWmHas1H9Xno6o082gJHtLNBo3BEYGvBOZPBOUpLtrQwIRh0W1tLL9wHIdM2dlSfJ4SLjhGaNSbpGSpSTaoopAstPPBgUDsY1dqWiedkYYo1kfiGuN3Qlo1pZjesoty0eDXZh/2mCoSD530l55352TfwWnKFXHKvgEsbdZcxDYTauLE2x8GXgYNb1mm/vdBHI1uTl1W1q423jBjJSNUSEcCAzRo20jDG3UnbObKgYE9BzAX2d63qtT23OkWtk05SpqpQSsNwoJwUBDk57f8gKbgTY0l/snBCsPFRtPA27ihMQuYwL9qWAg5n9Tz9lgk+i7vqP9k9tEMuSwQZH0isxppGAwGGCxJebTtJ7rQ970WWVlbF17T+FKPEUHeb9G5gHppub1fvYxIyzCBk3A86d4ZONzAx89mQqOgsn+Q23r1AF/HU6dvMqLsy53G3arxbRSSFpRKbUmzhI0hc+aubKD6EATFt7jL1OvUG0YCgLQN+GF9dMg/u5I0r2gJtQtToorPLQKrpzTt0F0+dvkjWZJdNcAZtsuUESPBPUxgiLNI3rLOINrQez0SRDxXCmsa6UEFp1SVRKBEJQpvJMTLdgnUGMaF39gBIafrVIzZyyFe3lhMVnifeBZMIBjdZCyZ0aEvVzp8IaiZeiZW1znzAeefM1ry5Hz6974fy6WC1lb4YCQd7hSYPzLW9YIO516TPFrhvmOhH56x2Er+hvDnzuRuUpKm7O5YPA08wCThyfEuIrHmB7XQV6afjwZZ9n4xEMg1OmtHVVtf0ZCVHoje7KvNTea1VRPvGDHQ/DDY7aCjekZVXmh1nUixio5vwySZI8qaetiFD/8fF3JvhSqftgwxiYGFY93VrzfZzVgDTGlTgeCPcS1GnKEsgmh0tmA/S12l9QhasGq4YEl1FmnKaGHY0J4u/ARYgmyChjaCl87ihnOxwyDwZ+YXGPOOWulChZtSeasrHDE5A63IVOJgaCTjnUUOyF2dMrPlAwQRkGu8QNgXt7M5Q/qzcS1GLxhmPx7hZFpZbDODgESU9LCgWgnHGNY09xPGBcIdtSZYBuz0mU3Ghlp1c+/ZVjpu/MrfZGjyxOkxTW1k6SqCj/31bLocXO0z2Uawj1RjX4eYUSg9N9OqoH993HguvpF1GBKzECpDMu88BPP3R8vBR/o2yywiO7Rb9CX9BMxk5+ZTxbAGmVUXT91bgYs3zy/YsxkwZeAQ5Gk7bR1uhhTWVVxlPNIHJShx2po7V+X4KEMa3dMA+8HLO9hBWUcIjl8VVpSE208d7ci7M92TmlQQD76o3Wh6DMXury1x1JCIDi/kp7CWXmqyL2WTAkaa3P5MSG7fcR3JYC27PAMefOpL6EVtcvcUUjVhTAqQ6Brk+N0a+4S6FZgMczT/TpbmLr+CTSJrT2dNYJnpF99IWoQZXdU2Xulvrpct2PitMVJkN4sNrprqcYjd6gwIMYhQtibnmA2C3zLekwRQ7r3tRwEHl/KJm+MzQv1cpmO2RJIEdgUCuC8R8cE3aQT2W4unzz+7xAqihfYDCvqf33GcnXyEiQml4na2UtR6gC5/XguMJvfJzRao4nKb2+l2/pCZVC9UzRIfKtQeBq4pzMvtOOeZAPnH4H8Irl4+eXQjI53aE6WQZBC/3HHL5u/mgC8zy9bGB+xNPsP39ZAmdlaXL/jgO1e1PiO019NLGh0c4YAr6suBqeOp4tXWUfFAW1sbYi7zD95C5JcqX7CwI2HgzTZ7j2l5cvDR7h/TjKHRJau/Mj6rhPvMxM+tudZkVFkr3pzfvCLXS53Wi/Df851XGekM3Qh3UvmFCo3TpTDoCMwHN1f//w/GxC3Xeaje4+xwRdBtndIgN2xvFtSeJpr4/o3RHZWrJzeED55RHo6TD0qizHYhhhBk1cJb/poBB1CEQyBw0+1p4+qldkxGDeG9MEB8IfyEQ5jUpd69ILEZYPOLKwGXBNiZa5fnZlG1yLJZpV2EMEKcScYYXnkgX4mEDIdgYtHDf3Da4Sdku2ty0cjRRCenvP9+VcJXl0tJQkC/QudU/XzzeLL95+FAknnl80b7pH9CCu8JLA7nlYQwzL8so3NHurqpj//ms6yaGpNEsaE/iHaz7HJwzHcjOPq7uXkSBi7u+eySTvoicop8eb1c35kK9NKj/1gRYt+2AeLx7Iv9YwjQh3N36YGsQ5hpuBWMQ7FB0UpinIdPD39+gM02jJb6fhnud33eXNNVPftMUWKQkibDJwWYWxOJzOmd+2d1//O9b5vPVd3Nz/qv2nLnIz2+LfqWPVgSHoB1ICK4dwZDj6IIEB9pbDvqTRn9P5U78cmuDzyGREUPVvTS+M/xEwAsvJIBisX174v7iju0+Qb/MfwIdjlh2Rnngrb1dQwyTAwWebvtbjw8vPJ1+d/PrlIxibC5qDxIrMTU1Y49MXf1HXOw8mvd9XDfxJaBQN8OQZcwMhvHafQfyNnOWHaxy3+zpcPh3f21H/diMJoPMbwnYnmnr6mRm8wK6/OC/z0BAOD9xkGA7c4wtOAT3k4OAfJ4aKPgW/Ly97WkQWPOoIuFo0MU5jR8rP1rngjRDQYRQH4UXoW9XH7ENtD6sUBakQAsygyvPDUGEFG5YRHAEr/6cU742JJIc23EMjaSpteyP5DP5zAi1XftpSIiRK4wQkeyxRoANxld6WHGhBaUZVv8UVxKPlqamo1f8O3ODfARhEYow1fXZsy9zLrAkQzuzRWOwyGyhixbO0Nei39cgJIx7pXwMDFYYV1tbfBIOUnlVLyJzZXHEEKQZ96qjqsNmvmvppuDLardnPz8YCphoF0lMT1LiGEhfjB9DPNF38fXzE0WVlJr8Gkrm1QfzD1PEMtVakNl8TIoNzjgktVDE7vN6cSK3L2FvFMLL2Kc9Qrvs9MF9/cE0LQkHLtReFFT/5GNzj5X/VbQSzcGzv9d6SDPiaje7DEwc9bxIzO5q5woFvazog6W18RfiQ6O/OLVIQqoeZ0QEzBybYKGjUktpwH+n9GAiqzykAds/IABhMKq4y3ZMjNEvHmk38jxWrJxx0+1dETbLWLzJFpkdg2p0tYtEHJvB32F4y2tYr0z4wq1gHX0DVV4fW8/NTSJwCwxO1HWHDT3VRWhEnibr+VBLBcHuYS8sLD+ez7illqmW3MZ/GMMiN0wMXh6+GFBPVs/Ef22vTiPRNo5p3ScIse9Wdwl/O927WPoBKhvx8HiDDuoE6V5zdY5JhFpYTDpDWF7hvlrSQPhYUJviE0UPRJc+Kw60cse4W1wYv8dHr3dfMbOuTAunRkCSujURT48j2k7gjaIcKqheNvoFGeTtGSj/QXA3lJvCMeL2JgO5njxoxMiMSGnOeXjkWQZ1ojRxS9tRJ5Xhx9SRkJxgaSF+IXTOmnHY+Otk2PBrmDMTKN9c6HsM0XLugtxDd87+6iARPjIcciNcCR8hCqrh7HvofkFOmcnSI2bHUNKEpJoaIYmSxs8msvSYAWbn+tv5rlShPKRnX80TWkWEKd0Ig1hFdlZz9l881PkcoLiEhU0BCgenYOYm5845dvbPqebyHhp1LnUam3F9XdKs4ppaB87ubR+YbG0dnGzfO3jWUAn6a1bmx/3zQVu38sbyr4fuOJj3MmWWYOBlyy1YwJvR8VYoP9tfSXy+5PiVSPKHrLgos7U35+G27gQ3kn29tU9fDCtxOjKutob0U+BP01B/213tA3/f3B91/dS/p3H7wJHhZs0bFweBlA8TnvVp0rsD1/5p1dzrKbvb4XNT+1sijq1Px+Hhj9qK5GnT2Fis+Nmr3yrjLQYvZZr4iPwoGuqqGLHqDjrZ3TIYACq7aTHmuOdlj92t+SgYGxN8rKlRFsqgKNPViPNVFzeu1RV/amwq/uhubGxYr4s2NULBN3glL75AmthYmFKSLy4XiDsuiAPw+l8NOrQTtfBurVcGlv698qulNSyMwM+U2sXweMq8nNAY+9zcGCKH09ricogxWVlEvlPcNzc3NNwuPz+csFAXvaMsMjo1nx+1oyQiMq3ETwKNz/Unl6ufjKs5svNhc0pmhCFjcCJ+Q/QYBAsisTp2JiGJ2URELNHJgO+Ufb5Cd26g9/JYT/flk719gnf73J5TNL9wNzeEaChyNIl1wcZi/XCcrdx/z8HvsWV+GMFu05jGpvzbIRvxG7cbxh9+rgaw4fU/sPF1naK01nNafUuzDhHYTj5WiKR+Qhjt3z8pCmtvi+FBc49kjWqd+HBd7GaxgsZ2IG0FfB2NZe4RydA/1/eqNufK25OwsVj0WO83vPr/QyFqgi4TT4vCqZxD0UTNd9DeC9khT3vCZz49mj1+IOWmHA1sYg6hG5uR4DGBDSL2Acaz6+lQYf3oVIiZl7kFnsaibql/n4PLS3e7DLEtgo1onRn4t2/n1189X/xalHaIaxpl7dC9Wyo/B4fuKok8QEIL7e3RQtIBhTnTmK6+YCyP6GDGC+7r6qRAmvKHO1yDTGNgz83CaPCqyvxde8qL6v1MxJ534blcvY684cZee6FxmJFRorHQfo4US0NC6eaGyUS3WBrlVh5P5x6DjcWWf+VbkX9tgDcQjsj/VJKby1+XXZcp3JDdsPoJPXy7jq1ySf76r0VPmi6S5xJ+PJ1R3C4YrGtARD7/rv363qiEUdwQldiUjptUOB/6bSZ7AB1dC9sjDt13kwtLp0ZC176qPg8VjYvsRBOisC+vgHfrc39fROpT9MIo+MruIk+Q7cjj5J14vJc5xtILD4usFy5fKVjLX5UXy8SKYsMVbCwWJyf1zUlt8WmdL7ofYFYJlW5qbrFfv6Zn6a/sAhsuIzUCtbzLqVu6d4Db0yDJXiul0GwLRySdEmahxAzFihppB7z9tr73cK0pOW3hwQOIhfweoz8xB87GBFAg+BucrJ2dCzysqqeZMR15Fw31MCWzLxp9uIapeuaPjI6JNO7m55uekQpvUO6k+IvyGxzQUdLQnJ9ADUWho3TsKdPZtp4H7fqvXXQ/RTpCOkhn75Sz9XiI/zZuQVEOgD52DwBbkotv0ZQSe3PulwaUcZgp3GZsx9mkMjH5SBI8126iJE4qlAjVWQdTgAD9/bL48B9W+x8Mno0hwOi2f+z1+J1OgMKu5INXX49clyZ41AfDCg0Y76+20v4c6GyLh9Vn0UNc3RjfiQia3TTd358OxBEH491qi5Hhi09AKo9+zyez6Gu4OALSDF3pqOoIvaP+cZgSbsWyL7IvxTmyukFIud/63b9V4hxyHUrdxMIA2FEu1itVj6tbu931oV8awEr1IMF/rEE+QK6ndegzs4OD99VeGypLTLapxZkew6VaAyDnhDymG9k2Wmx17FSoUXRBTf6Ooq4GC5lHmG4TiWlLPpYCdG05CCgsx3IcS/1IwUCv+udTG6Gk8z5rQg0WDAla3paq3sLT5Em5LsNiiYsJIIfkM9ar1Z4HF6xevYZ5xfT4IxAWccuR2+3IimNfYl8E3RxP7B97oo/yAWI56qhOeAY/LayQAaOZ+0rocQW7Ewnn833EgY1+Zi3QADOiONBKO9LKfBLKwiA5sruZHVUdaE3OD28oZwihsmB8UIvZWlyBEfWDZXO4bXHaJABqi7cLg3sRSPrCIGOxjZN79b182D7bjxEckYd+4Dgw0HSWbVogH5l3N7mkwU7O4e+ruTRSzo/BIf1wmHgIC2vI+A+aeoku7Ui/yEThwKG+WLKlqzO/Vujo07g/k/z66HE26Hbj4Yl7+awfF5bPIHT4F67wIXLPIwsWS7lUnXhGXUOeE4TfJhan3dYyU/ExRbaippf6sCWszo6urPN7+zMHR3TrkTdyRJk+9n7FAXamK9YsdrbTLckPogF5/WxStOBX9KcaeINkoytiUf9NDN8lIjeqbhLJG50rOtyTkUTDi2F13mHvn9DLM2HzH37NzomzzofNXNawRLvarpSxWGUrtmORJRgM/qR2ec7W4s9sR2q0OHrk+GjJeyVgLTYqxM7aOJFeIWAfYDy/njFKuZx4jprd6dH0sEw7ZDAbXuYw5J/XLvC/QNCdCggkmHcuIT4C7gYHQE8x7fo+vobGQ6+SXStHlDB7H158SVVImf7DD2+158rCuAh0rzjGaBc3ot+/BJ2CNcWS3YI1QRrbTxxonayf7Kiv1su/LObarCCrTByHXT28qhPGYEJlUfrq8Lk7IwfO3z64evr4+bFl93DPeHdavGe45alJ8qtTSebu+J2l+Nlcr6H8K0hKmqkNm7lC/4UfP3vBnBN7gL23gHyU3FuENnedqEpMa3I91skC/qx9EAVtSe9fPvXS0ncajGmMXL/e0TS05dKZDaTjJ0BBMQoIRVOrc/tBL5rz/h4oVX9iZUHK/tuoUTySf1DYsUjkOYNjQWH+JB41yn+bsizoJ1aVcyBP4UVLXIvxzdcexo9em0LP3n1xKWnqysKNG1cXppIu3X1xVsGMi31FNqaRnUw8nF5hucwyc17rL3QHXADmDazbQGHyu6Qf8yCCZ7FULKL7NvU8LWLgIsOHgfgfNz298TAX93t/28S67g35DVLAVseRaIaoAxP0nuDRFRkrNJ+be1T6xiwvvNlbMAZLZ9ofrHcz4lMsspRY+CbJnyng6p2xu0WczRNH0qAvu46Nht6gm3xIXpJDw24oPg0u9mlP3GsRBJ4XCfNi/PPAzX5UxruiNAz62E6QE02VoeHo6qUzQJtT4t05usta23Idbeyw6awGLJX8lpQ8AuOU8UUWuFz1cCPNPN8i969hAdEs4xTn0mRPNDM4UCXJbYKOVkPvArStTQOJP4kJsCxcuXmUAEjwJ+Uz6Pmr2fHH7XJxgVJBSMzhi008z8iu6pKdI1MhWadO6qc7WiKYlvTgkN8rfXF+NfcOzX9eaZtXv7d2+m6QfD4fnYBARAmIEagGp6xRZnllbKWoPi61ZSIo5fb05G0b+fxI3Gsj60j3LMKAd0Y7r6wyriq2Nl3TmSDDyTsCbaTIXwTTs8TEUCTyyCuJfvXmaff+k4XYAEC/JWyrTHPp4L//4jX0cqLnAqkkD9aEV1U3TN/+OFfs3oNLQl1SivfyumGZaJvlqqbUZ7DjYf+BhqrQM/fzWT/PE7XRT+3XtWcsc7R4vDohyadpX98ELY0bISn9q55Hh/RJh4Z1G1DXc0RFglaxOO2WNnq7Dxo5hHqw2GdRTNHzSc93XzS9a8NkWzmUVyo9m35L8ged1AA2/DoZNv4ahoWdDKCZCpnuu/s39iymqMeoCI1vLU9cbzwo9X3c4iKB01EGgzY6eHgNXKK/saVUJs8NKih9hMzKgzaKdhaNiNXE1AiqfM+6TNMCE13k5skCbVfnLaA8T+PwwiVn6pcm5zJcJ6uS0hrdTnQygT/rpDLSPLR5RHtjtkdmCCzN/bnGm7lv3ycSJr1MYpypxvHZuHDKHp4ycE4Jjw6ObuWQ0BwaMVlZRvXr06dvrs6Xeh6IMvZDeqdqDWWBlw324CCV+Q1NyfMpGB9To9gAmD0ykKB5llhHirRDVNoiF0ybysorIbp0c2GGm6GRNH5fycg47tbLK/ek+pwK+zN/HjPu77fTUojD6K0QmwNqnEThFG/vdEwUxgw+Qxoi6rg7Zof5uitx/AOkljE4vOhH6bcDE1FvOeKdu53Cwx3uysREYtDvCaLAURJGy3lg/qB7w2ej58G2M21p0lRpxxm5OPBA3GeIXVycB5VVFjxdNObF9mDmHw+8X0JFcZ24+xfSQRj4xSDwVNXE0tdvL7qCNsouBkY5uMdXmwWt0/EUh8zYAWd/Z1/BwA4U04QQXrToOpJyaqC4rr483KY6IG1IkcIu0rvGIM+IvzKC5a7psl9iTjw0p1BoOZYTWXiNN2ZH8URWCRs1Kfdr+AERMehy/4oRD0Vz4IpQreU4BeFbkMbbWCh72bij1J5gj36pfDHeDmSHVshAh4KErlDebYugLF3OBV1jKjxnmoHV7NBb4ynFSYVJSjIvt/8Xt3iodgiN3Xp+2Ayuglc5fS4U5BGsKArmqcViVVgsDt88TOXobcHto/1Qu+RIfiY/MwKKTO48ellw+ehlKB1K1V/SEb4U6S9samssi7ZZbUHXvm690/v+Cvzu/Uvwd713X7bWaBhLX7yYqhdBoehFUMV4vK+lYzEQl72yqWquaXdXdfXurqa5qrqm0ou6zvif6f92g/99wZ1DyiXOy/UMGgfZYbU58sGSfwdS/wKM/3wX/D9qtfLfv/8SObGmrdcQUtUhAzT4d1gLqwvWfQZ5nuzVaV09AihyEzbPIxzSAZnW9NtGfwG1rpeT/AtOP1bOXxfk4JX/cCqH+ls5/TtQ+BcQrJ7vMutaPg8ZreQVbqMJUvuU/3cb5aOuNNsYuM2rd1LtmehweVXeV5jPQfg78r/fp/wfJ7yR1sSadvUCxAD42/LXv2P++Bfmf8MBQp6wdUJRId8Ecx/c6pHf5mRKhBYkJyl5Y6dNicuum9iSt7M2f2gObs2CuR39CjcU+rJn6vM/IC8c6r6J3qVDtwRMyAmSPbb8pgr+HfPLvzDfDIeCSF5AbmROnpDMHkAc2wY6Xgq7kjBnVo9WsgnWaRCeNylWFV1X1dN9T/ptR1Hyt5WMf8cC/AuzFXIoZPV+Wx6D6sn0X2j915fcXrxxGfGk60EDl6G8LPwX3BXeLgNw3UMexZ5wbehvHDeTaXqJyy/cP5uD5byyB+dnDaBvZPKuv/ylZlDxh20Hs+RHLN/3C39an7c5x8yyAOqdIJRovdwcJFpkfMRc8QoCKk8cYDeDmQINvmYpMA+0fB0YIinZNRLoV0BEesW+SLCfkZmLIJYf6+N7mM4/e3J7jwDSO/cpwDGGSEK2UAvjvvMr3TJvugvMm9F1/Vtv/5VwsfxyawSnKo5cl0UA6kPgmX7VnnBO+TscYWP5hfl8EUOUyrnODv3Zvb7qczuxLyaRXPEJPdeP7eD8Yd62rWIWB6PHzNtuT2jK77LUS47YrG+CzLGD+5QMhKbESEJ2j2qB5JYlP90TvjQ+b0PUNrWkiTMAGdRjpF1gxnkCjW+B9bUMGGxT6f0dzD0cnOEQXU8B/vFZlCIn2IOmoqBs5njmD3e/ftl++zt0JGAp66lIr9kPQGLuXvnfrcg95kOjiInae78kB7JZqXFoHU8mBlCi7QLb4W9ufv6iNH+6+yr+P/781j+fNbV/aeHFIXQTHJohhCuWmOkblRCynBdY+03vY0Q3FhGPeeg7GGWU3rB+fwdnEhamGIRb+BVmXEA+ZH9cuCwAHvGm0Ok09IlthJq4jtb4vR1UEyaQRK4UBeYJukeDekPNY4wOkrwMkHZBvRdAh84dnZI/bmMb2+jmkmCvwUI40ROhOdLQT2TzBrOJ/L1xNAp8j9omjTG6kWPFH+6g0ScqIlgTXkpngwZDAY5Ibj3zaWIzH8DocUcUHOiXxtK0IhGe0Tstu6hWzPCTsuNqjyoHNtt+EM+UMqnshrtrij/AB53NkjgKPWrFbZPuG5ebCLjRe4WVW2ZKbnFCbYMHQXiybjRiPNKX8YJUnlXzyzwdwWTUABQTHlyq+Gm2Nu6aDGyhUMtsUTptJnAmvx44lZImorBFu1Vgcb1E8krQdj0xCI0LxGY+9Qd0XBXZkXQxtFlihBEE8ebrBmal5sMVp1WpIXU97DER1b1YfJYQO4U5TIdWY8xxmtLsThIe5n0F/gkT//FZ0YrA3FdkMrIqBNrb3h47sf1b4fMSm8g9at7y1wRvdafADoRcMwj+OIFu8ZMILAAeRvlXQQukR7rfNYjOph73Oaqp3pJGNrFNpDsQlHGJO/6D4A7tllbsvNTd5QzgnD63JyQqcYo8FdTNVkUcEuawuhRl9qwd5PRqLDVkc0RmSbbl8cijqKSyjJj0AMYjroiD4SuooK6IsAVmDwPIVTLe19yz58CWEuCArs2i0HdVG46fYUdSuzIBwEfhKTkwwmdYM5bagzHM2RFm95/3mUzTgwZbtIa1u0ssyb1WJkGi3LORPiAc2yhrJ7E5mQQ6tTC/F4ncIhosoxBjm5mdFFKrt5l74/SHRIfOKoixvCgz2qxrKupWUarfGUcNkDRphgt3I8nmMNIYUohOwKjuzNraidApKDTzNsKYOsEkuY9Bm/Ti0HmXgOVDk6ZMs+CeXQzsCH3FuQ25T6q6QpLzLwuBrh+xeRL7rp336XANC7sB7eeXrdnZa34X+Nv780FpdLjzVUDiAgqic8G3kqXyQ2SxoiGXjARYpR95JKr5Q/SkY1dvXnUKbKVm8RIZJQcNojTRD2GalcA+rxEpE5ctwARbc6d+zJqBzap/qPbTtvXMaBQV0k7+HC49/Xn78+PR5bzbLMZ5W/EU3jv+hHsJOkYKmt7s6iQKfU9ybvspUdkuEGZITefnx0epqo/741I+dOdxgEG/OR/7XGibdANLrc08+dX7UyTIWQb1Ir6EAP0LArwoAAqIt7z3+g+rn+pMgLYl5c3tXxOPVh2niAIPHqIUJVtMiDlVqcpX7zT0J1ItaQ1Bm2GEfYxAiEe2SYsEGN4ROs4rgWNM/p/QceLPyz0k+H9FibXpK4XnzZuUD7/ngSwF79sQ+UdY/QlUffb3xfn2d1gqeGmLt4M2S5tXY6c0qqb+Se2Iiq8pBfBXr3vvd3KkIc3To0k1H6O6ruWfwwD28CLQ5Mnlw/XV4Xq16Bpe5qnvYstX/Bn3Y7xAvo9qGWY4CV4CmsEVLYmwPJ087HSY4+rAR+M/IiSH+oaXsDt3I3Ly+U0hT+XsfTxyClrowGJxgqfqyqJZQ0wGDwJ1NSaKDcyBPqwRAAmN3YagAx7bvR100sfSovCd+ONHnk2o/0B1MsYKghgyowtyp/FQXpw98Nju8SKlj+VF3zuB4oKbtCrJGwOhPh0F9shMF5R+nOytrIjCRHghAoJlQK94rSORc1g55yQGvHT1FsyrfX1itqVgRUIl0LH7G6u8DlnXeYGDzbgp8e42Y7CQYAy+Oc0Q9eOUHZdG3k2PR6UIDfHWekiUn+D5ne4k3I6FMZLY33zSB25yuwIQoSUWYR9jFk8KwuJtgDu0KSvuRpI/ppEpVJnS9THLZBm8JRKTAkF+oI2uJVRIp8USGIYslWr9uNlm1sZ5juspGSl+pUBJWgsiEs+gVNPrhiT1tsNRpv+xu+TUUEDNFvk9eiVdmpIrauNNXUFY0JYESkZZ0ozoanw5ggB9PIKExRAQ3vEc33gb59j5wPr6+xjHvBkY7tf5m8qlAk1onv12vRr7CuoeBZS7XHOFajhG9Df9Zytuiht2splw2fHAFZiy2dQKr22BVwFMsGWCSH2cwCSL5uI75ylnSZu2Y38joFI5Ccu5qV6qkxUpfHSy9GyRBd4ncMelVeDchswmwiU0jlZGT8bVcosMabXVNtmSr4wlaCAzO0nOcjrJJBDbuT6IBxTUkEkh3QpsMkvB8Lc6UvCq0tyZerGpEtkND6JcyH2FRosxj/AL0wlpox5vNSserV0/uG0ykZygo3+3SP5vvwK9tz6sJ6yfa1OBBrh5S9LhtgJ0HJx0RRtbwojtkBpq9mG85X3HflQY0ksEmAT8gk47mpTuplfDQUq7tXbWWg5kE6ODExOvAvxvjdoP3Yi1SXcOYn8P9WTuMh6ztjrp1jJLA5+SzzedYGr3e90xIrSCzSkMDG3sUI91GR4sglB9ZoO5t4e1SUTovfR4WyexQD8/rtfNmuVxlVRWjCOMjT0hKGFw0mtXTmnVS3K/OCQEUr/j67IdxT9kNucZWQjgvKliGepTtdOz2iGsjWVKj7ebbg6217amDrZh9Ca+1mJOjMdznXe5vcq6vFtxihlbz+Eo+X5jjkbj1To82uANp9Xl+yHUkWOxZzTC5XQsgGOesjimPqSH9GfxVwrHoyHFXeBA0M+O27pkxX8jUxB4DrFNAxQFvDf/EmfpwXPGtGlnshN+haup7/w/C1pvRdNsAfB1TJRxQCeC6JEedwPwY+xQVfPy5PBLBFk4w41m+pHsYgXmxZZkxpwIFKatWWdTgy8ON0VjbrqLrbOfBxmyk+CfiRWZtCw2ME97hjOdV1DiMwJZInvZ2nJuXHMfpV+ls+s3nEbWyHHlxHTtk3FNDKItKe2jxk2szjiSLJ62wlmqckJUCeGbNtpeyrQ2w1gIvlKK+ZBCu46lUepQ1VW1nTVj3jzfeh91bw6rGKIR0iyPhDG48NQcFZ5h9vcbdWjRKoVLzSFGOIg/ctdKAovPBf5TcTMgquqciDAHDUGLCdo6KoKUE7zA93q6phRNsAiIoaldisSwfUm8EpdQZt2nnXkaEowXDdtcoLvrfCiGOPJd005z8xnmbnjvYRgtrh6UwILiKbu5qFoN+nXjFnVrTPFYyv7EMKY8kDzv2RaDhhVdcfu7SZPdXsit2cIGYJcGANzbLDJ6qW930lEjJ4UGduF0iNfaILyqP2ceNxM1vlbqmvaZ7u3zq2lfGXE8rGtqwRm0XSgp0wwE6WA/gIuZ6bJAekX3mQHwmvVNlUuQTEOnk/ZpOtAus4XsPDePOXbROFEIg60489SRUuW4ZT0zC2Bal8PZsuO1MTmziZv2NAx0gL2mXTZhLZX2PmoXZAHOIc8TX4D9f5vbtO5oSSuOFX+qFvI07YHjNd33hrBP3K/P+i5TdJMcN3MTvDdhoA2aiSR652pMN5jd2KIiH7u1V16dMx6j1soTSUIwDZGuzQyM1PeZ6uqgUbxpHKTBmbP7uU4L2DqhIZjE1XpCjB6jj+EL3B+G694Vbl14NbDjluPZVEt46bBa1ss4dLDuM3AL3YFFxlIADVUlOAGODM+lfOd1W101M16XgDVmULTCIVv52M1LpYlyAAUbpQC312DR1VLXcHlO+DCDm/+4h2y9Su5an06dOGqFjujnsei6SbQHythuNKHJWFHR7g9WF47HXs4rnlg194X2QhYip2sqb4CYqyA8XCrwwFBp3FTrDE3rTlp1ONK+pz2I1JE8H6hthdHc6zkZmv72YjiOx66peJHZpAuwrbkSx7kjikFTBVauLEVMZ4czak2HbresTP80mn8MWrQ7kXbGliE7v4LP44CbzfOLJZI/qP+Qn4QX6NcvlYVrXaTHhfxpz6oyc2UiXXT/sNdP1wo8bJuBhJIp1f2CfNoxjW8ymqQZGnGUPDVZmV3n3S4/C6cTj/lMnYZdJQMbEJrRxwcH3dBKs6MWVvKAxpRS29oqUWPIjMKLIToaktzJUU75luPid0EJMAwIGEkuZ3TZ3rSZt+LLet1wAp2XH89gGOw3OFSC7L3M10rdyo9nMhD8DQ8DAdThDcpGEBOMZiMZNF6a5RigMlTd7amFIRXmEh+a6NY6AnOEZKa1IIoELekVhYFt2D6mYotmQXIImY821i/4liSiWCyvKvNigx9pf75khUNEBv54s7ytbl1TLNii3zfrHiqFU/j1PnHO3q/dgfMfgEXM4fvcC4Pu6435c1W8FY7TcGD9+lVGKnoyy3yAUiZmPw7AaH20vjYWBlU1vkLWRpJhhSqRg4qG1+cCsBhvkMsjVaBOBFDvRtSnw255bH9E0LUpBjgCHgPUBKBuZeRhaZ0851n0tO035hmaZhtOG3Ia+A1lUUkNRrvigwQK0T9/CciLfSV2CYl3AfrodW4XmbEjbgagLnnBzKwmgdqR/wEwn94EtUowk4hlsG1kJZX2OacaoIw7IijMBhGS5z67hcFwBeV/BEPgjKnSxslI30tTX1HikRl2s+WjQIlcYFkoAVV43GglAWOSAz8DnL5/qH5KICpXds6TTCxMiXZI0ttRk2j8EiJxWkacLnQ30UJC6sjxo31QntRuYVJKifLtWLyoHMuCxCK0o7Hb+BQnD9kLzFUVSr3cEqCHyYhSE6KQ/Lz/jtCVs7FRpDLkWJH8fo6mevM2VmTUTMSTVSXn74/Ox+rQo/udO2JbR1Nsg3hI+ZlXYh0PpuoXnyW9nCOqWZ3n1cY47+UcU4q/2R61JqXu4SAq/P8PR+QNfADBbWSlxJ1Ccme+vXInqzPMK5rEgUsriGfSeJ+tg4w6N1jgJxDF1WM/dPZvb72tnyVjJqPXCURpSK6oyYERARDR0zDFQlRk2mT8O2+MJ+pTooPtFuamk5DTJuCJKI0o/ex9SLWo42dHQ2nsUf8zjRi7JdAII8HRFZRfLv+2ulpmTQfruNOxQODNTSGO3N28VFrANYRTAYlWdJXU1V5WH7AxUd3AgKwFjoJp1Mu9321ltxrLYPJwaUUpdT5ArRPrR0KZj4JDKmJL/eZ9iY4r7JVOi33Vn+3gUQqaO6DUjCSYGJwKMsUeOGmuJqyPhsrfvIfG7vUiEVwH0eX8EbUwT+04XnyZIzoc4IxkKKNsW+Iv9vNFtE81/GLXzo1cnbD7jBggKb5S/uHArc2l0DHwIaXm25w7XZZGQTQJWfErnB/8vFOa7v2ZxBUFkSWWeThu2Siabih/ZU7tum2smUvEZd+NhWXExOSDfgnHvc21DJkhW2uZsCp7b321YkppG2oVqf0S9HWP2hB2+4R8qt71tqia1zlRauersgEksMA4b+VA3aCib9L+XRj2MSAPbTbKz+jNYmMgTK+GEwAIS7tt5pEBHs+uDwt/qfEHWBUYg7dOpnn34s7kbYL/9KI4bGDAG0uR5jQL1J1uFTgEMN42IVheTUcGPHI7oIW/20E+/36GtW9RN2rIQEeKGXPiVvgaoLC87fc+kVuRiuGMb+6M5iNO5tm2RdzMW82/rBD13NTkVmCp5tKdBtnrPmmY8WFF27KKdGVvwuH7OAiRdMsWWJCHvZOLbUTQtXBTHt0TdzlevpfJ5+xmZiXfz5DZQUVqx6lDgQfnb77gNQHwP4CKqtzzBl/XdCqKKeczvhGm6zO1akeJGdK2GAPsSdqBkHmtdaxtVcy8ATAaTIhOt698khCfVqBrVRvUnqaZuD3AHjU1xaeX4Oet+2ve5us3reE7ND7DvcqcpJNwB2pq5ODt4ks4IQWkMvv3IgIAnf43tGlO/rMe/9+yyiEG4Kdr9nMA+Nm+/QO/W8/FZ0fOnMDEAAK/Glv/YckWz//Tj0c+nzzX6D8aZB0mT9K/4b8ZrvnKbO15DfoOC/+qhP0RW38hq5Spj219+ilLlcQ0s89bP7YZ69PALWBQxLw+JqxvmXW882zfl/evwhcsmy1DEgAk9rRgIf93yqdxsRMiG0vdJ5l7SkqIaIXiKzy2MT69hpVNJI9rp+lVEU9RVdrCcrFORzND2xNhyYSBEVxcw0HNW31h6G4h8y2L6mrlUK+pfHKOuSYE1CRtVTOL5sG5JbNmxPVHJrZgudLCydyLdD8RheYZ+SQzLyRlmp3OVlz5W6yg3hDTv2x01Rfd02xGW1xTHRZUs/x6TFDeyYBVn322TJepN+7eFFu5LbZRSaOEqQpYs/ShCP2wo83DJhTcr6i0I987JSTHM6ypiSmFPZzEjEsJ8RvOg0XiwIjtT1KrSvog73+smiSM3gASqRU1eCq6aCjDDqshDEMj8+ar7DzDDQ5wsUVwxHM586PZ8hZ0v/7Anl8LVJPgJgudaopYHGLDMcr2O5nm1zIuom6K7t/svSmxKhiB4sOMaGG9xYSh7Q0dJtQQr4zxhGd7MDTLzMMBjRTdlgxFCw452PungGLRu9YhR6bIzEvKFXbWdV1jWJ0nt9Nj2loVO9Er/0zXX4S1RERfkNTjEvsUQ54O3izhMrAOhH0RdBQmwWl13xVeePJ22vzH1puyazejXZoZmNRUfsVlOs3n+p7I2iEwndB/YjZnwiuHhuYjjmRC/681nLpicI9lMO5OLSkTbus/MsMZQrbe0y1c8XHusHKjSfUdJoqowslPkbQ7396krUwW3ErfyrmGVoQ6EWDodDILvOnS28AhcMjFoiEGfEiZcA+R+HEPQ+HVPSyd3fdwvC26RyBbI85P3YlcUXfAUwzsXfsaIFVc8QBd9Vegr/MNEJss0HPgfSrPMz1xQ9nqserN+8jiGE10l2eQlXdm3kIT/UtRk69hEEvfxxKl0VTkuWYxyILnV19vA31ag5OxksVco4gqvWicprz3nA9ps0zTlFMqVfMMme5rWMcibxTYsNCxpEYzHbo7muGNNpJ9FE5F1zdh7UXkj0cMeC070HSeAl1ykC6Vd7WLXjnepxfm6am73Ap03PVxFUPZuVCsTTYC4/OTO92Q69s514AUscQhxFxXXNLFDl3tFCpMN+G0urvsqms+L8JgyYmvR4AbbrplSeA3nstgt9vuyHPPPLtsmJzqu2T3PZDvoW2B706Tr9JlKtDDrIBISCL0tEYhccTozaozuWC9ZPlPRx10YmbxyZS2/u/Xi0gw0eNI4UcZGclJgRlOyDHB7EBJ5XDUCD2LSzSiya6v/gboxyda0bbNPntpfIkHznq1oxtY9JzmGXj0neERgyAcV8c0GTGMUYwF2srppFPqxiRIKvUMDMpgQ2LqkUHqB62BhgJs0EhRwmMeTLCx8DPRitGYbyyDNxSviWFGGGmP4dSxirU/+Et6K62y1ihNTSUlI1IrtrFzLvEhUnBoJsg6Ahfsd8BBh5wn0dx0z5OoRRxM5s87pDjyilPIXELBmqRlnP3gHmpc/E8WT2KNu5ncQotHPLUy2ljjjGGLl9bx1kZb7Xxz1CLtucYnvvEr2v3kAx9IpytKn5VgrbPqVLU7C6WZ4mg/fM8+wuRAugdEdK7ESkSF4tasGMrpkkadXoj4PNIGWwZZZTQkKXpYMutnA+98iMqgyRA1TcgWN54sIzRzUJxka9AnyETPznQMC4ttUONo5AEI/3npDWd8S+1x0ZIYQ2HIW53fIRf76FgFYUcnHK1kiJUtGp9SelGgP9vTEOozOLf7hbVc8x2QdA+Sxz87NYkvSI0UUZe0JH2qBR3anigSaIbF8O+H5cYkd3xDfFEQX68XTN1AZWwJvLNhOqSZkiZRShEHpyr4Sy9q0r4UqRNeNEpQwKepjZDQlBmt5stBc2PBVXpxKfZZ+S1/pNbGaPaMYfVZmfHUHLyVwrJmElzcMnUZjMakT2et9zGKM5+aLBoISjVkwZkvTk2Kv46bbRBOjLg0bSpaKWJbZTQBpdqV24YLoO5ncPl+rU6QzOyHHqf/VS/2nBMQ3vnT7YHs2yB4ApHSRe+owtz9B/mwmmYDPkESrWXYFlS0SRwWZTy8q5Hf+ctucKUkIyGESRqI68GwvBGLfhaxcNePhlDFfbnHLRWtRNJN0mYmRMC+AHd9KHxPe8w5KypGw7ypK0vH11fAVYW9BZTztBmYMhggReRnhL/llK/9qOxa4ccFoglk3hUA) format('woff2')");
      f.load().then(function (x) { document.fonts.add(x); if (UI) { UI.P.q.forEach(function (v) { v.k = null; }); UI.P.adatta(); } }).catch(function () {});
    } catch (e) {}
  }

  // ---------- scrivere ----------
  function ricevoMeme(ui, m) {
    var era = ui.mio, stesso = era && era.g === m.g && era.p === m.p && era.rec && m.rec && era.rec[0] === m.rec[0];
    var b = leggi(MEM_BOZZA, null), chiave = (ui.vm && ui.vm.codice) + "|" + m.p + "|" + m.g + "|" + (m.rec && m.rec[0]);
    var testi = stesso ? era.testi : (b && b.k === chiave ? b.testi : (m.testi || []).slice());
    ui.mio = { g: m.g, p: m.p, rec: m.rec, cambi: m.cambi, fin: m.fin, testi: testi || [], fatto: stesso ? era.fatto && m.fatto : !!m.fatto, k: chiave };
    if (!stesso) { ui.sel = 0; ui.campo.readOnly = false; ui.campo.value = ui.mio.testi[0] || ""; if (!vuoti(ui.mio.testi) && !m.testi.length) mandaBozza(ui); }
    if (ui.vm) aggiorna(ui, ui.vm, ui.cb);
  }
  function salvaBozza(ui) { if (ui.mio) scrivi(MEM_BOZZA, { k: ui.mio.k, testi: ui.mio.testi }); }
  function mandaBozza(ui, subito) {
    clearTimeout(ui.bozzaTo);
    var fn = function () { if (ui.mio) ui.cb.manda({ t: "testo", g: ui.mio.g, testi: ui.mio.testi, fatto: !!ui.mio.fatto }); };
    if (subito) fn(); else ui.bozzaTo = setTimeout(fn, 900);
  }
  function consegna(ui, si) {
    if (!ui.mio) return;
    if (si && vuoti(ui.mio.testi)) { ui.campo.focus(); ui.campo.classList.remove("scuoti"); void ui.campo.offsetWidth; ui.campo.classList.add("scuoti"); return; }
    ui.mio.fatto = !!si; if (si) try { ui.campo.blur(); } catch (e) {}
    mandaBozza(ui, true); if (ui.vm) aggiorna(ui, ui.vm, ui.cb);
  }
  function scegliRiquadro(ui) {
    if (!ui.mio) return;
    ui.campo.value = ui.mio.testi[ui.sel] || "";
    anteprima(ui);
    try { ui.campo.focus({ preventScroll: true }); var n = ui.campo.value.length; ui.campo.setSelectionRange(n, n); } catch (e) {}
  }
  function anteprima(ui) {
    if (!ui.mio) return;
    ui.P.metti(ui.mio.rec, ui.mio.testi, { modifica: !ui.mio.fatto, sel: ui.sel });
    var n = riquadri(ui.mio.rec).length;
    while (ui.chips.children.length > n) ui.chips.removeChild(ui.chips.lastChild);
    for (var i = 0; i < n; i++) {
      var c = ui.chips.children[i];
      if (!c) { c = bottone(ui.t, "me-chip", String(i + 1), (function (k) { return function () { ui.sel = k; scegliRiquadro(ui); }; })(i)); ui.chips.appendChild(c); }
      c.classList.toggle("on", i === ui.sel); c.classList.toggle("pieno", !!String(ui.mio.testi[i] || "").trim());
    }
    mostraSe(ui.chips, n > 1);
    ui.campo.placeholder = n > 1 ? "Riquadro " + (ui.sel + 1) + " di " + n + "…" : "Scrivi qui…";
  }
  function chiaveVoto(vm) { return vm.partita + "|" + vm.giro + "|" + vm.voto.k + "|" + (vm.rip || 0); }
  function vota(ui, v) {
    var vm = ui.vm; if (!vm || vm.stato !== "vota" || !vm.voto) return;
    var k = chiaveVoto(vm);
    if (ui.votato && ui.votato.k === k) return;
    if (ui.zeroVoto === k) return;   // (il tempo è finito: il voto non arriverebbe in tempo)
    ui.votato = { k: k, v: v };
    ui.cb.manda({ t: "voto", g: vm.giro, k: vm.voto.k, v: v });
    aggiorna(ui, vm, ui.cb);
  }

  // il conto del tempo nella barra (scende da solo tra una foto e l'altra)
  function tempo(ui) {
    var vm = ui.vm; if (!vm) return;
    if (!vm.resta || !(vm.stato === "scrivi" || vm.stato === "vota")) { tx(ui.tempo, ""); ui.tempo.className = "me-tempo"; return; }
    // (i secondi della foto sono arrotondati per eccesso e arrivano col ritardo della rete: si tiene la fine più vicina,
    //  mezzo secondo prima; così un tocco all'ultimo secondo arriva ancora in tempo)
    var kt = vm.partita + "|" + vm.giro + "|" + vm.stato + "|" + (vm.voto ? vm.voto.k : "") + "|" + (vm.rip || 0), stima = Date.now() + vm.resta * 1000 - 500;
    if (ui.kTempo !== kt) { ui.kTempo = kt; ui.fineTempo = stima; ui.restaVisto = vm.resta; }
    else if (vm.resta !== ui.restaVisto) { ui.restaVisto = vm.resta; if (stima < ui.fineTempo || vm.stato === "scrivi" && stima > ui.fineTempo + 3000) ui.fineTempo = stima; }
    var s = Math.max(0, Math.ceil((ui.fineTempo - Date.now()) / 1000));
    if (vm.stato === "vota" && vm.voto && s === 0 && ui.zeroVoto !== chiaveVoto(vm)) { ui.zeroVoto = chiaveVoto(vm); setTimeout(function () { if (ui.vm) aggiorna(ui, ui.vm, ui.cb); }, 0); }
    if (vm.stato === "scrivi" && s > 0 && ui.mio && ui.mio.zero) { ui.mio.zero = 0; ui.campo.readOnly = false; }   // (il tempo è stato allungato: si scrive di nuovo)
    if (vm.stato === "scrivi" && s === 0 && ui.mio && ui.mio.g === vm.giro && !ui.mio.zero) { ui.mio.zero = 1; ui.campo.readOnly = true; if (!ui.mio.fatto) mandaBozza(ui, true); }
    tx(ui.tempo, "⏱ " + s);
    ui.tempo.className = "me-tempo" + (s <= 10 ? " poco" : "");
    // a un secondo dalla fine il mio testo parte comunque (anche senza «Fatto»)
    if (vm.stato === "scrivi" && s <= 1 && ui.mio && !ui.mio.mandatoFine && !ui.mio.fatto && ui.mio.g === vm.giro) { ui.mio.mandatoFine = 1; mandaBozza(ui, true); }
  }

  function aggiorna(ui, vm, cb) {
    var el = ui.t.el, io = null; vm.players.forEach(function (p) { if (p.id === cb.myId) io = p; });
    var guardo = !io || io.via, aspetto = (vm.prossimi || []).some(function (p) { return p.id === cb.myId; });
    var st = vm.stato, R = ui.root;
    R.className = "me-scena st-" + st + (ui.targa ? " me-con-targa" : "") + (R.classList.contains("scrive") ? " scrive" : "") + (vm.fin ? " fin" : "");
    tx(ui.giro, (aspetto ? "✋ Entri al prossimo round · " : guardo ? "👀 Guardi · " : "") + (vm.fin ? "🔥 Ultimo round" : "Round " + vm.giro + " di " + vm.giri));
    tempo(ui);
    var titolo = "", nota = "", mioMeme = null;
    mostraSe(ui.scrivi, false); mostraSe(ui.vota, false); mostraSe(ui.riv, false);
    if (st === "scrivi") {
      if (!guardo && ui.mio && ui.mio.g === vm.giro && ui.mio.p === vm.partita) {
        mostraSe(ui.scrivi, true);
        var fatto = !!ui.mio.fatto;
        titolo = vm.fin ? "🔥 Stesso meme per tutti · punti doppi!" : fatto ? "✅ Consegnato!" : "✍️ Scrivi il tuo meme";
        anteprima(ui);
        mostraSe(ui.cambia, !vm.fin && !ui.mio.cambi && !fatto);
        mostraSe(ui.chips.parentNode, !fatto);
        mostraSe(ui.campo.parentNode, !fatto);
        mostraSe(ui.modifica.parentNode, fatto);
        var manca = vm.players.filter(function (p) { return !p.via && !p.fatto && p.id !== cb.myId; }).map(function (p) { return p.nome; });
        tx(ui.aspetta, manca.length ? "⏳ Scrivono: " + manca.join(", ") : "🎉 Tutti pronti!");
      } else {
        ui.P.metti(null);
        var n = vm.players.filter(function (p) { return !p.via; }).length, f = vm.players.filter(function (p) { return !p.via && p.fatto; }).length;
        titolo = "✍️ Stanno scrivendo i loro meme…"; nota = f + " di " + n + " hanno finito";
        if (!guardo && !ui.mio) nota = "Arriva il tuo meme…";
      }
    } else if (st === "vota" && vm.voto) {
      var mio = ui.mioVoto === vm.partita + "|" + vm.giro + "|" + vm.voto.k;
      ui.P.metti(vm.voto.rec, vm.voto.testi, {});
      titolo = "Meme " + (vm.voto.k + 1) + " di " + vm.voto.n + (vm.fin ? " · 🔥 punti doppi" : "");
      var votato = ui.votato && ui.votato.k === chiaveVoto(vm), chiuso = ui.zeroVoto === chiaveVoto(vm);
      if (!guardo) {
        mostraSe(ui.vota, true);
        ui.vb.forEach(function (b, i) { var v = [2, 1, 0][i]; b.disabled = !!votato || mio || chiuso; b.classList.toggle("scelto", !mio && !!votato && ui.votato.v === v); b.classList.toggle("spento", mio || (chiuso && !votato) || (!!votato && ui.votato.v !== v)); });
        if (mio) nota = "🤫 È il tuo: fai finta di niente!";
        else
        nota = votato ? "🗳️ Voti arrivati: " + vm.voto.hanno : chiuso ? "⏱ Tempo scaduto" : "Quanto fa ridere?";
      } else nota = "🗳️ Voti arrivati: " + vm.voto.hanno;
    } else if (st === "rivela" && vm.riv) {
      mostraSe(ui.riv, true);
      rivelazione(ui, vm, cb);
      titolo = ui.rivTitolo || "";
    } else if (st === "vuoto") {
      ui.P.metti(null); titolo = "😅 Nessuno ha scritto niente!"; nota = "Si passa al round dopo…";
    } else if (st === "ripresa") {
      titolo = "🔁 Si riprende…"; nota = "Aspettiamo che rientrino tutti";
    }
    tx(ui.titolo, titolo); tx(ui.nota, nota);
    // i punti di tutti (solo nella rivelazione, sotto)
    var pt = st === "rivela" && vm.riv && vm.riv.finito;
    mostraSe(ui.punti, pt);
    if (pt) {
      var ord = vm.players.slice().sort(function (a, b) { return b.punti - a.punti; }), k = ord.map(function (p) { return p.id + p.punti + (p.via ? "v" : ""); }).join(",");
      if (ui.kPunti !== k) {
        ui.kPunti = k; while (ui.punti.firstChild) ui.punti.removeChild(ui.punti.firstChild);
        ord.forEach(function (p) { ui.punti.appendChild(el("span", { class: "me-pchip" + (p.id === cb.myId ? " io" : "") + (p.via ? " via" : ""), text: (p.forse ? "📶 " : "") + (p.id === cb.myId ? "Tu" : p.nome) + " " + fmtN(p.punti) })); });
      }
    }
    // tra un round e l'altro: l'host ha «Prossimo round ▶» col conto, gli altri leggono il conto
    var ka = pt ? "me|" + vm.partita + "|" + vm.giro + "|" + (vm.rip || 0) : null;
    if (ka !== ui.kAvanti) {
      ui.kAvanti = ka;
      while (ui.avanti.firstChild) ui.avanti.removeChild(ui.avanti.firstChild);
      if (ka && cb.sonoHost) {
        var b = ui.t.el("button", { class: "btn btn-primario me-vai", text: vm.giro >= vm.giri ? "Classifica 🏆" : "Prossimo round ▶", onclick: cb.onAvanti });
        ui.avanti.appendChild(b); ui.t.contoAvanti(b, vm.resta || AVANTI_S, cb.onAvanti, ka);
      } else if (ka) {
        var p2 = ui.t.el("p", { class: "me-conto" }); ui.avanti.appendChild(p2); ui.t.contoAvanti(p2, vm.resta || AVANTI_S, null, ka);
      }
    }
    mostraSe(ui.avanti, !!ka);
    // chi guarda: le faccine
    if (guardo && !ui.targa && !ui.faccine && st !== "scrivi") { ui.faccine = ui.t.faccine(); if (ui.faccine) R.appendChild(ui.faccine); }
    if (ui.faccine) mostraSe(ui.faccine, guardo);
    mostraSe(ui.cred, !!ui.P.rec && ui.P.el.style.visibility !== "hidden");
  }

  // ---------- la rivelazione ----------
  function rivelazione(ui, vm, cb) {
    var RV = vm.riv, L = RV.lista, el = ui.t.el, passo = Math.min(RV.passo, RV.tot - 1);
    var k = vm.partita + "|" + vm.giro + "|" + passo + "|" + (RV.finito ? 1 : 0);
    if (ui.kRiv === k) return; var prima = ui.kRiv; ui.kRiv = k;
    var i = RV.podio + Math.floor(passo / 2), r = L[i], rullo = passo % 2 === 0;
    var pos = 1 + L.filter(function (x) { return x.pt > r.pt; }).length;   // (a pari punti, stesso posto)
    var primo = i === L.length - 1;
    // quelli sotto il podio: tutti insieme in piccolo
    while (ui.altri.firstChild) ui.altri.removeChild(ui.altri.firstChild);
    L.slice(0, RV.podio).forEach(function (x) { ui.altri.appendChild(el("span", { class: "me-pchip" + (x.id === cb.myId ? " io" : ""), text: (x.id === cb.myId ? "Tu" : x.nome) + " +" + fmtN(x.pt) })); });
    ui.altri.style.visibility = rullo ? "hidden" : "";   // (il posto resta: il meme non salta)
    mostraSe(ui.altri, RV.podio > 0 && !RV.finito);   // (a rivelazione finita ci sono i totali di tutti)
    ui.P.metti(r.rec, r.testi, {});
    ui.rivTitolo = (pos === 1 ? "🏆 1° posto" : pos === 2 ? "🥈 2° posto" : pos === 3 ? "🥉 3° posto" : pos + "° posto") + (vm.fin ? " · 🔥 punti doppi" : "");
    ui.rivChi.className = "me-rivchi" + (rullo ? " rullo" : " su") + (primo && !rullo ? " primo" : "");
    tx(ui.rivChi, rullo ? (primo ? "🥁 Il meme più divertente è di…" : "Di chi sarà?") : (r.id === cb.myId ? "Il tuo! 🎉" : r.nome) + " · +" + fmtN(r.pt));
    while (ui.rivVoti.firstChild) ui.rivVoti.removeChild(ui.rivVoti.firstChild);
    if (!rullo) {
      [["😂", r.v[2]], ["🙂", r.v[1]], ["😐", r.v[0]]].forEach(function (x) { if (x[1]) ui.rivVoti.appendChild(el("span", { class: "me-vchip", text: x[0] + " × " + x[1] })); });
      if (r.bonus) ui.rivVoti.appendChild(el("span", { class: "me-vchip oro", text: "💯 Tutti 😂 +" + fmtN(r.bonus) }));
    }
    ui.rivVoti.style.visibility = rullo ? "hidden" : "";   // (il posto resta)
    if (rullo) ui.rivVoti.appendChild(el("span", { class: "me-vchip", text: "😂 × 0" }));
    // suoni e vibrazione solo quando si vede succedere (non a chi arriva o ricarica a rivelazione fatta)
    var dalVivo = prima && prima.split("|")[1] === String(vm.giro) && prima.split("|")[0] === String(vm.partita);
    if (!dalVivo) return;
    if (rullo) { if (primo) suona("rullo"); return; }
    if (prima.split("|")[2] === String(passo)) return;   // (solo «finito» cambiato)
    if (primo) {
      var gioco = vm.players.some(function (p) { return p.id === cb.myId && !p.via; });
      if (r.id === cb.myId) vibra([70, 50, 70, 50, 160]); else if (gioco) vibra(30);
      suona("vince");
    } else suona("svela");
  }
  function suona(tipo) {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      if (tipo === "rullo") {   // il rullo di tamburi: tanti colpi brevi
        for (var i = 0; i < 22; i++) colpo(ctx, ctx.currentTime + i * 0.07, 0.05, 140 + (i % 2) * 20, "triangle", 0.05 + i * 0.004);
        return;
      }
      var note = tipo === "vince" ? [[523, 0], [659, 0.1], [784, 0.2], [1046, 0.32]] : [[660, 0], [880, 0.08]];
      note.forEach(function (n) { colpo(ctx, ctx.currentTime + n[1], 0.22, n[0], "triangle", 0.08); });
    } catch (e) {}
  }
  function colpo(ctx, t0, dur, f, tipo, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + dur + 0.05);
  }

  // ---------- la fine ----------
  function medaglie(posti) {
    var gruppi = 0, prec = null;
    return posti.map(function (p) { if (p !== prec) { gruppi++; prec = p; } return ["🥇", "🥈", "🥉"][gruppi - 1] || p + "°"; });
  }
  function finale(t, vm, cb) {
    stile(); caricaFont();
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale" });
    s.classList.add("me-fine");
    if (vm.serata && vm.serata.rec) s.classList.add("me-fine-meme");   // (il titolo grande lascia il posto al meme)
    var targa = !!t.guarda && !t.eliminazione, cl = vm.classifica || [], fac = targa ? null : t.faccine();
    if (targa) s.classList.add("me-fine-targa");
    // il meme della serata, in alto, con la foto per WhatsApp
    if (vm.serata && vm.serata.rec) {
      var box = t.el("div", { class: "me-serata" }), P = pannelloMeme(t);
      var foto = bottone(t, "me-vetro me-foto", "📸 WhatsApp", function () {
        foto.disabled = true; tx(foto, "📸 Preparo…");
        fotoMeme(vm.serata, vm.serata.nome, function (ok) { foto.disabled = false; tx(foto, ok ? "📸 WhatsApp" : "📶 Riprova"); });
      });
      box.appendChild(t.el("div", { class: "me-serata-riga" }, [
        t.el("div", { class: "me-serata-tit" }, [t.el("b", { text: "⭐ Il meme della serata" }), t.el("span", { text: vm.serata.id === cb.myId ? "Il tuo! 🎉" : "di " + vm.serata.nome + " · " + fmtN(vm.serata.pt) + " punti" })]),
        foto ]));
      box.appendChild(P.el);
      box.appendChild(t.el("a", { class: "me-cred", href: "https://imgflip.com", target: "_blank", rel: "noopener", text: "modello da imgflip.com" }));
      s._contenuto.appendChild(box);
      setTimeout(function () { P.metti(vm.serata.rec, vm.serata.testi, {}); }, 0);
      window.addEventListener("resize", function rs() { if (!s.isConnected) return window.removeEventListener("resize", rs); P.adatta(); });
    }
    var fitta = cl.length > 4 || (!!(vm.serata && vm.serata.rec) && cl.length > 2);   // (col meme della serata: su due colonne, il meme resta grande)
    var ol = t.el("ol", { class: "classifica" + (fitta ? " fitta" : "") }), med = medaglie(cl.map(function (r) { return r.pos; }));
    cl.forEach(function (r, i) {
      ol.appendChild(t.el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        t.el("span", { class: "pos", text: med[i] }),
        t.el("span", { class: "nome", text: r.id === cb.myId ? r.nome + " (tu)" : r.nome }),
        t.el("span", { class: "punti", text: fmtN(r.punti) }) ]));
    });
    s._contenuto.appendChild(ol);
    if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }
    if (!cl.some(function (r) { return r.id === cb.myId; })) s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:6px", text: "Questa partita l'hai guardata." }));
    if (!t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) {
      if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
      else s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:6px", text: targa ? "👀 Se l'host fa un'altra partita, entri anche tu nella saletta." : "Se l'host fa un'altra partita, torni da solo nella saletta." }));
      if (!targa) s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
    // chi ha vinto vibra (una volta)
    var io = cl.filter(function (r) { return r.id === cb.myId; })[0];
    if (io && io.pos === 1) vibra([60, 40, 60, 40, 140]);
    return s;
  }
  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function erroreRete(t, testo, riprova) {
    var s = t.schermata({ icona: "📶", titolo: "Niente rete?", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo + " Controlla la connessione e riprova." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Riprova", onclick: riprova }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Memata si gioca online: funziona quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      // (🌙 Notte vivace: colori solo con le variabili --o-* e --n-*)
      ".schermata.me-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:var(--o-fondo)}",
      ".schermata.me-piena>.testa,.schermata.me-piena>.piede{display:none}",
      ".schermata.me-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".me-scena{position:relative;height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 12px calc(12px + env(safe-area-inset-bottom));overflow:hidden;user-select:none;-webkit-user-select:none;color:var(--o-testo);background:radial-gradient(120% 60% at 50% 0%,rgba(224,34,90,.16),transparent 60%),var(--o-fondo)}",
      ".me-scena.fin{background:radial-gradient(120% 60% at 50% 0%,rgba(255,154,74,.2),transparent 60%),var(--o-fondo)}",
      ".me-barra{display:flex;align-items:center;gap:10px;font-weight:800;flex:none}",
      ".me-esci{width:38px;height:38px;flex:none;border-radius:50%;border:0;background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro);font:inherit;font-size:1.3rem;font-weight:900;cursor:pointer}",
      ".me-giro{flex:1;min-width:0;font-size:.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".me-tempo{flex:none;min-width:58px;text-align:center;padding:6px 10px;border-radius:999px;background:var(--o-carta);box-shadow:inset 0 0 0 1px var(--o-filo-oro);font-weight:900;font-variant-numeric:tabular-nums}",
      ".me-tempo:empty{visibility:hidden}.me-tempo.poco{background:var(--n-lampone);color:#fff;box-shadow:none}",
      ".me-titolo{flex:none;text-align:center;font-weight:900;font-size:1.15rem;min-height:1.4em;color:var(--o-testo)}",
      ".me-scena.fin .me-titolo{color:var(--n-festa)}",
      // il meme: prende tutto il posto che resta, l'immagine si vede intera
      ".me-meme{position:relative;flex:1 1 0;min-height:0;overflow:hidden;display:flex;align-items:center;justify-content:center}",
      ".me-quadro{position:relative;border-radius:10px;overflow:hidden;box-shadow:0 0 0 1px var(--o-filo-oro),var(--o-ombra-alta);background:#000}",
      ".me-img{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}",
      ".me-carica{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--o-tenue);font-weight:800;pointer-events:none}",
      ".me-quadro.senza{background:var(--o-carta-2)}.me-quadro.senza .me-img{visibility:hidden}",
      ".me-q{position:absolute;display:flex;box-sizing:border-box;transform-origin:50% 50%}",
      ".me-qt{display:block;white-space:pre;box-sizing:border-box;max-width:100%;max-height:100%;overflow:hidden;letter-spacing:.2px}",
      ".me-qn{display:none;position:absolute;left:3px;top:3px;min-width:18px;height:18px;border-radius:9px;background:var(--n-lampone);color:#fff;font:800 11px/18px var(--o-tit);text-align:center;padding:0 3px}",
      ".me-q.modifica{outline:2px dashed rgba(255,255,255,.75);outline-offset:-2px;background:rgba(13,16,32,.12);cursor:text}",
      ".me-q.modifica .me-qn{display:block}",
      ".me-q.modifica.sel{outline:3px solid var(--o-oro);background:rgba(224,34,90,.14)}",
      ".me-q.modifica:not(.vuoto) .me-qn{opacity:.55}",
      ".me-cred{flex:none;align-self:flex-end;margin-top:-6px;font-size:.68rem;color:var(--o-tenue);text-decoration:none;opacity:.8}",
      // scrivere
      ".me-scrivi{flex:none;display:flex;flex-direction:column;gap:8px}",
      ".me-riga{display:flex;align-items:center;gap:8px}",
      ".me-chips{display:flex;gap:6px;flex:1;min-width:0;overflow:hidden}",
      ".me-btn{border:0;font:inherit;font-weight:800;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}",
      ".me-chip{width:40px;height:36px;border-radius:12px;background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro)}",
      ".me-chip.pieno{background:var(--o-carta-2)}.me-chip.pieno::after{content:'✓';font-size:.7rem;margin-left:2px;color:var(--o-verde)}",
      ".me-chip.on{background:var(--o-tasto);color:#fff;box-shadow:none}",
      ".me-cambia{flex:none;margin-left:auto;padding:8px 12px;border-radius:12px;background:var(--o-carta);color:var(--o-oro-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro);font-size:.88rem}",
      ".me-campo{flex:1;min-width:0;resize:none;box-sizing:border-box;height:56px;padding:9px 12px;border-radius:14px;border:0;background:var(--o-carta-piena);color:var(--o-testo);box-shadow:inset 0 0 0 1.5px var(--o-filo-oro);font:600 1rem/1.3 var(--o-tit);user-select:text;-webkit-user-select:text}",
      ".me-campo:focus{outline:none;box-shadow:inset 0 0 0 2px var(--o-oro)}",
      ".me-campo.scuoti{animation:meScuoti .35s}@keyframes meScuoti{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}",
      ".me-primario{flex:none;height:56px;padding:0 16px;border-radius:14px;background:var(--o-tasto);color:#fff;font-size:1rem}",
      ".me-vetro{flex:none;padding:10px 14px;border-radius:14px;background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro)}",
      ".me-aspetta{flex:1;min-width:0;font-size:.88rem;color:var(--o-tenue);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      // con la tastiera aperta: via il titolo e la riga dei crediti, il meme si stringe
      ".me-scena.scrive .me-titolo,.me-scena.scrive .me-cred{display:none}",
      // votare
      ".me-vota{flex:none;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}",
      ".me-voto{height:76px;border-radius:18px;background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:transform .12s,opacity .2s}",
      ".me-voto .me-ve{font-size:2rem;line-height:1}.me-voto .me-vt{font-size:.8rem;color:var(--o-tenue)}",
      ".me-voto:active{transform:scale(.95)}",
      ".me-voto.scelto{background:var(--o-tasto);box-shadow:none;transform:scale(1.04)}.me-voto.scelto .me-vt{color:#fff}",
      ".me-voto.spento{opacity:.35}",
      ".me-nota{flex:none;text-align:center;font-weight:700;color:var(--o-tenue);min-height:1.3em;font-size:.92rem}",
      ".me-nota:empty{display:none}",
      // rivelazione
      ".me-riv{flex:none;display:flex;flex-direction:column;align-items:center;gap:6px}",
      ".me-rivchi{font-weight:900;font-size:1.35rem;text-align:center;min-height:1.6em;line-height:1.6em}",
      ".me-scena.st-rivela .me-meme{min-height:34%}",
      ".me-scena.st-rivela .me-punti .me-pchip{font-size:.78rem;padding:4px 8px}",
      ".me-rivchi.rullo{color:var(--o-tenue);animation:meRullo .5s ease-in-out infinite alternate}@keyframes meRullo{to{transform:scale(1.04)}}",
      ".me-rivchi.su{animation:meSu .5s cubic-bezier(.2,1.5,.4,1)}@keyframes meSu{0%{transform:scale(.4);opacity:0}100%{transform:scale(1);opacity:1}}",
      ".me-rivchi.primo{color:var(--n-monete);font-size:1.6rem;text-shadow:0 0 18px rgba(255,194,71,.45)}",
      ".me-rivvoti,.me-altri,.me-punti{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}",
      ".me-vchip,.me-pchip{padding:5px 10px;border-radius:999px;background:var(--o-carta);box-shadow:inset 0 0 0 1px var(--o-filo-oro);font-weight:800;font-size:.85rem}",
      ".me-vchip.oro{background:var(--n-monete);color:#2a1a00;box-shadow:none}",
      ".me-pchip.io{box-shadow:inset 0 0 0 1.5px var(--o-oro)}.me-pchip.via{opacity:.4}",
      ".me-altri{opacity:.85}",
      ".me-avanti{flex:none;height:48px;display:flex;align-items:center;justify-content:center}",
      ".me-vai{width:auto;min-width:60%;margin:0}.me-conto{margin:0;font-weight:800;color:var(--o-tenue)}",
      ".me-punti{flex:none}",
      ".me-scena>.sl-faccine{align-self:center;flex:none}",
      ".me-scena.me-con-targa{padding-bottom:calc(62px + env(safe-area-inset-bottom))}",
      // la fine: il meme della serata in alto, la classifica sotto
      ".schermata.me-fine>.contenuto{display:flex;flex-direction:column;min-height:0}",
      ".schermata.me-fine-meme>.testa{display:none}",
      ".me-serata{display:flex;flex-direction:column;gap:8px;flex:1 1 0;min-height:170px;margin-bottom:10px}",
      ".me-serata-riga{display:flex;align-items:center;gap:10px;flex:none}",
      ".me-serata-tit{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}",
      ".me-serata-tit b{color:var(--n-monete);font-size:1.05rem}.me-serata-tit span{color:var(--o-tenue);font-weight:700;font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".me-serata .me-meme{width:100%}",
      ".me-foto{flex:none;padding:9px 12px;font-size:.9rem}",
      ".schermata.me-fine-targa{padding-bottom:calc(58px + env(safe-area-inset-bottom))}"
    ].join("");
    document.head.appendChild(st);
  }

  // per lo strumentino dei riquadri e per le prove: lo stesso motore del gioco (impaginazione e disegno)
  window.SG_MEMATA_MOTORE = { pannello: pannelloMeme, impagina: impagina, stileDi: stileDi, riquadri: riquadri, urlDi: urlDi, disegna: disegnaMeme, caricaFont: caricaFont, stile: stile, CLASSICO: CLASSICO };

  SG.registra({
    id: ID, nome: "Memata", icona: "😂",
    descrizione: "Esce un meme famoso coi riquadri vuoti: scrivi il tuo testo, votate i meme degli altri e scoprite chi li ha fatti.",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 1,
    tema: "oro",
    modi: [], soloOnline: true,
    postiOnline: MAX,
    ritardatari: RITARDATARI,
    riprende: true,
    riserva: true,
    riassunto: function (imp) { return (imp.giri || 3) + " round · " + (imp.tempo || 75) + " secondi per scrivere"; },
    regole: [
      "A ogni round ognuno riceve un <b>meme famoso coi riquadri vuoti</b>: tocca un riquadro, scrivi il tuo testo e guarda subito come viene. Se non ti ispira, una volta per round puoi toccare <b>🔄 Cambia meme</b>.",
      "Poi i meme passano uno alla volta, <b>senza nome</b>: vota quanto fa ridere (😂 fortissimo 200 punti, 🙂 carino 100, 😐 meh 0). Il tuo non lo voti. Se piace a tutti con 😂: <b>💯 +200</b>.",
      "Alla rivelazione si scopre chi li ha scritti, dal meno votato al più votato. L'<b>ultimo round</b> è uguale per tutti: lo stesso meme, punti doppi!",
      "Alla fine il <b>⭐ meme della serata</b> si manda su WhatsApp. I modelli dei meme arrivano da imgflip.com."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.giri = 3; dove.tempo = 75;
      function scelta(tit, chiave, valori, testo, pre) {
        box.appendChild(el("div", { class: "etichetta", text: tit }));
        var g = el("div", { class: "modo-griglia", style: "grid-template-columns:repeat(3,1fr)" });
        valori.forEach(function (n) {
          var b = el("button", { class: "modo-chip" + (n === pre ? " attiva" : ""), style: "justify-content:center", onclick: function () {
            dove[chiave] = n; [].forEach.call(g.children, function (c) { c.className = "modo-chip"; }); b.className = "modo-chip attiva";
          } }, [el("div", { class: "mt", text: testo(n) })]);
          g.appendChild(b);
        });
        box.appendChild(g);
      }
      scelta("Quanti round", "giri", [3, 5, 7], function (n) { return n + " round"; }, 3);
      scelta("Tempo per scrivere", "tempo", [45, 75, 120], function (n) { return n + " secondi"; }, 75);
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);
      return host(t);
    }
  });
})();
