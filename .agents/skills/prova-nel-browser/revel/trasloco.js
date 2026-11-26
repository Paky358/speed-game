// 🏠📦 PROVA DEL TRASLOCO SU REVEL HOUSE (26 nov 2026). Con due indirizzi del computer al posto di quelli veri:
//   VECCHIO = http://localhost:8974/  (prima la vecchia app SPeeD GAME com'è online oggi, poi la porta di trasloco)
//   NUOVO   = http://127.0.0.1:8973/  (Revel House, la versione costruita di questa copia)
// Firebase vero non si tocca MAI: le chiamate a Google sono finte (il deposito dei traslochi è una lista in memoria,
// tutto il resto di googleapis si blocca), il profilo è finto (uid, lasciapassare finti).
// Prima:  bash costruisci-versione-online.sh   (il NUOVO, in dist/)
//         PORTA_A=http://127.0.0.1:8973/ bash costruisci-porta.sh   (la porta, in dist-porta/)
//         la vecchia app costruita in D:/SG-revel-prove/vecchio/dist (git archive origin/master + costruisci-versione-online.sh)
// Poi:    "C:\Program Files\nodejs\node.exe" .agents/skills/prova-nel-browser/revel/trasloco.js [--vedi]
// tr1 la vecchia app installata (service worker vecchio, file sul telefono) diventa la porta: trasloco col link d'invito,
//     dati e accesso arrivati, codice tolto dall'indirizzo, benvenuto, il deposito chiuso a chiave, i file vecchi buttati
// tr2 si riapre la vecchia app: le cose già cambiate su Revel House restano (si aggiunge solo quello che manca)
// tr3 «📦 Ho un codice di trasloco» scritto a mano in un telefono vuoto (l'app reinstallata su iPhone)
// tr4 codice sbagliato e codice scaduto: la scritta giusta, niente arriva
// tr5 chi non ha profilo: la porta lo manda subito su Revel House col suo link (#gioco=…&stanza=…), senza deposito
// tr6 «📲 Porta il profilo su un altro telefono»: l'id del telefono e le cose solo sue restano a casa
const fs = require("fs"), path = require("path"), http = require("http");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const VEDI = process.argv.includes("--vedi");
const RADICE = path.resolve(__dirname, "../../../..");
const DIR_NUOVO = path.join(RADICE, "dist"), DIR_PORTA = path.join(RADICE, "dist-porta"), DIR_VECCHIO = "D:/SG-revel-prove/vecchio/dist";
const VECCHIO = "http://localhost:8974/", NUOVO = "http://127.0.0.1:8973/";
const KEY = "AIzaSyCxCbBMyn8Y_Xjfl2raDwGw-YmfgVeZj4g", FB = "firebase:authUser:" + KEY + ":[DEFAULT]";

// ---------- la fila delle prove (una sola su tutto il PC, come prova.js) ----------
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia);
async function turno() {
  fs.mkdirSync(CODA, { recursive: true });
  mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, String(process.pid));
  for (let detto = false; ;) {
    const vivi = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const p = +f.split("-")[1].split(".")[0]; if (vivo(p)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (vivi[0] === path.basename(mioLock)) return;
    if (!detto) { console.log("⏳ aspetto il mio turno…"); detto = true; }
    await new Promise(r => setTimeout(r, 2000));
  }
}

