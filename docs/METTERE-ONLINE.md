# Mettere il gioco online (per giocarci col telefono)

Serve per due cose: aprirlo dal telefono senza installare niente, e usare la
modalità **"ognuno dal suo telefono"**. Si fa una volta sola.

## Cosa serve
Un solo file: **`dist/serata-giochi.html`**. Dentro c'è tutta l'app. Va messo su
un sito che lo mostri a chiunque abbia il link.

## Il modo più semplice: Netlify Drop
1. Vai su **app.netlify.com/drop** (dal computer).
2. Trascina dentro il file `dist/serata-giochi.html` (oppure l'intera cartella `SG`).
3. In pochi secondi ti dà un **indirizzo** tipo `https://qualcosa.netlify.app`.
4. Per tenerlo per sempre ti chiede di **creare un account gratuito** (con email o
   Google): 2 minuti. Senza account il link resta attivo solo per poche ore.
5. Quell'indirizzo è il tuo gioco: mandalo agli amici, o aprilo tu.

> In alternativa esiste **tiiny.host**: stessa idea (trascini il file, ti dà un
> link). Va bene qualsiasi servizio che ospiti una pagina HTML.

## Come si gioca "ognuno dal suo telefono"
1. Tu (host) apri il sito, scegli **"Ognuno dal suo telefono"**, le categorie e le
   carte, poi **Comincia**: appare un **codice** (es. `KSU5`) e un **link da copiare**.
2. Mandi il link (o il codice) agli amici. Loro aprono il sito e:
   - se hanno il link, entrano diretti nella stanza;
   - altrimenti toccano **"Entra in una stanza"** e scrivono il codice.
3. Quando sono tutti in sala d'attesa, tocchi **Comincia**. Da lì gioca chi tocca,
   e gli altri vedono la partita aggiornarsi da sola.

## Da sapere
- **Il telefono dell'host è il "cervello" della partita**: se l'host chiude la
  pagina, la partita finisce per tutti. È normale — è l'host che conduce.
- Il collegamento tra telefoni usa un servizio pubblico gratuito: quasi sempre
  funziona subito; se una volta non si collega, riprovate a rientrare con lo stesso
  codice.
- La modalità **"un telefono solo"** funziona sempre, anche senza tutto questo.

## Quando aggiorno il gioco
Se cambio qualcosa, rigenero il file `dist/serata-giochi.html` (con
`costruisci-versione-online.sh`) e tu lo ricarichi sul sito (su Netlify: di nuovo
"Drop", oppure trascinandolo nel tuo sito esistente). Il link resta lo stesso.
