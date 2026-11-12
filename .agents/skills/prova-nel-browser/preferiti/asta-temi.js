// =========================================================================================================================
// L'Asta, i temi nuovi (4 nov 2026: 📺 Il Reality Show, ⏳ Il Viaggio nel Tempo). Si carica dopo preferiti/asta.js (la spia pa).
// tn0 I dati di tutti i temi: 4 round con le fasce A/B/C piene, emoji, niente doppioni nello stesso tema, 3 scenari corti.
// tn1 Stesso telefono in 3 con ognuno dei temi nuovi (round «Tutti diversi»): le carte che escono sono del tema, si vota,
//     si arriva alle fasce svelate.
// tn2 Da solo come IL PAPPONE con ognuno dei temi nuovi, fino alla fine.
// Uso: await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-temi.js"); await COPIONE.prova("tn1")
// =========================================================================================================================
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  var NUOVI = ["reality", "tempo"];
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function prezzo(w) { var b = q(w, ".sa-prezzo b, .st-prezzo b"); return b ? parseInt(b.textContent, 10) : null; }
  function capoNome(w) { var p = qa(w, ".sa-pers.guida")[0]; return p ? p.querySelector("b").textContent : null; }
  function senzaAnimazioni(w) { var st = w.document.createElement("style"); st.textContent = ".schermata,.as-mal-carta,.as-scen,.as-sorpresa,.as-buste .r{animation:none!important;opacity:1!important}"; w.document.head.appendChild(st); }
  function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, ""); }
  function nomiDi(tm) { var s = {}; tm.round.forEach(function (r) { ["A", "B", "C"].forEach(function (k) { r[k].forEach(function (c) { s[norm(c.nome)] = 1; }); }); }); return s; }
  async function temi() {
    if (!(W.SG_ASTA_TEMI || []).some(function (t) { return t.id === "reality"; })) {
      var src = (await (await fetch("/index.html?" + Date.now())).text()) + (await (await fetch("/js/elenco-giochi.js?" + Date.now())).text()), fs = src.match(/data\/asta-[a-z]+\.js/g).filter(function (f, i, l) { return !/fanta|icone/.test(f) && l.indexOf(f) === i; });   // (dal 4 nov 2026 i file dei temi stanno nell'elenco dei giochi, non in index.html)
      var salva = W.SG_ASTA_TEMI; W.SG_ASTA_TEMI = [];
      for (var i = 0; i < fs.length; i++) (0, eval)(await (await fetch("/" + fs[i] + "?" + Date.now())).text());
      var tt = W.SG_ASTA_TEMI; W.SG_ASTA_TEMI = salva; return tt;
    }
    return W.SG_ASTA_TEMI;
  }

  COPIONE.aggiungi("tn0", { nome: "Asta: i dati di tutti i temi (fasce piene, emoji, niente doppioni, scenari)", fai: async function () {
    var tt = await temi(), ids = {}, x = [];
    tt.forEach(function (tm) {
      if (ids[tm.id]) no("due temi con l'id " + tm.id); ids[tm.id] = 1;
      if (!tm.nome || !tm.icona || !tm.sottotitolo) no("il tema " + tm.id + " non ha nome, icona o sottotitolo");
      if ((tm.scenari || []).length !== 3) no("il tema " + tm.id + " ha " + (tm.scenari || []).length + " scenari");
      tm.scenari.forEach(function (c) { if (!c.emoji || !c.testo || c.testo.length > 80 || !/\?$|»$/.test(c.testo)) no("scenario strano in " + tm.id + ": " + c.testo); });
      if (tm.round.length !== 4) no("il tema " + tm.id + " ha " + tm.round.length + " round");
      var visti = {};
      tm.round.forEach(function (r) {
        if (!r.nome || !r.icona) no("round senza nome o icona in " + tm.id);
        ["A", "B", "C"].forEach(function (k) {
          if ((r[k] || []).length < 20) no(tm.id + " «" + r.nome + "» fascia " + k + ": " + (r[k] || []).length + " carte");
          r[k].forEach(function (c) {
            if (!c.nome || !c.emoji) no("carta senza nome o emoji in " + tm.id + ": " + JSON.stringify(c));
            var n = norm(c.nome); if (visti[n] && NUOVI.indexOf(tm.id) >= 0) no("doppione in " + tm.id + ": " + c.nome); visti[n] = 1;
          });
        });
      });
    });
    NUOVI.forEach(function (id) { if (!ids[id]) no("manca il tema " + id); var tm = tt.filter(function (t) { return t.id === id; })[0]; x.push(tm.icona + " " + tm.nome + " " + tm.round.map(function (r) { return r.A.length + "/" + r.B.length + "/" + r.C.length; }).join(" ")); });
    return tt.length + " temi; " + x.join(" · ");
  } });

  // una partita sullo stesso telefono fino alla fine: torna { carte: [nomi visti], voti, fasce }
  async function gioca(P, tm, nomi, soloPapp) {
    var tutte = nomiDi(tm), viste = [], estranee = [], voti = 0, fino = Date.now() + 240000;
    while (Date.now() < fino) {
      var tx = T(P);
      if (/Fasce svelate/.test(tx)) break;
      if (q(P, ".st-rivela") || (soloPapp && /Rivincita|Nuova partita/.test(tx) && !q(P, ".as-carta"))) break;
      if (/Passa il telefono a/.test(tx)) { W.clicca(P, /^Sono /); await W.dorme(120); continue; }
      if (q(P, ".schermata.as-bus")) {   // ✉️ la busta: 1 credito e chiudo
        var ok = bott(P, ".schermata .piede button", /Chiudo la busta|Non offro/); if (ok) ok.click(); await W.dorme(200); continue;
      }
      if (q(P, ".as-buste") && !P.__bv) { P.__bv = true; W.clicca(P, /Avanti/); await W.dorme(200); P.__bv = false; continue; }
      if (q(P, ".as-pas")) {   // ⭐ la passerella (11 nov 2026): i giudici danno 4 stelle, poi il prossimo kit
        qa(P, ".as-giudice").forEach(function (gd) { gd.querySelectorAll(".as-stelle button")[3].click(); });
        await W.dorme(100); var avK = qa(P, ".schermata .piede .btn").filter(function (b) { return /Prossimo kit|Classifica/.test(b.textContent) && !b.disabled; })[0];
        if (avK) { avK.click(); voti++; } await W.dorme(500); continue;
      }
      var carte = qa(P, ".as-carta:not([disabled])");
      if (carte.length) {
        carte.forEach(function (c) {
          var nm = (c.querySelector(".nm") || c).textContent.trim();
          if (/Pacco a sorpresa/.test(nm)) return;
          nm.split(" + ").forEach(function (p) { if (viste.indexOf(p) < 0) { viste.push(p); if (!tutte[norm(p)]) estranee.push(p); } });
        });
        (q(P, ".as-carta.doppio:not([disabled])") || q(P, ".as-carta.pacco:not([disabled])") || carte[0]).click(); await W.dorme(250); continue;
      }
      if (q(P, ".sa-pers") && prezzo(P) != null && !q(P, ".sa-aggiudicato")) {   // chi guida si tiene la carta, gli altri passano
        var c2 = capoNome(P);
        qa(P, ".sa-pers").forEach(function (p) { var b = p.querySelector("b").textContent, ps = p.querySelector(".sa-passo"); if (b !== c2 && ps && ps.style.visibility !== "hidden" && !p.classList.contains("fuori")) ps.click(); });
        await W.dorme(300); continue;
      }
      W.clicca(P, /Vedi le carte|Avanti ▶|Avanti/); await W.dorme(250);
    }
    if (estranee.length) no("nel tema " + tm.id + " escono carte di un altro tema: " + estranee.slice(0, 5).join(", "));
    var fin = T(P), nelKit = tm.round.reduce(function (a, r) { return a + ["A", "B", "C"].reduce(function (b, k) { return b + r[k].filter(function (c) { return fin.indexOf(c.nome) >= 0; }).length; }, 0); }, 0);
    return { viste: viste, voti: voti, testo: fin, nelKit: nelKit };
  }
  async function apri(nome, imp, nomi) {
    var P = await W.apriTel(nome, { x: 0, pa: true, prima: function (w) { w.__imp = imp; } });
    senzaAnimazioni(P);
    var tess = await W.aspetta(function () { return A.tessera(P, "L'Asta"); }, 6000); if (!tess) no("non trovo la tessera dell'Asta");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
    await W.aspetta(function () { return q(P, ".sala-riga input"); }, 3000);
    if (nomi.length === 1) { while (qa(P, ".sala-riga input").length > 1) { var tg = bott(P, ".sala-riga button", /✕|Togli|−/); if (!tg) break; tg.click(); await W.dorme(60); } }
    while (qa(P, ".sala-riga input").length < nomi.length) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    qa(P, ".sala-riga input").forEach(function (c, k) { c.value = nomi[k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    for (var k = 0; k < 10 && !P.__t; k++) {
      await W.dorme(300); if (P.__t) break;
      var b = qa(P, ".schermata .piede button").filter(function (x) { return /Avanti|Comincia|Gioca|Inizia|Via|▶/.test(x.textContent) && !x.disabled; })[0];
      if (b) b.click();
    }
    if (!await W.aspetta(function () { return P.__t; }, 3000)) no("l'Asta non parte («" + T(P).slice(0, 70) + "»)");
    return P;
  }

  COPIONE.aggiungi("tn1", { nome: "Asta stesso telefono in 3 coi temi nuovi (round tutti diversi): carte del tema, voto, fasce svelate", fai: async function () {
    var tt = await temi(), out = [];
    for (var i = 0; i < NUOVI.length; i++) {
      var tm = tt.filter(function (t) { return t.id === NUOVI[i]; })[0];
      var P = await apri("Paky", { formato: "temi", tema: tm.id, crediti: 15, round: "misti", maledetta: false }, ["Paky", "Giulia", "Luca"]);
      if (!new RegExp(tm.round[0].nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(T(P) + (P.__t ? "" : ""))) {
        await W.aspetta(function () { return T(P).indexOf(tm.round[0].nome) >= 0 || q(P, ".as-carta"); }, 4000);
      }
      var r = await gioca(P, tm, ["Paky", "Giulia", "Luca"]);
      if (!/Fasce svelate/.test(r.testo)) no(tm.id + ": la partita non arriva alle fasce svelate («" + r.testo.slice(0, 120) + "»)");
      if (r.voti !== 3) no(tm.id + ": voti dati " + r.voti);
      if (r.viste.length < 12) no(tm.id + ": carte viste " + r.viste.length);
      if (r.nelKit < 12) no(tm.id + ": carte del tema alla fine " + r.nelKit);
      out.push(tm.icona + " " + r.viste.length + " carte viste, " + r.nelKit + " nei kit, " + r.voti + " voti");
      W.chiudiTel && W.chiudiTel("Paky"); await W.dorme(300);
    }
    return out.join(" · ");
  } });

  COPIONE.aggiungi("tn2", { nome: "Asta da solo (IL PAPPONE) coi temi nuovi, fino alla fine", fai: async function () {
    var tt = await temi(), out = [];
    for (var i = 0; i < NUOVI.length; i++) {
      var tm = tt.filter(function (t) { return t.id === NUOVI[i]; })[0];
      var P = await apri("IL PAPPONE", { formato: "temi", tema: tm.id, crediti: 15, round: "misti", maledetta: false }, ["IL PAPPONE"]);
      var r = await gioca(P, tm, ["IL PAPPONE"], true);
      if (r.nelKit < 4) no(tm.id + " da solo: carte del tema alla fine " + r.nelKit + " («" + r.testo.slice(0, 120) + "»)");
      if (!/Fasce svelate|Rivincita|Nuova partita/.test(r.testo)) no(tm.id + " da solo: non arriva alla fine («" + r.testo.slice(0, 160) + "»)");
      out.push(tm.icona + " da solo: " + r.nelKit + " carte del tema nel kit, fine «" + (/Fasce svelate/.test(r.testo) ? "Fasce svelate" : "tasti di fine") + "»");
      W.chiudiTel && W.chiudiTel("IL PAPPONE"); await W.dorme(300);
    }
    return out.join(" · ");
  } });
})();
