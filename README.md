# Sistema video per il lancio dell'app (costo: 0 €)

Scrivi un file JSON con le scene → il sistema genera la **voce italiana con l'IA (gratis, sul tuo PC)**, monta le registrazioni dello schermo dentro un mockup di telefono/browser, aggiunge **animazioni, musica e sottotitoli**, e produce l'MP4 pronto per YouTube, Instagram, TikTok e LinkedIn.

```
copione (JSON) ─► voce IA (Kokoro) ─► composizione HyperFrames ─► MP4 ─► FFmpeg (web, 9:16, GIF, copertina)
registrazioni schermo ─► FFmpeg (pulizia) ──┘
```

---

## 1. Analisi degli strumenti che hai citato

| Strumento | A cosa serve | Costo reale | Verdetto |
|---|---|---|---|
| **HyperFrames** (HeyGen) | Crea video da HTML/CSS + animazioni GSAP. Renderizza in MP4 con Chrome + FFmpeg. Ha anche la **voce IA locale** (`hyperframes tts`) e la trascrizione | **Gratis**, open source (Apache 2.0) | ✅ **Il cuore del sistema.** Fa da "Premiere" programmabile, e Claude Code sa usarlo |
| **FFmpeg** | Taglia, accelera, ritaglia, comprime, normalizza l'audio, crea versioni 9:16 e GIF | **Gratis**, open source | ✅ **Indispensabile** (HyperFrames lo richiede comunque) |
| **Tella** | Registrazione schermo + webcam con editing | **Solo prova di 7 giorni**, poi a pagamento (non c'è più un piano gratis) | ⚠️ **Sostituibile.** Usa OBS / Cap / QuickTime (gratis). Usa Tella solo se vuoi la tua faccia in webcam, concentrando tutte le registrazioni nei 7 giorni di prova |
| **Epidemic Sound** | Musica senza copyright | Ricerca gratis, ma **scaricare richiede abbonamento** (~10 €/mese) | ⚠️ **Sostituibile.** Usa YouTube Audio Library, Pixabay Music o Uppbeat (gratis). Ha senso solo se vuoi il loro catalogo: 1 mese di prova/abbonamento e poi disdici |
| **Higgsfield** | Genera video/immagini con IA (b-roll, scene cinematografiche) | Piano free **senza crediti**; via MCP consuma sempre crediti | ❌ **Non necessario** per mostrare le funzioni di un'app. Utile solo per un'intro "cinematografica": eventualmente compra un pacchetto minimo di crediti per 1–2 clip |

### Cosa ho aggiunto (tutto gratis)

| Necessità | Strumento | Perché |
|---|---|---|
| **Voce narrante** | **Kokoro TTS** (incluso in HyperFrames) | Gira sul tuo PC, nessun account. Voci italiane: `if_sara` (donna), `im_nicola` (uomo) |
| Registrare lo schermo | **OBS Studio** (Win/Mac/Linux), **Cap** (Mac/Win), **QuickTime** (Mac, anche per iPhone via cavo), **scrcpy** (Android) | Sostituiscono Tella a 0 € |
| Musica | **YouTube Audio Library**, **Pixabay Music**, **Uppbeat** (piano free) | Sostituiscono Epidemic Sound a 0 € |
| Regia/automazione | **Claude Code** + skill di HyperFrames | Gli chiedi "aggiungi una scena", "rendi più energico il ritmo" e lui modifica e renderizza |
| (Opzionale) voce più "umana" | ElevenLabs piano free (~10 min/mese) | Solo se Kokoro non ti convince: genera il `.wav` e mettilo come voce |

**Totale: 0 €.** Unica spesa sensata se vuoi alzare la qualità: 1 mese di Epidemic Sound (~10 €) per la musica.

### Connettori / MCP

- **HyperFrames skills per Claude Code** – fondamentali: `npx skills add heygen-com/hyperframes` (o il plugin `claude plugin marketplace add heygen-com/hyperframes`). Includono il flusso `/product-launch-video`.
- **Epidemic Sound MCP** e **Higgsfield MCP** – esistono, ma servono abbonamento/crediti: **non installarli** finché resti a 0 €.

---

## 2. Setup passo passo (una volta sola, ~20 minuti)

**Passo 1 – Installa i programmi base**
- **Node.js 22+** (versione LTS): https://nodejs.org
- **FFmpeg**: Mac `brew install ffmpeg` · Windows `winget install Gyan.FFmpeg` · Linux `sudo apt install ffmpeg`
- **Python 3.10+**: https://python.org (su Windows spunta "Add to PATH")
- **Google Chrome** (HyperFrames lo usa per il render)

**Passo 2 – Scarica questo progetto e installa le dipendenze**
```bash
git clone https://github.com/dariocavallone/claude.git video-lancio
cd video-lancio
npm install
python3 -m pip install kokoro-onnx soundfile     # voce IA locale
```

**Passo 3 – (Consigliato) Collega Claude Code a HyperFrames**
```bash
npx skills add heygen-com/hyperframes
```

**Passo 4 – Verifica che sia tutto ok**
```bash
bash scripts/verifica-setup.sh
```
Deve finire con 🎉. Su Windows usa **Git Bash** o **WSL** per gli script `.sh`.

**Passo 5 – Installa un registratore schermo gratis**: OBS Studio (https://obsproject.com) o Cap (https://cap.so).

---

## 3. Come creare un video (ogni volta)

**Passo 1 – Prepara il brand.** Metti il logo in `assets/brand/logo.png` (quadrato, sfondo pieno).

**Passo 2 – Registra le funzionalità** (una clip per funzione, 10–20 s ciascuna).
- App mobile: iPhone → collegalo al Mac e usa QuickTime "Nuova registrazione filmato" scegliendo l'iPhone; Android → `scrcpy --record rec.mp4`. In alternativa la registrazione schermo integrata del telefono.
- Web app: OBS, finestra del browser a 1440×900, zoom al 125%.
- Consigli: modalità "non disturbare", dati di esempio realistici, movimenti lenti, nessuna info personale.

**Passo 3 – Pulisci le registrazioni con FFmpeg**
```bash
bash scripts/prepara-registrazione.sh ~/Desktop/rec1.mov 01-aggiungi --da 2 --a 16 --velocita 1.2
```
Opzioni: `--da`/`--a` (taglio), `--velocita`, `--ritaglia W:H:X:Y` (togli barre di stato), `--fps`. Il risultato va in `assets/registrazioni/`.

**Passo 4 – Scarica la musica** (es. da Pixabay Music, genere "corporate/upbeat") e salvala come `assets/musica/traccia.mp3`.

**Passo 5 – Scrivi il copione** copiando `video/lancio.json`. Tipi di scena:

| `tipo` | Cosa mostra | Campi |
|---|---|---|
| `titolo` | Logo + nome app + slogan | `titolo`, `sottotitolo`, `voce` |
| `funzione` | Testo a sinistra, registrazione dentro il telefono/browser a destra | `etichetta`, `titolo`, `descrizione`, `video`, `inizioVideo`, `dispositivo`, `voce` |
| `video-intero` | Una clip a tutto schermo (es. da Higgsfield o Tella) | `video`, `titolo`, `voce` |
| `cta` | Invito all'azione + URL | `titolo`, `sottotitolo`, `voce` |

Il campo `voce` è il testo che la voce IA leggerà: **la durata di ogni scena si adatta automaticamente alla voce.**
Impostazioni generali: `formato` (`orizzontale`, `verticale`, `quadrato`), `dispositivo` (`telefono`, `browser`), `stile.colore` (colore del brand), `voce.id` e `voce.velocita`, `musica.volume`, `sottotitoli`.

**Passo 6 – Genera il video**
```bash
node scripts/crea-video.mjs video/lancio.json --bozza       # prova veloce
node scripts/crea-video.mjs video/lancio.json --anteprima   # Studio nel browser per rivedere
node scripts/crea-video.mjs video/lancio.json               # versione finale -> output/lancio.mp4 + lancio.srt
```

**Passo 7 – Esporta per i canali**
```bash
bash scripts/esporta.sh output/lancio.mp4 --verticale --quadrato --gif
```
Ottieni: `-web.mp4` (audio a −14 LUFS, standard dei social), `-9x16.mp4`, `-1x1.mp4`, `.gif`, `-copertina.jpg`. Carica anche il file `.srt` su YouTube/LinkedIn come sottotitoli.

---

## 4. Piano video consigliato per il lancio

1. **Video principale** (60–90 s, orizzontale) – `video/lancio.json`: problema → app → 3 funzioni chiave → CTA. Per sito, YouTube, Product Hunt, App Store preview.
2. **Uno short per funzione** (15–30 s, verticale) – `video/short-funzione-1.json`: un gancio nei primi 2 secondi, una sola funzione, CTA. Per Reels, TikTok, Shorts.
3. **(Opzionale) Tutorial** con la tua faccia: registralo con Tella durante la prova gratuita o con OBS + webcam, poi inseriscilo come scena `video-intero`.

Regole del copione: frasi brevi (max ~15 parole), parla di **benefici** non di pulsanti, una funzione per scena, CTA chiara alla fine.

---

## 5. Usare Claude Code come "montatore"

Apri il progetto con Claude Code e chiedi, ad esempio:
- "Crea `video/short-funzione-2.json` per la funzione promemoria, verticale, voce maschile"
- "Il video principale è troppo lento: accorcia i testi della voce e aumenta la velocità a 1.1"
- "Usa /product-launch-video per creare un'intro animata a partire dal sito miaapp.it"

## Struttura

```
video/                    copioni JSON (uno per video)
assets/brand|registrazioni|musica|clip   i tuoi materiali
scripts/crea-video.mjs    voce IA + composizione + render
scripts/prepara-registrazione.sh   pulizia registrazioni (FFmpeg)
scripts/esporta.sh        versioni web / 9:16 / 1:1 / GIF / copertina (FFmpeg)
scripts/verifica-setup.sh controllo prerequisiti
build/<nome>/             progetto HyperFrames generato (modificabile a mano o con Claude)
output/                   video finali e sottotitoli
```
