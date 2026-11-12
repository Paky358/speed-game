/* =========================================================
   PEZZO DEL CUORE — ⏳ LA SALETTA D'ATTESA ONLINE (uguale per tutti i giochi)
   t.lobby: la saletta coi personaggi che respirano, il codice, «📤 Invita gli amici», le regole in
   una riga, dove sta ognuno nella stanza; la saletta viva (chi arriva, «✋ Sono pronto!», le
   faccine, i fumetti, chi si ricollega col 📶, «Fai uscire», la porta, chi guarda soltanto),
   il 3-2-1-Via!, la fine partita uguale per tutti (t.tastiFine: Rivincita, Cambia gioco,
   «👍 Ci sto!»), i suoni e la musichetta della saletta e i 🎲 nomi buffi.
   Pezzo del cuore (js/core.js): prende gli aiuti dal cuore all'inizio («dal cuore»)
   e in fondo gli lascia quello che usano gli altri («al cuore»). Vedi AGENTS.md.
   ========================================================= */
(function () {
  "use strict";
  var cuore = window.SGCuore;
  // ---- dal cuore: gli aiuti che questo pezzo usa (non cambiano mai, si prendono una volta) ----
  var giocoOnline = cuore.giocoOnline, el = cuore.el, svuota = cuore.svuota, chiediConferma = cuore.chiediConferma, schermata = cuore.schermata,
      mostra = cuore.mostra, PILLOLE = cuore.PILLOLE, pillola = cuore.pillola, hostVia = cuore.hostVia, togliFerma = cuore.togliFerma,
      tastoInvita = cuore.tastoInvita, apriInvitaAmici = cuore.apriInvitaAmici, tornaHome = cuore.tornaHome, profiloAttivo = cuore.profiloAttivo,
      schermataSala = cuore.schermataSala, schermataPreGioco = cuore.schermataPreGioco, GIOCHI_ELIMINAZIONE = cuore.GIOCHI_ELIMINAZIONE,
      giocoDa = cuore.giocoDa, modiDi = cuore.modiDi, schermataModo = cuore.schermataModo, stessoNome = cuore.stessoNome,
      mioUidOnline = cuore.mioUidOnline, riempiRigaRec = cuore.riempiRigaRec, lasciaPartita = cuore.lasciaPartita, avviaPartita = cuore.avviaPartita,
      audioCtx = cuore.audioCtx;

  // =========================================================
  //  SALETTA D'ATTESA ONLINE — uguale per tutti i giochi (t.lobby).
  //  Chi è entrato aspetta coi personaggi in una saletta: respirano, sbattono le palpebre,
  //  ogni tanto salutano o saltano; chi arriva entra con un saltello, "pling" e il fumetto "Ciao Luca! 👋".
  //  È viva (vedi SALETTA VIVA più sotto): "✋ Sono pronto!", le faccine, chi si ricollega in grigio con 📶,
  //  "Fai uscire" e "🔒 Chiudi la porta" per l'host, il 3-2-1-Via! su tutti i telefoni, la musichetta.
  //  Chi ospita vede in alto codice e "📤 Invita gli amici" (manda il link), in fondo "Comincia".
  //  Sta tutta in uno schermo (anche 360x640): la stanza prende lo spazio che resta.
  //  o: { host, codice, pronta (false = sto aprendo), giocatori: [{ id, nome, omino, bot, host, tu }],
  //       min, vuoti (posti liberi da mostrare), onComincia, onEsci, attesa (testo per chi aspetta),
  //       extra: [nodi del gioco, es. scelta dei posti], nota, testoComincia, confermaEsci (la domanda all'host che esce),
  //       spettatore (chi entra ma guarda soltanto, es. partita piena: true = "👀 Guardi questa partita", oppure il testo da scrivere),
  //       _rete (il collegamento della stanza: lo mette il core) }
  //  Si aggiorna al suo posto (niente lampeggio): i personaggi già dentro restano, i nuovi entrano.
  // =========================================================
  var SL = { ultimo: null, timer: null };
  function chiavePers(p, i) { return String(p.id != null ? p.id : (p.nome || i)); }
  function condividiLink(link, g, bottone) {
    var fatto = function () { if (!bottone) return; var t0 = bottone.innerHTML; bottone.innerHTML = "✅ Link copiato!"; setTimeout(function () { bottone.innerHTML = t0; }, 1800); };
    var invito = g.id === "__sala" ? (g.nome === "Torneo" ? "Vieni al torneo!" : "Vieni a giocare con noi!") : "Giochiamo a " + g.nome + "!";
    // il codice nel messaggio: chi ha già l'app la apre e lo scrive in "🔑 Ho un codice" (il link a volte si apre nel browser, non nell'app)
    var m = /(?:stanza|sala|gruppo)=([A-Za-z0-9]+)/.exec(link || ""), codice = m ? m[1].toUpperCase() : "";
    var diSala = /[#&?]sala=/.test(link || "") && g.nome !== "Torneo" && cuore.salaSempre();
    // la Compagnia: il link fisso, da fissare nel gruppo (vale sempre)
    if (codice && /[#&?]gruppo=/.test(link || "") && window.SGCompagnia) invito += " " + SGCompagnia.messaggio(codice) + "\nSe no, entra da qui:";
    // la Sala della serata: un codice solo, che vale per tutti i giochi
    else if (codice && diSala) invito += " Stasera siamo nella Sala " + codice + ".\nHai l'app? Tocca «🔑 Ho un codice» e scrivi: " + codice + "\nSe no, entra da qui:";
    else if (codice) invito += "\nHai l'app? Aprila, tocca «🔑 Ho un codice» e scrivi: " + codice + "\nSe no, entra da qui:";
    else invito += " Entra qui:";
    if (navigator.share) { navigator.share({ title: g.nome, text: invito, url: link }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(invito + "\n" + link).then(fatto, fatto); } catch (e) { fatto(); }
  }
  // le impostazioni hanno qualcosa da scegliere (a vista) anche online? Se no, niente tasto "Regole"
  function haRegole(box) {
    if (!box) return false;
    return [].some.call(box.querySelectorAll(".modo-chip, .cat-chip, input, select, [data-regola]"), function (c) {
      for (var n = c; n && n !== box; n = n.parentNode) if (n.hidden) return false;
      return true;
    });
  }
  // ---- le regole in una riga, per gli amici in saletta: "5 carte · Storia, Cinema" (massimo 90 caratteri) ----
  //  il gioco può scriverla lui (g.riassunto(imp), facoltativo); se no si legge dal box le scelte accese:
  //  .modo-chip.attiva (il .mt), .cat-chip.attiva (i nomi), i contatori (.stepper .valore), select (l'opzione scelta),
  //  checkbox [data-regola] spuntati. Si saltano i pezzi nascosti. Un numero da solo prende il nome dall'etichetta ("5 carte")
  function riassuntoRegole(box, g, imp) {
    var tx = "";
    if (g && typeof g.riassunto === "function") { try { tx = String(g.riassunto(imp || {}) || ""); } catch (e) { tx = ""; } }
    if (!tx && box) {
      var pezzi = [], gruppi = [];
      var pulito = function (s) { return String(s || "").replace(/\s+/g, " ").trim(); };
      var nascosto = function (n) { for (; n && n !== box; n = n.parentNode) if (n.hidden) return true; return false; };
      // l'etichetta del gruppo: la prima .etichetta prima di lui (salendo fino al box)
      var etichettaDi = function (n) {
        for (; n && n !== box; n = n.parentNode)
          for (var p = n.previousElementSibling; p; p = p.previousElementSibling)
            if (p.classList && p.classList.contains("etichetta")) return pulito(p.textContent);
        return "";
      };
      // "5" + "Carte da piazzare a testa" → "5 carte"; "3" + "Il livello" → "Livello: 3"
      //  (una sola cosa: "Giri: 1"); "Sì" e "No" prendono l'etichetta ("Parola d'oro", "Tempo per l'indizio: no"); "Medio" dei bot → "Bot medio"
      var conNome = function (v, n) {
        var et = etichettaDi(n).replace(/^[^A-Za-zÀ-ÿ]+/, "").replace(/[\s?:]+$/, "");
        if (et && /^s[iì]$/i.test(v)) return et;
        if (et && /^(no|senza)$/i.test(v)) return et + ": no";
        if (/\bbot\b/i.test(et) && /^(facil|medi|difficil)/i.test(v)) return "Bot " + v.toLowerCase();
        if (!/^\d+$/.test(v)) return v;
        var w = et.replace(/^(quant[aeio]|il|lo|la|l'|i|gli|le)\s+/i, "").split(/[\s,:(]+/)[0] || "";
        if (!w) return v;
        return /[ie]$/i.test(w) && v !== "1" ? v + " " + w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() + ": " + v;
      };
      var testoChip = function (c) {
        var mt = c.querySelector(".mt"); if (mt) return pulito(mt.textContent);
        var cp = c.cloneNode(true);
        [].forEach.call(cp.querySelectorAll(".ms, .mi, .ci, .spunta"), function (x) { x.parentNode.removeChild(x); });
        return pulito(cp.textContent);
      };
      [].forEach.call(box.querySelectorAll(".modo-chip.attiva, .cat-chip, .stepper .valore, select, input[type=checkbox][data-regola]"), function (n) {
        if (nascosto(n)) return;
        if (n.classList.contains("cat-chip")) {
          var gr = n.parentNode; if (gruppi.indexOf(gr) >= 0) return;
          gruppi.push(gr);
          var tutte = [].filter.call(gr.children, function (c) { return c.classList && c.classList.contains("cat-chip") && !c.hidden; });
          var accese = tutte.filter(function (c) { return c.classList.contains("attiva"); }).map(testoChip).filter(Boolean);
          if (!accese.length) return;
          if (accese.length === tutte.length && tutte.length > 3) {
            // "Categorie in gioco" → "Tutte le categorie" ("Temi" → "Tutti i temi")
            var w0 = (etichettaDi(gr).replace(/^[^A-Za-zÀ-ÿ]+/, "").split(/[\s,:(]+/)[0] || "").toLowerCase();
            pezzi.push(/e$/.test(w0) ? "Tutte le " + w0 : (/i$/.test(w0) ? "Tutti " + (/^([aeiouàèéìòù]|s[^aeiou]|z|gn|ps)/.test(w0) ? "gli " : "i ") + w0 : "Tutte"));
          }
          else pezzi.push(accese.length > 3 ? accese.slice(0, 3).join(", ") + " +" + (accese.length - 3) : accese.join(", "));
        } else if (n.classList.contains("modo-chip")) pezzi.push(conNome(testoChip(n), n));
        else if (n.classList.contains("valore")) pezzi.push(conNome(pulito(n.textContent), n.parentNode));
        else if (n.tagName === "SELECT") { var o = n.options[n.selectedIndex]; if (o) pezzi.push(conNome(pulito(o.textContent), n)); }
        else if (n.checked) pezzi.push(pulito(n.getAttribute("data-regola")));
      });
      tx = pezzi.filter(Boolean).join(" · ");
    }
    tx = String(tx).replace(/\s+/g, " ").trim();
    return tx.length > 90 ? tx.slice(0, 89).replace(/[\s·,]+$/, "") + "…" : tx;
  }
  function firmaImp(imp) { try { return JSON.stringify(imp); } catch (e) { return ""; } }
  // "📖 Come si gioca" dentro un foglio: un tocco apre (e richiude) le regole del gioco, sola lettura
  function comeSiGioca(g) {
    var righe = el("div", { class: "sl-come", hidden: "hidden" });
    (g.regole || ["(regole non ancora scritte)"]).forEach(function (r) { righe.appendChild(el("p", { html: r })); });
    var b = el("button", { class: "btn btn-fantasma sl-come-b", type: "button", text: "📖 Come si gioca", "aria-expanded": "false", onclick: function () {
      righe.hidden = !righe.hidden;
      b.setAttribute("aria-expanded", righe.hidden ? "false" : "true");
      if (!righe.hidden && righe.scrollIntoView) try { righe.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {}
    } });
    return el("div", { class: "sl-come-box" }, [ b, righe ]);
  }
  // HOST: il riassunto delle regole (all'apertura della saletta e quando il foglio ⚙️ si chiude con regole cambiate).
  // Va nel __sl (r, rv: rv cresce a ogni modifica), così chi entra dopo lo legge già. ricalcola = rileggi il box
  function regoleHost(U, ricalcola) {
    if (!U || !U.host) return;
    if (ricalcola || U.regR == null) U.regR = U.R && haRegole(U.R.box) ? riassuntoRegole(U.R.box, giocoDa(U.gid), U.R.imp) : "";
    var SV = U.rete && U.rete._sv;
    if (SV && SV.host && U.regR && SV.regR !== U.regR) { SV.regR = U.regR; SV.rvR = (SV.rvR || 0) + 1; svRiassunto(SV); }
    rigaRegole(U, false);
  }
  // la riga "📜 Si gioca così: …" (host: nel piede, al posto della nota; chi entra: sopra "Sei dentro").
  // cambiate = l'host le ha appena cambiate: saltello e "✨ Regole cambiate" per 2,5 s (solo transform/opacità)
  function rigaRegole(U, cambiate) {
    if (!U || !U.rRiga) return;
    var SV = U.rete && U.rete._sv, tx = U.host ? (U.regR || "") : ((SV && !SV.host && SV.regR) || "");
    if (U.rTesto.textContent !== tx) U.rTesto.textContent = tx;
    if (U.rRiga.hidden !== !tx) U.rRiga.hidden = !tx;
    var conOsp = !!tx || nodiRegole(U).length > 0;
    if (U.bRegoleOsp && U.bRegoleOsp.hidden !== !conOsp) U.bRegoleOsp.hidden = !conOsp;   // (chi entra: «📜 Regole» solo se l'host ne ha scelte)
    if (cambiate && tx && U.bRegoleOsp) {   // l'host le ha appena cambiate: il tasto saltella e dice «✨ Cambiate» per 2,5 s
      rianima(U.bRegoleOsp, "salta"); U.bRegoleOsp.textContent = "✨ Cambiate";
      clearTimeout(U.tRo); U.tRo = setTimeout(function () { if (U.bRegoleOsp) U.bRegoleOsp.textContent = "📜 Regole"; }, 2500);
    }
    if (U.rFoglioP && U.rFoglioP.textContent !== tx && tx) U.rFoglioP.textContent = tx;   // (il foglio aperto si aggiorna anche lui)
    if (cambiate && tx) {
      rianima(U.rRiga, "salta");
      U.rRiga.classList.add("cambiate");
      clearTimeout(U.tRc);
      U.tRc = setTimeout(function () { U.rRiga.classList.remove("cambiate"); }, 2500);
    }
  }
  function rigaRegoleNodi(U, tocco) {
    U.rTesto = el("span", { class: "sl-rr-testo" });
    U.rRiga = el("button", { class: "sl-regole-riga", type: "button", hidden: "hidden", onclick: tocco }, [
      el("span", { class: "sl-rr-et", text: "📜 Si gioca così:" }), U.rTesto,
      el("span", { class: "sl-rr-cambiate", "aria-hidden": "true", text: "✨ Regole cambiate" }) ]);
  }
  // chi entra tocca la riga: un foglio piccolo col riassunto intero e "📖 Come si gioca"
  function foglioRegoleOspite(U) {
    if (document.querySelector(".sl-velo")) return;
    var g = giocoDa(U.gid), velo, tic;
    function chiudi() { clearInterval(tic); if (velo.parentNode) velo.parentNode.removeChild(velo); }
    velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: "📜 Si gioca così" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        el("div", { class: "sl-foglio-corpo" }, [
          U.rFoglioP = el("p", { class: "sl-reg-tutto", text: U.rTesto.textContent }),
          el("p", { class: "modulo-nota", text: "Le regole le sceglie l'host: se le cambia, qui si aggiornano da sole." }),
          null ].concat(nodiRegole(U))),   // (come si gioca: il tasto ⓘ accanto)
        el("button", { class: "btn btn-primario", text: "👍 Ho capito", onclick: chiudi })
      ])
    ]);
    velo._chiudi = chiudi;   // (un tasto del gioco dentro il foglio, es. «📸 I nostri ricordi», lo chiude prima di aprire il suo)
    document.body.appendChild(velo);
    // la partita parte (o la saletta se ne va): il foglio si chiude da solo, non resta sopra il gioco
    tic = setInterval(function () { if (!document.body.contains(U.s)) chiudi(); }, 400);
  }
  // il foglio "Regole" della saletta: dentro ci sono le stesse impostazioni di prima (restano come le avevi lasciate)
  // e, nelle salette dei giochi, la scelta della saletta: "Parti da solo quando tutti sono pronti"
  function foglioRegole(U) {
    var R = U.R; if (document.querySelector(".sl-velo")) return;
    var conGioco = !!(R && haRegole(R.box)), conSaletta = U.gid !== "__sala";
    if (!conGioco && !conSaletta) { if (U.host && cuore.sala && !cuore.sala.elim) cuore.foglioSala(U); return; }   // (la Sala: "🏆 Contiamo i punti")
    var prima = conGioco ? firmaImp(R.imp) : "", velo;
    function chiudi() {
      if (conGioco && R.box.parentNode) R.box.parentNode.removeChild(R.box);
      if (velo.parentNode) velo.parentNode.removeChild(velo);
      applicaViva(U);   // (tutti pronti e "parti da solo" appena acceso: si parte)
      if (!conGioco || firmaImp(R.imp) === prima) return;
      var fn = (U.o && U.o.onRegole) || (R.tavolo && R.tavolo.onRegole);
      if (fn) fn(R.imp);
      regoleHost(U, true);   // la riga "📜 Si gioca così" nuova, e agli amici (con "✨ Regole cambiate")
      if (U.bRegole) { var t0 = U.bRegole.textContent; U.bRegole.textContent = "✅ Fatto"; setTimeout(function () { if (U.bRegole) U.bRegole.textContent = t0; }, 1600); }
    }
    var corpo = el("div", { class: "sl-foglio-corpo" });
    if (conSaletta) corpo.appendChild(opzioniSaletta());
    if (conGioco) corpo.appendChild(R.box);
    nodiRegole(U).forEach(function (x) { corpo.appendChild(x); });   // (i nodi del gioco che stanno nel foglio, es. «📸 I nostri ricordi»)
    // in fondo "📖 Come si gioca" (nella Sala la schermata delle regole non c'è più): si apre qui dentro
    // (7 nov 2026: «📖 Come si gioca» non sta più qui: c'è il tasto ⓘ accanto a Regole, vedi foglioInfo)
    // la Sala nel torneo a eliminazione: in fondo la Compagnia (spenta: "Si fa tra una partita e l'altra")
    if (U.gid === "__sala" && U.host && cuore.sala && cuore.sala.elim) { var rc = cuore.rigaCompSala(function () { chiudi(); }); if (rc) corpo.appendChild(rc); }
    velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: conGioco ? (U.gid === "__sala" && cuore.sala && cuore.sala.elim ? "⚙️ Regole del torneo" : "⚙️ Regole della partita") : "⚙️ La saletta" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        corpo,
        el("button", { class: "btn btn-primario", text: "✅ Fatto", onclick: chiudi })
      ])
    ]);
    velo._chiudi = chiudi;   // (un tasto del gioco dentro il foglio, es. «📸 I nostri ricordi», lo chiude prima di aprire il suo)
    document.body.appendChild(velo);
  }
  // o.regoleExtra: i nodi del gioco che stanno dentro il foglio delle regole invece che sotto la stanza (7 nov 2026: «I nostri
  // ricordi» della Linea del tempo). Per l'host nel ⚙️, per chi entra in «📜 Regole»
  function nodiRegole(U) { return ((U.o && U.o.regoleExtra) || []).filter(Boolean); }
  // ⓘ: come si gioca (le regole del gioco scritte), per tutti. Si chiude da solo se parte la partita
  function foglioInfo(U) {
    if (document.querySelector(".sl-velo")) return;
    var g = giocoDa(U.gid); if (!g) return;
    var velo, tic, corpo = el("div", { class: "sl-foglio-corpo sl-info-corpo" });
    (g.regole || []).forEach(function (r) { corpo.appendChild(el("p", { html: r })); });
    function chiudi() { clearInterval(tic); if (velo.parentNode) velo.parentNode.removeChild(velo); }
    velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: "📖 Come si gioca" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        corpo,
        el("button", { class: "btn btn-primario", text: "👍 Ho capito", onclick: chiudi })
      ])
    ]);
    document.body.appendChild(velo);
    tic = setInterval(function () { if (!document.body.contains(U.s)) chiudi(); }, 400);
  }
  // il sottotitolo della saletta: nei giochi della Sala "Sala · la stanza è tua" (host) o "Sala di Paky" (chi entra)
  function sottoSaletta(o) {
    if (o.sotto) return o.sotto;
    if (o.sala) return o.host ? "Sala · la stanza è tua" : "Sala di " + (o.sala.host || "un amico");
    return o.host ? "Online · la stanza è tua" : "Online · stanza " + String(o.codice || "").toUpperCase();
  }
  function saletta(g, o, R) {
    o = o || {};
    var U = SL.ultimo;
    // (la Sala che diventa torneino cambia titolo: saletta nuova. La Compagnia rinominata no: cambia solo la scritta in alto)
    if (U && U.gid === g.id && (U.chiaveG || U.nomeG) === (g.chiave || g.nome) && U.host === !!o.host && document.body.contains(U.s)) {
      U.gObj = g;
      if (U.nomeG !== g.nome) { U.nomeG = g.nome; var h1 = U.s.querySelector(".testa h1"); if (h1 && h1.textContent !== g.nome) h1.textContent = g.nome; }
      if (R) U.R = R; aggiornaSaletta(U, o, false); return U.s;
    }
    if (U && U.ro) try { U.ro.disconnect(); } catch (e) {}   // (la saletta di prima non serve più)
    var s = schermata({ titolo: g.nome, sotto: sottoSaletta(o),
      indietro: function () {
        // (l'host prima conferma, con la finestra al centro dell'app: la stanza si chiude per tutti)
        function esci() { SL.ultimo = null; var oo = U2 && U2.o && U2.o.onEsci ? U2.o : o; if (oo.onEsci) oo.onEsci(); }
        if (!o.host) return esci();
        // (la Sala con un amico che può tenerla: "👑 Passa la Sala a Giulia" / "🚪 Chiudi per tutti" / "Resta")
        var oS = (U2 && U2.o) || o;
        if (oS.esciScelta) return oS.esciScelta(function () { if (document.body.contains(s)) esci(); });
        chiediConferma((U2 && U2.o && U2.o.confermaEsci) || o.confermaEsci || "Chiudere la stanza per tutti?", null, "Chiudi", function () { if (document.body.contains(s)) esci(); });
      } });
    s.classList.add("saletta-schermo");
    // il primo tocco nella saletta accende i suoni (i telefoni li tengono spenti finché non si tocca): "pling", musichetta…
    ["pointerup", "touchend", "click"].forEach(function (ev) { s.addEventListener(ev, function () { audioCtx(); }, true); });   // (iPhone: serve un tocco vero)
    var U2 = { gid: g.id, nomeG: g.nome, chiaveG: g.chiave || null, gObj: g, host: !!o.host, s: s, figure: {}, o: o, rete: o._rete || null };
    // in alto il codice e "📤 Invita gli amici": per chi ospita e (con la Sala sempre accesa) anche per chi entra.
    // Nei giochi della Sala il codice e il link sono quelli della Sala (o.sala): uno per tutta la serata
    if (o.host || (cuore.salaSempre() && !o.senzaInvito)) {
      U2.cod = el("b", { text: "…" });
      // (col profilo e degli amici, nella Sala: "➕ Invita gli amici 🟢 2" apre il foglio degli amici: vedi tastoInvita)
      U2.link = el("button", { class: "btn btn-primario sl-link", html: "📤 Invita gli amici", onclick: function () {
        if (!U2.linkUrl) return;
        if (U2.invModo === "amici" && window.SGAmiciOnline) { apriInvitaAmici(U2); return; }
        condividiLink(U2.linkUrl, U2.gObj || g, U2.link);
      } });
      U2.codEt = el("small", { text: "Codice" });
      U2.codBox = el("div", { class: "sl-cod" + (o.host ? "" : " ospite") }, [ U2.codEt, U2.cod ]);   // (il pallino dice se la stanza è aperta: solo per chi ospita)
      s._contenuto.appendChild(el("div", { class: "sl-invito" }, [ U2.codBox, U2.link ]));
    }
    U2.statoT = s.querySelector(".testa .sotto");   // il sottotitolo ("Sala di Paky"; per chi ospita anche lo stato)
    if (o.host) {
      // nella testa, a destra, "🔒 Chiudi la porta" (chi non è già dentro legge "La stanza è chiusa"); sotto il titolo lo stato:
      // "🟡 Sto aprendo la stanza…", "🔒 Porta chiusa" (così non ruba spazio alla saletta)
      var testa = s.querySelector(".testa");
      U2.porta = el("button", { class: "sl-porta", type: "button", hidden: "hidden", onclick: function () { portaSaletta(U2); } });
      // (6 nov 2026, il proprietario: «che serve chiudere la sala? Occupa solo spazio»: il tasto non sta più nella testa, così il titolo
      // resta su una riga e lo spazio va agli avatar. La porta resta nel codice, nascosta: la usano solo le prove)
      U2.porta.classList.add("via"); testa.appendChild(U2.porta);
      U2.sottoBase = U2.statoT ? U2.statoT.textContent : "";
    }
    // la saletta: muro, finestra, quadro col simbolo del gioco, orologio, pianta, divano e tappeto (uguale per tutti i giochi)
    U2.stanza = el("div", { class: "sl-stanza" }, [ el("div", { class: "sl-muro" }), el("div", { class: "sl-insegna", text: "Sala d'attesa" }),
      el("div", { class: "sl-finestra" }), el("div", { class: "sl-quadro" }, [ el("span", { text: g.icona || "🎲" }) ]),
      el("div", { class: "sl-orologio", html: "<svg viewBox='0 0 40 40'><circle cx='20' cy='20' r='17' fill='#fff8e8' stroke='#6b4428' stroke-width='3'/><path d='M20 20 L20 9 M20 20 L28 24' stroke='#2b2b33' stroke-width='2.4' stroke-linecap='round'/><circle cx='20' cy='20' r='2' fill='#e03131'/></svg>" }),
      el("div", { class: "sl-pavimento" }), el("div", { class: "sl-tappeto" }), el("div", { class: "sl-divano" }),
      el("div", { class: "sl-pianta", html: "<svg viewBox='0 0 60 80'><path d='M30 50 C18 40 8 30 10 14 C20 22 26 34 30 50 Z' fill='#40c057'/><path d='M30 50 C42 40 52 30 50 12 C40 22 34 34 30 50 Z' fill='#2f9e44'/><path d='M30 52 C26 36 28 18 34 4 C38 20 36 36 30 52 Z' fill='#51cf66'/><path d='M16 50 L44 50 L40 78 L20 78 Z' fill='#c9713a' stroke='#8a4a22' stroke-width='2' stroke-linejoin='round'/><rect x='14' y='47' width='32' height='7' rx='2' fill='#d9854a' stroke='#8a4a22' stroke-width='2'/></svg>" }) ]);
    U2.conta = el("div", { class: "sl-conta" });
    U2.guardano = el("div", { class: "sl-guardano", hidden: "hidden" });   // "👀 2": chi guarda soltanto (Passo 6)
    // 🎵/🔇 nell'angolo: la musichetta (sul telefono dell'host) e i suoni della saletta; la scelta resta ricordata
    U2.bSuono = el("button", { class: "sl-suono", type: "button", "aria-label": "Musica e suoni della saletta", onclick: function () { suonoSaletta(!SUONO_SL.on); } });
    // sopra gli avatar due veli: i nomi (sempre leggibili, anche di chi sta dietro) e poi i fumetti e le faccine
    U2.targhe = el("div", { class: "sl-targhe" });
    U2.bolle = el("div", { class: "sl-bolle", "aria-hidden": "true" });
    [U2.conta, U2.guardano, U2.bSuono, U2.targhe, U2.bolle].forEach(function (x) { U2.stanza.appendChild(x); });
    s._contenuto.appendChild(U2.stanza);
    // la stanza cambia misura (telefono girato, tastiera, barra del browser): gli avatar si rimettono a misura
    if (window.ResizeObserver) {
      U2.ro = new ResizeObserver(function () { if (!document.body.contains(U2.s)) { U2.ro.disconnect(); return; } disponiSaletta(U2, false); });
      U2.ro.observe(U2.stanza);
    }
    // le faccine: il mio avatar le fa sui telefoni di tutti (al massimo una al secondo).
    // (7 nov 2026, il proprietario: «le reazioni mi piacciono, però occupano spazio»: niente più fila sotto la stanza.
    // Si aprono a ventaglio toccando il PROPRIO avatar, vedi toccoAvatar e ventaglio; i tasti restano qui, nascosti)
    U2.faccine = vassoioFaccine(function () { return U2.rete && U2.rete._sv; });
    U2.faccine.hidden = true; U2.faccine.classList.add("sl-fa-palco");
    s._contenuto.appendChild(U2.faccine);
    U2.extra = el("div", { class: "sl-extra" });
    s._contenuto.appendChild(U2.extra);
    // (7 nov 2026, il proprietario: «spazio, spazio, spazio per gli avatar»: niente più «📜 Si gioca così», note, «Pronti 2 su 3»
    // coi pallini (basta la spunta verde sugli avatar). In fondo ⓘ (come si gioca), Regole e Comincia)
    var gInfo = g.id !== "__sala" && g.regole && g.regole.length ? g : null;
    U2.bInfo = gInfo ? el("button", { class: "btn btn-fantasma sl-info", type: "button", text: "i", "aria-label": "Come si gioca", onclick: function () { foglioInfo(U2); } }) : null;
    if (!o.host) {
      // "✅ Sei dentro!" solo quando l'host mi ha davvero messo nella lista; prima "⏳ Sto entrando…"
      U2.titolo = el("div", { class: "sl-att-tit" });
      U2.attesa = el("div", { class: "sl-att-testo" });
      U2.consiglio = el("div", { class: "sl-consiglio" });
      U2.box = el("div", { class: "sl-attesa" }, [ U2.titolo, U2.attesa, U2.consiglio ]);
      // le regole scelte dall'host: non più una riga, ma il tasto «📜 Regole» in fondo (il foglio col riassunto intero)
      // (la riga resta nella pagina, nascosta: il suo testo serve al foglio e alle prove)
      if (g.id !== "__sala") { rigaRegoleNodi(U2, function () { foglioRegoleOspite(U2); }); s._contenuto.appendChild(U2.rRiga); }
      s._contenuto.appendChild(U2.box);
      // "✋ Sono pronto!" (nelle salette dei giochi; nella Sala si aspetta che l'host scelga)
      if (g.id !== "__sala") {
        U2.bPronto = el("button", { class: "btn btn-verde sl-pronto", type: "button", onclick: function () { prontoSaletta(U2); } });
        U2.bRegoleOsp = el("button", { class: "btn btn-fantasma sl-regole", type: "button", hidden: "hidden", text: "📜 Regole", "aria-label": "Le regole della partita", onclick: function () { foglioRegoleOspite(U2); } });
        s._piede.appendChild(el("div", { class: "sl-tasti" }, [ U2.bInfo, U2.bRegoleOsp, U2.bPronto ].filter(Boolean)));
      }
    } else {
      U2.go = el("button", { class: "btn btn-primario sl-go", onclick: function () { partenza(U2); } });
      U2.chip = el("div", { class: "sl-chip", hidden: "hidden", "aria-live": "polite" });   // "✋ Pronti 2 su 3" (non si vede più: serve a «parti da solo»)
      // la nota resta solo quando non si può ancora partire («Almeno 4 giocatori…»): piccola, in cima alla stanza
      U2.nota = el("p", { class: "modulo-nota sl-nota" });
      U2.R = R || null;
      // "🏆 Fate il torneino in 5": un gioco a due e nella stanza (o nella Sala) si è almeno in 3 (vedi tastoTorneino)
      if (GIOCHI_ELIMINAZIONE[g.id]) { U2.bTorneino = el("button", { class: "btn sl-torneino", type: "button", hidden: "hidden", onclick: function () { cuore.torneinoDaSaletta(U2); } }); s._piede.appendChild(U2.bTorneino); }
      s._piede.appendChild(U2.chip);
      // l'host può sempre cambiare le regole, anche con gli amici già dentro (e nel ⚙️ c'è "Parti da solo quando tutti sono pronti")
      var regoleGioco = !!(R && haRegole(R.box));
      var salaPunti = g.id === "__sala" && !regoleGioco && !!cuore.sala && !cuore.sala.elim;   // (la Sala: nel ⚙️ c'è "🏆 Contiamo i punti")
      if (regoleGioco || g.id !== "__sala" || salaPunti) {
        U2.bRegole = el("button", { class: "btn btn-fantasma sl-regole", text: regoleGioco ? "⚙️ Regole" : "⚙️", "aria-label": regoleGioco ? "Regole della partita" : (salaPunti ? "La Sala" : "La saletta"), onclick: function () { foglioRegole(U2); } });
        s._piede.appendChild(el("div", { class: "sl-tasti" }, [ U2.bInfo, U2.bRegole, U2.go ].filter(Boolean)));
      } else s._piede.appendChild(U2.go);
      // il riassunto delle regole lo calcola regoleHost (va agli amici): la riga non si mostra più
      if (regoleGioco) { rigaRegoleNodi(U2, function () { foglioRegole(U2); }); s._piede.appendChild(U2.rRiga); }   // (nascosta, vedi styles.css)
      U2.stanza.appendChild(U2.nota);
    }
    SL.ultimo = U2;
    nuovoGiroSaletta(U2);   // una saletta nuova (es. "Nuova partita"): i "pronto" ripartono da zero
    aggiornaSaletta(U2, o, true);
    mostra(s);
    disponiSaletta(U2, false);   // (ora la stanza ha le sue misure)
    // (anche col ResizeObserver: a volte non avvisa, es. pagina nascosta quando si gira il telefono; due conti uguali non fanno danni)
    window.addEventListener("resize", function rimisura() { if (!document.body.contains(U2.s)) return window.removeEventListener("resize", rimisura); disponiSaletta(U2, false); });
    avviaAnimeSaletta();
    musicaSaletta();
    return s;
  }
  var CONSIGLI_SL = ["Tocca il tuo avatar: le reazioni le vedono tutti! 😂", "Tocca gli altri avatar: saltano! 🤸", "Appena l'host fa partire, il gioco si apre da solo."];
  // l'host non mi ha messo nella sua foto: nessuno nella lista sono io (niente "Tu" sbagliato, anche se il gioco lo crede)
  function senzaTuFalso(gio, st) { return st && st.foto && !st.presente ? gio.map(function (p) { return p.tu ? Object.assign({}, p, { tu: false }) : p; }) : gio; }
  // il titolo della saletta di chi entra (dice sempre la verità): "✅ Sei dentro!" solo se l'host mi ha messo nella lista;
  // "⏳ Sto entrando…" finché non succede; nei giochi a due, se giocano già in due: "👀 Giocano in due: tu guardi".
  // Si cambia solo se è diverso (niente lampeggio). true = sono dentro
  function titoloSaletta(U, gio, st) {
    var io = gio.filter(function (p) { return p.tu; })[0], dentro = !!io && (!st || st.presente);
    var altri = gio.filter(function (p) { return !p.bot && !p.tu; }).length;
    var guardi = !dentro && !!st && st.vivo && st.foto && altri >= 2 && cuore.aDue(giocoDa(U.gid)) && (st.presente || Date.now() - (st.entrato || 0) > 2500);
    // il gioco dice che questo telefono guarda soltanto (t.lobby({ spettatore: true }), es. partita piena): "👀 Guardi questa partita"
    var spett = !!(U.o && U.o.spettatore);
    var k = spett ? "spett" : (dentro ? "dentro" : (guardi ? "guardi" : "entrando"));
    var tx = k === "spett" ? (typeof U.o.spettatore === "string" ? U.o.spettatore : "👀 Guardi questa partita")
      : k === "dentro" ? "✅ Sei dentro!" : (k === "guardi" ? "👀 Giocano in due: tu guardi" : "⏳ Sto entrando…");
    if (U.statoTit !== k || U.titolo.textContent !== tx) {
      U.statoTit = k;
      U.titolo.textContent = tx;
      U.box.classList.toggle("entrando", k === "entrando");
    }
    return dentro && !spett;
  }
  function aggiornaSaletta(U, o, nuova) {
    U.o = o;
    if (o._rete) U.rete = o._rete;
    var gio = (o.giocatori || []).slice();
    // nei giochi della Sala: chi della Sala manca ancora (sagome grigie col suo nome, "Arrivano: 3 su 4", "Comincia senza Marco")
    var attesi = U.attesi = o._attesiDi ? (o._attesiDi(gio, U.rete && U.rete._sv) || []) : [];
    // la testata: il codice (della Sala, se il gioco è della Sala) e il link da mandare. Il codice della stanza
    // di questa saletta resta scritto in data-stanza (serve alle prove). Si cambia solo quello che è diverso
    if (U.cod) {
      var codSt = String(o.codice || (U.rete && U.rete.codice) || "").toUpperCase();
      var pronto = !!codSt && codSt !== "…", inSala = !!(o.sala && o.sala.codice);
      var codMostra = inSala ? String(o.sala.codice).toUpperCase() : (pronto ? codSt : "…");
      if (U.cod.textContent !== codMostra) U.cod.textContent = codMostra;
      // il codice di una Compagnia ha 6 lettere: più piccolo, per stare in una riga con "📤 Invita"
      var sei = codMostra.length === 6;
      var et = sei && (inSala || U.gid === "__sala") ? "📌 Compagnia" : (inSala || (U.gid === "__sala" && cuore.salaSempre()) ? "Sala" : "Codice");
      if (U.codEt.textContent !== et) U.codEt.textContent = et;
      U.codBox.classList.toggle("sei", sei);
      if (pronto) U.codBox.setAttribute("data-stanza", codSt); else U.codBox.removeAttribute("data-stanza");
      // o.link: la Sala o il torneo ha il suo; nei giochi della Sala si invita nella Sala
      U.linkUrl = o.link || (inSala && o.sala.link) || (pronto ? SG.creaLink({ gioco: U.gid, stanza: codSt, k: U.host ? cuore.chiaveDi(codSt, true) : undefined }) : "");
      if (U.linkUrl) U.link.removeAttribute("disabled"); else U.link.setAttribute("disabled", "disabled");
      tastoInvita(U, inSala || U.gid === "__sala" ? codMostra : "", inSala || U.gid === "__sala");   // ("➕ Invita gli amici" nella Sala, Passo 6)
    }
    var sotto = sottoSaletta(o);
    if (U.host) U.sottoBase = sotto;   // (applicaViva lo mette sotto il titolo, se non c'è uno stato da dire)
    else if (U.statoT && U.statoT.textContent !== sotto) U.statoT.textContent = sotto;
    if (U.host) {
      U.aperta = pronto && o.pronta !== false;   // (lo stato sotto il titolo, il pallino del codice e la porta: vedi applicaViva)
      var veri = gio.filter(function (p) { return !p.bot; }).length, min = o.min || 2;
      U.goOk = !((veri < min && !o.puoiDaSolo) || o.puoComincia === false);   // puoComincia: il gioco può chiedere altro (es. le squadre fatte)
      tastoGo(U);
      // con gli amici dentro, "✋ Pronti 2 su 3" dice già tutto: la nota resta solo se il gioco ha qualcosa da dire
      // chi manca (gioco della Sala) e il gioco non può ancora partire: "Aspettiamo Marco…"
      // le regole: la riga "📜 Si gioca così" (calcolata all'apertura) prende il posto della nota di tutti i giorni;
      // restano solo le note che dicono perché non si può ancora partire, o quelle del gioco
      regoleHost(U, !!nuova);
      cuore.tastoTorneino(U);
      var notaTx;
      if (attesi.length && !U.goOk) notaTx = "Aspettiamo " + nomiAttesi(attesi) + "…";
      else notaTx = o.nota || (veri < min && !o.puoiDaSolo ? "Aspettiamo gli amici: " + (veri === 1 ? "per ora ci sei solo tu." : "servono almeno " + min + " giocatori.") : (veri > 1 && U.gid !== "__sala" || U.regR ? "" : "Quando ci siete tutti, fai partire la partita."));
      // (7 nov 2026: in cima alla stanza solo la prima frase, quella che dice perché non si parte: le regole sono in «⚙️ Regole»)
      var pf = String(notaTx || "").match(/^.*?[.!?](?=\s|$)/); if (pf && !U.goOk) notaTx = pf[0];
      if (U.nota.textContent !== notaTx) U.nota.textContent = notaTx;
      var notaSi = !!notaTx && !U.goOk;   // (7 nov 2026: la nota solo quando dice perché non si parte ancora)
      if (U.nota.hidden !== !notaSi) { U.nota.hidden = !notaSi; if (!nuova) disponiSaletta(U, false); }
    } else {
      var chiHost = gio.filter(function (p) { return p.host; })[0];
      U.attesa.textContent = o.attesa || ("Aspetta che " + (chiHost ? chiHost.nome : "l'host") + " faccia partire la partita…");
      // sono davvero dentro? Nella lista c'è "tu" E l'ultima foto dell'host ha il mio id (lo sa il collegamento)
      var rete = o._rete && o._rete.stato ? o._rete : null, st = rete ? rete.stato() : null;
      gio = senzaTuFalso(gio, st);
      var io = gio.filter(function (p) { return p.tu; })[0], dentro = titoloSaletta(U, gio, st);
      // il consiglio (scelto una volta): chi guarda soltanto non ha il suo avatar nella stanza, niente "Tocca il tuo avatar"
      var adatti = io && !o.spettatore ? CONSIGLI_SL : CONSIGLI_SL.filter(function (c) { return !/il tuo avatar/.test(c); });
      if (adatti.indexOf(U.consiglio.textContent) < 0) U.consiglio.textContent = adatti[Math.floor(Math.random() * adatti.length)];
      if (dentro && rete && rete.codice) {
        // il nome che ho in questa stanza (se l'host l'ha cambiato: "Luca 2") e quello dell'host: servono se la pagina si ricarica
        var chiave = io.nome + "|" + (chiHost ? chiHost.nome : "");
        if (U.nomiVisti !== chiave) { U.nomiVisti = chiave; cuore.ricordaNomeStanza(rete.codice, io.nome); if (chiHost) cuore.ricordaNomeStanza(rete.codice, chiHost.nome, true); }
      }
      // non sono nella foto dell'host: chiedo di nuovo di entrare (la saletta è appena comparsa, es. "Nuova partita",
      // oppure c'ero e l'host mi ha tolto). Negli aggiornamenti normali ci pensa il collegamento, senza fretta.
      // (chi è nella foto ma non tra i giocatori guarda soltanto: niente da chiedere)
      if (!dentro && !o.spettatore && st && !st.presente && (nuova || st.dentro)) rete.riprova();
      // in saletta il titolo dice già tutto: la pillola "entri alla prossima" sparisce subito (non un secondo dopo)
      if (rete) pillola("prossima", null);
      rigaRegole(U, false);   // (le regole che l'host ha già mandato)
    }
    // i nodi del gioco sotto la saletta (es. scelta del posto): si rimettono solo se sono cambiati
    var ex = (o.extra || []).filter(Boolean);
    if (ex.length !== U.extra.childNodes.length || ex.some(function (n, i) { return U.extra.childNodes[i] !== n; })) { svuota(U.extra); ex.forEach(function (n) { U.extra.appendChild(n); }); }
    // i personaggi: chi c'è già resta (niente lampeggio), chi arriva entra col saltello e "Ciao Luca! 👋",
    // chi esce saluta e sfuma. Dove sta ognuno (e quanto è grande) lo decide disponiSaletta, qui sotto
    var tieni = {}, n = gio.length, vuoti = Math.max(0, o.vuoti || 0), arrivati = [], usciti = 0, ordine = [];
    vuoti = Math.max(0, vuoti - attesi.length);   // (le sagome di chi manca prendono il posto dei posti liberi)
    gio.forEach(function (p, i) {
      var k = chiavePers(p, i), f = U.figure[k], cfg = p.omino || (window.SGOmino ? SGOmino.casuale(p.nome || k) : null), sig = JSON.stringify(cfg) + "|" + p.nome + "|" + !!p.tu + "|" + !!p.host + "|" + !!p.bot;
      if (!f) {
        // l'avatar ha i suoi pezzi fissi: il disegno (con l'anello verde sul pavimento quando è pronto), il nome sotto i piedi,
        // il bollino (✓ o 📶) e "si ricollega…" (nella targa, sopra il nome: non copre i nomi degli altri); quando cambia qualcosa si rifà solo il disegno o il nome
        f = { nodo: el("div", { class: "sl-av entra" }), sig: "", k: k, manoSu: false };
        f.nodo._f = f;   // (il gesto disegnato dell'avatar illustrato ritrova la sua figura)
        f.anello = el("i", { class: "sl-anello", "aria-hidden": "true" }); f.fig = el("div", { class: "sl-fig" });
        f.bollo = el("b", { class: "sl-bollo", "aria-hidden": "true" }); f.ricollega = el("small", { class: "sl-ricollega" });   // (sta nella targa, sopra il nome)
        f.nodo.appendChild(el("div", { class: "sl-av-in" }, [f.fig, f.bollo]));
        // il nome sta nel velo delle targhe, sopra gli avatar: i capelli di chi è davanti non lo coprono mai
        f.targa = f.nodo._targa = el("div", { class: "sl-nome entra" }); U.targhe.appendChild(f.targa);
        toccoAvatar(U, f);
        U.figure[k] = f; U.stanza.insertBefore(f.nodo, U.targhe);
        (function (nodo, targa) { setTimeout(function () { nodo.classList.remove("entra"); targa.classList.remove("entra"); }, 700); })(f.nodo, f.targa);
        if (!p.tu && U.visti) arrivati.push(f);   // (il fumetto quando è al suo posto, qui sotto)
      }
      f.p = p;
      if (f.sig !== sig) {
        f.sig = sig; f.tu = !!p.tu; f.cfg = cfg;
        disegnaFigura(f);
        svuota(f.targa); f.targa.classList.toggle("tu", !!p.tu);
        [ f.ricollega, p.host ? el("span", { class: "sl-cor", text: "👑" }) : null, document.createTextNode(p.tu ? "Tu" : (p.nome || "…")), p.bot ? el("span", { text: " 🤖" }) : null ].forEach(function (x) { if (x) f.targa.appendChild(x); });
      }
      f.nodo.classList.toggle("tu", !!p.tu); f.nodo.classList.toggle("bot", !!p.bot);
      ordine.push(f.nodo); tieni[k] = true;
    });
    var via = Object.keys(U.figure).filter(function (k) { return !tieni[k]; });
    via.forEach(function (k) {
      var f = U.figure[k], nodo = f.nodo; delete U.figure[k];
      if (MENU_AV && MENU_AV.f === f) chiudiMenuAvatar();
      // saluta con la mano e sfuma (resta dov'era: gli altri intanto si sistemano). Il fumetto solo se escono in pochi
      nodo.classList.add("va"); usciti++;
      if (via.length <= 2) fumetto(U, f, "Ciao ciao! 👋", "va", 1300);
      gesto(nodo, nodo.classList.contains("pronto") ? "salta" : "saluta");
      setTimeout(function () { nodo.classList.add("esce"); f.targa.classList.add("esce"); }, 650);
      setTimeout(function () { togliNodo(nodo); togliNodo(f.targa); }, 1150);
    });
    // i posti liberi: sagome tratteggiate (sempre le stesse finché servono: niente lampeggio)
    U.vuoti = U.vuoti || [];
    while (U.vuoti.length > vuoti) { var vv = U.vuoti.pop(); vv.classList.add("esce"); vv._targa.classList.add("esce"); (function (x) { setTimeout(function () { togliNodo(x); togliNodo(x._targa); }, 450); })(vv); }
    while (U.vuoti.length < vuoti) {
      var nv = el("div", { class: "sl-av sl-vuoto" }, [ el("div", { class: "sl-av-in" }, [ el("div", { class: "sl-sagoma" }) ]) ]);
      nv._targa = el("div", { class: "sl-nome vuoto", text: "libero" }); U.targhe.appendChild(nv._targa);   // (7 nov 2026: «posto libero» non ci stava più tra gli avatar vicini)
      U.stanza.insertBefore(nv, U.targhe); U.vuoti.push(nv);
    }
    // chi della Sala manca ancora: l'avatar grigio e trasparente (fermo, senza respiro) col nome e "…" (📶 se si sta
    // ricollegando). Sempre gli stessi nodi; quando arriva la sua sagoma sfuma e l'avatar vero entra col saltello
    var attN = U.attN = U.attN || {}, attOrd = [], tieniA = {};
    attesi.forEach(function (a) {
      var x = attN[a.id];
      if (!x) {
        x = attN[a.id] = el("div", { class: "sl-av sl-atteso" }, [ el("div", { class: "sl-av-in" }, [ el("div", { class: "sl-fig" }) ]) ]);
        x._targa = el("div", { class: "sl-nome atteso" }); U.targhe.appendChild(x._targa);
        U.stanza.insertBefore(x, U.targhe);
      }
      var cfg = a.omino || (window.SGOmino ? SGOmino.casuale(a.nome || a.id) : null), sigF = JSON.stringify(cfg);
      if (x._sigF !== sigF) { x._sigF = sigF; x.firstChild.firstChild.innerHTML = cfg && window.SGOmino ? SGOmino.svg(cfg) : "<div class='sl-emo'>🙂</div>"; }
      var tx = (a.forse ? "📶 " : "") + (a.nome || "") + "…";
      if (x._targa.textContent !== tx) x._targa.textContent = tx;
      x._targa.classList.toggle("forse", !!a.forse);
      tieniA[a.id] = 1; attOrd.push(x);
    });
    Object.keys(attN).forEach(function (id) {
      if (tieniA[id]) return;
      var x = attN[id]; delete attN[id];
      x.classList.add("esce"); x._targa.classList.add("esce");
      setTimeout(function () { togliNodo(x); togliNodo(x._targa); }, 450);
    });
    U.ordine = ordine.concat(attOrd, U.vuoti);
    disponiSaletta(U, !nuova);
    // il contatore: "4 in sala"; in un gioco della Sala, finché manca qualcuno, "Arrivano: 3 su 4"
    var veriQui = gio.filter(function (p) { return !p.bot; }).length;
    var conta = attesi.length ? "Arrivano: " + veriQui + " su " + (veriQui + attesi.length) : (n === 1 ? "1 in sala" : n + " in sala");
    U.conta.classList.toggle("arriva", attesi.length > 0);   // (va a capo: "Arrivano:" sopra, "3 su 4" sotto, non copre l'insegna)
    if (U.conta.textContent !== conta) { U.conta.textContent = conta; if (U.visti) rianima(U.conta, "salta"); }   // il contatore fa un saltello
    // "Ciao Luca! 👋" a chi arriva (uno o due alla volta; se rientrano in tanti insieme, es. l'host ha riaperto la stanza,
    // bastano il saltello e il "pling": niente muro di fumetti)
    if (arrivati.length <= 2) arrivati.forEach(function (f, i) {
      setTimeout(function () { if (f.nodo.parentNode && !f.nodo.classList.contains("va")) { fumetto(U, f, "Ciao " + ((f.p && f.p.nome) || "") + "! 👋", "ciao", 2600); if (illustrati()) gesto(f.nodo, "saluta"); } }, i * 500);   // (avatar illustrati: chi arriva saluta con la mano)
    });
    if (arrivati.length) suonoSl("pling"); else if (usciti && U.visti) suonoSl("va");
    U.visti = true;
    applicaViva(U);
  }
  // ---- dove sta ognuno nella stanza (le misure seguono la stanza: anche su un telefono alto gli avatar vengono grandi) ----
  //  tre modi, vince quello con gli avatar più grandi (a pari misura il zig-zag, più allegro):
  //  - in fila;
  //  - a zig-zag: uno davanti e uno dietro (quelli dietro un po' più piccoli e più in alto), col nome di chi sta dietro
  //    tra le teste di chi sta davanti;
  //  - a zig-zag "alto": chi sta dietro sale sopra le teste (quando sono tanti: si stringono di più).
  //  Si vedono tutti i visi e tutti i nomi, anche in 10. Chi cambia posto ci scivola da dov'era (solo transform: niente scatti).
  //  (w è la larghezza del disegno dell'avatar: la persona ne occupa circa i due terzi)
  var SL_SOPRA = 30;   // sopra la testa più alta: lo spazio per i fumetti (6 nov 2026: niente più insegna, più spazio agli avatar)
  function disponiSaletta(U, anima) {
    var st = U.stanza, W = st.clientWidth, H = st.clientHeight, nodi = U.ordine || [], tot = nodi.length;
    if (!W || !H || !tot) return;   // (la saletta non è ancora sullo schermo: ci pensa l'osservatore della stanza)
    var sopra = Math.max(SL_SOPRA, U.nota && !U.nota.hidden && U.nota.parentNode === st ? U.nota.offsetTop + U.nota.offsetHeight + 6 : 0);   // (la nota «Almeno 4 giocatori…» in cima)
    var piedi = Math.max(20, Math.round(H * 0.055)), alto = Math.max(60, H - piedi - sopra);   // piedi: c'è la targa col nome sotto
    var w1 = Math.min(W / tot * 1.12, alto / 1.32, 190);
    var wA = tot >= 3 ? Math.min(1.6 * (W - 8) / (tot + 0.216), (alto - 8) / 1.93, 170) : 0;
    var wB = tot >= 3 ? Math.min(2.3 * (W - 8) / (tot + 0.748), (alto - 10) / 2.335, 170) : 0;
    var zz = Math.max(wA, wB) >= w1 * 0.9, pos = [], pav = 0.3;
    // (7 nov 2026, il proprietario: «il corpo si deve vedere tutto… ma in grande»: con gli avatar illustrati si sta vicini, spalla
    // a spalla (un avatar ogni mezza larghezza del disegno: la persona ne occupa circa i due terzi), su 1, 2 o 3 file. Si sceglie
    // le file che danno gli avatar più grandi (una fila in più solo se li fa crescere di oltre il 12%); chi sta dietro è un po'
    // più piccolo, sale di un terzo d'altezza e sta tra le teste di chi è davanti)
    if (illustrati()) {
      var RR = 1.32, best = null;
      for (var r = 1; r <= Math.min(3, tot); r++) {
        var k = Math.ceil(tot / r), wW = (W - 6) / ((k - 1) * 0.5 + 0.62), wH = (alto - 4) / (RR * (1 + 0.36 * (r - 1)));
        var ww = Math.min(wW, wH, 420); if (!best || ww > best.w * 1.12) best = { r: r, k: k, w: ww };
      }
      var file = [], resto = tot;
      for (var fi = 0; fi < best.r; fi++) { var q = Math.ceil(resto / (best.r - fi)); file.push(q); resto -= q; }
      file.reverse();
      var idx = 0, wf = best.w;
      // chi sta dietro sale di almeno un terzo d'altezza; se sopra c'è posto, di più (fino a quasi tre quarti): si vede meglio
      // e la stanza si riempie. I piedi restano sul pavimento (al massimo al 60% della stanza)
      var alzo = 0.36 * RR * wf;
      if (best.r > 1) {
        var amax = Math.min(0.7 * RR * wf, (0.6 * H - 10 - piedi) / (best.r - 1));
        for (var fa = 1; fa < best.r; fa++) amax = Math.min(amax, (alto - 4 - RR * wf * Math.pow(0.9, fa)) / fa);
        alzo = Math.max(alzo, amax);
      }
      for (var fr = 0; fr < best.r; fr++) {
        // la fila dietro sta tra le teste di quella davanti (mezzo passo di lato quando da sola si metterebbe proprio dietro);
        // se così esce dalla stanza, si allarga su tutta la stanza
        var nr = file[best.r - 1 - fr], sc = Math.pow(0.9, fr), wr = wf * sc, passo = wf * 0.5, mg = wr * 0.31,
            sh = fr && (best.k - nr) % 2 === 0 ? passo * 0.5 * (fr % 2 ? -1 : 1) : 0, x0 = W / 2 - (nr - 1) * passo / 2 + sh, pb = passo;
        if (nr > 1 && (x0 < mg || x0 + (nr - 1) * passo > W - mg)) { x0 = Math.max(mg, Math.min(x0, W - mg - (nr - 1) * passo)); if (x0 < mg) { x0 = mg; pb = (W - 2 * mg) / (nr - 1); } }
        for (var j = 0; j < nr; j++) pos[idx++] = { x: Math.max(mg, Math.min(W - mg, x0 + j * pb)), b: piedi + fr * alzo, w: wr, z: 4 - fr, dietro: fr > 0, tmax: Math.max(44, pb - 3) };
      }
      zz = best.r > 1; pav = Math.max(0.3, Math.min(0.6, (piedi + (best.r - 1) * alzo + 10) / H));
    }
    if (pos.length) { /* (avatar illustrati: già al loro posto) */ }
    else if (!zz) nodi.forEach(function (nd, i) { pos.push({ x: (i + 0.5) * W / tot, b: piedi, w: w1, z: 4, tmax: W / tot - 6 }); });
    else {
      var alzati = wB > wA, w = alzati ? wB : wA, m = w * 0.38 + 4, passo = (W - 2 * m) / (tot - 1), wb = w * 0.86;
      var bb = alzati ? piedi + 1.2 * w + 10 : piedi + 0.78 * w + 8;
      nodi.forEach(function (nd, i) {
        var d = i % 2 === 1;
        pos.push({ x: m + i * passo, b: d ? bb : piedi, w: d ? wb : w, z: d ? 3 : 4, dietro: d,
          tmax: Math.min(w * 1.24, 2 * passo - 8, d && !alzati ? 2 * passo - 0.62 * w : 999) });   // (il nome non va sotto un altro nome)
      });
      pav = Math.max(0.3, Math.min(0.55, (bb + 10) / H));   // il pavimento arriva fin dietro a chi sta dietro
    }
    st.style.setProperty("--pav", (pav * 100).toFixed(1) + "%");
    st.classList.toggle("zz", zz);
    // ognuno al suo posto (e il suo nome sotto i piedi); chi si è spostato parte da dov'era (transform) e ci scivola
    var mossi = [];
    nodi.forEach(function (nd, i) {
      var p = pos[i], v = nd._pos, t = nd._targa; nd._pos = p;
      nd.style.left = (p.x - p.w / 2).toFixed(1) + "px"; nd.style.bottom = p.b.toFixed(1) + "px"; nd.style.width = p.w.toFixed(1) + "px";
      nd.style.zIndex = p.z; nd.style.setProperty("--w", p.w.toFixed(1) + "px");
      nd.classList.toggle("dietro", !!p.dietro);
      if (t) {
        // (avatar illustrati su più file: il nome di chi sta dietro va sopra la sua testa; ai piedi cadeva sul petto di chi
        // sta davanti e sembrava il suo nome. Ripasso del 12 nov 2026, S4)
        var suTesta = p.dietro && illustrati() && nd.offsetHeight > 20;
        t.classList.toggle("su-testa", !!suTesta);
        t.style.bottom = (suTesta ? p.b + nd.offsetHeight * 0.97 : p.b - 9).toFixed(1) + "px"; t.style.maxWidth = Math.max(40, Math.round(p.tmax)) + "px"; t.style.setProperty("--w", p.w.toFixed(1) + "px");
        // il nome di chi sta sul bordo non esce dalla stanza (stanza bassa: gli avatar piccoli vanno vicino al bordo)
        var mz = (t.offsetWidth || 0) / 2 + 2, tx = mz * 2 < W ? Math.max(mz, Math.min(W - mz, p.x)) : p.x;
        t.style.left = tx.toFixed(1) + "px";
      }
      if (anima && v && (Math.abs(v.x - p.x) > 0.5 || Math.abs(v.b - p.b) > 0.5 || Math.abs(v.w - p.w) > 0.5)) mossi.push([nd, v, p]);
    });
    if (mossi.length) {
      mossi.forEach(function (x) {
        var nd = x[0], v = x[1], p = x[2], dx = (v.x - p.x).toFixed(1) + "px", dy = (p.b - v.b).toFixed(1) + "px";
        nd.style.transition = "none"; nd.style.transform = "translate(" + dx + "," + dy + ") scale(" + (v.w / p.w).toFixed(3) + ")";
        if (nd._targa) { nd._targa.style.transition = "none"; nd._targa.style.transform = "translate(calc(-50% + " + dx + ")," + dy + ")"; }
      });
      void st.offsetWidth;
      mossi.forEach(function (x) { var nd = x[0]; nd.style.transition = ""; nd.style.transform = ""; if (nd._targa) { nd._targa.style.transition = ""; nd._targa.style.transform = ""; } });
    }
    [].forEach.call(U.bolle.childNodes, function (b) { mettiBolla(U, b); });   // i fumetti seguono chi parla
  }
  function togliNodo(n) { if (n && n.parentNode) n.parentNode.removeChild(n); }
  // il disegno dell'avatar: con la mano alzata quando è pronto (il braccio passa davanti ai capelli), l'anello sotto i piedi
  var CACHE_GESTI = {};   // i disegni col gesto, fatti una volta sola
  function illustrati() { try { return !!(window.SGOmino && SGOmino.illustrato && SGOmino.illustrato()); } catch (e) { return false; } }
  function disegnaFigura(f, gestoDisegnato) {
    var o = f.manoSu ? { braccia: "uno" } : null;
    if (gestoDisegnato && !f.manoSu && f.cfg && window.SGOmino) {   // (avatar illustrati) per un attimo il braccio si alza davvero a salutare
      var kg = JSON.stringify(f.cfg) + "|" + gestoDisegnato;
      if (CACHE_GESTI[kg] === undefined) { try { CACHE_GESTI[kg] = SGOmino.svg(f.cfg, { gesto: gestoDisegnato }); } catch (e) { CACHE_GESTI[kg] = ""; } }
      if (CACHE_GESTI[kg]) { f.fig.innerHTML = CACHE_GESTI[kg]; f.fig.insertBefore(f.anello, f.fig.firstChild); return; }
    }
    f.fig.innerHTML = f.cfg && window.SGOmino ? SGOmino.svg(f.cfg, o) : "<div class='sl-emo'>🙂</div>";
    f.fig.insertBefore(f.anello, f.fig.firstChild);
  }
  // un'animazione dell'avatar (saltello, saluto…) quando è libero: i tocchi e l'orologio della saletta
  function animaAv(nodo, cosa) {
    if (!nodo || nodo._gesto) return;
    if (cosa === "saluta" && nodo.classList.contains("pronto")) cosa = "salta";   // con la mano già alzata: un saltello
    gesto(nodo, cosa);
  }
  // un gesto dell'avatar (anche sopra a un altro: la faccina arriva sempre). Solo transform, nel CSS
  var DURATA_GESTO = { salta: 650, saluta: 1100, ride: 900, trema: 650, applaude: 850, dorme: 1700 };
  function gesto(nodo, cosa) {
    if (!nodo) return;
    Object.keys(DURATA_GESTO).forEach(function (c) { nodo.classList.remove(c); });
    void nodo.offsetWidth;   // (così la stessa animazione riparte da capo)
    nodo.classList.add(cosa); nodo._gesto = cosa;
    clearTimeout(nodo._tGesto); clearTimeout(nodo._tDisegno);
    var f = nodo._f;
    if (cosa === "saluta" && f && f.cfg && !f.manoSu && illustrati()) {   // (illustrati) si cambia solo il disegno di questo avatar e poi si rimette il normale
      disegnaFigura(f, "saluta");
      nodo._tDisegno = setTimeout(function () { if (f.nodo.parentNode && f.fig) disegnaFigura(f); }, DURATA_GESTO.saluta);
    }
    nodo._tGesto = setTimeout(function () { nodo.classList.remove(cosa); nodo._gesto = null; }, DURATA_GESTO[cosa] || 700);
  }
  function rianima(n, cls) { if (!n) return; n.classList.remove(cls); void n.offsetWidth; n.classList.add(cls); }
  // ogni tanto qualcuno saluta o fa un saltello (un solo orologio per tutte le salette)
  function avviaAnimeSaletta() {
    if (SL.timer) return;
    SL.timer = setInterval(function () {
      var U = SL.ultimo;
      if (!U || !document.body.contains(U.s)) { clearInterval(SL.timer); SL.timer = null; return; }
      if (document.hidden) return;
      var nodi = [].slice.call(U.stanza.querySelectorAll(".sl-av:not(.sl-vuoto):not(.sl-atteso):not(.va):not(.forse)"));
      if (nodi.length) animaAv(nodi[Math.floor(Math.random() * nodi.length)], Math.random() < 0.45 ? "saluta" : "salta");
    }, 2600);
  }

  // =========================================================
  //  SALETTA VIVA — ci si diverte già prima di cominciare (uguale per tutti i giochi: i giochi non fanno niente)
  //  - chi arriva fa "pling" e il fumetto "Ciao Luca! 👋", il contatore fa un saltello; chi esce saluta e sfuma;
  //  - "✋ Sono pronto!": l'avatar alza la mano e si accende la spunta; l'host legge "Pronti 2 su 3" e nel ⚙️
  //    trova "Parti da solo quando tutti sono pronti";
  //  - le faccine 👋 😂 😱 🔥 👏 😴: il mio avatar le fa su tutti i telefoni (al massimo una al secondo);
  //  - chi si sta ricollegando è grigio con 📶; l'host fa uscire (tocco lungo sull'avatar) e chiude la porta (🔒);
  //  - "Comincia": 3-2-1-Via! con suono su tutti i telefoni; la musichetta sul telefono dell'host (🎵/🔇).
  //  I messaggi passano dallo strato comune della rete (agganciaRete), i giochi non li vedono mai:
  //    ospite → host: __pronto { si }, __faccina { f }
  //    host → tutti (inviaVeloce: non restano nella stanza): __sl { p: chi è pronto, f: chi si ricollega,
  //    n: id → nome, porta }, __fa { id, n, f } (una faccina), __via { ms } o { stop } (il 3-2-1),
  //    __fuori { to, perche: "fuori" (fatto uscire) o "porta" (porta chiusa) }
  //  Lo stato di ogni stanza (SV) sta sul suo collegamento: h._sv (host e ospiti).
  // =========================================================
  var FACCINE_SL = ["👋", "😂", "😱", "🔥", "👏", "😴"];
  var GESTO_FACCINA = { "👋": "saluta", "😂": "ride", "😱": "trema", "🔥": "salta", "👏": "applaude", "😴": "dorme" };
  var VIA_MS = 2400;   // il 3-2-1: 0,8 secondi per numero, poi "Via!"
  var SVH = {};        // le stanze aperte da questo telefono (codice → SV): per chi si ricollega (evento sg-forse)
  var MENU_AV = null;  // il menu "Fai uscire" aperto: { nodo, f }
  var VIA = null;      // il 3-2-1 sullo schermo: { nodo, U, host, timer }
  var FINE = null;     // i tasti di fine partita sullo schermo: { nodo (Rivincita o Ci sto), SV, host, base } (il conto 👍 senza ridisegnare)
  var RIV = null;      // la Rivincita appena toccata: { codice, attesi:[id], nomi, quando, auto, pronti, daSala, U } (3-2-1 da solo se ci sono tutti)
  // chi si sta ricollegando (lo dice net.js, sul telefono dell'host): grigio con 📶 su tutti i telefoni
  window.addEventListener("sg-forse", function (e) {
    var d = e.detail || {}, SV = SVH[String(d.stanza || "").toUpperCase()];
    if (!SV || !d.id) return;
    if (d.forse && SV.dentro[d.id]) SV.forse[d.id] = 1; else delete SV.forse[d.id];
    svRiassunto(SV);
    if (SV.sala) cuore.rinfrescaAttesi();   // (nella saletta del gioco della Sala, chi manca ha il 📶)
  });
  function nuovoSV(host, codice, sala) {
    return { host: host, codice: String(codice || "").toUpperCase(), sala: !!sala, h: null, pronti: {}, forse: {}, nomi: {}, dentro: {}, andati: {},
      fuori: {}, avvisati: {}, ultFa: {}, porta: false, tSl: null, ultMia: 0, addio: null, salva: null,
      // fine partita (p2-f): chi ci sta per la prossima (cisto; il mio tocco non ancora confermato: cistoMio), il giro della
      // saletta (giro: dell'host; giroH: l'ultimo letto nel __sl; giroMio: quello della mia saletta), chi c'era nella saletta
      // prima della partita (idsSaletta), la stanza chiusa apposta dalla classifica (chiusaFine), la fase (anche per chi entra)
      cisto: {}, cistoMio: null, cistoT: 0, giro: 0, giroH: null, giroMio: null, idsSaletta: null, chiusaFine: false, fase: "",
      // "Giocato di recente" (p3-e): host uid (id -> uid di chi ha il profilo online), chi (ospite: nome -> uid, da "__chi")
      uid: {}, chi: {}, tChi: null,
      // chi guarda soltanto (Passo 6): host pubblico (id -> { n: nome, t: ultima volta sentito }), le faccine del pubblico
      // nell'ultimo secondo (ultFaP), il timer che toglie chi non si sente più (tPub); chi entra: quanti guardano (guardano, dal __sl)
      pubblico: {}, ultFaP: [], tPub: null, guardano: 0, nomiGuardano: [] };
  }
  function insieme(a) { var o = {}; (Array.isArray(a) ? a : []).forEach(function (k) { o[k] = 1; }); return o; }
  function mioIdSV(SV) { return SV.host ? "host" : (SV.h && SV.h.mioId); }
  function hostViaDi(codice) { var c = "/" + String(codice || "").toUpperCase() + "/"; return Object.keys(hostVia).some(function (k) { return k.indexOf(c) >= 0; }); }
  // l'id (del collegamento) di un avatar della saletta. Certi giochi usano id loro ("X" e "O" nel Tris):
  // allora si cerca per nome (nella stessa stanza i nomi sono tutti diversi: "Luca" e "Luca 2")
  function idDiFigura(SV, k, p) {
    if (!SV || !p || p.bot) return null;
    if (p.host) return "host";
    if (p.tu) return mioIdSV(SV);
    if (k !== "__io" && k !== "host" && SV.nomi[k] != null) return k;
    var trovato = null;
    Object.keys(SV.nomi).forEach(function (id) { if (!trovato && id !== "__io" && id !== "host" && stessoNome(SV.nomi[id], p.nome)) trovato = id; });
    return trovato;
  }
  function figuraDi(U, SV, id, nome) {
    var trovata = null, mio = mioIdSV(SV);
    Object.keys(U.figure).forEach(function (k) {
      var f = U.figure[k], p = f.p || {};
      if (!trovata && ((id === mio && p.tu) || (id === "host" && p.host) || (k === id && !p.host && !p.tu))) trovata = f;
    });
    if (!trovata && nome) Object.keys(U.figure).forEach(function (k) { var f = U.figure[k]; if (!trovata && f.p && !f.p.bot && stessoNome(f.p.nome, nome)) trovata = f; });
    return trovata;
  }
  // la saletta sullo schermo è quella di questa stanza?
  function vivaDi(SV) { var U = SL.ultimo; return SV && U && U.rete && U.rete._sv === SV && document.body.contains(U.s) ? U : null; }
  function aggiornaViva(SV) { var U = vivaDi(SV); if (U) applicaViva(U); }
  function vivaOra() { var U = SL.ultimo; if (U && U.figure && document.body.contains(U.s)) applicaViva(U); }

  // ---- la saletta si rimette in pari con lo stato: spunte, avatar grigi, "Pronti 2 su 3", la porta, "Sono pronto".
  //      Tocca solo quello che cambia (classi e scritte). Se tutti sono pronti e l'host ha acceso "Parti da solo", si parte ----
  function applicaViva(U) {
    if (!U || !U.figure) return;
    var SV = U.rete && U.rete._sv ? U.rete._sv : null;
    var giuIo = !!PILLOLE.n.rete;   // la mia rete è giù ("📶 Mi ricollego…"): il mio avatar è grigio anche da me
    var hostGiu = !!(SV && !SV.host && hostViaDi(SV.codice));
    var tot = 0, pronti = 0, pallini = [], qui = {};   // qui: gli amici nella saletta (id → 1, 2 se si sta ricollegando)
    Object.keys(U.figure).forEach(function (k) {
      var f = U.figure[k], p = f.p || {}, id = idDiFigura(SV, k, p);
      if (id && !p.host && !p.bot && id !== "host") qui[id] = (SV && SV.forse[id]) ? 2 : 1;
      var pr = !!(SV && id && SV.pronti[id]);
      if (p.tu && !U.host && U.mioPronto != null) pr = U.mioPronto;
      if (p.host || p.bot) pr = false;   // l'host fa partire lui; i bot sono sempre pronti (niente spunta)
      var fo = !!(SV && id && SV.forse[id]) || (!!p.tu && giuIo) || (!!p.host && hostGiu);
      f.nodo.classList.toggle("pronto", pr && !fo); f.targa.classList.toggle("pronto", pr && !fo);
      f.nodo.classList.toggle("forse", fo); f.targa.classList.toggle("forse", fo);
      // pronto: alza la mano (si ridisegna solo lui) con un saltello; non più pronto: la abbassa
      if ((pr && !fo) !== f.manoSu) { f.manoSu = pr && !fo; disegnaFigura(f); if (f.manoSu && U.visti) gesto(f.nodo, "salta"); }
      var b = fo ? "📶" : (pr ? "✓" : "");
      var rt = fo ? "si ricollega…" : "";   // (la scritta c'è solo quando serve: niente testo nascosto per chi legge lo schermo)
      if (f.ricollega.textContent !== rt) f.ricollega.textContent = rt;
      if (f.bollo.textContent !== b) f.bollo.textContent = b;
      if (!p.host && !p.bot) { tot++; if (pr && !fo) pronti++; pallini.push(pr && !fo); }   // (chi si sta ricollegando non conta come pronto)
    });
    U.faccine.hidden = !SV;
    if (SV) suggerisciReazioni(U);   // (la prima volta: «Tocca il tuo avatar per le reazioni»)
    // "👀 2": chi guarda soltanto (accanto al contatore e nella fila delle faccine)
    var nPub = contaPubblico(SV), txPub = nPub > 0 ? "👀 " + nPub : "";
    [U.guardano, U.faccine && U.faccine._pub].forEach(function (x) { if (!x) return; if (x.textContent !== txPub) x.textContent = txPub; x.hidden = !nPub; });
    if (U.bSuono) { var ts = SUONO_SL.on ? "🎵" : "🔇"; if (U.bSuono.textContent !== ts) { U.bSuono.textContent = ts; U.bSuono.setAttribute("aria-pressed", SUONO_SL.on ? "true" : "false"); } }
    if (U.host) {
      // sotto il titolo lo stato ("🟡 Sto aprendo…", "🔒 Porta chiusa"), il pallino del codice, la porta nella testa (🔒 Chiudi / 🔓 Riapri)
      var porta = !!(SV && SV.porta), cosa = U.gid === "__sala" ? "Sala" : "stanza";
      var st = !U.aperta ? "🟡 Sto aprendo la " + cosa + "…" : (porta ? "🔒 Porta chiusa" : U.sottoBase);
      if (U.statoT && U.statoT.textContent !== st) U.statoT.textContent = st;
      U.codBox.classList.toggle("apre", !U.aperta); U.codBox.classList.toggle("chiusa", porta);
      U.s.classList.toggle("porta-chiusa", porta);
      var tp = porta ? "🔓 Riapri" : "🔒 Chiudi";
      if (U.porta.textContent !== tp) { U.porta.textContent = tp; U.porta.setAttribute("aria-label", porta ? "Riapri la porta della " + cosa : "Chiudi la porta della " + cosa + ": non entra nessun altro"); }
      U.porta.hidden = !(SV && U.aperta);
      U.porta.setAttribute("aria-pressed", porta ? "true" : "false");
      // "✋ Pronti 2 su 3" con un pallino per amico (nelle salette dei giochi, con almeno un amico)
      var conChip = U.gid !== "__sala" && tot > 0, tutti = conChip && pronti === tot;
      U.chip.hidden = !conChip;
      if (conChip) {
        var firma = pronti + "/" + tot + "|" + pallini.join(",");
        if (U.chipFirma !== firma) {
          U.chipFirma = firma; svuota(U.chip);
          U.chip.appendChild(el("span", { text: tutti ? "🎉 Tutti pronti!" : "✋ Pronti " + pronti + " su " + tot }));
          var pa = el("span", { class: "sl-pallini", "aria-hidden": "true" });
          pallini.forEach(function (x) { pa.appendChild(el("i", { class: x ? "si" : null })); });
          U.chip.appendChild(pa);
        }
        U.chip.classList.toggle("tutti", tutti);
      }
      // chi è nella saletta adesso: alla Rivincita si aspettano loro (non chi guardava da fuori o è arrivato a partita in corso)
      if (SV && SV.host && U.gid !== "__sala") SV.idsSaletta = Object.keys(qui);
      cuore.tastoTorneino(U);   // ("🏆 Fate il torneino in 5": chi entra o esce dalla stanza)
      // dopo "↻ Rivincita": chi della partita prima manca ancora ("Comincia senza Luca"); ci sono tutti e nessuno è grigio → 3-2-1 da solo
      var R = RIV && RIV.U === U ? RIV : null, manca = R ? R.attesi.filter(function (id) { return !qui[id]; }) : [];
      var mancaK = manca.join(",");
      if ((U.rivMancaK || "") !== mancaK) { U.rivMancaK = mancaK; U.rivManca = manca.map(function (id) { return { id: id, nome: R.nomi[id] || "…" }; }); tastoGo(U); }
      // (anche chi della Sala sta arrivando per questa partita, es. chi aspettava "entri alla prossima": lo si aspetta)
      if (R && R.auto && !manca.length && !(U.attesi || []).length && !R.attesi.some(function (id) { return qui[id] === 2; }) && U.goOk && !U.via && Date.now() - R.quando < 10000) {
        R.auto = false;
        setTimeout(function () {
          if (RIV !== R || SL.ultimo !== U || !document.body.contains(U.s) || U.via || !U.goOk) return;
          if (document.querySelector(".sl-velo")) { if (Date.now() - R.quando < 10000) R.auto = true; return; }   // (il foglio ⚙️ è aperto: si riprova quando si chiude)
          partenza(U, true);
        }, 700);
      }
      // la luce sul tasto: tutti pronti, oppure (gioco della Sala) sono arrivati tutti quelli che aspettavamo
      var arrivati = !!(U.o && U.o._attesiDi) && tot > 0 && !(U.attesi || []).length;
      U.go.classList.toggle("invita", (tutti || arrivati) && !!U.goOk && !U.via);
      // tutti pronti e "Parti da solo" acceso: si parte da soli (una volta; se qualcuno torna "non pronto", si riarma).
      // Se manca ancora qualcuno della Sala, no: lo si aspetta (o l'host tocca "Comincia senza…")
      if (!tutti || (U.attesi || []).length) U.autoFatto = false;
      else if (autoParti() && U.goOk && !U.via && !U.autoFatto) {
        U.autoFatto = true;
        setTimeout(function () {
          if (SL.ultimo === U && document.body.contains(U.s) && U.chip.classList.contains("tutti") && !document.querySelector(".sl-velo")) partenza(U, true);
          else U.autoFatto = false;   // (il foglio ⚙️ è aperto: si riprova quando si chiude)
        }, 700);
      }
    } else if (U.bPronto) {
      // "✋ Sono pronto!" solo per chi è davvero dentro; chi guarda (giochi a due già pieni) non ce l'ha
      var dentro = U.statoTit === "dentro", mio = mioPronto(U, SV);
      U.bPronto.hidden = !SV || U.statoTit === "guardi" || U.statoTit === "spett";
      var fp = (dentro ? 1 : 0) + "|" + (mio ? 1 : 0);
      if (U.prFirma !== fp) {
        U.prFirma = fp; svuota(U.bPronto);
        U.bPronto.appendChild(el("span", { text: mio ? "✅ Sei pronto!" : "✋ Sono pronto!" }));
        if (mio) U.bPronto.appendChild(el("small", { text: "Tocca se non lo sei più" }));
        U.bPronto.classList.toggle("fatto", !!mio);
        U.bPronto.setAttribute("aria-pressed", mio ? "true" : "false");
        if (dentro) U.bPronto.removeAttribute("disabled"); else U.bPronto.setAttribute("disabled", "disabled");
      }
    }
  }
  function mioPronto(U, SV) {
    if (U.mioPronto != null) return U.mioPronto;
    var id = SV && mioIdSV(SV); return !!(SV && id && SV.pronti[id]);
  }
  // una saletta nuova (prima apertura o "Nuova partita"): i "pronto" ripartono da zero
  // (p2-f) chi a fine partita ha detto "👍 Ci sto!" parte già pronto; dopo la Rivincita della Sala in una stanza nuova, quelli di prima
  function nuovoGiroSaletta(U) {
    var SV = U.rete && U.rete._sv; if (!SV) return;
    U.mioPronto = null;
    if (SV.host) {
      var R = RIV && RIV.codice === SV.codice && !RIV.U ? RIV : null;
      SV.pronti = R && R.daSala ? Object.assign({}, R.pronti) : insieme(Object.keys(SV.cisto || {}).filter(function (id) { return SV.dentro[id]; }));
      if (R) R.U = U;
      SV.cisto = {}; SV.giro = (SV.giro || 0) + 1;
      svRiassunto(SV);
      return;
    }
    // chi entra: se il riassunto della saletta nuova è già arrivato vale quello; se no per ora chi ci stava (e io, se ho toccato)
    if (SV.giroH == null || SV.giroH === SV.giroMio) {
      var io = mioIdSV(SV);
      SV.pronti = Object.assign({}, SV.cisto || {});
      if (io && SV.cistoMio != null) { if (SV.cistoMio) SV.pronti[io] = 1; else delete SV.pronti[io]; }
    }
    SV.giroMio = SV.giroH; SV.cisto = {}; SV.cistoMio = null;
  }
  // ✋ "Sono pronto!" (ospite): l'avatar alza subito la mano; l'host lo dice a tutti
  function prontoSaletta(U) {
    var SV = U.rete && U.rete._sv; if (!SV || SV.host || U.statoTit !== "dentro") return;
    var ora = !mioPronto(U, SV);
    U.mioPronto = ora; U.toccoPronto = Date.now();
    try { SV.h.invia({ t: "__pronto", si: ora }); } catch (e) {}
    if (ora) suonoSl("pronto");
    applicaViva(U);
  }

  // ---- HOST: chi entra, chi è pronto, le faccine, chi esce o viene fatto uscire, la porta ----
  // il riassunto per tutti (dopo un attimo, così più cambi vanno insieme)
  function svRiassunto(SV) {
    if (!SV || !SV.host) return;
    clearTimeout(SV.tSl);
    SV.tSl = setTimeout(function () {
      SV.tSl = null;
      try { if (SV.h) SV.h.inviaVeloce(slDi(SV)); } catch (e) {}
      aggiornaViva(SV);
      aggiornaFine(SV);   // (il conto "👍 3" sul tasto della Rivincita)
    }, 120);
  }
  // il riassunto della saletta: chi è pronto, chi si ricollega, i nomi, la porta, le regole (r, rv), chi ci sta (c), il giro (g)
  function slDi(SV) {
    var n = { host: SV.nomi.__io || "" };
    Object.keys(SV.dentro).forEach(function (id) { if (SV.nomi[id]) n[id] = SV.nomi[id]; });
    var c = Object.keys(SV.cisto || {}).filter(function (id) { return SV.dentro[id]; });
    // (Passo 6) chi guarda soltanto: quanti (gu) e i primi 8 nomi (gn); la fase della partita (fa). ("g" è già il giro)
    var pub = Object.keys(SV.pubblico || {});
    return { t: "__sl", p: Object.keys(SV.pronti), f: Object.keys(SV.forse), n: n, porta: SV.porta ? 1 : 0, r: SV.regR || undefined, rv: SV.regR ? SV.rvR : undefined,
      c: c.length ? c : undefined, g: SV.giro || 0,
      gu: pub.length || undefined, gn: pub.length ? pub.slice(0, 8).map(function (id) { return SV.pubblico[id].n; }) : undefined, fa: SV.fase || undefined };
  }
  // ---- CHI GUARDA SOLTANTO (Passo 6): il pubblico della stanza, sul telefono dell'host ----
  // "__guardo" { n: nome } arriva all'apertura e poi ogni 20 s; chi non si sente da 50 s non guarda più
  var PUB_VIA = 50000, PUB_GIRO = 15000;
  function svGuardo(SV, id, m) {
    if (!SV.host || !id || SV.sala || SV.dentro[id] || SV.fuori[id]) return;   // (chi gioca, o chi è stato fatto uscire: niente)
    var nome = String((m && m.n) || "").replace(/\s+/g, " ").trim().slice(0, 16) || "Pubblico";
    var nuovo = !SV.pubblico[id] || SV.pubblico[id].n !== nome;
    var arriva = !SV.pubblico[id];
    SV.pubblico[id] = { n: nome, t: Date.now() };
    if (!SV.tPub) SV.tPub = setInterval(function () { pulisciPubblico(SV); }, PUB_GIRO);   // (il timer c'è solo se qualcuno guarda)
    if (nuovo) { svRiassunto(SV); aggiornaPubblico(SV); }
    // (22 ott 2026) il gioco dell'host lo sa, se vuole: cb.onGuarda(id, nome) quando arriva uno che guarda soltanto (anche dopo
    // una ricarica dell'host), così gli manda quello che chi gioca riceve entrando (es. gli avatar: Parola d'ordine)
    if (arriva && SV.onGuardo) try { SV.onGuardo(id, nome); } catch (e) { setTimeout(function () { throw e; }, 0); }
  }
  function pulisciPubblico(SV) {
    var ora = Date.now(), via = 0;
    Object.keys(SV.pubblico).forEach(function (id) { if (ora - SV.pubblico[id].t > PUB_VIA) { delete SV.pubblico[id]; via++; } });
    fermaPubblico(SV);
    if (via) { svRiassunto(SV); aggiornaPubblico(SV); }
  }
  function fermaPubblico(SV) { if (SV.tPub && !Object.keys(SV.pubblico).length) { clearInterval(SV.tPub); SV.tPub = null; } }
  // quanti guardano questa stanza (host: il suo pubblico; chi entra: quello che dice il __sl)
  function contaPubblico(SV) { return !SV ? 0 : (SV.host ? Object.keys(SV.pubblico || {}).length : (+SV.guardano || 0)); }
  // "👀 2" accanto al contatore della saletta e a sinistra nelle file delle faccine di questa stanza (solo il testo che cambia)
  function aggiornaPubblico(SV) {
    var n = contaPubblico(SV), tx = n > 0 ? "👀 " + n : "", et = n === 1 ? "1 persona guarda" : n + " persone guardano";
    function metti(x) {
      if (!x) return;
      if (x.textContent !== tx) x.textContent = tx;
      x.hidden = !n; if (n) x.setAttribute("aria-label", et);
    }
    var U = vivaDi(SV); if (U) metti(U.guardano);
    [].forEach.call(document.querySelectorAll(".sl-faccine"), function (b) { var s = null; try { s = b._sv && b._sv(); } catch (e) {} if (s === SV) metti(b._pub); });
  }
  // "sono pronto" e le faccine degli ospiti (solo da chi è dentro; una faccina al secondo a testa)
  function svDaOspite(SV, id, m) {
    // chi guarda soltanto può mandare solo le faccine: una ogni 900 ms a testa e, dal pubblico, al massimo 4 al secondo in tutto
    if (!SV.dentro[id] && SV.pubblico[id] && m.t === "__faccina" && FACCINE_SL.indexOf(m.f) >= 0) {
      var oraP = Date.now(), P0 = SV.pubblico[id];
      if (oraP - (SV.ultFa[id] || 0) < 900) return;
      SV.ultFaP = SV.ultFaP.filter(function (x) { return oraP - x < 1000; });
      if (SV.ultFaP.length >= 4) return;
      SV.ultFa[id] = oraP; SV.ultFaP.push(oraP); P0.t = oraP;
      try { SV.h.inviaVeloce({ t: "__fa", id: id, n: P0.n, f: m.f }); } catch (e) {}
      mostraFaccina(SV, id, P0.n, m.f);
      return;
    }
    if (!SV.dentro[id]) return;
    if (m.t === "__pronto") {
      if (m.si) SV.pronti[id] = 1; else delete SV.pronti[id];
      svRiassunto(SV);   // (anche se non cambia niente: così il suo telefono è sicuro)
    } else if (m.t === "__cisto") {   // "👍 Ci sto!" a fine partita (si ritocca per toglierlo)
      if (m.si) SV.cisto[id] = 1; else delete SV.cisto[id];
      svRiassunto(SV);
    } else if (m.t === "__faccina" && FACCINE_SL.indexOf(m.f) >= 0) {
      var ora = Date.now(); if (ora - (SV.ultFa[id] || 0) < 900) return;
      SV.ultFa[id] = ora;
      var nome = SV.nomi[id] || "";
      try { SV.h.inviaVeloce({ t: "__fa", id: id, n: nome, f: m.f }); } catch (e) {}
      mostraFaccina(SV, id, nome, m.f);
    }
  }
  // la stanza è il gioco della mia Sala e chi bussa è già nella Sala (stesso id): con la porta chiusa entra lo stesso
  function diMiaSala(SV, id) { return !!(cuore.sala && cuore.sala.stanza && SV.codice === cuore.sala.stanza && cuore.sala.membri.some(function (m) { return m.id === id; })); }
  // chi è stato fatto uscire, o chi è nuovo con la porta chiusa: non entra (il gioco non lo vede) e gli si dice perché
  function svRifiuta(SV, id) {
    var ora = Date.now(), k = SV.fuori[id];
    if (k && !SV.porta && ora - k > 60000) { delete SV.fuori[id]; k = 0; }   // porta aperta: dopo un minuto chi era stato fatto uscire può tornare
    var perche = k ? "fuori" : (SV.porta && !SV.dentro[id] && !diMiaSala(SV, id) ? "porta" : null);
    if (!perche) return false;
    if (ora - (SV.avvisati[id] || 0) > 2000) { SV.avvisati[id] = ora; try { SV.h.inviaVeloce({ t: "__fuori", to: id, perche: perche }); } catch (e) {} }
    return true;
  }
  // per il gioco qualcuno è uscito: una volta sola (uscito da sé, sparito, fatto uscire)
  function svAddio(SV, id) {
    // guardava soltanto: via dal pubblico (il gioco non l'ha mai visto, non gli si dice niente)
    if (id && SV.pubblico && SV.pubblico[id] && !SV.dentro[id]) { delete SV.pubblico[id]; fermaPubblico(SV); svRiassunto(SV); aggiornaPubblico(SV); return; }
    if (!id || SV.andati[id]) return;
    SV.andati[id] = 1;
    delete SV.dentro[id]; delete SV.pronti[id]; delete SV.forse[id]; delete SV.cisto[id];
    if (RIV && RIV.codice === SV.codice && RIV.attesi.indexOf(id) >= 0) RIV.auto = false;   // uno della Rivincita se n'è andato: niente 3-2-1 da solo
    if (SV.addio) try { SV.addio(id); } catch (e) {}
    svRiassunto(SV);
    if (SV.onDentro) SV.onDentro();
  }
  // 🚪 "Fai uscire": il suo telefono torna alla home e per il gioco è uscito
  function svFuori(SV, id, nome) {
    if (!SV || !SV.host || !id || id === "host") return;
    SV.fuori[id] = Date.now(); SV.avvisati[id] = Date.now();
    try { SV.h.inviaVeloce({ t: "__fuori", to: id, perche: "fuori" }); } catch (e) {}
    svAddio(SV, id);
    pillola("saletta", "🚪 " + (nome || "L'amico") + " è fuori dalla stanza", "grigia", 3000);
  }
  // 🔒 la porta: chiusa, chi non è già dentro legge "La stanza è chiusa" (chi è dentro può sempre ricaricare e rientrare)
  function portaSaletta(U) {
    var SV = U.rete && U.rete._sv; if (!SV || !SV.host) return;
    SV.porta = !SV.porta;
    if (SV.salva) SV.salva();   // (se la pagina si ricarica, la stanza riapre con la porta com'era)
    svRiassunto(SV); applicaViva(U);
    // un gioco della mia Sala: si chiude (o si riapre) insieme anche la porta della Sala, così chi è nuovo legge
    // subito "La Sala è chiusa" (chi è già nella Sala entra lo stesso nel gioco: vedi svRifiuta)
    var SS = U.o && U.o.sala && cuore.sala && cuore.sala.stanza === SV.codice && cuore.sala.rete && cuore.sala.rete._sv;
    if (SS && SS !== SV && SS.host) { SS.porta = SV.porta; if (SS.salva) SS.salva(); svRiassunto(SS); }
    pillola("saletta", SV.porta ? (SS ? "🔒 Sala chiusa: non entra nessun altro" : "🔒 Porta chiusa: non entra nessun altro")
      : (SS ? "🔓 Sala aperta: chi ha il codice può entrare" : "🔓 Porta aperta: chi ha il link può entrare"), SV.porta ? "grigia" : "verde", 2600);
  }

  // ---- OSPITE: il riassunto dell'host, il 3-2-1, "sei fuori" ----
  function svArrivato(SV, m) {
    SV.pronti = insieme(m.p); SV.forse = insieme(m.f); SV.nomi = m.n && typeof m.n === "object" ? m.n : {}; SV.porta = !!m.porta;
    // fine partita: chi ci sta (il mio tocco vale finché l'host non lo conferma, o per un secondo e mezzo), il giro della saletta,
    // la stanza che l'host chiude apposta dalla classifica (fine: 1)
    SV.cisto = insieme(m.c); SV.giroH = +m.g || 0;
    // (Passo 6) quanti guardano soltanto ("👀 2") e la fase della partita
    var guPrima = SV.guardano; SV.guardano = Math.max(0, +m.gu || 0); SV.nomiGuardano = Array.isArray(m.gn) ? m.gn.slice(0, 8).map(function (x) { return String(x).slice(0, 16); }) : [];
    if (SV.guardano !== guPrima) aggiornaPubblico(SV);
    if (m.fa === "lobby" || m.fa === "gioco" || m.fa === "fine") SV.fase = m.fa;
    if (SV.cistoMio != null && (!!SV.cisto[mioIdSV(SV)] === SV.cistoMio || Date.now() - SV.cistoT > 1500)) SV.cistoMio = null;
    if (m.fine) SV.chiusaFine = true;
    aggiornaFine(SV);
    var U = vivaDi(SV);
    // il mio "pronto" toccato adesso vale finché l'host non lo conferma (o dopo un secondo e mezzo vale il suo)
    if (U && U.mioPronto != null && (!!SV.pronti[mioIdSV(SV)] === U.mioPronto || Date.now() - (U.toccoPronto || 0) > 1500)) U.mioPronto = null;
    // nella saletta di un gioco della Sala chi manca cambia: chi si ricollega nella Sala (📶), chi è già nella stanza
    // le regole dell'host (r, rv): se rv è cresciuto (non la prima volta) la riga fa il saltello e "✨ Regole cambiate"
    //  (rv più basso: l'host ha ricaricato la pagina e riconta da 1; si prendono le sue)
    var rvPrima = SV.rvR, rPrima = SV.regR, rv = +m.rv || 0;
    if (typeof m.r === "string" && m.r && (rv !== rvPrima || m.r !== rPrima)) {
      SV.regR = m.r.slice(0, 120); SV.rvR = rv;
      if (U) rigaRegole(U, rvPrima != null && rv !== rvPrima && SV.regR !== rPrima);
    }
    var conAttesi = !!(U && U.o && U.o._attesiDi);
    if (U && !conAttesi) applicaViva(U);
    if (SV.sala || conAttesi) cuore.rinfrescaAttesi();   // (rifà anche la saletta viva)
  }
  function contoVia(SV, m) {
    if (m.stop) { if (VIA && !VIA.host) togliVia(); return; }
    var U = vivaDi(SV); if (!U || U.host) return;   // solo nella saletta (chi è già in partita non lo vede)
    mostraVia(Math.max(900, Math.min(4000, +m.ms || VIA_MS)), U, false, null);
  }
  // l'host mi ha fatto uscire (o la porta è chiusa e io sono nuovo): via dalla stanza, niente "Rientra"
  function fuoriDallaStanza(R, perche) {
    if (R.finita) return;
    R.finita = true;
    var porta = perche === "porta", C = R.codice;
    try { R.h.chiudi(); } catch (e) {}
    var ls = cuore.linkSessione(), rs = cuore.stanzaRecente();
    if (ls && (ls.stanza === C || ls.sala === C)) cuore.dimenticaLinkSessione();
    if (rs && (rs.stanza === C || rs.sala === C)) try { localStorage.removeItem("sg-ultima-stanza"); } catch (e) {}
    togliVia(); togliFerma();
    var P = R.P;
    // un gioco lanciato dalla Sala: si torna nella Sala
    if (!R.sala && P && P.salaCtx && P.viva() && P.salaCtx.fine) {
      lasciaPartita(); P.salaCtx.fine();
      pillola("saletta", porta ? "🔒 La partita ha la porta chiusa" : "🚪 L'host ti ha fatto uscire dalla partita", "grigia", 3500);
      return;
    }
    if (R.sala) { if (cuore.salaG && cuore.salaG.rete === R.h) cuore.salaG = null; }
    lasciaPartita(); SGNet.chiudiGiochi(); cuore.tieniAcceso(false);
    var g = P && P.g, riprova = porta ? function () { if (R.sala) return cuore.salaOspite(C); if (g) { cuore.linkParams = { gioco: g.id, stanza: C }; avviaPartita(g, [], {}); } } : null;
    var s = schermata({ icona: porta ? "🔒" : "🚪", titolo: porta ? (R.sala ? "La Sala è chiusa" : "La stanza è chiusa") : (R.sala ? "Sei fuori dalla Sala" : "Sei fuori dalla stanza"), sotto: (R.sala ? "Sala " : "Stanza ") + C });
    s._contenuto.appendChild(el("p", { style: "font-size:1.05rem;line-height:1.5", text: porta ? "Chi l'ha aperta ha chiuso la porta: per ora non entra nessun altro." : "Chi ha aperto la stanza ti ha fatto uscire." }));
    if (riprova) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Riprova", onclick: riprova }));
    s._piede.appendChild(el("button", { class: "btn " + (riprova ? "btn-fantasma" : "btn-primario"), text: "🏠 Torna alla home", onclick: tornaHome }));
    mostra(s);
  }

  // ---- LE FACCINE ----
  function mostraFaccina(SV, id, nome, emoji) {
    var U = vivaDi(SV);
    if (U) {
      var f = figuraDi(U, SV, id, nome);
      if (f && !f.nodo.classList.contains("va")) faccinaSuAvatar(U, f, emoji);
      else faccinaVolante(U.stanza, nome, emoji);   // chi non ha un avatar qui (es. chi guarda una partita a due)
      return;
    }
    // fuori dalla saletta (si guarda la partita, la classifica): se è la stanza del gioco aperto, in basso a sinistra
    if (stanzaInVista(SV)) faccinaVolante(null, nome, emoji);
  }
  function stanzaInVista(SV) {
    var P = cuore.partitaCorrente; if (!SV || !SV.h || !P || !P.viva()) return false;
    if (SV.host) return cuore.reteXp === SV.h;
    return !!(cuore.reteOsp && cuore.reteOsp.h === SV.h && cuore.reteOsp.P === P);
  }
  function faccinaSuAvatar(U, f, emoji) {
    bolla(U, f, el("span", { class: "sl-faccia", text: emoji }), "faccia", 1900);
    var g = GESTO_FACCINA[emoji] || "salta";
    if (g === "saluta" && f.nodo.classList.contains("pronto")) g = "salta";   // con la mano già alzata: un saltello
    gesto(f.nodo, g);
    suonoSl("pop");
  }
  function faccinaVolante(stanza, nome, emoji) {
    var box = stanza ? stanza.querySelector(".sl-fa-volanti") : document.querySelector("body > .sg-fa-volanti");
    if (!box) { box = el("div", { class: stanza ? "sl-fa-volanti" : "sg-fa-volanti", "aria-hidden": "true" }); (stanza || document.body).appendChild(box); }
    while (box.childNodes.length >= 4) box.removeChild(box.firstChild);
    var x = el("div", { class: "sg-fa-volante" }, [ el("b", { text: emoji }), nome ? el("span", { text: nome }) : null ]);
    box.appendChild(x);
    setTimeout(function () { if (x.parentNode) x.parentNode.removeChild(x); }, 2500);
    suonoSl("pop");
  }
  // la mia faccina: subito sul mio avatar, poi a tutti (con la rete giù si perde: vale solo adesso)
  function mandaFaccina(SV, emoji) {
    var ora = Date.now();
    if (!SV || !SV.h || ora - SV.ultMia < 1000) return false;   // al massimo una al secondo
    SV.ultMia = ora;
    var io = mioIdSV(SV), nome = SV.host ? (SV.nomi.__io || "") : (SV.nomi[io] || SV.nomeGuardo || "");   // (chi guarda soltanto: il suo nome)
    mostraFaccina(SV, io, nome, emoji);
    try { if (SV.host) SV.h.inviaVeloce({ t: "__fa", id: "host", n: nome, f: emoji }); else SV.h.invia({ t: "__faccina", f: emoji }); } catch (e) {}
    return true;
  }
  // le faccine (svFn: la stanza a cui mandarle). Dopo un tocco aspetta un secondo (la barretta si riempie).
  // (7 nov 2026, il proprietario: «le reazioni mi piacciono, però occupano spazio»: niente più fila di 6 tasti. Al loro posto
  // il MIO avatar (il viso, con un piccolo 😂): un tocco e le faccine si aprono a ventaglio sopra, poi si chiudono da sole.
  // Nella saletta il tasto non c'è: si tocca il proprio avatar nella stanza. Chi guarda soltanto ha ancora la fila, nella
  // targhetta (classe sl-fa-fila). I tasti .sl-fa restano sempre nella pagina: quando il ventaglio è chiuso stanno qui, nascosti)
  function vassoioFaccine(svFn) {
    var box = el("div", { class: "sl-faccine", role: "group", "aria-label": "Reazioni: il tuo avatar le fa sui telefoni di tutti" });
    var carica = el("i", { class: "sl-fa-carica", "aria-hidden": "true" }), tasti = [];
    // a sinistra "👀 2" quando qualcuno guarda soltanto (lo aggiorna aggiornaPubblico, solo il testo)
    box._sv = svFn; box._pub = el("span", { class: "sl-fa-pubblico", hidden: "hidden" });
    box.appendChild(box._pub);
    try { var sv0 = svFn(), n0 = contaPubblico(sv0); if (n0) { box._pub.textContent = "👀 " + n0; box._pub.hidden = false; } } catch (e) {}
    var io = null; try { var pr = profiloAttivo(); io = pr && pr.omino; } catch (e) {}
    var visoH = "<span class='sl-fa-viso vuoto'>🙂</span>";
    if (io && window.SGOmino) try { visoH = "<span class='sl-fa-viso'>" + visoLargo(io) + "</span>"; } catch (e) {}
    box._apri = el("button", { class: "sl-fa-apri", type: "button", "aria-label": "Reazioni", "aria-expanded": "false",
      html: visoH + "<b class='sl-fa-badge'>😂</b>",
      onclick: function () { var r = box._apri.getBoundingClientRect(); ventaglio(box, { x: r.left + r.width / 2, y: r.top + r.height / 2, piccolo: true }); } });
    box.appendChild(box._apri);
    box._casa = el("span", { class: "sl-fa-casa" });
    FACCINE_SL.forEach(function (emoji, i) {
      var b = el("button", { class: "sl-fa", type: "button", "aria-label": "Faccina " + emoji, text: emoji });
      b.style.setProperty("--i", i);
      b.addEventListener("click", function () {
        if (!mandaFaccina(svFn(), emoji)) return;
        rianima(b, "boing"); rianima(carica, "va");
        box.classList.add("attesa"); tasti.forEach(function (x) { x.disabled = true; });
        clearTimeout(box._t); box._t = setTimeout(function () { box.classList.remove("attesa"); tasti.forEach(function (x) { x.disabled = false; }); }, 1000);
        if (VENT && VENT.box === box) setTimeout(function () { if (VENT && VENT.box === box) chiudiVentaglio(); }, 260);   // (si vede il «boing», poi si chiude)
      });
      tasti.push(b); box._casa.appendChild(b);
    });
    box._tasti = tasti;
    box.appendChild(box._casa);
    box.appendChild(carica);
    return box;
  }
  // il viso grande (testa e un po' di collo): per i tondini piccoli, dove il busto intero renderebbe la faccia minuscola
  var VISI = {};   // (il disegno si fa una volta sola per avatar)
  function visoLargo(cfg) {
    var k = JSON.stringify(cfg) + (illustrati() ? "|a" : ""); if (VISI[k]) return VISI[k];
    var s = SGOmino.svg(cfg, { busto: true });
    return (VISI[k] = illustrati() ? s.replace("viewBox='66 13 68 69.6'", "viewBox='76 9 48 48'") : s);
  }
  // il ventaglio delle reazioni: le 6 faccine ad arco intorno alla testa (p: { x, y } sullo schermo; piccolo: è il tasto col viso).
  // Sta sopra tutto (attaccato alla pagina); si chiude con un'altra faccina, toccando fuori, dopo 5 s, o se la schermata se ne va
  var VENT = null;
  function ventaglio(box, p) {
    if (VENT && VENT.box === box) { chiudiVentaglio(); return; }
    chiudiVentaglio();
    var tasti = box._tasti || []; if (!tasti.length || !document.body.contains(box)) return;
    try { localStorage.setItem("sg-reazioni", "1"); } catch (e) {}
    var W = window.innerWidth || 360, H = window.innerHeight || 640, B = 46, RR = p.piccolo ? 78 : 92;
    var su = p.y - RR * 0.8 - B / 2 > 8;   // c'è posto sopra: si apre in su; se no in giù
    var cx = Math.max(RR + B / 2 + 4 - (p.piccolo ? 0 : 6), Math.min(W - RR - B / 2 - 4, p.x)), cy = p.y;
    if (!su) cy = Math.min(H - RR * 0.8 - B / 2 - 8, cy);
    var nodo = el("div", { class: "sl-ventaglio", role: "group", "aria-label": "Reazioni" });
    nodo.style.left = cx.toFixed(1) + "px"; nodo.style.top = cy.toFixed(1) + "px";
    tasti.forEach(function (b, i) {
      var deg = su ? (-160 + i * 28) : (160 - i * 28), a = deg * Math.PI / 180;
      b.style.setProperty("--dx", (Math.cos(a) * RR).toFixed(1) + "px");
      b.style.setProperty("--dy", (Math.sin(a) * RR * 0.8).toFixed(1) + "px");
      nodo.appendChild(b);
    });
    document.body.appendChild(nodo);
    if (box._apri) box._apri.setAttribute("aria-expanded", "true");
    VENT = { box: box, nodo: nodo };
    VENT.t = setTimeout(chiudiVentaglio, 5000);
    VENT.tic = setInterval(function () { if (!VENT || !document.body.contains(VENT.box) || VENT.box.hidden) chiudiVentaglio(); }, 400);
    setTimeout(function () { if (VENT && VENT.nodo === nodo) { document.addEventListener("pointerdown", fuoriVentaglio, true); window.addEventListener("resize", chiudiVentaglio); } }, 0);
  }
  function fuoriVentaglio(e) {
    if (!VENT) return;
    if (VENT.nodo.contains(e.target) || (VENT.box._apri && VENT.box._apri.contains(e.target))) return;
    var av = e.target && e.target.closest && e.target.closest(".sl-av.tu");   // (il tocco sul mio avatar lo chiude da sé: vedi toccoAvatar)
    if (av) return;
    chiudiVentaglio();
  }
  function chiudiVentaglio() {
    if (!VENT) return;
    var V = VENT; VENT = null;
    clearTimeout(V.t); clearInterval(V.tic);
    document.removeEventListener("pointerdown", fuoriVentaglio, true); window.removeEventListener("resize", chiudiVentaglio);
    (V.box._tasti || []).forEach(function (b) { V.box._casa.appendChild(b); });   // i tasti tornano a casa (restano nella pagina)
    if (V.box._apri) V.box._apri.setAttribute("aria-expanded", "false");
    if (V.nodo.parentNode) V.nodo.parentNode.removeChild(V.nodo);
  }
  // la prima volta (su questo telefono) un fumetto sul mio avatar: «Tocca il tuo avatar per le reazioni»
  function suggerisciReazioni(U) {
    if (U.suggerito) return;
    var visto = false; try { visto = !!localStorage.getItem("sg-reazioni"); } catch (e) { visto = true; }
    if (visto) { U.suggerito = true; return; }
    var mio = null; Object.keys(U.figure).forEach(function (k) { var f = U.figure[k]; if (f.p && f.p.tu) mio = f; });
    if (!mio || !U.faccine || U.faccine.hidden) return;
    U.suggerito = true;
    setTimeout(function () {
      if (SL.ultimo !== U || !document.body.contains(U.s) || !mio.nodo.parentNode || VENT) return;
      try { if (localStorage.getItem("sg-reazioni")) return; } catch (e) {}
      fumetto(U, mio, "Tocca il tuo avatar per le reazioni 😂", "consiglio", 5000);
    }, 1800);
  }

  // ---- I FUMETTI E I TOCCHI SUGLI AVATAR ----
  // un fumetto sopra la testa ("Ciao Luca! 👋", "Ciao ciao! 👋")
  function fumetto(U, f, testo, cls, durata) {
    bolla(U, f, el("div", { class: "sl-fumetto" + (cls ? " " + cls : ""), text: testo }), "fumetto", durata || 2400);
  }
  // fumetti e faccine stanno nel velo sopra la stanza, sulla testa di chi parla (uno per tipo alla volta)
  function bolla(U, f, nodo, tipo, durata) {
    [].slice.call(U.bolle.childNodes).forEach(function (b) { if (b._f === f && b._tipo === tipo) U.bolle.removeChild(b); });
    nodo._f = f; nodo._tipo = tipo;
    U.bolle.appendChild(nodo); mettiBolla(U, nodo);
    f.nodo.classList.add("parla");   // (intanto "si ricollega…" si nasconde)
    setTimeout(function () {
      if (nodo.parentNode) nodo.parentNode.removeChild(nodo);
      if (![].some.call(U.bolle.childNodes, function (b) { return b._f === f; })) f.nodo.classList.remove("parla");
    }, durata);
  }
  // al suo posto: sopra la testa; il fumetto che uscirebbe dai lati si sposta dentro, con la punta sempre su chi parla
  function mettiBolla(U, b) {
    var p = b._f && b._f.nodo._pos; if (!p) return;
    var W = U.stanza.clientWidth, H = U.stanza.clientHeight, testa = p.b + p.w * 1.32, x = p.x;
    b.style.setProperty("--w", p.w.toFixed(1) + "px");   // (più grande sopra un avatar grande)
    if (b._tipo === "faccia") { b.style.left = x.toFixed(1) + "px"; b.style.bottom = (testa - p.w * 0.42).toFixed(1) + "px"; return; }
    var mezzo = b.offsetWidth / 2, alto = b.offsetHeight, giu = Math.max(0, Math.min(testa - 2, H - alto - 6));
    if (W && mezzo) x = Math.max(mezzo + 6, Math.min(W - mezzo - 6, x));
    // due fumetti insieme (arrivano in due) non si coprono: questo si mette sopra o sotto all'altro
    [].forEach.call(U.bolle.childNodes, function (o) {
      if (o === b || o._tipo !== "fumetto" || !o._x) return;
      var ox = o._x, ob = o._b, oh = o.offsetHeight, om = o.offsetWidth / 2;
      if (Math.abs(ox - x) < om + mezzo + 4 && giu < ob + oh + 4 && ob < giu + alto + 4) giu = ob + oh + 6 + alto <= H - 4 ? ob + oh + 6 : Math.max(0, ob - alto - 6);
    });
    b._x = x; b._b = giu;
    b.style.left = x.toFixed(1) + "px";
    b.style.bottom = giu.toFixed(1) + "px";
    b.style.setProperty("--coda", (p.x - x).toFixed(1) + "px");
  }
  // tocco: l'avatar salta (il mio saluta). L'host, tenendo premuto sull'avatar di un amico: "🚪 Fai uscire"
  function toccoAvatar(U, f) {
    var t = null, x0 = 0, y0 = 0, lungo = false;
    function annulla() { if (t) { clearTimeout(t); t = null; } }
    f.nodo.addEventListener("pointerdown", function (e) {
      lungo = false; annulla();
      var p = f.p || {};
      if (!U.host || p.tu || p.host || p.bot || f.nodo.classList.contains("va")) return;
      x0 = e.clientX; y0 = e.clientY;
      t = setTimeout(function () { t = null; lungo = true; menuAvatar(U, f); }, 550);
    });
    f.nodo.addEventListener("pointermove", function (e) { if (t && Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) > 14) annulla(); });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { f.nodo.addEventListener(ev, annulla); });
    f.nodo.addEventListener("click", function () {
      if (lungo) { lungo = false; return; }
      // il MIO avatar: si aprono le reazioni a ventaglio intorno alla testa (7 nov 2026); senza la stanza collegata saluta come prima
      if (f.tu && U.faccine && !U.faccine.hidden) {
        var r = f.nodo.getBoundingClientRect();
        ventaglio(U.faccine, { x: r.left + r.width / 2, y: r.top + r.height * 0.13 });
        return;
      }
      animaAv(f.nodo, f.tu ? "saluta" : "salta");
    });
  }
  function menuAvatar(U, f) {
    chiudiMenuAvatar();
    var SV = U.rete && U.rete._sv; if (!SV || !SV.host || !document.body.contains(f.nodo)) return;
    var id = idDiFigura(SV, f.k, f.p); if (!id || id === "host") return;
    var nome = (f.p && f.p.nome) || "", W = U.stanza.clientWidth || 1, H = U.stanza.clientHeight || 1, p = f.nodo._pos || { x: W / 2, b: 0, w: 0 };
    var cx = p.x, lato = cx < W * 0.3 ? " sx" : (cx > W * 0.7 ? " dx" : "");
    var m = el("div", { class: "sl-menu" + lato, role: "dialog", "aria-label": nome }, [
      el("button", { class: "sl-menu-fuori", type: "button", text: "🚪 Fai uscire " + nome, onclick: function () { chiudiMenuAvatar(); svFuori(SV, id, nome); } }),
      el("button", { class: "sl-menu-x", type: "button", "aria-label": "Annulla", text: "✕", onclick: chiudiMenuAvatar })
    ]);
    m.style.left = Math.round(lato === " sx" ? Math.max(6, cx - 34) : (lato === " dx" ? Math.min(W - 6, cx + 34) : cx)) + "px";
    m.style.top = Math.round(Math.max(52, H - (p.b + p.w * 1.32) + 14)) + "px";   // (sulla testa)
    U.stanza.appendChild(m);
    MENU_AV = { nodo: m, f: f };
    setTimeout(function () { if (MENU_AV && MENU_AV.nodo === m) document.addEventListener("pointerdown", fuoriMenu, true); }, 0);
  }
  function fuoriMenu(e) { if (MENU_AV && !MENU_AV.nodo.contains(e.target)) chiudiMenuAvatar(); }
  function chiudiMenuAvatar() {
    document.removeEventListener("pointerdown", fuoriMenu, true);
    if (MENU_AV && MENU_AV.nodo.parentNode) MENU_AV.nodo.parentNode.removeChild(MENU_AV.nodo);
    MENU_AV = null;
  }

  // ---- 3-2-1-VIA! ----
  // "Comincia": il 3-2-1 su tutti i telefoni (ognuno conta da sé da quando gli arriva), poi parte il gioco.
  // Senza amici (o nella Sala, dove "Comincia" sceglie il gioco) si parte subito
  function partenza(U, auto) {
    if (!U || U.via || !U.goOk || !U.o || !U.o.onComincia) return;
    var SV = U.rete && U.rete._sv;
    var amici = (U.o.giocatori || []).filter(function (p) { return !p.bot && !p.tu; }).length;
    chiudiMenuAvatar();
    if (!SV || !SV.h || U.gid === "__sala" || !amici) return U.o.onComincia();
    U.via = true; tastoGo(U); applicaViva(U);
    try { SV.h.inviaVeloce({ t: "__via", ms: VIA_MS }); } catch (e) {}
    mostraVia(VIA_MS, U, true, function () {
      U.via = false;
      if (SL.ultimo !== U || !document.body.contains(U.s)) return;   // intanto si è usciti
      if (!U.goOk) return annullaVia(U);
      tastoGo(U);
      U.o.onComincia();
    });
  }
  // il tasto "Comincia" dell'host: acceso se il gioco può partire e non sta già partendo
  function tastoGo(U) {
    if (!U.go) return;
    if (U.via && !U.goOk) return annullaVia(U);   // qualcuno è uscito durante il 3-2-1 e non si può più partire
    // in un gioco della Sala, se manca qualcuno ma si può già partire: "▶ Comincia senza Marco" ("senza 2" se sono di più)
    // (dopo la Rivincita anche chi della partita prima non è tornato: "Comincia senza Luca")
    var att = (U.attesi || []).slice();
    (U.rivManca || []).forEach(function (a) { if (!att.some(function (x) { return x.id === a.id || stessoNome(x.nome, a.nome); })) att.push(a); });
    var senza = att.length ? "▶ Comincia senza " + (att.length === 1 ? att[0].nome : att.length) : "";
    var dis = !U.goOk || !!U.via, tx = U.via ? "🚀 Si parte…" : (senza && U.goOk ? senza : ((U.o && U.o.testoComincia) || "Comincia ▶"));
    if (dis) U.go.setAttribute("disabled", "disabled"); else U.go.removeAttribute("disabled");
    if (U.go.textContent !== tx) U.go.textContent = tx;
  }
  // "Marco", "Marco e Luca", "Marco e altri 2"
  function nomiAttesi(att) {
    if (att.length === 1) return att[0].nome;
    if (att.length === 2) return att[0].nome + " e " + att[1].nome;
    return att[0].nome + " e altri " + (att.length - 1);
  }
  function annullaVia(U) {
    var SV = U.rete && U.rete._sv;
    U.via = false; togliVia();
    try { if (SV && SV.h) SV.h.inviaVeloce({ t: "__via", stop: 1 }); } catch (e) {}
    tastoGo(U); applicaViva(U);
    pillola("saletta", "✋ Manca qualcuno: non si parte", "grigia", 2600);
  }
  // i numeri grandi in mezzo allo schermo (non si toccano: sotto resta tutto com'è). fine() al "Via!"
  function mostraVia(ms, U, host, fine) {
    togliVia();
    // in alto il gioco che parte; i numeri come i semafori di una gara: 3 rosso, 2 arancio, 1 giallo, Via! verde
    var g = U && giocoDa(U.gid);
    var num = el("div", { class: "sl-via-num" }), anello = el("div", { class: "sl-via-anello" });
    var tit = g ? el("div", { class: "sl-via-tit" }, [ el("span", { text: g.icona || "🎲" }), document.createTextNode(" " + g.nome) ]) : null;
    var nodo = el("div", { class: "sl-via", role: "status", "aria-live": "assertive" }, [ anello, num, tit ]);
    document.body.appendChild(nodo);
    var V = VIA = { nodo: nodo, U: U, host: !!host, timer: [] }, passo = ms / 3;
    if (host) MUSICA_SL.ferma();   // la musichetta lascia spazio al conto
    function viva() { return VIA === V; }
    function persa() { return U && (SL.ultimo !== U || !document.body.contains(U.s)); }
    function mostraN(tx, cls) { num.textContent = tx; num.className = "sl-via-num " + cls; void num.offsetWidth; num.classList.add("su"); anello.className = "sl-via-anello " + cls; void anello.offsetWidth; anello.classList.add("su"); }
    function via() {
      if (!viva()) return;
      mostraN("Via!", "via"); suonoSl("via"); scintille(nodo);
      V.timer.push(setTimeout(function () { if (!viva()) return; nodo.classList.add("fine"); V.timer.push(setTimeout(function () { if (viva()) togliVia(); }, 380)); }, 560));
      if (fine) fine();
    }
    [3, 2, 1].forEach(function (n, i) {
      V.timer.push(setTimeout(function () {
        if (!viva()) return;
        // la saletta non c'è più: chi fa partire (host) si ferma; chi aspetta (la partita è già cominciata) salta al "Via!"
        if (persa()) return host ? togliVia() : via();
        mostraN(String(n), "n" + n); suonoSl("bip" + n);
      }, i * passo));
    });
    V.timer.push(setTimeout(function () { if (!viva()) return; if (host && persa()) return togliVia(); via(); }, ms));
  }
  function togliVia() { if (!VIA) return; VIA.timer.forEach(clearTimeout); if (VIA.nodo.parentNode) VIA.nodo.parentNode.removeChild(VIA.nodo); VIA = null; }
  function scintille(nodo) {
    ["✨", "🎉", "⭐", "✨", "🎊", "⭐", "✨", "🎉", "⭐", "✨"].forEach(function (s, i, tutte) {
      var a = (i / tutte.length) * Math.PI * 2 + Math.random() * 0.5, r = 110 + Math.random() * 80;
      var x = el("span", { class: "sl-scintilla", text: s, "aria-hidden": "true" });
      x.style.setProperty("--dx", Math.round(Math.cos(a) * r) + "px"); x.style.setProperty("--dy", Math.round(Math.sin(a) * r) + "px");
      x.style.setProperty("--r", Math.round(Math.random() * 140 - 70) + "deg");
      nodo.appendChild(x);
    });
  }
  // ⚙️ (host): "Parti da solo quando tutti sono pronti" (la scelta resta su questo telefono)
  function autoParti() { try { return localStorage.getItem("sg-sl-parti") === "1"; } catch (e) { return false; } }
  function opzioniSaletta() {
    var chk = el("input", { type: "checkbox", "aria-label": "Parti da solo quando tutti sono pronti" }); chk.checked = autoParti();
    chk.addEventListener("change", function () { try { localStorage.setItem("sg-sl-parti", chk.checked ? "1" : "0"); } catch (e) {} });
    return el("div", { class: "sl-viva-opz" }, [
      el("label", { class: "sl-interruttore" }, [ el("span", { text: "⚡ Parti da solo quando tutti sono pronti" }), chk ]),
      el("small", { text: "Per far uscire qualcuno, tieni premuto sul suo avatar." })
    ]);
  }

  // =========================================================
  //  FINE PARTITA UGUALE PER TUTTI (p2-f) — t.tastiFine(piede, { host, nuova, esci }): il core mette i tasti nel piede.
  //  Sala, host: "↻ Rivincita" (con "· 👍 3" appena qualcuno ci sta) e "🎮 Cambia gioco" (porta tutti nella Sala).
  //  Sala, chi entra: "👍 Ci sto!" e "🏠 Torna in Sala". Fuori dalla Sala: host "↻ Nuova partita (stessi amici)" e "🏠 Esci",
  //  chi entra "👍 Ci sto!" e "🏠 Esci". Host solo del gioco (duello): "↻ Rivincita" della sua stanza e "🏠 Torna in Sala".
  //  false = il gioco mette i suoi tasti di sempre: sullo stesso telefono, col bot, torneo a eliminazione, chi guarda
  //  (tranne l'host della Sala). La Rivincita riporta tutti nella saletta e, se ci sono tutti, parte da sola col 3-2-1.
  //  Messaggi (i giochi non li vedono): chi entra → host __cisto { si }; nel __sl c: [chi ci sta], g: il giro della saletta,
  //  fine: 1 (l'host chiude la stanza dalla classifica: chi entra non legge "Collegamento perso").
  // =========================================================
  // la stanza di questa partita, vista da qui (host: la mia; chi entra: quella dell'amico; chi guarda soltanto: null)
  function svPartita(P, host) {
    if (host) return cuore.reteXp && cuore.reteXp._P === P && cuore.reteXp._sv ? cuore.reteXp._sv : null;
    return cuore.reteOsp && cuore.reteOsp.P === P && !cuore.reteOsp.guarda && cuore.reteOsp.h && cuore.reteOsp.h._sv ? cuore.reteOsp.h._sv : null;
  }
  // K = { P: la partita, tavolo, ctx (facoltativo: quello della Sala, se diverso da P.salaCtx) }
  function tastiFineCore(piede, o, K) {
    o = o || {};
    var P = K.P, tav = K.tavolo || (P && P.tavolo), ctx = K.ctx || (P && P.salaCtx) || null;
    if (!piede || !P || !P.viva()) return false;
    if (ctx && ctx.tabellone) return false;   // torneo a eliminazione: il tabellone ha i suoi tasti
    // "👑 Chi vince resta": la fine di una sfida è uguale per tutti, anche per chi guarda (6-7): chi resta, chi tocca adesso,
    // "Prossima sfida tra 8…"; l'host della Sala "⏹ Basta così" e "🎮 Cambia gioco"
    if (ctx) {
      var SVr = svPartita(P, !!o.host) || svPartita(P, !o.host), stR = (tav && tav.linkParams && tav.linkParams.stanza) || ctx.stanza || ctx.duello || (SVr && SVr.codice) || null;
      if (cuore.restaFineDi(stR)) return cuore.bloccoResta(piede, stR, !!(cuore.sala && cuore.sala.resta), SVr ? { SV: SVr, salaHost: !!(cuore.sala && cuore.sala.ctx === ctx), host: !!SVr.host } : null);
    }
    var salaHost = !!(cuore.sala && ctx && cuore.sala.ctx === ctx);   // io comando la Sala (non solo la stanza del gioco: 2-15)
    if (tav && tav.linkParams && tav.linkParams.guarda && !salaHost) return false;   // chi guarda la partita di altri
    var host = !!o.host, SV = svPartita(P, host);
    if (!SV && !(salaHost && host)) return false;   // (sullo stesso telefono, col bot)
    // (o.rigioca: la partita è finita col t.fine del gioco, la Rivincita della Sala rilancia il gioco)
    var esci = o.esci || (tav && tav.esci) || null, nuova = o.rigioca ? null : (o.nuova || (tav && tav.onRivincita) || null), rig = null;
    var box = el("div", { class: "fine-tasti" }), primo, secondo, base;
    if (host) {
      if (salaHost) { rig = ctx.rigioca || null; if (!nuova && !rig) return false; }
      else if (!nuova) return false;   // (il gioco non sa rifare la partita nella stessa stanza: i suoi tasti di sempre)
      base = salaHost || ctx ? "↻ Rivincita" : "↻ Nuova partita (stessi amici)";
      primo = el("button", { class: "btn btn-primario ft-primo", type: "button", text: base, onclick: function () {
        if (primo.disabled) return;
        primo.disabled = true;   // (un tocco solo: la saletta arriva subito; se il gioco non può, dopo un attimo si riaccende)
        setTimeout(function () { primo.disabled = false; }, 1500);
        rivincitaCore(SV, nuova, rig);
      } });
      if (salaHost) secondo = el("button", { class: "btn btn-fantasma ft-secondo", type: "button", text: "🎮 Cambia gioco", onclick: function () { cuore.salaCambiaGioco(); } });
      else secondo = el("button", { class: "btn btn-fantasma ft-secondo", type: "button", text: ctx ? "🏠 Torna in Sala" : "🏠 Esci", onclick: function () {
        if (ctx) { if (esci) esci(); return; }
        fineApposta(SV);   // fuori dalla Sala: chi è sulla classifica legge "Paky ha chiuso la stanza" (non "Collegamento perso")
        if (o.esci) return o.esci();
        try { if (SV && SV.h) SV.h.chiudi(); } catch (e) {}   // (l'uscita del core: la stanza si chiude, gli amici non restano dentro)
        if (tav) tav.esci();
      } });
    } else {
      if (!SV) return false;
      // nella Sala chi non era tra i scelti ("Chi gioca?") ha solo guardato: alla rivincita giocano gli stessi, niente «Ci sto»
      if (ctx && cuore.salaG && cuore.salaG.sc && cuore.salaG.sc.stanza === SV.codice && cuore.salaG.sc.ids.indexOf(mioIdSV(SV)) < 0) {
        box.appendChild(el("button", { class: "btn btn-fantasma ft-secondo", type: "button", text: "🏠 Torna in Sala", onclick: function () { if (esci) esci(); } }));
        piede.appendChild(box);
        FINE = null;
        return true;
      }
      primo = el("button", { class: "btn btn-verde ft-primo ft-cisto", type: "button", "aria-pressed": "false", onclick: function () {
        if (SV.chiusaFine) return;
        var ora = !cistoMio(SV);
        SV.cistoMio = ora; SV.cistoT = Date.now();
        try { SV.h.invia({ t: "__cisto", si: ora }); } catch (e) {}   // (con la rete giù parte quando torna)
        aggiornaFine(SV);
      } });
      // (chi comanda la Sala ma non la stanza del gioco, come Giulia dopo il subentro con Parola d'ordine: «🎮 Cambia gioco»)
      if (salaHost) secondo = el("button", { class: "btn btn-fantasma ft-secondo", type: "button", text: "🎮 Cambia gioco", onclick: function () { cuore.salaCambiaGioco(); } });
      else secondo = el("button", { class: "btn btn-fantasma ft-secondo", type: "button", text: ctx ? "🏠 Torna in Sala" : "🏠 Esci", onclick: function () { if (esci) esci(); } });
    }
    // "👥 Avete giocato con: Luca ➕" sopra la riga dei tasti (solo col profilo online; se la classifica non è ancora
    // arrivata, si riempie dopo)
    cuore.FINE_REC = null;
    if (mioUidOnline() && window.SGCompagnia && SGCompagnia.rigaFine) {
      var rec = el("div", { class: "ft-rec", hidden: "hidden" });
      piede.appendChild(rec);
      cuore.FINE_REC = { box: rec, P: P };
      if (P.recPersone) riempiRigaRec(rec, P.recPersone);
    }
    if (ctx) cuore.rigaPuntiFine(box, SV, salaHost, host);   // (Classifica della serata: sopra i tasti "🏆 Serata: Paky 1° · Luca 2° · …")
    box.appendChild(primo);
    // un gioco a due nella Sala con altri che guardavano: "⚔️ Altra sfida" (si sceglie chi gioca adesso), tre tasti in fila
    if (host && salaHost && P.g && cuore.aDue(P.g) && cuore.sala.membri.length > 2) {
      box.classList.add("tre");
      var gS = P.g;
      box.appendChild(el("button", { class: "btn btn-fantasma ft-secondo ft-sfida", type: "button", text: "⚔️ Altra sfida", onclick: function () { cuore.salaAltraSfida(gS); } }));
    }
    box.appendChild(secondo);
    piede.appendChild(box);
    FINE = SV ? { nodo: primo, SV: SV, host: host, base: base } : null;
    if (SV) aggiornaFine(SV);
    return true;
  }
  function cistoMio(SV) { return SV.cistoMio != null ? SV.cistoMio : !!(SV.cisto || {})[mioIdSV(SV)]; }
  // il tasto sullo schermo segue chi ci sta (si cambia solo la scritta: niente ridisegno)
  function aggiornaFine(SV) {
    var F = FINE; if (!F || F.SV !== SV || !F.nodo) return;
    if (F.host) {
      var n = Object.keys(SV.cisto || {}).filter(function (id) { return SV.dentro[id]; }).length;
      var tx = F.base + (n ? " · 👍 " + n : "");
      if (F.nodo.textContent !== tx) F.nodo.textContent = tx;
      return;
    }
    if (SV.chiusaFine) { F.nodo.hidden = true; return; }   // la stanza non c'è più: resta "🏠 Esci"
    var si = cistoMio(SV), t2 = si ? "✅ Ci stai!" : "👍 Ci sto!";
    if (F.nodo.textContent !== t2) F.nodo.textContent = t2;
    F.nodo.classList.toggle("fatto", si); F.nodo.setAttribute("aria-pressed", si ? "true" : "false");
  }
  // "↻ Rivincita": mi segno chi c'era nella saletta di prima (la saletta nuova parte da sola col 3-2-1 se ci sono tutti,
  // entro 10 secondi e senza nessuno grigio; se qualcuno è uscito no: resta "Comincia senza Luca"), poi il gioco rimette la
  // saletta nella stessa stanza (nuova) o, nella Sala, si rilancia lo stesso gioco con le stesse regole in una stanza nuova (rig)
  function rivincitaCore(SV, nuova, rig) {
    var attesi = [], nomi = {}, usciti = 0, F = cuore.sala && SV && cuore.sala.stanza === SV.codice ? (cuore.sala.fuori || {}) : {};
    if (SV) {
      attesi = (SV.idsSaletta || Object.keys(SV.dentro)).filter(function (id) { return id && id !== "host"; });
      attesi.forEach(function (id) { nomi[id] = SV.nomi[id] || ""; if (!SV.dentro[id] || SV.andati[id] || F[id]) usciti++; });
    }
    var pronti = {};
    if (SV) Object.keys(SV.cisto || {}).forEach(function (id) { if (SV.dentro[id]) pronti[id] = 1; });
    // (nella stessa stanza il codice è questo; nella Sala con la stanza nuova lo segna salaLancia)
    var R = RIV = { codice: nuova && SV ? SV.codice : null, attesi: attesi, nomi: nomi, quando: Date.now(), auto: !usciti && attesi.length > 0,
      pronti: pronti, daSala: !nuova, U: null };
    setTimeout(function () { if (RIV === R && R.auto) { R.auto = false; vivaOra(); } }, 10000);
    FINE = null;
    if (nuova) nuova();
    else if (rig) rig();
  }
  // l'host chiude apposta dalla classifica: prima lo dice a chi è nella stanza (poi il gioco chiude)
  function fineApposta(SV) {
    if (!SV || !SV.host || !SV.h) return;
    clearTimeout(SV.tSl); SV.tSl = null;
    try { SV.h.inviaVeloce(Object.assign(slDi(SV), { fine: 1 })); } catch (e) {}
  }

  // ---- I SUONI DELLA SALETTA (generati, niente file) e la musichetta, solo sul telefono dell'host ----
  // 🎵/🔇 vale per tutti e due (la scelta resta ricordata). Niente vibrazioni: quelle solo quando si tocca
  var SUONO_SL = { on: true };
  try { SUONO_SL.on = localStorage.getItem("sg-sl-suono") !== "off"; } catch (e) {}
  function suonoSaletta(on) {
    SUONO_SL.on = !!on;
    try { localStorage.setItem("sg-sl-suono", on ? "on" : "off"); } catch (e) {}
    vivaOra();
    if (on) { audioCtx(); musicaSaletta(); } else MUSICA_SL.ferma();
  }
  function suonoSl(tipo) {
    if (!SUONO_SL.on) return;
    var ctx = audioCtx(); if (!ctx || ctx.state !== "running") return;   // (prima del primo tocco il telefono non suona)
    try {
      var t0 = ctx.currentTime + 0.01;
      var tono = function (f, t, dur, vol, forma, f2) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = forma || "sine"; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur * 0.8);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + 0.03);
      };
      if (tipo === "pling") { tono(1318.5, t0, 0.25, 0.15); tono(1975.5, t0 + 0.07, 0.4, 0.12); tono(2637, t0 + 0.07, 0.22, 0.035); }   // chi arriva
      else if (tipo === "va") { tono(784, t0, 0.2, 0.06); tono(587.3, t0 + 0.1, 0.3, 0.05); }                                             // chi esce
      else if (tipo === "pop") tono(420, t0, 0.11, 0.1, "sine", 980);                                                                       // una faccina
      else if (tipo === "pronto") { tono(1046.5, t0, 0.22, 0.11); tono(1568, t0 + 0.07, 0.32, 0.09); }
      else if (/^bip/.test(tipo)) tono({ bip3: 587.3, bip2: 659.3, bip1: 784 }[tipo] || 784, t0, 0.2, 0.13, "triangle");                    // 3, 2, 1 (sempre più acuto)
      else if (tipo === "via") { [1046.5, 1318.5, 1568, 2093].forEach(function (f, i) { tono(f, t0 + i * 0.035, 0.6, 0.08, "triangle"); }); tono(523.25, t0, 0.45, 0.07, "sine", 1046.5); }
    } catch (e) {}
  }
  function musicaSaletta() {
    var U = SL.ultimo; if (!(SUONO_SL.on && U && U.host && !U.via && document.body.contains(U.s))) return;
    // il telefono non suona finché non si tocca lo schermo (e lo schermo spento lo ferma): la musichetta parte da sola appena si può
    var ctx = audioCtx();
    if (ctx && !ctx._salettaAscolta && ctx.addEventListener) { ctx._salettaAscolta = true; try { ctx.addEventListener("statechange", function () { if (ctx.state === "running") musicaSaletta(); }); } catch (e) {} }
    MUSICA_SL.avvia();
  }
  // la musichetta: un giro allegro da sala d'attesa (Do · La- · Re- · Sol · Mi- · La · Re- · Sol), marimba, basso,
  // accordi morbidi e spazzole. Si ferma da sola quando la saletta non c'è più (o lo schermo si spegne)
  var MUSICA_SL = (function () {
    var ctx = null, master = null, timer = null, nextT = 0, step = 0, rumore = null;
    var S = 60 / 112 / 4;   // un sedicesimo a 112 battiti al minuto
    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    var GIRO = [
      { b: 36, a: [60, 64, 67, 71], m: [76, null, 79, 76, 72, null, 74, 76] },
      { b: 33, a: [57, 60, 64, 67], m: [77, null, 76, 72, 69, null, 72, null] },
      { b: 38, a: [60, 62, 65, 69], m: [74, null, 77, 74, 69, null, 72, 74] },
      { b: 31, a: [59, 62, 65, 67], m: [79, 77, 76, 74, 71, null, 74, null] },
      { b: 40, a: [59, 62, 64, 67], m: [76, null, 79, 83, 79, null, 76, null] },
      { b: 33, a: [61, 64, 67, 69], m: [73, null, 76, 79, 81, null, 79, 76] },
      { b: 38, a: [60, 62, 65, 69], m: [77, null, 74, 77, 81, null, 77, 74] },
      { b: 31, a: [59, 62, 65, 67], m: [79, null, 74, 71, 74, 77, 79, null] }
    ];
    function nota(f, t0, dur, forma, vol, att) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = forma; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + (att || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function marimba(f, t0) { nota(f, t0, 0.42, "sine", 0.16, 0.003); nota(f * 4, t0, 0.07, "sine", 0.025, 0.002); }
    function spazzola(t0, vol, dur) {
      if (!rumore) { rumore = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.12), ctx.sampleRate); var d = rumore.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      var s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = rumore; fl.type = "bandpass"; fl.frequency.value = 6200; fl.Q.value = 0.7;
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(fl); fl.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.02);
    }
    function cassa(t0) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(120, t0); o.frequency.exponentialRampToValueAtTime(48, t0 + 0.1);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.32, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 0.18);
    }
    function passo(t0) {
      var i = step % 16, battuta = Math.floor(step / 16), c = GIRO[battuta % 8], conMelodia = battuta >= 4;
      if (i === 0 || i === 8) cassa(t0);
      if (i % 2 === 0) spazzola(t0, i % 4 === 2 ? 0.05 : 0.025, 0.05);
      if (i === 4 || i === 12) spazzola(t0, 0.07, 0.11);
      if (i === 0) nota(hz(c.b), t0, S * 5, "triangle", 0.3);                     // il basso: radice, quinta, ottava
      if (i === 6) nota(hz(c.b + 7), t0, S * 2, "triangle", 0.22);
      if (i === 8) nota(hz(c.b + 12), t0, S * 3, "triangle", 0.24);
      if (i === 14) nota(hz(c.b + 7), t0, S * 2, "triangle", 0.18);
      if (i === 2 || i === 10) c.a.forEach(function (m) { nota(hz(m), t0, S * 2.4, "sine", 0.045, 0.012); nota(hz(m) * 1.003, t0, S * 2.4, "triangle", 0.02, 0.012); });   // accordi morbidi
      if (conMelodia && i % 2 === 0) { var mm = c.m[i / 2]; if (mm) marimba(hz(mm), t0); }
      step++;
    }
    function viva() { var U = SL.ultimo; return SUONO_SL.on && U && U.host && !U.via && document.body.contains(U.s) && !document.hidden; }
    function loop() {
      if (!ctx) return;
      if (!viva()) return ferma();
      if (nextT < ctx.currentTime - 0.05) nextT = ctx.currentTime + 0.05;   // il telefono si è inceppato un attimo: le note perse si saltano (niente raffica)
      while (nextT < ctx.currentTime + 0.3) { passo(nextT); nextT += S; }
    }
    function ferma() {
      if (timer) { clearInterval(timer); timer = null; }
      if (ctx && master) { try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(Math.max(0.0001, master.gain.value || 0.0001), ctx.currentTime); master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5); } catch (e) {} }
    }
    return {
      avvia: function () {
        ctx = audioCtx(); if (!ctx || timer || ctx.state !== "running") return;   // (prima del primo tocco no: ripartirebbe tutto insieme)
        try {
          if (!master) {
            master = ctx.createGain(); var fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = 4800;
            var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 8;
            master.connect(fl); fl.connect(comp); comp.connect(ctx.destination);
          }
          master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0.0001, ctx.currentTime);
          master.gain.exponentialRampToValueAtTime(0.34, ctx.currentTime + 1.5);
          nextT = ctx.currentTime + 0.1; step = 0; loop(); timer = setInterval(loop, 100);
        } catch (e) { timer = null; }
      },
      ferma: ferma
    };
  })();
  // tornando nell'app la musichetta riparte (era ferma con lo schermo spento)
  document.addEventListener("visibilitychange", function () { if (!document.hidden) musicaSaletta(); });

  // ---- 🎲 NOMI BUFFI per chi entra senza profilo ("Tartaruga Veloce"): massimo 16 lettere, come i nomi ----
  var NOMI_BUFFI = {
    m: ["Panda", "Gufo", "Pinguino", "Koala", "Riccio", "Criceto", "Bradipo", "Canguro", "Delfino", "Polpo", "Leone", "Gatto", "Orso", "Lupo", "Tucano", "Pavone", "Procione", "Coniglio", "Granchio", "Cammello", "Fagiano", "Pellicano"],
    f: ["Tartaruga", "Giraffa", "Volpe", "Lontra", "Zebra", "Foca", "Papera", "Gallina", "Lumaca", "Formica", "Farfalla", "Balena", "Capra", "Mucca", "Rana", "Medusa", "Cicogna", "Pecora"],
    a: [["Veloce", "Veloce"], ["Ballerino", "Ballerina"], ["Distratto", "Distratta"], ["Elegante", "Elegante"], ["Coraggioso", "Coraggiosa"], ["Furbo", "Furba"], ["Felice", "Felice"],
        ["Spaziale", "Spaziale"], ["Volante", "Volante"], ["Saggio", "Saggia"], ["Goloso", "Golosa"], ["Ninja", "Ninja"], ["Atomico", "Atomica"], ["Magico", "Magica"], ["Allegro", "Allegra"],
        ["Timido", "Timida"], ["Fortunato", "Fortunata"], ["Gigante", "Gigante"], ["Turbo", "Turbo"], ["Stellare", "Stellare"], ["Canterino", "Canterina"], ["Elettrico", "Elettrica"],
        ["Rapido", "Rapida"], ["Tranquillo", "Tranquilla"], ["Misterioso", "Misteriosa"], ["Dormiglione", "Dormigliona"], ["Pasticcione", "Pasticciona"]]
  };
  function nomeBuffo(prima) {
    for (var i = 0; i < 40; i++) {
      var fem = Math.random() < 0.45, lista = fem ? NOMI_BUFFI.f : NOMI_BUFFI.m;
      var n = lista[Math.floor(Math.random() * lista.length)] + " " + NOMI_BUFFI.a[Math.floor(Math.random() * NOMI_BUFFI.a.length)][fem ? 1 : 0];
      if (n.length <= 16 && n !== prima) return n;
    }
    return "Panda Veloce";
  }
  // la casella del nome (giochi e Sala, senza profilo): accanto c'è il 🎲; se è vuota ci metto il nome dell'ultima volta.
  // anteprima: dove far vedere l'avatar che avrai con quel nome (l'avatar nasce dal nome: col 🎲 cambiano tutti e due)
  function dadoNome(input, anteprima) {
    if (!input || input._dado || !input.parentNode) return;
    input._dado = true;
    var box = el("div", { class: "sl-nome-campo" }), tAv = null;
    input.parentNode.insertBefore(box, input); box.appendChild(input);
    function avatar(salta) {
      clearTimeout(tAv); if (!anteprima || !window.SGOmino) return;
      var n = (input.value || "").trim().slice(0, 16);
      anteprima.innerHTML = SGOmino.svg(SGOmino.casuale(n || "Amico"));
      anteprima.classList.toggle("vuota", !n);
      if (salta) rianima(anteprima, "salta");
    }
    var b = el("button", { class: "sl-dado", type: "button", "aria-label": "Un nome buffo a caso", text: "🎲", onclick: function () {
      input.value = nomeBuffo(input.value);
      try { input.dispatchEvent(new Event("input", { bubbles: true })); } catch (e) {}
      rianima(b, "gira"); avatar(true);
    } });
    box.appendChild(b);
    if (!input.value) { var u = ""; try { u = localStorage.getItem("sg-nome-ospite") || ""; } catch (e) {} if (u) input.value = u; }
    if (anteprima) { input.addEventListener("input", function () { clearTimeout(tAv); tAv = setTimeout(function () { avatar(false); }, 300); }); avatar(false); }
  }
  // chi apre il link senza profilo: la schermata del nome del gioco diventa un benvenuto (il gioco e la stanza in alto,
  // l'avatar che avrà, "Come ti chiami?" e il 🎲). I giochi non cambiano: la riconosco dalla casella del nome
  function dadoNelleSchermate(s, g, codice) {
    if (!s || !s.querySelectorAll || profiloAttivo()) return;
    [].forEach.call(s.querySelectorAll("input.link-campo"), function (i) {
      if (!(/nome/i.test(i.getAttribute("placeholder") || "") && +(i.getAttribute("maxlength") || 99) <= 20) || i._dado) return;
      var anteprima = null;
      if (g && i.parentNode && !s.querySelector(".sl-benvenuto")) {
        if (s.classList.contains("senza-testa")) {   // (il titolo col nome del gioco l'aveva tolto t.schermata: qui serve)
          var testa = s.querySelector(".testa"), tit = testa && testa.lastElementChild;
          if (tit && !tit.querySelector("h1")) {
            s.classList.remove("senza-testa");
            testa.insertBefore(el("span", { text: g.icona || "🎲", style: "font-size:1.8rem" }), tit);
            tit.appendChild(el("h1", { text: g.nome })); if (codice) tit.appendChild(el("p", { class: "sotto", text: "Stanza " + String(codice).toUpperCase() }));
          }
        }
        anteprima = el("div", { class: "sl-anteprima", "aria-hidden": "true" });
        i.parentNode.insertBefore(el("div", { class: "sl-benvenuto" }, [
          el("b", { class: "sl-benv-tit", text: "Ti aspettano per giocare! 🎉" }), anteprima,
          el("span", { class: "sl-benv-sotto", text: "Come ti chiami? Tocca 🎲 per un nome buffo: cambia anche il tuo avatar." })
        ]), i);
      }
      dadoNome(i, anteprima);
    });
  }
  // porta d'ingresso a un gioco dalla home: profilo → come giocate → (amici) → impostazioni
  function apriGioco(g) {
    if (!profiloAttivo()) return cuore.schermataAccesso(function () { apriGioco(g); });
    cuore.precarica(g);   // (📦 il gioco comincia ad arrivare già adesso: intanto si sceglie come giocare)
    if (modiDi(g).length > 1 || giocoOnline(g)) return schermataModo(g);   // online c'è sempre la scelta: apro io la stanza o entro con un codice
    var solo = modiDi(g)[0];
    if (solo && !solo.amici) return schermataPreGioco(g, { modo: solo.modo });
    if (!solo && (g.giocatoriMax || 10) <= 1) return schermataPreGioco(g);   // si gioca da soli (es. contro il computer): niente amici da aggiungere
    schermataSala(g, solo ? { modo: solo.modo } : null);
  }


  // ---- al cuore: quello di questo pezzo che usano il cuore e gli altri pezzi ----
  cuore.aggiornaFine = aggiornaFine; cuore.aggiornaSaletta = aggiornaSaletta; cuore.apriGioco = apriGioco; cuore.condividiLink = condividiLink;
  cuore.contoVia = contoVia; cuore.dadoNelleSchermate = dadoNelleSchermate; cuore.dadoNome = dadoNome; cuore.fermaPubblico = fermaPubblico;
  cuore.fuoriDallaStanza = fuoriDallaStanza; cuore.haRegole = haRegole; cuore.insieme = insieme; cuore.mioIdSV = mioIdSV;
  cuore.mostraFaccina = mostraFaccina; cuore.nuovoSV = nuovoSV; cuore.saletta = saletta; cuore.senzaTuFalso = senzaTuFalso; cuore.svAddio = svAddio;
  cuore.svArrivato = svArrivato; cuore.svDaOspite = svDaOspite; cuore.svGuardo = svGuardo; cuore.svPartita = svPartita;
  cuore.svRiassunto = svRiassunto; cuore.svRifiuta = svRifiuta; cuore.tastiFineCore = tastiFineCore; cuore.titoloSaletta = titoloSaletta;
  cuore.togliNodo = togliNodo; cuore.togliVia = togliVia; cuore.vassoioFaccine = vassoioFaccine; cuore.vivaOra = vivaOra;
  Object.defineProperty(cuore, "FACCINE_SL", { get: function () { return FACCINE_SL; }, configurable: true });
  Object.defineProperty(cuore, "FINE", { get: function () { return FINE; }, set: function (v) { FINE = v; }, configurable: true });
  Object.defineProperty(cuore, "RIV", { get: function () { return RIV; }, set: function (v) { RIV = v; }, configurable: true });
  Object.defineProperty(cuore, "SL", { get: function () { return SL; }, configurable: true });
  Object.defineProperty(cuore, "SVH", { get: function () { return SVH; }, configurable: true });
})();
