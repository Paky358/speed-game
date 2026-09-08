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
OUT=dist/serata-giochi.html

{
  echo '<title>Serata Giochi</title>'
  echo '<style>'
  cat css/styles.css
  echo '</style>'
  echo '<div id="app"></div>'
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/mqtt/4.3.7/mqtt.min.js"></script>'
  echo '<script>'
  cat js/core.js
  echo ''
  cat js/net.js
  echo ''
  for f in data/eventi-*.js; do [ -e "$f" ] && { cat "$f"; echo ''; }; done
  [ -e data/novita.js ] && { cat data/novita.js; echo ''; }
  for f in js/games/*.js; do [ -e "$f" ] && { cat "$f"; echo ''; }; done
  echo 'SG.avviaApp();'
  echo '</script>'
} > "$OUT"

echo "Creato $OUT"
