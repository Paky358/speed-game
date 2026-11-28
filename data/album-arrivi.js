// 📒 GLI ARRIVI NELL'ALBUM (29 nov 2026, il proprietario: «gli acquisti di gennaio dentro la pagina della LORO squadra»).
// L'album di ogni stagione è fisso (data/album-oggi.js, data/album-<anno>.js): 32 posti per squadra, a blocchi. Chi entra nel listone DOPO
// (un acquisto, uno promosso dalla Primavera) prende il primo posto libero della sua squadra, in quest'ordine: chi è scritto qui per primo
// prende il posto prima. Così un arrivo di febbraio non sposta mai uno di gennaio.
// REGOLA per chi aggiorna il listone (data/asta-fanta.js, data/fanta-campo.js): chi ENTRA si scrive anche qui, IN FONDO alla sua squadra
// («ruolo|nome»); chi ESCE non si cancella mai (vedi AGENTS.md). Chi entra e non è scritto qui va comunque nei posti liberi, dopo quelli
// scritti, in ordine di ruolo, numero di maglia e nome.
// Forma: { "<stagione o oggi>": { "<Squadra>": ["C|Nome", …] } }
window.SG_ALBUM_ARRIVI = {
  oggi: {}
};
