#!/usr/bin/env bash
# Mette insieme tutti i file dell'app in UN solo file HTML,
# adatto a essere pubblicato online (dist/serata-giochi.html).
# Include da solo tutte le categorie (data/eventi-*.js) e tutti i
# giochi (js/games/*.js): aggiungerne di nuovi non richiede di
# modificare questo script.
# Il progetto normale (index.html + cartelle) resta invariato.
set -e
cd "$(dirname "$0")"
mkdir -p dist
OUT=dist/index.html
EXTRA=dist/extra.js

# I disegni della casa nuova (come The Sims), del casinò e della città a piedi: un file a parte, scaricato solo da chi li usa
# (così l'app si apre più in fretta). Il nome porta un pezzo dell'impronta del contenuto: cambia a ogni versione e il telefono non usa quella vecchia.
{
  cat js/giardino-arte.js   # i disegni del giardino
  cat js/mobili-arte.js     # i mobili visti dall'alto (casa come The Sims)
  cat js/mobili-soggiorno-scadente.js js/mobili-soggiorno.js js/mobili-cucina.js js/mobili-camera-scadente.js js/mobili-camera.js js/mobili-bar.js js/mobili-quadri.js js/mobili-piccole.js js/mobili-salotto2.js js/mobili-giochi.js js/mobili-halloween.js js/mobili-acquari.js js/casino-tavoli.js js/casino-slot.js js/casino-giochi.js js/casino-salone.js js/casino-locali.js js/casino-macchine.js js/circolo-tavoli.js js/circolo-bar.js js/circolo-cortile.js
  cat js/costruzioni-arte.js js/costruzioni-casino.js js/costruzioni-casino2.js js/costruzioni-circolo.js   # muri, pavimenti, porte, finestre e tetti
  cat js/giardino.js        # il motore: casa e giardino, casinò, città a piedi
} > "$EXTRA"
VER=$(md5sum "$EXTRA" | cut -c1-10)

{
  echo '<!doctype html>'
  echo '<meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width, initial-scale=1">'
  echo '<meta name="theme-color" content="#0d1020">'
  echo '<title>SPeeD GAME</title>'
  # app installabile: icona sulla Home e niente barra dell'indirizzo
  echo '<link rel="manifest" href="app/manifest.webmanifest?v=2">'
  echo '<link rel="icon" type="image/png" href="app/icona-192.png">'
  echo '<link rel="apple-touch-icon" href="app/icona-192.png">'
  echo '<meta name="apple-mobile-web-app-capable" content="yes">'
  echo '<meta name="mobile-web-app-capable" content="yes">'
  echo '<meta name="apple-mobile-web-app-status-bar-style" content="black">'
  echo '<meta name="apple-mobile-web-app-title" content="SPeeD GAME">'
  echo '<script>if ("serviceWorker" in navigator) addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });</script>'
  echo '<style>'
  cat css/styles.css
  echo '</style>'
  echo '<div id="app"></div>'
  echo "<script>window.SG_EXTRA = 'extra.js?v=$VER';</script>"
  # le foto dei giochi che ci sono davvero (carte/giochi/<id>.jpg): la home chiede solo quelle
  echo "<script>window.SG_FOTO = {$(for f in carte/giochi/*.jpg; do [ -e "$f" ] && printf '"%s":1,' "$(basename "$f" .jpg)"; done)};</script>"
  # caselle di posta del sito (Netlify le riconosce alla pubblicazione)
  echo '<form name="proposte" data-netlify="true" netlify-honeypot="bot-field" hidden><input type="text" name="bot-field" /><input type="text" name="nome" /><textarea name="messaggio"></textarea></form>'
  echo '<form name="bug" data-netlify="true" netlify-honeypot="bot-field" hidden><input type="text" name="bot-field" /><input type="text" name="nome" /><textarea name="messaggio"></textarea><input type="text" name="contesto" /></form>'
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/mqtt/4.3.7/mqtt.min.js"></script>'
  echo '<script src="https://cdn.ably.com/lib/ably.min-2.js"></script>'
  echo '<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>'
  echo '<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>'
  echo '<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>'
  echo '<script>'
  cat js/nube.js
  echo ''
  cat js/livelli.js   # livelli, XP, Speed Coins e Prestigio
  echo ''
  cat js/omino.js
  echo ''
  cat js/citta.js   # la città nuova (anteprima coi lavori in corso)
  echo ''
  cat js/casino.js  # il Casinò dentro: una sala per ogni gioco di carte
  cat js/casa.js    # la casa: tre stanze da arredare
  echo ''
  cat js/pesca.js   # la pesca al laghetto
  cat js/scavi.js   # gli scavi antichi
  echo ''
  cat js/sfondo.js  # 🌙 Notte vivace: lo sfondo animato dietro le schermate del core (luci morbide e scintillii)
  cat js/stile.js   # 🌙 Notte vivace: lo stile delle schermate del core e simboli puliti al posto delle emoji
  cat js/core.js
  echo ''
  cat js/net.js
  echo ''
  [ -e js/ably-key.js ] && { cat js/ably-key.js; echo ''; }
  [ -e js/net-ably.js ] && { cat js/net-ably.js; echo ''; }
  [ -e js/net-p2p.js ] && { cat js/net-p2p.js; echo ''; }
  cat js/compagnia.js   # la Compagnia (gruppo fisso di amici): memoria, link, tessere della home, giocato di recente
  echo ''
  cat js/scegliamo.js   # Scegliamo insieme: scheda del voto e ruota dei giochi
  echo ''
  cat js/amici-online.js   # amici online (pallino verde) e inviti nella Sala
  echo ''
  cat js/studio.js   # lo studio del game show, condiviso dai giochi (prima dei giochi)
  echo ''
  cat js/asta-sala-arte.js js/asta-stadio-arte.js js/asta-maglie.js   # i disegni dell'Asta: la sala vista dal banditore, lo stadio del fantacalcio, le maglie
  cat js/chidinoi-arte.js   # i disegni di «Chi di Noi?»: scene dei posti, costumi, personaggi pronti, la faccia dei giocatori
  cat js/chidinoi-foto.js   # la foto vera di «Chi di Noi?»: selfie con la sagoma, i 10 filtri, la cifratura delle foto
  echo ''
  for f in data/*.js; do [ -e "$f" ] && { cat "$f"; echo ''; }; done
  for f in js/games/*.js; do [ -e "$f" ] && { cat "$f"; echo ''; }; done
  echo 'SG.avviaApp();'
  echo '</script>'
} > "$OUT"

# Copia le immagini delle carte (mazzo napoletano) nella cartella pubblicata
if [ -d carte ]; then rm -rf dist/carte && cp -r carte dist/carte; fi
# App installabile: icone, manifest e service worker
if [ -d app ]; then rm -rf dist/app && cp -r app dist/app; fi
[ -e sw.js ] && cp sw.js dist/sw.js
# Elenchi di parole caricati solo quando servono (es. Nomi, Cose e Città): restano file a parte, non pesano sull'app
if [ -d parole ]; then rm -rf dist/parole && cp -r parole dist/parole; fi
# Suoni registrati (es. lo stadio di Calcio Biliardo): file a parte, scaricati solo quando servono
if [ -d suoni ]; then rm -rf dist/suoni && cp -r suoni dist/suoni; fi

echo "Creato $EXTRA ($VER)"
echo "Creato $OUT"
