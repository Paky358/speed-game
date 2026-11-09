/* =========================================================
   DATI — "Mini asta Fantacalcio" per il gioco "L'Asta"
   Calciatori divisi per RUOLO (P/D/C/A) e per FASCIA (A/B/C).
   Le fasce servono SOLO al motore per costruire un mazzo
   bilanciato: in partita NON si vedono mai, si mostra solo
   Nome · Squadra · Ruolo.
   Formato: "Nome (Squadra)".
   ========================================================= */
window.SG_FANTA_CALCIATORI = {
  // 10 nov 2026: le fasce rifatte sulle quotazioni di oggi (A i più quotati, poi B, poi C: stesse dimensioni di prima, i 10 nuovi aggiunti dove cadono)
  // ---------- PORTIERI ----------
  P: {
    A: [
      "Mandas (Lazio)", "Svilar (Roma)", "Butez (Como)",
      "Maignan (Milan)", "Caprile (Cagliari)", "Palmisani (Frosinone)"
    ],
    B: [
      "Vicario (Juventus)", "Carnesecchi (Atalanta)", "Skorupski (Bologna)",
      "Bijlow (Genoa)", "Martinez Jo. (Inter)", "Stankovic F. (Venezia)",
      "Daffara (Parma)", "Meret (Napoli)", "Milinkovic-Savic V. (Napoli)",
      "Gollini (Roma)"
    ],
    C: [
      "Perri (Torino)", "De Gea (Fiorentina)", "Falcone (Lecce)",
      "Okoye (Udinese)", "Corvi (Parma)", "Provedel (Inter)",
      "Muric (Sassuolo)", "Thiam (Monza)"
    ]
  },

  // ---------- DIFENSORI ----------
  D: {
    A: [
      "Dimarco (Inter)", "Bremer (Juventus)", "Ramon (Como)",
      "Wesley (Roma)", "Miranda J. (Bologna)", "Carlos Augusto (Inter)",
      "Gila (Milan)", "Jimenez A. (Fiorentina)", "Tavares N. (Lazio)",
      "Hermoso (Roma)", "Kaiki (Como)", "Molina N. (Roma)",
      "Bisseck (Inter)", "Hainaut (Venezia)", "Kamara H. (Udinese)",
      "Mangas (Monza)", "Balerdi (Roma)", "Belghali (Torino)"
    ],
    B: [
      "Bastoni (Inter)", "Bracaglia (Frosinone)", "Mancini (Roma)",
      "N'Dicka (Roma)", "Oyono A. (Frosinone)", "Rrahmani (Napoli)",
      "Tiago Gabriel (Lecce)", "Akanji (Inter)", "Di Lorenzo (Napoli)",
      "Pavlovic (Milan)", "Casale (Bologna)", "Comuzzo (Torino)",
      "Doig (Sassuolo)", "Floriani Mussolini (Lazio)", "Goglichidze (Monza)",
      "Kalulu (Juventus)", "Abankwah (Udinese)", "Alaba (Udinese)",
      "Calvani (Frosinone)", "Coco (Torino)", "Couto (Como)",
      "Provstgaard (Lazio)", "Theate (Bologna)", "Birindelli (Monza)",
      "Chalobah T. (Como)", "Ehizibue (Genoa)", "Gallo (Lecce)",
      "Gatti (Juventus)", "Ghilardi (Roma)", "Kempf (Como)",
      "Kouadio (Monza)", "Leysen F. (Sassuolo)", "Lulli (Roma)",
      "Ostigard (Genoa)", "Pedraza (Lazio)", "Solet (Udinese)",
      "Spence (Inter)", "Valeri (Parma)", "Valle (Como)",
      "Veiga D. (Lecce)", "De Winter (Milan)"
    ],
    C: [
      "Doekhi (Lazio)", "Ismajli (Torino)", "Monterisi (Frosinone)",
      "Scalvini (Atalanta)", "Terzic (Frosinone)", "Tomori (Milan)",
      "Ze Pedro (Cagliari)", "Zortea (Bologna)", "Celik (Juventus)",
      "Delprato (Parma)", "Kolasinac (Atalanta)", "Lucumi (Juventus)",
      "Marin R. (Napoli)", "Mazzocchi (Venezia)", "Mina (Cagliari)",
      "Spinazzola (Napoli)", "Stones (Inter)", "Sutalo J. (Lazio)",
      "Vasquez (Genoa)", "Bellanova (Atalanta)", "Cambiaso (Juventus)",
      "Cinquegrano (Sassuolo)", "Diego Carlos (Parma)", "Dodo (Fiorentina)",
      "Dragusin (Fiorentina)", "Favasuli (Napoli)", "Fortini (Torino)",
      "Juan Jesus (Venezia)", "Obert (Cagliari)", "Olivera (Napoli)",
      "Siebert (Lecce)", "Valdepenas (Fiorentina)", "Vojvoda (Udinese)",
      "Zappacosta (Atalanta)", "Badiashile (Napoli)", "Bartesaghi (Milan)",
      "Bernasconi (Atalanta)", "Heggem (Bologna)", "Holm (Bologna)",
      "Idzes (Sassuolo)", "Beukema (Napoli)", "Buongiorno (Napoli)",
      "Estupinan (Milan)", "Gabbia (Milan)", "Hien (Atalanta)",
      "Kristensen T. (Atalanta)", "Marusic (Lazio)", "Pavard (Inter)",
      "Rensch (Roma)", "Vitik (Bologna)", "Kossounou (Atalanta)"
    ]
  },

  // ---------- CENTROCAMPISTI ----------
  C: {
    A: [
      "Paz N. (Como)", "Rabiot (Milan)", "Pulisic (Milan)",
      "Calhanoglu (Inter)", "Mora (Roma)", "De Bruyne (Napoli)",
      "Baturina (Como)", "Zaccagni (Lazio)", "Calo (Frosinone)",
      "McTominay (Napoli)", "Orsolini (Bologna)", "Isaksen (Lazio)",
      "Mastantuono (Fiorentina)", "Moreira (Milan)", "Barella (Inter)",
      "Schmid (Frosinone)"
    ],
    B: [
      "Taylor K. (Lazio)", "Zielinski (Inter)", "Bernardeschi (Bologna)",
      "Ekkelenkamp (Udinese)", "Politano (Napoli)", "Frattesi (Lazio)",
      "Da Cunha (Como)", "Diouf (Inter)", "Messias (Genoa)",
      "Pobega (Bologna)", "Alajbegovic (Juventus)", "Cambiaghi (Bologna)",
      "Conceicao (Juventus)", "Kone M. (Roma)", "Pisilli (Roma)",
      "Zhegrova (Juventus)", "Cristante (Roma)", "Mandragora (Torino)",
      "Modric (Milan)", "Njie (Fiorentina)", "Zalewski (Atalanta)",
      "Adzic (Sassuolo)", "Baldanzi (Genoa)", "Caqueret (Como)",
      "Coulibaly L. (Lecce)", "Dele-Bashiru (Lazio)", "Gonzalez N. (Juventus)",
      "Koopmeiners (Juventus)", "Lobotka (Napoli)", "Matic (Sassuolo)",
      "Mbangula (Bologna)", "McKennie (Juventus)", "Romano (Cagliari)",
      "Samardzic (Atalanta)", "Sucic P. (Inter)", "Adopo (Cagliari)",
      "Bakola (Sassuolo)"
    ],
    C: [
      "Belahyane (Lazio)", "Cancellieri (Lazio)", "Cissè A. (Milan)",
      "El Shaarawy (Genoa)", "Ellertsson (Genoa)", "Gilmour (Napoli)",
      "Vergara (Napoli)", "Vlasic (Torino)", "Zaniolo (Udinese)",
      "Cacciamani (Torino)", "Chukwueze (Milan)", "Ederson D.S. (Atalanta)",
      "Ferguson (Bologna)", "Fitz-Jim (Torino)", "Gaetano (Atalanta)",
      "Goncalves P. (Fiorentina)", "Gudmundsson A. (Lazio)", "Hutchinson (Milan)",
      "Kessie (Atalanta)", "Masini (Frosinone)", "Perrone (Como)",
      "Saelemaekers (Milan)", "Akinsanmiro (Monza)", "Atta (Fiorentina)",
      "Braganca (Torino)", "Cichella (Frosinone)", "Colpani (Monza)",
      "Douglas Luiz (Juventus)", "Fabbian (Parma)", "Liberali (Como)",
      "Perez K. (Venezia)", "Zambo Anguissa (Napoli)", "Basic (Venezia)",
      "Elmas (Atalanta)", "Fagioli (Fiorentina)", "Frendrup (Genoa)",
      "Jones C. (Inter)", "Karlstrom (Udinese)", "Milla (Como)",
      "Musah (Milan)", "Piotrowski (Udinese)", "Thorstvedt (Sassuolo)",
      "Volpato (Sassuolo)", "Mkhitaryan (Inter)", "Monteiro J. (Lecce)",
      "Ndour (Fiorentina)", "Rodriguez Je. (Como)", "Winks (Cagliari)",
      "Busio (Venezia)", "Locatelli (Juventus)", "Rowe (Atalanta)",
      "Casadei (Torino)", "Pasalic (Atalanta)", "Pellegrini Lo. (Roma)",
      "Bernabe (Parma)", "Fazzini (Cagliari)", "Kone I. (Sassuolo)",
      "Thuram K. (Juventus)"
    ]
  },

  // ---------- ATTACCANTI ----------
  A: {
    A: [
      "Malen (Roma)", "Thuram (Inter)", "Martinez L. (Inter)",
      "Douvikas (Como)", "Krstovic (Atalanta)", "Hojlund (Napoli)",
      "Esposito F.P. (Inter)", "Soule (Roma)", "Varela G. (Monza)",
      "Esposito Se. (Sassuolo)"
    ],
    B: [
      "Ramos G. (Milan)", "Woltemade (Juventus)", "Adams C. (Torino)",
      "Noslin (Lazio)", "Raimondo (Frosinone)", "Simeone (Torino)",
      "Ghedjemis (Frosinone)", "Kolo Muani (Juventus)", "Kvernadze (Frosinone)",
      "Maldini (Cagliari)", "Berardi (Sassuolo)", "Dybala (Roma)",
      "Kean (Como)", "Lauriente (Sassuolo)", "Osmajic (Genoa)",
      "Pellegrino M. (Fiorentina)", "Romero D. (Parma)", "Castro S. (Roma)",
      "Pinamonti (Lazio)", "Davis K. (Udinese)", "De Ketelaere (Atalanta)",
      "Lontani (Parma)", "Mendy P. (Cagliari)", "Robinson J. (Monza)",
      "Scamacca (Atalanta)", "Yildiz (Juventus)", "Adams A. (Venezia)"
    ],
    C: [
      "Bonny (Inter)", "Diao (Como)", "Kulenovic (Torino)",
      "Lang (Napoli)", "Mota (Monza)", "Raspadori (Atalanta)",
      "Bowie (Sassuolo)", "Beto (Fiorentina)", "Dovbyk (Bologna)",
      "N'Dri (Lecce)", "Birligea (Frosinone)", "Fatah (Lecce)",
      "Nzola (Cagliari)", "Piccoli (Bologna)", "Boga (Juventus)",
      "Santos A. (Napoli)", "Yeboah J. (Venezia)", "Zeballos (Monza)",
      "Colombo (Genoa)", "Toure E. (Parma)", "Kevin Carlos (Cagliari)",
      "Bobcek (Frosinone)", "Giovane (Napoli)", "Gnonto (Fiorentina)",
      "Vitinha O. (Genoa)", "Cutrone (Monza)", "Elphege (Parma)",
      "Geubbels (Lecce)", "Rrahmani Al. (Venezia)", "Ngonge (Monza)",
      "Stulic (Lecce)", "Camarda (Milan)", "Sulemana K. (Atalanta)"
    ]
  }
};
