/* Monta i pezzi delle pagine di prova: data-tre, data-facce, data-lista, data-chip, data-sala, data-coppia = "oggi" | "A" | "B" | "C" | "D".
   "oggi" usa le foto vere (img/oggi-*.png), le strade disegnano con AV.disegna. */
(function () {
  "use strict";
  var NOMI = ["Paky", "Luca", "Giulia"], n = 0;
  function av(nome, st, vista) {
    if (st === "oggi") return "<img src='img/oggi-" + (vista === "busto" ? "faccia-" : "") + nome.toLowerCase() + ".png' alt='" + nome + " oggi'>";
    return AV.disegna(nome, st, vista, "k" + (n++) + st);
  }
  function tutti(attr, fn) { Array.prototype.forEach.call(document.querySelectorAll("[" + attr + "]"), function (el) { el.innerHTML = fn(el.getAttribute(attr), el); }); }
  tutti("data-tre", function (st) { return NOMI.map(function (x) { return "<figure>" + av(x, st, "intero") + "<figcaption>" + x + "</figcaption></figure>"; }).join(""); });
  tutti("data-facce", function (st, el) {
    var m = el.getAttribute("data-misura") || "96";
    return NOMI.map(function (x) { return "<span class='tondo t" + m + "'>" + av(x, st, "busto") + "</span>"; }).join("");
  });
  tutti("data-lista", function (st) {
    var punti = ["2.450", "1.980", "1.250"];
    return [2, 0, 1].map(function (i, k) { return "<div class='riga'><span class='pos'>" + (k + 1) + "</span><span class='tondo t54'>" + av(NOMI[i], st, "busto") + "</span><span class='nome'>" + NOMI[i] + "</span><span class='punti'>" + punti[k] + " punti</span></div>"; }).join("");
  });
  tutti("data-chip", function (st) { return "<span class='chip'><span class='tondo t30'>" + av("Paky", st, "busto") + "</span><b>Paky</b><span class='lv'>Lv 1</span></span>"; });
  tutti("data-sala", function (st, el) {
    if (st === "oggi") { el.classList.add("foto"); return "<img src='img/oggi-sala.png' alt='La saletta di oggi'>"; }
    return "<div class='arco'></div><span class='quanti'>3 in sala</span><div class='tit'>SALA D'ATTESA</div>" +
      "<div class='posto l'>" + av("Luca", st, "intero") + "<span class='tag'>Luca</span></div>" +
      "<div class='posto p'>" + av("Paky", st, "intero") + "<span class='tag tu'>♔ Tu</span></div>" +
      "<div class='posto g'>" + av("Giulia", st, "intero") + "<span class='tag'>Giulia</span></div>";
  });
  var vic = document.getElementById("vicino");   // la griglia delle facce grandi (solo nel confronto)
  if (vic) {
    var col = ["oggi", "A", "B", "C", "D"], h = col.map(function (c) { return "<div class='testa'>" + (c === "oggi" ? "Oggi" : "Strada " + c) + "</div>"; }).join("");
    NOMI.forEach(function (x) { col.forEach(function (c) { h += "<span class='tondo'>" + av(x, c, "busto") + "</span>"; }); });
    vic.innerHTML = h;
  }
  tutti("data-coppia", function (st, el) {
    var x = el.getAttribute("data-nome") || "Giulia";
    return "<figure><span class='et'>Oggi</span>" + av(x, "oggi", "busto") + "</figure><figure class='nuovo'><span class='et'>Proposta " + st + "</span>" + av(x, st, "busto") + "</figure>";
  });
})();