// ---------- i due «siti» ----------
const TIPI = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp" };
let radiceVecchio = DIR_VECCHIO;
function servi(porta, host, radice) {
  return new Promise(ok => http.createServer((q, r) => {
    let p = decodeURIComponent(q.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
    const dir = radice(), f = path.join(dir, p);
    fs.readFile(f, (e, d) => {
      if (e) { const nf = path.join(dir, "404.html"); if (fs.existsSync(nf)) { r.writeHead(404, { "Content-Type": TIPI[".html"] }); return r.end(fs.readFileSync(nf)); } r.writeHead(404); return r.end("no"); }
      r.writeHead(200, { "Content-Type": TIPI[path.extname(f)] || "application/octet-stream", "Cache-Control": "max-age=600" }); r.end(d);   // (come GitHub Pages: 10 minuti)
    });
  }).listen(porta, host, ok));
}

// ---------- Google finto: il deposito dei traslochi in memoria, il resto bloccato ----------
const DEPOSITO = {}, CHIAMATE = [];
async function googleFinto(ctx) {
  await ctx.route(/googleapis\.com/, async route => {
    const q = route.request(), u = new URL(q.url()), m = /\/documents\/traslochi(?:\/([0-9a-f]+))?$/.exec(u.pathname);
    CHIAMATE.push(q.method() + " " + u.hostname + u.pathname);
    if (m && q.method() === "POST") {
      const id = u.searchParams.get("documentId"), auth = q.headers()["authorization"] || "";
      if (!/^Bearer AT-/.test(auth)) return route.fulfill({ status: 403, body: "{}" });
      if (DEPOSITO[id]) return route.fulfill({ status: 409, body: "{}" });
      const b = JSON.parse(q.postData()); DEPOSITO[id] = b.fields;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ name: "traslochi/" + id, fields: b.fields }) });
    }
    if (m && q.method() === "GET") {
      const d = DEPOSITO[m[1]];
      if (!d) return route.fulfill({ status: 404, body: "{}" });
      if (Date.parse(d.scade.timestampValue) < Date.now()) return route.fulfill({ status: 403, body: "{}" });   // (le regole: scaduto = non si legge)
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ name: "traslochi/" + m[1], fields: d }) });
    }
    if (m && q.method() === "DELETE") { delete DEPOSITO[m[1]]; return route.fulfill({ status: 200, body: "{}" }); }
    if (/securetoken/.test(u.hostname)) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id_token: "AT-rinnovato", refresh_token: "RT-finto-luca", expires_in: "3600" }) });
    return route.abort("failed");   // (profili, accesso: niente Firebase vero)
  });
}
function utenteFinto(uid, nome) {
  return { uid: uid, email: nome + "@sg.local", emailVerified: false, isAnonymous: false,
    providerData: [{ providerId: "password", uid: nome + "@sg.local", displayName: null, email: nome + "@sg.local", phoneNumber: null, photoURL: null }],
    stsTokenManager: { refreshToken: "RT-finto-" + nome, accessToken: "AT-finto-" + nome, expirationTime: Date.now() + 3600e3 },
    createdAt: "1730000000000", lastLoginAt: "1730000000000", apiKey: KEY, appName: "[DEFAULT]" };
}
// scrive l'accesso finto dove lo tiene Firebase (IndexedDB) e le cose del telefono
async function preparaTelefono(page, utente, ls) {
  await page.evaluate(([FB, u, ls]) => new Promise((ok, no) => {
    Object.keys(ls).forEach(k => localStorage.setItem(k, ls[k]));
    const q = indexedDB.open("firebaseLocalStorageDb", 1);
    q.onupgradeneeded = () => { if (!q.result.objectStoreNames.contains("firebaseLocalStorage")) q.result.createObjectStore("firebaseLocalStorage", { keyPath: "fbase_key" }); };
    q.onsuccess = () => { const tx = q.result.transaction("firebaseLocalStorage", "readwrite"); tx.objectStore("firebaseLocalStorage").put({ fbase_key: FB, value: u }); tx.oncomplete = () => { q.result.close(); ok(); }; tx.onerror = () => no(tx.error); };
    q.onerror = () => no(q.error);
  }), [FB, utente, ls]);
}
async function leggiTelefono(page) {
  return page.evaluate((FB) => new Promise(ok => {
    const ls = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); }
    const q = indexedDB.open("firebaseLocalStorageDb", 1);
    q.onupgradeneeded = () => { if (!q.result.objectStoreNames.contains("firebaseLocalStorage")) q.result.createObjectStore("firebaseLocalStorage", { keyPath: "fbase_key" }); };
    q.onsuccess = () => { const g = q.result.transaction("firebaseLocalStorage").objectStore("firebaseLocalStorage").get(FB); g.onsuccess = () => { q.result.close(); ok({ ls, u: g.result && g.result.value }); }; };
    q.onerror = () => ok({ ls, u: null });
  }), FB);
}
const aspetta = (ms) => new Promise(r => setTimeout(r, ms));
async function finché(fn, ms, passo) { const t0 = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t0 > ms) return null; await aspetta(passo || 200); } }

