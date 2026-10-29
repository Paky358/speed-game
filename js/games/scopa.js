/* =========================================================
   GIOCO — "Scopa" (carte napoletane, repliche nostre in SVG)
   In due. Modalità: contro il bot (Facile/Medio/Difficile) e online
   (ognuno dal suo telefono, mano coperta; host-autoritativo su SGNet).
   Regole: si gioca una carta; se ha lo stesso valore di una carta sul
   tavolo la prende (se c'è un valore uguale singolo si prende quello,
   niente somme); altrimenti può prendere una somma di più carte. Se
   svuoti il tavolo fai "Scopa" (+1), tranne con l'ultima carta. A fine
   mazzo le carte restano vanno all'ultimo che ha preso. Punti a fine
   smazzata: Carte, Denari, Settebello (7 di denari), Primiera, + le Scope.
   Partita a 11 punti.
   ========================================================= */
(function () {
  "use strict";

  // ---------- musichetta allegra di sottofondo (generata, niente file) ----------
  // Condivisa da Scopa, Scopa 2 vs 2 e Scopone. Stile osteria: basso "zum-pa", accordi pizzicati
  // tipo mandolino, melodia che si ripete, cassa e charleston leggeri. Tasto 🎵/🔇 (scelta ricordata).
  window.SGMusica = window.SGMusica || (function () {
    var on = true, giocando = false, ctx = null, master = null, filtro = null, timer = null, nextT = 0, step = 0, rumore = null, guardia = null, tGuardia = null;
    try { on = (localStorage.getItem("sg-musica") !== "off"); } catch (e) {}
    var S = 60 / 128 / 4;   // un sedicesimo a 128 battiti al minuto
    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    // giro di accordi Do · La- · Fa · Sol (una battuta ciascuno): basso, accordo, melodia (ottavi, null = pausa)
    var GIRO = [
      { b: 36, a: [60, 64, 67], m: [76, 79, 84, 79, 76, null, 74, 76] },
      { b: 33, a: [57, 60, 64], m: [72, 76, 81, 76, 72, null, 71, 72] },
      { b: 41, a: [57, 60, 65], m: [69, 72, 77, 72, 69, null, 67, 69] },
      { b: 43, a: [55, 59, 62], m: [71, 74, 79, 74, 77, null, 76, 74] }
    ];
    function nota(freq, t0, dur, tipo, vol, attacco) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = tipo; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + (attacco || 0.006));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function cassa(t0) {   // colpo di grancassa: sinusoide che scende di tono
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(140, t0); o.frequency.exponentialRampToValueAtTime(45, t0 + 0.12);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 0.2);
    }
    function charleston(t0, vol) {   // "tss" corto: rumore filtrato
      if (!rumore) { rumore = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.1), ctx.sampleRate); var d = rumore.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = rumore; f.type = "highpass"; f.frequency.value = 7000;
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
      s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + 0.06);
    }
    function passo(t0) {
      var i = step % 16, battuta = Math.floor(step / 16), c = GIRO[battuta % 4], conMelodia = (battuta % 8) >= 4 || battuta >= 8;
      if (i === 0 || i === 8) cassa(t0);
      if (i % 2 === 0) charleston(t0, i % 4 === 2 ? 0.07 : 0.035);
      if (i % 4 === 0) nota(hz(c.b + (i % 8 === 4 ? 7 : 0)), t0, S * 3, "triangle", 0.34);                       // zum
      if (i % 4 === 2) c.a.forEach(function (m) { nota(hz(m), t0, S * 1.6, "triangle", 0.09); nota(hz(m + 12), t0, S * 0.9, "square", 0.018); });   // pa (pizzicato)
      if (conMelodia && i % 2 === 0) { var mm = c.m[i / 2]; if (mm) nota(hz(mm), t0, S * 1.8, "square", 0.035, 0.004); }
      step++;
    }
    function loop() { if (!ctx) return; while (nextT < ctx.currentTime + 0.3) { passo(nextT); nextT += S; } }
    function startAudio() {
      ctx = SG.audioCtx && SG.audioCtx(); if (!ctx || timer) return;
      if (!master) {
        master = ctx.createGain(); filtro = ctx.createBiquadFilter(); filtro.type = "lowpass"; filtro.frequency.value = 5200;
        var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.knee.value = 6; comp.ratio.value = 12; comp.attack.value = 0.004; comp.release.value = 0.2;
        master.connect(filtro); filtro.connect(comp); comp.connect(ctx.destination);   // limitatore: volume pieno senza distorcere
      }
      master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.42, ctx.currentTime + 1.2);
      nextT = ctx.currentTime + 0.1; step = 0; loop(); timer = setInterval(loop, 100);
    }
    function stopAudio() {
      if (timer) { clearInterval(timer); timer = null; }
      if (ctx && master) { try { master.gain.cancelScheduledValues(ctx.currentTime); var v = master.gain.value || 0.0001; master.gain.setValueAtTime(v, ctx.currentTime); master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6); } catch (e) {} }
    }
    return {
      // vivo (facoltativo): "la partita è ancora sullo schermo?". Se l'app passa ad altro senza far uscire il gioco
      // (es. l'host della Sala sparisce e si torna nella Sala), la musica si ferma da sola
      avvia: function (vivo) {
        giocando = true;
        guardia = vivo || null;
        if (guardia && !tGuardia) tGuardia = setInterval(function () { if (guardia && !guardia()) window.SGMusica.ferma(); }, 500);
        if (!guardia && tGuardia) { clearInterval(tGuardia); tGuardia = null; }
        if (on) startAudio();
      },
      ferma: function () { giocando = false; guardia = null; clearInterval(tGuardia); tGuardia = null; stopAudio(); },
      attiva: function () { return on; },
      commuta: function () { on = !on; try { localStorage.setItem("sg-musica", on ? "on" : "off"); } catch (e) {} if (giocando) { if (on) startAudio(); else stopAudio(); } return on; },
      // pulsante 🎵/🔇 pronto da mettere in una schermata
      bottone: function (el) {
        var b = el("button", { class: "sc-musica", title: "Musica di sottofondo", text: on ? "🎵" : "🔇" });
        b.addEventListener("click", function () { b.textContent = (window.SGMusica.commuta() ? "🎵" : "🔇"); });
        return b;
      }
    };
  })();

  // ---------- FACCINE E FRASI DURANTE LA PARTITA (condivise da Scopa, Tris, Drop 4, Battaglia Navale, Calcio Biliardo) ----------
  // Il tasto 💬 apre un foglio con 6 faccine e 8 frasi a tema: quella scelta compare in un fumetto vicino a chi l'ha mandata,
  // sui telefoni di tutti (anche di chi guarda). Al massimo una al secondo. In rete viaggiano solo i codici (f0…f5 faccine,
  // p0…p7 frasi del gioco, b0…b7 risposte di Bot): l'host controlla che il codice esista, poi lo rimanda a tutti
  // con inviaVeloce ({ t: "chiac", k: chi, id, c, n }: non resta nella stanza). Chi guarda ha solo le faccine: compaiono in
  // basso a sinistra col suo nome. Contro il Bot, ogni tanto Bot risponde. L'host le può spegnere nel ⚙️ (imp.chiacchiere = "no").
  window.SGChiacchiere = window.SGChiacchiere || (function () {
    var FACCINE = ["👏", "😂", "😱", "😎", "🔥", "😴"];
    var FRASI = {
      scopa: ["Bella!", "Mannaggia…", "Te l'ho lasciata apposta 😏", "Che fortuna!", "Dai, butta!", "Ma che hai fatto?!", "Il settebello è mio!", "Bella partita 🤝"],
      tris: ["Ti ho visto! 👀", "Bella mossa!", "Occhio…", "Ops!", "Dai, muoviti!", "Questa la vinco io", "Pari anche stavolta?", "Bella partita 🤝"],
      drop4: ["Bella mossa!", "Occhio alla diagonale!", "Ti blocco!", "Ops…", "Dai, muoviti!", "Per un pelo!", "Non ci credo!", "Bella partita 🤝"],
      navale: ["Acqua! 😜", "Ahi…", "Ti ho trovato 🎯", "Mancato per un pelo", "Dove sei?", "Bel colpo!", "Ti affondo tutto!", "Bella partita 🤝"],
      calciobiliardo: ["Che gol! ⚽", "Che parata!", "Bel tiro!", "Fuori!", "Dai, tira!", "Traversa…", "Fortunato!", "Bella partita 🤝"]
    };
    var BOT = ["Bip bop 😏", "Vedremo, vedremo…", "Parla meno e gioca!", "Sto calcolando… 🤖", "Ah sì? 😎", "Guarda e impara.", "Non mi fai paura!", "Hehe 😁"];
    var ultimaMia = 0, tSorv = null, fatto = false;
    function frasi(gioco) { return FRASI[gioco] || FRASI.tris; }
    // il codice → { f: faccina } o { t: frase } (null se non esiste)
    function cosa(gioco, c) {
      var m = /^([fpb])([0-9])$/.exec(String(c || "")); if (!m) return null;
      var i = +m[2], L = m[1] === "f" ? FACCINE : m[1] === "b" ? BOT : frasi(gioco);
      if (i >= L.length) return null;
      return m[1] === "f" ? { f: L[i] } : { t: L[i] };
    }
    // quello che può mandare un telefono (le risposte di Bot no; chi guarda solo le faccine)
    function valido(gioco, c, soloFaccine) { var x = cosa(gioco, c); return !!x && String(c).charAt(0) !== "b" && (!soloFaccine || !!x.f); }
    function vibra(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
    function pop() {   // un "pop" piccolo (niente vibrazione: arriva da un altro)
      var ctx = window.SG && SG.audioCtx && SG.audioCtx(); if (!ctx) return;
      try {
        var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(1250, t + 0.07);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.14);
      } catch (e) {}
    }
    function stile() {
      if (fatto) return; fatto = true;
      var st = document.createElement("style"); st.id = "sg-chiac-css";
      st.textContent = [
        ".sgc-tasto{position:relative;flex:0 0 auto;width:38px;height:38px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font-size:1.15rem;line-height:1;cursor:pointer;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.3);-webkit-tap-highlight-color:transparent}",
        ".sgc-tasto[hidden]{display:none}",
        ".sgc-tasto:active{transform:scale(.92)}",
        ".sgc-tasto i{position:absolute;left:6px;right:6px;bottom:3px;height:3px;border-radius:2px;background:#ffca3a;transform-origin:0 50%;transform:scaleX(0);opacity:0}",
        ".sgc-tasto.attesa{opacity:.65}",
        ".sgc-tasto.attesa i{opacity:1;animation:sgcCarica 1s linear forwards}",
        "@keyframes sgcCarica{from{transform:scaleX(0)}to{transform:scaleX(1)}}",
        ".sgc-velo{position:fixed;inset:0;z-index:9990;background:rgba(5,8,25,.35)}",
        ".sgc-foglio{position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom));width:min(calc(100vw - 20px),380px);box-sizing:border-box;padding:8px 10px 10px;border-radius:18px;background:#1d2a5e;color:#fff;border:1.5px solid rgba(255,255,255,.16);box-shadow:0 10px 30px rgba(0,0,0,.5);transform:translateX(-50%);animation:sgcSu .18s ease-out}",
        "@keyframes sgcSu{from{opacity:0;transform:translate(-50%,16px)}to{opacity:1;transform:translateX(-50%)}}",
        ".sgc-testa{display:flex;align-items:center;justify-content:space-between;margin:0 0 6px;font-weight:900;font-size:.9rem}",
        ".sgc-x{width:32px;height:32px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font:inherit;font-size:1rem;cursor:pointer;padding:0}",
        ".sgc-fac{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}",
        ".sgc-fac button{height:46px;padding:0;border:0;border-radius:12px;background:rgba(255,255,255,.09);font-size:1.6rem;line-height:1;cursor:pointer}",
        ".sgc-frasi{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:8px}",
        ".sgc-frasi button{min-height:42px;padding:4px 6px;border:0;border-radius:12px;background:rgba(255,255,255,.12);color:#fff;font:inherit;font-weight:800;font-size:.86rem;line-height:1.15;cursor:pointer}",
        ".sgc-foglio button:active{transform:scale(.94)}",
        ".sgc-bolla{position:fixed;left:0;top:0;z-index:9980;box-sizing:border-box;max-width:min(66vw,230px);padding:6px 11px;border-radius:14px;background:#fff;color:#1d2440;font-weight:900;font-size:.9rem;line-height:1.2;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.4);pointer-events:none;animation:sgcBolla .25s cubic-bezier(.3,1.6,.5,1);transition:opacity .3s}",
        ".sgc-bolla.fa{font-size:2rem;line-height:1.1;padding:3px 9px}",
        ".sgc-bolla small{display:block;font-size:.66rem;font-weight:800;opacity:.65;line-height:1.1}",
        ".sgc-bolla::after{content:'';position:absolute;left:50%;bottom:-7px;margin-left:calc(var(--coda,0px) - 7px);border:7px solid transparent;border-top-color:#fff;border-bottom:0}",
        ".sgc-bolla.giu::after{bottom:auto;top:-7px;border:7px solid transparent;border-bottom-color:#fff;border-top:0}",
        ".sgc-bolla.via{opacity:0}",
        "@keyframes sgcBolla{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}",
        "@media (prefers-reduced-motion:reduce){.sgc-bolla,.sgc-foglio{animation:none}}"
      ].join("");
      document.head.appendChild(st);
    }
    // il fumetto vicino all'ancora (l'avatar, la targa, il campo di chi parla), sopra tutto e senza spostare niente.
    // o = { sotto: true (sotto l'ancora), nome: scritta piccola sopra, muto: niente suono, durata }
    function bolla(ancora, gioco, c, o) {
      o = o || {};
      var x = cosa(gioco, c); if (!x || !ancora || !document.body.contains(ancora)) return null;
      stile();
      if (ancora._sgc && ancora._sgc.parentNode) ancora._sgc.parentNode.removeChild(ancora._sgc);
      var b = document.createElement("div");
      b.className = "sgc-bolla" + (x.f ? " fa" : "") + (o.sotto ? " giu" : "") + (gioco === "scopa" ? " sgc-oro" : "");
      if (o.nome) { var sm = document.createElement("small"); sm.textContent = o.nome; b.appendChild(sm); }
      b.appendChild(document.createTextNode(x.f || x.t));
      b.style.visibility = "hidden";
      document.body.appendChild(b);
      var r = ancora.getBoundingClientRect(), W = window.innerWidth || 360, H = window.innerHeight || 640, bw = b.offsetWidth, bh = b.offsetHeight;
      var cx = r.left + r.width / 2, left = Math.max(6, Math.min(W - bw - 6, cx - bw / 2)), sotto = !!o.sotto;
      var top = sotto ? r.bottom + 8 : r.top - bh - 8;
      if (!sotto && top < 4) { sotto = true; top = r.bottom + 8; }            // sopra non c'è posto: sotto
      else if (sotto && top + bh > H - 4) { sotto = false; top = r.top - bh - 8; }
      b.classList.toggle("giu", sotto);
      top = Math.max(4, Math.min(H - bh - 4, top));
      b.style.left = Math.round(left) + "px"; b.style.top = Math.round(top) + "px";
      b.style.setProperty("--coda", Math.round(Math.max(12 - bw / 2, Math.min(bw / 2 - 12, cx - left - bw / 2))) + "px");   // la punta su chi parla
      b.style.visibility = "";
      ancora._sgc = b; b._ancora = ancora;
      var durata = o.durata || (x.f ? 2200 : 2900);
      setTimeout(function () { b.classList.add("via"); }, durata - 300);
      setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); if (ancora._sgc === b) ancora._sgc = null; }, durata);
      sorveglia();
      if (!o.muto) pop();
      return b;
    }
    // la faccina di chi guarda: in basso a sinistra col suo nome (come quelle della saletta)
    function volante(gioco, c, nome, muto) {
      var x = cosa(gioco, c); if (!x) return;
      var box = document.querySelector("body > .sg-fa-volanti");
      if (!box) { box = document.createElement("div"); box.className = "sg-fa-volanti"; box.setAttribute("aria-hidden", "true"); document.body.appendChild(box); }
      while (box.childNodes.length >= 4) box.removeChild(box.firstChild);
      var v = document.createElement("div"), e = document.createElement("b"), s = document.createElement("span");
      v.className = "sg-fa-volante"; e.textContent = x.f || "💬"; s.textContent = String(nome || "").slice(0, 16) + (x.f ? "" : ": " + x.t);
      v.appendChild(e); v.appendChild(s); box.appendChild(v);
      setTimeout(function () { if (v.parentNode) v.parentNode.removeChild(v); }, 2500);
      if (!muto) pop();
    }
    // la schermata del gioco è cambiata: via i fumetti e il foglio rimasti senza il loro posto
    function sorveglia() {
      if (tSorv) return;
      tSorv = setInterval(function () {
        var l = document.querySelectorAll(".sgc-bolla, .sgc-velo");
        if (!l.length) { clearInterval(tSorv); tSorv = null; return; }
        [].forEach.call(l, function (b) { if (b._ancora && !document.body.contains(b._ancora) && b.parentNode) b.parentNode.removeChild(b); });
      }, 250);
    }
    // il tasto 💬: o = { gioco, soloFaccine (chi guarda), onScegli(codice) }. Dopo una scelta aspetta un secondo
    function tasto(o) {
      stile();
      var b = document.createElement("button");
      b.type = "button"; b.className = "sgc-tasto";
      b.setAttribute("aria-label", o.soloFaccine ? "Faccine" : "Faccine e frasi");
      b.innerHTML = "💬<i></i>";
      b.addEventListener("click", function () { if (!b.classList.contains("attesa")) apri(o, b); });
      return b;
    }
    function apri(o, b) {
      if (document.querySelector(".sgc-velo")) return;
      function bt(cls, testo, fn) { var x = document.createElement("button"); x.type = "button"; if (cls) x.className = cls; x.textContent = testo; x.addEventListener("click", fn); return x; }
      var velo = document.createElement("div"), f = document.createElement("div"), testa = document.createElement("div"), tit = document.createElement("b");
      velo.className = "sgc-velo"; f.className = "sgc-foglio" + (o.gioco === "scopa" ? " sgc-oro" : ""); testa.className = "sgc-testa";   // (🤍 il foglio della Scopa in avorio e oro; gli altri giochi lo tengono com'era)
      f.setAttribute("role", "dialog");
      tit.textContent = o.soloFaccine ? "Faccine" : "💬 Di' qualcosa";
      testa.appendChild(tit); testa.appendChild(bt("sgc-x", "✕", chiudi));
      f.appendChild(testa);
      var fac = document.createElement("div"); fac.className = "sgc-fac";
      FACCINE.forEach(function (e, i) { fac.appendChild(bt("", e, function () { scegli("f" + i); })); });
      f.appendChild(fac);
      if (!o.soloFaccine) {
        var fr = document.createElement("div"); fr.className = "sgc-frasi";
        frasi(o.gioco).forEach(function (t, i) { fr.appendChild(bt("", t, function () { scegli("p" + i); })); });
        f.appendChild(fr);
      }
      velo.appendChild(f);
      velo.addEventListener("click", function (e) { if (e.target === velo) chiudi(); });
      velo._ancora = b;   // (se il tasto sparisce, il foglio si chiude da solo)
      document.body.appendChild(velo);
      sorveglia();
      function chiudi() { if (velo.parentNode) velo.parentNode.removeChild(velo); }
      function scegli(c) {
        chiudi();
        var ora = Date.now(); if (ora - ultimaMia < 1000) return;
        ultimaMia = ora;
        vibra(10);   // hai scelto: piccola vibrazione
        b.classList.remove("attesa"); void b.offsetWidth; b.classList.add("attesa");
        setTimeout(function () { b.classList.remove("attesa"); }, 1000);
        try { o.onScegli(c); } catch (e) { setTimeout(function () { throw e; }, 0); }
      }
    }
    // l'host: al massimo una al secondo per telefono
    function filtro() { var ult = {}; return function (id) { var ora = Date.now(); if (ora - (ult[id] || 0) < 900) return false; ult[id] = ora; return true; }; }
    // contro il Bot: ogni tanto risponde (dopo un attimo), con una faccina o una battuta
    function rispondeBot(fn) {
      if (Math.random() > 0.6) return;
      setTimeout(function () { fn(Math.random() < 0.4 ? "f" + Math.floor(Math.random() * FACCINE.length) : "b" + Math.floor(Math.random() * BOT.length)); }, 900 + Math.random() * 700);
    }
    // la regola nel ⚙️ (solo online): imp.chiacchiere "si" / "no"
    function regola(el, box, dove) {
      if (dove.chiacchiere !== "no") dove.chiacchiere = "si";
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "💬 Faccine e frasi durante la partita" }));
      var riga = el("div", { style: "display:flex;gap:8px" });
      [["si", "💬 Sì"], ["no", "🤐 No"]].forEach(function (v) {
        var b = el("button", { class: "modo-chip" + (dove.chiacchiere === v[0] ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.chiacchiere = v[0]; [].forEach.call(riga.children, function (x) { x.classList.remove("attiva"); }); b.classList.add("attiva");
        } }, [el("div", { class: "mt", text: v[1] })]);
        riga.appendChild(b);
      });
      box.appendChild(riga);
    }
    function attive(imp) { return !imp || imp.chiacchiere !== "no"; }
    // la partita col Bot nel torneo a eliminazione si trasmette a chi guarda: anche le chiacchiere, poi di nuovo l'ultima
    // foto (così nella stanza resta trattenuta la foto, non la chiacchiera). Da chiamare all'inizio della partita
    function trasmettitore(t) {
      if (!t || !t.trasmetti) return null;
      if (!t.__sgcTx) {
        var tx = t.trasmetti, ultimo = null;
        t.trasmetti = function (m) { ultimo = m; return tx.apply(this, arguments); };
        t.__sgcTx = function (m) { tx(m); if (ultimo) tx(ultimo); };
      }
      return t.__sgcTx;
    }
    function nomeDi(n) { return String(n == null ? "" : n).trim().slice(0, 16) || "Chi guarda"; }
    return { FACCINE: FACCINE, FRASI: FRASI, cosa: cosa, valido: valido, tasto: tasto, bolla: bolla, volante: volante, filtro: filtro,
      rispondeBot: rispondeBot, regola: regola, attive: attive, trasmettitore: trasmettitore, nomeDi: nomeDi };
  })();

  var SEMI = ["D", "C", "S", "B"];                 // Denari, Coppe, Spade, Bastoni
  var SEME_NOME = { D: "Denari", C: "Coppe", S: "Spade", B: "Bastoni" };
  var COLORE = { D: "#e0a11b", C: "#d1495b", S: "#2f6fb0", B: "#2e8b57" };
  var FIG = { 8: "💂", 9: "🐎", 10: "👑" };         // Fante, Cavallo, Re
  var PRIM = { 1: 16, 2: 12, 3: 13, 4: 14, 5: 15, 6: 18, 7: 21, 8: 10, 9: 10, 10: 10 };
  var TARGET = 11;   // i punti da raggiungere se non si sceglie altro

  // ---- punti da raggiungere (Scopa, Scopa 2 vs 2, Scopone): una mano sola, 7, 11, 21 o quanti si vuole (1–99) ----
  function traguardoDa(imp) {   // 0 = una mano sola
    var n = imp && imp.traguardo;
    if (n === 0) return 0;
    n = Math.floor(+n);
    return n >= 1 && n <= 99 ? n : TARGET;
  }
  function testoTraguardo(n) { if (n == null) n = TARGET; return n ? "a " + n : "una mano"; }
  // finita una mano, la partita è chiusa? Con una mano sola sì; altrimenti quando qualcuno arriva ai punti
  // (se arrivano tutti e due a pari punti si gioca un'altra mano)
  function partitaFinita(n, a, b) { return !n || ((a >= n || b >= n) && a !== b); }
  function sceltaTraguardo(el, box, dove, nota) {   // nota = scritta piccola sotto (facoltativa)
    dove.traguardo = TARGET;
    box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Punti da raggiungere" }));
    var scelte = [[0, "Una mano"], [7, "7"], [11, "11"], [21, "21"]], riga = el("div", { style: "display:flex;gap:6px" }), campo;
    function segna() {
      [].forEach.call(riga.children, function (c, i) { c.className = "modo-chip" + (scelte[i][0] === dove.traguardo ? " attiva" : ""); c.style.flex = i ? "1" : "1.7"; });
    }
    scelte.forEach(function (s) {
      riga.appendChild(el("button", { class: "modo-chip", style: "justify-content:center;text-align:center;padding-left:4px;padding-right:4px", onclick: function () {
        dove.traguardo = s[0]; campo.value = s[0] || ""; segna();
      } }, [el("div", { class: "mt", text: s[1] })]));
    });
    box.appendChild(riga);
    campo = el("input", { type: "number", min: "1", max: "99", inputmode: "numeric", class: "link-campo", placeholder: "1–99", "aria-label": "Punti da raggiungere", style: "width:5.5em;text-align:center;margin:0" });
    campo.value = String(dove.traguardo);
    campo.addEventListener("input", function () {
      var n = Math.floor(+campo.value);
      if (n >= 1 && n <= 99) { dove.traguardo = n; segna(); }
    });
    campo.addEventListener("change", function () {   // un numero fuori misura torna a quello scelto
      var n = Math.floor(+campo.value);
      if (n > 99) { dove.traguardo = 99; segna(); }
      campo.value = dove.traguardo ? String(dove.traguardo) : "";
    });
    box.appendChild(el("div", { style: "display:flex;align-items:center;gap:8px;margin-top:8px;font-size:.92rem" }, [
      el("span", { text: "✏️ Oppure scegli tu:" }), campo, el("span", { class: "tenue", text: "punti" }) ]));
    if (nota) box.appendChild(el("div", { class: "tenue", style: "font-size:.8rem;margin-top:6px", text: nota }));
    segna();
  }

  function altro(k) { return k === "A" ? "B" : "A"; }
  function trova(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }

  // ---------- logica pura ----------
  function creaMazzo(mischia) {
    var m = [];
    SEMI.forEach(function (s) { for (var v = 1; v <= 10; v++) m.push({ s: s, v: v, id: s + v }); });
    return mischia ? mischia(m) : m;
  }
  // prese possibili per un valore: insiemi di ID. Se c'è un singolo uguale, SOLO singoli.
  function catture(val, tavolo) {
    var singoli = [];
    tavolo.forEach(function (c) { if (c.v === val) singoli.push([c.id]); });
    if (singoli.length) return singoli;
    var combos = [], n = tavolo.length;
    for (var mask = 1; mask < (1 << n); mask++) {
      var s = 0, set = [];
      for (var i = 0; i < n; i++) if (mask & (1 << i)) { s += tavolo[i].v; set.push(tavolo[i].id); }
      if (s === val && set.length >= 2) combos.push(set);
    }
    return combos;
  }
  function primiera(cards) {
    var best = { D: 0, C: 0, S: 0, B: 0 };
    cards.forEach(function (c) { if (PRIM[c.v] > best[c.s]) best[c.s] = PRIM[c.v]; });
    return best.D + best.C + best.S + best.B;
  }
  // la primiera vale solo con tutti e quattro i semi
  function tuttiSemi(cards) { var s = {}; cards.forEach(function (c) { s[c.s] = 1; }); return !!(s.D && s.C && s.S && s.B); }
  function contaPunti(A, B) {
    function den(x) { var n = 0; x.forEach(function (c) { if (c.s === "D") n++; }); return n; }
    var carteA = A.length, carteB = B.length, denA = den(A), denB = den(B);
    var sette = trova(A, "D7") ? "A" : (trova(B, "D7") ? "B" : null);
    var primA = primiera(A), primB = primiera(B), okA = tuttiSemi(A), okB = tuttiSemi(B);
    // a chi manca un seme non prende la primiera; se manca a tutti e due non la prende nessuno
    var pPrim = okA && okB ? (primA > primB ? "A" : primB > primA ? "B" : null) : okA ? "A" : okB ? "B" : null;
    return {
      carteA: carteA, carteB: carteB, puntoCarte: carteA > carteB ? "A" : carteB > carteA ? "B" : null,
      denA: denA, denB: denB, puntoDenari: denA > denB ? "A" : denB > denA ? "B" : null,
      settebello: sette,
      primA: primA, primB: primB, primOkA: okA, primOkB: okB, puntoPrimiera: pPrim
    };
  }
  function puntiRound(p, scope, chi) {
    return scope[chi]
      + (p.puntoCarte === chi ? 1 : 0)
      + (p.puntoDenari === chi ? 1 : 0)
      + (p.settebello === chi ? 1 : 0)
      + (p.puntoPrimiera === chi ? 1 : 0);
  }

  // ---------- motore di partita (host-autoritativo / locale) ----------
  // primo = chi comincia la prima smazzata ("A" o "B"; nelle partite dopo si alterna)
  function creaMotore(nomi, mischia, traguardo, primo) {
    var st = {
      traguardo: traguardo == null ? TARGET : traguardo,
      mazzo: [], tavolo: [], mani: { A: [], B: [] }, prese: { A: [], B: [] },
      scope: { A: 0, B: 0 }, turno: "A", ultimaPresa: null,
      fase: "gioco", primo: primo || "A", primoPartita: primo || "A", punti: { A: 0, B: 0 }, nomi: nomi,
      ultimoRound: null, presa: null, messaGiu: null,
      idPartita: Math.random().toString(36).slice(2, 9), nRound: 0, rifatta: false
    };
    function nuovoRound() {
      // tre o quattro Re in tavola: nessuno potrebbe fare scopa, si rimescola e si rifà la mano
      var giri = 0;
      do {
        st.mazzo = creaMazzo(mischia);
        st.tavolo = st.mazzo.splice(0, 4);
      } while (st.tavolo.filter(function (c) { return c.v === 10; }).length >= 3 && ++giri < 20);
      st.rifatta = giri > 0;
      st.mani.A = st.mazzo.splice(0, 3);
      st.mani.B = st.mazzo.splice(0, 3);
      st.prese.A = []; st.prese.B = []; st.scope.A = 0; st.scope.B = 0; st.nRound++;
      st.ultimaPresa = null; st.turno = st.primo; st.fase = "gioco"; st.presa = null; st.messaGiu = null;
    }
    function distribuisci() { // 3 a testa quando le mani sono vuote e il mazzo ha carte
      st.mani.A = st.mazzo.splice(0, 3);
      st.mani.B = st.mazzo.splice(0, 3);
    }
    // ritorna un evento: {presa:bool, scopa:bool, chi, chiudere} oppure {errore:true}
    // (finite le mani NON si distribuisce subito: prima si guarda la presa, poi chiudiPresa)
    function gioca(pk, cartaId, presaIds) {
      if (st.fase !== "gioco" || pk !== st.turno || st.presa) return { errore: true };
      var carta = trova(st.mani[pk], cartaId);
      if (!carta) return { errore: true };
      var opts = catture(carta.v, st.tavolo);
      var ev = { presa: false, scopa: false, chi: pk };
      st.presa = null; st.messaGiu = null; st.rifatta = false;
      // togli la carta dalla mano
      st.mani[pk] = st.mani[pk].filter(function (c) { return c.id !== cartaId; });
      if (opts.length) {
        // DEVE prendere: valida il set scelto (o prendi il primo se non specificato/valido)
        var set = presaIds && validaSet(opts, presaIds) ? presaIds : opts[0];
        var tavoloPrima = st.tavolo.slice(); // il tavolo com'era, per l'animazione (resta fermo, volano via solo le prese)
        var presi = set.map(function (id) { return trova(st.tavolo, id); }).filter(Boolean);
        st.tavolo = st.tavolo.filter(function (c) { return set.indexOf(c.id) < 0; });
        st.prese[pk] = st.prese[pk].concat(presi, [carta]);
        st.ultimaPresa = pk; ev.presa = true;
        var ultimissima = (st.mazzo.length === 0 && st.mani.A.length === 0 && st.mani.B.length === 0);
        if (st.tavolo.length === 0 && !ultimissima) { st.scope[pk]++; ev.scopa = true; }
        st.presa = { chi: pk, carta: carta, presi: presi, scopa: ev.scopa, tavoloPrima: tavoloPrima, presiIds: set };
      } else {
        st.tavolo.push(carta); st.messaGiu = carta.id; // niente presa: la carta si posa sul tavolo (animata)
      }
      st.turno = altro(pk);
      ev.chiudere = st.mani.A.length === 0 && st.mani.B.length === 0;   // mani finite: poi si distribuisce (o finisce la smazzata)
      return ev;
    }
    // finita di guardare la presa: si pulisce; a mani vuote si distribuisce. A fine mazzo prima si fanno vedere
    // le carte rimaste che vanno all'ultimo che ha preso ("resto"), poi la smazzata finisce ("fine").
    function chiudiPresa() {
      st.presa = null; st.messaGiu = null;
      if (st.fase !== "gioco" || st.mani.A.length || st.mani.B.length) return "gioco";
      if (st.mazzo.length > 0) { distribuisci(); return "gioco"; }
      if (st.tavolo.length && st.ultimaPresa) {
        var resto = st.tavolo.slice(), chi = st.ultimaPresa;
        st.prese[chi] = st.prese[chi].concat(resto); st.tavolo = [];
        st.presa = { chi: chi, carta: null, presi: resto, scopa: false, tavoloPrima: resto, presiIds: resto.map(function (c) { return c.id; }), resto: true };
        return "resto";
      }
      fineRound();
      return "fine";
    }
    function fineRound() {
      // le carte rimaste sul tavolo vanno all'ultimo che ha preso
      if (st.tavolo.length && st.ultimaPresa) { st.prese[st.ultimaPresa] = st.prese[st.ultimaPresa].concat(st.tavolo); st.tavolo = []; }
      var p = contaPunti(st.prese.A, st.prese.B);
      var pa = puntiRound(p, st.scope, "A"), pb = puntiRound(p, st.scope, "B");
      st.punti.A += pa; st.punti.B += pb;
      st.ultimoRound = { p: p, scope: { A: st.scope.A, B: st.scope.B }, guad: { A: pa, B: pb }, tot: { A: st.punti.A, B: st.punti.B } };
      if (partitaFinita(st.traguardo, st.punti.A, st.punti.B)) st.fase = "fine";
      else st.fase = "fineround";
    }
    function prossimoRound() {
      if (st.fase !== "fineround") return;
      st.primo = altro(st.primo);
      nuovoRound();
    }
    nuovoRound();
    return {
      st: st, gioca: gioca, prossimoRound: prossimoRound, chiudiPresa: chiudiPresa,
      catture: function (val) { return catture(val, st.tavolo); },
      // la ripresa (l'host ha ricaricato la pagina): la partita com'è (un oggetto semplice) e di nuovo dentro il motore.
      // I nomi restano quelli di chi tiene il motore (sono lo stesso oggetto dell'host)
      esporta: function () { return JSON.parse(JSON.stringify(st)); },
      importa: function (x) { if (x && typeof x === "object") Object.keys(x).forEach(function (k) { if (k !== "nomi") st[k] = x[k]; }); }
    };
  }
  function validaSet(opts, set) {
    for (var i = 0; i < opts.length; i++) if (stessoSet(opts[i], set)) return true;
    return false;
  }
  function stessoSet(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) < 0) return false; return true; }
  function prefisso(opts, set) { // set è sottoinsieme di qualche opt
    for (var i = 0; i < opts.length; i++) { var ok = true; for (var j = 0; j < set.length; j++) if (opts[i].indexOf(set[j]) < 0) { ok = false; break; } if (ok) return true; }
    return false;
  }

  // ---------- bot ----------
  function importanza(c) { return c.id === "D7" ? 12 : c.s === "D" ? 3 : c.v === 7 ? 2.2 : c.v === 6 ? 1.6 : c.v === 1 ? 1.6 : 1; }
  function valoreTavolo(t) { var s = 0; t.forEach(function (c) { s += importanza(c); }); return s; }
  // ---------- bot DIFFICILE: ricorda le carte uscite e guarda una mossa avanti ----------
  // st = stato del motore, pk = chi gioca. Per ogni mossa: quanto guadagno SUBITO
  // meno quanto può guadagnare l'avversario col tavolo che gli lascio, pesando
  // le carte che può avere in mano (solo quelle non ancora uscite).
  // Scala: 1 punto della partita ≈ 8.
  function pesoCarta(c, prese) {
    var nc = prese.length, nd = 0, sette = 0;
    prese.forEach(function (x) { if (x.s === "D") nd++; if (x.v === 7) sette++; });
    var w = nc >= 21 ? 0.05 : 0.32;                                   // punto carte (già vinto a 21)
    if (c.s === "D") w += nd >= 6 ? 0.1 : 0.7;                         // punto denari (già vinto a 6)
    if (c.id === "D7") w += 8;                                         // settebello = 1 punto
    if (c.v === 7) w += sette >= 3 ? 0.3 : 1.1;                        // i 7 decidono la primiera
    else if (c.v === 6) w += 0.55; else if (c.v === 1) w += 0.4; else if (c.v === 5) w += 0.15;
    return w;
  }
  function valorePresa(carta, presi, restano, prese, scopaVale) {
    var s = pesoCarta(carta, prese);
    presi.forEach(function (c) { s += pesoCarta(c, prese); });
    if (restano === 0 && scopaVale) s += 8;
    return s;
  }
  function mossaDifficile(st, pk, mosse) {
    var av = altro(pk), mano = st.mani[pk], tavolo = st.tavolo;
    // carte non ancora viste: non sono nella mia mano, sul tavolo o nelle prese (le prese le vedono tutti)
    var viste = {};
    mano.concat(tavolo, st.prese.A, st.prese.B).forEach(function (c) { viste[c.id] = 1; });
    var ignote = creaMazzo().filter(function (c) { return !viste[c.id]; });
    var perValore = {}; ignote.forEach(function (c) { perValore[c.v] = (perValore[c.v] || 0) + 1; });
    var U = ignote.length;
    var hAvv = st.mani[av].length || (st.mazzo.length > 0 ? 3 : 0);   // se ha finito le carte, gliene arrivano 3 nuove
    function probHa(v) {   // probabilità che l'avversario abbia almeno una carta di valore v
      var u = perValore[v] || 0; if (!u || !hAvv || U <= 0) return 0;
      var p = 1; for (var i = 0; i < hAvv; i++) p *= Math.max(0, (U - u - i)) / (U - i);
      return 1 - p;
    }
    var ultimaMia = st.mazzo.length === 0 && mano.length === 1 && st.mani[av].length === 0;
    if (hAvv && U >= hAvv) return mossaSimulata(st, pk, mosse, ignote, hAvv, ultimaMia);
    return mosse.map(function (m) {
      var tav2 = m.cattura ? tavolo.filter(function (c) { return m.set.indexOf(c.id) < 0; }) : tavolo.concat([m.c]);
      var guadagno = m.cattura ? valorePresa(m.c, m.set.map(function (id) { return trova(tavolo, id); }), tav2.length, st.prese[pk], !ultimaMia) : -0.15 * pesoCarta(m.c, st.prese[pk]);
      // risposta dell'avversario: per ogni valore, la sua presa migliore; poi media pesata (prende la migliore che ha)
      var ultimaSua = st.mazzo.length === 0 && mano.length === 1 && st.mani[av].length === 1;
      var risposte = [];
      for (var v = 1; v <= 10; v++) {
        var p = probHa(v); if (!p) continue;
        var best = 0;
        catture(v, tav2).forEach(function (set) {
          var presi = set.map(function (id) { return trova(tav2, id); });
          var val = valorePresa({ v: v, s: "?", id: "?" }, presi, tav2.length - set.length, st.prese[av], !ultimaSua);
          if (val > best) best = val;
        });
        if (best > 0) risposte.push([best, p]);
      }
      risposte.sort(function (a, b) { return b[0] - a[0]; });
      var perdita = 0, nessunaMigliore = 1;
      risposte.forEach(function (r) { perdita += r[0] * r[1] * nessunaMigliore; nessunaMigliore *= (1 - r[1]); });
      return { m: m, s: guadagno - perdita * 0.9 + Math.random() * 0.05 };
    }).sort(function (a, b) { return b.s - a.s; })[0].m;
  }

  // Simulazione: immagina K mani possibili dell'avversario (tra le carte non uscite);
  // per ognuna: la mia mossa -> la sua risposta migliore -> la mia contromossa migliore.
  function mossaSimulata(st, pk, mosse, ignote, hAvv, ultimaMia) {
    var av = altro(pk), K = 16, tavolo = st.tavolo, mieP = st.prese[pk], sueP = st.prese[av];
    function mosseDi(mano, tav) {   // tutte le giocate possibili di una mano: [carta, set presi | null]
      var r = [];
      mano.forEach(function (c) { var o = catture(c.v, tav); if (o.length) o.forEach(function (s) { r.push([c, s]); }); else r.push([c, null]); });
      return r;
    }
    function applica(tav, c, set) { return set ? tav.filter(function (x) { return set.indexOf(x.id) < 0; }) : tav.concat([c]); }
    function guadagno(tav, c, set, prese, scopaVale) {
      if (!set) return -0.3 * pesoCarta(c, prese);
      return valorePresa(c, set.map(function (id) { return trova(tav, id); }), tav.length - set.length, prese, scopaVale);
    }
    function miglior(mano, tav, prese, scopaVale) {   // presa migliore immediata (0 se nulla di buono)
      var b = 0; mosseDi(mano, tav).forEach(function (g) { var v = guadagno(tav, g[0], g[1], prese, scopaVale); if (v > b) b = v; }); return b;
    }
    // mani avversarie campionate (le stesse per tutte le mie mosse: confronto equo)
    var campioni = [];
    for (var k = 0; k < K; k++) {
      var pool = ignote.slice(), h = [];
      for (var i = 0; i < hAvv; i++) h.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      campioni.push(h);
    }
    var mioResto = function (m) { return st.mani[pk].filter(function (c) { return c.id !== m.c.id; }); };
    var best = null, bs = -1e9;
    mosse.forEach(function (m) {
      var tav1 = applica(tavolo, m.c, m.cattura ? m.set : null);
      var g1 = guadagno(tavolo, m.c, m.cattura ? m.set : null, mieP, !ultimaMia);
      var resto = mioResto(m), tot = 0;
      campioni.forEach(function (hA) {
        var ultimaSua = st.mazzo.length === 0 && resto.length === 0 && hA.length === 1;
        // l'avversario sceglie la risposta migliore per lui (tenendo conto della mia contromossa)
        var bR = -1e9, g3R = 0, best2 = 0;
        mosseDi(hA, tav1).forEach(function (g) {
          var tav2 = applica(tav1, g[0], g[1]);
          var g2 = guadagno(tav1, g[0], g[1], sueP, !ultimaSua);
          var g3 = resto.length ? miglior(resto, tav2, mieP, true) : 0;
          var v = g2 - 0.6 * g3;
          if (v > bR) { bR = v; g3R = g3; best2 = g2; }
        });
        tot += g1 - (bR === -1e9 ? 0 : best2) + 0.7 * g3R;
      });
      var s = tot / K + Math.random() * 0.03;
      if (s > bs) { bs = s; best = m; }
    });
    return best;
  }

  function scegliMossaBot(mano, tavolo, diff, st, pk) {
    var mosse = [];
    mano.forEach(function (c) {
      var opts = catture(c.v, tavolo);
      if (opts.length) opts.forEach(function (set) { mosse.push({ carta: c.id, presa: set, cattura: true, c: c, set: set }); });
      else mosse.push({ carta: c.id, presa: null, cattura: false, c: c, set: [] });
    });
    if (diff === "facile") return mosse[Math.floor(Math.random() * mosse.length)];
    if (diff === "difficile" && st) return mossaDifficile(st, pk, mosse);
    function punteggio(m) {
      var s = 0;
      if (m.cattura) {
        s += importanza(m.c);
        m.set.forEach(function (id) { s += importanza(trova(tavolo, id)); });
        var restano = tavolo.length - m.set.length;
        if (restano === 0) s += 6; // scopa
        if (diff === "difficile") {
          // dopo la presa il tavolo è vuoto: se non è scopa, ok. Rischio: n/a qui.
        }
      } else {
        // scarto: perdo un po', meglio buttare la carta meno utile
        s -= importanza(m.c) * 0.6;
        if (diff === "difficile") {
          // evita di lasciare il tavolo a un totale "pulibile" con una sola carta (rischio scopa avversaria)
          var tot = 0; tavolo.forEach(function (x) { tot += x.v; }); tot += m.c.v;
          var singoloUguale = tavolo.some(function (x) { return x.v === m.c.v; });
          if (tot <= 10 && !singoloUguale) s -= 3; // l'avversario potrebbe fare scopa
        }
      }
      return s;
    }
    var best = mosse[0], bs = -1e9;
    mosse.forEach(function (m) { var s = punteggio(m) + Math.random() * 0.2; if (s > bs) { bs = s; best = m; } });
    return best;
  }

  // ---------- carte (immagini vere: mazzo napoletano di pubblico dominio, Wikimedia Commons) ----------
  var ASP_CARTA = 1.653; // proporzioni delle immagini (altezza/larghezza)
  // larghezza carta perché maxN carte stiano SEMPRE su una riga (tavolo/mano a dimensione fissa,
  // non cambia col numero di carte): si "vede da più lontano" sugli schermi stretti.
  function larghezza(maxN, gap, cap, availW) {
    var A = (availW != null ? availW : Math.min(window.innerWidth || 375, 600) - 46);
    return Math.max(26, Math.min(cap || 70, Math.floor((A - (maxN - 1) * gap) / maxN)));
  }
  // 🤍 BIANCO E ORO — la stanza col tavolo vero resta com'è; barra, targhe, fumetti, avvisi e riepiloghi diventano avorio e oro.
  // Tutto sotto i cartellini dei tre giochi (.g-scopa, .g-scopa2v2, .g-scopone): La Scalinata e Sì però hanno classi con lo stesso prefisso (.sc-, .sp-).
  // I colori sono SOLO le variabili --o-* di css/styles.css (le squadre restano riconoscibili: avversari rosso, tu e compagno verde).
  function stileOro() {
    var G = ":is(.g-scopa,.g-scopa2v2,.g-scopone)", GO = G + ".oro", OMB = "0 3px 8px rgba(0,0,0,.3)";
    function r(sels, body) { return sels.split("|").map(function (x) { return G + " " + x.trim(); }).join(",") + "{" + body + "}"; }     // la stanza (schermata scura)
    function ro(sels, body) { return sels.split("|").map(function (x) { return GO + " " + x.trim(); }).join(",") + "{" + body + "}"; }   // i riepiloghi (schermata chiara)
    return [
      // 🌙 la stanza di notte: pareti blu notte con la luce calda della lampada sul tavolo; tavolo, panno e mensola restano di legno
      r(".sc-scena", "background:radial-gradient(70% 50% at 50% 0%,rgba(255,196,130,.3),rgba(255,196,130,0) 70%),radial-gradient(90% 60% at 50% 100%,rgba(255,79,134,.1),rgba(255,79,134,0) 70%),linear-gradient(#262c55 0%,#181d3a 55%,#0e1124 100%)"),
      r(".sc-quadro", "border-color:#3a3150;opacity:.85"),
      r(".sc-quadro[style*='left:16px']", "background:linear-gradient(135deg,#2b2f6b,#6f5bd0 60%,#ff8fb1)!important"),
      r(".sc-quadro[style*='right:16px']", "background:linear-gradient(135deg,#123a5a,#2fa6c9 60%,#ffd28a)!important"),
      // la barra in alto: punti, mazzo, 💬, 🎵 e il tasto «‹»
      r(".sc-testata > div:first-child | .sc-mazzino", "background:var(--o-carta);color:var(--o-testo);border:1px solid var(--o-filo-oro);box-shadow:" + OMB),
      r(".sc-testata > div:first-child .tenue", "color:var(--o-tenue)"),
      r(".sc-mazzino.ultima", "color:var(--o-oro-testo);border-color:var(--o-oro)"),
      r(".sc-musica | .sgc-tasto", "background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro)," + OMB),
      r(".sgc-tasto i", "background:var(--o-oro)"),
      G + ".schermata.senza-testa > .testa .btn-piccolo{background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro)," + OMB + "}",
      // le targhe dei giocatori: avorio col filo della squadra (avversari rosso, tu e il compagno verde); di turno, un anello d'oro
      r(".sc-targa | .sc-scena .sc-targa | .sc-targa4", "background:var(--o-carta);color:var(--o-testo);border:2px solid var(--o-rosso);box-shadow:" + OMB),
      r(".sc-targa4.mia", "border-color:var(--o-verde)"),
      r(".sc-targa.turno | .sc-scena .sc-targa.turno | .sc-targa4.turno", "border-color:var(--o-rosso);box-shadow:0 0 0 3px var(--o-oro-chiaro),0 0 14px rgba(255,154,74,.7)," + OMB),
      r(".sc-targa4.mia.turno", "border-color:var(--o-verde)"),
      r(".sc-targa .sc-nome | .sc-targa4 .sc-nome", "color:var(--o-testo)"),
      r(".sc-targa-sc", "color:var(--o-oro-testo)"),
      r(".sc-num", "background:var(--o-scuro);color:var(--o-scuro-testo)"),
      // i fumetti, la scritta grande sul tavolo, l'aiuto e gli avvisi che passano
      r(".sc-fumetto", "background:var(--o-carta-piena);color:var(--o-testo);box-shadow:0 0 0 1.5px var(--o-oro-chiaro),0 4px 12px rgba(0,0,0,.35)"),   // (🌙 vetro pieno: i fumetti passano anche sopra le carte bianche)
      r(".sc-fumetto::after", "border-right-color:var(--o-carta-piena)"),
      r(".sc-fumetto.s2-dx::after | .sc-fumetto.sp-dx::after", "border-right-color:transparent;border-left-color:var(--o-carta-piena)"),
      r(".sc-fumetto.scopa", "background:var(--o-tasto);color:var(--o-tasto-testo);box-shadow:0 0 0 1.5px var(--o-oro),0 4px 12px rgba(0,0,0,.35)"),
      r(".sc-fumetto.scopa::after", "border-right-color:var(--o-oro)"),
      r(".sc-fumetto.scopa.s2-dx::after | .sc-fumetto.scopa.sp-dx::after", "border-right-color:transparent;border-left-color:var(--o-oro)"),
      r(".sc-banner", "background:var(--o-carta-piena);color:var(--o-testo);border:2px solid var(--o-oro);box-shadow:0 6px 18px rgba(0,0,0,.4)"),
      r(".sc-banner.scopa", "background:var(--o-tasto);color:var(--o-tasto-testo);border-color:var(--o-oro-chiaro)"),
      r(".sc3-avviso | .s2-avviso | .sp-avviso", "background:var(--o-carta-piena);color:var(--o-testo);border:1.5px solid var(--o-oro);box-shadow:" + OMB),
      // l'aiuto in basso: filo verde («prendi così»), giallo quando è una scopa (come prima: il gioco mette il giallo con style)
      r(".sc-aiuto", "background:var(--o-carta-piena);color:var(--o-testo);border:1.5px solid var(--n-carte);box-shadow:" + OMB),
      r(".sc-avviso-sf", "background:rgba(6,8,18,.7)"),
      r(".sc-avviso", "background:var(--o-carta-piena);color:var(--o-testo);border:1px solid var(--o-filo-oro);box-shadow:var(--o-ombra-alta)"),
      // la mano sulla mensola di legno: il tuo turno è un filo d'oro, «Tocca a te!» una pillola d'oro, la carta scelta un contorno d'oro
      r(".sc-mensola1.tuo", "box-shadow:inset 0 2px 8px rgba(255,255,255,.07),0 -3px 0 var(--o-oro),0 -8px 18px rgba(255,79,134,.4)"),
      r(".sc-tocca | .s2-tocca | .sp-tocca", "background:var(--o-tasto);color:var(--o-tasto-testo);box-shadow:0 2px 6px rgba(0,0,0,.3)"),
      r(".sc-prese", "color:var(--o-testo)"),   // (🌙 sulla mensola di legno: chiaro, il «crema» di prima ora è una tinta lampone quasi trasparente)
      r(".sc-carta.sel", "outline-color:var(--o-oro-chiaro)"),
      r(".sc-carta.presel", "outline-color:var(--n-sfida)"),   // (la carta scelta per la presa resta azzurra, diversa da quella in mano)
      // il foglio delle faccine e le nuvolette (solo Scopa: gli altri giochi che le usano restano com'erano)
      ".sgc-velo:has(.sgc-oro){background:rgba(6,8,18,.55)}",
      ".sgc-foglio.sgc-oro{background:var(--o-carta-piena);color:var(--o-testo);border:1px solid var(--o-filo-oro);box-shadow:var(--o-ombra-alta)}",
      ".sgc-foglio.sgc-oro .sgc-testa{color:var(--o-testo)}",
      ".sgc-foglio.sgc-oro .sgc-x{background:var(--o-fondo-2);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo)}",
      ".sgc-foglio.sgc-oro .sgc-fac button,.sgc-foglio.sgc-oro .sgc-frasi button{background:var(--o-carta-2);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro)}",
      ".sgc-bolla.sgc-oro{background:var(--o-carta-piena);color:var(--o-testo);box-shadow:0 0 0 1.5px var(--o-oro-chiaro),0 4px 14px rgba(0,0,0,.4)}",
      ".sgc-bolla.sgc-oro::after{border-top-color:var(--o-carta-piena)}",   // (🌙 la punta del fumetto era bianca)
      ".sgc-bolla.sgc-oro.giu::after{border-top-color:transparent;border-bottom-color:var(--o-carta-piena)}",
      // i riepiloghi di fine smazzata e fine partita (schermate chiare)
      ro(".sc-rg", "background:var(--o-carta);color:var(--o-testo);border-radius:12px;box-shadow:inset 0 0 0 1px var(--o-filo)"),
      ro(".sc-rg.testa", "background:none;box-shadow:none;color:var(--o-testo)"),
      ro(".sc-rg .vinto", "color:var(--o-verde)"),
      ro(".sc-rg .manca", "opacity:1;color:var(--o-tenue)"),
      ro(".sc-piu", "background:var(--o-verde);color:var(--o-verde-testo)"),
      ro(".sc-rg.tot", "background:var(--o-crema);box-shadow:inset 0 0 0 1px var(--o-filo-oro);font-family:var(--o-tit);font-variant-numeric:lining-nums"),
      ro(".sc-barra", "background:var(--o-fondo-2);box-shadow:inset 0 0 0 1px var(--o-filo)"),
      ro(".sc-detto", "color:var(--o-tenue)")
    ];
  }
  function assicuraStile() {
    if (document.getElementById("sg-scopa-css")) return;
    var st = document.createElement("style");
    st.id = "sg-scopa-css";
    st.textContent = [
      ".sc-carta{position:relative;display:inline-block;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,.45);line-height:0}",
      ".sc-carta img{display:block;border-radius:8px;-webkit-user-drag:none;user-select:none}",
      ".sc-carta.sel{outline:3px solid #ffd43b;outline-offset:2px;transform:translateY(-10px)}",
      ".sc-carta.cap{outline:3px solid #69db7c;outline-offset:2px;cursor:pointer}",
      ".sc-carta.presel{outline:3px solid #4dabf7;outline-offset:2px}",
      ".sc-dorso{border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,.45);background:#b3161d;background-image:radial-gradient(circle at 3px 3px,rgba(255,235,180,.35) 1.1px,transparent 1.6px);background-size:8px 8px;border:2px solid #f2e2be;box-sizing:border-box;display:inline-block}",
      // tasto musichetta di sottofondo
      ".sc-musica{border:0;background:rgba(255,255,255,.10);color:inherit;border-radius:999px;width:34px;height:34px;font-size:1rem;line-height:1;cursor:pointer;-webkit-tap-highlight-color:transparent;padding:0}",
      ".sc-musica:active{transform:scale(.92)}",
      // la carta scartata si posa sul tavolo
      "@keyframes scCade{0%{transform:translateY(-130px) scale(1.08);opacity:0}60%{opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}",
      ".sc-cade{animation:scCade .34s ease-out}",
      // la presa: le carte prese volano via DALLA LORO POSIZIONE verso chi prende (il resto resta fermo)
      "@keyframes scLasciaSu{0%,35%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-210px) scale(.4);opacity:0}}",
      "@keyframes scLasciaGiu{0%,35%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(210px) scale(.4);opacity:0}}",
      ".sc-lascia-su{animation:scLasciaSu .95s ease-in forwards;position:relative;z-index:4}",
      ".sc-lascia-giu{animation:scLasciaGiu .95s ease-in forwards;position:relative;z-index:4}",
      // la carta giocata: arriva dalla mano, si posa al centro, poi vola via con le prese
      "@keyframes scGiocaGiu{0%{transform:translateY(150px) scale(.92);opacity:0}16%{opacity:1}30%,38%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(215px) scale(.4);opacity:0}}",
      "@keyframes scGiocaSu{0%{transform:translateY(-150px) scale(.92);opacity:0}16%{opacity:1}30%,38%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-215px) scale(.4);opacity:0}}",
      // ---- tavolo verde (feltro) + posti dei giocatori + mensola della mano: look condiviso da Scopa, Scopa 2vs2 e Scopone ----
      ".sc-feltro{position:relative;flex:1;display:flex;flex-direction:column;min-height:0;background:radial-gradient(125% 95% at 50% 15%,#2fa268 0%,#1c7b4d 52%,#135c3a 100%);border:2px solid rgba(0,0,0,.35);border-radius:16px;box-shadow:inset 0 2px 16px rgba(0,0,0,.35),0 4px 12px rgba(0,0,0,.3);padding:8px 6px}",
      // mazzo sul tavolo (da cui si distribuisce): pila di dorsi + conteggio, in alto a sinistra
      ".sc-mazzo{position:absolute;top:8px;left:8px;z-index:2;display:flex;flex-direction:column;align-items:center;gap:3px;filter:drop-shadow(0 2px 5px rgba(0,0,0,.45))}",
      ".sc-mazzo .conta{font-size:.64rem;font-weight:800;color:#eafff1;background:rgba(0,0,0,.42);border-radius:999px;padding:1px 6px}",
      ".sc-mazzo.deal{animation:scPulse .5s ease}",
      "@keyframes scPulse{0%,100%{transform:none}42%{transform:scale(1.14) rotate(-3deg)}}",
      // le carte appena distribuite arrivano DAL MAZZO (in alto a sinistra) alla mano
      "@keyframes scDeal{0%{transform:translate(-38%,-220px) scale(.45) rotate(-8deg);opacity:0}45%{opacity:1}100%{transform:none;opacity:1}}",
      ".sc-deal{animation:scDeal .52s cubic-bezier(.2,.72,.3,1) backwards}",
      ".sc-cima{display:flex;justify-content:center;margin-bottom:2px}",
      ".sc-fascia{flex:1;display:flex;align-items:center;justify-content:center;gap:4px;min-height:0}",
      ".sc-terra{flex:1;display:flex;align-items:center;justify-content:center;padding:4px 0;position:relative;min-height:0}",
      ".sc-postobox{display:flex;flex-direction:column;align-items:center;gap:3px}",
      ".sc-postobox.v{width:74px;flex:0 0 auto}",
      ".sc-posto{display:flex;align-items:center;gap:5px;background:rgba(0,0,0,.30);border-radius:999px;padding:3px 9px;max-width:100%}",
      ".sc-nome{font-size:.72rem;font-weight:700;color:#eafff1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:118px}",
      ".sc-postobox.v .sc-nome{max-width:64px;font-size:.68rem}",
      ".sc-posto.rosso .sc-nome{color:#ffd9d9}",
      ".sc-posto.turno{box-shadow:0 0 0 2px #ffd43b,0 0 12px rgba(255,212,59,.55)}",
      ".sc-num{font-size:.64rem;font-weight:800;color:#fff;background:rgba(0,0,0,.35);border-radius:999px;padding:0 5px;min-width:15px;text-align:center}",
      ".sc-manina{display:flex}",
      ".sc-manina.v{flex-direction:column;align-items:center}",
      ".sc-mensola{background:linear-gradient(#6d4526,#472c17);border-radius:14px 14px 0 0;box-shadow:inset 0 2px 8px rgba(255,255,255,.07),0 -2px 8px rgba(0,0,0,.3);padding:9px 6px 8px;margin:6px -4px 0}",
      ".sc-mano-riga{display:flex;gap:8px;justify-content:center;align-items:flex-end;flex-wrap:wrap}",
      ".sc-prese{text-align:center;font-size:.74rem;margin-top:6px;color:rgba(255,255,255,.8)}",
      // ---- la stanza: avversario seduto dietro al tavolo in prospettiva (Scopa 1 contro 1) ----
      ".sc-scena{position:relative;overflow:hidden;border-radius:16px;background:radial-gradient(70% 50% at 50% 0%,rgba(255,214,140,.45),rgba(255,214,140,0) 70%),linear-gradient(#5a3a2a 0%,#3b2519 55%,#24160f 100%);box-shadow:inset 0 0 50px rgba(0,0,0,.55),0 4px 12px rgba(0,0,0,.3)}",
      ".sc-quadro{position:absolute;top:44px;width:54px;height:40px;border:4px solid #8a5a2b;box-shadow:0 4px 10px rgba(0,0,0,.4);opacity:.75}",
      ".sc-targa{position:absolute;left:50%;top:8px;transform:translateX(-50%);z-index:4;display:flex;align-items:center;gap:6px;background:rgba(10,18,50,.85);border:2px solid rgba(255,255,255,.18);border-radius:999px;padding:3px 11px;white-space:nowrap;transition:border-color .3s,box-shadow .3s}",
      ".sc-targa.turno{border-color:#ffd43b;box-shadow:0 0 14px rgba(255,212,59,.6)}",
      ".sc-targa .sc-nome{font-size:.8rem;max-width:140px}",
      ".sc-targa-sc{font-size:.72rem;font-weight:800;color:#ffe58a}",
      ".sc-avv{position:absolute;left:50%;z-index:1}",
      ".sc-avv-fig svg{display:block;width:100%;height:auto}",
      ".sc-avv-carte{position:absolute;left:50%;width:0;height:0;z-index:3}",
      ".sc-avv-carte .sc-dorso{position:absolute;border-radius:5px;transform-origin:50% 120%}",
      ".sc-fumetto{position:absolute;z-index:5;background:#fff;color:#1d2a5e;font-weight:900;border-radius:14px;padding:5px 10px;font-size:.85rem;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.35);transform-origin:0 100%;animation:scFum .28s cubic-bezier(.3,1.6,.5,1)}",
      ".sc-fumetto::after{content:'';position:absolute;left:-6px;bottom:6px;border:7px solid transparent;border-right-color:#fff;border-left:0}",
      ".sc-fumetto.scopa{background:linear-gradient(135deg,#ffe066,#ffb300);color:#3b2400;font-size:1.15rem}",
      ".sc-fumetto.scopa::after{border-right-color:#ffc21a}",
      "@keyframes scFum{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}",
      ".sc-prosp{position:absolute;inset:0;perspective-origin:50% 0%;z-index:2}",
      ".sc-piano{position:absolute;left:50%;bottom:0;transform-origin:50% 100%;border-radius:34px;background:linear-gradient(#6b3f1f,#4a2a14);padding:12px;box-shadow:0 -5px 0 #82502a inset;transform-style:preserve-3d}",
      ".sc-panno{position:relative;width:100%;height:100%;border-radius:24px;background:radial-gradient(90% 70% at 50% 30%,#35b273 0%,#1e8452 55%,#135c3a 100%);box-shadow:inset 0 0 26px rgba(0,0,0,.45);transform-style:preserve-3d}",
      ".sc-terra.sc-t3d{position:absolute;left:3%;right:3%;top:9%;bottom:4%;padding:0;transform-style:preserve-3d}",
      ".schermata.sc-piena{padding:env(safe-area-inset-top) 0 0 0}",
      // chi guarda soltanto: in basso c'è la targhetta del core (alta 44 px + 10): la si lascia libera
      ".schermata.sc-piena.sc-con-targa{padding-bottom:calc(58px + env(safe-area-inset-bottom))}",
      ".sc-piena .sc-scena{border-radius:0;box-shadow:inset 0 0 50px rgba(0,0,0,.55)}",
      ".sc-piena .sc-mensola{margin:0;border-radius:0;padding-bottom:calc(8px + env(safe-area-inset-bottom))}",
      ".sc-testata{position:absolute;left:0;right:0;top:0;z-index:7;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 8px 0 54px;pointer-events:none}",
      ".sc-testata > *{pointer-events:auto}",
      ".sc-testata > div:first-child{background:rgba(10,18,50,.72);border:1.5px solid rgba(255,255,255,.15);border-radius:999px;padding:5px 12px;box-shadow:0 3px 8px rgba(0,0,0,.35)}",
      ".sc-scena .sc-quadro{top:62px}",
      ".sc-scena .sc-targa{top:56px}",
      ".sc-targa4{position:absolute;transform:translate(-50%,-100%);z-index:4;display:flex;align-items:center;gap:4px;background:rgba(10,18,50,.85);border:2px solid rgba(255,255,255,.18);border-radius:999px;padding:2px 8px;white-space:nowrap;font-weight:800;transition:border-color .2s,box-shadow .2s}",
      ".sc-targa4 .sc-nome{font-size:.7rem;max-width:92px;overflow:hidden;text-overflow:ellipsis}",
      ".sc-targa4{background:linear-gradient(180deg,#7a1f2b,#4e0f18);border-color:#ff6b6b}",
      ".sc-targa4.mia{background:linear-gradient(180deg,#1f7a44,#0f4e2a);border-color:#69db7c}",
      ".sc-scena .sc-targa{background:linear-gradient(180deg,#7a1f2b,#4e0f18);border-color:#ff6b6b}",
      ".sc-scena .sc-targa.turno{border-color:#ffd43b;box-shadow:0 0 14px rgba(255,212,59,.6)}",
      ".sc-targa4.turno{border-color:#ffd43b;box-shadow:0 0 12px rgba(255,212,59,.65)}",
      ".sc-aiuto{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:8;max-width:92%;text-align:center;background:rgba(10,18,50,.88);border:1.5px solid #69db7c;color:#fff;font-weight:800;font-size:.85rem;line-height:1.25;padding:6px 12px;border-radius:12px;pointer-events:none}",
      ".sc-panno .sc-mazzo{top:14px;left:16px}",
      // ---- solo Scopa 1 contro 1 ----
      ".sc-punti1{min-width:0;flex:0 1 auto;font-size:.8rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".sc-destra{display:flex;align-items:center;gap:6px;flex:0 0 auto}",
      ".sc-destra .sgc-tasto{width:34px;height:34px;font-size:1rem}",   // il 💬 grande come la musica
      // il mazzo che resta (e "Ultima mano!" quando è finito)
      ".sc-mazzino{display:flex;align-items:center;gap:5px;background:rgba(10,18,50,.72);border:1.5px solid rgba(255,255,255,.15);border-radius:999px;padding:3px 9px 3px 6px;font-size:.72rem;font-weight:800;color:#eafff1;white-space:nowrap;box-shadow:0 3px 8px rgba(0,0,0,.35)}",
      ".sc-mazzino i{display:inline-block;width:10px;height:16px;border-radius:2px;background:#b3161d;border:1.5px solid #f2e2be;box-sizing:border-box}",
      ".sc-mazzino.ultima{border-color:#ffd43b;color:#ffd43b}",
      ".sc-mazzino.ultima i{display:none}",
      // tocca a te: la mensola si illumina e le carte salgono un po'
      ".sc-mensola1{position:relative;transition:box-shadow .3s}",
      ".sc-mensola1.tuo{box-shadow:inset 0 2px 8px rgba(255,255,255,.07),0 -3px 0 #ffd43b,0 -8px 20px rgba(255,212,59,.45)}",
      ".sc-mensola1 .sc-carta{transition:transform .2s,opacity .2s}",
      ".sc-mensola1.tuo .sc-carta{transform:translateY(-4px)}",
      ".sc-mensola1 .sc-carta.sel,.sc-mensola1.tuo .sc-carta.sel{transform:translateY(-12px)}",
      ".sc-mensola1 .sc-carta.inviata{transform:translateY(-22px) scale(.94);opacity:.5}",
      ".sc-tocca{position:absolute;left:50%;top:-12px;transform:translateX(-50%);background:#ffd43b;color:#3b2400;font-weight:900;font-size:.72rem;border-radius:999px;padding:2px 11px;box-shadow:0 2px 6px rgba(0,0,0,.35);pointer-events:none;opacity:0;transition:opacity .25s;white-space:nowrap;z-index:2}",
      ".sc-mensola1.tuo .sc-tocca{opacity:1}",
      // scritte grandi sul tavolo (SCOPA!, carte rimaste, tre Re)
      ".sc-banner{position:absolute;left:50%;top:52%;z-index:8;transform:translate(-50%,-50%);max-width:88%;text-align:center;background:rgba(10,18,50,.9);border:2px solid #ffd43b;color:#fff;font-weight:900;font-size:.95rem;line-height:1.25;padding:8px 14px;border-radius:14px;pointer-events:none;box-shadow:0 6px 18px rgba(0,0,0,.45);animation:scBanner .35s cubic-bezier(.3,1.5,.5,1)}",
      ".sc-banner.scopa{background:linear-gradient(135deg,#ffe066,#ffb300);color:#3b2400;font-size:1.5rem;border-color:#fff3bf}",
      "@keyframes scBanner{from{transform:translate(-50%,-50%) scale(.4);opacity:0}to{transform:translate(-50%,-50%);opacity:1}}",
      ".sc-fumetto.lungo{white-space:normal;font-size:.76rem;line-height:1.2;font-weight:800;max-width:150px}",
      // avviso sopra al tavolo (avversario uscito)
      ".sc-avviso-sf{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}",
      ".sc-avviso{background:#1d2a5e;border:2px solid rgba(255,255,255,.2);border-radius:18px;padding:18px 16px;max-width:330px;width:100%;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.5)}",
      ".sc-avviso p{margin:0 0 14px;font-weight:800;font-size:1.02rem;line-height:1.4}",
      // riepilogo di fine smazzata: le righe arrivano una alla volta
      ".sc-riep{max-width:440px;margin:0 auto}",
      ".sc-rg{display:grid;grid-template-columns:1fr 31% 31%;align-items:center;padding:4px 8px;border-radius:8px;background:rgba(255,255,255,.05);margin-bottom:4px;font-size:.92rem;animation:scRiga .35s ease-out backwards}",
      ".sc-rg > span:not(:first-child){text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".sc-rg.testa{background:none;font-weight:800;font-size:.8rem;padding-top:0;padding-bottom:0}",
      ".sc-rg .vinto{color:#69db7c;font-weight:900}",
      ".sc-rg .manca{font-size:.68rem;opacity:.75}",
      ".sc-piu{display:inline-block;font-size:.66rem;font-weight:900;background:#2b8a3e;color:#fff;border-radius:999px;padding:0 5px;margin-left:4px;vertical-align:1px}",
      ".sc-rg.tot{background:rgba(255,212,59,.12);font-size:1.25rem;font-weight:900}",
      ".sc-barra{height:7px;border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden;margin:0 6px}",
      ".sc-barra b{display:block;height:100%;transform-origin:0 50%;border-radius:99px;transition:transform .8s ease-out .6s}",
      ".sc-detto{text-align:center;font-weight:800;font-size:.9rem;margin-top:8px;animation:scRiga .35s ease-out backwards}",
      // ---- Scopa in tre: il riepilogo con tre colonne e l'avviso di passaggio (uno esce, uno torna) ----
      ".sc3-riep .sc-rg{grid-template-columns:1fr 23% 23% 23%;font-size:.86rem;padding:4px 6px}",
      ".sc3-riep .sc-rg.tot{font-size:1.15rem}",
      ".sc3-avviso{position:absolute;left:50%;top:44px;transform:translateX(-50%);z-index:9;max-width:92%;text-align:center;background:rgba(10,18,50,.92);border:1.5px solid #ffd43b;color:#fff;font-weight:800;font-size:.85rem;padding:6px 12px;border-radius:12px;pointer-events:none;animation:sc3Avviso 3.2s ease forwards}",
      "@keyframes sc3Avviso{0%{opacity:0;transform:translate(-50%,-8px)}10%,85%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-8px)}}",
      "@keyframes scRiga{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}"
    ].concat(stileOro()).join("");
    document.head.appendChild(st);
  }
  function cartaEl(el, carta, w, extra, onclick) {
    var d = el("div", { class: "sc-carta" + (extra ? " " + extra : ""), onclick: onclick || null });
    d.appendChild(el("img", { src: "carte/" + carta.id + ".jpg", width: w, height: Math.round(w * ASP_CARTA), alt: "", draggable: "false" }));
    return d;
  }
  function dorsoEl(el, w) { var h = Math.round(w * ASP_CARTA); return el("div", { class: "sc-dorso", style: "width:" + w + "px;height:" + h + "px" }); }
  // il MAZZO sul tavolo: pila di dorsi (fino a 3) + quante carte restano
  function mazzo(el, n, w) {
    w = w || 26;
    var wrap = el("div", { class: "sc-mazzo" });
    var st = Math.min(3, n), pila = el("div", { style: "position:relative;width:" + (w + (st - 1) * 2) + "px;height:" + (Math.round(w * ASP_CARTA) + (st - 1) * 2) + "px" });
    for (var i = 0; i < st; i++) { var d = dorsoEl(el, w); d.style.position = "absolute"; d.style.left = (i * 2) + "px"; d.style.top = (i * 2) + "px"; pila.appendChild(d); }
    wrap.appendChild(pila);
    wrap.appendChild(el("div", { class: "conta", text: String(n) }));
    return wrap;
  }
  // mazzetto compatto delle carte coperte di un avversario (orizzontale in alto, verticale ai lati)
  function manina(el, n, vert) {
    var wrap = el("div", { class: "sc-manina" + (vert ? " v" : "") });
    var cap = Math.min(n, vert ? 6 : 8), w = vert ? 22 : 20;
    for (var i = 0; i < cap; i++) {
      var d = dorsoEl(el, w);
      if (i > 0) d.style[vert ? "marginTop" : "marginLeft"] = (vert ? -Math.round(w * ASP_CARTA * 0.72) : -Math.round(w * 0.55)) + "px";
      wrap.appendChild(d);
    }
    return wrap;
  }
  // etichetta di un giocatore attorno al tavolo: nome + numero carte + mazzetto coperto (turno = bordo dorato)
  function posto(el, o) {
    var b = el("div", { class: "sc-postobox" + (o.lato ? " v" : "") });
    var chip = el("div", { class: "sc-posto" + (o.mia ? "" : " rosso") + (o.turno ? " turno" : "") });
    chip.appendChild(el("span", { class: "sc-nome", text: o.nome }));
    if (o.n != null) chip.appendChild(el("span", { class: "sc-num", text: o.n }));
    b.appendChild(chip);
    if (o.n > 0) b.appendChild(manina(el, o.n, !!o.lato));
    return b;
  }

  // ---------- avatar dell'avversario seduto al tavolo ----------
  // il bot ha sempre la stessa faccia; online arriva l'avatar vero dell'altro
  var AVATAR_BOT = { forma: "uomo", corpo: "medio", pelle: 2, capelli: "ciuffo", colCap: 1, barba: "corta", capo: "felpa", maglia: 1,
    cappello: "cappellino", colAcc: 0, sopracc: "decise", occhi: "furbi", bocca: "ghigno" };
  var FACCE = {
    normale: {},
    pensa: { occhi: "assonnati", sopracc: "alzate", bocca: "neutro" },
    esulta: { occhi: "felici", sopracc: "alzate", bocca: "sorrisone" },
    triste: { occhi: "dolci", sopracc: "preoccupate", bocca: "smorfia" }
  };
  function mioAvatar(nome) {
    var p = window.SGNube && SGNube.profilo && SGNube.profilo();
    if (p && p.omino) return p.omino;
    return window.SGOmino ? SGOmino.casuale(nome || "io") : null;
  }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  // l'avversario di questa stanza, ricordato sul telefono dell'host: se la pagina dell'host si ricarica (la stanza si
  // riapre con lo stesso codice), per 15 secondi il posto resta a chi giocava, non a chi guardava ed è stato più svelto
  function ricordaAvv(gioco, codice, id) { try { if (codice && codice !== "…") localStorage.setItem("sg-avv-" + gioco, JSON.stringify({ c: codice, id: id || null, t: Date.now() })); } catch (e) {} }
  function riservaAvv(gioco, codice) {
    try { var x = JSON.parse(localStorage.getItem("sg-avv-" + gioco) || "null"); if (x && x.c === codice && x.id && Date.now() - x.t < 20 * 60000) return { id: x.id, fino: Date.now() + 15000 }; } catch (e) {}
    return null;
  }
  function postoRiservato(r, id) { return !!(r && r.id !== id && Date.now() < r.fino); }   // true = questo posto non è (ancora) per lui
  var svgCache = {};   // disegni già pronti (un avatar per espressione): non si rifanno a ogni mossa
  function svgAvatar(cfg, faccia) {
    var k = JSON.stringify(cfg) + "|" + faccia;
    if (!svgCache[k]) {
      var c = {}, x = FACCE[faccia] || {}, n;
      for (n in cfg) c[n] = cfg[n];
      for (n in x) c[n] = x[n];
      svgCache[k] = SGOmino.svg(c);
    }
    return svgCache[k];
  }

  // =====================================================================
  //  STANZA A 4 (Scopa 2 vs 2 e Scopone): compagno di fronte, i due avversari agli angoli del tavolo,
  //  tutti con avatar ed espressioni; tavolo a POSTI FISSI (8 posti, 4 per fila); distribuzione animata.
  // =====================================================================
  var stanzaCorr = {};   // correzione dell'altezza per gioco, misurata sullo schermo vero
  function misureStanza4(gioco, wH, righeMano) {
    var alt = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--alt")) || window.innerHeight || 700;
    var k = alt + "x" + (window.innerWidth || 0), c = stanzaCorr[gioco];
    if (!c || c.k !== k) c = stanzaCorr[gioco] = { k: k, v: 0, fatto: false };
    var scW = Math.min(window.innerWidth || 375, 600);   // la stanza va da bordo a bordo
    var manoH = righeMano * Math.round(wH * ASP_CARTA) + (righeMano - 1) * 6;
    var scH = Math.max(300, Math.min(900, Math.round(alt - (manoH + 52) + c.v)));
    var pianoW = Math.round(scW * 1.14), pianoH = Math.round(scH * 0.6);
    var tavAw = Math.min((pianoW - 24) * 0.94 - 4, scW - 22), tavAh = (pianoH - 24) * 0.87;
    var wT = Math.max(26, Math.min(110, Math.floor((tavAw - 15) / 4), Math.floor((tavAh - 5) / 2 / ASP_CARTA)));
    return { alt: alt, scW: scW, scH: scH, pianoW: pianoW, pianoH: pianoH, tavAw: tavAw, tavAh: tavAh, wT: wT, corr: c };
  }
  // dopo il montaggio: se avanza o manca spazio sotto la mensola, rifà subito la stanza della misura giusta (una volta per schermo)
  function correggiStanza4(M, sch, mensola, rifai) {
    if (M.corr.fatto) return false;
    // (misurato sulla schermata, non su tutta la pagina: pillole, la schermata di prima che esce o altro non falsano il conto)
    var rS = sch.getBoundingClientRect(), padB = parseFloat(getComputedStyle(sch).paddingBottom) || 0;
    if (!(rS.height > 0)) return false;   // (non ancora sullo schermo: si misura la volta dopo)
    M.corr.fatto = true;
    var trabocca = Math.max(0, sch.offsetTop + sch.offsetHeight - M.alt);
    var avanza = Math.floor((rS.bottom - padB - mensola.getBoundingClientRect().bottom) - trabocca);
    if (Math.abs(avanza) > 3) { M.corr.v += avanza; rifai(); return true; }
    return false;
  }
  // dopo il primo disegno con le carte (la mensola può crescere di qualche pixel col testo sotto la mano): se la
  // schermata esce ancora dallo schermo, la stanza si accorcia una volta (true = da rifare). Una volta per schermo.
  function ricontrollaStanza4(M, sch) {
    if (!M.corr.fatto || M.corr.ri || !sch || !(sch.offsetHeight > 0)) return false;
    M.corr.ri = true;
    var trabocca = sch.offsetTop + sch.offsetHeight - M.alt;
    if (trabocca > 1) { M.corr.v -= Math.ceil(trabocca); return true; }
    return false;
  }
  // posti fissi: stato = { idCarta: posto } che il gioco conserva fra un disegno e l'altro
  function postiTavolo(stato, carte, M) {
    var ids = {}, k, occ = {};
    carte.forEach(function (c) { ids[c.id] = true; });
    for (k in stato) if (!ids[k]) delete stato[k];   // chi è andato via libera il posto (gli altri NON si muovono)
    for (k in stato) occ[stato[k]] = true;
    carte.forEach(function (c) { if (stato[c.id] != null) return; var p = 0; while (occ[p]) p++; stato[c.id] = p; occ[p] = true; });
    var maxP = 0; for (k in stato) maxP = Math.max(maxP, stato[k] + 1);
    var col = 4, righe = Math.ceil(Math.max(8, maxP) / col), w = M.wT;
    if (righe > 2) w = Math.max(26, Math.min(w, Math.floor((M.tavAh - (righe - 1) * 5) / righe / ASP_CARTA)));   // solo con 9+ carte
    return {
      w: w,
      griglia: function (el) { return el("div", { style: "display:grid;grid-template-columns:repeat(" + col + "," + w + "px);grid-template-rows:repeat(" + righe + "," + Math.round(w * ASP_CARTA) + "px);gap:5px;justify-content:center;align-content:center;height:100%" }); },
      metti: function (cel, id) { var p = stato[id] || 0; cel.style.gridColumn = (p % col + 1); cel.style.gridRow = (Math.floor(p / col) + 1); return cel; }
    };
  }
  // i bot hanno sempre la stessa faccia: Bot la sua, gli altri stabili dal nome (e donna se il nome è da donna)
  var BOT_DONNA = { Giulia: "coda", Rosa: "riccilunghi" }, BOT_UOMO = { Toni: "spettinati", Peppe: "stempiato" };
  function facciaBot(nome) {
    if (nome === "Bot") return AVATAR_BOT;
    if (!window.SGOmino) return null;
    var c = SGOmino.casuale(nome);
    if (BOT_DONNA[nome]) { c.forma = "donna"; c.barba = "no"; c.capelli = BOT_DONNA[nome]; }
    else if (BOT_UOMO[nome]) { c.forma = "uomo"; c.capelli = BOT_UOMO[nome]; c.orecchini = "nessuno"; if (/^(fiocco|mollette|cerchietto)$/.test(c.cappello)) c.cappello = "nessuno"; c.trucco = "nessuno"; c.ombretto = c.eyeliner = c.mascara = c.rossetto = c.blush = "nessuno"; if (/^(gonna|minigonna|gonnapieghe|gonnatubino|gonnalunga)$/.test(c.sotto)) c.sotto = "jeans"; }
    return c;
  }
  // la stanza: sedie = [sinistra, compagno (di fronte), destra], ognuna { cfg, nome, n, turno, mia, faccia, fumetto }
  function stanza4(el, M, sedie) {
    var scena = el("div", { class: "sc-scena", style: "height:" + M.scH + "px" });
    scena.appendChild(el("div", { class: "sc-quadro", style: "left:16px;top:62px;background:linear-gradient(135deg,#3f6b8f,#9cc4d9 60%,#e7d9a8)" }));
    scena.appendChild(el("div", { class: "sc-quadro", style: "right:16px;top:62px;background:linear-gradient(135deg,#8f3f5c,#e3a26b 60%,#f2e3b5)" }));
    var posti = sedie.map(function (p) {
      var cfg = p.cfg || facciaBot(p.nome);
      var box = el("div", { class: "sc-avv" + (p.faccia === "pensa" ? " pensa" : "") }), fig = el("div", { class: "sc-avv-fig", html: cfg && window.SGOmino ? svgAvatar(cfg, p.faccia || "normale") : "" });
      box.appendChild(fig);
      if (p.fumetto) box.appendChild(el("div", { class: "sc-fumetto" + (p.faccia === "esulta" ? " scopa" : ""), text: p.fumetto }));
      var targa = el("div", { class: "sc-targa4" + (p.turno ? " turno" : "") + (p.mia ? " mia" : "") }, [
        el("span", { class: "sc-nome", text: (p.mia ? "🤝 " : "") + p.nome }), el("span", { class: "sc-num", text: p.n }) ]);
      var vent = el("div", { class: "sc-avv-carte" });
      for (var i = 0; i < p.n; i++) vent.appendChild(el("div", { class: "sc-dorso" }));
      scena.appendChild(vent); scena.appendChild(box); scena.appendChild(targa);
      return { box: box, fig: fig, targa: targa, vent: vent, p: p };
    });
    var prosp = el("div", { class: "sc-prosp", style: "perspective:" + Math.max(600, Math.round(M.scH * 1.15)) + "px" });
    var piano = el("div", { class: "sc-piano", style: "width:" + M.pianoW + "px;height:" + M.pianoH + "px;margin-left:" + (-M.pianoW / 2) + "px;transform:rotateX(54deg)" });
    var feltro = el("div", { class: "sc-panno" });
    piano.appendChild(feltro); prosp.appendChild(piano); scena.appendChild(prosp);
    var xs = sedie.xs || [0.2, 0.5, 0.8];   // dove siedono (in parte della larghezza): a 4 sinistra, di fronte, destra; in tre due sedie
    function siedi() {   // dopo il montaggio: ognuno seduto con la vita al bordo lontano del tavolo
      var bordo = piano.getBoundingClientRect().top - scena.getBoundingClientRect().top, sw = scena.clientWidth;
      var w = Math.max(70, Math.min(Math.round(sw * 0.34), 150, Math.round((bordo + 6 - 30) / 0.975)));
      posti.forEach(function (s, i) {
        var cx = Math.round(sw * xs[i]), top = Math.round(bordo + 6 - w * 0.975);
        s.box.style.width = w + "px"; s.box.style.left = (cx - w / 2) + "px"; s.box.style.marginLeft = "0"; s.box.style.top = top + "px";
        s.targa.style.left = cx + "px"; s.targa.style.top = Math.round(top + w * 0.1) + "px";
        var cw = Math.round(w * 0.16), ch = Math.round(cw * ASP_CARTA), n = s.vent.children.length, ang = n > 5 ? 6 : 12;
        s.vent.style.left = cx + "px"; s.vent.style.top = Math.round(top + w * 0.76) + "px";
        [].forEach.call(s.vent.children, function (d, k) {
          var a = (k - (n - 1) / 2) * ang;
          d.style.width = cw + "px"; d.style.height = ch + "px"; d.style.left = (-cw / 2) + "px";
          d.style.transform = "translateX(" + (a * 1.1) + "px) rotate(" + a + "deg)";
        });
        var fm = s.box.querySelector(".sc-fumetto");
        if (fm) { fm.style.left = Math.round(w * (xs[i] > 0.6 ? 0.05 : 0.7)) + "px"; fm.style.top = Math.round(w * 0.15) + "px"; }
        if (s.p.faccia === "esulta" && s.p.salta && s.fig.animate) s.fig.animate([{ transform: "none" }, { transform: "translateY(-18px)" }, { transform: "none" }], { duration: 650, easing: "ease-out" });
      });
    }
    // gli altri guardano chi deve giocare (solo gli occhi): verso la sedia di turno, o in basso se tocca a te
    var diTurno = -1; sedie.forEach(function (p, i) { if (p.turno) diTurno = i; });
    posti.forEach(function (s, i) {
      var oc = s.fig.querySelector(".om-occhi"); if (!oc || s.p.turno) return;
      var dx = diTurno < 0 ? 0 : (diTurno > i ? 3 : (diTurno < i ? -3 : 0)), dy = diTurno < 0 && sedie.ioTurno ? 2.5 : 0;
      if (dx || dy) oc.style.translate = dx + "px " + dy + "px";
    });
    return { scena: scena, feltro: feltro, siedi: siedi, posti: posti };
  }
  // distribuzione come dal vero: prima le carte nuove in tavola, poi a giro (tu, poi gli altri tre nell'ordine delle sedie).
  // Restituisce quando finisce (ms dal momento della chiamata), così i bot aspettano.
  function animaDistribuzione4(nuoveTav, manoEls, dorsiPerSedia, feltro, passo) {
    var t0 = 0;
    nuoveTav.forEach(function (cel, i) {
      if (!cel.animate) return;
      cel.animate([{ translate: "0 -120px", scale: "0.5", opacity: 0 }, { translate: "0 0", scale: "1", opacity: 1 }],
        { duration: 420, delay: i * 200, easing: "cubic-bezier(.2,.7,.3,1)", fill: "backwards" });
    });
    if (nuoveTav.length) t0 = nuoveTav.length * 0.2 + 0.2;
    var fr = feltro.getBoundingClientRect(), ox = fr.left + fr.width / 2, oy = fr.top + fr.height * 0.4;
    function vola(e, rit) {
      if (!e || !e.animate) return;
      var r = e.getBoundingClientRect();
      e.animate([{ translate: Math.round(ox - (r.left + r.width / 2)) + "px " + Math.round(oy - (r.top + r.height / 2)) + "px", scale: "0.4", opacity: 0 },
        { opacity: 1, offset: 0.25 }, { translate: "0 0", scale: "1", opacity: 1 }], { duration: 420, delay: rit * 1000, easing: "cubic-bezier(.2,.7,.3,1)", fill: "backwards" });
    }
    var n = manoEls.length; dorsiPerSedia.forEach(function (d) { n = Math.max(n, d.length); });
    var giro = 1 + dorsiPerSedia.length;
    for (var k = 0; k < n; k++) {
      vola(manoEls[k], t0 + (k * giro) * passo);
      dorsiPerSedia.forEach(function (d, j) { vola(d[k], t0 + (k * giro + 1 + j) * passo); });
    }
    return (t0 + n * giro * passo) * 1000 + 450;
  }

  // ---------- battute di Bot nei fumetti (la lista lunga è in data/scopa-battute.js; qui poche di riserva) ----------
  var BATTUTE_BASE = {
    pensa: ["Mmh… e mo' che butto?", "Aspetta, fammi pensà…"],
    prende: ["Chesta è 'a mia!", "Vieni a papà!"],
    settebello: ["Settebello, viene a papà!"],
    scopa: ["Scopa! Pulito pulito!"],
    subisce: ["Mannaggia!", "Questa me la lego al dito."],
    vince: ["Ho vinto! Rivincita?"],
    perde: ["Complimenti, hai vinto tu!"],
    pari: ["Pari e patta: nessuno piange!"]
  };
  function numeroDa(s) { var h = 7; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  // la stessa situazione dà sempre la stessa battuta (ridisegnando non cambia, e chi guarda vede la stessa)
  function battuta(momento, seme) {
    var L = (window.SG_SCOPA_BATTUTE && window.SG_SCOPA_BATTUTE[momento]) || BATTUTE_BASE[momento] || [];
    return L.length ? L[numeroDa(momento + seme) % L.length] : null;
  }
  // "Uscire dalla partita?" con la finestra al centro dell'app (mai quella del browser)
  function chiediEsci(t, fn, dom) { dom = dom || "Uscire dalla partita?"; if (t && t.conferma) t.conferma(dom, fn); else if (window.confirm(dom)) fn(); }
  function corto(n, max) { n = String(n == null ? "" : n); return n.length > max ? n.slice(0, max - 1) + "…" : n; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // ---------- vista (uguale per bot/host/ospite) ----------
  // vm = { fase, io("A"|"B"), turno, nomi, mano:[carte], oppN, tavolo:[carte], mazzoN,
  //        preseIo, preseOpp, scopeIo, scopeOpp, settebelloIo, settebelloOpp,
  //        punti:{io,opp}, ultimoRound, presa:{mio,carta,presi,scopa,resto}|null, vincitoreIo,
  //        idPartita, nRound, rifatta, bot (contro il computer), idB (id dell'ospite online) }
  // C = { vm, sel:{carta,presa}, disegna, uscito } ; cb = { onMossa(id,presa|null), onAvanti, onEsci, sonoHost, guarda... }
  var scSlot = {};   // id carta in tavola -> numero del suo posto (resta fermo finché non viene presa)
  var scCorr = { k: null, v: 0 };   // correzione dell'altezza della stanza, misurata sullo schermo vero
  var scMount = null; // la stanza già montata: si aggiorna SOLO quello che cambia (niente lampeggio)

  // girato il telefono o cambiata l'altezza dello schermo: la stanza si rifà subito della misura giusta
  var scGiraT = null;
  window.addEventListener("resize", function () {
    clearTimeout(scGiraT);
    scGiraT = setTimeout(function () {
      var m = scMount;
      if (m && m.C && !m.C.uscito && m.C.vm && m.C.vm.fase === "gioco" && document.body.contains(m.s)) m.C.disegna();
    }, 250);
  });

  function misureScopa(sotto) {   // sotto: px in più sotto la mensola (la fila delle faccine di chi guarda)
    sotto = sotto || 0;
    var wH = larghezza(3, 10, 104);   // mano max 3
    var scW = Math.min(window.innerWidth || 375, 600);   // la stanza va da bordo a bordo
    // altezza della stanza: TUTTO lo spazio che resta sullo schermo vero (--alt), poi corretta misurando dopo il montaggio
    var alt = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--alt")) || window.innerHeight || 700;
    var chiave = alt + "x" + (window.innerWidth || 0) + (sotto ? "f" + sotto : "");
    if (scCorr.k !== chiave) scCorr = { k: chiave, v: 0 };
    var scH = Math.max(300, Math.min(900, Math.round(alt - (Math.round(wH * ASP_CARTA) + 52 + sotto) + scCorr.v)));
    var pianoW = Math.round(scW * 1.14), pianoH = Math.round(scH * 0.7);
    return { wH: wH, scW: scW, alt: alt, scH: scH, pianoW: pianoW, pianoH: pianoH, k: chiave + "|" + scCorr.v, sotto: sotto,
      tavAw: Math.min((pianoW - 24) * 0.94 - 4, scW - 22), tavAh: (pianoH - 24) * 0.87 };
  }

  // la stanza si costruisce UNA volta (avversario, quadri, tavolo, mensola); poi si aggiornano solo i pezzi
  function montaScopa(t, C, cb, Mi) {
    var el = t.el, m = { C: C, k: Mi.k, Mi: Mi, tav: {}, mano: {}, prevMano: 0 };
    var box = el("div", { style: "display:flex;flex-direction:column" });
    var head = el("div", { class: "sc-testata" });   // punteggio, mazzo e musica DENTRO la stanza (a sinistra c'è il tasto indietro)
    m.punti = el("div", { class: "sc-punti1" });
    m.mazzino = el("div", { class: "sc-mazzino" });
    head.appendChild(m.punti);
    var destra = el("div", { class: "sc-destra" }, [m.mazzino]);
    // 💬 faccine e frasi (chi guarda il torneo: solo faccine); si vede solo quando si può usare (vedi renderScopa)
    m.chiac = cb.onChiac ? window.SGChiacchiere.tasto({ gioco: "scopa", soloFaccine: !!cb.guarda, onScegli: function (c) { cb.onChiac(c); } }) : null;
    if (m.chiac) { m.chiac.hidden = true; destra.appendChild(m.chiac); }
    if (window.SGMusica && !cb.guarda) destra.appendChild(window.SGMusica.bottone(el));
    head.appendChild(destra);
    var scena = el("div", { class: "sc-scena", style: "height:" + Mi.scH + "px" });
    scena.appendChild(head);
    scena.appendChild(el("div", { class: "sc-quadro", style: "left:16px;background:linear-gradient(135deg,#3f6b8f,#9cc4d9 60%,#e7d9a8)" }));
    scena.appendChild(el("div", { class: "sc-quadro", style: "right:16px;background:linear-gradient(135deg,#8f3f5c,#e3a26b 60%,#f2e3b5)" }));
    m.targaNome = el("span", { class: "sc-nome" }); m.targaNum = el("span", { class: "sc-num" }); m.targaSc = el("span", { class: "sc-targa-sc" });
    m.targa = el("div", { class: "sc-targa" }, [m.targaNome, m.targaNum, m.targaSc]);
    scena.appendChild(m.targa);
    m.ventaglio = el("div", { class: "sc-avv-carte" }); scena.appendChild(m.ventaglio);
    m.avv = el("div", { class: "sc-avv" }); m.avvFig = el("div", { class: "sc-avv-fig" }); m.avv.appendChild(m.avvFig); scena.appendChild(m.avv);
    var prosp = el("div", { class: "sc-prosp", style: "perspective:" + Math.max(600, Math.round(Mi.scH * 1.15)) + "px" });
    m.piano = el("div", { class: "sc-piano", style: "width:" + Mi.pianoW + "px;height:" + Mi.pianoH + "px;margin-left:" + (-Mi.pianoW / 2) + "px;transform:rotateX(54deg)" });
    var feltro = el("div", { class: "sc-panno" });
    m.area = el("div", { class: "sc-terra sc-t3d" });
    m.griglia = el("div", { style: "display:grid;gap:5px;justify-content:center;align-content:center;height:100%" });
    m.area.appendChild(m.griglia); feltro.appendChild(m.area);
    m.piano.appendChild(feltro); prosp.appendChild(m.piano); scena.appendChild(prosp);
    m.feltro = feltro; m.scena = scena;
    m.aiuto = el("div", { class: "sc-aiuto" }); m.aiuto.hidden = true; scena.appendChild(m.aiuto);
    box.appendChild(scena);
    m.mensola = el("div", { class: "sc-mensola sc-mensola1", style: "min-height:" + (Math.round(Mi.wH * ASP_CARTA) + 34) + "px" });
    m.tocca = el("div", { class: "sc-tocca" });
    m.manoRiga = el("div", { class: "sc-mano-riga" });
    m.prese = el("div", { class: "sc-prese" });
    m.mensola.appendChild(m.tocca); m.mensola.appendChild(m.manoRiga); m.mensola.appendChild(m.prese);
    box.appendChild(m.mensola);
    // chi è in più e guarda (stanza online, o chi guarda il torneo a eliminazione): sotto la mensola la fila delle faccine.
    // Chi guarda soltanto fuori dal torneo ha la targhetta del core in basso: al suo posto uno spazio vuoto
    m.fa = null;
    if (Mi.sotto && Mi.fila && t.faccine) { var fa = t.faccine(); if (fa) { fa.style.margin = "6px 8px 0"; box.appendChild(fa); m.fa = fa; } }
    else if (Mi.sotto && !Mi.fila) { m.fa = el("div", { class: "sc-posto-targa", style: "flex:0 0 auto;height:" + Mi.sotto + "px" }); box.appendChild(m.fa); }
    var s = t.schermata({ scura: true, indietro: function () { if (cb.guarda) cb.onEsci(); else chiediEsci(t, cb.onEsci); } });   // (scura: la stanza col tavolo vero)
    s.classList.add("sc-piena");   // stanza da bordo a bordo
    s._contenuto.appendChild(box);
    m.s = s;
    t.mostra(s);
    // l'avversario seduto: il bordo lontano del tavolo gli arriva in vita
    var bordo = m.piano.getBoundingClientRect().top - scena.getBoundingClientRect().top;
    var w = Math.max(90, Math.min(Math.round(Mi.scW * 0.46), 190, Math.round((bordo + 6 - 22) / 0.975)));
    m.avvW = w; m.cw = Math.round(w * 0.17);
    m.avv.style.width = w + "px"; m.avv.style.marginLeft = (-w / 2) + "px";
    m.avv.style.top = Math.round(bordo + 6 - w * 0.975) + "px";
    m.ventaglio.style.top = Math.round(bordo + 6 - w * 0.975 + w * 0.76) + "px";
    // tocchi: guardano lo stato di adesso (le carte restano le stesse fra un disegno e l'altro)
    m.aspetta = function () {   // tocco quando non è il tuo turno
      var vm = C.vm; if (cb.guarda || !vm || vm.fase !== "gioco") return;
      m.aiutoTemp = C.inviata ? "Carta giocata, un attimo…" : (vm.turno !== vm.io && vm.oppN ? "Aspetta: tocca a " + vm.nomi.opp : "Aspetta un attimo…");
      clearTimeout(m.aiutoT); m.aiutoT = setTimeout(function () { m.aiutoTemp = null; aggiornaAiuto(m); }, 1600);
      aggiornaAiuto(m);
    };
    return m;
  }
  function aggiornaAiuto(m) {
    var txt = m.aiutoTemp || m.aiutoFisso || null;
    if (txt) { if (m.aiuto.textContent !== txt) m.aiuto.textContent = txt; m.aiuto.hidden = false; }
    else m.aiuto.hidden = true;
  }
  function misuraCarta(cel, w) {   // cambia misura solo se serve (9+ carte in tavola)
    if (cel._w === w) return;
    cel._w = w; var img = cel.firstChild;
    if (img) { img.setAttribute("width", w); img.setAttribute("height", Math.round(w * ASP_CARTA)); }
  }
  function sceltaBanner(m, txt, cls) {   // le scritte grandi sul tavolo: si rifanno solo quando cambiano
    if (m.bannerTxt === txt) return;
    m.bannerTxt = txt;
    if (m.banner) { m.banner.remove(); m.banner = null; }
    if (txt) { m.banner = m.C._el("div", { class: "sc-banner" + (cls || ""), text: txt }); m.scena.appendChild(m.banner); }
  }

  function renderScopa(t, C, cb) {
    if (C.uscito) return;
    assicuraStile();
    if (window.SGMusica && !cb.guarda) window.SGMusica.avvia(function () { return !C.uscito && !!C._schermo && document.body.contains(C._schermo); });   // chi guarda non ha suoni
    // sotto la mensola: la fila delle faccine (chi è in più nella stanza; chi guarda il torneo a eliminazione) o il posto
    // della targhetta del core (chi guarda soltanto, fuori dal torneo: le faccine sono nel suo 😂)
    var targa = !!(cb.guarda && !cb.spettatore && t.guarda && !t.eliminazione), fila = !!((cb.spettatore || (cb.guarda && t.guarda && !targa)) && t.faccine);
    var el = t.el, vm = C.vm, Mi = misureScopa(fila ? 50 : (targa ? 56 : 0));
    Mi.fila = fila;
    var chiaveRound = vm.idPartita + ":" + vm.nRound;
    var m = scMount, nuovo = !(m && m.C === C && m.k === Mi.k && document.body.contains(m.s));
    if (nuovo) {
      var vecchio = m;
      m = scMount = montaScopa(t, C, cb, Mi);
      if (vecchio && vecchio.C === C && vecchio.round === chiaveRound) m.prevMano = vecchio.prevMano;   // rifatta per un giro del telefono: niente distribuzione
    }
    C._schermo = m.s;
    var mioTurno = !cb.guarda && vm.turno === vm.io && vm.fase === "gioco" && !vm.presa && !C.inviata && vm.mano.length > 0;
    var suoTurno = vm.turno === vm.io && vm.fase === "gioco" && !vm.presa && vm.mano.length > 0;   // (anche per chi guarda)
    var oppTurno = vm.turno !== vm.io && vm.fase === "gioco" && !vm.presa && vm.oppN > 0;
    m.mioTurno = mioTurno;

    // ---- in alto: punti, mazzo che resta ----
    var pTxt = (cb.guarda ? "👀 " : "") + "<b>" + esc(corto(vm.nomi.io, 9)) + " " + vm.punti.io + "</b> — " + esc(corto(vm.nomi.opp, 9)) + " " + vm.punti.opp +
      " <span class='tenue' style='font-weight:600'>(" + testoTraguardo(vm.traguardo) + ")</span>";
    if (m.pTxt !== pTxt) { m.pTxt = pTxt; m.punti.innerHTML = pTxt; }
    var ultima = !vm.mazzoN && (vm.mano.length || vm.oppN);
    if (m.chiac) { var chOn = cb.locale ? !!vm.bot : vm.ch === 1; if (m.chiac.hidden === chOn) m.chiac.hidden = !chOn; }   // 💬 (online: se l'host le ha lasciate accese)
    var mzTxt = vm.mazzoN ? "<i></i>" + vm.mazzoN : (ultima ? "Ultima mano!" : "<i></i>0");
    if (m.mzTxt !== mzTxt) { m.mzTxt = mzTxt; m.mazzino.innerHTML = mzTxt; m.mazzino.className = "sc-mazzino" + (ultima ? " ultima" : ""); m.mazzino.title = vm.mazzoN ? "Carte rimaste nel mazzo" : ""; }

    // ---- l'avversario: targa, faccia, fumetto, carte in mano ----
    m.targaNome.textContent = corto(vm.nomi.opp, 16);
    m.targaNum.textContent = vm.oppN;
    m.targaSc.textContent = vm.scopeOpp ? "🧹 " + vm.scopeOpp : "";
    m.targaSc.hidden = !vm.scopeOpp;
    m.targa.classList.toggle("turno", oppTurno);
    var chiavePresa = vm.presa ? (vm.presa.carta ? vm.presa.carta.id : "resto") + ":" + (vm.presa.presiIds || []).join(",") : null;
    var faccia = "normale", fumetto = null;
    if (vm.presa && vm.presa.scopa) {
      faccia = vm.presa.mio ? "triste" : "esulta";
      if (!vm.presa.mio) fumetto = "🧹 " + (vm.bot ? battuta("scopa", chiavePresa) : "SCOPA!");
      else if (vm.bot) fumetto = battuta("subisce", chiavePresa);
    } else if (vm.presa && !vm.presa.resto) {
      var conSette = vm.presa.carta.id === "D7" || (vm.presa.presi || []).some(function (c) { return c.id === "D7"; });
      if (!vm.presa.mio && conSette) { faccia = "esulta"; if (vm.bot) fumetto = battuta("settebello", chiavePresa); }
      else if (vm.presa.mio && conSette) faccia = "triste";
      else if (!vm.presa.mio && vm.bot && numeroDa(chiavePresa) % 2 === 0) fumetto = battuta("prende", chiavePresa);
    } else if (oppTurno) {
      faccia = "pensa";
      var chiavePensa = chiaveRound + ":" + vm.mazzoN + ":" + vm.oppN + ":" + vm.tavolo.length;
      fumetto = vm.bot && numeroDa(chiavePensa) % 3 === 0 ? battuta("pensa", chiavePensa) : "🤔";
    }
    var cfgAvv = (vm.avatar && vm.avatar.opp) || (window.SGOmino ? SGOmino.casuale(vm.nomi.opp) : null);
    if (cfgAvv && window.SGOmino) {
      var kF = JSON.stringify(cfgAvv) + "|" + faccia;
      if (m.facciaK !== kF) { m.facciaK = kF; m.avvFig.innerHTML = svgAvatar(cfgAvv, faccia); }
      m.avv.classList.toggle("pensa", faccia === "pensa");
    }
    if (m.fumTxt !== fumetto) {
      m.fumTxt = fumetto;
      if (m.fum) { m.fum.remove(); m.fum = null; }
      if (fumetto) {
        var lungo = fumetto.length > 4;
        m.fum = el("div", { class: "sc-fumetto" + (faccia === "esulta" && /🧹/.test(fumetto) ? " scopa" : "") + (lungo ? " lungo" : ""), text: fumetto });
        m.fum.style.left = Math.round(m.avvW * 0.74) + "px"; m.fum.style.top = Math.round(m.avvW * (lungo ? 0.08 : 0.2)) + "px";
        if (lungo) m.fum.style.maxWidth = Math.max(110, Math.round(Mi.scW / 2 - m.avvW * 0.24 - 10)) + "px";
        m.avv.appendChild(m.fum);
      }
    }
    // la scopa (o il settebello) dell'avversario: salta dalla gioia (una volta sola per presa)
    if (faccia === "esulta" && chiavePresa !== m.salto && m.avvFig.animate) {
      m.salto = chiavePresa;
      m.avvFig.animate([{ transform: "none" }, { transform: "translateY(-22px)" }, { transform: "none" }, { transform: "translateY(-10px)" }, { transform: "none" }], { duration: 800, easing: "ease-out" });
    }
    var nuoviDorsi = [], v = m.ventaglio;
    while (v.children.length > vm.oppN) v.removeChild(v.lastChild);
    while (v.children.length < vm.oppN) { var dd = el("div", { class: "sc-dorso" }); v.appendChild(dd); nuoviDorsi.push(dd); }
    var ch = Math.round(m.cw * ASP_CARTA);
    [].forEach.call(v.children, function (d, i) {
      var ang = (i - (vm.oppN - 1) / 2) * 13;
      d.style.width = m.cw + "px"; d.style.height = ch + "px"; d.style.left = (-m.cw / 2) + "px";
      d.style.transform = "translateX(" + (ang * 1.1) + "px) rotate(" + ang + "deg)";
    });

    // ---- il tavolo: POSTI FISSI, ogni carta resta nel suo posto finché non viene presa (niente carte che "saltano") ----
    var carteTav = (vm.presa && vm.presa.tavoloPrima ? vm.presa.tavoloPrima : vm.tavolo), idsTav = {};
    carteTav.forEach(function (c) { idsTav[c.id] = true; });
    for (var sid in scSlot) if (!idsTav[sid]) delete scSlot[sid];   // le carte andate via liberano il posto
    var occupati = {}; for (sid in scSlot) occupati[scSlot[sid]] = true;
    carteTav.forEach(function (c) {
      if (scSlot[c.id] != null) return;
      var p = 0; while (occupati[p]) p++;
      scSlot[c.id] = p; occupati[p] = true;
    });
    var maxPosto = 0; for (sid in scSlot) maxPosto = Math.max(maxPosto, scSlot[sid] + 1);
    var nPosti = Math.max(8, maxPosto);
    // carte in tavola: grandezza FISSA (8 posti, 4 per fila, 2 file); solo con 9 o più si rimpiccioliscono quanto basta
    var wT = Math.min(110, Math.floor((Mi.tavAw - 15) / 4), Math.floor((Mi.tavAh - 5) / 2 / ASP_CARTA));
    if (carteTav.length > 8) {
      for (var pr = 1, best = 0; pr <= carteTav.length; pr++) {
        var rr = Math.ceil(carteTav.length / pr), ww = Math.min(110, Math.floor((Mi.tavAw - (pr - 1) * 5) / pr), Math.floor((Mi.tavAh - (rr - 1) * 5) / rr / ASP_CARTA));
        if (ww > best) best = ww;
      }
      wT = Math.min(wT, best);
    }
    wT = Math.max(26, wT);
    var maxFila = Math.max(1, Math.floor((Mi.tavAw + 5) / (wT + 5)));
    var colT = nPosti <= 8 ? Math.min(4, maxFila) : Math.min(maxFila, Math.ceil(nPosti / Math.ceil(nPosti / maxFila)));
    var righeT = Math.ceil(nPosti / colT);
    var gK = colT + "x" + righeT + "x" + wT;
    if (m.gK !== gK) {   // le file restano anche vuote: il tavolo non si sposta mai
      m.gK = gK;
      m.griglia.style.gridTemplateColumns = "repeat(" + colT + "," + wT + "px)";
      m.griglia.style.gridTemplateRows = "repeat(" + righeT + "," + Math.round(wT * ASP_CARTA) + "px)";
    }
    var cartaSel = C.sel.carta ? trova(vm.mano, C.sel.carta) : null;
    var opts = (mioTurno && cartaSel) ? catture(cartaSel.v, vm.tavolo) : [];
    // verdi solo le carte che, con quelle già scelte, portano ancora a una presa giusta
    var verdi = {}, cliccabili = {};
    opts.forEach(function (set) {
      if (!C.sel.presa.every(function (id) { return set.indexOf(id) >= 0; })) return;
      set.forEach(function (id) { if (C.sel.presa.indexOf(id) < 0) verdi[id] = true; });
    });
    for (var vid in verdi) cliccabili[vid] = true;
    if (cartaSel) C.sel.presa.forEach(function (id) { cliccabili[id] = true; });   // quelle scelte si possono togliere
    m.cliccabili = cliccabili;
    var dir = vm.presa ? (vm.presa.mio ? "giu" : "su") : null;
    var dealing = !vm.presa && vm.fase === "gioco" && vm.mano.length > m.prevMano;
    var nuoveTav = [], presiEls = [], vivi = {};
    carteTav.forEach(function (c) {
      vivi[c.id] = true;
      var cel = m.tav[c.id];
      if (!cel) {
        cel = cartaEl(el, c, wT); cel._w = wT;
        cel.addEventListener("click", function () { var mm = scMount; if (mm && mm.C === C && mm.cliccabili && mm.cliccabili[c.id]) C.tapTavolo(c.id); });
        if (c.id === vm.messaGiu && !vm.presa) {   // appena scartata: si posa sul tavolo
          cel.classList.add("sc-cade");
          cel.addEventListener("animationend", function () { cel.classList.remove("sc-cade"); }, { once: true });
        }
        m.tav[c.id] = cel; m.griglia.appendChild(cel);
        nuoveTav.push(cel);
      }
      misuraCarta(cel, wT);
      var p = scSlot[c.id] || 0, gc = String(p % colT + 1), gr = String(Math.floor(p / colT) + 1);
      if (cel.style.gridColumnStart !== gc || cel.style.gridRowStart !== gr) { cel.style.gridColumn = gc; cel.style.gridRow = gr; }
      var preso = !!(vm.presa && vm.presa.presiIds && vm.presa.presiIds.indexOf(c.id) >= 0);
      cel.classList.toggle("sc-lascia-su", preso && dir === "su");
      cel.classList.toggle("sc-lascia-giu", preso && dir === "giu");
      if (preso) presiEls.push(cel);
      cel.classList.toggle("cap", !!verdi[c.id]);
      cel.classList.toggle("presel", !!cartaSel && C.sel.presa.indexOf(c.id) >= 0);
    });
    for (var tid in m.tav) if (!vivi[tid]) { m.tav[tid].remove(); delete m.tav[tid]; }
    // la carta giocata: parte dalla mano (o dall'avversario), va SOPRA la/e carta/e che prende, poi vola via con la presa
    if (chiavePresa !== m.giocK) {
      m.giocK = chiavePresa;
      if (m.gioc) { m.gioc.remove(); m.gioc = null; }
      if (vm.presa && vm.presa.carta) {
        var gioc = m.gioc = cartaEl(el, vm.presa.carta, wT);
        gioc.style.cssText += ";position:absolute;z-index:6;opacity:0";
        m.area.appendChild(gioc);
        if (presiEls.length) {   // posizioni misurate SUL tavolo (non sullo schermo): il tavolo è inclinato
          var cx = 0, cy = 0;
          presiEls.forEach(function (e) { cx += e.offsetLeft + e.offsetWidth / 2; cy += e.offsetTop + e.offsetHeight / 2; });
          cx /= presiEls.length; cy /= presiEls.length;
          gioc.style.left = (cx - gioc.offsetWidth / 2) + "px"; gioc.style.top = (cy - gioc.offsetHeight / 2) + "px";
        } else {
          gioc.style.left = "50%"; gioc.style.top = "50%"; gioc.style.marginLeft = (-wT / 2) + "px"; gioc.style.marginTop = (-Math.round(wT * ASP_CARTA) / 2) + "px";
        }
        gioc.style.animation = "scGioca" + (dir === "giu" ? "Giu" : "Su") + " .95s ease-in forwards";
      }
    }

    // ---- scritte grandi: SCOPA!, le carte rimaste, i tre Re ----
    if (vm.presa && vm.presa.scopa && vm.presa.mio) sceltaBanner(m, cb.guarda ? "SCOPA di " + vm.nomi.io + "! 🧹" : "SCOPA! 🧹", " scopa");
    else if (vm.presa && vm.presa.resto) sceltaBanner(m, vm.presa.mio ? (cb.guarda ? "Le carte rimaste vanno a " + vm.nomi.io : "Le carte rimaste sono tue! 🙌") : "Le carte rimaste vanno a " + vm.nomi.opp, "");
    else if (vm.rifatta && m.rifK !== chiaveRound) {
      m.rifK = chiaveRound;
      sceltaBanner(m, "👑 Tre Re in tavola: si rimescola!", "");
      setTimeout(function () { if (m.bannerTxt && /Tre Re/.test(m.bannerTxt)) sceltaBanner(m, null); }, 2600);
    } else if (!(m.bannerTxt && /Tre Re/.test(m.bannerTxt) && vm.rifatta)) sceltaBanner(m, null);

    // ---- la mia mano (in basso, sulla mensola di legno a dimensione FISSA) ----
    var nuoveMano = [], viviM = {};
    vm.mano.forEach(function (c) {
      viviM[c.id] = true;
      var cel = m.mano[c.id];
      if (!cel) {
        cel = cartaEl(el, c, Mi.wH);
        cel.addEventListener("click", function () { var mm = scMount; if (!mm || mm.C !== C || C.uscito) return; if (mm.mioTurno) C.tapMano(c.id); else mm.aspetta(); });
        m.mano[c.id] = cel; m.manoRiga.appendChild(cel); nuoveMano.push(cel);
      }
      cel.classList.toggle("sel", C.sel.carta === c.id);
      cel.classList.toggle("inviata", C.inviata === c.id);
    });
    for (var mid in m.mano) if (!viviM[mid]) { m.mano[mid].remove(); delete m.mano[mid]; }
    m.mensola.classList.toggle("tuo", suoTurno && !C.inviata);
    var tTxt = cb.guarda ? "Tocca a " + corto(vm.nomi.io, 14) : "Tocca a te!";
    if (m.tocca.textContent !== tTxt) m.tocca.textContent = tTxt;
    var prTxt = (cb.guarda ? "le carte di " + esc(corto(vm.nomi.io, 14)) + " · prese" : "le tue prese") + " <b>" + vm.preseIo + "</b>" + (vm.settebelloIo ? " · 7💰" : "") + (vm.scopeIo ? " · scope " + vm.scopeIo : "");
    if (m.prTxt !== prTxt) { m.prTxt = prTxt; m.prese.innerHTML = prTxt; }

    // ---- aiuto in sovrimpressione sul tavolo (non sposta niente): solo per scegliere la presa ----
    m.aiutoFisso = (mioTurno && cartaSel && opts.length >= 2) ? (opts[0].length === 1 ? "Tocca la carta verde da prendere." : "Tocca le carte verdi che sommano a " + cartaSel.v + ".") : null;
    aggiornaAiuto(m);
    applicaAvviso(C);

    // misuro quanto spazio avanza (o manca) sotto la mensola e rifaccio SUBITO la stanza della misura giusta
    // (prima che il telefono disegni: non si vede nessun salto). Una volta sola per schermo.
    if (nuovo && !scCorr.fatto) {
      var sch = m.s, rS = sch.getBoundingClientRect(), padB = parseFloat(getComputedStyle(sch).paddingBottom) || 0;
      // (misure senza l'animazione d'entrata della schermata: quella sposta tutto di qualche pixel e falserebbe il conto)
      var fondo = (m.fa || m.mensola).getBoundingClientRect().bottom, trabocca = Math.max(0, sch.offsetTop + sch.offsetHeight - Mi.alt);
      var avanza = Math.floor((rS.bottom - padB - fondo) - trabocca);
      scCorr.fatto = true;
      if (rS.height > 0 && Math.abs(avanza) > 3) { scCorr.v += avanza; renderScopa(t, C, cb); return; }
    }
    m.prevMano = vm.mano.length; m.round = chiaveRound;
    // DISTRIBUZIONE come dal vero: prima le carte nuove in tavola una alla volta, poi una a te e una all'avversario, a turno
    if (dealing) {
      var passo = 0.2, t0 = 0, tavNuove = (vm.preseIo + vm.preseOpp === 0 && vm.mazzoN === 30) ? nuoveTav : [];
      tavNuove.forEach(function (cel, i) {   // sul tavolo inclinato: arrivano dal centro del panno
        if (!cel.animate) return;
        cel.animate([{ translate: "0 -120px", scale: "0.5", opacity: 0 }, { translate: "0 0", scale: "1", opacity: 1 }],
          { duration: 420, delay: i * passo * 1000, easing: "cubic-bezier(.2,.7,.3,1)", fill: "backwards" });
      });
      if (tavNuove.length) t0 = tavNuove.length * passo + 0.2;
      var fr = m.feltro.getBoundingClientRect(), ox = fr.left + fr.width / 2, oy = fr.top + fr.height * 0.4;   // da qui partono le carte
      var vola = function (elC, ritardo) {
        if (!elC || !elC.animate) return;
        var r = elC.getBoundingClientRect();
        elC.animate([{ translate: Math.round(ox - (r.left + r.width / 2)) + "px " + Math.round(oy - (r.top + r.height / 2)) + "px", scale: "0.4", opacity: 0 },
          { opacity: 1, offset: 0.25 }, { translate: "0 0", scale: "1", opacity: 1 }],
          { duration: 460, delay: ritardo * 1000, easing: "cubic-bezier(.2,.7,.3,1)", fill: "backwards" });
      };
      var n = Math.max(nuoveMano.length, nuoviDorsi.length);
      for (var k = 0; k < n; k++) { vola(nuoveMano[k], t0 + 2 * k * passo); vola(nuoviDorsi[k], t0 + (2 * k + 1) * passo); }
      C._dealFino = Date.now() + (t0 + 2 * n * passo) * 1000 + 450;   // il bot aspetta che la distribuzione finisca
    }
  }

  // 💬 una chiacchiera sul tavolo della Scopa a due: la mia (o di chi ha le carte che si vedono) sopra la mensola,
  // quella dell'avversario sotto la sua targa; chi guarda in basso a sinistra col nome
  function chiacScopa(C, k, c, nome) {
    var X = window.SGChiacchiere, m = scMount; if (!X || !C || C.uscito) return;
    var muto = !!C._guarda, vivo = m && m.C === C && document.body.contains(m.s) && C.vm && C.vm.fase === "gioco";
    if (vivo && (k === "A" || k === "B")) X.bolla(k === C.vm.io ? m.mensola : m.targa, "scopa", c, { sotto: k !== C.vm.io, muto: muto });
    else X.volante("scopa", c, k === "A" || k === "B" ? ((C.vm && C.vm.nomi && (k === C.vm.io ? C.vm.nomi.io : C.vm.nomi.opp)) || "") : nome, muto);
  }

  // avviso sopra al tavolo (es. "Luca è uscito"): C.avviso = { testo, tasto, onTasto } oppure null
  function applicaAvviso(C) {
    var s = C._schermo; if (!s) return;
    var vecchio = s.querySelector(".sc-avviso-sf");
    var k = C.avviso && !C.uscito ? C.avviso.testo + "|" + (C.avviso.tasto || "") : null;
    if (vecchio && vecchio._k === k) return;
    if (vecchio) vecchio.remove();
    if (!k) return;
    var el = C._el, box = el("div", { class: "sc-avviso oro" }, [el("p", { text: C.avviso.testo })]);   // (oro: il tasto dentro è quello d'oro)
    if (C.avviso.tasto) box.appendChild(el("button", { class: "btn btn-primario", text: C.avviso.tasto, onclick: C.avviso.onTasto }));
    var sf = el("div", { class: "sc-avviso-sf" }, [box]); sf._k = k;
    s.appendChild(sf);
  }

  // riepilogo di fine smazzata / fine partita: le righe arrivano una alla volta, poi il totale e la strada verso il traguardo
  function renderFine(t, C, cb) {
    if (C.uscito) return;
    var el = t.el, vm = C.vm, r = vm.ultimoRound;
    var chiave = vm.idPartita + ":" + vm.nRound + ":" + vm.fase;
    if (C._fineK === chiave && C._schermo && document.body.contains(C._schermo)) { applicaAvviso(C); return; }   // già mostrato: niente da rifare
    C._fineK = chiave;
    var fine = vm.fase === "fine", pari = fine && vm.punti && vm.punti.io === vm.punti.opp;
    var titolo = !fine ? "Fine smazzata" : pari ? "Pareggio!" : cb.guarda ? "Ha vinto " + (vm.vincitoreIo ? vm.nomi.io : vm.nomi.opp) : (vm.vincitoreIo ? "Hai vinto!" : "Ha vinto " + vm.nomi.opp);
    function esci() { if (fine || cb.guarda) return cb.onEsci(); chiediEsci(t, cb.onEsci); }
    var s = t.schermata({ icona: fine ? "🏆" : "🧮", titolo: titolo, indietro: esci });
    if (r) {
      var p = r.p, io = vm.io, opp = altro(io), n = 0, cont = el("div", { class: "sc-riep" });
      var lato = function (x) { return x === io ? "io" : x === opp ? "opp" : null; };
      var di = function (a, b) { return io === "A" ? [a, b] : [b, a]; };   // [mio, suo]
      var riga = function (nome, vals, vinc, cls, badge) {
        var celle = [0, 1].map(function (i) {
          var mio = (vinc === "io" && i === 0) || (vinc === "opp" && i === 1), b = badge ? badge[i] : (mio ? "+1" : "");
          return el("span", { class: mio ? "vinto" : "", html: vals[i] + (b ? "<span class='sc-piu'>" + b + "</span>" : "") });
        });
        cont.appendChild(el("div", { class: "sc-rg" + (cls ? " " + cls : ""), style: "animation-delay:" + (n++ * 0.2).toFixed(2) + "s" }, [el("span", { text: nome }), celle[0], celle[1]]));
      };
      cont.appendChild(el("div", { class: "sc-rg testa" }, [el("span"), el("span", { text: vm.nomi.io }), el("span", { text: vm.nomi.opp })]));
      riga("Carte", di(p.carteA, p.carteB), lato(p.puntoCarte));
      riga("Denari", di(p.denA, p.denB), lato(p.puntoDenari));
      riga("Settebello", di(p.settebello === "A" ? "7💰" : "—", p.settebello === "B" ? "7💰" : "—"), lato(p.settebello));
      var pr = function (x, ok) { return ok === false ? "<span class='manca'>manca un seme</span>" : x; };
      riga("Primiera", di(pr(p.primA, p.primOkA), pr(p.primB, p.primOkB)), lato(p.puntoPrimiera));
      var sc = di(r.scope.A, r.scope.B);
      riga("Scope", sc, null, "", [sc[0] ? "+" + sc[0] : "", sc[1] ? "+" + sc[1] : ""]);
      var g = di(r.guad.A, r.guad.B), tt = di(r.tot.A, r.tot.B);
      riga("Punti", ["+" + g[0], "+" + g[1]], null);
      riga("Totale", tt, fine && !pari ? (vm.vincitoreIo ? "io" : "opp") : null, "tot", ["", ""]);
      var barre = [];
      if (vm.traguardo) {   // la strada verso il traguardo
        var bb = [0, 1].map(function (i) { var b = el("b", { style: "transform:scaleX(0);background:" + (i ? "var(--o-rosso)" : "var(--o-verde)") }); barre.push([b, Math.min(1, tt[i] / vm.traguardo)]); return el("div", { class: "sc-barra" }, [b]); });
        cont.appendChild(el("div", { class: "sc-rg", style: "animation-delay:" + (n++ * 0.2).toFixed(2) + "s;font-size:.8rem" }, [el("span", { text: "Verso " + vm.traguardo }), bb[0], bb[1]]));
      }
      // Bot dice la sua
      if (vm.bot && !cb.guarda) {
        var mom = fine ? (pari ? "pari" : vm.vincitoreIo ? "perde" : "vince") : null;
        var detta = mom ? battuta(mom, chiave) : null;
        if (detta) cont.appendChild(el("div", { class: "sc-detto", style: "animation-delay:" + (n++ * 0.2).toFixed(2) + "s", text: "💬 " + vm.nomi.opp + ": «" + detta + "»" }));
      }
      s._contenuto.appendChild(cont);
      if (barre.length) setTimeout(function () { barre.forEach(function (x) { x[0].style.transform = "scaleX(" + x[1] + ")"; }); }, 40);
    }
    var nota = function (txt) { var p = el("p", { class: "modulo-nota", style: "margin:0 0 6px;text-align:center", text: txt }); s._piede.appendChild(p); return p; };
    // chi guarda soltanto (fuori dal torneo a eliminazione) ha la targhetta del core in basso: faccine e uscita sono lì
    var targa = !!(cb.guarda && !cb.spettatore && t.guarda && !t.eliminazione);
    if (targa) s._piede.style.paddingBottom = "calc(58px + env(safe-area-inset-bottom))";
    // online: la fila delle faccine (il mio avatar le fa sui telefoni di tutti); null se non serve
    var fa = !cb.locale && !targa && t.faccine ? t.faccine() : null;
    if (fa) { fa.style.margin = "0 0 8px"; s._piede.appendChild(fa); }
    // la prossima smazzata parte da sola: l'host vede il conto sul tasto, gli altri "Si va avanti tra 12…"
    var kConto = "smazzata|" + vm.idPartita + ":" + vm.nRound;
    if (cb.guarda) {   // chi guarda: niente tasti di gioco, solo cosa succede
      // a fine partita i tasti del core, se ne ha per chi guarda (es. "Chi vince resta"; chi è in più nella stanza, solo
      // nella Sala con "Chi gioca?": «🏠 Torna in Sala»)
      if (!(fine && !cb.locale && (t.guarda || (cb.spettatore && t.scelti)) && t.tastiFine && t.tastiFine(s._piede, { host: false, esci: cb.onEsci }))) {
        var pg = nota(!fine ? "In attesa della prossima smazzata…" : cb.spettatore ? "In attesa dell'host per un'altra partita…"
          : !t.eliminazione ? "👀 Aspettiamo la prossima partita…" : (pari ? "Pareggio: si rigioca!" : "Tra poco si torna al tabellone…"));   // (spettatore: stanza online)
        if (fine && cb.spettatore) s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
        if (!fine && !vm.bot && t.contoAvanti) t.contoAvanti(pg, 12, null, kConto);   // (la partita col Bot va avanti quando tocca chi gioca)
      }
    } else if (fine) {
      // online: i tasti di fine uguali per tutti, se li disegna il core (se no quelli di sempre)
      if (!(!cb.locale && t.tastiFine && t.tastiFine(s._piede, { host: !!cb.sonoHost, nuova: cb.sonoHost ? cb.onSaletta : null, esci: cb.onEsci }))) {
        if (cb.sonoHost || cb.locale) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Nuova partita", onclick: cb.onNuova }));
        else nota("In attesa dell'host per un'altra partita…");
        s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: esci }));
      }
    } else {
      if (cb.sonoHost || cb.locale) {
        var bC = el("button", { class: "btn btn-primario", text: "Continua ▶", onclick: cb.onAvanti });
        s._piede.appendChild(bC);
        if (!cb.locale && t.contoAvanti) t.contoAvanti(bC, 12, cb.onAvantiDaSolo || cb.onAvanti, kConto);   // (il conto chiama la funzione: niente vibrazione)
      } else {
        var po = nota("La prossima smazzata parte tra pochi secondi…");
        if (t.contoAvanti) t.contoAvanti(po, 12, null, kConto);
      }
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: esci }));
    }
    C._schermo = s;
    t.mostra(s);
    applicaAvviso(C);
  }

  // ---- statistiche per i trofei: il giocatore di QUESTO telefono (vm.io), se ha il profilo.
  //      Funziona uguale contro il bot, da host e da ospite: guarda solo lo stato che arriva. ----
  // smazzate già contate (anche dopo aver ricaricato la pagina): non si contano due volte
  function giaContata(k) {
    try {
      var l = JSON.parse(localStorage.getItem("sg-scopa-contate") || "[]");
      if (l.indexOf(k) >= 0) return true;
      l.push(k); if (l.length > 30) l = l.slice(-30);
      localStorage.setItem("sg-scopa-contate", JSON.stringify(l));
    } catch (e) {}
    return false;
  }
  function tracciaScopa(T, vm) {
    if (!vm) return;
    // 1) le mosse: una mia scopa fatta con un denaro, o calando un asso
    if (vm.presa && vm.presa.carta) {
      var key = vm.presa.carta.id + ":" + (vm.presa.presiIds || []).join(",");
      if (key !== T.presaKey) {
        T.presaKey = key;
        if (vm.presa.mio && vm.presa.scopa) {
          var den = vm.presa.carta.s === "D" || (vm.presa.presi || []).some(function (c) { return c.s === "D"; });
          if (den) T.round.scopeDenari++;
          if (vm.presa.carta.v === 1) T.round.scopeAsso++;
        }
      }
    } else T.presaKey = null;
    // 2) fine smazzata (e fine partita)
    var prima = T.fase; T.fase = vm.fase;
    if (!(vm.fase === "fineround" || vm.fase === "fine") || prima === vm.fase || !vm.ultimoRound) return;
    if (vm.idPartita && giaContata(vm.idPartita + ":" + vm.nRound + ":" + vm.io)) { T.round = { scopeDenari: 0, scopeAsso: 0 }; return; }
    var r = vm.ultimoRound, p = r.p, io = vm.io, opp = altro(io);
    var tutti4 = p.puntoCarte === io && p.puntoDenari === io && p.settebello === io && p.puntoPrimiera === io;
    var c = { scope: r.scope[io], settebello: p.settebello === io ? 1 : 0, primiera: p.puntoPrimiera === io ? 1 : 0,
      denari: p.puntoDenari === io ? 1 : 0, carte: p.puntoCarte === io ? 1 : 0,
      scopeDenari: T.round.scopeDenari, scopeAsso: T.round.scopeAsso,
      cappotto: tutti4 ? 1 : 0, sopraMedia: (tutti4 && r.scope[io] >= 1) ? 1 : 0 };
    if (p.settebello === io) T.match.sette++;
    if (r.tot[opp] >= 10 && r.tot[io] < 10) T.match.oppA10 = true;   // l'avversario è arrivato a 10 prima di te
    // i trofei della partita intera valgono solo per le partite vere (almeno a 11): con una mano sola o pochi punti sarebbero regalati
    if (vm.fase === "fine" && !(vm.traguardo != null && vm.traguardo < TARGET)) {
      c.partite = 1;
      if (vm.vincitoreIo) {
        c.vinte = 1;
        if (T.match.sette === 0) c.vinteSenzaSette = 1;
        if (r.tot[opp] === 0) c.vinteAZero = 1;
        if (T.match.oppA10) c.rimonte = 1;
      }
    }
    if (vm.fase === "fine") T.match = { sette: 0, oppA10: false };
    T.round = { scopeDenari: 0, scopeAsso: 0 };
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return;
    var incrs = []; for (var k in c) if (c[k]) incrs.push([k, c[k]]);
    SGNube.salvaProgressi(null, "scopa", incrs, [["scopeRoundMax", r.scope[io]]]);
  }

  // client condiviso: tiene vm + selezione, gestisce i tap, chiama cb.onMossa
  function creaClient(t, cb) {
    var C = { vm: null, sel: { carta: null, presa: [] }, uscito: false, inviata: null, avviso: null, _el: t.el, _guarda: !!cb.guarda };
    var T = { presaKey: null, fase: null, round: { scopeDenari: 0, scopeAsso: 0 }, match: { sette: 0, oppA10: false } };
    C.tapMano = function (id) {
      if (C.uscito || C.inviata || !C.vm) return;
      var carta = trova(C.vm.mano, id); if (!carta) return;
      var opts = catture(carta.v, C.vm.tavolo);
      if (opts.length === 0) { C.sel = { carta: null, presa: [] }; cb.onMossa(id, null); return; }   // niente presa: metti giù subito
      if (opts.length === 1) { C.sel = { carta: null, presa: [] }; cb.onMossa(id, opts[0]); return; }  // una sola presa: prendi subito
      C.sel = (C.sel.carta === id) ? { carta: null, presa: [] } : { carta: id, presa: [] };            // più prese: scegli
      C.disegna();
    };
    C.tapTavolo = function (id) {
      if (C.uscito || !C.vm) return;
      var carta = trova(C.vm.mano, C.sel.carta); if (!carta) return;
      var opts = catture(carta.v, C.vm.tavolo);
      var p = C.sel.presa.slice(); var k = p.indexOf(id); if (k >= 0) p.splice(k, 1); else p.push(id);
      if (validaSet(opts, p)) { var cs = C.sel.carta; C.sel = { carta: null, presa: [] }; cb.onMossa(cs, p); return; }
      if (prefisso(opts, p)) C.sel.presa = p; // altrimenti ignora il tap
      C.disegna();
    };
    C.disegna = function () {
      if (!C.vm || C.uscito) return;
      if (C.vm.fase === "gioco") renderScopa(t, C, cb);
      else renderFine(t, C, cb);
    };
    // ospite online: la carta toccata parte subito (in attesa che l'host risponda)
    C.manda = function (id) {
      C.inviata = id; C.disegna();
      clearTimeout(C._invT);
      C._invT = setTimeout(function () { if (C.inviata === id) { C.inviata = null; C.disegna(); } }, 5000);   // risposta persa: si può ritoccare
    };
    C.mostraAvviso = function () { applicaAvviso(C); };
    // si esce: niente più disegni, attese o musica (anche se un'attesa vecchia scatta dopo)
    C.esci = function () {
      C.uscito = true;
      if (C._pend) { clearTimeout(C._pend); C._pend = null; }
      clearTimeout(C._invT);
      if (window.SGMusica) window.SGMusica.ferma();
    };
    C._presaFino = 0; C._pend = null;
    C.setVm = function (vm) {
      if (C.uscito) return;
      if (!cb.guarda) tracciaScopa(T, vm);   // trofei (chi guarda non gioca)
      if (C.inviata && (!vm || !trova(vm.mano || [], C.inviata) || vm.turno !== vm.io)) C.inviata = null;
      // pulisci la selezione se non è più il mio turno
      if (!vm || vm.turno !== vm.io || vm.fase !== "gioco" || vm.presa) C.sel = { carta: null, presa: [] };
      if (C._pend) { clearTimeout(C._pend); C._pend = null; }
      if (vm && vm.presa) {                              // arriva una presa: mostra l'animazione (durata minima garantita)
        C._presaFino = Date.now() + 1050;
        C.vm = vm; C.disegna(); return;
      }
      if (vm && C.vm && C.vm.presa && Date.now() < C._presaFino) {   // il "pulisci" è arrivato troppo presto:
        // NON ridisegno (l'animazione è in corso): rimando solo l'applicazione del nuovo stato
        C._pend = setTimeout(function () { C._pend = null; C.vm = vm; C.disegna(); }, C._presaFino - Date.now());
        return;
      }
      C.vm = vm; C.disegna();
    };
    return C;
  }

  // costruisce la vista per il giocatore "io" ("A" o "B") dallo stato del motore (extra: bot, idB…)
  function vistaDa(st, io, omini, extra) {
    var opp = altro(io);
    var v = {
      fase: st.fase, io: io, turno: st.turno, traguardo: st.traguardo,
      nomi: { io: st.nomi[io], opp: st.nomi[opp] }, avatar: omini ? { opp: omini[opp] || null } : null,
      mano: st.mani[io].slice(), oppN: st.mani[opp].length, tavolo: st.tavolo.slice(), mazzoN: st.mazzo.length,
      preseIo: st.prese[io].length, preseOpp: st.prese[opp].length,
      scopeIo: st.scope[io], scopeOpp: st.scope[opp],
      settebelloIo: !!trova(st.prese[io], "D7"), settebelloOpp: !!trova(st.prese[opp], "D7"),
      punti: { io: st.punti[io], opp: st.punti[opp] },
      ultimoRound: st.ultimoRound, messaGiu: st.messaGiu,
      presa: st.presa ? { mio: st.presa.chi === io, carta: st.presa.carta, presi: st.presa.presi, scopa: st.presa.scopa, tavoloPrima: st.presa.tavoloPrima, presiIds: st.presa.presiIds, resto: !!st.presa.resto } : null,
      vincitoreIo: st.fase === "fine" ? (st.punti[io] > st.punti[opp]) : false,
      idPartita: st.idPartita, nRound: st.nRound, rifatta: !!st.rifatta
    };
    if (extra) for (var k in extra) v[k] = extra[k];
    return v;
  }

  // =====================================================================
  //  SCOPA IN TRE — ognuno per sé, come si gioca dal vero: 3 carte a testa, 4 in tavola, il mazzo basta per 4 giri.
  //  Posti 0, 1, 2 (online l'host è lo 0, gli amici l'1 e il 2 in ordine di arrivo; i posti liberi li fa il Bot).
  //  Si gioca a giro 0 → 1 → 2. A fine smazzata Carte, Denari e Primiera vanno a chi ne ha di più DA SOLO (a pari merito
  //  il punto non lo prende nessuno), il Settebello a chi l'ha preso, più le Scope. Vince chi arriva per primo ai punti
  //  scelti da solo in testa (se in testa sono pari si gioca un'altra mano).
  //  Online: a ognuno la SUA foto (inviaVeloce, "to"); nella stanza resta la foto di chi guarda (senza carte in mano).
  //  Messaggi con tre: 1 (così chi entra capisce che il tavolo è da tre: vedi ospiteScopaAuto).
  // =====================================================================
  var TEMPO_TURNO3 = 60;   // online in tre: chi non gioca per un minuto, il Bot gioca una carta al posto suo
  function mischiaTre(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function creaMotore3(traguardo, mischia, primo) {
    var st = { traguardo: traguardo == null ? TARGET : traguardo, mazzo: [], tavolo: [], mani: [[], [], []], prese: [[], [], []], scope: [0, 0, 0],
      turno: 0, ultimaPresa: null, fase: "gioco", primo: primo || 0, primoPartita: primo || 0, punti: [0, 0, 0], ultimoRound: null, presa: null, messaGiu: null,
      nomi: {}, avatari: {}, nMano: 0, rifatta: false, avviso: null, pid: Math.random().toString(36).slice(2, 8) };
    mischia = mischia || mischiaTre;
    function vuote() { return !st.mani[0].length && !st.mani[1].length && !st.mani[2].length; }
    function pesca() { for (var s = 0; s < 3; s++) st.mani[s] = st.mazzo.splice(0, 3); }
    function nuovaMano() {
      var giri = 0;
      do { st.mazzo = creaMazzo(mischia); st.tavolo = st.mazzo.splice(0, 4); }   // tre o quattro Re in tavola: si rimescola
      while (st.tavolo.filter(function (c) { return c.v === 10; }).length >= 3 && ++giri < 20);
      st.rifatta = giri > 0;
      pesca();
      st.prese = [[], [], []]; st.scope = [0, 0, 0]; st.ultimaPresa = null; st.turno = st.primo; st.fase = "gioco"; st.presa = null; st.messaGiu = null; st.nMano++;
    }
    // una carta giocata (finite le mani NON si distribuisce subito: prima si guarda la presa, poi chiudiPresa)
    function gioca(seat, cartaId, presaIds) {
      if (st.fase !== "gioco" || seat !== st.turno || st.presa) return { errore: true };
      var carta = trova(st.mani[seat], cartaId); if (!carta) return { errore: true };
      st.messaGiu = null; st.rifatta = false;
      st.mani[seat] = st.mani[seat].filter(function (c) { return c.id !== cartaId; });
      var opts = catture(carta.v, st.tavolo), ev = { presa: false, scopa: false, seat: seat };
      if (opts.length) {
        var set = presaIds && validaSet(opts, presaIds) ? presaIds : opts[0];
        var tavoloPrima = st.tavolo.slice(), presi = set.map(function (id) { return trova(st.tavolo, id); }).filter(Boolean);
        st.tavolo = st.tavolo.filter(function (c) { return set.indexOf(c.id) < 0; });
        st.prese[seat] = st.prese[seat].concat(presi, [carta]);
        st.ultimaPresa = seat; ev.presa = true;
        if (!st.tavolo.length && !(st.mazzo.length === 0 && vuote())) { st.scope[seat]++; ev.scopa = true; }   // (con l'ultima carta non è scopa)
        st.presa = { seat: seat, carta: carta, presiIds: set, tavoloPrima: tavoloPrima, scopa: ev.scopa };
      } else { st.tavolo.push(carta); st.messaGiu = carta.id; }
      st.turno = (seat + 1) % 3;
      ev.chiudere = vuote();
      return ev;
    }
    // finita di guardare la presa: a mani vuote si distribuisce; a fine mazzo prima le carte rimaste vanno all'ultimo che ha preso
    function chiudiPresa() {
      st.presa = null; st.messaGiu = null;
      if (st.fase !== "gioco" || !vuote()) return "gioco";
      if (st.mazzo.length) { pesca(); return "gioco"; }
      if (st.tavolo.length && st.ultimaPresa != null) {
        var resto = st.tavolo.slice(), chi = st.ultimaPresa;
        st.prese[chi] = st.prese[chi].concat(resto); st.tavolo = [];
        st.presa = { seat: chi, carta: null, presiIds: resto.map(function (c) { return c.id; }), tavoloPrima: resto, scopa: false, resto: true };
        return "resto";
      }
      fineMano(); return "fine";
    }
    function fineMano() {
      if (st.tavolo.length && st.ultimaPresa != null) { st.prese[st.ultimaPresa] = st.prese[st.ultimaPresa].concat(st.tavolo); st.tavolo = []; }
      var p = contaPunti3(st.prese), guad = [0, 1, 2].map(function (s) { return st.scope[s] + (p.pCarte === s ? 1 : 0) + (p.pDen === s ? 1 : 0) + (p.sette === s ? 1 : 0) + (p.pPrim === s ? 1 : 0); });
      for (var s = 0; s < 3; s++) st.punti[s] += guad[s];
      st.ultimoRound = { p: p, scope: st.scope.slice(), guad: guad, tot: st.punti.slice() };
      st.fase = finita3(st.traguardo, st.punti) ? "fine" : "fineround";
    }
    function prossimoRound() { if (st.fase !== "fineround") return; st.primo = (st.primo + 1) % 3; nuovaMano(); }
    nuovaMano();
    return { st: st, gioca: gioca, chiudiPresa: chiudiPresa, prossimoRound: prossimoRound,
      // la ripresa (l'host ha ricaricato la pagina): la partita com'è (un oggetto semplice) e di nuovo dentro il motore
      esporta: function () { return JSON.parse(JSON.stringify(st)); },
      importa: function (x) { if (x && typeof x === "object") Object.keys(x).forEach(function (k) { st[k] = x[k]; }); } };
  }
  // a chi va il punto: a chi ne ha di più da solo (e più di "min"); a pari merito a nessuno
  function primoSolo(a, min) {
    var mx = Math.max.apply(null, a); if (!(mx > min)) return null;
    var chi = []; a.forEach(function (v, i) { if (v === mx) chi.push(i); });
    return chi.length === 1 ? chi[0] : null;
  }
  function contaPunti3(prese) {
    var carte = prese.map(function (p) { return p.length; });
    var den = prese.map(function (p) { return p.filter(function (c) { return c.s === "D"; }).length; });
    var ok = prese.map(tuttiSemi), prim = prese.map(primiera), sette = null;
    prese.forEach(function (p, i) { if (trova(p, "D7")) sette = i; });
    return { carte: carte, den: den, prim: prim, primOk: ok, sette: sette, pCarte: primoSolo(carte, 0), pDen: primoSolo(den, 0),
      pPrim: primoSolo(prim.map(function (v, i) { return ok[i] ? v : -1; }), -1) };   // (la primiera vale solo con tutti e quattro i semi)
  }
  function finita3(n, punti) { if (!n) return true; var mx = Math.max.apply(null, punti); return mx >= n && punti.filter(function (x) { return x === mx; }).length === 1; }
  function vincitore3(punti) { return primoSolo(punti, -1); }   // null = in testa sono pari
  // com'è finita, per il core (XP, torneo online): dal primo all'ultimo, a pari punti lo stesso posto
  function classifica3(st, botSeat) {
    return [0, 1, 2].map(function (s) { return { s: s, p: st.punti[s] }; }).sort(function (a, b) { return b.p - a.p; }).map(function (x) {
      var r = { nome: st.nomi[x.s], pos: 1 + st.punti.filter(function (p) { return p > x.p; }).length };
      if (botSeat && botSeat[x.s]) r.bot = true;
      return r;
    });
  }
  // il Bot in tre: Facile e Medio come a due; Difficile ricorda le carte uscite e guarda cosa lascia a chi gioca dopo
  function mossaBot3(st, seat, diff) {
    var mano = st.mani[seat], tavolo = st.tavolo; if (!mano.length) return null;
    if (diff !== "difficile") return scegliMossaBot(mano, tavolo, diff === "facile" ? "facile" : "medio");
    var mosse = [];
    mano.forEach(function (c) {
      var o = catture(c.v, tavolo);
      if (o.length) o.forEach(function (set) { mosse.push({ carta: c.id, presa: set, cattura: true, c: c, set: set }); });
      else mosse.push({ carta: c.id, presa: null, cattura: false, c: c, set: [] });
    });
    var av = (seat + 1) % 3, mieP = st.prese[seat], sueP = st.prese[av], viste = {};
    mano.concat(tavolo, st.prese[0], st.prese[1], st.prese[2]).forEach(function (c) { viste[c.id] = 1; });
    var ignote = creaMazzo().filter(function (c) { return !viste[c.id]; }), perValore = {};
    ignote.forEach(function (c) { perValore[c.v] = (perValore[c.v] || 0) + 1; });
    var U = ignote.length, hAvv = st.mani[av].length || (st.mazzo.length > 0 ? 3 : 0);
    function probHa(v) {   // probabilità che chi gioca dopo abbia almeno una carta di valore v
      var u = perValore[v] || 0; if (!u || !hAvv || U <= 0) return 0;
      var p = 1; for (var i = 0; i < hAvv; i++) p *= Math.max(0, (U - u - i)) / (U - i);
      return 1 - p;
    }
    var restanti = st.mani[0].length + st.mani[1].length + st.mani[2].length;
    var ultimaMia = !st.mazzo.length && restanti === 1, ultimaSua = !st.mazzo.length && restanti === 2;
    var migliore = mosse[0], bs = -1e9;
    mosse.forEach(function (m) {
      var tav2 = m.cattura ? tavolo.filter(function (c) { return m.set.indexOf(c.id) < 0; }) : tavolo.concat([m.c]);
      var guadagno = m.cattura ? valorePresa(m.c, m.set.map(function (id) { return trova(tavolo, id); }), tav2.length, mieP, !ultimaMia) : -0.15 * pesoCarta(m.c, mieP);
      var risposte = [];
      for (var v = 1; v <= 10; v++) {
        var p = probHa(v); if (!p) continue;
        var best = 0;
        catture(v, tav2).forEach(function (set) {
          var val = valorePresa({ v: v, s: "?", id: "?" }, set.map(function (id) { return trova(tav2, id); }), tav2.length - set.length, sueP, !ultimaSua);
          if (val > best) best = val;
        });
        if (best > 0) risposte.push([best, p]);
      }
      risposte.sort(function (a, b) { return b[0] - a[0]; });
      var perdita = 0, nessuna = 1;
      risposte.forEach(function (r) { perdita += r[0] * r[1] * nessuna; nessuna *= (1 - r[1]); });
      var s = guadagno - perdita * 0.9 + Math.random() * 0.05;
      if (s > bs) { bs = s; migliore = m; }
    });
    return migliore;
  }

  // la foto per il posto "io" (0..2); io < 0 = chi guarda (dal posto 0, senza le carte in mano di nessuno)
  function vista3(st, io, extra) {
    var pr = st.presa, sette = null, guarda = io < 0, me = guarda ? 0 : io;
    st.prese.forEach(function (p, i) { if (trova(p, "D7")) sette = i; });
    var v = { tre: 1, fase: st.fase, io: me, guarda: guarda ? 1 : 0, turno: st.turno, traguardo: st.traguardo, nMano: st.nMano, pid: st.pid, rifatta: !!st.rifatta,
      nomi: [st.nomi[0] || "", st.nomi[1] || "", st.nomi[2] || ""], avatari: [st.avatari[0] || null, st.avatari[1] || null, st.avatari[2] || null],
      nCarte: [st.mani[0].length, st.mani[1].length, st.mani[2].length], mano: guarda ? [] : st.mani[me].slice(), tavolo: st.tavolo.slice(), mazzoN: st.mazzo.length,
      punti: st.punti.slice(), prese: [st.prese[0].length, st.prese[1].length, st.prese[2].length], scope: st.scope.slice(), sette: sette,
      messaGiu: st.messaGiu, ultimoRound: st.ultimoRound, avviso: st.avviso || null,
      presa: pr ? { seat: pr.seat, mio: pr.seat === me, carta: pr.carta, presiIds: pr.presiIds, tavoloPrima: pr.tavoloPrima, scopa: pr.scopa, resto: !!pr.resto } : null,
      vincitore: st.fase === "fine" ? vincitore3(st.punti) : null };
    if (extra) for (var k in extra) v[k] = extra[k];
    return v;
  }

  // il client (tocchi + tenuta minima dell'animazione della presa), come quello a due
  function creaClient3(t, cb) {
    var C = { vm: null, sel: { carta: null, presa: [] }, uscito: false, inviata: null, _el: t.el, _guarda: !!cb.guarda, cb: cb, _presaFino: 0, _pend: null };
    function vibra() { try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) {} }   // hai scelto
    function mioTurno() { var vm = C.vm; return !!vm && !vm.guarda && vm.fase === "gioco" && vm.turno === vm.io && !vm.presa && !C.inviata; }
    C.tapMano = function (id) {
      if (C.uscito || !mioTurno()) return;
      var carta = trova(C.vm.mano, id); if (!carta) return;
      vibra();
      var opts = catture(carta.v, C.vm.tavolo);
      if (opts.length === 0) { C.sel = { carta: null, presa: [] }; cb.onMossa(id, null); return; }
      if (opts.length === 1) { C.sel = { carta: null, presa: [] }; cb.onMossa(id, opts[0]); return; }
      C.sel = (C.sel.carta === id) ? { carta: null, presa: [] } : { carta: id, presa: [] };
      C.disegna();
    };
    C.tapTavolo = function (id) {
      if (C.uscito || !mioTurno()) return;
      var carta = trova(C.vm.mano, C.sel.carta); if (!carta) return;
      var opts = catture(carta.v, C.vm.tavolo), p = C.sel.presa.slice(), k = p.indexOf(id);
      if (k >= 0) p.splice(k, 1); else p.push(id);
      vibra();
      if (validaSet(opts, p)) { var cs = C.sel.carta; C.sel = { carta: null, presa: [] }; cb.onMossa(cs, p); return; }
      if (prefisso(opts, p)) C.sel.presa = p; else if (prefisso(opts, [id])) C.sel.presa = [id];
      C.disegna();
    };
    C.disegna = function () { if (!C.vm || C.uscito) return; if (C.vm.fase === "gioco") render3(t, C); else renderFine3(t, C); };
    C.manda = function (id) {   // ospite: la carta toccata parte subito (in attesa che l'host risponda)
      C.inviata = id; C.disegna();
      clearTimeout(C._invT);
      C._invT = setTimeout(function () { if (C.inviata === id) { C.inviata = null; C.disegna(); } }, 5000);
    };
    C.esci = function () { C.uscito = true; if (C._pend) { clearTimeout(C._pend); C._pend = null; } clearTimeout(C._invT); if (window.SGMusica) window.SGMusica.ferma(); };
    C.azzera = function () { if (C._pend) clearTimeout(C._pend); C._pend = null; C._presaFino = 0; C.vm = null; C.sel = { carta: null, presa: [] }; C.inviata = null; S3.m = null; };
    C.setVm = function (vm) {
      if (C.uscito || !vm) return;
      if (C.inviata && (!trova(vm.mano || [], C.inviata) || vm.turno !== vm.io)) C.inviata = null;
      if (vm.turno !== vm.io || vm.fase !== "gioco" || vm.presa) C.sel = { carta: null, presa: [] };
      // online: quando arriva il tuo turno, un piccolo suono (non per chi guarda)
      var mio = !vm.guarda && vm.fase === "gioco" && vm.turno === vm.io && !vm.presa;
      if (mio && !C._mioPrima && !cb.locale) suonoTurno();
      C._mioPrima = mio;
      if (C._pend) { clearTimeout(C._pend); C._pend = null; }
      if (vm.presa) { C._presaFino = Date.now() + 1050; C.vm = vm; C.disegna(); return; }   // la presa si vede tutta
      if (C.vm && C.vm.presa && Date.now() < C._presaFino) {
        C._pend = setTimeout(function () { C._pend = null; C.vm = vm; C.disegna(); }, C._presaFino - Date.now());
        return;
      }
      C.vm = vm; C.disegna();
    };
    return C;
  }
  function suonoTurno() {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t0 = ctx.currentTime;
      [[660, 0], [880, 0.09]].forEach(function (n) {
        var o = ctx.createOscillator(), g = ctx.createGain(), tt = t0 + n[1];
        o.type = "sine"; o.frequency.setValueAtTime(n[0], tt);
        g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.12, tt + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.22);
        o.connect(g); g.connect(ctx.destination); o.start(tt); o.stop(tt + 0.25);
      });
    } catch (e) {}
  }

  // ---- la stanza a tre: i due avversari seduti agli angoli del tavolo (stanza4 con due sedie), tu in basso con la mensola.
  //      Si monta UNA volta, poi a ogni mossa si cambia solo quello che cambia (niente lampeggio) ----
  var S3 = { m: null, posti: {}, prevMano: 0, prevTav: {}, avvisoN: null, fineK: null, fineS: null };
  // girato il telefono o cambiata l'altezza dello schermo: la stanza si rifà subito della misura giusta
  var s3GiraT = null;
  window.addEventListener("resize", function () {
    clearTimeout(s3GiraT);
    s3GiraT = setTimeout(function () {
      var m = S3.m, C = m && m.C;
      if (C && !C.uscito && C.vm && C.vm.fase === "gioco" && document.body.contains(m.box)) C.disegna();
    }, 250);
  });
  function sedie3(vm) {
    var io = vm.io, ordine = [(io + 1) % 3, (io + 2) % 3];   // a sinistra chi gioca dopo di te, a destra l'altro
    var mioTurno = !vm.guarda && vm.turno === io && vm.fase === "gioco" && !vm.presa;
    var sedie = ordine.map(function (s) {
      var faccia = "normale", fumetto = null, pr = vm.presa;
      var conSette = pr && pr.carta && (pr.carta.id === "D7" || (pr.presiIds || []).indexOf("D7") >= 0);
      if (pr && pr.scopa) { faccia = s === pr.seat ? "esulta" : "triste"; if (s === pr.seat) fumetto = "🧹 SCOPA!"; }
      else if (pr && conSette) faccia = s === pr.seat ? "esulta" : "triste";
      else if (vm.turno === s && vm.fase === "gioco" && !pr) { faccia = "pensa"; fumetto = "🤔"; }
      var cfg = (vm.avatari && avatarValido(vm.avatari[s])) || null;
      return { cfg: cfg, nome: vm.nomi[s] || "—", n: vm.nCarte[s], turno: vm.turno === s && !pr && vm.fase === "gioco", mia: false, faccia: faccia, fumetto: fumetto,
        salta: faccia === "esulta", seat: s };
    });
    sedie.xs = [0.27, 0.73]; sedie.ioTurno = mioTurno;
    var diTurno = -1; sedie.forEach(function (p, i) { if (p.turno) diTurno = i; });
    sedie.forEach(function (p, i) {   // la chiave di ogni avatar: espressione, fumetto e dove guarda
      var dx = p.turno ? 0 : (diTurno < 0 ? 0 : (diTurno > i ? 3 : (diTurno < i ? -3 : 0))), dy = !p.turno && diTurno < 0 && mioTurno ? 2.5 : 0;
      p.chiave = p.faccia + "|" + (p.fumetto || "") + "|" + dx + "," + dy + "|" + (vm.presa ? (vm.presa.carta ? vm.presa.carta.id : "resto") : "");
    });
    return sedie;
  }
  function render3(t, C) {
    var vm = C.vm;
    assicuraStile();
    // chi guarda non ha suoni; se il core ci porta via (la Sala passa a un amico) la musica si ferma da sola
    if (window.SGMusica && !C._guarda) window.SGMusica.avvia(function () { return !C.uscito && !!S3.m && S3.m.C === C && document.body.contains(S3.m.box); });
    // chi guarda soltanto (fuori dal torneo): in basso la targhetta del core, la schermata le lascia il posto (misure a parte)
    var tg = !!(C._guarda && t.guarda && !t.eliminazione);
    var wH = larghezza(3, 10, 104), M = misureStanza4(tg ? "scopa3g" : "scopa3", wH, 1);
    var key = [vm.io, vm.guarda, tg, M.scW, M.scH, M.wT, wH, JSON.stringify(vm.nomi), JSON.stringify(vm.avatari || null)].join("|");
    if (!(S3.m && S3.m.C === C && S3.m.key === key && document.body.contains(S3.m.box))) {
      if (!monta3(t, C, M, wH, key, vm)) return;   // (rifatta della misura giusta: ha già disegnato tutto)
    }
    aggiorna3(t, C, vm, M);
    // con le carte in mano la mensola può crescere un poco: se la schermata esce dallo schermo, si rifà più bassa (una volta)
    if (ricontrollaStanza4(M, S3.m.cont.parentNode)) { S3.m = null; render3(t, C); }
  }
  function monta3(t, C, M, wH, key, vm) {
    var el = t.el, cb = C.cb;
    var box = el("div", { style: "display:flex;flex-direction:column" });
    var head = el("div", { class: "sc-testata" }), punti = el("div", { class: "sc-punti1" }), destra = el("div", { class: "sc-destra" });
    // 💬 faccine e frasi (chi guarda: solo faccine); si vede solo quando si può usare (vedi aggiorna3)
    var bCh = cb.onChiac ? window.SGChiacchiere.tasto({ gioco: "scopa", soloFaccine: !!vm.guarda, onScegli: function (c) { cb.onChiac(c); } }) : null;
    if (bCh) { bCh.hidden = true; destra.appendChild(bCh); }
    if (window.SGMusica && !C._guarda) destra.appendChild(window.SGMusica.bottone(el));
    head.appendChild(punti); head.appendChild(destra);
    var sedie = sedie3(vm), R = stanza4(el, M, sedie);
    R.scena.appendChild(head);
    var area = el("div", { class: "sc-terra sc-t3d" }), griglia = el("div");
    area.appendChild(griglia); R.feltro.appendChild(area);
    var aiuto = el("div", { class: "sc-aiuto" }); aiuto.hidden = true; R.scena.appendChild(aiuto);
    box.appendChild(R.scena);
    // (altezze fisse: la mensola resta uguale con la mano piena o vuota, così la stanza si misura giusta)
    var mensola = el("div", { class: "sc-mensola sc-mensola1", style: "min-height:" + (Math.round(wH * ASP_CARTA) + 34) + "px" });
    var tocca = el("div", { class: "sc-tocca" });
    var manoW = el("div", { class: "sc-mano-riga", style: "min-height:" + Math.round(wH * ASP_CARTA) + "px" }), prese = el("div", { class: "sc-prese", style: "min-height:1.6em" });
    mensola.appendChild(tocca); mensola.appendChild(manoW); mensola.appendChild(prese);
    box.appendChild(mensola);
    var cont, vecchio = S3.m;
    if (vecchio && vecchio.C === C && vecchio.cont && document.body.contains(vecchio.box)) { vecchio.cont.replaceChild(box, vecchio.box); cont = vecchio.cont; }
    else {
      var s = t.schermata({ scura: true, indietro: function () { if (C._guarda) cb.onEsci(); else chiediEsci(t, cb.onEsci); } });   // (scura: la stanza col tavolo vero)
      s.classList.add("sc-piena");   // stanza da bordo a bordo
      if (C._guarda && t.guarda && !t.eliminazione) s.classList.add("sc-con-targa");   // (il posto della targhetta di chi guarda)
      s._contenuto.appendChild(box); t.mostra(s);
      cont = s._contenuto;
    }
    S3.m = { C: C, key: key, box: box, cont: cont, R: R, punti: punti, bCh: bCh, area: area, griglia: griglia, aiuto: aiuto, mensola: mensola, manoW: manoW, prese: prese, tocca: tocca,
      tav: {}, mano: {}, wT: null, wH: wH, chiaviSedie: sedie.map(function (p) { return p.chiave; }), gioc: null, presaKey: null };
    if (correggiStanza4(M, cont.parentNode, mensola, function () { render3(t, C); })) return false;
    R.siedi();
    return true;
  }
  function aggiorna3(t, C, vm, M) {
    var el = t.el, m = S3.m, R = m.R, io = vm.io, cb = C.cb;
    var mioTurno = !vm.guarda && vm.turno === io && vm.fase === "gioco" && !vm.presa && !C.inviata && vm.mano.length > 0;
    // ---- in alto: i punti di tutti e tre (prima tu), il 💬 ----
    var ord = [io, (io + 1) % 3, (io + 2) % 3];
    var pTxt = (vm.guarda ? "👀 " : "") + ord.map(function (s) {
      var tu = s === io && !vm.guarda, nome = esc(tu ? "Tu" : corto(vm.nomi[s], 7));
      return tu ? "<b>" + nome + " " + vm.punti[s] + "</b>" : nome + " " + vm.punti[s];
    }).join(" · ") + " <span class='tenue' style='font-weight:600'>(" + testoTraguardo(vm.traguardo) + ")</span>";
    if (m.pTxt !== pTxt) { m.pTxt = pTxt; m.punti.innerHTML = pTxt; }
    if (m.bCh) { var chOn = cb.locale ? true : vm.ch === 1; if (m.bCh.hidden === chOn) m.bCh.hidden = !chOn; }
    // ---- gli avversari: cambio il disegno solo di chi cambia espressione (o direzione dello sguardo) ----
    var sedie = sedie3(vm), nuove = null, rifai = false;
    sedie.forEach(function (p, i) {
      var pos = R.posti[i];
      pos.p.salta = false;
      if (m.chiaviSedie[i] !== p.chiave) {
        if (!nuove) nuove = stanza4(el, M, sedie);   // disegni pronti (non montati): ne prendo solo l'avatar
        var nf = nuove.posti[i];
        while (pos.fig.firstChild) pos.fig.removeChild(pos.fig.firstChild);
        while (nf.fig.firstChild) pos.fig.appendChild(nf.fig.firstChild);
        var vf = pos.box.querySelector(".sc-fumetto"); if (vf) pos.box.removeChild(vf);
        var ff = nf.box.querySelector(".sc-fumetto"); if (ff) pos.box.appendChild(ff);
        pos.box.className = "sc-avv" + (p.faccia === "pensa" ? " pensa" : "");
        pos.p.faccia = p.faccia; pos.p.salta = p.salta;
        m.chiaviSedie[i] = p.chiave; rifai = true;
      }
      var cl = "sc-targa4" + (p.turno ? " turno" : "");
      if (pos.targa.className !== cl) pos.targa.className = cl;
      var num = pos.targa.querySelector(".sc-num"); if (num && num.textContent !== String(p.n)) num.textContent = p.n;
      while (pos.vent.children.length > p.n) { pos.vent.removeChild(pos.vent.lastChild); rifai = true; }
      while (pos.vent.children.length < p.n) { pos.vent.appendChild(el("div", { class: "sc-dorso" })); rifai = true; }
    });
    if (rifai) R.siedi();

    // ---- il tavolo: le carte restano al loro posto, si aggiungono e si tolgono una per una ----
    var cartaSel = C.sel.carta ? trova(vm.mano, C.sel.carta) : null;
    var opts = mioTurno && cartaSel ? catture(cartaSel.v, vm.tavolo) : [];
    var tutte = {}, verdi = {};
    opts.forEach(function (set) { set.forEach(function (id) { tutte[id] = true; }); });
    opts.filter(function (set) { return C.sel.presa.every(function (id) { return set.indexOf(id) >= 0; }); })
      .forEach(function (set) { set.forEach(function (id) { if (C.sel.presa.indexOf(id) < 0) verdi[id] = true; }); });
    var carteTav = (vm.presa && vm.presa.tavoloPrima) ? vm.presa.tavoloPrima : vm.tavolo;
    var P = postiTavolo(S3.posti, carteTav, M), wT = P.w;
    if (m.wT !== wT) { for (var k0 in m.tav) { var e0 = m.tav[k0]; if (e0.parentNode) e0.parentNode.removeChild(e0); } m.tav = {}; m.wT = wT; }
    var g0 = P.griglia(el); if (m.griglia.style.cssText !== g0.style.cssText) m.griglia.style.cssText = g0.style.cssText;
    var presente = {}, nuoveTav = [], dir = vm.presa ? (vm.presa.seat === io ? "giu" : "su") : null, presiEls = [];
    carteTav.forEach(function (c) {
      presente[c.id] = true;
      var cel = m.tav[c.id];
      if (!cel) {
        cel = cartaEl(el, c, wT, "", function () { if (cel._tocca) C.tapTavolo(c.id); });
        m.tav[c.id] = cel;
        if (c.id === vm.messaGiu && !vm.presa) cel.classList.add("sc-cade");   // appena messa giù: si posa sul tavolo
        else if (!S3.prevTav[c.id] && !vm.presa) nuoveTav.push(cel);
        m.griglia.appendChild(cel);
      }
      P.metti(cel, c.id);
      var presa = !!(vm.presa && vm.presa.presiIds.indexOf(c.id) >= 0);
      var sceglibile = mioTurno && !!cartaSel && !!tutte[c.id];
      cel._tocca = sceglibile;
      cel.style.cursor = sceglibile ? "pointer" : "";
      cel.classList.toggle("presel", sceglibile && C.sel.presa.indexOf(c.id) >= 0);
      cel.classList.toggle("cap", sceglibile && !!verdi[c.id]);
      if (presa && !cel.classList.contains("sc-lascia-" + dir)) cel.classList.add("sc-lascia-" + dir);
      if (presa) presiEls.push(cel);
    });
    for (var id in m.tav) if (!presente[id]) { var ev = m.tav[id]; if (ev.parentNode) ev.parentNode.removeChild(ev); delete m.tav[id]; }
    // la carta giocata che va a prendere (una volta per presa)
    var pKey = vm.presa && vm.presa.carta ? vm.presa.seat + ":" + vm.presa.carta.id : null;
    if (pKey !== m.presaKey) {
      if (m.gioc && m.gioc.parentNode) m.gioc.parentNode.removeChild(m.gioc);
      m.gioc = null; m.presaKey = pKey;
      if (pKey) {
        var gioc = cartaEl(el, vm.presa.carta, wT);
        gioc.style.cssText += ";position:absolute;z-index:6;opacity:0";
        m.area.appendChild(gioc); m.gioc = gioc;
        if (presiEls.length) {   // posizioni misurate SUL tavolo inclinato
          var cx = 0, cy = 0;
          presiEls.forEach(function (e) { cx += e.offsetLeft + e.offsetWidth / 2; cy += e.offsetTop + e.offsetHeight / 2; });
          cx /= presiEls.length; cy /= presiEls.length;
          gioc.style.left = (cx - gioc.offsetWidth / 2) + "px"; gioc.style.top = (cy - gioc.offsetHeight / 2) + "px";
        } else { gioc.style.left = "50%"; gioc.style.top = "50%"; gioc.style.marginLeft = (-wT / 2) + "px"; gioc.style.marginTop = (-Math.round(wT * ASP_CARTA) / 2) + "px"; }
        gioc.style.animation = "scGioca" + (dir === "giu" ? "Giu" : "Su") + " .95s ease-in forwards";
      }
    }

    // ---- le scritte sul tavolo: come prendere, SCOPA!, le carte rimaste, i tre Re ----
    var chiaveMano = vm.pid + ":" + vm.nMano, testo = null, forte = false;
    if (vm.rifatta && S3.rifK !== chiaveMano) { S3.rifK = chiaveMano; S3.rifFino = Date.now() + 2600; }
    if (vm.presa && vm.presa.scopa) { testo = (vm.presa.seat === io && !vm.guarda ? "SCOPA!" : "SCOPA di " + vm.nomi[vm.presa.seat] + "!") + " 🧹"; forte = true; }
    else if (vm.presa && vm.presa.resto) testo = vm.presa.seat === io && !vm.guarda ? "Le carte rimaste sono tue! 🙌" : "Le carte rimaste vanno a " + vm.nomi[vm.presa.seat];
    else if (mioTurno && cartaSel && opts.length >= 2) testo = opts[0].length === 1 ? "Tocca la carta verde da prendere." : "Tocca le carte verdi che sommano a " + cartaSel.v + ".";
    else if (S3.rifK === chiaveMano && Date.now() < (S3.rifFino || 0)) testo = "👑 Tre Re in tavola: si rimescola!";
    if (testo) {
      if (m.aiuto.textContent !== testo) m.aiuto.textContent = testo;
      var stile = forte ? "border-color:var(--n-mini);font-size:1.1rem" : "";
      if ((m.aiuto.getAttribute("style") || "") !== stile) m.aiuto.setAttribute("style", stile);
      m.aiuto.hidden = false;
    } else m.aiuto.hidden = true;
    // un avviso di passaggio (un amico è uscito o è tornato)
    if (vm.avviso && vm.avviso.n !== S3.avvisoN) {
      S3.avvisoN = vm.avviso.n;
      var av = el("div", { class: "sc3-avviso", text: vm.avviso.testo }); R.scena.appendChild(av);
      setTimeout(function () { if (av.parentNode) av.parentNode.removeChild(av); }, 3300);
    }

    // ---- la tua mano (sulla mensola di legno); chi guarda vede le carte coperte del posto in basso ----
    var mano = vm.guarda ? [] : vm.mano, presenteM = {}, nuoveMano = [];
    mano.forEach(function (c, i) {
      presenteM[c.id] = true;
      var cel = m.mano[c.id];
      if (!cel) { cel = cartaEl(el, c, m.wH, "", function () { C.tapMano(c.id); }); m.mano[c.id] = cel; nuoveMano.push(cel); }
      if (m.manoW.children[i] !== cel) m.manoW.insertBefore(cel, m.manoW.children[i] || null);
      cel.classList.toggle("sel", C.sel.carta === c.id);
      cel.classList.toggle("inviata", C.inviata === c.id);
      cel.style.cursor = mioTurno ? "pointer" : "";
    });
    if (vm.guarda) {   // (coperte: tante quante ne ha in mano chi sta in basso)
      var nD = vm.nCarte[io];
      [].slice.call(m.manoW.querySelectorAll(".sc-dorso")).slice(nD).forEach(function (d) { d.parentNode.removeChild(d); });
      for (var q = m.manoW.querySelectorAll(".sc-dorso").length; q < nD; q++) { var dd = dorsoEl(el, m.wH); m.manoW.appendChild(dd); nuoveMano.push(dd); }
    }
    for (var idm in m.mano) if (!presenteM[idm]) { var em = m.mano[idm]; if (em.parentNode) em.parentNode.removeChild(em); delete m.mano[idm]; }
    var suo = vm.turno === io && vm.fase === "gioco" && !vm.presa && (vm.guarda ? vm.nCarte[io] > 0 : vm.mano.length > 0);
    m.mensola.classList.toggle("tuo", suo && !C.inviata);
    var tTxt = vm.guarda ? "Tocca a " + corto(vm.nomi[io], 14) : "Tocca a te!";
    if (m.tocca.textContent !== tTxt) m.tocca.textContent = tTxt;
    var prTxt = (vm.guarda ? esc(corto(vm.nomi[io], 12)) + " · prese" : "le tue prese") + " <b>" + vm.prese[io] + "</b>" + (vm.sette === io ? " · 7💰" : "") +
      (vm.scope[io] ? " · scope " + vm.scope[io] : "") + " · " + (vm.mazzoN ? "mazzo " + vm.mazzoN : "<b style='color:var(--n-mini)'>ultimo giro!</b>");
    if (m.prTxt !== prTxt) { m.prTxt = prTxt; m.prese.innerHTML = prTxt; }

    // ---- la distribuzione quando la mano si riempie (inizio mano e ogni giro) ----
    var nMano = vm.guarda ? vm.nCarte[io] : vm.mano.length;
    var dealing = !vm.presa && vm.fase === "gioco" && nMano > S3.prevMano;
    S3.prevMano = nMano;
    S3.prevTav = {}; vm.tavolo.forEach(function (c) { S3.prevTav[c.id] = true; });
    if (dealing) C._dealFino = Date.now() + animaDistribuzione4(nuoveTav, nuoveMano,
      [R.posti[0], R.posti[1]].map(function (p) { return [].slice.call(p.vent.children); }), R.feltro, 0.16);
  }

  // riepilogo di fine smazzata / fine partita, con una colonna per giocatore (prima tu)
  function renderFine3(t, C) {
    var vm = C.vm, cb = C.cb, el = t.el, r = vm.ultimoRound, fine = vm.fase === "fine";
    var kF = vm.pid + ":" + vm.nMano + ":" + vm.fase;
    if (S3.fineK === kF && S3.fineS && document.body.contains(S3.fineS)) { scriviVoti(vm); return; }   // già mostrata: cambia solo «⏩ Avanti (1 su 3)»
    S3.fineK = kF; S3.m = null; S3.prevMano = 0; S3.prevTav = {};
    var io = vm.io, w = vm.vincitore, tu = !vm.guarda;
    var titolo = !fine ? "Fine smazzata" : w == null ? "Pareggio!" : (tu && w === io ? "Hai vinto!" : "Ha vinto " + vm.nomi[w]);
    function esci() { if (fine || vm.guarda) return cb.onEsci(); chiediEsci(t, cb.onEsci); }
    var s = t.schermata({ icona: fine ? "🏆" : "🧮", titolo: titolo, sotto: "Scopa in tre", indietro: esci });
    if (r) {
      var ord = [io, (io + 1) % 3, (io + 2) % 3], p = r.p, n = 0, cont = el("div", { class: "sc-riep sc3-riep" });
      var per = function (a) { return ord.map(function (x) { return a[x]; }); };
      var riga = function (nome, vals, vinc, cls, badge) {
        var celle = ord.map(function (x, i) { var b = badge ? badge[i] : (vinc === x ? "+1" : ""); return el("span", { class: vinc === x ? "vinto" : "", html: vals[i] + (b ? "<span class='sc-piu'>" + b + "</span>" : "") }); });
        cont.appendChild(el("div", { class: "sc-rg" + (cls ? " " + cls : ""), style: "animation-delay:" + (n++ * 0.2).toFixed(2) + "s" }, [el("span", { text: nome })].concat(celle)));
      };
      cont.appendChild(el("div", { class: "sc-rg testa" }, [el("span")].concat(ord.map(function (x) { return el("span", { text: x === io && tu ? "Tu" : vm.nomi[x] }); }))));
      riga("Carte", per(p.carte), p.pCarte);
      riga("Denari", per(p.den), p.pDen);
      riga("Settebello", ord.map(function (x) { return p.sette === x ? "7💰" : "—"; }), p.sette);
      riga("Primiera", ord.map(function (x) { return p.primOk[x] ? p.prim[x] : "<span class='manca'>manca seme</span>"; }), p.pPrim);
      var sc = per(r.scope);
      riga("Scope", sc, null, "", sc.map(function (x) { return x ? "+" + x : ""; }));
      riga("Punti", per(r.guad).map(function (x) { return "+" + x; }), null);
      riga("Totale", per(r.tot), fine && w != null ? w : null, "tot", ["", "", ""]);
      var barre = [];
      if (vm.traguardo) {   // la strada verso il traguardo
        var bb = ord.map(function (x, i) { var b = el("b", { style: "transform:scaleX(0);background:" + (i ? "var(--o-rosso)" : "var(--o-verde)") }); barre.push([b, Math.min(1, r.tot[x] / vm.traguardo)]); return el("div", { class: "sc-barra" }, [b]); });
        cont.appendChild(el("div", { class: "sc-rg", style: "animation-delay:" + (n++ * 0.2).toFixed(2) + "s;font-size:.8rem" }, [el("span", { text: "Verso " + vm.traguardo })].concat(bb)));
      }
      if (p.pCarte == null || p.pDen == null || p.pPrim == null)
        cont.appendChild(el("div", { class: "sc-detto", style: "animation-delay:" + (n++ * 0.2).toFixed(2) + "s;font-weight:700;font-size:.8rem", text: "A pari merito il punto non va a nessuno." }));
      s._contenuto.appendChild(cont);
      if (barre.length) setTimeout(function () { barre.forEach(function (x) { x[0].style.transform = "scaleX(" + x[1] + ")"; }); }, 40);
    }
    var nota = function (txt) { var q = el("p", { class: "modulo-nota", style: "margin:0 0 6px;text-align:center", text: txt }); s._piede.appendChild(q); return q; };
    // chi guarda soltanto (fuori dal torneo) ha la targhetta del core in basso: faccine e uscita sono lì
    var targa = !!(vm.guarda && t.guarda && !t.eliminazione);
    if (targa) s._piede.style.paddingBottom = "calc(58px + env(safe-area-inset-bottom))";
    var fa = !cb.locale && !targa && t.faccine ? t.faccine() : null;   // online: la fila delle faccine (il mio avatar le fa sui telefoni di tutti)
    if (fa) { fa.style.margin = "0 0 8px"; s._piede.appendChild(fa); }
    var kConto = "smazzata3|" + vm.pid + ":" + vm.nMano;
    if (vm.guarda) {
      // a fine partita i tasti del core, se ne ha per chi guarda (chi è in più nella stanza: solo nella Sala con "Chi gioca?")
      if (!(fine && !cb.locale && (t.guarda || t.scelti) && t.tastiFine && t.tastiFine(s._piede, { host: false, esci: cb.onEsci }))) {
        var pg = nota(!fine ? "In attesa della prossima smazzata…" : (t.guarda ? "👀 Aspettiamo la prossima partita…" : "In attesa dell'host per un'altra partita…"));
        if (!fine && t.contoAvanti) t.contoAvanti(pg, 12, null, kConto);
        if (!targa) s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
      }
    } else if (fine) {
      // online: i tasti di fine uguali per tutti, se li disegna il core (se no quelli di sempre)
      if (!(!cb.locale && t.tastiFine && t.tastiFine(s._piede, { host: !!cb.sonoHost, nuova: cb.sonoHost ? cb.onSaletta : null, esci: cb.onEsci }))) {
        if (cb.sonoHost || cb.locale) s._piede.appendChild(el("button", { class: "btn btn-primario", text: cb.locale ? "🔄 Nuova partita" : "🔄 Nuova partita (in saletta)", onclick: cb.onNuova }));
        else nota("Se l'host fa una nuova partita, torni in saletta con lui.");
        s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: esci }));
      }
      if (w != null && (w === io && tu)) setTimeout(function () { suonoPresa(true, false); }, 900);
    } else {
      if (cb.sonoHost || cb.locale) {
        var bC = el("button", { class: "btn btn-primario", text: "Continua ▶", onclick: cb.onAvanti });
        s._piede.appendChild(bC);
        if (!cb.locale && t.contoAvanti) t.contoAvanti(bC, 12, cb.onAvanti, kConto);   // (il conto chiama la funzione: niente vibrazione)
      } else {
        var po = nota("La prossima smazzata parte tra pochi secondi…");
        if (t.contoAvanti) t.contoAvanti(po, 12, null, kConto);
        if (cb.onVota) {   // «⏩ Avanti»: se lo tocca più di metà di chi gioca si parte subito
          var bV = el("button", { class: "btn btn-primario sc3-vota", onclick: function () { if (S3.votato === kConto) return; S3.votato = kConto; cb.onVota(); scriviVoti(C.vm); } });
          s._piede.appendChild(bV); S3.bVoto = bV; scriviVoti(vm);
        }
      }
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: esci }));
    }
    t.mostra(s); S3.fineS = s;
  }
  // il tasto «⏩ Avanti» di chi entra: quanti l'hanno già toccato (si cambia solo la scritta)
  function scriviVoti(vm) {
    var b = S3.bVoto; if (!b || !vm || !document.body.contains(b)) return;
    var mio = S3.votato === "smazzata3|" + vm.pid + ":" + vm.nMano, n = vm.av || 0, tot = vm.avTot || 3;
    var tx = (mio ? "✓ " : "⏩ ") + "Avanti" + (n ? " · " + n + " su " + tot : "");
    if (b.textContent !== tx) b.textContent = tx;
    b.disabled = mio;
  }
  // 💬 una chiacchiera al tavolo a tre: la mia sopra la mensola, quella di un avversario sotto la sua targa, chi guarda in basso a sinistra
  function chiac3(C, k, c, nome) {
    var X = window.SGChiacchiere, m = S3.m; if (!X || !C || C.uscito) return;
    var vm = C.vm, muto = !!C._guarda, seat = typeof k === "number" && k >= 0 && k <= 2 ? k : -1;
    var vivo = m && m.C === C && document.body.contains(m.box) && vm && vm.fase === "gioco";
    if (vivo && seat >= 0) {
      if (seat === vm.io) return X.bolla(m.mensola, "scopa", c, { muto: muto, nome: vm.guarda ? vm.nomi[seat] : null });
      return X.bolla(m.R.posti[seat === (vm.io + 1) % 3 ? 0 : 1].targa, "scopa", c, { sotto: true, muto: muto });
    }
    X.volante("scopa", c, seat >= 0 && vm ? vm.nomi[seat] : nome, muto);
  }
  // i bot del gruppo fisso (sempre gli stessi nomi e avatar in tutti i giochi), scelti per la bravura
  function prendiBot3(n, livello, escludi) {
    var b = null;
    try { if (SG.bot && SG.bot.prendi) b = SG.bot.prendi(n, { livello: livello, escludi: escludi }); } catch (e) {}
    b = (b || []).slice(0, n);
    while (b.length < n) b.push({ nome: b.length ? "Bot " + (b.length + 1) : "Bot", omino: null });
    return b;
  }

  // ---------- IN TRE CONTRO DUE BOT (tu sei il posto 0) ----------
  function localeScopa3(t, diff) {
    var io = (t.giocatori && t.giocatori[0]) || "Tu";
    var bots = prendiBot3(2, diff, [io, t.nomeProfilo && t.nomeProfilo()]), botSeat = { 0: false, 1: true, 2: true };
    var M = null, botT = null, detto = false;
    function nuova(primo) {
      M = creaMotore3(traguardoDa(t.impostazioni), null, primo);
      M.st.nomi = { 0: io, 1: bots[0].nome, 2: bots[1].nome };
      M.st.avatari = { 0: mioAvatar(io), 1: bots[0].omino || null, 2: bots[1].omino || null };
      detto = false;
    }
    var C = creaClient3(t, {
      locale: true, sonoHost: true,
      // 💬 contro i Bot: il mio fumetto, e ogni tanto uno dei due risponde
      onChiac: function (c) {
        if (C.uscito || !M || M.st.fase !== "gioco" || !window.SGChiacchiere.valido("scopa", c)) return;
        chiac3(C, 0, c);
        var M0 = M, chi = Math.random() < 0.5 ? 1 : 2;
        window.SGChiacchiere.rispondeBot(function (r) { if (!C.uscito && M === M0 && M.st.fase === "gioco") chiac3(C, chi, r); });
      },
      onMossa: function (id, presa) { var ev = M.gioca(0, id, presa); if (!ev.errore) dopoGiocata(ev); },
      onAvanti: function () { if (M.st.fase !== "fineround") return; M.prossimoRound(); aggiorna(); giro(); },
      onNuova: function () { nuova((M.st.primoPartita + 1) % 3); aggiorna(); giro(); },   // nella partita dopo comincia il prossimo
      onEsci: function () { C.esci(); clearTimeout(botT); t.esci(); }
    });
    function aggiorna() {
      if (C.uscito) return;
      C.setVm(vista3(M.st, 0));
      if (M.st.fase === "fine" && !detto) { detto = true; if (t.risultato) t.risultato(classifica3(M.st, botSeat)); }
    }
    function dopoGiocata(ev) {
      suonoPresa(ev.scopa, ev.seat === 0);   // vibra solo la mia
      aggiorna();
      var m0 = M;
      dopoMossa(M, ev, aggiorna, giro, function () { return !C.uscito && M === m0; });
    }
    function giro() {
      if (C.uscito || botT || M.st.fase !== "gioco" || M.st.presa || !botSeat[M.st.turno]) return;
      var m0 = M;
      botT = setTimeout(function () {
        botT = null;
        if (C.uscito || M !== m0 || M.st.fase !== "gioco" || M.st.presa || !botSeat[M.st.turno]) return;
        var s = M.st.turno, mo = mossaBot3(M.st, s, diff); if (!mo) return;
        var ev = M.gioca(s, mo.carta, mo.presa); if (!ev.errore) dopoGiocata(ev);
      }, Math.max(650 + Math.random() * 400, (C._dealFino || 0) - Date.now() + 250));   // i bot aspettano la fine della distribuzione
    }
    S3.m = null; S3.posti = {}; S3.prevMano = 0; S3.prevTav = {};
    nuova(0); aggiorna(); giro();
  }

  // ---------- ONLINE IN TRE: host = posto 0; gli amici i posti 1 e 2; i posti liberi al Bot ----------
  // R = la stanza condivisa con la Scopa a due (vedi presaHost): l'host può passare da due a tre in saletta senza far uscire nessuno
  // rip = la partita da riprendere (l'host ha ricaricato: vedi hostScopaAuto), o null
  function hostScopa3(t, R, rip) {
    var imp0 = t.impostazioni || {}, diff = imp0.difficolta || "medio";
    var CHI = window.SGChiacchiere, filtra = CHI.filtro(), chOn = CHI.attive(imp0);
    var M = null, rete = null, codice = "…", pronta = false, chiuso = false, botT = null, detto = false, nAvv = 0, primoDopo = 0;
    var posti = { 1: null, 2: null }, nomiU = { 1: null, 2: null }, avU = { 1: null, 2: null }, via = {}, botSeat = { 0: false, 1: true, 2: true }, guarda = [];
    var ricorda = ricordatore(t, !!rip);
    function ricordaOra() {   // dopo ogni cambiamento: la mano com'è, chi è seduto e dove (in saletta niente da riprendere)
      ricorda(M ? { scopa: { tre: 1, diff: diff, nAvv: nAvv, posti: posti, nomiU: nomiU, avU: avU, via: via, botSeat: botSeat, st: M.esporta() } } : null);
    }
    // ---- la ripresa: stessa mano, stessi posti. Chi era seduto resta al suo posto e rientra da solo (gli si rimanda la
    // sua mano); se non torna, al suo turno dopo un minuto gioca il Bot per lui (come sempre)
    if (rip && rip.st) {
      diff = rip.diff || diff; nAvv = +rip.nAvv || 0;
      ["posti", "nomiU", "avU"].forEach(function (k) { var x = rip[k] || {}; for (var s = 1; s <= 2; s++) ({ posti: posti, nomiU: nomiU, avU: avU })[k][s] = x[s] || null; });
      via = rip.via && typeof rip.via === "object" ? rip.via : {};
      if (rip.botSeat) for (var sb = 1; sb <= 2; sb++) botSeat[sb] = !!rip.botSeat[sb];
      M = creaMotore3(traguardoDa(imp0), null, rip.st.primoPartita || 0);
      M.importa(rip.st);
      detto = M.st.fase === "fine";   // (la classifica era già stata data)
      S3.posti = {}; S3.prevMano = 0; S3.prevTav = {};
    }
    function mioNome() { return (t.giocatori && t.giocatori[0]) || "Host"; }
    function mioAv() { return t.mioOmino ? t.mioOmino(mioNome()) : mioAvatar(mioNome()); }
    function seatDi(id) { for (var s = 1; s <= 2; s++) if (posti[s] === id) return s; return -1; }
    function postoLibero() { for (var s = 1; s <= 2; s++) if (!posti[s]) return s; return 0; }
    function mettiBot(s) {   // un bot del gruppo fisso per un posto libero: mai uno già al tavolo, né col nome di chi gioca o guarda
      var escludi = [mioNome()], k;
      for (k = 1; k <= 2; k++) if (nomiU[k]) escludi.push(nomiU[k]);
      if (M) for (k = 0; k < 3; k++) if (M.st.nomi[k] && k !== s) escludi.push(M.st.nomi[k]);
      Object.keys(via).forEach(function (x) { escludi.push(via[x].nome); });
      guarda.forEach(function (g) { escludi.push(g.nome); });
      var b = prendiBot3(1, diff, escludi)[0]; M.st.nomi[s] = b.nome; M.st.avatari[s] = b.omino || null;
    }
    function avviso(testo) { if (M) M.st.avviso = { n: ++nAvv, testo: testo }; }
    function esci() { if (chiuso) return; ricorda(null); chiuso = true; C.esci(); clearTimeout(botT); fermaTurno(); if (rete) rete.chiudi(); t.esci(); }
    var C = creaClient3(t, {
      sonoHost: true,
      onChiac: function (c) { if (!chOn || !M || M.st.fase !== "gioco" || !CHI.valido("scopa", c)) return; chiac3(C, 0, c); if (rete) rete.inviaVeloce({ t: "chiac", k: 0, id: "host", c: c }); },
      onMossa: function (id, presa) { if (M) passo(0, id, presa); },
      onAvanti: function () { if (!chiuso && M && M.st.fase === "fineround") { M.prossimoRound(); bcast(); giro(); } },
      onNuova: function () { allaSaletta(); }, onSaletta: function () { allaSaletta(); },
      onEsci: esci
    });
    function vistaDi(s) { return vista3(M.st, s, { ch: chOn ? 1 : 0, av: votiN(), avTot: umani() }); }
    // «⏩ Avanti» sul riepilogo: se lo tocca più di metà di chi gioca (persone, non Bot) si parte subito
    var voti = { k: null, ids: {} };
    function umani() { var n = 1; for (var s = 1; s <= 2; s++) if (posti[s]) n++; return n; }
    function votiN() { if (!M || M.st.fase !== "fineround" || voti.k !== M.st.nMano) return 0; var n = 0; for (var s = 1; s <= 2; s++) if (posti[s] && voti.ids[posti[s]]) n++; return n; }
    function mandaVm(s) { if (rete && posti[s]) rete.inviaVeloce({ t: "vm", tre: 1, to: posti[s], vm: vistaDi(s) }); }   // solo a lui, e non resta nella stanza
    function bcast() {
      if (chiuso) return;
      if (!M) return aggiornaLobby();
      ricordaOra();
      // nella stanza resta la foto di chi guarda (nessuna carta in mano); a ognuno la sua
      if (rete) rete.invia({ t: "vm", tre: 1, guarda: 1, vm: vistaDi(-1) });
      for (var s = 1; s <= 2; s++) mandaVm(s);
      C.setVm(vistaDi(0));
      if (M.st.fase !== "fine") { detto = false; return; }
      if (!detto && t.risultato) { detto = true; t.risultato(classifica3(M.st, botSeat)); }
    }
    function passo(seat, id, presa) {
      if (chiuso || !M || M.st.turno !== seat) return;
      var ev = M.gioca(seat, id, presa); if (ev.errore) return;
      nGioc++; fermaTurno();
      suonoPresa(ev.scopa, seat === 0);   // vibra solo la mia
      bcast();
      var m0 = M;
      dopoMossa(M, ev, bcast, giro, function () { return !chiuso && M === m0; });
    }
    function giro() {
      if (chiuso || !M || M.st.fase !== "gioco" || M.st.presa) return;
      if (!botSeat[M.st.turno]) return turnoUmano();
      if (botT) return;
      var m0 = M;
      botT = setTimeout(function () {
        botT = null;
        if (chiuso || M !== m0 || M.st.fase !== "gioco" || M.st.presa || !botSeat[M.st.turno]) return;
        var s = M.st.turno, mo = mossaBot3(M.st, s, diff); if (mo) passo(s, mo.carta, mo.presa);
      }, Math.max(700 + Math.random() * 350, (C._dealFino || 0) - Date.now() + 250));
    }
    // tocca a una persona: se non gioca per un minuto (distratta, telefono in tasca) il Bot gioca UNA carta al posto suo
    // (avviso 15 secondi prima); il posto resta suo. Così la partita non resta mai ferma.
    var nGioc = 0, turnoK = null, tTurno = [];
    function fermaTurno() { tTurno.forEach(clearTimeout); tTurno = []; turnoK = null; }
    function turnoUmano() {
      var k = nGioc; if (turnoK === k) return;
      fermaTurno(); turnoK = k;
      var m0 = M, s = M.st.turno, sec = window.__scopaTurno3 || TEMPO_TURNO3;   // (le prove lo accorciano)
      function ancora() { return !chiuso && M === m0 && M.st.fase === "gioco" && M.st.turno === s && turnoK === k && !botSeat[s] && !M.st.presa; }
      tTurno.push(setTimeout(function () { if (ancora()) { avviso("⏱️ " + M.st.nomi[s] + ", tra 15 secondi gioca il Bot al posto tuo"); bcast(); } }, Math.max(0, sec - 15) * 1000));
      tTurno.push(setTimeout(function () {
        if (!ancora()) return;
        var mo = mossaBot3(M.st, s, "medio"); if (!mo) return;
        avviso("⏱️ " + M.st.nomi[s] + " ci pensava troppo: il Bot ha giocato al posto suo");
        passo(s, mo.carta, mo.presa);
      }, sec * 1000));
    }
    function rientra(s) {   // chi era uscito a partita in corso torna al suo posto (al posto del bot)
      var v = via[s]; delete via[s];
      posti[s] = v.id; nomiU[s] = v.nome; avU[s] = v.omino; botSeat[s] = false;
      M.st.nomi[s] = v.nome; M.st.avatari[s] = v.omino;
      avviso(v.nome + " è tornato al tavolo!");
      bcast(); giro();
    }
    function allaSaletta() {   // "Nuova partita" / la Rivincita della Sala: tutti in saletta (poi comincia il prossimo)
      if (!M || chiuso) return;
      primoDopo = (M.st.primoPartita + 1) % 3;
      clearTimeout(botT); botT = null; fermaTurno(); M = null; via = {}; detto = false;
      for (var s = 1; s <= 2; s++) botSeat[s] = true;
      promuovi();
      C.azzera();
      aggiornaLobby();
    }
    // in saletta un posto libero (uno è uscito) lo prende chi guardava (nella Sala solo chi è stato scelto)
    function promuovi() {
      for (var s = 1; s <= 2; s++) {
        if (posti[s]) continue;
        var k = -1; guarda.some(function (g, i) { if (!t.puoSedersi || t.puoSedersi(g.id, g.nome)) { k = i; return true; } return false; });
        if (k < 0) return;
        var g = guarda.splice(k, 1)[0]; posti[s] = g.id; nomiU[s] = g.nome; avU[s] = g.omino || null;
      }
    }
    t.onRivincita = allaSaletta;
    t.onRegole = function (im) { chOn = CHI.attive(im || t.impostazioni); aggiornaLobby(); };   // l'host ha cambiato le regole in saletta: lo vedono tutti
    var H = {
      onCodice: function (c) { codice = c; if (!M) aggiornaLobby(); },
      onConnesso: function () { pronta = true; if (!M) aggiornaLobby(); },
      onAddio: function (id) {
        if (chiuso) return;
        var g0 = guarda.length; guarda = guarda.filter(function (g) { return g.id !== id; });
        var s = seatDi(id);
        if (s <= 0) { if (guarda.length !== g0 && !M) aggiornaLobby(); return; }
        posti[s] = null;
        if (M) {   // il suo posto passa al Bot (se torna, se lo riprende)
          var vecchio = nomiU[s] || M.st.nomi[s];
          via[s] = { id: id, nome: vecchio, omino: avU[s] };
          nomiU[s] = null; avU[s] = null; botSeat[s] = true;
          mettiBot(s);
          avviso(vecchio + " è uscito: gioca il Bot");
          bcast(); giro();
        } else { nomiU[s] = null; avU[s] = null; promuovi(); aggiornaLobby(); }
      },
      onMsg: function (id, m) {
        if (chiuso || !m || !m.t) return;
        if (m.t === "join") {
          var nome = String(m.nome || "Amico").trim().slice(0, 16) || "Amico", sj = seatDi(id);
          if (M) {   // a partita iniziata
            if (sj > 0) { mandaVm(sj); return; }   // chi rientra al suo posto si riprende le sue carte
            for (var k = 1; k <= 2; k++) if (via[k] && via[k].id === id && !posti[k]) { rientra(k); return; }
            if (!guarda.some(function (g) { return g.id === id; }) && guarda.length < 12) guarda.push({ id: id, nome: nome, omino: avatarValido(m.omino) });
            if (rete) { rete.inviaVeloce({ t: "piena", tre: 1, to: id, inCorso: true }); rete.inviaVeloce({ t: "vm", tre: 1, guarda: 1, to: id, vm: vistaDi(-1) }); }   // guarda
            return;
          }
          if (sj < 0) {
            // nella Sala chi non è stato scelto non si siede (guarda); se no il primo posto libero
            var s = t.puoSedersi && !t.puoSedersi(id, nome) ? 0 : postoLibero();
            if (s > 0) { posti[s] = id; nomiU[s] = nome; avU[s] = avatarValido(m.omino); guarda = guarda.filter(function (g) { return g.id !== id; }); }
            else if (!guarda.some(function (g) { return g.id === id; }) && guarda.length < 12) guarda.push({ id: id, nome: nome, omino: avatarValido(m.omino) });
          }
          aggiornaLobby();   // (anche se c'era già: la sala aggiornata a tutti)
        } else if (m.t === "gioca" && M) { var sm = seatDi(id); if (sm > 0) passo(sm, m.carta, m.presa); }
        else if (m.t === "avanti" && M && M.st.fase === "fineround" && seatDi(id) > 0 && +m.n === M.st.nMano) {
          if (voti.k !== M.st.nMano) voti = { k: M.st.nMano, ids: {} };
          voti.ids[id] = 1;
          if (votiN() * 2 > umani()) { M.prossimoRound(); bcast(); giro(); } else bcast();
        }
        else if (m.t === "chiac" && M && chOn && filtra(id)) {   // 💬 da chi gioca (o una faccina da chi guarda): a tutti
          var sc = seatDi(id), c = String(m.c || "");
          if (!CHI.valido("scopa", c, sc < 0)) return;
          var x = { t: "chiac", k: sc > 0 ? sc : "g", id: id, c: c };
          if (sc < 0) x.n = CHI.nomeDi(m.n);
          if (rete) rete.inviaVeloce(x);
          chiac3(C, x.k, c, x.n);
        }
      },
      onErrore: function () { if (!chiuso && !pronta && !M) { chiuso = true; C.esci(); erroreScopa(t, "Problema di collegamento. Controlla la connessione e riprova."); } }
    };
    rete = R ? R.apri(H) : SGNet.ospita("scopa", H);
    function seggi() {
      return [{ nome: mioNome(), id: "host", omino: mioAv() },
        posti[1] ? { nome: nomiU[1], id: posti[1], omino: avU[1] } : null,
        posti[2] ? { nome: nomiU[2], id: posti[2], omino: avU[2] } : null];
    }
    function aggiornaLobby() {
      if (M || chiuso) return;
      ricorda(null);   // (in saletta niente da riprendere)
      var imp = t.impostazioni || {}, tr = traguardoDa(imp), d = imp.difficolta || diff;
      if (rete) rete.invia({ t: "lobby", tre: 1, codice: codice, pronta: pronta, seggi: seggi(), traguardo: tr, diff: d, guarda: guarda });
      renderLobby3(t, { codice: codice, pronta: pronta, sonoHost: true, myId: "host", seggi: seggi(), traguardo: tr, diff: d, guarda: guarda }, {
        onComincia: function () {
          if (M || chiuso) return;
          var imp2 = t.impostazioni || {}; diff = imp2.difficolta || diff; chOn = CHI.attive(imp2);
          M = creaMotore3(traguardoDa(imp2), null, primoDopo);
          M.st.nomi = { 0: mioNome() }; M.st.avatari = { 0: mioAv() };
          for (var s = 1; s <= 2; s++) { botSeat[s] = !posti[s]; if (posti[s]) { M.st.nomi[s] = nomiU[s]; M.st.avatari[s] = avU[s]; } }
          for (s = 1; s <= 2; s++) if (!posti[s]) mettiBot(s);
          via = {}; detto = false;
          S3.posti = {}; S3.prevMano = 0; S3.prevTav = {};
          bcast(); giro();
        },
        onEsci: esci
      });
    }
    if (!M) aggiornaLobby();
    else {   // (ripresa) il tavolo com'era; una presa che si stava guardando si chiude da sola, poi tocca a chi toccava
      bcast();
      var m0 = M, s0 = M.st;
      if (s0.fase === "gioco" && (s0.presa || (!s0.mani[0].length && !s0.mani[1].length && !s0.mani[2].length)))
        dopoMossa(M, { presa: !!s0.presa, chiudere: true }, bcast, giro, function () { return !chiuso && M === m0; });
      else giro();
    }
    return { lascia: function () { chiuso = true; C.esci(); clearTimeout(botT); fermaTurno(); }, inSaletta: function () { return !M && !chiuso; } };
  }

  // ---------- chi entra in un tavolo a tre (P = il collegamento condiviso con la Scopa a due: vedi ospiteScopaAuto) ----------
  function ospiteScopa3(t, codice, P) {
    var el = t.el, S = { rete: null, myId: P.myId, nome: P.nome || "Amico", guardo: false, chiuso: false, chiesto: 0, lastPresa: null };
    function esci() { if (S.chiuso) return; S.chiuso = true; C.esci(); if (S.rete) S.rete.chiudi(); t.esci(); }
    function join() { S.chiesto = Date.now(); if (S.rete) S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : mioAvatar(S.nome) }); }
    var C = creaClient3(t, {
      sonoHost: false,
      onMossa: function (id, presa) { if (!S.rete) return; S.rete.invia({ t: "gioca", carta: id, presa: presa }); C.manda(id); },
      // 💬 il mio fumetto subito, poi lo manda l'host a tutti (chi guarda: solo faccine, col suo nome)
      onChiac: function (c) {
        var X = window.SGChiacchiere; if (!S.rete || !C.vm) return;
        if (S.guardo) { if (!X.valido("scopa", c, true)) return; var n = X.nomeDi(S.nome); chiac3(C, "g", c, n); S.rete.invia({ t: "chiac", c: c, n: n }); }
        else { if (!X.valido("scopa", c)) return; chiac3(C, C.vm.io, c); S.rete.invia({ t: "chiac", c: c }); }
      },
      onVota: function () { if (S.rete && C.vm) S.rete.invia({ t: "avanti", n: C.vm.nMano }); },
      onAvanti: function () {}, onNuova: function () {}, onEsci: esci
    });
    function suonoSe(vm) {   // il suono della presa appena arrivata (vibra solo la mia)
      var k = vm.presa ? vm.pid + ":" + vm.nMano + ":" + (vm.presa.carta ? vm.presa.carta.id : "resto") : null;
      if (k && k !== S.lastPresa && !S.guardo) suonoPresa(vm.presa.scopa, vm.presa.seat === vm.io && !!vm.presa.carta);
      S.lastPresa = k;
    }
    var H = {
      onAperto: function (id) { S.myId = id; join(); },
      onMsg: function (m) {
        if (S.chiuso || !m) return;
        if (m.to && m.to !== S.myId) return;   // un messaggio per un altro telefono (le sue carte): non è per me
        if (m.t === "chiac") { if (m.id !== S.myId) chiac3(C, m.k, m.c, m.n); return; }
        if (m.t === "vm" && m.vm) {
          if (m.guarda) {   // la foto di chi guarda: la uso solo se l'host mi ha detto che guardo
            if (S.guardo) { C._guarda = true; C.setVm(m.vm); }
            else if (!C.vm && Date.now() - S.chiesto > 1500) join();   // (non so ancora dove sono: lo richiedo)
            return;
          }
          S.guardo = false; C._guarda = false; suonoSe(m.vm); C.setVm(m.vm);
          return;
        }
        if (m.t === "lobby") {
          if (C.vm) C.azzera();   // l'host ha fatto "Nuova partita": si torna in saletta
          S.guardo = false; C._guarda = false;
          var seggi = m.seggi || [], dentro = seggi.some(function (g) { return g && g.id === S.myId; });
          var guardo = !dentro && (m.guarda || []).some(function (g) { return g.id === S.myId; });
          if (!dentro && !guardo && seggi.slice(1).some(function (g) { return !g; }) && Date.now() - S.chiesto > 1500) join();   // c'è un posto: lo chiedo
          return renderLobby3(t, { codice: m.codice, pronta: m.pronta, sonoHost: false, myId: S.myId, seggi: seggi, traguardo: m.traguardo, diff: m.diff, guarda: m.guarda }, { onEsci: esci });
        }
        if (m.t === "piena") { S.guardo = true; C._guarda = true; if (!C.vm) attesa("👀 Si gioca già in tre: tu guardi la partita."); }
      },
      onChiuso: function () {
        if (S.chiuso) return;
        var finita = C.vm && C.vm.fase === "fine"; S.chiuso = true; C.esci();
        erroreScopa(t, finita ? "👋 L'host ha chiuso la stanza: grazie per aver giocato!" : "🚪 L'host ha chiuso la partita.");
      },
      onErrore: function () { if (!S.chiuso && !C.vm && !S.myId) erroreScopa(t, "Problema di collegamento. Riprova."); }
    };
    function attesa(txt) {
      var s = t.schermata({ icona: "🃏", titolo: "Scopa in tre", sotto: "Stanza " + String(codice).toUpperCase(), indietro: esci });
      s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: txt }));
      t.mostra(s);
    }
    S3.m = null; S3.posti = {}; S3.prevMano = 0; S3.prevTav = {};
    S.rete = P.collega(H);
    S.myId = P.myId || S.myId;
    return { lascia: function () { S.chiuso = true; C.esci(); } };
  }

  // la saletta a tre (uguale per host e ospiti): chi c'è, i posti liberi al Bot
  function renderLobby3(t, vm, cb) {
    var el = t.el, seggi = vm.seggi || [], gio = [], umani = 0;
    seggi.forEach(function (g, i) { if (g) { umani++; gio.push({ id: g.id, nome: g.nome, omino: g.omino || null, host: i === 0, tu: g.id === vm.myId }); } });
    var guarda = vm.guarda || [], guardo = !gio.some(function (g) { return g.tu; }) && guarda.some(function (g) { return g.id === vm.myId; });
    var tr = vm.traguardo == null ? TARGET : vm.traguardo, liv = { facile: "facile", medio: "medio", difficile: "difficile" }[vm.diff] || "medio";
    var righe = [el("div", { html: "<b>🃏 Scopa in tre</b>: ognuno per sé" }),
      el("div", { style: "opacity:.8;font-size:.85em", text: (tr ? "🎯 A " + tr + " punti" : "🎯 Una mano sola") + (umani < 3 ? " · i posti liberi li fa il Bot (" + liv + ")" : "") })];
    if (guarda.length) righe.push(el("div", { style: "opacity:.8;font-size:.85em", text: "👀 Guardano: " + guarda.map(function (g) { return g.id === vm.myId ? "tu" : g.nome; }).join(", ") }));
    t.lobby({ host: vm.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 1, puoiDaSolo: true, vuoti: Math.max(0, 3 - umani), giocatori: gio,
      extra: [el("div", { class: "modulo-nota", style: "text-align:center;line-height:1.5" }, righe)],
      nota: vm.sonoHost ? "Puoi cominciare quando vuoi: i posti vuoti li fa il Bot." : null,
      spettatore: guardo ? "👀 Questa volta guardi" : null,
      attesa: guardo ? "Al tavolo giocano gli amici scelti: questa partita la guardi." : "Aspetta che l'host cominci: si gioca in tre, ognuno per sé! 🃏",
      onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  // ---------- la stanza condivisa tra Scopa a due e in tre ----------
  // L'host apre la stanza una volta; il gioco (a due o a tre) le dà i suoi "ascoltatori". Se in saletta l'host cambia
  // "Quanti al tavolo", il gioco nuovo prende la stessa stanza e si fa raccontare chi c'è già dentro (stessi id: nessuno esce).
  // opz = { ripresa: true } quando la partita riprende (l'host ha ricaricato: gli amici restano sul tavolo)
  function presaHost(opz) {
    var P = { h: null, cb: {}, codice: null, pronta: false, dentro: {} };
    P.apri = function (cb) {
      P.cb = cb;
      if (!P.h) {
        P.h = SGNet.ospita("scopa", {
          onCodice: function (c) { P.codice = c; if (P.cb.onCodice) P.cb.onCodice(c); },
          onConnesso: function () { P.pronta = true; if (P.cb.onConnesso) P.cb.onConnesso(); },
          onAddio: function (id) { delete P.dentro[id]; if (P.cb.onAddio) P.cb.onAddio(id); },
          onMsg: function (id, m) { if (m && m.t === "join" && !P.dentro[id]) P.dentro[id] = m; if (P.cb.onMsg) P.cb.onMsg(id, m); },
          onErrore: function (e) { if (P.cb.onErrore) P.cb.onErrore(e); }
        }, opz || null);
        return P.h;
      }
      setTimeout(function () {   // (dopo: il gioco nuovo ha finito di prepararsi)
        if (P.cb !== cb) return;
        if (P.codice && cb.onCodice) cb.onCodice(P.codice);
        if (P.pronta && cb.onConnesso) cb.onConnesso();
        Object.keys(P.dentro).forEach(function (id) { if (P.cb === cb && cb.onMsg) cb.onMsg(id, P.dentro[id]); });
      }, 0);
      return P.h;
    };
    return P;
  }
  function hostScopaAuto(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    // la ripresa (l'host ha ricaricato a metà partita): si riparte dal tavolo giusto (a due o a tre) con la stessa mano
    var rip = t.ripresa && t.ripresa.stato && t.ripresa.stato.scopa;
    var R = presaHost(rip ? { ripresa: true } : null), tre = null, cur = null;
    function voluto(im) { return !!(im && im.inTre) && !t.eliminazione; }
    function parti(x, rp) {
      if (cur && cur.lascia) cur.lascia();
      tre = x;
      S3.m = null;
      cur = (x ? hostScopa3 : hostScopa)(t, R, rp || null);
      var reg = t.onRegole;   // (quella del gioco appena partito)
      t.onRegole = function (im) {
        var v = voluto(im || t.impostazioni);
        if (v !== tre && cur && cur.inSaletta && cur.inSaletta()) return parti(v);   // in saletta: si cambia tavolo e gli amici restano dentro
        if (reg) reg(im);
      };
    }
    if (rip) parti(!!rip.tre, rip); else parti(voluto(t.impostazioni));
  }
  // t.ricorda con la memoria di quello che si è già detto: null (niente da riprendere) solo se prima c'era qualcosa
  function ricordatore(t, gia) {
    var on = !!gia;
    return function (stato) { if (!t.ricorda) return; if (stato) { on = true; t.ricorda(stato); } else if (on) { on = false; t.ricorda(null); } };
  }
  // chi entra: non sa se il tavolo è da due o da tre finché l'host non risponde (i messaggi del tavolo a tre hanno tre: 1)
  function presaOspite(codice) {
    var P = { h: null, cb: {}, myId: null, nome: "", smista: null };
    var proxy = {
      onAperto: function (id) { P.myId = id; if (P.cb.onAperto) P.cb.onAperto(id); },
      onMsg: function (m) { if (P.smista && P.smista(m)) return; if (P.cb.onMsg) P.cb.onMsg(m); },
      onHostVia: function (x) { if (P.cb.onHostVia) P.cb.onHostVia(x); },
      onChiuso: function (x) { if (P.cb.onChiuso) P.cb.onChiuso(x); },
      onErrore: function (e) { if (P.cb.onErrore) P.cb.onErrore(e); }
    };
    P.collega = function (cb) { P.cb = cb; if (!P.h) P.h = SGNet.entra(codice, proxy); return P.h; };
    return P;
  }
  function ospiteScopaAuto(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var P = presaOspite(codice), tre = null, cur = null;
    function passa(x, m) {
      if (cur && cur.lascia) cur.lascia();
      tre = x;
      cur = (x ? ospiteScopa3 : ospiteScopa)(t, codice, P);
      if (m && P.cb && P.cb.onMsg) P.cb.onMsg(m);
    }
    P.smista = function (m) {
      if (!m || !cur) return false;
      var x = m.tre ? true : (m.t === "lobby" || m.t === "vm") ? false : null;   // (gli altri messaggi vanno al tavolo di adesso)
      if (x === null || x === tre) return false;
      passa(x, m); return true;
    };
    passa(false, null);
  }

  SG.registra({
    id: "scopa",
    nome: "Scopa",
    icona: "🃏",
    tema: "oro",   // 🤍 Bianco e oro: impostazioni, riepiloghi e schermate di servizio chiari; il tavolo resta una stanza vera (schermata «scura»)
    descrizione: "Il classico gioco di carte napoletane: prendi le carte del tavolo e fai scopa. In due o in tre, contro il Bot o online, ognuno dal suo telefono.",
    giocatoriMin: 1, giocatoriMax: 2, difficolta: 3, etichettaGiocatori: "👥 1–3 giocatori",   // (in tre: online o con due Bot)
    inTre: true,   // si gioca anche in tre, ognuno per sé (impostazioni.inTre; nella Sala il core la offre a chi è in tre)
    postiOnline: 2,   // online si gioca in due: gli altri guardano
    riprende: true,   // se l'host ricarica la pagina, la smazzata continua dalla stessa mano (t.ripresa)
    ritardatari: "partita",   // chi arriva a partita cominciata la guarda ed entra alla prossima
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro il computer", sotto: "Giochi da solo contro il Bot" },
      { modo: "bot3", icona: "🃏", nome: "In tre contro due Bot", sotto: "Ognuno per sé: tu e due Bot" }],
    regole: [
      "Si gioca <b>in due</b> (o <b>in tre</b>, ognuno per sé) con le 40 carte napoletane. Tre carte in mano a testa, quattro sul tavolo.",
      "Nel tuo turno giochi una carta: se ha lo <b>stesso valore</b> di una carta sul tavolo la <b>prendi</b>. Se non c'è un valore uguale, puoi prendere <b>più carte che sommano</b> al valore della tua.",
      "Se dopo la presa il tavolo resta <b>vuoto</b> fai <b>Scopa</b> (+1 punto), tranne con l'ultima carta.",
      "A fine mazzo le carte rimaste sul tavolo vanno all'ultimo che ha preso. Se a inizio smazzata in tavola ci sono <b>tre o quattro Re</b>, si rimescola.",
      "Punti a fine smazzata: <b>Carte</b> (chi ne prende di più), <b>Denari</b> (più carte di denari), <b>Settebello</b> (il 7 di denari), <b>Primiera</b> (serve almeno una carta per seme), più le <b>Scope</b>. Vince chi arriva per primo ai <b>punti scelti</b> (di solito " + TARGET + "; a pari punti si gioca un'altra mano). Si può giocare anche <b>una mano sola</b>.",
      "<b>In tre</b>: si gioca a giro e il mazzo basta per quattro giri da tre carte. Carte, Denari e Primiera vanno a chi ne ha di più <b>da solo</b> (a pari merito il punto non va a nessuno); vince chi arriva per primo ai punti, da solo in testa.",
      "Modalità: <b>contro il Bot</b> (Facile/Medio/Difficile), <b>in tre contro due Bot</b>, oppure <b>online</b>, ognuno dal suo telefono, in due o in tre (i posti liberi li fa il Bot). Durante la partita, col tasto <b>💬</b> mandi faccine e frasi."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "bot"; dove.difficolta = "medio"; dove.inTre = aiuti.modo === "bot3";
      if (aiuti.torneo) { dove.modo = "bot"; dove.inTre = false; return; } // nel torneo: contro il bot, in due
      var bBot, bOnl, boxDiff, notaOnline, boxCh, rigaTre;
      function sel(m) {
        dove.modo = m;
        var bot = m === "bot" || m === "bot3";
        bBot.className = "modo-chip" + (bot ? " attiva" : "");
        bOnl.className = "modo-chip" + (m === "online" ? " attiva" : "");
        boxDiff.hidden = !(bot || (m === "online" && dove.inTre)); notaOnline.hidden = (m !== "online");   // (online in tre: i posti liberi li fa il Bot)
        if (boxCh) boxCh.hidden = m !== "online";
      }
      bBot = el("button", { class: "modo-chip attiva", onclick: function () { sel("bot"); } }, [
        el("span", { class: "mi", text: "🤖" }), el("div", {}, [el("div", { class: "mt", text: "Contro il Bot" }), el("div", { class: "ms", text: "Da solo" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { sel("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online" }), el("div", { class: "ms", text: "Ognuno dal suo" })])]);
      if (!aiuti.modo) {   // (se "come giocare" l'avete già scelto prima, qui non si sceglie)
        box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
        box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bBot, bOnl]));
      }
      boxDiff = el("div", {});
      boxDiff.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura del Bot" }));
      var diffWrap = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.difficolta = d[0];
          [].forEach.call(diffWrap.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; });
          b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: d[1] })]);
        b.style.flex = "1"; diffWrap.appendChild(b);
      });
      // quanti al tavolo: in due, o in tre ognuno per sé (online si cambia anche in saletta: gli amici restano dentro)
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Quanti al tavolo" }));
      rigaTre = el("div", { style: "display:flex;gap:8px" });
      [[false, "👥 In due"], [true, "👥👤 In tre"]].forEach(function (v) {
        var b = el("button", { class: "modo-chip" + (!!dove.inTre === v[0] ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.inTre = v[0]; [].forEach.call(rigaTre.children, function (c) { c.classList.remove("attiva"); }); b.classList.add("attiva");
          sel(dove.modo);
        } }, [el("div", { class: "mt", text: v[1] })]);
        rigaTre.appendChild(b);
      });
      box.appendChild(rigaTre);
      // dalla Sala (il core, «Scopa in tre: giocate tutti»): in tre o in due senza toccare i tasti (niente vibrazione)
      box._inTre = function (v) {
        dove.inTre = !!v;
        [].forEach.call(rigaTre.children, function (c, i) { c.classList.toggle("attiva", (i === 1) === !!v); });
        sel(dove.modo);
      };
      box.appendChild(el("div", { class: "tenue", style: "font-size:.8rem;margin-top:4px", text: "In tre ognuno gioca per sé. Online i posti liberi li fa il Bot." }));
      boxDiff.appendChild(diffWrap); box.appendChild(boxDiff);
      sceltaTraguardo(el, box, dove, "Le vittorie contano per i trofei e le sfide del giorno nelle partite da " + TARGET + " punti in su.");
      boxCh = el("div", {});   // 💬 faccine e frasi durante la partita (solo online: l'host le può spegnere)
      window.SGChiacchiere.regola(el, boxCh, dove);
      box.appendChild(boxCh);
      notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      notaOnline.textContent = (window.SGNet && SGNet.disponibile())
        ? "Apri la stanza e invita l'altro col tasto 📤: entra dal suo telefono (ognuno vede solo le proprie carte)."
        : "Qui il collegamento non è disponibile: funziona quando il gioco è aperto dal sito pubblicato online.";
      box.appendChild(notaOnline);
      sel(aiuti.modo || "bot");
      if (aiuti.modo) notaOnline.hidden = true;
    },
    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return t.linkParams.guarda ? guardaScopa(t, t.linkParams.stanza) : ospiteScopaAuto(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostScopaAuto(t);   // in due o in tre (si può cambiare in saletta)
      if ((imp.modo === "bot3" || imp.inTre) && !imp.torneo && !t.eliminazione) return localeScopa3(t, imp.difficolta || "medio");
      return localeScopa(t, imp.difficolta || "medio");
    }
  });

  // suono della presa; la vibrazione solo per le mosse di chi ha il telefono (mai per quelle dell'altro)
  function suonoPresa(scopa, vibra) {
    if (vibra) try { if (navigator.vibrate) navigator.vibrate(scopa ? [0, 20, 40, 30] : 14); } catch (e) {}
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t = ctx.currentTime;
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(scopa ? 520 : 360, t); o.frequency.exponentialRampToValueAtTime(scopa ? 880 : 300, t + 0.12);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (scopa ? 0.28 : 0.16));
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.3);
    } catch (e) {}
  }

  // dopo una mossa: si guarda la presa, poi si pulisce il tavolo; a mani vuote si distribuisce, oppure (a fine mazzo)
  // si vedono le carte rimaste andare a chi ha preso per ultimo e poi arriva il riepilogo.
  // ridisegna() a ogni passo, pronto() quando si può giocare di nuovo, vivo() = la partita è ancora questa
  function dopoMossa(M, ev, ridisegna, pronto, vivo) {
    function passo() {
      if (!vivo()) return;
      var r = M.chiudiPresa(); ridisegna();
      if (r === "resto") setTimeout(passo, 1900); else pronto();
    }
    if (ev.presa) setTimeout(passo, ev.scopa ? 1800 : 1200);
    else if (ev.chiudere) setTimeout(passo, 550);
    else pronto();
  }

  // ---------- LOCALE (contro il bot) : io = A, bot = B ----------
  function localeScopa(t, difficolta) {
    // il Bot: quello deciso dal core (torneo a eliminazione) o uno dei bot fissi, scelto dalla bravura (nei tasti si dice "Bot")
    var ilBot = (t.impostazioni && t.impostazioni.bot && t.impostazioni.bot.nome) ? t.impostazioni.bot
      : ((SG.bot && SG.bot.prendi && SG.bot.prendi(1, { livello: difficolta, escludi: [t.giocatori[0] || "Tu", t.nomeProfilo && t.nomeProfilo()] })[0]) || { nome: "Bot", omino: null });
    var nomi = { A: (t.giocatori[0] || "Tu"), B: ilBot.nome };
    var M = creaMotore(nomi, t.mischia, traguardoDa(t.impostazioni));
    var botT = null;
    var tx = window.SGChiacchiere.trasmettitore(t);   // torneo a eliminazione: le chiacchiere arrivano anche a chi guarda
    var C = creaClient(t, {
      locale: true, sonoHost: true,
      // 💬 contro il Bot: il mio fumetto, e ogni tanto Bot risponde
      onChiac: function (c) {
        if (C.uscito || M.st.fase !== "gioco" || !window.SGChiacchiere.valido("scopa", c)) return;
        chiacScopa(C, "A", c); if (tx) tx({ t: "chiac", k: "A", id: "io", c: c });
        var M0 = M;
        window.SGChiacchiere.rispondeBot(function (r) { if (C.uscito || M !== M0 || M.st.fase !== "gioco") return; chiacScopa(C, "B", r); if (tx) tx({ t: "chiac", k: "B", id: "bot", c: r }); });
      },
      onMossa: function (id, presa) { mossaUmano(id, presa); },
      onAvanti: function () { if (M.st.fase !== "fineround") return; M.prossimoRound(); aggiorna(); seTuraBot(); },
      onNuova: function () { M = creaMotore(nomi, t.mischia, traguardoDa(t.impostazioni), altro(M.st.primoPartita)); aggiorna(); seTuraBot(); },   // nella partita dopo comincia l'altro
      onEsci: function () { C.esci(); clearTimeout(botT); t.esci(); }
    });
    var omini = { A: mioAvatar(nomi.A), B: ilBot.omino || AVATAR_BOT };
    var detto = false;   // il risultato di questa partita è già stato dato? (torneo a eliminazione)
    function aggiorna() {
      if (C.uscito) return;
      var v = vistaDa(M.st, "A", omini, { bot: true });
      if (t.trasmetti) t.trasmetti({ t: "vm", vm: v });   // torneo a eliminazione: chi guarda vede la partita col bot
      C.setVm(v);
      if (M.st.fase !== "fine") { detto = false; return; }
      if (!detto && t.risultato) {
        detto = true;
        var a = M.st.punti.A, b = M.st.punti.B;
        t.risultato(a >= b ? [{ nome: nomi.A, pos: 1 }, { nome: nomi.B, pos: a === b ? 1 : 2, bot: true }] : [{ nome: nomi.B, pos: 1, bot: true }, { nome: nomi.A, pos: 2 }]);   // (la riga del Bot: bot: true)
      }
    }
    function vivo(m0) { return function () { return !C.uscito && M === m0; }; }
    function mossaUmano(id, presa) {
      var ev = M.gioca("A", id, presa); if (ev.errore) return;
      suonoPresa(ev.scopa, true); aggiorna(); dopoMossa(M, ev, aggiorna, seTuraBot, vivo(M));
    }
    function seTuraBot() {
      if (C.uscito || botT || M.st.fase !== "gioco" || M.st.turno !== "B" || M.st.presa) return;
      var m0 = M;
      botT = setTimeout(function () { botT = null; if (!C.uscito && M === m0) mossaBot(); },
        Math.max(650 + Math.random() * 400, (C._dealFino || 0) - Date.now() + 250));   // dopo la distribuzione
    }
    function mossaBot() {
      if (M.st.fase !== "gioco" || M.st.turno !== "B" || M.st.presa || !M.st.mani.B.length) return;
      var m = scegliMossaBot(M.st.mani.B, M.st.tavolo, difficolta, M.st, "B");
      var ev = M.gioca("B", m.carta, m.presa); if (ev.errore) return;
      suonoPresa(ev.scopa, false); aggiorna(); dopoMossa(M, ev, aggiorna, seTuraBot, vivo(M));
    }
    aggiorna();
    seTuraBot(); // se comincia il bot
  }

  // ---------- ONLINE : host = A, ospite = B ----------
  // R = la stanza condivisa con la Scopa in tre (vedi presaHost; senza, se ne apre una sua)
  // rip = la partita da riprendere (l'host ha ricaricato: vedi hostScopaAuto), o null
  function hostScopa(t, R, rip) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var nomi = { A: (t.giocatori && t.giocatori[0]) || "Host", B: "Avversario" };
    var M = null, rete = null, avvId = null, avvVia = false, pronta = false, problema = false, codice = "…", omini = { A: mioAvatar(nomi.A), B: null };
    var detto = false, riserva = null;   // detto: il risultato della partita è già stato dato al torneo online? riserva: il posto di chi giocava (vedi riservaAvv)
    var ricorda = ricordatore(t, !!rip);
    function ricordaOra() {   // dopo ogni cambiamento: la mano com'è (in saletta niente da riprendere)
      ricorda(M ? { scopa: { tre: 0, avvId: avvId, nomeB: nomi.B, ominoB: omini.B, st: M.esporta() } } : null);
    }
    // ---- la ripresa: stessa mano, stesse carte, stessi punti. L'avversario è "via" finché non si rifà vivo (rientra da solo
    // in un attimo e gli si rimanda la sua mano); se in 30 s non torna: "ha lasciato la partita", come quando esce
    if (rip && rip.st) {
      avvId = rip.avvId || null; nomi.B = rip.nomeB || "Avversario"; omini.B = avatarValido(rip.ominoB);
      M = creaMotore(nomi, t.mischia, traguardoDa(t.impostazioni), rip.st.primoPartita);
      M.importa(rip.st);
      detto = M.st.fase === "fine";   // (la classifica era già stata data)
      if (avvId) {
        avvVia = true;
        setTimeout(function () {
          if (!avvVia || !M || C.uscito) return;
          C.avviso = { testo: "🚪 " + nomi.B + " ha lasciato la partita. Se rientra, si riprende da qui.", tasto: "Chiudi la partita", onTasto: chiudiPartita };
          C.mostraAvviso();
        }, 30000);
      }
    }
    var CHI = window.SGChiacchiere, filtra = CHI.filtro(), chOn = CHI.attive(t.impostazioni);   // 💬 accese o spente dall'host nel ⚙️
    var C = creaClient(t, {
      sonoHost: true,
      onChiac: function (c) { if (!chOn || !M || M.st.fase !== "gioco" || !CHI.valido("scopa", c)) return; chiacScopa(C, "A", c); if (rete) rete.inviaVeloce({ t: "chiac", k: "A", id: "host", c: c }); },
      onMossa: function (id, presa) { if (M) dopo(M.gioca("A", id, presa), true); },
      onAvanti: function () { avanti(); },
      // finita la smazzata, il conto sul tasto "Continua ▶" fa partire la prossima da sola (se l'avversario c'è)
      onAvantiDaSolo: function () { if (!avvVia) avanti(); },
      onNuova: function () { if (!M) return; M = creaMotore(nomi, t.mischia, traguardoDa(t.impostazioni), altro(M.st.primoPartita)); bcast(); },   // nella partita dopo comincia l'altro
      onSaletta: function () { allaSaletta(); },
      onEsci: function () { ricorda(null); C.esci(); if (rete) rete.chiudi(); t.esci(); }
    });
    // la rivincita dei tasti di fine comuni: si torna nella saletta con lo stesso avversario (il core fa il 3-2-1), poi comincia l'altro
    var primoDopo = null;
    function allaSaletta() {
      if (!M || M.st.fase !== "fine" || !avvId || avvVia || C.uscito) return;
      primoDopo = altro(M.st.primoPartita); M = null; C.avviso = null; C.vm = null;
      aggiornaLobby();
    }
    t.onRivincita = allaSaletta;
    function avanti() { if (!C.uscito && M && M.st.fase === "fineround") { M.prossimoRound(); bcast(); } }
    function vistaB() { return vistaDa(M.st, "B", omini, { idB: avvId, ch: chOn ? 1 : 0 }); }
    function aggiornaLobby() {
      ricordaAvv("scopa", codice, avvId || (riserva && Date.now() < riserva.fino ? riserva.id : null));
      ricordaOra();
      if (M || C.uscito) return;
      if (rete) rete.invia({ t: "lobby", codice: codice, pronta: pronta, avversario: !!avvId, avvId: avvId, traguardo: traguardoDa(t.impostazioni),
        nomi: { A: nomi.A, B: nomi.B }, omini: { A: omini.A, B: avvId ? omini.B : null } });
      disegnaLobby();
    }
    t.onRegole = function (im) { chOn = CHI.attive(im || t.impostazioni); aggiornaLobby(); };   // l'host ha cambiato i punti in saletta: lo vede anche chi aspetta
    function bcast() {
      if (C.uscito) return;
      ricordaOra();
      // all'ospite mando la SUA vista (vede solo le proprie carte, e c'è il suo id); io disegno la mia
      if (M) { if (rete) rete.invia({ t: "vm", vm: vistaB() }); C.setVm(vistaDa(M.st, "A", omini, { idB: avvId, ch: chOn ? 1 : 0 })); }
      else disegnaLobby();
      if (!M || M.st.fase !== "fine") detto = false;
      else if (!detto && t.risultato) {   // per il torneo online: chi è arrivato prima al traguardo
        detto = true;
        var a = M.st.punti.A, b = M.st.punti.B;
        t.risultato(a >= b ? [{ nome: nomi.A, pos: 1 }, { nome: nomi.B, pos: a === b ? 1 : 2 }] : [{ nome: nomi.B, pos: 1 }, { nome: nomi.A, pos: 2 }]);
      }
      // (finita la smazzata, la prossima parte da sola: il conto è sul tasto "Continua ▶", vedi renderFine)
    }
    function dopo(ev, mia) {
      if (!ev || ev.errore) return;
      suonoPresa(ev.scopa, mia);
      bcast();   // mostra la presa (se c'è) su entrambi i telefoni
      var m0 = M;
      dopoMossa(M, ev, bcast, function () {}, function () { return !C.uscito && M === m0; });
    }
    // l'avversario se n'è andato e l'host chiude: si torna in sala (chi abbandona perde a tavolino)
    function chiudiPartita() {
      if (M && M.st.fase !== "fine" && !detto && t.risultato) { detto = true; t.risultato([{ nome: nomi.A, pos: 1 }, { nome: nomi.B, pos: 2 }]); }
      M = null; avvId = null; avvVia = false; nomi.B = "Avversario"; omini.B = null; C.avviso = null; C.vm = null;
      aggiornaLobby();
    }
    function tornato() { if (!avvVia) return; avvVia = false; C.avviso = null; C.mostraAvviso(); }
    var H = {
      onCodice: function (c) { codice = c; riserva = riservaAvv("scopa", c); if (!M) aggiornaLobby(); },
      onConnesso: function () { pronta = true; problema = false; if (!M) aggiornaLobby(); },
      onAddio: function (id) {
        if (id !== avvId || C.uscito) { if (!M && !C.uscito && terzo() !== terzoVisto) disegnaLobby(); return; }   // (chi guardava è uscito: la nota sul tavolo a tre si aggiorna)
        if (!M) { avvId = null; nomi.B = "Avversario"; omini.B = null; aggiornaLobby(); return; }
        // in partita: la partita NON si butta. Si aspetta che rientri (torna con lo stesso id), oppure l'host chiude
        avvVia = true;
        C.avviso = { testo: "🚪 " + nomi.B + " ha lasciato la partita. Se rientra, si riprende da qui.", tasto: "Chiudi la partita", onTasto: chiudiPartita };
        C.mostraAvviso();
      },
      onMsg: function (id, m) {
        if (!m || !m.t || C.uscito) return;
        if (m.t === "join") {
          // (nella Sala gioca solo chi è stato scelto: gli altri guardano)
          if (!avvId && !postoRiservato(riserva, id) && (!t.puoSedersi || t.puoSedersi(id, String(m.nome || "").slice(0, 16)))) { avvId = id; nomi.B = String(m.nome || "Avversario").slice(0, 16); omini.B = avatarValido(m.omino); }
          if (id !== avvId) { if (!M && terzo() !== terzoVisto) disegnaLobby(); return; }   // un terzo telefono: la stanza è piena (lo capisce da solo: l'id nella sala e nella partita non è il suo)
          tornato();
          if (M) { if (rete) rete.invia({ t: "vm", vm: vistaB() }); }   // rientrato (pagina ricaricata): gli rimando la sua partita
          else aggiornaLobby();
        }
        else if (m.t === "gioca" && M && id === avvId) { tornato(); dopo(M.gioca("B", m.carta, m.presa), false); }
        else if (m.t === "chiac" && M && chOn && filtra(id)) {   // 💬 dall'avversario (o una faccina da chi guarda): a tutti
          var gioca = id === avvId, c = String(m.c || "");
          if (!CHI.valido("scopa", c, !gioca)) return;
          var x = { t: "chiac", k: gioca ? "B" : "g", id: id, c: c };
          if (!gioca) x.n = CHI.nomeDi(m.n);
          if (rete) rete.inviaVeloce(x);
          chiacScopa(C, x.k, c, x.n);
        }
      },
      // (arriva solo se il primo collegamento non riesce: dopo, la rete si ricollega da sola e la partita resta)
      onErrore: function () { if (M || pronta || C.uscito) return; C.esci(); erroreScopa(t, "Problema di collegamento. Controlla la connessione e riprova."); }
    };
    rete = R ? R.apri(H) : SGNet.ospita("scopa", H);
    // nella stanza c'è anche un terzo amico (si può giocare in tre): la nota della saletta si rifà solo quando cambia
    var terzoVisto = false;
    function terzo() { return !!R && Object.keys(R.dentro).length >= 2 && !t.eliminazione; }
    function disegnaLobby() {
      if (M || C.uscito) return;
      // nella stanza c'è anche un terzo amico: si può giocare in tre (⚙️ Regole)
      terzoVisto = terzo();
      renderLobby(t, { codice: codice, pronta: pronta, avversario: !!avvId, avvId: avvId, sonoHost: true, io: "A", nomi: nomi, omini: omini, traguardo: traguardoDa(t.impostazioni), problema: problema, terzo: terzoVisto }, {
        sonoHost: true,
        onComincia: function () { if (avvId && !M) { M = creaMotore(nomi, t.mischia, traguardoDa(t.impostazioni), primoDopo || undefined); primoDopo = null; bcast(); } },
        onEsci: function () { ricorda(null); C.esci(); if (rete) rete.chiudi(); t.esci(); }
      });
    }
    if (!M) disegnaLobby();
    else {   // (ripresa) il tavolo com'era; una presa che si stava guardando si chiude da sola
      bcast();
      var m0 = M, s0 = M.st;
      if (s0.fase === "gioco" && (s0.presa || (!s0.mani.A.length && !s0.mani.B.length)))
        dopoMossa(M, { presa: !!s0.presa, chiudere: true }, bcast, function () {}, function () { return !C.uscito && M === m0; });
    }
    // (per la stanza condivisa: lascia = si passa al tavolo a tre senza chiudere la stanza)
    return { lascia: function () { C.esci(); }, inSaletta: function () { return !M && !C.uscito; } };
  }

  // P = il collegamento condiviso con la Scopa in tre (vedi ospiteScopaAuto): se c'è già, niente nome e niente nuovo collegamento
  function ospiteScopa(t, codice, P) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { rete: null, nome: "", msg: null, myId: null, guardo: false };
    var C = creaClient(t, {
      sonoHost: false,
      onMossa: function (id, presa) { if (!S.rete) return; S.rete.invia({ t: "gioca", carta: id, presa: presa }); C.manda(id); },
      // 💬 il mio fumetto subito, poi lo manda l'host a tutti (il suo "rimando" a me non si rifà)
      onChiac: function (c) { if (!S.rete || !C.vm || !window.SGChiacchiere.valido("scopa", c)) return; chiacScopa(C, C.vm.io, c); S.rete.invia({ t: "chiac", c: c }); },
      onAvanti: function () {}, onNuova: function () {},
      onEsci: esci
    });
    // si gioca in due: chi è in più guarda la partita (alle spalle di chi è entrato), senza toccare né suoni
    var Cg = creaClient(t, {
      guarda: true, spettatore: true, sonoHost: false,
      onMossa: function () {}, onAvanti: function () {}, onNuova: function () {},
      onEsci: esci
    });
    function esci() { C.esci(); Cg.esci(); if (S.rete) S.rete.chiudi(); t.esci(); }
    function lascia(X) { if (X._pend) { clearTimeout(X._pend); X._pend = null; } X.vm = null; X.sel = { carta: null, presa: [] }; X.inviata = null; }
    // gioco io (l'host mi ha messo come avversario) o guardo? Cambiando, il tavolo dell'altro modo non si ridisegna più
    function modo(guardo) {
      if (S.guardo === guardo) return;
      S.guardo = guardo; lascia(guardo ? C : Cg);
    }
    function join() { return { t: "join", nome: S.nome, omino: mioAvatar(S.nome) }; }
    if (P && P.h) { S.nome = P.nome || "Amico"; S.myId = P.myId; collega(); mostraAttesa(); }   // (si torna dal tavolo a tre: stessa stanza)
    else schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🃏", titolo: "Entra nella Scopa", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        if (S.rete) return;
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "Amico").trim() || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega();
      } });
      s._piede.appendChild(bEntra);
      t.mostra(s);
      if (t.nomeProfilo && t.nomeProfilo()) { input.value = t.nomeProfilo(); bEntra.click(); }   // entra da solo col nome del profilo di questo telefono
    }
    function collega() {
      if (P) P.nome = S.nome;
      var H = {
        onAperto: function (id) { S.myId = id; S.rete.invia(join()); mostraAttesa();
          setTimeout(function () { if (!C.vm && !Cg.vm && S.msg2 && document.body.contains(S.msg2)) S.msg2.textContent = "Non trovo la partita: controlla il codice o attendi l'host…"; }, 8000); },
        onMsg: function (m) {
          if (!m || C.uscito) return;
          if (m.t === "chiac") { if (m.id !== S.myId) chiacScopa(S.guardo ? Cg : C, m.k, m.c, m.n); return; }   // 💬 di un altro
          if (m.t === "vm" && m.vm) {
            modo(!!(m.vm.idB && S.myId && m.vm.idB !== S.myId));   // la partita è di un altro: la guardo
            if (S.guardo) { Cg.setVm(m.vm); return; }
            suonoSeNuovaPresa(m.vm); C.setVm(m.vm);
          } else if (m.t === "lobby") {
            modo(!!(m.avvId && S.myId && m.avvId !== S.myId));
            if (C.vm || Cg.vm) { lascia(C); lascia(Cg); lastPresaId = null; }   // l'host è tornato in sala: si torna in sala anche qui
            if (!m.avvId && S.rete) S.rete.invia(join());   // si è liberato il posto (o non mi ha ancora visto): lo ridico
            mostraLobby(m);
          }
        },
        // (se l'host non torna più ci pensa il core: «La stanza è chiusa»; qui arriva quando l'ha chiusa apposta)
        onChiuso: function () { if (!C.uscito && !Cg.uscito) { C.esci(); Cg.esci(); erroreScopa(t, "🚪 L'host ha chiuso la partita."); } },
        onErrore: function () { if (!C.uscito && !S.myId) erroreScopa(t, "Problema di collegamento. Riprova."); }
      };
      S.rete = P ? P.collega(H) : SGNet.entra(codice, H);
    }
    var lastPresaId = null;
    function suonoSeNuovaPresa(vm) {
      var id = vm.presa ? ((vm.presa.carta ? vm.presa.carta.id : "resto") + ":" + (vm.presa.presi || []).length) : null;
      if (id && id !== lastPresaId) suonoPresa(vm.presa.scopa, vm.presa.mio && !!vm.presa.carta);   // vibra solo la mia
      lastPresaId = id;
    }
    function mostraLobby(m) {
      if (C.vm || Cg.vm) return;
      renderLobby(t, { codice: m.codice, pronta: m.pronta, avversario: m.avversario, avvId: m.avvId, nomi: m.nomi, omini: m.omini, sonoHost: false,
        io: S.guardo ? "-" : (m.avvId === S.myId ? "B" : null), traguardo: m.traguardo }, { onEsci: esci });
    }
    function mostraAttesa() {   // finché non arriva la sala dall'host
      if (C.vm || Cg.vm) return;
      var s = t.schermata({ icona: "🃏", titolo: "Scopa · Sala", sotto: "Stanza " + codice.toUpperCase(), indietro: esci });
      S.msg2 = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegato ✅ — sto entrando nella stanza…" });
      s._contenuto.appendChild(S.msg2);
      t.mostra(s);
    }
    return { lascia: function () { C.esci(); Cg.esci(); } };   // (si passa al tavolo a tre: la stanza resta aperta)
  }

  // chi guarda soltanto (torneo a eliminazione, duello della Sala, "👀 Guarda"): la vede in diretta alle spalle di un
  // giocatore, senza toccare. Anche la Scopa in tre (la foto di chi guarda, senza carte in mano di nessuno).
  // (Niente suoni né musica: farebbero rumore e vibrare il telefono. Le faccine passano dal core: le mosse il core le butta)
  function guardaScopa(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var rete = null, scritta = null, fuori = false, C3 = null;
    function niente() {}
    var C = creaClient(t, { guarda: true, sonoHost: false, onMossa: niente, onAvanti: niente, onNuova: niente, onEsci: function () { esci(); } });
    function esci() { if (fuori) return; fuori = true; C.esci(); if (C3) C3.esci(); if (rete) rete.chiudi(); t.esci(); }
    function lascia1() { if (C._pend) { clearTimeout(C._pend); C._pend = null; } C.vm = null; }   // (si passa al tavolo a tre: quello a due non disegna più)
    function attesa(txt) {
      if (scritta === txt) return; scritta = txt;
      var s = t.schermata({ indietro: esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota guarda-attesa", text: txt }));
      if (t.eliminazione && t.faccine) { var fa = t.faccine(); if (fa) s._piede.appendChild(fa); }   // (fuori dal torneo le faccine sono nella targhetta)
      t.mostra(s);
    }
    // la Scopa in tre: il tavolo a tre, con la foto di chi guarda
    function tre(m) {
      if (m.t === "vm" && m.vm && m.guarda) {
        if (!C3) { lascia1(); S3.m = null; S3.posti = {}; S3.prevMano = 0; S3.prevTav = {}; C3 = creaClient3(t, { guarda: true, sonoHost: false, onMossa: niente, onAvanti: niente, onNuova: niente, onEsci: esci }); }
        scritta = null; C3.setVm(m.vm);
      } else if (m.t === "lobby") { if (C3 && C3.vm) C3.azzera(); attesa("👀 La partita sta per cominciare…"); }
    }
    attesa("👀 Mi collego alla partita…");
    rete = SGNet.entra(codice, {
      onMsg: function (m) {
        if (!m || fuori || m.to) return;   // (m.to: la foto di un giocatore, con le sue carte: non è per chi guarda)
        if (m.t === "chiac") {   // 💬 di chi gioca (o di chi guarda)
          if (rete && m.id === rete.mioId) return;
          if (C3 && C3.vm) chiac3(C3, m.k, m.c, m.n); else chiacScopa(C, m.k, m.c, m.n);
          return;
        }
        if (m.tre) return tre(m);
        if (C3) { C3.esci(); C3.azzera(); C3 = null; }   // (si torna a due)
        if (m.t === "vm" && m.vm) { scritta = null; C.setVm(m.vm); }
        else if (m.t === "lobby") { C.vm = null; attesa("👀 La partita sta per cominciare…"); }
      },
      onChiuso: function () { if (!fuori) esci(); },   // partita finita e chiusa: si torna al tabellone
      onErrore: function () { if (!fuori && !C.vm && !(C3 && C3.vm)) erroreScopa(t, "Problema di collegamento. Riprova."); }
    });
  }

  // la saletta d'attesa (uguale per tutti i giochi): tu e il tuo avversario
  function renderLobby(t, vm, cb) {
    // "tu" solo per l'avversario vero (il suo id è nella sala dell'host): chi è in più guarda
    var nomi = vm.nomi || {}, om = vm.omini || {}, gio = [{ id: "A", nome: nomi.A || "Host", omino: om.A || null, host: true, tu: vm.io === "A" }];
    if (vm.avversario) gio.push({ id: vm.avvId || "B", nome: nomi.B || "Avversario", omino: om.B || null, tu: vm.io === "B" });
    var punti = vm.traguardo == null ? "" : (vm.traguardo ? "a " + vm.traguardo + " punti" : "una mano sola");
    t.lobby({ host: vm.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 2, vuoti: vm.avversario ? 0 : 1, giocatori: gio,
      nota: vm.sonoHost ? (vm.problema ? "⚠️ Problema di collegamento, riprovo…" : vm.terzo ? "Siete in tre? Nel ⚙️ scegli «👥👤 In tre» e giocate tutti!"
        : vm.avversario ? "✅ Avversario collegato! Quando vuoi, comincia" + (punti ? " (" + punti + ")" : "") + "." : "Invita il tuo avversario col tasto 📤.") : null,
      attesa: vm.io === "-" ? "👀 Giocano " + (nomi.A || "l'host") + " e " + (nomi.B || "l'avversario") + ": tu guardi."
        : "Aspetta che l'host cominci: si gioca a Scopa" + (punti ? ", " + punti : "") + "! 🃏", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  function erroreScopa(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile: intanto gioca contro il bot." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // aiuti condivisi (usati anche dallo Scopone): carte e logica di presa
  window.SGCarte = {
    creaMazzo: creaMazzo, catture: catture, primiera: primiera, trova: trova,
    cartaEl: cartaEl, dorsoEl: dorsoEl, manina: manina, posto: posto, assicuraStile: assicuraStile,
    mazzo: mazzo, larghezza: larghezza, ASP_CARTA: ASP_CARTA,
    validaSet: validaSet, prefisso: prefisso, PRIM: PRIM,
    // stanza a 4 con gli avatar (Scopa 2 vs 2 e Scopone)
    misureStanza4: misureStanza4, correggiStanza4: correggiStanza4, ricontrollaStanza4: ricontrollaStanza4, postiTavolo: postiTavolo, stanza4: stanza4, animaDistribuzione4: animaDistribuzione4,
    mioAvatar: mioAvatar, avatarValido: avatarValido,
    // i punti da raggiungere (anche Scopa 2 vs 2 e Scopone)
    traguardoDa: traguardoDa, testoTraguardo: testoTraguardo, partitaFinita: partitaFinita, sceltaTraguardo: sceltaTraguardo
  };
})();
