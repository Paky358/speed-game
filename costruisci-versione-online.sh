#!/usr/bin/env bash
# Prepara la versione online in dist/ (la pubblica GitHub Pages a ogni push su master).
# 📦 Dal 4 nov 2026 (#31, parte 2) i giochi si scaricano quando servono:
#   dist/index.html                    piccolo: apre l'app (il service worker lo chiede sempre fresco)
#   dist/cuore.<impronta>.js           tutto quello che serve per la home, la Sala e la saletta, con l'elenco dei giochi
#   dist/stile.<impronta>.css          lo stile
#   dist/novita.<impronta>.js          le novità (cambiano a quasi ogni pubblicazione: a parte, così il cuore resta lo stesso)
#   dist/giochi/<pezzo>.<impronta>.js  un file per ogni pezzo di js/elenco-giochi.js (le righe pezzo("nome", "file…", "prima…"))
# L'impronta è un pezzo dell'md5 del contenuto: cambia solo quando cambia il file. A una pubblicazione il telefono
# riscarica solo quello che è cambiato (il service worker, sw.js, tiene sul telefono i file con l'impronta).
# Un file di data/ o di js/games/ che non è in nessun pezzo va nel cuore (si carica all'apertura, come prima).
# Il progetto normale (index.html + cartelle) resta invariato: si prova servendo la cartella.
set -e
cd "$(dirname "$0")"
mkdir -p dist
OUT=dist/index.html
EXTRA=dist/extra.js
ELENCO=js/elenco-giochi.js
TMP=dist/.costruzione
rm -rf "$TMP"; mkdir -p "$TMP"
impronta() { md5sum "$1" | cut -c1-10; }
# 🏙️ la città (casa, casinò, circolo, scavi): se in js/core.js c'è «var CITTA_VISIBILE = false» la versione online non la contiene
# (nessuno la scarica: niente extra.js e niente citta.js, casino.js, casa.js, scavi.js). La pesca resta: serve alla Gara di pesca.
CITTA=si; grep -q "var CITTA_VISIBILE = false" js/core.js && CITTA=no
# 📺 lo Studio TV: il pezzo «studio» di js/elenco-giochi.js dice quale file va online (js/studio-piatto.js = studio spento,
# js/studio.js = acceso). L'altro non va da nessuna parte: nessuno lo scarica.
STUDIO_NO=js/studio.js; grep -qE 'pezzo\("studio", "js/studio\.js"' "$ELENCO" && STUDIO_NO=js/studio-piatto.js

# I disegni della casa nuova (come The Sims), del casinò e della città a piedi: un file a parte, scaricato solo da chi li usa
# (così l'app si apre più in fretta). Il nome porta un pezzo dell'impronta del contenuto: cambia a ogni versione e il telefono non usa quella vecchia.
rm -f "$EXTRA"
if [ "$CITTA" = si ]; then
{
  cat js/giardino-arte.js   # i disegni del giardino
  cat js/mobili-arte.js     # i mobili visti dall'alto (casa come The Sims)
  cat js/mobili-soggiorno-scadente.js js/mobili-soggiorno.js js/mobili-cucina.js js/mobili-camera-scadente.js js/mobili-camera.js js/mobili-bar.js js/mobili-quadri.js js/mobili-piccole.js js/mobili-salotto2.js js/mobili-giochi.js js/mobili-halloween.js js/mobili-acquari.js js/casino-tavoli.js js/casino-slot.js js/casino-giochi.js js/casino-salone.js js/casino-locali.js js/casino-macchine.js js/circolo-tavoli.js js/circolo-bar.js js/circolo-cortile.js
  cat js/costruzioni-arte.js js/costruzioni-casino.js js/costruzioni-casino2.js js/costruzioni-circolo.js   # muri, pavimenti, porte, finestre e tetti
  cat js/giardino.js        # il motore: casa e giardino, casinò, città a piedi
} > "$EXTRA"
VER=$(impronta "$EXTRA")
fi