const COSE = {
  "sg-dev": "dev-di-luca-123", "sg-gettone": JSON.stringify({ g: 1, e: "⚡", c: ["#e0225a", "#4fd8ff"] }),
  "sg-compagnie": JSON.stringify([{ codice: "KFRTPQ", nome: "Quelli del giovedì", emoji: "🍻" }]),
  "sg-recenti": JSON.stringify([{ nome: "Giulia" }]), "sg-ruota-viste": "x".repeat(200000) + "|fine",   // (una memoria grossa)
  "lt-muto": "1"
};

(async () => {
  for (const d of [DIR_NUOVO, DIR_PORTA, DIR_VECCHIO]) if (!fs.existsSync(path.join(d, "index.html"))) { console.log("Manca " + d + "/index.html: costruiscilo prima (vedi in cima)"); process.exit(2); }
  if (!/127\.0\.0\.1:8973/.test(fs.readFileSync(path.join(DIR_PORTA, "index.html"), "utf8"))) { console.log("La porta non porta a " + NUOVO + ": PORTA_A=" + NUOVO + " bash costruisci-porta.sh"); process.exit(2); }
  await servi(8974, "localhost", () => radiceVecchio);
  await servi(8973, "127.0.0.1", () => DIR_NUOVO);
  await turno();
  const browser = await chromium.launch({ channel: "msedge", headless: !VEDI, args: ["--disable-gpu"] });
  const esiti = [];
  async function scenario(nome, fai) {
    const t0 = Date.now();
    try { const r = await fai(); esiti.push(nome + " OK · " + r + " (" + Math.round((Date.now() - t0) / 1000) + " s)"); }
    catch (e) { esiti.push(nome + " NO · " + (e && e.message || e)); }
    console.log(esiti[esiti.length - 1]);
  }
  const no = (m) => { throw new Error(m); };
  let codiceTr1 = null;

  // ---------- tr1 ----------
  await scenario("tr1", async () => {
    radiceVecchio = DIR_VECCHIO;
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); await googleFinto(ctx);
    const p = await ctx.newPage();
    await p.goto(VECCHIO);
    await p.evaluate(() => navigator.serviceWorker.ready);
    await preparaTelefono(p, utenteFinto("uid-luca", "luca"), COSE);
    await p.reload(); await p.evaluate(() => navigator.serviceWorker.ready);
    await finché(() => p.evaluate(() => !!navigator.serviceWorker.controller), 8000);
    const cassaPrima = await finché(() => p.evaluate(async () => { const c = await caches.open("sg-file-v1"); return (await c.keys()).length; }), 15000, 500);
    if (!cassaPrima) no("la vecchia app non ha tenuto i suoi file sul telefono (la prova non somiglia al vero)");
    // si pubblica la porta sul vecchio indirizzo; un amico apre l'invito di ieri sera dalla vecchia app
    radiceVecchio = DIR_PORTA;
    const visti = []; p.on("framenavigated", f => { if (f === p.mainFrame()) visti.push(f.url()); });
    await p.goto("about:blank");   // (l'app si riapre: non basta cambiare il pezzo dopo il #)
    await p.goto(VECCHIO + "#sala=ABCD");
    const arrivato = await finché(() => p.url().startsWith(NUOVO) && visti.some(u => u.startsWith(NUOVO) && !/trasloco=/.test(u)) && p.evaluate(() => !!document.querySelector(".home, .benvenuto-profilo, .schermata")).catch(() => false), 30000, 300);
    if (!arrivato) no("non arrivo su Revel House (indirizzi: " + visti.join(" → ") + ")");
    const conCodice = visti.find(u => /trasloco=/.test(u));
    if (!conCodice) no("la porta non ha dato il codice (" + visti.join(" → ") + ")");
    codiceTr1 = /trasloco=([A-Z0-9]+)/.exec(conCodice)[1];
    if (!/#sala=ABCD&trasloco=/.test(conCodice)) no("il link dell'invito si è perso: " + conCodice);
    if (!visti.some(u => u === NUOVO + "#sala=ABCD")) no("dopo il trasloco l'indirizzo non è tornato quello dell'invito: " + visti.join(" → "));
    // il deposito: chiuso a chiave, senza il codice
    const ids = Object.keys(DEPOSITO); if (ids.length !== 1) no("nel deposito " + ids.length + " pacchi");
    const d = DEPOSITO[ids[0]], chiaro = Buffer.from(d.dati.bytesValue, "base64").toString("latin1");
    if (/dev-di-luca|RT-finto|Quelli del gioved|uid-luca/.test(chiaro)) no("nel deposito si legge qualcosa in chiaro");
    if (ids[0].toUpperCase().includes(codiceTr1)) no("l'id del deposito contiene il codice");
    if (Date.parse(d.scade.timestampValue) - Date.now() > 2 * 3600e3 + 5000) no("scade troppo tardi");
    // sul nuovo indirizzo: le cose e l'accesso
    const t = await leggiTelefono(p), err = [];
    Object.keys(COSE).forEach(k => { if (t.ls[k] !== COSE[k]) err.push(k + " non è arrivato uguale"); });
    if (!t.u || t.u.uid !== "uid-luca" || t.u.stsTokenManager.refreshToken !== "RT-finto-luca") err.push("l'accesso non è arrivato");
    if (Object.keys(t.ls).some(k => /trasloco/.test(t.ls[k] || "") && /trasloco=/.test(t.ls[k]))) err.push("il codice è rimasto nelle cose del telefono");
    const fbUid = await finché(() => p.evaluate(() => window.firebase && firebase.auth().currentUser && firebase.auth().currentUser.uid).catch(() => null), 12000, 300);
    if (fbUid !== "uid-luca") err.push("Firebase non mi riconosce (" + fbUid + ")");
    const benv = await finché(() => p.evaluate(() => { const b = document.querySelector(".trasloco-box"); return b && b.textContent; }).catch(() => null), 6000);
    if (!benv || !/Benvenuto in Revel House/.test(benv) || !/Installa/.test(benv)) err.push("niente benvenuto con «Installa»: " + benv);
    // il vecchio indirizzo: il service worker della porta ha buttato i file vecchi
    const q = await ctx.newPage(); await q.goto(VECCHIO + "app/icona.svg");
    const cassaDopo = await finché(() => q.evaluate(async () => (await caches.keys()).length === 0 ? "vuota" : null), 15000, 500);
    if (!cassaDopo) err.push("sul vecchio indirizzo restano i file della vecchia app: " + await q.evaluate(async () => (await caches.keys()).join(",")));
    if (err.length) no(err.join("; "));
    await ctx.close();
    return "invito #sala=ABCD intatto, " + Object.keys(COSE).length + " cose + accesso arrivati, codice " + codiceTr1.slice(0, 2) + "…, deposito chiuso a chiave, file vecchi buttati";
  });

  // ---------- tr2 ----------
  await scenario("tr2", async () => {
    radiceVecchio = DIR_PORTA;
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); await googleFinto(ctx);
    const p = await ctx.newPage();
    await p.goto(VECCHIO + "app/icona.svg"); await preparaTelefono(p, utenteFinto("uid-luca", "luca"), COSE);
    await p.goto(NUOVO + "app/icona.svg"); await preparaTelefono(p, utenteFinto("uid-luca", "luca"), { "sg-gettone": "cambiato-qui", "sg-nuova": "solo-qui" });
    await p.goto(VECCHIO);
    await finché(() => p.url().startsWith(NUOVO) && !/trasloco=/.test(p.url()) && p.evaluate(() => !!document.querySelector(".schermata")).catch(() => false), 30000, 300);
    const t = await leggiTelefono(p), err = [];
    if (t.ls["sg-gettone"] !== "cambiato-qui") err.push("il gettone cambiato su Revel House è stato sovrascritto");
    if (t.ls["sg-nuova"] !== "solo-qui") err.push("sparita una cosa di Revel House");
    if (t.ls["sg-compagnie"] !== COSE["sg-compagnie"]) err.push("le Compagnie non sono arrivate");
    if (err.length) no(err.join("; "));
    await ctx.close();
    return "le cose già cambiate su Revel House restano, quelle che mancavano arrivano";
  });

  // ---------- tr3 ----------
  await scenario("tr3", async () => {
    if (!codiceTr1) no("serve il codice di tr1");
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" });
    await googleFinto(ctx);
    const p = await ctx.newPage(); await p.goto(NUOVO);
    const b = await finché(() => p.$("button.bp-trasloco"), 20000, 300); if (!b) no("niente «📦 Ho un codice di trasloco» nella prima schermata");
    await b.click();
    const campo = await finché(() => p.$("input.bp-codice"), 5000); if (!campo) no("niente casella del codice");
    await campo.type(codiceTr1.slice(0, 4).toLowerCase() + " " + codiceTr1.slice(4).toLowerCase());
    const scritto = await campo.inputValue(); if (scritto !== codiceTr1.slice(0, 4) + "-" + codiceTr1.slice(4)) no("la casella scrive «" + scritto + "»");
    await Promise.all([p.waitForNavigation({ timeout: 20000 }).catch(() => null), p.click("text=Entra ▶")]);
    await finché(() => p.evaluate(() => !!document.querySelector(".schermata")).catch(() => false), 15000);
    const t = await leggiTelefono(p);
    if (!t.u || t.u.uid !== "uid-luca") no("l'accesso non è arrivato col codice scritto a mano");
    if (t.ls["sg-compagnie"] !== COSE["sg-compagnie"]) no("le cose non sono arrivate");
    const benv = await finché(() => p.evaluate(() => { const b = document.querySelector(".trasloco-box"); return b && b.textContent; }).catch(() => null), 6000);
    if (!benv || !/Benvenuto/.test(benv)) no("niente benvenuto");
    if (!/Aggiungi alla schermata Home/.test(benv)) no("su iPhone non spiega «Aggiungi alla schermata Home»: " + benv);
    await ctx.close();
    return "codice scritto a mano (minuscole e spazio vanno bene): dentro, con le cose; benvenuto per iPhone";
  });

  // ---------- tr4 ----------
  await scenario("tr4", async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); await googleFinto(ctx);
    const p = await ctx.newPage(); await p.goto(NUOVO);
    async function prova(cod) {
      const b = await finché(() => p.$("button.bp-trasloco"), 20000, 300); await b.click();
      const c = await finché(() => p.$("input.bp-codice"), 5000); await c.fill(""); await c.type(cod);
      await p.click("text=Entra ▶");
      return finché(() => p.evaluate(() => { const a = document.querySelector(".bp-avviso"); return a && !/Arrivano/.test(a.textContent) && a.textContent; }), 10000);
    }
    const sbagliato = await prova("ZZZZ-ZZZZ");
    if (!/non c'è o è scaduto/.test(sbagliato || "")) no("codice sbagliato: «" + sbagliato + "»");
    // il pacco di tr1 scade
    Object.keys(DEPOSITO).forEach(id => { DEPOSITO[id].scade = { timestampValue: new Date(Date.now() - 1000).toISOString() }; });
    await p.click("text=‹ Indietro");
    const scaduto = await prova(codiceTr1);
    if (!/non c'è o è scaduto/.test(scaduto || "")) no("codice scaduto: «" + scaduto + "»");
    const t = await leggiTelefono(p); if (t.u) no("con un codice che non vale è arrivato un accesso");
    const corto = await (async () => { await p.click("text=‹ Indietro"); return prova("ABC"); })();
    if (!/8 lettere/.test(corto || "")) no("codice corto: «" + corto + "»");
    await ctx.close();
    return "sbagliato, scaduto e corto: la scritta giusta, niente accesso";
  });

  // ---------- tr5 ----------
  await scenario("tr5", async () => {
    radiceVecchio = DIR_PORTA;
    const prima = Object.keys(DEPOSITO).length;
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); await googleFinto(ctx);
    const p = await ctx.newPage(); const visti = []; p.on("framenavigated", f => { if (f === p.mainFrame()) visti.push(f.url()); });
    await p.goto(VECCHIO + "#gioco=tris&stanza=WXYZ");
    const ok = await finché(() => visti.some(u => u.startsWith(NUOVO)), 15000, 200);
    if (!ok) no("non arriva su Revel House: " + visti.join(" → "));
    const u = visti.find(x => x.startsWith(NUOVO));
    if (u !== NUOVO + "#gioco=tris&stanza=WXYZ") no("il link è cambiato: " + u);
    if (Object.keys(DEPOSITO).length !== prima) no("senza profilo ha lasciato un pacco nel deposito");
    // un indirizzo vecchio che non c'è più (404): anche lui porta su Revel House
    const p2 = await ctx.newPage(); const v2 = []; p2.on("framenavigated", f => { if (f === p2.mainFrame()) v2.push(f.url()); });
    await p2.goto(VECCHIO + "dist/index.html#sala=QWER").catch(() => {});
    if (!await finché(() => v2.some(x => x === NUOVO + "#sala=QWER"), 15000)) no("l'indirizzo che non c'è più non porta su Revel House: " + v2.join(" → "));
    await ctx.close();
    return "senza profilo dritto su Revel House col link intatto (anche da un indirizzo che non c'è più), nessun pacco";
  });

  // ---------- tr6 ----------
  await scenario("tr6", async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); await googleFinto(ctx);
    const p = await ctx.newPage(); await p.goto(NUOVO + "app/icona.svg");
    await preparaTelefono(p, utenteFinto("uid-giulia", "giulia"), { "sg-dev": "dev-di-giulia", "sg-ripresa": "{\"x\":1}", "sg-gettone": "g-giulia" });
    await p.goto(NUOVO); await finché(() => p.evaluate(() => !!window.SGTrasloco), 15000);
    const r = await p.evaluate(() => SGTrasloco.prepara({ altroTelefono: true }));
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(r.codice)) no("codice strano: " + r.codice);
    const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } }); await googleFinto(ctx2);
    const q = await ctx2.newPage(); await q.goto(NUOVO); await finché(() => q.evaluate(() => !!window.SGTrasloco), 15000);
    await q.evaluate((c) => SGTrasloco.ricevi(c), r.codice);
    const t = await leggiTelefono(q), err = [];
    if (!t.u || t.u.uid !== "uid-giulia") err.push("l'accesso non è arrivato");
    if (t.ls["sg-gettone"] !== "g-giulia") err.push("il gettone non è arrivato");
    if (t.ls["sg-dev"] === "dev-di-giulia") err.push("l'id del telefono è stato copiato (due telefoni uguali nella Sala)");
    if (t.ls["sg-ripresa"]) err.push("la partita da riprendere è stata copiata");
    if (err.length) no(err.join("; "));
    await ctx.close(); await ctx2.close();
    return "accesso e gettone arrivati, l'id del telefono e la ripresa restano a casa";
  });

  await browser.close(); lascia();
  const nNo = esiti.filter(e => / NO · /.test(e)).length;
  console.log("— " + (esiti.length - nNo) + " OK, " + nNo + " NO su " + esiti.length + " · chiamate a Google (tutte finte o bloccate): " + CHIAMATE.length);
  process.exit(nNo ? 1 : 0);
})();
