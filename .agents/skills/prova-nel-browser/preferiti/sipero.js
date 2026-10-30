// PROVE DI «SÌ... PERÒ» (30 ott 2026, chat «🤨 Sì... però»): il capo della squadra e le faccine sulle carte, chi arriva tardi
// sceglie la squadra, il verdetto con la conferma, la luce e la stella del giudice, le carte della serata, la memoria delle uscite.
// Si carica dopo migliora2/g3-sipero.js (la spia delle regole: w.__imp):
//   prova.js --porta 8997 --carica migliora2/g3-sipero.js,preferiti/sipero.js --prova spn1,spn2,…
// spn1 a squadre in 5: il capo (uno per squadra), il compagno segna e la sua faccina compare sulla mano del capo (e su quella
//      dell'altro compagno), i segni vanno SOLO alla squadra (mai nella foto, mai all'altra squadra o al giudice), il compagno non
//      può giocare (nemmeno mandando la mossa a mano), l'altra squadra segna già le carte per il suo turno, il capo gioca.
// spn2 il capo sparisce: dopo 20 s il capo passa al compagno (che ha «Gioca»); sparisce anche lui: la squadra vuota gioca le carte
//      con più faccine (quelle segnate), non a caso.
// spn3 chi arriva tardi a squadre: mentre si giocano le carte sceglie la squadra (👈 la più piccola) ed entra subito con la mano;
//      chi arriva all'arringa guarda ed entra dal round dopo; ogni nuovo = un round in più; alla fine tutti hanno fatto il giudice una volta.
// spn4 il verdetto: un tocco sceglie («Confermi?»), il secondo decide; la luce (🥁) su tutti per ~3 s, poi chi ha vinto; vibrazione
//      di festa a chi vince e un colpo a chi perde; la stella la mette solo il giudice, una volta; alla fine «⭐ Le carte…».
// spn5 Ognuno per sé: chi arriva mentre si scelgono i Bonus entra subito (mano sua, giro dei Malus rifatto); chi arriva ai Malus
//      entra dal round dopo.
// spn6 l'host ricarica col capo e i segni (tornano uguali), ricarica dopo la stella (resta), poi sparisce: il vice tiene capo e segni.
// spn7 la memoria delle uscite: il mazzo nuovo mette in cima le carte mai viste; l'host ha segnato le carte arrivate in mano.
// spn8 le misure a 360x640 e 412x915: capo, compagno col riquadro del capo, giudice che aspetta, chi arriva e sceglie, verdetto da
//      confermare, esito con la stella: niente scorre, niente esce, nessuna scritta tagliata.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;
  function nomeDi(C, id) { var g = (vm(C).giocatori || []).filter(function (x) { return x.id === id; })[0]; return g ? g.nome : null; }
  function idDi(C, nome) { var g = (vm(C).giocatori || []).filter(function (x) { return x.nome === nome; })[0]; return g ? g.id : null; }
  function telDi(C, id) { var n = nomeDi(C, id); return n ? W.finestra(n) : null; }
  function bottone(w, re) { return [].filter.call(w.document.querySelectorAll("button"), function (b) { return re.test(b.textContent.trim()); })[0] || null; }
  function carte(w) { return [].slice.call(w.document.querySelectorAll(".sp-carta[role=button]")); }
  function testi(nodi) { return nodi.map(function (b) { return b.querySelector(".sp-tx").textContent; }); }
  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  function membri(C, k) { var v = vm(C); return Object.keys(v.assegna || {}).filter(function (id) { return v.assegna[id] === k; }); }
  function vibrazioni(w) { w.__vib = []; try { Object.defineProperty(w.navigator, "vibrate", { configurable: true, value: function (p) { w.__vib.push(p); return true; } }); } catch (e) {} }
  // la stanza (non la Sala): Paky apre, gli amici entrano col link, le regole con la spia di g3-sipero
  async function stanza(amici, imp) {
    W.__spiaSp = [];
    var P = await W.apriTel("Paky", { x: 0, spiaSp: true, prima: function (w) { w.__imp = Object.assign({ giri: 1 }, imp || {}); } });
    var C = await W.apriStanza(P, "Sì... però");
    for (var i = 0; i < amici.length; i++) {
      await W.apriTel(amici[i], { hash: "gioco=sipero&stanza=" + C, x: 185 * (i + 1), spiaSp: true });
      var n = amici[i];
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).some(function (p) { return p.nome === n; }); }, 8000)) no(n + " non entra");
    }
    W.clicca(P, /Comincia/);
    var v = await W.aspetta(function () { var x = vm(C); return x.fase === "gioco" ? x : null; }, 8000);
    if (!v) no("la partita non comincia (" + vm(C).fase + ")");
    await W.dorme(400);
    return { C: C, P: P };
  }
  // il capo della squadra di turno gioca le prime carte (o quelle già segnate); niente controlli
  async function giocaCapo(C) {
    var v = vm(C); if (v.fase !== "gioco" || !v.step) return false;
    var k = v.step.i, w = telDi(C, v.capo[v.step.sq]); if (!w) return false;
    var b = await W.aspetta(function () { return bottone(w, /^Gioca ▶/); }, 4000); if (!b) no("il capo " + nomeDi(C, v.capo[v.step.sq]) + " non ha «Gioca» («" + T(w).slice(0, 120) + "»)");
    var cc = carte(w);
    for (var i = 0; i < cc.length && w.document.querySelectorAll(".sp-carta.su").length < v.step.n; i++) if (!cc[i].classList.contains("su")) tocca(w, cc[i]);
    b = bottone(w, /^Gioca ▶/); if (!b || b.disabled) no("«Gioca» spento per il capo");
    b.click();
    if (!await W.aspetta(function () { var x = vm(C); return x.fase !== "gioco" || !x.step || x.step.i !== k; }, 5000)) no("le carte del capo non arrivano");
    return true;
  }
  async function finoArringa(C) { var fine = Date.now() + 60000; while (vm(C).fase === "gioco" && Date.now() < fine) await giocaCapo(C); if (vm(C).fase !== "arringa") no("non si arriva all'arringa (" + vm(C).fase + ")"); }
  async function finoGiudizio(C) {
    await finoArringa(C);
    var wg = telDi(C, vm(C).giudiceId);
    W.clicca(wg, /Tocca alla/); await W.dorme(400); W.clicca(wg, /Al verdetto/);
    if (!await W.aspetta(function () { return vm(C).fase === "giudizio"; }, 4000)) no("non si arriva al verdetto");
    await W.dorme(300);
    return wg;
  }
  async function decidi(C, k) {
    var wg = telDi(C, vm(C).giudiceId), b = await W.aspetta(function () { return wg.document.querySelector(".sp-vota.c" + k + ":not([disabled])"); }, 4000);
    if (!b) no("il giudice non ha i tasti del verdetto");
    b.click(); await W.dorme(150); b.click();
    if (!await W.aspetta(function () { return vm(C).fase === "esito"; }, 4000)) no("il verdetto non arriva");
  }
  // tutta la partita fino alla classifica (capi, giudici, «Avanti»)
  async function finoAllaFine(C, ms) {
    var fine = Date.now() + (ms || 240000);
    while (Date.now() < fine && vm(C).fase !== "fine") {
      var v = vm(C);
      if (v.fase === "gioco") await giocaCapo(C);
      else if (v.fase === "arringa") { W.clicca(telDi(C, v.giudiceId) || W.finestra("Paky"), /Tocca alla|Al verdetto/); await W.dorme(300); }
      else if (v.fase === "giudizio") { await decidi(C, 0); }
      else if (v.fase === "esito") { (v.giocatori || []).forEach(function (g) { var w = W.finestra(g.nome); if (w) W.clicca(w, /Avanti|Classifica/); }); await W.dorme(600); }
      else await W.dorme(300);
    }
    if (vm(C).fase !== "fine") no("la partita non arriva alla classifica (" + vm(C).fase + ", round " + vm(C).round + ")");
  }
  function segniPassati() {
    return (W.__spiaSp || []).map(function (m) { var x; try { x = JSON.parse(m.p); } catch (e) { return null; } return x && (x.data || x); }).filter(function (d) { return d && d.t === "segni"; });
  }

  // ===================== spn1: il capo e le faccine =====================
  COPIONE.aggiungi("spn1", { nome: "Sì… però a squadre in 5: il capo decide, le faccine dei compagni sulle carte, i segni solo alla squadra", fai: async function () {
    var note = [], X = await stanza(["Giulia", "Luca", "Sara", "Marco"]), C = X.C, v = vm(C);
    if (!v.capo || v.capo.length !== 2) no("nella foto non c'è il capo delle squadre");
    var sq = v.step.sq, altra = sq ? 0 : 1, capo = v.capo[sq], mem = membri(C, sq), memA = membri(C, altra);
    if (mem.indexOf(capo) < 0 || memA.indexOf(v.capo[altra]) < 0) no("il capo non è della sua squadra");
    var comp = mem.filter(function (id) { return id !== capo; })[0], wc = telDi(C, comp), wk = telDi(C, capo);
    note.push("capi " + nomeDi(C, capo) + " e " + nomeDi(C, v.capo[altra]));
    if (!await W.aspetta(function () { return carte(wc).length && wc.document.querySelector(".sp-capo"); }, 5000)) no("il compagno non vede «Decide …» («" + T(wc).slice(0, 120) + "»)");
    if (bottone(wc, /^Gioca ▶/)) no("il compagno ha «Gioca»");
    if (!new RegExp("Decide " + nomeDi(C, capo)).test(T(wc))) no("il compagno non legge «Decide " + nomeDi(C, capo) + "»");
    if (!bottone(wk, /^Gioca ▶/)) no("il capo non ha «Gioca»");
    if (!/👑/.test(wk.document.querySelector(".sp-col.c" + sq + " .sp-col-tx").textContent)) no("in testa alla colonna non c'è 👑 accanto al capo");
    // il compagno segna due carte: le faccine sulla mano del capo
    var cc = carte(wc), scelte = testi([cc[1], cc[3]]);
    tocca(wc, cc[1]); tocca(wc, cc[3]);
    if (!await W.aspetta(function () { return wk.document.querySelectorAll(".sp-carta .sp-sg .sp-fa").length === 2; }, 4000)) no("sulla mano del capo non compaiono le 2 faccine (" + wk.document.querySelectorAll(".sp-carta .sp-sg .sp-fa").length + ")");
    var conFaccia = [].filter.call(wk.document.querySelectorAll(".sp-carta"), function (b) { return b.querySelector(".sp-sg .sp-fa"); }).map(function (b) { return b.querySelector(".sp-tx").textContent; });
    if (conFaccia.sort().join("|") !== scelte.slice().sort().join("|")) no("le faccine sono sulle carte sbagliate");
    // i segni: solo ai telefoni della squadra, mai nella foto
    var sp = segniPassati();
    if (!sp.length) no("non passano messaggi «segni»");
    sp.forEach(function (d) { var m = membri(C, d.sq); (d.per || []).forEach(function (id) { if (m.indexOf(id) < 0) no("i segni della squadra " + (d.sq + 1) + " arrivano a " + nomeDi(C, id) + " che non è della squadra"); }); });
    if (!sp.some(function (d) { return d.sq === sq && Object.keys(d.s || {}).indexOf(comp) >= 0; })) no("non passano i segni del compagno");
    if (JSON.stringify(vm(C)).indexOf(scelte[0]) >= 0) no("una carta segnata è nella foto per tutti");
    // il compagno prova a giocare a mano: l'host non accetta
    var k0 = vm(C).step.i;
    W.reteDi(nomeDi(C, comp)).invia({ t: "gioca", carte: scelte.slice(0, vm(C).step.n) });
    await W.dorme(900);
    if (vm(C).step && vm(C).step.i !== k0) no("il compagno (non capo) ha giocato le carte mandando la mossa a mano");
    // l'altra squadra segna già le carte per il suo turno
    var wa = telDi(C, memA[0]), wa2 = memA[1] ? telDi(C, memA[1]) : null;
    if (!/Segna già le carte/.test(T(wa))) no("l'altra squadra non legge «Segna già le carte…» («" + T(wa).slice(0, 140) + "»)");
    var ca = carte(wa); if (!ca.length) no("l'altra squadra non può toccare le carte mentre aspetta");
    tocca(wa, ca[0]);
    if (wa2 && !await W.aspetta(function () { return wa2.document.querySelector(".sp-carta .sp-sg .sp-fa"); }, 4000)) no("il compagno dell'altra squadra non vede la faccina sulla carta segnata in anticipo");
    // il capo gioca le carte segnate dal compagno
    var ck = carte(wk).filter(function (b) { return scelte.indexOf(b.querySelector(".sp-tx").textContent) >= 0; });
    ck.slice(0, vm(C).step.n).forEach(function (b) { if (!b.classList.contains("su")) tocca(wk, b); });
    bottone(wk, /^Gioca ▶/).click();
    if (!await W.aspetta(function () { return vm(C).scen[sq].voci.some(function (x) { return scelte.indexOf(x.testo) >= 0; }); }, 4000)) no("le carte del capo non vanno sul tavolo");
    // al turno dell'altra squadra la carta segnata prima è già scelta da chi l'aveva segnata
    if (!await W.aspetta(function () { return vm(C).step && vm(C).step.sq === altra; }, 3000)) no("non tocca all'altra squadra");
    var segnata = testi([ca[0]])[0];
    if (!await W.aspetta(function () { var s = wa.document.querySelector(".sp-carta.su .sp-tx"); return s && s.textContent === segnata; }, 3000)) note.push("(la carta segnata prima non è già scelta: " + (vm(C).capo[altra] === memA[0] ? "è il capo" : "") + ")");
    note.push("segni passati " + sp.length + ", sempre solo alla squadra");
    await finoAllaFine(C);
    return note.join(" · ");
  } });

  // ===================== spn2: il capo sparisce =====================
  COPIONE.aggiungi("spn2", { nome: "Sì… però: il capo sparisce e il capo passa al compagno; sparisce anche lui e la squadra vuota gioca le carte più segnate", fai: async function () {
    var X = await stanza(["Giulia", "Luca", "Sara", "Marco"]), C = X.C, v = vm(C);
    // si aspetta che tocchi a una squadra senza Paky (Paky tiene la partita: non può sparire)
    var giri = 0;
    while (giri++ < 6 && vm(C).fase === "gioco" && membri(C, vm(C).step.sq).indexOf("host") >= 0) await giocaCapo(C);
    v = vm(C);
    if (v.fase !== "gioco") return "Paky era in tutte e due le squadre? (salto)";
    var sq = v.step.sq, mem = membri(C, sq);
    if (mem.indexOf("host") >= 0) return "tocca sempre alla squadra di Paky (salto)";
    var capo = v.capo[sq], comp = mem.filter(function (id) { return id !== capo; })[0], wc = telDi(C, comp);
    await W.aspetta(function () { return carte(wc).length >= 3; }, 4000);
    var cc = carte(wc), scelte = testi(cc.slice(0, v.step.n)).reverse();
    cc.slice(0, v.step.n).forEach(function (b) { tocca(wc, b); });
    await W.dorme(600);
    var nc = nomeDi(C, capo); W.spegni(nc);
    if (!await W.aspetta(function () { return vm(C).capo[sq] === comp; }, 30000)) no("dopo che " + nc + " è sparito il capo non passa al compagno (" + vm(C).capo[sq] + ")");
    if (!await W.aspetta(function () { return bottone(wc, /^Gioca ▶/); }, 4000)) no("il nuovo capo non ha «Gioca»");
    var stepI = vm(C).step.i;
    W.spegni(nomeDi(C, comp));
    if (!await W.aspetta(function () { var x = vm(C); return !x.step || x.step.i !== stepI; }, 34000)) no("la squadra vuota non gioca da sola");
    var voci = vm(C).scen[v.step.bers === "se" ? sq : (sq ? 0 : 1)].voci.map(function (x) { return x.testo; });
    scelte.forEach(function (c) { if (voci.indexOf(c) < 0) no("la squadra vuota non ha giocato la carta segnata «" + c.slice(0, 30) + "…»"); });
    return "capo " + nc + " sparito → capo " + nomeDi(C, comp) + "; squadra vuota → giocate le " + scelte.length + " carte segnate";
  } });

  // ===================== spn3: chi arriva tardi sceglie la squadra =====================
  COPIONE.aggiungi("spn3", { nome: "Sì… però: chi arriva mentre si giocano le carte sceglie la squadra ed entra subito; all'arringa entra dal round dopo; tutti fanno il giudice", fai: async function () {
    var X = await stanza(["Giulia", "Luca", "Sara"]), C = X.C, v = vm(C), tot0 = v.totale, note = [];
    var wt = await W.apriTel("Tom", { hash: "gioco=sipero&stanza=" + C, x: 740, spiaSp: true });
    if (!await W.aspetta(function () { return wt.document.querySelector(".sp-entra"); }, 8000)) no("Tom non vede la scelta della squadra («" + T(wt).slice(0, 140) + "»)");
    var m0 = membri(C, 0).length, m1 = membri(C, 1).length, piccola = m0 < m1 ? 0 : m1 < m0 ? 1 : -1;
    if (piccola >= 0 && !/più piccola/.test(wt.document.querySelector(".sp-entra .c" + piccola).textContent)) no("la squadra più piccola non ha «👈 è più piccola»");
    if (!/entri dal prossimo round/.test(T(wt))) no("Tom non legge che può anche guardare ed entrare dal prossimo round");
    var k = piccola >= 0 ? piccola : 1;
    wt.document.querySelector(".sp-entra .c" + k).click();
    var idT = null;
    if (!await W.aspetta(function () { idT = idDi(C, "Tom"); return idT && vm(C).assegna[idT] === k; }, 5000)) no("Tom non entra nella squadra " + (k + 1));
    if (vm(C).totale !== tot0 + 1) no("con Tom i round non diventano " + (tot0 + 1) + " (" + vm(C).totale + ")");
    if (!await W.aspetta(function () { return wt.document.querySelectorAll(".sp-carta").length >= 3; }, 5000)) no("Tom non riceve la mano della squadra");
    note.push("Tom nella squadra " + (k + 1) + ", round " + vm(C).totale);
    await finoArringa(C);
    var wb = await W.apriTel("Bea", { hash: "gioco=sipero&stanza=" + C, x: 925, spiaSp: true });
    if (!await W.aspetta(function () { return /entri dal prossimo round/.test(T(wb)) || (vm(C).giocatori || []).some(function (g) { return g.nome === "Bea"; }) && vm(C).fase !== "arringa"; }, 8000)) no("Bea all'arringa non legge «entri dal prossimo round» («" + T(wb).slice(0, 140) + "»)");
    if (wb.document.querySelector(".sp-entra")) no("all'arringa Bea può scegliere la squadra");
    await finoAllaFine(C, 300000);
    var sf = vm(C).statFine || {}, giud = Object.keys(sf).map(function (id) { return nomeDi(C, id) + " " + sf[id].roundGiudice; });
    Object.keys(sf).forEach(function (id) { if (sf[id].roundGiudice !== 1) no("alla fine " + nomeDi(C, id) + " ha fatto il giudice " + sf[id].roundGiudice + " volte (" + giud.join(", ") + ")"); });
    note.push("giudici: " + giud.join(", ") + " · round " + vm(C).totale);
    return note.join(" · ");
  } });

  // ===================== spn4: il verdetto =====================
  COPIONE.aggiungi("spn4", { nome: "Sì… però: il verdetto si conferma, la luce gira su tutti, vibrazioni, la stella solo del giudice, «⭐ Le carte…» alla fine", fai: async function () {
    var X = await stanza(["Giulia", "Luca", "Sara"]), C = X.C, note = [];
    ["Paky", "Giulia", "Luca", "Sara"].forEach(function (n) { vibrazioni(W.finestra(n)); });
    var wg = await finoGiudizio(C), gid = vm(C).giudiceId;
    var b = wg.document.querySelector(".sp-vota.c1");
    b.click(); await W.dorme(600);
    if (vm(C).fase !== "giudizio") no("il primo tocco decide già (senza conferma)");
    if (!/Confermi/.test(b.textContent)) no("dopo il primo tocco il tasto non chiede «Confermi?»");
    // cambia idea: tocca l'altra squadra, poi conferma quella
    var b0 = wg.document.querySelector(".sp-vota.c0"); b0.click(); await W.dorme(200);
    if (/Confermi/.test(b.textContent) || !/Confermi/.test(b0.textContent)) no("cambiando squadra la conferma non passa all'altra");
    ["Paky", "Giulia", "Luca", "Sara"].forEach(function (n) { W.finestra(n).__vib = []; });
    b0.click();
    if (!await W.aspetta(function () { return vm(C).fase === "esito"; }, 4000)) no("il verdetto non arriva");
    var vinti = membri(C, 0), persi = membri(C, 1), wv = telDi(C, vinti[0]), wp = telDi(C, persi[0]);
    await W.dorme(400);
    if (!/🥁/.test(wv.document.querySelector(".sp-turno").textContent)) no("subito dopo il verdetto non c'è «🥁 Il giudice ha deciso…» («" + wv.document.querySelector(".sp-turno").textContent + "»)");
    if (wv.document.querySelector(".sp-col.vince")) no("durante la luce si vede già chi ha vinto");
    if (!await W.aspetta(function () { return wv.document.querySelector(".sp-col.luce"); }, 1500)) no("la luce non passa sugli scenari");
    if (!await W.aspetta(function () { return /Il round va alla Squadra 1/.test(wv.document.querySelector(".sp-turno").textContent) && wv.document.querySelector(".sp-col.c0.vince"); }, 4500)) no("dopo la luce non si vede chi ha vinto");
    await W.dorme(300);
    var vv = (wv.__vib || []).filter(function (p) { return Array.isArray(p) && p.length >= 5; }).length, vp = (wp.__vib || []).filter(function (p) { return p === 110; }).length;
    if (!vv) no("a chi vince non arriva la vibrazione di festa (" + JSON.stringify(wv.__vib) + ")");
    if (!vp) no("a chi perde non arriva il colpo lungo (" + JSON.stringify(wp.__vib) + ")");
    if (!wv.document.querySelector(".sp-vfacce .sp-vfa")) no("sotto il cartello non ci sono le faccine di chi ha vinto");
    // la stella: prima uno che non è il giudice (a mano), poi il giudice due volte
    if (wv.document.querySelector(".sp-col.scegli")) no("chi non è il giudice può scegliere la stella");
    W.reteDi(nomeDi(C, persi[0])).invia({ t: "stella", i: 1 }); await W.dorme(600);
    if (vm(C).stella != null) no("la stella l'ha messa chi non è il giudice");
    if (!await W.aspetta(function () { return wg.document.querySelector(".sp-col.c0.scegli"); }, 3000)) no("il giudice non può toccare la carta che l'ha convinto");
    var mini = wg.document.querySelectorAll(".sp-col.c0 .sp-mini"); mini[2].click();
    if (!await W.aspetta(function () { return vm(C).stella === 2; }, 3000)) no("la stella non arriva all'host (" + vm(C).stella + ")");
    if (!await W.aspetta(function () { var s = wp.document.querySelectorAll(".sp-col.c0 .sp-mini")[2]; return s && s.classList.contains("stella") && /⭐/.test(s.textContent); }, 3000)) no("chi ha perso non vede la stella sulla carta");
    var m3 = wg.document.querySelectorAll(".sp-col.c0 .sp-mini")[0]; m3.click(); await W.dorme(600);
    if (vm(C).stella !== 2) no("il giudice ha cambiato la stella con un secondo tocco");
    note.push("conferma, luce, vibrazioni (" + vv + " festa, " + vp + " colpo), stella sulla carta 3");
    await finoAllaFine(C, 300000);
    var st = vm(C).stelle || [];
    if (st.length < 1) no("alla fine non ci sono le carte che hanno convinto");
    var P = W.finestra("Paky"), bs = await W.aspetta(function () { return bottone(P, /Le carte che hanno convinto/); }, 4000);
    if (!bs) no("nella classifica finale non c'è «⭐ Le carte che hanno convinto»");
    bs.click(); await W.dorme(400);
    var righe = P.document.querySelectorAll(".sp-lente .sp-lente-r").length;
    if (righe !== st.length) no("la lente delle stelle ha " + righe + " carte invece di " + st.length);
    if (!/Round 1 · ha convinto/.test(T(P))) no("le carte della serata non dicono il round e il giudice");
    note.push(st.length + " carte della serata");
    return note.join(" · ");
  } });

  // ===================== spn5: Ognuno per sé, chi arriva tardi =====================
  COPIONE.aggiungi("spn5", { nome: "Sì… però Ognuno per sé: chi arriva ai Bonus entra subito (giro dei Malus rifatto), chi arriva ai Malus dal round dopo", fai: async function () {
    var X = await stanza(["Giulia", "Luca", "Sara"], { si: "solo" }), C = X.C, v = vm(C), tot0 = v.totale;
    if (!v.solo || v.passoS !== "bonus") no("non si comincia coi Bonus di «Ognuno per sé»");
    var n0 = v.pres.length;
    var wt = await W.apriTel("Tom", { hash: "gioco=sipero&stanza=" + C, x: 740, spiaSp: true });
    if (!await W.aspetta(function () { var x = vm(C); var id = idDi(C, "Tom"); return id && x.pres && x.pres.indexOf(id) >= 0; }, 8000)) no("Tom arrivato ai Bonus non entra nel giro (" + (vm(C).pres || []).map(function (id) { return nomeDi(C, id); }) + ")");
    var x = vm(C), idT = idDi(C, "Tom");
    if (x.pres.length !== n0 + 1) no("nel giro non sono " + (n0 + 1));
    x.pres.forEach(function (id, i) { if (x.bers[id] !== x.pres[(i + 1) % x.pres.length]) no("il giro dei Malus non è rifatto: " + nomeDi(C, id) + " rovina " + nomeDi(C, x.bers[id])); });
    if (x.totale !== tot0 + 1) no("con Tom i round non diventano " + (tot0 + 1));
    if (!await W.aspetta(function () { return carte(wt).length === 4; }, 6000)) no("Tom non ha i suoi 4 Bonus («" + T(wt).slice(0, 120) + "»)");
    // tutti giocano i Bonus (Tom compreso)
    for (var i = 0; i < x.pres.length; i++) {
      var w = telDi(C, x.pres[i]);
      await W.aspetta(function () { return carte(w).length >= 2; }, 4000);
      var cc = carte(w); tocca(w, cc[0]); tocca(w, cc[1]); bottone(w, /^Gioca ▶/).click(); await W.dorme(250);
    }
    if (!await W.aspetta(function () { return vm(C).passoS === "malus"; }, 6000)) no("non si passa ai Malus");
    var wb = await W.apriTel("Bea", { hash: "gioco=sipero&stanza=" + C, x: 925, spiaSp: true });
    if (!await W.aspetta(function () { return /entri dal prossimo round/.test(T(wb)); }, 8000)) no("Bea arrivata ai Malus non legge «entri dal prossimo round» («" + T(wb).slice(0, 140) + "»)");
    var idB = idDi(C, "Bea");
    if (vm(C).pres.indexOf(idB) >= 0) no("Bea arrivata ai Malus è entrata nel giro");
    return "Tom entra ai Bonus (giro di " + x.pres.length + ", " + x.totale + " round), Bea ai Malus aspetta";
  } });

  // ===================== spn6: ripresa e riserva =====================
  COPIONE.aggiungi("spn6", { nome: "Sì… però: l'host ricarica coi segni e dopo la stella, poi sparisce e il vice tiene capo e segni", fai: async function () {
    var X = await stanza(["Giulia", "Luca", "Sara", "Marco"]), C = X.C, v = vm(C), note = [];
    // una squadra di turno senza Paky
    var giri = 0; while (giri++ < 6 && membri(C, vm(C).step.sq).indexOf("host") >= 0 && vm(C).fase === "gioco") await giocaCapo(C);
    v = vm(C); if (v.fase !== "gioco" || membri(C, v.step.sq).indexOf("host") >= 0) return "tocca sempre alla squadra di Paky (salto)";
    var sq = v.step.sq, capo = v.capo[sq], comp = membri(C, sq).filter(function (id) { return id !== capo; })[0], wc = telDi(C, comp), wk = telDi(C, capo);
    await W.aspetta(function () { return carte(wc).length >= 2; }, 4000);
    tocca(wc, carte(wc)[0]);
    if (!await W.aspetta(function () { return wk.document.querySelector(".sp-sg .sp-fa"); }, 4000)) no("la faccina non arriva al capo");
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { var x = vm(C); return x.fase === "gioco" && (W.statoStanza(C) || {})._r; }, 15000)) no("la partita non riprende dopo la ricarica dell'host");
    await W.dorme(1500);
    if (vm(C).capo[sq] !== capo) no("dopo la ricarica il capo è cambiato");
    wk = telDi(C, capo);
    if (!await W.aspetta(function () { return wk.document.querySelector(".sp-sg .sp-fa"); }, 6000)) no("dopo la ricarica dell'host il capo non vede più la faccina del compagno");
    note.push("ricarica: capo e faccine uguali");
    // fino al verdetto, stella, ricarica
    var wg = await finoGiudizio(C); await decidi(C, 0);
    await W.dorme(3600);
    wg = telDi(C, vm(C).giudiceId);
    var mini = await W.aspetta(function () { return wg.document.querySelector(".sp-col.c0.scegli .sp-mini"); }, 3000);
    if (!mini) no("il giudice non può mettere la stella"); mini.click();
    if (!await W.aspetta(function () { return vm(C).stella === 0; }, 3000)) no("la stella non arriva");
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { var x = vm(C); return x.fase === "esito" && (W.statoStanza(C) || {})._r; }, 15000)) no("dopo la stella la partita non riprende sull'esito");
    if (vm(C).stella !== 0) no("dopo la ricarica la stella è sparita");
    note.push("ricarica sull'esito: stella rimasta");
    // il round dopo: Paky sparisce, il vice tiene la partita con capo e segni
    var fine = Date.now() + 30000; while (vm(C).fase === "esito" && Date.now() < fine) { (vm(C).giocatori || []).forEach(function (g) { var w = W.finestra(g.nome); if (w) W.clicca(w, /Avanti/); }); await W.dorme(600); }
    v = vm(C); if (v.fase !== "gioco") no("non comincia il round dopo");
    var sq2 = v.step.sq, capo2 = v.capo[sq2];
    A.muore("Paky");
    if (!await W.aspetta(function () { var h = A.chiTiene(C).h; return h && h !== "host"; }, 30000)) no("nessun vice prende la partita");
    await W.dorme(1200);
    if (vm(C).capo[sq2] !== capo2 && capo2 !== "host") no("col vice il capo è cambiato (" + nomeDi(C, vm(C).capo[sq2]) + " invece di " + nomeDi(C, capo2) + ")");
    note.push("vice " + nomeDi(C, A.chiTiene(C).h) + ": capo uguale");
    return note.join(" · ");
  } });

  // ===================== spn7: la memoria delle uscite =====================
  COPIONE.aggiungi("spn7", { nome: "Sì… però: la memoria delle carte uscite (mazzo nuovo con le mai viste in cima; l'host segna quelle arrivate in mano)", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    var S = P.__sipero, dati = P.SG_SIPERO;
    if (!S || !S.pilaFresca) no("niente pilaFresca nelle prove");
    // viste le carte dalla 11ª alla 330ª (la memoria ne tiene 320 per tipo), dalla più vecchia alla più recente
    var viste = dati.bonus.slice(10, 330), mai = dati.bonus.length - viste.length;
    P.localStorage.setItem("sg-sipero-uscite", JSON.stringify({ bonus: viste.map(S.impronta), malus: [] }));
    S.rileggiMemoria();
    var pila = S.pilaFresca({ mischia: function (a) { return a.slice(); } }, dati.bonus, "bonus");
    var cima = pila.slice(-mai);   // (si pesca dalla fine)
    if (cima.some(function (c) { return viste.indexOf(c) >= 0; })) no("in cima al mazzo c'è una carta già vista");
    if (dati.bonus.slice(0, 10).some(function (c) { return cima.indexOf(c) < 0; })) no("le carte mai viste non sono in cima");
    if (pila[pila.length - mai - 1] !== viste[0]) no("dopo le mai viste non viene la vista da più tempo");
    if (pila[0] !== viste[viste.length - 1]) no("la carta vista più di recente non è in fondo al mazzo");
    P.localStorage.removeItem("sg-sipero-uscite"); S.rileggiMemoria();
    // una partita vera: l'host segna le carte arrivate in mano
    var X = await stanza(["Giulia", "Luca"]), Pk = W.finestra("Paky");
    await W.dorme(900);
    var m = JSON.parse(Pk.localStorage.getItem("sg-sipero-uscite") || "{}");
    if (!(m.bonus && m.bonus.length >= 7 && m.malus && m.malus.length >= 7)) no("l'host non ha segnato le carte arrivate in mano (" + JSON.stringify({ b: m.bonus && m.bonus.length, m: m.malus && m.malus.length }) + ")");
    var mg = JSON.parse(W.finestra("Giulia").localStorage.getItem("sg-sipero-uscite") || "null");
    if (mg) no("anche chi non tiene il mazzo scrive la memoria");
    return "mai viste in cima, viste da più tempo dopo; in partita l'host ricorda " + m.bonus.length + " Bonus e " + m.malus.length + " Malus";
  } });

  // ===================== spn8: le misure =====================
  async function misura(w, nome, larg, alt, cosa) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{animation:none!important}.sp-mini.nuova{animation:none!important}.sp-presenta{display:none!important}"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(450);
    var sc = d.querySelector(".sp-scena"); if (!sc) return cosa + ": non c'è il tavolo";
    if (d.documentElement.scrollHeight > alt + 1) return cosa + " " + larg + "x" + alt + ": la pagina scorre (" + d.documentElement.scrollHeight + ")";
    if (d.documentElement.scrollWidth > larg + 1) return cosa + " " + larg + "x" + alt + ": scorre di lato";
    var p = sc.querySelector(".sp-piede"), r = p.getBoundingClientRect();
    if (p.children.length && r.bottom > alt + 1) return cosa + " " + larg + "x" + alt + ": il piede esce (" + Math.round(r.bottom) + ")";
    var cc = d.querySelectorAll(".sp-carta");
    for (var i = 0; i < cc.length; i++) { var c = cc[i].getBoundingClientRect(); if (c.height < 30 || c.bottom > alt + 1) return cosa + " " + larg + "x" + alt + ": carta troppo bassa o fuori (" + Math.round(c.height) + ")"; }
    var bb = sc.querySelectorAll(".sp-piede button, .sp-entra button");
    for (var j = 0; j < bb.length; j++) if (bb[j].scrollWidth > bb[j].clientWidth + 2) return cosa + " " + larg + "x" + alt + ": la scritta «" + bb[j].textContent + "» è tagliata";
    var az = sc.querySelector(".sp-azione"); if (az) { var ra = az.getBoundingClientRect(); if (ra.bottom > alt + 1) return cosa + " " + larg + "x" + alt + ": il centro esce (" + Math.round(ra.bottom) + ")"; }
    return "";
  }
  async function misure(w, nome, cosa) {
    var m = (await misura(w, nome, 360, 640, cosa)) || (await misura(w, nome, 412, 915, cosa));
    var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px";
    if (m) no(m);
  }
  COPIONE.aggiungi("spn8", { nome: "Sì… però: le schermate nuove a 360x640 e 412x915 (capo, compagno, giudice, chi arriva, verdetto, stella)", fai: async function () {
    var X = await stanza(["Giulia", "Luca", "Sara", "Marco", "Bea"]), C = X.C, v = vm(C);
    var sq = v.step.sq, capo = v.capo[sq], comp = membri(C, sq).filter(function (id) { return id !== capo; })[0];
    var nk = nomeDi(C, capo), nc = nomeDi(C, comp), ng = nomeDi(C, v.giudiceId);
    await W.aspetta(function () { return carte(W.finestra(nc)).length; }, 4000);
    tocca(W.finestra(nc), carte(W.finestra(nc))[0]); tocca(W.finestra(nc), carte(W.finestra(nc))[2]);
    await W.dorme(600);
    await misure(W.finestra(nk), nk, "il capo con le faccine");
    await misure(W.finestra(nc), nc, "il compagno col riquadro del capo");
    await misure(W.finestra(ng), ng, "il giudice che aspetta");
    var wt = await W.apriTel("Tom", { hash: "gioco=sipero&stanza=" + C, x: 1110 });
    await W.aspetta(function () { return wt.document.querySelector(".sp-entra"); }, 8000);
    await misure(wt, "Tom", "chi arriva e sceglie la squadra");
    var wg = await finoGiudizio(C);
    wg.document.querySelector(".sp-vota.c1").click(); await W.dorme(200);
    await misure(wg, nomeDi(C, vm(C).giudiceId), "il verdetto da confermare");
    wg.document.querySelector(".sp-vota.c1").click();
    await W.aspetta(function () { return vm(C).fase === "esito"; }, 4000);
    await W.dorme(3800);
    await misure(wg, nomeDi(C, vm(C).giudiceId), "l'esito col «⭐ Tocca la carta»");
    var mini = wg.document.querySelector(".sp-col.scegli .sp-mini"); if (mini) mini.click();
    await W.dorme(700);
    await misure(W.finestra(nc), nc, "l'esito con la stella");
    return "capo, compagno, giudice, Tom, verdetto ed esito senza scorrere a 360x640 e 412x915";
  } });
})();
