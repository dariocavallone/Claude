---
name: video-lancio
description: Produce da capo a fine i video di lancio dell'app (registrazioni automatiche della web app, voce IA, musica, montaggio HyperFrames, esportazione e consegna). Usala quando chiede di creare, rifare o variare un video di lancio, uno short o un demo dell'app.
---

# Video di lancio: lavora al posto dell'utente

L'utente non vuole fare passaggi tecnici. Tu fai tutto nel cloud e gli consegni i file finiti. Parla in italiano, in modo semplice.

## 1. Brief (una sola domanda, raccolta tutta insieme)
Se non li hai già, chiedi in un unico messaggio: nome dell'app, URL del sito e della web app, a chi serve e quale problema risolve, le 3–5 funzionalità da mostrare, il formato (principale 16:9 / short 9:16), il tono della voce, un account demo (deve arrivarti come variabile d'ambiente, mai incollato in chat).
Se manca qualcosa di non essenziale, decidi tu e dillo.

## 2. Materiale reale (mai interfacce inventate dall'IA)
- Sito/landing: `npx hyperframes capture <url> -o capture` (testi, colori, logo, screenshot).
- Web app: per ogni funzionalità scrivi `registrazioni/<nn>-<nome>.json` (vedi `registrazioni/esempio-aggiungi.json`) e lancia `node scripts/registra-web.mjs registrazioni/<file>.json`. Prima esplora la pagina con Playwright per trovare i selettori giusti. Dati di prova realistici, niente dati personali.
- App solo mobile, o file caricati dall'utente in `assets/registrazioni/`: puliscili con `bash scripts/prepara-registrazione.sh`.
- Logo: `assets/brand/logo.png` (dal capture, se l'utente non l'ha caricato).
- Un host bloccato dalla rete (`ERR_TUNNEL_CONNECTION_FAILED`, `connect_rejected`): di' all'utente quale dominio aggiungere in Network access dell'ambiente e prosegui con il resto.

## 3. Copione
Scrivi il copione (gancio, problema, 3 funzioni come benefici, CTA; frasi sotto le 15 parole) e **fallo approvare** prima di generare audio a pagamento.

## 4. Voce e musica
- `HEYGEN_API_KEY` presente e `api.heygen.com` raggiungibile → voce e musica HeyGen tramite `/media-use` (voce italiana del catalogo o voce clonata dell'utente).
- Altrimenti → Kokoro gratuito (`if_sara`, `im_nicola`) e musica: chiedi all'utente di caricare una traccia in `assets/musica/`, oppure, con `GEMINI_API_KEY`, generala con Lyria via `/media-use`.
- Prima di ogni chiamata che consuma crediti (avatar, video HeyGen) chiedi conferma.

## 5. Montaggio
- Video principale/creativo → `/product-launch-video` usando il materiale catturato e registrato.
- Serie di short coerenti → `video/<nome>.json` + `node scripts/crea-video.mjs video/<nome>.json`.
- Controlla sempre: `npx hyperframes check` sul progetto, poi guarda alcuni fotogrammi estratti con ffmpeg prima di consegnare.

## 6. Esportazione e consegna
- `bash scripts/esporta.sh output/<nome>.mp4 --gif` (aggiungi `--verticale` se serve).
- Consegna con SendUserFile: `-web.mp4`, `-copertina.jpg`, `.srt`. I video non vanno nel repo (sono in .gitignore).
- Fai commit e push di copioni, file azioni e modifiche agli script, non dei video.
- Chiudi con: cosa hai fatto, cosa non hai potuto fare e perché, cosa puoi chiedere di cambiare.
