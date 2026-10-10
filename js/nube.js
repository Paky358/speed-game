/* =========================================================
   NUBE — profili e dati in cloud con Firebase.
   Login con NOME + PASSWORD (l'email vera e' finta: nome@sg.local,
   cosi' l'utente inserisce solo nome e password).
   Salva i dati di ogni giocatore (es. le Speed Coins, che al Casinò sono le fiches)
   in modo che si portino avanti tra una partita e l'altra.
   La apiKey qui e' pubblica per progetto: la sicurezza sta nelle
   regole del database (impostate nella console Firebase).
   ========================================================= */
(function () {
  "use strict";
  var CONFIG = {
    apiKey: "AIzaSyCxCbBMyn8Y_Xjfl2raDwGw-YmfgVeZj4g",
    authDomain: "speed-game-33c5b.firebaseapp.com",
    projectId: "speed-game-33c5b",
    storageBucket: "speed-game-33c5b.firebasestorage.app",
    messagingSenderId: "768605679598",
    appId: "1:768605679598:web:11ea341e4f41327755e8ff"
  };
  // UNA MONETA SOLA (dal 4 ott 2026): le fiches del Casinò sono le Speed Coins del profilo (campo "coins").
  // Si parte con 1.000 monete; ogni giorno si gira la ruota del giorno (monete o XP, torna a mezzanotte).
  var MONETE_START = 1000;
  var BONUS = 1000;   // il vecchio regalo fisso (resta per ritiraBonus; ora si usa la ruota qui sotto)
  // la ruota del giorno: spicchi in ordine (monete e XP alternati), ognuno esce 1 volta su 12
  var RUOTA = [
    { monete: 5000, top: true }, { xp: 250 }, { monete: 1000 }, { xp: 500 }, { monete: 500 }, { xp: 1000 },
    { monete: 2000 }, { xp: 250 }, { monete: 1000 }, { xp: 2000, top: true }, { monete: 1500 }, { xp: 500 }
  ];
  function giornoDi(ms) { var d = new Date(ms); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function regaloPronto() { return !!(profilo && (!profilo.bonusUltimo || giornoDi(profilo.bonusUltimo) !== giornoDi(Date.now()))); }
  function finoAMezzanotte() { var d = new Date(); d.setHours(24, 0, 0, 0); return Math.max(0, d.getTime() - Date.now()); }
  var auth = null, db = null, pronto = false, utente = null, profilo = null, ascolta = [], ultimaScheda = null;
  // il saldo che il gioco del Casinò in corso "conosce" (letto all'inizio o salvato l'ultima volta):
  // i giochi salvano il loro saldo e qui si aggiunge solo la differenza, così le monete prese
  // intanto (livelli, bonus) non si cancellano mai
  var visto = null;

  function notifica() { ascolta.forEach(function (cb) { try { cb(profilo); } catch (e) {} }); }
  function getNested(o, path) { var p = path.split("."); for (var i = 0; i < p.length; i++) { if (o == null) return undefined; o = o[p[i]]; } return o; }
  function setNested(o, path, v) { var p = path.split("."); for (var i = 0; i < p.length - 1; i++) { if (o[p[i]] == null) o[p[i]] = {}; o = o[p[i]]; } o[p[p.length - 1]] = v; }
  // dal nome utente ricava un'email interna stabile (non mostrata a nessuno)
  function emailDa(nome) {
    var n = String(nome || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return (n || "amico") + "@sg.local";
  }
  function messaggioErrore(e) {
    var c = e && e.code || "";
    if (c === "auth/email-already-in-use") return "Esiste gia' un profilo con questo nome.";
    if (c === "auth/invalid-credential" || c === "auth/wrong-password" || c === "auth/user-not-found") return "Nome o password sbagliati.";
    if (c === "auth/weak-password") return "La password deve avere almeno 6 caratteri.";
    if (c === "auth/network-request-failed") return "Nessuna connessione: riprova.";
    return "Qualcosa e' andato storto, riprova.";
  }

  function init() {
    if (typeof firebase === "undefined" || !firebase.initializeApp) return;   // SDK non caricato
    try {
      firebase.initializeApp(CONFIG);
      auth = firebase.auth();
      db = firebase.firestore();
      // la sessione resta salvata: riaprendo l'app si e' gia' loggati
      auth.onAuthStateChanged(function (u) {
        utente = u || null; ultimaScheda = null;
        if (u) caricaProfilo(u.uid);
        else { profilo = null; pronto = true; notifica(); }
      });
    } catch (e) { auth = null; pronto = true; }
  }
  function caricaProfilo(uid) {
    db.collection("profili").doc(uid).get().then(function (doc) {
      profilo = doc.exists ? doc.data() : null;
      unisciMonete();
      pronto = true; notifica();
    }).catch(function () { pronto = true; notifica(); });
  }
  // una volta per profilo: le fiches del Black Jack si sommano alle Speed Coins
  // e chi in tutto ha meno di 1.000 monete sale a 1.000
  function unisciMonete() {
    if (!profilo || profilo.moneteUnite || !utente) return;
    var f = (profilo.fiches && profilo.fiches.blackjack) || 0;
    var tot = Math.max(MONETE_START, (profilo.coins || 0) + f);
    profilo.coins = tot; profilo.moneteUnite = true;
    if (profilo.fiches) delete profilo.fiches.blackjack;
    var patch = { coins: tot, moneteUnite: true };
    patch["fiches.blackjack"] = firebase.firestore.FieldValue.delete();
    db.collection("profili").doc(utente.uid).update(patch).catch(function () {});
  }
  function monete() { return (profilo && profilo.coins) || 0; }
  function progressione() {
    var p = profilo || {};
    return { level: p.level || 1, xp: p.xp || 0, coins: p.coins || 0, prestige: p.prestige || 0, xpTot: p.xpTot || 0, xpGiorno: p.xpGiorno || "" };
  }
  // aggiunge (o toglie) monete: in cloud con "increment", così non si perde niente
  function cambiaMonete(delta) {
    delta = Math.round(delta || 0);
    if (!auth || !utente || !profilo || !delta) return Promise.resolve(monete());
    profilo.coins = monete() + delta;
    notifica();
    return db.collection("profili").doc(utente.uid).update({ coins: firebase.firestore.FieldValue.increment(delta) })
      .catch(function () {}).then(function () { return monete(); });
  }

  window.SGNube = {
    disponibile: function () { return !!auth; },
    pronto: function () { return pronto; },
    utente: function () { return utente; },
    profilo: function () { return profilo; },
    moneteStart: MONETE_START,
    messaggioErrore: messaggioErrore,
    // chiamato quando lo stato e' pronto e ad ogni cambio (login/logout/dati)
    onCambio: function (cb) { ascolta.push(cb); if (pronto) cb(profilo); },

    crea: function (nome, pwd, emoji) {
      if (!auth) return Promise.reject(new Error("offline"));
      return auth.createUserWithEmailAndPassword(emailDa(nome), pwd).then(function (cred) {
        var p = {
          uid: cred.user.uid, nome: String(nome).trim().slice(0, 20), emoji: emoji || "🙂",
          stat: {}, creato: Date.now(),
          level: 1, xp: 0, coins: MONETE_START, prestige: 0,   // livello, XP, Speed Coins e Prestigio (regole in livelli.js)
          moneteUnite: true   // una moneta sola: niente fiches a parte
        };
        return db.collection("profili").doc(cred.user.uid).set(p).then(function () { profilo = p; notifica(); return p; });
      });
    },
    accedi: function (nome, pwd) {
      if (!auth) return Promise.reject(new Error("offline"));
      return auth.signInWithEmailAndPassword(emailDa(nome), pwd);
    },
    esci: function () { return auth ? auth.signOut() : Promise.resolve(); },

    // ---- il portafoglio: Speed Coins (al Casinò si vedono come fiches) ----
    monete: monete,                 // solo da leggere/mostrare
    cambiaMonete: cambiaMonete,     // + o − (premi, negozio…)
    // i giochi del Casinò: fiches() all'inizio della partita (il saldo da cui partono),
    // salvaFiches(gioco, n) col loro saldo nuovo: si salva solo la differenza
    fiches: function (gioco) {
      if (!profilo) return null;
      visto = monete(); return visto;
    },
    salvaFiches: function (gioco, n) {
      if (!auth || !utente || !profilo || n == null) return Promise.resolve();
      var d = n - (visto == null ? monete() : visto); visto = n;
      return cambiaMonete(d);
    },

    // ---- omino personalizzato (stile Mii) ----
    // omini = i due avatar della persona, n = quale usa nei giochi (omino = quello in uso)
    salvaOmino: function (cfg, omini, n) {
      if (!auth || !utente || !profilo) return Promise.resolve();
      var patch = { omino: cfg };
      if (omini) { patch.omini = omini; patch.ominoN = n || 0; }
      for (var k in patch) profilo[k] = patch[k];
      notifica();
      var doc = db.collection("profili").doc(utente.uid);
      // in due passi: l'avatar in uso si salva comunque anche se il secondo pezzo non passasse
      return doc.update({ omino: cfg }).then(function () { if (omini) return doc.update({ omini: omini, ominoN: n || 0 }); }).catch(function () {});
    },

    // ---- livello, XP, Speed Coins e Prestigio (i profili di prima partono da livello 1 e 0 XP) ----
    progressione: progressione,
    // aggiunge gli XP al profilo e salva tutto in un colpo; ritorna { stato, eventi } (livelli saliti, prestigio)
    aggiungiXp: function (punti, giorno) {
      if (!auth || !utente || !profilo || !window.SGLivelli || !(punti > 0)) return null;
      var r = window.SGLivelli.aggiungi(progressione(), punti), s = r.stato, n = Math.round(punti);
      var piuMonete = s.coins - monete();   // i premi dei livelli: aggiunti, mai riscritti (il Casinò può averle cambiate intanto)
      var patch = { level: s.level, xp: s.xp, prestige: s.prestige, xpTot: firebase.firestore.FieldValue.increment(n) };
      if (piuMonete) patch.coins = firebase.firestore.FieldValue.increment(piuMonete);
      if (giorno) patch.xpGiorno = giorno;
      profilo.level = s.level; profilo.xp = s.xp; profilo.coins = s.coins; profilo.prestige = s.prestige;
      profilo.xpTot = (profilo.xpTot || 0) + n; if (giorno) profilo.xpGiorno = giorno;
      db.collection("profili").doc(utente.uid).update(patch).catch(function () {});
      notifica();
      return r;
    },

    // i premi dei trofei: XP e monete in un colpo, e il segno "già premiato" (premiTrofei.<chiave>) per non darli due volte
    premiaTrofei: function (chiavi, punti, piuMonete) {
      if (!auth || !utente || !profilo || !window.SGLivelli || !chiavi || !chiavi.length) return null;
      var FV = firebase.firestore.FieldValue, n = Math.round(punti || 0);
      var r = window.SGLivelli.aggiungi(progressione(), n), s = r.stato;
      var delta = (s.coins - monete()) + Math.round(piuMonete || 0);   // i premi dei livelli + le monete dei trofei
      var patch = { level: s.level, xp: s.xp, prestige: s.prestige };
      if (n) patch.xpTot = FV.increment(n);
      if (delta) patch.coins = FV.increment(delta);
      profilo.premiTrofei = profilo.premiTrofei || {};
      chiavi.forEach(function (k) { patch["premiTrofei." + k] = true; profilo.premiTrofei[k] = true; });
      profilo.coins = monete() + delta; profilo.level = s.level; profilo.xp = s.xp; profilo.prestige = s.prestige; profilo.xpTot = (profilo.xpTot || 0) + n;
      db.collection("profili").doc(utente.uid).update(patch).catch(function () {});
      notifica();
      return r;
    },

    // ---- liste personali (es. le parole di Parola d'ordine): un campo del profilo, salvato così com'è ----
    lista: function (nome) { return (profilo && profilo.liste && profilo.liste[nome]) || []; },
    // ---- le statistiche di ogni gioco (le scrive core.js a fine partita, per tutti i giochi):
    //      giocato.<gioco> = { p: partite, v: vinte, s: perse, t: secondi giocati, serie, serieMax, u: l'ultima volta }
    //      esito: "vinta", "persa" oppure null (partita sullo stesso telefono senza il tuo nome in classifica) ----
    giocato: function () { return (profilo && profilo.giocato) || {}; },
    contaPartita: function (gioco, esito, secondi) {
      if (!auth || !utente || !profilo || !gioco) return;
      var FV = firebase.firestore.FieldValue, b = "giocato." + gioco + ".", patch = {}, sec = Math.max(0, Math.min(7200, Math.round(secondi || 0)));
      function piu(k, n) { if (!n) return; patch[b + k] = FV.increment(n); setNested(profilo, b + k, (getNested(profilo, b + k) || 0) + n); }
      function metti(k, v) { patch[b + k] = v; setNested(profilo, b + k, v); }
      piu("p", 1); piu("t", sec);
      if (esito === "vinta") { piu("v", 1); var serie = (getNested(profilo, b + "serie") || 0) + 1; metti("serie", serie); if (serie > (getNested(profilo, b + "serieMax") || 0)) metti("serieMax", serie); }
      if (esito === "persa") { piu("s", 1); metti("serie", 0); }
      metti("u", Date.now());
      db.collection("profili").doc(utente.uid).update(patch).catch(function () {});
    },
    // ---- la casa da arredare (js/casa.js): sta tutta in un campo del profilo, così non si perde cambiando telefono ----
    casa: function () { return (profilo && profilo.casa) || null; },
    salvaCasa: function (dati) {
      if (!auth || !utente || !profilo || !dati) return Promise.resolve();
      profilo.casa = dati;
      return db.collection("profili").doc(utente.uid).update({ casa: dati }).catch(function () {});
    },
    salvaLista: function (nome, lista) {
      if (!auth || !utente || !profilo) return Promise.resolve();
      profilo.liste = profilo.liste || {}; profilo.liste[nome] = lista;
      var patch = {}; patch["liste." + nome] = lista;
      return db.collection("profili").doc(utente.uid).update(patch).catch(function () {});
    },

    // ---- il regalo del giorno: 1.000 monete, una volta al giorno (torna a mezzanotte) ----
    bonusImporto: BONUS,
    puoRitirareBonus: regaloPronto,
    prossimoBonusMs: function () { return regaloPronto() ? 0 : finoAMezzanotte(); },
    ritiraBonus: function () {
      if (!auth || !utente || !profilo) return Promise.reject(new Error("offline"));
      if (!regaloPronto()) return Promise.reject(new Error("presto"));
      // in monete; se un gioco del Casinò è aperto, aggiunge anche lui il regalo al suo saldo
      var nuovo = monete() + BONUS;
      profilo.coins = nuovo; profilo.bonusUltimo = Date.now();
      if (visto != null) visto += BONUS;
      var patch = { bonusUltimo: profilo.bonusUltimo, coins: firebase.firestore.FieldValue.increment(BONUS) };
      // conta i bonus ritirati (serve per i trofei) e aggiorna il record fiches
      patch["stat.blackjack.bonusRitirati"] = firebase.firestore.FieldValue.increment(1);
      setNested(profilo, "stat.blackjack.bonusRitirati", (getNested(profilo, "stat.blackjack.bonusRitirati") || 0) + 1);
      if (nuovo > (getNested(profilo, "stat.blackjack.recordFiches") || 0)) { patch["stat.blackjack.recordFiches"] = nuovo; setNested(profilo, "stat.blackjack.recordFiches", nuovo); }
      return db.collection("profili").doc(utente.uid).update(patch).then(function () { notifica(); return nuovo; });
    },
    // ---- la ruota del giorno (al posto del regalo fisso): un giro al giorno, torna a mezzanotte.
    //      12 spicchi uguali, ognuno esce 1 volta su 12: in media circa 900 monete e 375 XP al giorno ----
    ruota: RUOTA,
    // sceglie lo spicchio e lo salva SUBITO (prima che la ruota finisca di girare: chiudere l'app non fa rigirare)
    // ritorna { i, premio, coins, eventi } oppure null
    giraRuota: function () {
      if (!auth || !utente || !profilo || !regaloPronto()) return null;
      var FV = firebase.firestore.FieldValue, i = Math.floor(Math.random() * RUOTA.length), pr = RUOTA[i];
      var patch = { bonusUltimo: Date.now() }, eventi = [], delta = 0;
      if (pr.xp && window.SGLivelli) {
        var r = window.SGLivelli.aggiungi(progressione(), pr.xp), s = r.stato;
        delta = s.coins - monete(); eventi = r.eventi;   // i premi dei livelli saliti
        patch.level = s.level; patch.xp = s.xp; patch.prestige = s.prestige; patch.xpTot = FV.increment(pr.xp);
        profilo.level = s.level; profilo.xp = s.xp; profilo.prestige = s.prestige; profilo.xpTot = (profilo.xpTot || 0) + pr.xp;
      } else delta = pr.monete || 0;
      var nuovo = monete() + delta;
      profilo.coins = nuovo; profilo.bonusUltimo = patch.bonusUltimo;
      if (delta) { patch.coins = FV.increment(delta); if (visto != null) visto += delta; }   // un gioco del Casinò aperto lo aggiunge al suo saldo
      // conta i giri (servono ai trofei del regalo del giorno) e aggiorna il record di monete
      patch["stat.blackjack.bonusRitirati"] = FV.increment(1);
      setNested(profilo, "stat.blackjack.bonusRitirati", (getNested(profilo, "stat.blackjack.bonusRitirati") || 0) + 1);
      if (nuovo > (getNested(profilo, "stat.blackjack.recordFiches") || 0)) { patch["stat.blackjack.recordFiches"] = nuovo; setNested(profilo, "stat.blackjack.recordFiches", nuovo); }
      db.collection("profili").doc(utente.uid).update(patch).catch(function () {});
      // avvisa() quando la ruota si ferma: così i trofei che scattano non escono mentre gira
      return { i: i, premio: pr, coins: nuovo, eventi: eventi, avvisa: notifica };
    },
    // ---- amici e classifica trofei ----
    // Ognuno pubblica una "scheda" leggibile da tutti (nome, avatar, quanti trofei)
    // nella raccolta "pubblici"; i dati veri restano privati in "profili".
    // Gli amici sono una lista di uid nel proprio profilo (aggiunti col nome).
    chiaveNome: function (nome) { return emailDa(nome).replace("@sg.local", ""); },
    pubblica: function (dati) {
      if (!auth || !utente || !profilo) return Promise.resolve();
      var sch = { uid: utente.uid, nome: profilo.nome, chiave: SGNube.chiaveNome(profilo.nome), omino: profilo.omino || null, emoji: profilo.emoji || "🙂",
        livello: profilo.level || 1, prestigio: profilo.prestige || 0 };   // il livello lo vedono anche gli amici
      for (var k in dati) sch[k] = dati[k];
      var firma = JSON.stringify(sch);
      if (firma === ultimaScheda) return Promise.resolve();   // niente di nuovo: non riscrive
      ultimaScheda = firma;
      sch.agg = Date.now();
      return db.collection("pubblici").doc(utente.uid).set(sch).catch(function () { ultimaScheda = null; });
    },
    amici: function () { return (profilo && profilo.amici) || []; },
    // cerca un giocatore col nome esatto (maiuscole e spazi non contano)
    cercaNome: function (nome) {
      if (!auth || !utente) return Promise.reject(new Error("offline"));
      return db.collection("pubblici").where("chiave", "==", SGNube.chiaveNome(nome)).limit(1).get()
        .then(function (q) { return q.empty ? null : q.docs[0].data(); });
    },
    // aggiunge/toglie un uid dalla MIA lista amici (solo il mio profilo)
    mettiAmico: function (uid) {
      if (!auth || !utente || !profilo) return Promise.reject(new Error("offline"));
      var l = profilo.amici || []; if (l.indexOf(uid) < 0) l.push(uid);
      profilo.amici = l;
      return db.collection("profili").doc(utente.uid).update({ amici: firebase.firestore.FieldValue.arrayUnion(uid) });
    },
    levaAmico: function (uid) {
      if (!auth || !utente || !profilo) return Promise.reject(new Error("offline"));
      profilo.amici = (profilo.amici || []).filter(function (x) { return x !== uid; });
      return db.collection("profili").doc(utente.uid).update({ amici: firebase.firestore.FieldValue.arrayRemove(uid) });
    },
    // le schede pubbliche di una lista di uid (chi non si trova viene saltato)
    schede: function (uids) {
      if (!auth || !utente) return Promise.reject(new Error("offline"));
      return Promise.all((uids || []).map(function (u) {
        return db.collection("pubblici").doc(u).get().then(function (d) { return d.exists ? d.data() : null; });
      })).then(function (l) { return l.filter(Boolean); });
    },
    // classifica di TUTTI: chi ha più trofei (i primi n)
    classificaGenerale: function (n) {
      if (!auth || !utente) return Promise.reject(new Error("offline"));
      return db.collection("pubblici").orderBy("trofei", "desc").limit(n || 100).get()
        .then(function (q) { return q.docs.map(function (d) { return d.data(); }); });
    },

    // ---- richieste di amicizia ----
    // Raccolta "richieste", un doc per coppia (id = mittente_destinatario):
    //   stato "attesa"    -> il destinatario la vede e accetta o rifiuta (rifiuta = cancella)
    //   stato "accettata" -> il destinatario ha già messo il mittente tra gli amici;
    //                        il mittente, alla prossima lettura, fa lo stesso e la cancella
    //   stato "rimosso"   -> chi ha tolto l'amicizia avvisa l'altro, che lo toglie a sua volta
    // Nessuno scrive mai nel profilo di un altro: ognuno aggiorna solo il suo.
    richieste: function () {
      if (!auth || !utente || !profilo) return Promise.reject(new Error("offline"));
      var me = utente.uid, R = db.collection("richieste"), lavori = [];
      return Promise.all([R.where("a", "==", me).get(), R.where("da", "==", me).get()]).then(function (qq) {
        var arrivate = [], inviate = [];
        qq[0].docs.forEach(function (d) {
          var r = d.data(); r.id = d.id;
          if (r.stato === "attesa") arrivate.push(r);
          else if (r.stato === "rimosso") { lavori.push(SGNube.levaAmico(r.da)); lavori.push(d.ref.delete()); }
        });
        qq[1].docs.forEach(function (d) {
          var r = d.data(); r.id = d.id;
          if (r.stato === "attesa") inviate.push(r);
          else if (r.stato === "accettata") { lavori.push(SGNube.mettiAmico(r.a)); lavori.push(d.ref.delete()); }
        });
        return Promise.all(lavori.map(function (p) { return p.catch(function () {}); })).then(function () {
          return { arrivate: arrivate, inviate: inviate };
        });
      });
    },
    // manda la richiesta a una scheda pubblica (se lui l'aveva già chiesta a me, la accetta)
    chiediAmicizia: function (sch) {
      if (!auth || !utente || !profilo) return Promise.reject(new Error("offline"));
      var me = utente.uid, R = db.collection("richieste");
      return R.where("a", "==", me).where("da", "==", sch.uid).get().then(function (q) {
        var sua = q.docs.filter(function (d) { return d.data().stato === "attesa"; })[0];
        if (sua) { var r = sua.data(); r.id = sua.id; return SGNube.accetta(r).then(function () { return "amici"; }); }
        return R.doc(me + "_" + sch.uid).set({
          da: me, a: sch.uid, daNome: profilo.nome, aNome: sch.nome || "",
          daOmino: profilo.omino || null, daEmoji: profilo.emoji || "🙂", stato: "attesa", t: Date.now()
        }).then(function () { return "inviata"; });
      });
    },
    accetta: function (r) {
      return SGNube.mettiAmico(r.da).then(function () {
        return db.collection("richieste").doc(r.id).update({ stato: "accettata" });
      });
    },
    rifiuta: function (r) { return db.collection("richieste").doc(r.id).delete(); },
    annulla: function (r) { return db.collection("richieste").doc(r.id).delete(); },
    // toglie l'amicizia da tutte e due le parti
    togliAmico: function (uid) {
      if (!auth || !utente || !profilo) return Promise.reject(new Error("offline"));
      var me = utente.uid;
      return SGNube.levaAmico(uid).then(function () {
        return db.collection("richieste").doc(me + "_" + uid).set({ da: me, a: uid, stato: "rimosso", t: Date.now() });
      });
    },

    // legge le statistiche di un gioco, es. statGioco("blackjack")
    statGioco: function (gioco) { return (profilo && profilo.stat && profilo.stat[gioco]) || {}; },
    // salva in un colpo: saldo del Casinò (fiches = monete) + contatori (incrementi) + record (max) + valori da impostare
    //   incrs / recs / sets = liste di coppie [chiave, valore]
    //   (sets serve per cose che possono anche scendere, es. la serie di risposte giuste in corso)
    salvaProgressi: function (fichesN, gioco, incrs, recs, sets) {
      if (!auth || !utente || !profilo) return Promise.resolve();
      var FV = firebase.firestore.FieldValue, patch = {};
      if (fichesN != null) {   // come salvaFiches: solo la differenza dall'ultimo saldo visto
        var d = Math.round(fichesN - (visto == null ? monete() : visto)); visto = fichesN;
        if (d) { patch.coins = FV.increment(d); profilo.coins = monete() + d; }
      }
      (incrs || []).forEach(function (kv) {
        if (!kv[1]) return;
        var k = "stat." + gioco + "." + kv[0];
        patch[k] = FV.increment(kv[1]);
        setNested(profilo, k, (getNested(profilo, k) || 0) + kv[1]);
      });
      (recs || []).forEach(function (kv) {
        var k = "stat." + gioco + "." + kv[0];
        if (kv[1] > (getNested(profilo, k) || 0)) { patch[k] = kv[1]; setNested(profilo, k, kv[1]); }
      });
      (sets || []).forEach(function (kv) {
        var k = "stat." + gioco + "." + kv[0];
        patch[k] = kv[1]; setNested(profilo, k, kv[1]);
      });
      var vuoto = true; for (var x in patch) { vuoto = false; break; }
      if (vuoto) return Promise.resolve();
      return db.collection("profili").doc(utente.uid).update(patch).catch(function () {});
    }
  };
  init();
})();
