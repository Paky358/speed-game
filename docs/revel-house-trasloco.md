# 🏠📦 Il trasloco su Revel House (revelhouse.it)

Preparato il 26 nov 2026 nella chat «🏠 Revel House» (copia `D:\SG-revel`, ramo `revel-house`).
Regola del proprietario: **nessuno deve perdere i dati**.

## Come funziona, in parole semplici
- L'app va su **revelhouse.it**. Il lavoro resta dov'è oggi, nel repo `Paky358/speed-game`.
- Un push su `master` pubblica tutto da solo, come sempre: l'app va nel repo nuovo `Paky358/revelhouse`, che serve solo per il sito, col dominio revelhouse.it.
- Chi pubblica, compresa la chat di Mario, non cambia niente.
- Il vecchio indirizzo **https://paky358.github.io/speed-game/** diventa la **porta di trasloco**. Chi lo apre, anche dall'app installata, legge «SPeeD GAME ora si chiama Revel House». Il telefono:
  1. fa un pacco con l'accesso al profilo e con tutte le cose che ricorda (gettone, Compagnie, carte già uscite, regole…);
  2. lo chiude a chiave e lo lascia per 2 ore in Firestore;
  3. va su revelhouse.it col codice del pacco nel link, dopo il #. Quel pezzo del link non arriva a nessun server.
- Revel House apre il pacco, rimette tutto a posto e si riapre: si è dentro **senza password**. Poi legge «📲 Reinstalla l'app da qui», con la spiegazione per Android e per iPhone.
- **iPhone**: l'app rimessa sulla schermata Home parte vuota. Il benvenuto mostra un codice di 8 lettere (es. `RTWD-8AS5`, vale 2 ore). Nell'app nuova si tocca «📦 Ho un codice di trasloco» e lo si scrive.
- Nel profilo c'è anche «📲 Porta il profilo su un altro telefono». Fa un codice per entrare su un altro telefono senza password, utile a chi ha dimenticato la password ma è ancora dentro da qualche parte. In questo caso l'id del telefono e la partita da riprendere restano sul telefono di partenza.
- I link vecchi (`#sala=`, `#gruppo=` delle Compagnie, `#gioco=…&stanza=…`, gli inviti su WhatsApp) portano su revelhouse.it col pezzo dopo il # intatto. Funzionano anche gli indirizzi che non esistono più, grazie alla pagina 404.
- La vecchia app installata non resta bloccata sulla versione vecchia. Il suo service worker chiede sempre la pagina alla rete, quindi arriva la porta. Il service worker della porta prende il suo posto e butta i file vecchi.
- **Sicurezza**:
  - nel deposito c'è solo roba chiusa a chiave (AES-GCM, la chiave nasce dal codice) e il codice non ci va mai;
  - un pacco si legge solo sapendo il codice: 8 lettere a caso, cioè circa mille miliardi di combinazioni, e nessuno può elencare i pacchi;
  - dopo 2 ore non si legge più;
  - password e dati personali non vanno mai nell'indirizzo, e Revel House toglie subito il codice dall'indirizzo e dalla cronologia.
- **Limite che resta**: chi non riapre mai la vecchia app e ha dimenticato la password non si può recuperare. Non c'è un'email, come oggi.

## Le tre tappe (interruttore `FASE` in `.github/workflows/deploy.yml`)
1. **spento**: tutto come prima.
2. **anche** (26 nov 2026 sera, poche ore): dopo le impostazioni qui sotto, l'app va ANCHE su revelhouse.it. Il proprietario la prova dal suo telefono, e il vecchio indirizzo resta l'app normale.
3. **porta** (ACCESA dal 26 nov 2026 sera, oggi): quando il proprietario dice «pubblica il trasloco», il vecchio indirizzo diventa la porta.

## Cosa fa il proprietario (circa 20 minuti; le password le scrive solo lui)
### A. GitHub
1. https://github.com/new → nome del repository **revelhouse** → **Public** → «Create repository». Lasciarlo vuoto: lo riempie la pubblicazione.
2. Nel repo `revelhouse`: Settings → **Deploy keys** → «Add deploy key».
   - Title: `pubblica da speed-game`.
   - Key: la riga che comincia con `ssh-ed25519`, dal file `D:\SG-revel-prove\chiave\chiave-pubblica-da-incollare-come-deploy-key.txt` (preparata il 26 nov; nella stessa cartella c’è LEGGIMI.txt coi passi).
   - Spuntare **Allow write access** → «Add key».
3. Nel repo `speed-game`: Settings → Secrets and variables → **Actions** → «New repository secret».
   - Name: `CHIAVE_REVELHOUSE`.
   - Secret: tutto il contenuto di `D:\SG-revel-prove\chiave\CHIAVE-PRIVATA-da-incollare-come-segreto.txt` (aprirlo col Blocco note), comprese le righe `-----BEGIN…` e `-----END…`.
   - «Add secret».
