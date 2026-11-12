/* =========================================================
   PEZZO DEL CUORE — 🛋️ LA SALA DELLA SERATA (online)
   Un codice e un link per tutta la sera: l'host crea la Sala, gli amici entrano una volta e lo
   seguono da un gioco all'altro. Qui: lo stato della Sala (sala = host, salaG = ospite), la
   Compagnia (codice fisso di 6 lettere, «una Sala sola» per codice), la Classifica della serata,
   l'host della Sala (scegli il gioco, lancia, Cambia gioco), l'host che se ne va (vice, «👑 Passa
   la Sala», pausa, Sala addormentata), la Compagnia che nasce dalla Sala, chi arriva, l'ospite,
   l'entrata nella Compagnia e il riquadro «🎮 Si gioca a…». Regole e messaggi: AGENTS.md (Passi 2, 3, 5, 6).
   I due ascoltatori della Sala (schermo girato, app in secondo piano) restano nel cuore.
   Pezzo del cuore (js/core.js): prende gli aiuti dal cuore all'inizio («dal cuore»)
   e in fondo gli lascia quello che usano gli altri («al cuore»). Vedi AGENTS.md.
   ========================================================= */
(function () {
  "use strict";
  var cuore = window.SGCuore;
  // ---- dal cuore: gli aiuti che questo pezzo usa (non cambiano mai, si prendono una volta) ----
  var giochi = cuore.giochi, giocoOnline = cuore.giocoOnline, el = cuore.el, svuota = cuore.svuota, chiediConferma = cuore.chiediConferma,
      chiediScelta = cuore.chiediScelta, schermata = cuore.schermata, mostra = cuore.mostra, tesseraGioco = cuore.tesseraGioco,
      pillola = cuore.pillola, amiciStato = cuore.amiciStato, schermataHome = cuore.schermataHome, profiloAttivo = cuore.profiloAttivo,
      gruppo = cuore.gruppo, minDi = cuore.minDi, schermataPreGioco = cuore.schermataPreGioco, GIOCHI_ELIMINAZIONE = cuore.GIOCHI_ELIMINAZIONE,
      giocoDa = cuore.giocoDa, errore = cuore.errore, schermataModo = cuore.schermataModo, apriOnlineSala = cuore.apriOnlineSala,
      medaglieAPari = cuore.medaglieAPari, classificaFitta = cuore.classificaFitta, cifre = cuore.cifre, stessoNome = cuore.stessoNome,
      hostDiRiserva = cuore.hostDiRiserva, lasciaPartita = cuore.lasciaPartita, avviaPartita = cuore.avviaPartita, audioCtx = cuore.audioCtx;

  // =========================================================
  //  SALA ONLINE — un gruppo fisso che passa da un gioco all'altro.
  //  L'host crea la sala; gli amici entrano una volta col codice/link.
  //  L'host sceglie i giochi: partono per tutti (gli altri entrano in
  //  automatico nella lobby online del gioco) e a fine partita tutti
  //  tornano nella stessa sala. Solo l'host decide.
  // =========================================================
  var sala = null;   // host:  { rete, codice, pronta, membri:[{id,nome,emoji,omino}], gioco, stanza, inGioco, torneo, regole }
  var salaG = null;  // ospite: { rete, codice, myId, nome, emoji, membri, inGioco, torneo, _msg }
  // "Online" da un gioco apre sempre la Sala della serata (un codice per tutti i giochi).
  // false = come prima (stanza singola). Su un telefono solo si spegne con localStorage "sg-sala-sempre" = "0" (serve alle prove)
  var SALA_SEMPRE = true;
  function salaSempre() { try { if (localStorage.getItem("sg-sala-sempre") === "0") return false; } catch (e) {} return SALA_SEMPRE; }
  // quanti posti ha un gioco online (g.postiOnline; se non lo dice, 10)
  function postiDi(g) { var n = g && +g.postiOnline; return n > 0 ? n : 10; }
  // torneo online: { punti:{nome:n}, nomi:[chi ha giocato], n, ultima:{gioco,icona,assegnati}, finito }

  // ---------- LA COMPAGNIA (Passo 3): un codice fisso di 6 lettere e "una Sala sola" per codice ----------
  // Il codice di questo telefono (a caso, per sempre): va nella foto della Sala (dev). Serve a riconoscere l'host che
  // ricarica la pagina: la sua Sala nuova vince su quella di prima (stesso telefono → la sessione più nuova)
  var DEV = null;
  function idTelefono() {
    if (DEV) return DEV;
    var d = null; try { d = localStorage.getItem("sg-dev"); } catch (e) {}
    if (!d || !/^[a-z0-9]{6,16}$/.test(d)) { d = "d" + Math.random().toString(36).slice(2, 10); try { localStorage.setItem("sg-dev", d); } catch (e) {} }
    return (DEV = d);
  }
  // un codice di Compagnia: 6 lettere dell'alfabeto dei codici (niente O, I, 0, 1). null se non lo è
  function codiceComp(C) { C = String(C == null ? "" : C).trim().toUpperCase(); return /^[A-HJ-NP-Z2-9]{6}$/.test(C) ? C : null; }
  // il link da mandare per la Sala: quello fisso della Compagnia (#gruppo=…, con nome ed emoji) o #sala=.
  // In fondo la 🔑 chiave delle foto di «Chi di Noi?», se questa scheda ce l'ha (crea: sono l'host e la faccio se manca)
  function linkSala(C, crea) {
    C = String(C || "").toUpperCase();
    var k = cuore.chiaveDi(C, !!crea);
    if (C.length === 6) {
      var l = null; try { if (window.SGCompagnia) l = SGCompagnia.link(C); } catch (e) {}
      if (!l) l = SG.creaLink({ gruppo: C });
      return k ? l + (l.indexOf("#") < 0 ? "#" : "&") + "k=" + k : l;
    }
    return SG.creaLink({ sala: C, k: k || undefined });
  }
  // chi tiene una Sala, dalla sua foto: { gen, nato, _s, dev }
  function capoDi(m) { return { gen: +(m && m.gen) || 1, nato: +(m && m.nato) || 0, _s: String((m && m._s) || ""), dev: String((m && m.dev) || "") }; }
  // due Sale sullo stesso codice: quale resta (la regola è uguale su tutti i telefoni, decisa coi valori delle foto).
  // gen più alta; stesso telefono (o tutti e due senza dev e nate insieme) → la sessione più nuova (l'host che ricarica resta
  // host); poi quella nata prima; poi il dev più piccolo; poi la sessione più piccola. Torna a o b
  function primaSala(a, b) {
    var ga = +a.gen || 1, gb = +b.gen || 1;
    if (ga !== gb) return ga > gb ? a : b;
    var sa = String(a._s || ""), sb = String(b._s || ""), na = +a.nato || 0, nb = +b.nato || 0;
    var stesso = a.dev && b.dev ? a.dev === b.dev : (!a.dev && !b.dev && na === nb);
    if (stesso && sa !== sb) return sa > sb ? a : b;
    if (na !== nb) return na < nb ? a : b;
    if ((a.dev || "") !== (b.dev || "")) return String(a.dev || "") < String(b.dev || "") ? a : b;
    return sa <= sb ? a : b;
  }
  // la Sala che tengo io vince su quella di questa foto?
  function vinceLaMia(S0, m) {
    var mia = { gen: S0.gen, nato: S0.nato, _s: S0.rete ? S0.rete.sessione : "", dev: idTelefono() };
    return primaSala(capoDi(m), mia) === mia;
  }
  // il nome di chi tiene la Sala di una foto
  function nomeHostDi(m) { var h = ((m && m.membri) || []).filter(function (x) { return x && x.id === "host"; })[0]; return h && h.nome ? String(h.nome) : ""; }
  // chi della Sala può prenderla se l'host se ne va (Passo 3, p3-c): i primi due arrivati col profilo, presenti, non fatti
  // uscire, non ancora da rientrare. Nel torneo a eliminazione nessuno
  function viceDi() {
    if (!sala || sala.elim) return [];
    var SV = sala.rete && sala.rete._sv, forse = (SV && SV.forse) || {}, fuori = (SV && SV.fuori) || {};
    return sala.membri.filter(function (m) { return m && m.id && m.id !== "host" && m.pr && !m.ex && !forse[m.id] && !fuori[m.id] && !(sala.attesi && sala.attesi[m.id]); })
      .slice(0, 2).map(function (m) { return m.id; });
  }
  // la Sala di questo codice è aperta su questo telefono? (per le tessere della home)
  function infoSalaMia(C) {
    C = String(C || "").toUpperCase();
    if (sala && sala.codice === C) return { host: true, membri: sala.membri, gioco: sala.gioco };
    if (salaG && salaG.codice === C && salaG.membri.length) return { host: false, membri: salaG.membri, gioco: salaG.giocoSala ? salaG.giocoSala.gioco : null };
    return null;
  }
  // la Compagnia di una Sala: { nome, emoji, rv } (dalla foto, dalla memoria delle compagnie, o null)
  function compDi(C, m) {
    if (m && m.comp && m.comp.nome) return { nome: String(m.comp.nome).slice(0, 24), emoji: String(m.comp.emoji || "📌").slice(0, 8), rv: +m.comp.rv || 0 };
    var v = null; try { v = window.SGCompagnia && C ? SGCompagnia.trova(C) : null; } catch (e) {}
    return v ? { nome: v.n, emoji: v.e, rv: +v.rv || 0 } : null;
  }

  function salaSenzaRete(riprova) {
    var s = schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: schermataHome });
    s._contenuto.appendChild(el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La Sala online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile." }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Ok", onclick: schermataHome }));
    mostra(s);
  }
  function ominoOk(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  // la sala usa la saletta d'attesa dei giochi (stessi personaggi, stesso divano).
  // Col torneo a punti il titolo resta "Sala online": il torneo si accende e si spegne dal ⚙️ senza cambiare schermata
  // comp = la Compagnia: il titolo è il suo nome con l'emoji ("🍻 Quelli del giovedì"); rinominandola cambia solo la scritta
  function gSala(torn, E, comp) {
    if (E) { var gg = giocoDa(E.gioco); return { id: "__sala", nome: E.torneino ? "Torneo" + (gg ? " " + aGioco(gg.nome) : "") : "Torneo", icona: gg ? gg.icona : "🏆" }; }
    if (comp && comp.nome) return { id: "__sala", nome: (comp.emoji ? comp.emoji + " " : "") + comp.nome, icona: comp.emoji || "📌", chiave: "__comp" };
    return { id: "__sala", nome: "Sala online", icona: "👥" };
  }

  // ---------- TORNEO ONLINE ("🏆 Contiamo i punti"): classifica che si somma partita dopo partita ----------
  function segnaNomeT(T, nome) { if (T && nome && T.nomi.indexOf(nome) < 0) T.nomi.push(nome); }
  function classificaT(T) {
    return T.nomi.map(function (n) { return { nome: n, punti: T.punti[n] || 0 }; }).sort(function (a, b) { return b.punti - a.punti; });
  }
  // la lista intera (a pari punti lo stesso posto e la stessa medaglia; prima della prima partita i posti in fila)
  function listaT(T, evidenzia) {
    var cl = classificaT(T), posti = [];
    cl.forEach(function (r, i) { posti.push(evidenzia && i && r.punti === cl[i - 1].punti ? posti[i - 1] : i + 1); });
    var med = medaglieAPari(posti), ol = el("ol", { class: "classifica" + (cl.length > 6 ? " fitta" : "") });
    cl.forEach(function (r, i) {
      ol.appendChild(el("li", { class: posti[i] === 1 && evidenzia ? "vincitore" : "" }, [
        el("span", { class: "pos", text: med[i] }), el("span", { class: "nome", text: r.nome }), el("span", { class: "punti", text: cifre(r.punti) }) ]));
    });
    return ol;
  }
  // "Paky +100 · Luca +78" (solo chi è nel torneo: i bot no)
  // la Classifica della serata in una riga: "🏆 Serata: Paky 1° · Luca 2° · Giulia 3° · …" (a pari punti lo stesso posto)
  function rigaSerataT(T, k) {
    var cl = classificaT(T), posti = [];
    if (!cl.length) return "";
    k = k || 3;
    cl.forEach(function (r, i) { posti.push(i && r.punti === cl[i - 1].punti ? posti[i - 1] : i + 1); });
    return "🏆 Serata: " + cl.slice(0, k).map(function (r, i) { return r.nome + " " + posti[i] + "°"; }).join(" · ") + (cl.length > k ? " · …" : "");
  }
  function puntiRigaT(T, ass) {
    return (ass || []).filter(function (a) { return T.nomi.indexOf(a.nome) >= 0; }).map(function (a) { return a.nome + " +" + cifre(a.punti); }).join(" · ");
  }
  // la classifica corta nella Sala (host e amici): una riga "🏆 Paky 178 · Luca 140 · Giulia 96 ›" (i primi tre).
  // Il nodo è sempre lo stesso (C = sala dell'host o salaG di chi entra): cambia solo la scritta, niente lampeggio.
  // Un tocco apre la classifica intera
  function boxTorneoCorto(T, C) {
    var K = C._corto;
    if (!K) {
      K = C._corto = { tx: el("span", { class: "sl-tc-testo" }) };
      K.nodo = el("button", { class: "sl-torneo-corto", type: "button", onclick: function () { foglioTorneo(C, K.nodo.closest(".schermata"), true); } },
        [ K.tx, el("span", { class: "sl-tc-freccia", "aria-hidden": "true", text: "›" }) ]);
    }
    var cl = classificaT(T), tx;
    if (T.finito && cl.length) tx = "🏆 Serata finita · 👑 " + cl[0].nome + " " + cifre(cl[0].punti);
    else if (!T.n) tx = "🏆 Serata: ancora nessuna partita";
    else tx = "🏆 " + cl.slice(0, 3).map(function (r) { return r.nome + " " + cifre(r.punti); }).join(" · ");
    if (K.tx.textContent !== tx) { K.tx.textContent = tx; K.nodo.setAttribute("aria-label", "Classifica della serata: " + tx.replace(/^🏆\s*/, "")); }
    return K.nodo;
  }
  // il foglio della classifica intera: i posti, "Ultima partita: …" e, per l'host nella Sala, "🏁 Chiudi e premia".
  // Se arrivano punti nuovi mentre è aperto si rifà solo la lista; si chiude da solo se la schermata sotto se ne va
  // (parte un gioco) o il torneo si spegne. schermo = la schermata da cui si è aperto; conPremia = siamo nella Sala
  function foglioTorneo(C, schermo, conPremia) {
    if (document.querySelector(".sl-velo")) return;
    var host = C === sala, velo, tic, firma = "";
    function T() { return host ? (sala === C ? sala.torneo : null) : (salaG === C ? salaG.torneo : null); }
    var lista = el("div", { class: "sl-tc-lista" }), sotto = el("p", { class: "modulo-nota" }), ult = el("p", { class: "modulo-nota sl-tc-ultima" });
    var bPremia = host && conPremia ? el("button", { class: "btn btn-fantasma", text: "🏁 Chiudi e premia", onclick: function () {
      chiediConferma("Chiudere la serata e premiare?", "Tutti vedranno il podio finale.", "🏁 Premia", function () { chiudi(); salaTorneoFine(); });
    } }) : null;
    function chiudi() { clearInterval(tic); if (velo && velo.parentNode) velo.parentNode.removeChild(velo); }
    function rifai() {
      var t = T(); if (!t) return chiudi();
      var f = JSON.stringify([t.punti, t.n, t.nomi, t.finito, t.ultima && t.ultima.gioco]);
      if (f === firma) return;
      firma = f;
      sotto.textContent = t.finito ? "Serata finita." : (t.n ? t.n + (t.n === 1 ? " partita giocata" : " partite giocate") + " · più il gioco è difficile, più punti vale" : "Ancora nessuna partita: i punti arrivano a fine gioco. Più il gioco è difficile, più punti vale.");
      svuota(lista); lista.appendChild(listaT(t, t.n > 0));
      var u = t.ultima ? puntiRigaT(t, t.ultima.assegnati) : "";
      ult.textContent = t.ultima ? "Ultima partita: " + t.ultima.icona + " " + t.ultima.gioco + (u ? " — " + u : "") : "";
      ult.hidden = !t.ultima;
      if (bPremia) bPremia.hidden = !t.n || !!t.finito;
    }
    velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: "🏆 Classifica della serata" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        el("div", { class: "sl-foglio-corpo" }, [ sotto, lista, ult ]),
        bPremia,
        el("button", { class: "btn btn-primario", text: "👍 Ok", onclick: chiudi })
      ])
    ]);
    rifai();
    document.body.appendChild(velo);
    tic = setInterval(function () { if (schermo && !document.body.contains(schermo)) return chiudi(); rifai(); }, 400);
  }
  // la partita è finita: i punti per posto (peso del gioco compreso). ultima.stanza e ultima.giro dicono QUALE partita
  // (la stanza del gioco e il giro della sua saletta: con "↻ Rivincita" nella stessa stanza il giro cresce)
  // q = { stanza, giro } quando la partita non è nella mia stanza (il duello: la apre un amico e me lo dice lui)
  function salaRisultato(g, classifica, q) {
    if (!sala || !classifica || !classifica.length) return;
    var st = (q && q.stanza) || sala.stanza || null, SVg = st ? cuore.SVH[st] : null;
    var giro = q && q.giro != null ? (+q.giro || 0) : (SVg ? (SVg.giro || 0) : 0);
    var nuova = contaGiocate(classifica, st + "|" + giro);
    cuore.restaEsito(classifica, st);   // ("👑 Chi vince resta": chi resta, chi va in coda, la sfida dopo)
    var T = sala.torneo;
    if (!T) { if (nuova) sala._bcast(); return; }
    var ass = cuore.puntiDaClassifica(g, classifica);
    ass.forEach(function (r) { T.punti[r.nome] = (T.punti[r.nome] || 0) + r.punti; });
    T.n += 1; T.ultima = { gioco: g.nome, icona: g.icona || "🎲", assegnati: ass, stanza: st, giro: giro };
    sala._bcast();
    rigaPuntiOra();
  }
  // partite giocate a testa nella serata, per NOME (nel Passo 3 l'host della Sala può cambiare id): servono a "Chi gioca?"
  // (prima chi ha giocato meno). Una partita conta una volta sola (chiave = stanza|giro). true = contata adesso
  function contaGiocate(classifica, k) {
    if (!sala || (sala._giocataK || "") === k) return false;
    sala._giocataK = k;
    var G = sala.giocate = sala.giocate || {};
    sala.membri.forEach(function (m) {
      if (classifica.some(function (r) { return r && !r.bot && stessoNome(r.nome, m.nome); })) G[m.nome] = (G[m.nome] || 0) + 1;
    });
    return true;
  }
  // ---- a fine partita, sopra i tasti: "🏆 Paky +100 · Luca +78" (host della Sala e amici; gli amici la leggono dal
  //  messaggio della Sala). Compare quando arrivano i punti di QUESTA partita (chiave = "stanza|giro"), anche se i tasti
  //  sono già sullo schermo; si cambia solo la scritta. Tocco → la classifica intera
  var RIGA_PT = null;   // { nodo, tx, chiave, sala: true se comando io la Sala }
  function rigaPuntiFine(box, SV, salaHost, host) {
    var T = salaHost ? sala.torneo : (salaG && salaG.torneo);
    if (!T || !SV) return;
    var C = salaHost ? sala : salaG;
    var R = { tx: el("span", { class: "ft-pt-testo" }), chiave: SV.codice + "|" + ((host ? SV.giro : SV.giroH) || 0), sala: salaHost };
    R.nodo = el("button", { class: "ft-punti", type: "button", hidden: "hidden", onclick: function () { foglioTorneo(C, R.nodo.closest(".schermata"), false); } }, [ R.tx ]);
    box.appendChild(R.nodo);
    RIGA_PT = R;
    rigaPuntiOra();
  }
  function rigaPuntiOra() {
    var R = RIGA_PT; if (!R) return;
    if (!R.nodo.isConnected && R.vista) { RIGA_PT = null; return; }   // (la fine non c'è più)
    if (R.nodo.isConnected) R.vista = true;
    var T = R.sala ? (sala && sala.torneo) : (salaG && salaG.torneo), U = T && T.ultima;
    // (deciso dal proprietario: in fondo a ogni fine partita la Classifica della serata, "🏆 Serata: Paky 1° · Luca 2° · …"; i primi tre, il resto col tocco)
    var si = !!(U && (U.stanza + "|" + (U.giro || 0)) === R.chiave), k = 3, tx = si ? rigaSerataT(T, k) : "";
    if (R.nodo.hidden !== !tx) R.nodo.hidden = !tx;
    if (R.tx.textContent !== tx) R.tx.textContent = tx;
    // in una riga sola: se non ci sta (schermo piccolo, nomi lunghi) si tolgono nomi dal fondo (tutto nello stesso momento: niente lampeggio)
    while (tx && k > 1 && R.nodo.isConnected && R.nodo.clientWidth && R.nodo.scrollWidth > R.nodo.clientWidth + 1) { tx = rigaSerataT(T, --k); R.tx.textContent = tx; }
    if (tx && !R.nodo.isConnected && !R.misura) { R.misura = 1; setTimeout(rigaPuntiOra, 60); }   // (appena la fine è sullo schermo: si misura)
  }
  function schermataPodioT(T, host) {
    var s = schermata({ icona: "🏆", titolo: "Fine della serata!", sotto: T.n + (T.n === 1 ? " partita giocata" : " partite giocate") });
    var cl = classificaT(T);
    if (cl.length) s._contenuto.appendChild(el("div", { class: "sl-campione" }, [ el("div", { class: "sl-camp-cor", text: "👑" }), el("div", { class: "sl-camp-nome", text: cl[0].nome }), el("div", { class: "sl-camp-sotto", text: "vince la serata con " + cifre(cl[0].punti) + " punti" }) ]));
    s._contenuto.appendChild(listaT(T, true));
    if (host) {
      // si resta nella Sala, con lo stesso codice: un torneo nuovo da zero, oppure la Sala senza torneo
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Nuova classifica (stessi amici)", onclick: function () {
        if (!sala || sala.torneo !== T) return;
        T.punti = {}; T.n = 0; T.ultima = null; T.finito = false; T.nomi = sala.membri.map(function (m) { return m.nome; });
        sala._bcast(); disegnaSalaHost();
      } }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "👥 Torna nella Sala", onclick: function () {
        if (!sala) return schermataHome();
        // (con la Sala della serata la classifica resta sempre accesa: si riparte da zero)
        if (sala.torneo === T) { if (salaSempre()) { T.punti = {}; T.n = 0; T.ultima = null; T.finito = false; T.nomi = sala.membri.map(function (m) { return m.nome; }); } else sala.torneo = null; sala._bcast(); }
        disegnaSalaHost();
      } }));
    } else {
      // (quando l'host sceglie, la Sala torna da sola: qui si può solo uscire)
      s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: ((salaG && salaG.nomeHost) || "L'host") + " decide se ricominciare la classifica: si torna nella Sala da soli." }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci dalla Sala", onclick: function () { chiudiSalaOspite(); schermataHome(); } }));
    }
    mostra(s);
  }
  function salaTorneoFine() {
    if (!sala || !sala.torneo) return;
    sala.torneo.finito = true; sala._bcast();
    schermataPodioT(sala.torneo, true);
  }
  // ⚙️ della Sala (host): "🏆 Contiamo i punti" acceso o spento (spento coi punti già dati: prima chiede).
  // I posti per le scelte dei passi dopo ci sono già, nascosti: "🗳️ Scegliamo insieme" (Passo 6) e la Compagnia (Passo 3)
  function foglioSala(U) {
    if (document.querySelector(".sl-velo")) return;
    var velo;
    var chk = el("input", { type: "checkbox", "aria-label": "Classifica della serata" }); chk.checked = !!(sala && sala.torneo);
    function accendi(si) {
      if (!sala) return;
      if (si && !sala.torneo) sala.torneo = { punti: {}, nomi: sala.membri.map(function (m) { return m.nome; }), n: 0, ultima: null, finito: false };
      else if (!si) sala.torneo = null;
      sala._bcast(); disegnaSalaHost();
      chk.checked = !!sala.torneo;
    }
    chk.addEventListener("change", function () {
      if (chk.checked) return accendi(true);
      if (!(sala && sala.torneo && sala.torneo.n)) return accendi(false);
      chk.checked = true;   // (resta acceso finché non si conferma)
      chiediConferma("Spegnere la classifica?", "I punti di stasera si perdono.", "Spegni", function () { accendi(false); });
    });
    function chiudi() { if (velo.parentNode) velo.parentNode.removeChild(velo); }
    // con la Sala della serata la Classifica della serata è sempre accesa: l'host la può solo azzerare o chiudere con la premiazione
    var T0 = sala && sala.torneo, sempre = salaSempre() && !!T0;
    var corpo = el("div", { class: "sl-foglio-corpo" }, [
      rigaCompSala(chiudi),   // (in cima: "📌 Fanne la nostra Compagnia", o il nome e il link fisso della Compagnia)
      sempre ? el("div", { class: "sl-viva-opz sl-serata" }, [
        el("b", { text: "🏆 Classifica della serata" }),
        el("small", { text: "Sempre accesa: a fine partita ognuno prende punti per come è arrivato (più il gioco è difficile, più punti vale)." }),
        el("div", { class: "sl-serata-tasti" }, [
          el("button", { class: "btn btn-fantasma", type: "button", text: "🔄 Azzera", disabled: T0.n ? null : "disabled", onclick: function () {
            chiediConferma("Azzerare la classifica?", "I punti di stasera ripartono da zero.", "🔄 Azzera", function () {
              if (!sala || !sala.torneo) return;
              var T = sala.torneo; T.punti = {}; T.n = 0; T.ultima = null; T.finito = false; T.nomi = sala.membri.map(function (m) { return m.nome; });
              chiudi(); sala._bcast(); disegnaSalaHost();
            });
          } }),
          el("button", { class: "btn btn-fantasma", type: "button", text: "🏁 Chiudi e premia", disabled: T0.n ? null : "disabled", onclick: function () {
            chiediConferma("Chiudere la serata e premiare?", "Tutti vedranno il podio finale.", "🏁 Premia", function () { chiudi(); salaTorneoFine(); });
          } })
        ])
      ]) : el("div", { class: "sl-viva-opz" }, [
        el("label", { class: "sl-interruttore" }, [ el("span", { text: "🏆 Classifica della serata" }), chk ]),
        el("small", { text: "A fine partita ognuno prende punti per come è arrivato: più il gioco è difficile, più punti vale. La classifica si vede nella Sala." })
      ]),
      cuore.rigaInsieme(),   // (Passo 6: "🗳️ Scegliamo insieme")
      el("div", { class: "sl-viva-opz", hidden: "hidden", "data-posto": "compagnia" }),   // (Passo 3: la Compagnia)
      el("p", { class: "modulo-nota", text: "Per far uscire qualcuno, tieni premuto sul suo avatar." })
    ]);
    velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: "⚙️ La Sala" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        corpo,
        el("button", { class: "btn btn-primario", text: "✅ Fatto", onclick: chiudi })
      ])
    ]);
    document.body.appendChild(velo);
  }

  // ---------- HOST ----------
  // opz.torneo = torneo online: la stessa sala, con la classifica che si somma
  // opz.riapri = la Sala salvata (la pagina si è ricaricata o l'app si è chiusa): si riapre con lo stesso codice,
  //   gli stessi amici e lo stesso torneo; chi non torna entro 30 secondi viene tolto
  // opz.gioco = id del gioco da cui si è toccato "Online": parte appena la Sala ha il suo codice
  // Senza profilo (con la Sala sempre accesa) la Sala si apre lo stesso: nome dell'ultima volta, o "Come ti chiami?" una volta
  // La Compagnia (Passo 3): opz.codiceFisso = la Sala usa quel codice (6 lettere); opz.comp = { nome, emoji, rv };
  //   opz.gen = la generazione (1, 2, 3… sale quando la Sala passa a un altro); opz.sopra = la sessione della Sala morta che
  //   sto riaprendo (la sua foto non conta come "occupata"); opz.eredita = { membri, torneo, giocate, porta, nomi } (una Sala
  //   che continua: i membri hanno 30 s per rientrare, come in riapri); opz.mioId = il mio id da amico in quella Sala;
  //   opz.nome = il mio nome nella Sala se diverso da quello del profilo ("Luca 2").
  //   Con un codice fisso (o riaprendo) prima si guarda la stanza: se c'è la Sala viva di un altro si entra da amico (cediSala)
  function creaSala(opz) {
    if (opz && opz.target) opz = null;   // (dal tasto: arriva il tocco, non le opzioni)
    var R0 = (opz && opz.riapri) || null;
    var EZ = (!R0 && opz && opz.eredita) || null;
    var CF = !R0 && opz && opz.codiceFisso ? String(opz.codiceFisso).toUpperCase() : null;
    var elimG = R0 ? ((R0.elim && R0.elim.gioco) || null) : ((opz && typeof opz.eliminazione === "string") ? opz.eliminazione : null);
    var torn = R0 ? !!R0.torneo : (!!(opz && opz.torneo === true) || (salaSempre() && !elimG));   // (con la Sala della serata la Classifica della serata è accesa da sola)
    var gPartenza = !R0 && opz && opz.gioco ? giocoDa(opz.gioco) : null;
    // opz.torneino = { gioco, imp, box, resto, livello, attesi }: la stanza di un gioco a due diventa il torneino (vedi torneinoDaSaletta);
    // opz.codice = il codice della Sala già deciso (chi era nella stanza lo riceve prima che la Sala si apra)
    var torO = !R0 && !elimG && opz && opz.torneino && giocoDa(opz.torneino.gioco) ? opz.torneino : null;
    if (!(window.SGNet && SGNet.disponibile())) return salaSenzaRete();
    var io = profiloAttivo();
    if (!io) {
      if (!salaSempre() && !R0) return cuore.schermataAccesso(function () { creaSala(opz); });
      var hostR = R0 ? (R0.membri || []).filter(function (m) { return m && m.id === "host"; })[0] : null;
      var nomeH = String((opz && opz.nomeHost) || (R0 && R0.nomeHost) || nomeOspiteSalvato() || ((gruppo[0] && gruppo[0].nome) || "")).trim().slice(0, 16);
      if (!nomeH) return schermataNomeSala(opz);   // una volta sola: poi il telefono se lo ricorda
      io = { nome: nomeH, emoji: "🙂", omino: (hostR && ominoOk(hostR.omino)) || (window.SGOmino ? SGOmino.casuale(nomeH) : null) };
    }
    cuore.tieniAcceso(true);   // la Sala: lo schermo resta acceso finché si gioca
    if (sala && sala.tVivo) clearInterval(sala.tVivo);
    // una Sala sola per telefono: quella di prima si chiude (chi chiama ha già chiesto se va bene). Il trasloco nella
    // Compagnia (p3-b) la lascia da sé
    if (sala && !(opz && opz.trasloco)) chiudiSala();
    var conPr = !!profiloAttivo();
    var membri = [{ id: "host", nome: String((opz && opz.nome) || io.nome).slice(0, 16), emoji: io.emoji, omino: io.omino || null, pr: conPr ? 1 : 0 }];
    if (R0) (R0.membri || []).forEach(function (m) { if (m && m.id && m.id !== "host") membri.push(m); });
    // una Sala che continua (riaperta da un amico): io non ci sono due volte; chi la teneva prima diventa uno che deve
    // rientrare (ex: quando entra col suo id nuovo e lo stesso nome prende il suo posto)
    if (EZ) (EZ.membri || []).forEach(function (m) {
      if (!m || !m.id || typeof m !== "object") return;
      if ((opz.mioId && m.id === opz.mioId) || stessoNome(m.nome, membri[0].nome)) return;
      if (m.id === "host") m = Object.assign({}, m, { id: "ex-" + Math.random().toString(36).slice(2, 8), ex: 1 });
      membri.push({ id: String(m.id), nome: String(m.nome || "Amico").slice(0, 16), emoji: m.emoji || "🙂", omino: ominoOk(m.omino), pr: m.pr ? 1 : 0, ex: m.ex ? 1 : undefined });
    });
    var RZ = R0 || EZ;   // (riaperta o ereditata: chi c'era ha 30 secondi per tornare)
    sala = { rete: null, codice: R0 ? R0.codice : (CF || "…"), pronta: false, membri: membri, gioco: null, stanza: null, inGioco: false,
      nato: (R0 && +R0.nato) || Date.now(), gen: (R0 && +R0.gen) || (+(opz && opz.gen) || 1), dev: idTelefono(), vice: [], riaperta: !!R0,
      comp: (R0 && R0.comp) || (opz && opz.comp) || (EZ && EZ.comp) || null,
      torneo: R0 ? (R0.torneo || null) : (EZ && EZ.torneo && typeof EZ.torneo === "object" ? EZ.torneo : (torn ? { punti: {}, nomi: [io.nome], n: 0, ultima: null, finito: false } : null)),
      elim: R0 ? (R0.elim || null) : (elimG ? { gioco: elimG, iniziato: false, finito: false, turni: [], nomi: {}, campione: null, gironi: {} } : (torO ? cuore.nuovoTorneino(torO.gioco, torO.imp, torO, torO.attesi || []) : null)), inPartitaK: null, attesi: null, regole: {},
      fase: null, fuori: {}, ctx: null, sceglie: false,   // fase: del gioco in corso; fuori: { id: stanza } chi è uscito apposta dal gioco; ctx: quello del gioco lanciato; sceglie: l'host sta scegliendo il prossimo gioco
      giocate: (R0 && R0.giocate) || (EZ && EZ.giocate && typeof EZ.giocate === "object" ? EZ.giocate : {}), duello: null,   // giocate: { nome: partite } ("Chi gioca?"); duello: un gioco a due senza l'host (salaDuello)
      // "👑 Chi vince resta" (la serie e il record di stasera): restano se la pagina si ricarica, col subentro e col trasloco
      resta: cuore.restaDaPrima(R0, EZ, "resta"), restaRec: cuore.restaDaPrima(R0, EZ, "restaRec"),
      // "🗳️ Scegliamo insieme": l'interruttore è del telefono dell'host; i giochi di stasera restano (ricarica, subentro, trasloco)
      insieme: cuore.insiemeSalvato(), voto: null, votoN: 0,
      giochiFatti: (function (f) { return Array.isArray(f) ? f.filter(function (x) { return typeof x === "string"; }).slice(-30) : []; })((R0 && R0.giochiFatti) || (EZ && EZ.giochiFatti)) };
    // il voto di prima (pagina ricaricata: riparte da capo; subentro: continua) si riapre quando la Sala è di nuovo mia
    var votoPrima = cuore.votoValido(R0 && R0.voto) ? R0.voto : (EZ && cuore.votoValido(EZ.voto) ? EZ.voto : null), votoCont = !R0 && !!votoPrima;
    var S0 = sala;
    // il subentro (p3-c) con una partita che continua (il duello di due amici, o un gioco col suo host di riserva): la Sala
    // nuova la tiene com'è e chi ci gioca ci resta. Io resto nel gioco se ci stavo (EZ.ctx: il mio, diventato da host)
    if (EZ && EZ.gioco && EZ.stanza && giocoDa(EZ.gioco)) {
      sala.gioco = EZ.gioco; sala.stanza = EZ.stanza; sala.fase = EZ.fase || "gioco"; sala.fuori = EZ.fuori || {}; sala.scelti = EZ.scelti || null;
      var Dz = EZ.duello;
      if (Dz && Dz.stanza === EZ.stanza) sala.duello = { a: Dz.a, b: Dz.b, na: Dz.na, nb: Dz.nb, stanza: Dz.stanza, gioco: Dz.gioco || EZ.gioco, imp: Dz.imp || {},
        n: Dz.fine ? +Dz.fine.n || 0 : 0, fine: Dz.fine || null, visti: Dz.fine ? (function (o) { o[String(Dz.fine.giro | 0)] = 1; return o; })({}) : {} };
      if (EZ.ctx) { sala.inGioco = true; sala.ctx = EZ.ctx; }
    }
    // (Passo 5) la mia pagina si è ricaricata con un gioco in corso nella Sala: il duello dei due amici continua (era sul
    // telefono di chi l'ha aperto); il mio gioco, se sa riprendere e la sua partita è ricordata, si riapre con lo STESSO codice
    // appena la Sala è di nuovo mia (riprendiG): la prima foto della Sala dice già il gioco, così gli amici restano dentro
    var riprendiG = null, RG = R0 && R0.gioco && R0.gioco.id && R0.gioco.stanza && !R0.elim ? R0.gioco : null, gRG = RG ? giocoDa(RG.id) : null;
    if (gRG) {
      var Dr = RG.duello && RG.duello.stanza === RG.stanza && RG.duello.a && RG.duello.b ? RG.duello : null;
      if (Dr || (gRG.riprende && cuore.ripresaDi(gRG.id, RG.stanza))) {
        sala.gioco = gRG.id; sala.stanza = RG.stanza; sala.fase = typeof RG.fase === "string" ? RG.fase : "gioco";
        sala.fuori = RG.fuori && typeof RG.fuori === "object" ? RG.fuori : {}; sala.scelti = Array.isArray(RG.scelti) ? RG.scelti : null;
        if (Dr) sala.duello = { a: Dr.a, b: Dr.b, na: Dr.na, nb: Dr.nb, stanza: Dr.stanza, gioco: Dr.gioco || gRG.id, imp: Dr.imp || {},
          n: Dr.fine ? +Dr.fine.n || 0 : 0, fine: Dr.fine || null, visti: Dr.fine ? (function (o) { o[String(Dr.fine.giro | 0)] = 1; return o; })({}) : {} };
        else {
          sala.inGioco = true; riprendiG = { g: gRG, imp: RG.imp || {} };
          // (chi era nella partita: anche se adesso è via, quando ricarica torna nella partita e non resta nella Sala)
          if (Array.isArray(RG.nel)) sala.nelSeme = { stanza: RG.stanza, ids: RG.nel.filter(function (id) { return typeof id === "string"; }).slice(0, 40) };
        }
      }
    }
    if (sala.torneo && EZ) membri.forEach(function (m) { segnaNomeT(sala.torneo, m.nome); });
    // la Compagnia che apro io: va (o resta) tra le mie, in cima
    if (CF && sala.comp && window.SGCompagnia) try { SGCompagnia.salva({ c: CF, n: sala.comp.nome, e: sala.comp.emoji, rv: sala.comp.rv || 0 }); SGCompagnia.usata(CF); } catch (e) {}
    // ogni volta che la Sala cambia la mando a tutti e me la segno (per riaprirla se la pagina si ricarica: stessa gen e stesso
    // nato, così chi è dentro capisce che è sempre la stessa Sala)
    function salva() { if (sala === S0 && sala.codice && sala.codice !== "…") cuore.ricordaMiaSala({ codice: sala.codice, nomeHost: sala.membri[0] && sala.membri[0].nome, membri: sala.membri, torneo: sala.torneo, elim: sala.elim, giocate: sala.giocate, porta: sala.rete && sala.rete._sv && sala.rete._sv.porta ? 1 : 0,
      nato: sala.nato, gen: sala.gen, comp: sala.comp || null, s: sala.rete ? sala.rete.sessione : null, gioco: giocoSalvato(),
      resta: sala.resta || null, restaRec: sala.restaRec || null,
      giochiFatti: sala.giochiFatti || [], voto: sala.voto ? { n: sala.voto.n, giochi: sala.voto.giochi, voti: sala.voto.voti, fase: sala.voto.fase, ruota: sala.voto.ruota || null } : null }); if (sala === S0) cuore.ricordaSalaIeri(sala); }
    // (Passo 5) il gioco in corso nella Sala: se la pagina si ricarica la Sala lo riapre con lo stesso codice e la partita
    // riprende (il gioco col suo t.ripresa), oppure il duello dei due amici continua. null = nessun gioco da ritrovare
    function giocoSalvato() {
      if (!sala.gioco || !sala.stanza || sala.elim) return null;
      var D = sala.duello && sala.duello.stanza === sala.stanza ? sala.duello : null;
      return { id: sala.gioco, stanza: sala.stanza, fase: sala.fase || "lobby", fuori: sala.fuori || {}, scelti: sala.scelti || null, imp: D ? null : (sala.impGioco || null),
        nel: nelGiocoSala(sala),   // (chi è nella partita: se la pagina si ricarica, chi è via e poi torna rientra nella partita)
        duello: D ? { a: D.a, b: D.b, na: D.na, nb: D.nb, stanza: D.stanza, gioco: D.gioco, imp: D.imp || {}, fine: D.fine || null } : null };
    }
    // (col gioco: fase = a che punto è, nel = chi è dentro la sua stanza, fuori = chi ne è uscito apposta;
    //  duello = il gioco a due tra due amici senza l'host: chi apre la stanza, chi entra, com'è finita)
    function bcast(soloFoto) {   // (soloFoto: la manda e basta, senza riscrivere la Sala ricordata: la pausa)
      var D = sala && sala.gioco && sala.duello && sala.duello.stanza === sala.stanza ? sala.duello : null;
      if (sala) sala.vice = viceDi();
      // ("🗳️ Scegliamo insieme": chi non è più nella Sala perde il voto; chi arriva o se ne va cambia "hanno votato tutti")
      var Vb = sala && sala.voto;
      if (Vb && Vb.fase === "voto") {
        var ciB = {}; sala.membri.forEach(function (x) { ciB[x.id] = 1; });
        Object.keys(Vb.voti).forEach(function (id) { if (!ciB[id]) delete Vb.voti[id]; });
        cuore.votoTimer();
      }
      // (punto: "round 3 di 5" del gioco in corso, da t.aCheSiamo; con un'altra stanza si ricomincia da vuoto)
      if (sala && sala.puntoDi !== sala.stanza) { sala.punto = ""; sala.puntoDi = sala.stanza; }
      // (nato, gen, dev: chi tiene la Sala, per la regola "una Sala sola"; vice: chi la prende se me ne vado; comp: la Compagnia)
      if (sala && sala.rete) sala.rete.invia({ t: "sala", codice: sala.codice, nato: sala.nato, gen: sala.gen, dev: sala.dev, vice: sala.vice, comp: sala.comp || null,
        membri: sala.membri, gioco: sala.gioco, stanza: sala.stanza, torneo: sala.torneo, elim: sala.elim,
        fase: sala.gioco ? (sala.fase || "lobby") : null, nel: sala.gioco ? nelGiocoSala(sala) : [], fuori: sala.gioco ? fuoriSala(sala) : [],
        sceglie: !sala.gioco && sala.sceglie ? (sala.sceglie === "sfida" ? 2 : 1) : undefined, giocate: sala.giocate || {},
        sc: sala.gioco && sala.scelti ? sala.scelti : undefined,
        punto: sala.gioco && sala.punto ? sala.punto : undefined,
        duello: D ? { a: D.a, b: D.b, na: D.na, nb: D.nb, stanza: D.stanza, gioco: D.gioco, imp: D.imp, fine: D.fine } : undefined,
        trasloco: sala.trasloco || undefined,   // (la Sala si è spostata nella Compagnia: chi la legge ci va da solo)
        // cede: l'host passa la Sala a quell'amico ("👑 Passa la Sala"); pausa: l'host è uscito un attimo dall'app (ora sua):
        // se poi sparisce, i vice aspettano di più (90 s e 120 s) prima di prendere la Sala
        cede: sala.cede || undefined, pausa: sala.pausa || undefined,
        // "👑 Chi vince resta": la serie (coda, campione, la sfida dopo, l'ora dell'host per il conto) e il record di stasera
        resta: sala.resta ? cuore.restaFoto(sala.resta) : undefined, restaRec: sala.restaRec || undefined,
        // "🗳️ Scegliamo insieme": l'interruttore (gli amici sanno che si vota), il voto o la ruota, i giochi di stasera
        insieme: sala.insieme ? 1 : undefined, voto: sala.voto ? cuore.votoFoto(sala.voto) : undefined,
        giochiFatti: sala.giochiFatti && sala.giochiFatti.length ? sala.giochiFatti : undefined });
      if (!soloFoto) salva();
      if (sala && (sala.resta || cuore.RESTA_FINE)) cuore.restaAggiorna();   // (le mie scritte: fine sfida, targhetta, coda nella Sala)
      if (sala && sala.voto && cuore.VOTO_UI && cuore.VOTO_UI.S === sala) cuore.votoAggiornaUI();   // (la mia scheda del voto: chi ha votato, quanti siamo)
    }
    function agg() {
      bcast(); if (!sala) return;
      if (sala.elim) { if (cuore.torneinoArrivati()) return; return cuore.seguiHost(); }   // torneo a eliminazione: la sala si vede solo quando non sto giocando
      // (mentre l'host sceglie il gioco o chi gioca non lo riporto nella Sala perché un amico è entrato o ha ridetto "ci sono")
      if (!sala.inGioco && !(sala.torneo && sala.torneo.finito) && !hostSceglie()) disegnaSalaHost();
      else rinfrescaAttesi();   // (nella saletta del gioco: chi manca)
    }
    sala._bcast = bcast;
    // il nome della Compagnia arrivato da un amico: si prende solo se è più nuovo (rv). true = cambiato (agg() lo manda a tutti)
    function compPiuNuova(c) {
      if (!c || !sala || !sala.comp || !c.nome || (+c.rv || 0) <= (+sala.comp.rv || 0)) return false;
      sala.comp = { nome: String(c.nome).slice(0, 24), emoji: String(c.emoji || sala.comp.emoji).slice(0, 8), rv: +c.rv };
      if (window.SGCompagnia) try { SGCompagnia.aggiorna(sala.codice, sala.comp); } catch (e) {}
      return true;
    }
    sala.tVivo = setInterval(function () { if (sala !== S0) return clearInterval(S0.tVivo); salva(); }, 60000);   // anche se non succede niente: "è ancora aperta"
    if (torO) {
      // il torneino nato da una stanza: le regole del gioco di prima; si parte quando sono arrivati tutti (torneinoArrivati)
      // o al massimo dopo 8 secondi con chi c'è (se non è arrivato nessuno resta la Sala)
      sala._regoleBox = torO.box || null;
      setTimeout(function () {
        var E = sala === S0 && sala.elim;
        if (!E || !E.torneino || E.iniziato) return;
        delete E.attesi;
        if (sala.membri.length >= 2) return cuore.partiTorneino(E);
        sala.elim = null; sala.regoleElim = null; sala._regoleBox = null; agg();
      }, 8000);
    }
    if (RZ) {
      // l'host ha ricaricato mentre ci si sedeva («✋ Scegliete voi»): il conto alla rovescia riparte (almeno 15 s), se no la Sala resta ferma
      var Ec = sala.elim;
      if (Ec && Ec.torneino && Ec.coppie === "scelte" && Ec.scade && !Ec.iniziato) {
        Ec.scade = Math.max(Ec.scade, Date.now() + 15000);
        sala.tCoppie = setTimeout(function () { if (sala === S0 && sala.elim === Ec && !Ec.iniziato) cuore.avviaElim(); }, Ec.scade - Date.now());
      }
      // chi c'era ha 30 secondi per tornare (rientra da solo appena vede la Sala riaperta)
      sala.attesi = {}; membri.forEach(function (m) { if (m.id !== "host") sala.attesi[m.id] = 1; });
      setTimeout(function () {
        if (sala !== S0 || !sala.attesi) return;
        var via = Object.keys(sala.attesi); sala.attesi = null;
        if (!via.length) return;
        sala.membri = sala.membri.filter(function (m) { return via.indexOf(m.id) < 0; });
        if (sala.elim) via.forEach(function (id) { if (sala.elim.gironi) delete sala.elim.gironi[id]; cuore.elimUscito(id); });
        via.forEach(cuore.restaVia);   // ("👑 Chi vince resta": chi non è tornato esce dalla coda)
        agg();
      }, 30000);
      cuore.NOMI_SEME = {}; membri.forEach(function (m) { if (!m.ex) cuore.NOMI_SEME[m.id] = m.nome; });   // i nomi già dati ("Luca 2") restano a chi li aveva
      cuore.PORTA_SALA_SEME = !!RZ.porta;   // la porta resta com'era (chiusa: rientra solo chi c'era)
      if (R0) pillola("riapro", "🔁 Riapro la tua Sala (" + R0.codice + ")…", "blu", 4000);
    }
    // la rete della Sala: sente anche le foto degli altri host sullo stesso codice (ascoltaStato: due Sale → ne resta una),
    // ricollegandosi guarda prima di parlare (guardaRitorno: un telefono addormentato non copre la Sala di stasera),
    // il testamento dice la generazione; col codice fisso (o riaprendo) guarda anche la prima volta (guardaPrima)
    var opzR = { ascoltaStato: true, guardaRitorno: 1200, testamento: { g: sala.gen } };
    var codR = R0 ? R0.codice : (CF || (opz && opz.codice ? String(opz.codice).toUpperCase() : null));
    if (codR) opzR.codice = codR;
    if (CF || RZ) { opzR.guardaPrima = 1500; var sopra = (opz && opz.sopra) || (R0 && R0.s) || null; if (sopra) opzR.sopra = sopra; }
    sala.rete = SGNet.ospita("__sala", {
      onCodice: function (c) {
        if (sala !== S0) return;   // (la Sala di prima, traslocata nella Compagnia: non tocca quella nuova)
        sala.codice = c;
        // "Online" da un gioco: il gioco parte adesso, che la Sala ha il suo codice (prima era "…")
        // (col codice fisso prima si guarda se la Sala è già di un altro: il gioco parte quando la Sala è davvero mia)
        if (gPartenza && sala === S0 && !(CF || RZ)) { var gp = gPartenza; gPartenza = null; salva(); return salaPreparaGioco(gp); }
        agg();
      },
      onConnesso: function () {
        if (sala !== S0) return;
        sala.pronta = true;
        if (sala.resta && !S0.restaVista) { S0.restaVista = true; cuore.restaRiprendi(); }   // ("👑 Chi vince resta" continua: Sala riaperta, subentro, trasloco)
        if (gPartenza) { var gp2 = gPartenza; gPartenza = null; bcast(); return salaPreparaGioco(gp2); }
        if (riprendiG) { var rg = riprendiG; riprendiG = null; bcast(); return salaRiprendiGioco(rg.g, rg.imp); }   // (la Sala è mia: il gioco riprende)
        if (votoPrima && !sala.gioco) { var vp = votoPrima; votoPrima = null; if (cuore.salaVotoRiprendi(vp, votoCont)) return; }   // ("🗳️ Scegliamo insieme": il voto si riapre)
        agg();
      },
      // collegandomi c'è già la Sala viva di un altro su questo codice: se vince la mia parlo, se no entro da amico
      onOccupata: function (m) {
        if (sala !== S0 || S0.ceduta) return false;
        if (!m || m.t !== "sala" || vinceLaMia(S0, m)) return true;
        setTimeout(function () { cediSala(m, S0); }, 0);
        return false;
      },
      // la foto di un altro host sullo stesso codice (due aperte insieme, o un telefono che torna): ne resta una sola.
      // Se vince la mia la rimetto subito (l'altra aveva coperto la foto trattenuta), se no entro da amico
      onStato: function (m) {
        if (sala !== S0 || S0.ceduta || !m || m.t !== "sala" || !m._s || !S0.rete || m._s === S0.rete.sessione) return;
        // sto passando la Sala a un amico: appena c'è la sua (generazione più alta) me ne vado in home
        if (S0.passa && (+m.gen || 1) > S0.gen) return salaPassata(S0, m);
        if (!vinceLaMia(S0, m)) return cediSala(m, S0);
        if (Date.now() - (S0.rimessa || 0) > 400) { S0.rimessa = Date.now(); bcast(); }
      },
      onAddio: function (id) {
        if (sala !== S0 || S0.passa) return;   // (gli amici escono dalla Sala di prima perché sono passati nella Compagnia, o in quella dell'amico a cui la passo: restano)
        sala.membri = sala.membri.filter(function (m) { return m.id !== id; }); if (sala.attesi) delete sala.attesi[id]; if (sala.fuori) delete sala.fuori[id]; if (sala.elim) { if (sala.elim.gironi) delete sala.elim.gironi[id]; cuore.elimUscito(id); }
        cuore.restaVia(id);   // ("👑 Chi vince resta": via dalla coda; se giocava, vince l'altro)
        if (sala.duello && sala.duello.a === id && sala.stanza === sala.duello.stanza) return cuore.fineDuelloSala();   // chi aveva aperto il duello è uscito dalla Sala
        agg();
      },
      onMsg: function (id, m) {
        if (sala !== S0) return;   // (la Sala di prima, traslocata: chi bussa lì legge il trasloco nella sua foto)
        if (S0.passa) return;   // (la sto passando a un amico: chi bussa adesso entra nella sua, io non mando più niente)
        // un amico ha rinominato la Compagnia sul suo telefono (dalla lista delle compagnie): vince il nome più nuovo
        if (m && m.t === "comp") { if (compPiuNuova(m.comp)) agg(); return; }
        if (m && m.t === "esito" && sala.elim) return cuore.esitoPartita(m.k, !!m.vinto, id);   // torneo a eliminazione: com'è finita una partita
        if (m && m.t === "girone" && sala.elim) return cuore.scegliGironeElim(id, m.g);   // torneo a eliminazione: dove si siede
        // il duello (gioco a due senza l'host): com'è finito e a che punto è. Vale solo da chi l'ha aperto e per la sua stanza
        if (m && (m.t === "salaEsito" || m.t === "duelloFase")) return cuore.msgDuello(id, m);
        // "🗳️ Scegliamo insieme": il voto di un amico ({ n: quale voto, g: il gioco })
        if (m && m.t === "voto") return cuore.salaVotoSegna(id, m.n, m.g);
        // un amico è uscito apposta dal gioco (non lo aspettiamo) o ci rientra ("Rientra ▶")
        if (m && (m.t === "esco" || m.t === "rientro")) {
          if (!sala.membri.some(function (x) { return x.id === id; })) return;
          if (m.t === "esco") cuore.restaEsce(id, m.stanza);   // ("👑 Chi vince resta": uno dei due lascia la sfida, vince l'altro)
          // chi ha aperto il duello torna nella Sala: il duello è finito per tutti
          if (m.t === "esco" && sala.duello && sala.duello.a === id && m.stanza && m.stanza === sala.duello.stanza && sala.stanza === m.stanza) return cuore.fineDuelloSala();
          sala.fuori = sala.fuori || {};
          if (m.t === "esco") { if (!m.stanza || m.stanza !== sala.stanza || sala.fuori[id] === m.stanza) return; sala.fuori[id] = m.stanza; }
          else { if (!sala.fuori[id]) return; delete sala.fuori[id]; }
          bcast(); rinfrescaAttesi(); return;
        }
        if (!m || m.t !== "join") return;
        if (sala.attesi) delete sala.attesi[id];   // è tornato (Sala riaperta)
        var gia = sala.membri.filter(function (x) { return x.id === id; })[0];
        if (!gia) {
          // (i nomi doppi li ha già sistemati lo strato comune della rete: il secondo "Luca" arriva come "Luca 2")
          var nome = String(m.nome || "Amico").slice(0, 16), nuovo = { id: id, nome: nome, emoji: m.emoji || "🙂", omino: ominoOk(m.omino), pr: m.pr ? 1 : 0 };
          // chi teneva la Sala prima (ex) torna col suo id nuovo: prende il suo posto
          var ex = sala.membri.filter(function (x) { return x.ex && stessoNome(x.nome, nome); })[0];
          if (ex) { sala.membri[sala.membri.indexOf(ex)] = nuovo; if (sala.attesi) delete sala.attesi[ex.id]; }
          else sala.membri.push(nuovo);
          cuore.restaEntra(id, ex ? ex.id : null);   // ("👑 Chi vince resta": in fondo alla coda)
          segnaNomeT(sala.torneo, nome);
        } else if (!!gia.pr !== !!m.pr) gia.pr = m.pr ? 1 : 0;   // (chi ha il profilo può fare da vice)
        // la Compagnia con un nome più nuovo (rinominata dal telefono di un amico): la prendo e la mando a tutti
        compPiuNuova(m.comp);
        agg();
      },
      onErrore: function () { salaSenzaRete(); }
    }, opzR);
    if (sala.rete && sala.rete._sv) sala.rete._sv.salva = salva;   // (la porta chiusa o aperta si ricorda subito)
    if ((!gPartenza || CF || RZ) && !sala.inGioco) disegnaSalaHost();   // (con un gioco di partenza si va dritti nella sua saletta; nel subentro dentro un gioco si resta nel gioco)
    else if (riprendiG) mostra(schermata({ icona: riprendiG.g.icona || "🎲", titolo: "Riprendo la partita…", sotto: riprendiG.g.nome }));   // (un attimo: la Sala torna mia, poi il gioco)
  }

  function chiudiSala() { try { if (sala && sala.rete) sala.rete.chiudi(); } catch (e) {} if (sala && sala.tVivo) clearInterval(sala.tVivo); sala = null; cuore.dimenticaMiaSala(); }

  // su questo codice c'è già la Sala viva di un altro, che vince (aperta prima, o di una generazione più nuova): la mia
  // si lascia in silenzio (senza testamento e senza pulire la sua foto) ed entro da amico. Una volta sola
  function cediSala(m, S0) {
    if (!sala || sala !== S0 || S0.ceduta) return;
    S0.ceduta = true;
    var C = S0.codice, io0 = S0.membri[0] || {}, eraMia = !!(S0.riaperta || S0.pronta), chi = nomeHostDi(m) || "un amico";
    try { S0.rete.lascia(); } catch (e) {}
    clearInterval(S0.tVivo); clearTimeout(S0.tCoppie);
    if (S0.inGioco) {   // (la partita era sul mio telefono: non c'è più)
      // ...ma un gioco con l'host di riserva lo porta avanti un amico (o lo prende adesso): dalla sua stanza esco come se
      // fossi sparito, perché un "chiusa apposta" di chi la teneva prima farebbe uscire dalla partita chi gioca col vice
      var conRiserva = !!(cuore.partitaCorrente && cuore.partitaCorrente.viva() && cuore.riservaPer(cuore.partitaCorrente));
      lasciaPartita(); if (conRiserva && SGNet.lasciaGiochi) SGNet.lasciaGiochi(); else SGNet.chiudiGiochi();
    }
    cuore.chiudiTabelloneElim();
    sala = null; cuore.dimenticaMiaSala();
    pillola("riapro", null);
    pillola("sala", eraMia ? "👋 Bentornato! Ora la Sala la tiene " + chi + ": sei dentro come amico" : "👋 La Sala l'aveva già aperta " + chi + ": sei dentro", "verde", 3500);
    var io = profiloAttivo();
    cuore.ricordaStanza({ sala: C }); cuore.segnaLinkSessione({ sala: C });
    // (lo schermo resta quello di adesso finché non arriva la Sala dell'amico: si cambia una volta sola)
    entraInSala(C, (io && io.nome) || io0.nome, (io && io.emoji) || io0.emoji || "🙂", (io && io.omino) || io0.omino || null, { subito: true });
  }

  // ---------- L'HOST CHE SE NE VA (Passo 3, p3-c): "Passa la Sala", il vice, chi torna ----------
  // Esci dalla Sala (host): con un amico che può tenerla, "👑 Passa la Sala a Giulia" / "🚪 Chiudi per tutti" / "Resta";
  // senza, la domanda di sempre. esci = chiude per tutti (come oggi). Nel torneo a eliminazione niente vice
  function esciDallaSala(domanda, esci) {
    var v = viceDi(), chi = v.length ? membroSala(v[0]) : null;
    if (!chi) return chiediConferma(domanda, null, "Chiudi", esci);
    chiediScelta("Te ne vai?", "La serata può continuare senza di te.", [
      { testo: "👑 Passa la Sala a " + chi.nome, classe: "btn-primario", fn: function () { passaSala(chi.id); } },
      { testo: "🚪 Chiudi per tutti", classe: "btn-rosso", fn: esci }
    ]);
  }
  function membroSala(id) { return sala ? sala.membri.filter(function (m) { return m && m.id === id; })[0] || null : null; }
  // "👑 Passa la Sala a Giulia": la foto della Sala dice "cede: Giulia" e lei la riapre con la generazione dopo; io aspetto la
  // sua foto (onStato) e me ne vado in home. Se in 8 s non arriva provo il secondo vice; se nessuno risponde, chiedo
  var ATTESA_PASSA = 8000;
  // quanto aspetta il vice (primo, secondo) prima di prendere la Sala dell'host sparito; con la pausa recente (meno di 3 minuti
  // prima: è uscito un attimo dall'app) di più. Sui telefoni veri il broker se ne accorge 30-40 s dopo: si aggiunge a questi
  var VICE_ATTESA = [[20000, 30000], [90000, 120000]], VICE_PAUSA = 3 * 60 * 1000;
  function passaSala(id) {
    var S0 = sala, chi = membroSala(id);
    if (!S0 || S0.ceduta || !chi) return;
    S0.provati = S0.provati || {}; S0.provati[id] = 1;
    S0.passa = id; S0.cede = id; S0._bcast();
    var s = schermata({ icona: "👑", titolo: "Passo la Sala a " + chi.nome + "…", sotto: "La serata continua: tu esci dalla Sala" });
    s._contenuto.appendChild(el("div", { class: "sl-passa" }, [
      el("div", { class: "sl-passa-av", "aria-hidden": "true", html: window.SGOmino && chi.omino ? SGOmino.svg(chi.omino, { busto: true }) : "" }),
      el("p", { class: "modulo-nota", text: "Un attimo: " + chi.nome + " prende la Sala e gli amici restano con lui." })
    ]));
    mostra(s);
    clearTimeout(S0.tPassa);
    S0.tPassa = setTimeout(function () {
      if (sala !== S0 || S0.passa !== id || S0.ceduta) return;
      var altro = viceDi().filter(function (x) { return !S0.provati[x]; })[0];
      if (altro) return passaSala(altro);
      var tutti = Object.keys(S0.provati).map(function (x) { var mm = membroSala(x); return mm ? mm.nome : null; }).filter(Boolean);
      if (!tutti.length) tutti = [chi.nome];
      S0.passa = null; S0.cede = null; S0.provati = null; S0._bcast();
      disegnaSalaHost();
      chiediScelta(tutti.length > 1 ? tutti.slice(0, -1).join(", ") + " e " + tutti[tutti.length - 1] + " non rispondono" : tutti[0] + " non risponde", "La Sala è ancora tua.", [
        { testo: "👥 Resto nella Sala", classe: "btn-primario", fn: function () {} },
        { testo: "🚪 Chiudi per tutti", classe: "btn-rosso", fn: function () { if (sala === S0) { chiudiSala(); schermataHome(); } } }
      ], null);
    }, ATTESA_PASSA);
  }
  // la Sala dell'amico a cui l'ho passata è arrivata: me ne vado in silenzio (senza testamento: la sua foto resta)
  function salaPassata(S0, m) {
    if (sala !== S0 || S0.ceduta) return;
    S0.ceduta = true; clearTimeout(S0.tPassa);
    try { S0.rete.lascia(); } catch (e) {}
    clearInterval(S0.tVivo); clearTimeout(S0.tCoppie);
    if (S0.inGioco) { lasciaPartita(); SGNet.chiudiGiochi(); }
    sala = null; cuore.dimenticaMiaSala(); cuore.tieniAcceso(false);
    schermataHome();
    pillola("sala", "👑 Ora la Sala la tiene " + (nomeHostDi(m) || "un amico"), "verde", 3500);
  }
  // la partita in corso resta quando cambia l'host della Sala? Solo se la sua stanza non era sul telefono che se ne va:
  // il duello di due amici, o un gioco col suo host di riserva (Passo 5: g.riserva || hostDiRiserva(g))
  function haRiserva(g) { return !!(g && g.riserva && g.riprende) || hostDiRiserva(g); }   // (riserva vale solo con riprende: riservaPer)
  // il vice prende la Sala (perche: "passata" = me l'ha passata l'host; "sparito" = l'host non c'è più). m = l'ultima foto
  // della Sala. Lascio la Sala da amico e la riapro con lo stesso codice e la generazione dopo, da "host": gli stessi amici
  // (con 30 s per rientrare: lo fanno da soli), la stessa classifica e le stesse partite giocate; il mio id di prima diventa
  // "host" (G7). Chi la teneva prima non è tra gli attesi: se torna entra da amico
  function subentraSala(S, m, perche) {
    if (!S || salaG !== S || S.subentro || !m || m.t !== "sala" || !profiloAttivo()) return;
    S.subentro = true; clearTimeout(S.tVice); S.tVice = null;
    var C = S.codice, vecchio = mioIdSala(S), nome = S.nome, chi = nomeHostDi(m) || "L'host";
    var SVs = S.rete && S.rete._sv, porta = !!(SVs && SVs.porta);
    try { S.rete.lascia(); } catch (e) {}
    salaG = null; cuore.dimenticaStanza(); pillola("host", null);
    function id2(x) { return x === vecchio ? "host" : x; }
    var membri = (m.membri || []).filter(function (x) { return x && x.id && x.id !== "host" && x.id !== vecchio; });
    var ez = { membri: membri, torneo: m.torneo || null, giocate: m.giocate || {}, porta: porta ? 1 : 0, comp: m.comp || null,
      resta: cuore.restaEredita(m.resta, vecchio), restaRec: m.restaRec || null,   // ("👑 Chi vince resta" continua: gli id rimappati, 6-6)
      voto: !m.gioco ? cuore.votoEredita(m.voto, vecchio) : null, giochiFatti: Array.isArray(m.giochiFatti) ? m.giochiFatti : [] };   // ("🗳️ Scegliamo insieme": il voto continua, 6-6)
    // la partita in corso: resta solo se non era sul telefono che se ne va (duello di due amici, gioco con l'host di riserva)
    var g = m.gioco && m.stanza ? giocoDa(m.gioco) : null, D = g && m.duello && m.duello.stanza === m.stanza ? m.duello : null;
    var tieni = !!(g && ((D && D.a !== "host" && D.b !== "host") || (!D && haRiserva(g))));
    var P = cuore.partitaCorrente && cuore.partitaCorrente.viva() && cuore.partitaCorrente.salaCtx ? cuore.partitaCorrente : null;
    var resto = tieni && P && (P.salaCtx.stanza || P.salaCtx.duello) === m.stanza ? P.salaCtx : null;
    if (tieni) {
      ez.gioco = m.gioco; ez.stanza = m.stanza; ez.fase = typeof m.fase === "string" ? m.fase : "gioco";
      ez.fuori = {}; (Array.isArray(m.fuori) ? m.fuori : []).forEach(function (x) { if (x !== "host") ez.fuori[id2(x)] = m.stanza; });
      ez.scelti = Array.isArray(m.sc) ? m.sc.filter(function (x) { return x !== "host"; }).map(id2) : null;
      if (D) ez.duello = Object.assign({}, D, { a: id2(D.a), b: id2(D.b) });
      if (resto) ez.ctx = resto;
    }
    if (!resto) { lasciaPartita(); SGNet.chiudiGiochi(); cuore.togliVia(); cuore.FINE = null; }   // (la partita era sul telefono che è andato via)
    creaSala({ codiceFisso: C, comp: m.comp ? compDi(C, m) : null, gen: (+m.gen || 1) + 1, nome: nome, sopra: m._s || null, mioId: vecchio, eredita: ez });
    pillola("sala", perche === "passata" ? "👑 " + chi + " ti ha passato la Sala" : "👑 " + chi + " è uscito: ora la Sala la tieni tu", "verde", 4000);
  }
  // si torna nella Sala da un gioco lanciato dalla Sala. Da amico: la Sala non mi riporta dentro da sola (uscitoDa se ne sono
  // uscito io: "Rientra"; finitoDa se la partita è finita). Se intanto la Sala è passata a me (p3-c) torno nella mia: il gioco
  // rimasto finisce per tutti (il duello no se ci giocano gli altri due: lo apro io solo se l'ho aperto io)
  function tornaInSala(codiceSala, code, finita) {
    lasciaPartita(); SGNet.chiudiGiochi();
    if (salaG && salaG.codice === codiceSala) {
      salaG.inGioco = null; salaG.dFine = null;
      if (finita) salaG.finitoDa = code;
      else { salaG.uscitoDa = code; try { salaG.rete.invia({ t: "esco", stanza: code }); } catch (e) {} }   // (uscito apposta: la Sala non mi aspetta)
      return disegnaSalaOspite();
    }
    if (sala && codiceSala && sala.codice === codiceSala) {
      if (sala.stanza === code && sala.duello && sala.duello.a === "host") { sala.inGioco = true; return cuore.fineDuelloSala(); }
      if (sala.stanza === code && !sala.duello) { sala.gioco = null; sala.stanza = null; sala.fase = null; sala.fuori = {}; sala.scelti = null; sala._bcast(); }
      sala.inGioco = false; sala.ctx = null; sala.fineDuello = null;
      return disegnaSalaHost();
    }
    disegnaSalaOspite();
  }
  // ---- l'host che esce un attimo dall'app (WhatsApp per mandare il link): nella foto della Sala va "pausa" (i vice aspettano
  //  90 s invece di 20 se poi sparisce). Tornando dopo più di 10 minuti la Sala è "addormentata": finisce senza pubblicare
  //  niente (intanto l'ha presa un amico, o gli amici sono andati via) ----
  var SALA_DORME = 10 * 60 * 1000;
  function salaAddormentata(S0) {
    if (sala !== S0 || S0.ceduta) return;
    S0.ceduta = true; clearTimeout(S0.tPassa);
    // (se il collegamento è rimasto vivo, gli amici devono sapere che non ci sono più: un "host sparito" solo dal vivo, non
    //  trattenuto, così un vice prende la Sala; la foto trattenuta resta quella di chi c'è)
    try { if (S0.rete && S0.rete.inviaVeloce) S0.rete.inviaVeloce({ t: "__hostgone", s: S0.rete.sessione, g: S0.gen }); } catch (e) {}
    try { S0.rete.lascia(); } catch (e) {}
    clearInterval(S0.tVivo); clearTimeout(S0.tCoppie);
    if (S0.inGioco) { lasciaPartita(); SGNet.chiudiGiochi(); }
    cuore.chiudiTabelloneElim();
    sala = null; cuore.dimenticaMiaSala(); cuore.tieniAcceso(false);
    schermataHome();
    pillola("sala", "😴 Eri via da un po': la Sala è finita", "grigia", 4000);
  }

  // chi apre la Sala senza profilo: il nome dell'ultima volta (o "Come ti chiami?" una volta, col 🎲)
  function nomeOspiteSalvato() { try { return (localStorage.getItem("sg-nome-ospite") || "").trim().slice(0, 16); } catch (e) { return ""; } }
  function schermataNomeSala(opz) {
    var s = schermata({ icona: "👥", titolo: "Apri la Sala", sotto: "Un codice per tutta la serata", indietro: schermataHome });
    var input = el("input", { class: "link-campo", type: "text", maxlength: "16", placeholder: "Come ti chiami?", autocapitalize: "words", enterkeyhint: "go" });
    var avviso = el("div", { class: "link-avviso" });
    var anteprima = el("div", { class: "sl-anteprima", "aria-hidden": "true" });   // l'avatar che avrai con quel nome
    s._contenuto.appendChild(el("div", { class: "sl-benvenuto" }, [
      el("b", { class: "sl-benv-tit", text: "Come ti chiami? 🎉" }), anteprima,
      el("span", { class: "sl-benv-sotto", text: "Gli amici ti vedranno con questo nome. Tocca 🎲 per un nome buffo." })
    ]));
    s._contenuto.appendChild(input); s._contenuto.appendChild(avviso);
    cuore.dadoNome(input, anteprima);
    function apri() {
      var n = (input.value || "").trim().slice(0, 16);
      if (n.length < 2) { avviso.textContent = "Scrivi il tuo nome."; return; }
      try { localStorage.setItem("sg-nome-ospite", n); } catch (e) {}
      audioCtx();
      creaSala(Object.assign({}, opz || {}, { nomeHost: n }));
    }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") apri(); });
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Apri la Sala ▶", onclick: apri }));
    mostra(s);
  }

  function disegnaSalaHost() {
    if (!sala) return;
    var T = sala.torneo, E = sala.elim;
    if (T && T.finito) return schermataPodioT(T, true);
    amiciStato("sala", sala.codice);   // (per gli amici: "👥 è in una Sala")
    var pronto = sala.codice && sala.codice !== "…", gE = E ? giocoDa(E.gioco) : null, TN = !!(E && E.torneino);
    var sS = cuore.saletta(gSala(!!T, E, sala.comp), {
      host: true, codice: sala.codice, pronta: sala.pronta, min: E ? 2 : 1, puoiDaSolo: !E, _rete: sala.rete,
      link: pronto ? linkSala(sala.codice, true) : "",
      sotto: TN ? "Torneo a eliminazione · Sala di " + sala.membri[0].nome : (E ? "Torneo a eliminazione · " + (gE ? gE.nome : "") : (sala.comp ? "Il link vale sempre" : "Un link per tutti i giochi")),   // (il titolo dice già "Sala online" o "Torneo")
      confermaEsci: TN ? (E.finito ? "Tornare nella Sala?" : "Fermare il torneo? Si torna tutti nella Sala.") : (E ? "Chiudere il torneo per tutti?" : (T && T.n ? "Chiudere la Sala per tutti? I punti di stasera si perdono." : "Chiudere la sala per tutti?")),
      giocatori: sala.membri.map(function (m) { return { id: m.id, nome: m.nome, omino: m.omino || null, host: m.id === "host", tu: m.id === "host" }; }),
      extra: E ? [cuore.boxElimSala(E, "host", true, sala, cuore.seguiHost)] : [boxDuelloHost(), boxInCorsoHost(), cuore.riquadroCoda(sala, true), T ? boxTorneoCorto(T, sala) : null, consiglioComp()].filter(Boolean),
      testoComincia: TN ? (E.finito ? "🎮 Prossimo gioco" : (E.iniziato ? "Torneo in corso…" : "⚔️ Via al torneo"))
        : (E ? (E.finito ? "↻ Nuovo torneo (stessi amici)" : (E.iniziato ? "Torneo in corso…" : "⚔️ Comincia il torneo")) : (T ? (T.n ? "🎮 Prossimo gioco" : "🎮 Scegli il primo gioco") : "🎮 Scegli un gioco")),
      puoComincia: E ? (!E.iniziato || E.finito) : undefined,
      nota: TN ? (E.finito ? "Con «Prossimo gioco» tornate tutti nella Sala e scegli il gioco dopo." : (E.iniziato ? "Le partite si aprono da sole sul telefono di chi gioca." : (E.scade ? "Quando sono seduti, tocca «Via al torneo»." : "Quando arrivano tutti si parte da soli.")))
        : (E ? (E.iniziato && !E.finito ? "Le partite si aprono da sole sul telefono di chi gioca." : "Ognuno tocca il girone in cui vuole giocare. Quando siete pronti, fai partire il torneo.")
        : "Scegli un gioco: parte da solo sul telefono di tutti. A fine partita si torna qui."),
      onComincia: TN ? function () { if (E.finito) { cuore.fineTorneino(); if (sala) { sala.sceglie = true; sala._bcast(); salaScegliGioco(); } } else cuore.avviaElim(); } : (E ? function () { if (E.finito) cuore.nuovoElim(); else cuore.avviaElim(); } : salaScegliGioco),
      onRegole: E ? function () { sala._bcast(); } : undefined,
      onEsci: TN ? function () { cuore.fineTorneino(); } : function () { chiudiSala(); schermataHome(); },
      // (con un amico che può tenerla: "👑 Passa la Sala a Giulia" o "🚪 Chiudi per tutti")
      esciScelta: E ? null : function (esci) { esciDallaSala(T && T.n ? "Chiudere la Sala per tutti? I punti di stasera si perdono." : "Chiudere la sala per tutti?", esci); }
    }, E ? cuore.regoleElim() : null);
    if (sS) sS.classList.toggle("con-tabellone", !!(E && (E.iniziato || (E.torneino && E.scade))));   // (a torneo in corso la stanza si stringe: prima il tabellone)
    misuraConsiglio();
  }

  // ---------- LA COMPAGNIA CHE NASCE DALLA SALA (Passo 3, p3-b) ----------
  // "📌 Fanne la nostra Compagnia" (⚙️ della Sala, o il suggerimento piccolo): un nome e un'emoji, poi la Sala "trasloca" su
  // un codice fisso di 6 lettere con gli stessi amici (stessi id), la stessa classifica, le stesse partite e la stessa porta.
  // Gli amici si spostano da soli. Si fa solo tra una partita e l'altra (niente gioco in corso, niente torneo a eliminazione)
  function puoiFareComp() { return !!(sala && !sala.gioco && !sala.elim && !sala.voto && sala.pronta && sala.codice && sala.codice.length === 4 && window.SGCompagnia && SGNet.nuovoCodice); }
  function creaCompagnia() {
    if (!puoiFareComp()) return;
    SGCompagnia.foglioNome({ titolo: "📌 La vostra compagnia", nome: "", emoji: "🍻", tasto: "📌 Crea", ok: function (nome, emoji) {
      if (!puoiFareComp()) return pillola("sala", "Si fa tra una partita e l'altra", "rosso", 2600);
      var C = SGNet.nuovoCodice(6), comp = { nome: nome, emoji: emoji, rv: Date.now() };
      var v = null; try { v = SGCompagnia.salva({ c: C, n: nome, e: emoji, rv: comp.rv }); } catch (e) {}
      if (!v) return;   // (ne ha già 8: lo dice la pillola di SGCompagnia)
      try { localStorage.setItem("sg-consiglio-comp", "9"); } catch (e) {}   // (fatta: il suggerimento non serve più)
      traslocaSala(C, comp);
      foglioCompFatta(C);
    } });
  }
  // la Sala si sposta sul codice C della Compagnia. La Sala di prima non si chiude (chi ci torna o apre il suo link deve
  // trovare la strada): la sua ultima foto trattenuta dice "trasloco: { codice, comp }" e dopo 8 s la lascio in silenzio
  function traslocaSala(C, comp) {
    var V = sala; if (!V || !V.rete) return;
    var vecchia = V.rete;
    V.trasloco = { codice: C, comp: comp };
    var kV = cuore.chiaveDi(V.codice); if (kV) cuore.chiaveDi(C, false, kV);   // (🔑 la chiave delle foto di stasera viene con noi)
    V._bcast();   // (l'ultima foto della Sala di prima: gli amici leggono il trasloco e vengono da soli)
    cuore.dimenticaMiaSala();
    cuore.dimenticaSalaIeri(V.codice);   // (ora è una Compagnia: si ritrova dalla sua tessera in home)
    // (gli id restano uguali: gli amici entrano nella Compagnia col loro id di prima; i campi della Sala per id, come duello
    //  e fuori, qui sono vuoti perché si fa solo senza un gioco in corso)
    creaSala({ codiceFisso: C, comp: comp, gen: 1, trasloco: true,
      eredita: { membri: V.membri, torneo: V.torneo, giocate: V.giocate, porta: vecchia._sv && vecchia._sv.porta ? 1 : 0, comp: comp,
        resta: V.resta || null, restaRec: V.restaRec || null, giochiFatti: V.giochiFatti || [] } });   // (gli id restano uguali: la serie passa com'è)
    if (V.resta) { clearInterval(V.tResta); V.tResta = null; }
    if (sala && sala !== V) { sala.regole = V.regole || {}; if (V.optTorneino) sala.optTorneino = V.optTorneino; }   // (le regole scelte stasera restano)
    clearInterval(V.tVivo);
    setTimeout(function () { try { vecchia.lascia(); } catch (e) {} }, 8000);
  }
  // "📌 Fatto! Ecco il link fisso": il link scritto, "📤 Manda nel gruppo" e "Più tardi"
  function foglioCompFatta(C) {
    var vv = document.querySelector(".sl-velo"); if (vv && vv.parentNode) vv.parentNode.removeChild(vv);
    var v = null; try { v = SGCompagnia.trova(C); } catch (e) {}
    var url = ""; try { url = SGCompagnia.link(C); } catch (e) { url = SG.creaLink({ gruppo: C }); }
    var velo;
    function chiudi() { if (velo.parentNode) velo.parentNode.removeChild(velo); }
    var manda = el("button", { class: "btn btn-primario", text: "📤 Manda nel gruppo", onclick: function () { SGCompagnia.condividi(C, manda); } });
    velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio comp-fatta" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: "📌 Fatto! Ecco il link fisso" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        el("div", { class: "sl-foglio-corpo" }, [
          el("p", { class: "comp-fatta-tit", text: v ? v.e + " " + v.n : "La vostra compagnia" }),
          el("p", { class: "modulo-nota", text: "Vale per sempre: fissatelo nel gruppo. La prossima volta entrate da lì, senza mandare niente." }),
          el("div", { class: "comp-fatta-link", text: url }),
          el("p", { class: "comp-fatta-cod" }, [ "Chi ha l'app scrive il codice ", el("b", { text: C }) ])
        ]),
        manda,
        el("button", { class: "btn btn-fantasma", text: "Più tardi", onclick: chiudi })
      ])
    ]);
    document.body.appendChild(velo);
  }
  // nel ⚙️ della Sala, in cima: "📌 Fanne la nostra Compagnia" (Sala normale) o "✏️ Nome della compagnia" e
  // "📤 Manda il link fisso" (Sala che è già una Compagnia). chiudi = chiude il foglio
  function rigaCompSala(chiudi) {
    if (!sala || !window.SGCompagnia) return null;
    if (sala.codice && sala.codice.length === 6) {
      var bLink = el("button", { class: "btn btn-fantasma", type: "button", text: "📤 Manda il link fisso", onclick: function () { SGCompagnia.condividi(sala.codice, bLink); } });
      return el("div", { class: "sl-viva-opz sl-comp-opz" }, [
        el("b", { text: "📌 " + (sala.comp ? sala.comp.emoji + " " + sala.comp.nome : "La compagnia") }),
        el("div", { class: "sl-serata-tasti" }, [
          el("button", { class: "btn btn-fantasma", type: "button", text: "✏️ Nome della compagnia", onclick: function () { chiudi(); rinominaComp(); } }),
          bLink ])
      ]);
    }
    var ok = puoiFareComp(), dopo = !!(sala.gioco || sala.elim);
    return el("div", { class: "sl-viva-opz sl-comp-opz" }, [
      el("button", { class: "btn btn-primario sl-comp-fai", type: "button", text: "📌 Fanne la nostra Compagnia", disabled: ok ? null : "disabled", onclick: function () { chiudi(); creaCompagnia(); } }),
      el("small", { text: dopo ? "Si fa tra una partita e l'altra" : "Un link fisso che vale per sempre: la prossima volta non dovete mandare niente." })
    ]);
  }
  // l'host rinomina la Compagnia della sua Sala: vince il nome più nuovo (rv), arriva a tutti con la foto della Sala
  function rinominaComp() {
    if (!sala || !sala.comp || !window.SGCompagnia) return;
    var C = sala.codice;
    SGCompagnia.foglioNome({ titolo: "✏️ Nome della compagnia", nome: sala.comp.nome, emoji: sala.comp.emoji, ok: function (nome, emoji) {
      if (!sala || sala.codice !== C) return;
      sala.comp = { nome: nome, emoji: emoji, rv: Date.now() };
      try { if (!SGCompagnia.aggiorna(C, sala.comp)) SGCompagnia.salva({ c: C, n: nome, e: emoji, rv: sala.comp.rv }); } catch (e) {}
      sala._bcast();
      if (!sala.inGioco) disegnaSalaHost();
    } });
  }
  // il suggerimento piccolo nella Sala dell'host: "📌 Giocate spesso insieme? Fatene una Compagnia" (con ✕).
  // Con almeno 2 amici, in una Sala normale, tra una partita e l'altra; dopo 3 ✕ non torna. Sempre lo stesso nodo
  function chiusureConsiglio() { try { return +(localStorage.getItem("sg-consiglio-comp") || 0) || 0; } catch (e) { return 9; } }
  function consiglioComp() {
    if (!puoiFareComp() || sala.membri.length < 3 || chiusureConsiglio() >= 3 || !profiloAttivo()) return null;
    if (!sala._consC) {
      var nodo = el("div", { class: "sl-consiglio-comp" }, [
        el("button", { class: "sl-cc-testo", type: "button", text: "📌 Giocate spesso insieme? Fatene una Compagnia", onclick: function () { creaCompagnia(); } }),
        el("button", { class: "sl-cc-x", type: "button", "aria-label": "Non ora", text: "✕", onclick: function () {
          try { localStorage.setItem("sg-consiglio-comp", String(chiusureConsiglio() + 1)); } catch (e) {}
          if (sala) sala._consNo = true;
          if (nodo.parentNode) nodo.parentNode.removeChild(nodo);
        } })
      ]);
      sala._consC = nodo;
    }
    return sala._consNo ? null : sala._consC;
  }
  // il suggerimento compare solo se ci sta: se con lui il centro della Sala scorrerebbe (o la stanza resta troppo bassa), si
  // nasconde. Si misura subito dopo averlo messo (prima che lo schermo si ridisegni: non lampeggia) e quando cambia la misura
  function misuraConsiglio() {
    var n = sala && sala._consC;
    if (!n || !n.parentNode || !document.body.contains(n)) return;
    var sc = n.closest(".saletta-schermo"), c = sc && sc.querySelector(".contenuto"), st = sc && sc.querySelector(".sl-stanza");
    if (!c || !st) return;
    if (n.hidden) n.hidden = false;
    var troppo = c.scrollHeight > c.clientHeight + 1 || st.getBoundingClientRect().height < 190;
    if (troppo) n.hidden = true;
    if (!misuraConsiglio.su) { misuraConsiglio.su = true; window.addEventListener("resize", function () { misuraConsiglio(); }); }
  }

  // nella Sala dell'host, un duello in corso tra due amici: "⚔️ Giulia e Luca giocano a Tris · 👀 Guarda";
  // finito: "🏁 Giulia contro Luca: ha vinto Giulia · ⚔️ Altra sfida". Lo stesso nodo finché non cambia (niente lampeggio)
  function boxDuelloHost() {
    var D = sala && sala.gioco && sala.duello && sala.duello.stanza === sala.stanza ? sala.duello : null;
    if (!D) return null;
    var g = giocoDa(D.gioco), finito = sala.fase === "fine" && D.fine, k = D.stanza + "|" + (finito ? "f" + D.fine.n : "g");
    if (sala._boxD && sala._boxD.k === k) return sala._boxD.nodo;
    var primi = finito ? D.fine.cl.filter(function (r) { return (r.pos || 1) === 1; }) : [];
    var testo = finito ? "🏁 " + D.na + " contro " + D.nb + ": " + (primi.length === 1 ? "ha vinto " + primi[0].nome : "pareggio")
      : "⚔️ " + D.na + " e " + D.nb + " giocano " + aGioco(g ? g.nome : "");
    var nodo = el("div", { class: "sl-incorso prossima sl-duello" }, [
      el("span", { class: "sl-inc-testo" }, [ el("b", { text: testo }) ]),
      finito ? (sala.resta ? null : el("button", { class: "btn btn-primario btn-piccolo", text: "⚔️ Altra sfida", onclick: function () { if (g) cuore.salaAltraSfida(g); } }))
        : el("button", { class: "btn btn-fantasma btn-piccolo", text: "👀 Guarda", onclick: function () { if (sala && sala.duello === D) cuore.guardaDuelloHost(D); } })
    ]);
    sala._boxD = { k: k, nodo: nodo };
    return nodo;
  }
  // l'host della Sala fuori dal gioco in corso (non il duello): il gioco lo tiene un amico (riserva) e io ne sono uscito
  // ("Rientra ▶" e "👀 Guarda"), oppure la Sala mi è arrivata col gioco dentro (solo "👀 Guarda"). Stesso nodo, cambiano le scritte
  function boxInCorsoHost() {
    var A = sala;
    if (!A || !A.gioco || !A.stanza || A.inGioco || A.elim || (A.duello && A.duello.stanza === A.stanza)) return null;
    var g = giocoDa(A.gioco); if (!g) return null;
    var fuori = !!(A.fuori && A.fuori.host === A.stanza), k = A.stanza + "|" + (fuori ? "r" : "g");
    var testa = "🎮 Si gioca " + aGioco(g.nome) + (A.fase === "gioco" && A.punto ? " · " + A.punto : "");
    var B = A._boxG;
    if (B && B.k === k) { if (B.b.textContent !== testa) B.b.textContent = testa; return B.nodo; }
    var b = el("b", { text: testa });
    var tasti = [ el("button", { class: "btn btn-fantasma btn-piccolo", text: "👀 Guarda", onclick: function () { guardaGiocoHost(); } }) ];
    if (fuori) tasti.unshift(el("button", { class: "btn btn-primario btn-piccolo sl-inc-entra", text: "Rientra ▶", onclick: function () { entraGiocoHost(); } }));
    var nodo = el("div", { class: "sl-incorso prossima" + (fuori ? " due-tasti" : "") }, [
      el("span", { class: "sl-inc-testo" }, [ b, el("small", { text: fuori ? "ne sei uscito: rientra quando vuoi" : "giocano gli amici: guardali quando vuoi" }) ]),
      fuori ? el("div", { class: "sl-inc-tasti" }, tasti) : tasti[0] ]);
    A._boxG = { k: k, nodo: nodo, b: b };
    return nodo;
  }
  // l'host della Sala guarda il gioco in corso (senza entrare: la targhetta "👀 Guardi"); dalle foto la Sala sa a che punto è.
  // Quando si torna in saletta entro a giocare da solo (non nei giochi a due)
  function guardaGiocoHost() {
    var S0 = sala, g = S0 && S0.gioco ? giocoDa(S0.gioco) : null, code = S0 && S0.stanza;
    if (!g || !code || S0.inGioco) return disegnaSalaHost();
    var visto = !!S0.fase && S0.fase !== "lobby";
    SGNet.chiudiGiochi();
    S0.inGioco = true;   // (la Sala non si ridisegna sopra la partita)
    function torna() {
      if (sala !== S0 || S0.guardoCtx !== ctx) return;
      S0.guardoCtx = null; lasciaPartita(); SGNet.chiudiGiochi(); cuore.togliGuardo();
      S0.inGioco = false; disegnaSalaHost();
    }
    var ctx = S0.guardoCtx = {
      stanza: code, guardaSala: true,
      esci: function () { torna(); }, fine: function () { torna(); }, risultato: function () {},
      // la stanza del gioco si è chiusa (partita finita): il gioco non c'è più, nemmeno nella Sala
      chiusa: function () {
        if (sala === S0 && S0.guardoCtx === ctx && S0.stanza === code) { S0.gioco = null; S0.stanza = null; S0.fase = null; S0.fuori = {}; S0.scelti = null; S0._bcast(); }
        torna();
      },
      fase: function (f) {
        if (sala !== S0 || S0.guardoCtx !== ctx || S0.stanza !== code) return;
        if (S0.fase !== f) { S0.fase = f; S0._bcast(); }
        if (f !== "lobby") { visto = true; return; }
        if (!visto || aDue(g)) return;
        visto = false;
        pillola("guardo", "✋ Si ricomincia: entri anche tu!", "verde", 2500);
        setTimeout(function () { if (sala === S0 && S0.guardoCtx === ctx) entraGiocoHost(); }, 0);
      }
    };
    cuore.linkParams = { gioco: g.id, stanza: code, guarda: 1 };
    avviaPartita(g, [], {}, null, ctx);
  }
  // l'host della Sala (ri)entra a giocare nel gioco tenuto da un amico, da amico (lo stesso id di prima: ritrova il suo posto)
  function entraGiocoHost() {
    var S0 = sala, g = S0 && S0.gioco ? giocoDa(S0.gioco) : null, code = S0 && S0.stanza;
    if (!g || !code) return disegnaSalaHost();
    if (S0.fuori && S0.fuori.host) { delete S0.fuori.host; S0._bcast(); }   // (la Sala mi aspetta di nuovo)
    S0.guardoCtx = null;
    lasciaPartita(); SGNet.chiudiGiochi(); cuore.togliGuardo();
    cuore.linkParams = { gioco: g.id, stanza: code };
    avviaPartita(g, [], {}, null, cuore.ctxGiocoAmico(code));
  }

  // l'host della Sala sta scegliendo il gioco («Quale gioco?», «Tris in 4», «Chi gioca?»): la Sala non lo copre
  function hostSceglie() { var s = cuore.app && cuore.app.firstElementChild; return !!(sala && s && s.classList && (s.classList.contains("sala-sceglie") || s.classList.contains("chi-gioca-sc") || s.classList.contains("torneino-sc") || s.classList.contains("sala-voto") || s.classList.contains("arriva-gioco"))); }   // (📦 anche «Arriva il gioco…»: la Sala non si ridisegna sopra)
  // o.scelgoIo = "Scelgo io" (con "🗳️ Scegliamo insieme" acceso: questa volta un tocco sceglie il gioco, come prima)
  function salaScegliGioco(o) {
    o = o && !o.target ? o : {};
    if (sala && sala.resta) cuore.restaFerma();   // (l'host sceglie un altro gioco: "👑 Chi vince resta" finisce, il record resta)
    var T = sala && sala.torneo;
    // "🗳️ Scegliamo insieme": 3 giochi già accesi (in cima), un tocco ne accende o spegne uno, "🗳️ Si vota!" apre il voto per tutti
    var sel = !o.scelgoIo && cuore.votoPossibile() ? cuore.proponiTre() : null, tessere = {}, bVota = null;
    var s = schermata({ icona: sel ? "🗳️" : "🎮", titolo: sel ? "Proponi 3 giochi" : (T ? "Quale gioco?" : "Scegli un gioco"),
      sotto: T ? "Parte per tutti · più è difficile, più punti vale" : (sel ? "Poi votate tutti e decide la ruota" : "Parte per tutta la sala"),
      indietro: function () { if (sala && sala.sceglie) { sala.sceglie = false; sala._bcast(); } disegnaSalaHost(); } });   // (gli amici non leggono più "Paky sceglie…")
    s.classList.add("sala-sceglie", "scelta-giochi");   // (📱 le tessere come in home: due per riga, senza descrizione)
    function segna() {
      Object.keys(tessere).forEach(function (id) { tessere[id].classList.toggle("proposta", sel.indexOf(id) >= 0); });
      var tx = "🗳️ Si vota! (" + sel.length + ")";
      if (bVota.textContent !== tx) bVota.textContent = tx;
      bVota.disabled = sel.length < 2;
    }
    // (se sono già 3, il tocco su un altro prende il posto del più vecchio)
    function tocca(id) {
      var i = sel.indexOf(id);
      if (i >= 0) sel.splice(i, 1);
      else { if (sel.length >= 3) sel.shift(); sel.push(id); }
      segna();
    }
    if (sel) s._contenuto.appendChild(el("div", { class: "sl-proposta" }, [
      el("span", { class: "sl-prop-tx" }, [ el("b", { text: "🗳️ Proponi 3 giochi" }), el("small", { text: "tocca per cambiarli" }) ]),
      el("button", { class: "btn btn-fantasma btn-piccolo", type: "button", text: "Scelgo io", onclick: function () { salaScegliGioco({ scelgoIo: true }); } })
    ]));
    var griglia = el("div", { class: "griglia-giochi compatta tess-due" });
    var lista = giochi.filter(function (g) { return giocoOnline(g) && !g.senzaSala; });   // (i giochi senzaSala hanno una stanza loro)
    if (sel) lista = sel.map(giocoDa).concat(lista.filter(function (g) { return sel.indexOf(g.id) < 0; }));   // (i proposti in cima)
    lista.forEach(function (g) {
      // (con la Sala sempre accesa niente schermata delle impostazioni: si va dritti nella saletta, le regole stanno nel ⚙️)
      var tess = tesseraGioco(g, function () { if (sel) return tocca(g.id); if (salaSempre()) salaPreparaGioco(g); else schermataPreGioco(g, { sala: true }); }, true);
      if (T) tess.querySelector(".info").appendChild(cuore.rigaPuntiTorneo(g));
      // quanti giocano, detto prima di sceglierlo: i giochi a due (gli altri guardano), i posti contati, chi manca
      var et = etichettaPosti(g, sala ? sala.membri.length : 1);
      if (et) tess.querySelector(".info").appendChild(el("div", { class: "tess-adue" + (et.c ? " " + et.c : ""), text: et.t }));
      if (sel) { tess.appendChild(el("span", { class: "tess-voto", "aria-hidden": "true", text: "🗳️" })); tessere[g.id] = tess; }
      griglia.appendChild(tess);
    });
    s._contenuto.appendChild(griglia);
    if (sel) {
      bVota = el("button", { class: "btn btn-primario sl-si-vota", type: "button", onclick: function () { if (sel.length >= 2) cuore.salaVotoApri(sel.slice()); } });
      s._piede.appendChild(bVota);
      segna();
    }
    mostra(s);
  }
  function aDue(g) { return !!(g && (g.postiOnline === 2 || GIOCHI_ELIMINAZIONE[g.id])); }
  // l'etichetta di un gioco nell'elenco della Sala, dai suoi posti online e da quanti siamo: { t: testo, c: classe in più }
  function etichettaPosti(g, quanti) {
    var posti = postiDi(g), min = minDi(g, "online");
    if (aDue(g)) return { t: "⚔️ In 2: gli altri guardano" };
    if (min > quanti) return { t: "Servono almeno " + min, c: "pochi" };   // (si può sceglierlo lo stesso: gli amici possono arrivare)
    if (posti < quanti) return { t: "Max " + posti + ": gioca chi scegli", c: "posti" };
    return { t: "Fino a " + posti, c: "tutti" };
  }

  // ---------- «🗳️ SCEGLIAMO INSIEME» (il voto della Sala, la ruota che pesa i voti): in js/cuore/sala-voto.js (la scheda del voto e il disegno della ruota sono in js/scegliamo.js) ----------
  // ---------- CHI ARRIVA: la fase del gioco della Sala, chi è dentro, chi è uscito, chi manca ----------
  // (lo strato della rete non vede la variabile "sala": gliela passo così)
  function salaDiQui() { return sala; }
  // la stanza del gioco lanciato dalla mia Sala: quando cambia la fase (saletta, partita, classifica) o chi c'è dentro
  // lo dico a tutti nella Sala (chi arriva a partita in corso resta nella Sala: "entri alla prossima")
  function salaSegueGioco(SA, SVg) {
    var t = null;
    function mia() { return sala === SA && SA.stanza === SVg.codice; }
    SVg.suFase.push(function (f) { if (!mia()) return; SA.fase = f; if (SA._bcast) SA._bcast(); });
    // chi entra o esce dalla stanza a partita in corso (serve a chi ricarica la pagina: rientra da solo nel gioco)
    SVg.onDentro = function () {
      if (!mia() || (SA.fase || "lobby") === "lobby") return;
      clearTimeout(t); t = setTimeout(function () { if (mia() && SA._bcast) SA._bcast(); }, 400);
    };
  }
  // chi è dentro la stanza del gioco (id), tranne chi ha detto "esco"
  // Conta anche chi era dentro ed è sparito senza dire "esco" (rete persa, telefono spento più di 20 s: per il gioco è
  // "andato"): se ricarica la pagina deve tornare nella partita col suo posto, non restare nella Sala ad aspettare la
  // prossima (18 ott: Palla Matta coi telefoni veri). Non chi ne è uscito apposta né chi l'host ha fatto uscire.
  // E se la pagina dell'host si è ricaricata (la Sala riprende il gioco nella stessa stanza), anche chi era nella partita
  // prima della ricarica e non è ancora tornato (SA.nelSeme): la stanza riaperta non lo conosce, ma la partita sì.
  function nelGiocoSala(SA) {
    var SVg = SA.stanza ? cuore.SVH[SA.stanza] : null, ids = [];
    if (SVg) ids = Object.keys(SVg.dentro).concat(Object.keys(SVg.andati || {}).filter(function (id) { return !SVg.dentro[id] && !(SVg.fuori && SVg.fuori[id]); }));
    var Sm = SA.nelSeme && SA.nelSeme.stanza === SA.stanza ? SA.nelSeme.ids : [];
    Sm.forEach(function (id) { if (ids.indexOf(id) < 0 && !(SVg && SVg.fuori && SVg.fuori[id])) ids.push(id); });
    return ids.filter(function (id) { return !(SA.fuori && SA.fuori[id]); });
  }
  // chi è uscito apposta dal gioco in corso (id)
  function fuoriSala(SA) { var F = SA.fuori || {}; return Object.keys(F).filter(function (id) { return F[id] === SA.stanza; }); }
  // chi della Sala non è ancora nella saletta del gioco (lo aspettiamo): [{ id, nome, omino, forse }].
  // Non conta chi è uscito apposta ("esco"), chi è già nella stanza (anche se guarda), chi non è tra gli scelti.
  // Se nessuno ha scelto chi gioca e i posti liberi non bastano per tutti, non si sa chi arriverà: nessuna sagoma
  function attesiSala(g, gio, SVg, tavolo) {
    var membri, fuori, forse, mio, giaQui = {};
    if (sala && sala.inGioco && SVg && SVg.host && SVg.codice === sala.stanza) {
      membri = sala.membri; fuori = cuore.insieme(fuoriSala(sala)); mio = "host"; giaQui = SVg.dentro;
      forse = sala.rete && sala.rete._sv ? sala.rete._sv.forse : {};
    } else if (salaG && salaG.giocoSala && SVg && !SVg.host && SVg.codice === salaG.giocoSala.stanza) {
      membri = salaG.membri; fuori = cuore.insieme(salaG.fuori); mio = salaG.myId || (salaG.rete && salaG.rete.mioId); giaQui = SVg.nomi || {};
      forse = salaG.rete && salaG.rete._sv ? salaG.rete._sv.forse : {};
    } else return [];
    var scelti = tavolo && tavolo.scelti && tavolo.scelti.length ? tavolo : null;
    var cand = (membri || []).filter(function (m) {
      if (!m || !m.id || m.id === mio || fuori[m.id] || (giaQui[m.id] && m.id !== "host")) return false;
      if (gio.some(function (p) { return !p.bot && ((p.id != null && String(p.id) === m.id) || (p.host && m.id === "host") || stessoNome(p.nome, m.nome)); })) return false;
      return !scelti || scelti.puoSedersi(m.id, m.nome);
    });
    if (!scelti && cand.length > postiDi(g) - gio.length) return [];
    return cand.map(function (m) { return { id: m.id, nome: m.nome, omino: m.omino || null, forse: !!forse[m.id] }; });
  }
  // qualcosa è cambiato nella Sala (chi c'è, chi si ricollega, chi è uscito): la saletta del gioco rifà solo chi manca
  function rinfrescaAttesi() {
    var U = cuore.SL.ultimo;
    if (U && U.o && U.o._attesiDi && document.body.contains(U.s)) cuore.aggiornaSaletta(U, U.o, false);
  }

  // un gioco nella Sala senza la schermata delle impostazioni: le regole di partenza si preparano fuori dalla pagina
  // (il foglio ⚙️ della saletta le mostra) e restano per la serata: la volta dopo lo stesso gioco riparte con le scelte di prima
  // opz.stessi = la Rivincita di prima (ctx.rigioca): giocano gli stessi di prima, senza ridomandare "Chi gioca?"
  // opz.sfida = "⚔️ Altra sfida": "Chi gioca?" anche se i posti bastano (si sceglie chi gioca adesso)
  function salaPreparaGioco(g, opz) {
    if (!sala || !g) return schermataHome();
    // 📦 le regole le prepara il gioco: se non è ancora arrivato, «Arriva il gioco…» e poi si continua (finché la Sala è questa)
    var S0 = sala;
    if (cuore.aspettaGioco(g, function () { if (sala === S0) salaPreparaGioco(g, opz); }, { indietro: function () { if (sala === S0) salaScegliGioco(); else schermataHome(); } })) return;
    opz = opz && !opz.target ? opz : {};
    if (sala.resta) cuore.restaFerma();   // (un gioco nuovo: "Chi vince resta" finisce, il record resta scritto)
    cuore.segnaFatto(g.id);   // ("🗳️ Scegliamo insieme": i giochi di stasera)
    sala.regole = sala.regole || {};
    var R = sala.regole[g.id];
    if (!R) {
      var imp = {}, box = null;
      if (typeof g.impostazioni === "function") {
        box = el("div", { class: "sg-dal-gioco" });   // (🤍 roba del gioco: le sue emoji restano emoji)
        try { g.impostazioni(box, imp, { el: el, sala: true, modo: "online", giocatori: sala.membri.map(function (m) { return m.nome; }) }); }
        catch (e) { setTimeout(function () { throw e; }, 0); }   // (si gioca lo stesso; l'errore resta in console)
      }
      R = sala.regole[g.id] = { box: box, imp: imp };
    }
    R.imp.modo = "online";
    if (opz.stessi && R.imp.scelti) return salaLancia(g, R.imp, R.box);
    // un gioco a due e siamo almeno in 3: "🏆 Torneino: giocate tutti" (già scelto) o "⚔️ Una sfida: scegli chi gioca"
    if (salaSempre() && !sala.elim && !opz.sfida && GIOCHI_ELIMINAZIONE[g.id] && sala.membri.length >= 3) return cuore.schermataTorneino(g, R);
    // "Chi gioca a Tris?": siamo più dei posti (nel torneo a eliminazione e col percorso di prima no)
    if (salaSempre() && !sala.elim && (sala.membri.length > postiDi(g) || (opz.sfida && sala.membri.length > 2))) return cuore.schermataChiGioca(g, function (scelti) { salaParti(g, R, scelti); }, restaOpz(g, R));
    salaParti(g, R, null);
  }
  // in "Chi gioca?" di un gioco a due con almeno 3 nella Sala anche "👑 Chi vince resta"
  function restaOpz(g, R) {
    if (!sala || !aDue(g) || !GIOCHI_ELIMINAZIONE[g.id] || sala.membri.length < 3 || sala.elim) return null;
    return { resta: function (scelti) { cuore.restaInizia(g, R, scelti); } };
  }
  // si parte con chi è stato scelto (null = tutti). L'host gioca: la sua stanza, e il gioco fa sedere solo gli scelti
  // (tavolo.scelti / puoSedersi; gli altri entrano e guardano). Gioco a due senza l'host: il duello tra i due
  function salaParti(g, R, scelti) {
    if (!sala) return schermataHome();
    if (scelti && aDue(g) && GIOCHI_ELIMINAZIONE[g.id] && scelti.length === 2 && !scelti.some(function (x) { return x.id === "host"; })) return cuore.salaDuello(g, R, scelti);
    if (scelti) R.imp.scelti = scelti.map(function (x) { return { id: x.id, nome: x.nome }; });
    else delete R.imp.scelti;
    salaLancia(g, R.imp, R.box);
  }

  // ---------- LE SFIDE NELLA SALA (il torneino, «Chi gioca?», il duello tra due amici, «👑 Chi vince resta»): in js/cuore/sala-sfide.js ----------
  // "a Tris", "alla Scalinata", "all'Asta", "al Poker"… (il nome del gioco con la sua preposizione)
  function aGioco(nome) {
    var n = String(nome || ""), m;
    if ((m = /^L'(.*)$/.exec(n))) return "all'" + m[1];
    if ((m = /^(La|Il|Lo|Le|I|Gli) (.*)$/.exec(n))) return { La: "alla ", Il: "al ", Lo: "allo ", Le: "alle ", I: "ai ", Gli: "agli " }[m[1]] + m[2];
    return "a " + n;
  }

  // opz (facoltativo) = { codice, ripresa }: la partita di prima riprende nella stessa stanza (salaRiprendiGioco): stesso
  // codice, e la Sala resta a che punto era (fase, chi è uscito) invece di ripartire dalla saletta
  function salaLancia(g, impostazioni, box, opz) {
    if (!sala) return schermataHome();
    opz = opz || {};
    SGNet.chiudiGiochi();                     // se era rimasta aperta la stanza del gioco di prima, si chiude
    var C = opz.codice ? String(opz.codice).toUpperCase() : SGNet.nuovoCodice();
    SGNet._forza = C;                         // il gioco userà QUESTO codice stanza
    sala.gioco = g.id; sala.stanza = C; sala.inGioco = true; sala.sceglie = false;
    cuore.segnaFatto(g.id); if (sala.voto) { clearTimeout(sala.tVoto); sala.voto = null; }   // (un gioco che parte chiude anche il voto)
    if (!opz.ripresa) { sala.fase = "lobby"; sala.fuori = {}; }
    sala.duello = null;
    sala.impGioco = cuore.impSalvabili(impostazioni);   // (le regole di questa partita: se la pagina si ricarica, la Sala la riprende con queste)
    // chi gioca, se l'ha scelto l'host ("Chi gioca?"): gli altri guardano e a fine partita non hanno «Ci sto»
    sala.scelti = impostazioni && impostazioni.scelti && impostazioni.scelti.length ? impostazioni.scelti.map(function (x) { return x.id; }) : null;     // (si comincia dalla saletta; chi era uscito dal gioco di prima conta di nuovo)
    if (cuore.RIV && cuore.RIV.daSala && !cuore.RIV.codice && !opz.ripresa) cuore.RIV.codice = C;   // "↻ Rivincita" di un gioco che si rilancia: la saletta nuova parte col 3-2-1
    sala._bcast();                            // dice agli altri quale gioco aprire e con che codice
    var ctx = sala.ctx = {
      // si torna in sala: prima lo dico a tutti (tornano da soli), poi chiudo la stanza del gioco
      // ("👑 Chi vince resta": se lascio la sfida in corso vince l'altro, e la serie va avanti da sola)
      esci: function () { if (!sala) return schermataHome(); cuore.restaEsce("host", sala.stanza); sala.gioco = null; sala.stanza = null; sala.inGioco = false; sala.fase = null; sala.fuori = {}; sala.ctx = null; sala.duello = null; sala._bcast(); SGNet.chiudiGiochi(1500); disegnaSalaHost(); },
      // "🎮 Cambia gioco" dalla fine: tutti nella Sala, l'host sceglie il prossimo
      cambia: function () { salaCambiaGioco(); },
      // "↻ Rivincita" di un gioco che non sa rifarsi da solo: lo stesso gioco con le stesse regole, in una stanza nuova
      // (gli amici seguono la Sala; gli id restano gli stessi). La stanza di prima si chiude dopo un attimo
      rigioca: function () { if (!sala || sala.ctx !== ctx) return; lasciaPartita(); SGNet.chiudiGiochi(1500); salaPreparaGioco(g, { stessi: true }); },
      // la partita è finita: nel torneo si sommano i punti
      risultato: function (g2, classifica) { salaRisultato(g2, classifica); },
      // (giaDato: la stessa classifica già contata prima che la pagina si ricaricasse: niente punti di nuovo)
      fine: function (g2, classifica, gi, imp, giaDato) { if (!giaDato) salaRisultato(g2, classifica); salaFine(g2, classifica, ctx); }
    };
    cuore.linkParams = {};      // l'host apre da host, non da ospite
    // la stanza del gioco nasce con la porta com'è quella della Sala (chi è nella Sala entra lo stesso)
    if (salaSempre() && sala.rete && sala.rete._sv && sala.rete._sv.porta) cuore.PORTA_SEME = true;
    avviaPartita(g, [sala.membri[0].nome], impostazioni, { regole: box }, ctx);
  }
  // (Passo 5) la pagina dell'host si è ricaricata a partita in corso: la Sala riaperta rilancia il gioco nella STESSA stanza e
  // il gioco riprende da dove era (avviaPartita trova la sua ripresa da P.forza: t.ripresa). Le regole sono quelle di prima;
  // il riquadro ⚙️ si rifà fuori dalla pagina come in salaPreparaGioco (serve alla Rivincita)
  function salaRiprendiGioco(g, impPrima) {
    if (!sala || !g || sala.gioco !== g.id || !sala.stanza) return disegnaSalaHost();
    // (intanto la partita non c'è più: es. scaduta. La Sala torna senza gioco, come prima)
    if (!cuore.ripresaDi(g.id, sala.stanza)) {
      sala.gioco = null; sala.stanza = null; sala.inGioco = false; sala.fase = null; sala.fuori = {}; sala.scelti = null; sala.ctx = null;
      sala._bcast(); return disegnaSalaHost();
    }
    // 📦 (la copia del telefono ce l'ha quasi sempre: l'ha appena giocato) se non è ancora arrivato si aspetta, poi la partita riprende
    var S0 = sala, st0 = sala.stanza;
    if (cuore.aspettaGioco(g, function () { salaRiprendiGioco(g, impPrima); }, { subito: true, viva: function () { return sala === S0 && sala.gioco === g.id && sala.stanza === st0; }, indietro: disegnaSalaHost })) return;
    var imp = {}, box = null;
    if (typeof g.impostazioni === "function") {
      box = el("div", { class: "sg-dal-gioco" });   // (🤍 roba del gioco: le sue emoji restano emoji)
      try { g.impostazioni(box, imp, { el: el, sala: true, modo: "online", giocatori: sala.membri.map(function (m) { return m.nome; }) }); }
      catch (e) { setTimeout(function () { throw e; }, 0); }
    }
    Object.keys(impPrima || {}).forEach(function (k) { imp[k] = impPrima[k]; });
    imp.modo = "online";
    sala.regole = sala.regole || {}; sala.regole[g.id] = { box: box, imp: imp };
    salaLancia(g, imp, box, { codice: sala.stanza, ripresa: true });
  }

  // "🎮 Cambia gioco" dalla fine partita: tutti tornano nella Sala ("Paky sceglie il prossimo gioco… 🎲") e l'host è già
  // nell'elenco dei giochi. Tocchi dell'host fino al gioco dopo: Cambia gioco, la tessera, Comincia. Amici: nessuno
  function salaCambiaGioco() {
    if (!sala) return schermataHome();
    lasciaPartita(); cuore.FINE = null; cuore.RIV = null;
    sala.gioco = null; sala.stanza = null; sala.inGioco = false; sala.fase = null; sala.fuori = {}; sala.ctx = null; sala.duello = null;
    cuore.restaFerma(true);   // (anche "Chi vince resta" finisce: il record resta scritto)
    sala.sceglie = true; sala._bcast();
    SGNet.chiudiGiochi(1500);   // (prima gli amici tornano nella Sala, poi la stanza si chiude)
    salaScegliGioco();
  }

  function salaFine(g, classifica, ctx) {
    var T = sala && sala.torneo, punti = {};
    if (T && T.ultima) T.ultima.assegnati.forEach(function (a) { punti[a.nome] = a.punti; });
    var s = schermata({ icona: "🏆", titolo: T ? "Punti di questa partita" : "Fine partita", sotto: g.nome });
    var P = cuore.partitaCorrente && cuore.partitaCorrente.viva() && cuore.partitaCorrente.salaCtx === ctx ? cuore.partitaCorrente : null;
    var fac = null; try { fac = P ? P.tavolo.faccine() : null; } catch (e) {}   // (le faccine anche qui)
    var ol = el("ol", { class: "classifica" + (classificaFitta((classifica || []).length, fac ? 56 : 0) ? " fitta" : "") }), med = ["🥇", "🥈", "🥉"];
    (classifica || []).forEach(function (r, i) {
      ol.appendChild(el("li", { class: i === 0 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: med[i] || (i + 1) + "°" }),
        el("span", { class: "nome", text: r.nome }),
        T && punti[r.nome] != null ? el("span", { class: "punti", text: "+" + punti[r.nome] }) : (r.punti != null ? el("span", { class: "punti", text: r.punti }) : null) ]));
    });
    s._contenuto.appendChild(ol);
    if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }
    // i tasti di fine uguali per tutti: "↻ Rivincita" (lo stesso gioco, stesse regole) e "🎮 Cambia gioco"
    if (!(P && cuore.tastiFineCore(s._piede, { host: true, rigioca: true }, { P: P })))
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "👥 Torna alla sala", onclick: ctx.esci }));
    mostra(s);
  }

  // ---------- OSPITE ----------
  function salaOspite(codice) {
    if (!(window.SGNet && SGNet.disponibile())) return salaSenzaRete();
    codice = String(codice).toUpperCase();
    cuore.ricordaStanza({ sala: codice });   // se l'app si riapre, in home c'è "Rientra"
    cuore.segnaLinkSessione({ sala: codice });   // se la pagina si ricarica, si rientra da soli
    cuore.tieniAcceso(true);
    var io = profiloAttivo();
    // nella Sala si entra sempre col profilo (nome e avatar suoi): chi non ce l'ha lo crea e poi entra da solo
    if (!io) return cuore.schermataAccesso(function () { salaOspite(codice); });
    entraInSala(codice, io.nome, io.emoji, io.omino || null);
  }
  // o (facoltativo) = { subito: true } lo schermo di adesso resta finché non arriva la Sala (chi cede la sua: niente
  //   "Entro nella sala…" in mezzo); { aspetta: comp } la Compagnia vuota, senza profilo: "🕐 Nessuno ancora" (aspettaCompagnia)
  function entraInSala(codice, nome, emoji, omino, o) {
    o = o || {};
    if (salaG && salaG.rete) try { salaG.rete.chiudi(); } catch (e) {}
    salaG = { rete: null, codice: String(codice).toUpperCase(), myId: null, nome: nome, emoji: emoji, omino: omino, membri: [], inGioco: null, torneo: null, podio: false, _msg: null,
      uscitoDa: null, finitoDa: null, giocoSala: null, nomeHost: "", fuori: [],   // uscitoDa / finitoDa: la stanza del gioco da cui sono uscito o che per me è finita (non mi ci riporta dentro da sola)
      capo: null, ultima: null, comp: compDi(codice), aspetta: o.aspetta || null };   // capo: la Sala che seguo { gen, nato, _s, dev }; ultima: la sua ultima foto
    var S = salaG;
    if (!profiloAttivo()) cuore.ricordaNomeStanza(S.codice, nome);
    if (S.aspetta) schermataAspettaComp(S); else if (!o.subito) attendiSala();
    // (decideApp: con due Sale sullo stesso codice decido io quale seguire, con la regola della Sala: vedi primaSala)
    S.rete = SGNet.entra(S.codice, {
      onAperto: function (id) {
        S.myId = id;
        // (la mia Compagnia con un nome più nuovo di quello della Sala: lo passo all'host)
        var v = null; try { v = window.SGCompagnia && S.codice.length === 6 ? SGCompagnia.trova(S.codice) : null; } catch (e) {}
        S.rete.invia({ t: "join", nome: S.nome, emoji: S.emoji, omino: S.omino || null, comp: v && v.rv ? { nome: v.n, emoji: v.e, rv: v.rv } : undefined });
        setTimeout(function () { if (salaG === S && !S.membri.length && S._msg) S._msg.textContent = "Non trovo la sala: controlla il codice o attendi l'host…"; }, 8000); },
      onMsg: function (m) {
        if (salaG !== S || !m || m.t !== "sala") return;
        // la Sala che seguo: con due Sale sullo stesso codice resta quella che vince (uguale su tutti i telefoni);
        // quella che perde per me non esiste. Se vince una Sala nuova la seguo (seguiHost) e, se l'host è cambiato, lo dico
        if (m._s) {
          var k = capoDi(m);
          if (!S.capo) {
            S.capo = k;
            // (la prima foto della Sala: se prima nella stanza c'era altro, es. la partita da cui nasce il torneino, seguo questa)
            var st0 = S.rete && S.rete.stato ? S.rete.stato() : null;
            if (st0 && st0.sessione && st0.sessione !== k._s) { S.cambioHost = true; try { S.rete.seguiHost(k._s); } catch (e) {} }   // (niente "è tornato")
          } else if (k._s !== S.capo._s) {
            if (primaSala(k, S.capo) !== k) return;
            var nh = nomeHostDi(m), cambio = k.gen > S.capo.gen || (!!nh && !!S.nomeHost && !stessoNome(nh, S.nomeHost));
            S.capo = k; S.cambioHost = cambio;
            try { S.rete.seguiHost(k._s); } catch (e) {}
            if (cambio) pillola("tornato", "👑 Ora la Sala la tiene " + (nh || "un amico"), "verde", 3500);
          }
          S.ultima = m;
          // una Sala che si è appena aperta col codice fisso (trasloco, subentro, host che ricarica) guarda prima di parlare e
          // il mio "join" di prima non l'ha sentito: se già mi ha tra i suoi (ereditato) glielo ridico una volta, se no per
          // 30 s non sa che ci sono (non posso fare da vice) e poi mi toglie
          if (S.joinS !== k._s && S.rete && mioIdSala(S) && (m.membri || []).some(function (x) { return x && x.id === mioIdSala(S); })) {
            S.joinS = k._s;
            var vJ = null; try { vJ = window.SGCompagnia && S.codice.length === 6 ? SGCompagnia.trova(S.codice) : null; } catch (e) {}
            try { S.rete.invia({ t: "join", nome: S.nome, emoji: S.emoji, omino: S.omino || null, comp: vJ && vJ.rv ? { nome: vJ.n, emoji: vJ.e, rv: vJ.rv } : undefined }); } catch (e) {}
          }
          // (l'host c'è: nessun vice aspetta. La pausa la segno con la MIA ora di quando la vedo: niente orologi da confrontare)
          clearTimeout(S.tVice); S.tVice = null;
          if (m.pausa) { if (S.pausaV !== m.pausa) { S.pausaV = m.pausa; S.pausaVista = Date.now(); } } else { S.pausaV = null; S.pausaVista = 0; }
          // l'host mi passa la Sala ("👑 Passa la Sala a …"): la prendo subito
          if (m.cede && m.cede === mioIdSala(S) && !m.elim && profiloAttivo()) return subentraSala(S, m, "passata");
        }
        // l'host è tornato mentre giocavo: se il gioco continua (la stessa stanza) lo dice il gioco; se no "si riparte dalla Sala"
        if (S.tornatoDopo) {
          var tD = S.tornatoDopo; S.tornatoDopo = 0;
          if (Date.now() - tD < 6000 && !(m.gioco && m.stanza && S.inGioco === m.stanza)) pillola("tornato", "🎉 " + (nomeHostDi(m) || S.nomeHost || "L'host") + " è tornato: si riparte dalla Sala", "verde", 3500);
        }
        // la Sala si è spostata nella Compagnia (p3-b): si va lì da soli, con lo stesso id
        if (m.trasloco && codiceComp(m.trasloco.codice) && codiceComp(m.trasloco.codice) !== S.codice) return traslocoOspite(S, m.trasloco);
        // la Compagnia: la tengo tra le mie (la prima volta "📌 … è nella tua home"); un nome più nuovo lo prendo
        if (m.comp && m.comp.nome) {
          var cp = compDi(S.codice, m), nuovaC = !S.comp || S.comp.nome !== cp.nome || S.comp.emoji !== cp.emoji;
          S.comp = cp;
          if (window.SGCompagnia && S.codice.length === 6) try {
            if (!SGCompagnia.trova(S.codice)) { if (SGCompagnia.salva({ c: S.codice, n: cp.nome, e: cp.emoji, rv: cp.rv })) pillola("saletta", "📌 «" + cp.emoji + " " + cp.nome + "» è nella tua home", "verde", 3000); }
            else if (nuovaC) SGCompagnia.aggiorna(S.codice, { nome: cp.nome, emoji: cp.emoji, rv: cp.rv });
          } catch (e) {}
        }
        // nella Sala che seguo non ci sono (l'host è cambiato, o mi ha perso): chiedo di nuovo di entrare
        var mioS = mioIdSala(S);
        if (mioS && S.rete && S.rete.riprova && !(m.membri || []).some(function (x) { return x && x.id === mioS; })) try { S.rete.riprova(); } catch (e) {}
        var eraE = S.elim;
        S.membri = m.membri || []; S.torneo = m.torneo || null; S.elim = m.elim || null;
        if (eraE && !S.elim) cuore.lasciaTorneo(S);   // il torneino è finito (o fermato): via dalla partita e dal tabellone, si torna nella Sala
        rigaPuntiOra();   // (sulla classifica di fine partita: "🏆 Paky +100 · Luca +78" appena arrivano i punti)
        // il mio nome nella Sala: se c'era già un altro con lo stesso nome, l'host me l'ha cambiato ("Luca 2") e nei giochi uso quello
        S.membri.forEach(function (x) {
          if (x.id === S.myId && x.nome && x.nome !== S.nome) { S.nome = x.nome; if (!profiloAttivo()) cuore.ricordaNomeStanza(S.codice, x.nome); }
          if (x.id === "host") S.nomeHost = x.nome;
        });
        if (S.elim) {   // torneo a eliminazione (o il torneino della Sala): si apre da sola la mia partita
          if (S.inGioco !== null) { S.inGioco = null; S.giocoSala = null; S.uscitoDa = null; S.finitoDa = null; S.duello = null; S.faseD = null; S.dFine = null; cuore.togliVia(); cuore.FINE = null; }   // (il gioco della Sala di prima non c'è più)
          return cuore.seguiOspite();
        }
        S.giocate = m.giocate && typeof m.giocate === "object" ? m.giocate : {};
        S.sc = m.gioco && m.stanza && Array.isArray(m.sc) ? { stanza: m.stanza, ids: m.sc } : null;   // (chi gioca, se l'ha scelto l'host)
        // "👑 Chi vince resta": la serie (coda, campione, la sfida dopo) e il record di stasera; _ric = quando l'ho ricevuta (per il conto)
        var eraR = S.resta;
        S.resta = m.resta && typeof m.resta === "object" && m.resta.sfida && Array.isArray(m.resta.coda) ? m.resta : null;
        if (S.resta) S.resta._ric = Date.now();
        S.restaRec = m.restaRec && typeof m.restaRec === "object" ? m.restaRec : null;
        if (eraR && !S.resta) pillola("sala", "👑 «Chi vince resta» è finito: si torna nella Sala", "verde", 2600);
        // (uno dei due se n'è andato a metà sfida: si torna nella Sala e si aspetta la prossima)
        var Ev = S.resta && S.resta.esito;
        if (Ev && Ev.via && S.restaViaN !== Ev.n && (S.resta.parte || 0) > (S.resta.ora || 0)) { S.restaViaN = Ev.n; pillola("sala", "🚪 " + (Ev.np || "L'avversario") + " non c'è più: resta " + (Ev.nv || "l'altro"), "verde", 3000); }
        cuore.restaAggiorna();
        // "🗳️ Scegliamo insieme": l'host l'ha acceso (dopo si vota); il voto o la ruota aperti (solo senza un gioco in corso)
        S.insieme = !!m.insieme;
        var Vt = !m.gioco && cuore.votoValido(m.voto) ? m.voto : null;
        if (!Vt) cuore.votoVia(S);
        // 📦 il gioco della Sala (o quelli proposti nel voto) comincia ad arrivare su questo telefono appena lo si sa
        if (m.gioco) cuore.precarica(String(m.gioco));
        if (Vt && Array.isArray(Vt.giochi)) Vt.giochi.forEach(function (id) { if (typeof id === "string") cuore.precarica(id); });
        if (m.gioco && m.stanza) {
          // fase: a che punto è il gioco; nel: chi è dentro la sua stanza; fuori: chi ne è uscito apposta
          var fase = typeof m.fase === "string" ? m.fase : "lobby", mio = mioIdSala(S);
          var nel = Array.isArray(m.nel) && !!mio && m.nel.indexOf(mio) >= 0;
          // il duello (gioco a due senza l'host): chi lo apre, chi entra, chi guarda (lo smista salaLanciaOspite)
          var D = m.duello && m.duello.stanza === m.stanza ? m.duello : null, faseDi = S.faseD;
          S.duello = D; S.faseD = D ? fase : null;
          // (punto: a che punto è la partita, "round 3 di 5", per il riquadro di chi è fuori)
          S.giocoSala = { gioco: m.gioco, stanza: m.stanza, fase: fase, punto: typeof m.punto === "string" ? m.punto.slice(0, 40) : "" };
          S.fuori = Array.isArray(m.fuori) ? m.fuori : [];
          if (S.guardoIn && S.guardoIn !== m.stanza) { S.guardoIn = null; S.guardoFine = null; }
          // "👑 Chi vince resta": ogni sfida si apre da sola su tutti i telefoni, a qualunque punto sia. Chi la gioca entra; gli
          // altri la guardano senza entrare (la targhetta "👀 Guardi · in coda: sei 2°"), tranne chi ha smesso di guardare questa
          var RS = S.resta && S.resta.sfida && S.resta.sfida.stanza === m.stanza ? S.resta.sfida : null;
          if (RS && S.inGioco !== m.stanza && S.uscitoDa !== m.stanza && S.restaVia !== m.stanza && S.finitoDa !== m.stanza) {
            S.inGioco = m.stanza; S.podio = false;
            if (mio === RS.a || mio === RS.b || D) salaLanciaOspite(m.gioco, m.stanza);   // (il duello lo smista salaLanciaOspite)
            else salaLanciaOspite(m.gioco, m.stanza, { guarda: true });
            return;
          }
          if (S.inGioco === m.stanza) {   // ci sono già: nella saletta cambia solo chi manca
            if (D) seguiDuello(S, D, faseDi, fase);
            else if (guardoEntra(S, m, fase)) return;   // (guardavo e si ricomincia: entro anch'io)
            return rinfrescaAttesi();
          }
          // ne sono uscito: resto nella Sala con "Rientra"
          if (S.uscitoDa === m.stanza) { if (S.inGioco === null) disegnaSalaOspite(); return; }
          // il duello: dentro subito, a qualunque punto sia (chi non gioca lo guarda in diretta)
          if (D) { if (S.finitoDa !== m.stanza) { S.inGioco = m.stanza; S.podio = false; salaLanciaOspite(m.gioco, m.stanza); } else if (S.inGioco === null) disegnaSalaOspite(); return; }
          // si comincia (saletta del gioco, anche "Nuova partita" e "Rivincita"), oppure c'ero già (ho ricaricato la pagina): dentro
          if (fase === "lobby" || (nel && S.finitoDa !== m.stanza)) { S.finitoDa = null; S.inGioco = m.stanza; S.podio = false; salaLanciaOspite(m.gioco, m.stanza); return; }
          // partita in corso e io non c'ero (o per me è finita): resto nella Sala, "entri alla prossima · 👀 Guarda"
          if (S.inGioco === null) disegnaSalaOspite();
          return;
        }
        S.giocoSala = null; S.uscitoDa = null; S.finitoDa = null; S.fuori = []; S.duello = null; S.faseD = null; S.guardoIn = null; S.guardoFine = null;
        S.sceglie = m.sceglie === 2 ? "sfida" : !!m.sceglie;   // l'host sta scegliendo il prossimo gioco ("🎮 Cambia gioco") o chi gioca ("⚔️ Altra sfida")
        if (S.inGioco !== null) {   // tornati in sala: il gioco non disegna più e il suo collegamento si chiude
          S.inGioco = null; lasciaPartita(); SGNet.chiudiGiochi(); cuore.togliVia(); cuore.FINE = null;
          if (S.sceglie || Vt) pillola("sala", Vt ? "🗳️ Si vota il prossimo gioco!" : (S.sceglie === "sfida" ? "⚔️ Altra sfida!" : "🎮 Si cambia gioco!"), "verde", 2500);
        }
        if (Vt) return cuore.votoOspite(S, Vt);   // (la scheda del voto, o la ruota)
        if (S.torneo && S.torneo.finito) { if (!S.podio) { S.podio = true; schermataPodioT(S.torneo, false); } return; }
        S.podio = false;
        disegnaSalaOspite();
      },
      // l'host ha riaperto la Sala (la sua pagina si è ricaricata): il join riparte da solo, qui solo l'avviso.
      // (se la Sala è passata a un altro c'è già "👑 Ora la Sala la tiene Luca")
      // (Passo 5: se sto giocando, la pillola aspetta la foto della Sala: se il gioco continua lo dice il gioco, "riprende da dove era")
      onHostNuovo: function (eraDentro) {
        var cambio = S.cambioHost; S.cambioHost = false;
        if (!eraDentro || salaG !== S || cambio) return;
        if (S.elim && (S.inPartitaK || S.guardaK)) return;   // (torneo a eliminazione: la mia partita, o quella che guardo, continua: lo dice lei)
        if (S.inGioco !== null) { S.tornatoDopo = Date.now(); return; }
        pillola("tornato", "🎉 " + (S.nomeHost || "L'host") + " è tornato: si riparte dalla Sala", "verde", 3500);
      },
      // l'host è sparito (il broker l'ha detto: schermo bloccato, app chiusa…). Se sono uno dei vice (i primi due arrivati col
      // profilo, scritti nella sua ultima foto) prendo la Sala io: il primo dopo 20 s, il secondo dopo 30 s; se l'host era uscito
      // da poco dall'app (pausa: è andato a mandare il link) 90 s e 120 s. Se torna prima, o la prende l'altro vice, niente
      onHostVia: function (sparito) {
        if (salaG !== S) return;
        var u = S.ultima;
        if (sparito && S.tVice && S.tViceU === u) return;   // (lo stesso "host sparito" detto due volte: il conto non riparte)
        clearTimeout(S.tVice); S.tVice = null;
        if (!sparito) return;
        S.viaS = u && u._s;
        if (!u || u.t !== "sala" || u.elim || !profiloAttivo() || (S.capo && u._s !== S.capo._s)) return;
        var k = (Array.isArray(u.vice) ? u.vice : []).indexOf(mioIdSala(S));
        if (k < 0 || k > 1) return;
        var pausa = !!S.pausaVista && Date.now() - S.pausaVista < VICE_PAUSA;
        S.tViceU = u;
        S.tVice = setTimeout(function () { S.tVice = null; if (salaG === S && S.ultima === u) subentraSala(S, u, "sparito"); }, VICE_ATTESA[pausa ? 1 : 0][k]);
      },
      onChiuso: function (perche) {
        if (salaG !== S) return;
        if (perche && perche.sparito) {
          // (aspettavo di fare il vice proprio adesso: la prendo invece di chiudere)
          if (S.tVice && S.ultima) { clearTimeout(S.tVice); S.tVice = null; return subentraSala(S, S.ultima, "sparito"); }
          if (S.viaS && S.capo && S.capo._s !== S.viaS) return;   // (seguo già la Sala di un altro: quella di prima non conta)
        }
        lasciaPartita(); chiudiSalaOspite();
        errore(schermataHome, perche && perche.sparito ? "La Sala è chiusa: chi l'ha aperta non è tornato in tempo." : "La Sala è stata chiusa dall'host.");
      },
      onErrore: function () { if (salaG !== S) return; chiudiSalaOspite(); errore(schermataHome, "Problema di collegamento con la sala. Riprova."); }
    }, { tieni: true, decideApp: true });   // resta aperta tra un gioco e l'altro
  }

  function chiudiSalaOspite() { try { if (salaG && salaG.rete) salaG.rete.chiudi(); } catch (e) {} salaG = null; cuore.dimenticaStanza(); }

  // l'host ha fatto della Sala una Compagnia: la sua ultima foto dice dove è andata. Chi era dentro ci va subito con lo stesso
  // id (l'host lo aspetta al suo posto); chi arriva dopo (link vecchio, app riaperta) ci entra come dalla tessera della home
  function traslocoOspite(S, tr) {
    if (S.traslocato || salaG !== S) return;
    S.traslocato = true;
    var C = codiceComp(tr.codice), cp = compDi(C, { comp: tr.comp }) || compVuota(C), mio = mioIdSala(S);
    var dentro = !!mio && (S.membri || []).some(function (x) { return x && x.id === mio; });
    if (mio) SGNet.ricordaId(C, mio);   // (nella Compagnia lo stesso id di prima: stesso posto, stessi giochi)
    var kS = cuore.chiaveDi(S.codice); if (kS) cuore.chiaveDi(C, false, kS);   // (🔑 la chiave delle foto di stasera viene con noi)
    try { if (window.SGCompagnia) { if (!SGCompagnia.salva({ c: C, n: cp.nome, e: cp.emoji, rv: cp.rv })) SGCompagnia.aggiorna(C, cp); } } catch (e) {}
    if (!profiloAttivo()) cuore.ricordaNomeStanza(C, S.nome);
    if (S.inGioco !== null) { S.inGioco = null; lasciaPartita(); SGNet.chiudiGiochi(); cuore.togliVia(); cuore.FINE = null; }
    var titoloC = cp.emoji + " " + cp.nome;
    setTimeout(function () {
      if (salaG !== S) return;
      if (!dentro) {   // (non ero nella Sala: la Compagnia si apre come dalla home)
        pillola("saletta", "📌 La Sala ora è «" + titoloC + "»: la trovi in home", "verde", 4000);
        return apriCompagnia(C, { nome: cp.nome, emoji: cp.emoji });
      }
      cuore.ricordaStanza({ sala: C }); cuore.segnaLinkSessione({ sala: C });   // (la Sala di prima non va più ricordata)
      pillola("saletta", "📌 Ora siete «" + titoloC + "»: la trovi in home", "verde", 4000);
      entraInSala(C, S.nome, S.emoji, S.omino, { subito: true });   // (lo schermo resta finché non arriva la Compagnia)
    }, 0);
  }

  // ---------- LA COMPAGNIA: entrare o aprire la serata ----------
  // il nome di una Compagnia che non conosco ancora
  function compVuota(C) { return { nome: "Compagnia " + C, emoji: "📌", rv: 0 }; }
  // la Compagnia C (dalla tessera in home, dal link fisso, da "🔑 Ho un codice"). info = { nome, emoji, gioco, daCodice }
  // Prima si sbircia: se dentro c'è qualcuno si entra da amico; se no la apre chi ha il profilo (gen + 1 se c'era una Sala
  // morta), e chi non ce l'ha entra e aspetta. Da "Ho un codice" (daCodice = "riscrivi"), per una Compagnia che non è tra
  // le mie e dove non c'è nessuno, prima si chiede: così una lettera sbagliata non apre una Compagnia fantasma
  function apriCompagnia(C, info) {
    info = info || {};
    C = codiceComp(C);
    if (!C) return schermataHome();
    if (!(window.SGNet && SGNet.disponibile())) return salaSenzaRete();
    // ci sono già
    if (sala && sala.codice === C) return disegnaSalaHost();
    if (salaG && salaG.codice === C) { if (salaG.membri.length) return disegnaSalaOspite(); if (salaG.aspetta) return schermataAspettaComp(salaG); }
    // un'altra Sala aperta da me: prima si chiude (gli amici restano senza)
    if (sala) return chiediConferma("Chiudere la tua Sala " + sala.codice + "?", "Gli amici che ci sono restano senza Sala.", "Chiudi e vai", function () { chiudiSala(); apriCompagnia(C, info); });
    if (salaG) { lasciaPartita(); chiudiSalaOspite(); }
    var nota = compDi(C), comp = nota || (info.nome ? { nome: String(info.nome).slice(0, 24), emoji: String(info.emoji || "📌").slice(0, 8), rv: 0 } : null);
    try { if (window.SGCompagnia) SGCompagnia.usata(C); } catch (e) {}
    var s = schermata({ icona: comp ? comp.emoji : "📌", titolo: comp ? "Entro in " + comp.nome + "…" : "Entro nella compagnia…", sotto: "Codice " + C, indietro: schermataHome });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Guardo chi c'è… un attimo." }));
    mostra(s);
    function dopo(es) {
      if (!document.body.contains(s)) return;   // intanto si è andati altrove
      var r = (es && es[C]) || { stato: "boh", msg: null, gen: 0 }, msg = r.msg;
      // (dal modo "Compagnia" di un gioco: la Sala la tiene un altro, glielo dico)
      if (r.stato === "viva") { salaOspite(C); if (info.gioco) dilloAllHost(nomeHostDi(msg), info.gioco); return; }
      var apri = function () {
        if (!profiloAttivo()) return aspettaCompagnia(C, comp || compVuota(C));
        var dz = msg && msg.t === "sala" ? msg : null;   // (una Sala trattenuta che non risponde: si continua con i suoi amici)
        creaSala({ codiceFisso: C, comp: comp || compVuota(C), gen: (+r.gen || 0) + 1, sopra: (msg && (msg._s || msg.s)) || null, gioco: info.gioco || null,
          eredita: dz ? { membri: dz.membri, torneo: dz.torneo, giocate: dz.giocate } : null });
      };
      // scritta a mano e non è tra le mie: "Apri tu la serata?" (oppure si riscrive il codice)
      if (info.daCodice && !nota) {
        svuota(s._contenuto); svuota(s._piede);
        s._contenuto.appendChild(el("p", { class: "link-avviso", text: "Non c'è nessuno nella compagnia " + C + ". Apri tu la serata?" }));
        s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Se il codice te l'ha dato un amico, controlla di averlo scritto giusto." }));
        s._piede.appendChild(el("button", { class: "btn btn-primario", text: "📌 Apri la serata", onclick: apri }));
        s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "✏️ Riscrivi il codice", onclick: info.daCodice }));
        return;
      }
      apri();
    }
    if (window.SGCompagnia && SGCompagnia.sbircia) SGCompagnia.sbircia([C], dopo, true);
    else SGNet.sbircia([C], dopo);
  }
  // la Compagnia vuota, senza profilo: si entra col nome di questo telefono e si aspetta (se il nome non c'è, il profilo)
  function aspettaCompagnia(C, comp) {
    var nome = cuore.nomeStanza(C) || nomeOspiteSalvato();
    if (!nome) return cuore.schermataAccesso(function () { apriCompagnia(C, comp ? { nome: comp.nome, emoji: comp.emoji } : null); });
    cuore.ricordaStanza({ sala: C }); cuore.segnaLinkSessione({ sala: C }); cuore.tieniAcceso(true);
    entraInSala(C, nome, "🙂", window.SGOmino ? SGOmino.casuale(nome) : null, { aspetta: comp || compVuota(C) });
  }
  // "🎮 La Sala la tiene Paky: digli che vuoi giocare a Tris" (il modo "Compagnia" quando la Sala è di un altro)
  function dilloAllHost(nomeH, gid) {
    var g = giocoDa(gid); if (!g) return;
    pillola("saletta", nomeH ? "🎮 La Sala la tiene " + nomeH + ": digli che vuoi giocare " + aGioco(g.nome) : "🎮 La Sala è già aperta: chiedi di giocare " + aGioco(g.nome), "blu", 6000);
  }
  // il modo "Online con «Quelli del giovedì»" di "Come giocate?": se la Sala della Compagnia è mia il gioco parte lì; se ci
  // sono dentro da amico o la tiene un altro ci entro e glielo dico; se non c'è nessuno la apro io e si va dritti nel gioco
  function giocaInCompagnia(g, C) {
    C = codiceComp(C);
    if (!C) return schermataModo(g);
    if (sala && sala.codice === C) return apriOnlineSala(g);
    if (salaG && salaG.codice === C && salaG.membri.length) { disegnaSalaOspite(); return dilloAllHost(salaG.nomeHost, g.id); }
    apriCompagnia(C, { gioco: g.id });
  }
  // "🔁 Riapri la Sala di ieri sera": lo stesso codice di 4 lettere (il link vecchio nella chat vale ancora), Sala nuova (niente
  // punti di ieri). Prima si guarda il codice: libero → si riapre; la Sala di ieri ancora viva con dentro gli amici di ieri (l'ha
  // presa uno di loro) → si entra da amico; occupato da altri (o la rete non risponde) → Sala con un codice nuovo e si avvisa
  function riapriSalaIeri(o) {
    if (!(window.SGNet && SGNet.disponibile())) return salaSenzaRete();
    if (sala || salaG) return schermataHome();
    var C = String(o.codice).toUpperCase();
    var s = schermata({ icona: "🔁", titolo: "Riapro la Sala…", sotto: "Codice " + C, indietro: schermataHome });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Guardo se il codice è libero… un attimo." }));
    mostra(s);
    SGNet.sbircia([C], function (es) {
      if (!document.body.contains(s) || sala || salaG) return;   // (intanto si è andati altrove)
      var r = (es && es[C]) || { stato: "boh", msg: null, gen: 0 }, m = r.msg;
      if (r.stato === "viva" && m && m.t === "sala" && !m.trasloco && (m.membri || []).some(function (x) { return x && o.nomi.some(function (n) { return stessoNome(n, x.nome); }); }))
        return salaOspite(C);
      if (r.stato === "viva" || r.stato === "boh") {
        creaSala();
        if (r.stato === "viva") pillola("sala", "Il codice di ieri era occupato: la Sala ha un codice nuovo, rimanda il link", "blu", 6000);
        return;
      }
      // (ferma: c'era una Sala morta su quel codice → una generazione in più, sopra il suo testamento)
      creaSala({ codiceFisso: C, gen: r.stato === "ferma" ? (+r.gen || 0) + 1 : 1, sopra: (m && (m._s || m.s)) || null });
      pillola("sala", "🔁 Sala " + C + " riaperta: il link di ieri vale ancora", "verde", 4000);
    });
  }

  function attendiSala() {
    var cp = salaG.comp;
    var s = schermata({ icona: cp ? cp.emoji : "👥", titolo: cp ? "Entro in " + cp.nome + "…" : "Entro nella sala…", sotto: "Codice " + salaG.codice,
      indietro: function () { chiudiSalaOspite(); schermataHome(); } });
    salaG._msg = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" });
    s._contenuto.appendChild(salaG._msg);
    mostra(s);
  }
  // la Compagnia senza nessuno dentro, per chi non ha il profilo (aprirla serve il profilo): si resta collegati e si
  // entra da soli appena qualcuno apre la serata ("sono entrato" parte da solo quando arriva l'host)
  function schermataAspettaComp(S) {
    var cp = S.comp || S.aspetta || {}, C = S.codice;
    var s = schermata({ icona: cp.emoji || "📌", titolo: cp.nome || "Compagnia " + C, sotto: "Codice " + C,
      indietro: function () { if (salaG === S) chiudiSalaOspite(); schermataHome(); } });
    s.classList.add("cmp-aspetta");
    s._contenuto.appendChild(el("div", { class: "cmp-attesa" }, [
      el("div", { class: "cmp-attesa-ico", "aria-hidden": "true", text: "🕐" }),
      el("b", { class: "cmp-attesa-tit", text: "Nessuno ancora nella compagnia" }),
      el("p", { class: "cmp-attesa-sotto", text: "Appena qualcuno apre la serata entri da solo." })
    ]));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "👤 Crea il profilo e aprila tu", onclick: function () {
      cuore.schermataAccesso(function () { if (salaG === S) chiudiSalaOspite(); apriCompagnia(C, cp.nome ? { nome: cp.nome, emoji: cp.emoji } : null); });
    } }));
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Torna alla home", onclick: function () { if (salaG === S) chiudiSalaOspite(); schermataHome(); } }));
    S._msg = null;
    mostra(s);
  }

  function disegnaSalaOspite() {
    if (!salaG) return;
    amiciStato("sala", salaG.codice);
    var T = salaG.torneo, E = salaG.elim;
    var extra = E ? [cuore.boxElimSala(E, salaG.myId, false, salaG, cuore.seguiOspite)] : (T ? [boxTorneoCorto(T, salaG)] : []);
    var TN = !!(E && E.torneino), nH = salaG.nomeHost || "L'host";
    // un gioco in corso senza di me: ne sono uscito ("Rientra ▶") o sono arrivato a partita cominciata ("entri alla prossima · 👀 Guarda")
    var gs = !E && salaG.giocoSala && salaG.inGioco === null ? salaG.giocoSala : null;
    var tipo = !gs ? null : (salaG.uscitoDa === gs.stanza ? "rientra" : (gs.fase && gs.fase !== "lobby" && salaG.finitoDa !== gs.stanza ? "prossima" : null));
    var inCorso = tipo ? boxInCorso(gs, tipo) : null;
    var coda = !E ? cuore.riquadroCoda(salaG, false) : null;   // ("👑 Paky 🔥2 · in coda: Luca, tu")
    if (coda) extra.unshift(coda);
    if (inCorso) extra.unshift(inCorso);
    var sS = cuore.saletta(gSala(!!T, E, salaG.comp), {
      host: false, codice: salaG.codice, _rete: salaG.rete, link: linkSala(salaG.codice),
      // (con la Sala sempre accesa il codice sta già nella testata: sotto il titolo di chi è la Sala)
      sotto: TN ? "Torneo a eliminazione · Sala di " + nH : (E ? "Torneo a eliminazione · codice " + salaG.codice : (salaSempre() && salaG.nomeHost ? "Sala di " + salaG.nomeHost : "Codice " + salaG.codice)),
      giocatori: salaG.membri.map(function (m) { return { id: m.id, nome: m.nome, omino: m.omino || null, host: m.id === "host", tu: m.id === salaG.myId }; }),
      extra: extra,
      attesa: TN ? (E.finito ? nH + " vi riporta nella Sala: non devi toccare niente." : (E.iniziato ? "Quando tocca a te, la partita si apre da sola." : (E.scade ? "Tocca un posto libero: ti siedi lì, con chi vuoi." : "Si comincia appena ci siete tutti.")))
        : E ? (E.iniziato ? "Quando tocca a te, la partita si apre da sola." : "Tocca il girone in cui vuoi giocare, poi aspetta che l'host faccia partire il torneo.")
        : salaG.resta && tipo !== "rientra" ? "👑 Le sfide partono da sole: quando tocca a te, entri da solo."
        : (tipo === "rientra" ? "Gli altri giocano: rientra quando vuoi."
          : (tipo === "prossima" ? attesaInCorso(salaG, gs)
            : (salaG.sceglie && !gs ? (salaG.nomeHost || "L'host") + (salaG.sceglie === "sfida" ? " sceglie chi gioca… ⚔️" : (salaG.insieme ? " propone 3 giochi: poi votate tutti… 🗳️" : " sceglie il prossimo gioco… 🎲")) : "Aspetta l'host: il gioco parte da solo."))),
      onEsci: function () { chiudiSalaOspite(); schermataHome(); }
    });
    if (sS) sS.classList.toggle("con-tabellone", !!(E && (E.iniziato || (E.torneino && E.scade))));
    salaG._msg = null;
  }
  // nella Sala, un gioco in corso senza di me (sempre lo stesso riquadro: niente lampeggio, cambiano solo le scritte):
  //  "rientra": ne sono uscito → "🎮 Stanno giocando a Tris · Rientra ▶" (e la Sala torna ad aspettarmi);
  //  "prossima": sono arrivato a partita cominciata → secondo il gioco (modoInCorso):
  //    "entra"  (Balla, Black Jack… a partita in corso): "▶ Entra · giochi dal prossimo turno" e "👀 Guarda";
  //    "guarda" (gli altri, o a partita finita): "👀 Guarda" e sotto "entri alla prossima partita";
  //    "due"    (giochi a due): "👀 Guarda la sfida"; "scelti": ha scelto l'host chi gioca, si guarda.
  //  Prima riga "🎮 Si gioca a Balla · round 3 di 5" (il punto lo dà il gioco dell'host con t.aCheSiamo)
  // la riga sotto la Sala quando c'è un gioco in corso senza di me
  function attesaInCorso(S, gs) {
    var D = S.duello && S.duello.stanza === gs.stanza ? S.duello : null;
    if (D) return "Guardali in diretta quando vuoi: alla fine si torna qui.";
    var modo = modoInCorso(S, gs), g = giocoDa(gs.gioco);
    if (modo === "entra") return g && g.ritardatari === "subito" ? "✋ Puoi entrare: giochi subito." : "✋ Puoi entrare subito: giochi " + (g && g.ritardatari === "mano" ? "dalla prossima mano" : "dal prossimo turno") + ".";
    if (modo === "due") return "Giocano in due: guardali in diretta quando vuoi.";
    if (modo === "scelti") return "Giocano quelli scelti da " + (S.nomeHost || "l'host") + ": guardali quando vuoi.";
    return "Entri da solo alla prossima partita.";
  }
  function modoInCorso(S, gs) {
    var g = giocoDa(gs.gioco), mio = mioIdSala(S);
    if (aDue(g)) return "due";
    if (S.sc && S.sc.stanza === gs.stanza && S.sc.ids.indexOf(mio) < 0) return "scelti";
    var r = g && g.ritardatari;
    return (r === "turno" || r === "mano" || r === "subito") && gs.fase === "gioco" ? "entra" : "guarda";
  }
  function boxInCorso(gs, tipo) {
    var S0 = salaG, D = S0.duello && S0.duello.stanza === gs.stanza ? S0.duello : null, mio = mioIdSala(S0);
    // (la partita la teneva questo telefono, poi è sparito e l'ha presa un amico: «Rientra ▶» col mio posto di prima. Ripasso S7)
    var exHost = !D && gs.fase === "gioco" && eroHostDi(gs.gioco, gs.stanza);
    var modo = D && mio !== D.a && mio !== D.b ? "duello" : (tipo === "rientra" || exHost ? "rientra" : modoInCorso(S0, gs));
    var g = giocoDa(gs.gioco), nome = g ? g.nome : "un gioco";
    // la prima riga: il gioco (o chi gioca la sfida) e, a partita in corso, a che punto è
    var punto = gs.fase === "gioco" && gs.punto ? " · " + gs.punto : "", testa;
    if (modo === "duello") testa = "⚔️ " + D.na + " e " + D.nb + " giocano " + aGioco(nome);
    else if (modo === "rientra") testa = "🎮 Stanno giocando " + aGioco(nome) + punto;
    else if (modo === "due" && S0.sc && S0.sc.stanza === gs.stanza && S0.sc.ids.length === 2) {
      var nm = S0.sc.ids.map(function (id) { var x = (S0.membri || []).filter(function (m) { return m.id === id; })[0]; return x ? x.nome : "?"; });
      testa = "⚔️ " + nm[0] + " e " + nm[1] + " giocano " + aGioco(nome) + punto;
    } else testa = "🎮 Si gioca " + aGioco(nome) + punto;
    var quando = g && g.ritardatari === "mano" ? "dalla prossima mano" : g && g.ritardatari === "subito" ? "subito" : "dal prossimo turno";
    var sotto = modo === "guarda" ? "entri alla prossima partita" : (modo === "due" ? (S0.resta ? "" : "giocano in due: tu guardi")   /* (con «Chi vince resta» lo dice già la riga della coda: a 360x640 la Sala scorreva) */
      : (modo === "scelti" ? "gioca chi ha scelto " + (S0.nomeHost || "l'host") : ""));
    var k = gs.stanza + "|" + modo;
    var B = S0._inCorso;
    if (B && B.k === k) {   // (lo stesso riquadro: cambiano solo le scritte)
      if (B.b.textContent !== testa) B.b.textContent = testa;
      if (B.sm && B.sm.textContent !== sotto) B.sm.textContent = sotto;
      return B.nodo;
    }
    function entra(rientro) {
      var S = salaG; if (!S || !S.giocoSala) return;
      if (rientro) try { S.rete.invia({ t: "rientro", stanza: S.giocoSala.stanza }); } catch (e) {}   // (la Sala mi aspetta di nuovo)
      S.uscitoDa = null; S.inGioco = S.giocoSala.stanza; S.podio = false;
      salaLanciaOspite(S.giocoSala.gioco, S.giocoSala.stanza);
    }
    // 👀 senza entrare: niente join (il duello lo smista salaLanciaOspite). Un gioco che non dice ancora i suoi ritardatari
    // (non è passato dal Passo 6) non sa disegnare chi guarda senza join: lì si entra come prima e il gioco fa guardare lui
    function guarda() {
      var S = salaG; if (!S || !S.giocoSala) return;
      S.inGioco = S.giocoSala.stanza; S.podio = false;
      var gg = giocoDa(S.giocoSala.gioco);
      salaLanciaOspite(S.giocoSala.gioco, S.giocoSala.stanza, gg && gg.ritardatari ? { guarda: true } : null);
    }
    var b = el("b", { text: testa }), sm = sotto ? el("small", { text: sotto }) : null, nodo;
    var testo = el("span", { class: "sl-inc-testo" }, [ b, sm ]);
    if (modo === "rientra") nodo = el("div", { class: "sl-incorso" }, [ testo,
      el("button", { class: "btn btn-primario btn-piccolo", text: "Rientra ▶", onclick: function () { entra(true); } }) ]);
    else if (modo === "entra") nodo = el("div", { class: "sl-incorso prossima due-tasti" }, [ testo,
      el("div", { class: "sl-inc-tasti" }, [
        el("button", { class: "btn btn-primario btn-piccolo sl-inc-entra", text: "▶ Entra · giochi " + quando, onclick: function () { entra(false); } }),
        el("button", { class: "btn btn-fantasma btn-piccolo", text: "👀 Guarda", onclick: guarda }) ]) ]);
    else nodo = el("div", { class: "sl-incorso prossima" + (modo === "duello" ? " sl-duello" : "") }, [ testo,
      el("button", { class: "btn btn-fantasma btn-piccolo", text: modo === "duello" || modo === "due" ? "👀 Guarda la sfida" : "👀 Guarda", onclick: guarda }) ]);
    S0._inCorso = { k: k, nodo: nodo, b: b, sm: sm };
    return nodo;
  }
  // questa partita la tenevo io (la memoria della ripresa lo dice): il mio id in quella stanza, o null
  function eroHostDi(gid, code) {
    var rp = cuore.ripresaDi ? cuore.ripresaDi(gid, code) : null;
    return rp && rp.io && Date.now() - (+rp.t || 0) < 20 * 60000 ? rp.io : null;
  }
  // il mio id nella Sala (subito, anche prima che il collegamento dica "aperto")
  function mioIdSala(S) { return (S && (S.myId || (S.rete && S.rete.mioId))) || null; }

  // o (facoltativo) = { guarda: true }: "👀 Guarda" del riquadro della Sala, si guarda senza entrare (vedi guardaInSala)
  function salaLanciaOspite(gid, code, o) {
    SGNet.chiudiGiochi();   // il collegamento del gioco di prima (se c'è) si chiude: niente errori a sorpresa
    var g = giocoDa(gid);
    if (!g) { disegnaSalaOspite(); return; }
    // si torna nella Sala (anche se intanto la Sala è passata a me: vedi tornaInSala)
    var codiceSala = salaG ? salaG.codice : null;
    function torna(finita) { tornaInSala(codiceSala, code, finita); }
    if (salaG) { salaG.guardoIn = null; salaG.guardoFine = null; }
    // il duello (gioco a due senza l'host della Sala): il primo apre la stanza, il secondo entra come sempre, gli altri guardano
    var D = salaG && salaG.duello && salaG.duello.stanza === code ? salaG.duello : null, mio = mioIdSala(salaG);
    if (D && mio === D.a) return giocaDuello(g, D, torna);
    if (D && mio !== D.b) return guardaDuello(g, D, torna);
    // la partita la tenevo io e ora la tiene un amico: rientro col mio id di quella stanza, così ritrovo posto, punti e segreti
    // (S7 del ripasso: prima rientravo con l'id nuovo della Sala ed ero uno appena arrivato)
    var exHost = !D && eroHostDi(gid, code);
    if (o && o.guarda && salaG && !exHost) return guardaInSala(g, code, codiceSala, mio);
    cuore.linkParams = { gioco: gid, stanza: code };   // il gioco lo legge subito (t.linkParams)
    if (exHost) SGNet.ricordaId(code, exHost);
    else if (mio) SGNet.ricordaId(code, mio);   // nel gioco lo stesso id che ho nella Sala
    // (se intanto la Sala è passata a me e questa partita è rimasta, p3-c: i punti li conto io, una volta per partita)
    var contati = {};
    function contaSeHost(g2, cl) {
      if (!sala || sala.codice !== codiceSala || sala.stanza !== code || sala.duello || !g2 || !cl || !cl.length) return;   // (il duello lo conta chi l'ha aperto)
      var k = JSON.stringify(cl.map(function (r) { return [r.nome, r.pos]; }));
      if (contati[k]) return;
      contati[k] = 1; salaRisultato(g2, cl);
    }
    var ctx = {
      stanza: code,   // (la stanza del gioco: il subentro guarda se è la partita che resta)
      esci: function () { torna(false); },
      risultato: function (g2, classifica) { contaSeHost(g2, classifica); },
      // il gioco ha finito con t.fine: prima la classifica con "👍 Ci sto!" e "🏠 Torna in Sala", poi si segue la Sala
      // (senza classifica, es. fatto uscire dall'host: dritto nella Sala)
      fine: function (g2, classifica) {
        contaSeHost(g2, classifica);
        var P = cuore.partitaCorrente && cuore.partitaCorrente.viva() && cuore.partitaCorrente.salaCtx === ctx ? cuore.partitaCorrente : null;
        if (!P || !g2 || !classifica || !classifica.length) return torna(true);
        fineSalaAmico(g2, classifica, P, ctx, false, torna);
      },
      // il gioco ha chiuso la sua stanza (partita finita): niente "Collegamento perso", si torna nella Sala
      chiusa: function () { torna(true); pillola("sala", "🏁 Partita finita: si torna in Sala", "verde", 2600); }
    };
    avviaPartita(g, [], {}, null, ctx);
  }
  // "👀 Guarda" nella Sala: la partita in corso senza entrare (niente join: la targhetta "👀 Guardi", nessuna mossa). Uscendo
  // si torna nella Sala SENZA "esco" (non ero un giocatore: la Sala non mi conta tra chi è uscito) e il riquadro torna com'era.
  // Quando la partita torna in saletta entro da solo (lo fa la Sala: guardoEntra), tranne nei giochi a due
  function guardaInSala(g, code, codiceSala, mio) {
    var S = salaG;
    S.guardoIn = code; S.guardoFine = null;
    function torna() {
      lasciaPartita(); SGNet.chiudiGiochi(); cuore.togliGuardo();
      if (salaG && salaG.codice === codiceSala) {
        salaG.inGioco = null; salaG.dFine = null; salaG.guardoIn = null; salaG.guardoFine = null;
        return disegnaSalaOspite();
      }
      tornaInSala(codiceSala, code, true);   // (intanto la Sala è passata a me)
    }
    var ctx = {
      stanza: code, guardaSala: true,
      // (✕ "Smetti di guardare": in "Chi vince resta" questa sfida non mi riporta dentro da sola, la prossima sì)
      esci: function () { if (salaG === S) S.restaVia = code; torna(); }, risultato: function () {},
      // la classifica (se il gioco la dà anche a chi guarda): "🏠 Torna in Sala"; alla rivincita la Sala mi riporta dentro
      fine: function (g2, cl) {
        var P = cuore.partitaCorrente && cuore.partitaCorrente.viva() && cuore.partitaCorrente.salaCtx === ctx ? cuore.partitaCorrente : null;
        if (!P || !g2 || !cl || !cl.length) return torna();
        if (salaG === S) S.guardoFine = code;
        fineSalaAmico(g2, cl, P, ctx, false, function () { torna(); });
      },
      chiusa: function () { torna(); pillola("sala", "🏁 Partita finita: si torna in Sala", "verde", 2600); }
    };
    cuore.linkParams = { gioco: g.id, stanza: code, guarda: 1 };
    if (mio) SGNet.ricordaId(code, mio);   // (lo stesso id della Sala: quando entro a giocare l'host mi toglie dal pubblico)
    avviaPartita(g, [], {}, null, ctx);
    cuore.restaTarga();   // ("👀 Guardi · in coda: sei 2°")
  }
  // chi guardava una partita della Sala e la partita torna in saletta (Rivincita, Nuova partita): entra anche lui, da solo.
  // Nei giochi a due no: si continua a guardare (dalla classifica si torna a guardare la partita nuova)
  function guardoEntra(S, m, fase) {
    if (S.guardoIn !== m.stanza) return false;
    var g = giocoDa(m.gioco); if (!g) return false;
    if (aDue(g)) {
      if (S.guardoFine === m.stanza && fase !== "fine") { S.guardoFine = null; salaLanciaOspite(m.gioco, m.stanza, { guarda: true }); return true; }
      return false;
    }
    if (fase !== "lobby") return false;
    pillola("guardo", "✋ Si ricomincia: entri anche tu!", "verde", 2500);
    cuore.togliGuardo(); lasciaPartita();
    S.finitoDa = null; S.uscitoDa = null; S.inGioco = m.stanza; S.podio = false;
    salaLanciaOspite(m.gioco, m.stanza);
    return true;
  }
  // la classifica di fine partita sul telefono di un amico della Sala (host = ha aperto lui la stanza: il duello)
  function fineSalaAmico(g2, classifica, P, ctx, host, torna) {
    var s = schermata({ icona: "🏆", titolo: "Fine partita", sotto: g2.nome });
    var fac = null; try { fac = P.tavolo.faccine(); } catch (e) {}
    var ol = el("ol", { class: "classifica" + (classificaFitta(classifica.length, fac ? 56 : 0) ? " fitta" : "") }), med = medaglieAPari(classifica.map(function (r, i) { return r.pos || i + 1; }));
    classifica.forEach(function (r, i) {
      ol.appendChild(el("li", { class: (r.pos || i + 1) === 1 ? "vincitore" : "" }, [ el("span", { class: "pos", text: med[i] }), el("span", { class: "nome", text: r.nome }),
        r.punti != null ? el("span", { class: "punti", text: typeof r.punti === "number" && r.punti % 1 === 0 ? cifre(r.punti) : r.punti }) : null ]));
    });
    s._contenuto.appendChild(ol);
    if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }
    if (!cuore.tastiFineCore(s._piede, { host: host, esci: function () { if (host) ctx.esci(); else torna(false); } }, { P: P, ctx: ctx }))
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna in Sala", onclick: function () { if (host) ctx.esci(); else torna(true); } }));
    mostra(s);
  }
  // il duello sul telefono di chi l'apre (a): la stanza col codice scelto dalla Sala, si siedono solo i due.
  // Dice alla Sala com'è finita ogni partita (salaEsito: l'host la conta) e a che punto è (duelloFase: chi guarda la
  // classifica torna a guardare da solo quando si rigioca). "🏠 Torna in Sala" chiude il duello per tutti
  function giocaDuello(g, D, torna) {
    var S = salaG, code = D.stanza, detti = {}, CS = S ? S.codice : null;
    // (se intanto la Sala è passata a me, p3-c, l'esito e la fase li prende la mia Sala: io sono "host")
    function allaSala(m) {
      if (salaG === S && S.rete) { try { S.rete.invia(m); } catch (e) {} return; }
      if (sala && sala.codice === CS && sala.duello && sala.duello.stanza === code) cuore.msgDuello("host", m);
    }
    function esito(cl) {
      var P = cuore.partitaCorrente, SV = P && P.viva() && P.salaCtx === ctx ? cuore.svPartita(P, true) : null, giro = SV ? (SV.giro || 0) : 0;
      if (!cl || !cl.length || detti[giro]) return;
      detti[giro] = 1;
      allaSala({ t: "salaEsito", stanza: code, giro: giro, cl: cl.map(function (r) { var x = { nome: r.nome, pos: r.pos || 1 }; if (r.punti != null) x.punti = r.punti; if (r.bot) x.bot = true; return x; }) });
    }
    var ctx = {
      duello: code, gioca: true,   // (gioca: sono uno dei due, non guardo)
      esci: function () { SGNet.chiudiGiochi(1500); torna(false); },   // (la stanza si chiude un attimo dopo: prima la Sala porta via tutti)
      risultato: function (g2, cl) { esito(cl); },
      fine: function (g2, cl) {
        esito(cl);
        var P = cuore.partitaCorrente && cuore.partitaCorrente.viva() && cuore.partitaCorrente.salaCtx === ctx ? cuore.partitaCorrente : null;
        if (!P || !g2 || !cl || !cl.length) return ctx.esci();
        fineSalaAmico(g2, cl, P, ctx, true, torna);
      },
      suStanza: function (SV) {
        SV.suFase.push(function (f) { allaSala({ t: "duelloFase", stanza: code, fase: f }); });
        if (SV.fase) allaSala({ t: "duelloFase", stanza: code, fase: SV.fase });
      }
    };
    cuore.linkParams = {}; SGNet._forza = code;
    // ("👑 Chi vince resta": appena arriva l'avversario parte il 3-2-1 da solo, come la Rivincita)
    if (S && S.resta && S.resta.sfida && S.resta.sfida.stanza === code) { var nmR = {}; nmR[D.b] = D.nb; cuore.RIV = { codice: code, attesi: [D.b], nomi: nmR, quando: Date.now() + 10000, auto: true, pronti: {}, daSala: true, U: null }; cuore.SL.ultimo = null; }
    avviaPartita(g, [S.nome], Object.assign({}, D.imp || {}, { modo: "online", scelti: [{ id: "host", nome: S.nome }, { id: D.b, nome: D.nb }] }), null, ctx);
  }
  // chi guarda il duello (né a né b): in diretta, senza toccare, con "👥 Sala" in alto per tornare nella Sala.
  // Quando la Sala dice com'è finita: la classifica con "🏠 Torna in Sala"; se i due rigiocano, si torna a guardare da soli
  function guardaDuello(g, D, torna) {
    var S = salaG;
    S.dVista = D.fine ? D.fine.n : 0;   // (le partite finite prima che arrivassi non le mostro)
    S.dFine = null;
    var ctx = {
      duello: D.stanza,
      esci: function () { torna(false); }, fine: function () { torna(false); }, risultato: function () {},
      angolo: function (s) { cuore.tastoSala(s, function () { torna(false); }); }
    };
    cuore.linkParams = { gioco: g.id, stanza: D.stanza, guarda: 1 };
    avviaPartita(g, [], {}, null, ctx);
    cuore.restaTarga();   // ("👀 Guardi · in coda: sei 2°")
  }
  // un messaggio della Sala mentre guardo il duello (anche dalla classifica): la fine, la rivincita
  function seguiDuello(S, D, prima, fase) {
    var mio = mioIdSala(S); if (mio === D.a || mio === D.b) return;
    var P = cuore.partitaCorrente, guardo = !!(P && P.viva() && P.salaCtx && P.salaCtx.duello === D.stanza);
    if (D.fine && D.fine.n > (S.dVista || 0)) {
      S.dVista = D.fine.n;
      if (guardo) setTimeout(function () { if (cuore.partitaCorrente === P && P.viva() && salaG === S && S.duello && S.duello.stanza === D.stanza) fineDuelloOspite(S, S.duello); }, 1600);
      return;
    }
    // i due rigiocano: dalla classifica si torna a guardare
    if (S.dFine === D.stanza && prima === "fine" && fase !== "fine") { S.dFine = null; salaLanciaOspite(D.gioco, D.stanza); }
  }
  function fineDuelloOspite(S, D) {
    var g = giocoDa(D.gioco); if (!g || !D.fine) return;
    var R = cuore.restaFineDi(D.stanza);
    if (R && document.querySelector(".fine-resta")) return;   // ("👑 Chi vince resta": la fine della sfida c'è già)
    lasciaPartita(); SGNet.chiudiGiochi();
    S.dFine = D.stanza;
    var s = schermata({ icona: "🏆", titolo: "Fine partita", sotto: g.nome + " · " + D.na + " contro " + D.nb });
    s._contenuto.appendChild(cuore.classificaDuello(D.fine.cl));
    if (R) { cuore.bloccoResta(s._piede, D.stanza, false, null); return mostra(s); }
    s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: "Se rigiocano, la guardi da qui. Se no " + (S.nomeHost || "l'host") + " sceglie la prossima sfida." }));
    var box = el("div", { class: "fine-tasti" });
    rigaPuntiFine(box, { codice: D.stanza, giroH: D.fine.giro || 0 }, false, false);   // (la Classifica della serata: "🏆 Serata: Giulia 1° · Luca 2°")
    box.appendChild(el("button", { class: "btn btn-primario ft-primo", type: "button", text: "🏠 Torna in Sala", onclick: function () {
      if (salaG !== S) return schermataHome();
      S.dFine = null; S.inGioco = null; S.uscitoDa = D.stanza; disegnaSalaOspite();
    } }));
    s._piede.appendChild(box);
    mostra(s);
  }


  // ---- al cuore: quello di questo pezzo che usano il cuore e gli altri pezzi ----
  cuore.aDue = aDue; cuore.aGioco = aGioco; cuore.apriCompagnia = apriCompagnia; cuore.attesiSala = attesiSala; cuore.capoDi = capoDi;
  cuore.chiudiSala = chiudiSala; cuore.chiudiSalaOspite = chiudiSalaOspite; cuore.codiceComp = codiceComp; cuore.compDi = compDi;
  cuore.compVuota = compVuota; cuore.creaSala = creaSala; cuore.disegnaSalaHost = disegnaSalaHost; cuore.disegnaSalaOspite = disegnaSalaOspite;
  cuore.etichettaPosti = etichettaPosti; cuore.fineSalaAmico = fineSalaAmico; cuore.foglioSala = foglioSala;
  cuore.giocaInCompagnia = giocaInCompagnia; cuore.hostSceglie = hostSceglie; cuore.infoSalaMia = infoSalaMia; cuore.linkSala = linkSala;
  cuore.membroSala = membroSala; cuore.mioIdSala = mioIdSala; cuore.postiDi = postiDi; cuore.restaOpz = restaOpz;
  cuore.riapriSalaIeri = riapriSalaIeri; cuore.rigaCompSala = rigaCompSala; cuore.rigaPuntiFine = rigaPuntiFine; cuore.rigaPuntiOra = rigaPuntiOra;
  cuore.rinfrescaAttesi = rinfrescaAttesi; cuore.salaAddormentata = salaAddormentata; cuore.salaCambiaGioco = salaCambiaGioco;
  cuore.salaDiQui = salaDiQui; cuore.salaLancia = salaLancia; cuore.salaOspite = salaOspite; cuore.salaParti = salaParti;
  cuore.salaPreparaGioco = salaPreparaGioco; cuore.salaRisultato = salaRisultato; cuore.salaScegliGioco = salaScegliGioco;
  cuore.salaSegueGioco = salaSegueGioco; cuore.salaSempre = salaSempre; cuore.schermataAspettaComp = schermataAspettaComp;
  Object.defineProperty(cuore, "RIGA_PT", { get: function () { return RIGA_PT; }, configurable: true });
  Object.defineProperty(cuore, "SALA_DORME", { get: function () { return SALA_DORME; }, configurable: true });
  Object.defineProperty(cuore, "VICE_PAUSA", { get: function () { return VICE_PAUSA; }, configurable: true });
  Object.defineProperty(cuore, "sala", { get: function () { return sala; }, configurable: true });
  Object.defineProperty(cuore, "salaG", { get: function () { return salaG; }, set: function (v) { salaG = v; }, configurable: true });
})();
