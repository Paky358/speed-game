/* =========================================================
   «IL PREZZO È GIUSTO!» — giochi a premi (file b): «✋ È troppo!» e «🟡 Plinko», tutti insieme ognuno dal suo telefono.
   L'interfaccia dei giochi a premi è spiegata in js/games/prezzo-premi-piu.js («🔼🔽 Più o meno») e in
   scratchpad/giochi-nuovi/prezzo/interfaccia-premi.md. Questo file è già caricato da index.html e messo nella versione online.

   ✋ È TROPPO! (That's Too Much)
     Una cosa cara (sopra i 2.000 €). Sul telefono scorrono 10 prezzi che salgono (uno ogni 1,6 s): si tocca «✋ È TROPPO!»
     appena il prezzo SUPERA quello vero. Il primo prezzo sopra vale 400, uno dopo 250, due dopo 150, più tardi 50;
     troppo presto o mai 0. I 10 prezzi li fa il gioco (dal 50% al 155% del vero, a passi tondi, il vero tra il 3° e l'8°).
     Rete: nella foto la lista dei prezzi (mai il vero); ogni telefono li fa scorrere da sé con l'orologio del pannello
     (A.fine), e il tocco manda il NUMERO del prezzo che si vedeva: il ritardo della rete non conta.
     Sullo stesso telefono: da 2 a 4 tutti insieme, un bottone a testa (il pannello del primo turno manda i tocchi di tutti
     con { tutti, ord }); da 5 in su a turno, ognuno vede scorrere gli stessi prezzi da capo.
   🟡 PLINKO
     Prima i gettoni («Occhio al prezzo»): 3 cose piccole, per ognuna due prezzi, si tocca quello giusto (6 s l'una):
     1 gettone + 1 per ogni risposta giusta. Poi si sceglie dove lasciarli (9 posti) e «Lascia!». L'host fa cadere tutti i
     gettoni tra i chiodini (12 file) e manda i percorsi nella rivelazione: tutti vedono la stessa caduta, tutti i gettoni
     insieme. Caselle 10 · 50 · 100 · 0 · 500 · 0 · 100 · 50 · 10. Sullo stesso telefono ognuno ha le sue 3 domande.
   Stile: classi col prefisso pzb- (più quelle pz- di prezzo-scena.js).
   ========================================================= */