# ---- 📦 i pezzi dei giochi (le righe pezzo("…", "…") dell'elenco): un file per pezzo, col pezzo d'impronta ----
rm -rf dist/giochi; mkdir -p dist/giochi
PEZZI_FILE=" "      # tutti i file che stanno in un pezzo (questi NON vanno nel cuore)
PEZZI_URL=""        # "nome":"giochi/nome.impronta.js", … per l'elenco online (window.SG_PEZZI_URL)
while IFS='|' read -r NOME FILE; do
  [ -z "$NOME" ] && continue
  P="$TMP/$NOME.js"; : > "$P"
  for f in $FILE; do
    [ -e "$f" ] || { echo "ERRORE: il pezzo $NOME ha un file che non c'è: $f" >&2; exit 1; }
    case "$PEZZI_FILE" in *" $f "*) echo "ERRORE: $f è in due pezzi dell'elenco (online si eseguirebbe due volte)" >&2; exit 1;; esac
    cat "$f" >> "$P"; echo '' >> "$P"
    PEZZI_FILE="$PEZZI_FILE$f "
  done
  H=$(impronta "$P"); cp "$P" "dist/giochi/$NOME.$H.js"
  PEZZI_URL="$PEZZI_URL\"$NOME\":\"giochi/$NOME.$H.js\","
done < <(grep -E '^[[:space:]]*pezzo\("' "$ELENCO" | sed -E 's/^[[:space:]]*pezzo\("([a-z0-9-]+)",[[:space:]]*"([^"]*)".*/\1|\2/')
# (una riga pezzo( scritta in un altro modo verrebbe saltata in silenzio: meglio fermarsi)
RIGHE=$(grep -cE '^[[:space:]]*pezzo\(' "$ELENCO" || true); FATTI=$(ls dist/giochi | wc -l)
[ "$RIGHE" -eq "$FATTI" ] || { echo "ERRORE: in $ELENCO ci sono $RIGHE righe pezzo( ma ne ho lette $FATTI: scrivile come pezzo(\"nome-minuscolo\", \"file …\", \"prima …\"), una per riga" >&2; exit 1; }
inPezzo() { case "$PEZZI_FILE" in *" $1 "*) return 0;; esac; return 1; }
aggiungi() { inPezzo "$1" || { cat "$1"; echo ''; }; }   # un file nel cuore, se non è in un pezzo

