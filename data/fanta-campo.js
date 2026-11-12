/* =========================================================
   DATI — i GIOCATORI SOLO PER IL CAMPO della Mini Asta Fantacalcio (11 nov 2026, approvati dal proprietario)
   Il proprietario col Cervello: in campo tutti con faccia e numero, «sul dischetto va il rigorista vero… anche se non l'ha
   nessuno». Sono calciatori veri della stagione 2026/27 che NON sono nel listone dell'asta:
   - per avere 11 titolari in ogni squadra (1 portiere, 4 difensori, 3 centrocampisti, 3 attaccanti): per ogni posto vuoto
     il più quotato su Fantacalcio.it tra chi gioca davvero in quella squadra (listone del 10 nov 2026; i più quotati che
     quest'estate sono andati via, come Leao, Dia, Norton-Cuffy, Circati, Buksa e Dallinga, sono stati scartati);
   - i battitori di rigori, punizioni e angoli (data/fanta-squadre.js) che nel listone non c'erano;
   - gli esterni che mancavano al 3-5-2 di Parma e Venezia (data/fanta-moduli.js): Britschgi e Haps.
   Milan e Lazio non hanno un terzo attaccante che gioca: il suo posto lo prende il loro centrocampista migliore.
   Numeri di maglia: SOLO se due fonti diverse erano d'accordo (rose 2026/27 di Sky, Virgilio, Wikipedia, siti dei club,
   Pazzidifanta, Tuttomercatoweb), trovati da aiutanti Sonnet l'11 nov 2026.
   MAI all'asta, MAI nel valore delle rose, MAI nei fatti della giornata (gol, voti, fantapunti): servono solo a disegnarli
   in campo (con la faccia: IL PAPPONE la sistema in «🎨 Personalizza i calciatori», sezione «➕ Giocatori aggiunti solo per
   il campo») e all'overall della squadra (dalla quotazione, come tutti).
   Formato: "Nome (Squadra)": [ruolo, quotazione Fantacalcio.it, numero di maglia]
   ========================================================= */
window.SG_FANTA_CAMPO = {
  aggiornati: "11 novembre 2026",
  calciatori: {
    // per fare 11 titolari
    "Enem (Bologna)": ["A", 3, 22],
    "Rodriguez Ju. (Cagliari)": ["D", 5, 15],
    "Marcandalli (Genoa)": ["D", 5, 27],
    "Maleh (Lecce)": ["C", 7, 14],
    "Foe Ondoa (Monza)": ["C", 4, 8],
    "Troilo (Parma)": ["D", 5, 37],
    "Keita M. (Parma)": ["C", 6, 16],
    "Gueye (Udinese)": ["A", 6, 7],
    "Bayo V. (Udinese)": ["A", 1, 15],
    "Sagrado (Venezia)": ["D", 6, 20],
    // gli esterni che mancavano al 3-5-2 (11 nov 2026, approvati dal proprietario): difensori per il fantacalcio, in campo sulle fasce
    "Britschgi (Parma)": ["D", 4, 27],
    "Haps (Venezia)": ["D", 5, 5],
    // i battitori che non c'erano
    "Deiola (Cagliari)": ["C", 5, 14],
    "Sow (Genoa)": ["C", 4, 97],
    "Amorim (Genoa)": ["C", 5, 4],
    "Pierotti (Lecce)": ["C", 4, 50],
    "Jashari (Milan)": ["C", 6, 30],
    "Forson O. (Monza)": ["C", 1, 11],
    "Unai Gomez (Udinese)": ["C", 5, 46],
    "Zarraga (Udinese)": ["C", 2, 6]
  }
};
