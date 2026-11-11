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
   - In campo ci sono i titolari (la formazione più forte) al loro posto. L'ultimo elenco (dove c'è) dice quali centrocampisti del
     fantacalcio giocano davanti, sulle fasce o da trequartisti (es. Pulisic e Moreira ai lati di Ramos nel Milan): vanno nei posti
     d'attacco, gli altri centrocampisti in mezzo (11 nov 2026, il proprietario: «il Milan con il 4-3-3, chi sta a destra e a sinistra?»).
     Odgaard (Bologna) e Addai (Como) giocano davanti ma non sono nei nostri dati: al loro posto un altro centrocampista titolare.
   - Con la difesa a tre, l'ultimo elenco dice quali difensori del fantacalcio sono gli esterni a tutta fascia (es. Dimarco nell'Inter):
     vanno sulle fasce, mai in mezzo alla difesa.
   Formato: "Squadra": ["modulo", difensori, centrocampisti, attaccanti, [centrocampisti che giocano davanti], [esterni a tutta fascia]]
   (più 1 portiere: 11)
   Per aggiornarli: chiedere a Claude "aggiorna i moduli" (insieme alle quotazioni).
   ========================================================= */
window.SG_FANTA_MODULI = {
  aggiornati: "11 novembre 2026",
  squadre: {
    "Atalanta": ["4-2-3-1", 4, 4, 2, ["Zalewski", "Rowe"]],
    "Bologna": ["3-4-2-1", 5, 4, 1, ["Bernardeschi", "Cambiaghi"], ["Zortea", "Miranda J."]],
    "Cagliari": ["4-4-2", 4, 4, 2],
    "Como": ["4-2-3-1", 4, 5, 1, ["Paz N.", "Baturina"]],
    "Fiorentina": ["4-2-3-1", 4, 5, 1, ["Mastantuono", "Goncalves P.", "Njie"]],
    "Frosinone": ["4-2-3-1", 4, 3, 3, ["Schmid"]],
    "Genoa": ["3-4-2-1", 4, 5, 1, ["Messias", "El Shaarawy"], ["Ehizibue"]],
    "Inter": ["3-5-2", 5, 3, 2, [], ["Dimarco", "Spence"]],
    "Juventus": ["3-4-2-1", 4, 4, 2, ["Zhegrova"], ["Kalulu"]],
    "Lazio": ["4-3-3", 4, 5, 1, ["Isaksen", "Zaccagni"]],
    "Lecce": ["4-3-3", 4, 3, 3],
    "Milan": ["4-3-3", 4, 5, 1, ["Pulisic", "Moreira"]],
    "Monza": ["3-4-2-1", 4, 3, 3, [], ["Mangas"]],
    "Napoli": ["4-3-3", 4, 4, 2, ["Politano"]],
    "Parma": ["3-5-2", 5, 3, 2, [], ["Britschgi", "Valeri"]],
    "Roma": ["3-4-2-1", 5, 2, 3, [], ["Wesley", "Molina N."]],
    "Sassuolo": ["4-3-3", 4, 3, 3],
    "Torino": ["3-4-1-2", 4, 4, 2, ["Vlasic"], ["Belghali"]],
    "Udinese": ["3-4-2-1", 5, 4, 1, ["Zaniolo", "Ekkelenkamp"], ["Kamara H.", "Vojvoda"]],
    "Venezia": ["3-5-2", 5, 3, 2, [], ["Hainaut", "Mazzocchi"]]
  }
};
