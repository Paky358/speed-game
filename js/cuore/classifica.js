/* =========================================================
   PEZZO DEL CUORE — 📊 AMICI, CLASSIFICA E STATISTICHE
   Gli amici (richieste, aggiungere, togliere), la classifica dei trofei tra amici e i trofei
   di un amico, le pagine «Proposte» e «Segnala un problema», le statistiche di ogni gioco
   (partite, vinte, % di vittorie, tempo giocato) e la riga dei giocatori di un gioco.
   Pezzo del cuore (js/core.js): prende gli aiuti dal cuore all'inizio («dal cuore»)
   e in fondo gli lascia quello che usano gli altri («al cuore»). Vedi AGENTS.md.
   ========================================================= */
(function () {
  "use strict";
  var cuore = window.SGCuore;
  // ---- dal cuore: gli aiuti che questo pezzo usa (non cambiano mai, si prendono una volta) ----
  var giochi = cuore.giochi, el = cuore.el, svuota = cuore.svuota, chiediConferma = cuore.chiediConferma, schermata = cuore.schermata,
      mostra = cuore.mostra, tornaHome = cuore.tornaHome, schermataHome = cuore.schermataHome, CITTA_VISIBILE = cuore.CITTA_VISIBILE,
      cifre = cuore.cifre;

  // ---- Amici e classifica trofei ----
  // Gli amici si aggiungono scrivendo il loro nome del profilo. La classifica
  // mette in fila te e i tuoi amici, da chi ha più trofei a chi ne ha meno.
  var cacheAmici = null;   // ultime schede lette: la lista compare subito, poi si aggiorna
  function totTrofeiTutti() { return cuore.TROFEI.length + giochi.filter(function (g) { return cuore.trofeiDi(g.id).length; }).length; }
  function ordinaClassifica(l) {
    function v(x, k) { return (x.liv && x.liv[k]) || 0; }
    return l.slice().sort(function (a, b) {
      return (b.trofei || 0) - (a.trofei || 0) || v(b, "platino") - v(a, "platino") || v(b, "diamante") - v(a, "diamante") ||
        v(b, "oro") - v(a, "oro") || v(b, "argento") - v(a, "argento") || String(a.nome).localeCompare(String(b.nome));
    });
  }
  function faccina(sch, cls) {
    return el("span", { class: cls, html: sch.omino && window.SGOmino ? SGOmino.svg(sch.omino, { busto: true }) : "<span class='am-emo'>" + (sch.emoji || "🙂") + "</span>" });
  }
  function erroreAmici(e) {
    var c = e && e.code || "";
    if (c === "permission-denied") return "La lista amici non è ancora attiva sul server. Riprova tra poco.";
    if (c === "unavailable" || (e && e.message === "offline")) return "Nessuna connessione: riprova.";
    return "Qualcosa è andato storto, riprova.";
  }
  // richieste di amicizia (arrivate/inviate): lette all'apertura e ricordate
  var cacheRich = null, richLette = 0, errRich = null;
  function aggiornaRichieste(forza) {
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo() && SGNube.richieste)) return Promise.resolve(null);
    if (!forza && cacheRich && Date.now() - richLette < 30000) return Promise.resolve(cacheRich);
    richLette = Date.now();
    return SGNube.richieste().then(function (r) {
      cacheRich = r;
      // il pallino sul tasto Amici in home, senza ridisegnare la home
      var b = document.querySelector(".home-amici");
      if (b) { var p = b.querySelector(".pallino"); if (r.arrivate.length && !p) b.appendChild(el("span", { class: "pallino" })); if (!r.arrivate.length && p) b.removeChild(p); }
      return r;
    }).catch(function (e) { errRich = e; return cacheRich; });
  }
  // che rapporto ho con questo giocatore
  function rapporto(uid) {
    var prof = SGNube.profilo();
    if (prof && uid === prof.uid) return "io";
    if (SGNube.amici().indexOf(uid) >= 0) return "amico";
    if (cacheRich) {
      if (cacheRich.arrivate.some(function (r) { return r.da === uid; })) return "arrivata";
      if (cacheRich.inviate.some(function (r) { return r.a === uid; })) return "inviata";
    }
    return "nessuno";
  }
  // manda la richiesta (o accetta se lui l'aveva già mandata) e dice com'è andata
  function chiediA(sch, fatto) {
    return SGNube.chiediAmicizia(sch).then(function (esito) {
      return aggiornaRichieste(true).then(function () {
        if (fatto) fatto(esito === "amici" ? "✅ Tu e " + sch.nome + " ora siete amici!" : "📨 Richiesta mandata a " + sch.nome + ".");
      });
    });
  }
  function laMiaScheda(prof) {
    var io = { uid: prof.uid, nome: prof.nome, omino: prof.omino || null, emoji: prof.emoji, io: true, giochi: {} };
    var set = cuore.trofeiSbloccati(prof), liv = { platino: 0, diamante: 0, oro: 0, argento: 0, bronzo: 0 };
    io.trofei = 0;
    for (var k in set) { io.trofei++; if (liv[set[k].livello] != null) liv[set[k].livello]++; io.giochi[set[k].gioco] = (io.giochi[set[k].gioco] || 0) + 1; }
    io.liv = liv;
    return io;
  }

  function schermataAmici(scheda) {
    scheda = scheda || "generale";
    var prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    var s = schermata({ icona: "👥", titolo: "Classifica e amici", sotto: "Chi ha più trofei", indietro: tornaHome }); s._menu = "classifica";
    if (!prof) {
      s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Ti serve il profilo per entrare in classifica, aggiungere amici e confrontare i trofei." }));
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "👤 Crea / accedi al profilo", onclick: function () { cuore.schermataAccesso(function () { schermataAmici(scheda); }); } }));
      mostra(s); return;
    }
    cuore.controllaTrofei();   // la mia scheda pubblica è aggiornata prima di leggere le altre
    var io = laMiaScheda(prof), tot = totTrofeiTutti();
    var schede = el("div", { class: "am-schede" });
    var tabRich = null;
    [["generale", "🌍 Generale"], ["amici", "👥 Amici"], ["richieste", "📨 Richieste"]].forEach(function (x) {
      var b = el("button", { class: "am-tab" + (x[0] === scheda ? " attiva" : ""), onclick: function () { if (x[0] !== scheda) schermataAmici(x[0]); } }, [ el("span", { text: x[1] }) ]);
      if (x[0] === "richieste") tabRich = b;
      schede.appendChild(b);
    });
    function segnaRichieste() {
      var n = cacheRich ? cacheRich.arrivate.length : 0, p = tabRich.querySelector(".am-conta");
      if (n && !p) tabRich.appendChild(el("span", { class: "am-conta", text: "" + n }));
      else if (p) { if (n) p.textContent = "" + n; else tabRich.removeChild(p); }
    }
    segnaRichieste();
    s._contenuto.appendChild(schede);
    var corpo = el("div", { class: "am-corpo" });
    s._contenuto.appendChild(corpo);
    function ancoraQui() { return !!s.parentNode; }
    function carica(testo) { corpo.appendChild(el("p", { class: "modulo-nota am-carica", text: testo })); }
    function errore(e) { var c = corpo.querySelector(".am-carica"); if (c) c.textContent = erroreAmici(e); else corpo.appendChild(el("p", { class: "link-avviso", text: erroreAmici(e) })); }

    // una riga di classifica; "azione" = il tasto a destra per chiedere/accettare l'amicizia
    function riga(x, pos, conAzione) {
      var medaglia = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos ? pos + "°" : "–";
      var l = x.liv || {};
      var dett = [["💠", l.platino], ["💎", l.diamante], ["🥇", l.oro], ["🥈", l.argento], ["🥉", l.bronzo]]
        .filter(function (d) { return d[1]; }).map(function (d) { return d[0] + " " + d[1]; }).join("   ");   // (🌙 spazio che non va a capo: il metallo resta attaccato al suo numero)
      var rap = rapporto(x.uid), azione = null;
      if (conAzione) {
        if (rap === "amico") azione = el("span", { class: "am-stato", text: "👥" });
        else if (rap === "inviata") azione = el("span", { class: "am-stato", text: "⏳" });
        else if (rap === "arrivata" || rap === "nessuno") {
          azione = el("button", { class: "am-piu" + (rap === "arrivata" ? " si" : ""), text: rap === "arrivata" ? "✓" : "➕", "aria-label": "Amicizia con " + x.nome, onclick: function (e) {
            e.stopPropagation(); azione.disabled = true;
            chiediA(x, function () { if (ancoraQui()) schermataAmici(scheda); }).catch(function (er) { azione.disabled = false; alert(erroreAmici(er)); });
          } });
        }
      }
      return el("button", { class: "am-riga" + (x.io ? " io" : "") + (pos && pos <= 3 ? " podio p" + pos : ""), onclick: function () { schermataTrofeiAmico(x, scheda); } }, [
        el("span", { class: "am-pos", text: medaglia }),
        faccina(x, "am-fac"),
        el("div", { class: "am-info" }, [
          el("div", { class: "am-nome", text: x.nome + (x.io ? " (tu)" : "") }),
          el("div", { class: "am-dett", text: dett || "Nessun trofeo ancora" })
        ]),
        el("div", { class: "am-num" }, [ el("b", { text: "" + (x.trofei || 0) }), el("span", { text: "/" + tot }) ]),
        azione
      ]);
    }
    // mette in fila e numera (a pari trofei, stesso posto)
    function classifica(lista, conAzione) {
      var pos = 0, prec = null;
      ordinaClassifica(lista).forEach(function (x, i) {
        if (!prec || (x.trofei || 0) !== (prec.trofei || 0)) pos = i + 1;
        prec = x;
        corpo.appendChild(riga(x, pos, conAzione));
      });
    }

    if (scheda === "generale") {
      carica("Carico la classifica…");
      Promise.all([SGNube.classificaGenerale(100), aggiornaRichieste()]).then(function (rr) {
        if (!ancoraQui()) return;
        svuota(corpo); segnaRichieste();
        var lista = rr[0].filter(function (x) { return x.uid !== io.uid; }), dentro = rr[0].length > lista.length || rr[0].length < 100;
        if (dentro) classifica(lista.concat([io]), true);
        else {   // non sono tra i primi 100: la classifica e poi io in fondo
          classifica(lista, true);
          corpo.appendChild(el("div", { class: "am-sep", text: "…" }));
          corpo.appendChild(riga(io, 0, false));
        }
        corpo.appendChild(el("p", { class: "modulo-nota am-nota", text: "Tocca ➕ per chiedere l'amicizia, o un nome per vedere i suoi trofei." }));
      }).catch(errore);
    } else if (scheda === "amici") {
      var campo = el("input", { class: "link-campo", type: "text", maxlength: "20", placeholder: "Cerca un nome…" });
      var bCerca = el("button", { class: "btn btn-primario am-agg", text: "➕ Chiedi" });
      var avviso = el("div", { class: "link-avviso" });
      function cerca() {
        var n = (campo.value || "").trim();
        if (n.length < 2) { avviso.textContent = "Scrivi il nome del profilo del tuo amico."; return; }
        if (SGNube.chiaveNome(n) === SGNube.chiaveNome(prof.nome)) { avviso.textContent = "Quello sei tu 😄"; return; }
        bCerca.disabled = true; avviso.textContent = "Cerco…";
        SGNube.cercaNome(n).then(function (sch) {
          if (!sch) { bCerca.disabled = false; avviso.textContent = "Non trovo nessuno con questo nome. Deve aver aperto l'app almeno una volta dopo l'aggiornamento."; return; }
          var rap = rapporto(sch.uid);
          if (rap === "amico") { bCerca.disabled = false; avviso.textContent = sch.nome + " è già tuo amico."; return; }
          if (rap === "inviata") { bCerca.disabled = false; avviso.textContent = "Hai già mandato la richiesta a " + sch.nome + ": aspetta che accetti."; return; }
          return chiediA(sch, function (msg) { bCerca.disabled = false; campo.value = ""; avviso.textContent = msg; });
        }).catch(function (e) { bCerca.disabled = false; avviso.textContent = erroreAmici(e); });
      }
      bCerca.onclick = cerca;
      campo.addEventListener("keydown", function (e) { if (e.key === "Enter") cerca(); });
      s._contenuto.insertBefore(el("div", { class: "am-cerca-box" }, [ el("div", { class: "am-cerca" }, [campo, bCerca]), avviso ]), corpo);
      // "🟢 Fatti vedere online dagli amici" (Passo 6): spento, gli amici non ti vedono col pallino verde (gli inviti arrivano lo stesso)
      if (window.SGAmiciOnline && SGAmiciOnline.visibile) {
        var chkOn = el("input", { type: "checkbox", "aria-label": "Fatti vedere online dagli amici" });
        chkOn.checked = SGAmiciOnline.visibile();
        chkOn.addEventListener("change", function () { SGAmiciOnline.visibile(!!chkOn.checked); });
        s._contenuto.insertBefore(el("div", { class: "sl-viva-opz am-presenza" }, [
          el("label", { class: "sl-interruttore" }, [ el("span", { text: "🟢 Fatti vedere online dagli amici" }), chkOn ]),
          el("small", { text: "Vedono quando hai l'app aperta e ti chiamano nella loro Sala. Spento non ti vedono, ma i loro inviti ti arrivano lo stesso." })
        ]), corpo);
      }
      var mieiUid = SGNube.amici();
      var giaNoti = (cacheAmici || []).filter(function (x) { return mieiUid.indexOf(x.uid) >= 0; });
      function disegnaAmici(l) {
        svuota(corpo);
        classifica(l.concat([io]), false);
        if (!l.length) corpo.appendChild(el("p", { class: "modulo-nota am-nota", text: "Non hai ancora amici. Cerca il loro nome qui sopra, oppure chiedi l'amicizia dalla classifica Generale." }));
      }
      disegnaAmici(giaNoti);
      aggiornaRichieste().then(function () {   // intanto si sistemano le amicizie accettate/tolte dagli altri
        segnaRichieste();
        var uids = SGNube.amici();
        if (!uids.length) { cacheAmici = []; if (ancoraQui()) disegnaAmici([]); return; }
        if (!giaNoti.length) carica("Carico gli amici…");
        return SGNube.schede(uids).then(function (l) { cacheAmici = l; if (ancoraQui()) disegnaAmici(l); });
      }).catch(errore);
    } else {
      carica("Carico le richieste…");
      aggiornaRichieste(true).then(function (r) {
        if (!ancoraQui()) return;
        svuota(corpo); segnaRichieste();
        if (!r) { errore(errRich || { code: "unavailable" }); return; }
        function persona(nome, omino, emoji) { return { nome: nome || "?", omino: omino || null, emoji: emoji }; }
        corpo.appendChild(el("div", { class: "etichetta am-etich", text: "Arrivate a te" }));
        if (!r.arrivate.length) corpo.appendChild(el("p", { class: "modulo-nota am-nota", text: "Nessuna richiesta nuova." }));
        r.arrivate.forEach(function (q) {
          var bSi = el("button", { class: "am-piu si", text: "✓", "aria-label": "Accetta", onclick: function () {
            bSi.disabled = true;
            SGNube.accetta(q).then(function () { return aggiornaRichieste(true); }).then(function () { schermataAmici("richieste"); })
              .catch(function (e) { bSi.disabled = false; alert(erroreAmici(e)); });
          } });
          var bNo = el("button", { class: "am-togli", text: "✕", "aria-label": "Rifiuta", onclick: function () {
            SGNube.rifiuta(q).then(function () { return aggiornaRichieste(true); }).then(function () { schermataAmici("richieste"); }).catch(function () {});
          } });
          corpo.appendChild(el("div", { class: "am-riga" }, [
            faccina(persona(q.daNome, q.daOmino, q.daEmoji), "am-fac"),
            el("div", { class: "am-info" }, [ el("div", { class: "am-nome", text: q.daNome || "?" }), el("div", { class: "am-dett", text: "vuole essere tuo amico" }) ]),
            bNo, bSi
          ]));
        });
        if (r.inviate.length) {
          corpo.appendChild(el("div", { class: "etichetta am-etich", text: "Mandate da te" }));
          r.inviate.forEach(function (q) {
            corpo.appendChild(el("div", { class: "am-riga" }, [
              el("span", { class: "am-fac" }, [ el("span", { class: "am-emo", text: "⏳" }) ]),
              el("div", { class: "am-info" }, [ el("div", { class: "am-nome", text: q.aNome || "?" }), el("div", { class: "am-dett", text: "in attesa che accetti" }) ]),
              el("button", { class: "am-togli", text: "✕", "aria-label": "Annulla", onclick: function () {
                SGNube.annulla(q).then(function () { return aggiornaRichieste(true); }).then(function () { schermataAmici("richieste"); }).catch(function () {});
              } })
            ]));
          });
        }
      });
    }
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Torna alla home", onclick: schermataHome }));
    mostra(s);
  }
  // i trofei di un giocatore, gioco per gioco (+ il tasto per l'amicizia)
  function schermataTrofeiAmico(x, torna) {
    torna = torna || "generale";
    var s = schermata({ titolo: x.nome, sotto: "🏆 " + (x.trofei || 0) + " trofei", indietro: function () { schermataAmici(torna); } });
    s._contenuto.appendChild(el("div", { class: "am-grande" }, [ faccina(x, "am-fac-grande") ]));
    if (!x.io && CITTA_VISIBILE && window.SGCasa) s._contenuto.appendChild(el("button", { class: "btn btn-primario am-casa", text: "🏠 Vai a casa sua", onclick: function () { cuore.schermataCasaAmico(x, torna); } }));
    var l = x.liv || {};
    function cella(cls, ico, nome, f) {
      return el("div", { class: "sm-liv " + cls }, [ el("div", { class: "sm-ico", text: ico }), el("div", { class: "sm-num", html: "<b>" + (f || 0) + "</b>" }), el("div", { class: "sm-nome", text: nome }) ]);
    }
    s._contenuto.appendChild(el("div", { class: "sfide-sommario" }, [
      el("div", { class: "sm-livelli" }, [
        cella("tl-bronzo", "🥉", "Bronzo", l.bronzo), cella("tl-argento", "🥈", "Argento", l.argento),
        cella("tl-oro", "🥇", "Oro", l.oro), cella("tl-diamante", "💎", "Diamante", l.diamante), cella("tl-platino", "💠", "Platino", l.platino)
      ])
    ]));
    var perGioco = x.giochi || {};
    // prima i giochi dove ha più trofei
    giochi.slice().sort(function (a, b) { return (perGioco[b.id] || 0) - (perGioco[a.id] || 0); }).forEach(function (g) {
      var tot = cuore.trofeiDi(g.id).length; if (!tot) return;
      tot++;   // + il Platino del gioco
      var f = perGioco[g.id] || 0, pct = Math.floor(f * 100 / tot), plat = f >= tot;
      s._contenuto.appendChild(el("div", { class: "sfida-gioco" + (plat ? " platinato" : "") }, [
        el("span", { class: "sg-ico", text: g.icona || "🎮" }),
        el("div", { class: "sg-corpo" }, [
          el("div", { class: "sg-nome", text: g.nome }),
          el("div", { class: "sg-sub", html: f + "/" + tot + " trofei" + (plat ? "  ·  💠 Platino!" : "") + " <span class='sg-pct'>" + pct + "%</span>" }),
          el("div", { class: "sg-barra" }, [ el("div", { class: "sg-fill", style: "width:" + pct + "%" }) ])
        ])
      ]));
    });
    var rap = x.io ? "io" : rapporto(x.uid), avviso = el("div", { class: "link-avviso" });
    if (rap === "nessuno" || rap === "arrivata") {
      var b = el("button", { class: "btn btn-primario", text: rap === "arrivata" ? "✅ Accetta l'amicizia" : "➕ Chiedi l'amicizia", onclick: function () {
        b.disabled = true;
        chiediA(x, function (msg) { avviso.textContent = msg; b.textContent = msg.charAt(0) === "✅" ? "👥 Siete amici" : "⏳ Richiesta mandata"; })
          .catch(function (e) { b.disabled = false; avviso.textContent = erroreAmici(e); });
      } });
      s._piede.appendChild(avviso); s._piede.appendChild(b);
    } else if (rap === "inviata") {
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "⏳ Richiesta mandata, aspetta che accetti", disabled: "disabled" }));
    } else if (rap === "amico") {
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "✕ Togli dagli amici", onclick: function () {
        chiediConferma("Togliere " + x.nome + " dagli amici?", "Sparirete dalla lista amici l'uno dell'altro. Potrai sempre richiedere l'amicizia.", "✕ Togli", function () {
          SGNube.togliAmico(x.uid).catch(function () {});
          cacheAmici = (cacheAmici || []).filter(function (y) { return y.uid !== x.uid; });
          schermataAmici("amici");
        });
      } }));
    }
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "‹ Indietro", onclick: function () { schermataAmici(torna); } }));
    mostra(s);
  }

  // ---- Proposte e segnalazioni ----
  // I messaggi vengono spediti al sito (moduli di Netlify) e finiscono
  // nell'area riservata del proprietario: li può leggere solo lui.
  function inviaModulo(nomeModulo, dati) {
    var pezzi = ["form-name=" + encodeURIComponent(nomeModulo)];
    for (var k in dati) pezzi.push(encodeURIComponent(k) + "=" + encodeURIComponent(dati[k] == null ? "" : dati[k]));
    return fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: pezzi.join("&")
    }).then(function (r) { if (!r.ok) throw new Error("invio non riuscito"); return true; });
  }

  function schermataModulo(opts) {
    var s = schermata({ icona: opts.icona, titolo: opts.titolo, sotto: opts.sotto, indietro: schermataHome });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: opts.nota }));
    var nome = el("input", { class: "link-campo", type: "text", placeholder: "Il tuo nome (facoltativo)", maxlength: "24" });
    var testo = el("textarea", { class: "modulo-testo", placeholder: opts.placeholder, rows: "6" });
    var avviso = el("div", { class: "link-avviso" });
    s._contenuto.appendChild(nome);
    s._contenuto.appendChild(testo);
    s._contenuto.appendChild(avviso);
    var invia = el("button", { class: "btn btn-primario", text: opts.bottone, onclick: function () {
      var msg = (testo.value || "").trim();
      if (msg.length < 3) { avviso.textContent = "Scrivi prima il messaggio."; return; }
      invia.disabled = true; avviso.textContent = "Invio in corso…";
      var dati = { nome: (nome.value || "").trim() || "Anonimo", messaggio: msg };
      if (opts.contesto) dati.contesto = opts.contesto();
      inviaModulo(opts.modulo, dati).then(function () { grazie(opts.grazie); })
        .catch(function () {
          invia.disabled = false;
          avviso.textContent = "Non sono riuscito a inviare (succede se il gioco non è aperto dal sito pubblicato). Copia il testo e mandalo a chi gestisce il gioco.";
          testo.focus(); testo.select();
        });
    }});
    s._piede.appendChild(invia);
    mostra(s);
  }

  function grazie(testo) {
    var s = schermata({});
    s._contenuto.appendChild(el("div", { class: "passa" }, [
      el("div", { class: "emoji", text: "🙏" }),
      el("div", { class: "grande", text: "Grazie!" }),
      el("p", { class: "tenue centro", text: testo })
    ]));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna ai giochi", onclick: schermataHome }));
    mostra(s);
  }

  function schermataProposte() {
    schermataModulo({
      modulo: "proposte", icona: "💡", titolo: "Proposte", sotto: "Hai un'idea? Scrivila qui",
      nota: "Un gioco nuovo, una carta da aggiungere, una regola da cambiare… scrivi pure. La legge soltanto chi gestisce il gioco.",
      placeholder: "La mia idea è…", bottone: "Invia la proposta",
      grazie: "La tua proposta è arrivata. Se è buona, la vedrai comparire nel gioco!"
    });
  }

  function schermataBug() {
    schermataModulo({
      modulo: "bug", icona: "🐞", titolo: "Segnala un problema", sotto: "Qualcosa non funziona?",
      nota: "Racconta cosa stavi facendo e cosa è andato storto. Più sei preciso, più in fretta lo sistemiamo.",
      placeholder: "Stavo giocando a… e invece di… è successo…",
      bottone: "Invia la segnalazione",
      grazie: "Segnalazione ricevuta: ci aiuta a sistemare il gioco.",
      contesto: function () {
        var v = (window.SG_NOVITA && window.SG_NOVITA[0] && window.SG_NOVITA[0].v) || "?";
        return "versione " + v + " · schermo " + window.innerWidth + "x" + window.innerHeight + " · " + navigator.userAgent;
      }
    });
  }

  // ---- 📊 le statistiche di ogni gioco: partite, vinte, perse, % di vittorie, tempo giocato, serie migliore ----
  //      (le scrive premiaPartita a fine partita; contano dal 10 ottobre 2026. Il Black Jack ha anche le sue mani di sempre)
  function tempoGiocato(sec) {
    var m = Math.round((sec || 0) / 60);
    if (m < 1) return sec > 0 ? "meno di 1 min" : "0 min";
    if (m < 60) return m + " min";
    var h = Math.floor(m / 60), r = m % 60;
    return cifre(h) + " h" + (r && h < 100 ? " " + r + " min" : "");
  }
  function quandoGiocato(ms) {
    if (!ms) return "";
    var oggi = new Date(); oggi.setHours(0, 0, 0, 0);
    var giorni = Math.floor((oggi.getTime() - new Date(ms).setHours(0, 0, 0, 0)) / 86400000);
    return giorni <= 0 ? "oggi" : giorni === 1 ? "ieri" : giorni < 7 ? giorni + " giorni fa" : giorni < 30 ? Math.floor(giorni / 7) + (giorni < 14 ? " settimana fa" : " settimane fa") : "più di un mese fa";
  }
  function totaliGiocato(gi) {
    var t = { p: 0, v: 0, s: 0, t: 0 };
    Object.keys(gi || {}).forEach(function (k) { var x = gi[k] || {}; t.p += x.p || 0; t.v += x.v || 0; t.s += x.s || 0; t.t += x.t || 0; });
    return t;
  }
  function percVittorie(x) { var n = (x.v || 0) + (x.s || 0); return n ? Math.round((x.v || 0) * 100 / n) + "%" : "—"; }
  function schermataStatistiche(dopo) {
    var p = SGNube.profilo(); if (!p) return (dopo || schermataHome)();
    var gi = (SGNube.giocato && SGNube.giocato()) || {}, tot = totaliGiocato(gi);
    var s = schermata({ icona: "📊", titolo: "Statistiche", sotto: p.nome, indietro: function () { (dopo || schermataHome)(); } });
    function cella(valore, nome, cls) { return el("div", { class: "st-cella" + (cls ? " " + cls : "") }, [ el("b", { text: "" + valore }), el("small", { text: nome }) ]); }
    // in alto i totali
    s._contenuto.appendChild(el("div", { class: "st-griglia st-totali" }, [ cella(tempoGiocato(tot.t), "Tempo giocato"), cella(cifre(tot.p), "Partite"), cella(percVittorie(tot), "Vittorie") ]));
    var gf = p.giorniFila || 0, gm = p.giorniFilaMax || gf;   // 🔥 i giorni di fila in cui sei entrato
    if (gf) {
      var pp = cuore.prossimoPremioGiorni(gf);
      s._contenuto.appendChild(el("div", { class: "st-fuoco" }, [
        el("span", { class: "st-fuoco-ico", text: "🔥" }),
        el("span", { class: "st-fuoco-testo" }, [ el("b", { text: gf + (gf === 1 ? " giorno di fila" : " giorni di fila") }), el("small", { text: "Record: " + gm + " · prossimo premio a " + pp.giorno + " giorni: " + cifre(pp.monete) + " 🪙" }) ])
      ]));
    }
    var lista = giochi.filter(function (g) { return gi[g.id] && gi[g.id].p; }).sort(function (a, b) { return (gi[b.id].t || 0) - (gi[a.id].t || 0) || gi[b.id].p - gi[a.id].p; });
    if (lista.length) s._contenuto.appendChild(el("p", { class: "modulo-nota", html: "Il tuo gioco preferito: <b>" + lista[0].icona + " " + lista[0].nome + "</b> (" + tempoGiocato(gi[lista[0].id].t) + ")" }));
    // un riquadro per ogni gioco giocato, dal più giocato
    lista.forEach(function (g) {
      var x = gi[g.id], q = quandoGiocato(x.u);
      var r = el("div", { class: "st-gioco" }, [
        el("div", { class: "st-testa" }, [ el("span", { class: "st-ico", text: g.icona || "🎲" }), el("b", { text: g.nome }), el("small", { text: q ? "ultima volta " + q : "" }) ]),
        el("div", { class: "st-griglia" }, [ cella(cifre(x.p), "Partite"), cella(cifre(x.v || 0), "Vinte", "verde"), cella(cifre(x.s || 0), "Perse", "rosso"), cella(percVittorie(x), "% vittorie") ]),
        el("div", { class: "st-riga" }, [ el("span", { text: "⏱️ " + tempoGiocato(x.t) }), x.serieMax ? el("span", { text: "🔥 Serie migliore: " + x.serieMax + (x.serieMax === 1 ? " vittoria" : " vittorie di fila") }) : null, x.rec ? el("span", { text: "🏅 Record: " + cifre(x.rec) + " punti" }) : null ])
      ]);
      if (g.id === "blackjack") {   // il Black Jack conta anche le mani (da sempre)
        var bj = (p.stat && p.stat.blackjack) || {};
        if (bj.maniGiocate) r.appendChild(el("div", { class: "st-riga" }, [ el("span", { text: "🃏 Mani: " + cifre(bj.maniVinte || 0) + " vinte su " + cifre(bj.maniGiocate) }), el("span", { text: "✨ Black Jack fatti: " + cifre(bj.blackjackFatti || 0) }), bj.vincitaMax ? el("span", { text: "💰 Vincita più alta: " + cifre(bj.vincitaMax) }) : null ]));
      }
      s._contenuto.appendChild(r);
    });
    if (!lista.length) s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Ancora niente qui: gioca una partita col tuo profilo e le statistiche si riempiono." }));
    s._contenuto.appendChild(el("p", { class: "modulo-nota st-nota", text: "Contano le partite giocate col profilo dal 10 ottobre 2026. Le partite sullo stesso telefono in cui non giochi col tuo nome contano nelle partite e nel tempo, non nelle vittorie." }));
    mostra(s);
  }

  // dopo il login il profilo (Firestore) arriva un istante dopo: aspetta che ci sia

  // ---- al cuore: quello di questo pezzo che usano il cuore e gli altri pezzi ----
  cuore.aggiornaRichieste = aggiornaRichieste; cuore.chiediA = chiediA; cuore.rapporto = rapporto; cuore.schermataAmici = schermataAmici;
  cuore.schermataBug = schermataBug; cuore.schermataProposte = schermataProposte; cuore.schermataStatistiche = schermataStatistiche;
  cuore.schermataTrofeiAmico = schermataTrofeiAmico; cuore.tempoGiocato = tempoGiocato; cuore.totaliGiocato = totaliGiocato;
  Object.defineProperty(cuore, "cacheRich", { get: function () { return cacheRich; }, configurable: true });
})();
