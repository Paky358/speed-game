/* =========================================================
   DATI — il MODULO di ogni squadra per la Mini Asta Fantacalcio (11 nov 2026, deciso dal proprietario)
   Il proprietario: «ogni squadra ha il suo modulo… l'Inter gioca con due attaccanti, non ha senso mettergli tre attaccanti»;
   «io terrei la formazione più forte, il 3-5-2 con la formazione più forte possibile… con Lautaro e Thuram. E si prende
   l'overall di quella».
   - Il modulo è quello delle probabili formazioni e dell'ultima giornata prima della sosta di novembre (Fantacalcio.it,
     Fantamaster, Pazzidifanta; dove non erano d'accordo, quello di Fantacalcio.it o il più recente).
   - I numeri sono quanti difensori, centrocampisti e attaccanti ci sono negli 11 titolari CON I RUOLI DEL FANTACALCIO di
     Fantacalcio.it (gli esterni a tutta fascia spesso sono D, le ali e i trequartisti spesso C): così si sceglie la formazione
     più forte (i migliori per overall di ogni ruolo, anche se infortunati) e la si mette in campo al posto giusto.
     Almeno un attaccante (due nei moduli a due punte).
   Formato: "Squadra": ["modulo", difensori, centrocampisti, attaccanti]   (più 1 portiere: 11)
   Per aggiornarli: chiedere a Claude "aggiorna i moduli" (insieme alle quotazioni).
   ========================================================= */
window.SG_FANTA_MODULI = {
  aggiornati: "11 novembre 2026",
  squadre: {
    "Atalanta": ["4-2-3-1", 4, 4, 2],
    "Bologna": ["3-4-2-1", 5, 4, 1],
    "Cagliari": ["4-4-2", 4, 4, 2],
    "Como": ["4-2-3-1", 4, 5, 1],
    "Fiorentina": ["4-2-3-1", 4, 5, 1],
    "Frosinone": ["4-2-3-1", 4, 3, 3],
    "Genoa": ["3-4-2-1", 4, 5, 1],
    "Inter": ["3-5-2", 5, 3, 2],
    "Juventus": ["3-4-2-1", 4, 4, 2],
    "Lazio": ["4-3-3", 4, 5, 1],
    "Lecce": ["4-3-3", 4, 3, 3],
    "Milan": ["4-3-3", 4, 5, 1],
    "Monza": ["3-4-2-1", 4, 3, 3],
    "Napoli": ["4-3-3", 4, 4, 2],
    "Parma": ["3-5-2", 5, 3, 2],
    "Roma": ["3-4-2-1", 5, 2, 3],
    "Sassuolo": ["4-3-3", 4, 3, 3],
    "Torino": ["3-4-1-2", 4, 4, 2],
    "Udinese": ["3-4-2-1", 5, 4, 1],
    "Venezia": ["3-5-2", 5, 3, 2]
  }
};
