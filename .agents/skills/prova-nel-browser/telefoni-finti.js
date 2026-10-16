// Telefoni finti collegati tra loro (finto broker MQTT), per provare i giochi online in una pagina sola.
// Uso: servi la cartella (es. http://localhost:8973), apri una pagina del sito e incolla questo file nella console
// (o nello strumento javascript del browser, che accetta "await"): prendi la parte PRIMA della riga "===== ESEMPIO =====".
// Poi apri i telefoni con apriTel(nome, { hash, x }) e guidali con clicca(w, /testo/), aspetta(...), testo(w)...
// Profili finti, mai account veri.
//
// Ogni telefono è un iframe con TUTTO finto fin dal primo script della pagina (prima che parta l'app):
// - il broker: BR.retained (messaggi trattenuti), BR.log, BR.perNome[nome] = i suoi collegamenti;
//   il "testamento" (will) parte quando il telefono sparisce, ed è trattenuto se lo chiede il collegamento;
// - la memoria: ogni telefono ha il suo localStorage e il suo sessionStorage (BR.mem[nome]), che restano
//   quando la pagina si ricarica (ricarica) e il sessionStorage si svuota quando l'app si chiude (chiudiApp);
// - il profilo: SGNube finto, già fatto col nome del telefono (il profilo è obbligatorio: senza, l'app apre il benvenuto),
//   oppure { profilo: false } = telefono mai usato (si crea nel benvenuto: SGNube.crea / accedi finti, conti in BR.conti,
//   contoFinto(nome, password) ne prepara uno); w.__offline = true = la parte dei profili non si è caricata (niente rete);
//   il profilo resta nella memoria del telefono quando la pagina si ricarica (come la sessione di Firebase);
// - i fotogrammi delle animazioni arrivano anche con la finestra del browser nascosta (requestAnimationFrame a tempo)
//   e i suoni che non partono non lanciano errori.
// Cose che succedono ai telefoni veri:
//   spegni(nome) / riaccendi(nome)  = schermo bloccato, rete persa (il broker manda il testamento)
//   inciampa(nome, ms)              = la rete salta un attimo: errore + testamento, poi si ricollega da solo
//   ricarica(nome)                  = la pagina si ricarica (stessa scheda: stessa memoria)
//   chiudiApp(nome)                 = l'app si chiude e si riapre (memoria sì, sessionStorage no)
//   congela(nome) / scongela(nome)  = il telefono si ferma (tasca, schermo spento) ma il broker NON se n'è ancora accorto:
//                                     niente testamento, non manda e non riceve; spegni(nome) dopo = il broker se ne accorge
//   apriTel(nome, { orologio: ms }) = l'orologio del telefono è avanti (ms > 0) o indietro: Date.now() e new Date() della
//                                     sua pagina; spostaOrologio(nome, ms) lo cambia a telefono aperto (anche "il giorno dopo")
// Per contare e guardare: contaCollegamenti(nome) (collegamenti aperti da quel telefono, anche le sbirciate),
// BR.storia (ogni messaggio passato su un ".../<codice>/stato": { ms, da, r, topic, p }), BR.nube[uid].liste (le liste
// del profilo: due telefoni con lo stesso uid le vedono uguali), BR.amicizie (le richieste d'amicizia mandate).
document.open(); document.write('<!doctype html><body style="margin:0;background:#333;position:relative"></body>'); document.close();
window.BR = { clients: [], retained: {}, log: [], perNome: {}, mem: {}, tel: {}, conti: {}, ritardo: 4, nube: {}, amicizie: [], storia: [], congelati: {} };
// ogni messaggio sullo "stato" di una stanza (foto dell'host, testamenti) resta in BR.storia (per fotoSale del Passo 3)
window.segnaStoria = function (da, topic, payload, r) {
  if (!/\/stato$/.test(topic)) return;
  const s = BR.storia = BR.storia || [];
  s.push({ ms: Date.now(), da, r: !!r, topic, p: String(payload) });
  if (s.length > 1500) s.splice(0, 500);
};
// un profilo finto già fatto (per "Hai già un profilo? Entra" e "Bentornato"): contoFinto("Luca", "segreto1")
window.contoFinto = (nome, pwd, extra) => { const k = String(nome).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); BR.conti = BR.conti || {}; BR.conti[k] = { pwd: String(pwd), profilo: Object.assign({ uid: "finto-" + k, nome: String(nome).trim(), fiches: {}, omino: null, coins: 5000, level: 1, xp: 0 }, extra || {}) }; return BR.conti[k].profilo; };
// la finestra di conferma dell'app ("Uscire dalla partita?", "Chiudere la stanza per tutti?") risponde sì da sola,
// come window.confirm: il tasto rosso si accende dopo un attimo e qui viene toccato appena si può, su ogni telefono
if (!window.__autoConferma) window.__autoConferma = setInterval(() => {
  document.querySelectorAll("iframe").forEach(f => { try { const b = f.contentWindow.document.querySelector(".conferma-sfondo .btn-rosso:not([disabled])"); if (b) b.click(); } catch (e) {} });
}, 100);
window.creaClient = function (nome, opts) {
  const c = { nome, opts, h: {}, subs: new Set(), connected: false, frozen: false, morto: false,
    on(ev, fn) { (this.h[ev] = this.h[ev] || []).push(fn); return this; },
    emit(ev, ...a) { (this.h[ev] || []).forEach(f => { try { f(...a); } catch (e) { BR.log.push("ERR " + nome + ": " + e.message); } }); },
    subscribe(topic, cb) {
      const lista = Array.isArray(topic) ? topic : [topic];
      lista.forEach(t => this.subs.add(t));
      setTimeout(() => { if (cb) cb(null, lista.map(t => ({ topic: t, qos: 0 }))); lista.forEach(t => { const r = BR.retained[t]; if (r != null) this.deliver(t, r, true); }); }, 5);
      return this;
    },
    unsubscribe(topic) { (Array.isArray(topic) ? topic : [topic]).forEach(t => this.subs.delete(t)); return this; },
    publish(topic, payload, o) {
      if (!this.connected || this.frozen) return this;
      if (o && o.retain) { if (payload === "") delete BR.retained[topic]; else BR.retained[topic] = payload; }
      BR.log.push(nome + " → " + topic.split("/").slice(2).join("/") + " " + String(payload).slice(0, 80));
      if (BR.log.length > 400) BR.log.splice(0, 100);
      segnaStoria(nome, topic, payload, o && o.retain);
      BR.clients.forEach(k => { if (k.connected && !k.frozen && k.subs.has(topic)) k.deliver(topic, payload, false); });
      return this;
    },
    deliver(topic, payload, ret) { setTimeout(() => { if (this.connected && !this.frozen) this.emit("message", topic, { toString: () => payload }, { retain: ret }); }, BR.ritardo); },
    // uscita educata (come mqtt.end): niente testamento
    end() { if (!this.connected && this.morto) return this; this.connected = false; this.morto = true; BR.clients = BR.clients.filter(x => x !== this); setTimeout(() => { this.emit("close"); this.emit("end"); }, 1); return this; },
    reconnect() { if (this.morto || this.connected) return; this.frozen = false; this.connected = true; this.subs = new Set(); if (!BR.clients.includes(this)) BR.clients.push(this); this.emit("connect"); },
    testamento() {
      const w = this.opts && this.opts.will; if (!w) return;
      if (w.retain) { if (w.payload === "") delete BR.retained[w.topic]; else BR.retained[w.topic] = w.payload; }
      BR.log.push(nome + " ✝ " + w.topic.split("/").slice(2).join("/") + " " + String(w.payload).slice(0, 60));
      segnaStoria(nome + " ✝", w.topic, w.payload, w.retain);
      BR.clients.forEach(k => { if (k.connected && !k.frozen && k.subs.has(w.topic)) k.deliver(w.topic, w.payload, false); });
    },
    // sparisci() = telefono che si spegne all'improvviso (il broker manda il "testamento"); torna() = si riaccende
    sparisci() { if (!this.connected) return; delete this.__gelo; this.connected = false; this.frozen = true; BR.clients = BR.clients.filter(x => x !== this); this.testamento(); this.emit("close"); this.emit("offline"); },
    torna() { if (this.morto) return; delete this.__gelo; this.frozen = false; this.connected = true; this.subs = new Set(); if (!BR.clients.includes(this)) BR.clients.push(this); this.emit("connect"); },
    // la rete salta un attimo: errore, il broker manda il testamento, poi mqtt si ricollega da solo dopo ms
    inciampa(ms) { if (!this.connected) return; this.emit("error", new Error("rete saltata (finta)")); this.sparisci(); setTimeout(() => this.torna(), ms || 2500); }
  };
  BR.clients.push(c); (BR.perNome[nome] = BR.perNome[nome] || []).push(c);
  // (un telefono congelato non arriva al broker: il collegamento parte quando si scongela)
  setTimeout(() => { if (c.morto) return; if (BR.congelati && BR.congelati[nome]) { c.__gelo = true; c.frozen = true; BR.clients = BR.clients.filter(x => x !== c); return; } c.connected = true; c.emit("connect"); }, 10);
  return c;
};
// una memoria finta (localStorage o sessionStorage) che resta nella pagina dei telefoni
window.memoriaFinta = function (d) {
  return { getItem: k => (Object.prototype.hasOwnProperty.call(d, k) ? d[k] : null), setItem: (k, v) => { d[k] = String(v); },
    removeItem: k => { delete d[k]; }, clear: () => { Object.keys(d).forEach(k => delete d[k]); }, key: i => Object.keys(d)[i] || null, get length() { return Object.keys(d).length; } };
};
// l'orologio spostato di un telefono: Date.now() e new Date() (senza argomenti) danno l'ora vera + w.__orologio.ms
// (Date diventa un "Date" che fa lo stesso, con lo stesso prototype: instanceof Date va ancora)
window.mettiOrologio = function (w) {
  if (w.__dataVera) return;
  const D0 = w.Date, ora = () => D0.now() + ((w.__orologio && w.__orologio.ms) || 0);
  function D(...a) {
    if (!new.target) return new D0(ora()).toString();
    return Reflect.construct(D0, a.length ? a : [ora()], new.target);
  }
  D.prototype = D0.prototype; D.now = ora; D.parse = D0.parse; D.UTC = D0.UTC;
  w.__dataVera = D0; w.Date = D;
};
// sposta l'orologio di un telefono aperto (ms = quanto avanti, negativo = indietro; 0 = ora giusta). Vale anche dopo le ricariche
window.spostaOrologio = function (nome, ms) {
  ms = +ms || 0;
  if (BR.tel[nome]) BR.tel[nome].opz.orologio = ms;
  const w = finestra(nome);
  if (w) { w.__orologio = w.__orologio || { ms: 0 }; w.__orologio.ms = ms; if (ms) mettiOrologio(w); }
  return ms;
};
// tutto finto nella finestra del telefono PRIMA che parta qualsiasi script della pagina
// (la finestra iniziale dell'iframe viene riusata dalla pagina che si carica)
window.preparaFinestra = function (w, nome, opz) {
  opz = opz || {};
  const mem = BR.mem[nome] = BR.mem[nome] || { l: {}, s: {} };
  BR.conti = BR.conti || {};
  const def = (k, get, set) => Object.defineProperty(w, k, { configurable: true, get, set: set || (() => {}) });
  def("localStorage", () => memoriaFinta(mem.l));
  def("sessionStorage", () => memoriaFinta(mem.s));
  const finto = { connect: (url, o) => creaClient(nome, o), finto: true };
  def("mqtt", () => finto);   // (lo script vero di mqtt prova a mettersi qui: viene ignorato)
  let sg = null;
  def("SG", () => sg, v => { sg = v; const avvia = v.avviaApp; v.avviaApp = function () { if (!w.__permesso) return; return avvia.apply(v, arguments); }; });   // l'app parte quando lo dico io
  // il profilo finto resta nella memoria del telefono (come la sessione di Firebase): ricaricando c'è ancora.
  // Di partenza ogni telefono ha già il suo profilo (nome del telefono, con l'avatar); { profilo: false } = mai fatto il profilo
  if (!("fp" in mem)) mem.fp = opz.profilo === false ? null : Object.assign({ uid: "finto-" + nome, nome, fiches: {}, omino: null, coins: 5000, level: 1, xp: 0 }, typeof opz.profilo === "object" ? opz.profilo : {});
  Object.defineProperty(w, "__fp", { configurable: true, get: () => mem.fp });
  if (opz.offline) w.__offline = true;
  // l'orologio del telefono (opz.orologio = ms avanti, o indietro se negativo)
  w.__orologio = { ms: +opz.orologio || 0 };
  if (w.__orologio.ms) mettiOrologio(w);
  // la nube finta: BR.nube[uid] = { liste: {…}, amici: […] } (resta tra ricariche e tra telefoni con lo stesso uid)
  const uidMio = () => (mem.fp ? mem.fp.uid || "finto-" + nome : null);
  const nubeDi = u => { BR.nube = BR.nube || {}; return (BR.nube[u] = BR.nube[u] || { liste: {} }); };
  const copia = x => w.JSON.parse(JSON.stringify(x == null ? [] : x));   // (array della pagina del telefono)
  let nube = null;
  def("SGNube", () => nube, v => {
    nube = v;
    const ascolta = [], avvisa = () => ascolta.slice().forEach(cb => { try { cb(v.profilo()); } catch (e) {} });
    const chiave = n => String(n || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "amico";
    const errore = code => Promise.reject(Object.assign(new Error(code), { code }));
    // w.__offline = true: la parte dei profili non si è caricata (niente internet all'apertura)
    v.disponibile = () => !w.__offline; v.pronto = () => true; v.utente = () => (mem.fp ? { uid: mem.fp.uid || "finto-" + nome } : null);
    v.profilo = () => { const fp = mem.fp; if (fp && !fp.omino && !fp.__nuovo && w.SGOmino) fp.omino = w.SGOmino.casuale(nome); return fp; };
    v.onCambio = cb => { ascolta.push(cb); try { cb(v.profilo()); } catch (e) {} };
    // creare il profilo ed entrare: i conti finti stanno in BR.conti (contoFinto(nome, password) ne prepara uno)
    v.crea = (n, pwd, emoji) => {
      if (w.__offline || w.__reteGiu) return errore("auth/network-request-failed");
      if (BR.conti[chiave(n)]) return errore("auth/email-already-in-use");
      if (String(pwd || "").length < 6) return errore("auth/weak-password");
      const p = { uid: "finto-" + chiave(n), nome: String(n).trim().slice(0, 20), emoji: emoji || "🙂", fiches: {}, omino: null, coins: 1000, level: 1, xp: 0, __nuovo: true };
      BR.conti[chiave(n)] = { pwd: String(pwd), profilo: p };
      mem.fp = p; BR.log.push("PROFILO creato da " + nome + ": " + p.nome);
      setTimeout(avvisa, 5); return Promise.resolve(p);
    };
    v.accedi = (n, pwd) => {
      if (w.__offline || w.__reteGiu) return errore("auth/network-request-failed");
      const c = BR.conti[chiave(n)];
      if (!c || c.pwd !== String(pwd)) return errore("auth/invalid-credential");
      mem.fp = c.profilo; setTimeout(avvisa, 5); return Promise.resolve({ user: { uid: c.profilo.uid } });
    };
    v.esci = () => { mem.fp = null; setTimeout(avvisa, 5); return Promise.resolve(); };
    v.salvaOmino = (cfg, omini, n) => { if (!mem.fp) return Promise.resolve(); mem.fp.omino = cfg; if (omini) { mem.fp.omini = omini; mem.fp.ominoN = n || 0; } return Promise.resolve(); };
    v.salvaProgressi = () => {}; v.statGioco = () => ({}); v.salvaFiches = () => {}; v.fiches = () => 1000;
    // le liste del profilo (es. "compagnie"): salvate davvero in BR.nube[uid].liste (di partenza quelle di opz.profilo.liste)
    v.lista = n => {
      const u = uidMio(); if (!u) return copia([]);
      const L = nubeDi(u).liste;
      return copia(Object.prototype.hasOwnProperty.call(L, n) ? L[n] : (mem.fp.liste || {})[n]);
    };
    v.salvaLista = (n, lista) => { const u = uidMio(); if (u) nubeDi(u).liste[n] = JSON.parse(JSON.stringify(lista == null ? [] : lista)); return Promise.resolve(); };
    v.monete = () => 5000; v.cambiaMonete = () => Promise.resolve(5000);
    v.contaPartita = () => {}; v.aggiungiXp = () => null; v.pubblica = () => {};
    // amici finti: opz.profilo.amici = ["finto-Giulia", …] o BR.nube[uid].amici (vince questa); le schede pubbliche
    // prendono il nome dall'uid (BR.schede = quante letture)
    v.amici = () => { const u = uidMio(), n = u && BR.nube && BR.nube[u]; return n && n.amici ? copia(n.amici) : (mem.fp && mem.fp.amici) || []; };
    // richieste d'amicizia: chiediAmicizia le segna in BR.amicizie ({ da, a, nome }) e risponde "inviata";
    // richieste() le rilegge (arrivate a me / mandate da me, tutte "in attesa": nessuno le accetta da solo)
    v.chiediAmicizia = sch => {
      if (w.__offline || w.__reteGiu || !mem.fp) return errore("offline");
      const da = uidMio(), a = sch && sch.uid; BR.amicizie = BR.amicizie || [];
      if (a && !BR.amicizie.some(r => r.da === da && r.a === a)) BR.amicizie.push({ da, a, nome: (sch && sch.nome) || "", daNome: mem.fp.nome, t: Date.now() });
      BR.log.push("AMICIZIA " + nome + " → " + a);
      return Promise.resolve("inviata");
    };
    v.richieste = () => {
      if (w.__offline || w.__reteGiu || !mem.fp) return errore("offline");
      const me = uidMio(), l = BR.amicizie || [], r = x => Object.assign({ id: x.da + "_" + x.a, stato: "attesa", aNome: x.nome }, x);
      return Promise.resolve(copia({ arrivate: l.filter(x => x.a === me).map(r), inviate: l.filter(x => x.da === me).map(r) }));
    };
    v.schede = uids => { BR.schede = (BR.schede || 0) + 1; return w.__offline || w.__reteGiu ? errore("offline") : Promise.resolve((uids || []).map(u => ({ uid: u, nome: String(u).slice(6), omino: null }))); };
  });
  w.__err = [];
  w.addEventListener("error", e => w.__err.push((e.message || "errore") + " @" + (e.filename || "").split("/").pop() + ":" + e.lineno));
  w.confirm = () => true; w.alert = () => {};   // le domande "Sei sicuro?" rispondono sì da sole
  // con la finestra del browser nascosta i fotogrammi (requestAnimationFrame) non arrivano e le animazioni dei giochi
  // (es. la regia dello studio) restano ferme: qui arrivano comunque, ogni 16 ms
  w.requestAnimationFrame = cb => w.setTimeout(() => cb(w.performance.now()), 16);
  w.cancelAnimationFrame = id => w.clearTimeout(id);
  // nelle prove i suoni possono non partire (es. spenti apposta su localhost) e allora stop() di un suono lancia un errore:
  // qui l'errore non esce, così non ferma lo spettacolo dello studio (es. la fanfara della classifica finale)
  try {
    const AS = w.AudioScheduledSourceNode && w.AudioScheduledSourceNode.prototype, stop = AS && AS.stop;
    if (stop) AS.stop = function () { try { return stop.apply(this, arguments); } catch (e) {} };
  } catch (e) {}
};
// apre un telefono: opz = { hash: "gioco=tris&stanza=ABCD", x: posizione, profilo: false|{...}, offline: true, prima: w => {...} }
// (offline: la parte dei profili non si carica finché nella pagina non si fa w.__offline = false)
// (prima: si fa prima che parta l'app, anche dopo una ricarica). Restituisce la finestra.
// (profilo: { nome: "Paky", uid: "finto-Paky" } = lo stesso profilo di un altro telefono: apriTel("Paky2", { profilo: … });
//  orologio: ms = l'orologio del telefono avanti o indietro, vedi spostaOrologio)
// (salaSempre: true = "Online" apre la Sala della serata, come per chi gioca. Di partenza i telefoni finti hanno
//  localStorage "sg-sala-sempre" = "0": il percorso di prima, quello degli scenari vecchi. Vale dalla prima apertura
//  del telefono, o quando lo si ripassa ad apriTel; le ricariche tengono la memoria com'è)
window.apriTel = async function (nome, opz) {
  const chiesto = !!(opz && Object.prototype.hasOwnProperty.call(opz, "salaSempre")), nuovo = !BR.mem[nome];
  opz = Object.assign({}, BR.tel[nome] ? BR.tel[nome].opz : {}, opz || {});
  const vecchio = document.getElementById("tel-" + nome); if (vecchio) vecchio.remove();
  if (BR.congelati) delete BR.congelati[nome];   // (un telefono che si apre non è più fermo)
  const f = document.createElement("iframe"); f.id = "tel-" + nome;
  f.src = "/index.html?v=prova" + (opz.hash ? "#" + opz.hash : "");
  const x = opz.x != null ? opz.x : 185 * Object.keys(BR.tel).length;
  f.style.cssText = "position:absolute;top:0;left:" + x + "px;width:360px;height:740px;border:0;background:#000;transform-origin:0 0;transform:scale(.5)";
  document.body.appendChild(f);
  preparaFinestra(f.contentWindow, nome, opz);
  if (nuovo || chiesto) { const l = BR.mem[nome].l; if (opz.salaSempre) delete l["sg-sala-sempre"]; else l["sg-sala-sempre"] = "0"; }
  BR.tel[nome] ={ f, opz: Object.assign({}, opz, { hash: null, x }) };
  await new Promise(r => { f.onload = r; });
  const w = f.contentWindow;
  // i collegamenti da ospite di questo telefono (per mandare mosse a mano: reteDi(nome).invia({...}))
  const ent = w.SGNet && w.SGNet.entra;
  if (ent) w.SGNet.entra = function (cod, cb, o) { const h = ent.apply(this, arguments); if (h) { h.__sala = !!(o && o.tieni); (w.__reti = w.__reti || []).push(h); } return h; };
  // la rete del telefono come la vede l'app (navigator.onLine): giù con w.__offline o w.__reteGiu
  try { Object.defineProperty(w.navigator, "onLine", { configurable: true, get: () => !w.__offline && !w.__reteGiu }); } catch (e) {}
  if (opz.prima) opz.prima(w);   // (per le prove: es. un gioco finto registrato prima che parta l'app)
  w.__permesso = true; w.SG.avviaApp();
  await dorme(300);
  return w;
};
// l'ultimo collegamento da ospite (non la Sala) ancora aperto di un telefono
window.reteDi = nome => { const w = finestra(nome); return ((w && w.__reti) || []).filter(h => !h.__sala && !(h.stato && h.stato().chiusa)).pop() || null; };
window.vmDi = cod => { const s = statoStanza(cod); return s && (s.vm || s); };
window.finestra = nome => { const f = document.getElementById("tel-" + nome); return f && f.contentWindow; };
window.dorme = ms => new Promise(r => setTimeout(r, ms));
// aspetta che cond() sia vera (ogni 100 ms, al massimo ms); restituisce il valore o null
window.aspetta = async function (cond, ms, passo) {
  const fine = Date.now() + (ms || 5000);
  while (Date.now() < fine) { let v = null; try { v = cond(); } catch (e) {} if (v) return v; await dorme(passo || 100); }
  return null;
};
window.testo = w => (w && w.document && w.document.body ? w.document.body.innerText : "");
// tocca il primo tasto (o tessera) che contiene il testo (o la regex); true se l'ha trovato
window.clicca = function (w, cerca, sel) {
  const re = cerca instanceof RegExp ? cerca : new RegExp(String(cerca).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const n = [...w.document.querySelectorAll(sel || "button, .tessera, .modo-grande, [role=button]")].find(b => re.test(b.innerText || b.textContent || "") && !b.disabled);
  if (!n) return false;
  n.click(); return true;
};
// i collegamenti vivi di un telefono
window.viviDi = nome => (BR.perNome[nome] || []).filter(c => c.connected && !c.morto);
window.spegni = nome => viviDi(nome).forEach(c => c.sparisci());
window.riaccendi = nome => (BR.perNome[nome] || []).filter(c => c.frozen && !c.morto).forEach(c => c.torna());
window.inciampa = (nome, ms) => viviDi(nome).forEach(c => c.inciampa(ms));
// il telefono si ferma ma il broker non se n'è accorto (niente testamento): non manda e non riceve niente.
// (la pagina va avanti: è solo la rete che tace. spegni(nome) dopo congela = il broker se ne accorge e manda il testamento)
window.congela = nome => {
  BR.congelati = BR.congelati || {}; BR.congelati[nome] = true;
  viviDi(nome).forEach(c => { c.__gelo = true; c.frozen = true; BR.clients = BR.clients.filter(x => x !== c); });
};
// riparte da dove era (gli stessi collegamenti, gli stessi topic: quello che è passato intanto è perso)
window.scongela = nome => {
  if (BR.congelati) delete BR.congelati[nome];
  (BR.perNome[nome] || []).filter(c => c.__gelo && !c.morto).forEach(c => {
    delete c.__gelo; c.frozen = false;
    if (!BR.clients.includes(c)) BR.clients.push(c);
    if (!c.connected) { c.connected = true; c.emit("connect"); }   // (nato mentre era fermo)
  });
};
// quanti collegamenti ha aperto quel telefono da quando c'è (ricariche e sbirciate comprese)
window.contaCollegamenti = nome => (BR.perNome[nome] || []).length;
// la pagina si ricarica: i collegamenti cadono di colpo (il broker manda i testamenti), poi la pagina riparte
// senza il "#..." (l'app l'ha già tolto dall'indirizzo) e con la stessa memoria
window.ricarica = async function (nome, opz) {
  (BR.perNome[nome] || []).forEach(c => { if (c.connected) c.sparisci(); c.morto = true; });
  await dorme(50);
  return apriTel(nome, Object.assign({ hash: null }, opz || {}));
};
// l'app si chiude (il sessionStorage si perde) e poi si riapre
window.chiudiApp = async function (nome, opz) {
  (BR.perNome[nome] || []).forEach(c => { if (c.connected) c.sparisci(); c.morto = true; });
  if (BR.mem[nome]) BR.mem[nome].s = {};
  await dorme(50);
  return apriTel(nome, Object.assign({ hash: null }, opz || {}));
};
// il codice dell'ultima stanza aperta (dall'annuncio trattenuto "meta") e la sua foto trattenuta
window.codici = () => Object.keys(BR.retained).filter(k => k.endsWith("/meta")).map(k => k.split("/")[2]);
window.statoStanza = cod => { try { return JSON.parse(BR.retained["seratagiochi/v1/" + cod + "/stato"] || "null"); } catch (e) { return null; } };
// l'host apre una stanza online di un gioco (nome come nella tessera, es. "Tris"): restituisce il codice
window.apriStanza = async function (w, nomeGioco) {
  const tess = await aspetta(() => [...w.document.querySelectorAll(".tessera")].find(t => (t.querySelector("h2") || {}).textContent === nomeGioco), 5000);
  if (!tess) throw new Error("non trovo la tessera " + nomeGioco);
  tess.click(); await dorme(200);
  if (!clicca(w, /apro io/)) throw new Error("non trovo 'Online: apro io la stanza'");
  await dorme(200);
  if (!clicca(w, /Apri la stanza/)) throw new Error("non trovo 'Apri la stanza'");
  const cod = await aspetta(() => { const b = w.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }, 5000);
  if (!cod) throw new Error("la stanza non ha il codice");
  return cod;
};
// gli errori di tutti i telefoni (script e broker)
window.erroriTel = () => Object.keys(BR.tel).flatMap(n => ((finestra(n) || {}).__err || []).map(e => n + ": " + e)).concat(BR.log.filter(l => l.startsWith("ERR")));

// ===== ESEMPIO =====
// L'host "Paky" apre Parola d'ordine e fanno entrare Giulia, Luca e Sara dal link.
// (per un altro gioco cambia "Parola d'ordine" e "gioco=ordine")
const host = await apriTel("Paky", { x: 0 });
window.CODICE = await apriStanza(host, "Parola d'ordine");
for (const [i, n] of ["Giulia", "Luca", "Sara"].entries()) await apriTel(n, { hash: "gioco=ordine&stanza=" + CODICE, x: 185 * (i + 1) });
await aspetta(() => (statoStanza(CODICE) || { vm: { players: [] } }).vm.players.length === 4, 8000);
"pronti " + CODICE + " · errori: " + erroriTel().length;
