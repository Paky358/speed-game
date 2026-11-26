# 🏠📦 Costruisce la PORTA DI TRASLOCO in dist-porta/ (26 nov 2026, Revel House):
# è quello che resta sul vecchio indirizzo https://paky358.github.io/speed-game/ e porta tutti su revelhouse.it
# col profilo e le cose del telefono (js/trasloco.js). PORTA_A = dove porta (per le prove: un indirizzo del computer).
set -e
cd "$(dirname "$0")"
A="${PORTA_A:-https://revelhouse.it/}"
B="${PORTA_BASE:-/speed-game/}"   # dove sta la porta (la base serve alla pagina «non c è», che arriva da qualsiasi indirizzo)
rm -rf dist-porta; mkdir -p dist-porta/app
sed -e "s#window.SG_PORTA_A = \"https://revelhouse.it/\"#window.SG_PORTA_A = \"$A\"#" -e "s#<meta charset=\"utf-8\">#<meta charset=\"utf-8\"><base href=\"$B\">#" porta/index.html > dist-porta/index.html
cp dist-porta/index.html dist-porta/404.html   # (anche gli indirizzi che non ci sono più)
cp porta/porta.js porta/sw.js js/trasloco.js dist-porta/
cp porta/manifest.webmanifest dist-porta/app/manifest.webmanifest
cp app/icona.svg app/icona-piccola.svg app/icona-192.png app/icona-512.png app/icona-maschera-512.png app/icona-piena-180.png dist-porta/app/
touch dist-porta/.nojekyll
echo "Creata la porta di trasloco in dist-porta/ (porta a $A)"
