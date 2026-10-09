# Sistema video di lancio

- I video si descrivono in `video/<nome>.json` (vedi README, sezione "Scrivi il copione"); `scripts/crea-video.mjs` genera `build/<nome>/` (progetto HyperFrames) e `output/<nome>.mp4`.
- Non modificare `build/<nome>/index.html` per cambi strutturali: è rigenerato. Cambia il JSON o il generatore.
- Voce: Kokoro via `npx hyperframes tts` (voci italiane `if_sara`, `im_nicola`), con cache in `build/.cache-voce`.
- Per lavori creativi oltre il template (intro animate, motion graphics) usa le skill HyperFrames (`/hyperframes`, `/product-launch-video`) e poi inserisci il risultato come scena `video-intero`.
- Lingua dei testi e dei commenti: italiano. Budget: 0 €, non proporre servizi a pagamento senza dirlo esplicitamente.
