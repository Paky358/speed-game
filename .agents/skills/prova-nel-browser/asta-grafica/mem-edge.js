// quanta memoria usa Edge in tutto (e il processo più grande), per le prove lunghe
const cp = require("child_process");
module.exports = function memEdge() {
  try {
    const o = cp.execSync('tasklist /FI "IMAGENAME eq msedge.exe" /FO CSV /NH', { encoding: "utf8" });
    let t = 0, mx = 0;
    o.trim().split(/\r?\n/).forEach(function (l) { const m = l.match(/"([\d.,]+) K"/); if (m) { const k = +m[1].replace(/[.,]/g, ""); t += k; mx = Math.max(mx, k); } });
    return "edge " + Math.round(t / 1024) + " MB (il più grande " + Math.round(mx / 1024) + ")";
  } catch (e) { return "edge ?"; }
};
