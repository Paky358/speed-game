/* Monta le tre inquadrature di una strada nella pagina (o una sola con ?solo=largo|leggio|schermo) */
(function () {
  "use strict";
  var strada = document.body.getAttribute("data-strada");
  var solo = (location.search.match(/solo=(\w+)/) || [])[1];
  function adatta() {
    document.querySelectorAll(".cornice").forEach(function (c) { c.style.setProperty("--k", (c.clientWidth / 390).toFixed(4)); });
  }
  Studio2.pronto().then(function () {
    if (solo) {
      document.body.classList.add("solo");
      Studio2.monta(document.getElementById("solo"), strada, solo);
    } else {
      document.querySelectorAll("[data-shot]").forEach(function (box) { Studio2.monta(box, strada, box.getAttribute("data-shot")); });
      adatta(); window.addEventListener("resize", adatta);
      var c = document.querySelector(".carica"); if (c) c.remove();
    }
    // le immagini dentro l'SVG arrivano un attimo dopo: aspetto un giro prima di dire "pronto"
    setTimeout(function () { document.body.setAttribute("data-pronto", "1"); }, 900);
  });
})();
