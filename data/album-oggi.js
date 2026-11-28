// 📒 L'ALBUM FISSO DELLA SERIE A DI OGGI (fatto il 28 nov 2026 dal listone di quel giorno con album/fai-album-fisso.js; NON si cambia a mano).
// Per squadra (in ordine di nome), i calciatori in ordine di ruolo (P, D, C, A) e dentro il ruolo per numero di maglia (chi non l'ha in fondo,
// per nome): «ruolo|nome». Il numero dell'album è il posto in questa lista contando tutte le squadre di fila. Chi esce dal listone resta qui
// («💎 Introvabile» per chi l'ha, «🔒 Non più all'asta» per gli altri); chi entra dopo va nelle pagine «🆕 Aggiornamenti» (js/games/asta.js, albLista).
window.SG_ALBUM_OGGI = {
  "Atalanta": ["P|Carnesecchi","D|Bellanova","D|Kolasinac","D|Scalvini","D|Zappacosta","C|Samardzic","C|Rowe","C|Ederson D.S.","C|Kessie","C|Zalewski","C|Gaetano","C|Elmas","A|Scamacca","A|De Ketelaere","A|Raspadori","A|Krstovic"],
  "Bologna": ["P|Skorupski","D|Theate","D|Casale","D|Zortea","D|Miranda J.","C|Pobega","C|Orsolini","C|Bernardeschi","C|Mbangula","C|Ferguson","C|Cambiaghi","A|Dovbyk","A|Piccoli"],
  "Cagliari": ["P|Caprile","D|Ze Pedro","D|Mina","D|Obert","C|Romano","C|Winks","C|Adopo","A|Kevin Carlos","A|Nzola","A|Mendy P.","A|Maldini"],
  "Como": ["P|Butez","D|Kempf","D|Valle","D|Ramon","D|Kaiki","D|Couto","D|Chalobah T.","C|Perrone","C|Milla","C|Da Cunha","C|Caqueret","C|Paz N.","C|Rodriguez Je.","C|Baturina","C|Liberali","A|Douvikas","A|Diao","A|Kean"],
  "Fiorentina": ["P|De Gea","D|Dodo","D|Dragusin","D|Jimenez A.","D|Valdepenas","C|Atta","C|Njie","C|Ndour","C|Goncalves P.","C|Mastantuono","C|Fagioli","A|Beto","A|Pellegrino M."],
  "Frosinone": ["P|Palmisani","D|Calvani","D|Oyono A.","D|Monterisi","D|Terzic","D|Bracaglia","C|Schmid","C|Calo","C|Cichella","C|Masini","A|Ghedjemis","A|Raimondo","A|Birligea","A|Kvernadze"],
  "Genoa": ["P|Bijlow","D|Ehizibue","D|Ostigard","D|Vasquez","C|Baldanzi","C|Messias","C|Frendrup","C|Ellertsson","C|El Shaarawy","A|Osmajic","A|Colombo"],
  "Inter": ["P|Martinez Jo.","P|Provedel","D|Stones","D|Akanji","D|Carlos Augusto","D|Bisseck","D|Dimarco","D|Bastoni","D|Spence","C|Zielinski","C|Sucic P.","C|Diouf","C|Calhanoglu","C|Jones C.","C|Mkhitaryan","C|Barella","A|Thuram","A|Martinez L.","A|Bonny","A|Esposito F.P."],
  "Juventus": ["P|Vicario","D|Celik","D|Bremer","D|Gatti","D|Kalulu","D|Cambiaso","D|Lucumi","C|Locatelli","C|Conceicao","C|Koopmeiners","C|Zhegrova","C|Douglas Luiz","C|Alajbegovic","C|McKennie","C|Gonzalez N.","A|Kolo Muani","A|Yildiz","A|Boga","A|Woltemade"],
  "Lazio": ["P|Mandas","D|Doekhi","D|Floriani Mussolini","D|Tavares N.","D|Pedraza","D|Provstgaard","D|Sutalo J.","C|Dele-Bashiru","C|Zaccagni","C|Isaksen","C|Frattesi","C|Belahyane","C|Cancellieri","C|Taylor K.","C|Gudmundsson A.","A|Pinamonti","A|Noslin"],
  "Lecce": ["P|Falcone","D|Siebert","D|Veiga D.","D|Gallo","D|Tiago Gabriel","C|Coulibaly L.","C|Monteiro J.","A|Fatah","A|N'Dri","A|Geubbels"],
  "Milan": ["P|Maignan","D|De Winter","D|Tomori","D|Pavlovic","D|Gila","C|Pulisic","C|Rabiot","C|Modric","C|Hutchinson","C|Chukwueze","C|Moreira","C|Saelemaekers","C|Cissè A.","C|Musah","A|Ramos G."],
  "Monza": ["P|Thiam","D|Goglichidze","D|Mangas","D|Birindelli","D|Kouadio","C|Akinsanmiro","C|Colpani","A|Varela G.","A|Zeballos","A|Robinson J.","A|Mota"],
  "Napoli": ["P|Meret","P|Milinkovic-Savic V.","D|Favasuli","D|Rrahmani","D|Marin R.","D|Olivera","D|Di Lorenzo","D|Spinazzola","C|Gilmour","C|McTominay","C|De Bruyne","C|Politano","C|Vergara","C|Lobotka","C|Zambo Anguissa","A|Hojlund","A|Santos A.","A|Lang"],
  "Parma": ["P|Daffara","P|Corvi","D|Valeri","D|Delprato","D|Diego Carlos","C|Fabbian","A|Romero D.","A|Toure E.","A|Lontani"],
  "Roma": ["P|Gollini","P|Svilar","D|N'Dicka","D|Molina N.","D|Hermoso","D|Mancini","D|Balerdi","D|Wesley","D|Lulli","D|Ghilardi","C|Cristante","C|Kone M.","C|Pisilli","C|Mora","A|Castro S.","A|Malen","A|Soule","A|Dybala"],
  "Sassuolo": ["P|Muric","D|Doig","D|Leysen F.","D|Cinquegrano","C|Volpato","C|Adzic","C|Matic","C|Thorstvedt","C|Bakola","A|Bowie","A|Berardi","A|Lauriente","A|Esposito Se."],
  "Torino": ["P|Perri","D|Comuzzo","D|Coco","D|Fortini","D|Ismajli","D|Belghali","C|Mandragora","C|Vlasic","C|Braganca","C|Fitz-Jim","C|Cacciamani","A|Kulenovic","A|Simeone","A|Adams C."],
  "Udinese": ["P|Okoye","D|Alaba","D|Kamara H.","D|Abankwah","D|Vojvoda","D|Solet","C|Karlstrom","C|Zaniolo","C|Piotrowski","C|Ekkelenkamp","A|Davis K."],
  "Venezia": ["P|Stankovic F.","D|Juan Jesus","D|Hainaut","D|Mazzocchi","C|Busio","C|Basic","C|Perez K.","A|Yeboah J.","A|Adams A."]
};
