// Prova di SGNube.cancella con un Firebase FINTO (niente account veri): node prova-cancella.js D:/SG-legali/js/nube.js
"use strict";
const fs = require("fs");
function prova(nome, opz) {
  const log = [], docs = {
    "profili/U1": { uid: "U1", nome: "Prova" }, "pubblici/U1": { nome: "Prova" }, "pubblici/U2": { nome: "Altro" },
    "richieste/U1_U2": { da: "U1", a: "U2" }, "richieste/U3_U1": { da: "U3", a: "U1" }, "richieste/U2_U3": { da: "U2", a: "U3" }
  };
  let cb = null;
  const user = { uid: "U1", email: "prova@sg.local",
    reauthenticateWithCredential(c) { log.push("reauth " + c.email + " " + c.pwd); return c.pwd === "giusta" ? Promise.resolve() : Promise.reject({ code: "auth/wrong-password" }); },
    delete() { log.push("delete-user"); if (opz.userNo) return Promise.reject({ code: "auth/requires-recent-login" }); setTimeout(() => cb(null)); return Promise.resolve(); } };
  function ref(p) { return { path: p,
    get() { return Promise.resolve({ exists: !!docs[p], data: () => docs[p] }); },
    delete() { log.push("del " + p); if (opz.vietato && opz.vietato.includes(p)) return Promise.reject({ code: "permission-denied" }); delete docs[p]; return Promise.resolve(); },
    set(v) { log.push("set " + p + " " + JSON.stringify(v)); docs[p] = v; return Promise.resolve(); },
    update(v) { return Promise.resolve(); } }; }
  function coll(c) { const q = (f, v) => ({ get() { const l = Object.keys(docs).filter(k => k.startsWith(c + "/") && docs[k][f] === v).map(k => ({ id: k.split("/")[1], ref: ref(k), data: () => docs[k] }));
    return Promise.resolve({ docs: l, empty: !l.length }); }, limit() { return this; } });
    return { doc: id => ref(c + "/" + id), where: (f, op, v) => q(f, v), orderBy() { return { limit: () => ({ get: () => Promise.resolve({ docs: [] }) }) }; } }; }
  const firebase = { initializeApp() {}, auth: Object.assign(() => ({ currentUser: user, onAuthStateChanged(f) { cb = f; setTimeout(() => f(user)); }, signOut: () => Promise.resolve() }),
      { EmailAuthProvider: { credential: (email, pwd) => ({ email, pwd }) } }),
    firestore: Object.assign(() => ({ collection: coll }), { FieldValue: { increment: n => n, delete: () => null, arrayUnion: x => x, arrayRemove: x => x } }) };
  const window = { addEventListener() {}, firebase };
  new Function("window", "firebase", fs.readFileSync(process.argv[2], "utf8"))(window, firebase);
  return new Promise(r => setTimeout(r, 20)).then(() => window.SGNube.cancella(opz.pwd).then(() => "ok", e => "errore " + (e && e.code)))
    .then(esito => { console.log("\n== " + nome + ": " + esito); log.forEach(l => console.log("  " + l)); console.log("  restano:", Object.keys(docs).join(", "), "| profilo:", JSON.stringify(window.SGNube.profilo() && window.SGNube.profilo().nome)); });
}
(async () => {
  await prova("password giusta", { pwd: "giusta" });
  await prova("password sbagliata (non deve cancellare niente)", { pwd: "sbagliata" });
  await prova("scheda pubblica non cancellabile (la svuota)", { pwd: "giusta", vietato: ["pubblici/U1"] });
  await prova("profilo non cancellabile (si ferma: l'account resta)", { pwd: "giusta", vietato: ["profili/U1"] });
})();
