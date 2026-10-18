// PROVE "FACCINE E FRASI IN PARTITA" + "SCOPA IN TRE" (miglioramenti dai confronti con gli originali, 15 ott 2026).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora/adue-faccine.js"); await COPIONE.prova(801)
//
// 801 Scopa in tre contro due Bot (stesso telefono): «Come giocate?» → «In tre contro due Bot», una mano intera fino al
//     riepilogo a tre colonne, 💬 (fumetto sopra la mensola, a volte risponde un Bot), niente scorre a 360x640 e 412x915.
// 802 Scopa a due contro il Bot: 💬 c'è, la frase compare sopra la mensola, la partita va avanti fino alla fine.
// 803 Tris, Drop 4, Battaglia Navale, Calcio Biliardo contro il Bot: 💬 durante la partita, fumetto vicino a chi parla,
//     nessun errore; a 360x640 il tasto si vede e niente scorre.
// 804 Online a due (Tris, Drop 4, Navale, Calcio Biliardo, Scopa): l'host e l'ospite si mandano faccine e frasi; il fumetto
//     arriva sull'altro telefono vicino a chi l'ha mandata; chi guarda nella stanza le vede; l'host spegne 💬 nel ⚙️ e il
//     tasto sparisce anche all'ospite; l'ospite ricarica la pagina e il 💬 c'è ancora.
// 805 Scopa in tre online: Paky apre (⚙️ «In tre»), Giulia e Luca entrano dal link, partita fino al riepilogo, 💬 tra i tre;
//     Luca ricarica a metà e ritrova le sue carte; poi esce e al suo posto gioca il Bot; un quarto (Marco) entra e guarda.
// 806 Scopa: in saletta l'host passa da «In due» a «In tre» e ritorno con gli amici dentro: nessuno esce, tutti seduti.
// 807 Torneo a eliminazione (Tris): chi guarda la partita manda una faccina 👏 e i due che giocano la vedono col suo nome.
// 808 Sala: Scopa con Giulia, arriva Luca, ⚙️ «In tre», partita intera in tre, ↻ Rivincita e si riparte in tre.
// 809 Sala in tre → Scopa: «In tre: giocate tutti» già scelto, tutti e tre al tavolo (serve la riga del core).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;

  // ---- aiuti ----
  // dalla home al tavolo: tessera del gioco → modo (regex) → prepara(w) (scelte nelle impostazioni) → Comincia
  async function avviaLocale(w, nomeGioco, modo, prepara) {
    var tess = await W.aspetta(function () { return A.tessera(w, nomeGioco); }, 6000);
    if (!tess) no("non trovo la tessera di " + nomeGioco);
    tess.click(); await W.dorme(450);
    if (!W.clicca(w, modo, ".modo-grande")) no(nomeGioco + ": in «Come giocate?» non c'è " + modo);
    await W.dorme(450);
    if (prepara) { prepara(w); await W.dorme(150); }
    if (!W.clicca(w, /Comincia|Gioca|Avanti/)) no(nomeGioco + ": non trovo «Comincia» («" + T(w).slice(0, 80) + "»)");
    await W.dorme(900);
  }
  // il tasto 💬 visibile (o null)
  function tasto(w) { return [].find.call(w.document.querySelectorAll(".sgc-tasto"), function (b) { return !b.hidden && b.offsetParent !== null; }) || null; }
  // tocca 💬 e poi la faccina (f0…f5) o la frase (p0…p7)
  async function chiac(w, c) {
    var b = tasto(w); if (!b) return false;
    b.click(); await W.dorme(150);
    var i = +c.slice(1), lista = w.document.querySelectorAll(c.charAt(0) === "f" ? ".sgc-fac button" : ".sgc-frasi button");
    if (!lista[i]) return false;
    lista[i].click(); await W.dorme(120);
    return true;
  }
  function bolle(w) { return [].map.call(w.document.querySelectorAll(".sgc-bolla"), function (b) { return b.textContent; }); }
  function volanti(w) { return [].map.call(w.document.querySelectorAll(".sg-fa-volante"), function (b) { return b.textContent; }); }
  // un fumetto con quel testo (aspetta un po')
  async function vedeBolla(w, re, ms) { return !!(await W.aspetta(function () { return bolle(w).some(function (x) { return re.test(x); }); }, ms || 3000)); }
  async function vedeVolante(w, re, ms) { return !!(await W.aspetta(function () { return volanti(w).some(function (x) { return re.test(x); }); }, ms || 3000)); }
  // il fumetto sta vicino all'ancora (sopra o sotto, entro "gap" px) e dentro lo schermo
  function bollaVicino(w, re, anc, gap) {
    var b = [].find.call(w.document.querySelectorAll(".sgc-bolla"), function (x) { return re.test(x.textContent); });
    if (!b || !anc) return "manca il fumetto o il suo posto";
    var r = b.getBoundingClientRect(), a = anc.getBoundingClientRect(), W2 = w.innerWidth, H2 = w.innerHeight;
    if (r.left < 0 || r.right > W2 + 1 || r.top < 0 || r.bottom > H2 + 1) return "il fumetto esce dallo schermo";
    var d = Math.min(Math.abs(r.bottom - a.top), Math.abs(r.top - a.bottom));
    if (d > (gap || 30)) return "il fumetto è lontano da chi parla (" + Math.round(d) + " px)";
    return "";
  }
  // misura: il telefono a larg x alt; niente scorre (la pagina) e "fondo" (selettore) resta dentro lo schermo
  async function misura(w, nome, larg, alt, fondo) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(900);
    if (d.documentElement.scrollHeight > alt + 1) return larg + "x" + alt + ": la pagina scorre (" + d.documentElement.scrollHeight + " px)";
    var n = fondo ? d.querySelector(fondo) : null;
    if (fondo && !n) return larg + "x" + alt + ": non trovo " + fondo;
    if (n && n.getBoundingClientRect().bottom > alt + 1) return larg + "x" + alt + ": " + fondo + " esce dallo schermo";
    var b = tasto(w);
    if (b) { var r = b.getBoundingClientRect(); if (r.right > larg + 1 || r.bottom > alt + 1 || r.top < 0) return larg + "x" + alt + ": il tasto 💬 esce dallo schermo"; }
    return "";
  }
  function rimetti(nome) { var f = document.getElementById("tel-" + nome); if (f) { f.style.width = "360px"; f.style.height = "740px"; } }
  // Scopa (a due o in tre) sullo stesso telefono: gioca la prima carta quando tocca a te, sceglie la presa se serve,
  // al riepilogo tocca «Continua». Finisce alla schermata finale (true) o dopo ms
  async function scopaFinoAllaFine(w, ms) {
    var fino = Date.now() + (ms || 120000);
    while (Date.now() < fino) {
      var t = T(w);
      if (/Hai vinto!|Ha vinto|Pareggio!/.test(t) && !/Continua/.test(t)) return true;
      if (/Fine smazzata/.test(t)) { W.clicca(w, /Continua/); await W.dorme(500); continue; }
      var mens = w.document.querySelector(".sc-mensola1.tuo");
      if (mens) {
        var verde = w.document.querySelector(".sc-carta.cap");
        if (verde) { verde.click(); await W.dorme(250); continue; }
        var c = mens.querySelector(".sc-carta:not(.inviata):not(.sel)");
        if (c) { c.click(); await W.dorme(300); continue; }
      }
      await W.dorme(200);
    }
    return false;
  }
  W.ADUE = { avviaLocale: avviaLocale, tasto: tasto, chiac: chiac, bolle: bolle, volanti: volanti, vedeBolla: vedeBolla, vedeVolante: vedeVolante,
    bollaVicino: bollaVicino, misura: misura, rimetti: rimetti, scopaFinoAllaFine: scopaFinoAllaFine };

  // 801. Scopa in tre contro due Bot
  COPIONE.aggiungi(801, { nome: "Scopa in tre contro due Bot: una mano intera, 💬, riepilogo a tre, a misura", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    await avviaLocale(P, "Scopa", /In tre contro due Bot/, function (w) { W.clicca(w, /^Una mano$/); });
    if (!await W.aspetta(function () { return P.document.querySelector(".sc-mensola1") && P.document.querySelectorAll(".sc-targa4").length === 2; }, 5000)) no("il tavolo a tre non c'è («" + T(P).slice(0, 80) + "»)");
    var nomi = [].map.call(P.document.querySelectorAll(".sc-targa4 .sc-nome"), function (x) { return x.textContent; });
    if (nomi.some(function (n) { return /Matt/.test(n); })) no("un bot si chiama Matt");
    // a misura
    var e1 = await misura(P, "Paky", 360, 640, ".sc-mensola"), e2 = await misura(P, "Paky", 412, 915, ".sc-mensola");
    if (e1 || e2) no(e1 || e2);
    rimetti("Paky"); P.dispatchEvent(new P.Event("resize")); await W.dorme(500);
    // 💬: una frase, il fumetto sopra la mensola
    if (!tasto(P)) no("non c'è il tasto 💬");
    if (!await chiac(P, "p0")) no("il foglio 💬 non si apre o non ha le frasi");
    if (!await vedeBolla(P, /Bella!/)) no("il fumetto «Bella!» non compare");
    var v = bollaVicino(P, /Bella!/, P.document.querySelector(".sc-mensola"), 40); if (v) no(v);
    if (!await scopaFinoAllaFine(P, 150000)) no("la mano non finisce («" + T(P).slice(0, 80) + "»)");
    var t = T(P);
    if (!/Carte/.test(t) || !/Primiera/.test(t) || !/Settebello/.test(t)) no("il riepilogo non ha le righe dei punti");
    var testa = P.document.querySelector(".sc3-riep .sc-rg.testa");
    if (!testa || testa.children.length !== 4) no("il riepilogo non ha tre colonne");
    var err = await misura(P, "Paky", 360, 640, ".schermata .piede"); if (err) no("riepilogo " + err);
    rimetti("Paky");
    // «Nuova partita»: di nuovo al tavolo a tre
    P.dispatchEvent(new P.Event("resize")); await W.dorme(300);
    if (!W.clicca(P, /Nuova partita/)) no("a fine partita non c'è «Nuova partita»");
    if (!await W.aspetta(function () { return alTavolo3(P); }, 5000)) no("«Nuova partita» non riporta al tavolo a tre");
    return "una mano a tre (" + nomi.join(", ") + "), «" + t.slice(0, 60) + "…», fumetto «Bella!» sopra la mensola, niente scorre";
  } });

  // contro il Bot: manda frasi finché il Bot risponde (risponde 6 volte su 10): true se si è visto il suo fumetto
  async function rispondeIlBot(w, c, anc) {
    for (var i = 0; i < 8; i++) {
      await chiac(w, c);
      var visto = await W.aspetta(function () {
        return [].some.call(w.document.querySelectorAll(".sgc-bolla"), function (b) { return b._ancora && anc() && b._ancora === anc(); });
      }, 1900);
      if (visto) return true;
      await W.dorme(200);
    }
    return false;
  }

  // 802. Scopa a due contro il Bot
  COPIONE.aggiungi(802, { nome: "Scopa a due contro il Bot: 💬, il Bot risponde, partita fino alla fine", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    await avviaLocale(P, "Scopa", /Contro il computer/, function (w) { W.clicca(w, /^Una mano$/); });
    if (!await W.aspetta(function () { return P.document.querySelector(".sc-mensola1 .sc-carta"); }, 6000)) no("il tavolo a due non c'è");
    if (!tasto(P)) no("non c'è il tasto 💬");
    var e1 = await misura(P, "Paky", 360, 640, ".sc-mensola"); if (e1) no(e1);
    rimetti("Paky"); P.dispatchEvent(new P.Event("resize")); await W.dorme(400);
    if (!await chiac(P, "p6")) no("il foglio 💬 non si apre");
    if (!await vedeBolla(P, /settebello è mio/)) no("il fumetto non compare");
    var v = bollaVicino(P, /settebello è mio/, P.document.querySelector(".sc-mensola"), 40); if (v) no(v);
    await W.dorme(1100);
    if (!await rispondeIlBot(P, "f1", function () { return P.document.querySelector(".sc-targa"); })) no("il Bot non risponde mai");
    if (!await scopaFinoAllaFine(P, 120000)) no("la partita non finisce");
    return "fumetto sopra la mensola, il Bot risponde sotto la sua targa, partita finita («" + T(P).slice(0, 40) + "…»)";
  } });

  // 803. Tris, Drop 4, Battaglia Navale, Calcio Biliardo contro il Bot
  COPIONE.aggiungi(803, { nome: "Tris, Drop 4, Navale, Calcio Biliardo contro il Bot: 💬 e risposta del Bot, a misura", fai: async function (opz) {
    var GIOCHI = [
      { id: "tris", nome: "Tris", modo: /Contro il computer/, tavolo: ".tr-griglia", mio: ".tr-g.X", suo: ".tr-g.O", frase: "p1", re: /Bella mossa!/ },
      { id: "drop4", nome: "Drop 4", modo: /Contro il computer/, tavolo: ".d4-tav", mio: ".d4-g.G", suo: ".d4-g.B", frase: "p2", re: /Ti blocco!/ },
      { id: "navale", nome: "Battaglia Navale", modo: /Contro il Bot/, tavolo: ".nav-pann", mio: ".nav-mini", suo: ".nav-wrap .nav-board", frase: "p0", re: /Acqua!/,
        prima: async function (w) { W.clicca(w, /A caso/); await W.dorme(200); W.clicca(w, /Pronto, si combatte/); await W.dorme(900); } },
      { id: "calciobiliardo", nome: "Calcio Biliardo", modo: /Contro il computer/, tavolo: ".cb-campo", mio: ".cb-targa.giu", suo: ".cb-targa.su", frase: "p0", re: /Che gol!/ }
    ].filter(function (g) { return !opz || !opz.solo || opz.solo.indexOf(g.id) >= 0; });
    var fatti = [];
    for (var i = 0; i < GIOCHI.length; i++) {
      var g = GIOCHI[i];
      var P = await W.apriTel("Paky", { x: 0 });   // (ogni gioco su un telefono appena aperto)
      await avviaLocale(P, g.nome, g.modo);
      if (g.prima) await g.prima(P);
      if (!await W.aspetta(function () { return P.document.querySelector(g.tavolo); }, 6000)) no(g.nome + ": il tavolo non c'è («" + T(P).slice(0, 60) + "»)");
      if (!await W.aspetta(function () { return tasto(P); }, 3000)) no(g.nome + ": non c'è il tasto 💬");
      var e1 = await misura(P, "Paky", 360, 640, g.tavolo); if (e1) no(g.nome + " " + e1);
      var e2 = await misura(P, "Paky", 412, 915, g.tavolo); if (e2) no(g.nome + " " + e2);
      rimetti("Paky"); P.dispatchEvent(new P.Event("resize")); await W.dorme(500);
      if (!await chiac(P, g.frase)) no(g.nome + ": il foglio 💬 non si apre");
      if (!await vedeBolla(P, g.re)) no(g.nome + ": il fumetto non compare");
      var v = bollaVicino(P, g.re, P.document.querySelector(g.mio), 40); if (v) no(g.nome + ": " + v);
      await W.dorme(1100);
      if (!await rispondeIlBot(P, "f4", function () { return P.document.querySelector(g.suo); })) no(g.nome + ": il Bot non risponde mai");
      if ((P.__err || []).length) no(g.nome + ": errori " + P.__err.slice(0, 2).join(" / "));
      fatti.push(g.nome);
    }
    return "💬, fumetto vicino a chi parla e risposta del Bot: " + fatti.join(", ");
  } });

  // i giochi a due online: come si comincia, dove compare il fumetto dell'altro (avv) e quello dell'host per chi guarda (spett)
  var ONLINE = [
    { id: "tris", nome: "Tris", avv: function (w, io) { return w.document.querySelector(io === "host" ? ".tr-g.O" : ".tr-g.X"); }, spett: ".tr-g.X" },
    { id: "drop4", nome: "Drop 4", avv: function (w, io) { return w.document.querySelector(io === "host" ? ".d4-g.B" : ".d4-g.G"); }, spett: ".d4-g.G" },
    { id: "navale", nome: "Battaglia Navale", avv: function (w) { return w.document.querySelector(".nav-wrap .nav-board"); }, spett: ".nav-guarda-lato",
      dopo: async function (P, G) {   // tutti e due sistemano le navi a caso e sono pronti
        for (var k = 0; k < 2; k++) {
          var w = k ? G : P;
          if (!await W.aspetta(function () { return W.clicca(w, /A caso/); }, 6000)) no("Navale: non trovo «A caso»");
          await W.dorme(200);
          if (!await W.aspetta(function () { return W.clicca(w, /Pronto, si combatte/); }, 3000)) no("Navale: non trovo «Pronto»");
        }
      } },
    { id: "calciobiliardo", nome: "Calcio Biliardo", avv: function (w) { return w.document.querySelector(".cb-targa.su"); }, spett: ".cb-targa.giu" },
    { id: "scopa", nome: "Scopa", avv: function (w) { return w.document.querySelector(".sc-targa"); }, spett: ".sc-targa" }
  ];
  function online(id) { return ONLINE.filter(function (g) { return g.id === id; })[0]; }
  // l'host apre la stanza del gioco, Giulia entra dal link; spegni = prima di cominciare l'host spegne 💬 nel ⚙️
  async function stanzaADue(g, spegni) {
    var P = await W.apriTel("Paky", { x: 0 });
    var C = await W.apriStanza(P, g.nome);
    var G = await W.apriTel("Giulia", { hash: "gioco=" + g.id + "&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return /collegato|Comincia/.test(T(P)) && P.document.querySelectorAll(".sl-av:not(.sl-vuoto)").length >= 2; }, 8000)) no(g.nome + ": Giulia non entra nella saletta");
    if (spegni) {
      await regola(P, /🤐 No/);
    }
    await W.dorme(300);
    if (!W.clicca(P, /Comincia/)) no(g.nome + ": non trovo «Comincia»");
    await W.dorme(1200);
    if (g.dopo) await g.dopo(P, G);
    return { P: P, G: G, C: C };
  }

  // 804. Online a due: faccine e frasi tra host, ospite e chi guarda; ricarica; ⚙️ spento
  COPIONE.aggiungi(804, { nome: "Online a due (Tris, Drop 4, Navale, Calcio Biliardo, Scopa): 💬 tra i telefoni, chi guarda, ricarica, ⚙️ spento", fai: async function (opz) {
    var lista = ONLINE.filter(function (g) { return !opz || !opz.solo || opz.solo.indexOf(g.id) >= 0; }), fatti = [];
    for (var i = 0; i < lista.length; i++) {
      var g = lista[i];
      A.pulisci();
      var S = await stanzaADue(g), P = S.P, G = S.G;
      if (!await W.aspetta(function () { return tasto(P) && tasto(G); }, 8000)) no(g.nome + ": il tasto 💬 non c'è (host " + !!tasto(P) + ", ospite " + !!tasto(G) + ")");
      // l'host manda una frase: Giulia la vede vicino all'host
      await chiac(P, "p1");
      var fraseP = P.SGChiacchiere.FRASI[g.id][1];
      if (!await vedeBolla(G, new RegExp(fraseP.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))) no(g.nome + ": Giulia non vede «" + fraseP + "»");
      var v1 = bollaVicino(G, new RegExp(fraseP.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), g.avv(G, "ospite"), 40); if (v1) no(g.nome + " (Giulia): " + v1);
      // Giulia manda una faccina: l'host la vede vicino a lei
      await W.dorme(300);
      await chiac(G, "f1");
      if (!await vedeBolla(P, /😂/)) no(g.nome + ": l'host non vede 😂 di Giulia");
      var v2 = bollaVicino(P, /😂/, g.avv(P, "host"), 40); if (v2) no(g.nome + " (Paky): " + v2);
      // Luca entra e guarda: vede le chiacchiere di chi gioca
      var L = await W.apriTel("Luca", { hash: "gioco=" + g.id + "&stanza=" + S.C, x: 370 });
      await W.dorme(1800);
      await chiac(P, "f4");
      if (!await vedeBolla(L, /🔥/, 4000)) no(g.nome + ": Luca (guarda) non vede 🔥 dell'host («" + T(L).slice(0, 60) + "»)");
      var v3 = bollaVicino(L, /🔥/, L.document.querySelector(g.spett), 40); if (v3) no(g.nome + " (Luca): " + v3);
      // Giulia ricarica la pagina: torna al tavolo e il 💬 c'è ancora
      G = await W.ricarica("Giulia");
      if (!await W.aspetta(function () { return tasto(G); }, 10000)) no(g.nome + ": dopo la ricarica Giulia non ha il 💬 («" + T(G).slice(0, 80) + "»)");
      await W.dorme(1200);
      await chiac(G, "p7");
      if (!await vedeBolla(P, /Bella partita/)) no(g.nome + ": dopo la ricarica la frase di Giulia non arriva");
      var err = W.erroriTel(); if (err.length) no(g.nome + ": errori " + err.slice(0, 2).join(" / "));
      // 💬 spento nel ⚙️: nessuno ha il tasto, e un messaggio mandato lo stesso non arriva
      A.pulisci();
      var S2 = await stanzaADue(g, true);
      await W.dorme(1500);
      if (tasto(S2.P) || tasto(S2.G)) no(g.nome + ": con 💬 spento il tasto c'è ancora");
      var h = W.reteDi("Giulia"); if (h) h.invia({ t: "chiac", c: "p0" });
      await W.dorme(900);
      if (W.ADUE.bolle(S2.P).length) no(g.nome + ": con 💬 spento il fumetto arriva lo stesso");
      fatti.push(g.nome);
    }
    return "host ↔ ospite, chi guarda, ricarica, ⚙️ spento: " + fatti.join(", ");
  } });

  // la Scopa online, scelte nelle impostazioni prima di aprire la stanza (inTre: «👥👤 In tre»): il codice
  async function apriScopa(P, inTre) {
    var tess = await W.aspetta(function () { return A.tessera(P, "Scopa"); }, 6000); if (!tess) no("non trovo la tessera della Scopa");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /apro io/)) no("non trovo «Online: apro io la stanza»");
    await W.dorme(400);
    if (inTre && !W.clicca(P, /In tre/)) no("nelle impostazioni non c'è «In tre»");
    W.clicca(P, /^Una mano$/); await W.dorme(150);
    if (!W.clicca(P, /Apri la stanza/)) no("non trovo «Apri la stanza»");
    var cod = await W.aspetta(function () { return A.codiceSaletta(P) || A.codiceTestata(P); }, 5000);
    if (!cod) no("la stanza non ha il codice");
    return cod;
  }
  // ⚙️ Regole della saletta: apre il foglio, tocca la scelta (regex) e chiude con «✅ Fatto»
  async function regola(w, scelta) {
    var b = w.document.querySelector("button.sl-regole"); if (!b) no("nella saletta non c'è ⚙️ Regole");
    b.click();
    var f = await W.aspetta(function () { return w.document.querySelector(".sl-foglio"); }, 2000); if (!f) no("il foglio ⚙️ non si apre");
    var c = [].find.call(f.querySelectorAll("button"), function (x) { return scelta.test(x.textContent); });
    if (!c) no("nel ⚙️ non c'è " + scelta);
    c.click(); await W.dorme(150);
    var ok = [].find.call(f.querySelectorAll("button"), function (x) { return /Fatto/.test(x.textContent); }); if (ok) ok.click();
    await W.dorme(300);
  }
  function targaDi3(w, nome) { return [].find.call(w.document.querySelectorAll(".sc-targa4"), function (x) { return (x.querySelector(".sc-nome") || {}).textContent === nome; }) || null; }
  function alTavolo3(w) { return !!(w.document.querySelector(".sc-mensola1") && w.document.querySelectorAll(".sc-targa4").length === 2); }
  function esce(w) { var b = w.document.querySelector(".testa button[aria-label=Indietro]"); if (b) b.click(); return !!b; }

  // 805. Scopa in tre online
  COPIONE.aggiungi(805, { nome: "Scopa in tre online: tre telefoni, 💬, ricarica, chi esce (gioca il Bot), chi arriva e guarda, fino alla fine", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    var C = await apriScopa(P, true);
    var G = await W.apriTel("Giulia", { hash: "gioco=scopa&stanza=" + C, x: 185 });
    var L = await W.apriTel("Luca", { hash: "gioco=scopa&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".sl-av:not(.sl-vuoto)").length >= 3 && /Scopa in tre/.test(T(G)) && /Scopa in tre/.test(T(L)); }, 9000))
      no("i tre non sono nella saletta a tre («" + T(G).slice(0, 80) + "»)");
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return alTavolo3(P) && alTavolo3(G) && alTavolo3(L); }, 9000)) no("non tutti e tre sono al tavolo a tre");
    var mani = [P, G, L].map(function (w) { return w.document.querySelectorAll(".sc-mano-riga .sc-carta").length; });
    if (mani.join() !== "3,3,3") no("le carte in mano non sono 3 a testa: " + mani.join());
    // 💬: Giulia manda una frase, Paky e Luca la vedono sotto la targa di Giulia
    await W.dorme(1500);
    if (!await chiac(G, "p1")) no("Giulia non ha il 💬");
    for (var k = 0; k < 2; k++) {
      var w = k ? L : P, nome = k ? "Luca" : "Paky";
      if (!await vedeBolla(w, /Mannaggia/)) no(nome + " non vede «Mannaggia…» di Giulia");
      var v = bollaVicino(w, /Mannaggia/, targaDi3(w, "Giulia"), 40); if (v) no(nome + ": " + v);
    }
    // Luca ricarica a metà: ritrova le sue carte
    var primaL = [].map.call(L.document.querySelectorAll(".sc-mano-riga .sc-carta img"), function (i) { return i.getAttribute("src"); }).sort().join();
    L = await W.ricarica("Luca");
    if (!await W.aspetta(function () { return alTavolo3(L); }, 10000)) no("Luca dopo la ricarica non è al tavolo («" + T(L).slice(0, 80) + "»)");
    await W.dorme(600);
    var dopoL = [].map.call(L.document.querySelectorAll(".sc-mano-riga .sc-carta img"), function (i) { return i.getAttribute("src"); }).sort().join();
    if (primaL && dopoL && primaL !== dopoL && dopoL.split(",").length >= primaL.split(",").length) no("Luca dopo la ricarica ha carte diverse");
    // Marco arriva a partita cominciata: guarda (senza carte in mano)
    var M = await W.apriTel("Marco", { hash: "gioco=scopa&stanza=" + C, x: 555 });
    if (!await W.aspetta(function () { return /👀/.test((M.document.querySelector(".sc-punti1") || {}).textContent || ""); }, 9000)) no("Marco non guarda il tavolo («" + T(M).slice(0, 80) + "»)");
    if (M.document.querySelectorAll(".sc-mano-riga .sc-carta").length) no("chi guarda vede le carte di qualcuno");
    // Luca esce: al suo posto gioca il Bot (avviso a tutti)
    if (!esce(L)) no("Luca non trova il tasto per uscire");
    if (!await W.aspetta(function () { return /Luca è uscito/.test(T(P)) || !targaDi3(P, "Luca"); }, 6000)) no("a Paky non arriva che Luca è uscito");
    // si gioca fino alla fine (il Bot gioca per Luca)
    var fine = await Promise.all([scopaFinoAllaFine(P, 150000), scopaFinoAllaFine(G, 150000)]);
    if (!fine[0] || !fine[1]) no("la mano non finisce (" + fine.join() + ")");
    if (!await W.aspetta(function () { return /Scopa in tre/.test(T(M)) && /Carte/.test(T(M)); }, 6000)) no("chi guarda non vede il riepilogo («" + T(M).slice(0, 80) + "»)");
    // la Rivincita: tutti nella saletta a tre (Luca è uscito: il suo posto è libero): lo prende Marco che guardava, poi si riparte
    if (!await W.aspetta(function () { return W.clicca(P, /Rivincita|Nuova partita/); }, 5000)) no("a fine partita l'host non ha «Rivincita» («" + T(P).slice(0, 80) + "»)");
    if (!await W.aspetta(function () { return /Scopa in tre/.test(T(G)) && /Sei dentro|Aspetta/.test(T(G)) && !alTavolo3(G); }, 9000)) no("dopo la Rivincita Giulia non è nella saletta a tre («" + T(G).slice(0, 80) + "»)");
    await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000);
    if (!await W.aspetta(function () { return alTavolo3(P) && alTavolo3(G) && alTavolo3(M) && M.document.querySelectorAll(".sc-mano-riga .sc-carta").length === 3; }, 9000)) no("la seconda partita a tre non parte con Marco seduto al posto di Luca («" + T(M).slice(0, 80) + "»)");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "tre al tavolo (3 carte a testa), «Mannaggia…» sotto la targa di Giulia, Luca ricarica e riprende, Marco guarda, Luca esce e gioca il Bot, Rivincita con Marco al posto di Luca, fine: «" + T(P).slice(0, 50) + "…»";
  } });

  // 806. Scopa: in saletta da «In due» a «In tre» (e ritorno) con gli amici dentro
  COPIONE.aggiungi(806, { nome: "Scopa: in saletta l'host passa da due a tre e ritorno, nessuno esce", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    var C = await apriScopa(P, false);
    var G = await W.apriTel("Giulia", { hash: "gioco=scopa&stanza=" + C, x: 185 });
    var L = await W.apriTel("Luca", { hash: "gioco=scopa&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return /tu guardi/.test(T(L)) && /Siete in tre/.test(T(P)); }, 9000)) no("a due: Luca non guarda o l'host non legge «Siete in tre?» («" + T(P).slice(0, 120) + "»)");
    // ⚙️ → In tre
    await regola(P, /In tre/);
    if (!await W.aspetta(function () { return /Scopa in tre/.test(T(P)) && /Scopa in tre/.test(T(G)) && /Scopa in tre/.test(T(L)) && !/tu guardi/.test(T(L)); }, 8000))
      no("dopo «In tre» non sono tutti nella saletta a tre (Luca: «" + T(L).slice(0, 100) + "»)");
    if (P.document.querySelectorAll(".sl-av:not(.sl-vuoto)").length < 3) no("nella saletta a tre non ci sono tre avatar");
    // ⚙️ → In due: Luca torna a guardare
    await regola(P, /In due/);
    if (!await W.aspetta(function () { return !/Scopa in tre/.test(T(P)) && /tu guardi/.test(T(L)) && !/tu guardi/.test(T(G)); }, 8000)) no("tornati a due, Luca non guarda («" + T(L).slice(0, 100) + "»)");
    // e di nuovo in tre: si gioca
    await regola(P, /In tre/);
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".sl-av:not(.sl-vuoto)").length >= 3 && /Scopa in tre/.test(T(L)); }, 8000)) no("la seconda volta a tre non sono tutti seduti");
    await W.dorme(500);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return alTavolo3(P) && alTavolo3(G) && alTavolo3(L); }, 9000)) no("dopo il cambio non tutti e tre sono al tavolo");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "a due (Luca guarda, «Siete in tre?»), ⚙️ In tre → tutti seduti, In due → Luca guarda, In tre → si gioca in tre";
  } });

  // 807. Torneo a eliminazione (Tris in 3, uno passa il turno e guarda): chi guarda manda 👏 e i due che giocano la vedono
  //      col suo nome; la frase di chi gioca arriva a chi guarda sotto l'avatar giusto
  COPIONE.aggiungi(807, { nome: "Torneo a eliminazione: chi guarda manda faccine, chi gioca frasi, tutti le vedono", fai: async function () {
    var Sa = await A.salaConAmici(["Giulia", "Luca"]), S = Sa.S, P = Sa.w.Paky;
    var tn = function () { var e = A.vm(S).elim; return e && e.torneino ? e : null; };
    var nomeTn = function (E, id) { return id === "bot" ? "Bot" : (E.nomi || {})[id]; };
    if (!await W.aspetta(function () { return W.clicca(P, /Scegli (un|il primo) gioco|Prossimo gioco/); }, 4000)) no("non trovo «Scegli un gioco» nella Sala");
    var tess = await W.aspetta(function () { return A.tessera(P, "Tris"); }, 4000); if (!tess) no("non trovo il Tris nella Sala");
    tess.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".torneino-sc"); }, 4000)) no("non si apre «Tris in 3»");
    var pass = [].find.call(P.document.querySelectorAll(".tn-opz .modo-chip"), function (x) { return x.textContent.indexOf("Passa il turno") >= 0; });
    if (!pass) no("non c'è «Passa il turno»");
    pass.click();
    if (!W.clicca(P, /Via al torneo/, ".piede button")) no("non c'è «⚔️ Via al torneo»");
    var E = await W.aspetta(function () { var e = tn(); return e && e.iniziato ? e : null; }, 5000); if (!E) no("il torneino non parte");
    var t0 = E.turni[0], gioca = t0.filter(function (p) { return p.b; })[0], passa = t0.filter(function (p) { return !p.b; })[0];
    var nA = nomeTn(E, gioca.a), nB = nomeTn(E, gioca.b), nG = nomeTn(E, passa.a), wA = W.finestra(nA), wB = W.finestra(nB), wG = W.finestra(nG);
    if (!await W.aspetta(function () { return A.vm(gioca.stanza).avvId; }, 12000)) no("la partita non si apre con tutti e due");
    await W.aspetta(function () { return W.clicca(wA, /Comincia/, ".sl-go"); }, 8000);
    if (!await W.aspetta(function () { return A.vm(gioca.stanza).fase === "gioco"; }, 8000)) no("la partita non comincia");
    var bg = await W.aspetta(function () { return wG.document.querySelector(".tb-guarda"); }, 8000); if (!bg) no(nG + " non ha «👀 Guarda»");
    bg.click();
    // (dal Passo 6 chi guarda non ha il 💬 del gioco, che il core butterebbe: ha la fila delle faccine del core, t.faccine())
    var faG = function () { return [].find.call(wG.document.querySelectorAll(".sl-fa"), function (b) { return b.textContent === "👏" && b.offsetParent !== null; }); };
    if (!await W.aspetta(function () { return wG.document.querySelectorAll(".tr-cella").length === 9 && faG(); }, 8000)) no(nG + " guarda ma non ha le faccine («" + T(wG).slice(0, 80) + "»)");
    // chi guarda: solo faccine (niente 💬 né frasi)
    if (tasto(wG)) no("chi guarda ha ancora il 💬 del gioco");
    if (wG.document.querySelector(".sgc-frasi")) no("chi guarda ha anche le frasi");
    faG().click();
    var reG = new RegExp("👏\\s*" + nG);
    if (!await vedeVolante(wA, reG) || !await vedeVolante(wB, reG)) no("i due che giocano non vedono «👏 " + nG + "» (" + volanti(wA).join(", ") + ")");
    // chi gioca (B, cerchio) manda una frase: chi guarda la vede sotto l'avatar dell'O
    await chiac(wB, "p4");
    if (!await vedeBolla(wG, /Dai, muoviti!/)) no(nG + " non vede la frase di " + nB);
    var v = bollaVicino(wG, /Dai, muoviti!/, wG.document.querySelector(".tr-g.O"), 40); if (v) no(nG + ": " + v);
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return nA + "–" + nB + " giocano, " + nG + " guarda: «👏 " + nG + "» ai due, «Dai, muoviti!» di " + nB + " sotto il suo avatar a chi guarda";
  } });

  // 808. La Sala della serata: Scopa con Giulia, arriva Luca, ⚙️ «In tre», partita intera in tre, ↻ Rivincita e si riparte in tre
  COPIONE.aggiungi(808, { nome: "Sala: Scopa, arriva il terzo, ⚙️ In tre, partita intera, Rivincita in tre", fai: async function () {
    var Sa = await A.salaConAmici(["Giulia"]), S = Sa.S, P = Sa.w.Paky, G = Sa.w.Giulia;
    var C = await A.lanciaDallaSala("Paky", S, "Scopa");
    var L = await W.apriTel("Luca", { hash: "sala=" + S, x: 370, salaSempre: true });
    if (!await W.aspetta(function () { return /Siete in tre/.test(T(P)) && /tu guardi/.test(T(L)); }, 10000)) no("Luca non arriva nella saletta della Scopa («" + T(L).slice(0, 80) + "»)");
    await regola(P, /In tre/);
    await regola(P, /^Una mano$/);
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".sl-av:not(.sl-vuoto)").length >= 3 && /Scopa in tre/.test(T(L)) && !/tu guardi/.test(T(L)); }, 8000)) no("in tre non sono tutti seduti («" + T(L).slice(0, 100) + "»)");
    await W.dorme(400);
    W.clicca(P, /Comincia/, ".sl-go") || W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return alTavolo3(P) && alTavolo3(G) && alTavolo3(L); }, 10000)) no("non tutti e tre sono al tavolo");
    var fine = await Promise.all([P, G, L].map(function (w) { return scopaFinoAllaFine(w, 150000); }));
    if (fine.indexOf(false) >= 0) no("la mano non finisce per tutti (" + fine.join() + ")");
    var tf = A.tastiFineDi(P); if (!tf || !tf.some(function (x) { return /Rivincita/.test(x); })) no("a fine partita l'host non ha i tasti della Sala (" + JSON.stringify(tf) + ")");
    W.clicca(P, /Rivincita/, ".fine-tasti button");
    if (!await W.aspetta(function () { return alTavolo3(P) && alTavolo3(G) && alTavolo3(L); }, 15000)) no("dopo la Rivincita la Scopa in tre non riparte per tutti («" + T(G).slice(0, 80) + "»)");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "Sala " + S + " → Scopa " + C + ", Luca arriva e guarda, ⚙️ In tre: tutti seduti, mano intera in tre, ↻ Rivincita: si riparte in tre";
  } });

  // 809. La Sala in tre sceglie la Scopa: «Scopa in 3» offre «In tre: giocate tutti» (già scelto), ▶ e tutti e tre al tavolo.
  //      (Serve la riga del core in schermataTorneino: senza, la prova lo dice e si ferma lì.)
  COPIONE.aggiungi(809, { nome: "Sala in tre → Scopa: «In tre: giocate tutti», tutti e tre al tavolo", fai: async function () {
    var Sa = await A.salaConAmici(["Giulia", "Luca"]), P = Sa.w.Paky, G = Sa.w.Giulia, L = Sa.w.Luca;
    if (!await W.aspetta(function () { return W.clicca(P, /Scegli (un|il primo) gioco|Prossimo gioco/); }, 4000)) no("non trovo «Scegli un gioco» nella Sala");
    var tess = await W.aspetta(function () { return A.tessera(P, "Scopa"); }, 4000); if (!tess) no("non trovo la Scopa nella Sala");
    tess.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".torneino-sc"); }, 4000)) no("non si apre «Scopa in 3»");
    var c3 = [].find.call(P.document.querySelectorAll(".tn-scelta"), function (x) { return /In tre: giocate tutti/.test(x.textContent); });
    if (!c3) return "manca ancora la riga del core («In tre: giocate tutti» in «Scopa in 3»): prova da rifare dopo l'unione";
    if (!c3.classList.contains("scelta")) no("«In tre: giocate tutti» non è già scelto");
    var e1 = await misura(P, "Paky", 360, 640, ".torneino-sc .piede"); if (e1) no("«Scopa in 3» " + e1);
    rimetti("Paky"); P.dispatchEvent(new P.Event("resize")); await W.dorme(300);
    if (!W.clicca(P, /Si gioca in tre/, ".piede button")) no("non c'è «▶ Si gioca in tre»");
    if (!await W.aspetta(function () { return [P, G, L].every(function (w) { return /Scopa in tre/.test(T(w)) && !/tu guardi/.test(T(w)); }) && P.document.querySelectorAll(".sl-av:not(.sl-vuoto)").length >= 3; }, 10000))
      no("non sono tutti e tre nella saletta a tre (Luca: «" + T(L).slice(0, 100) + "»)");
    await W.dorme(400);
    W.clicca(P, /Comincia/, ".sl-go") || W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return alTavolo3(P) && alTavolo3(G) && alTavolo3(L); }, 10000)) no("non tutti e tre sono al tavolo");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "«Scopa in 3» → «In tre: giocate tutti» già scelto, ▶ Si gioca in tre: saletta a tre e tutti al tavolo";
  } });

  // gioca (prima carta, presa verde) finché cond(w) è vero; non tocca «Continua»
  async function giocaFinche(w, cond, ms) {
    var fino = Date.now() + (ms || 120000);
    while (Date.now() < fino) {
      if (cond(w)) return true;
      var mens = w.document.querySelector(".sc-mensola1.tuo");
      if (mens) {
        var verde = w.document.querySelector(".sc-carta.cap");
        if (verde) { verde.click(); await W.dorme(250); continue; }
        var c = mens.querySelector(".sc-carta:not(.inviata):not(.sel)");
        if (c) { c.click(); await W.dorme(300); continue; }
      }
      await W.dorme(200);
    }
    return false;
  }
  // 810. Scopa in tre online, a 11: sul riepilogo della smazzata chi entra ha «⏩ Avanti»; quando lo toccano in due su tre
  //      si riparte subito (senza aspettare il conto); il riepilogo sta in 360x640 col tasto in più
  COPIONE.aggiungi(810, { nome: "Scopa in tre online: «⏩ Avanti» sul riepilogo, se lo toccano in due su tre si riparte subito", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    var tess = await W.aspetta(function () { return A.tessera(P, "Scopa"); }, 6000); if (!tess) no("non trovo la tessera della Scopa");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /apro io/)) no("non trovo «Online: apro io la stanza»");
    await W.dorme(400);
    if (!W.clicca(P, /In tre/)) no("nelle impostazioni non c'è «In tre»");
    if (!W.clicca(P, /^a 11$|^11$/)) W.clicca(P, /11/);
    if (!W.clicca(P, /Apri la stanza/)) no("non trovo «Apri la stanza»");
    var C = await W.aspetta(function () { return A.codiceSaletta(P) || A.codiceTestata(P); }, 5000); if (!C) no("la stanza non ha il codice");
    var G = await W.apriTel("Giulia", { hash: "gioco=scopa&stanza=" + C, x: 185 });
    var L = await W.apriTel("Luca", { hash: "gioco=scopa&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".sl-av:not(.sl-vuoto)").length >= 3; }, 9000)) no("i tre non sono nella saletta");
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return alTavolo3(P) && alTavolo3(G) && alTavolo3(L); }, 9000)) no("non tutti e tre sono al tavolo");
    var riep = function (w) { return /Fine smazzata/.test(T(w)); };
    var ok = await Promise.all([P, G, L].map(function (w) { return giocaFinche(w, riep, 150000); }));
    if (ok.indexOf(false) >= 0) no("la smazzata non finisce per tutti (" + ok.join() + ")");
    if (/Hai vinto|Ha vinto/.test(T(P))) return "la partita è finita alla prima smazzata (capita): «⏩ Avanti» non si prova";
    var bG = G.document.querySelector(".sc3-vota"), bL = L.document.querySelector(".sc3-vota");
    if (!bG || !bL) no("chi entra non ha «⏩ Avanti» sul riepilogo");
    if (P.document.querySelector(".sc3-vota")) no("l'host ha «⏩ Avanti» (ha già «Continua»)");
    var e = await misura(G, "Giulia", 360, 640, ".sc3-vota"); if (e) no("riepilogo " + e);
    rimetti("Giulia"); G.dispatchEvent(new G.Event("resize")); await W.dorme(300);
    var t0 = Date.now();
    G.document.querySelector(".sc3-vota").click();
    if (!await W.aspetta(function () { var b = L.document.querySelector(".sc3-vota"); return b && /1 su 3/.test(b.textContent); }, 4000)) no("Luca non vede «Avanti · 1 su 3»");
    var bg2 = G.document.querySelector(".sc3-vota"); if (!bg2 || !bg2.disabled || !/✓/.test(bg2.textContent)) no("il tasto di Giulia non diventa «✓ Avanti»");
    if (!riep(P)) no("con un voto solo si è già ripartiti");
    L.document.querySelector(".sc3-vota").click();
    if (!await W.aspetta(function () { return alTavolo3(P) && alTavolo3(G) && alTavolo3(L); }, 5000)) no("con due voti su tre non si riparte");
    var dt = Date.now() - t0;
    if (dt > 9000) no("si è ripartiti col conto, non coi voti (" + dt + " ms)");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "riepilogo a 360x640 col tasto, Giulia ⏩ → Luca vede «1 su 3», Luca ⏩ → si riparte dopo " + Math.round(dt / 100) / 10 + " s";
  } });

  // 811. «Uscire dalla partita?» con la finestra al centro dell'app (mai quella del browser): Tris, Scopa (a due e in tre),
  //      Calcio Biliardo contro il Bot; «Resta» lascia la partita com'è, il sì porta fuori
  COPIONE.aggiungi(811, { nome: "Uscire a metà partita: la finestra dell'app, «Resta» e poi «Esci» (Tris, Scopa, Scopa in tre, Calcio Biliardo)", fai: async function () {
    var GIOCHI = [
      { nome: "Tris", modo: /Contro il computer/, tavolo: ".tr-griglia" },
      { nome: "Scopa", modo: /Contro il computer/, tavolo: ".sc-mensola1" },
      { nome: "Scopa", modo: /In tre contro due Bot/, tavolo: ".sc-targa4" },
      { nome: "Calcio Biliardo", modo: /Contro il computer/, tavolo: ".cb-campo" }
    ], fatti = [];
    clearInterval(W.__autoConferma); W.__autoConferma = null; W.__siFermo = true;   // (le conferme qui le tocco io)
    try {
      for (var i = 0; i < GIOCHI.length; i++) {
        var g = GIOCHI[i], P = await W.apriTel("Paky", { x: 0 }), browser = 0;
        P.confirm = function () { browser++; return true; };
        await avviaLocale(P, g.nome, g.modo);
        if (!await W.aspetta(function () { return P.document.querySelector(g.tavolo); }, 6000)) no(g.nome + ": il tavolo non c'è");
        await W.dorme(600);
        var ind = function () { return P.document.querySelector(".testa button[aria-label=Indietro]") || P.document.querySelector("[aria-label=Indietro], .cb-esci"); };
        if (!ind()) no(g.nome + ": non trovo il tasto per uscire");
        ind().click();
        var f = await W.aspetta(function () { return P.document.querySelector(".conferma-sfondo"); }, 2000);
        if (browser) no(g.nome + ": chiede con la finestra del browser");
        if (!f) no(g.nome + ": non chiede «Uscire dalla partita?»");
        var resta = [].find.call(f.querySelectorAll("button"), function (b) { return !b.classList.contains("btn-rosso"); });
        if (!resta) no(g.nome + ": nella finestra non c'è «Resta»");
        resta.click(); await W.dorme(500);
        if (!P.document.querySelector(g.tavolo)) no(g.nome + ": dopo «Resta» il tavolo non c'è più");
        ind().click();
        var si = await W.aspetta(function () { return P.document.querySelector(".conferma-sfondo .btn-rosso:not([disabled])"); }, 2500);
        if (!si) no(g.nome + ": la seconda volta la finestra non si apre");
        si.click();
        if (!await W.aspetta(function () { return !P.document.querySelector(g.tavolo); }, 3000)) no(g.nome + ": il sì non fa uscire");
        if ((P.__err || []).length) no(g.nome + ": errori " + P.__err.slice(0, 2).join(" / "));
        fatti.push(g.nome + (/tre/.test(String(g.modo)) ? " in tre" : ""));
      }
    } finally { W.__siFermo = true; if (COPIONE.aiuti.riprendiSiDaSolo) COPIONE.aiuti.riprendiSiDaSolo(); else { W.__siFermo = false; W.__autoConferma = setInterval(function () { document.querySelectorAll("iframe").forEach(function (fr) { try { var b = fr.contentWindow.document.querySelector(".conferma-sfondo .btn-rosso:not([disabled])"); if (b) b.click(); } catch (e) {} }); }, 100); } }
    return "finestra dell'app, «Resta» e poi fuori: " + fatti.join(", ");
  } });

  // tutte le prove di questo file, una dopo l'altra
  W.ADUE.tutte = async function () { var r = []; for (var n = 801; n <= 811; n++) r.push(await COPIONE.prova(n)); return r; };
})();
