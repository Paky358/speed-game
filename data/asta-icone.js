/* =========================================================
   ICONE DISEGNATE — per le carte dell'Asta dove l'emoji non basta.
   Le armi da fuoco in Unicode hanno solo 🔫, che sui telefoni
   diventa una pistola ad acqua giocattolo: fucile a pompa, canna
   mozza, mitragliatrice sembrerebbero tutti la stessa cosa sbagliata.
   Qui disegniamo icone vere. Nelle carte l'emoji diventa un
   segnaposto "svg:nome" e il gioco pesca l'SVG da questa mappa.
   Riempimento chiaro + contorno scuro: si leggono sia sulla
   medaglia scura (lista) sia su quella dorata (carta grande).
   ========================================================= */
(function () {
  var S = "width:1.1em;height:1.1em;display:inline-block;vertical-align:-0.16em";
  var G = 'fill="#eceef2" stroke="#13161d" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
  function svg(inner) {
    return '<svg viewBox="0 0 64 64" style="' + S + '" aria-hidden="true"><g ' + G + '>' + inner + '</g></svg>';
  }
  // dettaglio: linea sottile scura interna (eredita il colore del contorno)
  var D = 'fill="none" stroke-width="1.5"';
  window.SG_ICONE = {
    // PISTOLA: carrello, mirino, ponticello con grilletto, impugnatura zigrinata
    "svg:pistola": svg(
      '<path d="M7 20 L10 20 L10 22 L43 22 L43 19 L47 19 L47 29 L44 47 L34 47 L30 29 L10 29 L10 25 L7 25 Z"/>' +
      '<path d="M11 25 L42 25" ' + D + '/>' +
      '<path d="M24 29 Q26 36 31 35" ' + D + '/>' +
      '<path d="M27 30 L27 33" ' + D + '/>' +
      '<path d="M35 33 L41 33 M35 37 L40 37 M36 41 L39 41" ' + D + '/>'),
    // FUCILE A POMPA: canna lunga, tubo magazzino, pompa zigrinata, calcio, ponticello
    "svg:fucile": svg(
      '<path d="M2 25 L38 25 L38 22 L46 22 L58 25 L58 33 L48 33 L44 33 L44 30 L2 30 Z"/>' +
      '<path d="M12 30 L23 30 L23 36 L12 36 Z"/>' +
      '<path d="M14 32 L21 32 M14 34 L21 34" ' + D + '/>' +
      '<path d="M2 27.5 L38 27.5" ' + D + '/>' +
      '<path d="M40 33 Q42 38 46 37" ' + D + '/>' +
      '<path d="M47 24 L56 26" ' + D + '/>'),
    // CANNA MOZZA: doppia canna corta, cane, calcio a pistola, ponticello
    "svg:mozza": svg(
      '<path d="M6 24 L30 24 L30 22 L35 22 L47 27 L45 39 L34 35 L30 33 L30 31 L6 31 Z"/>' +
      '<path d="M6 27.5 L30 27.5" ' + D + '/>' +
      '<path d="M31 22 L33 20 L35 22" ' + D + '/>' +
      '<path d="M30 33 Q32 37 36 36" ' + D + '/>' +
      '<path d="M37 30 L42 32 M36 34 L40 36" ' + D + '/>'),
    // MITRAGLIATRICE: canna, mirino, caricatore curvo, impugnatura, calcio
    "svg:mitra": svg(
      '<path d="M2 24 L20 24 L20 22 L23 22 L23 24 L34 24 L34 21 L50 21 L60 25 L60 31 L50 31 L34 31 L34 27 L2 27 Z"/>' +
      '<path d="M30 31 Q30 40 26 47 L34 47 Q38 39 39 31 Z"/>' +
      '<path d="M42 31 L48 31 L46 42 L40 42 Z"/>' +
      '<path d="M36 31 Q37 35 41 34" ' + D + '/>' +
      '<path d="M50 24 L58 26" ' + D + '/>')
  };
})();
