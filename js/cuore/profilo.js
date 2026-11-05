/* =========================================================
   PEZZO DEL CUORE — 👤 IL PROFILO
   L'ultimo profilo ricordato su questo telefono, l'accesso (nome + password, anche in cloud),
   «Crea il tuo profilo», il profilo e l'avatar obbligatori al primo ingresso (dal 15 ott 2026),
   benvenuto, bentornato, «senza internet» e l'invito di chi arriva da un link.
   Gli aiuti di base dei profili (leggiL, scriviL, profili, profiloAttivo) restano nel cuore.
   Pezzo del cuore (js/core.js): prende gli aiuti dal cuore all'inizio («dal cuore»)
   e in fondo gli lascia quello che usano gli altri («al cuore»). Vedi AGENTS.md.
   ========================================================= */
(function () {
  "use strict";
  var cuore = window.SGCuore;
  // ---- dal cuore: gli aiuti che questo pezzo usa (non cambiano mai, si prendono una volta) ----
  var el = cuore.el, chiediConferma = cuore.chiediConferma, schermata = cuore.schermata, mostra = cuore.mostra, pillola = cuore.pillola,
      schermataHome = cuore.schermataHome, riquadroLivello = cuore.riquadroLivello, eProprietario = cuore.eProprietario,
      AVATAR_NUOVO = cuore.AVATAR_NUOVO, avatarNuoviSpenti = cuore.avatarNuoviSpenti, AVATAR_A = cuore.AVATAR_A, avatarASpento = cuore.avatarASpento, K_PROFILI = cuore.K_PROFILI, K_ATTIVO = cuore.K_ATTIVO,
      FACCINE = cuore.FACCINE, leggiL = cuore.leggiL, scriviL = cuore.scriviL, profili = cuore.profili, profiloAttivo = cuore.profiloAttivo,
      giocoDa = cuore.giocoDa, cifre = cuore.cifre, audioCtx = cuore.audioCtx;

  // ---- l'ultimo profilo usato su questo telefono: { nome, omino } (mai la password). Serve se la sessione scade
  //      (si chiede solo la password, col nome già scritto) o se all'apertura manca la rete (si entra lo stesso) ----
  var K_ULTIMO = "sg-ultimo-profilo";
  var senzaRete = false;   // la sessione è sparita e manca la rete: intanto si gioca col profilo ricordato (nome e avatar)
  function ricordoProfilo() { var r = leggiL(K_ULTIMO, null); return r && r.nome ? r : null; }
  function ricordaProfilo() {
    var io = window.SGNube && SGNube.disponibile() && SGNube.profilo() ? profiloAttivo() : null;
    if (!io || !io.cloud || !io.nome) return;
    var r = { nome: io.nome, omino: io.omino || null };
    if (JSON.stringify(r) !== JSON.stringify(ricordoProfilo())) scriviL(K_ULTIMO, r);
  }
  function dimenticaProfilo() { try { localStorage.removeItem(K_ULTIMO); } catch (e) {} }
  function profiloRicordato() { var r = ricordoProfilo(); return r ? { id: "ricordo", nome: r.nome, emoji: "🙂", omino: r.omino || null, omini: null, ominoN: 0, cloud: false, ricordo: true } : null; }
  function salvaProfilo(p) {
    var lista = profili().filter(function (x) { return x.id !== p.id; });
    lista.unshift(p);
    if (lista.length > 12) lista = lista.slice(0, 12);
    scriviL(K_PROFILI, lista); scriviL(K_ATTIVO, p.id);
  }

  function schermataCaricamento() {
    var s = schermata({ icona: "⚡", titolo: "SPeeD GAME", sotto: "Un attimo…" });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: "Sto caricando il tuo profilo…" }));
    mostra(s);
  }

  function schermataAccesso(dopo) {
    if (window.SGNube && SGNube.disponibile()) return schermataAccessoCloud(dopo);
    var lista = profili();
    var s = schermata({ icona: "👤", titolo: "Il tuo profilo", sotto: "Crea il tuo oppure accedi", indietro: schermataHome });
    s._contenuto.appendChild(el("p", { class: "modulo-nota",
      text: "Il profilo serve solo a non riscrivere ogni volta nome e faccina. Resta su questo telefono: non c'è nessuna password." }));
    if (lista.length) {
      s._contenuto.appendChild(el("div", { class: "etichetta", text: "Profili su questo telefono" }));
      lista.slice(0, 4).forEach(function (p) {
        s._contenuto.appendChild(el("button", { class: "profilo-riga", onclick: function () { scriviL(K_ATTIVO, p.id); dopo(); } }, [
          el("span", { class: "av", text: p.emoji }),
          el("span", { class: "nm", text: p.nome }),
          el("span", { class: "frecc", text: "›" })
        ]));
      });
    }
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "➕ Crea profilo", onclick: function () { schermataCreaProfilo(dopo, null); } }));
    var bAcc = el("button", { class: "btn btn-fantasma", text: "👤 Accedi con un profilo salvato", onclick: function () { schermataScegliProfilo(dopo); } });
    if (!lista.length) bAcc.disabled = true;
    s._piede.appendChild(bAcc);
    mostra(s);
  }

  function schermataScegliProfilo(dopo) {
    var s = schermata({ icona: "👤", titolo: "Accedi", sotto: "Scegli il tuo profilo", indietro: function () { schermataAccesso(dopo); } });
    profili().forEach(function (p) {
      s._contenuto.appendChild(el("button", { class: "profilo-riga", onclick: function () { scriviL(K_ATTIVO, p.id); dopo(); } }, [
        el("span", { class: "av", text: p.emoji }),
        el("span", { class: "nm", text: p.nome }),
        el("span", { class: "frecc", text: "›" })
      ]));
    });
    mostra(s);
  }

  function schermataCreaProfilo(dopo, esistente) {
    var scelta = { emoji: (esistente && esistente.emoji) || FACCINE[0] };
    var s = schermata({ icona: "👤", titolo: esistente ? "Modifica profilo" : "Crea profilo",
      indietro: function () { schermataAccesso(dopo); } });
    var nome = el("input", { class: "link-campo", type: "text", maxlength: "16",
      placeholder: "Come ti chiami?", value: (esistente && esistente.nome) || "" });
    s._contenuto.appendChild(nome);
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Scegli la faccina" }));
    var griglia = el("div", { class: "faccine" });
    FACCINE.forEach(function (e) {
      griglia.appendChild(el("button", { class: "faccina" + (e === scelta.emoji ? " attiva" : ""), text: e,
        onclick: function () {
          scelta.emoji = e;
          [].forEach.call(griglia.children, function (c) { c.className = "faccina" + (c.textContent === e ? " attiva" : ""); });
        } }));
    });
    s._contenuto.appendChild(griglia);
    var avviso = el("div", { class: "link-avviso" });
    s._contenuto.appendChild(avviso);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Salva ▶", onclick: function () {
      var n = (nome.value || "").trim();
      if (n.length < 2) { avviso.textContent = "Scrivi il tuo nome."; return; }
      salvaProfilo({ id: (esistente && esistente.id) || ("p" + Date.now() + Math.floor(Math.random() * 999)), nome: n, emoji: scelta.emoji });
      dopo();
    }}));
    mostra(s);
  }

  // ---- profili in cloud (Firebase): nome + password, ti seguono ovunque ----
  function schermataAccessoCloud(dopo) {
    var p = SGNube.profilo();
    if (p) {   // già dentro: mostra il profilo, le statistiche e il tasto esci
      var sp = schermata({ icona: p.emoji || "👤", titolo: p.nome, sotto: "Il tuo profilo", indietro: function () { (dopo || schermataHome)(); } });   // dalla città si torna in città
      if (!dopo || dopo === schermataHome) sp._menu = "profilo";   // 📱 aperto dalla home o dal menu: col menu sotto
      if (window.SGOmino) sp._contenuto.appendChild(el("div", { class: "omino-profilo" }, [
        el("div", { class: "omino-palco" + (p.omino ? "" : " vuoto"), html: SGOmino.svg(p.omino || SGOmino.casuale(p.nome)) }),
        el("button", { class: "btn " + (p.omino ? "btn-fantasma" : "btn-primario"), text: p.omino ? "✏️ Modifica il tuo avatar" : "🧍 Crea il tuo avatar",
          onclick: function () { cuore.schermataOmino(function () { schermataAccessoCloud(dopo); }); } })
      ]));
      if (window.SGLivelli && SGNube.progressione) {
        sp._contenuto.appendChild(el("div", { class: "etichetta", text: "⭐ Livello e Speed Coins" }));
        sp._contenuto.appendChild(riquadroLivello(SGNube.progressione()));
      }
      // le statistiche di tutti i giochi stanno in una schermata a parte
      var tot = cuore.totaliGiocato(SGNube.giocato ? SGNube.giocato() : {});
      sp._contenuto.appendChild(el("button", { class: "st-tasto", onclick: function () { cuore.schermataStatistiche(function () { schermataAccessoCloud(dopo); }); } }, [
        el("span", { class: "st-tasto-ico", text: "📊" }),
        el("span", { class: "st-tasto-testo" }, [ el("b", { text: "Le tue statistiche" }), el("small", { text: tot.p ? cifre(tot.p) + (tot.p === 1 ? " partita" : " partite") + " · " + cuore.tempoGiocato(tot.t) + " giocati" : "Vittorie, sconfitte e tempo di ogni gioco" }) ]),
        el("span", { class: "st-tasto-va", text: "›" })
      ]));
      // solo il proprietario: come sono fatti i bot di tutti i giochi
      if (eProprietario() && window.SGOmino) sp._contenuto.appendChild(el("button", { class: "st-tasto st-bot", onclick: function () { cuore.schermataBot(function () { schermataAccessoCloud(dopo); }); } }, [
        el("span", { class: "st-tasto-ico", text: "🤖" }),
        el("span", { class: "st-tasto-testo" }, [ el("b", { text: "I Bot" }), el("small", { text: "Avatar, nomi e livelli dei bot di tutti i giochi" }) ]),
        el("span", { class: "st-tasto-va", text: "›" })
      ]));
      // 🎨 gli avatar «illustrati» (strada A): solo il proprietario, finché li prova lui (l'app si riapre, così ogni gioco li ridisegna)
      if (AVATAR_A === "proprietario" && eProprietario() && window.SGOmino) sp._contenuto.appendChild(el("button", { class: "st-tasto st-avnuovi st-ava", onclick: function () {
        try { localStorage.setItem("sg-avatar-a", avatarASpento() ? "1" : "0"); } catch (e) {}
        location.reload();
      } }, [
        el("span", { class: "st-tasto-ico", text: "🎨" }),
        el("span", { class: "st-tasto-testo" }, [ el("b", { text: avatarASpento() ? "Avatar illustrati: spenti" : "Avatar illustrati: accesi" }),
          el("small", { text: avatarASpento() ? "Tocca per vedere il disegno nuovo (strada A). Lo vedi solo tu" : "Il disegno nuovo (strada A): lo vedi solo tu. Tocca per tornare a quello di oggi" }) ]),
        el("span", { class: "st-tasto-va", text: "›" })
      ]));
      // solo il proprietario, finché gli avatar nuovi li prova lui: si spengono e si riaccendono (l'app si riapre, così ogni gioco li ridisegna)
      if (AVATAR_NUOVO === "proprietario" && eProprietario() && window.SGOmino) sp._contenuto.appendChild(el("button", { class: "st-tasto st-avnuovi", onclick: function () {
        try { localStorage.setItem("sg-avatar-stile", avatarNuoviSpenti() ? "rifinito" : "classico"); } catch (e) {}
        location.reload();
      } }, [
        el("span", { class: "st-tasto-ico", text: "🧍" }),
        el("span", { class: "st-tasto-testo" }, [ el("b", { text: avatarNuoviSpenti() ? "Avatar nuovi: spenti" : "Avatar nuovi: accesi" }),
          el("small", { text: avatarNuoviSpenti() ? "Tocca per vedere il disegno nuovo («Mii rifinito»). Lo vedi solo tu" : "Il disegno nuovo («Mii rifinito»): lo vedi solo tu. Tocca per tornare a quello di oggi" }) ]),
        el("span", { class: "st-tasto-va", text: "›" })
      ]));
      sp._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🚪 Esci dal profilo", onclick: function () {
        chiediConferma("Sei sicuro di voler uscire dal profilo?", "Se non ricordi la password non potrai più accedere.", "🚪 Esci", function () {
          dimenticaProfilo();   // uscito apposta: questo telefono non lo ripropone
          SGNube.esci().then(function () { schermataBenvenuto(schermataHome); });   // il profilo serve: si crea o si entra con un altro
        });
      } }));
      mostra(sp); return;
    }
    // senza profilo: il benvenuto (o, se questo telefono ricorda il profilo, solo la password)
    var ric = ricordoProfilo();
    if (ric) return schermataBentornato(dopo || schermataHome, ric, { indietro: dopo || schermataHome });
    schermataBenvenuto(dopo || schermataHome);
  }

  function attendiProfilo(cb) {
    var n = 0;
    (function chk() {
      if ((window.SGNube && SGNube.profilo()) || n++ > 30) return cb();
      setTimeout(chk, 200);
    })();
  }

  // =========================================================
  //  PROFILO E AVATAR OBBLIGATORI (dal 15 ott 2026)
  //  Chi apre l'app la prima volta crea il profilo (nome + password) e l'avatar prima di tutto, anche se arriva
  //  dal link di un amico (dopo entra da solo nella stanza o nella Sala del link). Chi ha già usato un profilo su
  //  questo telefono entra da solo, senza domande (la sessione di Firebase resta salvata).
  // =========================================================
  // dopo = dove si va (la home, o la stanza/Sala del link). o = { daLink, invito: "🎉 Ti aspettano…" }
  function garantisciProfilo(dopo, o) {
    o = o || {};
    var io = profiloAttivo(), N = window.SGNube, ric = ricordoProfilo();
    if (io) {
      // un profilo di prima senza avatar: lo fa adesso, una volta (non arrivando da un link: lì si entra e basta)
      if (io.cloud && !io.omino && !o.daLink && window.SGOmino) return cuore.schermataOmino(dopo, null, { benvenuto: true });
      if (window.SGOmino && io.nome && leggiL("sg-primo-avatar", null) === io.nome) return cuore.schermataOmino(dopo, null, { benvenuto: true });   // (aveva chiuso l'app prima di scegliere l'avatar)
      return dopo();
    }
    if (!N || !N.disponibile()) return ric ? dopo() : senzaInternet(dopo, o);   // la parte dei profili non si è caricata: niente rete
    if (!N.pronto()) {   // Firebase sta ancora ritrovando la sessione: si aspetta un po', poi chi ha il profilo entra lo stesso
      schermataCaricamento();
      var fatto = false;
      N.onCambio(function () { if (!fatto && N.pronto()) { fatto = true; garantisciProfilo(dopo, o); } });
      setTimeout(function () { if (!fatto) { fatto = true; if (ric || (N.utente && N.utente())) dopo(); else senzaInternet(dopo, o); } }, 8000);
      return;
    }
    if (N.utente && N.utente()) return dopo();   // dentro, ma il profilo non arriva (rete): si entra lo stesso, arriverà
    if (ric) return navigator.onLine === false ? (senzaRete = true, dopo()) : schermataBentornato(dopo, ric, o);   // sessione scaduta: basta la password
    schermataBenvenuto(dopo, o);
  }
  // il messaggio giusto per chi crea il profilo o entra
  function erroreProfilo(e, nome) {
    var c = (e && e.code) || "";
    if (c === "auth/email-already-in-use") return "Il nome «" + nome + "» è già preso: scegline un altro (tocca 🎲). Se è il tuo, tocca «Hai già un profilo? Entra».";
    if (c === "auth/network-request-failed" || (e && e.message === "offline")) return "Serve internet: controlla il Wi-Fi o i dati e riprova.";
    if (/auth\/(invalid-credential|wrong-password|user-not-found|invalid-login-credentials|invalid-email)/.test(c)) return "Nome o password sbagliati.";
    if (c === "auth/too-many-requests") return "Troppi tentativi: aspetta un minuto e riprova.";
    if (c === "auth/weak-password") return "La password deve avere almeno 6 caratteri.";
    return "Qualcosa è andato storto: riprova.";
  }
  // le schermate del profilo: tutto in uno schermo, anche con la tastiera aperta (si stringe l'avatar, mai il tasto)
  function schermataProfiloBase(cls, indietro) {
    var s = schermata({ indietro: indietro || null });
    s.classList.add("benvenuto-profilo"); if (cls) s.classList.add(cls); if (indietro) s.classList.add("con-indietro");
    function misura() {
      if (!s.isConnected) { window.removeEventListener("resize", misura); if (window.visualViewport) visualViewport.removeEventListener("resize", misura); return; }
      var h = window.visualViewport ? visualViewport.height : window.innerHeight;
      s.classList.toggle("stretta", h < 500); s.classList.toggle("strettissima", h < 380);
    }
    window.addEventListener("resize", misura); if (window.visualViewport) visualViewport.addEventListener("resize", misura);
    setTimeout(misura, 0);
    return s;
  }
  function testaProfilo(titolo, sotto) {
    return el("div", { class: "bp-testa" }, [ el("div", { class: "bp-logo", "aria-hidden": "true", text: "⚡" }), el("h1", { text: titolo }), sotto ? el("p", { class: "bp-sotto", text: sotto }) : null ]);
  }
  // Invio nel primo campo porta al secondo, nel secondo preme il tasto
  function invioCampi(a, b, fai) {
    a.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); b.focus(); } });
    b.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); fai(); } });
  }

  // PRIMA VOLTA: "Benvenuto in SPeeD GAME!" → nome (col 🎲) + password → l'avatar → dove si doveva andare
  function schermataBenvenuto(dopo, o) {
    o = o || {};
    var s = schermataProfiloBase(), c = s._contenuto;
    c.appendChild(testaProfilo("Benvenuto in SPeeD GAME!", "Crea il tuo profilo: scegli un nome, una password e poi il tuo avatar."));
    if (o.invito) c.appendChild(el("div", { class: "bp-invito", text: o.invito }));
    var ant = el("div", { class: "sl-anteprima bp-anteprima", "aria-hidden": "true" });   // l'avatar che avrai (nasce dal nome: col 🎲 cambiano tutti e due)
    var nome = el("input", { class: "link-campo", type: "text", maxlength: "16", placeholder: "Come ti chiami?", autocomplete: "username", autocapitalize: "words", enterkeyhint: "next" });
    var pwd = el("input", { class: "link-campo bp-pwd", type: "password", maxlength: "40", placeholder: "Scegli una password (almeno 6)", autocomplete: "new-password", enterkeyhint: "go" });
    var avviso = el("div", { class: "link-avviso bp-avviso", "aria-live": "polite" });
    c.appendChild(ant); c.appendChild(nome); c.appendChild(pwd); c.appendChild(avviso);
    if (o.nome) nome.value = o.nome;
    cuore.dadoNome(nome, ant);   // 🎲 un nome buffo a caso (se è vuoto mette il nome dell'ultima volta)
    var bAvanti = el("button", { class: "btn btn-primario", text: "Avanti ▶", onclick: avanti });
    function avanti() {
      if (bAvanti.disabled) return;
      var n = (nome.value || "").trim().slice(0, 16), pw = pwd.value || "";
      if (n.length < 2) { avviso.textContent = "Scrivi il tuo nome (almeno 2 lettere)."; nome.focus(); return; }
      if (!/[a-z0-9]/i.test(n)) { avviso.textContent = "Nel nome serve almeno una lettera o un numero."; nome.focus(); return; }
      if (pw.length < 6) { avviso.textContent = "La password deve avere almeno 6 caratteri."; pwd.focus(); return; }
      bAvanti.disabled = true; avviso.textContent = "Creo il tuo profilo…";
      audioCtx();   // (il tocco sblocca i suoni per dopo)
      SGNube.crea(n, pw, "🙂").then(function () {
        attendiProfilo(function () {
          if (!SGNube.profilo()) { bAvanti.disabled = false; avviso.textContent = "Il profilo è creato ma non arriva: controlla la rete e tocca «Hai già un profilo? Entra»."; return; }
          // l'avatar si salva subito (quello dell'anteprima): così nessuno resta senza, anche se chiude l'app adesso
          if (window.SGOmino && !SGNube.profilo().omino) {
            var cfg = SGOmino.norm(SGOmino.casuale(n));
            SGNube.salvaOmino(cfg, [cfg, SGOmino.norm(cuore.secondoOmino(cfg, n))], 0);
          }
          ricordaProfilo();
          scriviL("sg-primo-avatar", n);   // (l'avatar è ancora da scegliere: se chiude l'app adesso, alla prossima apertura glielo richiede)
          if (!window.SGOmino) return dopo();
          cuore.schermataOmino(function () { dopo(); pillola("benvenuto", "🎉 Benvenuto, " + n + "!", "verde", 3500); }, null, { benvenuto: true });
        });
      }).catch(function (e) { bAvanti.disabled = false; avviso.textContent = erroreProfilo(e, n); });
    }
    invioCampi(nome, pwd, avanti);
    s._piede.appendChild(bAvanti);
    s._piede.appendChild(el("button", { class: "btn btn-fantasma bp-gia", text: "Hai già un profilo? Entra", onclick: function () {
      schermataEntraProfilo(dopo, Object.assign({}, o, { nome: (nome.value || "").trim() }));
    } }));
    mostra(s);
  }

  // "Hai già un profilo? Entra" (per chi cambia telefono): nome + password, poi dritto dove doveva andare
  function schermataEntraProfilo(dopo, o) {
    o = o || {};
    var s = schermataProfiloBase("bp-entra"), c = s._contenuto;
    c.appendChild(testaProfilo("Entra col tuo profilo", "Scrivi il nome e la password che hai scelto quando l'hai creato."));
    if (o.invito) c.appendChild(el("div", { class: "bp-invito", text: o.invito }));
    var nome = el("input", { class: "link-campo", type: "text", maxlength: "20", placeholder: "Il tuo nome", autocomplete: "username", autocapitalize: "words", enterkeyhint: "next" });
    var pwd = el("input", { class: "link-campo bp-pwd", type: "password", maxlength: "40", placeholder: "La tua password", autocomplete: "current-password", enterkeyhint: "go" });
    var avviso = el("div", { class: "link-avviso bp-avviso", "aria-live": "polite" });
    nome.value = o.nome || "";
    c.appendChild(nome); c.appendChild(pwd); c.appendChild(avviso);
    var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: entra });
    function entra() {
      if (bEntra.disabled) return;
      var n = (nome.value || "").trim(), pw = pwd.value || "";
      if (n.length < 2 || !pw) { avviso.textContent = "Scrivi nome e password."; (n.length < 2 ? nome : pwd).focus(); return; }
      bEntra.disabled = true; avviso.textContent = "Un attimo…";
      audioCtx();
      SGNube.accedi(n, pw).then(function () { attendiProfilo(function () { ricordaProfilo(); dopo(); }); })
        .catch(function (e) { bEntra.disabled = false; avviso.textContent = erroreProfilo(e, n); });
    }
    invioCampi(nome, pwd, entra);
    s._piede.appendChild(bEntra);
    s._piede.appendChild(el("button", { class: "btn btn-fantasma bp-gia", text: "‹ Non ho un profilo: lo creo", onclick: function () { schermataBenvenuto(dopo, o); } }));
    mostra(s);
  }

  // il telefono ricorda il profilo ma la sessione è sparita: "Bentornato, Luca!", solo la password (una volta)
  // o.indietro: si può tornare indietro (dalla home, quando si era entrati senza rete)
  function schermataBentornato(dopo, ric, o) {
    o = o || {};
    var s = schermataProfiloBase("bp-bentornato", o.indietro), c = s._contenuto;
    c.appendChild(testaProfilo("Bentornato, " + ric.nome + "! 👋", "Per sicurezza scrivi la tua password: poi entri da solo."));
    if (o.invito) c.appendChild(el("div", { class: "bp-invito", text: o.invito }));
    if (window.SGOmino) c.appendChild(el("div", { class: "sl-anteprima bp-anteprima", "aria-hidden": "true", html: SGOmino.svg(ric.omino || SGOmino.casuale(ric.nome)) }));
    var nome = el("input", { type: "text", autocomplete: "username", value: ric.nome, hidden: "hidden", "aria-hidden": "true" });   // (per chi salva le password: il nome c'è già)
    var pwd = el("input", { class: "link-campo bp-pwd", type: "password", maxlength: "40", placeholder: "La tua password", autocomplete: "current-password", enterkeyhint: "go" });
    var avviso = el("div", { class: "link-avviso bp-avviso", "aria-live": "polite" });
    c.appendChild(nome); c.appendChild(pwd); c.appendChild(avviso);
    var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: entra });
    var bLoStesso = el("button", { class: "btn btn-fantasma bp-gia", text: "▶ Gioca lo stesso (senza rete)", hidden: "hidden", onclick: function () { senzaRete = true; dopo(); } });
    function entra() {
      if (bEntra.disabled) return;
      var pw = pwd.value || "";
      if (!pw) { avviso.textContent = "Scrivi la tua password."; pwd.focus(); return; }
      bEntra.disabled = true; avviso.textContent = "Un attimo…";
      audioCtx();
      SGNube.accedi(ric.nome, pw).then(function () { attendiProfilo(function () { ricordaProfilo(); dopo(); }); })
        .catch(function (e) {
          bEntra.disabled = false; avviso.textContent = erroreProfilo(e, ric.nome);
          if (e && e.code === "auth/network-request-failed") bLoStesso.hidden = false;   // senza rete si gioca lo stesso
        });
    }
    pwd.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); entra(); } });
    s._piede.appendChild(bEntra);
    s._piede.appendChild(bLoStesso);
    s._piede.appendChild(el("button", { class: "btn btn-fantasma bp-gia", text: "Non sei " + ric.nome + "? Cambia profilo", onclick: function () {
      dimenticaProfilo(); schermataBenvenuto(dopo, { invito: o.invito, daLink: o.daLink });
    } }));
    mostra(s);
  }

  // prima apertura senza rete (o Firebase che non risponde): il profilo non si può creare
  function senzaInternet(dopo, o) {
    var s = schermataProfiloBase("bp-rete"), c = s._contenuto;
    c.appendChild(el("div", { class: "bp-rete-ico", "aria-hidden": "true", text: "📶" }));
    c.appendChild(testaProfilo("Serve internet per creare il profilo", "Il profilo ti segue su ogni telefono: per crearlo serve la rete. Controlla il Wi-Fi o i dati e tocca Riprova."));
    var avviso = el("div", { class: "link-avviso bp-avviso", "aria-live": "polite" });
    c.appendChild(avviso);
    function riprova() {
      window.removeEventListener("online", riprova);
      if (!s.isConnected) return;
      var N = window.SGNube;
      if (N && N.disponibile()) { if (N.riprova) N.riprova(); return garantisciProfilo(dopo, o); }
      if (navigator.onLine === false) { avviso.textContent = "Ancora niente rete: riprova tra un attimo."; window.addEventListener("online", riprova); return; }
      avviso.textContent = "Un attimo…";
      location.reload();   // la parte dei profili non si era caricata: si ricarica (il link aperto resta segnato: dopo si entra lo stesso)
    }
    window.addEventListener("online", riprova);   // torna la rete: si riprova da soli
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Riprova", onclick: riprova }));
    mostra(s);
  }
  // il link aperto all'avvio, in parole per chi gioca ("🎉 Ti aspettano per giocare a ❌ Tris!")
  function invitoDi(L) {
    if (!L) return "";
    if (L.gruppo) return "🎉 I tuoi amici ti aspettano" + (L.n ? " in «" + (L.e ? L.e + " " : "") + String(L.n).slice(0, 24) + "»" : " nella compagnia " + L.gruppo) + "!";
    if (L.sala) return "🎉 I tuoi amici ti aspettano nella Sala " + String(L.sala).toUpperCase() + "!";
    var g = L.gioco && giocoDa(L.gioco);
    return g && L.stanza ? "🎉 Ti aspettano per giocare a " + (g.icona ? g.icona + " " : "") + g.nome + "!" : "";
  }


  // ---- al cuore: quello di questo pezzo che usano il cuore e gli altri pezzi ----
  cuore.garantisciProfilo = garantisciProfilo; cuore.invitoDi = invitoDi; cuore.profiloRicordato = profiloRicordato;
  cuore.ricordaProfilo = ricordaProfilo; cuore.salvaProfilo = salvaProfilo; cuore.schermataAccesso = schermataAccesso;
  cuore.schermataCaricamento = schermataCaricamento; cuore.schermataProfiloBase = schermataProfiloBase;
  Object.defineProperty(cuore, "senzaRete", { get: function () { return senzaRete; }, configurable: true });
})();
