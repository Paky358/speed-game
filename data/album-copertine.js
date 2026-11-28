// 📒 LE COPERTINE DELL'ALBUM (29 nov 2026, il proprietario col Cervello): per ogni stagione le prime 6 della classifica finale (la 1ª è la
// campione d'Italia; oggi, a stagione in corso, le 6 con l'overall più alto) e il calciatore di ognuna sulla copertina: il CAPITANO di quella
// stagione, o la STELLA se il capitano è già uscito prima (mai lo stesso calciatore due volte per la stessa squadra), coi ruoli mescolati.
// Fatto con .agents/skills/prova-nel-browser/album/fai-copertine.js; SI PUÒ CAMBIARE A MANO: [squadra, nome come nei dati di quella
// stagione, "capitano" | "stella"]. Il pacchetto di ogni stagione usa il calciatore della 1ª (la campione).
window.SG_ALBUM_COPERTINE = {
  "2015-16": [["Juventus","Buffon","capitano"], ["Napoli","Hamsik","capitano"], ["Roma","Pjanic","stella"], ["Inter","Icardi","capitano"], ["Fiorentina","Ilicic","stella"], ["Sassuolo","Magnanelli","capitano"]],
  "2016-17": [["Juventus","Higuain","stella"], ["Roma","Nainggolan","stella"], ["Napoli","Mertens","stella"], ["Atalanta","Conti","stella"], ["Lazio","Biglia","capitano"], ["Milan","Suso","stella"]],
  "2017-18": [["Juventus","Douglas Costa","stella"], ["Napoli","Koulibaly","stella"], ["Roma","De Rossi","capitano"], ["Inter","Perisic","stella"], ["Lazio","Lulic","capitano"], ["Milan","Bonucci","capitano"]],
  "2018-19": [["Juventus","Chiellini","capitano"], ["Napoli","Insigne","capitano"], ["Atalanta","Gomez","capitano"], ["Inter","Nainggolan","stella"], ["Milan","Romagnoli","capitano"], ["Roma","Kolarov","stella"]],
  "2019-20": [["Juventus","Bonucci","capitano"], ["Inter","Handanovic","capitano"], ["Atalanta","Zapata D.","stella"], ["Lazio","Luis Alberto","stella"], ["Roma","Dzeko","capitano"], ["Milan","Calhanoglu","stella"]],
  "2020-21": [["Inter","Lukaku","stella"], ["Milan","Kessié","stella"], ["Atalanta","Toloi","capitano"], ["Juventus","Ronaldo","stella"], ["Napoli","Zielinski","stella"], ["Lazio","Milinkovic-Savic","stella"]],
  "2021-22": [["Milan","Hernandez T.","stella"], ["Inter","Calhanoglu","stella"], ["Napoli","Ruiz","stella"], ["Juventus","Vlahovic","stella"], ["Lazio","Immobile","capitano"], ["Roma","Pellegrini Lo.","capitano"]],
  "2022-23": [["Napoli","Di Lorenzo","capitano"], ["Lazio","Zaccagni","stella"], ["Inter","Dimarco","stella"], ["Milan","Calabria","capitano"], ["Atalanta","Koopmeiners","stella"], ["Roma","El Shaarawy","stella"]],
  "2023-24": [["Inter","Martinez L.","capitano"], ["Milan","Pulisic","stella"], ["Juventus","Danilo","capitano"], ["Atalanta","Scamacca","stella"], ["Bologna","Orsolini","stella"], ["Roma","Dybala","stella"]],
  "2024-25": [["Napoli","McTominay","stella"], ["Inter","Thuram","stella"], ["Atalanta","De Roon","capitano"], ["Juventus","Locatelli","capitano"], ["Roma","Saelemaekers","stella"], ["Fiorentina","Ranieri L.","capitano"]],
  "2025-26": [["Inter","Zielinski","stella"], ["Napoli","Hojlund","stella"], ["Roma","Cristante","capitano"], ["Como","Da Cunha","capitano"], ["Milan","Maignan","capitano"], ["Juventus","Yildiz","stella"]],
  "oggi": [["Inter","Esposito F.P.","stella"], ["Roma","Malen","stella"], ["Como","Paz N.","stella"], ["Lazio","Isaksen","stella"], ["Milan","Rabiot","stella"], ["Frosinone","Calo","stella"]]
};
