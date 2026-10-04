// Telefoni finti collegati tra loro (finto broker MQTT), per provare i giochi online in una pagina sola.
// Uso: servi la cartella (es. http://localhost:8972), apri una pagina del sito e incolla questo nella console
// (o nello strumento javascript del browser, che accetta "await"). Apre l'host "Paky" su Parola d'ordine
// e fa entrare Giulia, Luca e Sara; per un altro gioco cambia il nome cercato e "gioco=ordine".
// Poi: window.CODICE = codice stanza; la partita = JSON.parse(BR.retained["seratagiochi/v1/" + CODICE + "/stato"]).vm
// Profili finti, mai account veri. Per provare gli XP aggiungi in prepara() SGNube.progressione e SGNube.aggiungiXp finti.
document.open(); document.write('<!doctype html><body style="margin:0;background:#333;position:relative"></body>'); document.close();
window.BR = { clients: [], retained: {}, log: [], perNome: {} };
window.creaClient = function (nome, opts) {
  const c = { nome, opts, h: {}, subs: new Set(), connected: false, frozen: false,
    on(ev, fn) { (this.h[ev] = this.h[ev] || []).push(fn); return this; },
    emit(ev, ...a) { (this.h[ev] || []).forEach(f => { try { f(...a); } catch (e) { BR.log.push("ERR " + nome + ": " + e.message); } }); },
    subscribe(topic, cb) { this.subs.add(topic); setTimeout(() => { if (cb) cb(); const r = BR.retained[topic]; if (r) this.deliver(topic, r, true); }, 5); },
    publish(topic, payload, o) { if (!this.connected || this.frozen) return; if (o && o.retain) BR.retained[topic] = payload;
      BR.clients.forEach(k => { if (k.connected && !k.frozen && k.subs.has(topic)) k.deliver(topic, payload, false); }); },
    deliver(topic, payload, ret) { setTimeout(() => { if (this.connected && !this.frozen) this.emit("message", topic, { toString: () => payload }, { retain: ret }); }, 4); },
    end() { this.connected = false; BR.clients = BR.clients.filter(x => x !== this); },
    // sparisci() = telefono che si spegne all'improvviso (il broker manda il "testamento"); torna() = si riaccende
    sparisci() { this.connected = false; this.frozen = true; BR.clients = BR.clients.filter(x => x !== this);
      const w = this.opts && this.opts.will; if (w) BR.clients.forEach(k => { if (k.connected && k.subs.has(w.topic)) k.deliver(w.topic, w.payload, false); }); },
    torna() { this.frozen = false; this.connected = true; this.subs = new Set(); BR.clients.push(this); this.emit("connect"); }
  };
  BR.clients.push(c); (BR.perNome[nome] = BR.perNome[nome] || []).push(c);
  setTimeout(() => { c.connected = true; c.emit("connect"); }, 10);
  return c;
};
window.nuovoTel = function (nome, src, x) { const f = document.createElement("iframe"); f.id = nome; f.src = src;
  f.style.cssText = "position:absolute;top:0;left:" + x + "px;width:360px;height:740px;border:0;background:#000;transform-origin:0 0;transform:scale(.5)"; document.body.appendChild(f); return f; };
window.prepara = function (w, nome) {
  w.__fp = { nome, fiches: {}, omino: w.SGOmino.casuale(nome) };
  w.SGNube.disponibile = () => true; w.SGNube.pronto = () => true; w.SGNube.profilo = () => w.__fp;
  w.SGNube.salvaProgressi = () => {}; w.SGNube.statGioco = () => ({}); w.SGNube.salvaFiches = () => {}; w.SGNube.salvaOmino = () => {};
  w.SGNube.lista = () => []; w.SGNube.salvaLista = () => {};
  w.mqtt = { connect: (url, opts) => window.creaClient(nome, opts) };
  w.__err = []; w.addEventListener("error", e => w.__err.push(e.message + " @" + (e.filename || "").split("/").pop() + ":" + e.lineno));
};
nuovoTel("Paky", "/index.html?v=prova", 0);
await new Promise(r => setTimeout(r, 2800));
const w = document.getElementById("Paky").contentWindow;
prepara(w, "Paky"); w.SG.avviaApp(); await new Promise(r => setTimeout(r, 700));
const d = w.document;
[...d.querySelectorAll("h1,h2,h3,h4")].find(x => /Parola d'ordine/.test(x.textContent)).closest("button,.card,[onclick],div").click();
await new Promise(r => setTimeout(r, 500));
[...d.querySelectorAll(".modo-grande")].find(b => /apro io/.test(b.innerText)).click();
await new Promise(r => setTimeout(r, 500));
[...d.querySelectorAll("button")].find(b => /Apri la stanza/.test(b.innerText)).click();
await new Promise(r => setTimeout(r, 600));
window.CODICE = Object.keys(BR.retained).find(k => k.endsWith("/meta")).split("/")[2];
const nomi = ["Giulia", "Luca", "Sara"];
for (let i = 0; i < nomi.length; i++) {
  nuovoTel(nomi[i], "/index.html?v=prova#gioco=ordine&stanza=" + CODICE, 185 * (i + 1));
  await new Promise(r => setTimeout(r, 2500));
  const g = document.getElementById(nomi[i]).contentWindow;
  try { g.localStorage.removeItem("sg-id-" + CODICE); } catch (e) {}
  prepara(g, nomi[i]); g.SG.avviaApp();
  await new Promise(r => setTimeout(r, 1100));
}
"pronti " + CODICE;
