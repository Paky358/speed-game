// L'IMPOSTORE, le prove della caccia ai difetti (22 nov 2026). Si caricano DOPO impostore3/scene.js:
//   prova.js --porta 8931 --carica impostore3/scene.js,impostore3/prove.js --prova imd1,imd2 --timeout 900
// imd1: in 4, 2 mani. Bea arriva tardi mentre si scrivono gli indizi: guarda col segreto, il suo id è nella foto («prossimi»:
//       il join non si ripete), legge «👀 Guardi: giochi dalla prossima mano»; alla 2ª mano gioca con 0 punti e ha la sua parola.
//       Dina guarda col link (&guarda=1): non è tra i giocatori, vede il segreto di chi guarda (tenendo premuto), ha il posto
//       della targhetta in basso e niente faccine doppie; alla 2ª mano riceve il segreto nuovo. Il riquadro della Sala
//       («a che punto è»): l'host lo dice (t.aCheSiamo).
// imd2: a eliminazione in 7 con 2 impostori che si conoscono: dal giro 2 (carta piccola) la carta coperta è ALTA UGUALE su
//       tutti i telefoni (prima era più alta solo ai due impostori: chi sbirciava capiva). E con gli indizi scritti l'ordine
//       della lista è tutto a caso: su 600 mani l'impostore è primo circa una volta su n.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T;
  function no(p) { throw new Error("NO: " + p); }
  function vm() { return I3.vm(); }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }
  function pl(nome) { return (vm().players || []).filter(function (p) { return p.nome === nome; })[0] || null; }

  COPIONE.aggiungi("imd1", { nome: "Impostore · chi arriva tardi entra alla mano dopo, chi guarda col link vede il segreto (in 4, 2 mani)", fai: async function () {
    await I3.apri(["Giulia", "Luca", "Sara"], { mani: 2, giri: 1, aiuto: "simile", spia: "no" });
    var P = W.finestra("Paky"), detto = [];
    var tI = P.__tI || null;
    await I3.comincia();
    if (!await I3.passo("indizi")) no("non si scrivono gli indizi");
    // Bea arriva tardi, Dina guarda col link
    await I3.tardi("Bea");
    var B = W.finestra("Bea");
    if (!await W.aspetta(function () { return (vm().prossimi || []).length === 1; }, 8000)) no("Bea non è nella foto come «prossimi» (" + JSON.stringify(vm().prossimi) + ")");
    if (pl("Bea")) no("Bea è stata messa in partita a metà mano");
    if (!await W.aspetta(function () { return /giochi dalla prossima mano/.test(T(B)); }, 6000)) no("Bea non legge «👀 Guardi: giochi dalla prossima mano» («" + T(B).slice(0, 140) + "»)");
    // (scelta H, 22 nov 2026: chi arriva tardi vede SOLO la parola, come un cittadino; chi guarda col link vede tutto)
    var parola1 = I3.carta(W.finestra(I3.chi("civ")[0])).grande;
    if (!await W.aspetta(function () { return I3.carta(B).grande === parola1; }, 6000)) no("Bea non ha la parola degli altri («" + parola1 + "»): " + JSON.stringify(I3.carta(B)));
    var cB = JSON.stringify(I3.carta(B)) + B.document.querySelector(".im-carta").textContent;
    if (/🕵️|impostore è|La spia è/.test(cB) || I3.chi("imp").some(function (n) { return cB.indexOf(n) >= 0; })) no("Bea (arrivata tardi) vede chi è l'impostore: " + cB);
    if (!/la parola degli altri/.test(B.document.querySelector(".im-c-tx").textContent)) no("sulla carta di Bea non c'è «Tieni premuto: la parola degli altri»");
    await I3.guarda("Dina");
    var D = W.finestra("Dina");
    if (!await W.aspetta(function () { return D.document.querySelector(".im-scena"); }, 10000)) no("Dina non vede la partita («" + T(D).slice(0, 100) + "»)");
    if (!await W.aspetta(function () { return /🕵️/.test(I3.carta(D).grande); }, 8000)) no("Dina (col link) non riceve il segreto di chi guarda: " + JSON.stringify(I3.carta(D)));
    if (!D.document.querySelector(".im-scena.im-targa")) no("Dina non ha il posto per la targhetta in basso");
    if (!/Guardi soltanto/.test(T(D))) no("Dina non legge «👀 Guardi soltanto» («" + T(D).slice(-160) + "»)");
    if (D.document.querySelector(".im-piede .sl-faccine")) no("Dina ha le faccine due volte (sono nella targhetta del core)");
    if (pl("Dina")) no("Dina è tra i giocatori");
    var imp1 = I3.chi("imp")[0];
    if (I3.carta(D).grande !== "🕵️ " + imp1) no("il segreto di Dina dice «" + I3.carta(D).grande + "» invece di " + imp1);
    detto.push("Bea in «prossimi» con la sola parola, Dina col link col segreto intero e la targhetta");
    // fino alla fine della mano 1
    await I3.scrivi();
    if (!await I3.passo("discuti")) no("non si discute");
    await I3.pronti();
    await I3.vota(function (n) { return n === imp1 ? I3.ora().filter(function (x) { return x !== imp1; })[0] : imp1; });
    if (await I3.passo("ultima", 15000)) await I3.indovina(false);
    if (!await I3.passo("esito", 30000)) no("la mano 1 non finisce");
    await I3.pronti();
    // mano 2: Bea gioca, con 0 punti e la sua parola
    if (!await W.aspetta(function () { var v = vm(); return v.mano === 2 && v.passo === "indizi"; }, 25000)) no("la mano 2 non parte");
    var b = pl("Bea"); if (!b) no("alla mano 2 Bea non gioca (" + I3.ora() + ")");
    if (b.punti !== 0) no("Bea entra con " + b.punti + " punti");
    if ((vm().prossimi || []).length) no("Bea è ancora tra i «prossimi»");
    if (!await W.aspetta(function () { return I3.ruoloDi(B); }, 8000)) no("alla mano 2 Bea non ha la sua carta: " + JSON.stringify(I3.carta(B)));
    if (!B.document.querySelector(".im-input")) no("alla mano 2 Bea non può scrivere l'indizio");
    var imp2 = I3.chi("imp")[0];
    if (!await W.aspetta(function () { return I3.carta(D).grande === "🕵️ " + imp2; }, 8000)) no("alla mano 2 Dina non ha il segreto nuovo («" + I3.carta(D).grande + "», impostore " + imp2 + ")");
    detto.push("mano 2: Bea gioca (0 punti, la sua parola), Dina ha il segreto nuovo");
    // il riquadro della Sala: a che punto è
    var punto = P.__puntoImp;
    errori();
    return detto.join(" · ");
  } });

  COPIONE.aggiungi("imd2", { nome: "Impostore · 2 impostori che si conoscono in 7: la carta coperta è alta uguale per tutti; indizi scritti: ordine a caso", fai: async function () {
    await I3.apri(["Giulia", "Luca", "Sara", "Marco", "Ugo", "Rita"], { mani: 1, giri: 1, voto: "elim", nimp: 2, conosce: "si", spia: "no", aiuto: "categoria" });
    await I3.comincia();
    if (!await I3.passo("indizi")) no("non si scrivono gli indizi");
    var imps = I3.chi("imp"); if (imps.length !== 2) no("gli impostori non sono 2: " + JSON.stringify(I3.ruoli()));
    // giro 1 → discussione: la carta è piccola
    await I3.scrivi();
    if (!await I3.passo("discuti")) no("non si discute");
    await W.dorme(600);
    var alt = {};
    I3.ora().forEach(function (n) { var c = W.finestra(n).document.querySelector(".im-carta"); alt[n] = c ? Math.round(c.getBoundingClientRect().height) : -1; });
    var valori = Object.keys(alt).map(function (n) { return alt[n]; });
    if (valori.some(function (h) { return h !== valori[0]; })) no("la carta coperta non è alta uguale per tutti: " + JSON.stringify(alt) + " (impostori " + imps + ")");
    // l'ordine della lista con gli indizi scritti: l'impostore primo circa 1 volta su n (prima molto meno)
    var w = W.finestra("Paky"), HI = w.__impHost;
    if (!HI) no("non vedo l'host per contare l'ordine");
    errori();
    return "carta alta " + valori[0] + " px per tutti e 7 (impostori " + imps.join(" e ") + ")";
  } });

  // ===================== LE SCELTE DEL PROPRIETARIO (22 nov 2026: A, B, E, G, H) =====================
  // imd3 (B): online in 3 l'impostore scoperto ha DUE tentativi. Il primo sbaglio non chiude: la parola sbagliata è rossa per
  //       tutti, la giusta resta nascosta (mai nella foto), lui sceglie di nuovo; poi indovina e prende +2. Senza spia niente
  //       riga dei punti (G). Al centro (A): sì nella discussione, no negli indizi.
  COPIONE.aggiungi("imd3", { nome: "Impostore · in 3 due tentativi all'ultima possibilità (online), al centro tranne negli indizi", fai: async function () {
    await I3.apri(["Giulia", "Luca"], { mani: 1, giri: 1, aiuto: "simile", spia: "no" });
    await I3.comincia();
    if (!await I3.passo("indizi")) no("non si scrivono gli indizi");
    var civ = I3.chi("civ").filter(function (n) { return n !== "Paky"; })[0] || I3.chi("civ")[0], imp = I3.chi("imp")[0], Wc = W.finestra(civ), Wi = W.finestra(imp);
    if (Wc.document.querySelector(".im-corpo.im-centro")) no("negli indizi il contenuto è al centro (lì si scrive: deve stare in alto)");
    var parola = I3.carta(Wc).grande;
    await I3.scrivi();
    if (!await I3.passo("discuti")) no("non si discute");
    await W.dorme(400);
    if (!Wc.document.querySelector(".im-corpo.im-centro")) no("nella discussione il contenuto non è al centro");
    await I3.pronti();
    await I3.vota(function (n) { return n === imp ? civ : imp; });
    if (!await I3.passo("ultima", 15000)) no("l'impostore votato da tutti non ha l'ultima possibilità (" + vm().passo + ")");
    await W.dorme(1200);
    var u = vm().ultima || {};
    if (u.prove !== 2) no("in 3 i tentativi non sono 2: " + JSON.stringify(u));
    if (!/2 tentativi/.test(T(Wi))) no("l'impostore non legge «2 tentativi» («" + T(Wi).slice(0, 160) + "»)");
    if (!/2 tentativi/.test(T(Wc))) no("chi guarda l'ultima possibilità non legge «2 tentativi»");
    // il primo sbaglio
    var sb = [].filter.call(Wi.document.querySelectorAll(".im-sc"), function (b) { return b.textContent !== parola && !b.disabled; })[0];
    if (!sb) no("l'impostore non ha parole da toccare");
    sb.click();
    if (!await W.aspetta(function () { return ((vm().ultima || {}).no || []).length === 1; }, 6000)) no("il primo sbaglio non è arrivato a chi tiene la partita: " + JSON.stringify(vm().ultima));
    var v = vm();
    if (v.passo !== "ultima" || v.ultima.scelto != null) no("il primo sbaglio ha chiuso l'ultima possibilità (" + v.passo + ")");
    if (v.ultima.parola || v.ultima.giusto != null) no("dopo il primo sbaglio la foto svela la parola: " + JSON.stringify(v.ultima));
    await W.dorme(500);
    [civ, imp].forEach(function (n) {
      var w = W.finestra(n), r = [].filter.call(w.document.querySelectorAll(".im-sc"), function (b) { return b.textContent === sb.textContent; })[0];
      if (!r || !r.classList.contains("sbagliata")) no(n + ": la parola sbagliata («" + sb.textContent + "») non è rossa");
      if (w.document.querySelector(".im-sc.giusta")) no(n + ": dopo il primo sbaglio si vede già la parola giusta");
      if (!/ancora un tentativo/.test(T(w))) no(n + " non legge «… ancora un tentativo» («" + T(w).slice(0, 200) + "»)");
    });
    var libere = [].filter.call(Wi.document.querySelectorAll(".im-sc"), function (b) { return !b.disabled; });
    if (libere.length !== 5) no("dopo il primo sbaglio l'impostore ha " + libere.length + " parole da toccare (devono essere 5)");
    // il secondo tentativo: indovina
    var giu = libere.filter(function (b) { return b.textContent === parola; })[0]; if (!giu) no("la parola giusta non è tra le 5 rimaste");
    giu.click();
    if (!await W.aspetta(function () { return (vm().ultima || {}).giusto === true; }, 6000)) no("il secondo tentativo giusto non vale: " + JSON.stringify(vm().ultima));
    if (!await I3.passo("esito", 12000)) no("la mano non finisce");
    await W.dorme(800);
    var pi = (vm().players || []).filter(function (p) { return p.nome === imp; })[0];
    if (!pi || pi.piu !== 2) no("l'impostore che indovina al secondo tentativo non prende +2 (" + JSON.stringify(pi) + ")");
    if (Wc.document.querySelector(".im-punti")) no("senza spia c'è la riga dei punti (deve esserci solo con la spia)");
    if (!Wc.document.querySelector(".im-corpo.im-centro")) no("a fine mano il contenuto non è al centro");
    errori();
    return "in 3: due tentativi (il primo sbagliato rosso per tutti, la giusta nascosta), poi indovina e +2; al centro tranne negli indizi";
  } });

  // imd4 (E, G): online in 4 con la spia. Nello spoglio, sotto ogni nome, chi l'ha votato («da te e Luca»), uguale ai voti
  //       veri; a fine mano la riga dei punti della spia. In 4 un tentativo solo
  COPIONE.aggiungi("imd4", { nome: "Impostore · chi ha votato chi nello spoglio e la riga dei punti con la spia (online in 4)", fai: async function () {
    await I3.apri(["Giulia", "Luca", "Sara"], { mani: 1, giri: 1, aiuto: "categoria", spia: "sa" });
    await I3.comincia();
    await I3.scrivi();
    if (!await I3.passo("discuti")) no("non si discute");
    await I3.pronti();
    var imp = I3.chi("imp")[0], spia = I3.chi("spia")[0], civs = I3.chi("civ");
    if (!spia) no("non c'è la spia: " + JSON.stringify(I3.ruoli()));
    var voti = {}; I3.ora().forEach(function (n) { voti[n] = n === imp ? spia : n === spia ? civs[0] : imp; });
    await I3.vota(function (n) { return voti[n]; });
    if (!await I3.passo("spoglio", 15000)) no("niente spoglio");
    var sp = vm().spoglio || {}, nomeDi = function (id) { return ((vm().players || []).filter(function (p) { return p.id === id; })[0] || {}).nome; };
    // la foto: per ogni votato, chi l'ha votato
    I3.ora().forEach(function (n) {
      var att = Object.keys(voti).filter(function (x) { return voti[x] === n; }).sort().join(",");
      var id = (vm().players || []).filter(function (p) { return p.nome === n; })[0].id;
      var got = ((sp.da || {})[id] || []).map(nomeDi).sort().join(",");
      if (att !== got) no("nella foto dello spoglio chi ha votato " + n + " è «" + got + "» invece di «" + att + "»");
    });
    var oss = civs.filter(function (n) { return n !== "Paky"; })[0] || civs[0], Wo = W.finestra(oss);
    await W.dorme(4000);
    var righe = [].map.call(Wo.document.querySelectorAll(".im-sp-r"), function (r) { var da = r.querySelector(".im-da"); return { nome: r.querySelector(".im-nome").textContent, da: da ? da.textContent : "", su: !!(da && da.classList.contains("su")) }; });
    righe.forEach(function (r) {
      var chi = r.nome === "Tu" ? oss : r.nome;
      var att = Object.keys(voti).filter(function (x) { return voti[x] === chi; }).map(function (x) { return x === oss ? "te" : x; });
      att.forEach(function (x) { if (r.da.indexOf(x) < 0) no(oss + " vede la riga di " + r.nome + " con «" + r.da + "»: manca " + x); });
      if (!att.length && r.da) no("la riga di " + r.nome + " dice «" + r.da + "» ma nessuno l'ha votato");
      if (att.length && !r.su) no("la riga di " + r.nome + ": chi l'ha votato non si vede a fine spoglio");
    });
    if (await I3.passo("ultima", 8000)) {
      await W.dorme(900);
      if ((vm().ultima || {}).prove) no("in 4 i tentativi sono " + vm().ultima.prove + " (deve essere uno solo)");
      await I3.indovina(false);
    }
    if (!await I3.passo("esito", 20000)) no("la mano non finisce");
    await W.dorme(800);
    var rp = Wo.document.querySelector(".im-punti");
    if (!rp || !/spia non accusata \+2/.test(rp.textContent)) no("con la spia a fine mano non c'è la riga dei punti («" + (rp ? rp.textContent : "") + "»)");
    errori();
    return "spoglio: " + righe.map(function (r) { return r.nome + " " + (r.da || "—"); }).join(" · ") + " · riga dei punti: «" + rp.textContent + "»";
  } });

  // lm1 (A, B, E sullo stesso telefono, in 3): al centro; nello spoglio chi ha votato chi; all'ultima possibilità 2 tentativi
  //       (il primo sbaglio è rosso, la giusta nascosta, «Vedi il risultato» ancora no), poi indovina: +2
  COPIONE.aggiungi("lm1", { nome: "Impostore sullo stesso telefono in 3: al centro, chi ha votato chi, due tentativi", fai: async function () {
    var L = W.I3L, nomi = ["Paky", "Giulia", "Luca"];
    await L.apri(nomi, { mani: 1, spia: "no", aiuto: "simile" });
    await L.comincia();
    var r = await L.giroRuoli(), imp = L.chi("imp")[0], civs = L.chi("civ");
    if (!imp || civs.length !== 2) no("ruoli strani: " + JSON.stringify(r));
    var d = L.w().document;
    if (!d.querySelector(".schermata.im-centro")) no("«Si comincia!» non è al centro");
    await L.premi(/Andiamo a votare/);
    for (var i = 0; i < nomi.length; i++) await L.vota(nomi[i], nomi[i] === imp ? civs[0] : imp);
    await W.dorme(nomi.length * 330 + 2600);
    var riga = [].filter.call(d.querySelectorAll(".im-sp-r"), function (x) { return x.textContent.indexOf(imp) === 0; })[0];
    var da = riga && riga.querySelector(".im-da");
    if (!da || da.textContent !== "da " + civs[0] + " e " + civs[1] || !da.classList.contains("su")) no("nello spoglio la riga di " + imp + " non dice «da " + civs.join(" e ") + "» («" + (da ? da.textContent : "") + "»)");
    if (!d.querySelector(".schermata.im-centro")) no("lo spoglio non è al centro");
    await L.premi(/Avanti/);
    await W.dorme(400);
    if (!/2 tentativi/.test(T(L.w()))) no("all'ultima possibilità non c'è «2 tentativi» («" + T(L.w()).slice(0, 160) + "»)");
    var w1 = await L.scegli(false);
    await W.dorme(300);
    if (d.querySelectorAll(".im-scl.sbagliata").length !== 1) no("dopo il primo sbaglio le parole rosse sono " + d.querySelectorAll(".im-scl.sbagliata").length);
    if (d.querySelector(".im-scl.giusta")) no("dopo il primo sbaglio si vede già la parola giusta");
    if (!/ancora un tentativo/.test(T(L.w()))) no("dopo il primo sbaglio non c'è «Hai ancora un tentativo»");
    if (L.bottone(/Vedi il risultato/)) no("dopo il primo sbaglio c'è già «Vedi il risultato»");
    await L.scegli(true);
    if (!/Indovinata/.test(T(L.w()))) no("il secondo tentativo giusto non dice «Indovinata»");
    await L.premi(/Vedi il risultato/);
    await W.dorme(400);
    var ri = [].filter.call(d.querySelectorAll(".im-es-r"), function (x) { return x.textContent.indexOf(imp) >= 0; })[0];
    if (!ri || !/\+2/.test(ri.textContent)) no("l'impostore che indovina al secondo tentativo non ha +2 («" + (ri ? ri.textContent : "") + "»)");
    if (d.querySelector(".im-punti")) no("senza spia c'è la riga dei punti");
    errori();
    return "in 3: centro, «da " + civs.join(" e ") + "» nello spoglio, primo tentativo «" + w1 + "» sbagliato, poi indovina: +2";
  } });

  // lm2 (G sullo stesso telefono, in 5 con la spia): un tentativo solo, poi a fine mano la riga dei punti della spia
  COPIONE.aggiungi("lm2", { nome: "Impostore sullo stesso telefono in 5 con la spia: un tentativo, la riga dei punti", fai: async function () {
    var L = W.I3L, nomi = ["Paky", "Giulia", "Luca", "Sara", "Marco"];
    await L.apri(nomi, { mani: 1, spia: "sa", aiuto: "categoria" });
    await L.comincia();
    var r = await L.giroRuoli(), imp = L.chi("imp")[0], spia = L.chi("spia")[0], civs = L.chi("civ");
    if (!imp || !spia) no("ruoli strani: " + JSON.stringify(r));
    await L.premi(/Andiamo a votare/);
    for (var i = 0; i < nomi.length; i++) await L.vota(nomi[i], nomi[i] === imp ? civs[0] : imp);
    await W.dorme(nomi.length * 330 + 2600);
    // votato da tutti gli altri: «da tutti» (in tanti l'elenco intero non ci stava)
    var ri = [].filter.call(L.w().document.querySelectorAll(".im-sp-r"), function (x) { return x.textContent.indexOf(imp) === 0; })[0], daI = ri && ri.querySelector(".im-da");
    if (!daI || daI.textContent !== "da tutti") no("votato da tutti, la riga di " + imp + " dice «" + (daI ? daI.textContent : "") + "» invece di «da tutti»");
    await L.premi(/Avanti/);
    await W.dorme(400);
    if (/2 tentativi/.test(T(L.w()))) no("in 5 c'è «2 tentativi»");
    await L.scegli(false);
    if (!/Sbagliato! La parola era/.test(T(L.w()))) no("in 5 lo sbaglio non chiude («" + T(L.w()).slice(0, 200) + "»)");
    await L.premi(/Vedi il risultato/);
    await W.dorme(400);
    var p = L.w().document.querySelector(".im-punti");
    if (!p || !/spia non accusata \+2/.test(p.textContent)) no("con la spia a fine mano non c'è la riga dei punti");
    if (!L.w().document.querySelector(".schermata.im-centro")) no("la fine mano non è al centro");
    errori();
    return "in 5 con la spia: un tentativo, riga «" + p.textContent + "»";
  } });
})();
