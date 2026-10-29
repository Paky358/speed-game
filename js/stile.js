// =========================================================
//  SPeeD GAME — lo stile dell'app: «🌙 Notte vivace» (deciso dal proprietario il 28 ott 2026, al posto
//  del «Bianco e oro» del 26 ott; la classe .oro e le variabili --o-* hanno tenuto il nome di prima)
//  - SGStile.marca(schermata): la schermata del core prende lo stile dell'app (classe .oro)
//  - SGStile.aggiorna: il fondo della pagina e lo sfondo animato (js/sfondo.js) solo dietro le schermate del core
//  - i simboli puliti: nelle schermate .oro l'emoji all'inizio di un testo (es. "🔗 Gioca online")
//    si vede come un simbolo a linea colorato. Il testo resta identico (textContent uguale):
//    l'emoji è solo avvolta in <span class="emo" data-e="🔗"> e nascosta dal CSS.
//  I colori stanno in css/styles.css (sezione «NOTTE VIVACE», variabili --o-* e --n-*): qui solo i disegni.
// =========================================================
(function () {
  "use strict";

  // disegni 24×24 a linea (stroke = il colore del testo, via maschera CSS)
  var D = {
    corona: '<path d="M4 18h16M5 18 3.5 8l5 4L12 5l3.5 7 5-4L19 18"/>',
    occhio: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    coppa: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5c0 3 1.2 4.3 3.7 4.3M16 6h3.5c0 3-1.2 4.3-3.7 4.3M12 13v4M8.5 20h7M10 17h4v3h-4z"/>',
    gente: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6M16 4.8a3.2 3.2 0 0 1 0 6.4M18 14.2c2 .7 3 2.6 3 5.8"/>',
    persona: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20.5c0-4 3.1-6.6 7-6.6s7 2.6 7 6.6"/>',
    casa: '<path d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5.5h4V20"/>',
    gioco: '<path d="M7 8h10a4.5 4.5 0 0 1 4.3 5.7l-1 3.4a2.4 2.4 0 0 1-4 1L14 16h-4l-2.3 2.1a2.4 2.4 0 0 1-4-1l-1-3.4A4.5 4.5 0 0 1 7 8z"/><path d="M8 10.5v3M6.5 12h3"/><circle cx="15.5" cy="11.2" r=".6"/><circle cx="17" cy="13" r=".6"/>',
    spunta: '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.8 2.8L16.2 9.5"/>',
    puntina: '<path d="M9 3.5h6M10 3.5v6l-3 3.5h10l-3-3.5v-6M12 13v7.5"/>',
    urna: '<path d="M4 11h16v9H4zM8 11V4.5h8V11M10 7.5l1.5 1.5L14 6.3M8 15h8"/>',
    spade: '<path d="M4 4l9.5 9.5M4 4h3.5L17 13.5M4 4v3.5L13.5 17M14.5 12.5l-2 2M16 16l4 4M20 4l-6.5 6.5M20 4h-3.5M20 4v3.5M11.5 15.5 8 19M8 16l-4 4"/>',
    mano: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6 7-2.4 0-3.9-1-5.2-3.2L4 14.5a1.5 1.5 0 0 1 2.4-1.8L8 14.5"/>',
    giro: '<path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v4.5h-4.5"/>',
    indietroGiro: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/>',
    festa: '<path d="M4 20 8.5 8.5l7 7zM13 4.5l.5 2M18.5 9.5l2-.5M16 7l2.5-2.5M10 7.5c1-1.5 1.2-3 .5-4M16.5 13c1.5-1 3-1.2 4-.5"/>',
    piu: '<path d="M12 5v14M5 12h14"/>',
    esci: '<path d="M14 4H6v16h8M10 12h10M17 8.5 20.5 12 17 15.5"/>',
    condividi: '<path d="M12 15V3.5M8 7.5l4-4 4 4M5 13v7h14v-7"/>',
    ripeti: '<path d="M4 9.5h13l-3-3M20 14.5H7l3 3"/>',
    bandiera: '<path d="M5 21V4M5 4h12l-2.5 4.5L17 13H5"/>',
    lucchetto: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    aperto: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 7.7-1.5"/>',
    clessidra: '<path d="M6.5 3.5h11M6.5 20.5h11M8 3.5c0 5 8 5.5 8 8.5s-8 3.5-8 8.5M16 3.5c0 5-8 5.5-8 8.5s8 3.5 8 8.5"/>',
    matita: '<path d="M4 20l1-4.5L16 4.5l3.5 3.5L8.5 19zM14 7l3.5 3.5"/>',
    pollice: '<path d="M7.5 10.5v9.5H4v-9.5zM7.5 10.5 11 3.5c1.6 0 2.6 1.2 2.3 2.8L12.7 9.5h5.6a2 2 0 0 1 2 2.4l-1.4 6.4a2.2 2.2 0 0 1-2.2 1.7H7.5"/>',
    lista: '<path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>',
    ingranaggio: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M5.5 18.5l1.9-1.9M16.6 7.4l1.9-1.9"/>',
    busta: '<rect x="3.5" y="5.5" width="17" height="13" rx="1.8"/><path d="m4 6.5 8 6.5 8-6.5"/>',
    chiave: '<circle cx="8" cy="15.5" r="4"/><path d="M11 12.5 19.5 4M16.5 7l3 3M14.5 9l2 2"/>',
    ruota: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.6"/><path d="M12 3.5v6.9M12 13.6v6.9M3.5 12h6.9M13.6 12h6.9M6 6l5 5M13 13l5 5M18 6l-5 5M11 13l-5 5"/>',
    ferma: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    segnale: '<path d="M5 19v-3M9.5 19v-6M14 19v-9M18.5 19V6"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    bot: '<rect x="4.5" y="8" width="15" height="11" rx="3"/><path d="M12 8V4.5M12 4.5h.01M9 13h.01M15 13h.01M9.5 16.2h5M2.5 12.5v2.5M21.5 12.5v2.5"/>',
    libro: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5V20"/>',
    chiudi: '<path d="M6 6l12 12M18 6 6 18"/>',
    saluto: '<path d="M7.5 12.5V6a1.4 1.4 0 0 1 2.8 0v5M10.3 10.5V4.5a1.4 1.4 0 0 1 2.8 0v6M13.1 10.5V5.8a1.4 1.4 0 0 1 2.8 0v6.7M15.9 12.5v-2a1.4 1.4 0 0 1 2.8 0V14c0 4-2.6 6.8-6.3 6.8-2.5 0-4.1-1.1-5.4-3.4l-2-3.5A1.4 1.4 0 0 1 7.2 12.3"/>',
    stelline: '<path d="M10 3.5 11.6 8.4 16.5 10 11.6 11.6 10 16.5 8.4 11.6 3.5 10 8.4 8.4zM17.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    avanti: '<path d="M5 6l7 6-7 6zM13 6l7 6-7 6"/>',
    moneta: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 9.5h3.8a1.6 1.6 0 0 1 0 3.2h-2.6a1.6 1.6 0 0 0 0 3.2h3.8"/>',
    salva: '<path d="M5 4h11.5L20 7.5V20H5zM8.5 4v5h6V4M8 20v-6h8v6"/>',
    tocca: '<path d="M9.5 13.5V5.2a1.6 1.6 0 0 1 3.2 0V12M12.7 11.5a1.6 1.6 0 0 1 3.2 0v1M15.9 12.2a1.6 1.6 0 0 1 3.2 0v2.6c0 3.4-2.3 6.2-6 6.2-2.3 0-3.9-1-5.1-3l-2.4-4a1.5 1.5 0 0 1 2.5-1.7l1.2 1.7"/>',
    dado: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01"/>',
    cronometro: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M9.5 2.8h5M12 2.8V6M18.5 6.5l1.5-1.5"/>',
    telefono: '<rect x="7" y="2.8" width="10" height="18.4" rx="2.2"/><path d="M11 18h2"/>',
    su: '<path d="M12 19.5V5M6 11l6-6 6 6"/>',
    torna: '<path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/>',
    nuovo: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.6 2.6M15.4 15.4 18 18M6 18l2.6-2.6M15.4 8.6 18 6"/>',
    citta: '<path d="M3 21h18M5 21V9.5l5-3V21M10 21V4l6 3v14M16 21v-9l3.5 1.6V21M13 9.5h.01M13 13h.01M13 16.5h.01"/>',
    lampadina: '<path d="M9 17.5h6M10 20.5h4M8.5 14.5a6 6 0 1 1 7 0c-.8.6-1.1 1.4-1.1 3h-4.8c0-1.6-.3-2.4-1.1-3z"/>',
    insetto: '<rect x="7.5" y="8" width="9" height="12" rx="4.5"/><path d="M9.5 8a2.5 2.5 0 0 1 5 0M12 11v9M4 13h3.5M16.5 13H20M4.5 18.5l3-1.5M19.5 18.5l-3-1.5M5 8l2.8 1.7M19 8l-2.8 1.7"/>',
    pezzo: '<path d="M5 8h3.5a2 2 0 1 1 4 0H16v3.5a2 2 0 1 1 0 4V19H12.5a2 2 0 1 0-4 0H5v-3.5a2 2 0 1 0 0-4z"/>',
    bersaglio: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    stella: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>',
    medaglia: '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 10.7 5.5 3.5h4l2.5 5M15.5 10.7l3-7.2h-4L12 8.5M12 12.5v5"/>',
    stretta: '<path d="M3 11.5 7 7.5l3 1.5 2.5-1.5L15 7.5l3 1.5L21 12M7 7.5l-3 6 3.5 3.5M10.5 18.5l-2-2M13 18l-3-3M15.5 16.5l-3.5-3.5M18 13l-4.5-4.5"/>',
    regalo: '<rect x="4" y="9" width="16" height="11.5" rx="1.5"/><path d="M3.5 9h17M12 9v11.5M12 9C10 5 6.5 5.5 7.5 8 8 9 12 9 12 9zM12 9c2-4 5.5-3.5 4.5-1-.5 1-4.5 1-4.5 1"/>',
    carte: '<rect x="8" y="4" width="11" height="15.5" rx="1.8"/><path d="M8 7.5 5 8.3l3.4 12.4 7-1.8"/>',
    fulmine: '<path d="M13 2.8 5.5 13.5h5.5L10.5 21.2 18.5 10H13z"/>',
    sedia: '<path d="M7 3.5v17M17 12v8.5M7 12h10M7 15.5h10M7 3.5h8.5V12"/>',
    bilancia: '<path d="M12 4v16M7 20h10M5 7h14M5 7l-2.5 6h5zM19 7l-2.5 6h5zM2.5 13a2.5 2 0 0 0 5 0M16.5 13a2.5 2 0 0 0 5 0"/>',
    razzo: '<path d="M12 3c3 2.2 4.5 5.5 4.5 9.5l-2 3h-5l-2-3C7.5 8.5 9 5.2 12 3zM9.5 15.5 7 18.5V21l3-1.5M14.5 15.5l2.5 3V21l-3-1.5M12 9.5h.01"/>',
    globo: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.3 3.6 5.2 3.6 8.5S14.5 18.2 12 20.5M12 3.5C9.5 5.8 8.4 8.7 8.4 12s1.1 6.2 3.6 8.5"/>',
    campana: '<path d="M6 17v-6a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4"/>',
    gioca: '<path d="M8 5.5 19 12 8 18.5z"/>',
    giu: '<path d="M6 9.5l6 6 6-6"/>',
    alto: '<path d="M6 14.5l6-6 6 6"/>',
    cuore: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10C19.5 15.4 12 20 12 20z"/>',
    calice: '<path d="M8 3.5h8l-.6 5a3.4 3.4 0 0 1-6.8 0zM12 12v8M8.5 20.5h7"/>',
    sacchetto: '<path d="M9 4.5h6l-1.5 3c4 1.5 6 5 6 8.5 0 3-2.5 4.5-7.5 4.5S4.5 19 4.5 16c0-3.5 2-7 6-8.5z"/><path d="M12 11v6M10.5 12.5h2.3a1 1 0 0 1 0 2h-1.6a1 1 0 0 0 0 2h2.3"/>',
    sonno: '<path d="M14 4h5l-5 6h5M5 12h4l-4 5h4"/>',
    orologio: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
    microfono: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/>',
    ciak: '<path d="M4 9.5h16V20H4zM4 9.5 5.5 4.5l14.5 2-1 3M9 5l2.5 4M14 5.8l2.5 3.7"/>',
    nota: '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>',
    muto: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5"/>',
    avviso: '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4.5M12 17h.01"/>',
    etichetta: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.3 7.3a1 1 0 0 1-1.4 0z"/><circle cx="8" cy="8" r="1.4"/>',
    quadro: '<rect x="3.5" y="5" width="17" height="14" rx="1.8"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17.5 5-5 3.5 3.5 2.5-2.5 4.5 4.5"/>',
  };
  // emoji → disegno (+ colore fisso per i pallini di stato)
  var MAPPA = {
    "👑": "corona", "👀": "occhio", "🏆": "coppa", "👥": "gente", "👤": "persona", "🏠": "casa", "🎮": "gioco",
    "✅": "spunta", "📌": "puntina", "🗳️": "urna", "🗳": "urna", "⚔️": "spade", "⚔": "spade", "🤺": "spade", "✋": "mano", "↻": "giro", "🔄": "giro",
    "↺": "indietroGiro", "🎉": "festa", "➕": "piu", "🚪": "esci", "📤": "condividi", "🔁": "ripeti", "🏁": "bandiera",
    "🔒": "lucchetto", "🔓": "aperto", "⏳": "clessidra", "✏️": "matita", "✏": "matita", "👍": "pollice", "📜": "lista",
    "⚙️": "ingranaggio", "⚙": "ingranaggio", "📨": "busta", "✉️": "busta", "🔑": "chiave", "🎡": "ruota", "⏹": "ferma", "⏹️": "ferma",
    "📶": "segnale", "🔗": "link", "🤖": "bot", "📖": "libro", "✕": "chiudi", "👋": "saluto", "✨": "stelline",
    "⏭": "avanti", "⏭️": "avanti", "⏩": "avanti", "🪙": "moneta", "💾": "salva", "👆": "tocca", "🎲": "dado", "⏱️": "cronometro", "⏱": "cronometro",
    "📲": "telefono", "📱": "telefono", "⬆️": "su", "↩️": "torna", "↩": "torna", "🆕": "nuovo", "🏙️": "citta", "🏙": "citta",
    "💡": "lampadina", "🐞": "insetto", "🧩": "pezzo", "🎯": "bersaglio", "⭐": "stella", "🌟": "stella", "🏅": "medaglia", "🥇": "medaglia:var(--o-m-oro-f)", "🥈": "medaglia:var(--o-m-argento-f)", "🥉": "medaglia:var(--o-m-bronzo-f)",
    "🤝": "stretta", "🎁": "regalo", "🃏": "carte", "⚡": "fulmine", "🪑": "sedia", "⚖️": "bilancia", "🚀": "razzo", "🌍": "globo",
    "🔔": "campana", "▶": "gioca", "▶️": "gioca", "⌄": "giu", "⌃": "alto", "❤️": "cuore", "💰": "sacchetto",
    "😴": "sonno", "🧠": "libro", "📚": "libro", "🎤": "microfono", "🎬": "ciak", "🎵": "nota", "🎶": "nota", "🔊": "nota", "🔇": "muto", "🕐": "orologio", "🧍": "persona", "📊": "segnale", "🏛️": "citta",
    "⚠️": "avviso", "⚠": "avviso", "🏷️": "etichetta", "🏷": "etichetta", "🖼️": "quadro", "🖼": "quadro", "✍️": "matita", "✍": "matita",
    "🟢": "#pallino:#2f9e44", "🟡": "#pallino:#d4a017", "🔴": "#pallino:#d64545"
  };
  // un emoji in testa al testo (con le sue varianti), poi uno spazio o la fine
  var RE = /^(\s*)((?:[←-⇿⌀-⏿■-◿☀-➿⬀-⯿]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDFFF])️?)(?=\s|$)/;

  function svgUrl(corpo) {
    var s = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'>" + corpo.replace(/"/g, "'") + "</svg>";
    return "url(\"data:image/svg+xml," + encodeURIComponent(s) + "\")";
  }
  // le regole dei simboli si scrivono una volta sola, all'avvio
  function scriviRegole() {
    if (document.getElementById("sg-stile-icone")) return;
    var r = [];
    for (var e in MAPPA) {
      var v = MAPPA[e], sel = '.oro .emo[data-e="' + e + '"]';
      if (v.charAt(0) === "#") { r.push(sel + "{--emo-img:none;--emo-col:" + v.split(":")[1] + ";border-radius:50%;transform:scale(.55)}"); continue; }
      var pz = v.split(":");   // "disegno:#colore" = colore fisso (le medaglie)
      r.push(sel + "{--emo-img:" + svgUrl(D[pz[0]]) + (pz[1] ? ";--emo-col:" + pz[1] : "") + "}");
    }
    var st = document.createElement("style"); st.id = "sg-stile-icone"; st.textContent = r.join("\n");
    document.head.appendChild(st);
  }

  // le emoji che sono «contenuto» e non tasti dell'app restano emoji colorate: tutto quello che disegna un gioco (impostazioni,
  // regole, saletta, le sue scelte), icone dei trofei, faccine, l'emoji di una compagnia, la tessera di un gioco senza foto,
  // l'avatar di chi non ne ha uno. Così in un gruppo di scelte non si mescolano emoji e simboli
  var CONTENUTO = ".sg-dal-gioco, .cmp-e, .sl-rr-testo, .sl-reg-tutto, .as-kit .riga .em, .as-scen .e, .as-tit .t, .sl-extra, .modo-chip, .cat-chip, .tr-ico, .at-ico, .sl-fa, .sl-faccine, .sl-faccia, .sl-bolle, .sg-fa-volante, .sg-fa-volanti, .faccina, .faccine, .cmp-em, .tessera .icona .emoji, .sg-guardo-fa, .sl-emo, .cg-emo";
  // avvolge l'emoji iniziale di un nodo di testo (solo quelle che hanno un simbolo)
  function avvolgi(t) {
    var p = t.parentNode;
    if (!p || p.nodeType !== 1 || (p.classList && p.classList.contains("emo"))) return;
    if (p.closest && p.closest(CONTENUTO)) return;
    if (/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION|svg|text|tspan)$/i.test(p.nodeName)) return;
    var m = RE.exec(t.nodeValue); if (!m) return;
    var e = m[2]; if (!MAPPA[e] && !MAPPA[e.replace(/️$/, "")]) return;
    var k = MAPPA[e] ? e : e.replace(/️$/, "");
    var resto = t.nodeValue.slice(m[0].length);
    var sp = document.createElement("span"); sp.className = "emo"; sp.setAttribute("data-e", k); sp.setAttribute("aria-hidden", "true"); sp.textContent = e;
    // simbolo e testo stanno insieme in un <span class="emo-r">: dentro un tasto (flex) restano UN pezzo solo,
    // così anche innerText resta "🔗 Gioca online" (le prove cercano i tasti per il testo)
    var r = document.createElement("span"); r.className = "emo-r";
    p.insertBefore(r, t);
    if (m[1]) r.appendChild(document.createTextNode(m[1]));
    r.appendChild(sp); r.appendChild(t);
    t.nodeValue = resto;
  }
  function pulisci(radice) {
    if (!radice || !radice.querySelectorAll) return;
    var w = document.createTreeWalker(radice, NodeFilter.SHOW_TEXT, null), n, lista = [];
    while ((n = w.nextNode())) if (RE.test(n.nodeValue)) lista.push(n);
    lista.forEach(avvolgi);
  }

  // le finestre che il core mette sopra tutto (conferme, avvisi, fogli, 3-2-1, inviti): con lo stile dell'app anche sopra un gioco
  var SOPRA = /(^|\s)(conferma-sfondo|sg-pillole|sg-ferma|rg-velo|sl-velo|sl-resta-salta|avviso-trofeo|sl-via|sg-guardo|sg-guardo-fila|ao-invito|ao-mini|sgs-voto)(\s|$)/;
  function sopra(n) { if (n.nodeType === 1 && n.parentNode === document.body && SOPRA.test(n.className || "") && !n.classList.contains("oro")) n.classList.add("oro"); }

  // si guarda tutto quello che entra nella pagina: dentro una schermata .oro i simboli si mettono subito (prima del disegno)
  var inCoda = [], previsto = false;
  function lavora() {
    previsto = false;
    var l = inCoda; inCoda = [];
    l.forEach(function (n) {
      var el = n.nodeType === 1 ? n : n.parentNode;
      if (n._pulito) { n._pulito = false; return; }   // (appena pulita da marca: non si ripassa)
      if (!el || !el.closest || !el.closest(".oro")) return;
      if (n.nodeType === 3) { if (RE.test(n.nodeValue)) avvolgi(n); } else pulisci(n);
    });
  }
  function osserva() {
    if (!window.MutationObserver || osserva.fatto) return; osserva.fatto = true;
    new MutationObserver(function (rec) {
      // durante una partita (schermata del gioco, niente finestre chiare sopra) non si guarda niente: solo le finestre nuove sul body
      var b = document.body, attivo = !!(b && (b.classList.contains("tema-oro") || b.querySelector(":scope > .oro")));
      for (var i = 0; i < rec.length; i++) {
        var r = rec[i];
        if (r.target === b && r.type === "childList") {
          for (var j0 = 0; j0 < r.addedNodes.length; j0++) { var a0 = r.addedNodes[j0]; if (a0.nodeType === 1) { sopra(a0); if (a0.classList.contains("oro")) { inCoda.push(a0); attivo = true; } } }
          continue;
        }
        if (!attivo) continue;
        if (r.type === "characterData") inCoda.push(r.target);
        else if (r.type === "attributes") { if (r.target.classList && r.target.classList.contains("oro") && !/(^|\s)oro(\s|$)/.test(r.oldValue || "")) inCoda.push(r.target); }   // (solo quando diventa .oro)
        else for (var j = 0; j < r.addedNodes.length; j++) { var a = r.addedNodes[j]; if (a.nodeType === 1 || a.nodeType === 3) inCoda.push(a); }
      }
      if (inCoda.length && !previsto) { previsto = true; (window.queueMicrotask || function (f) { Promise.resolve().then(f); })(lavora); }
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeOldValue: true, attributeFilter: ["class"] });
  }

  // il tema della pagina: blu notte e sfondo animato dietro le schermate .oro, e il colore della barra del telefono
  var META_CHIARO = "#0d1020", META_SCURO = null;
  function tema(chiaro, s) {
    var b = document.body; if (!b) return;
    b.classList.toggle("tema-oro", !!chiaro);
    // 🌙 lo sfondo animato: solo dietro le schermate del core, mai dietro le partite (anche quelle dei giochi convertiti, .sg-dal-gioco)
    if (window.SGSfondo) SGSfondo.mostra(!!chiaro && !(s && s.classList && s.classList.contains("sg-dal-gioco")));
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) { if (META_SCURO == null) META_SCURO = m.getAttribute("content") || "#0c1636"; m.setAttribute("content", chiaro ? META_CHIARO : META_SCURO); }
  }

  window.SGStile = {
    // la schermata del core prende lo stile dell'app (e dietro la pagina diventa blu notte, con lo sfondo animato)
    marca: function (s) { if (s && s.classList) { s.classList.add("oro"); pulisci(s); s._pulito = true; } return s; },
    // da chiamare dopo ogni cambio di schermata: stile dell'app se la schermata in vista è .oro
    aggiorna: function (s) { tema(!!(s && s.classList && s.classList.contains("oro")), s); },
    pulisci: pulisci,
    simboli: MAPPA,
    avvia: function () { scriviRegole(); osserva(); }
  };
  if (document.head) window.SGStile.avvia(); else document.addEventListener("DOMContentLoaded", window.SGStile.avvia);
})();
