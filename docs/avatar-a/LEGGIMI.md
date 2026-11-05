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