# ---- il cuore: tutto quello che serve all'apertura ----
CUORE="$TMP/cuore.js"
{
  cat js/nube.js
  echo ''
  cat js/livelli.js   # livelli, XP, Speed Coins e Prestigio
  echo ''
  cat js/omino.js
  echo ''
  if [ "$CITTA" = si ]; then
  cat js/citta.js   # la città nuova (anteprima coi lavori in corso)
  echo ''
  cat js/casino.js  # il Casinò dentro: una sala per ogni gioco di carte
  cat js/casa.js    # la casa: tre stanze da arredare
  echo ''
  fi
  cat js/pesca.js   # la pesca al laghetto (serve anche alla Gara di pesca)
  [ "$CITTA" = si ] && cat js/scavi.js   # gli scavi antichi
  echo ''
  cat js/sfondo.js  # 🌙 Notte vivace: lo sfondo animato dietro le schermate del core (luci morbide e scintillii)
  cat js/stile.js   # 🌙 Notte vivace: lo stile delle schermate del core e simboli puliti al posto delle emoji
  cat js/core.js
  echo ''
  # i pezzi del cuore (js/cuore/*.js), nell'ordine di index.html
  for f in $(grep -o 'js/cuore/[a-z0-9-]*\.js' index.html); do cat "$f"; echo ''; done
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
  # (questi di solito stanno in un pezzo: qui solo se nessun pezzo li ha)
  for f in js/studio.js js/studio-piatto.js js/asta-sala-arte.js js/asta-stadio-arte.js js/asta-maglie.js js/chidinoi-arte.js js/chidinoi-foto.js; do [ "$f" = "$STUDIO_NO" ] || aggiungi "$f"; done
  for f in data/*.js; do [ -e "$f" ] && [ "$f" != data/novita.js ] && aggiungi "$f"; done
  for f in js/games/*.js; do [ -e "$f" ] && aggiungi "$f"; done
  cat "$ELENCO"   # 📦 l'elenco dei giochi: le schede (per la home) e i pezzi da scaricare quando si gioca
  echo ''
} > "$CUORE"
rm -f dist/cuore.*.js dist/stile.*.css dist/novita.*.js
HC=$(impronta "$CUORE"); cp "$CUORE" "dist/cuore.$HC.js"
HS=$(impronta css/styles.css); cp css/styles.css "dist/stile.$HS.css"
HN=$(impronta data/novita.js); cp data/novita.js "dist/novita.$HN.js"

{
  echo '<!doctype html>'
  echo '<meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, interactive-widget=resizes-content">'
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
  echo "<link rel=\"stylesheet\" href=\"stile.$HS.css\">"
  echo '<div id="app"></div>'
  [ "$CITTA" = si ] && echo "<script>window.SG_EXTRA = 'extra.js?v=$VER';</script>"
  # le foto dei giochi che ci sono davvero (carte/giochi/<id>.jpg): la home chiede solo quelle
  echo "<script>window.SG_FOTO = {$(for f in carte/giochi/*.jpg; do [ -e "$f" ] && printf '"%s":1,' "$(basename "$f" .jpg)"; done)};</script>"
  # 📦 dove sta online ogni pezzo dei giochi (js/cuore/scarica.js lo scarica quando serve)
  echo "<script>window.SG_PEZZI_URL = {${PEZZI_URL%,}};</script>"
  # caselle di posta del sito (Netlify le riconosce alla pubblicazione)
  echo '<form name="proposte" data-netlify="true" netlify-honeypot="bot-field" hidden><input type="text" name="bot-field" /><input type="text" name="nome" /><textarea name="messaggio"></textarea></form>'
  echo '<form name="bug" data-netlify="true" netlify-honeypot="bot-field" hidden><input type="text" name="bot-field" /><input type="text" name="nome" /><textarea name="messaggio"></textarea><input type="text" name="contesto" /></form>'
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/mqtt/4.3.7/mqtt.min.js"></script>'
  echo '<script src="https://cdn.ably.com/lib/ably.min-2.js"></script>'
  echo '<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>'
  echo '<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>'
  echo '<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>'
  echo "<script src=\"cuore.$HC.js\"></script>"
  echo "<script src=\"novita.$HN.js\"></script>"
  echo '<script>SG.avviaApp();</script>'
} > "$OUT"
rm -rf "$TMP"

# Copia le immagini delle carte (mazzo napoletano) nella cartella pubblicata
if [ -d carte ]; then rm -rf dist/carte && cp -r carte dist/carte; fi
# App installabile: icone, manifest e service worker
if [ -d app ]; then rm -rf dist/app && cp -r app dist/app; fi
[ -e sw.js ] && cp sw.js dist/sw.js
# Elenchi di parole caricati solo quando servono (es. Nomi, Cose e Città): restano file a parte, non pesano sull'app
if [ -d parole ]; then rm -rf dist/parole && cp -r parole dist/parole; fi
# Suoni registrati (es. lo stadio di Calcio Biliardo): file a parte, scaricati solo quando servono
if [ -d suoni ]; then rm -rf dist/suoni && cp -r suoni dist/suoni; fi

if [ "$CITTA" = si ]; then echo "Creato $EXTRA ($VER)"; fi
echo "Creato $OUT (cuore.$HC.js, stile.$HS.css, novita.$HN.js, $(ls dist/giochi | wc -l) pezzi dei giochi in dist/giochi)"
