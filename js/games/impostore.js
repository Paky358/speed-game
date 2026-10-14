/* =========================================================
   GIOCO — "L'Impostore"
   Un telefono solo. Tutti ricevono la STESSA parola, tranne
   l'impostore, che non la sa (con l'aiutino riceve una parola
   SIMILE oppure solo la categoria). Da 4 giocatori può esserci
   anche la SPIA: riceve una parola simile (mare/lago) e, a
   scelta dell'host, sa di essere la spia oppure no.
   Il telefono si passa di mano: ognuno tiene premuto per
   vedere il suo ruolo in segreto. L'app dice chi inizia e il
   giro; si parla a voce, poi si vota in segreto. Lo spoglio
   svela il più votato; l'impostore scoperto ha un'ultima
   possibilità: indovinare la parola. Una o più mani.
   Le coppie di parole sono in data/impostore-parole.js.
   ========================================================= */
(function () {
  "use strict";

  var CHIAVE_REGOLE = "sg_impostore_regole", CHIAVE_USATE = "sg_impostore_usate";
  var BASE = { aiuto: "simile", spia: "no", mani: 1, tempo: 0, cat: null };

  function rnd(n) { return Math.floor(Math.random() * n); }
  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function leggi(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function scrivi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function stessoNome(a, b) { return String(a || "").trim().toLowerCase().slice(0, 16) === String(b || "").trim().toLowerCase().slice(0, 16); }

  // ---- le coppie, divise per categoria ----
  function categorie() {
    return (window.SG_IMPOSTORE || []).filter(function (c) { return c && c.coppie; }).map(function (c) {
      var coppie = c.coppie.split("|").map(function (s) { return s.split("/"); })
        .filter(function (p) { return p.length === 2 && p[0].trim() && p[1].trim(); })
        .map(function (p) { return { a: p[0].trim(), b: p[1].trim(), cat: c.id }; });
      return { id: c.id, icona: c.icona || "🏷️", nome: c.nome || c.id, coppie: coppie };
    }).filter(function (c) { return c.coppie.length; });
  }

  // le regole scelte (anche quelle di una volta: "suggerimento" sì/no)
  function regoleDa(imp) {
    var r = {};
    for (var k in BASE) r[k] = imp && imp[k] != null ? imp[k] : BASE[k];
    if (imp && imp.aiuto == null && imp.suggerimento === false) r.aiuto = "buio";
    return r;
  }

  // ---- suoni (tutti piccoli, col motore audio comune) ----
  function nota(f, dur, dopo, tipo, vol) {
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain(), n = c.currentTime + (dopo || 0);
      o.type = tipo || "triangle"; o.frequency.setValueAtTime(f, n);
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(vol || 0.1, n + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
      o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + dur + 0.02);
    } catch (e) {}
  }
  function tic(f) { nota(f || 620, 0.06, 0, "square", 0.05); }
  function rullo() { for (var k = 0; k < 14; k++) nota(180 + (k % 2) * 30, 0.05, k * 0.08, "square", 0.04 + k * 0.003); }
  function fanfara(bella) {
    var seq = bella ? [523, 659, 784, 1047] : [440, 392, 349, 262];
    seq.forEach(function (f, k) { nota(f, bella ? 0.22 : 0.3, k * (bella ? 0.12 : 0.2), "triangle", 0.12); });
  }

  // ---- un tasto che ignora i tocchi appena compare (niente turni saltati col doppio tocco) ----
  function tasto(t, testo, classe, fn) {
    var nato = Date.now(), usato = false;
    var b = t.el("button", { class: "btn " + (classe == null ? "btn-primario" : classe), text: testo, onclick: function () {
      if (usato || Date.now() - nato < 450 || b.style.visibility === "hidden") return;
      usato = true; fn(b);
    } });
    b.sveglia = function () { nato = Date.now(); };
    return b;
  }
  function uscita(t) {
    return function () { if (window.confirm("Uscire dalla partita? I punti di questa partita si perdono.")) t.esci(); };
  }

  SG.registra({
    id: "impostore",
    nome: "L'Impostore",
    icona: "🕵️",
    descrizione: "Tutti hanno la stessa parola, tranne l'impostore (e forse una spia). Scoprite chi bluffa prima che la faccia franca.",
    giocatoriMin: 3,
    giocatoriMax: 10,
    difficolta: 2,
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Vi passate il telefono e guardate la parola in segreto", amici: true }],
    regole: [
      "Il telefono passa di mano: ognuno <b>tiene premuto</b> per vedere in segreto la sua parola. Uno di voi è l'<b>impostore</b>: non ha la parola.",
      "L'host sceglie cosa sa l'impostore: una parola <b>simile</b>, solo la <b>categoria</b> oppure <b>niente</b>.",
      "Da 4 giocatori può esserci anche la <b>spia</b>: riceve una parola simile a quella degli altri (mare/lago). L'host decide se la spia <b>sa</b> di esserlo oppure <b>no</b>: in quel caso crede di avere la parola giusta!",
      "L'app dice <b>chi inizia</b>: a turno ognuno dice a voce UNA parola legata alla sua, senza svelarla. Poi discutete e <b>votate in segreto</b> chi è l'impostore.",
      "Punti: chi vota l'impostore <b>+2</b>, chi vota la spia <b>+1</b>. L'impostore prende <b>+3</b> se non è il più votato (basta un pareggio per salvarsi); la spia <b>+2</b> se non è la più votata.",
      "L'impostore scoperto ha un'<b>ultima possibilità</b>: se indovina la parola degli altri si salva e prende <b>+2</b>."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el, cats = categorie();
      var r = regoleDa(Object.assign({}, leggi(CHIAVE_REGOLE) || {}, dove));
      for (var k in r) dove[k] = r[k];
      if (dove.cat) dove.cat = dove.cat.filter(function (id) { return cats.some(function (c) { return c.id === id; }); });
      if (dove.cat && !dove.cat.length) dove.cat = null;
      function salva() { scrivi(CHIAVE_REGOLE, { aiuto: dove.aiuto, spia: dove.spia, mani: dove.mani, tempo: dove.tempo, cat: dove.cat }); }

      var CHIP = "padding:9px 12px;min-height:44px;font-size:.95rem";
      // le scelte principali: tre tasti su una riga (icona sopra, scritta sotto), così stanno in alto senza scorrere
      var CHIP3 = "flex-direction:column;justify-content:center;gap:2px;padding:7px 4px;min-height:54px;min-width:0;font-size:.86rem;line-height:1.15;text-align:center";
      var gruppi = {}, forzato = false;
      function riga(titolo, chiave, opzioni, dove2) {   // (dove2: la parte che si apre; se no in alto)
        var su = dove2 || box;
        su.appendChild(el("div", { class: "etichetta", text: titolo }));
        var tre = opzioni.length === 3;
        var g = el("div", { class: "cat-griglia", style: "gap:8px" + (tre ? ";display:grid;grid-template-columns:repeat(3,minmax(0,1fr))" : "") });
        gruppi[chiave] = opzioni.map(function (o) {
          var b = el("button", { class: "cat-chip", style: tre ? CHIP3 : CHIP, onclick: function () {
            if (b.disabled) return;
            dove[chiave] = o.v;
            if (chiave === "spia" && o.v !== "no" && dove.aiuto === "simile") { dove.aiuto = "categoria"; forzato = true; }   // la parola simile ce l'ha la spia
            else if (chiave === "spia" && o.v === "no" && forzato) { dove.aiuto = "simile"; forzato = false; }   // tolta la spia, torna com'era
            else if (chiave === "aiuto") forzato = false;
            aggiorna(); salva();
          } }, [ o.i ? el("span", { class: "ci", text: o.i }) : null, el("span", { text: o.t }) ]);
          b._v = o.v; g.appendChild(b); return b;
        });
        su.appendChild(g);
      }
      riga("Cosa sa l'impostore", "aiuto", [
        { v: "simile", i: "💡", t: "Parola simile" }, { v: "categoria", i: "🏷️", t: "La categoria" }, { v: "buio", i: "🙈", t: "Niente" }]);
      riga("La spia", "spia", [
        { v: "no", i: "🚫", t: "Niente spia" }, { v: "sa", i: "🎭", t: "Sa di esserlo" }, { v: "nonsa", i: "🤫", t: "Non lo sa" }]);
      var nota = el("p", { class: "modulo-nota", style: "margin:8px 0 0" });
      box.appendChild(nota);

      // il resto (mani, tempo e categorie) sta in una parte che si apre: in alto restano le scelte principali
      var altro = el("div", { hidden: "hidden" }), riassunto = el("span", { class: "imp-altro-r" });
      var apri = el("button", { class: "imp-altro", type: "button", "aria-expanded": "false", onclick: function () {
        var su = altro.hidden; altro.hidden = !su; apri.setAttribute("aria-expanded", su ? "true" : "false");
        freccia.textContent = su ? "▴" : "▾";
      } }), freccia = el("b", { text: "▾" });
      apri.appendChild(el("b", { text: "Altre scelte", style: "flex:none" }));
      apri.appendChild(riassunto);
      apri.appendChild(freccia);
      apri.style.cssText = "display:flex;align-items:center;gap:10px;width:100%;margin-top:12px;padding:12px 14px;border:0;border-radius:14px;" +
        "background:var(--carta);color:inherit;font:inherit;text-align:left;cursor:pointer";
      riassunto.style.cssText = "flex:1;min-width:0;font-size:.85rem;opacity:.75;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
      box.appendChild(apri);
      box.appendChild(altro);
      riga("Mani", "mani", [{ v: 1, t: "1 mano" }, { v: 3, t: "3 mani" }, { v: 5, t: "5 mani" }], altro);
      riga("Tempo per parlare", "tempo", [{ v: 0, i: "♾️", t: "Libero" }, { v: 60, t: "1 min" }, { v: 120, t: "2 min" }, { v: 180, t: "3 min" }], altro);

      // categorie: tocca per togliere o rimettere (almeno una resta)
      altro.appendChild(el("div", { class: "etichetta", text: "Categorie" }));
      var gc = el("div", { class: "cat-griglia", style: "gap:8px" }), chipCat = [];
      var tutte = el("button", { class: "cat-chip", style: CHIP, onclick: function () { dove.cat = null; aggiorna(); salva(); } },
        [el("span", { class: "ci", text: "🎲" }), el("span", { text: "Tutte" })]);
      gc.appendChild(tutte);
      cats.forEach(function (c) {
        var b = el("button", { class: "cat-chip", style: CHIP, onclick: function () {
          var sel = dove.cat ? dove.cat.slice() : [];
          var i = sel.indexOf(c.id);
          if (!dove.cat) sel = [c.id];                 // da "Tutte" si passa a solo questa
          else if (i >= 0) sel.splice(i, 1); else sel.push(c.id);
          dove.cat = (!sel.length || sel.length === cats.length) ? null : sel;
          aggiorna(); salva();
        } }, [el("span", { class: "ci", text: c.icona }), el("span", { text: c.nome })]);
        b._id = c.id; chipCat.push(b); gc.appendChild(b);
      });
      altro.appendChild(gc);
      var contaCat = el("p", { class: "modulo-nota", style: "margin:8px 0 0" });
      altro.appendChild(contaCat);

      function aggiorna() {
        for (var ch in gruppi) gruppi[ch].forEach(function (b) {
          var off = ch === "aiuto" && b._v === "simile" && dove.spia !== "no";
          b.disabled = off; b.style.opacity = off ? ".4" : "";
          b.className = "cat-chip" + (dove[ch] === b._v ? " attiva" : "");
        });
        var testi = {
          simile: "L'impostore riceve una parola simile ma diversa: può mimetizzarsi.",
          categoria: "L'impostore non ha la parola, ma sa la categoria (per esempio 🍕 Cibo).",
          buio: "L'impostore non ha nessun aiuto: ascolta e bluffa."
        };
        var s = testi[dove.aiuto];
        if (dove.spia === "sa") s += " La spia ha una parola simile e lo sa.";
        if (dove.spia === "nonsa") s += " La spia ha una parola simile ma crede di avere quella giusta!";
        if (dove.spia !== "no") s += " (La spia c'è da 4 giocatori in su; la parola simile va a lei, quindi l'impostore non la riceve.)";
        nota.textContent = s;
        tutte.className = "cat-chip" + (!dove.cat ? " attiva" : "");
        chipCat.forEach(function (b) { b.className = "cat-chip" + (dove.cat && dove.cat.indexOf(b._id) >= 0 ? " attiva" : ""); });
        var n = 0; cats.forEach(function (c) { if (!dove.cat || dove.cat.indexOf(c.id) >= 0) n += c.coppie.length; });
        contaCat.textContent = n + " coppie di parole in gioco";
        var nc = dove.cat ? dove.cat.length : 0;
        riassunto.textContent = (dove.mani > 1 ? dove.mani + " mani" : "1 mano") + " · " + (dove.tempo ? "⏱️ " + Math.round(dove.tempo / 60) + " min" : "⏱️ libero") + " · " +
          (nc ? nc + (nc === 1 ? " categoria" : " categorie") : "tutte le categorie");
      }
      aggiorna();
    },

    avvia: function (t) {
      var cats = categorie();
      if (!cats.length) return niente(t);
      var st = {
        R: regoleDa(t.impostazioni),
        cats: cats,
        g: t.giocatori.map(function (nm) { return { nome: nm, punti: 0, voto: null, piu: 0 }; }),
        mano: 0
      };
      nuovaMano(t, st);
    }
  });

  function niente(t) {
    var s = t.schermata({ icona: "🕵️", titolo: "Mancano le parole", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { text: "Le parole del gioco non sono state caricate." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // ---- pesca una coppia: dalle categorie scelte, evitando quelle uscite di recente ----
  function pescaCoppia(st) {
    var pool = [];
    st.cats.forEach(function (c) { if (!st.R.cat || st.R.cat.indexOf(c.id) >= 0) pool = pool.concat(c.coppie); });
    if (!pool.length) st.cats.forEach(function (c) { pool = pool.concat(c.coppie); });
    var usate = leggi(CHIAVE_USATE); if (!Array.isArray(usate)) usate = [];
    var nuove = pool.filter(function (p) { return usate.indexOf(p.a) < 0; });
    var c = (nuove.length ? nuove : pool)[rnd((nuove.length ? nuove : pool).length)];
    usate = usate.filter(function (x) { return x !== c.a; }); usate.push(c.a);
    scrivi(CHIAVE_USATE, usate.slice(-Math.min(200, Math.max(1, pool.length - 5))));   // le ultime ~200 non tornano
    return c;
  }
  function categoria(st, id) { return st.cats.filter(function (c) { return c.id === id; })[0]; }

  function nuovaMano(t, st) {
    st.mano++;
    var n = st.g.length, R = st.R;
    st.g.forEach(function (gg) { gg.voto = null; gg.piu = 0; });
    var c = pescaCoppia(st), giro = Math.random() < 0.5;   // una volta su due le due parole si scambiano
    st.parola = giro ? c.b : c.a; st.simile = giro ? c.a : c.b; st.cat = c.cat;
    st.impostore = rnd(n);
    st.spia = -1;
    if (R.spia !== "no" && n >= 4) { do { st.spia = rnd(n); } while (st.spia === st.impostore); }
    st.aiuto = (R.aiuto === "simile" && st.spia >= 0) ? "categoria" : R.aiuto;   // con la spia la parola simile è sua
    st.indovinato = false;
    // chi inizia è a caso, ma l'impostore apre di rado (posizione più difficile):
    // se il sorteggio lo pesca, nel 60% dei casi passo la mano a un altro.
    var ini = rnd(n);
    if (ini === st.impostore && Math.random() < 0.6) { do { ini = rnd(n); } while (ini === st.impostore); }
    st.iniziante = ini;
    rivela(t, st, 0);
  }

  // ---- passaggio del telefono (con l'uscita e senza tocchi doppi) ----
  function passa(t, nome, quando) {
    var el = t.el;
    var s = t.schermata({ indietro: uscita(t) });
    s._contenuto.style.display = "flex";
    s._contenuto.appendChild(el("div", { class: "passa" }, [
      el("div", { class: "emoji", text: "🤝" }),
      el("p", { class: "tenue", text: "Passa il telefono a" }),
      el("div", { class: "grande", style: "overflow-wrap:anywhere", text: nome })
    ]));
    s._piede.appendChild(tasto(t, "Sono " + nome + " ▶", "btn-primario", quando));
    t.mostra(s);
  }

  // ---- rivelazione segreta, uno alla volta ----
  function rivela(t, st, i) {
    if (i >= st.g.length) return siComincia(t, st);
    passa(t, st.g[i].nome, function () { schermataRuolo(t, st, i); });
  }

  // cosa vede ognuno: stessa forma e stessi colori per tutti, cambia solo il testo
  function ruolo(st, i) {
    if (i === st.impostore) {
      if (st.aiuto === "simile") return { su: "Sei l'impostore! La tua parola è simile ma diversa", grande: st.simile, giu: "Gli altri hanno un'altra parola: mimetizzati" };
      if (st.aiuto === "categoria") {
        var c = categoria(st, st.cat);
        return { su: "Sei l'impostore! Non hai la parola", grande: "🕵️ Impostore", giu: "Categoria: " + c.icona + " " + c.nome + ". Ascolta e bluffa" };
      }
      return { su: "Sei l'impostore! Non hai la parola", grande: "🕵️ Impostore", giu: "Ascolta gli altri e bluffa" };
    }
    if (i === st.spia && st.R.spia === "sa") return { su: "Sei la spia! La tua parola è simile a quella degli altri", grande: st.simile, giu: "Mimetizzati e non farti votare" };
    return { su: "La tua parola è", grande: i === st.spia ? st.simile : st.parola, giu: "Non dirla ad alta voce" };
  }

  function schermataRuolo(t, st, i) {
    var el = t.el, info = ruolo(st, i);
    var s = t.schermata({ icona: "🤫", titolo: st.g[i].nome, sotto: "Solo tu puoi guardare", indietro: uscita(t) });
    s._contenuto.style.cssText = "display:flex;flex-direction:column";
    var STRATO = "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:18px;text-align:center;transition:opacity .12s";
    var coperta = el("div", { style: STRATO }, [
      el("div", { style: "font-size:3.2rem", text: "👆" }),
      el("div", { style: "font-size:1.3rem;font-weight:800", text: "Tieni premuto qui per vedere" }),
      el("div", { class: "modulo-nota", style: "margin:0", text: "Quando lasci il dito si nasconde" })
    ]);
    var dentro = el("div", { style: STRATO + ";opacity:0" }, [
      el("div", { class: "modulo-nota", style: "margin:0;font-weight:700", text: info.su }),
      el("div", { style: "font-size:" + (info.grande.length > 16 ? "1.7rem" : "2.3rem") + ";font-weight:900;line-height:1.15;overflow-wrap:anywhere", text: info.grande }),
      el("div", { class: "modulo-nota", style: "margin:0", text: info.giu })
    ]);
    var carta = el("div", { style: "position:relative;flex:1;min-height:220px;border-radius:22px;background:var(--carta);box-shadow:var(--ombra);" +
      "-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none;cursor:pointer;overflow:hidden" }, [coperta, dentro]);
    s._contenuto.appendChild(carta);

    var ok = tasto(t, "Ho capito, avanti ▶", "btn-primario", function () { rivela(t, st, i + 1); });
    ok.style.visibility = "hidden";   // compare solo dopo aver visto il ruolo
    s._piede.appendChild(ok);

    var premuto = false;
    function vedi(v) { coperta.style.opacity = v ? "0" : "1"; dentro.style.opacity = v ? "1" : "0"; }
    carta.addEventListener("pointerdown", function (e) {
      e.preventDefault(); premuto = true; vedi(true);
      try { carta.setPointerCapture(e.pointerId); } catch (x) {}
    });
    function lascia() {
      if (!premuto) return; premuto = false; vedi(false);
      if (ok.style.visibility === "hidden") { ok.style.visibility = "visible"; ok.sveglia(); }
    }
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (ev) { carta.addEventListener(ev, lascia); });
    carta.addEventListener("contextmenu", function (e) { e.preventDefault(); });   // niente menu col dito premuto a lungo
    t.mostra(s);
  }

  // ---- si parla: chi inizia, il giro e (se scelto) il tempo ----
  function siComincia(t, st) {
    var el = t.el, n = st.g.length, R = st.R;
    var s = t.schermata({ icona: "🎬", titolo: "Si comincia!", indietro: uscita(t),
      sotto: R.mani > 1 ? "Mano " + st.mano + " di " + R.mani : "Tutti hanno visto la parola" });
    var ruoli = "🕵️ 1 impostore" + (st.spia >= 0 ? " · 🎭 1 spia" + (R.spia === "nonsa" ? " (che non lo sa!)" : "") : "");
    s._contenuto.appendChild(el("div", { style: "text-align:center" }, [
      el("div", { class: "modulo-nota", style: "margin:0 0 10px;font-weight:700", text: "In gioco: " + ruoli }),
      el("p", { class: "modulo-nota", style: "margin:0", text: "Inizia" }),
      el("div", { style: "font-size:2.1rem;font-weight:900;overflow-wrap:anywhere", text: st.g[st.iniziante].nome })
    ]));
    // il giro dei turni, partendo da chi inizia
    var giro = el("div", { style: "display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:12px 0" });
    for (var k = 0; k < n; k++) {
      var gg = st.g[(st.iniziante + k) % n];
      giro.appendChild(el("span", { style: "padding:5px 10px;border-radius:999px;font-size:.9rem;font-weight:700;max-width:46%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" +
        (k === 0 ? "background:var(--accento);color:#241f00" : "background:var(--carta)"), text: (k + 1) + ". " + gg.nome }));
    }
    s._contenuto.appendChild(giro);
    s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin:0 0 12px",
      text: "A turno dite a voce UNA parola legata alla vostra, senza svelarla. Poi discutete: chi bluffa?" }));
    if (R.tempo > 0) s._contenuto.appendChild(orologio(t, R.tempo));
    s._piede.appendChild(tasto(t, "Andiamo a votare ▶", "btn-primario", function () { vota(t, st, 0); }));
    t.mostra(s);
  }

  // il tempo per parlare: parte quando lo toccate, si aggiorna solo la scritta
  function orologio(t, sec) {
    var el = t.el, fine = 0, timer = null, ultimo = -1;
    function mmss(x) { return Math.floor(x / 60) + ":" + ("0" + (x % 60)).slice(-2); }
    var b = el("button", { class: "btn", style: "font-size:1.4rem;font-weight:900;font-variant-numeric:tabular-nums", text: "⏱️ Avvia il tempo · " + mmss(sec) });
    b.addEventListener("click", function () {
      if (timer) return;
      fine = Date.now() + sec * 1000; tic(880);
      timer = setInterval(passo, 250); passo();
    });
    function passo() {
      if (!document.body.contains(b)) { clearInterval(timer); return; }
      var resta = Math.max(0, Math.ceil((fine - Date.now()) / 1000));
      b.textContent = resta > 0 ? "⏱️ " + mmss(resta) : "⏰ Tempo scaduto: si vota!";
      if (resta === ultimo) return;   // la scritta cambia solo quando cambia il secondo
      ultimo = resta;
      if (resta > 0 && resta <= 5) tic(700);
      if (resta === 0) { clearInterval(timer); b.style.background = "var(--rosso)"; b.style.color = "#3a0009"; fanfara(false); }
    }
    return b;
  }

  // ---- votazione: ognuno indica in segreto chi crede sia l'impostore ----
  function vota(t, st, i) {
    if (i >= st.g.length) return spoglio(t, st);
    passa(t, st.g[i].nome, function () { schermataVoto(t, st, i); });
  }

  function schermataVoto(t, st, i) {
    var el = t.el, n = st.g.length;
    var s = t.schermata({ icona: "🗳️", titolo: st.g[i].nome + ", chi accusi?", sotto: "Vota in segreto: chi è l'impostore?", indietro: uscita(t) });
    var g = el("div", { style: "display:grid;gap:8px;grid-template-columns:" + (n - 1 > 5 ? "1fr 1fr" : "1fr") });
    st.g.forEach(function (gg, k) {
      if (k === i) return;
      g.appendChild(tasto(t, gg.nome, "", function () { st.g[i].voto = k; vota(t, st, i + 1); }));
    });
    [].forEach.call(g.children, function (b) { b.style.cssText = "font-size:1.1rem;padding:12px 10px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block"; });
    s._contenuto.appendChild(g);
    t.mostra(s);
  }

  // conti dei voti: il più votato DA SOLO viene accusato (col pareggio nessuno)
  function conta(st) {
    var conte = st.g.map(function () { return 0; });
    st.g.forEach(function (gg) { if (gg.voto != null) conte[gg.voto]++; });
    var max = Math.max.apply(null, conte), piu = [];
    conte.forEach(function (c, k) { if (c === max && max > 0) piu.push(k); });
    return { conte: conte, piu: piu, accusato: piu.length === 1 ? piu[0] : -1 };
  }

  // ---- lo spoglio: i voti escono uno alla volta, poi il verdetto ----
  function spoglio(t, st) {
    var el = t.el, n = st.g.length, V = conta(st);
    st.V = V;
    var s = t.schermata({ icona: "📮", titolo: "Lo spoglio", sotto: "Quanti voti ha preso ognuno", indietro: uscita(t) });
    var griglia = el("div", { style: "display:grid;gap:6px;grid-template-columns:" + (n > 6 ? "1fr 1fr" : "1fr") });
    var bolle = st.g.map(function (gg, k) {
      var bolla = el("span", { style: "min-width:34px;text-align:center;padding:2px 8px;border-radius:999px;background:var(--carta-2);font-weight:900;transition:transform .2s", text: "·" });
      var riga = el("div", { style: "display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 10px;border-radius:12px;background:var(--carta);border:2px solid transparent" }, [
        el("span", { style: "font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap", text: gg.nome }), bolla ]);
      griglia.appendChild(riga);
      return { bolla: bolla, riga: riga };
    });
    s._contenuto.appendChild(griglia);
    var verdetto = el("div", { style: "text-align:center;margin-top:14px;opacity:0;transform:scale(.9);transition:opacity .3s, transform .3s" });
    var esito1 = el("div", { class: "modulo-nota", style: "margin:0;font-weight:700" });
    var esito2 = el("div", { style: "font-size:1.6rem;font-weight:900;line-height:1.2;margin-top:4px;opacity:0;transform:translateY(8px);transition:opacity .35s, transform .35s" });
    verdetto.appendChild(esito1); verdetto.appendChild(esito2);
    s._contenuto.appendChild(verdetto);
    var avanti = tasto(t, "Avanti ▶", "btn-primario", function () {
      if (V.accusato === st.impostore) ultimaPossibilita(t, st); else esito(t, st);
    });
    avanti.style.visibility = "hidden";
    s._piede.appendChild(avanti);
    t.mostra(s);

    var passi = 0;
    function dopo(ms, fn) { setTimeout(function () { if (document.body.contains(s)) fn(); }, ms); }
    st.g.forEach(function (gg, k) {
      dopo(450 + k * 330, function () {
        bolle[k].bolla.textContent = V.conte[k]; bolle[k].bolla.style.transform = "scale(1.35)";
        setTimeout(function () { bolle[k].bolla.style.transform = ""; }, 200);
        tic(500 + V.conte[k] * 90);
      });
      passi = 450 + k * 330;
    });
    dopo(passi + 500, function () {
      V.piu.forEach(function (k) { bolle[k].riga.style.borderColor = "var(--accento)"; });
      if (V.accusato < 0) {
        esito1.textContent = V.piu.length ? "Pareggio nei voti!" : "Nessun voto";
        esito2.textContent = "🤝 Nessuno viene accusato";
      } else {
        esito1.textContent = "Il più votato è " + st.g[V.accusato].nome + "…";
        esito2.textContent = V.accusato === st.impostore ? "🕵️ ed è l'impostore!" : V.accusato === st.spia ? "🎭 ed è la spia!" : "😇 ed è innocente!";
      }
      verdetto.style.opacity = "1"; verdetto.style.transform = "none";
      rullo();
    });
    dopo(passi + 1900, function () {
      esito2.style.opacity = "1"; esito2.style.transform = "none";
      fanfara(V.accusato === st.impostore || V.accusato === st.spia);
      avanti.style.visibility = "visible"; avanti.sveglia();
    });
  }

  // ---- ultima possibilità: l'impostore scoperto prova a indovinare la parola ----
  function ultimaPossibilita(t, st) {
    var el = t.el, c = categoria(st, st.cat);
    var nome = st.g[st.impostore].nome;
    var s = t.schermata({ icona: "🎯", titolo: "Ultima possibilità!", sotto: nome + ", indovina la parola degli altri", indietro: uscita(t) });
    // esche: altre parole della stessa categoria (se non bastano, da tutte)
    var esche = [];
    c.coppie.forEach(function (p) { if (p.a !== st.parola && p.b !== st.parola) { esche.push(p.a, p.b); } });
    esche = mischia(esche.filter(function (w) { return w !== st.simile; }));
    if (esche.length < 4) st.cats.forEach(function (cc) { if (cc !== c) cc.coppie.forEach(function (p) { esche.push(p.a); }); });
    var scelte = [st.parola, st.simile];
    esche.forEach(function (w) { if (scelte.length < 6 && scelte.indexOf(w) < 0) scelte.push(w); });
    scelte = mischia(scelte);
    s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center",
      text: "Se indovini ti salvi e prendi 2 punti. Gli altri: niente aiutini!" }));
    var g = el("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:8px" });
    var esito1 = el("div", { style: "text-align:center;font-size:1.4rem;font-weight:900;margin-top:14px;min-height:2em" });
    var avanti = tasto(t, "Vedi il risultato ▶", "btn-primario", function () { esito(t, st); });
    avanti.style.visibility = "hidden";
    var scelto = false;
    var bottoni = scelte.map(function (w) {
      var b = tasto(t, w, "", function () {
        if (scelto) return; scelto = true;
        st.indovinato = w === st.parola;
        bottoni.forEach(function (x) {
          x.disabled = true;
          if (x._w === st.parola) { x.style.background = "var(--verde)"; x.style.color = "#04321c"; x.disabled = false; }
        });
        if (!st.indovinato) { b.style.background = "var(--rosso)"; b.style.color = "#3a0009"; b.disabled = false; }
        esito1.textContent = st.indovinato ? "🎯 Indovinata! Si salva!" : "❌ Sbagliato! La parola era " + st.parola;
        fanfara(st.indovinato);
        avanti.style.visibility = "visible"; avanti.sveglia();
      });
      b._w = w;
      b.style.cssText = "font-size:1rem;padding:12px 8px;min-width:0;overflow-wrap:anywhere;line-height:1.15";
      g.appendChild(b); return b;
    });
    s._contenuto.appendChild(g);
    s._contenuto.appendChild(esito1);
    s._piede.appendChild(avanti);
    t.mostra(s);
  }

  // ---- statistiche per i trofei: conta SOLO chi ha il profilo attivo sul telefono ----
  function salvaTrofei(st, salvo) {
    var prof = window.SGNube && SGNube.disponibile() && SGNube.profilo();
    if (!prof) return;
    var io = -1, V = st.V;
    st.g.forEach(function (gg, k) { if (io < 0 && stessoNome(gg.nome, prof.nome)) io = k; });
    if (io < 0) return;
    // la serie continua tra le partite (e tra le mani: la tengo qui, il cloud può arrivare in ritardo)
    if (st.serie == null) st.serie = (SGNube.statGioco("impostore") || {}).serieSmascheratiOra || 0;
    var serie = st.serie;
    var c = {}, conParola = st.aiuto === "simile", buio = st.aiuto === "buio";
    if (st.mano >= st.R.mani) c.partite = 1;   // la partita conta una volta sola, all'ultima mano
    if (io === st.impostore) {
      if (conParola) c.impostoreConAiuto = 1;
      if (salvo) {
        c.vinteImpostore = 1;
        if (conParola) c.vinteImpAiutoOn = 1; else if (buio) c.vinteImpAiutoOff = 1;
        if (V.conte[io] === 0) { c.vinteImp0Voti = 1; if (buio) c.vinteImpPerfette = 1; }   // nessuno ti ha votato
        if (st.iniziante === io) c.vinteImpApertura = 1;                                     // e aprivi pure il giro
      }
    } else {
      if (st.g[io].voto === st.impostore) { c.smascherati = 1; if (conParola) c.smascheratiControAiuto = 1; serie++; }
      else serie = 0;
      if (V.accusato === io && io !== st.spia) c.innocenteAccusato = 1;   // il più votato, ma innocente
    }
    st.serie = serie;
    var incrs = []; for (var k in c) incrs.push([k, c[k]]);
    SGNube.salvaProgressi(null, "impostore", incrs, [["serieSmascheratiMax", serie]], [["serieSmascheratiOra", serie]]);
  }

  // ---- esito della mano + punti ----
  function esito(t, st) {
    var el = t.el, V = st.V, R = st.R, n = st.g.length;
    var scoperto = V.accusato === st.impostore, salvo = !scoperto || st.indovinato;
    st.g.forEach(function (gg, k) {
      var p = 0;
      if (k === st.impostore) p = !scoperto ? 3 : (st.indovinato ? 2 : 0);
      else {
        if (gg.voto === st.impostore) p += 2;
        else if (gg.voto === st.spia && st.spia >= 0) p += 1;
        if (k === st.spia && V.accusato !== k) p += 2;
      }
      gg.piu = p; gg.punti += p;
    });
    salvaTrofei(st, salvo);

    var titolo, icona, sotto;
    if (scoperto && !st.indovinato) { titolo = "Impostore scoperto!"; icona = "✅"; sotto = "E non ha indovinato la parola"; }
    else if (scoperto) { titolo = "Scoperto… ma ha indovinato!"; icona = "🎯"; sotto = "Si salva all'ultimo"; }
    else if (V.accusato === st.spia && st.spia >= 0) { titolo = "Presa la spia!"; icona = "🎭"; sotto = "Ma l'impostore se la cava"; }
    else if (V.accusato >= 0) { titolo = "Avete accusato un innocente!"; icona = "😇"; sotto = "L'impostore l'ha fatta franca"; }
    else { titolo = "Pareggio nei voti!"; icona = "🤝"; sotto = "Così l'impostore si salva"; }
    var ultima = st.mano >= R.mani;
    var s = t.schermata({ icona: icona, titolo: titolo, sotto: sotto + (R.mani > 1 ? " · mano " + st.mano + " di " + R.mani : ""), indietro: uscita(t) });

    // chi era chi e le parole, in due righe
    var svela = [
      el("div", { style: "font-size:1.25rem;font-weight:900;overflow-wrap:anywhere", text: "🕵️ " + st.g[st.impostore].nome +
        (st.spia >= 0 ? "   🎭 " + st.g[st.spia].nome : "") }),
      el("div", { class: "modulo-nota", style: "margin:2px 0 0;font-size:.95rem" }, [ "Parola: ", el("b", { style: "color:var(--testo)", text: st.parola }),
        (st.spia >= 0 || st.aiuto === "simile") ? (st.spia >= 0 ? " · la spia aveva " : " · l'impostore aveva ") + st.simile : null ])
    ];
    s._contenuto.appendChild(el("div", { style: "text-align:center;padding:8px 10px;border-radius:16px;background:var(--carta);margin-bottom:8px" }, svela));

    // una riga a testa: chi ha votato chi e i punti presi
    var lista = el("div", { style: "display:flex;flex-direction:column;gap:" + (n > 6 ? "3px" : "4px") });
    st.g.forEach(function (gg, k) {
      var segno = k === st.impostore ? "🕵️" : k === st.spia ? "🎭" : "";
      var voto = gg.voto == null ? "" : "→ " + st.g[gg.voto].nome +
        (k === st.impostore ? "" : gg.voto === st.impostore ? " ✅" : gg.voto === st.spia ? " 🎭" : " ❌");
      lista.appendChild(el("div", { style: "display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr) auto" + (R.mani > 1 ? " auto" : "") +
        ";gap:8px;align-items:center;padding:" + (n > 6 ? "3px" : "7px") + " 10px;border-radius:10px;background:rgba(255,255,255,.05);font-size:" + (n > 6 ? ".9rem" : "1rem") }, [
        el("span", { style: "font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap", text: (segno ? segno + " " : "") + gg.nome }),
        el("span", { class: "modulo-nota", style: "margin:0;font-size:inherit;overflow:hidden;text-overflow:ellipsis;white-space:nowrap", text: voto }),
        el("span", { style: "font-weight:900;color:" + (gg.piu ? "var(--verde)" : "var(--testo-tenue)"), text: "+" + gg.piu }),
        R.mani > 1 ? el("span", { style: "font-weight:900;min-width:2ch;text-align:right", text: String(gg.punti) }) : null
      ]));
    });
    s._contenuto.appendChild(lista);

    s._piede.appendChild(ultima
      ? tasto(t, "Vedi la classifica 🏆", "btn-primario", function () { t.fine(classifica(st)); })
      : tasto(t, "Prossima mano (" + (st.mano + 1) + " di " + R.mani + ") ▶", "btn-primario", function () { nuovaMano(t, st); }));
    t.mostra(s);
  }

  // classifica finale: a pari punti, stesso posto
  function classifica(st) {
    var ord = st.g.slice().sort(function (a, b) { return b.punti - a.punti; });
    return ord.map(function (x, i) {
      var pos = i + 1;
      for (var j = 0; j < i; j++) if (ord[j].punti === x.punti) { pos = j + 1; break; }
      return { nome: x.nome, punti: x.punti, pos: pos };
    });
  }
})();
