/* =========================================================
   NUBE — profili e dati in cloud con Firebase.
   Login con NOME + PASSWORD (l'email vera e' finta: nome@sg.local,
   cosi' l'utente inserisce solo nome e password).
   Salva i dati di ogni giocatore (es. le fiches del Black Jack)
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
  var FICHES_START = 500;
  var BONUS = 300, BONUS_MS = 2 * 3600 * 1000;   // 300 fiches gratis ogni 2 ore
  var auth = null, db = null, pronto = false, utente = null, profilo = null, ascolta = [];

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
        utente = u || null;
        if (u) caricaProfilo(u.uid);
        else { profilo = null; pronto = true; notifica(); }
      });
    } catch (e) { auth = null; pronto = true; }
  }
  function caricaProfilo(uid) {
    db.collection("profili").doc(uid).get().then(function (doc) {
      profilo = doc.exists ? doc.data() : null;
      pronto = true; notifica();
    }).catch(function () { pronto = true; notifica(); });
  }

  window.SGNube = {
    disponibile: function () { return !!auth; },
    pronto: function () { return pronto; },
    utente: function () { return utente; },
    profilo: function () { return profilo; },
    fichesStart: FICHES_START,
    messaggioErrore: messaggioErrore,
    // chiamato quando lo stato e' pronto e ad ogni cambio (login/logout/dati)
    onCambio: function (cb) { ascolta.push(cb); if (pronto) cb(profilo); },

    crea: function (nome, pwd, emoji) {
      if (!auth) return Promise.reject(new Error("offline"));
      return auth.createUserWithEmailAndPassword(emailDa(nome), pwd).then(function (cred) {
        var p = {
          uid: cred.user.uid, nome: String(nome).trim().slice(0, 20), emoji: emoji || "🙂",
          fiches: { blackjack: FICHES_START }, stat: {}, creato: Date.now()
        };
        return db.collection("profili").doc(cred.user.uid).set(p).then(function () { profilo = p; notifica(); return p; });
      });
    },
    accedi: function (nome, pwd) {
      if (!auth) return Promise.reject(new Error("offline"));
      return auth.signInWithEmailAndPassword(emailDa(nome), pwd);
    },
    esci: function () { return auth ? auth.signOut() : Promise.resolve(); },

    fiches: function (gioco) {
      return (profilo && profilo.fiches && profilo.fiches[gioco] != null) ? profilo.fiches[gioco] : null;
    },
    salvaFiches: function (gioco, n) {
      if (!auth || !utente || !profilo) return Promise.resolve();
      profilo.fiches = profilo.fiches || {}; profilo.fiches[gioco] = n;
      var patch = {}; patch["fiches." + gioco] = n;
      return db.collection("profili").doc(utente.uid).update(patch).catch(function () {});
    },

    // ---- bonus gratuito ogni 2 ore ----
    bonusImporto: BONUS,
    puoRitirareBonus: function () { return !!(profilo && (Date.now() - (profilo.bonusUltimo || 0)) >= BONUS_MS); },
    prossimoBonusMs: function () { return profilo ? Math.max(0, BONUS_MS - (Date.now() - (profilo.bonusUltimo || 0))) : BONUS_MS; },
    ritiraBonus: function () {
      if (!auth || !utente || !profilo) return Promise.reject(new Error("offline"));
      if ((Date.now() - (profilo.bonusUltimo || 0)) < BONUS_MS) return Promise.reject(new Error("presto"));
      var nuovo = ((profilo.fiches && profilo.fiches.blackjack) || 0) + BONUS;
      profilo.fiches = profilo.fiches || {}; profilo.fiches.blackjack = nuovo; profilo.bonusUltimo = Date.now();
      var patch = { bonusUltimo: profilo.bonusUltimo }; patch["fiches.blackjack"] = nuovo;
      // conta i bonus ritirati (serve per i trofei) e aggiorna il record fiches
      patch["stat.blackjack.bonusRitirati"] = firebase.firestore.FieldValue.increment(1);
      setNested(profilo, "stat.blackjack.bonusRitirati", (getNested(profilo, "stat.blackjack.bonusRitirati") || 0) + 1);
      if (nuovo > (getNested(profilo, "stat.blackjack.recordFiches") || 0)) { patch["stat.blackjack.recordFiches"] = nuovo; setNested(profilo, "stat.blackjack.recordFiches", nuovo); }
      return db.collection("profili").doc(utente.uid).update(patch).then(function () { notifica(); return nuovo; });
    },
    // legge le statistiche di un gioco, es. statGioco("blackjack")
    statGioco: function (gioco) { return (profilo && profilo.stat && profilo.stat[gioco]) || {}; },
    // salva in un colpo: fiches del gioco + contatori (incrementi) + record (max) + valori da impostare
    //   incrs / recs / sets = liste di coppie [chiave, valore]
    //   (sets serve per cose che possono anche scendere, es. la serie di risposte giuste in corso)
    salvaProgressi: function (fichesN, gioco, incrs, recs, sets) {
      if (!auth || !utente || !profilo) return Promise.resolve();
      var FV = firebase.firestore.FieldValue, patch = {};
      if (fichesN != null) { patch["fiches." + gioco] = fichesN; setNested(profilo, "fiches." + gioco, fichesN); }
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
