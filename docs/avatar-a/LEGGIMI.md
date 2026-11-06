# 🎨 Avatar «illustrati» (strada A) — primo tempo, 5 nov 2026

Stato: ramo `avatar-a`, NON unito in lavori-in-corso, NON online. Acceso solo per IL PAPPONE (`AVATAR_A = "proprietario"`
in js/core.js; dal suo profilo «🎨 Avatar illustrati: accesi/spenti», `sg-avatar-a`). Per tutti: `AVATAR_A = "tutti"`.

- Motore: `js/omino-a.js` (corpo nelle 3 corporature × lui/lei, gambe con coscia/ginocchio/polpaccio, volumi a cilindro,
  visi: 6 forme, 14 occhi, 12 sopracciglia, 10 nasi, trucco degli occhi e delle guance; pose: in piedi, busto, viso, braccia
  su/uno, canna, cammina). Pezzi: `js/omino-a-pezzi.js` (26 pettinature, 21 capi sopra, 16 sotto, 12 scarpe, 17+1 cappelli,
  18 bocche, 11 barbe, 7 segni, 11 occhiali, 7 orecchini, 7 stampe). Si scaricano solo per chi li vede (pezzo `avatar-a`).
- `js/omino.js`: con lo stile "illustrato" disegna col motore nuovo; seduto e di spalle restano «rifinito».
- Conversione: nessun dato cambia. Una voce non ancora ridisegnata prende la più simile (`SGOminoA.SIMILI`); l'editor le
  nasconde (tranne quella che hai già). Ancora da fare (secondo tempo): 43 pettinature, cappelli da costume (pirata, mago,
  vichingo, corna, aureola, orecchie…), supereroe, pattini, collo, borsa, cose in mano, schiena, animaletti, pittura,
  10 stampe, pose seduto e di spalle; alleggerire (un avatar illustrato pesa ~65 KB contro ~27 KB).
- Lavoro: `D:\SG-avatar-a-lavoro` (banco di prova, foto, pezzi degli aiutanti, prove nell'app in `prova-app\`).
  Qui una copia di LEGGIMI-AIUTANTI.md, banco.html, confronto.html e verifica.js (i percorsi puntano a D:\SG-avatar-a).
  Foglio di confronto: `D:\SG-avatar-a-lavoro\confronto-avatar-A.png`.

# 🧍 Secondo tempo, 5-6 nov 2026 (ramo avatar-a, ancora solo per IL PAPPONE, NON unito né online)
- Corpo come un pezzo unico (spalla tonda, braccio con gomito e bicipite in un contorno solo, mani con le dita), vestiti
  ricavati dalla stessa sagoma e colorati insieme con `K.dipingi` (niente giunture), piedi e scarpe di tre quarti separati.
  Istruzioni per chi disegna i pezzi: `docs/avatar-a/LEGGIMI-CORPO.md` e `LEGGIMI-EXTRA.md` (copie da D:\SG-avatar-a-lavoro).
- Pose: seduto (fasce con `<use>`), di spalle, gesti `SGOmino.svg(cfg, { gesto, lato })`: saluta, applaude, esulta, posa,
  preme, leva, batte, tavolo, carte (con il ventaglio); taglio `vita: true` (dalla testa alla vita) e `busto` con le spalle;
  `SGOmino.parti(cfg, { lato, gesto })` = corpo + braccio staccato col perno della spalla (scene grandi); `SGOmino.illustrato()`.
- Tutte le voci dell'editor disegnate (69 pettinature, 29 cappelli, collo, in mano, schiena, borse, animaletti, pittura,
  stampe, supereroe, pattini): `SGOminoA.SIMILI` non serve più. Pezzi in D:\SG-avatar-a-lavoro\pezzi\ (uniti con unisci.sh).
- Giochi (solo con gli illustrati accesi): Scopa, Scopa 2v2, Scopone, Black Jack seduti al tavolo con le mani sul panno e i
  gesti; Poker tondini più grandi; Asta seduti, banditore di spalle dalla vita in su, podio; saletta che saluta.
  Studio TV (Ruota, Patata, Nomi Cose) NON fatto: aspetta che il ramo studio-tv sia unito.
- Peso: ~104 KB ad avatar in piedi (primo tempo ~65 KB, poi 140 KB; quelli di oggi ~29 KB). Ricetta dell'alleggerimento del
  motore: D:\SG-avatar-a-lavoro\leggero\applica.js. Critico: 6 giri, gli ultimi 2 senza difetti gravi (corpo, voci, giochi).

# 🧍 Terzo tempo, 5-6 nov 2026 (i difetti visti dal proprietario sul telefono; ramo avatar-a, solo per IL PAPPONE)
- Proporzioni: `A.PROPORZIONE = "B"` in `js/omino-a.js` (circa 6 teste, scelta dal proprietario tra tre proposte; restano
  "attuale", "A", "C" nella tabella PROPORZIONI): testa più grande, gambe accorciate a fasce, corpo più largo.
- Corporature (BUILD): snello sottile davvero, lui a V, lei a clessidra (non esagerata: da seduta la coscia non supera mai i
  fianchi, `gambeDi`), robusto con braccia piene lungo i fianchi (non ad A) e avambraccio pieno anche col braccio alzato.
- Mani: la mano «impugna» (il manico passa dentro il pugno, pollice davanti); pugni a quattro dita; mano sul tavolo col
  dorso corto e le dita; gomito piegato in due pezzi sovrapposti (niente taglio); da seduti ogni mano sulla sua coscia.
- Cose in mano: contratto `A.impugna[voce] = { inclina, posa: "davanti"|"petto"|"alto"|"fianco" }` e disegno nelle
  coordinate della presa (`K.presa.qui`). Misura «da cartone» rispetto a un corpo di 170 cm, uguale su tutte le corporature
  (microfono 32, telefono 20×10, tazza 14, pizza 28, palloncino 34, pallone 24, trofeo 32…; tabella in
  D:\SG-avatar-a-lavoro\terzo\g5-pezzi\misure.md): a misura vera erano puntini, nel secondo tempo erano «enormi».
  Palloncino che galleggia col filo accanto alla testa, tazza per il manico, pizza per la crosta.
- Giochi (solo illustrati): Black Jack (avatar più vicino e più grande, carte e fiches in scala), Scopa, Scopa in 4 e
  Scopone (avatar più grandi, tavolo meno profondo, carte in proporzione), Asta (avatar che riempiono le sedie, paletta
  nella mano). Studio TV ancora no.
- Ritocchi: microfono al petto e non sul mento, camicia di spalle senza la V, sandali leggibili sulla pelle scura.
- Critico: 5 giri, l'ultimo senza difetti gravi. Restano medi: seduto visto di fronte poco «seduto» (gambe corte e dritte),
  manica del braccio giù nella posa «uno», maniche lunghe del robusto gonfie, pizza e bacchetta poco visibili sui corpi larghi,
  cose piccole a 54 px. Lavoro e foto: D:\SG-avatar-a-lavoro\terzo\ (fogli finali in g5-fogli).
