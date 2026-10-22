/* =========================================================
   DATI — le 20 squadre di Serie A per «⚽ La giornata dopo l'asta» (Asta Fantacalcio)
   gf / gs = gol fatti e subiti a partita nella stagione 2025/26 (le neopromosse Venezia, Monza e Frosinone: un po' sotto la media);
   rigori = i rigoristi di quest'anno in ordine, punizioni = chi batte le punizioni, angoli = chi batte i calci d'angolo (22 ott 2026:
   Fantacalcio.it confrontato con altri siti di fantacalcio della stagione 2026/27 e con chi ha davvero battuto nelle prime giornate;
   solo calciatori che giocano davvero in quella squadra quest'anno),
   ognuno con [nome, rigori segnati, rigori tirati] l'anno scorso (per la sua percentuale).
   Per aggiornarli: chiedere a Claude "aggiorna le statistiche" (insieme alle quotazioni).
   ========================================================= */
window.SG_FANTA_SQUADRE = {
  aggiornate: "22 ottobre 2026",
  media: { gf: 1.22, gs: 1.18 },
  squadre: {
    "Atalanta": { gf: 1.29, gs: 0.95, rigori: [["Kessiè",0,0],["Scamacca",2,2],["Raspadori",0,0]], punizioni: ["De Ketelaere","Samardzic","Gaetano"], angoli: ["Samardzic","Gaetano","Elmas"] },
    "Bologna": { gf: 1.16, gs: 1.21, rigori: [["Orsolini",4,6],["Bernardeschi",1,1],["Dovbyk",0,0]], punizioni: ["Orsolini","Bernardeschi","Ferguson"], angoli: ["Orsolini","Ferguson","Miranda J."] },
    "Cagliari": { gf: 0.97, gs: 1.39, rigori: [["Maldini",0,0],["Deiola",0,0],["Nzola",2,3]], punizioni: ["Maldini","Fazzini","Obert"], angoli: ["Fazzini","Obert","Romano"] },
    "Como": { gf: 1.68, gs: 0.76, rigori: [["Da Cunha",4,4],["Kean",2,2],["Douvikas",1,1]], punizioni: ["Paz N.","Baturina","Milla"], angoli: ["Milla","Paz N.","Baturina"] },
    "Fiorentina": { gf: 1.13, gs: 1.32, rigori: [["Goncalves P.",0,0],["Mastantuono",0,0],["Beto",0,0]], punizioni: ["Mastantuono","Goncalves P.","Fagioli"], angoli: ["Mastantuono","Fagioli","Goncalves P."] },
    "Frosinone": { gf: 0.95, gs: 1.45, rigori: [["Calò",0,0],["Schmid",0,0],["Bobcek",0,0]], punizioni: ["Calò","Schmid","Ghedjemis"], angoli: ["Calò","Schmid","Kvernadze"] },
    "Genoa": { gf: 1.05, gs: 1.34, rigori: [["Colombo",1,2],["Ostigard",0,0],["Baldanzi",0,0]], punizioni: ["Baldanzi","Messias","El Shaarawy"], angoli: ["Sow","Amorim","Puczka"] },
    "Inter": { gf: 2.24, gs: 0.92, rigori: [["Calhanoglu",4,5],["Zielinski",1,1],["Martinez L.",0,0]], punizioni: ["Calhanoglu","Dimarco","Zielinski"], angoli: ["Dimarco","Barella","Calhanoglu"] },
    "Juventus": { gf: 1.58, gs: 0.89, rigori: [["Kolo Muani",0,0],["Woltemade",0,0],["Gonzalez N.",0,0]], punizioni: ["Douglas Luiz","Yildiz","Alajbegovic"], angoli: ["Douglas Luiz","Conceicao","Zhegrova"] },
    "Lazio": { gf: 1.03, gs: 1.05, rigori: [["Zaccagni",0,1],["Taylor K.",0,0],["Pinamonti",0,1]], punizioni: ["Zaccagni","Gudmundsson A.","Taylor K."], angoli: ["Zaccagni","Tavares N.","Pedraza"] },
    "Lecce": { gf: 0.76, gs: 1.32, rigori: [["Geubbels",0,0],["Stulic",1,1],["Pierotti",0,0]], punizioni: ["Ilic","Pierotti","Gallo"], angoli: ["Ilic","Gallo","Pierotti"] },
    "Milan": { gf: 1.39, gs: 0.92, rigori: [["Ramos G.",0,0],["Pulisic",0,1],["Modric",0,0]], punizioni: ["Modric","Pulisic","Jashari"], angoli: ["Modric","Pulisic","Bartesaghi"] },
    "Monza": { gf: 0.95, gs: 1.45, rigori: [["Varela G.",0,0],["Cutrone",0,0],["Ngonge",0,0]], punizioni: ["Colpani","Ngonge","Zeballos"], angoli: ["Birindelli","Forson O.","Colpani"] },
    "Napoli": { gf: 1.58, gs: 0.95, rigori: [["De Bruyne",3,3],["Hojlund",1,1],["Politano",0,0]], punizioni: ["De Bruyne","Politano","Neres"], angoli: ["De Bruyne","Politano"] },
    "Parma": { gf: 0.68, gs: 1.21, rigori: [["Tourè E.",0,0],["Valeri",0,0],["Bernabè",0,0]], punizioni: ["Bernabè","Valeri","Tourè E."], angoli: ["Valeri","Bernabè"] },
    "Roma": { gf: 1.53, gs: 0.82, rigori: [["Malen",3,4],["Dybala",0,1],["Castro S.",0,0]], punizioni: ["Dybala","Soulè","Mora"], angoli: ["Dybala","Soulè","Pisilli"] },
    "Sassuolo": { gf: 1.24, gs: 1.32, rigori: [["Berardi",2,3],["Esposito Se.",1,1],["Laurientè",0,0]], punizioni: ["Berardi","Adzic","Laurientè"], angoli: ["Berardi","Laurientè","Adzic"] },
    "Torino": { gf: 1.13, gs: 1.66, rigori: [["Vlasic",5,5],["Simeone",0,0],["Mandragora",1,1]], punizioni: ["Mandragora","Vlasic","Fitz-Jim"], angoli: ["Mandragora","Fitz-Jim","Vlasic"] },
    "Udinese": { gf: 1.16, gs: 1.26, rigori: [["Davis K.",4,4],["Solet",1,1],["Zaniolo",0,0]], punizioni: ["Zaniolo","Ekkelenkamp","Vojvoda"], angoli: ["Vojvoda","Unai Gomez","Zarraga"] },
    "Venezia": { gf: 0.95, gs: 1.45, rigori: [["Busio",0,0],["Yeboah J.",0,0],["Adams A.",0,0]], punizioni: ["Busio","Basic","Yeboah J."], angoli: ["Busio","Perez K.","Basic"] }
  }
};
