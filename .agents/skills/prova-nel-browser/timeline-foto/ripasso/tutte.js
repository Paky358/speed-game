// tutte.json: ogni carta della Linea del tempo con la sua foto di oggi (o null), anno e spiegazione
var fs = require("fs"), vm = require("vm"), path = require("path");
var SG = process.argv[2] || "D:/SG-linea2", ctx = { window: {} }; vm.createContext(ctx);
fs.readdirSync(path.join(SG, "data")).filter(function (f) { return /^eventi-.*\.js$/.test(f) || f === "linea-foto.js"; }).forEach(function (f) { vm.runInContext(fs.readFileSync(path.join(SG, "data", f), "utf8"), ctx); });
var F = ctx.window.SG_TL_FOTO || {}, out = [], n = 0;
(ctx.window.SG_CATEGORIE || []).forEach(function (c) {
  c.eventi.forEach(function (e) { var id = c.id + "|" + e.titolo, f = F[id]; var s = f ? String(f).split("|") : null;
    out.push({ n: ++n, id: id, cat: c.id, nome: e.titolo, anno: e.anno, desc: e.fatto || "", path: s ? s[0] : null, w: s ? +s[1] || 0 : 0 }); });
});
fs.writeFileSync("tutte.json", JSON.stringify(out));
var per = {}; out.forEach(function (x) { per[x.cat] = per[x.cat] || [0, 0]; per[x.cat][0]++; if (x.path) per[x.cat][1]++; });
console.log(out.length + " carte, con foto " + out.filter(function (x) { return x.path; }).length); console.log(JSON.stringify(per));
var orfani = Object.keys(F).filter(function (k) { return !out.some(function (x) { return x.id === k; }); }); console.log("foto senza carta: " + orfani.length, orfani.slice(0, 5));
