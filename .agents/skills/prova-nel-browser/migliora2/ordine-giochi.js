// PROVE DI «🧩 ORDINE DEI GIOCHI» (20 ott 2026): il proprietario (IL PAPPONE) tiene premuta una tessera della home e
// riordina i giochi; l'ordine si salva nella sua scheda pubblica e vale per tutti (home, categorie, Sala).
// Uso (dopo copione-prova.js): await COPIONE.carica("migliora2/ordine-giochi.js"); await COPIONE.prova("og1")
// Con Edge invisibile: prova.js --porta 8972 --carica migliora2/ordine-giochi.js --prova og1,og2,og3,og4,og5 --rifai
// La scheda pubblica è quella finta del copione (botFinti: BR.pubblici[nome]); mai account veri.
//
// og1: IL PAPPONE. Il dito che scorre non apre niente; il tocco lungo apre «Ordine dei giochi» (anche col dito ancora giù) e il
//      "click" che arriva quando si alza il dito non apre il gioco né sposta niente; «⬆️ In cima» su Parola d'ordine, una riga
//      trascinata con la maniglia ⠿, «💾 Salva per tutti» → la home ha Parola d'ordine prima (anche nella categoria), la
//      scheda pubblica e il telefono hanno l'ordine; il click arrivato alla tessera vecchia non apre il gioco; un tocco breve
//      apre ancora il gioco.
// og2: un altro profilo (Luca): la home si rimette in fila da sola quando arriva la scheda (stesse tessere, niente ridisegno),
//      ricaricando la usa subito (copia sul telefono, scheda che non risponde), il suo tocco lungo non apre niente, e nella
//      Sala «Quale gioco?» ha lo stesso ordine.
// og3: i giochi che mancano nella lista (es. giochi nuovi) vanno in fondo, nell'ordine di sempre; un id sconosciuto non conta.
// og4: «↩️ Ordine di partenza» + Salva rimette l'ordine di sempre per tutti ([] nella scheda, copia tolta, Luca si rimette in
//      fila); «Annulla» con un cambio chiede «Uscire senza salvare?» e non salva niente.
// og5: misure a 360x640 e 412x915: la pagina non scorre, scorre solo la lista; le righe stanno nella larghezza; trascinando
//      una riga contro il bordo alto la lista scorre da sola e la riga arriva in cima.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no, PAPPONE = "IL PAPPONE";

  // la scheda pubblica finta (botFinti) con la risposta che arriva dopo W.__ogRitardo ms (0 = subito)
  function schedaLenta(w) {
    A.botFinti(w);
    var cerca = w.SGNube.cercaNome;
    w.SGNube.cercaNome = function (n) {
      var ms = +W.__ogRitardo || 0;
      if (!ms) return cerca(n);
      return new w.Promise(function (ok, ko) { w.setTimeout(function () { cerca(n).then(ok, ko); }, ms); });   // (il tempo del telefono: muore con lui)
    };
  }
  function tessere(w) { return [].map.call(w.document.querySelectorAll(".home .griglia-giochi .tessera[data-gioco]"), function (t) { return t.getAttribute("data-gioco"); }); }
  function tessera(w, id) { return w.document.querySelector('.home .griglia-giochi .tessera[data-gioco="' + id + '"]'); }
  function righe(w) { return [].map.call(w.document.querySelectorAll(".og-riga"), function (r) { return r.getAttribute("data-gioco"); }); }
  function riga(w, id) { return w.document.querySelector('.og-riga[data-gioco="' + id + '"]'); }
  function aperta(w) { return !!w.document.querySelector(".og-sc"); }
  function inHome(w) { return !!w.document.querySelector(".schermata.home .griglia-giochi .tessera"); }
  function nelGioco(w) { return !!w.document.querySelector(".modo-grande") || /Come giocate/.test(T(w)); }
  async function home(w) { if (!await W.aspetta(function () { return inHome(w) && tessere(w).length > 10; }, 6000)) no("non arriva la home coi giochi («" + T(w).slice(0, 80) + "»)"); }
  // il dito (pointer "touch") su un nodo: giù al centro, poi (facoltativo) si sposta di dy
  function ev(w, nodo, tipo, x, y) {
    nodo.dispatchEvent(new w.PointerEvent(tipo, { bubbles: true, cancelable: true, pointerId: 7, pointerType: "touch", isPrimary: true, clientX: x, clientY: y, button: tipo === "pointermove" ? -1 : 0, buttons: tipo === "pointerup" ? 0 : 1 }));
  }
  function centro(nodo) { var r = nodo.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  // dove arriva un evento quando il dito si alza: l'elemento sotto il dito in quel momento (la tessera può non esserci più)
  function sotto(w, x, y) { return w.document.elementFromPoint(x, y) || w.document.body; }
  async function tocco(w, nodo, ms) {   // tocco breve: giù, su, click (come il telefono)
    var c = centro(nodo); ev(w, nodo, "pointerdown", c[0], c[1]); await W.dorme(ms || 80);
    ev(w, nodo, "pointerup", c[0], c[1]); nodo.click();
  }
  // il tocco lungo: giù, fermo per ms; poi (se su) il dito si alza e il click va dove dice clickA ("sotto" o "tessera")
  async function lungo(w, nodo, ms, clickA) {
    var c = centro(nodo); ev(w, nodo, "pointerdown", c[0], c[1]);
    await W.dorme(ms || 800);
    return { su: function () {
      var t = sotto(w, c[0], c[1]);
      if (clickA === "tessera") { ev(w, nodo, "pointerup", c[0], c[1]); nodo.click(); }
      else { ev(w, t, "pointerup", c[0], c[1]); t.click(); }
      return t;
    } };
  }
  // trascina la riga con la sua maniglia di dy px (a passi da 16 ms); attesa = ms fermo alla fine prima di alzare il dito
  async function trascina(w, id, dy, attesa, assoluto) {
    var r = riga(w, id), m = r && r.querySelector(".og-maniglia"); if (!m) no("non trovo la maniglia di " + id);
    var c = centro(m), y1 = assoluto != null ? assoluto : c[1] + dy, n = 12;
    ev(w, m, "pointerdown", c[0], c[1]);
    for (var k = 1; k <= n; k++) { await W.dorme(16); ev(w, m, "pointermove", c[0], c[1] + (y1 - c[1]) * k / n); }
    if (attesa) await W.dorme(attesa);
    if (!r.classList.contains("og-preso")) no("mentre la trascino la riga di " + id + " non è «presa»");
    ev(w, m, "pointerup", c[0], y1);
    await W.dorme(60);
  }
  async function apriOrdine(w, id) {
    var t = tessera(w, id || "tris"); if (!t) no("non trovo la tessera " + (id || "tris"));
    var p = await lungo(w, t, 800);
    if (!aperta(w)) no("col dito fermo 0,8 s sulla tessera non si apre «Ordine dei giochi» («" + T(w).slice(0, 80) + "»)");
    p.su(); await W.dorme(150);
    if (!aperta(w)) no("alzando il dito si chiude «Ordine dei giochi»");
  }
  function tasto(w, re) { return [].find.call(w.document.querySelectorAll(".og-sc button"), function (b) { return re.test(b.textContent); }) || null; }
  async function salva(w) {
    var b = tasto(w, /Salva per tutti/); if (!b) no("non c'è «💾 Salva per tutti»");
    if (b.disabled) no("«💾 Salva per tutti» è spento dopo un cambio");
    b.click();
    if (!await W.aspetta(function () { return inHome(w); }, 4000)) no("dopo «Salva» (e il sì) non si torna in home («" + T(w).slice(0, 80) + "»)");
  }
  function ordineDi(w) { try { return JSON.parse(w.localStorage.getItem("sg-ordine-giochi") || "null"); } catch (e) { return "rotto"; } }
  // l'ordine di sempre: quello di una home senza nessun ordine salvato
  async function diPartenza() {
    var B = await W.apriTel("Zeta", { x: 740, prima: schedaLenta }); await home(B);
    var l = tessere(B); var f = document.getElementById("tel-Zeta"); if (f) f.remove();
    (W.BR.perNome.Zeta || []).forEach(function (c) { c.morto = true; c.connected = false; }); delete W.BR.tel.Zeta;
    return l;
  }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }

  COPIONE.aggiungi("og1", { nome: "Ordine dei giochi: tocco lungo del proprietario, «⬆️ In cima», trascinare, Salva per tutti", fai: async function () {
    W.__ogRitardo = 0;
    var P = await W.apriTel(PAPPONE, { x: 0, prima: schedaLenta }); await home(P);
    var prima = tessere(P);
    if (prima[0] === "ordine") no("Parola d'ordine è già la prima: la prova non dice niente");
    // 1) il dito che scorre: giù, si sposta di 30 px, resta 0,8 s → niente (né l'ordine né il gioco)
    var t = tessera(P, "tris"), c = centro(t);
    ev(P, t, "pointerdown", c[0], c[1]); await W.dorme(30); ev(P, t, "pointermove", c[0], c[1] - 30);
    await W.dorme(800); ev(P, t, "pointerup", c[0], c[1] - 30);
    if (aperta(P) || nelGioco(P) || !inHome(P)) no("il dito che scorre apre qualcosa («" + T(P).slice(0, 60) + "»)");
    // 2) il tocco lungo: si apre col dito ancora giù; il click di quando si alza (sull'elemento sotto il dito) non fa niente
    var vib = 0, vv = P.navigator.vibrate; P.navigator.vibrate = function () { vib++; return true; };
    var pr = await lungo(P, tessera(P, "tris"), 800);
    if (!aperta(P)) no("col dito fermo 0,8 s non si apre «Ordine dei giochi»");
    if (vib !== 1) no("aprendo la schermata le vibrazioni sono " + vib + " (doveva essere 1)");
    var dove = pr.su(); await W.dorme(200);
    if (!aperta(P) || nelGioco(P)) no("alzando il dito (click su «" + (dove.textContent || "").slice(0, 20) + "») si apre il gioco o si chiude la schermata");
    if (vib !== 1) no("alzando il dito vibra ancora (" + vib + ")");
    P.navigator.vibrate = vv;
    var l0 = righe(P);
    if (l0.join() !== prima.join()) no("la lista non ha i giochi della home nello stesso ordine: " + l0.slice(0, 5).join() + "…");
    if (!/^1\./.test(P.document.querySelector(".og-riga .og-n").textContent)) no("le righe non sono numerate");
    var bS = tasto(P, /Salva per tutti/);
    if (!bS || !bS.disabled) no("«💾 Salva per tutti» è acceso senza nessun cambio (il click di quando si alza il dito ha spostato qualcosa?)");
    if (!riga(P, l0[0]).querySelector(".og-cima").disabled || !riga(P, l0[l0.length - 1]).querySelector(".og-scende").disabled) no("il primo ha «In cima» acceso o l'ultimo ha ⬇️ acceso");
    // 3) «⬆️ In cima» su Parola d'ordine
    var bc = riga(P, "ordine").querySelector(".og-cima"); if (!/In cima/.test(bc.textContent)) no("il tasto non dice «⬆️ In cima»");
    var nodoPrima = riga(P, "ordine");
    bc.click(); await W.dorme(100);
    var l1 = righe(P);
    if (l1[0] !== "ordine") no("dopo «⬆️ In cima» il primo è " + l1[0]);
    if (riga(P, "ordine") !== nodoPrima) no("la riga è stata ridisegnata invece che spostata");
    if (riga(P, "ordine").querySelector(".og-n").textContent !== "1.") no("Parola d'ordine in cima non ha il numero 1");
    if (bS.disabled) no("dopo un cambio «Salva» resta spento");
    // ⬇️ e ⬆️ di uno sulla terza riga
    var terza = l1[2]; riga(P, terza).querySelector(".og-scende").click(); await W.dorme(50);
    if (righe(P)[3] !== terza) no("⬇️ non porta giù di uno");
    riga(P, terza).querySelector(".og-sale").click(); await W.dorme(50);
    if (righe(P)[2] !== terza) no("⬆️ non porta su di uno");
    // 4) trascinare: la quinta riga sale di due posti
    var r5 = righe(P)[4], h = riga(P, r5).getBoundingClientRect().height + 8;
    await trascina(P, r5, -2 * h - h / 4, 100);   // (un po' oltre la metà della riga: la scavalca)
    var l2 = righe(P);
    if (l2[2] !== r5) no("trascinata su di due righe, " + r5 + " è al posto " + (l2.indexOf(r5) + 1) + " (doveva essere il 3)");
    if (riga(P, r5).style.transform || riga(P, r5).classList.contains("og-preso")) no("lasciata la riga resta spostata o «presa»");
    if (l2[0] !== "ordine") no("trascinando si è spostata anche Parola d'ordine");
    // 5) Salva per tutti → la home ha l'ordine nuovo; scheda pubblica e telefono pure
    await salva(P);
    var h1 = tessere(P);
    if (h1[0] !== "ordine") no("in home il primo è " + h1[0] + " invece di Parola d'ordine");
    if (h1.join() !== l2.join()) no("la home non ha l'ordine salvato");
    var pub = (W.BR.pubblici[PAPPONE] || {}).ordineGiochi;
    if (!Array.isArray(pub) || pub.join() !== l2.join()) no("nella scheda pubblica l'ordine è " + JSON.stringify(pub).slice(0, 80));
    if ((ordineDi(P) || []).join() !== l2.join()) no("sul telefono l'ordine non è salvato");
    // nella categoria «Quiz & parole» Parola d'ordine è la prima e gli altri seguono lo stesso ordine
    if (!W.clicca(P, /Quiz & parole/, ".cat-tab")) no("non trovo la categoria «Quiz & parole»");
    await W.dorme(100);
    var cat = tessere(P), atteso = l2.filter(function (id) { return cat.indexOf(id) >= 0; });
    if (cat[0] !== "ordine" || cat.join() !== atteso.join()) no("nella categoria l'ordine è " + cat.join());
    W.clicca(P, /Tutti/, ".cat-tab"); await W.dorme(100);
    // 6) il click arrivato alla tessera (uscita dalla pagina) dopo un tocco lungo: il gioco non si apre
    var tv = tessera(P, "drop4") || tessera(P, h1[1]), pr2 = await lungo(P, tv, 750, "tessera");
    if (!aperta(P)) no("il secondo tocco lungo non apre la schermata");
    pr2.su(); await W.dorme(200);
    if (!aperta(P) || nelGioco(P)) no("il click alla tessera vecchia apre il gioco");
    var an = tasto(P, /^Annulla$/); if (!an) no("non c'è «Annulla»");
    an.click();   // (niente cambi: si torna in home senza domande)
    if (!await W.aspetta(function () { return inHome(P); }, 2000)) no("«Annulla» senza cambi non torna in home");
    if (tessere(P).join() !== l2.join()) no("dopo «Annulla» l'ordine della home è cambiato");
    // 7) un tocco breve apre ancora il gioco
    await tocco(P, tessera(P, "ordine"));
    if (!await W.aspetta(function () { return nelGioco(P); }, 3000)) no("un tocco breve su Parola d'ordine non apre il gioco («" + T(P).slice(0, 60) + "»)");
    if (aperta(P)) no("un tocco breve apre «Ordine dei giochi»");
    errori();
    return "scorrere = niente; tocco lungo = «Ordine dei giochi» (1 vibrazione, il click del dito non apre il gioco); In cima, ⬆️/⬇️, trascinata di 2; salvato: home " + h1.slice(0, 3).join(", ") + "…, categoria e scheda pubblica uguali; tocco breve = gioco";
  } });

  COPIONE.aggiungi("og2", { nome: "Ordine dei giochi: un altro profilo vede lo stesso ordine (home che si rimette in fila, copia sul telefono, Sala)", fai: async function () {
    var R = await diPartenza();
    var ord = ["ordine", "timeline", "asta"].concat(R.filter(function (id) { return ["ordine", "timeline", "asta"].indexOf(id) < 0; }));
    W.BR.pubblici[PAPPONE] = { nome: PAPPONE, ordineGiochi: ord };
    // 1) Luca apre: la scheda arriva dopo 1,2 s; intanto la home ha l'ordine di sempre, poi si rimette in fila da sola
    W.__ogRitardo = 1200;
    var L = await W.apriTel("Luca", { x: 0, prima: schedaLenta, salaSempre: true }); await home(L);
    var g0 = L.document.querySelector(".home .griglia-giochi"), t0 = tessere(L);
    if (t0[0] === "ordine") no("la scheda è arrivata troppo presto: la prova non dice niente");
    [].forEach.call(g0.children, function (x) { x.__segno = 1; });
    if (!await W.aspetta(function () { return tessere(L)[0] === "ordine"; }, 4000)) no("arrivata la scheda la home non si rimette in fila (" + tessere(L).slice(0, 3).join() + ")");
    if (tessere(L).join() !== ord.join()) no("la home di Luca non ha l'ordine del proprietario");
    if (L.document.querySelector(".home .griglia-giochi") !== g0 || [].some.call(g0.children, function (x) { return !x.__segno; })) no("la home è stata ridisegnata invece di spostare le tessere");
    if ((ordineDi(L) || []).join() !== ord.join()) no("il telefono di Luca non tiene la copia dell'ordine");
    // 2) Luca ricarica e la scheda non risponde: la home ha subito l'ordine giusto (la copia), niente salti
    W.__ogRitardo = 60000;
    L = await W.ricarica("Luca"); await home(L);
    if (tessere(L).join() !== ord.join()) no("ricaricando (scheda che non risponde) la home non usa la copia: " + tessere(L).slice(0, 3).join());
    // 3) il tocco lungo di Luca non apre niente
    var t = tessera(L, "tris"), c = centro(t);
    ev(L, t, "pointerdown", c[0], c[1]); await W.dorme(900); ev(L, t, "pointerup", c[0], c[1]); await W.dorme(150);
    if (aperta(L) || nelGioco(L) || !inHome(L)) no("il tocco lungo di Luca apre qualcosa («" + T(L).slice(0, 60) + "»)");
    // 4) nella Sala «Quale gioco?» lo stesso ordine (i giochi online)
    var S = await A.apriSalaNuova("Luca");
    if (!await W.aspetta(function () { return W.clicca(L, /Scegli (un|il primo) gioco|Prossimo gioco/); }, 5000)) no("nella Sala non c'è «Scegli un gioco»");
    var sl = await W.aspetta(function () { var l = [].map.call(L.document.querySelectorAll(".griglia-giochi .tessera[data-gioco]"), function (x) { return x.getAttribute("data-gioco"); }); return l.length > 5 ? l : null; }, 4000);
    if (!sl) no("nella Sala non vedo la lista dei giochi");
    var attesoS = ord.filter(function (id) { return sl.indexOf(id) >= 0; });
    if (sl[0] !== "ordine" || sl.join() !== attesoS.join()) no("nella Sala l'ordine è " + sl.slice(0, 4).join() + "…");
    errori();
    return "Luca: home rimessa in fila da sola (stesse tessere) → " + ord.slice(0, 3).join(", ") + "…; ricaricando subito giusta; tocco lungo = niente; Sala " + S + ": " + sl.slice(0, 3).join(", ") + "…";
  } });

  COPIONE.aggiungi("og3", { nome: "Ordine dei giochi: i giochi che non sono nella lista vanno in fondo, nell'ordine di sempre", fai: async function () {
    var R = await diPartenza(), via = ["tris", "drop4", "scopa"];
    var ord = ["ordine", "giocoinventato"].concat(R.filter(function (id) { return id !== "ordine" && via.indexOf(id) < 0; }).reverse());
    W.BR.pubblici[PAPPONE] = { nome: PAPPONE, ordineGiochi: ord };
    W.__ogRitardo = 0;
    var P = await W.apriTel("Paky", { x: 0, prima: schedaLenta }); await home(P);
    if (!await W.aspetta(function () { return tessere(P)[0] === "ordine"; }, 3000)) no("la scheda non arriva alla home");
    var l = tessere(P), atteso = ord.filter(function (id) { return id !== "giocoinventato"; }).concat(R.filter(function (id) { return via.indexOf(id) >= 0; }));
    if (l.join() !== atteso.join()) no("l'ordine è " + l.join() + " invece di " + atteso.join());
    if (l.length !== R.length) no("ci sono " + l.length + " tessere invece di " + R.length);
    errori();
    return "in fondo, nell'ordine di sempre: " + l.slice(-3).join(", ") + "; il gioco che non esiste non conta (" + l.length + " tessere)";
  } });

  COPIONE.aggiungi("og4", { nome: "Ordine dei giochi: «↩️ Ordine di partenza» per tutti, «Annulla» non salva", fai: async function () {
    var R = await diPartenza();
    var ord = ["ordine", "balla"].concat(R.filter(function (id) { return id !== "ordine" && id !== "balla"; }));
    W.BR.pubblici[PAPPONE] = { nome: PAPPONE, ordineGiochi: ord };
    W.__ogRitardo = 0;
    var P = await W.apriTel(PAPPONE, { x: 0, prima: schedaLenta }); await home(P);
    if (!await W.aspetta(function () { return tessere(P).join() === ord.join(); }, 3000)) no("il proprietario non vede l'ordine della sua scheda");
    // 1) «Annulla» dopo un cambio: chiede (e il telefono finto dice sì) e non salva niente
    await apriOrdine(P, "tris");
    riga(P, "tris").querySelector(".og-cima").click(); await W.dorme(80);
    var an = tasto(P, /^Annulla$/); an.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".conferma-sfondo"); }, 1500)) no("«Annulla» dopo un cambio non chiede «Uscire senza salvare?»");
    if (!/Uscire senza salvare/.test(T(P))) no("la domanda non è «Uscire senza salvare?»");
    if (!await W.aspetta(function () { return inHome(P); }, 3000)) no("dopo il sì non si torna in home");
    if (tessere(P).join() !== ord.join()) no("«Annulla» ha cambiato l'ordine della home");
    if ((W.BR.pubblici[PAPPONE].ordineGiochi || []).join() !== ord.join()) no("«Annulla» ha cambiato la scheda pubblica");
    // 2) «↩️ Ordine di partenza» (con la domanda) + Salva
    await apriOrdine(P, "tris");
    var bp = tasto(P, /Ordine di partenza/); if (!bp || bp.disabled) no("«↩️ Ordine di partenza» non c'è o è spento");
    bp.click();
    if (!await W.aspetta(function () { return righe(P).join() === R.join(); }, 3000)) no("«Ordine di partenza» non rimette l'ordine di sempre (" + righe(P).slice(0, 3).join() + ")");
    if (!bp.disabled) no("con l'ordine di partenza il tasto resta acceso");
    // Luca ha ancora la copia vecchia sul telefono (prima di salvare)
    var L = await W.apriTel("Luca", { x: 185, prima: schedaLenta }); await home(L);
    if (tessere(L).join() !== ord.join()) no("Luca non parte dall'ordine del proprietario");
    await salva(P);
    if (tessere(P).join() !== R.join()) no("dopo il salvataggio la home non ha l'ordine di sempre");
    var pub = W.BR.pubblici[PAPPONE].ordineGiochi;
    if (!Array.isArray(pub) || pub.length) no("nella scheda pubblica l'ordine di partenza non è [] (" + JSON.stringify(pub).slice(0, 60) + ")");
    if (ordineDi(P) !== null) no("sul telefono resta una copia dell'ordine vecchio");
    // Luca ricarica (con la copia vecchia sul telefono): la home parte vecchia e si rimette in fila da sola
    W.__ogRitardo = 600;
    L = await W.ricarica("Luca"); await home(L);
    if (!await W.aspetta(function () { return tessere(L).join() === R.join(); }, 3000)) no("Luca non torna all'ordine di sempre (" + tessere(L).slice(0, 3).join() + ")");
    if (ordineDi(L) !== null) no("sul telefono di Luca resta la copia vecchia");
    errori();
    return "«Annulla» chiede e non salva; «↩️ Ordine di partenza» + Salva: scheda [] e copie tolte, Luca torna a " + R.slice(0, 3).join(", ") + "…";
  } });

  COPIONE.aggiungi("og5", { nome: "Ordine dei giochi: misure 360x640 e 412x915 (scorre solo la lista), trascinata lunga col bordo che scorre", fai: async function () {
    W.__ogRitardo = 0;
    var P = await W.apriTel(PAPPONE, { x: 0, prima: schedaLenta }); await home(P);
    await apriOrdine(P, "tris");
    var mis = await A.misureSchermata(P, PAPPONE); if (mis) no("«Ordine dei giochi»: " + mis);
    // a 360x640: la lista scorre dentro, le righe stanno nella larghezza, i tasti e il nome si leggono
    var f = document.getElementById("tel-" + PAPPONE), d = P.document;
    f.style.width = "360px"; f.style.height = "640px"; void d.documentElement.offsetHeight; P.dispatchEvent(new P.Event("resize")); await W.dorme(400);
    if (d.documentElement.style.getPropertyValue("--alt") !== "640px") no("lo schermo non è passato a 640 (" + d.documentElement.style.getPropertyValue("--alt") + ")");
    if (d.documentElement.scrollHeight > 641) no("a 360x640 la pagina scorre (" + d.documentElement.scrollHeight + ")");
    var lista = d.querySelector(".og-lista");
    if (!(lista.scrollHeight > lista.clientHeight + 20)) no("la lista non scorre al suo interno (" + lista.scrollHeight + " su " + lista.clientHeight + ")");
    if (d.documentElement.scrollWidth > 361) no("la pagina scorre di lato (" + d.documentElement.scrollWidth + ")");
    var hLista = lista.clientHeight;
    if (hLista < 250) no("a 360x640 la lista è alta solo " + lista.clientHeight + " px");
    var rr = d.querySelectorAll(".og-riga"), brutta = null;
    [].forEach.call(rr, function (r) {
      var b = r.getBoundingClientRect(), sp = r.querySelector(".og-nome span"), nome = r.querySelector(".og-nome").getBoundingClientRect();
      if (sp.scrollHeight > sp.clientHeight + 1 || sp.scrollWidth > sp.clientWidth + 1) brutta = brutta || (r.getAttribute("data-gioco") + ": il nome è tagliato");
      [].forEach.call(r.querySelectorAll(".og-t"), function (t) { var tb = t.getBoundingClientRect(); if (tb.right > b.right + 0.5 || tb.height < 32) brutta = brutta || (r.getAttribute("data-gioco") + ": tasto fuori o basso"); });
      if (b.right > lista.getBoundingClientRect().right + 0.5) brutta = brutta || (r.getAttribute("data-gioco") + ": riga più larga della lista");
      if (nome.width < 150) brutta = brutta || (r.getAttribute("data-gioco") + ": spazio del nome largo solo " + Math.round(nome.width) + " px");
      if (r.querySelector(".og-maniglia").getBoundingClientRect().width < 30) brutta = brutta || "maniglia stretta";
    });
    if (d.querySelector(".og-partenza").getBoundingClientRect().height > 50) brutta = brutta || "«↩️ Ordine di partenza» va a capo";
    if (d.querySelector(".og-sc .testa .sotto").getBoundingClientRect().height > 26) brutta = brutta || "la riga sotto il titolo va a capo";
    if (brutta) no("a 360x640: " + brutta);
    var hRiga = rr[0].getBoundingClientRect().height;
    // trascinata lunga: l'ultima riga portata contro il bordo alto della lista; la lista scorre da sola fino in cima
    lista.scrollTop = lista.scrollHeight; await W.dorme(100);
    var l0 = righe(P), ult = l0[l0.length - 1], lr = lista.getBoundingClientRect();
    await trascina(P, ult, 0, 4500, lr.top - 30);
    var l1 = righe(P);
    if (l1[0] !== ult) no("trascinata contro il bordo alto, " + ult + " è al posto " + (l1.indexOf(ult) + 1) + " (scrollTop " + Math.round(lista.scrollTop) + ")");
    if (d.documentElement.scrollHeight > 641 || d.scrollingElement.scrollTop) no("trascinando scorre la pagina");
    f.style.width = "360px"; f.style.height = "740px"; P.dispatchEvent(new P.Event("resize"));
    errori();
    return "a 360x640 e 412x915 niente scorre fuori dalla lista (lista " + hLista + " px a 640, righe da " + Math.round(hRiga) + " px); l'ultima trascinata in cima con la lista che scorre da sola";
  } });
})();
