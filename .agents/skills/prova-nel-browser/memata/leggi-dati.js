// legge data/memata.js e torna l'elenco (per gli script di lavoro)
module.exports = function (f) { const s = require("fs").readFileSync(f || "D:/SG-meme/data/memata.js", "utf8"); const w = {}; new Function("window", s)(w); return w.SG_MEMATA; };
