# Ecosistema sul web: Claude lavora al posto tuo

Non installi niente sul tuo computer. Tutto gira su **claude.ai/code**, in un computer cloud che si prepara da solo a ogni sessione: Node, FFmpeg, voce IA e skill di HyperFrames.
Tu dai il brief e approvi il copione. Claude registra l'app, scrive, dà la voce, monta, esporta e ti manda i video finiti.

```
Tu (browser o telefono)              Claude nel cloud (claude.ai/code)
──────────────────────               ─────────────────────────────────────────────────────
brief + "ok al copione"   ───►  registra la web app da solo (browser automatico)
                                cattura il sito (colori, logo, testi)
                                voce + musica (HeyGen, oppure gratis con Kokoro)
                                monta con HyperFrames ─► MP4 ─► FFmpeg (web, 9:16, GIF)
video finiti              ◄───  te li manda nella chat
```

## Passo 1 – Apri il progetto sul web (2 minuti)
1. Vai su **https://claude.ai/code** e accedi.
2. Scegli il repository **dariocavallone/claude** e il branch con il sistema (o `main`, dopo il merge).
3. Fatto: all'avvio parte da solo `scripts/setup-cloud.sh`, che installa tutto.

## Passo 2 – Configura l'ambiente cloud (una volta sola, 5 minuti)
Menu dell'ambiente nella barra del titolo della sessione → **Edit**:

**Network access** – scegli il livello che consente i domini qui sotto, oppure aggiungili in *Allowed domains* lasciando spuntato "Allow package managers":
- il dominio della tua app e del sito (es. `tuaapp.it`, `app.tuaapp.it`), così Claude può registrarli;
- `api.heygen.com` e `heygen.com`, se usi HeyGen;
- `generativelanguage.googleapis.com`, se usi la musica Lyria di Google;
- `cdn.jsdelivr.net`, `fonts.googleapis.com`, `fonts.gstatic.com` e `github.com` (blocchi grafici e font di HyperFrames).

**Variabili / segreti** – aggiungi solo quelle che ti servono:

| Nome | Cosa | Dove la prendi |
|---|---|---|
| `HEYGEN_API_KEY` | voce, musica e avatar di qualità | heygen.com → Settings → API |
| `GEMINI_API_KEY` | musica originale con Lyria (opzionale) | aistudio.google.com → Get API key (gratis) |
| `DEMO_EMAIL`, `DEMO_PASSWORD` | account **di prova** della tua app, per le registrazioni | crealo apposta, con dati finti |

Non incollare mai chiavi o password nella chat: mettile solo qui.
Nota: nel cloud HeyGen si usa con la **chiave API**, che consuma crediti API, separati dall'abbonamento web. Controlla il loro listino. Senza chiave, la voce gratuita Kokoro funziona comunque.

## Passo 3 – Chiedi il video
Nella sessione scrivi:

> /video-lancio
> App: **[NomeApp]**, sito **[url]**, web app **[url]**.
> Serve a **[chi]** per **[problema]**.
> Funzioni da mostrare: 1) … 2) … 3) …
> Voglio un video principale 16:9 da 60 secondi e uno short verticale per funzione.

Claude ti fa le domande mancanti tutte insieme, poi ti propone il **copione**: rispondi "ok" o chiedi modifiche.

## Passo 4 – Ricevi e rivedi
Ti arrivano in chat:
- il video per il web, con l'audio già al volume giusto per i social;
- la copertina;
- i sottotitoli `.srt` da caricare su YouTube o LinkedIn.

Chiedi le modifiche a parole (*"la scena 2 è lenta"*, *"voce maschile"*, *"colore #FF6B35"*): Claude rifà e ti rimanda il video.

## Se la tua app è solo mobile (iOS/Android)
Il cloud non ha un telefono. Registra tu lo schermo (registrazione integrata del telefono, 10–20 secondi per funzione) e caricala su GitHub in `assets/registrazioni/` (sul sito di GitHub: *Add file → Upload files*). Poi scrivi `/video-lancio` e Claude fa il resto.
Se esiste una versione web o una landing page, Claude registra quella.

## Costi
- Claude: il tuo abbonamento (Claude Code sul web è incluso nei piani che lo supportano).
- HyperFrames, FFmpeg, Kokoro, registrazione automatica: gratis.
- HeyGen (opzionale ma consigliato per la voce): crediti API in base all'uso.
- Higgsfield, Tella, Epidemic Sound: non servono.
