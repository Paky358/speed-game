// PROVE DE «🧱 IL MURO» (js/games/muro.js, docs/muro/motore-muro.md). Si carica dopo il copione:
//   await COPIONE.carica("muro/muro.js"); await COPIONE.prova("mu1")
// Con Edge invisibile: "C:\Program Files\nodejs\node.exe" C:\Users\joetr\sg-strumenti\prova.js --porta 8981 --carica muro/muro.js --prova mu1,mu1b --rifai
//
// mu1: dalla Sala, 4 telefoni (Paky, Giulia, Luca, Marco) → «Il Muro»: due squadre da 2 da sole; «⚙️ Regole» → Corta e 15 s
//      (gli amici leggono «12 domande · 15 s»). Partita INTERA fino alla classifica: risposte e palline toccate davvero sui
//      telefoni (giuste, sbagliate, una senza risposta, 0-3 palline), «Pronto», l'host tocca «Prossima domanda». Ogni
//      domanda: chi è giù non vede la domanda (ma vede le risposte), la rivelazione dice la risposta giusta e cosa ha
//      contato per ogni squadra, nel muro dei perdenti solo le palline di chi ha sbagliato (dalle zone toccate), in quello
//      dei vincitori solo quelle di chi ha indovinato, i punti = la somma delle caselle (×2 nell'ultimo giro), la rotazione
//      scambia chi sta giù. In TUTTE le foto (vm) passate sulla stanza durante la domanda non ci sono MAI il testo della
//      domanda, la risposta giusta, le risposte date né le palline. Alla fine i tasti del core su tutti e 4 i telefoni.
// mu1b: 6 telefoni in 2 squadre da 3 con «su chi punti»: i due nella stanza rispondono uno giusto e uno sbagliato, chi è giù
//      punta a volte sull'uno a volte sull'altro (tocco sulla faccina, o il primo di partenza): conta la risposta di quello
//      su cui ha puntato. Partita intera, stessi controlli di mu1.
// mu2: ripresa e riserva: l'host ricarica a metà domanda, nel muro e sui punteggi (niente punti doppi), poi si spegne e Giulia
//      porta avanti la partita fino alla classifica.
// mu3: Bea guarda col link &guarda=1, Sara arriva a metà nella Sala (▶ Entra) ed entra dalla domanda dopo.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T, vm = A.vm, ids = A.ids;

  // la Sala con gli amici (Sala sempre accesa)
  async function salaMuro(amici) {
    var w = { Paky: await W.apriTel("Paky", { x: 0, salaSempre: true }) };
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true });
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === amici.length + 1; }, 12000)) no("nella Sala non sono entrati in " + (amici.length + 1));
    return { S: S, w: w };
  }
  function tocca(w, n) { if (!w || !n) return false; n.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, cancelable: true })); return true; }
  function nomeDi(C, id) { var p = (vm(C).players || []).filter(function (x) { return x.id === id; })[0]; return p ? p.nome : null; }
  function finDi(C, id) { var n = nomeDi(C, id); return n ? W.finestra(n) : null; }
  function cerca(w, testo) { var D = w.SG_MURO_DOM || {}; for (var a in D) for (var i = 0; i < D[a].length; i++) if (D[a][i][1] === testo) return D[a][i]; return null; }
  function squadre(v) { var o = []; for (var s = 0; s < v.nsq; s++) o.push((v.players || []).filter(function (p) { return p.sq === s; }).map(function (p) { return p.nome; }).sort().join("+")); return o; }
  function contaZone(l) { var o = {}; l.forEach(function (z) { o[z] = (o[z] || 0) + 1; }); return JSON.stringify(Object.keys(o).sort().map(function (k) { return k + ":" + o[k]; })); }

  // «🔄 A rotazione» in saletta: di partenza SPENTO (Giulia legge «Ruoli fissi»); l'host tocca l'interruttore e si accende
  async function accendiRotazione(Z, C) {
    var P = Z.w.Paky, G = Z.w.Giulia;
    if (vm(C).rot !== false) no("la rotazione di partenza non è spenta (" + vm(C).rot + ")");
    if (!await W.aspetta(function () { return /Ruoli fissi/.test(T(G)); }, 6000)) no("Giulia non legge «Ruoli fissi» in saletta («" + T(G).slice(0, 140) + "»)");
    if (!W.clicca(P, /A rotazione/, ".mu-rot")) no("l'host non ha l'interruttore «🔄 A rotazione»");
    if (!await W.aspetta(function () { return vm(C).rot === true; }, 4000)) no("la rotazione non si accende");
    if (!await W.aspetta(function () { return /A rotazione: i ruoli si scambiano/.test(T(G)); }, 6000)) no("Giulia non legge «🔄 A rotazione» in saletta («" + T(G).slice(0, 140) + "»)");
  }
  // dalla Sala nella saletta del Muro, regole «Corta» e 15 s, squadre giuste, rotazione accesa, poi «Comincia»
  async function apriMuro(Z, n, nsq) {
    var P = Z.w.Paky, C = await A.lanciaDallaSala("Paky", Z.S, "Il Muro");
    if (!await W.aspetta(function () { return ids(C, "players").length === n; }, 15000)) no("nella saletta non sono in " + n + " (" + ids(C, "players").length + ")");
    // le regole: Corta e 15 s
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/); }, 4000)) no("l'host non ha «⚙️ Regole» in saletta");
    await W.dorme(250);
    var foglio = P.document.querySelector(".sl-foglio");
    if (!foglio) no("il foglio delle regole non si apre");
    var nArg = foglio.querySelectorAll(".cat-chip").length;
    if (nArg !== 12) no("nelle regole ci sono " + nArg + " argomenti invece di 12");
    var c0 = foglio.querySelector(".cat-chip .mu-cn");
    if (!c0 || !(+c0.textContent > 20)) no("accanto agli argomenti non c'è il numero di domande");
    if (!W.clicca(P, /^Corta/, ".sl-foglio .modo-chip")) no("nelle regole non c'è «Corta»");
    if (!W.clicca(P, /^15 s$/, ".sl-foglio .modo-chip")) no("nelle regole non c'è «15 s»");
    if (!W.clicca(P, /Fatto/, ".sl-foglio button")) no("nel foglio delle regole non c'è «Fatto»");
    if (!await W.aspetta(function () { var f = P.document.querySelector(".sl-foglio"); return !f || !f.offsetParent; }, 4000)) no("il foglio delle regole non si chiude");
    if (!await W.aspetta(function () { return vm(C).nd === "corta" && vm(C).tempo === 15; }, 4000)) no("le regole non arrivano nella partita (" + vm(C).nd + ", " + vm(C).tempo + ")");
    var G = Z.w.Giulia;
    if (!await W.aspetta(function () { return /12 domande · 15 s/.test(A.regoleDi(G)); }, 12000)) no("Giulia non legge le regole («" + A.regoleDi(G) + "», Paky «" + A.regoleDi(P) + "»)");
    // le squadre: da sole n/2 per squadra (chi entra va nella squadra più piccola, il primo giù)
    var v = vm(C);
    if (v.nsq !== nsq) no("le squadre sono " + v.nsq + " invece di " + nsq);
    for (var s = 0; s < nsq; s++) {
      var m = v.players.filter(function (p) { return p.sq === s; });
      if (m.length !== n / nsq || m.filter(function (p) { return p.ruolo === "giu"; }).length !== 1) no("la squadra " + s + " è " + JSON.stringify(m));
    }
    // la saletta dice le squadre a tutti
    if (!/Blu/.test(T(G)) || !/Arancione/.test(T(G))) no("Giulia non vede le squadre in saletta («" + T(G).slice(0, 160) + "»)");
    // «🔄 A rotazione»: di partenza SPENTO (scelta del proprietario, 10 nov 2026); l'host lo accende e Giulia lo legge
    await accendiRotazione(Z, C);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).stato === "domanda"; }, 10000)) no("la partita non comincia");
    return C;
  }

  // una partita intera. scegli(k, s, d, giusta, nr, v) → { ris: { id: indice o -1 }, palle: [zone], su: id da toccare o null }
  async function giocaTutto(C, Z, scegli, opz) {
    opz = opz || {};
    var P = Z.w.Paky, NUM = P.__muro.NUM, visti = {}, testi = [], opzioni = [], punti = null, rep = { k: 0, perd: 0, vinc: 0, vuoti: 0, bet: 0, senza: 0, giuPrima: {}, vuotoMs: 0, giuVisti: {} }, fino = Date.now() + 560000;
    var spiegaVista = false;
    while (Date.now() < fino) {
      var v = vm(C);
      if (v.fase === "fine") break;
      if (v.fase !== "gioco" || v.stato !== "domanda" || visti[v.k]) { await W.dorme(60); continue; }
      var k = v.k; visti[k] = 1; rep.k++;
      if (!!v.dop !== (k > v.tot - v.ndop)) no("domanda " + k + ": punti doppi " + v.dop + " ma l'ultimo giro è dalla " + (v.tot - v.ndop + 1) + "ª");
      if (!punti) punti = v.punti.slice();
      if (v.restaMs == null || v.restaMs > 15000 || v.restaMs < 5000) no("domanda " + k + ": nella foto mancano i millisecondi giusti (" + v.restaMs + ")");
      // chi sta giù: con la rotazione cambia a ogni domanda (squadre da 2: uno e l'altro)
      v.sqd.forEach(function (d, s) {
        if (!d) no("domanda " + k + ": la squadra " + s + " non gioca");
        var pr = rep.giuPrima[s];
        if (opz.rot === false) { if (pr && pr !== d.giu) no("domanda " + k + ": nella squadra " + s + " chi sta giù è cambiato (" + nomeDi(C, pr) + " → " + nomeDi(C, d.giu) + ") ma la rotazione è spenta"); }
        else if (pr && pr === d.giu) no("domanda " + k + ": nella squadra " + s + " sta giù ancora " + nomeDi(C, d.giu) + " (la rotazione è accesa)");
        (rep.giuVisti[s] = rep.giuVisti[s] || {})[d.giu] = 1;
        rep.giuPrima[s] = d.giu;
      });
      // 1) nella stanza: la domanda e le risposte arrivano (solo lì); giù: niente domanda, sì le risposte
      var testo = null, opzT = null;
      for (var s = 0; s < v.nsq; s++) {
        var d = v.sqd[s];
        for (var i = 0; i < d.su.length; i++) {
          var w = finDi(C, d.su[i]);
          if (!await W.aspetta(function () { return w.document.querySelectorAll(".mu-ris").length === v.nr; }, 6000)) no("domanda " + k + ": " + nomeDi(C, d.su[i]) + " (nella stanza) non ha le " + v.nr + " risposte («" + T(w).slice(0, 120) + "»)");
          var tx = w.document.querySelector(".mu-testo").textContent, ot = [].map.call(w.document.querySelectorAll(".mu-ris span"), function (x) { return x.textContent; });
          if (testo && (tx !== testo || ot.join("|") !== opzT.join("|"))) no("domanda " + k + ": due telefoni nella stanza hanno domande diverse");
          testo = tx; opzT = ot;
        }
      }
      for (s = 0; s < v.nsq; s++) {
        var wg = finDi(C, v.sqd[s].giu);
        if (!await W.aspetta(function () { return wg.document.querySelectorAll(".mu-o").length === v.nr && wg.document.querySelectorAll(".mu-z").length === NUM.NZ; }, 6000)) no("domanda " + k + ": chi è giù (" + nomeDi(C, v.sqd[s].giu) + ") non ha le risposte o le zone");
        if (T(wg).indexOf(testo) >= 0) no("domanda " + k + ": chi è giù (" + nomeDi(C, v.sqd[s].giu) + ") VEDE la domanda");
        if (!spiegaVista && wg.document.querySelector(".mu-spiega")) { spiegaVista = true; tocca(wg, wg.document.querySelector(".mu-spiega")); await W.dorme(100); if (wg.document.querySelector(".mu-spiega")) no("la spiegazione non si chiude col tocco"); }
      }
      var e = cerca(P, testo); if (!e) no("domanda " + k + ": non trovo «" + testo + "» nel file delle domande");
      var giusta = opzT.indexOf(e[2]); if (giusta < 0) no("domanda " + k + ": la risposta giusta non è tra i tasti");
      testi.push(testo); opzT.forEach(function (x) { opzioni.push(x); });
      // 2) le mosse, toccate sui telefoni
      var att = [];
      for (s = 0; s < v.nsq; s++) {
        d = v.sqd[s];
        var sc = scegli(k, s, d, giusta, v.nr, v);
        for (var id in sc.ris) { if (sc.ris[id] < 0) continue; var ws = finDi(C, id); tocca(ws, ws.document.querySelectorAll(".mu-ris")[sc.ris[id]]); }
        wg = finDi(C, d.giu);
        if (sc.su) {
          var nb = nomeDi(C, sc.su), bb = [].filter.call(wg.document.querySelectorAll(".mu-chi-b"), function (b) { return b.textContent.indexOf(nb) >= 0; })[0];
          if (!bb) no("domanda " + k + ": chi è giù non ha la faccina di " + nb + " («Su chi punti?»)");
          tocca(wg, bb); rep.bet++;
        }
        for (i = 0; i < sc.palle.length; i++) { tocca(wg, wg.document.querySelectorAll(".mu-z")[sc.palle[i]]); await W.dorme(25); }
        var pr = wg.document.querySelector(".mu-pronto");
        if (!pr || pr.disabled) no("domanda " + k + ": «Pronto» non si tocca");
        tocca(wg, pr);
        var chi = sc.su || d.su[0], a = sc.ris[chi] == null ? -1 : sc.ris[chi];
        if (a < 0) rep.senza++;
        att.push({ chi: chi, a: a, ok: a === giusta, palle: sc.palle.slice() });
      }
      // 3) la rivelazione: la risposta giusta e cosa ha contato per ogni squadra
      if (!await W.aspetta(function () { var x = vm(C); return x.k === k && x.stato === "svela"; }, 25000)) no("domanda " + k + ": non si arriva alla rivelazione (stato " + vm(C).stato + ")");
      var rv = vm(C).riv;
      if (!rv || rv.testo !== testo || rv.giusta !== giusta || rv.opz.join("|") !== opzT.join("|")) no("domanda " + k + ": la rivelazione è sbagliata (" + JSON.stringify(rv).slice(0, 160) + ")");
      att.forEach(function (x, s) {
        var r = rv.ris[s];
        if (!r || r.chi !== x.chi || r.a !== x.a || !!r.ok !== x.ok) no("domanda " + k + ", squadra " + s + ": contava " + JSON.stringify(r) + " invece di " + JSON.stringify({ chi: x.chi, a: x.a, ok: x.ok }));
      });
      if (!await W.aspetta(function () { return /La risposta giusta|Giusto|Sbagliato|Nessuna risposta/.test(T(Z.w.Giulia)); }, 3000)) no("domanda " + k + ": Giulia non vede la rivelazione");
      // 4) e 5) i due muri, uno alla volta: le palline giuste dalle zone toccate
      var vals = vm(C).dop ? NUM.CASE_DOPPIO : NUM.CASE, delta = att.map(function () { return 0; });
      for (var m = 0; m < 2; m++) {
        var st = m ? "vincitori" : "perdenti";
        if (!await W.aspetta(function () { var x = vm(C); return x.k === k && x.stato === st; }, 12000)) no("domanda " + k + ": non arriva il muro dei " + st + " (stato " + vm(C).stato + ")");
        var pl = vm(C).palle || [];
        att.forEach(function (x, s) {
          var mie = pl.filter(function (b) { return b.s === s; }), dentro = m ? x.ok : !x.ok;
          if (!dentro && mie.length) no("domanda " + k + ": nel muro dei " + st + " ci sono le palline della squadra " + s + " che non ci va");
          if (dentro && contaZone(mie.map(function (b) { return b.x; })) !== contaZone(x.palle)) no("domanda " + k + ": nel muro dei " + st + " le palline della squadra " + s + " sono " + JSON.stringify(mie.map(function (b) { return b.x; })) + " invece di " + JSON.stringify(x.palle));
          mie.forEach(function (b) { if (b.p.length !== NUM.FILE || b.b < 0 || b.b >= vals.length) no("una caduta è sbagliata: " + JSON.stringify(b)); delta[s] += (m ? 1 : -1) * vals[b.b]; });
        });
        if (pl.length) { if (m) rep.vinc++; else rep.perd++; } else { rep.vuoti++; var tv = Date.now(); await W.aspetta(function () { return vm(C).stato !== st; }, 6000); rep.vuotoMs = Math.max(rep.vuotoMs, Date.now() - tv); }
        var wv = Z.w.Giulia;
        if (!await W.aspetta(function () { return wv.document.querySelector(".mu-muro." + st + " canvas") || vm(C).stato !== st; }, 3000)) no("domanda " + k + ": Giulia non vede il muro dei " + st);
      }
      // 6) i punti: la somma delle caselle (×2 nell'ultimo giro), dati una volta sola
      if (!await W.aspetta(function () { var x = vm(C); return x.k === k && x.stato === "punti"; }, 12000)) no("domanda " + k + ": non arrivano i punteggi");
      var vp = vm(C);
      if (JSON.stringify(vp.delta) !== JSON.stringify(delta)) no("domanda " + k + ": i punti della domanda sono " + JSON.stringify(vp.delta) + " invece di " + JSON.stringify(delta));
      punti = punti.map(function (x, s) { return x + delta[s]; });
      if (JSON.stringify(vp.punti) !== JSON.stringify(punti)) no("domanda " + k + ": i punti sono " + JSON.stringify(vp.punti) + " invece di " + JSON.stringify(punti));
      if (vp.k === vp.tot - vp.ndop && !/Ultimo giro: punti doppi/.test(T(Z.w.Luca))) no("prima dell'ultimo giro Luca non legge «🔥 Ultimo giro: punti doppi!»");
      if (!await W.aspetta(function () { return /Si va avanti tra/.test(T(Z.w.Giulia)); }, 3000)) no("domanda " + k + ": Giulia non legge «Si va avanti tra…»");
      var bv = await W.aspetta(function () { return P.document.querySelector(".mu-vai"); }, 3000);
      if (!bv) no("domanda " + k + ": Paky non ha «Prossima domanda»");
      if (opz.max && rep.k >= opz.max) return { testi: testi, opzioni: opzioni, punti: punti, rep: rep, spiegaVista: spiegaVista };
      bv.click();
    }
    if (vm(C).fase !== "fine") no("la partita non finisce (domanda " + vm(C).k + ", stato " + vm(C).stato + ")");
    return { testi: testi, opzioni: opzioni, punti: punti, rep: rep, spiegaVista: spiegaVista };
  }
  // NESSUNA foto passata sulla stanza durante la domanda ha la domanda, la risposta giusta, le risposte date o le palline
  function senzaSegreti(C, testi, opzioni) {
    var n = 0, cattive = [];
    (W.BR.storia || []).forEach(function (x) {
      if (x.topic.indexOf("/" + C + "/stato") < 0) return;
      var m; try { m = JSON.parse(x.p); } catch (e) { return; }
      var v = m && m.vm; if (!v || v.fase !== "gioco" || v.stato !== "domanda") return;
      n++;
      var p = x.p;
      ["riv", "palle", "delta", "dl", "risp", "testo", "opz", "giusta"].forEach(function (k) { if (k in v) cattive.push("campo «" + k + "»"); });
      (v.sqd || []).forEach(function (d) { if (d && Object.keys(d).some(function (k) { return ["giu", "su", "solo"].indexOf(k) < 0; })) cattive.push("sqd " + JSON.stringify(d)); });
      testi.forEach(function (t0) { if (p.indexOf(JSON.stringify(t0).slice(1, -1)) >= 0) cattive.push("la domanda «" + t0.slice(0, 40) + "»"); });
      opzioni.forEach(function (o) { if (p.indexOf(JSON.stringify(o)) >= 0) cattive.push("la risposta «" + o + "»"); });
    });
    if (n < 5) no("passano poche foto della domanda (" + n + ")");
    if (cattive.length) no("nella foto durante la domanda c'è " + cattive.slice(0, 3).join(", "));
    return n;
  }
  async function controllaFine(C, Z, punti, nomi) {
    var v = vm(C), cl = v.classifica || [];
    if (cl.length !== v.nsq) no("la classifica ha " + cl.length + " squadre");
    cl.forEach(function (r, i) { if (r.punti !== punti[r.s]) no("in classifica la squadra " + r.s + " ha " + r.punti + " invece di " + punti[r.s]); if (i && cl[i - 1].punti < r.punti) no("la classifica non è in ordine"); });
    if (!await W.aspetta(function () { return nomi.every(function (n) { return A.tastiFineDi(Z.w[n]); }); }, 8000)) no("a fine partita mancano i tasti del core");
    var tP = A.tastiFineDi(Z.w.Paky).join(" | "), tG = A.tastiFineDi(Z.w.Giulia).join(" | ");
    if (tP !== "↻ Rivincita | 🎮 Cambia gioco") no("Paky ha «" + tP + "»");
    if (tG !== "👍 Ci sto! | 🏠 Torna in Sala") no("Giulia ha «" + tG + "»");
    if (!/Classifica finale/.test(T(Z.w.Luca)) || !/(voi)/.test(T(Z.w.Luca))) no("Luca non vede la classifica delle squadre («" + T(Z.w.Luca).slice(0, 120) + "»)");
    return cl.map(function (r) { return ["Blu", "Arancione", "Viola", "Giallo", "Azzurro"][r.s] + " " + r.punti; }).join(", ");
  }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }

  COPIONE.aggiungi("mu1", { nome: "Il Muro dalla Sala: 4 telefoni, 2 squadre da 2, partita intera senza segreti nella foto", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Marco"], Z = await salaMuro(nomi.slice(1));
    var C = await apriMuro(Z, 4, 2);
    var r = await giocaTutto(C, Z, function (k, s, d, giusta, nr) {
      var sbagliata = (giusta + 1) % nr, ris = {};
      // Blu: giusto alle dispari; Arancione: sbagliato ogni 3, alla domanda 3 non risponde (⏰)
      if (s === 0) ris[d.su[0]] = k % 2 ? giusta : sbagliata;
      else ris[d.su[0]] = k === 3 ? -1 : (k % 3 ? giusta : sbagliata);
      var palle = s === 0 ? [[], [4], [0, 4, 8], [2, 2]][k % 4] : [[4, 4, 4], [], [1], [8, 0]][k % 4];
      return { ris: ris, palle: palle, su: null };
    });
    if (r.rep.k !== 12) no("si sono giocate " + r.rep.k + " domande invece di 12");
    if (!r.rep.perd || !r.rep.vinc || !r.rep.vuoti) no("non si sono visti tutti i muri (perdenti " + r.rep.perd + ", vincitori " + r.rep.vinc + ", vuoti " + r.rep.vuoti + ")");
    if (!r.spiegaVista) no("la spiegazione della prima volta non si è vista");
    var n = senzaSegreti(C, r.testi, r.opzioni);
    var cl = await controllaFine(C, Z, r.punti, nomi);
    errori();
    return "12 domande (perdenti " + r.rep.perd + ", vincitori " + r.rep.vinc + ", muri vuoti " + r.rep.vuoti + ", senza risposta " + r.rep.senza + "), " + n + " foto della domanda senza segreti, classifica: " + cl;
  } });

  COPIONE.aggiungi("mu1b", { nome: "Il Muro: 6 telefoni in 2 squadre da 3 con «su chi punti»", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Marco", "Sara", "Bea"], Z = await salaMuro(nomi.slice(1));
    var C = await apriMuro(Z, 6, 2);
    var cambi = 0;
    var r = await giocaTutto(C, Z, function (k, s, d, giusta, nr) {
      if (d.su.length !== 2) no("domanda " + k + ": nella squadra " + s + " non sono in 2 nella stanza");
      var sbagliata = (giusta + 1) % nr, ris = {};
      ris[d.su[0]] = giusta; ris[d.su[1]] = sbagliata;   // uno giusto, uno sbagliato: conta quello su cui si punta
      // si punta: sul secondo (tocco), sul primo (tocco), o niente tocco (il primo, di partenza)
      var su = [d.su[1], d.su[0], null][(k + s) % 3];
      if (su === d.su[1]) cambi++;
      var palle = [[4], [3, 5], [0, 8, 4]][(k + 2 * s) % 3];
      return { ris: ris, palle: palle, su: su };
    });
    if (r.rep.k !== 12) no("si sono giocate " + r.rep.k + " domande invece di 12");
    if (!cambi || !r.rep.perd || !r.rep.vinc) no("«su chi punti» non ha mai cambiato la risposta che conta (cambi " + cambi + ", perdenti " + r.rep.perd + ", vincitori " + r.rep.vinc + ")");
    var n = senzaSegreti(C, r.testi, r.opzioni);
    var cl = await controllaFine(C, Z, r.punti, nomi);
    errori();
    return "12 domande, puntato sul secondo " + cambi + " volte (perdenti " + r.rep.perd + ", vincitori " + r.rep.vinc + "), " + n + " foto della domanda senza segreti, classifica: " + cl;
  } });

  // ---- aiuti per mu2 e mu3: si gioca senza controllare tutto ----
  // tutti rispondono alla domanda di adesso: nella stanza la risposta (s % risposte), giù una pallina in mezzo e «Pronto»
  async function rispondiOra(C, zone) {
    var v = vm(C); if (v.fase !== "gioco" || v.stato !== "domanda") return false;
    for (var s = 0; s < v.nsq; s++) {
      var d = v.sqd[s]; if (!d) continue;
      var chi = d.solo ? [d.giu] : d.su;
      for (var i = 0; i < chi.length; i++) {
        var w = finDi(C, chi[i]); if (!w) continue;
        await W.aspetta(function () { return w.document.querySelectorAll(".mu-ris").length > 0; }, 6000);
        tocca(w, w.document.querySelectorAll(".mu-ris")[s % v.nr]);
      }
      var wg = finDi(C, d.giu); if (!wg) continue;
      await W.aspetta(function () { return wg.document.querySelectorAll(".mu-z").length > 0; }, 6000);
      (zone || [4]).forEach(function (z) { tocca(wg, wg.document.querySelectorAll(".mu-z")[z]); });
      tocca(wg, wg.document.querySelector(".mu-pronto"));
    }
    return true;
  }
  // si gioca fino a cond(vm) (di partenza la classifica): chi tiene la partita tocca «Prossima domanda»
  async function giocaFino(C, cond, ms) {
    var fatto = {}, fino = Date.now() + (ms || 400000);
    cond = cond || function (v) { return v.fase === "fine"; };
    while (Date.now() < fino) {
      var v = vm(C);
      if (cond(v)) return true;
      if (v.fase === "gioco" && v.stato === "domanda" && !fatto[v.k + "|" + v.rip]) { fatto[v.k + "|" + v.rip] = 1; await W.dorme(300); await rispondiOra(C); continue; }
      if (v.fase === "gioco" && v.stato === "punti") {
        var w = W.finestra(nomeDi(C, v.tiene)), b = w && w.document.querySelector(".mu-vai");
        if (b) { b.click(); await W.aspetta(function () { return vm(C).stato !== "punti"; }, 3000); continue; }
      }
      await W.dorme(100);
    }
    return cond(vm(C));
  }
  function pt(C) { return JSON.stringify(vm(C).punti); }
  // Paky ricarica: la foto nuova dice che la partita riprende (_r), nessuno passa dalla saletta
  async function ricaricaPaky(C, nomi) {
    var s0 = (W.statoStanza(C) || {})._s, sal = {}, sp = setInterval(function () { nomi.forEach(function (n) { var f = W.finestra(n); if (f && f.document.querySelector(".saletta-schermo")) sal[n] = 1; }); }, 100);
    await W.ricarica("Paky");
    var ok = await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._s && s._s !== s0 && s._r && vm(C).stato === "ripresa"; }, 12000);
    clearInterval(sp);
    if (!ok) no("dopo la ricarica di Paky la partita non riprende (stato " + vm(C).stato + ")");
    if (Object.keys(sal).length) no(Object.keys(sal).join(", ") + " è passato dalla saletta");
  }

  // mu2: l'host ricarica a metà domanda (la domanda si rifà da capo), nel muro (la rivelazione ricomincia con le STESSE
  //      palline e i punti si danno una volta sola), sui punteggi (si passa alla domanda dopo); poi si spegne e non torna:
  //      Giulia porta avanti la partita fino alla classifica (con Paky nella sua squadra)
  COPIONE.aggiungi("mu2", { nome: "Il Muro: l'host ricarica (domanda, muro, punteggi), poi si spegne e Giulia porta avanti la partita", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Marco"], Z = await salaMuro(nomi.slice(1)), C = await apriMuro(Z, 4, 2), fatti = [], am = nomi.slice(1);
    var idG = A.idInSala(Z.S, "Giulia");
    // 1) a metà domanda (uno ha già risposto)
    var k1 = vm(C).k, p1 = pt(C), d0 = vm(C).sqd[1], w0 = finDi(C, d0.su[0]);
    await W.aspetta(function () { return w0.document.querySelectorAll(".mu-ris").length; }, 6000);
    tocca(w0, w0.document.querySelectorAll(".mu-ris")[0]);
    await W.dorme(700);
    await ricaricaPaky(C, am);
    if (!await W.aspetta(function () { var v = vm(C); return v.stato === "domanda" && v.k === k1 && !(v.fatto || []).length; }, 40000)) no("dopo il respiro la domanda " + k1 + " non si rifà da capo (domanda " + vm(C).k + ", " + vm(C).stato + ")");
    if (pt(C) !== p1) no("dopo la ricarica a metà domanda i punti sono cambiati");
    var w1 = finDi(C, vm(C).sqd[1].su[0]);
    if (!await W.aspetta(function () { var b = w1.document.querySelectorAll(".mu-ris"); return b.length && ![].some.call(b, function (x) { return x.classList.contains("sel"); }); }, 6000)) no("dopo la ripresa la risposta di prima è ancora segnata");
    fatti.push("domanda " + k1 + " rifatta da capo");
    // 2) nel primo muro con le palline
    await rispondiOra(C);
    var st = null;
    if (!await W.aspetta(function () { var v = vm(C); if (v.k === k1 && (v.stato === "perdenti" || v.stato === "vincitori") && (v.palle || []).length) { st = v.stato; return true; } return false; }, 30000)) no("non arriva un muro con le palline");
    var palle1 = JSON.stringify(vm(C).palle), p2 = JSON.parse(pt(C));
    await W.dorme(900);
    await ricaricaPaky(C, am);
    if (!await W.aspetta(function () { var v = vm(C); return v.stato === "svela" && v.k === k1; }, 40000)) no("dopo la ricarica nel muro la rivelazione non ricomincia (" + vm(C).stato + ")");
    if (!await W.aspetta(function () { return vm(C).stato === st; }, 15000)) no("dopo la ricarica non torna il muro dei " + st);
    if (JSON.stringify(vm(C).palle) !== palle1) no("dopo la ricarica le palline del muro dei " + st + " sono cambiate");
    if (!await W.aspetta(function () { var v = vm(C); return v.stato === "punti" && v.k === k1; }, 20000)) no("dopo i muri non arrivano i punteggi");
    var dl = vm(C).delta, atteso = JSON.stringify(p2.map(function (x, s) { return x + dl[s]; }));
    if (pt(C) !== atteso) no("i punti sono " + pt(C) + " invece di " + atteso + " (dati due volte?)");
    fatti.push("muro dei " + st + " → rivelazione da capo, stesse palline, punti dati una volta (" + atteso + ")");
    // 3) sui punteggi: la domanda dopo, punti uguali
    var p3 = pt(C);
    await ricaricaPaky(C, am);
    if (!await W.aspetta(function () { var v = vm(C); return v.stato === "domanda" && v.k === k1 + 1; }, 40000)) no("dopo la ricarica sui punteggi non si passa alla domanda " + (k1 + 1) + " (domanda " + vm(C).k + ", " + vm(C).stato + ")");
    if (pt(C) !== p3) no("dopo la ricarica sui punteggi i punti sono cambiati");
    fatti.push("punteggi → domanda " + (k1 + 1));
    // 4) Paky si spegne e non torna: Giulia porta avanti la partita
    await W.dorme(1600);   // (la copia per i vici: al massimo una al secondo)
    var p4 = pt(C), t0 = Date.now();
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === idG; }, 25000)) no("Giulia non prende la partita (" + JSON.stringify(A.chiTiene(C)) + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    if (pt(C) !== p4) no("con Giulia i punti sono cambiati");
    if (vm(C).tiene !== idG) no("nella foto la partita non la tiene Giulia");
    if (!await giocaFino(C)) no("con Giulia la partita non finisce (domanda " + vm(C).k + ", " + vm(C).stato + ")");
    var cl = vm(C).classifica || [];
    if (cl.length !== 2 || !cl.some(function (r) { return (r.ids || []).indexOf("host") >= 0; })) no("la classifica non ha Paky con la sua squadra (" + JSON.stringify(cl).slice(0, 160) + ")");
    if (!await W.aspetta(function () { return A.tastiFineDi(Z.w.Giulia) && A.tastiFineDi(Z.w.Luca) && A.tastiFineDi(Z.w.Marco); }, 8000)) no("a fine partita mancano i tasti del core");
    var e = W.erroriTel().filter(function (x) { return x.indexOf("Paky:") !== 0; }); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return fatti.join("; ") + "; Paky spento → Giulia tiene la partita in " + dt + " s, si finisce, Paky in classifica";
  } });

  // mu3: Bea guarda col link &guarda=1 (niente join, targhetta, l'argomento e le risposte ma MAI la domanda, i muri);
  //      Sara arriva nella Sala a metà, «▶ Entra»: aspetta la domanda dopo ed entra nella squadra con meno persone (gioca
  //      davvero: ha un posto nella domanda e la sua squadra va avanti coi suoi punti), è in classifica con la sua squadra
  COPIONE.aggiungi("mu3", { nome: "Il Muro: Bea guarda col link, Sara arriva a metà ed entra dalla domanda dopo", fai: async function () {
    var Z = await salaMuro(["Giulia", "Luca", "Marco"]), S = Z.S, C = await apriMuro(Z, 4, 2), p6 = COPIONE.p6;
    // Bea col link
    var B = await W.apriTel("Bea", { hash: "gioco=muro&stanza=" + C + "&guarda=1", x: 740, salaSempre: true });
    if (!await W.aspetta(function () { return B.document.querySelector(".mu-scena") && B.document.querySelector(".sg-guardo"); }, 15000)) no("Bea non vede la partita con la targhetta («" + T(B).slice(0, 100) + "»)");
    if (p6.logDa("Bea", C, '"t":"join"').length) no("Bea ha mandato «join»");
    if (ids(C, "players").length !== 4) no("Bea è tra i giocatori");
    if (!B.document.querySelector(".mu-scena.mu-con-targa")) no("Bea non ha il posto in basso per la targhetta");
    // la domanda dopo, vista da Bea: argomento e risposte sì, la domanda no
    await giocaFino(C, function (v) { return v.stato === "domanda" && v.k === 2; }, 60000);
    var v = vm(C), ws = finDi(C, v.sqd[0].su[0]);
    await W.aspetta(function () { return ws.document.querySelector(".mu-ris"); }, 6000);
    var testo = ws.document.querySelector(".mu-testo").textContent;
    if (!await W.aspetta(function () { return B.document.querySelectorAll(".mu-o").length === v.nr; }, 6000)) no("Bea non vede le risposte possibili");
    if (T(B).indexOf(testo) >= 0) no("Bea vede la domanda");
    if (B.document.querySelector(".mu-ris, .mu-z, .mu-pronto")) no("Bea ha dei tasti da gioco");
    // Sara arriva nella Sala: riquadro con «Domanda N di 12», «▶ Entra»
    var Sw = await W.apriTel("Sara", { hash: "sala=" + S, x: 925, salaSempre: true });
    var r = await W.aspetta(function () { var x = p6.rigaInCorso(Sw); return x && x.tasti.length === 2 ? x : null; }, 15000);
    if (!r) no("Sara non vede il riquadro con «▶ Entra» e «👀 Guarda» («" + T(Sw).slice(0, 100) + "»)");
    if (!/Domanda \d+ di 12/.test(r.testo)) no("il riquadro non dice a che domanda siamo («" + r.testo + "»)");
    var idS = A.idInSala(S, "Sara");
    // (si entra mentre c'è una domanda in corso)
    await W.aspetta(function () { return vm(C).stato === "domanda"; }, 30000);
    if (!W.clicca(Sw, /Entra · giochi/, ".sl-incorso button")) no("non trovo «▶ Entra»");
    if (!await W.aspetta(function () { return (vm(C).prossimi || []).some(function (x) { return x.id === idS; }) || ids(C, "players").indexOf(idS) >= 0; }, 12000)) no("Sara non è né tra chi aspetta né tra i giocatori");
    var kE = vm(C).k, inAttesa = (vm(C).prossimi || []).some(function (x) { return x.id === idS; });
    if (inAttesa) {
      if (!await W.aspetta(function () { return /Entri/.test(T(Sw)) && Sw.document.querySelector(".mu-scena"); }, 8000)) no("Sara non legge «✋ Entri alla prossima»");
      if (Sw.document.querySelector(".mu-ris, .mu-z")) no("Sara ha i tasti mentre aspetta");
    }
    if (!await giocaFino(C, function (x) { return ids(C, "players").indexOf(idS) >= 0 && x.stato === "domanda"; }, 90000)) no("Sara non entra nella partita (domanda " + vm(C).k + ")");
    var v2 = vm(C), pS = v2.players.filter(function (p) { return p.id === idS; })[0];
    if (inAttesa && v2.k !== kE + 1) no("Sara entra alla domanda " + v2.k + " invece della " + (kE + 1));
    var mem = v2.players.filter(function (p) { return p.sq === pS.sq; }).length;
    if (mem !== 3) no("Sara non è nella squadra con meno persone (la sua ne ha " + mem + ")");
    var dS = v2.sqd[pS.sq];
    if (!dS || (dS.giu !== idS && dS.su.indexOf(idS) < 0)) no("Sara non ha un posto nella domanda " + v2.k);
    if (!await W.aspetta(function () { return Sw.document.querySelector(dS.giu === idS ? ".mu-z" : ".mu-ris"); }, 8000)) no("Sara non ha i tasti per giocare");
    // Bea vede i muri
    var muro = false;
    if (!await giocaFino(C, function (x) { if (x.stato === "perdenti" || x.stato === "vincitori") muro = muro || !!B.document.querySelector(".mu-muro canvas"); return x.fase === "fine"; }, 400000)) no("la partita non finisce");
    if (!muro) no("Bea non ha visto i muri");
    var cl = vm(C).classifica || [];
    if (!cl.some(function (x) { return (x.ids || []).indexOf(idS) >= 0; })) no("Sara non è nella classifica con la sua squadra");
    if (!await W.aspetta(function () { return /Classifica finale/.test(T(Sw)) && A.tastiFineDi(Sw); }, 8000)) no("Sara non ha la classifica coi tasti di fine");
    if (!await W.aspetta(function () { return /l'hai guardata/.test(T(B)); }, 8000)) no("Bea non legge che la partita l'ha guardata");
    errori();
    return "Bea guarda (niente join, targhetta, risposte sì e domanda no, i muri); riquadro «" + r.testo + "»; Sara " + (inAttesa ? "aspetta la domanda " + kE + " ed entra alla " + (kE + 1) : "entra alla domanda " + v2.k) + " nella squadra più piccola, gioca, è in classifica";
  } });

  // =====================================================================================================
  // GIRO 1 DEL PROVATORE (10 nov 2026): mu4-mu14. Si apre con apriMuro2 (squadre, rotazione e argomenti a scelta).
  // =====================================================================================================
  var NOMI10 = ["Paky", "Giulia", "Luca", "Marco", "Sara", "Bea", "Tom", "Ivo", "Ada", "Gea"];
  // dalla Sala nella saletta del Muro, regole Corta e 15 s, squadre e rotazione come si chiede
  // o = { nsq, mischia, rot, tieni: [argomenti accesi], attese: [grandezze delle squadre], prima: async fn(P, C) prima di «Comincia» }
  async function apriMuro2(Z, n, o) {
    o = o || {};
    var P = Z.w.Paky, C = await A.lanciaDallaSala("Paky", Z.S, "Il Muro");
    if (!await W.aspetta(function () { return ids(C, "players").length === n; }, 45000)) no("nella saletta non sono in " + n + " (" + ids(C, "players").length + ")");
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/); }, 4000)) no("l'host non ha «⚙️ Regole» in saletta");
    await W.dorme(250);
    var foglio = P.document.querySelector(".sl-foglio");
    if (!foglio) no("il foglio delle regole non si apre");
    var info = {};
    if (o.tieni) {
      var ARG = P.SG_MURO_ARG, chips = [].slice.call(foglio.querySelectorAll(".cat-chip"));
      if (chips.length !== ARG.length) no("nelle regole ci sono " + chips.length + " argomenti invece di " + ARG.length);
      chips.forEach(function (c, i) { if (o.tieni.indexOf(ARG[i].id) < 0) c.click(); });
      await W.dorme(150);
      var accesi = chips.filter(function (c) { return c.classList.contains("attiva"); }).length;
      if (accesi !== o.tieni.length) no("dopo aver spento gli altri gli argomenti accesi sono " + accesi + " invece di " + o.tieni.length);
      // l'ultimo acceso non si spegne (e compare l'avviso)
      var daSpegnere = chips.filter(function (c) { return c.classList.contains("attiva"); });
      if (daSpegnere.length >= 1) { while (chips.filter(function (c) { return c.classList.contains("attiva"); }).length > 1) chips.filter(function (c) { return c.classList.contains("attiva"); })[0].click(); }
      var ultimo = chips.filter(function (c) { return c.classList.contains("attiva"); });
      if (ultimo.length !== 1) no("spegnendo tutti gli argomenti ne restano " + ultimo.length + " accesi invece di 1");
      ultimo[0].click(); await W.dorme(100);
      if (!chips.some(function (c) { return c.classList.contains("attiva"); })) no("si è riusciti a spegnere TUTTI gli argomenti");
      var av = foglio.querySelector(".mu-arg-griglia + .link-avviso");
      if (!av || av.hidden) no("spegnendo l'ultimo argomento non compare l'avviso");
      // e si riaccendono quelli da tenere
      chips.forEach(function (c, i) { var on = c.classList.contains("attiva"), vuole = o.tieni.indexOf(ARG[i].id) >= 0; if (on !== vuole) c.click(); });
      await W.dorme(150);
      accesi = chips.filter(function (c) { return c.classList.contains("attiva"); }).length;
      if (accesi !== o.tieni.length) no("riaccesi gli argomenti da tenere sono " + accesi + " invece di " + o.tieni.length);
    }
    if (!W.clicca(P, /^Corta/, ".sl-foglio .modo-chip")) no("nelle regole non c'è «Corta»");
    if (!W.clicca(P, new RegExp("^" + (o.tempo || 15) + " s$"), ".sl-foglio .modo-chip")) no("nelle regole non c'è «" + (o.tempo || 15) + " s»");
    if (!W.clicca(P, /Fatto/, ".sl-foglio button")) no("nel foglio delle regole non c'è «Fatto»");
    if (!await W.aspetta(function () { var f = P.document.querySelector(".sl-foglio"); return !f || !f.offsetParent; }, 4000)) no("il foglio delle regole non si chiude");
    if (!await W.aspetta(function () { return vm(C).nd === "corta" && vm(C).tempo === (o.tempo || 15); }, 4000)) no("le regole non arrivano nella partita (" + vm(C).nd + ", " + vm(C).tempo + ")");
    if (o.nsq && vm(C).nsq !== o.nsq) {
      if (!await W.aspetta(function () { return W.clicca(P, new RegExp("^" + o.nsq + "$"), ".mu-n"); }, 3000)) no("l'host non ha il tasto «" + o.nsq + "» squadre");
      if (!await W.aspetta(function () { return vm(C).nsq === o.nsq; }, 4000)) no("le squadre non diventano " + o.nsq + " (" + vm(C).nsq + ")");
    }
    if (o.mischia) { await W.dorme(300); W.clicca(P, /A caso/, ".mu-sq-b"); await W.dorme(600); }
    // (la rotazione di partenza è SPENTA: con rot: false si lascia così, se no l'host la accende)
    if (o.rot === false) {
      if (vm(C).rot !== false) no("la rotazione di partenza non è spenta (" + vm(C).rot + ")");
      var G = Z.w.Giulia;
      if (!await W.aspetta(function () { return /Ruoli fissi/.test(T(G)); }, 6000)) no("Giulia non legge «Ruoli fissi» in saletta («" + T(G).slice(0, 140) + "»)");
    } else await accendiRotazione(Z, C);
    var v = vm(C), tag = [];
    for (var s = 0; s < v.nsq; s++) {
      var m = v.players.filter(function (p) { return p.sq === s; });
      tag.push(m.length);
      if (m.filter(function (p) { return p.ruolo === "giu"; }).length !== 1) no("la squadra " + s + " non ha esattamente uno giù: " + JSON.stringify(m.map(function (p) { return p.nome + ":" + p.ruolo; })));
    }
    if (o.attese && JSON.stringify(tag.slice().sort()) !== JSON.stringify(o.attese.slice().sort())) no("le squadre sono " + JSON.stringify(tag) + " invece di " + JSON.stringify(o.attese));
    info.giu0 = {}; v.players.forEach(function (p) { if (p.ruolo === "giu") info.giu0[p.sq] = p.id; });
    if (o.prima) await o.prima(P, C);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).stato === "domanda"; }, 10000)) no("la partita non comincia");
    info.C = C; info.sizes = tag;
    return info;
  }
  async function salaDi(nomi) { return await salaMuro(nomi.slice(1)); }

  // mu4 (a): 6 telefoni in 3 squadre da 2, partita intera
  COPIONE.aggiungi("mu4", { nome: "Il Muro: 6 telefoni, 3 squadre da 2, partita intera", fai: async function () {
    var nomi = NOMI10.slice(0, 6), Z = await salaDi(nomi), I = await apriMuro2(Z, 6, { nsq: 3, mischia: true, attese: [2, 2, 2] }), C = I.C;
    var r = await giocaTutto(C, Z, function (k, s, d, giusta, nr) {
      var sb = (giusta + 1) % nr, ris = {};
      ris[d.su[0]] = (k + s) % 3 === 0 ? sb : giusta;
      return { ris: ris, palle: [[4], [3, 5], [0, 4, 8], [], [2, 2], [4, 4, 4]][(k + 2 * s) % 6], su: null };
    });
    if (r.rep.k !== 12) no("si sono giocate " + r.rep.k + " domande invece di 12");
    if (!r.rep.perd || !r.rep.vinc) no("non si sono visti tutti i muri (perdenti " + r.rep.perd + ", vincitori " + r.rep.vinc + ")");
    var n = senzaSegreti(C, r.testi, r.opzioni), cl = await controllaFine(C, Z, r.punti, nomi);
    errori();
    return "3 squadre da 2, 12 domande (perdenti " + r.rep.perd + ", vincitori " + r.rep.vinc + ", vuoti " + r.rep.vuoti + "), " + n + " foto senza segreti, classifica: " + cl;
  } });

  // mu5 (b): 5 telefoni, una squadra da 3 e una da 2; la rotazione passa su tutti e tre della squadra da 3
  COPIONE.aggiungi("mu5", { nome: "Il Muro: 5 telefoni (3+2), rotazione su tre, partita intera", fai: async function () {
    var nomi = NOMI10.slice(0, 5), Z = await salaDi(nomi), I = await apriMuro2(Z, 5, { nsq: 2, attese: [3, 2] }), C = I.C;
    var gr = [0, 1].map(function (s) { return vm(C).players.filter(function (p) { return p.sq === s; }).length; }), s3 = gr.indexOf(3), cambi = 0;
    var r = await giocaTutto(C, Z, function (k, s, d, giusta, nr) {
      var sb = (giusta + 1) % nr, ris = {};
      if (d.su.length === 2) { ris[d.su[0]] = giusta; ris[d.su[1]] = sb; var su = [d.su[1], d.su[0], null][k % 3]; if (su === d.su[1]) cambi++; return { ris: ris, palle: [[4], [3, 5], [0, 8, 4]][k % 3], su: su }; }
      ris[d.su[0]] = k % 2 ? giusta : sb;
      return { ris: ris, palle: [[2], [4, 4], []][k % 3], su: null };
    });
    var visti = Object.keys(r.rep.giuVisti[s3] || {}).length;
    if (visti !== 3) no("nella squadra da 3 sono stati giù " + visti + " diversi invece di 3 (rotazione)");
    if (Object.keys(r.rep.giuVisti[1 - s3] || {}).length !== 2) no("nella squadra da 2 non hanno fatto giù tutti e due");
    if (r.rep.k !== 12) no("si sono giocate " + r.rep.k + " domande invece di 12");
    var n = senzaSegreti(C, r.testi, r.opzioni), cl = await controllaFine(C, Z, r.punti, nomi);
    errori();
    return "5 telefoni (3+2): in 12 domande tutti e 3 della squadra da 3 sono stati giù, puntato sul secondo " + cambi + " volte, " + n + " foto senza segreti, classifica: " + cl;
  } });

  // mu6 (c): 10 telefoni, 5 squadre da 2, partita intera
  COPIONE.aggiungi("mu6", { nome: "Il Muro: 10 telefoni, 5 squadre da 2, partita intera", fai: async function () {
    var nomi = NOMI10, Z = await salaDi(nomi), I = await apriMuro2(Z, 10, { nsq: 5, mischia: true, attese: [2, 2, 2, 2, 2] }), C = I.C;
    var r = await giocaTutto(C, Z, function (k, s, d, giusta, nr) {
      var sb = (giusta + 1) % nr, ris = {};
      ris[d.su[0]] = (k + s) % 2 ? giusta : sb;
      return { ris: ris, palle: [[4], [3, 5], [0, 4, 8], [], [2, 2]][(k + s) % 5], su: null };
    });
    if (r.rep.k !== 12) no("si sono giocate " + r.rep.k + " domande invece di 12");
    if (!r.rep.perd || !r.rep.vinc) no("non si sono visti i muri (perdenti " + r.rep.perd + ", vincitori " + r.rep.vinc + ")");
    var n = senzaSegreti(C, r.testi, r.opzioni), cl = await controllaFine(C, Z, r.punti, nomi);
    errori();
    return "10 telefoni, 5 squadre da 2, 12 domande (perdenti " + r.rep.perd + ", vincitori " + r.rep.vinc + "), " + n + " foto senza segreti, classifica: " + cl;
  } });

  // mu7 (d)+(e): tutti giusto (muro dei perdenti vuoto e veloce), poi tutti sbagliato (muro dei vincitori vuoto), punti sotto zero
  COPIONE.aggiungi("mu7", { nome: "Il Muro: tutti giusto poi tutti sbagliato (muri vuoti, punti sotto zero)", fai: async function () {
    var nomi = NOMI10.slice(0, 4), Z = await salaDi(nomi), I = await apriMuro2(Z, 4, { nsq: 2 }), C = I.C;
    var r = await giocaTutto(C, Z, function (k, s, d, giusta, nr) {
      var ris = {}; ris[d.su[0]] = k <= 2 ? giusta : (giusta + 1) % nr;
      return { ris: ris, palle: k <= 2 ? [4] : [3, 4, 5], su: null };
    }, { max: 6 });
    if (r.rep.vuoti !== 6) no("i muri vuoti sono " + r.rep.vuoti + " invece di 6 (2 domande tutti giusto + 4 tutti sbagliato)");
    if (r.rep.vuotoMs > 2600) no("il muro vuoto dura " + r.rep.vuotoMs + " ms (doveva passare in circa 1,3 s)");
    if (r.rep.vuotoMs < 300) no("il muro vuoto passa in " + r.rep.vuotoMs + " ms: troppo di corsa per vederlo");
    var neg = r.punti.some(function (x) { return x < 0; });
    errori();
    return "6 domande: 2 tutti giusto, 4 tutti sbagliato; 6 muri vuoti, il più lungo " + r.rep.vuotoMs + " ms; punti " + JSON.stringify(r.punti) + (neg ? " (sotto zero: sì)" : " (nessuno sotto zero)");
  } });

  // mu8 (f): chi è nella stanza non risponde e chi è giù non sceglie
  COPIONE.aggiungi("mu8", { nome: "Il Muro: nessuna risposta e nessuna pallina scelta (tempo scaduto)", fai: async function () {
    var nomi = NOMI10.slice(0, 4), Z = await salaDi(nomi), I = await apriMuro2(Z, 4, { nsq: 2 }), C = I.C, P = Z.w.Paky, NUM = P.__muro.NUM, out = [];
    var inizio = async function (k) {
      if (!await W.aspetta(function () { var x = vm(C); return x.k === k && x.stato === "domanda"; }, 12000)) no("non comincia la domanda " + k);
      return vm(C);
    };
    // domanda 1: nessuno tocca niente, nemmeno «Pronto»
    var v = await inizio(1), p0 = v.punti.slice(), t0 = Date.now();
    if (!await W.aspetta(function () { return vm(C).k === 1 && vm(C).stato === "svela"; }, 25000)) no("scaduto il tempo la domanda 1 non si svela (" + vm(C).stato + ")");
    var dtm = Date.now() - t0;
    if (dtm < 14000 || dtm > 19000) no("la domanda da 15 s si chiude dopo " + dtm + " ms");
    var rv = vm(C).riv;
    rv.ris.forEach(function (x, s) { if (x.a !== -1 || x.ok) no("domanda 1, squadra " + s + ": senza risposta doveva essere {a:-1, ok:false}: " + JSON.stringify(x)); });
    if (!await W.aspetta(function () { return vm(C).k === 1 && vm(C).stato === "perdenti"; }, 12000)) no("domanda 1: non arriva il muro dei perdenti");
    if ((vm(C).palle || []).length) no("domanda 1: chi è giù non ha scelto ma nel muro cadono " + vm(C).palle.length + " palline");
    if (!await W.aspetta(function () { return vm(C).k === 1 && vm(C).stato === "punti"; }, 15000)) no("domanda 1: non arrivano i punteggi");
    if (JSON.stringify(vm(C).punti) !== JSON.stringify(p0)) no("domanda 1: senza palline i punti sono cambiati (" + JSON.stringify(vm(C).punti) + ")");
    out.push("domanda 1 (niente): tempo scaduto in " + (dtm / 1000).toFixed(1) + " s, nessuna risposta, niente cade, punti uguali");
    P.document.querySelector(".mu-vai").click();
    // domanda 2: squadra 0 non risponde ma chi è giù ha messo 2 palline senza «Pronto»; squadra 1 risponde giusto e chi è giù non sceglie
    v = await inizio(2);
    var d0 = v.sqd[0], d1 = v.sqd[1], w1 = finDi(C, d1.su[0]);
    await W.aspetta(function () { return w1.document.querySelector(".mu-testo"); }, 6000);
    var e = cerca(P, w1.document.querySelector(".mu-testo").textContent), opt = [].map.call(w1.document.querySelectorAll(".mu-ris span"), function (x) { return x.textContent; }), g = opt.indexOf(e[2]);
    tocca(w1, w1.document.querySelectorAll(".mu-ris")[g]);
    var wg0 = finDi(C, d0.giu); await W.aspetta(function () { return wg0.document.querySelectorAll(".mu-z").length === NUM.NZ; }, 6000);
    tocca(wg0, wg0.document.querySelectorAll(".mu-z")[0]); tocca(wg0, wg0.document.querySelectorAll(".mu-z")[4]);
    var p1 = vm(C).punti.slice();
    if (!await W.aspetta(function () { return vm(C).k === 2 && vm(C).stato === "svela"; }, 25000)) no("domanda 2: non si svela");
    rv = vm(C).riv;
    if (rv.ris[0].a !== -1 || rv.ris[0].ok) no("domanda 2: la squadra 0 non aveva risposto: " + JSON.stringify(rv.ris[0]));
    if (!rv.ris[1].ok) no("domanda 2: la squadra 1 aveva risposto giusto: " + JSON.stringify(rv.ris[1]));
    if (!await W.aspetta(function () { return vm(C).k === 2 && vm(C).stato === "perdenti"; }, 12000)) no("domanda 2: non arriva il muro dei perdenti");
    var pl = vm(C).palle || [];
    if (pl.length !== 2 || pl.some(function (b) { return b.s !== 0; }) || contaZone(pl.map(function (b) { return b.x; })) !== contaZone([0, 4])) no("domanda 2: nel muro dei perdenti dovevano esserci le 2 palline della squadra 0 (zone 0 e 4), ci sono " + JSON.stringify(pl.map(function (b) { return [b.s, b.x]; })));
    if (!await W.aspetta(function () { return vm(C).k === 2 && vm(C).stato === "vincitori"; }, 12000)) no("domanda 2: non arriva il muro dei vincitori");
    if ((vm(C).palle || []).length) no("domanda 2: la squadra 1 ha risposto giusto ma chi è giù non ha scelto: nei vincitori non doveva cadere niente (" + vm(C).palle.length + ")");
    if (!await W.aspetta(function () { return vm(C).k === 2 && vm(C).stato === "punti"; }, 15000)) no("domanda 2: non arrivano i punteggi");
    var vp = vm(C);
    if (vp.delta[1] !== 0 || vp.punti[1] !== p1[1]) no("domanda 2: la squadra 1 senza palline ha preso punti: " + JSON.stringify(vp.delta));
    if (vp.delta[0] >= 0 || vp.punti[0] !== p1[0] + vp.delta[0]) no("domanda 2: la squadra 0 doveva perdere punti: delta " + JSON.stringify(vp.delta));
    out.push("domanda 2: senza risposta + 2 palline senza «Pronto» = cadono (" + vp.delta[0] + "); giusto senza palline = 0");
    errori();
    return out.join("; ");
  } });

  // mu9 (g): rotazione spenta, chi è giù resta quello della saletta
  COPIONE.aggiungi("mu9", { nome: "Il Muro: rotazione spenta, resta giù chi era giù in saletta", fai: async function () {
    var nomi = NOMI10.slice(0, 4), Z = await salaDi(nomi), I = await apriMuro2(Z, 4, { nsq: 2, rot: false }), C = I.C;
    await giocaTutto(C, Z, function (k, s, d, giusta, nr) {
      var ris = {}; ris[d.su[0]] = k % 2 ? giusta : (giusta + 1) % nr;
      return { ris: ris, palle: [[4], [2, 6]][(k + s) % 2], su: null };
    }, { max: 4, rot: false });
    var v = vm(C);
    v.sqd.forEach(function (d, s) { if (d.giu !== I.giu0[s]) no("la squadra " + s + ": sta giù " + nomeDi(C, d.giu) + " invece di " + nomeDi(C, I.giu0[s]) + " (quello della saletta)"); });
    errori();
    return "4 domande a rotazione spenta: in ogni squadra resta giù quello della saletta";
  } });

  // mu10 (i): argomenti spenti nelle regole: escono solo quelli accesi
  COPIONE.aggiungi("mu10", { nome: "Il Muro: argomenti spenti nelle regole, escono solo quelli accesi", fai: async function () {
    var nomi = NOMI10.slice(0, 4), Z = await salaMuro(nomi.slice(1)), tieni = ["calcio", "cucina"];
    var regola = "", I = await apriMuro2(Z, 4, { nsq: 2, tieni: tieni, prima: async function () { await W.aspetta(function () { regola = A.regoleDi(Z.w.Giulia); return /Calcio/.test(regola); }, 12000); } }), C = I.C, P = Z.w.Paky, D = P.SG_MURO_DOM, visti = {};
    var r = await giocaTutto(C, Z, function (k, s, d, giusta, nr) {
      var ris = {}; ris[d.su[0]] = giusta; return { ris: ris, palle: [4], su: null };
    }, { max: 8 });
    r.testi.forEach(function (t0, i) {
      var arg = null; for (var a in D) D[a].forEach(function (x) { if (x[1] === t0) arg = a; });
      visti[arg] = (visti[arg] || 0) + 1;
      if (tieni.indexOf(arg) < 0) no("domanda " + (i + 1) + ": «" + t0.slice(0, 50) + "» è di «" + arg + "», argomento spento");
    });
    if (Object.keys(visti).length < 2) no("in 8 domande è uscito un solo argomento acceso: " + JSON.stringify(visti));
    if (!/Calcio/.test(regola) || !/Cucina/.test(regola) || /Storia/.test(regola)) no("la riga delle regole di Giulia non dice gli argomenti scelti («" + regola + "»)");
    errori();
    return "argomenti accesi " + tieni.join("+") + ": in 8 domande " + JSON.stringify(visti) + "; regole di Giulia «" + regola + "»";
  } });

  // mu11 (j): un amico ricarica la pagina a metà domanda (nella stanza: ritrova la domanda e la sua risposta; giù: le sue palline
  //           e il suo «Pronto») e a metà rivelazione / muro
  COPIONE.aggiungi("mu11", { nome: "Il Muro: un amico ricarica a metà domanda (stanza e giù) e a metà rivelazione", fai: async function () {
    var nomi = NOMI10.slice(0, 6), Z = await salaDi(nomi), I = await apriMuro2(Z, 6, { nsq: 2, attese: [3, 3], tempo: 30 }), C = I.C, P = Z.w.Paky, out = [];
    var v = vm(C), idsPrima = ids(C, "players").slice().sort().join();
    // chi è chi (mai l'host da ricaricare)
    var d0 = v.sqd[0], d1 = v.sqd[1];
    var tuttiSu = [].concat(d0.su, d1.su).filter(function (id) { return id !== v.tiene; }), giuNH = [d0.giu, d1.giu].filter(function (id) { return id !== v.tiene; });
    var X = nomeDi(C, tuttiSu[0]), L = nomeDi(C, tuttiSu[1]), M = nomeDi(C, tuttiSu[2]), Y = nomeDi(C, giuNH[0]), Zn = giuNH[1] ? nomeDi(C, giuNH[1]) : null;
    var wX = W.finestra(X);
    await W.aspetta(function () { return wX.document.querySelectorAll(".mu-ris").length > 1; }, 6000);
    var testo = wX.document.querySelector(".mu-testo").textContent, opt = [].map.call(wX.document.querySelectorAll(".mu-ris span"), function (x) { return x.textContent; });
    // 1) X (nella stanza) risponde alla 2ª e ricarica
    tocca(wX, wX.document.querySelectorAll(".mu-ris")[1]);
    await W.dorme(500);
    if (X === "Paky") no("la prova ha scelto l'host come telefono da ricaricare");
    await W.ricarica(X);
    var okX = await W.aspetta(function () { var w = W.finestra(X); try { return w.document.querySelector(".mu-testo") && w.document.querySelector(".mu-testo").textContent === testo && w.document.querySelectorAll(".mu-ris.sel").length === 1; } catch (e) { return false; } }, 20000);
    if (!okX) no(X + " ricaricando a metà domanda non ritrova la domanda con la sua risposta («" + T(W.finestra(X)).slice(0, 150) + "»)");
    var wX2 = W.finestra(X), selI = [].indexOf.call(wX2.document.querySelectorAll(".mu-ris"), wX2.document.querySelector(".mu-ris.sel"));
    if (selI !== 1) no(X + " ritrova segnata la risposta " + selI + " invece della 2ª");
    if (ids(C, "players").slice().sort().join() !== idsPrima) no("dopo la ricarica di " + X + " i giocatori nella foto sono cambiati");
    out.push(X + " (stanza): ritrova domanda e risposta");
    // 2) Y (giù) mette 2 palline e ricarica
    var wY = W.finestra(Y);
    await W.aspetta(function () { return wY.document.querySelectorAll(".mu-z").length > 0; }, 6000);
    tocca(wY, wY.document.querySelectorAll(".mu-z")[2]); tocca(wY, wY.document.querySelectorAll(".mu-z")[6]);
    await W.dorme(700);
    await W.ricarica(Y);
    var okY = await W.aspetta(function () { var w = W.finestra(Y); try { return /Palline: 2 di 3/.test(T(w)) && w.document.querySelectorAll(".mu-z.on").length === 2; } catch (e) { return false; } }, 20000);
    if (!okY) no(Y + " (giù) ricaricando non ritrova le sue 2 palline («" + T(W.finestra(Y)).slice(0, 150) + "»)");
    out.push(Y + " (giù): ritrova le 2 palline");
    // 3) Zn (giù, altra squadra, se non è l'host) mette 1 pallina, «Pronto», ricarica
    if (Zn) {
      var wZ = W.finestra(Zn);
      await W.aspetta(function () { return wZ.document.querySelectorAll(".mu-z").length > 0; }, 6000);
      tocca(wZ, wZ.document.querySelectorAll(".mu-z")[4]); tocca(wZ, wZ.document.querySelector(".mu-pronto"));
      await W.dorme(700);
      await W.ricarica(Zn);
      var okZ = await W.aspetta(function () { var w = W.finestra(Zn); try { var b = w.document.querySelector(".mu-pronto"); return /Palline: 1 di 3/.test(T(w)) && b && b.disabled; } catch (e) { return false; } }, 20000);
      if (!okZ) no(Zn + " (giù) ricaricando dopo «Pronto» non lo ritrova fatto con la pallina («" + T(W.finestra(Zn)).slice(0, 150) + "»)");
      out.push(Zn + " (giù): ritrova pallina e «Fatto»");
    }
    // 4) gli altri finiscono la domanda: chi sta nella stanza (tranne X) risponde, chi è giù (tranne Zn) fa «Pronto»
    var e = cerca(P, testo), g = opt.indexOf(e[2]);
    [d0, d1].forEach(function (d, s) {
      d.su.forEach(function (id) { var nm = nomeDi(C, id); if (nm === X) return; var w = W.finestra(nm); tocca(w, w.document.querySelectorAll(".mu-ris")[s ? g : (g + 1) % opt.length]); });
      var nmg = nomeDi(C, d.giu); if (nmg === Zn) return;
      var wg = W.finestra(nmg), b = wg.document.querySelector(".mu-pronto"); if (b && !b.disabled) tocca(wg, b);
    });
    if (!await W.aspetta(function () { var x = vm(C); return x.k === 1 && x.stato === "svela"; }, 35000)) no("la domanda 1 non si svela (" + vm(C).stato + ")");
    // 5) a metà rivelazione ricarica L: ritrova la scena e i punti
    await W.dorme(900);
    await W.ricarica(L);
    var okL = await W.aspetta(function () { var w = W.finestra(L); try { return w.document.querySelector(".mu-scena") && /La risposta giusta|Giusto|Sbagliato|Nessuna risposta|Palline|Sei|Squadra|punti/i.test(T(w)); } catch (e2) { return false; } }, 20000);
    if (!okL) no(L + " ricaricando a metà rivelazione non ritrova la scena («" + T(W.finestra(L)).slice(0, 150) + "»)");
    // 6) nel muro ricarica M (se non è X)
    if (!await W.aspetta(function () { var x = vm(C).stato; return x === "perdenti" || x === "vincitori"; }, 15000)) no("dopo la rivelazione non arriva un muro");
    await W.ricarica(M);
    var okM = await W.aspetta(function () { var w = W.finestra(M); try { return w.document.querySelector(".mu-scena") && (w.document.querySelector(".mu-muro canvas") || /punti|Si va avanti/i.test(T(w))); } catch (e2) { return false; } }, 20000);
    if (!okM) no(M + " ricaricando nel muro non ritrova la scena («" + T(W.finestra(M)).slice(0, 150) + "»)");
    if (!await W.aspetta(function () { return vm(C).stato === "punti" && vm(C).k === 1; }, 25000)) no("non arrivano i punteggi della domanda 1");
    var vp = vm(C), somma = vp.delta.reduce(function (a, b) { return a + b; }, 0);
    if (!(JSON.stringify(vp.punti) === JSON.stringify(vp.delta))) no("i punti dopo la domanda 1 (" + JSON.stringify(vp.punti) + ") non sono i delta (" + JSON.stringify(vp.delta) + "): punti dati più volte?");
    if (!await W.aspetta(function () { return /Si va avanti tra/.test(T(W.finestra(L))) && /Si va avanti tra/.test(T(W.finestra(M))); }, 8000)) no("chi ha ricaricato non legge «Si va avanti tra…» sui punteggi");
    if (ids(C, "players").slice().sort().join() !== idsPrima) no("alla fine i giocatori nella foto sono cambiati");
    out.push(L + " (rivelazione) e " + M + " (muro) ritrovano la scena; punti dati una volta " + JSON.stringify(vp.punti));
    var er = W.erroriTel().filter(function (x) { return !/^(Paky):/.test(x); });
    if (er.length) no("errori: " + er.slice(0, 3).join(" / "));
    return out.join("; ");
  } });

  // mu12 (k): squadre tutte da 3, la partita è cominciata e arriva Sara: non entra nelle squadre, guarda ed entra alla prossima partita
  COPIONE.aggiungi("mu12", { nome: "Il Muro: squadre tutte da 3, chi arriva a partita cominciata guarda («dopo»)", fai: async function () {
    var nomi = NOMI10.slice(0, 6), Z = await salaDi(nomi), S = Z.S, I = await apriMuro2(Z, 6, { nsq: 2, attese: [3, 3] }), C = I.C, p6 = COPIONE.p6;
    var Sw = await W.apriTel("Ivo", { hash: "sala=" + S, x: 925, salaSempre: true });
    var r = await W.aspetta(function () { var x = p6.rigaInCorso(Sw); return (x && x.tasti.length ? x : null) || (Sw.document.querySelector(".mu-scena") ? { auto: true } : null); }, 15000), entrataDa = "tasto";
    if (!r) no("Ivo non vede né il riquadro della partita in corso né la partita («" + T(Sw).slice(0, 100) + "»)");
    var idS = A.idInSala(S, "Ivo");
    if (r.auto) entrataDa = "da sola (senza toccare «Entra»)";
    else if (!await W.aspetta(function () { return W.clicca(Sw, /Entra/, ".sl-incorso button"); }, 4000)) no("Ivo non trova «▶ Entra» («" + r.tasti.join(" | ") + "»)");
    if (!await W.aspetta(function () { return (vm(C).dopo || []).some(function (x) { return x.id === idS; }) || (vm(C).prossimi || []).some(function (x) { return x.id === idS; }) || ids(C, "players").indexOf(idS) >= 0; }, 12000)) no("Ivo non compare né in «dopo», né in «prossimi», né tra i giocatori");
    var v = vm(C);
    if (ids(C, "players").indexOf(idS) >= 0) no("Ivo è entrata in una squadra già da 3 (giocatori " + ids(C, "players").length + ")");
    if (!(v.dopo || []).some(function (x) { return x.id === idS; })) no("Ivo con le squadre tutte da 3 non è in «dopo» (prossimi " + JSON.stringify(v.prossimi) + ")");
    if (!await W.aspetta(function () { return /Squadre piene/.test(T(Sw)) && Sw.document.querySelector(".mu-scena"); }, 8000)) no("Ivo non legge «Squadre piene: entri alla prossima partita» («" + T(Sw).slice(0, 140) + "»)");
    if (Sw.document.querySelector(".mu-ris, .mu-z, .mu-pronto")) no("Ivo ha dei tasti da gioco");
    // la partita va avanti senza di lei per 2 domande e lei resta fuori
    await giocaTutto(C, Z, function (k, s, d, giusta, nr) { var ris = {}; ris[d.su[0]] = giusta; return { ris: ris, palle: [4], su: null }; }, { max: 2 });
    if (ids(C, "players").indexOf(idS) >= 0 || ids(C, "players").length !== 6) no("durante la partita Ivo è entrata (" + ids(C, "players").length + " giocatori)");
    if (!(vm(C).dopo || []).some(function (x) { return x.id === idS; })) no("dopo 2 domande Ivo non è più in «dopo»"); if (Sw.document.querySelector(".mu-ris, .mu-z, .mu-pronto")) no("dopo 2 domande Ivo ha dei tasti da gioco");
    errori();
    return "Ivo (entrata " + entrataDa + ") con le squadre tutte da 3: in «dopo», legge «Squadre piene: entri alla prossima partita», niente tasti, resta fuori per 2 domande (giocatori 6)";
  } });

  // mu13 (k): in saletta, 6 persone in 2 squadre da 3 e ne arriva una settima: cosa succede alle squadre
  COPIONE.aggiungi("mu13", { nome: "Il Muro: in saletta tutte le squadre da 3 e arriva una settima persona", fai: async function () {
    var nomi = NOMI10.slice(0, 6), Z = await salaDi(nomi), S = Z.S, P = Z.w.Paky, C = await A.lanciaDallaSala("Paky", S, "Il Muro"), p6 = COPIONE.p6;
    if (!await W.aspetta(function () { return ids(C, "players").length === 6; }, 15000)) no("nella saletta non sono in 6");
    var Sw = await W.apriTel("Ivo", { hash: "sala=" + S, x: 925, salaSempre: true });
    var idS = A.idInSala(S, "Ivo");
    var r = await W.aspetta(function () { return Sw.document.querySelector(".mu-squadre") || p6.rigaInCorso(Sw) || null; }, 15000), entrataDa = "da sola";
    if (!r) no("Ivo non vede né la saletta del Muro né un riquadro («" + T(Sw).slice(0, 120) + "»)");
    if (!Sw.document.querySelector(".mu-squadre")) { entrataDa = "col tasto («" + r.tasti.join(" | ") + "»)"; if (!await W.aspetta(function () { return W.clicca(Sw, /Entra/, ".sl-incorso button"); }, 4000)) no("Ivo non trova «Entra» («" + r.tasti.join(" | ") + "»)"); }
    if (!await W.aspetta(function () { return ids(C, "players").length === 7 && ids(C, "players").indexOf(idS) >= 0; }, 15000)) no("Ivo non entra nella saletta (giocatori " + ids(C, "players").length + ")");
    await W.dorme(500);
    var v = vm(C), tag = []; for (var s = 0; s < v.nsq; s++) tag.push(v.players.filter(function (p) { return p.sq === s; }).length);
    var testoP = T(P).slice(0, 400);
    var cominciaOn = !!W.clicca ? !!P.document.querySelector(".sl-go:not([disabled])") : null;
    if (v.nsq < 3) no("con 7 persone le squadre sono ancora " + v.nsq + " " + JSON.stringify(tag) + " (nsq " + v.nsq + "): una squadra da " + Math.max.apply(null, tag) + "?");
    if (Math.max.apply(null, tag) > 3) no("c'è una squadra da " + Math.max.apply(null, tag) + " persone: " + JSON.stringify(tag));
    errori();
    return "7 persone in saletta (Ivo entra " + entrataDa + "): squadre " + JSON.stringify(tag) + ", «Comincia» " + (cominciaOn ? "acceso" : "spento") + "; saletta di Paky: «" + testoP.replace(/\s+/g, " ").slice(0, 230) + "»";
  } });

})();