4. Dopo la prima pubblicazione con `FASE: anche`, nel repo `revelhouse`: Settings → **Pages**.
   - Source: «Deploy from a branch», Branch: **gh-pages**, cartella **/ (root)** → Save.
   - Custom domain: **revelhouse.it** → Save.
   - Quando il controllo del dominio è verde, spuntare **Enforce HTTPS**. Il certificato può metterci fino a un giorno.
5. (Consigliato, protegge il dominio) La propria foto in alto a destra → Settings → **Pages** → «Add a domain» → `revelhouse.it`. GitHub dà un record TXT da mettere su Aruba (punto B.4), poi «Verify».

### B. Aruba (pannello del dominio revelhouse.it → Gestione DNS)
1. Togliere i record **A** e **CNAME** di partenza di Aruba per `revelhouse.it` e `www` (quelli che puntano alla pagina di parcheggio di Aruba).
2. Aggiungere 4 record **A** per il dominio senza niente davanti (`@` o vuoto):
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
3. Aggiungere un record **CNAME**: nome `www`, valore `paky358.github.io`. Così www.revelhouse.it porta a revelhouse.it.
   - (Facoltativi, per chi ha internet nuovo) 4 record **AAAA** per `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
4. Il record **TXT** del punto A.5: nome `_github-pages-challenge-paky358`, valore quello che dà GitHub.
I cambi del DNS possono metterci da qualche minuto a qualche ora.

### C. Firebase (console.firebase.google.com → progetto speed-game-33c5b)
1. Authentication → Settings → **Authorized domains** → «Add domain»: `revelhouse.it`, poi di nuovo per `www.revelhouse.it`.
2. Firestore Database → **Rules**: incollare questo blocco dentro `match /databases/{database}/documents { … }`, accanto agli altri `match`, poi «Publish». Si può anche incollare tutte le regole a Claude, che le rimanda pronte.
```
    // 🏠📦 il trasloco su Revel House (js/trasloco.js): pacchi chiusi a chiave, leggibili 2 ore solo da chi ha il codice
    match /traslochi/{id} {
      allow get: if resource.data.scade > request.time;
      allow create: if request.auth != null
        && request.resource.data.da == request.auth.uid
        && request.resource.data.keys().hasOnly(['dati', 'sale', 'iv', 'z', 'v', 'scade', 'da'])
        && request.resource.data.dati is bytes && request.resource.data.dati.size() < 1000000
        && request.resource.data.scade is timestamp
        && request.resource.data.scade < request.time + duration.value(3, 'h');
      allow delete: if request.auth != null && resource.data.da == request.auth.uid;
      allow list, update: if false;
    }
```
3. (Solo se la chiave è limitata) https://console.cloud.google.com → progetto speed-game-33c5b → APIs & Services → Credentials → «Browser key (auto created by Firebase)». Se «Application restrictions» è su «Websites», aggiungere `https://revelhouse.it/*` e `https://www.revelhouse.it/*`. Se è su «None» non serve niente.
4. (Facoltativo, fa pulizia) Firestore → TTL policies → «Create policy»: collection group `traslochi`, campo `scade`. I pacchi scaduti spariscono da soli.

## Il messaggio per Mario (da mandargli quando si accende la tappa 2)
> Ciao Mario! SPeeD GAME cambia nome: si chiama **Revel House** e va su **revelhouse.it**.
> Per te non cambia niente: lavori sempre su `Paky358/speed-game` e pubblichi come sempre su `master`. A ogni push la pubblicazione mette l'app su revelhouse.it da sola (con un repo nuovo, `Paky358/revelhouse`, che non devi toccare).
> Il vecchio indirizzo paky358.github.io/speed-game diventerà una pagina di trasloco che porta tutti sul sito nuovo col loro profilo.
> Cose da sapere:
> - nel file `.github/workflows/deploy.yml` c'è l'interruttore `FASE`: non toccarlo;
> - nei testi l'app ora si chiama «Revel House»;
> - se Lanterne fa link al sito, usa `https://revelhouse.it/`.

## Prove (tutte sul computer, Firebase vero mai toccato)
- `.agents/skills/prova-nel-browser/revel/trasloco.js` (tr1-tr6): prima `bash costruisci-versione-online.sh`, `PORTA_A=http://127.0.0.1:8973/ PORTA_BASE=/ bash costruisci-porta.sh`, e la vecchia app costruita in `D:/SG-revel-prove/vecchio/dist`.
- `.agents/skills/prova-nel-browser/revel/prove.js` (rh1, rh2: nome nuovo e giochi nascosti) con `prova.js --carica revel/prove.js`.
- Foto: `D:\SG-revel-prove\foto`.
