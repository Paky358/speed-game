// CALCIO BILIARDO A SQUADRE (26 nov 2026): 1 contro 1, 2 contro 1, 2 contro 2, persone e Bot come si vuole, il ⚡ passaggio.
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("calcio/squadre.js"); await COPIONE.prova("cq1")
//   Edge invisibile: prova.js --porta 8981 --carica calcio/squadre.js --prova cq1,cq2,cq3,cq4,cq5 --rifai
// cq1 Stesso telefono: Paky e Giulia contro due Bot (Giulia passa ai Lampone con la freccia, «＋ 🤖 Bot» due volte nei Ciano):
//     6 pedine a squadra, chi tira va a giro (Paky, Bot, Giulia, Bot…), il passaggio rifà tirare lo stesso; i Bot tirano da soli.
// cq2 Online in 3: Paky apre, entrano Giulia (Ciano) e Luca (Lampone); Luca passa ai Ciano con la sua freccia; l'host mette un
//     Bot nei Lampone; 2 contro 2 con un Bot: su ogni telefono «puoi tirare» solo quando tocca a lui; partita fino a 1 gol;
//     fine uguale su tutti.
// cq3 Online in 4 + uno in più che guarda: 2 contro 2 di sole persone; a metà Marco esce (i suoi tiri li fa il Bot), poi esce
//     anche Giulia: i Ciano non hanno più persone e vincono i Lampone a tavolino.
// cq4 La Sala in 3: dal gioco «Calcio Biliardo in 3» la prima scelta è «👥 A squadre: giocate tutti»; nella saletta siedono tutti e
//     tre (2 contro 1).
// cq5 Le misure: la saletta in 4 su 360x640 e 412x915 (niente scorre) e il campo a squadre (le targhette con i due nomi).
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, vm = A.vm, no = A.no;
  // (un errore del codice della prova, non un NO: si scrive anche dove è successo)
  var aggiungi = function (n, o) {
    var fai = o.fai;
    o.fai = async function () { try { return await fai.apply(this, arguments); } catch (e) { if (e && e.stack && !/^NO|NO:/.test(String(e.message))) e.message += " ⟪" + String(e.stack).split("\n").slice(1, 3).join(" ← ").replace(/\s+/g, " ") + "⟫"; throw e; } };
    return COPIONE.aggiungi(n, o);
  };
  // ---- i telefoni con le regole corte (solo per le prove): a 1 gol ----
  if (!W.__prepCq) {
    W.__prepCq = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepCq(w, nome, opz);
      if (!opz || !opz.cqimp) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && g.id === "calciobiliardo") {
            var av = g.avvia;
            g.avvia = function (t) { if (t.impostazioni) { t.impostazioni.gol = opz.cqimp.gol || 1; t.impostazioni.vince = "gol"; } return av.apply(this, arguments); };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }
  function tel(nome, o) { return W.apriTel(nome, Object.assign({ cqimp: { gol: 1 } }, o || {})); }
  function errori(w) { return (w.__err || []).filter(function (e) { return !/404|carte\/giochi/.test(e); }); }
  // la scelta delle squadre (online in saletta, sullo stesso telefono nelle impostazioni): i nomi per colonna
  function colonne(w) {
    return [].map.call(w.document.querySelectorAll(".cb-sq-col"), function (c) {
      return [].map.call(c.querySelectorAll(".cb-sq-p:not(.vuoto) .cb-sq-n"), function (n) { return n.textContent.replace(/^🤖 /, "").replace(/ \(tu\)$/, ""); });
    });
  }
  function rigaDi(w, nome) { return [].find.call(w.document.querySelectorAll(".cb-sq-p"), function (r) { var n = r.querySelector(".cb-sq-n"); return n && n.textContent.replace(/^🤖 /, "").replace(/ \(tu\)$/, "") === nome; }) || null; }
  function tastoBot(w, q) { var c = w.document.querySelectorAll(".cb-sq-col")[q]; return c ? c.querySelector(".cb-sq-p.vuoto.bot") : null; }
  // un tiro "da Bot" per chi tocca, fatto dal suo telefono (cb.onTiro: lo stesso del dito)
  function tiroDa(w, s, q, solo) {
    var CB = w.__CB, z = s.x.map(function () { return 0; }), sc = CB.sceltaBot({ x: s.x.slice(), y: s.y.slice(), vx: z.slice(), vy: z.slice() }, q, "medio", solo || null);
    return { i: sc.i, vx: Math.cos(sc.a) * CB.VMAX * sc.p, vy: Math.sin(sc.a) * CB.VMAX * sc.p };
  }
  // chi tira adesso dalla foto
  function oraTira(v) { var l = (v.sq || [[], []])[v.turno] || [], n = (v.nm && v.nm[v.turno]) || l.length || 1; return l[((v.chi && v.chi[v.turno]) || 0) % n] || null; }

  // ---------- cq1: stesso telefono, 2 persone contro 2 Bot ----------
  aggiungi("cq1", { nome: "Calcio a squadre sullo stesso telefono: Paky e Giulia contro due Bot", fai: async function () {
    var P = await tel("Paky", { x: 0 });
    var tess = await W.aspetta(function () { return A.tessera(P, "Calcio Biliardo"); }, 6000); if (!tess) no("non trovo la tessera");
    tess.click(); await W.dorme(400);
    var bm = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".modo-grande"), function (b) { return /Su questo telefono/.test(b.textContent); }); }, 5000);
    if (!bm) no("in «Come giocate?» non c'è «Su questo telefono» («" + T(P).slice(0, 80) + "»)");
    bm.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 4000)) no("niente lista dei nomi");
    while (P.document.querySelectorAll(".sala-riga input").length < 2) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = ["Paky", "Giulia"][k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    for (var k = 0; k < 4 && !P.document.querySelector(".cb-sq"); k++) {
      var b = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|▶/.test(x.textContent) && !x.disabled; });
      if (b) b.click(); await W.dorme(400);
    }
    if (!P.document.querySelector(".cb-sq")) no("nelle impostazioni non c'è la scelta delle squadre («" + T(P).slice(0, 80) + "»)");
    var c0 = colonne(P); if (JSON.stringify(c0) !== JSON.stringify([["Paky"], ["Giulia"]])) no("squadre di partenza " + JSON.stringify(c0));
    rigaDi(P, "Giulia").querySelector(".cb-sq-b").click(); await W.dorme(150);   // Giulia passa ai Lampone
    if (JSON.stringify(colonne(P)) !== JSON.stringify([["Paky", "Giulia"], []])) no("Giulia non è passata: " + JSON.stringify(colonne(P)));
    tastoBot(P, 1).click(); await W.dorme(120); tastoBot(P, 1).click(); await W.dorme(120);
    var c1 = colonne(P); if (c1[0].length !== 2 || c1[1].length !== 2) no("dopo i Bot: " + JSON.stringify(c1));
    if (!/2 contro 2/.test((P.document.querySelector(".cb-sq-ord") || {}).textContent || "")) no("non dice «2 contro 2»");
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia»");
    var M = await W.aspetta(function () { return P.__CB && P.__CB.locale && P.__CB.locale(); }, 5000);
    if (!M) no("la partita non parte");
    if (M.nm.join() !== "2,2" || M.ped !== 6 || M.s.x.length !== 13) no("partita: nm " + M.nm + " pedine " + M.ped + " corpi " + M.s.x.length);
    var giu = P.document.querySelector(".cb-targa.giu .cb-nome"); if (!giu || giu.textContent !== "Paky e Giulia") no("targhetta di sotto: «" + (giu && giu.textContent) + "»");
    // si gioca: tiro per tiro chi tira deve essere quello giusto (Paky, Bot, Giulia, Bot…; nel passaggio di nuovo lui)
    var visti = [], fino = Date.now() + 120000, ultimoN = -1, attesi = 0;
    while (Date.now() < fino && M.fase !== "fine" && visti.length < 10) {
      M = P.__CB.locale();
      if (M.stato === "mira" && M.n !== ultimoN) {
        var q = M.turno, kk = M.chi[q] % M.nm[q], pass = !!M.pass, umano = q === 0;
        visti.push((pass ? "⚡" : "") + "AB"[q] + kk);
        ultimoN = M.n;
        if (umano) {
          if (!P.__CB.ui.puoi) no("tocca a una persona ma il telefono non lascia tirare");
          var t = tiroDa(P, M.s, q, pass ? M.pass.i : null); P.__CB.ui.cb.onTiro(t.i, t.vx, t.vy);
        } else if (P.__CB.ui.puoi) no("tocca a un Bot ma il telefono lascia tirare");
        await W.aspetta(function () { var x = P.__CB.locale(); return x.n !== ultimoN || x.fase === "fine"; }, 15000);
        continue;
      }
      await W.dorme(150);
    }
    if (visti.length < 4) no("pochi tiri: " + visti.join(" "));
    // senza i passaggi l'ordine è A0 B0 A1 B1 A0 B0… (dopo un gol batte chi l'ha preso: si controlla solo il giro dentro la squadra)
    var dentro = [[], []]; visti.forEach(function (x) { if (x.charAt(0) !== "⚡") dentro["AB".indexOf(x.charAt(0))].push(+x.charAt(1)); });
    [0, 1].forEach(function (q) { dentro[q].forEach(function (v, i) { if (i && v === dentro[q][i - 1]) no("nella squadra " + q + " ha tirato due volte di fila lo stesso: " + visti.join(" ")); }); });
    var er = errori(P); if (er.length) no("errori: " + er.slice(0, 2).join(" / "));
    return "tiri: " + visti.join(" ");
  } });

  // ---------- aiuti dell'online ----------
  async function apriStanza(w) {
    var tess = await W.aspetta(function () { return /apro io/.test(T(w)) ? "via" : A.tessera(w, "Calcio Biliardo"); }, 6000);
    if (!tess) no("non trovo la tessera");
    if (tess !== "via") { tess.click(); await W.dorme(300); }
    if (!await W.aspetta(function () { return W.clicca(w, /apro io/); }, 4000)) no("non trovo «Online: apro io la stanza»");
    await W.dorme(250);
    if (!W.clicca(w, /Apri la stanza/)) no("non trovo «Apri la stanza»");
    var C = await W.aspetta(function () { var b = w.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }, 6000);
    if (!C) no("la stanza non ha il codice");
    return C;
  }
  // si gioca fino alla fine (o a `quanti` tiri): ogni persona tira dal suo telefono quando tocca a lei; i Bot li fa l'host.
  // Controlla che solo chi deve tirare possa tirare. dopoTiro(n, v) per fare qualcosa a metà (es. far uscire qualcuno)
  async function gioca(C, nomi, quanti, dopoTiro) {
    var fino = Date.now() + 150000, ultimo = -1, tiri = [];
    while (Date.now() < fino && vm(C).fase !== "fine" && tiri.length < (quanti || 99)) {
      var v = vm(C);
      if (v.fase === "gioco" && v.stato === "mira" && v.n !== ultimo && v.st) {
        var p = oraTira(v); if (!p) { await W.dorme(150); continue; }
        ultimo = v.n; tiri.push((v.pass != null ? "⚡" : "") + p.nome);
        // su ogni telefono: può tirare solo chi tocca (aspetto che la foto arrivi a tutti)
        await W.dorme(250);
        if (!W.__cqFoto) nomi.forEach(function (n) {
          var w = W.finestra(n); if (!w || !w.__CB || !w.__CB.ui) return;
          var mio = p.nome === n && !p.bot && !p.andato;
          if (!!w.__CB.ui.puoi !== mio && w.__CB.ui.fase === "mira") no(n + (mio ? " non può tirare ma tocca a lui" : " può tirare ma tocca a " + p.nome));
        });
        if (!p.bot && !p.andato) {
          var w = W.finestra(p.nome), t = tiroDa(w, { x: v.st.x, y: v.st.y }, v.turno, v.solo);
          w.__CB.ui.cb.onTiro(t.i, t.vx, t.vy);
        }
        await W.aspetta(function () { var x = vm(C); return x.n !== ultimo || x.fase === "fine"; }, 35000);
        if (dopoTiro) await dopoTiro(tiri.length, vm(C));
        continue;
      }
      await W.dorme(150);
    }
    return tiri;
  }

  // ---------- cq2: online in 3, con un Bot ----------
  aggiungi("cq2", { nome: "Calcio a squadre online in 3: Luca cambia squadra, l'host mette un Bot, 2 contro 2", fai: async function () {
    var P = await tel("Paky", { x: 0 }), C = await apriStanza(P);
    var G = await tel("Giulia", { x: 185, hash: "gioco=calciobiliardo&stanza=" + C });
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 2; }, 8000)) no("Giulia non entra");
    var L = await tel("Luca", { x: 370, hash: "gioco=calciobiliardo&stanza=" + C });
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 3; }, 8000)) no("Luca non entra");
    var sq = function () { return (vm(C).sq || []).map(function (l) { return l.map(function (p) { return p.nome; }); }); };
    if (JSON.stringify(sq()) !== JSON.stringify([["Paky", "Luca"], ["Giulia"]])) no("squadre all'arrivo: " + JSON.stringify(sq()));
    // su ogni telefono la scelta delle squadre è uguale
    await W.aspetta(function () { return colonne(L).join("|") === colonne(P).join("|") && colonne(G).join("|") === colonne(P).join("|"); }, 4000);
    if (colonne(G).join("|") !== colonne(P).join("|")) no("Giulia vede altre squadre: " + JSON.stringify(colonne(G)));
    // Giulia non ha la freccia sugli altri, né i tasti dei Bot
    var rP = rigaDi(G, "Paky"); if (rP && rP.querySelector(".cb-sq-b")) no("Giulia può spostare Paky");
    if (tastoBot(G, 0)) no("Giulia ha «＋ Bot»");
    // Luca passa ai Ciano con la sua freccia
    var rL = rigaDi(L, "Luca"); if (!rL || !rL.querySelector(".cb-sq-b")) no("Luca non ha la freccia");
    rL.querySelector(".cb-sq-b").click();
    if (!await W.aspetta(function () { return JSON.stringify(sq()) === JSON.stringify([["Paky"], ["Giulia", "Luca"]]); }, 5000)) no("Luca non è passato: " + JSON.stringify(sq()));
    // l'host mette un Bot nei Lampone
    await W.aspetta(function () { return tastoBot(P, 0); }, 3000);
    if (!tastoBot(P, 0)) no("l'host non ha «＋ 🤖 Bot»"); tastoBot(P, 0).click();
    if (!await W.aspetta(function () { return (vm(C).sq || [[]])[0].length === 2 && vm(C).sq[0][1].bot; }, 5000)) no("il Bot non c'è: " + JSON.stringify(vm(C).sq));
    if (tastoBot(P, 0) || tastoBot(P, 1)) no("con 4 posti presi c'è ancora «＋ Bot»");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 8000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 12000)) no("la partita non parte");
    var v = vm(C); if (v.st.x.length !== 13 || (v.nm || []).join() !== "2,2") no("partita: corpi " + v.st.x.length + " nm " + v.nm);
    await W.aspetta(function () { return G.document.querySelector(".cb-targa.giu .cb-nome"); }, 4000);
    var gn = G.document.querySelector(".cb-targa.giu .cb-nome"); if (!gn || gn.textContent !== "Giulia e Luca") no("Giulia, la sua targhetta: «" + (gn && gn.textContent) + "»");
    var tiri = await gioca(C, ["Paky", "Giulia", "Luca"]);
    if (vm(C).fase !== "fine") no("la partita non finisce: " + tiri.join(" "));
    await W.dorme(900);
    [P, G, L].forEach(function (w, k) { if (!/vinto/.test(T(w))) no(["Paky", "Giulia", "Luca"][k] + ": la fine non dice chi ha vinto («" + T(w).slice(0, 60) + "»)"); var e = errori(w); if (e.length) no("errori: " + e[0]); });
    return "tiri: " + tiri.join(" › ");
  } });

  // ---------- cq3: online in 4, uno guarda, due escono a metà ----------
  aggiungi("cq3", { nome: "Calcio a squadre online in 4: chi esce lascia i tiri al Bot, la squadra senza persone perde", fai: async function () {
    var P = await tel("Paky", { x: 0, cqimp: { gol: 5 } }), C = await apriStanza(P), chi = ["Giulia", "Luca", "Marco", "Bea"];   // (a 5 gol: escono prima della fine)
    for (var i = 0; i < chi.length; i++) await tel(chi[i], { x: 120 * (i + 1), hash: "gioco=calciobiliardo&stanza=" + C, cqimp: { gol: 5 } });
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 4 && (vm(C).spett || []).length === 1; }, 10000)) no("in saletta: " + (vm(C).players || []).length + " giocano, " + (vm(C).spett || []).length + " guardano");
    var sq = (vm(C).sq || []).map(function (l) { return l.map(function (p) { return p.nome; }); });
    if (JSON.stringify(sq) !== JSON.stringify([["Paky", "Luca"], ["Giulia", "Marco"]])) no("squadre: " + JSON.stringify(sq));
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 8000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 12000)) no("la partita non parte");
    var uscito = 0;
    var tiri = await gioca(C, ["Paky", "Giulia", "Luca", "Marco"], 14, async function (n, v) {
      if (v.fase !== "gioco") return;
      if (uscito === 0 && n >= 2) { uscito = 1; W.reteDi("Marco").invia({ t: "esco" }); await W.dorme(400); }
      else if (uscito === 1 && n >= 6) {
        var m = (vm(C).sq[1] || []).filter(function (p) { return p.nome === "Marco"; })[0];
        if (!m || !m.andato) no("Marco è uscito ma nella foto non è segnato");
        uscito = 2; W.reteDi("Giulia").invia({ t: "esco" });
      }
    });
    if (uscito < 2 && vm(C).fase === "fine") return "finita prima che uscissero (gol presto): " + tiri.join(" › ");
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 8000)) no("usciti tutti i Ciano ma la partita non finisce");
    var f = vm(C); if (!f.ritiro || f.vincitore !== 0) no("fine: ritiro " + f.ritiro + " vincitore " + f.vincitore);
    // i tiri di Marco dopo che è uscito li ha fatti il Bot (nessuno ha aspettato 30 s)
    return "tiri: " + tiri.join(" › ");
  } });

  // ---------- cq4: la Sala in 3 ----------
  aggiungi("cq4", { nome: "Calcio nella Sala in 3: «👥 A squadre: giocate tutti», 2 contro 1", fai: async function () {
    var R = await A.salaConAmici(["Giulia", "Luca"]), P = W.finestra("Paky");
    if (!await W.aspetta(function () { return W.clicca(P, /Scegli (un|il primo) gioco|Prossimo gioco/); }, 4000)) no("non trovo «Scegli un gioco»");
    var tess = await W.aspetta(function () { return A.tessera(P, "Calcio Biliardo"); }, 4000); if (!tess) no("Calcio Biliardo non è tra i giochi della Sala");
    tess.click();
    var carta = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".tn-scelta"), function (c) { return /A squadre/.test(c.textContent); }); }, 6000);
    if (!carta) no("in «Calcio Biliardo in 3» non c'è «A squadre» («" + T(P).slice(0, 80) + "»)");
    if (!carta.classList.contains("scelta")) no("«A squadre» non è già scelta");
    if (!/2 contro 1/.test(carta.textContent)) no("la carta non dice «2 contro 1»: " + carta.textContent);
    if (!W.clicca(P, /Si gioca a squadre/)) no("non trovo «👥 Si gioca a squadre»");
    var C = await W.aspetta(function () { var c = A.codiceSaletta(P); return P.document.querySelector(".saletta-schermo") && c && c !== R.S ? c : null; }, 8000);
    if (!C) no("non si arriva nella saletta del gioco");
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 3; }, 12000)) no("nella saletta non siedono tutti e tre: " + JSON.stringify((vm(C).players || []).map(function (p) { return p.nome; })));
    var n = (vm(C).sq || []).map(function (l) { return l.length; }).join("+"); if (n !== "2+1" && n !== "1+2") no("squadre: " + n);
    var misS = P.document.scrollingElement; if (misS && misS.scrollHeight > P.innerHeight + 2) no("la schermata scorre");
    return "squadre " + n;
  } });

  // ---------- cq5: le misure ----------
  aggiungi("cq5", { nome: "Calcio a squadre: la saletta in 4 e il campo non scorrono su 360x640 e 412x915", fai: async function () {
    var P = await tel("Paky", { x: 0 }), C = await apriStanza(P);
    var chi = ["Giulia", "Luca", "Marco"];
    for (var i = 0; i < chi.length; i++) await tel(chi[i], { x: 150 * (i + 1), hash: "gioco=calciobiliardo&stanza=" + C });
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 4; }, 10000)) no("non entrano tutti");
    var esiti = [];
    for (var m of [[360, 640], [412, 915]]) for (var n of ["Paky", "Giulia"]) {
      var r = await A.controllaSchermo(W.finestra(n), n, m[0], m[1], 4);
      if (r) no(n + " a " + m[0] + "x" + m[1] + ": " + r);
      esiti.push(n + " " + m[0] + "x" + m[1] + " ok");
    }
    return esiti.join(" · ") || "ok";
  } });

  // ---------- le scene per le foto (D:\SG-calcio-prove\lab\foto-gioco.js): ognuna torna [[telefono, file, larghezza, altezza]] ----------
  var F = { C: null };
  W.CQFOTO = {
    // ☄️ la scia: contro il Bot, l'attaccante tira forte la palla contro la sponda (tre foto mentre corre)
    scia: async function () {
      A.pulisci(); var P = await tel("Paky", { x: 0 });
      (await W.aspetta(function () { return A.tessera(P, "Calcio Biliardo"); }, 6000)).click(); await W.dorme(400);
      [].find.call(P.document.querySelectorAll(".modo-grande"), function (b) { return /Contro il Bot/.test(b.textContent); }).click();
      await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000);
      var M = await W.aspetta(function () { return P.__CB && P.__CB.locale && P.__CB.locale(); }, 5000);
      await W.dorme(800);
      var s = M.s, i = 5, dx = 0.97 - s.x[i], dy = (s.y[0] - 0.25) - s.y[i];
      // dritto sulla palla, verso l'angolo in alto a destra: sponda, poi via
      var ax = s.x[0] - s.x[i], ay = s.y[0] - s.y[i], d = Math.hypot(ax, ay) || 1;
      P.__CB.ui.cb.onTiro(i, ax / d * 2.6 + 0.4, ay / d * 2.6);
      await W.dorme(30);
      F.P = P; return [["Paky", "s1-scia.png", 360, 740]];
    },
    scia2: async function () {   // (solo per la foto: la palla lanciata contro la sponda, si guarda e basta)
      await W.dorme(2500); var P = F.P, s = P.__CB.locale().s;
      P.__CB.ui.anima({ st: { x: s.x.slice(), y: s.y.slice() }, i: 0, vx: 2.4, vy: -1.3 });
      await W.dorme(250); return [["Paky", "s2-scia.png", 360, 740]];
    },
    scia3: async function () { await W.dorme(80); return [["Paky", "s3-scia.png", 360, 740]]; },
    telefono: async function () {
      A.pulisci(); var P = await tel("Paky", { x: 0 });
      (await W.aspetta(function () { return A.tessera(P, "Calcio Biliardo"); }, 6000)).click(); await W.dorme(400);
      [].find.call(P.document.querySelectorAll(".modo-grande"), function (b) { return /Su questo telefono/.test(b.textContent); }).click();
      await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 4000);
      while (P.document.querySelectorAll(".sala-riga input").length < 3) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
      [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = ["Paky", "Giulia", "Luca"][k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
      for (var k = 0; k < 4 && !P.document.querySelector(".cb-sq"); k++) { var b = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|▶/.test(x.textContent) && !x.disabled; }); if (b) b.click(); await W.dorme(400); }
      tastoBot(P, 1).click(); await W.dorme(200);
      return [["Paky", "g1-stesso-telefono-squadre.png", 360, 740]];
    },
    saletta: async function () {
      A.pulisci(); var P = await tel("Paky", { x: 0, cqimp: { gol: 2 } }); F.C = await apriStanza(P);
      var chi = ["Giulia", "Luca", "Marco"];
      for (var i = 0; i < chi.length; i++) await tel(chi[i], { x: 400 * (i + 1), hash: "gioco=calciobiliardo&stanza=" + F.C, cqimp: { gol: 2 } });
      await W.aspetta(function () { return (vm(F.C).players || []).length === 4; }, 10000);
      await W.dorme(1500);
      return [["Paky", "g2-saletta-chi-apre.png", 360, 740], ["Giulia", "g3-saletta-amica.png", 360, 740]];
    },
    campo: async function () {
      var P = W.finestra("Paky");
      await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 8000);
      await W.aspetta(function () { return vm(F.C).fase === "gioco"; }, 12000);
      await W.dorme(2500);
      return [["Paky", "g4-campo-2-contro-2.png", 360, 740]];
    },
    tiro: async function () {
      var v = vm(F.C), p = oraTira(v); if (!p || p.bot) return "tocca a un Bot";
      var w = W.finestra(p.nome), t = tiroDa(w, { x: v.st.x, y: v.st.y }, v.turno, v.solo); w.__CB.ui.cb.onTiro(t.i, t.vx, t.vy);
      await W.aspetta(function () { return W.finestra("Paky").__CB.ui.anim; }, 4000);
      return [["Paky", "g5-tiro-col-nome.png", 360, 740]];
    },
    // (la scena del passaggio è ricostruita sul telefono di Paky: anello d'oro e scritta, come quando succede davvero)
    passaggio: async function () {
      await W.aspetta(function () { var x = vm(F.C); return x.stato === "mira"; }, 15000); await W.dorme(1200);
      var P = W.finestra("Paky"), ui = P.__CB.ui, v = vm(F.C), i = 3;
      ui.aggiorna({ st: v.st, gol: v.gol, turno: 0, fase: "mira", mie: [0], solo: i, pass: i, chi: [0, v.chi ? v.chi[1] : 0], restoTurno: 3.4, puoi: true }, { giu: "⚡ Passaggio! Tira ancora", su: "" });
      ui.festeggia({ tipo: "pass", q: 0 });
      return [["Paky", "g6-passaggio.png", 360, 740]];
    },
    fine: async function () {
      W.__cqFoto = true;   // (la scena del passaggio è finta: il telefono di Paky resta indietro di una foto)
      await gioca(F.C, ["Paky", "Giulia", "Luca", "Marco"]);
      await W.dorme(1500);
      return [["Paky", "g7-fine-chi-apre.png", 360, 740], ["Giulia", "g8-fine-amica.png", 360, 740]];
    },
    sala: async function () {
      A.pulisci(); await A.salaConAmici(["Giulia", "Luca"]); var P = W.finestra("Paky");
      await W.aspetta(function () { return W.clicca(P, /Scegli (un|il primo) gioco|Prossimo gioco/); }, 4000);
      (await W.aspetta(function () { return A.tessera(P, "Calcio Biliardo"); }, 4000)).click();
      await W.aspetta(function () { return P.document.querySelector(".tn-scelta"); }, 6000); await W.dorme(500);
      return [["Paky", "g9-sala-a-squadre.png", 360, 640]];
    }
  };
})();
