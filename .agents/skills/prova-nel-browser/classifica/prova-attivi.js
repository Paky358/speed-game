// 🕰️ La classifica senza chi non entra da 2 mesi (27 nov 2026), provata su js/nube.js con un Firebase FINTO (niente account veri):
//   node .agents/skills/prova-nel-browser/classifica/prova-attivi.js js/nube.js
// cl1 SGNube.attivo: agg entro 60 giorni sì, oltre no; senza agg conta il gettone; cancellato mai.
// cl2 400 schede, un terzo vecchie: 100 posti, tutti attivi, in ordine di trofei, nessuno saltato tra quelli attivi.
// cl3 pochi profili (120, 50 attivi): tutti i 50, una pagina sola.
// cl4 1.000 schede quasi tutte vecchie: si ferma a 6 pagine (900 letture) con quelli trovati.
// cl5 la seconda volta entro un minuto non rilegge niente; dopo un minuto sì; cambiando profilo sì.
"use strict";
const fs = require("fs");
const GIORNO = 864e5, ORA = Date.now();
let errori = 0;
function ok(cond, msg) { console.log((cond ? "  OK  " : "  NO  ") + msg); if (!cond) errori++; }
function carica(schede) {
  const letture = { pagine: 0, doc: 0 };
  let cb = null;
  const user = { uid: "U0", email: "prova@sg.local" };
  const docs = { "profili/U0": { uid: "U0", nome: "Prova" } };
  schede.forEach((d, i) => { docs["pubblici/S" + i] = d; });
  function ref(p) { return { path: p, get: () => Promise.resolve({ exists: !!docs[p], data: () => docs[p] }), set: () => Promise.resolve(), update: () => Promise.resolve(), delete: () => Promise.resolve() }; }
  function query(c, ordine, dopo, quanti) {
    return {
      orderBy(f, dir) { return query(c, [f, dir], dopo, quanti); },
      startAfter(d) { return query(c, ordine, d, quanti); },
      limit(n) { return query(c, ordine, dopo, n); },
      where() { return query(c, ordine, dopo, quanti); },
      get() {
        // come Firestore: solo i doc che hanno il campo dell'ordine, in ordine (a pari, per id)
        let l = Object.keys(docs).filter(k => k.startsWith(c + "/")).map(k => ({ id: k.split("/")[1], k }));
        if (ordine) l = l.filter(x => docs[x.k][ordine[0]] != null).sort((a, b) => (docs[b.k][ordine[0]] - docs[a.k][ordine[0]]) || (a.id < b.id ? -1 : 1));
        if (dopo) l = l.slice(l.findIndex(x => x.id === dopo.id) + 1);
        if (quanti) l = l.slice(0, quanti);
        letture.pagine++; letture.doc += l.length;
        return Promise.resolve({ docs: l.map(x => ({ id: x.id, ref: ref(x.k), data: () => JSON.parse(JSON.stringify(docs[x.k])) })), empty: !l.length });
      }
    };
  }
  const coll = c => Object.assign(query(c), { doc: id => ref(c + "/" + id) });
  const firebase = { initializeApp() {}, auth: Object.assign(() => ({ currentUser: user, onAuthStateChanged(f) { cb = f; setTimeout(() => f(user)); }, signOut: () => Promise.resolve() }), { EmailAuthProvider: {} }),
    firestore: Object.assign(() => ({ collection: coll }), { FieldValue: { increment: n => n, delete: () => null, arrayUnion: x => x, arrayRemove: x => x } }) };
  const window = { addEventListener() {}, firebase };
  new Function("window", "firebase", fs.readFileSync(process.argv[2] || "js/nube.js", "utf8"))(window, firebase);
  global.SGNube = window.SGNube;   // (nel browser SGNube è di tutta la pagina: nube.js lo chiama così)
  return new Promise(r => setTimeout(r, 30)).then(() => ({ N: window.SGNube, letture, cambia: () => cb(Object.assign({}, user, { uid: "U9" })) }));
}
function schede(n, vecchia) {   // trofei da n in giù; vecchia(i) = la scheda i non entra da più di 60 giorni
  const l = [];
  for (let i = 0; i < n; i++) l.push({ uid: "S" + i, nome: "Gioc" + i, trofei: n - i, agg: ORA - (vecchia(i) ? 61 : 3) * GIORNO, gettone: { e: "⚡" } });
  return l;
}
(async () => {
  console.log("cl1 · chi è attivo");
  { const { N } = await carica([]);
    ok(N.attivo({ agg: ORA - 59 * GIORNO }, ORA) === true, "entrato 59 giorni fa: si vede");
    ok(N.attivo({ agg: ORA - 60 * GIORNO }, ORA) === true, "entrato 60 giorni fa giusti: si vede ancora");
    ok(N.attivo({ agg: ORA - 61 * GIORNO, gettone: { e: "⚡" } }, ORA) === false, "entrato 61 giorni fa (anche col gettone): nascosto");
    ok(N.attivo({ gettone: { e: "⚡" } }, ORA) === true, "senza data ma col gettone (entrato dal 13 nov): si vede");
    ok(N.attivo({ trofei: 5 }, ORA) === false, "senza data e senza gettone: nascosto");
    ok(N.attivo({ cancellato: true, agg: ORA }, ORA) === false, "profilo cancellato: mai");
  }
  console.log("cl2 · 400 schede, un terzo vecchie");
  { const l = schede(400, i => i % 3 === 1), { N, letture } = await carica(l);
    const r = await N.classificaGenerale(100);
    const attesi = l.filter((x, i) => i % 3 !== 1).slice(0, 100).map(x => x.uid).join();
    ok(r.length === 100, "100 posti (sono " + r.length + ")");
    ok(r.every(x => ORA - x.agg <= 60 * GIORNO), "tutti entrati negli ultimi 60 giorni");
    ok(r.map(x => x.uid).join() === attesi, "i 100 attivi con più trofei, in ordine, nessuno saltato");
    ok(letture.pagine === 1 && letture.doc === 150, "letture: " + letture.pagine + " pagina, " + letture.doc + " schede");
  }
  console.log("cl3 · pochi profili");
  { const l = schede(120, i => i >= 50), { N, letture } = await carica(l);
    const r = await N.classificaGenerale(100);
    ok(r.length === 50, "tutti i 50 attivi (sono " + r.length + ")");
    ok(letture.pagine === 1, "una pagina sola (" + letture.pagine + ")");
  }
  console.log("cl4 · quasi tutti vecchi");
  { const l = schede(1000, i => i % 20 !== 0), { N, letture } = await carica(l);
    const r = await N.classificaGenerale(100);
    ok(letture.pagine === 6 && letture.doc === 900, "si ferma a 6 pagine (" + letture.pagine + ", " + letture.doc + " schede)");
    ok(r.length === 45 && r.every(x => +x.uid.slice(1) % 20 === 0), "dà quelli trovati: " + r.length);
  }
  console.log("cl5 · un minuto senza rileggere");
  { const l = schede(200, () => false), { N, letture, cambia } = await carica(l);
    await N.classificaGenerale(100); const p1 = letture.pagine;
    const r2 = await N.classificaGenerale(100);
    ok(letture.pagine === p1 && r2.length === 100, "seconda volta: nessuna lettura in più");
    r2.length = 0; const r3 = await N.classificaGenerale(100);
    ok(r3.length === 100, "la lista tenuta non si rovina se chi la usa la cambia");
    const vero = Date.now; Date.now = () => vero() + 61000;
    await N.classificaGenerale(100); Date.now = vero;
    ok(letture.pagine === p1 + 1, "dopo un minuto rilegge");
    cambia(); await new Promise(r => setTimeout(r, 30));
    await N.classificaGenerale(100);
    ok(letture.pagine === p1 + 2, "con un altro profilo rilegge");
  }
  console.log(errori ? "\nNO: " + errori + " errori" : "\nTUTTO OK");
  process.exit(errori ? 1 : 0);
})();