(function () {
  "use strict";
  var PREMI = window.SG_PREZZO_PREMI = window.SG_PREZZO_PREMI || {};
  function Z() { return window.SGPrezzoScena || {}; }
  function tondo2(v) { return Math.round((+v || 0) * 100) / 100; }
  function intero(v) { v = Math.round(+v); return isFinite(v) ? v : null; }

  // ---------------- lo stile (una volta) ----------------
  function stile() {
    if (document.getElementById("sg-pzb-css")) return;
    var s = document.createElement("style"); s.id = "sg-pzb-css";
    s.textContent = [
      ".pz-sch.pzb-fitto{gap:6px}",
      // ✋ È troppo! — il maxischermo
      ".pzb-tr-big{display:flex;flex-direction:column;align-items:center;gap:3px}",
      ".pzb-tr-n{font-size:12px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#cdd6ff;min-height:15px}",
      ".pzb-tr-p{display:inline-flex;align-items:center;justify-content:center;min-width:62%;padding:6px 18px;border-radius:10px 22px 22px 10px;background:linear-gradient(#ffe98a,#fcc419);color:#3b2a00;",
        "font-weight:900;font-size:clamp(30px,calc(var(--alt,640px) * .062),48px);line-height:1.1;font-variant-numeric:tabular-nums;box-shadow:0 6px 18px rgba(0,0,0,.45),inset 0 -4px 0 rgba(0,0,0,.15);white-space:nowrap}",
      ".pzb-tr-p.attesa{background:linear-gradient(#3d3570,#272152);color:#ffe066}.pzb-tr-p.fine{background:linear-gradient(#ffc9c9,#ff8787);color:#5c0011}",
      ".pzb-tr-p.gira{animation:pzbGira .32s cubic-bezier(.3,1.5,.5,1)}",
      "@keyframes pzbGira{from{transform:scaleY(.15) translateY(-8px);opacity:.2}to{transform:none;opacity:1}}",
      ".pzb-tr-tacche{display:flex;gap:3px;width:min(300px,86%)}",
      ".pzb-tr-tacche i{flex:1;height:7px;border-radius:4px;background:rgba(255,255,255,.16);transition:background .2s}",
      ".pzb-tr-tacche i.on{background:#ffd43b}.pzb-tr-tacche i.ora{background:#fff;box-shadow:0 0 8px #fff}",
      // ✋ È troppo! — il pannello
      ".pzb-tr-pan{display:flex;flex-direction:column;gap:8px}",
      ".pzb-tr-disp{display:flex;align-items:center;justify-content:space-between;gap:8px;height:clamp(44px,calc(var(--alt,640px) * .075),60px);padding:0 14px;border-radius:14px;background:#05030f;box-shadow:inset 0 0 0 2px rgba(255,224,102,.35)}",
      ".pzb-tr-disp .n{font-size:12px;font-weight:900;color:#9aa5d8;white-space:nowrap}",
      ".pzb-tr-disp .v{font-family:'Courier New',ui-monospace,monospace;font-weight:900;font-size:clamp(24px,calc(var(--alt,640px) * .046),34px);color:#ffe066;white-space:nowrap}",
      ".pzb-tr-btn{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;height:clamp(112px,calc(var(--alt,640px) * .23),190px);border:0;border-radius:28px;",
        "font:inherit;font-weight:900;font-size:clamp(28px,calc(var(--alt,640px) * .055),40px);color:#fff;letter-spacing:.02em;background:radial-gradient(circle at 50% 30%,#ff8787,#e03131 55%,#a51111);",
        "box-shadow:inset 0 -8px 0 rgba(0,0,0,.28),inset 0 2px 0 rgba(255,255,255,.35),0 8px 24px rgba(224,49,49,.45);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform .08s}",
      ".pzb-tr-btn small{font-size:13px;font-weight:800;opacity:.9;letter-spacing:0}",
      ".pzb-tr-btn:active{transform:scale(.96)}",
      ".pzb-tr-btn.vivo{animation:pzbBatte 1.6s ease-in-out infinite}",
      "@keyframes pzbBatte{0%,100%{transform:none}12%{transform:scale(1.035)}24%{transform:none}}",
      ".pzb-tr-btn.attesa{background:linear-gradient(#5a4f8f,#3a3170);box-shadow:inset 0 -6px 0 rgba(0,0,0,.25);font-size:24px}",
      ".pzb-tr-btn.fatto{background:linear-gradient(#69db7c,#2b8a3e);font-size:24px;animation:none}.pzb-tr-btn.niente{background:linear-gradient(#868e96,#495057);font-size:22px;animation:none}",
      // tutti insieme sullo stesso telefono: un bottone a testa
      ".pzb-tr-griglia{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}",
      ".pzb-tr-bt{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;height:clamp(84px,calc(var(--alt,640px) * .15),126px);border:0;border-radius:20px;font:inherit;color:#fff;",
        "background:radial-gradient(circle at 50% 30%,#ff8787,#e03131 60%,#a51111);box-shadow:inset 0 0 0 4px var(--c,#fff),inset 0 -6px 0 rgba(0,0,0,.25);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform .08s}",
      ".pzb-tr-bt:active{transform:scale(.95)}.pzb-tr-bt b{font-size:20px;font-weight:900}.pzb-tr-bt .chi{display:flex;align-items:center;gap:5px;font-size:13px;font-weight:900;max-width:100%}",
      ".pzb-tr-bt .chi .fac{width:24px;height:24px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.2);flex:0 0 auto}.pzb-tr-bt .chi .fac svg{width:100%;height:100%;display:block}",
      ".pzb-tr-bt .chi span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pzb-tr-bt.fatto{background:linear-gradient(#69db7c,#2b8a3e)}.pzb-tr-bt.attesa{background:linear-gradient(#5a4f8f,#3a3170)}.pzb-tr-bt.niente{background:linear-gradient(#868e96,#495057)}",
      ".pzb-tr-griglia.tre .pzb-tr-bt:last-child{grid-column:span 2}",
      // ✋ È troppo! — la rivelazione: la scala dei 10 prezzi
      ".pzb-scala{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:repeat(5,auto);grid-auto-flow:column;gap:4px 6px;width:100%;max-width:440px}",
      ".pzb-rg{position:relative;display:flex;align-items:center;gap:5px;height:clamp(24px,calc(var(--alt,640px) * .043),32px);padding:0 6px 0 4px;border-radius:10px;background:rgba(255,255,255,.09);text-align:left;animation:pzSu .35s both;transition:background .25s,box-shadow .25s,opacity .25s}",
      ".pzb-rg .n{flex:0 0 auto;width:17px;height:17px;border-radius:50%;background:rgba(255,255,255,.16);font-size:10.5px;font-weight:900;display:flex;align-items:center;justify-content:center}",
      ".pzb-rg .v{flex:0 0 auto;font-weight:900;font-size:13.5px;color:#ffe066;white-space:nowrap;font-variant-numeric:tabular-nums}",
      ".pzb-rg .fc{flex:1;min-width:0;display:flex;justify-content:flex-end;align-items:center;overflow:hidden}",
      ".pzb-rg .fc .fac{width:22px;height:22px;margin-left:-7px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.18);box-shadow:0 0 0 2px #1a1150;flex:0 0 auto}.pzb-rg .fc .fac svg{width:100%;height:100%;display:block}",
      ".pzb-rg .fc .piu{font-size:11px;font-weight:900;margin-left:3px;color:#fff}",
      ".pzb-rg.sotto{opacity:.62}.pzb-rg.sotto .v{color:#b2f2bb}",
      ".pzb-rg.primo{background:rgba(255,212,59,.32);box-shadow:0 0 0 2px #ffd43b;opacity:1}.pzb-rg.primo .n{background:#ffd43b;color:#3b2a00}",
      ".pzb-rg.sopra{background:rgba(255,93,108,.2)}.pzb-rg.sopra .v{color:#ffb3bb}",
      ".pzb-rg .pt{position:absolute;right:4px;top:-8px;font-size:11px;font-weight:900;color:#04321c;background:#6ff0a6;border-radius:99px;padding:0 5px;animation:pzPop .35s both}",
      ".pzb-rg .pt.zero{background:#ff8787;color:#fff}",
      ".pzb-mai{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800;color:#cdd6ff}.pzb-mai .fc{display:flex}.pzb-mai .fac{width:22px;height:22px;margin-left:-6px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.14)}.pzb-mai .fac svg{width:100%;height:100%;display:block}",
      ".pzb-ban-s{font-size:clamp(17px,calc(var(--alt,640px) * .032),24px)}",
      // 🟡 Plinko — la parete coi chiodini
      ".pzb-pl-board{position:relative;flex:1 1 0;min-height:0;width:100%;display:flex;justify-content:center;align-items:center;overflow:hidden}",
      ".pzb-pl-in{position:relative;border-radius:16px;overflow:hidden;box-shadow:0 0 0 3px #ffd43b,0 8px 24px rgba(0,0,0,.45)}",
      ".pzb-pl-in canvas{position:absolute;left:0;top:0;display:block}",
      ".pzb-tok{position:absolute;left:0;top:0;border-radius:50%;overflow:hidden;background:var(--c,#ffd43b);box-shadow:0 0 0 2.5px var(--c,#ffd43b),0 3px 6px rgba(0,0,0,.45);will-change:transform}",
      ".pzb-tok img{position:absolute;left:-8%;top:-2%;width:116%;height:116%;display:block}",
      ".pzb-tok.pop{animation:pzbTok .35s cubic-bezier(.3,1.6,.5,1) both}",
      "@keyframes pzbTok{from{opacity:0}to{opacity:1}}",
      ".pzb-flash{position:absolute;bottom:0;border-radius:6px 6px 0 0;background:radial-gradient(circle at 50% 100%,rgba(255,255,255,.95),rgba(255,224,102,.0) 70%);opacity:0;pointer-events:none}",
      ".pzb-flash.on{animation:pzbFlash .7s ease-out}",
      "@keyframes pzbFlash{0%{opacity:1}100%{opacity:0}}",
      ".pzb-piu{position:absolute;font-weight:900;font-size:15px;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.6);pointer-events:none;white-space:nowrap;animation:pzbSale 1.2s ease-out both}",
      ".pzb-piu.oro{color:#ffe066;font-size:20px}.pzb-piu.zero{color:#ff8787}",
      "@keyframes pzbSale{0%{transform:translate(-50%,0) scale(.6);opacity:0}15%{transform:translate(-50%,-10px) scale(1.15);opacity:1}100%{transform:translate(-50%,-46px) scale(1);opacity:0}}",
      ".pzb-pl-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 6px;max-width:100%}",
      ".pzb-pl-ch{display:flex;align-items:center;gap:4px;border-radius:99px;padding:2px 8px 2px 2px;background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 2px var(--c,transparent);font-weight:900;font-size:12.5px;white-space:nowrap}",
      ".pzb-pl-ch .fac{width:22px;height:22px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.14);flex:0 0 auto}.pzb-pl-ch .fac svg{width:100%;height:100%;display:block}",
      ".pzb-pl-ch .v{color:#ffe066}.pzb-pl-ch.primo{background:rgba(255,212,59,.3)}.pzb-pl-ch.cambia .v{animation:pzPop .3s}",
      // 🟡 Plinko — il pannello
      ".pzb-pl-pan{display:flex;flex-direction:column;gap:7px}",
      ".pzb-pl-pan .pz-nota,.pzb-tr-pan .pz-nota{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px}.pzb-pl-pan .pz-nota.forte{font-size:15px}",
      ".pzb-qtesta{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:900;font-size:14px;color:#ffe066}",
      ".pzb-gett{display:flex;gap:2px;font-size:17px;line-height:1}.pzb-gett i{font-style:normal;opacity:.3}.pzb-gett i.on{opacity:1}.pzb-gett i.nuovo{animation:pzPop .4s both}",
      ".pzb-qbar{height:6px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden}.pzb-qbar i{display:block;height:100%;background:#ffd43b;transform-origin:0 50%}",
      ".pzb-opz{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}",
      ".pzb-op{min-height:clamp(70px,calc(var(--alt,640px) * .12),96px)}.pzb-op b{font-size:clamp(22px,calc(var(--alt,640px) * .04),30px)}",
      ".pzb-op.giusto{background:linear-gradient(#b2f2bb,#37b24d);box-shadow:0 0 0 3px #fff}.pzb-op.sbagliato{background:linear-gradient(#ffc9c9,#fa5252);color:#fff}.pzb-op.era{box-shadow:0 0 0 3px #69db7c}",
      ".pzb-mini{position:relative;display:flex;flex-direction:column;gap:3px}",
      ".pzb-zone{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:2px}",
      ".pzb-z{position:relative;height:clamp(36px,calc(var(--alt,640px) * .062),48px);border:0;border-radius:10px;padding:0;font:inherit;font-size:17px;color:#fff;background:linear-gradient(#5b46c4,#3a2a96);box-shadow:inset 0 -3px 0 rgba(0,0,0,.3);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}",
      ".pzb-z.sel{background:linear-gradient(#ffe98a,#fcc419);color:#3b2a00;box-shadow:0 0 0 2px #fff}",
      ".pzb-z .k{position:absolute;right:1px;top:-6px;min-width:15px;height:15px;border-radius:8px;background:#37d47e;color:#04321c;font-size:10px;font-weight:900;line-height:15px}",
      ".pzb-mini-tav{position:relative;height:clamp(64px,calc(var(--alt,640px) * .11),104px);border-radius:10px;overflow:hidden;background:#140d3a}",
      ".pzb-mini-tav canvas{position:absolute;left:0;top:0}"
    ].join("");
    document.head.appendChild(s);
  }

  // ---------------- piccoli aiuti per i telefoni ----------------
  var COLORI = ["#ffd43b", "#4dabf7", "#ff6b6b", "#51cf66", "#cc5de8", "#ff922b", "#20c997", "#f783ac"];
  function colore(A, id) {
    var C = (A.ST && A.ST.COLORI) || COLORI, i = 0;
    for (var k = 0; k < A.giocatori.length; k++) if (A.giocatori[k].id === id) { i = k; break; }
    return C[i % C.length];
  }
  // il bottone si tocca col dito (pointerdown: subito) o col clic; una volta sola per tocco
  function tocco(b, fn) {
    var ultimo = 0;
    function f(e) { var t = Date.now(); if (t - ultimo < 350) return; ultimo = t; try { if (e && e.cancelable && e.type === "pointerdown") e.preventDefault(); } catch (x) {} fn(e); }
    b.addEventListener("pointerdown", f); b.addEventListener("click", f);
  }
  // «Luca», «Luca e Sara», «Luca, Sara e altri 2»
  function elenco(A, ids) {
    var n = ids.map(function (id) { return A.nome(id); });
    if (n.length <= 1) return n[0] || "";
    if (n.length === 2) return n[0] + " e " + n[1];
    if (n.length === 3) return n[0] + ", " + n[1] + " e " + n[2];
    return n[0] + ", " + n[1] + " e altri " + (n.length - 2);
  }
  function minus(s) { return String(s).replace(/^Tu\b/, "tu"); }
  // le facce di più giocatori una sopra l'altra (al massimo m, poi «+3»)
  function facce(A, box, ids, faccia, m) {
    while (box.firstChild) box.removeChild(box.firstChild);
    m = m || 5;
    ids.slice(0, m).forEach(function (id) { box.appendChild(A.fac(id, faccia)); });
    if (ids.length > m) box.appendChild(A.el("span", { class: "piu", text: "+" + (ids.length - m) }));
  }

  // =====================================================================
  //                          ✋ È TROPPO!
  // =====================================================================
  var TR = { N: 10, PASSO: 1600, LEAD: 3000, SEC: 20, PUNTI: [400, 250, 150], DOPO: 50 };
  var CLK = null;   // l'orologio dei prezzi su questo telefono: { s, inizio } (lo mette il pannello, il maxischermo lo legge)
  // una foto nuova dice da quanto scorrono i prezzi: se siamo indietro (la prima foto era vecchia, per chi ricarica) ci si rimette in pari.
  // (una foto vecchia può solo farci andare indietro: si tiene sempre la stima più avanti)
  function sincro(pub, A) {
    if (!pub || !CLK || CLK.s !== pub.s || A.locale === "telefono" || !(pub.pass > 0)) return;
    var st = Date.now() - pub.pass + TR.LEAD;
    if (CLK.inizio == null || st < CLK.inizio - 250) CLK.inizio = st;
  }
  // un passo tondo vicino a v (1 · 2 · 2,5 · 5 · 10 …)
  function passoTondo(v) {
    var t = Math.max(1, v), m = Math.pow(10, Math.floor(Math.log(t) / Math.LN10)), best = m;
    [1, 2, 2.5, 5, 10].forEach(function (x) { if (x * m <= t * 1.15) best = x * m; });
    return best;
  }
  // i 10 prezzi che salgono, come in TV: sempre dello stesso salto (es. +1.000 €), così il salto non dice dov'è il vero.
  // Il primo sopra il vero è il numero j (da 2 a 7, cioè dal 3° all'8°) e sta fuori dal margine del 2%
  function scalaTroppo(prezzo, rnd) {
    for (var giro = 0; giro < 30; giro++) {
      var d = passoTondo(prezzo * (0.08 + rnd() * 0.045)), unita = /^25/.test(String(d)) ? [d, d / 5] : [d, d / 2, d / 5];
      // il primo gradino sopra il vero: fuori dal margine (sopra del 2,5%) e col gradino prima sotto dell'1,5%; il più tondo possibile
      var da = prezzo * 1.025, a = prezzo * 0.985 + d, cand = [];
      for (var u = 0; u < unita.length && !cand.length; u++) for (var x = Math.ceil(da / unita[u] - 1e-9) * unita[u]; x <= a + 1e-9; x += unita[u]) cand.push(x);
      if (!cand.length) continue;
      var v = cand[Math.floor(rnd() * cand.length)];
      var js = [2, 3, 4, 5, 6, 7].filter(function (j) { return v - j * d >= prezzo * 0.3; });
      if (!js.length) continue;
      var j = js[Math.floor(rnd() * js.length)], r = [];
      for (var i = 0; i < TR.N; i++) r.push(tondo2(v + (i - j) * d));
      return { scala: r, j: j };
    }
    return { scala: [0.55, 0.65, 0.75, 0.85, 0.95, 1.05, 1.15, 1.25, 1.35, 1.45].map(function (f) { return tondo2(prezzo * f); }), j: 5 };
  }
  function puntiTroppo(i, j) {
    if (i == null || i < 0 || i < j) return 0;
    var d = i - j; return d < TR.PUNTI.length ? TR.PUNTI[d] : TR.DOPO;
  }
  // i tempi della rivelazione (li usano durata e rivela)
  var RT = { scala: 1100, rullo: 1300, cifra: 260, colora: 110, dopo: 700, banner: 2500 };
  function durataTroppo(riv) {
    var conta = (Z().durataConta ? Z().durataConta(((riv || {}).prod || {}).prezzo || 0, RT.cifra) : 2000);
    return RT.scala + RT.rullo + conta + TR.N * RT.colora + RT.dopo + RT.banner + 400;
  }

  PREMI.troppo = {
    nome: "È troppo!", icona: "✋", ordine: 4,
    regola: "I prezzi salgono: tocca «È TROPPO!» appena superano quello vero. Né prima, né tardi!",
    min: 1, max: 8, locale: true,

    // ---------------- host ----------------
    prepara: function (P) {
      var prod = P.pesca(function (x) { return x.prezzo >= 2000; }, 1)[0] || P.pesca(function (x) { return x.prezzo >= 300; }, 1)[0] || P.pesca(null, 1)[0];
      var sc = scalaTroppo(prod.prezzo, P.rnd);
      return { s: Math.floor(P.rnd() * 1e9), prod: prod, scala: sc.scala, j: sc.j, tocchi: {}, ordine: [],
        insieme: P.modo === "telefono" && P.n >= 2 && P.n <= 4 };
    },
    tempo: function (st) { if (!st.t0) st.t0 = Date.now(); return TR.SEC; },   // (t0: solo per dire nella foto da quanto scorrono i prezzi)
    pubblico: function (st) {
      var p = st.prod || {};
      return { s: st.s, sec: TR.SEC, insieme: !!st.insieme, scala: st.scala, pass: st.t0 ? Date.now() - st.t0 : 0,
        prod: { e: p.e, nome: p.nome, desc: p.desc || "", dove: p.dove || "", cat: p.cat },
        fermi: st.ordine.slice() };
    },
    mossa: function (st, id, m, P) {
      // sullo stesso telefono, tutti insieme: un messaggio solo coi tocchi di tutti
      if (m.tutti && st.insieme) {
        var ord = (m.ord || []).filter(function (x) { return P.ids.indexOf(x) >= 0; });
        P.ids.forEach(function (x) {
          if (st.tocchi[x] != null) return;
          var v = intero(m.tutti[x]); st.tocchi[x] = v != null && v >= 0 && v < TR.N ? v : -1;
          if (st.tocchi[x] >= 0 && ord.indexOf(x) < 0) ord.push(x);
          P.fatto(x);
        });
        st.ordine = ord.filter(function (x) { return st.tocchi[x] >= 0; });
        return;
      }
      if (st.tocchi[id] != null) return;
      var i = intero(m.i); if (i == null || i < -1 || i >= TR.N) i = -1;
      st.tocchi[id] = i; if (i >= 0) st.ordine.push(id);
      P.fatto(id);
    },
    fine: function (st, P) {
      var punti = {}, carrello = {}, tocchi = {};
      P.ids.forEach(function (id) {
        var i = st.tocchi[id]; tocchi[id] = i == null ? -1 : i;
        punti[id] = puntiTroppo(tocchi[id], st.j);
        if (punti[id] === TR.PUNTI[0]) carrello[id] = [st.prod];   // chi si ferma al primo prezzo sopra se la porta a casa
      });
      return { punti: punti, carrello: carrello, riv: { prod: st.prod, scala: st.scala, j: st.j, tocchi: tocchi, ids: P.ids.slice() } };
    },
    durata: function (riv) { return durataTroppo(riv); },
    // il Bot sa il prezzo ma lo «sente» sbagliato: si ferma sul primo prezzo sopra quello che pensa (un po' prudente)
    bot: function (st, bot, P) {
      var err = { facile: 0.45, medio: 0.25, difficile: 0.12 }[bot.livello] || 0.25;
      var stima = st.prod.prezzo * Math.exp((P.rnd() * 2 - 1) * err * 1.3) * (bot.livello === "facile" ? 1 : 1.03);
      var r = -1;
      for (var i = 0; i < TR.N; i++) if (st.scala[i] > stima) { r = i; break; }
      if (r < 0) return [];   // pensa che sia ancora più caro: non si ferma mai
      return [{ ms: Math.round(TR.LEAD + r * TR.PASSO + 350 + P.rnd() * 800), m: { i: r } }];
    },

    // ---------------- ogni telefono ----------------
    schermo: function (A) {
      stile();
      var el = A.el, pub = A.pub || {}, scala = pub.scala || [], locale = A.locale === "telefono";
      // l'orologio: lo mette il pannello (A.fine); se qui non c'è un pannello (chi guarda) si parte da adesso
      if (!CLK || CLK.s !== pub.s) CLK = { s: pub.s, inizio: locale ? null : Date.now() - (pub.pass || 0) + TR.LEAD - 300 };
      A.sch.classList.add("pzb-fitto");
      var nN = el("div", { class: "pzb-tr-n" }), nP = el("div", { class: "pzb-tr-p attesa", text: "✋" });
      var tacche = el("div", { class: "pzb-tr-tacche" }), t = [];
      for (var k = 0; k < TR.N; k++) { var ti = el("i"); t.push(ti); tacche.appendChild(ti); }
      var fermi = el("div", { class: "pz-tab fitto" });
      A.sch.appendChild(el("div", { class: "pz-testa", text: "✋ È troppo!" }));
      A.sch.appendChild(A.scheda(pub.prod || {}, { piccola: true }));
      A.sch.appendChild(el("div", { class: "pzb-tr-big" }, [ nN, nP ]));
      A.sch.appendChild(tacche);
      A.sch.appendChild(fermi);
      var ultimo = null, visti = {};
      function mostra(chiave, i) {
        if (i == null) { nN.textContent = locale ? "Tocca a voi" : ""; nP.className = "pzb-tr-p attesa"; nP.textContent = "✋"; }
        else if (i < 0) { var sec = Math.max(1, Math.ceil((CLK.inizio - Date.now()) / 1000)); nN.textContent = "Si parte tra…"; nP.className = "pzb-tr-p attesa"; nP.textContent = sec; A.FX.tic(700); }
        else if (i >= TR.N) { nN.textContent = "Finiti i prezzi"; nP.className = "pzb-tr-p fine"; nP.textContent = "⏰"; }
        else {
          nN.textContent = "Prezzo " + (i + 1) + " di " + TR.N; nP.textContent = A.fmtE(scala[i]);
          nP.className = "pzb-tr-p"; void nP.offsetWidth; nP.className = "pzb-tr-p gira";
          A.FX.toc(330 + i * 55);
        }
        t.forEach(function (x, q) { x.className = i != null && q < i ? "on" : i != null && q === i ? "ora" : ""; });
      }
      var id = setInterval(function () {
        if (!A.vivo() || !nP.isConnected) { clearInterval(id); return; }
        var c = CLK && CLK.s === pub.s ? CLK : null, i = null, chiave = "x";
        if (c && c.inizio != null) {
          var d = Date.now() - c.inizio;
          i = d < 0 ? -1 : Math.min(TR.N, Math.floor(d / TR.PASSO));
          chiave = i < 0 ? "c" + Math.ceil(-d / 1000) : "i" + i;
        }
        if (chiave !== ultimo) { ultimo = chiave; mostra(chiave, i); }
      }, 80);
      function aggiorna(p) {
        sincro(p, A);
        if (locale) return;   // sullo stesso telefono non si dice chi si è fermato (a turno lo vedrebbe chi viene dopo)
        (p.fermi || []).forEach(function (fid) {
          if (visti[fid]) return; visti[fid] = 1;
          fermi.appendChild(el("div", { class: "pz-och" }, [ A.fac(fid, "pensa"), el("span", { class: "nm", text: "✋ " + A.nome(fid).slice(0, 8) }) ]));
          A.FX.clic(0.8);
        });
      }
      aggiorna(pub);
      return { aggiorna: aggiorna };
    },
    pannello: function (A) {
      stile();
      var el = A.el, pub = A.pub || {}, scala = pub.scala || [], insieme = !!pub.insieme && A.locale === "telefono";
      var inizio = A.fine - ((pub.sec || TR.SEC) * 1000 + 800) + TR.LEAD;
      var clk = CLK = { s: pub.s, inizio: inizio };
      var root = el("div", { class: "pzb-tr-pan" }), mandato = false;
      var dN = el("span", { class: "n" }), dV = el("b", { class: "v" });
      root.appendChild(el("div", { class: "pzb-tr-disp" }, [ dN, dV ]));
      A.pan.appendChild(root);
      function idx() { var d = Date.now() - clk.inizio; return d < 0 ? -1 : Math.min(TR.N, Math.floor(d / TR.PASSO)); }
      var btn = null, bts = {}, tocchi = {}, ord = [], nota = null;
      if (insieme) {
        // tutti insieme intorno al telefono: un bottone a testa
        var testa = A.pan.parentNode && A.pan.parentNode.querySelector(".pz-pan-testa .tx");
        if (testa) testa.textContent = "✋ È troppo! · tutti insieme";
        var gr = el("div", { class: "pzb-tr-griglia" + (A.giocatori.length === 3 ? " tre" : "") });
        A.giocatori.forEach(function (g) {
          var b = el("button", { class: "pzb-tr-bt attesa" }, [ el("span", { class: "chi" }, [ A.fac(g.id), el("span", { text: g.nome }) ]), el("b", { text: "✋ È TROPPO!" }) ]);
          b.style.setProperty("--c", colore(A, g.id));
          tocco(b, function () { premi(g.id); });
          bts[g.id] = b; gr.appendChild(b);
        });
        nota = el("p", { class: "pz-nota", text: "📱 Telefono in mezzo: ognuno tocca il suo bottone!" });
        root.appendChild(gr); root.appendChild(nota);
      } else {
        btn = el("button", { class: "pzb-tr-btn attesa" }, [ el("span", { text: "⏳ Pronti…" }) ]);
        tocco(btn, function () { premi(A.io); });
        nota = el("p", { class: "pz-nota", text: "Toccalo quando il prezzo SUPERA quello vero" });
        root.appendChild(btn); root.appendChild(nota);
      }
      function testoBtn(b, t1, t2) { while (b.firstChild) b.removeChild(b.firstChild); b.appendChild(el("span", { text: t1 })); if (t2) b.appendChild(el("small", { text: t2 })); }
      function premi(chi) {
        var i = idx();
        if (mandato || i < 0 || i >= TR.N) return;
        if (insieme) {
          if (tocchi[chi] != null) return;
          tocchi[chi] = i; ord.push(chi);
          var b = bts[chi]; b.className = "pzb-tr-bt fatto";
          while (b.firstChild) b.removeChild(b.firstChild);
          b.appendChild(el("span", { class: "chi" }, [ A.fac(chi, "pensa"), el("span", { text: A.nome(chi) }) ])); b.appendChild(el("b", { text: "✋ " + A.fmtE(scala[i]) }));
          A.vibra(30); A.FX.toc(990);
          if (ord.length >= A.giocatori.length) setTimeout(manda, 500);
          return;
        }
        mandato = true; clearInterval(tid);
        A.invia({ i: i });
        btn.className = "pzb-tr-btn fatto"; testoBtn(btn, "✋ Fermato!", "a " + A.fmtE(scala[i]));
        nota.textContent = "Vediamo se era il momento giusto… 🤞";
        A.vibra(30); A.FX.toc(990);
      }
      function manda() {
        if (mandato) return; mandato = true; clearInterval(tid);
        if (insieme) {
          var tutti = {};
          A.giocatori.forEach(function (g) {
            tutti[g.id] = tocchi[g.id] != null ? tocchi[g.id] : -1;
            if (tocchi[g.id] == null) { var b = bts[g.id]; b.className = "pzb-tr-bt niente"; b.lastChild.textContent = "😶 Mai fermato"; }
          });
          A.invia({ tutti: tutti, ord: ord });
          nota.textContent = "Vediamo chi si è fermato al momento giusto… 🤞";
        } else {
          A.invia({ i: -1 });
          btn.className = "pzb-tr-btn niente"; testoBtn(btn, "😶 Non ti sei fermato", "pensavi che costasse ancora di più!");
        }
      }
      var ultimo = null;
      function tick() {
        if (!A.vivo() || !root.isConnected) { clearInterval(tid); return; }
        var i = idx(), chiave = i < 0 ? "c" + Math.ceil((clk.inizio - Date.now()) / 1000) : "i" + i;
        if (chiave === ultimo) return; ultimo = chiave;
        if (i < 0) { dN.textContent = "Si parte tra"; dV.textContent = Math.max(1, Math.ceil((clk.inizio - Date.now()) / 1000)) + "…"; }
        else if (i < TR.N) {
          dN.textContent = "Prezzo " + (i + 1) + " di " + TR.N; dV.textContent = A.fmtE(scala[i]);
          if (!mandato) {
            if (btn && /attesa/.test(btn.className)) { btn.className = "pzb-tr-btn vivo"; testoBtn(btn, "✋ È TROPPO!"); }
            if (insieme) Object.keys(bts).forEach(function (x) { if (tocchi[x] == null && /attesa/.test(bts[x].className)) bts[x].className = "pzb-tr-bt"; });
          }
        } else { dN.textContent = "Finiti i prezzi"; dV.textContent = "⏰"; manda(); }
      }
      var tid = setInterval(tick, 80); tick();
      return {
        tempo: function () { if (!mandato) manda(); clearInterval(tid); },
        aggiorna: function (p) { sincro(p, A); }
      };
    },
    rivela: async function (A) {
      stile();
      var el = A.el, riv = A.riv || {}, prod = riv.prod || {}, scala = riv.scala || [], j = riv.j, tocchi = riv.tocchi || {}, punti = A.punti || {};
      var ids = (riv.ids || Object.keys(tocchi)).filter(function (id) { return tocchi[id] != null; });
      A.sch.classList.add("pzb-fitto");
      var conta = A.contachilometri(prod.prezzo || 0, {});
      var grid = el("div", { class: "pzb-scala" }), righe = [];
      var su = function (i) { return ids.filter(function (id) { return tocchi[id] === i; }); };
      var mai = ids.filter(function (id) { return !(tocchi[id] >= 0); });
      var banner = el("div", { class: "pz-sotto", text: "Dove vi siete fermati…" });
      A.sch.appendChild(el("div", { class: "pz-testa", text: "✋ È troppo!" }));
      A.sch.appendChild(el("div", { class: "pz-miniprod" }, [ el("span", { class: "e", text: prod.e || "🎁" }), el("span", { class: "n", text: prod.nome || "" }) ]));
      var contaBox = el("div", { style: "min-height:52px;display:flex;align-items:center" }, [ conta.el ]);
      conta.el.style.visibility = "hidden";
      A.sch.appendChild(contaBox);
      A.sch.appendChild(grid);
      var maiBox = el("div", { class: "pzb-mai" });
      if (mai.length) { var mfc = el("span", { class: "fc" }); facce(A, mfc, mai, null, 6); maiBox.appendChild(el("span", { text: "😶 Mai fermati:" })); maiBox.appendChild(mfc); A.sch.appendChild(maiBox); }
      A.sch.appendChild(banner);
      scala.forEach(function (v, i) {
        var fc = el("span", { class: "fc" }), r = el("div", { class: "pzb-rg" }, [ el("span", { class: "n", text: String(i + 1) }), el("span", { class: "v", text: A.fmtE(v) }), fc ]);
        r.style.animationDelay = (i * 0.06) + "s";
        facce(A, fc, su(i), null, 5);
        righe.push({ r: r, fc: fc }); grid.appendChild(r);
      });
      await A.dorme(RT.scala); if (!A.vivo()) return;
      // il prezzo vero, cifra per cifra
      banner.textContent = "Il prezzo vero è…";
      conta.el.style.visibility = "";
      A.ST.FX.rullo(1.2); await A.dorme(RT.rullo); if (!A.vivo()) return;
      await conta.via(RT.cifra); if (!A.vivo()) return;
      // la scala si colora: sotto, il primo sopra, sopra
      for (var i = 0; i < righe.length; i++) {
        if (!A.vivo()) return;
        righe[i].r.classList.add(i < j ? "sotto" : i === j ? "primo" : "sopra");
        if (i === j) A.FX.din(); else A.FX.toc(i < j ? 520 : 300);
        await A.dorme(RT.colora);
      }
      // i punti su ogni gradino, le facce che esultano o no
      righe.forEach(function (x, q) {
        var chi = su(q); if (!chi.length) return;
        var pt = puntiTroppo(q, j);
        facce(A, x.fc, chi, pt ? "esulta" : "triste", 5);
        x.r.appendChild(el("span", { class: "pt" + (pt ? "" : " zero"), text: pt ? "+" + A.fmtN(pt) : q < j ? "🙈 presto" : "0" }));
      });
      if (mai.length) facce(A, maiBox.querySelector(".fc"), mai, "triste", 6);
      await A.dorme(RT.dopo); if (!A.vivo()) return;
      var giusti = su(j), dopo = ids.filter(function (id) { return tocchi[id] > j; }), presto = ids.filter(function (id) { return tocchi[id] >= 0 && tocchi[id] < j; });
      var me = A.io;
      if (giusti.length) {
        banner.className = "pz-banner oro pzb-ban-s";
        banner.textContent = giusti.length === 1 && giusti[0] === me && A.locale !== "telefono" ? "🎯 Ti sei fermato al momento giusto!" : "🎯 Giusto in tempo: " + minus(elenco(A, giusti)) + "!";
        A.ST.pubblico(A.S, "ovazione"); A.ST.coriandoli();
        if (giusti.indexOf(me) >= 0 || (A.locale === "telefono" && giusti.length)) A.vibra([30, 40, 70]);
      } else if (dopo.length) {
        var mn = Math.min.apply(null, dopo.map(function (id) { return tocchi[id]; }));
        banner.className = "pz-banner pzb-ban-s";
        var vicini = dopo.filter(function (id) { return tocchi[id] === mn; }), conMe = A.locale !== "telefono" && vicini.indexOf(me) >= 0;
        banner.textContent = "😅 Nessuno al primo sopra: " + (vicini.length > 1 ? (conMe ? "i più vicini siete " : "i più vicini sono ") : conMe ? "il più vicino sei " : "il più vicino è ") + minus(elenco(A, vicini));
        A.ST.pubblico(A.S, "applauso");
      } else {
        banner.className = "pz-banner no pzb-ban-s";
        banner.textContent = presto.length ? "🙈 Tutti troppo presto!" : "😶 Nessuno si è fermato!";
        A.FX.trombone(); A.ST.pubblico(A.S, "ohh");
      }
      await A.dorme(RT.banner);
    }
  };

  // =====================================================================
  //                             🟡 PLINKO
  // =====================================================================
  var PL = { CASE: [10, 50, 100, 0, 500, 0, 100, 50, 10], FILE: 12, Q: 3, QSEC: 6, SEC: 32, ONDA: 1100 };
  // un prezzo sbagliato che sembra vero: stesso tipo di numero (6,99 → 4,99; 29 → 39; 15 → 20), dal 18% al 60% lontano
  function comeIlVero(v, p) {
    if (p >= 10 && Math.abs(p - Math.round(p)) < 1e-9) {
      if (p % 10 === 9) return Math.max(9, Math.round((v + 1) / 10) * 10 - 1);
      if (p % 5 === 0) return Math.max(5, Math.round(v / 5) * 5);
      return Math.max(1, Math.round(v));
    }
    if (p >= 2) return tondo2(Math.max(1, Math.floor(v)) + (Math.round(p * 100) % 100) / 100);
    return tondo2(Math.max(0.05, Math.round(v * 20) / 20));
  }
  function finto(p, rnd) {
    for (var k = 0; k < 14; k++) {
      var f = 0.25 + rnd() * 0.35, v = comeIlVero(rnd() < 0.5 ? p * (1 + f) : p * (1 - f), p);
      if (v > 0 && Math.abs(v - p) / p >= 0.18 && Math.abs(v - p) / p <= 0.75) return v;
    }
    return comeIlVero(p * 1.45, p);
  }
  function domande(P, n) {
    var l = P.pesca(function (x) { return x.prezzo >= 1 && x.prezzo < 100; }, n);
    if (l.length < n) l = l.concat(P.pesca(function (x) { return x.prezzo < 400; }, n - l.length));
    if (l.length < n) l = l.concat(P.pesca(null, n - l.length));
    return l.map(function (p) { var f = finto(p.prezzo, P.rnd), ok = P.rnd() < 0.5 ? 0 : 1; return { p: p, opz: ok ? [f, p.prezzo] : [p.prezzo, f], ok: ok }; });
  }
  function domDi(st, id) { return st.dom ? st.dom[id] || st.comuni : st.comuni; }
  function pubQ(d) { var p = d.p; return { e: p.e, nome: p.nome, desc: p.desc || "", dove: p.dove || "", cat: p.cat, opz: d.opz }; }
  // la caduta: posizioni in mezze caselle (0..16, le caselle sono i pari), a ogni fila ±1, coi rimbalzi sulle pareti
  function cade(x, rnd) {
    var p = 2 * x, s = "";
    for (var r = 0; r < PL.FILE; r++) { var d = rnd() < 0.5 ? -1 : 1; p += d; if (p < 0) { p = 1; d = 1; } if (p > 16) { p = 15; d = -1; } s += d > 0 ? "1" : "0"; }
    return { s: s, b: p / 2 };
  }
  function percorso(x, s) {
    var p = 2 * x, l = [p];
    for (var r = 0; r < s.length; r++) { p += s.charAt(r) === "1" ? 1 : -1; if (p < 0) p = 1; if (p > 16) p = 15; l.push(p); }
    return l;
  }
  function onde(riv) { var m = 1; Object.keys((riv || {}).gettoni || {}).forEach(function (id) { m = Math.max(m, riv.gettoni[id]); }); return m; }
  var RP = { intro: 900, cadere: 2700, dopo: 700, banner: 2600 };
  function durataPlinko(riv) { return RP.intro + (onde(riv) - 1) * PL.ONDA + RP.cadere + RP.dopo + RP.banner + 300; }

  // ---- la parete coi chiodini (su canvas: si disegna una volta) ----
  function geo(W, H) {
    var sw = W / 9, bh = Math.max(20, H * 0.12), d0 = sw * 0.66;
    var mt = Math.min(d0 * 1.15, H * 0.12), y0 = mt + d0 * 0.45, y11 = H - bh - d0 * 0.55, rowH = (y11 - y0) / (PL.FILE - 1);
    var d = Math.max(10, Math.min(d0, rowH * 1.25)), pr = Math.max(1.6, Math.min(sw * 0.055, 3.4));
    return { W: W, H: H, sw: sw, bh: bh, mt: mt, d: d, pr: pr, rowH: rowH,
      X: function (p) { return (p / 2 + 0.5) * sw; }, Y: function (r) { return y0 + r * rowH; },
      yAttesa: Math.max(d / 2 + 1, mt * 0.5), yFondo: H - bh * 0.42 };
  }
  function disegnaTavola(cv, W, H, opz) {
    opz = opz || {};
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + "px"; cv.style.height = H + "px";
    var c = cv.getContext("2d"); if (!c) return null;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var g = geo(W, H), gr = c.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, "#241a6b"); gr.addColorStop(1, "#0d0830");
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    // luci di fondo
    var rg = c.createRadialGradient(W / 2, H * 0.62, 4, W / 2, H * 0.62, W * 0.55);
    rg.addColorStop(0, "rgba(255,212,59,.16)"); rg.addColorStop(1, "rgba(255,212,59,0)");
    c.fillStyle = rg; c.fillRect(0, 0, W, H);
    // i chiodini
    for (var r = 0; r < PL.FILE; r++) {
      for (var q = r % 2; q <= 16; q += 2) {
        var x = g.X(q), y = g.Y(r);
        c.beginPath(); c.arc(x, y, g.pr + 1.4, 0, Math.PI * 2); c.fillStyle = "rgba(255,255,255,.12)"; c.fill();
        c.beginPath(); c.arc(x, y, g.pr, 0, Math.PI * 2); c.fillStyle = "#e9ecff"; c.fill();
      }
    }
    // le caselle in fondo
    var colC = { 500: ["#fcc419", "#3b2a00"], 0: ["#c92a2a", "#fff"], 100: ["#2f9e44", "#fff"], 50: ["#1971c2", "#fff"], 10: ["#6741d9", "#fff"] };
    var fs = Math.max(9, Math.min(g.sw * 0.36, g.bh * 0.5, 16));
    for (var k = 0; k < 9; k++) {
      var v = PL.CASE[k], cc = colC[v] || ["#444", "#fff"], x0 = k * g.sw;
      c.fillStyle = cc[0]; c.fillRect(x0 + 1, H - g.bh, g.sw - 2, g.bh);
      c.fillStyle = cc[1]; c.font = "900 " + fs + "px system-ui,sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(String(v), x0 + g.sw / 2, H - g.bh / 2 + 1);
      if (k) { c.fillStyle = "#ffd43b"; c.fillRect(x0 - 1.2, H - g.bh - 6, 2.4, g.bh + 6); }
    }
    if (opz.zone) {   // le frecce in alto (nel pannello)
      c.fillStyle = "rgba(255,224,102,.45)";
      for (k = 0; k < 9; k++) { var xx = g.X(2 * k); c.beginPath(); c.moveTo(xx - 4, 3); c.lineTo(xx + 4, 3); c.lineTo(xx, 9); c.fill(); }
    }
    return g;
  }
  // la parete nel maxischermo: si adatta allo spazio; restituisce { g, layer, pronto (Promise) }
  function tavola(A, box) {
    var inn = A.el("div", { class: "pzb-pl-in" }), cv = document.createElement("canvas");
    inn.appendChild(cv); box.appendChild(inn);
    var T = { g: null, inn: inn, cv: cv, dopo: [] };
    T.misura = function () {
      var cw = box.clientWidth, ch = box.clientHeight;
      if (!(cw > 20 && ch > 40)) return false;
      var W = Math.floor(Math.min(cw, 400, ch * 0.92)), H = Math.floor(Math.min(ch, W * 1.18));
      if (T.g && Math.abs(T.g.W - W) < 2 && Math.abs(T.g.H - H) < 2) return true;
      inn.style.width = W + "px"; inn.style.height = H + "px";
      T.g = disegnaTavola(cv, W, H);
      T.dopo.forEach(function (f) { try { f(); } catch (e) {} });
      return true;
    };
    T.pronto = new Promise(function (ok) {
      var n = 0;
      (function prova() { if (T.misura() || n++ > 40) return ok(T); setTimeout(prova, 30); })();   // (setTimeout: rAF si ferma se la pagina non si vede)
    });
    return T;
  }
  var IMG = {};
  function avatarSrc(A, id) {
    var f = A.fac(id), svg = f && f.innerHTML;
    if (!svg || svg.indexOf("<svg") < 0) return null;
    return IMG[svg] || (IMG[svg] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
  }
  function gettone(A, id, d) {
    var t = A.el("div", { class: "pzb-tok" }), src = avatarSrc(A, id);
    t.style.width = t.style.height = Math.round(d) + "px"; t.style.setProperty("--c", colore(A, id));
    if (src) { var im = new Image(); im.alt = ""; im.src = src; t.appendChild(im); }
    return t;
  }
  function metti(t, x, y, g) { t.style.transform = "translate(" + (x - g.d / 2).toFixed(1) + "px," + (y - g.d / 2).toFixed(1) + "px)"; }

  PREMI.plinko = {
    nome: "Plinko", icona: "🟡", ordine: 5,
    regola: "Indovina 3 prezzi per vincere gettoni, poi lasciali cadere: in mezzo c'è il 500!",
    min: 1, max: 8, locale: true,

    // ---------------- host ----------------
    prepara: function (P) {
      var st = { s: Math.floor(P.rnd() * 1e9), comuni: null, dom: null, risp: {}, giusti: {}, lanci: {} };
      if (P.modo === "telefono") {   // a turno: ognuno le sue domande (chi guarda non impara le risposte dell'altro)
        st.dom = {};
        P.ids.forEach(function (id) { st.dom[id] = domande(P, PL.Q); });
        st.comuni = st.dom[P.ids[0]];
      } else st.comuni = domande(P, PL.Q);
      return st;
    },
    tempo: function () { return PL.SEC; },
    pubblico: function (st, P) {
      var stato = {};
      P.ids.forEach(function (id) { stato[id] = { r: (st.risp[id] || []).length, g: 1 + (st.giusti[id] || 0), l: (st.lanci[id] || []).slice() }; });
      var o = { s: st.s, stato: stato };
      if (st.dom) { o.qd = {}; Object.keys(st.dom).forEach(function (id) { o.qd[id] = st.dom[id].map(pubQ); }); }
      else o.q = st.comuni.map(pubQ);
      return o;
    },
    mossa: function (st, id, m, P) {
      var dom = domDi(st, id), r = st.risp[id] || (st.risp[id] = []);
      if (m.q != null) {
        var q = intero(m.q); if (q !== r.length || q >= PL.Q || !dom[q]) return;
        var s = m.s === 0 || m.s === 1 ? m.s : -1, ok = s === dom[q].ok;
        r.push(s); if (ok) st.giusti[id] = (st.giusti[id] || 0) + 1;
        P.privato(id, { q: q, s: s, ok: ok, prezzo: dom[q].p.prezzo, g: 1 + (st.giusti[id] || 0) });
        return;
      }
      if (m.x != null) {
        var x = intero(m.x), l = st.lanci[id] || (st.lanci[id] = []), g = 1 + (st.giusti[id] || 0);
        if (r.length < PL.Q || x == null || x < 0 || x > 8 || l.length >= g) return;
        l.push(x);
        if (l.length >= g) P.fatto(id);
      }
    },
    privatoDi: function (st, id) {
      var dom = domDi(st, id) || [];
      return { storia: { r: (st.risp[id] || []).map(function (s, q) { return { q: q, s: s, ok: s === dom[q].ok, prezzo: dom[q].p.prezzo }; }), g: 1 + (st.giusti[id] || 0), l: (st.lanci[id] || []).slice() } };
    },
    fine: function (st, P) {
      var punti = {}, gett = [], gettoni = {}, carrello = {}, rnd = P.rnd;
      P.ids.forEach(function (id) {
        var g = 1 + (st.giusti[id] || 0), l = (st.lanci[id] || []).slice(0, g);
        while (l.length < g) l.push(l.length ? l[l.length - 1] : 3 + Math.floor(rnd() * 3));   // quelli non lasciati: li lascia il caso
        gettoni[id] = g; punti[id] = 0;
        l.forEach(function (x, k) { var c = cade(x, rnd); punti[id] += PL.CASE[c.b]; gett.push({ id: id, k: k, x: x, s: c.s, b: c.b, auto: k >= (st.lanci[id] || []).length ? 1 : 0 }); });
      });
      // chi fa più punti si porta a casa una delle cose dell'«Occhio al prezzo»
      var best = P.ids.slice().sort(function (a, b) { return punti[b] - punti[a]; })[0];
      if (best && punti[best] > 0) { var d = domDi(st, best) || []; if (d.length) carrello[best] = [d.slice().sort(function (a, b) { return b.p.prezzo - a.p.prezzo; })[0].p]; }
      return { punti: punti, carrello: carrello, riv: { gett: gett, gettoni: gettoni, giusti: st.giusti, ids: P.ids.slice() } };
    },
    durata: function (riv) { return durataPlinko(riv); },
    // il Bot: risponde giusto più o meno spesso, poi lascia i gettoni verso il centro (il facile un po' a caso)
    bot: function (st, bot, P) {
      var pr = { facile: 0.55, medio: 0.7, difficile: 0.86 }[bot.livello] || 0.7, dom = domDi(st, bot.id), t = 900, mosse = [], giusti = 0;
      for (var q = 0; q < PL.Q; q++) {
        t += 1300 + P.rnd() * 2600;
        var s = P.rnd() < pr ? dom[q].ok : 1 - dom[q].ok; if (s === dom[q].ok) giusti++;
        mosse.push({ ms: Math.round(t), m: { q: q, s: s } });
      }
      for (var k = 0; k < 1 + giusti; k++) {
        t += 1300 + P.rnd() * 1500;
        var x = bot.livello === "facile" ? 1 + Math.floor(P.rnd() * 7) : bot.livello === "difficile" ? (P.rnd() < 0.6 ? 4 : P.rnd() < 0.5 ? 3 : 5) : 3 + Math.floor(P.rnd() * 3);
        mosse.push({ ms: Math.round(Math.min(t, (PL.SEC - 1) * 1000)), m: { x: x } });
      }
      return mosse;
    },

    // ---------------- ogni telefono ----------------
    schermo: function (A) {
      stile();
      var el = A.el, pub = A.pub || {};
      A.sch.classList.add("pzb-fitto");
      var box = el("div", { class: "pzb-pl-board" }), chips = el("div", { class: "pzb-pl-chips" }), ch = {}, attesa = {};
      A.sch.appendChild(el("div", { class: "pz-testa", text: "🟡 Plinko" }));
      A.sch.appendChild(box);
      A.sch.appendChild(chips);
      A.giocatori.forEach(function (g) {
        var v = el("span", { class: "v", text: "👁️ 0/" + PL.Q }), c = el("div", { class: "pzb-pl-ch" }, [ A.fac(g.id), v ]);
        c.style.setProperty("--c", colore(A, g.id)); ch[g.id] = { el: c, v: v, tx: "" }; chips.appendChild(c);
      });
      var T = tavola(A, box), ultimo = pub;
      // i gettoni lasciati aspettano in alto, al loro posto
      function posa() {
        if (!T.g) return;
        Object.keys(attesa).forEach(function (id) { attesa[id].forEach(function (t, k) { metti(t.el, T.g.X(2 * t.x) + (k % 2 ? 3 : -3) * Math.min(1, k), T.g.yAttesa + k * 2, T.g); t.el.style.width = t.el.style.height = Math.round(T.g.d) + "px"; }); });
      }
      T.dopo.push(posa);
      if (window.ResizeObserver) try { var ro = new ResizeObserver(function () { if (!box.isConnected) { ro.disconnect(); return; } T.misura(); }); ro.observe(box); } catch (e) {}
      var tm = setInterval(function () { if (!box.isConnected || !A.vivo()) { clearInterval(tm); return; } T.misura(); }, 500);   // (anche senza ResizeObserver)
      function aggiorna(p) {
        ultimo = p;
        var stato = p.stato || {};
        Object.keys(ch).forEach(function (id) {
          var x = stato[id] || { r: 0, g: 1, l: [] }, tx;
          if (x.r < PL.Q) tx = "👁️ " + x.r + "/" + PL.Q;
          else if (x.l.length < x.g) tx = "🟡 " + x.l.length + "/" + x.g;
          else tx = "✅ " + x.g + " 🟡";
          if (tx !== ch[id].tx) { ch[id].tx = tx; ch[id].v.textContent = tx; }
          var l = attesa[id] || (attesa[id] = []);
          if (T.g) for (var k = l.length; k < x.l.length; k++) {
            var t = gettone(A, id, T.g.d); t.classList.add("pop"); T.inn.appendChild(t);
            l.push({ el: t, x: x.l[k] }); A.FX.toc(700 + k * 80);
          }
        });
        posa();
      }
      T.pronto.then(function () { if (A.vivo()) aggiorna(ultimo); });
      aggiorna(pub);
      return { aggiorna: aggiorna };
    },
    pannello: function (A) {
      stile();
      var el = A.el, pub = A.pub || {}, dom = (pub.qd && pub.qd[A.io]) || pub.q || [];
      var S = { q: 0, risp: [], g: 1, lanci: [], sel: null, attende: false, finito: false };
      var root = el("div", { class: "pzb-pl-pan" }), avviato = false, tq = null, tf = null, tnext = null;
      A.pan.appendChild(root);
      function vuota() { while (root.firstChild) root.removeChild(root.firstChild); clearTimeout(tq); clearTimeout(tf); clearTimeout(tnext); }
      function vivo() { return A.vivo() && root.isConnected && !S.finito; }
      function fila(n, tot) {
        var f = el("span", { class: "pzb-gett" });
        for (var k = 0; k < tot; k++) f.appendChild(el("i", { class: k < n ? "on" : "", text: "🟡" }));
        return f;
      }
      function disegna() {
        vuota();
        if (S.q < PL.Q) domanda(); else lancio();
        rimisura();
      }
      // il pannello cambia altezza (domande → gettoni): il maxischermo sopra si rimisura subito (come fa il pannello del gioco)
      function rimisura() {
        var pp = root.closest ? root.closest(".pz-pan") : null, vv = root.closest ? root.closest(".st-vista") : null;
        if (pp && vv && pp.classList.contains("su")) vv.style.setProperty("--pz-pan", pp.offsetHeight + "px");
      }
      // ---- «Occhio al prezzo»: due prezzi, uno è giusto ----
      function domanda() {
        var q = S.q, d = dom[q] || {}, opz = d.opz || [];
        var gf = fila(S.g, PL.Q + 1), bar = el("i"), nota = el("p", { class: "pz-nota forte", text: "Qual è il prezzo giusto?" });
        root.appendChild(el("div", { class: "pzb-qtesta" }, [ el("span", { text: "👁️ Occhio al prezzo · " + (q + 1) + " di " + PL.Q }), gf ]));
        root.appendChild(A.scheda(d, { piccola: true }));
        root.appendChild(el("div", { class: "pzb-qbar" }, [ bar ]));
        var bs = opz.map(function (v, k) {
          var b = el("button", { class: "pz-sc pzb-op" }, [ el("b", { text: A.fmtE(v) }) ]);
          tocco(b, function () { scegli(k); });
          return b;
        });
        root.appendChild(el("div", { class: "pzb-opz" }, bs));
        root.appendChild(nota);
        S.ui = { bs: bs, nota: nota, gf: gf, opz: opz, q: q, risposto: false };
        S.attende = false;   // (domanda nuova: niente risposta in sospeso)
        bar.style.transition = "none"; bar.style.transform = "scaleX(1)";
        void bar.offsetWidth; setTimeout(function () { bar.style.transition = "transform " + (PL.QSEC - 0.05) + "s linear"; bar.style.transform = "scaleX(0)"; }, 30);
        tq = setTimeout(function () { if (vivo() && S.q === q && !S.attende) { S.ui.nota.textContent = "⏰ Tempo!"; manda(q, -1); } }, PL.QSEC * 1000);
      }
      function scegli(k) {
        // una risposta sola per domanda: dopo l'esito l'altro prezzo resta lì ancora un attimo, ma toccarlo non conta
        // (prima il secondo tocco lasciava la domanda dopo bloccata, senza più tasti che rispondono)
        if (!vivo() || S.attende || !S.ui || S.ui.q !== S.q || S.ui.risposto) return;
        S.ui.bs[k].classList.add("sel"); S.ui.bs.forEach(function (b) { b.disabled = true; });
        A.vibra(25);
        manda(S.q, k);
      }
      function manda(q, s) {
        if (S.ui) S.ui.risposto = true;
        S.attende = true; clearTimeout(tq);
        S.ui.bs.forEach(function (b) { b.disabled = true; });
        A.invia({ q: q, s: s });
        // se la risposta dell'host non arriva (rete), si va avanti lo stesso
        tf = setTimeout(function () { if (vivo() && S.attende && S.q === q) { S.attende = false; S.risp.push({ q: q, s: s, ok: null }); S.q++; disegna(); } }, 3500);
      }
      function esito(m) {
        if (!S.ui || m.q !== S.q || !S.attende) return;
        clearTimeout(tf); S.attende = false;
        S.risp.push(m); S.g = m.g || S.g;
        var opz = S.ui.opz, giusto = opz.map(function (v) { return Math.abs(v - m.prezzo) < 1e-6; }).indexOf(true);
        if (m.s >= 0 && S.ui.bs[m.s]) S.ui.bs[m.s].classList.add(m.ok ? "giusto" : "sbagliato");
        if (!m.ok && giusto >= 0) S.ui.bs[giusto].classList.add("era");
        if (m.ok) {
          S.ui.nota.textContent = "✅ Giusto! +1 gettone 🟡"; A.FX.cassa();
          var nuovo = S.ui.gf.children[S.g - 1]; if (nuovo) { nuovo.className = "on nuovo"; }
        } else { S.ui.nota.textContent = (m.s < 0 ? "⏰ Tempo! " : "❌ No! ") + "Era " + A.fmtE(m.prezzo); A.FX.toc(240); }
        var q = S.q;
        tnext = setTimeout(function () { if (vivo() && S.q === q) { S.q++; disegna(); } }, 1250);
      }
      // ---- dove lasci i gettoni ----
      function lancio() {
        var nota = el("p", { class: "pz-nota forte" }), tray = el("div", { class: "pzb-qtesta" });
        var zone = el("div", { class: "pzb-zone" }), zs = [];
        for (var k = 0; k < 9; k++) (function (k) {
          var z = el("button", { class: "pzb-z", text: "⬇" });
          tocco(z, function () { if (!vivo() || S.lanci.length >= S.g) return; S.sel = k; zs.forEach(function (x, i) { x.classList.toggle("sel", i === k); }); ok.disabled = false; A.FX.clic(0.6); });
          zs.push(z); zone.appendChild(z);
        })(k);
        var tav = el("div", { class: "pzb-mini-tav" }), cv = document.createElement("canvas"); tav.appendChild(cv);
        var ok = el("button", { class: "pz-ok", text: "🟡 Lascia!" }); ok.disabled = true;
        tocco(ok, function () {
          if (!vivo() || ok.disabled || S.sel == null || S.lanci.length >= S.g) return;
          S.lanci.push(S.sel); A.invia({ x: S.sel }); A.vibra(20); A.FX.toc(520 + S.lanci.length * 90);
          segna();
        });
        root.appendChild(tray); root.appendChild(el("div", { class: "pzb-mini" }, [ zone, tav ])); root.appendChild(nota); root.appendChild(ok);
        S.ui = { nota: nota, tray: tray, zs: zs, ok: ok };
        setTimeout(function () { if (tav.clientWidth > 20) disegnaTavola(cv, tav.clientWidth, tav.clientHeight); }, 30);
        segna();
      }
      function segna() {
        var u = S.ui; if (!u || !u.tray) return;
        while (u.tray.firstChild) u.tray.removeChild(u.tray.firstChild);
        var resta = S.g - S.lanci.length;
        u.tray.appendChild(el("span", { text: resta > 0 ? "🟡 Hai " + S.g + (S.g === 1 ? " gettone" : " gettoni") : "✅ Tutti lasciati!" }));
        var f = el("span", { class: "pzb-gett" });
        for (var k = 0; k < S.g; k++) f.appendChild(el("i", { class: k >= S.lanci.length ? "on" : "", text: "🟡" }));
        u.tray.appendChild(f);
        var conta = {}; S.lanci.forEach(function (x) { conta[x] = (conta[x] || 0) + 1; });
        u.zs.forEach(function (z, i) { var b = z.querySelector(".k"); if (conta[i]) { if (!b) { b = el("span", { class: "k" }); z.appendChild(b); } b.textContent = conta[i]; } else if (b) z.removeChild(b); });
        if (resta > 0) { u.nota.textContent = S.sel == null ? "⬇ Tocca in alto dove lasciarlo" : "⬇ Cade dal posto " + (S.sel + 1); u.ok.disabled = S.sel == null; u.ok.textContent = "🟡 Lascia!" + (S.lanci.length ? " (ancora " + resta + ")" : ""); }
        else { u.nota.textContent = "👀 Guardate il maxischermo!"; u.ok.disabled = true; u.ok.textContent = "✅ Fatto"; u.zs.forEach(function (z) { z.disabled = true; }); }
      }
      function privato(m) {
        if (!m) return;
        if (m.storia) {   // chi ricarica la pagina ritrova le sue risposte e i gettoni già lasciati
          var h = m.storia; if ((h.r || []).length < S.risp.length) return;
          avviato = true; S.attende = false;
          S.risp = h.r || []; S.q = Math.min(PL.Q, S.risp.length); S.g = h.g || 1; S.lanci = (h.l || []).slice(); S.sel = S.lanci.length ? S.lanci[S.lanci.length - 1] : null;
          disegna(); return;
        }
        if (m.q != null) esito(m);
      }
      setTimeout(function () { if (!avviato && vivo()) { avviato = true; disegna(); } }, 0);
      return {
        privato: privato,
        aggiorna: function (p) {
          var x = (p.stato || {})[A.io]; if (!x) return;
          if (S.q >= PL.Q && x.g !== S.g && x.r >= PL.Q) { S.g = x.g; segna(); }
        },
        tempo: function () {
          clearTimeout(tq); clearTimeout(tf); clearTimeout(tnext);
          var u = S.ui;
          if (S.q >= PL.Q && S.lanci.length >= S.g) { S.finito = true; return; }
          S.finito = true;
          if (u && u.nota) u.nota.textContent = "⏰ Tempo! I gettoni rimasti li lascia il caso";
          if (u && u.ok) u.ok.disabled = true;
          (u && (u.zs || u.bs) || []).forEach(function (b) { b.disabled = true; });
        }
      };
    },
    rivela: async function (A) {
      stile();
      var el = A.el, riv = A.riv || {}, gett = riv.gett || [], ids = riv.ids || [], punti = A.punti || {};
      A.sch.classList.add("pzb-fitto");
      var box = el("div", { class: "pzb-pl-board" }), chips = el("div", { class: "pzb-pl-chips" }), banner = el("div", { class: "pz-sotto", text: "Tutti i gettoni cadono insieme!" });
      A.sch.appendChild(el("div", { class: "pz-testa", text: "🟡 Plinko" }));
      A.sch.appendChild(box); A.sch.appendChild(chips); A.sch.appendChild(banner);
      var tot = {}, ch = {};
      ids.forEach(function (id) {
        tot[id] = 0;
        var v = el("span", { class: "v", text: "0" }), c = el("div", { class: "pzb-pl-ch" }, [ A.fac(id), v ]);
        c.style.setProperty("--c", colore(A, id)); ch[id] = { el: c, v: v }; chips.appendChild(c);
      });
      var T = tavola(A, box); await T.pronto; if (!A.vivo()) return;
      var g = T.g; if (!g) { await A.dorme(durataPlinko(riv) - 400); return; }
      // i gettoni in alto, al loro posto
      var pila = {};
      gett.forEach(function (x, n) {
        x.el = gettone(A, x.id, g.d); x.el.classList.add("pop"); x.el.style.animationDelay = (n * 0.03) + "s";
        var k = pila["a" + x.x] = (pila["a" + x.x] || 0) + 1;
        x.x0 = g.X(2 * x.x) + (k > 1 ? (k % 2 ? 4 : -4) : 0); x.y0 = g.yAttesa + (k - 1) * 2;
        metti(x.el, x.x0, x.y0, g); T.inn.appendChild(x.el);
      });
      // i lampi delle caselle
      var lampi = PL.CASE.map(function (v, k) { var f = el("div", { class: "pzb-flash" }); f.style.left = (k * g.sw) + "px"; f.style.width = g.sw + "px"; f.style.height = (g.bh * 2.2) + "px"; T.inn.appendChild(f); return f; });
      await A.dorme(RP.intro); if (!A.vivo()) return;
      var ultimoClic = 0, inCasella = {}, cinquecento = 0, me = A.io;
      function clic() { var t = Date.now(); if (t - ultimoClic < 45) return; ultimoClic = t; A.FX.clic(0.55); }
      function atterra(x) {
        if (!A.vivo()) return;
        var v = PL.CASE[x.b], f = lampi[x.b];
        f.classList.remove("on"); void f.offsetWidth; f.classList.add("on");
        var p = el("div", { class: "pzb-piu" + (v === 500 ? " oro" : v === 0 ? " zero" : ""), text: v ? "+" + A.fmtN(v) : "0" });
        p.style.left = g.X(2 * x.b) + "px"; p.style.top = (g.H - g.bh - g.d) + "px"; T.inn.appendChild(p);
        setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 1300);
        tot[x.id] += v;
        var c = ch[x.id]; if (c) { c.v.textContent = A.fmtN(tot[x.id]); c.el.classList.remove("cambia"); void c.el.offsetWidth; c.el.classList.add("cambia"); }
        if (v === 500) {
          A.FX.din(); cinquecento++;
          if (cinquecento === 1) { A.ST.pubblico(A.S, "ovazione"); A.ST.coriandoli(); }
          if (x.id === me || A.locale === "telefono") A.vibra([30, 40, 70]);
        } else if (v === 0 && (x.b === 3 || x.b === 5)) { if (Math.random() < 0.6) A.ST.pubblico(A.S, "ohh"); A.FX.toc(220); }
        else A.FX.toc(600 + v * 2);
      }
      function cadi(x) {
        var l = percorso(x.x, x.s), kf = [], tempi = [0], t = 0, r;
        var cy = function (rr) { return g.Y(rr) - g.pr - g.d / 2; };
        kf.push({ x: x.x0, y: x.y0, e: "ease-in" });
        t += 380; tempi.push(t); kf.push({ x: g.X(l[0]), y: cy(0), e: "ease-out" });
        for (r = 0; r < PL.FILE; r++) {
          var a = (g.X(l[r]) + g.X(l[r + 1])) / 2;
          t += 75; tempi.push(t); kf.push({ x: a, y: cy(r) - g.rowH * 0.28, e: "ease-in" });
          if (r < PL.FILE - 1) { t += 115; tempi.push(t); kf.push({ x: g.X(l[r + 1]), y: cy(r + 1), e: "ease-out" }); }
        }
        var k = inCasella[x.b] = (inCasella[x.b] || 0) + 1;
        t += 300; tempi.push(t); kf.push({ x: g.X(l[PL.FILE]) + (k % 2 ? 1 : -1) * Math.min(6, (k - 1) * 3), y: g.yFondo - (k - 1) * g.d * 0.3, e: "linear" });
        var frames = kf.map(function (p, i) { return { transform: "translate(" + (p.x - g.d / 2).toFixed(1) + "px," + (p.y - g.d / 2).toFixed(1) + "px)", offset: tempi[i] / t, easing: p.e }; });
        x.el.style.zIndex = 5 + (x.k || 0);
        try { x.el.animate(frames, { duration: t, fill: "forwards" }); } catch (e) { metti(x.el, kf[kf.length - 1].x, kf[kf.length - 1].y, g); }
        // i clic sui chiodini e l'arrivo
        for (r = 0; r < PL.FILE; r++) setTimeout(function () { if (A.vivo()) clic(); }, 380 + r * 190);
        setTimeout(function () { atterra(x); }, t);
      }
      var nOnde = onde(riv);
      for (var w = 0; w < nOnde; w++) {
        if (!A.vivo()) return;
        gett.filter(function (x) { return (x.k || 0) === w; }).forEach(cadi);
        if (w < nOnde - 1) await A.dorme(PL.ONDA);
      }
      await A.dorme(RP.cadere + RP.dopo); if (!A.vivo()) return;
      // chi ha fatto di più
      var mx = Math.max.apply(null, ids.map(function (id) { return punti[id] != null ? punti[id] : tot[id]; }).concat([0]));
      var primi = ids.filter(function (id) { return mx > 0 && (punti[id] != null ? punti[id] : tot[id]) === mx; });
      primi.forEach(function (id) { if (ch[id]) ch[id].el.classList.add("primo"); });
      if (mx > 0) {
        banner.className = "pz-banner pzb-ban-s" + (mx >= 500 ? " oro" : "");
        banner.textContent = "🏆 " + elenco(A, primi) + ": " + A.fmtN(mx) + " punti!";
        if (!cinquecento) A.ST.pubblico(A.S, "applauso");
      } else {
        banner.className = "pz-banner no pzb-ban-s"; banner.textContent = "😱 Tutti a zero!";
        A.FX.trombone(); A.ST.pubblico(A.S, "ohh");
      }
      await A.dorme(RP.banner);
    }
  };

  // (per le prove: le regole senza grafica)
  window.__prezzoPremiB = { scalaTroppo: scalaTroppo, puntiTroppo: puntiTroppo, finto: finto, cade: cade, percorso: percorso, geo: geo, TR: TR, PL: PL };
})();
