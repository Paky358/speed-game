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

{
  echo '<!doctype html>'
  echo '<meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
  echo '<meta name="theme-color" content="#141326">'
  echo '<title>Speed Game</title>'
  echo '<style>'
  cat css/styles.css
  echo '</style>'
  echo '<div id="app"></div>'
  # caselle di posta del sito (Netlify le riconosce alla pubblicazione)
  echo '<form name="proposte" data-netlify="true" netlify-honeypot="bot-field" hidden><input type="text" name="bot-field" /><input type="text" name="nome" /><textarea name="messaggio"></textarea></form>'
  echo '<form name="bug" data-netlify="true" netlify-honeypot="bot-field" hidden><input type="text" name="bot-field" /><input type="text" name="nome" /><textarea name="messaggio"></textarea><input type="text" name="contesto" /></form>'
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/mqtt/4.3.7/mqtt.min.js"></script>'
  echo '<script src="https://cdn.ably.com/lib/ably.min-2.js"></script>'
  echo '<script>'
  cat js/core.js
  echo ''
  cat js/net.js
  echo ''
  [ -e js/ably-key.js ] && { cat js/ably-key.js; echo ''; }
  [ -e js/net-ably.js ] && { cat js/net-ably.js; echo ''; }
  [ -e js/net-p2p.js ] && { cat js/net-p2p.js; echo ''; }
  for f in data/*.js; do [ -e "$f" ] && { cat "$f"; echo ''; }; done
  for f in js/games/*.js; do [ -e "$f" ] && { cat "$f"; echo ''; }; done
  echo 'SG.avviaApp();'
  echo '</script>'
} > "$OUT"

# Copia le immagini delle carte (mazzo napoletano) nella cartella pubblicata
if [ -d carte ]; then rm -rf dist/carte && cp -r carte dist/carte; fi

echo "Creato $OUT"
