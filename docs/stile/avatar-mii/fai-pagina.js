// La pagina di confronto in un file solo (da mandare al proprietario): dentro il disegno degli avatar e i dati dei Bot e dei look.
// "C:\Program Files\nodejs\node.exe" docs\stile\avatar-mii\fai-pagina.js   (dalla cartella del progetto)
// Prima rifà dati.js da js/core.js, così i Bot e i look sono sempre quelli dell'app.
const fs = require("fs"), path = require("path");
const QUI = __dirname, RADICE = path.join(QUI, "..", "..", "..");
const core = fs.readFileSync(path.join(RADICE, "js", "core.js"), "utf8");
function prendi(nome) {   // il valore di "var NOME = [...]" o "{...}", contando le parentesi (e saltando le stringhe)
  const i = core.indexOf("var " + nome + " = "); if (i < 0) throw new Error("manca " + nome);
  let j = core.indexOf("=", i) + 1; while (core[j] === " ") j++;
  const ap = core[j], ch = ap === "[" ? "]" : "}"; let d = 0, k = j, str = null;
  for (; k < core.length; k++) {
    const c = core[k];
    if (str) { if (c === "\\") { k++; continue; } if (c === str) str = null; continue; }
    if (c === '"' || c === "'") { str = c; continue; }
    if (c === ap) d++; else if (c === ch && !--d) break;
  }
  return core.slice(j, k + 1);
}
const dati = "// Dati presi da js/core.js (i Bot di partenza e i look pronti) per la pagina di confronto. Rifatto da fai-pagina.js\n" +
  "var BOT_PARTENZA = " + prendi("BOT_PARTENZA") + ";\nvar LOOK_BASE = " + prendi("LOOK_BASE") + ";\nvar LOOK = " + prendi("LOOK") + ";\n";
fs.writeFileSync(path.join(QUI, "dati.js"), dati);
let pag = fs.readFileSync(path.join(QUI, "confronto.html"), "utf8");
const omino = fs.readFileSync(path.join(RADICE, "js", "omino.js"), "utf8");
function dentro(js) { return "<script>\n" + js.replace(/<\/script/gi, "<\\/script") + "\n</script>"; }
pag = pag.replace('<script src="../../../js/omino.js"></script>', () => dentro(omino)).replace('<script src="dati.js"></script>', () => dentro(dati));
if (/src="(\.\.\/|dati)/.test(pag)) throw new Error("è rimasto un file esterno");
const fuori = path.join(QUI, "avatar-prima-e-dopo.html");
fs.writeFileSync(fuori, pag);
console.log(fuori, Math.round(pag.length / 1024) + " KB");
