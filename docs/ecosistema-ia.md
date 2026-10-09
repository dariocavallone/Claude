# Ecosistema 100% IA (senza Higgsfield)

L'idea: **un solo motore (HyperFrames) e un solo account a pagamento (HeyGen)**. Claude Code fa da regista.
HyperFrames ha già dentro le integrazioni: con il tuo account HeyGen genera voce, musica, effetti sonori, immagini e un presentatore avatar, senza altri servizi.

```
                 ┌──────────── Claude Code (regista) ─────────────┐
                 │  skill HyperFrames: /product-launch-video      │
                 └───────────────┬────────────────────────────────┘
                                 ▼
   schermate reali ──►   HyperFrames (motore video, gratis)   ──► MP4 ──► scripts/esporta.sh
   (capture / registrazioni)      │
                                  ├─ voce IA ............ HeyGen (Kokoro gratis come riserva)
                                  ├─ musica + effetti ... catalogo HeyGen (o Lyria di Google)
                                  ├─ immagini ........... HeyGen
                                  └─ presentatore avatar  HeyGen
   (opzionale) scene cinematografiche ── Google Veo ──► assets/clip/ ──► scena "video-intero"
```

| Ruolo | Chi | Costo |
|---|---|---|
| Regista (copione, montaggio, modifiche) | Claude Code | il tuo abbonamento Claude |
| Motore video | HyperFrames | gratis |
| Voce, musica, SFX, immagini, avatar | **HeyGen** (collegato a HyperFrames) | abbonamento HeyGen (c'è anche una quota gratuita limitata) |
| Musica generata su misura *(opzionale)* | Google Lyria via chiave Gemini | piano gratuito di Google AI Studio |
| Scene cinematografiche *(opzionale)* | Google Veo (abbonamento Google AI) | solo se ti servono davvero |
| Schermate dell'app | la tua app vera | gratis |

> Perché le schermate restano reali: i modelli video inventano l'interfaccia (pulsanti e testi sbagliati). L'IA fa regia, voce, musica e grafica; l'app si mostra com'è.

---

## Fase 1 – Base (già fatta se hai seguito il README)
```bash
bash scripts/verifica-setup.sh        # Node 22+, FFmpeg, Python, Chrome
```

## Fase 2 – Claude Code + skill di HyperFrames
1. Installa Claude Code: https://claude.com/claude-code
2. Nella cartella del progetto:
   ```bash
   npx hyperframes skills update                    # skill principali
   npx hyperframes skills update product-launch-video
   ```
   In alternativa, come plugin:
   ```bash
   claude plugin marketplace add heygen-com/hyperframes
   claude plugin install hyperframes@hyperframes
   ```
3. Riapri Claude Code: devi vedere i comandi `/hyperframes` e `/product-launch-video`.

## Fase 3 – Account HeyGen collegato a HyperFrames
1. Crea l'account su https://www.heygen.com e scegli il piano (puoi partire con quello gratuito e passare a pagamento quando produci i video finali).
2. Installa la CLI di HeyGen seguendo https://developers.heygen.com/cli, poi:
   ```bash
   heygen update
   heygen auth login --oauth          # usa i crediti del tuo abbonamento
   npx hyperframes auth login         # collega HyperFrames allo stesso account
   npx hyperframes auth status        # verifica
   npx hyperframes media-use resolve --doctor   # controlla voce/musica/immagini/avatar
   ```
   Usa `--oauth` e non `--api-key`: con la chiave API paghi i crediti API a parte.

## Fase 4 – (Opzionale) La tua voce clonata
Nel pannello HeyGen crea un clone della tua voce (1–2 minuti di audio pulito, letto con calma). Poi chiedi a Claude: *"usa la mia voce clonata HeyGen per la narrazione"*. Il video lo racconti tu, senza registrare niente.
Senza clone: chiedi una voce italiana del catalogo HeyGen; Kokoro (`if_sara`, `im_nicola`) resta la riserva gratuita.

## Fase 5 – (Opzionale) Chiave Gemini per musica su misura
1. https://aistudio.google.com → "Get API key" (gratis).
2. Salvala nel terminale: `export GEMINI_API_KEY=la-tua-chiave` (su Windows: variabili d'ambiente).
3. HyperFrames potrà generare una colonna sonora originale con Lyria invece di prenderla dal catalogo.

## Fase 6 – Prepara il materiale reale dell'app
- **Sito o landing page** – lo cattura HyperFrames da solo (testi, colori, immagini, screenshot):
  ```bash
  npx hyperframes capture https://tuaapp.it -o capture
  ```
- **App (web o mobile)** – una registrazione per funzione, pulita con:
  ```bash
  bash scripts/prepara-registrazione.sh rec.mov 01-funzione --da 2 --velocita 1.2
  ```
- **Logo** in `assets/brand/logo.png`.

## Fase 7 – Produci il video con Claude
Apri Claude Code nella cartella del progetto e scrivi, ad esempio:

> Usa /product-launch-video per creare il video di lancio di **[NomeApp]** in italiano, 60–75 secondi, formato 16:9.
> Brief: [a chi serve l'app e che problema risolve].
> Funzionalità da mostrare, nell'ordine: 1) … 2) … 3) …, usando le registrazioni in `assets/registrazioni/`.
> Materiale del sito in `capture/`. Voce: italiana HeyGen [oppure: la mia voce clonata], tono amichevole e sicuro.
> Musica dal catalogo HeyGen, energica ma sotto la voce. Sottotitoli in italiano.
> Chiudi con CTA "Scaricala gratis" e l'URL tuaapp.it.

Claude scrive il copione, te lo fa approvare, genera voce e musica, monta e renderizza.
Poi crea le varianti:

> Ora fai 3 short verticali 9:16 da 20 secondi, uno per funzione, con un gancio nei primi 2 secondi.

## Fase 8 – Revisione ed esportazione
```bash
npx hyperframes preview            # Studio nel browser: rivedi e chiedi modifiche a Claude
bash scripts/esporta.sh output/<video>.mp4 --gif   # versione web, copertina, GIF
```
Modifiche tipiche da chiedere: *"accorcia la scena 2"*, *"voce più lenta"*, *"musica più bassa"*, *"cambia il colore in #FF6B35"*.

## Fase 9 – (Opzionale) Presentatore e scene cinematografiche
- **Avatar presentatore HeyGen**: *"aggiungi un avatar HeyGen che introduce l'app nei primi 8 secondi"*. Consuma crediti: Claude ti chiede conferma prima di spenderli.
- **Scene "da spot"** (persone che usano il telefono, ambienti): generale con Google Veo, salvale in `assets/clip/` e chiedi a Claude di inserirle. Fallo solo se lo spot lo richiede: per mostrare un'app di solito non serve.

---

## Due modi di lavorare
| | Template veloce (`scripts/crea-video.mjs`) | Creativo (`/product-launch-video`) |
|---|---|---|
| Come | Compili un JSON | Lo chiedi a Claude a parole |
| Risultato | Stile coerente, ripetibile | Grafica e animazioni su misura |
| Ideale per | Serie di short tutti uguali | Video principale di lancio |

## Checklist dei costi
- Obbligatori: abbonamento Claude (per Claude Code) + **HeyGen** (voce, musica, avatar).
- Gratis: HyperFrames, FFmpeg, Kokoro, chiave Gemini (quota gratuita), cattura del sito.
- Non servono: Higgsfield, Tella, Epidemic Sound, ElevenLabs.
- Consiglio: abbonati a HeyGen per **un mese**, produci tutti i video del lancio, poi valuta se disdire.
