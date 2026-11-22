// candidati.json → lista piatta di { path, w } per scarica.js. node piatta.js candidati.json out.json
var fs = require("fs"), c = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), out = [];
Object.keys(c).forEach(function (id) { (c[id] || []).forEach(function (k) { out.push({ path: k.path, w: k.w }); }); });
fs.writeFileSync(process.argv[3], JSON.stringify(out)); console.log(out.length + " candidate");
