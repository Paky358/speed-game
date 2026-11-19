// 📐 LA GIORNATA IN PROSPETTIVA (19 nov 2026, il proprietario ha scelto la prospettiva «forte»: solo per il suo account, interruttore
// PROSPETTIVA in asta.js). Le azioni non cambiano: cambia solo come si disegna il campo (telecamera dietro la porta, porta vera in piedi).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-prospettiva.js"); await COPIONE.prova("pr1")
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta-prospettiva.js --prova pr1
//
// pr1 Sul campo vero del gioco (360x560) in prospettiva, per 35 azioni × 3 semi × verso in su e in giù × 7 esiti: nel momento in cui il
//     pallone arriva sulla porta, sullo schermo il palo è ESATTAMENTE sul palo disegnato, la traversa sulla traversa, il gol tra i pali e
//     sotto la traversa, il fuori fuori dai pali, l'alto sopra la traversa; verso il basso la porta è in basso (da dietro la porta), verso
//     l'alto è nella metà di sopra (da dietro chi attacca, sotto la barra del minuto); fino al tiro la telecamera è identica per tutti gli
//     esiti (niente spoiler); l'interruttore (dal 19 nov 2026 sera «tutti»: tutti in prospettiva); al tiro la telecamera si avvicina (larga
//     prima, vicina dopo: la telecamera uguale per tutti gli esiti vuol dire anche che l'avvicinamento parte per tutti nello stesso istante).
// pr2 Online in 2 (IL PAPPONE tiene la partita, Giulia entra): l'asta veloce, poi la giornata dal vivo per 30 secondi. Il campo è in
//     prospettiva su tutti e due i telefoni se PROSPETTIVA è «tutti» (se è «proprietario», solo su quello di IL PAPPONE); nessun errore; le azioni vanno avanti su tutti e due.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  async function motore(w) {
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "function costruisciMazzoFanta(n) {";
    if (src.indexOf(ag) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    if (src.indexOf("function porta3D(") < 0) no("nel gioco non c'è la porta in prospettiva");
    src = src.replace(ag, "FUORI.scena = scena; FUORI.campo = campoAzioni; FUORI.prosp = prospettivaPer; FUORI.GL = GL; FUORI.PROSPETTIVA = PROSPETTIVA; " + ag);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, F);
    return F;
  }
  var SCENE = ["cross", "angolo", "unodue", "contro", "pallonetto", "fuori", "slalom", "punizione", "tapin", "centrocampo", "mischia", "testa", "incrocio", "miracolo", "assedio", "ultimo",
    "secondopalo", "presa", "tuffo", "vuota", "tre", "filtrante", "rasoterra", "giro", "muro", "corta", "volee", "pressing", "laterale", "papera", "glt", "ribattuta", "fuga", "rimessa", "rimessalunga"];
  var ESITI = ["gol", "parata", "palo", "traversa", "fuori", "alto", "linea"];
  function dove(pts, t) {   // dov'è il pallone al tempo t (come sp1)
    if (t <= pts[0][0]) return pts[0].slice(1, 4);
    for (var i = 1; i < pts.length; i++) if (t <= pts[i][0]) { var a = pts[i - 1], b = pts[i], k = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 1; return a.slice(1, 4).map(function (v, j) { return v + (b[j + 1] - v) * k; }); }
    return pts[pts.length - 1].slice(1, 4);
  }
  function diversi(a, b) { for (var i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 1e-6) return true; return false; }
  COPIONE.aggiungi("pr1", { nome: "📐 La giornata in prospettiva: palo, traversa, gol, fuori e alto proprio sui legni disegnati, verso la porta in basso e quella in alto, telecamera uguale fino al tiro", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), d = w.document, ko = [], conti = { palo: 0, traversa: 0, gol: 0, fuori: 0, alto: 0 }, cam = 0, avv = 0, diffV = {};
    // l'interruttore
    var tP = { nomeProfilo: function () { return "IL PAPPONE"; } }, tA = { nomeProfilo: function () { return "Paky"; } };
    if (!M.prosp(tP) || M.prosp(tA) !== (M.PROSPETTIVA === "tutti")) no("l'interruttore («" + M.PROSPETTIVA + "»): IL PAPPONE " + M.prosp(tP) + ", Paky " + M.prosp(tA));
    var box = d.createElement("div"); box.style.cssText = "position:fixed;left:0;top:0;width:360px;height:560px;z-index:99999"; d.body.appendChild(box);
    var el = function (tag, a) { var e = d.createElement(tag); if (a && a.class) e.className = a.class; return e; };
    var az = M.campo(el, box); az.ps = true; az.misura();
    var KIT = { a: "#e0225a", b: "#ffffff" }, KIT2 = { a: "#1c7ed6", b: "#ffffff" }, POR = { a: "#2b8a3e", b: "#ffffff" };
    function nuova(es, v, seme, verso) {
      var sc = M.scena(es === "gol" ? "gol" : "occ", v, es, null, { tira: null, passa: null, para: null }, { verso: verso, lato: seme % 2 ? 1 : -1, seme: seme * 7919, lento: true });
      sc.kA = KIT; sc.kD = KIT2; sc.pA = POR; sc.pD = POR; sc.noti = []; return sc;
    }
    function primoSullaPorta(sc) { return sc.palla.filter(function (b) { return b[0] >= (sc.tiroDa || 0) && Math.abs(b[1] - 0.5) < 0.2 && Math.abs(b[2] - M.GL) < 0.0045; })[0] || null; }   // (il tiro sulla porta: non il calcio d'angolo, che parte dalla stessa linea)
    SCENE.forEach(function (v) {
      for (var seme = 1; seme <= 3 && ko.length < 400; seme++) [1, -1].forEach(function (verso) {
        var sc = ESITI.map(function (es) { return nuova(es, v, seme, verso); }), qui = v + " seme " + seme + (verso < 0 ? " (verso l'altra porta)" : "");
        // fino a quando il pallone prende strade diverse (come sp1: il tiro, o l'uscita del portiere) la telecamera è la stessa per tutti gli esiti (entro mezzo pixel: il pallone fa una curva morbida che guarda un filo avanti, anche nel campo di sempre)
        az.foto(sc[0], 0);
        for (var i = 1; i < sc.length; i++) {
          var tPalla = 1; for (var t = 0; t <= 1; t += 0.0025) if (diversi(dove(sc[0].palla, t), dove(sc[i].palla, t))) { tPalla = t; break; }
          for (var p = 0; p < tPalla - 0.005; p += 0.02) {
            var c0 = az.camera(sc[0], p), ci = az.camera(sc[i], p);
            if (Math.abs(c0.cx - ci.cx) > 0.5 || Math.abs(c0.cy - ci.cy) > 0.5 || Math.abs(c0.z - ci.z) > 1e-4) { ko.push(qui + ": a " + p.toFixed(2) + " la telecamera col gol " + JSON.stringify(c0) + " e con " + ESITI[i] + " " + JSON.stringify(ci) + " (il pallone uguale fino a " + tPalla.toFixed(3) + ")"); break; }
            cam++;
          }
        }
        // 🎥 (19 nov 2026 sera) larga mentre si costruisce, vicina dal tiro: l'avvicinamento c'è (e per la telecamera uguale qui sopra parte per tutti nello stesso istante)
        // 🎥 (20 nov 2026, il Cervello: «le scene che segnano senza un tiro vero… quando NON finiscono in gol hanno un tiro?») l'avvicinamento parte nello
        // STESSO istante in tutti gli esiti della scena: mai solo in quelli col tiro mentre il gol aspetta la rete (o il contrario)
        var stV = sc.map(function (s) { var t = s.tVicino != null ? s.tVicino : s.tiroDa != null ? s.tiroDa : s.calcio; return t == null ? null : Math.round(t * 1e6) / 1e6; }), nnV = stV.filter(function (t) { return t != null; });
        if (nnV.length && (nnV.length < stV.length || nnV.some(function (t) { return t !== nnV[0]; }))) { ko.push(qui + ": l'avvicinamento parte in momenti diversi (" + ESITI.map(function (e, i) { return e + " " + (stV[i] == null ? "al gol" : stV[i]); }).join(", ") + ")"); diffV[v] = (diffV[v] || 0) + 1; }
        var tT = sc[0].tVicino != null ? sc[0].tVicino : sc[0].tiroDa != null ? sc[0].tiroDa : sc[0].calcio;
        if (tT != null && tT > 0.05) { var zA = az.camera(sc[0], tT - 0.02).z, zB = az.camera(sc[0], Math.min(0.99, tT + 0.1)).z; if (zB / zA < 1.15) ko.push(qui + ": al tiro la telecamera non si avvicina (" + zA.toFixed(2) + " → " + zB.toFixed(2) + ")"); else avv++; }
        // nel momento in cui il pallone arriva sulla porta
        sc.forEach(function (s, i) {
          var es = ESITI[i], b = primoSullaPorta(s); if (!b || !(es in conti)) return;
          az.foto(s, b[0]); var P = az.porta, q = az.dove; if (!P || !q) { ko.push(qui + " " + es + ": niente porta o pallone"); return; }
          var sx = P.pali[0] < P.pali[1] ? P.pali : [P.pali[1], P.pali[0]], dx = Math.abs(b[1] - 0.5), mezzo = P.sp / 2;
          if (verso > 0 && P.terra < az.h * 0.55) ko.push(qui + " " + es + ": la porta non è in basso (" + Math.round(P.terra) + " su " + az.h + ")");
          if (verso < 0 && (P.terra > az.h * 0.62 || P.trav < 24)) ko.push(qui + " " + es + ": la porta in alto non è nella metà di sopra, sotto la barra (traversa " + Math.round(P.trav) + ", terra " + Math.round(P.terra) + " su " + az.h + ")");
          if (es === "palo" && Math.abs(dx - 0.084) < 0.002) { conti.palo++; var dp = Math.min(Math.abs(q[0] - sx[0]), Math.abs(q[0] - sx[1])); if (dp > 0.6 || q[1] < P.trav || q[1] > P.terra) ko.push(qui + " palo: il pallone a " + Math.round(q[0]) + "," + Math.round(q[1]) + ", i pali a " + sx.map(Math.round) + " (traversa " + Math.round(P.trav) + ", terra " + Math.round(P.terra) + ")"); }
          if (es === "traversa") { conti.traversa++; if (Math.abs(q[1] - P.trav) > 0.6 || q[0] < sx[0] || q[0] > sx[1]) ko.push(qui + " traversa: il pallone a " + Math.round(q[0]) + "," + Math.round(q[1]) + ", la traversa a " + Math.round(P.trav)); }
          if (es === "gol" && dx < 0.084 && Math.abs((b[3] || 0) - 2.44) < 0.03) { conti.traversa++; if (Math.abs(q[1] - P.trav) > 0.6) ko.push(qui + " traversa e dentro: il pallone a " + Math.round(q[1]) + ", la traversa a " + Math.round(P.trav)); return; }   // (traversa e dentro, come nella goal-line: il pallone sulla traversa)
          if (es === "gol" && dx < 0.084) { conti.gol++; if (q[0] < sx[0] + mezzo || q[0] > sx[1] - mezzo || q[1] < P.trav + mezzo || q[1] > P.terra + 1) ko.push(qui + " gol: il pallone a " + Math.round(q[0]) + "," + Math.round(q[1]) + ", fuori dalla porta " + sx.map(Math.round) + " / " + Math.round(P.trav) + "-" + Math.round(P.terra)); }
          if (es === "fuori") { conti.fuori++; if (q[0] > sx[0] - mezzo && q[0] < sx[1] + mezzo) ko.push(qui + " fuori: il pallone a " + Math.round(q[0]) + " tra i pali " + sx.map(Math.round)); }
          if (es === "alto") { conti.alto++; if (q[1] > P.trav - mezzo) ko.push(qui + " alto: il pallone a " + Math.round(q[1]) + " non sopra la traversa " + Math.round(P.trav)); }
        });
      });
    });
    box.remove();
    if (ko.length) no((Object.keys(diffV).length ? "scene con l'avvicinamento in momenti diversi: " + JSON.stringify(diffV) + " · " : "") + ko.slice(0, 4).join(" · "));
    if (conti.palo < 30 || conti.traversa < 30 || conti.gol < 30 || conti.fuori < 30 || conti.alto < 30) no("troppo pochi casi: " + JSON.stringify(conti));
    return "interruttore «" + M.PROSPETTIVA + "»: IL PAPPONE sì, gli altri " + (M.prosp(tA) ? "sì" : "no") + " · sui legni disegnati: " + conti.palo + " pali, " + conti.traversa + " traverse, " + conti.gol + " gol tra i pali, " + conti.fuori + " fuori, " + conti.alto + " alti (verso la porta in basso e verso quella in alto) · telecamera uguale per i 7 esiti finché il pallone è lo stesso in " + cam + " momenti · al tiro la telecamera si avvicina in " + avv + " azioni (larga mentre si costruisce)";
  } });
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s2) { return w.document.querySelector(s2); }
  function qa(w, s2) { return [].slice.call(w.document.querySelectorAll(s2)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  COPIONE.aggiungi("pr2", { nome: "📐 La giornata online in 2: la prospettiva su chi deve averla (con «tutti» su tutti e due), nessun errore", fai: async function () {
    var NOMI = ["IL PAPPONE", "Giulia"], errori = [], imp = { formato: "fanta" };
    var prima = function (w) { w.addEventListener("error", function (e) { errori.push((e.message || "errore") + " @" + (e.lineno || "")); }); };
    var P = await W.apriTel(NOMI[0], { x: 0, pa: true, prima: function (w) { w.__imp = imp; prima(w); } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    await W.apriTel(NOMI[1], { hash: "gioco=astafanta&stanza=" + C, x: 230, prima: prima });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 2; }, 15000)) no("non entrano in 2");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "asta" && vm(C).asta; }, 20000)) no("l'asta non comincia");
    var fino = Date.now() + 300000, visti = {}, idG = A.mioId("Giulia");
    while (Date.now() < fino && vm(C).fase !== "fine") {   // (l'asta veloce: uno offre, l'altro passa)
      var v = vm(C), a = v.asta;
      if (v.fase !== "asta" || !a || visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) { await W.dorme(150); continue; }
      visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
      var el2 = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
      if (!a.leaderId) { var pr = el2[a.nCarta % 2] || el2[0]; if (pr === "Giulia") W.reteDi("Giulia").invia({ t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta }); else if (pr) { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } }
      else el2.forEach(function (n) { var id = n === "Giulia" ? idG : "host"; if (id === a.leaderId) return; if (n === "Giulia") W.reteDi("Giulia").invia({ t: "passa", n: a.nCarta }); else { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } });
      await W.dorme(250);
    }
    if (vm(C).fase !== "fine") no("l'asta non finisce");
    if (!await W.aspetta(function () { return q(P, ".st-rivela"); }, 15000)) no("niente classifica delle rose");
    for (var k2 = 0; k2 < 20 && !q(P, ".st-gio-riga"); k2++) { W.clicca(P, /Salta/); await W.dorme(500); }
    var G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return q(P, "canvas.st-az[data-prosp]") && q(G, "canvas.st-az[data-prosp]"); }, 30000)) no("la giornata non parte su tutti e due");
    var cP = q(P, "canvas.st-az"), cG = q(G, "canvas.st-az"), src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), TUTTI = /var PROSPETTIVA = "tutti"/.test(src);
    var foto = function (c) { var x = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, s3 = 0; for (var i = 0; i < x.length; i += 4000) s3 = (s3 * 31 + x[i] + x[i + 1] * 3 + x[i + 2] * 7) % 1000000007; return s3; };
    var f0 = [foto(cP), foto(cG)], cambiP = 0, cambiG = 0;
    for (var t = 0; t < 30; t++) { await W.dorme(1000); var f1 = [foto(cP), foto(cG)]; if (f1[0] !== f0[0]) cambiP++; if (f1[1] !== f0[1]) cambiG++; f0 = f1; if (cP.getAttribute("data-prosp") !== "1") no("sul telefono di IL PAPPONE il campo non è in prospettiva"); if (cG.getAttribute("data-prosp") !== (TUTTI ? "1" : "0")) no("Giulia vede il campo " + (TUTTI ? "di sempre" : "in prospettiva")); }
    if (errori.length) no("errori: " + errori.slice(0, 4).join(" · "));
    if (cambiP < 8 || cambiG < 8) no("le azioni non vanno avanti (secondi in cui il campo cambia: IL PAPPONE " + cambiP + ", Giulia " + cambiG + " su 30)");
    return "IL PAPPONE in prospettiva, Giulia " + (TUTTI ? "anche (PROSPETTIVA «tutti»)" : "come sempre") + "; in 30 secondi di giornata il campo è cambiato " + cambiP + " e " + cambiG + " volte, nessun errore";
  } });
})();
