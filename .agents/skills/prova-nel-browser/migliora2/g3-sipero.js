// PROVE DI «SÌ… PERÒ» (giro 2): «🙋 Ognuno per sé», «🃏 Carta bianca» e «⏩ Avanti» a maggioranza sull'esito del round.
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora2/g3-sipero.js"); await COPIONE.prova("sp1")
// Gli scenari online durano più di 45 s: lanciali senza aspettarli (window.__run = COPIONE.prova("sp2")) e poi leggi COPIONE.esiti.
//
// I telefoni si aprono con apriTel(nome, { spiaSp: true }): w.__imp = regole cambiate per la prova (solo l'host le legge,
// all'avvio e a ogni «⚙️ Regole»), w.__scelti = chi può sedersi (gli altri guardano), w.__t = il tavolo.
//
// sp1: le regole senza grafica (window.__sipero): il round di «Ognuno per sé» (vicini in cerchio, mani 4+3 senza carte doppie,
//      mosse cattive rifiutate, Malus sullo scenario del vicino con «da»), la carta bianca (pulizia, 60 lettere, firma una volta),
//      la riga «📜 Si gioca così» e le impostazioni col box fuori dalla pagina (online e sullo stesso telefono).
// sp2: Sala in 5 (Paky, Giulia, Luca, Sara + Marco che guarda): «Ognuno per sé» scelto dall'host in «⚙️ Regole» (gli amici lo
//      leggono); Bonus segreti finché non giocano tutti, poi svelati; Giulia scrive la sua carta (firmata, una sola: il tasto
//      sparisce); Luca ricarica nei Malus e ritrova mano e scenario da rovinare, Sara ricarica dopo aver giocato e ritrova il suo
//      Malus; svelamento uno alla volta (i Malus si scoprono solo col loro scenario); il giudice sfoglia e sceglie; +1 a chi presenta;
//      «⏩ Avanti» da 3 su 4 (chi guarda non ha il tasto e non conta, un tocco vecchio non vale); 4 round fino alla classifica
//      coi posti; le mani e le carte non giocate non passano MAI nella foto per tutti.
// sp3: a squadre (percorso di prima, stanza di un gioco solo): carta bianca giocata in squadra (firma sul tavolo, una a testa),
//      «⏩ Avanti» a maggioranza, Marco che arriva a partita in corso guarda e gioca dal round dopo, chi esce durante l'esito.
// sp4: sullo stesso telefono: «Ognuno per sé» in 3 dalla home alla classifica (carta bianca, passa il telefono, svelamento,
//      verdetto) e a squadre in 3 con la carta bianca («Chi la scrive?»).
// sp5: le misure 360x640 e 412x915 (6 telefoni): mano dei Bonus con «✍️ Scrivi tu», Malus con lo scenario del vicino, svelamento,
//      verdetto con 5 linguette, esito con «⏩ Avanti»: niente scorre, niente esce dallo schermo.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;

  // ---- la spia (solo con apriTel(nome, { spiaSp: true })) ----
  if (!W.__prepG3Sp) {
    W.__prepG3Sp = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepG3Sp(w, nome, opz);
      if (!opz || !opz.spiaSp) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) { if (g && g.id === "sipero") spia(w, g); return reg.apply(this, arguments); };
      } });
    };
  }
  function spia(w, g) {
    w.__gSp = g;
    var avvia = g.avvia;
    g.avvia = function (t) {
      w.__t = t;
      if (w.__imp && t.impostazioni) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
      if (w.__scelti) { var ps = t.puoSedersi; t.puoSedersi = function (id, nome) { return w.__scelti.indexOf(String(nome || "").trim()) >= 0 && (ps ? ps.apply(this, arguments) : true); }; }
      var r = avvia.apply(this, arguments);
      var or = t.onRegole;
      if (or && w.__imp) t.onRegole = function (im) { return or.call(this, Object.assign({}, im || {}, w.__imp)); };
      return r;
    };
  }
  // la spia del broker: tutto quello che passa (per controllare che le mani non vadano nella foto per tutti)
  if (!W.__ccG3Sp) {
    var cc = W.__ccG3Sp = W.creaClient;
    W.creaClient = function (nome, opts) {
      var c = cc.apply(this, arguments), pub = c.publish;
      c.publish = function (topic, payload) { if (W.__spiaSp) W.__spiaSp.push({ da: nome, topic: topic, p: String(payload) }); return pub.apply(this, arguments); };
      return c;
    };
  }
  function msgSpia() {
    var out = [];
    (W.__spiaSp || []).forEach(function (m) { var x; try { x = JSON.parse(m.p); } catch (e) { return; } var dd = x && (x.data || x); if (dd && dd.t) out.push({ da: m.da, d: dd, s: m.p }); });
    return out;
  }
  function errori() { var e = W.erroriTel(); return e.length ? " · errori: " + e.slice(0, 3).join(" / ") : ""; }
  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function nomeDi(C, id) { var g = (vm(C).giocatori || []).filter(function (x) { return x.id === id; })[0]; return g ? g.nome : null; }
  function telDi(C, id) { var n = nomeDi(C, id); return n ? W.finestra(n) : null; }
  function bottone(w, re) { return [].filter.call(w.document.querySelectorAll("button"), function (b) { return re.test(b.textContent); })[0] || null; }
  function carte(w) { return [].slice.call(w.document.querySelectorAll(".sp-carta[role=button]")); }
  function testiMano(w) { return [].map.call(w.document.querySelectorAll(".sp-carta"), function (b) { return b.querySelector(".sp-tx").textContent; }); }
  // sceglie n carte (oltre a quelle già scelte) e tocca «Gioca ▶» / «Conferma ▶»
  async function gioca(w, n, re) {
    var cc = await W.aspetta(function () { var x = carte(w); return x.length ? x : null; }, 6000);
    if (!cc) no("niente carte da toccare («" + T(w).slice(0, 100) + "»)");
    for (var i = 0; i < cc.length && w.document.querySelectorAll(".sp-carta.su").length < n; i++) if (!cc[i].classList.contains("su")) tocca(w, cc[i]);
    var b = bottone(w, re || /^Gioca ▶|^Conferma ▶/);
    if (!b || b.disabled) no("il tasto per giocare non c'è o è spento («" + T(w).slice(0, 100) + "»)");
    var scelte = [].map.call(w.document.querySelectorAll(".sp-carta.su .sp-tx"), function (x) { return x.textContent; });
    b.click();
    return scelte;
  }
  // ✍️ scrive la sua carta bianca
  async function scrivi(w, testo) {
    var b = await W.aspetta(function () { var x = w.document.querySelector(".sp-scrivi-b"); return x && !x.disabled ? x : null; }, 4000);
    if (!b) no("non c'è «✍️ Scrivi tu» («" + T(w).slice(0, 100) + "»)");
    b.click();
    var ta = await W.aspetta(function () { return w.document.querySelector(".sp-scrivi textarea"); }, 2000);
    if (!ta) no("non si apre il foglio della carta bianca");
    ta.value = testo; ta.dispatchEvent(new w.Event("input", { bubbles: true }));
    return ta;
  }
  function metti(w) { var b = bottone(w, /Metti in mano/); if (!b || b.disabled) no("«✍️ Metti in mano» spento"); b.click(); }

  // ===================== sp1: le regole =====================
  COPIONE.aggiungi("sp1", { nome: "Sì… però: Ognuno per sé e carta bianca senza grafica, riassunto, impostazioni fuori pagina", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0, spiaSp: true }), X = w.__sipero, g = w.__gSp;
    if (!X || !g) no("non vedo window.__sipero o il gioco registrato");
    var mazzi = { bonus: { carte: w.SG_SIPERO.bonus.slice(), pila: w.SG_SIPERO.bonus.slice() }, malus: { carte: w.SG_SIPERO.malus.slice(), pila: w.SG_SIPERO.malus.slice() } };
    var tt = { mischia: function (a) { return a.slice().sort(function () { return Math.random() - 0.5; }); } };
    var R = X.roundSolo(tt, mazzi, "g", ["a", "b", "c"]);
    if (JSON.stringify(R.bers) !== '{"a":"b","b":"c","c":"a"}') no("vicini in cerchio: " + JSON.stringify(R.bers));
    var tutte = [];
    ["a", "b", "c"].forEach(function (id) { if (R.mani[id].bonus.length !== 4 || R.mani[id].malus.length !== 3) no("mano di " + id + ": " + R.mani[id].bonus.length + "+" + R.mani[id].malus.length); tutte = tutte.concat(R.mani[id].bonus, R.mani[id].malus); });
    if (tutte.filter(function (c, i) { return tutte.indexOf(c) !== i; }).length) no("carte doppie tra le mani");
    var R2 = X.roundSolo(tt, mazzi, "x", ["p", "q"]);
    if (R2.bers.p !== "q" || R2.bers.q !== "p") no("in 3 (2 che presentano) si rovinano a vicenda: " + JSON.stringify(R2.bers));
    var nom = function (id) { return id.toUpperCase(); }, firme = {};
    if (X.giocaSolo(R, "a", [R.mani.a.bonus[0]], firme, nom)) no("1 Bonus invece di 2 accettato");
    if (X.giocaSolo(R, "a", [R.mani.a.bonus[0], R.mani.a.bonus[0]], firme, nom)) no("la stessa carta due volte accettata");
    if (X.giocaSolo(R, "a", [R.mani.b.bonus[0], R.mani.a.bonus[0]], firme, nom)) no("una carta di un altro accettata");
    if (X.giocaSolo(R, "g", [], firme, nom)) no("il giudice ha giocato");
    var sc = "Hai un drago di nome Gigi";
    R.mani.a.bonus.push(sc); firme[sc] = "Ada";
    if (!X.giocaSolo(R, "a", [sc, R.mani.a.bonus[0]], firme, nom)) no("2 Bonus giusti rifiutati");
    if (X.giocaSolo(R, "a", [R.mani.a.bonus[0], R.mani.a.bonus[1]], firme, nom)) no("ha giocato due volte");
    if (R.scen.a.bonus.length !== 2 || R.scen.a.bonus[0].di !== "Ada" || R.scen.a.bonus[1].di) no("la firma della carta bianca: " + JSON.stringify(R.scen.a.bonus));
    if (firme[sc]) no("la firma resta dopo che la carta è giocata");
    if (R.mani.a.bonus.length !== 3) no("dopo 2 Bonus in mano ne restano " + R.mani.a.bonus.length + " (erano 5 con la scritta)");
    R.passo = "malus"; R.fatti = {};
    var mm = R.mani.c.malus[1];
    if (X.giocaSolo(R, "c", [R.mani.c.malus[0], mm], firme, nom)) no("2 Malus invece di 1 accettati");
    if (!X.giocaSolo(R, "c", [mm], firme, nom)) no("il Malus giusto rifiutato");
    if (!R.scen.a.malus || R.scen.a.malus.testo !== mm || R.scen.a.malus.da !== "C") no("il Malus di c va sullo scenario di a con «da C»: " + JSON.stringify(R.scen.a.malus));
    if (R.mio.c !== R.scen.a.malus) no("R.mio non tiene il Malus di c");
    // la carta bianca: pulizia
    if (X.pulisciScritta("   ciao    a   tutti  ") !== "ciao a tutti") no("pulizia degli spazi");
    if (X.pulisciScritta("x".repeat(90)).length !== 60) no("la carta bianca non si ferma a 60");
    if (X.pulisciScritta("   ") !== "") no("una carta vuota");
    if (JSON.stringify(X.presDopo(["a", "b", "c", "d"], "c")) !== '["d","a","b"]') no("chi presenta dopo il giudice: " + JSON.stringify(X.presDopo(["a", "b", "c", "d"], "c")));
    // la riga «📜 Si gioca così»
    var r1 = g.riassunto({}), r2 = g.riassunto({ si: "solo", giri: 2, arringa: 60, bianca: 0 }), r3 = g.riassunto({ squadre: "mano", modalita: "custom", sequenza: [{ tipo: "bonus", n: 1, bers: "se" }] });
    if (r1 !== "👥 A squadre · 📜 Fasi classiche · 🔁 1 giro · 🎤 arringa libera · 🃏 carta bianca") no("riassunto di partenza: " + r1);
    if (r2 !== "🙋 Ognuno per sé · 🔁 2 giri · 🎤 arringa 60 secondi") no("riassunto ognuno per sé: " + r2);
    if (r3 !== "👥 A squadre · 🎛️ Fasi personalizzate · ✋ squadre scelte dall'host (un round) · 🎤 arringa libera · 🃏 carta bianca") no("riassunto squadre a mano: " + r3);
    // le impostazioni col box fuori dalla pagina (come nella Sala)
    var box = w.document.createElement("div"), dove = {};
    g.impostazioni(box, dove, { el: w.SG._util.el, sala: true, modo: "online", giocatori: ["Paky"] });
    if (dove.si !== "squadre" || dove.bianca !== 1) no("di partenza: a squadre e carta bianca sì (" + dove.si + ", " + dove.bianca + ")");
    if (!/Si gioca/.test(box.textContent) || !/Ognuno per sé/.test(box.textContent) || !/Carta bianca/.test(box.textContent) || !/Squadre e giudice/.test(box.textContent)) no("mancano scelte online: «" + box.textContent.slice(0, 160) + "»");
    var chip = [].filter.call(box.querySelectorAll(".modo-chip"), function (b) { return /Ognuno per sé/.test(b.textContent); })[0];
    chip.click();
    if (dove.si !== "solo") no("toccato «Ognuno per sé» la regola non cambia");
    var fasiNascoste = [].some.call(box.querySelectorAll(".etichetta"), function (e) { return e.textContent === "Le fasi" && e.parentNode.hidden; });
    if (!fasiNascoste) no("in «Ognuno per sé» le fasi dovrebbero sparire");
    var no1 = [].filter.call(box.querySelectorAll(".modo-chip"), function (b) { return b.textContent === "No"; })[0]; no1.click();
    if (dove.bianca !== 0) no("«Carta bianca: No» non cambia la regola");
    var b2 = w.document.createElement("div"), d2 = {};
    g.impostazioni(b2, d2, { el: w.SG._util.el, modo: "telefono", giocatori: ["A", "B", "C"] });
    if (/Squadre e giudice/.test(b2.textContent) || !/Ognuno per sé/.test(b2.textContent)) no("sullo stesso telefono: «Ognuno per sé» sì, «Squadre e giudice» no");
    if (!g.regole.some(function (x) { return /Ognuno per sé/.test(x); }) || !g.regole.some(function (x) { return /Carta bianca/.test(x); })) no("le regole non spiegano le due novità");
    return "round, mosse, firma, riassunti, impostazioni ok" + errori();
  } });

  // ---- una Sala con gli amici spiati; Paky sceglie Sì… però. ret: { S, C } ----
  async function salaSp(amici, scelti, imp) {
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true, spiaSp: true, prima: function (w) { w.__scelti = scelti.slice(); w.__imp = imp || null; } });
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true, spiaSp: true, prima: function (w) { w.__scelti = scelti.slice(); } });
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === amici.length + 1; }, 12000)) no("nella Sala non sono entrati in " + (amici.length + 1));
    var C = await A.lanciaDallaSala("Paky", S, "Sì... però");
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).filter(function (x) { return !x.via; }).length === scelti.length; }, 12000)) no("nella saletta non arrivano in " + scelti.length + " (" + (vm(C).giocatori || []).map(function (x) { return x.nome; }) + ")");
    return { S: S, C: C, P: P };
  }
  // un passo di carte (Bonus o Malus) giocato da tutti quelli che presentano (tranne salta)
  async function passoCarte(C, passo, salta) {
    var v = await W.aspetta(function () { var x = vm(C); return x.fase === "gioco" && x.passoS === passo ? x : null; }, 8000);
    if (!v) no("non si arriva ai " + passo + " (fase " + vm(C).fase + " " + vm(C).passoS + ")");
    for (var i = 0; i < v.pres.length; i++) {
      var n = nomeDi(C, v.pres[i]); if (salta && salta.indexOf(n) >= 0) continue;
      if ((vm(C).fatti || []).indexOf(v.pres[i]) >= 0) continue;
      await gioca(W.finestra(n), passo === "bonus" ? 2 : 1);
      var id = v.pres[i];
      if (!await W.aspetta(function () { var x = vm(C); return (x.fatti || []).indexOf(id) >= 0 || x.passoS !== passo || x.fase !== "gioco"; }, 4000)) no("le carte di " + n + " non arrivano all'host");
    }
    return vm(C);
  }
  // un round intero di «Ognuno per sé»: il giudice sceglie scegli(pres) (di base il primo), poi «⏩ Avanti» da chi serve
  async function roundSp(C, scegli) {
    await passoCarte(C, "bonus"); await passoCarte(C, "malus");
    var v = await W.aspetta(function () { var x = vm(C); return x.fase === "arringa" ? x : null; }, 6000);
    if (!v) no("dopo i Malus non si svelano gli scenari (" + vm(C).fase + ")");
    var wg = telDi(C, v.giudiceId);
    for (var i = 0; i < v.pres.length; i++) {
      var b = await W.aspetta(function () { var x = bottone(wg, /Prossimo scenario|Al verdetto/); return x && !x.disabled ? x : null; }, 5000);
      if (!b) no("il giudice non ha «Prossimo scenario» («" + T(wg).slice(0, 80) + "»)");
      b.click(); await W.dorme(250);
    }
    v = await W.aspetta(function () { var x = vm(C); return x.fase === "giudizio" ? x : null; }, 5000);
    if (!v) no("non si arriva al verdetto");
    var chi = scegli ? scegli(v.pres) : v.pres[0];
    var tab = await W.aspetta(function () { return wg.document.querySelector(".sp-tab button[data-id='" + chi + "']"); }, 3000);
    if (!tab) no("il giudice non ha la linguetta di " + nomeDi(C, chi));
    tab.click(); await W.dorme(150);
    var bs = bottone(wg, /Scelgo/);
    if (!bs || bs.textContent.indexOf(nomeDi(C, chi)) < 0) no("il tasto del giudice non dice «Scelgo " + nomeDi(C, chi) + "» (" + (bs && bs.textContent) + ")");
    bs.click();
    v = await W.aspetta(function () { var x = vm(C); return x.fase === "esito" ? x : null; }, 5000);
    if (!v || v.vincitore !== chi) no("l'esito non dà il round a chi ha scelto il giudice (" + (v && v.vincitore) + ")");
    return v;
  }
  async function avantiTutti(C, nomi) {
    var r = vm(C).round;
    for (var i = 0; i < nomi.length; i++) {
      if (vm(C).fase !== "esito" || vm(C).round !== r) break;
      var w = W.finestra(nomi[i]);
      var b = await W.aspetta(function () { var x = w.document.querySelector(".sp-pronto"); return x && !x.disabled ? x : null; }, 3000);
      if (b) b.click();
      await W.dorme(200);
    }
    if (!await W.aspetta(function () { var x = vm(C); return x.round !== r || x.fase === "fine"; }, 5000)) no("«⏩ Avanti» di tutti non fa partire il round dopo");
  }

  // ===================== sp2: Ognuno per sé online dalla Sala =====================
  COPIONE.aggiungi("sp2", { nome: "Sì… però online dalla Sala in 4 + chi guarda: Ognuno per sé, segreti, carta bianca, ricariche, svelamento, Avanti a maggioranza, classifica", fai: async function () {
    W.__spiaSp = [];
    var note = [], nomi = ["Paky", "Giulia", "Luca", "Sara"];
    var Z = await salaSp(["Giulia", "Luca", "Sara", "Marco"], nomi, null), C = Z.C, P = Z.P;
    // ⚙️ Regole: Paky sceglie «Ognuno per sé»
    if (!await W.aspetta(function () { return W.clicca(P, /⚙️ Regole/); }, 4000)) no("nella saletta non c'è «⚙️ Regole»");
    var chip = await W.aspetta(function () { return [].filter.call(P.document.querySelectorAll(".sl-velo .modo-chip"), function (b) { return /Ognuno per sé/.test(b.textContent); })[0]; }, 3000);
    if (!chip) no("nelle regole della saletta non c'è «Ognuno per sé»");
    chip.click(); await W.dorme(200);
    if (!W.clicca(P, /Fatto/, ".sl-velo button")) no("non trovo «✅ Fatto» nelle regole");
    if (!await W.aspetta(function () { return vm(C).regole && vm(C).regole.si === "solo"; }, 4000)) no("dopo «⚙️ Regole» la partita non è «Ognuno per sé» (" + JSON.stringify(vm(C).regole) + ")");
    var rg = await W.aspetta(function () { var x = A.regoleDi(W.finestra("Giulia")); return /Ognuno per sé/.test(x) ? x : null; }, 5000);
    if (!rg) no("Giulia non legge «Ognuno per sé» nelle regole («" + A.regoleDi(W.finestra("Giulia")) + "»)");
    note.push("regole: «" + rg + "»");
    if (!/Ognuno per sé/.test(T(W.finestra("Luca")))) no("nella saletta di Luca non c'è la riga «Ognuno per sé»");
    if (!W.clicca(P, /Comincia/, ".sl-go")) no("Paky non trova «Comincia»");
    var v = await W.aspetta(function () { var x = vm(C); return x.fase === "gioco" && x.solo ? x : null; }, 10000);
    if (!v) no("la partita non comincia in «Ognuno per sé» (" + vm(C).fase + ")");
    if (v.totale !== 4 || v.pres.length !== 3 || !v.giudiceId) no("round/presentatori: " + v.totale + " " + JSON.stringify(v.pres));
    var giud = nomeDi(C, v.giudiceId), pres = v.pres.map(function (id) { return nomeDi(C, id); });
    note.push("giudice " + giud + ", presentano " + pres.join(", "));
    // Marco guarda: niente mano, niente tasti
    var wm = W.finestra("Marco");
    if (!await W.aspetta(function () { return /guardi|Guardi/.test(T(wm)) && wm.document.querySelector(".sp-scena"); }, 8000)) no("Marco non guarda la partita («" + T(wm).slice(0, 100) + "»)");
    if (carte(wm).length || wm.document.querySelector(".sp-scrivi-b")) no("chi guarda ha carte o «Scrivi tu»");
    // ognuno la sua mano: 4 Bonus + «👀 I tuoi Malus (3)»
    for (var i = 0; i < pres.length; i++) {
      var wp = W.finestra(pres[i]);
      if (!await W.aspetta(function () { return carte(wp).length === 4 && /I tuoi Malus \(3\)/.test(T(wp)); }, 6000)) no(pres[i] + " non ha 4 Bonus e 3 Malus («" + T(wp).slice(0, 120) + "»)");
    }
    var wgiud = W.finestra(giud);
    if (carte(wgiud).length) no("il giudice ha delle carte");
    if (!/Sei il giudice/.test(T(wgiud))) no("il giudice non lo sa («" + T(wgiud).slice(0, 80) + "»)");
    // Giulia (o chi presenta per primo) scrive la sua carta bianca
    var scrittore = pres.indexOf("Giulia") >= 0 ? "Giulia" : pres[0], ws = W.finestra(scrittore);
    var MIA = "Hai un gatto che ti fa la spesa ogni giorno";
    await scrivi(ws, MIA + " ".repeat(5));
    metti(ws);
    if (!await W.aspetta(function () { var s = ws.document.querySelector(".sp-carta.scritta.su"); return s && s.querySelector(".sp-tx").textContent === MIA; }, 4000)) no(scrittore + ": la carta scritta non arriva in mano già scelta («" + testiMano(ws).join(" | ").slice(0, 120) + "»)");
    if (!/di /.test((ws.document.querySelector(".sp-carta.scritta .sp-fc") || {}).textContent || "")) no("la carta scritta in mano non ha la firma");
    if (ws.document.querySelector(".sp-scrivi-b")) no("dopo la carta bianca «✍️ Scrivi tu» c'è ancora");
    if ((vm(C).bianche || []).indexOf(idDi(scrittore)) < 0) no("l'host non segna la carta bianca di " + scrittore);
    // la seconda carta bianca mandata a mano: rifiutata
    if (scrittore !== "Paky") { W.reteDi(scrittore).invia({ t: "bianca", testo: "seconda carta" }); await W.dorme(500); if (testiMano(ws).indexOf("seconda carta") >= 0) no("la seconda carta bianca è stata accettata"); }
    var bonusS = await gioca(ws, 2);
    if (bonusS.indexOf(MIA) < 0) no("la carta scritta non era tra le scelte");
    // finché non giocano tutti, i Bonus non si vedono
    await W.dorme(500);
    var vv = vm(C);
    if (vv.passoS !== "bonus") no("dopo un solo giocatore si è già passati ai Malus");
    if (Object.keys(vv.schede).some(function (id) { return (vv.schede[id].b || []).length; })) no("i Bonus di " + scrittore + " sono nella foto per tutti prima del tempo");
    if (!/✅/.test((wgiud.document.querySelector(".sp-stato") || {}).textContent || "")) no("il giudice non vede chi ha già giocato (✅)");
    if (!/Il tuo scenario/.test(T(ws)) || !/Fatto/.test(T(ws))) no(scrittore + " non vede i suoi Bonus giocati («" + T(ws).slice(0, 100) + "»)");
    v = await passoCarte(C, "bonus");
    v = await W.aspetta(function () { var x = vm(C); return x.passoS === "malus" ? x : null; }, 5000);
    if (!v) no("dopo i Bonus di tutti non si passa ai Malus");
    var idS = idDi(scrittore);
    if (v.schede[idS].b.length !== 2 || !v.schede[idS].b.some(function (x) { return x.testo === MIA && x.di === scrittore; })) no("la carta scritta non è sul tavolo con la firma: " + JSON.stringify(v.schede[idS].b));
    if (Object.keys(v.schede).some(function (id) { return v.schede[id].m; })) no("un Malus nella foto prima dello svelamento");
    // i Malus: lo scenario del vicino; Luca ricarica prima di giocare, Sara dopo
    var luca = pres.indexOf("Luca") >= 0 ? "Luca" : pres[1], wl = W.finestra(luca), vicL = nomeDi(C, v.bers[idDi(luca)]);
    if (!await W.aspetta(function () { return new RegExp("Rovina lo scenario di " + vicL).test(T(wl)) && carte(wl).length === 3; }, 5000)) no(luca + " non vede «Rovina lo scenario di " + vicL + "» con 3 Malus («" + T(wl).slice(0, 120) + "»)");
    var manoL = testiMano(wl).sort().join("|");
    wl = await W.ricarica(luca);
    if (!await W.aspetta(function () { return carte(W.finestra(luca)).length === 3; }, 12000)) no(luca + " ricarica e non ritrova i suoi 3 Malus («" + T(W.finestra(luca)).slice(0, 100) + "»)");
    wl = W.finestra(luca);
    if (testiMano(wl).sort().join("|") !== manoL) no(luca + " ricarica e ha una mano diversa");
    if (!new RegExp("Lo scenario di " + vicL).test(T(wl))) no(luca + " ricarica e non vede lo scenario da rovinare");
    var altri = pres.filter(function (n) { return n !== luca; }), sara = altri[altri.length - 1];
    var malusS = (await gioca(W.finestra(sara), 1))[0];
    if (!await W.aspetta(function () { return (vm(C).fatti || []).indexOf(idDi(sara)) >= 0; }, 4000)) no("il Malus di " + sara + " non arriva");
    await W.ricarica(sara);
    var wsa = W.finestra(sara);
    if (!await W.aspetta(function () { return /Fatto/.test(T(W.finestra(sara))) && T(W.finestra(sara)).indexOf(malusS) >= 0; }, 12000)) no(sara + " ricarica dopo il Malus e non lo ritrova («" + T(W.finestra(sara)).slice(0, 140) + "»)");
    if (JSON.stringify(vm(C)).indexOf(malusS) >= 0) no("il Malus di " + sara + " è nella foto prima dello svelamento");
    await passoCarte(C, "malus");
    v = await W.aspetta(function () { var x = vm(C); return x.fase === "arringa" ? x : null; }, 6000);
    if (!v) no("dopo i Malus non si svela");
    if (v.mostra !== 0 || !v.schede[v.pres[0]].m || v.schede[v.pres[1]].m || v.schede[v.pres[2]].m) no("allo svelamento si vede il Malus solo del primo scenario: " + JSON.stringify(v.pres.map(function (id) { return !!v.schede[id].m; })));
    var mm = v.schede[v.pres[0]].m;
    if (!mm.da) no("il Malus non dice chi l'ha messo");
    var w0 = telDi(C, v.pres[0]);
    if (!/Tocca a te/.test(T(w0))) no("chi presenta non vede «Tocca a te»");
    if (!/da /.test(T(W.finestra("Marco")))) no("chi guarda non vede chi ha messo il Malus («" + T(W.finestra("Marco")).slice(0, 140) + "»)");
    if (bottone(w0, /Prossimo scenario/) && v.giudiceId !== idDi(nomeDi(C, v.pres[0]))) no("chi presenta può andare avanti al posto del giudice");
    note.push("svelato «" + mm.testo.slice(0, 25) + "…» da " + mm.da);
    // il giudice va avanti, sfoglia e sceglie il secondo
    var wg = telDi(C, v.giudiceId);
    for (var k = 0; k < 3; k++) { var bb = await W.aspetta(function () { var x = bottone(wg, /Prossimo scenario|Al verdetto/); return x && !x.disabled ? x : null; }, 4000); if (!bb) no("niente «Prossimo scenario» al passo " + k); bb.click(); await W.dorme(300); }
    v = await W.aspetta(function () { var x = vm(C); return x.fase === "giudizio" ? x : null; }, 4000); if (!v) no("niente verdetto");
    if ([].length) {}
    var tabs = wg.document.querySelectorAll(".sp-tab button");
    if (tabs.length !== 3) no("il giudice non ha 3 linguette (" + tabs.length + ")");
    var scelto = v.pres[1];
    wg.document.querySelector(".sp-tab button[data-id='" + scelto + "']").click(); await W.dorme(150);
    // anche chi non è il giudice sfoglia (sul suo telefono soltanto)
    var wL = W.finestra(luca), tl = wL.document.querySelector(".sp-tab button[data-id='" + v.pres[2] + "']");
    if (!tl) no(luca + " non può sfogliare gli scenari");
    tl.click(); await W.dorme(150);
    if (bottone(wL, /Scelgo/)) no("chi non è il giudice ha «Scelgo»");
    if (!new RegExp("Lo scenario di " + nomeDi(C, v.pres[2])).test(T(wL))) no(luca + " tocca una linguetta e non vede quello scenario");
    bottone(wg, /Scelgo/).click();
    v = await W.aspetta(function () { var x = vm(C); return x.fase === "esito" ? x : null; }, 4000);
    if (!v || v.vincitore !== scelto) no("il round non va a chi ha scelto il giudice");
    var pt = {}; v.giocatori.forEach(function (x) { pt[x.nome] = x.punti; });
    if (pt[nomeDi(C, scelto)] !== 1 || Object.keys(pt).filter(function (n) { return pt[n]; }).length !== 1) no("punti dopo il round: " + JSON.stringify(pt));
    if (!await W.aspetta(function () { return /Vince /.test(T(wg)); }, 4500)) no("niente verdetto in scena (dopo la luce)");   // (30 ott 2026: prima la luce che gira, ~3 s)
    // ⏩ Avanti: 3 su 4; chi guarda non ha il tasto; il tocco vecchio non vale
    if (v.servono !== 3) no("servono " + v.servono + " invece di 3 (4 giocano, Marco guarda)");
    if (W.finestra("Marco").document.querySelector(".sp-pronto")) no("chi guarda ha «⏩ Avanti»");
    if (!await W.aspetta(function () { return /Si va avanti tra/.test(T(P)); }, 4500)) no("sull'esito manca il conto alla rovescia («" + T(P).slice(-100) + "»)");
    W.reteDi("Marco") && W.reteDi("Marco").invia({ t: "pronto", k: v.kAv });
    W.reteDi("Giulia").invia({ t: "pronto", k: "vecchio|1" });
    await W.dorme(400);
    if ((vm(C).pronti || []).length) no("conta il tocco di chi guarda o un tocco vecchio: " + JSON.stringify(vm(C).pronti));
    var wGi = W.finestra("Giulia"), bG = wGi.document.querySelector(".sp-pronto");
    bG.click(); await W.dorme(400);
    bG = wGi.document.querySelector(".sp-pronto");
    if (!bG || !bG.disabled || !/✅ Avanti/.test(bG.textContent) || !/1 su 3/.test(bG.textContent)) no("Giulia dopo il tocco: «" + (bG && bG.textContent) + "» (deve restare «✅ Avanti 1 su 3»)");
    var bP = P.document.querySelector(".sp-pronto");
    if (!bP || !/1 su 3/.test(bP.textContent)) no("su Paky il numero non si aggiorna: «" + (bP && bP.textContent) + "»");
    bP.click(); await W.dorme(400);
    if (vm(C).fase !== "esito") no("con 2 su 4 si va già avanti");
    W.finestra("Sara").document.querySelector(".sp-pronto").click();
    if (!await W.aspetta(function () { var x = vm(C); return x.round === 2 && x.fase === "gioco"; }, 4000)) no("con 3 su 4 non parte il round 2 (" + vm(C).round + " " + vm(C).fase + ")");
    note.push("«⏩ Avanti» 3 su 4");
    if ((vm(C).bianche || []).length !== 1) no("la carta bianca non resta segnata nel round 2");
    // gli altri 3 round, fino alla classifica
    for (var r = 2; r <= 4; r++) { await roundSp(C); await avantiTutti(C, nomi); }
    v = await W.aspetta(function () { var x = vm(C); return x.fase === "fine" ? x : null; }, 6000);
    if (!v) no("dopo 4 round niente classifica (" + vm(C).fase + " " + vm(C).round + ")");
    if ((v.classifica || []).length !== 4 || v.classifica.some(function (x) { return !x.pos; })) no("classifica senza posti: " + JSON.stringify(v.classifica));
    if (v.classifica.reduce(function (s, x) { return s + x.punti; }, 0) !== 4) no("in 4 round ci sono 4 punti, non " + v.classifica.reduce(function (s, x) { return s + x.punti; }, 0));
    note.push("classifica: " + v.classifica.map(function (x) { return x.pos + "° " + x.nome + " " + x.punti; }).join(", "));
    // le mani non sono mai passate nella foto per tutti
    var ms = msgSpia(), male = [];
    var mani = ms.filter(function (m) { return m.d.t === "manoS"; });
    if (!mani.length) no("nessun messaggio «manoS» visto");
    mani.forEach(function (m) { if (!m.d.per || m.d.per.length !== 1) male.push("una mano per più telefoni"); });
    ms.forEach(function (m) { if (m.d.t === "vm" && /"mani"|"mano"|"mie"/.test(m.s)) male.push("la foto per tutti ha una mano"); });
    // le carte mai giocate (rimaste nelle mani) non compaiono in nessuna foto
    var giocate = {}; ms.filter(function (m) { return m.d.t === "vm" && m.d.vm && m.d.vm.schede; }).forEach(function (m) { Object.keys(m.d.vm.schede).forEach(function (id) { var s = m.d.vm.schede[id]; (s.b || []).concat(s.m ? [s.m] : []).forEach(function (x) { giocate[x.testo] = 1; }); }); });
    var maiGiocate = {}; mani.forEach(function (m) { ["bonus", "malus"].forEach(function (k) { (m.d.mano[k] || []).forEach(function (c) { if (!giocate[c]) maiGiocate[c] = 1; }); }); });
    ms.forEach(function (m) { if (m.d.t !== "vm") return; Object.keys(maiGiocate).forEach(function (c) { if (m.s.indexOf(JSON.stringify(c).slice(1, -1)) >= 0) male.push("«" + c.slice(0, 30) + "» nella foto"); }); });
    if (male.length) no(male.slice(0, 3).join(" | "));
    return note.join(" · ") + errori();
  } });

  // ===================== sp3: a squadre (stanza di un gioco solo) =====================
  COPIONE.aggiungi("sp3", { nome: "Sì… però a squadre online: carta bianca in squadra, Avanti a maggioranza, chi arriva tardi, chi esce sull'esito", fai: async function () {
    var note = [];
    var P = await W.apriTel("Paky", { x: 0, spiaSp: true, prima: function (w) { w.__imp = { giri: 1, si: "squadre" }; } });
    var C = await W.apriStanza(P, "Sì... però");
    var amici = ["Giulia", "Luca", "Sara"];
    for (var i = 0; i < amici.length; i++) {
      await W.apriTel(amici[i], { hash: "gioco=sipero&stanza=" + C, x: 185 * (i + 1), spiaSp: true });
      var n = amici[i];
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).some(function (p) { return p.nome === n; }); }, 8000)) no(n + " non entra");
    }
    if (!/carta bianca/i.test(T(W.finestra("Giulia")))) no("in saletta non si legge la carta bianca");
    W.clicca(P, /Comincia/);
    var v = await W.aspetta(function () { var x = vm(C); return x.fase === "gioco" && x.step ? x : null; }, 8000);
    if (!v || v.solo) no("la partita a squadre non comincia");
    // chi gioca per primo scrive la sua carta e la gioca
    var sq = v.step.sq, ids = Object.keys(v.assegna).filter(function (id) { return v.assegna[id] === sq; });
    ids.sort(function (a, b) { return (a === v.capo[sq] ? 0 : 1) - (b === v.capo[sq] ? 0 : 1); });   // (30 ott 2026: per primo il capo, l'unico con «Gioca»)
    var chi = nomeDi(C, ids[0]), w = W.finestra(chi);
    var MIA = "Il tuo capo ti adora e ti paga doppio";
    await scrivi(w, MIA); metti(w);
    if (!await W.aspetta(function () { var s = w.document.querySelector(".sp-carta.scritta.su"); return s && /Il tuo capo/.test(s.textContent); }, 4000)) no("la carta scritta non arriva già scelta a " + chi);
    // il compagno di squadra (se c'è) vede la carta con la firma ma non può scriverne un'altra finché è in mano
    if (ids[1]) { var w2 = telDi(C, ids[1]); if (!await W.aspetta(function () { return w2.document.querySelector(".sp-carta.scritta"); }, 4000)) no("il compagno non vede la carta scritta"); if (w2.document.querySelector(".sp-scrivi-b")) no("con una carta scritta in mano il compagno ha ancora «Scrivi tu»"); }
    await gioca(w, v.step.n);
    v = await W.aspetta(function () { var x = vm(C); return x.scen && x.scen.some(function (s) { return s.voci.some(function (y) { return y.di === chi; }); }) ? x : null; }, 4000);
    if (!v) no("sul tavolo la carta scritta non ha la firma di " + chi);
    if (!w.document.querySelector(".sp-mini.scritta")) no("sul tavolo la carta scritta non ha il bordo diverso");
    note.push("carta bianca di " + chi + " firmata");
    // Marco arriva a partita in corso: guarda
    var wm = await W.apriTel("Marco", { hash: "gioco=sipero&stanza=" + C, x: 740, spiaSp: true });
    if (!await W.aspetta(function () { return /entri dal prossimo round/.test(T(W.finestra("Marco"))); }, 8000)) no("Marco arrivato tardi non guarda («" + T(W.finestra("Marco")).slice(0, 80) + "»)");
    // si gioca il resto del round coi tocchi (chi è di turno gioca), poi arringa e verdetto
    var fino = Date.now() + 60000;
    while (Date.now() < fino && vm(C).fase === "gioco") {
      v = vm(C); var tid = Object.keys(v.assegna).filter(function (id) { return v.assegna[id] === v.step.sq && !(v.giocatori.filter(function (g) { return g.id === id; })[0] || {}).via; }).sort(function (a, b) { return (a === v.capo[v.step.sq] ? 0 : 1) - (b === v.capo[v.step.sq] ? 0 : 1); })[0];
      var wt = telDi(C, tid); var p0 = v.step.i;
      if (wt && wt.document.querySelector(".sp-carta[role=button]")) { try { await gioca(wt, v.step.n); } catch (e) {} }
      await W.aspetta(function () { return vm(C).fase !== "gioco" || vm(C).step.i !== p0; }, 3000);
    }
    var wg = telDi(C, vm(C).giudiceId);
    for (var k = 0; k < 2; k++) { var bb = await W.aspetta(function () { var x = bottone(wg, /Tocca alla|Al verdetto/); return x && !x.disabled ? x : null; }, 5000); if (!bb) no("niente arringa (" + vm(C).fase + ")"); bb.click(); await W.dorme(300); }
    var bv = await W.aspetta(function () { return wg.document.querySelector(".sp-vota.c0:not([disabled])"); }, 4000); if (!bv) no("il giudice non può votare");
    bv.click(); bv.click();   // (30 ott 2026: un tocco sceglie, il secondo conferma)
    v = await W.aspetta(function () { var x = vm(C); return x.fase === "esito" ? x : null; }, 4000); if (!v) no("niente esito");
    await W.dorme(3300);   // (la luce del verdetto: poi «⏩ Avanti»)
    // Avanti: 4 giocano (Marco guarda) → 3; Sara esce durante l'esito → 3 presenti → servono 2
    if (v.servono !== 3) no("servono " + v.servono + " invece di 3");
    if (W.finestra("Marco").document.querySelector(".sp-pronto")) no("chi è arrivato tardi ha «⏩ Avanti» mentre guarda");
    if (!P.document.querySelector(".sp-pronto")) no("l'host non ha «⏩ Avanti» (il vecchio «Prossimo round» c'è ancora?)");
    P.document.querySelector(".sp-pronto").click();
    await W.dorme(300);
    W.spegni("Sara");
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).some(function (g) { return g.nome === "Sara" && g.via; }); }, 26000)) no("Sara spenta non risulta uscita");
    if (vm(C).fase === "esito" && vm(C).servono !== 2) no("con Sara uscita servono " + vm(C).servono + " invece di 2");
    if (vm(C).fase === "esito") { W.finestra("Giulia").document.querySelector(".sp-pronto").click(); }
    if (!await W.aspetta(function () { return vm(C).fase !== "esito"; }, 4000)) no("con 2 su 3 non si va avanti");
    note.push("«⏩ Avanti»: 3 su 4, poi 2 su 3 con Sara uscita");
    v = await W.aspetta(function () { var x = vm(C); return x.round === 2 && x.fase === "gioco" ? x : null; }, 4000);
    if (!v) no("non parte il round 2 (" + vm(C).fase + ")");
    var idM = (v.giocatori.filter(function (g) { return g.nome === "Marco"; })[0] || {}).id;
    if (v.assegna[idM] == null) no("Marco non gioca dal round dopo");
    note.push("Marco gioca dal round 2 (" + (v.assegna[idM] === "g" ? "giudice" : "squadra " + (v.assegna[idM] + 1)) + ")");
    // carta bianca: Giulia l'ha già usata? (una a testa)
    var used = vm(C).bianche || [];
    if (used.length !== 1 || used[0] !== idDi(chi)) no("carte bianche segnate: " + JSON.stringify(used));
    W.riaccendi("Sara");
    return note.join(" · ") + errori();
  } });


  // ===================== sp4: sullo stesso telefono =====================
  // dalla home: tessera → «Su questo telefono» → i nomi → si parte (w.__imp = le regole)
  async function avviaLocale(nomi, imp) {
    var w = await W.apriTel("Paky", { x: 0, spiaSp: true, prima: function (x) { x.__imp = imp; } });
    var tess = await W.aspetta(function () { return A.tessera(w, "Sì... però"); }, 6000);
    if (!tess) no("in home non c'è Sì... però");
    tess.click(); await W.dorme(500);
    var bm = await W.aspetta(function () { return [].find.call(w.document.querySelectorAll(".modo-grande"), function (b) { return /Su questo telefono/.test(b.textContent); }); }, 4000);
    if (!bm) no("non c'è «Su questo telefono»");
    bm.click();
    if (!await W.aspetta(function () { return w.document.querySelector(".sala-riga input"); }, 3000)) no("niente nomi dei giocatori");
    while (w.document.querySelectorAll(".sala-riga input").length < nomi.length) { if (!W.clicca(w, /Aggiungi giocatore/)) break; await W.dorme(80); }
    [].forEach.call(w.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = nomi[k]; c.dispatchEvent(new w.Event("input", { bubbles: true })); });
    for (var k = 0; k < 6 && !w.__t; k++) {
      await W.dorme(300);
      if (w.__t) break;
      var b = [].find.call(w.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|Comincia|Gioca|Inizia|Via|Pronti|Partiamo|▶/.test(x.textContent) && !x.disabled; });
      if (b) b.click();
    }
    if (!await W.aspetta(function () { return w.__t; }, 3000)) no("il gioco non parte («" + T(w).slice(0, 80) + "»)");
    return w;
  }
  async function passa(w, nome) {
    var b = await W.aspetta(function () { return bottone(w, new RegExp("^Sono " + nome)); }, 3000);
    if (!b) no("niente «Passa il telefono a " + nome + "» («" + T(w).slice(0, 80) + "»)");
    b.click();
    if (!await W.aspetta(function () { return carte(w).length; }, 3000)) no(nome + " non ha carte");
  }
  COPIONE.aggiungi("sp4", { nome: "Sì… però sullo stesso telefono: Ognuno per sé in 3 fino alla classifica, a squadre con la carta bianca", fai: async function () {
    var note = [], nomi = ["Paky", "Giulia", "Luca"];
    var w = await avviaLocale(nomi, { si: "solo", giri: 1, bianca: 1, arringa: 60 });
    var giri = 0, scritta = false;
    while (giri < 4 && await W.aspetta(function () { return /chi rovina chi/.test(T(w)); }, 3000)) {
      giri++;
      var giud = (T(w).match(/Giudice: (\w+)/) || [])[1];
      if (giud !== nomi[(giri - 1) % 3]) no("round " + giri + ": giudice " + giud);
      var gi = nomi.indexOf(giud), pres = nomi.slice(gi + 1).concat(nomi.slice(0, gi));   // (presenta prima chi siede dopo il giudice)
      W.clicca(w, /Via ▶/);
      for (var fase = 0; fase < 2; fase++) for (var k = 0; k < pres.length; k++) {
        await passa(w, pres[k]);
        var bonus = /I tuoi Bonus/.test(T(w));
        if (bonus !== (fase === 0)) no("fase sbagliata: " + T(w).slice(0, 60));
        if (!bonus && !new RegExp("rovina lo scenario di " + pres[(k + 1) % 2]).test(T(w))) no(pres[k] + " nei Malus non deve rovinare " + pres[(k + 1) % 2] + " («" + T(w).slice(0, 120) + "»)");
        if (!bonus && w.document.querySelectorAll(".sp-palco .sp-mini").length !== 2) no("nei Malus non si vedono i 2 Bonus del vicino");
        if (!scritta && pres[k] === "Giulia") {
          scritta = true;
          await scrivi(w, "Ogni mattina trovi il caffè già pronto"); metti(w); await W.dorme(200);
          if (!w.document.querySelector(".sp-carta.scritta.su")) no("sullo stesso telefono la carta scritta non è già scelta");
        } else if (pres[k] === "Giulia" && w.document.querySelector(".sp-scrivi-b")) no("Giulia ha di nuovo «Scrivi tu»");
        await gioca(w, bonus ? 2 : 1, /^Conferma ▶/);
        await W.dorme(1300);
      }
      if (!W.clicca(w, /Scopriamo gli scenari/)) no("niente «Scopriamo gli scenari» («" + T(w).slice(0, 100) + "»)");
      await W.dorme(300);
      for (var s = 0; s < pres.length; s++) {
        if (!/Lo scenario di/.test(T(w)) || w.document.querySelectorAll(".sp-palco .sp-mini").length !== 3) no("lo scenario svelato non ha 2 Bonus e il Malus");
        if (!/💥 da /.test(T(w))) no("il Malus svelato non dice chi l'ha messo");
        if (!w.document.querySelector(".sp-timer")) no("l'arringa a 60 secondi non ha il conto");
        if (giri === 1 && /Giulia/.test((w.document.querySelector(".sp-palco .sp-col-tx") || {}).textContent) && !/✍️ di Giulia/.test(T(w))) no("lo scenario di Giulia non ha la carta firmata");
        var b = bottone(w, /Prossimo scenario|Al verdetto/); if (!b) no("niente «Prossimo scenario»"); b.click(); await W.dorme(300);
      }
      var tabs = w.document.querySelectorAll(".sp-tab button");
      if (tabs.length !== 2) no("al verdetto ci sono " + tabs.length + " linguette");
      tabs[1].click(); await W.dorme(100);
      var bs = bottone(w, /Scelgo/); if (!bs || bs.textContent.indexOf(pres[1]) < 0) no("«Scelgo» non segue la linguetta (" + (bs && bs.textContent) + ")");
      bs.click(); await W.dorme(400);
      if (!await W.aspetta(function () { return new RegExp("Il round va a " + pres[1]).test(T(w)); }, 4500)) no("l'esito non dà il round a " + pres[1]);   // (30 ott 2026: dopo la luce)
      if (!W.clicca(w, /Prossimo round|Classifica finale/)) no("niente «Prossimo round»");
      await W.dorme(500);
    }
    if (giri !== 3) no("si sono giocati " + giri + " round invece di 3");
    if (!await W.aspetta(function () { return !w.document.querySelector(".sp-scena") && /Fine partita/.test(T(w)); }, 4000)) no("niente classifica finale («" + T(w).slice(0, 100) + "»)");
    note.push("Ognuno per sé in 3: 3 round, carta bianca, classifica");
    // a squadre in 5 (due squadre da 2): la carta bianca con «Chi la scrive?»
    w = await avviaLocale(["Paky", "Giulia", "Luca", "Sara", "Bea"], { si: "squadre", giri: 1, bianca: 1 });
    if (!await W.aspetta(function () { return /Squadra 1/.test(T(w)) && bottone(w, /Via ▶/); }, 3000)) no("niente schermata delle squadre");
    W.clicca(w, /Via ▶/);
    var primo = await W.aspetta(function () { var b = bottone(w, /^Sono /); return b ? b.textContent : null; }, 3000);
    if (!primo) no("niente passaggio del telefono");
    bottone(w, /^Sono /).click();
    await W.aspetta(function () { return carte(w).length; }, 3000);
    w.document.querySelector(".sp-scrivi-b").click();
    await W.dorme(150);
    var chis = w.document.querySelectorAll(".sp-scrivi .sp-chis button");
    var ta = w.document.querySelector(".sp-scrivi textarea"); ta.value = "Vinci sempre a carte"; ta.dispatchEvent(new w.Event("input", { bubbles: true }));
    var met = bottone(w, /Metti in mano/);
    if (chis.length !== 2) no("«Chi la scrive?» non ha i 2 della squadra (" + chis.length + ")");
    if (chis.length > 1) { if (!met.disabled) no("senza dire chi la scrive si può già mettere"); chis[1].click(); }
    var firma = chis.length > 1 ? chis[1].textContent : null;
    metti(w); await W.dorme(200);
    var sc = w.document.querySelector(".sp-carta.scritta.su"); if (!sc) no("a squadre la carta scritta non arriva già scelta");
    if (firma && sc.textContent.indexOf("di " + firma) < 0) no("la firma non è di " + firma + " («" + sc.textContent + "»)");
    await gioca(w, 2, /^Conferma ▶/);
    await W.dorme(300);
    if (!w.document.querySelector(".sp-tavolo .sp-mini.scritta")) no("sul tavolo a squadre la carta scritta non ha il bordo");
    note.push("a squadre: carta bianca" + (firma ? " firmata da " + firma + " («Chi la scrive?»)" : ""));
    return note.join(" · ") + errori();
  } });

  // ===================== sp5: le misure =====================
  // la schermata di gioco sta in uno schermo: niente scorre, i tasti in fondo si vedono
  async function misura(w, nome, larg, alt, cosa) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{animation:none!important}.sp-mini.nuova{animation:none!important}"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(450);
    var sc = d.querySelector(".sp-scena"); if (!sc) return cosa + ": non c'è il tavolo";
    if (d.documentElement.scrollHeight > alt + 1) return cosa + " " + larg + "x" + alt + ": la pagina scorre (" + d.documentElement.scrollHeight + ")";
    if (d.documentElement.scrollWidth > larg + 1) return cosa + " " + larg + "x" + alt + ": scorre di lato";
    var p = sc.querySelector(".sp-piede"), r = p.getBoundingClientRect();
    if (p.children.length && r.bottom > alt + 1) return cosa + " " + larg + "x" + alt + ": i tasti escono (" + Math.round(r.bottom) + ")";
    var cc = d.querySelectorAll(".sp-carta");
    for (var i = 0; i < cc.length; i++) { var c = cc[i].getBoundingClientRect(); if (c.height < 30 || c.bottom > alt + 1) return cosa + " " + larg + "x" + alt + ": carta troppo bassa o fuori (" + Math.round(c.height) + ")"; }
    var bb = p.querySelectorAll("button");
    for (var j = 0; j < bb.length; j++) if (bb[j].scrollWidth > bb[j].clientWidth + 2) return cosa + " " + larg + "x" + alt + ": la scritta «" + bb[j].textContent + "» è tagliata";
    return "";
  }
  async function misure(w, nome, cosa) {
    var m = (await misura(w, nome, 360, 640, cosa)) || (await misura(w, nome, 412, 915, cosa));
    var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px";
    if (m) no(m);
  }
  COPIONE.aggiungi("sp5", { nome: "Sì… però Ognuno per sé in 6: le schermate a 360x640 e 412x915", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Sara", "Marco", "Bea"];
    var Z = await salaSp(nomi.slice(1), nomi, { si: "solo", arringa: 60 }), C = Z.C, P = Z.P;
    W.clicca(P, /Comincia/, ".sl-go");
    var v = await W.aspetta(function () { var x = vm(C); return x.fase === "gioco" && x.solo ? x : null; }, 10000);
    if (!v) no("non comincia");
    var p0 = nomeDi(C, v.pres[0]), w0 = W.finestra(p0), gn = nomeDi(C, v.giudiceId), wg = W.finestra(gn);
    await W.aspetta(function () { return carte(w0).length === 4; }, 6000);
    await misure(w0, p0, "Bonus con «Scrivi tu»");
    await misure(wg, gn, "giudice che aspetta");
    await passoCarte(C, "bonus");
    await W.aspetta(function () { return carte(w0).length === 3; }, 6000);
    await misure(w0, p0, "Malus con lo scenario del vicino");
    await gioca(w0, 1);
    await W.dorme(300);
    await misure(w0, p0, "Malus giocato");
    await passoCarte(C, "malus");
    await W.aspetta(function () { return vm(C).fase === "arringa"; }, 5000);
    await W.dorme(2500);
    await misure(wg, gn, "svelamento col conto");
    for (var i = 0; i < 5; i++) { var b = await W.aspetta(function () { var x = bottone(wg, /Prossimo scenario|Al verdetto/); return x && !x.disabled ? x : null; }, 4000); if (!b) no("niente «Prossimo scenario»"); b.click(); await W.dorme(250); }
    await W.aspetta(function () { return vm(C).fase === "giudizio"; }, 4000);
    await misure(wg, gn, "verdetto con 5 linguette");
    await misure(w0, p0, "verdetto di chi aspetta");
    bottone(wg, /Scelgo/).click();
    await W.aspetta(function () { return vm(C).fase === "esito"; }, 4000);
    await W.dorme(3300);
    await misure(w0, p0, "esito con «⏩ Avanti»");
    return "schermate a 360x640 e 412x915 senza scorrere" + errori();
  } });
})();
