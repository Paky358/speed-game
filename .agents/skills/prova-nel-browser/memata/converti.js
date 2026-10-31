// Dai modelli raccolti (modelli.jsonl) al file del gioco (data/memata.js).
// node converti.js <modelli.jsonl> <uscita.js> [togli.json] [ritocchi.json]
// togli.json: gli id (base 36) da non usare, con il perché ({ id: "motivo" }, o anche solo un elenco di id)
// ritocchi.json: { id: riquadri } per i modelli corretti a mano con lo strumentino
const fs = require("fs");
const [, , IN, OUT, TOGLI, RITOCCHI] = process.argv;
const tj = TOGLI && fs.existsSync(TOGLI) ? JSON.parse(fs.readFileSync(TOGLI, "utf8")) : [];
const togli = new Set(Array.isArray(tj) ? tj : Object.keys(tj));
const rit = RITOCCHI && fs.existsSync(RITOCCHI) ? JSON.parse(fs.readFileSync(RITOCCHI, "utf8")) : {};
const L = fs.readFileSync(IN, "utf8").trim().split("\n").map(r => JSON.parse(r)).filter(x => x.ok);
const visti = new Set(), out = [];
const n1 = v => Math.round(v);
L.sort((a, b) => a.pos - b.pos);
let senza = 0, scartati = 0;
for (const x of L) {
  if (x.sfw !== "yes" || !/^(jpg|jpeg|png)$/.test(x.tipo) || !x.w || !x.h) { scartati++; continue; }
  const id = Number(x.id).toString(36);
  if (visti.has(id) || togli.has(id)) { scartati++; continue; }
  visti.add(id);
  let box = (x.box || []).filter(b => b && (b.type === "text" || !b.type)).map(b => {
    const q = [n1(b.x / x.w * 1000), n1(b.y / x.h * 1000), n1(b.w / x.w * 1000), n1(b.h / x.h * 1000)];
    // fuori dall'immagine: si riporta dentro
    q[0] = Math.max(0, Math.min(990, q[0])); q[1] = Math.max(0, Math.min(990, q[1]));
    q[2] = Math.max(10, Math.min(1000 - q[0], q[2])); q[3] = Math.max(10, Math.min(1000 - q[1], q[3]));
    const f = String(b.font || "impact").toLowerCase() === "impact" ? "i" : "a", o = {};
    const def = f === "a" ? { c: "#000000", o: "#ffffff", cp: false } : { c: "#ffffff", o: "#000000", cp: true };
    if (f === "a") o.f = "a";
    let r = Number(b.rotation || 0) % 360; if (r > 180) r -= 360; if (Math.abs(r) >= 1) o.r = Math.round(r);
    const c = String(b.font_color || def.c).toLowerCase(), oc = String(b.outline_color || def.o).toLowerCase();
    if (c !== def.c) o.c = c;
    if (oc !== def.o) o.o = oc;
    const cp = b.force_caps == null ? def.cp : !!b.force_caps; if (cp !== def.cp) o.cp = cp ? 1 : 0;
    if (b.text_align && b.text_align !== "center") o.al = b.text_align;
    if (b.vertical_align && b.vertical_align !== "middle") o.va = b.vertical_align;
    if (Object.keys(o).length) q.push(o);
    return q;
  });
  if (rit[id]) box = rit[id];
  if (!box.length) senza++;
  out.push([id, x.tipo === "png" ? "png" : "jpg", x.w, x.h, box.length ? box : 0, String(x.nome).slice(0, 60)]);
}
const testa = "/* 😂 Memata: i modelli dei meme (da Imgflip, in ordine di quanto sono usati).\n" +
  "   [id, estensione, larghezza, altezza, riquadri (0 = il classico sopra e sotto), nome]\n" +
  "   riquadri: [x, y, larghezza, altezza, {opzioni}] in millesimi dell'immagine; i riquadri sono quelli del generatore di Imgflip.\n" +
  "   Le immagini NON stanno qui: il gioco le chiede a i.imgflip.com. Rifatto con lo script converti.js (cartella di lavoro su D). */\n";
fs.writeFileSync(OUT, testa + "window.SG_MEMATA = [\n" + out.map(r => JSON.stringify(r)).join(",\n") + "\n];\n");
console.log("modelli", out.length, "senza riquadri (classico)", senza, "scartati", scartati);
