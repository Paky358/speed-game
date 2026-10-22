// PROVE DI PAROLA D'ORDINE, giro 2 (21 ott 2026), compito «Segnare e girare» (js/games/ordine.js).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("ordine2/segnare.js"); await COPIONE.prova("o2s1")
// Con Edge invisibile: prova.js --porta 8995 --carica ordine2/segnare.js --prova o2s1,o2s2,o2s3,o2s4,o2s5 --rifai
//
// o2s1: online in 4 (Rossi = Luca capo + Paky host; Blu = Giulia capo + Sara), un turno per squadra (chi indovina è una volta
//       l'host e una volta un amico):
//       - un tocco SEGNA la parola: «mia» e la mia faccina compaiono SUBITO (prima della foto dell'host), poi l'host conferma;
//       - la faccina è un avatar vero (immagine che si carica, non rotta), piccola, sul bordo in alto della casella e non copre
//         le lettere; la vedono tutti i telefoni;
//       - un altro tocco TOGLIE il segno (subito, e poi anche nella foto); il tasto torna «Segna una parola», spento;
//       - un doppio tocco veloce non gira niente (e non lascia segni);
//       - segno B poi C: il tasto dice «👆 Gira C» (la più recente); lo tocco: C si gira; poi dice «👆 Gira B»;
//       - «✋ Basta così, passo»: il primo tocco dice «Sicuri? ✋ Passo» e non passa; dopo 3 s torna com'era; un doppio tocco
//         veloce non passa; il secondo tocco (dopo un attimo) passa il turno;
//       - il ruolo scritto in alto su ogni telefono («👑 Sei il capo dei Rossi», «🔵 Sei nei Blu · indovini tu»…);
//       - tocco una parola quando non tocca a me: «Ora tocca ai Rossi» (e niente segno), il capo: «Sei il capo…»;
//       - niente più «tocca ancora» sulle caselle;
//       - al secondo indizio dei Rossi, sotto l'indizio, su tutti i telefoni: «🔴 <primo indizio> 2 · 1 trovata»;
//       - tocco nella chat la riga di una parola girata: la sua casella si illumina (e poi si spegne).
// o2s2: chi ricarica, chi arriva tardi, chi guarda, il vice (Rossi = Luca capo, Sara, Paky; Blu = Giulia capo, Marco):
//       Sara segna due parole; l'host ricarica → i segni ci sono ancora (foto e telefono di Sara, «👆 Gira …»); Sara ricarica
//       → li ritrova; Bea arriva a metà e legge il suo ruolo; Ugo guarda col link: vede le faccine, niente ruolo in alto (ha
//       la targhetta del core), toccando una parola legge «👀 Stai guardando…»; l'host sparisce → Giulia tiene la partita,
//       Sara gira col tasto e toglie l'altro segno.
// o2s3: «🧪 Prova da solo» di IL PAPPONE (capo il Bot, io indovino) e «🤖 Contro il Bot» in 3: segno subito, ritocco toglie,
//       doppio tocco niente, «👆 Gira» gira, «✋ Basta così» con la conferma; contro il Bot due segni sulla stessa parola =
//       due faccine; nel turno del Bot «Ora tocca a … (Bot)».
// o2s4: i mazzi e le parole: solo Classico e 🌶️ Serata (un mazzo vecchio diventa Classico anche nella ripresa e in saletta);
//       window.SG_ORDINE_SORELLE (coppie, righe, gruppi, oggetto) letta bene e mai due sorelle nello stesso tabellone; la
//       memoria delle parole uscite vale 30 giorni (una di 20 giorni fa non torna, una di 31 giorni fa sì).
// o2s5: le misure a 360x640 e 412x915 (chi indovina con tre segni, la riga degli indizi aperti e il tasto «👆 Gira»; il
//       capo; l'altra squadra): niente scorre, niente esce, il ruolo sta tra ‹ e la musica senza toccarli, «👆 Gira …» ci
//       sta, le faccine piccole non coprono le parole corte.
// o2s6 (revisione del 21 ott 2026): gli indizi aperti quando si recupera una parola vecchia col tentativo in più: «🔴 A 2 · 1
//       trovata» sotto l'indizio B 1; trovata la parola di B resta; col tentativo in più (l'altra di A) A si chiude e al giro
//       dopo non c'è più. (Prima le parole in più restavano a B e A restava «aperto» per sempre.)
// Revisione: quando il Blu deve sbagliare apposta (o2s2, o2s5, o2s6) gira una parola di nessuno e, se era la parola d'oro
//       (la squadra continua), un'altra (aiuto sbaglia).
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;
  var INDIZI = ["QUOKKA", "ZEFIRO", "GNOMO", "YETI", "FIORDO", "WAFER", "OBLO", "JAZZ", "ZUAVO", "KIWI", "PUFFO", "VICHINGO"];

  // ---------------- aiuti ----------------
  function nota(N, x) { N.push(x); }
  function senzaErrori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  function chiDi(C, nome) { return ((vm(C).players || []).filter(function (p) { return p.nome === nome; }))[0] || null; }
  function idDi(C, nome) { var p = chiDi(C, nome); return p ? p.id : null; }
  function nomeDi(C, id) { var p = ((vm(C).players || []).filter(function (x) { return x.id === id; }))[0]; return p ? p.nome : null; }
  function carte(w) { return w.document.querySelectorAll(".or-tab .or-carta"); }
  function carta(w, i) { return carte(w)[i]; }
  function chiaveDa(w) { return [].map.call(carte(w), function (b) { var m = / c(\d|n|x)(\s|$)/.exec(" " + b.className + " "); return m ? (/\d/.test(m[1]) ? +m[1] : m[1]) : null; }); }
  function toast(w) { var t = w.document.querySelector(".or-toast.su"); return t ? t.textContent : ""; }
  function ruoloDi(w) { var r = w.document.querySelector(".or-ruolo"); return r ? r.textContent : ""; }
  function gira(w) { var b = w.document.querySelector(".or-gira"); return b ? { b: b, tx: b.textContent, off: b.disabled } : null; }
  function passo(w) { return w.document.querySelector(".or-passo"); }
  function facce(w, i) { var b = carta(w, i); return b ? b.querySelectorAll(".or-pr .or-av") : []; }
  function vmTel(w) { var u = w.__ORDINE && w.__ORDINE.ui; return u && u.vm; }
  // la casella è ferma (niente telecamera in giro), così le misure sono quelle vere
  function calmo(w) {
    var ui = w.__ORDINE && w.__ORDINE.ui, d = w.document; if (!ui || !ui.S) return false;
    if (ui.inScena || (ui.coda && ui.coda.length)) return false;
    if (ui.S.shot && ui.S.R && ui.S.shot() !== ui.S.R.schermo) return false;
    return !d.querySelector(".or-vignetta.su, .st-terzo.on");
  }
  // tutte le immagini delle faccine sulla casella i si sono caricate davvero (niente immagine rotta)? "" = sì
  function facceRotte(w, i) {
    var f = facce(w, i); if (!f.length) return "nessuna faccina sulla casella";
    for (var k = 0; k < f.length; k++) {
      var img = f[k].querySelector("img");
      if (!img) { if (!f[k].querySelector("b") && !f[k].classList.contains("piu")) return "faccina vuota"; continue; }
      if (!img.complete) return "immagine non ancora caricata";
      if (!(img.naturalWidth > 0)) return "immagine rotta (src lunga " + (img.getAttribute("src") || "").length + ")";
    }
    return "";
  }
  // la faccina copre le lettere della parola? (rettangolo delle lettere vere, con 2 px di tolleranza) "" = no
  function copre(w, i) {
    var b = carta(w, i), s = b && b.querySelector(".or-w"), f = facce(w, i); if (!s || !f.length) return "";
    var R = w.document.createRange(); R.selectNodeContents(s);
    var rects = [].slice.call(R.getClientRects());
    for (var k = 0; k < f.length; k++) {
      var fr = f[k].getBoundingClientRect();
      for (var j = 0; j < rects.length; j++) {
        var tr = rects[j], ox = Math.min(fr.right, tr.right) - Math.max(fr.left, tr.left), oy = Math.min(fr.bottom, tr.bottom) - Math.max(fr.top, tr.top);
        if (ox > 2 && oy > 2) return "la faccina copre «" + s.textContent + "» (" + Math.round(ox) + "x" + Math.round(oy) + " px)";
      }
    }
    return "";
  }
  // la faccina sta sul bordo in alto della casella ed è piccola? "" = sì
  function sulBordo(w, i) {
    var b = carta(w, i), f = facce(w, i); if (!f.length) return "nessuna faccina";
    var cr = b.getBoundingClientRect(), fr = f[0].getBoundingClientRect(), sc = cr.width / (b.offsetWidth || cr.width);
    if (fr.width / sc > 19) return "faccina larga " + Math.round(fr.width / sc) + " px";
    var cy = (fr.top + fr.bottom) / 2;
    if (Math.abs(cy - cr.top) > 10 * sc) return "faccina non sul bordo (centro " + Math.round((cy - cr.top) / sc) + " px dal bordo)";
    return "";
  }
  // un indizio che vale per questo tabellone
  function indizioBuono(w, C, usati) {
    var tab = vm(C).tab || [];
    for (var i = 0; i < INDIZI.length; i++) if ((usati || []).indexOf(INDIZI[i]) < 0 && !w.__ORDINE.erroreIndizio(INDIZI[i], tab)) return INDIZI[i];
    no("nessun indizio buono per questo tabellone");
  }
  // il capo (un amico) dà l'indizio: { parola }
  async function indizio(C, nomeCapo, n, usati) {
    var w = W.finestra(nomeCapo), p = indizioBuono(w, C, usati);
    W.reteDi(nomeCapo).invia({ t: "indizio", parola: p, n: n });
    if (!await W.aspetta(function () { var v = vm(C); return v.passo === "indovina" && v.indizio && v.indizio.parola === p; }, 5000)) no("l'indizio " + p + " di " + nomeCapo + " non arriva (" + vm(C).passo + ")");
    // (e la foto con l'indizio è arrivata su tutti i telefoni)
    await W.aspetta(function () { return (W.__nomiO2 || []).every(function (n) { var w2 = W.finestra(n), v2 = w2 && vmTel(w2); return !v2 || (v2.indizio && v2.indizio.parola === p); }); }, 3000);
    if (usati) usati.push(p);
    return p;
  }
  // le parole ancora coperte di un colore (dalla chiave sul telefono del capo)
  function coperteDi(C, chiave, col) { var v = vm(C); return chiave.map(function (c, i) { return c === col && !v.tab[i].g ? i : -1; }).filter(function (i) { return i >= 0; }); }
  // chi (della squadra k) gira una parola di nessuno per passare il turno; se è la parola d'oro (segreta anche ai capi) la
  // squadra continua: allora ne gira un'altra (prima si girava solo la prima di nessuno, e una volta su 7 la prova falliva)
  async function sbaglia(C, chiave, chi, k) {
    var neutre = coperteDi(C, chiave, "n");
    for (var j = 0; j < neutre.length; j++) {
      var i = neutre[j];
      W.reteDi(chi).invia({ t: "gira", i: i });
      if (!await W.aspetta(function () { var v = vm(C); return v.tab[i].g && !v.sospeso; }, 7000)) no(chi + " non riesce a girare " + vm(C).tab[i].w);
      if (vm(C).turno !== k) return;
    }
    no(chi + " ha girato tutte le parole di nessuno e il turno non passa");
  }
  // apre la stanza con gli amici, sistema squadre e capi e comincia. sq = { nome: squadra }, capi = [nomeRossi, nomeBlu]
  async function partita(amici, sq, capi, opzTel) {
    var P = await W.apriTel("Paky", Object.assign({ x: 0 }, opzTel || {}));
    var C = await W.apriStanza(P, "Parola d'ordine");
    for (var i = 0; i < amici.length; i++) {
      await W.apriTel(amici[i], { hash: "gioco=ordine&stanza=" + C, x: 185 * (i + 1) });
      var quanti = i + 2;
      if (!await W.aspetta(function () { return (vm(C).players || []).length >= quanti; }, 8000)) no(amici[i] + " non entra");
    }
    Object.keys(sq).forEach(function (n) { if (n !== "Paky") W.reteDi(n).invia({ t: "squadra", s: sq[n] }); });
    if (sq.Paky != null && sq.Paky !== 0) no("(prova) Paky resta nei Rossi");
    if (!await W.aspetta(function () { return Object.keys(sq).every(function (n) { var p = chiDi(C, n); return p && p.team === sq[n]; }); }, 5000))
      no("le squadre non si sistemano: " + JSON.stringify((vm(C).players || []).map(function (p) { return p.nome + p.team; })));
    capi.forEach(function (n) { if (n !== "Paky") W.reteDi(n).invia({ t: "capo" }); });
    if (!await W.aspetta(function () { var c = vm(C).capo || []; return capi.every(function (n, k) { return c[k] === idDi(C, n); }); }, 5000)) no("i capi non sono " + capi.join(" e ") + ": " + JSON.stringify(vm(C).capo));
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).tab; }, 10000)) no("non comincia (" + vm(C).fase + ")");
    if (!await W.aspetta(function () { return ["Paky"].concat(amici).every(function (n) { var w = W.finestra(n); return w && carte(w).length >= 20; }); }, 6000)) no("non tutti vedono il tabellone");
    return { P: P, C: C, nomi: ["Paky"].concat(amici), capi: capi };
  }
  // chi indovina adesso nella squadra k (il primo che non è capo), preferendo chi è nella lista
  function indovinoDi(C, k, pref) {
    var v = vm(C), l = (v.players || []).filter(function (p) { return p.team === k && p.id !== v.capo[k] && !p.via && !p.bot; }).map(function (p) { return p.nome; });
    var x = (pref || []).filter(function (n) { return l.indexOf(n) >= 0; })[0];
    return x || l[0];
  }

  // il giro completo dei segni per chi indovina (X) nella squadra di turno k. Restituisce { C: la parola girata, note }
  async function provaSegni(X, k, C, chiave, N) {
    var w = W.finestra(X), id = idDi(C, X), mie = coperteDi(C, chiave, k);
    if (mie.length < 3) no("la squadra " + k + " ha meno di 3 parole coperte");
    var a = mie[0], b = mie[1], c = mie[2], v = vm(C), tab = v.tab;
    await W.aspetta(function () { return gira(w); }, 4000);
    var g0 = gira(w); if (!g0) no(X + " non ha il tasto «👆 Gira» («" + T(w).slice(-100) + "»)");
    if (!g0.off || !/Segna una parola/.test(g0.tx)) no(X + ": senza segni il tasto dice «" + g0.tx + "» (" + (g0.off ? "spento" : "acceso") + ")");
    if (/tocca ancora/i.test(T(w))) no(X + ": c'è ancora «tocca ancora»");
    // 1. un tocco segna: subito
    carta(w, a).click();
    var subito = carta(w, a).classList.contains("mia") && facce(w, a).length > 0, gs = gira(w);
    if (!subito) no(X + ": il segno su " + tab[a].w + " non compare subito");
    if (gs.off || gs.tx.indexOf("Gira " + tab[a].w) < 0) no(X + ": dopo il segno il tasto dice «" + gs.tx + "»");
    if (!await W.aspetta(function () { return ((vm(C).prop || {})[id] || []).indexOf(a) >= 0; }, 4000)) no("il segno di " + X + " non arriva all'host");
    // la faccina: avatar vero, piccola, sul bordo, sopra nessuna lettera, su tutti i telefoni
    var tutti = W.__nomiO2 || [];
    for (var q = 0; q < tutti.length; q++) {
      var wq = W.finestra(tutti[q]); if (!wq) continue;
      var ok = await W.aspetta(function () { return facce(wq, a).length && !facceRotte(wq, a); }, 3000);
      if (!ok) no(tutti[q] + ": sulla casella " + tab[a].w + " " + (facceRotte(wq, a) || "niente faccina"));
    }
    await W.aspetta(function () { return calmo(w); }, 8000);
    var e1 = sulBordo(w, a), e2 = tab[a].w.length <= 8 ? copre(w, a) : "";
    if (e1) no(X + ": " + e1);
    if (e2) no(X + ": " + e2);
    // 2. un altro tocco toglie il segno: subito, poi nella foto
    carta(w, a).click();
    if (carta(w, a).classList.contains("mia") || facce(w, a).length) no(X + ": ritoccando " + tab[a].w + " il segno non sparisce subito");
    var g2 = gira(w); if (!g2.off || !/Segna una parola/.test(g2.tx)) no(X + ": tolto il segno il tasto dice «" + g2.tx + "»");
    if (!await W.aspetta(function () { return ((vm(C).prop || {})[id] || []).indexOf(a) < 0; }, 4000)) no("il segno tolto da " + X + " resta nella foto");
    if (vm(C).tab[a].g || vm(C).sospeso) no(X + ": ritoccando " + tab[a].w + " la parola si è girata!");
    // 3. doppio tocco veloce: niente
    carta(w, b).click(); carta(w, b).click();
    await W.dorme(1500);
    var v3 = vm(C);
    if (v3.tab[b].g || v3.sospeso) no(X + ": un doppio tocco su " + tab[b].w + " l'ha girata");
    if (((v3.prop || {})[id] || []).indexOf(b) >= 0 || carta(w, b).classList.contains("mia")) no(X + ": il doppio tocco su " + tab[b].w + " lascia il segno");
    // 4. segno B poi C: «👆 Gira C» (la più recente), la giro col tasto, poi resta «👆 Gira B»
    carta(w, b).click(); await W.dorme(150); carta(w, c).click();
    var g4 = gira(w); if (g4.tx.indexOf("Gira " + tab[c].w) < 0) no(X + ": con due segni il tasto dice «" + g4.tx + "» (doveva essere " + tab[c].w + ")");
    if (!await W.aspetta(function () { var l = (vm(C).prop || {})[id] || []; return l.join() === [b, c].join(); }, 4000)) no("nella foto i segni di " + X + " sono " + JSON.stringify((vm(C).prop || {})[id]));
    gira(w).b.click();
    if (!gira(w).off) no(X + ": appena toccato «👆 Gira» il tasto resta acceso (si potrebbe girare due volte)");
    if (!await W.aspetta(function () { return vm(C).tab[c].g; }, 7000)) no(X + ": «👆 Gira " + tab[c].w + "» non gira la parola");
    if (vm(C).tab[b].g) no(X + ": si è girata anche " + tab[b].w);
    if (!await W.aspetta(function () { var x = gira(w); return x && !x.off && x.tx.indexOf("Gira " + tab[b].w) >= 0; }, 4000)) no(X + ": dopo il giro il tasto dice «" + (gira(w) || {}).tx + "» (doveva tornare " + tab[b].w + ")");
    if (vm(C).turno !== k) no("girata una parola della squadra il turno è passato");
    nota(N, X + ": segno subito, ritocco toglie, doppio tocco niente, «👆 Gira " + tab[c].w + "» gira, poi «👆 Gira " + tab[b].w + "»");
    return c;
  }
  // «✋ Basta così, passo» con la conferma (la squadra di turno k, sul telefono di X)
  async function provaPasso(X, k, C, N) {
    var w = W.finestra(X), b = await W.aspetta(function () { var x = passo(w); return x && !x.disabled && x; }, 4000);
    if (!b) no(X + ": «✋ Basta così» spento dopo una parola girata");
    if (!/Basta così/.test(b.textContent)) no(X + ": il tasto dice «" + b.textContent + "»");
    b.click();
    if (!/Sicuri\?/.test(passo(w).textContent)) no(X + ": il primo tocco non chiede «Sicuri?» («" + passo(w).textContent + "»)");
    await W.dorme(700);
    if (vm(C).turno !== k) no(X + ": un tocco solo su «Basta così» ha passato il turno");
    await W.dorme(2800);
    if (/Sicuri/.test(passo(w).textContent) || !/Basta così/.test(passo(w).textContent)) no(X + ": dopo 3 s il tasto non torna «✋ Basta così» («" + passo(w).textContent + "»)");
    passo(w).click(); passo(w).click();   // doppio tocco veloce
    await W.dorme(700);
    if (vm(C).turno !== k) no(X + ": un doppio tocco veloce ha passato il turno");
    passo(w).click();   // (era «Sicuri?»: il secondo tocco, dopo un attimo)
    if (!await W.aspetta(function () { return vm(C).turno !== k || vm(C).fase !== "gioco"; }, 4000)) no(X + ": il secondo tocco su «Sicuri? ✋ Passo» non passa il turno");
    nota(N, X + ": «Basta così» → «Sicuri? ✋ Passo», torna dopo 3 s, il doppio tocco non passa, il secondo tocco sì");
  }

  // ---------------- o2s1 ----------------
  COPIONE.aggiungi("o2s1", { nome: "Parola d'ordine: segnare, togliere il segno, «👆 Gira», «Basta così» con la conferma, ruolo, indizi aperti, chat", fai: async function () {
    var N = [], amici = ["Giulia", "Luca", "Sara"];
    W.__nomiO2 = ["Paky"].concat(amici);
    var X = await partita(amici, { Luca: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]), C = X.C;
    var chiave = chiaveDa(W.finestra("Luca"));
    if (!chiave.length || chiave.some(function (c) { return c == null; })) no("Luca (capo) non vede la chiave");
    if (chiaveDa(W.finestra("Paky")).some(function (c) { return c != null; })) no("Paky (non capo) vede dei colori");
    // il ruolo in alto
    var attesi = { Luca: "👑 Sei il capo dei Rossi", Giulia: "👑 Sei il capo dei Blu", Paky: "🔴 Sei nei Rossi · indovini tu", Sara: "🔵 Sei nei Blu · indovini tu" };
    Object.keys(attesi).forEach(function (n) { var r = ruoloDi(W.finestra(n)); if (r !== attesi[n]) no(n + ": in alto «" + r + "» invece di «" + attesi[n] + "»"); });
    nota(N, "ruoli in alto giusti su 4 telefoni");
    var k0 = vm(C).turno, capi = ["Luca", "Giulia"], usati = [], primo = { k: k0 };
    // primo turno
    primo.p = await indizio(C, capi[k0], 2, usati);
    var X0 = indovinoDi(C, k0), alt = indovinoDi(C, 1 - k0), wAlt = W.finestra(alt), wCapo = W.finestra(capi[k0]);
    // chi non è di turno tocca una parola: avviso breve, niente segno
    var libera = coperteDi(C, chiave, "n")[0];
    carta(wAlt, libera).click();
    var tAlt = toast(wAlt), atteso = "Ora tocca ai " + (k0 ? "Blu" : "Rossi");
    if (tAlt !== atteso) no(alt + " tocca fuori turno e legge «" + tAlt + "» invece di «" + atteso + "»");
    carta(wCapo, libera).click();
    if (!/Sei il capo|Tocca le parole della tua squadra/.test(toast(wCapo))) no(capi[k0] + " (capo) tocca e legge «" + toast(wCapo) + "»");   // (dopo l'indizio il capo può segnare le parole che intendeva: «Tocca le parole della tua squadra»)
    await W.dorme(500);
    if (Object.keys(vm(C).prop || {}).length) no("un tocco fuori turno ha lasciato un segno: " + JSON.stringify(vm(C).prop));
    nota(N, "fuori turno: «" + tAlt + "», al capo «" + toast(wCapo) + "»");
    primo.c = await provaSegni(X0, k0, C, chiave, N);
    await provaPasso(X0, k0, C, N);
    // secondo turno (l'altra squadra: chi indovina è l'altro tra l'host e l'amica)
    var k1 = vm(C).turno; if (k1 === k0) no("il turno non è passato");
    await indizio(C, capi[k1], 2, usati);
    await provaSegni(indovinoDi(C, k1), k1, C, chiave, N);
    await provaPasso(indovinoDi(C, k1), k1, C, N);
    // terzo turno: di nuovo la prima squadra. Sotto l'indizio, l'indizio vecchio ancora aperto
    if (vm(C).turno !== k0) no("non torna la prima squadra");
    await indizio(C, capi[k0], 1, usati);
    var em = k0 ? "🔵" : "🔴", riga = em + " " + primo.p + " 2 · 1 trovata";
    for (var q = 0; q < W.__nomiO2.length; q++) {
      var wq = W.finestra(W.__nomiO2[q]);
      var ap = await W.aspetta(function () { var x = wq.document.querySelector(".or-aperti"); return x && x.textContent; }, 3000);
      if (!ap || ap.indexOf(riga) < 0) no(W.__nomiO2[q] + ": sotto l'indizio «" + (ap || "niente") + "» invece di «" + riga + "»");
    }
    nota(N, "indizi aperti su 4 telefoni: «" + riga + "»");
    // la chat: tocco la riga della parola girata, la casella si illumina. (Dal 22 ott 2026 la chat è una striscia con le
    // ultime 2 righe: un tocco la apre sopra il tabellone, e il tocco sulla riga la richiude e illumina la casella: ordine2/tabellone.js)
    var wP = W.finestra("Paky"), parolaC = vm(C).tab[primo.c].w;
    wP.document.querySelector(".or-log").click();
    if (!wP.document.querySelector(".or-chat.aperta")) no("un tocco sulla striscia della chat non la apre");
    var rigaChat = [].filter.call(wP.document.querySelectorAll(".or-log .or-l.tocca"), function (r) { return r.querySelector(".or-l-w") && r.querySelector(".or-l-w").textContent === parolaC; })[0];
    if (!rigaChat) no("nella chat di Paky non trovo la riga di " + parolaC);
    rigaChat.click();
    if (wP.document.querySelector(".or-chat.aperta")) no("toccando la riga la chat non si chiude");
    if (!carta(wP, primo.c).querySelector(".or-lampo")) no("toccando la riga di " + parolaC + " la casella non si illumina");
    if ([].some.call(carte(wP), function (b, i) { return i !== primo.c && b.querySelector(".or-lampo"); })) no("si illumina una casella sbagliata");
    await W.dorme(1900);
    if (carta(wP, primo.c).querySelector(".or-lampo")) no("la casella resta illuminata");
    nota(N, "chat: tocco «" + parolaC + "» → la casella si illumina e si spegne");
    senzaErrori();
    return N.join(" · ");
  } });

  // ---------------- o2s2 ----------------
  COPIONE.aggiungi("o2s2", { nome: "Parola d'ordine: i segni restano con chi ricarica, chi arriva tardi, chi guarda e il vice", fai: async function () {
    var N = [], amici = ["Giulia", "Luca", "Sara", "Marco"];
    W.__nomiO2 = ["Paky"].concat(amici);
    var X = await partita(amici, { Luca: 0, Sara: 0, Giulia: 1, Marco: 1 }, ["Luca", "Giulia"]), C = X.C, chiave = chiaveDa(W.finestra("Luca"));
    // tocca ai Rossi (se comincia il Blu, Marco sbaglia apposta)
    if (vm(C).turno === 1) {
      await indizio(C, "Giulia", 1);
      await sbaglia(C, chiave, "Marco", 1);
      if (!await W.aspetta(function () { return vm(C).turno === 0 && vm(C).passo === "indizio"; }, 8000)) no("non tocca ai Rossi");
    }
    await indizio(C, "Luca", 3);
    var mie = coperteDi(C, chiave, 0), a = mie[0], b = mie[1], wS = W.finestra("Sara"), id = idDi(C, "Sara"), tab = vm(C).tab;
    carta(wS, a).click(); await W.dorme(150); carta(wS, b).click();
    if (!await W.aspetta(function () { return ((vm(C).prop || {})[id] || []).join() === [a, b].join(); }, 4000)) no("i segni di Sara non arrivano");
    // l'host ricarica: i segni restano
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._r && (s.vm || s).pronta; }, 10000)) no("la partita non riprende dopo la ricarica dell'host");
    if (((vm(C).prop || {})[id] || []).join() !== [a, b].join()) no("dopo la ricarica dell'host i segni di Sara sono " + JSON.stringify((vm(C).prop || {})[id]));
    if (!await W.aspetta(function () { var g = gira(wS); return g && !g.off && g.tx.indexOf("Gira " + tab[b].w) >= 0 && carta(wS, a).classList.contains("mia"); }, 6000))
      no("dopo la ricarica dell'host Sara non ha i suoi segni («" + ((gira(wS) || {}).tx) + "»)");
    var wP = await W.aspetta(function () { var w = W.finestra("Paky"); return w && carte(w).length && facce(w, b).length && w; }, 6000);
    if (!wP) no("Paky ricaricato non vede la faccina di Sara su " + tab[b].w);
    nota(N, "l'host ricarica: i segni di Sara restano (foto, telefono di Sara, faccina da Paky)");
    // Sara ricarica: li ritrova
    wS = await W.ricarica("Sara");
    if (!await W.aspetta(function () { var w = W.finestra("Sara"), g = w && gira(w); return g && !g.off && g.tx.indexOf("Gira " + tab[b].w) >= 0 && carta(w, a).classList.contains("mia") && carta(w, b).classList.contains("mia"); }, 8000))
      no("Sara ricarica e non ritrova i suoi segni («" + T(W.finestra("Sara")).slice(-80) + "»)");
    wS = W.finestra("Sara");
    nota(N, "Sara ricarica: ritrova i segni e «👆 Gira " + tab[b].w + "»");
    // Bea arriva a metà: entra in una squadra e legge il suo ruolo
    var wB = await W.apriTel("Bea", { hash: "gioco=ordine&stanza=" + C, x: 185 * 5 });
    if (!await W.aspetta(function () { return chiDi(C, "Bea") && carte(W.finestra("Bea")).length; }, 8000)) no("Bea non entra");
    var pb = chiDi(C, "Bea"), rB = "";
    if (!await W.aspetta(function () { rB = ruoloDi(W.finestra("Bea")); return rB === (pb.team ? "🔵 Sei nei Blu · indovini tu" : "🔴 Sei nei Rossi · indovini tu"); }, 3000)) no("Bea legge in alto «" + rB + "»");
    nota(N, "Bea arriva a metà: «" + rB + "»");
    // Ugo guarda col link: le faccine sì, il ruolo in alto no (c'è la targhetta), toccando: «👀 Stai guardando…»
    var wU = await W.apriTel("Ugo", { hash: "gioco=ordine&stanza=" + C + "&guarda=1", x: 185 * 6 });
    if (!await W.aspetta(function () { var w = W.finestra("Ugo"); return w && carte(w).length && facce(w, a).length && facce(w, b).length; }, 8000)) no("Ugo (guarda) non vede le faccine dei segni");
    wU = W.finestra("Ugo");
    if (ruoloDi(wU)) no("Ugo guarda col link e in alto legge «" + ruoloDi(wU) + "» (c'è già la targhetta)");
    carta(wU, mie[2]).click();
    if (!/Stai guardando/.test(toast(wU))) no("Ugo tocca una parola e legge «" + toast(wU) + "»");
    await W.dorme(400);
    if (Object.keys(vm(C).prop || {}).some(function (k) { return nomeDi(C, k) === "Ugo"; })) no("il tocco di Ugo ha lasciato un segno");
    nota(N, "Ugo guarda: faccine sì, niente ruolo, «" + toast(wU) + "»");
    // l'host sparisce: Giulia tiene la partita, Sara gira col tasto e toglie l'altro segno
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g >= 2 && c.h === idDi(C, "Giulia"); }, 12000)) no("dopo 12 s la partita non la tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
    if (((vm(C).prop || {})[id] || []).join() !== [a, b].join()) no("col vice i segni di Sara sono " + JSON.stringify((vm(C).prop || {})[id]));
    var g = await W.aspetta(function () { var x = gira(W.finestra("Sara")); return x && !x.off && x.tx.indexOf(tab[b].w) >= 0 && x; }, 6000);
    if (!g) no("col vice Sara non ha «👆 Gira " + tab[b].w + "»");
    g.b.click();
    if (!await W.aspetta(function () { return vm(C).tab[b].g; }, 7000)) no("col vice «👆 Gira» non gira");
    if (vm(C).turno === 0 && vm(C).passo === "indovina") {
      wS = W.finestra("Sara");
      await W.aspetta(function () { return !vm(C).sospeso && carta(wS, a).classList.contains("attiva"); }, 4000);
      carta(wS, a).click();
      if (!await W.aspetta(function () { return ((vm(C).prop || {})[id] || []).indexOf(a) < 0; }, 4000)) no("col vice il segno tolto da Sara resta");
      nota(N, "l'host sparisce: Giulia tiene la partita, Sara gira " + tab[b].w + " col tasto e toglie il segno da " + tab[a].w);
    } else nota(N, "l'host sparisce: Giulia tiene la partita, Sara gira " + tab[b].w + " col tasto");
    senzaErrori();
    return N.join(" · ");
  } });

  // ---------------- o2s3 ----------------
  COPIONE.aggiungi("o2s3", { nome: "Parola d'ordine: segnare e girare nella «🧪 Prova da solo» e «🤖 Contro il Bot»", fai: async function () {
    var N = [];
    // --- la prova da solo: capo il Bot, io indovino ---
    var w = await W.apriTel("Pap", { x: 0, profilo: { nome: "IL PAPPONE", uid: "finto-pap" } });
    var tess = await W.aspetta(function () { return A.tessera(w, "Parola d'ordine"); }, 5000); if (!tess) no("niente tessera");
    tess.click(); await W.dorme(400);
    if (!W.clicca(w, /Prova da solo/)) no("IL PAPPONE non vede «Prova da solo»");
    await W.dorme(400);
    var chipBot = [].filter.call(w.document.querySelectorAll(".modo-chip"), function (c) { return c.textContent.trim() === "Bot"; })[0];
    if (!chipBot) no("nelle regole della prova non trovo «il capo è… Bot»");
    chipBot.click();
    if (!w.document.querySelector(".or-tab")) { W.clicca(w, /Comincia|Gioca|Via|Avanti/); await W.dorme(600); }
    if (!await W.aspetta(function () { return w.document.querySelector(".or-tab"); }, 6000)) no("la prova non parte");
    // aspetto il mio turno (i Rossi: io indovino, il Bot fa il capo)
    if (!await W.aspetta(function () { var v = vmTel(w); return v && v.turno === 0 && v.passo === "indovina" && !v.sospeso; }, 60000)) no("nella prova non arriva il mio turno da indovino");
    if (ruoloDi(w) !== "🔴 Sei nei Rossi · indovini tu") no("nella prova in alto «" + ruoloDi(w) + "»");
    var v = vmTel(w), io = ((v.players || []).filter(function (p) { return !p.bot; })[0] || {}).id, cop = v.tab.map(function (c, i) { return c.g ? -1 : i; }).filter(function (i) { return i >= 0; }), a = cop[0], b = cop[1];
    carta(w, a).click();
    if (!carta(w, a).classList.contains("mia") || ((vmTel(w).prop || {})[io] || []).indexOf(a) < 0) no("nella prova il tocco non segna");
    if (facceRotte(w, a)) await W.aspetta(function () { return !facceRotte(w, a); }, 2000);
    if (facceRotte(w, a)) no("nella prova: " + facceRotte(w, a));
    carta(w, a).click();
    if (carta(w, a).classList.contains("mia") || ((vmTel(w).prop || {})[io] || []).indexOf(a) >= 0) no("nella prova il ritocco non toglie il segno");
    carta(w, b).click(); carta(w, b).click(); await W.dorme(1200);
    if (vmTel(w).tab[b].g || vmTel(w).sospeso) no("nella prova un doppio tocco gira la parola");
    carta(w, b).click();
    var g = gira(w); if (!g || g.off || g.tx.indexOf("Gira " + v.tab[b].w) < 0) no("nella prova il tasto dice «" + (g && g.tx) + "»");
    g.b.click();
    if (!await W.aspetta(function () { return vmTel(w).tab[b].g; }, 6000)) no("nella prova «👆 Gira» non gira");
    nota(N, "prova da solo: segno, ritocco toglie, doppio tocco niente, «👆 Gira " + v.tab[b].w + "» gira");
    var f = document.getElementById("tel-Pap"); if (f) f.remove();
    // --- contro il Bot in 3: Giulia capo, Paky (host) e Luca indovinano ---
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Parola d'ordine");
    W.__nomiO2 = ["Paky", "Giulia", "Luca"];
    await W.apriTel("Giulia", { hash: "gioco=ordine&stanza=" + C, x: 185 }); await W.apriTel("Luca", { hash: "gioco=ordine&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (vm(C).players || []).length >= 3; }, 8000)) no("non entrano in 3");
    if (!await W.aspetta(function () { return W.clicca(P, /contro il Bot/); }, 4000)) no("niente «🤖 Siete in 3: giocate contro il Bot»");
    if (!await W.aspetta(function () { return vm(C).vsBot; }, 4000)) no("non si passa a «contro il Bot»");
    W.reteDi("Giulia").invia({ t: "capo" });
    if (!await W.aspetta(function () { return vm(C).capo[0] === idDi(C, "Giulia"); }, 4000)) no("Giulia non diventa capo");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).passo === "indizio" && vm(C).turno === 0; }, 10000)) no("la partita contro il Bot non comincia");
    var chiave = await W.aspetta(function () { var c = chiaveDa(W.finestra("Giulia")); return c.length && c.every(function (x) { return x != null; }) && c; }, 6000);
    if (!chiave) no("Giulia (capo) non vede la chiave");
    await indizio(C, "Giulia", 2);
    var mie = coperteDi(C, chiave, 0), wL = W.finestra("Luca"), wP = W.finestra("Paky"), tab = vm(C).tab;
    // due segni sulla stessa parola = due faccine
    carta(wL, mie[0]).click(); carta(wP, mie[0]).click();
    if (!await W.aspetta(function () { return facce(wL, mie[0]).length === 2 && facce(wP, mie[0]).length === 2 && facce(W.finestra("Giulia"), mie[0]).length === 2; }, 4000))
      no("due segni sulla stessa parola: faccine " + facce(wL, mie[0]).length + "/" + facce(wP, mie[0]).length);
    carta(wP, mie[0]).click();   // Paky toglie il suo
    if (!await W.aspetta(function () { return facce(wL, mie[0]).length === 1; }, 4000)) no("tolto il segno di Paky restano " + facce(wL, mie[0]).length + " faccine");
    var gL = gira(wL); if (!gL || gL.off || gL.tx.indexOf("Gira " + tab[mie[0]].w) < 0) no("Luca: il tasto dice «" + (gL && gL.tx) + "»");
    gL.b.click();
    if (!await W.aspetta(function () { return vm(C).tab[mie[0]].g; }, 7000)) no("contro il Bot «👆 Gira» non gira");
    nota(N, "contro il Bot: due segni = due faccine, Paky toglie il suo, Luca gira " + tab[mie[0]].w + " col tasto");
    // passo con la conferma e poi il turno del Bot: «Ora tocca a … (Bot)»
    var bp = await W.aspetta(function () { var x = passo(wL); return x && !x.disabled && x; }, 4000); if (!bp) no("Luca: «Basta così» spento");
    bp.click(); await W.dorme(500); passo(wL).click();
    if (!await W.aspetta(function () { var x = vmTel(wL); return vm(C).passo === "bot" && x && x.passo === "bot"; }, 4000)) no("dopo «Sicuri? ✋ Passo» non tocca al Bot");
    var cop2 = vm(C).tab.map(function (c, i) { return c.g ? -1 : i; }).filter(function (i) { return i >= 0; });
    carta(wL, cop2[0]).click();
    if (!/Ora tocca a .+ \(Bot\)/.test(toast(wL))) no("nel turno del Bot Luca tocca e legge «" + toast(wL) + "»");
    nota(N, "turno del Bot: «" + toast(wL) + "»");
    senzaErrori();
    return N.join(" · ");
  } });

  // ---------------- o2s4 ----------------
  COPIONE.aggiungi("o2s4", { nome: "Parola d'ordine: mazzi (Classico e 🌶️ Serata), parole sorelle mai insieme, memoria di 30 giorni", fai: async function () {
    var N = [];
    var P = await W.apriTel("Paky", { x: 0 }), O = P.__ORDINE;
    if (!O || !O.mazzoDa) no("non trovo gli aiuti del gioco (window.__ORDINE.mazzoDa)");
    // i mazzi
    if (JSON.stringify(O.MAZZI.map(function (m) { return m[0]; })) !== JSON.stringify(["classico", "serata"])) no("i mazzi sono " + JSON.stringify(O.MAZZI));
    var casi = { classico: "classico", serata: "serata", fanta: "classico", napoli: "classico", cinema: "classico", sport: "classico", anni90: "classico", "": "classico", undefined: "classico" };
    Object.keys(casi).forEach(function (x) { var r = O.mazzoDa(x === "undefined" ? undefined : x); if (r !== casi[x]) no("mazzoDa(" + x + ") = " + r); });
    nota(N, "mazzi: Classico e 🌶️ Serata; fanta/napoli/cinema/sport/anni90 → Classico");
    // le sorelle lette in tutti i modi
    var salva = P.SG_ORDINE_SORELLE;
    function gruppiDi(S) { P.SG_ORDINE_SORELLE = S; var m = O.sorelle(); return m; }
    var m1 = gruppiDi([["PIZZA", "PIZZERIA"], ["BOSCO", "FORESTA", "SELVA"]]);
    if (!(m1.PIZZA && m1.PIZZERIA && m1.PIZZA[0] === m1.PIZZERIA[0] && m1.SELVA && m1.SELVA[0] === m1.BOSCO[0] && m1.BOSCO[0] !== m1.PIZZA[0])) no("coppie e gruppi letti male: " + JSON.stringify(m1));
    var m2 = gruppiDi(["LETTO LETTERA", "Bosco|foresta", "caffè, caffettiera"]);
    if (!(m2.LETTO && m2.LETTERA && m2.LETTO[0] === m2.LETTERA[0] && m2.BOSCO && m2.FORESTA && m2.CAFFE && m2.CAFFETTIERA)) no("righe lette male: " + JSON.stringify(m2));
    var m3 = gruppiDi({ PIZZA: ["PIZZERIA"], CORNO: "CORNETTO" });
    if (!(m3.PIZZERIA && m3.CORNETTO && m3.CORNO)) no("oggetto letto male: " + JSON.stringify(m3));
    var m4 = gruppiDi(undefined); if (Object.keys(m4).length) no("senza sorelle dovrebbe essere vuoto");
    gruppiDi(42); gruppiDi("PIZZA"); gruppiDi([null, ["X"]]);   // (scritte strane: niente errori)
    P.SG_ORDINE_SORELLE = salva;
    nota(N, "sorelle lette da coppie, gruppi, righe e oggetto; senza, niente");
    // una partita vera con 60 parole in 30 coppie sorelle: mai due della stessa coppia sul tabellone.
    // Memoria: 10 parole uscite 20 giorni fa non tornano; 10 uscite 31 giorni fa sì (e spariscono dalla memoria)
    var C = await W.apriStanza(P, "Parola d'ordine");
    var amici = ["Giulia", "Luca", "Sara"];
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { hash: "gioco=ordine&stanza=" + C, x: 185 * (i + 1) });
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 4; }, 8000)) no("non entrano in 4");
    var base = (P.SG_ORDINE_PAROLE || []).slice(), radici = {}, scelte = [];
    base.forEach(function (w) { var r = O.radice(w); if (scelte.length < 60 && !radici[r] && /^[A-Z]{4,9}$/.test(w)) { radici[r] = 1; scelte.push(w); } });
    if (scelte.length < 60) no("non trovo 60 parole diverse nel Classico");
    var coppie = []; for (var j = 0; j < 30; j++) coppie.push([scelte[2 * j], scelte[2 * j + 1]]);
    P.SG_ORDINE_PAROLE = scelte.slice();
    P.SG_ORDINE_SORELLE = coppie;
    var ora = Date.now(), G = 24 * 3600 * 1000, u = {}, vecchie20 = [], vecchie31 = [];
    for (j = 0; j < 10; j++) { vecchie20.push(coppie[j][0]); u[coppie[j][0]] = ora - 20 * G; }
    for (j = 10; j < 20; j++) { vecchie31.push(coppie[j][0]); u[coppie[j][0]] = ora - 31 * G; }
    P.localStorage.setItem("sg-ordine-uscite", JSON.stringify(u));
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).tab; }, 10000)) no("non comincia");
    var parole = vm(C).tab.map(function (c) { return c.w; });
    if (parole.length !== 25) no("il tabellone ha " + parole.length + " parole");
    var fuori = parole.filter(function (w) { return scelte.indexOf(w) < 0; }); if (fuori.length) no("parole non della lista: " + fuori.join(", "));
    var insieme = coppie.filter(function (c) { return parole.indexOf(c[0]) >= 0 && parole.indexOf(c[1]) >= 0; });
    if (insieme.length) no("due sorelle nello stesso tabellone: " + insieme.map(function (c) { return c.join("+"); }).join(", "));
    var tornate20 = vecchie20.filter(function (w) { return parole.indexOf(w) >= 0; });
    if (tornate20.length) no("parole uscite 20 giorni fa di nuovo sul tabellone: " + tornate20.join(", "));
    var mem = JSON.parse(P.localStorage.getItem("sg-ordine-uscite") || "{}");
    var perse = vecchie20.filter(function (w) { return !mem[w]; }); if (perse.length) no("dopo 20 giorni la memoria ha scordato " + perse.join(", "));
    var restano31 = vecchie31.filter(function (w) { return mem[w] && mem[w] < ora - 30 * G; }); if (restano31.length) no("le parole di 31 giorni fa restano in memoria: " + restano31.join(", "));
    var nuoveMem = parole.filter(function (w) { return !(mem[w] >= ora - 60000); }); if (nuoveMem.length) no("le parole di questo tabellone non sono in memoria: " + nuoveMem.join(", "));
    var tornate31 = vecchie31.filter(function (w) { return parole.indexOf(w) >= 0; }).length;
    nota(N, "60 parole in 30 coppie: tabellone di 25 senza sorelle insieme; uscite 20 giorni fa: nessuna torna; 31 giorni fa: dimenticate (" + tornate31 + " di nuovo sul tabellone)");
    // un mazzo vecchio nella partita ripresa: la ricarica dell'host con «mazzo: napoli» nella memoria → Classico, senza errori
    var rp = JSON.parse(P.localStorage.getItem("sg-ripresa") || "null");
    if (rp && rp.stato) {
      rp.stato.mazzo = "napoli"; P.localStorage.setItem("sg-ripresa", JSON.stringify(rp));
      await W.ricarica("Paky");
      if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._r && (s.vm || s).pronta && (s.vm || s).fase === "gioco"; }, 10000)) no("la partita non riprende");
      if (vm(C).mazzo !== "classico") no("ripresa con un mazzo vecchio: nella foto «" + vm(C).mazzo + "»");
      nota(N, "ripresa con «mazzo: napoli» → Classico");
    } else nota(N, "(niente sg-ripresa da ritoccare: salto la ripresa)");
    senzaErrori();
    return N.join(" · ");
  } });

  // ---------------- o2s6 ----------------
  // gli indizi aperti quando la squadra recupera una parola vecchia col tentativo in più (revisione del 21 ott 2026)
  function apertiDi(nome) { var w = W.finestra(nome), x = w && w.document.querySelector(".or-aperti"); return x ? x.textContent : ""; }
  COPIONE.aggiungi("o2s6", { nome: "Parola d'ordine: indizi aperti, la parola vecchia recuperata col tentativo in più chiude l'indizio vecchio", fai: async function () {
    var N = [], amici = ["Giulia", "Luca", "Sara", "Marco"];
    W.__nomiO2 = ["Paky"].concat(amici);
    var X = await partita(amici, { Luca: 0, Sara: 0, Giulia: 1, Marco: 1 }, ["Luca", "Giulia"]), C = X.C, chiave = chiaveDa(W.finestra("Luca")), usati = [];
    async function bluSbaglia() {
      await indizio(C, "Giulia", 1, usati);
      await sbaglia(C, chiave, "Marco", 1);
      if (!await W.aspetta(function () { return vm(C).turno === 0 && vm(C).passo === "indizio"; }, 8000)) no("non tocca ai Rossi");
    }
    async function giraRossa() {
      var i = coperteDi(C, chiave, 0)[0];
      W.reteDi("Sara").invia({ t: "gira", i: i });
      if (!await W.aspetta(function () { return vm(C).tab[i].g && !vm(C).sospeso; }, 7000)) no("Sara non gira " + vm(C).tab[i].w);
    }
    if (vm(C).turno === 1) await bluSbaglia();
    // A 2: una trovata, poi «passo»
    var A = await indizio(C, "Luca", 2, usati);
    await giraRossa();
    W.reteDi("Sara").invia({ t: "passo" });
    if (!await W.aspetta(function () { return vm(C).turno === 1 && vm(C).passo === "indizio"; }, 5000)) no("non passa al Blu");
    await bluSbaglia();
    // B 1: sotto l'indizio «A 2 · 1 trovata»; una parola (per B), poi il tentativo in più recupera l'altra di A
    var B = await indizio(C, "Luca", 1, usati), riga = "🔴 " + A + " 2 · 1 trovata";
    if (!await W.aspetta(function () { return W.__nomiO2.every(function (n) { return apertiDi(n).indexOf(riga) >= 0; }); }, 4000)) no("con l'indizio " + B + " sotto si legge «" + apertiDi("Paky") + "» invece di «" + riga + "»");
    await giraRossa();
    if (!await W.aspetta(function () { return apertiDi("Paky").indexOf(riga) >= 0; }, 3000)) no("trovata la parola di " + B + ", l'indizio " + A + " è cambiato: «" + apertiDi("Paky") + "»");
    await giraRossa();   // (il tentativo in più: per noi recupera la seconda di A; finiti i tentativi il turno passa)
    if (!await W.aspetta(function () { return vm(C).turno === 1; }, 5000)) no("finiti i tentativi il turno non passa");
    await bluSbaglia();
    // C 1: l'indizio A è chiuso (2 su 2), B anche: sotto l'indizio niente
    var C3 = await indizio(C, "Luca", 1, usati);
    await W.dorme(600);
    W.__nomiO2.forEach(function (n) { var a = apertiDi(n); if (a.indexOf(A + " ") >= 0 || a.indexOf(B + " ") >= 0) no(n + ": con l'indizio " + C3 + " sotto si legge ancora «" + a + "»"); });
    nota(N, "«" + riga + "» con " + B + "; trovata quella di " + B + " e col tentativo in più l'altra: con " + C3 + " niente più indizi aperti");
    senzaErrori();
    return N.join(" · ");
  } });

  // ---------------- o2s5 ----------------
  // le misure di un telefono a una grandezza: "" = tutto a posto, se no cosa non va
  async function misuraTel(nome, L, H, cose) {
    var w = W.finestra(nome), f = document.getElementById("tel-" + nome), d = w.document, out = [];
    var st = d.createElement("style"); st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"; d.head.appendChild(st);
    try {
      f.style.width = L + "px"; f.style.height = H + "px"; void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
      await W.dorme(700);
      if (!await W.aspetta(function () { return calmo(w); }, 12000)) {
        var ui = w.__ORDINE.ui;
        return "lo schermo non si ferma sul tabellone (scena " + !!ui.inScena + ", coda " + (ui.coda || []).length + ", camera " + (ui.S.shot ? JSON.stringify(ui.S.shot()) : "?") + " / " + JSON.stringify(ui.S.R && ui.S.R.schermo) + ")";
      }
      if (d.documentElement.scrollHeight > H + 1) out.push("la pagina scorre (" + d.documentElement.scrollHeight + ")");
      if (d.documentElement.scrollWidth > L + 1) out.push("scorre di lato");
      var sel = ".or-tab .or-carta, .or-gira, .or-passo, .or-ruolo, .or-aperti, .or-ind, .or-sotto .or-stato";
      [].forEach.call(d.querySelectorAll(sel), function (b) {
        if (!b.getClientRects().length || !b.offsetWidth) return;
        var r = b.getBoundingClientRect();
        if (r.bottom > H + 1 || r.right > L + 1 || r.left < -1 || r.top < -1) out.push("«" + (b.className.split(" ")[0]) + " " + b.textContent.trim().slice(0, 24) + "» esce dallo schermo");
      });
      var ru = d.querySelector(".or-ruolo"), es = d.querySelector(".st-esci"), mu = d.querySelector(".st-musica");
      if (ru && ru.textContent) {
        var rr = ru.getBoundingClientRect();
        [es, mu].forEach(function (x) { if (!x) return; var xr = x.getBoundingClientRect(); if (rr.left < xr.right && xr.left < rr.right && rr.top < xr.bottom && xr.top < rr.bottom) out.push("il ruolo tocca «" + x.textContent + "»"); });
        if (ru.scrollWidth > ru.clientWidth + 1) out.push("il ruolo non ci sta («" + ru.textContent + "»)");
      }
      var g = d.querySelector(".or-gira .tx"); if (g && g.scrollWidth > g.clientWidth + 1) out.push("«" + g.textContent + "» non ci sta nel tasto");
      var p = d.querySelector(".or-passo"); if (p && p.scrollHeight > p.clientHeight + 2) out.push("«" + p.textContent + "» non ci sta");
      (cose || []).forEach(function (i) {
        var parola = (carta(w, i).querySelector(".or-w") || {}).textContent || "";
        var e = parola.length <= 8 ? copre(w, i) : ""; if (e) out.push(e);
        var e2 = facce(w, i).length ? sulBordo(w, i) : ""; if (e2) out.push(e2);
      });
    } finally { if (st.parentNode) st.parentNode.removeChild(st); }
    return out.join("; ");
  }
  COPIONE.aggiungi("o2s5", { nome: "Parola d'ordine: misure a 360x640 e 412x915 (segni, «👆 Gira», ruolo, indizi aperti)", fai: async function () {
    var N = [], amici = ["Giulia", "Luca", "Sara", "Marco", "Anna"];
    W.__nomiO2 = ["Paky"].concat(amici);
    var X = await partita(amici, { Luca: 0, Sara: 0, Giulia: 1, Marco: 1, Anna: 1 }, ["Luca", "Giulia"]), C = X.C, chiave = chiaveDa(W.finestra("Luca"));
    if (vm(C).turno === 1) {   // (se comincia il Blu: Marco sbaglia apposta)
      await indizio(C, "Giulia", 1);
      await sbaglia(C, chiave, "Marco", 1);
      if (!await W.aspetta(function () { return vm(C).turno === 0 && vm(C).passo === "indizio"; }, 8000)) no("non tocca ai Rossi");
    }
    // primo indizio dei Rossi: una trovata, poi si passa; il Blu sbaglia; secondo indizio dei Rossi → la riga degli indizi aperti
    var p1 = await indizio(C, "Luca", 3), mie = coperteDi(C, chiave, 0);
    W.reteDi("Sara").invia({ t: "gira", i: mie[0] });
    if (!await W.aspetta(function () { return vm(C).tab[mie[0]].g && !vm(C).sospeso; }, 7000)) no("non si gira la prima parola");
    W.reteDi("Sara").invia({ t: "passo" });
    if (!await W.aspetta(function () { return vm(C).turno === 1 && vm(C).passo === "indizio"; }, 5000)) no("non passa al Blu");
    await indizio(C, "Giulia", 1);
    await sbaglia(C, chiave, "Marco", 1);
    if (!await W.aspetta(function () { return vm(C).turno === 0 && vm(C).passo === "indizio"; }, 8000)) no("non tornano i Rossi");
    await indizio(C, "Luca", 2, [p1]);
    // due segni sulla stessa parola (Sara e Paky) e i segni di Paky su altre due
    mie = coperteDi(C, chiave, 0);
    var wP = W.finestra("Paky");
    W.reteDi("Sara").invia({ t: "proponi", i: mie[0] });
    carta(wP, mie[0]).click(); await W.dorme(120); carta(wP, mie[1]).click(); await W.dorme(120); carta(wP, mie[2]).click();
    if (!await W.aspetta(function () { return facce(wP, mie[0]).length === 2 && wP.document.querySelector(".or-aperti"); }, 4000)) no("niente due faccine o riga degli indizi aperti da Paky");
    var M = [[360, 640], [412, 915]], fatte = [];
    for (var k = 0; k < M.length; k++) {
      var eP = await misuraTel("Paky", M[k][0], M[k][1], mie.slice(0, 3)); if (eP) no("Paky (indovina) a " + M[k].join("x") + ": " + eP);
      var eL = await misuraTel("Luca", M[k][0], M[k][1], mie.slice(0, 3)); if (eL) no("Luca (capo) a " + M[k].join("x") + ": " + eL);
      var eG = await misuraTel("Giulia", M[k][0], M[k][1], []); if (eG) no("Giulia (l'altra squadra) a " + M[k].join("x") + ": " + eG);
      fatte.push(M[k].join("x"));
    }
    ["Paky", "Luca", "Giulia"].forEach(function (n) { var f = document.getElementById("tel-" + n); f.style.width = "360px"; f.style.height = "740px"; W.finestra(n).dispatchEvent(new (W.finestra(n).Event)("resize")); });
    nota(N, "Paky (3 segni, «" + gira(wP).tx + "», «" + wP.document.querySelector(".or-aperti").textContent + "»), Luca capo e Giulia: tutto dentro a " + fatte.join(" e "));
    senzaErrori();
    return N.join(" · ");
  } });
})();
