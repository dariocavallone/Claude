#!/usr/bin/env node
// Crea un video di lancio da un file di configurazione JSON.
//
//   node scripts/crea-video.mjs video/lancio.json            -> genera + renderizza output/lancio.mp4
//   node scripts/crea-video.mjs video/lancio.json --bozza    -> render veloce a bassa qualità
//   node scripts/crea-video.mjs video/lancio.json --solo-html -> genera solo il progetto HyperFrames (build/lancio)
//   node scripts/crea-video.mjs video/lancio.json --anteprima -> apre lo Studio di HyperFrames nel browser
//
// Pipeline: testo della voce -> Kokoro TTS (locale, gratis) -> durate misurate con ffprobe
//           -> composizione HTML/GSAP -> render HyperFrames (Chrome + FFmpeg) -> MP4 + sottotitoli .srt

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HF_VERSION = "0.8.143";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HF = ["--yes", `hyperframes@${HF_VERSION}`];

const FORMATI = {
  orizzontale: { w: 1920, h: 1080 },
  verticale: { w: 1080, h: 1920 },
  quadrato: { w: 1080, h: 1080 },
};

// ---------------------------------------------------------------- argomenti
const args = process.argv.slice(2);
const configPath = args.find((a) => !a.startsWith("--"));
const flag = (f) => args.includes(f);
if (!configPath) {
  console.error("Uso: node scripts/crea-video.mjs video/<nome>.json [--bozza|--solo-html|--anteprima]");
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(path.resolve(configPath), "utf8"));
const nome = cfg.nome || path.basename(configPath, ".json");
const formato = FORMATI[cfg.formato || "orizzontale"];
if (!formato) throw new Error(`formato sconosciuto: ${cfg.formato} (usa ${Object.keys(FORMATI).join(", ")})`);
const app = cfg.app || {};
const brand = { colore: "#6C5CE7", sfondo: "#0B0B12", testo: "#F5F5F7", ...(cfg.stile || {}) };
const voce = { id: "if_sara", velocita: 1.0, ...(cfg.voce || {}) };
const PAUSA_PRIMA = 0.5; // secondi di respiro prima che parli la voce
const PAUSA_DOPO = 0.7;

const buildDir = path.join(ROOT, "build", nome);
const cacheDir = path.join(ROOT, "build", ".cache-voce");
fs.mkdirSync(path.join(buildDir, "assets"), { recursive: true });
fs.mkdirSync(cacheDir, { recursive: true });

// ---------------------------------------------------------------- utilità
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const r2 = (n) => Math.round(n * 100) / 100;

function durata(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  return parseFloat(out.toString().trim());
}

// Copia un file del progetto (assets/...) dentro build/<nome>/assets e restituisce il percorso relativo.
function copiaAsset(rel) {
  if (!rel) return null;
  const src = path.resolve(ROOT, rel);
  if (!fs.existsSync(src)) {
    console.warn(`⚠️  File non trovato: ${rel} (la scena userà un segnaposto)`);
    return null;
  }
  const dest = path.join(buildDir, "assets", path.basename(src));
  fs.copyFileSync(src, dest);
  return `assets/${path.basename(src)}`;
}

function copiaModulo(rel, nomeFile = path.basename(rel)) {
  const src = path.join(ROOT, "node_modules", rel);
  if (!fs.existsSync(src)) throw new Error(`Manca ${rel}: esegui "npm install" nella cartella del progetto`);
  fs.copyFileSync(src, path.join(buildDir, "assets", nomeFile));
  return nomeFile;
}

function generaVoce(testo) {
  const key = createHash("sha1").update(`${voce.id}|${voce.velocita}|${testo}`).digest("hex").slice(0, 12);
  const wav = path.join(cacheDir, `${key}.wav`);
  if (!fs.existsSync(wav)) {
    const txt = path.join(cacheDir, `${key}.txt`);
    fs.writeFileSync(txt, testo);
    console.log(`🎙️  Voce (${voce.id}): "${testo.slice(0, 60)}${testo.length > 60 ? "…" : ""}"`);
    const res = spawnSync("npx", [...HF, "tts", txt, "--voice", voce.id, "--speed", String(voce.velocita), "-o", wav], {
      stdio: ["ignore", "ignore", "inherit"],
    });
    if (res.status !== 0 || !fs.existsSync(wav)) throw new Error("Generazione voce fallita: esegui scripts/verifica-setup.sh");
  }
  const dest = path.join(buildDir, "assets", `voce-${key}.wav`);
  fs.copyFileSync(wav, dest);
  return { src: `assets/voce-${key}.wav`, durata: durata(wav) };
}

// Divide il testo in frasi brevi per i sottotitoli, con tempi proporzionali alla lunghezza.
function sottotitoli(testo, inizio, dur) {
  const pezzi = testo
    .split(/(?<=[.!?;:])\s+|(?<=,)\s+(?=\S{4,})/)
    .flatMap((p) => {
      const parole = p.split(/\s+/);
      const out = [];
      for (let i = 0; i < parole.length; i += 8) out.push(parole.slice(i, i + 8).join(" "));
      return out;
    })
    .filter(Boolean);
  const tot = pezzi.reduce((a, p) => a + p.length, 0);
  let t = inizio;
  return pezzi.map((p) => {
    const d = (p.length / tot) * dur;
    const c = { testo: p, inizio: r2(t), durata: r2(d) };
    t += d;
    return c;
  });
}

// ---------------------------------------------------------------- timeline
const scene = [];
let t = 0;
for (const [i, s] of (cfg.scene || []).entries()) {
  const v = s.voce ? generaVoce(s.voce) : null;
  const minima = s.durata || (s.tipo === "titolo" || s.tipo === "cta" ? 3.5 : 5);
  const dur = r2(Math.max(minima, v ? PAUSA_PRIMA + v.durata + PAUSA_DOPO : 0));
  const media = copiaAsset(s.video || s.immagine);
  if (s.video && media) {
    const disponibile = durata(path.resolve(ROOT, s.video)) - (s.inizioVideo || 0);
    if (disponibile < dur) console.warn(`⚠️  Scena ${i + 1}: la registrazione dura ${disponibile.toFixed(1)}s ma la scena ${dur}s (rallentala o registra più a lungo)`);
  }
  scene.push({ ...s, idx: i, start: r2(t), dur, voceAudio: v, media });
  t += dur;
}
const totale = r2(t);
const logo = copiaAsset(app.logo);
const musica = cfg.musica?.file ? copiaAsset(cfg.musica.file) : null;

// ---------------------------------------------------------------- HTML scene
function dispositivo(s) {
  const tipo = s.dispositivo || cfg.dispositivo || "telefono";
  const inner = !s.media
    ? `<div class="placeholder">Registrazione<br/>mancante</div>`
    : s.video
      ? `<video id="v${s.idx}" class="clip schermo" src="${s.media}" data-start="${s.start}" data-duration="${s.dur}" data-media-start="${s.inizioVideo || 0}" data-track-index="1" muted playsinline></video>`
      : `<img class="schermo" src="${s.media}" alt="" />`;
  if (tipo === "browser")
    return `<div class="browser"><div class="barra"><i></i><i></i><i></i><span>${esc(app.url || "")}</span></div><div class="vetro">${inner}</div></div>`;
  return `<div class="telefono"><div class="vetro">${inner}</div></div>`;
}

function htmlScena(s) {
  const id = `s${s.idx}`;
  const base = `id="${id}" class="clip scena scena-${s.tipo}" data-start="${s.start}" data-duration="${s.dur}" data-track-index="0"`;
  switch (s.tipo) {
    case "titolo":
      return `<section ${base}>
        ${logo ? `<img class="logo anim" src="${logo}" alt="" />` : ""}
        <h1 class="anim">${esc(s.titolo || app.nome)}</h1>
        ${s.sottotitolo ? `<p class="sotto anim">${esc(s.sottotitolo)}</p>` : ""}
      </section>`;
    case "funzione":
      return `<section ${base}>
        <div class="testo">
          ${s.etichetta ? `<span class="etichetta anim">${esc(s.etichetta)}</span>` : ""}
          <h2 class="anim">${esc(s.titolo)}</h2>
          ${s.descrizione ? `<p class="anim">${esc(s.descrizione)}</p>` : ""}
        </div>
        <div class="media anim-media">${dispositivo(s)}</div>
      </section>`;
    case "video-intero":
      return `<section ${base}>
        ${s.media ? `<video id="v${s.idx}" class="clip pieno" src="${s.media}" data-start="${s.start}" data-duration="${s.dur}" data-media-start="${s.inizioVideo || 0}" data-track-index="1" muted playsinline></video>` : ""}
        ${s.titolo ? `<h2 class="sovraimpresso anim">${esc(s.titolo)}</h2>` : ""}
      </section>`;
    case "cta":
      return `<section ${base}>
        ${logo ? `<img class="logo anim" src="${logo}" alt="" />` : ""}
        <h1 class="anim">${esc(s.titolo || "Scaricala ora")}</h1>
        ${s.sottotitolo ? `<p class="sotto anim">${esc(s.sottotitolo)}</p>` : ""}
        ${app.url ? `<div class="url anim">${esc(app.url)}</div>` : ""}
      </section>`;
    default:
      throw new Error(`tipo di scena sconosciuto: ${s.tipo} (usa titolo, funzione, video-intero, cta)`);
  }
}

const tutteCaption = scene.flatMap((s) => (s.voce ? sottotitoli(s.voce, s.start + PAUSA_PRIMA, s.voceAudio.durata) : []));
// sottotitoli "bruciati" nel video (utili sui social, dove si guarda senza audio)
const caption = cfg.sottotitoli === false ? [] : tutteCaption;

const audio = [
  ...scene
    .filter((s) => s.voceAudio)
    .map((s) => `<audio id="a${s.idx}" class="clip" src="${s.voceAudio.src}" data-start="${r2(s.start + PAUSA_PRIMA)}" data-duration="${r2(s.voceAudio.durata)}" data-volume="1" data-track-index="3"></audio>`),
  musica
    ? `<audio id="musica" class="clip" src="${musica}" data-start="0" data-duration="${totale}" data-media-start="${cfg.musica.inizio || 0}" data-volume="${cfg.musica.volume ?? 0.15}" data-fade-in="1" data-fade-out="2.5" data-track-index="4"></audio>`
    : "",
].join("\n      ");

// GSAP e il font Inter vengono copiati in locale (da node_modules): il render funziona anche offline.
copiaModulo("gsap/dist/gsap.min.js", "gsap.min.js");
const font = brand.font || "Inter";
const fontHead =
  font === "Inter"
    ? `<style>${[400, 600, 800]
        .map((w) => `@font-face { font-family: "Inter"; font-weight: ${w}; font-display: block; src: url("assets/${copiaModulo(`@fontsource/inter/files/inter-latin-${w}-normal.woff2`)}") format("woff2"); }`)
        .join(" ")}</style>`
    : `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;800&display=block" rel="stylesheet" />`;

const verticale = formato.h > formato.w;
const scala = Math.min(formato.w, formato.h) / 1080;

const html = `<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${formato.w}, height=${formato.h}" />
    <!-- GENERATO da scripts/crea-video.mjs a partire da ${path.relative(ROOT, path.resolve(configPath))}: modifica il JSON, non questo file -->
    ${fontHead}
    <script src="assets/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${formato.w}px; height: ${formato.h}px; overflow: hidden; background: ${brand.sfondo}; }
      #root { position: relative; width: 100%; height: 100%; color: ${brand.testo};
        font-family: "${font}", ui-sans-serif, system-ui, sans-serif; }
      .scena { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; overflow: hidden;
        background: radial-gradient(120% 90% at 15% 10%, ${brand.colore}55 0%, transparent 55%),
                    radial-gradient(90% 80% at 100% 100%, ${brand.colore}33 0%, transparent 60%), ${brand.sfondo}; }
      .scena-titolo, .scena-cta { flex-direction: column; gap: ${28 * scala}px; text-align: center; padding: ${80 * scala}px; }
      .logo { width: ${150 * scala}px; height: ${150 * scala}px; object-fit: contain; border-radius: ${34 * scala}px; }
      h1 { font-size: ${(verticale ? 120 : 132) * scala}px; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
      h2 { font-size: ${(verticale ? 84 : 76) * scala}px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; }
      p { font-size: ${(verticale ? 44 : 38) * scala}px; line-height: 1.35; opacity: 0.82; }
      .sotto { max-width: ${verticale ? 900 : 1300}px; }
      .url { margin-top: ${10 * scala}px; padding: ${18 * scala}px ${44 * scala}px; border-radius: 999px; background: ${brand.colore};
        font-size: ${40 * scala}px; font-weight: 600; color: #fff; }
      .scena-funzione { flex-direction: ${verticale ? "column" : "row"}; gap: ${(verticale ? 70 : 110) * scala}px;
        padding: ${verticale ? "160px 80px 260px" : "0 140px"}; ${verticale ? "justify-content: flex-start;" : ""} }
      .testo { flex: ${verticale ? "0 0 auto" : "1 1 0"}; display: flex; flex-direction: column; gap: ${24 * scala}px;
        ${verticale ? "text-align: center; align-items: center;" : ""} }
      .etichetta { align-self: ${verticale ? "center" : "flex-start"}; padding: ${10 * scala}px ${24 * scala}px; border-radius: 999px;
        background: ${brand.colore}33; color: ${brand.colore}; border: 2px solid ${brand.colore}88;
        font-size: ${28 * scala}px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
      .media { flex: 0 0 auto; display: flex; align-items: center; justify-content: center; }
      .telefono { width: ${verticale ? 620 : 400}px; aspect-ratio: 9 / 19.5; padding: 14px; border-radius: 64px; background: #050507;
        box-shadow: 0 0 0 3px #2a2a33, 0 50px 120px -20px ${brand.colore}77, 0 30px 60px rgba(0,0,0,.55); }
      .browser { width: ${verticale ? 940 : 1060}px; aspect-ratio: 16 / 10.6; border-radius: 22px; overflow: hidden; background: #15151c;
        box-shadow: 0 0 0 2px #2a2a33, 0 50px 120px -20px ${brand.colore}77, 0 30px 60px rgba(0,0,0,.55); display: flex; flex-direction: column; }
      .barra { height: 52px; display: flex; align-items: center; gap: 10px; padding: 0 20px; background: #1d1d26; }
      .barra i { width: 14px; height: 14px; border-radius: 50%; background: #3a3a46; }
      .barra span { margin-left: 18px; padding: 6px 18px; border-radius: 8px; background: #111118; font-size: 20px; opacity: .7; }
      .vetro { position: relative; flex: 1; width: 100%; height: 100%; overflow: hidden; border-radius: inherit; background: #000; }
      .telefono .vetro { border-radius: 50px; }
      .schermo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: top center; }
      .placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center;
        font-size: 34px; opacity: .45; border: 3px dashed #555; border-radius: inherit; }
      .pieno { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .sovraimpresso { position: absolute; left: 8%; right: 8%; bottom: 14%; text-align: center; text-shadow: 0 6px 40px rgba(0,0,0,.7); }
      .cap { position: absolute; left: 50%; bottom: ${verticale ? 150 : 56}px; transform: translateX(-50%); max-width: 86%; z-index: 10;
        padding: ${12 * scala}px ${26 * scala}px; border-radius: 14px; background: rgba(0,0,0,.72); color: #fff; text-align: center;
        font-size: ${(verticale ? 46 : 38) * scala}px; font-weight: 600; line-height: 1.25; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${totale}" data-width="${formato.w}" data-height="${formato.h}">
      ${scene.map(htmlScena).join("\n      ")}
      ${caption.map((c, i) => `<div id="c${i}" class="clip cap" data-start="${c.inizio}" data-duration="${c.durata}" data-track-index="2">${esc(c.testo)}</div>`).join("\n      ")}
      ${audio}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      const scene = ${JSON.stringify(scene.map((s) => ({ id: `s${s.idx}`, start: s.start, dur: s.dur })))};
      for (const s of scene) {
        const el = document.getElementById(s.id);
        const testi = el.querySelectorAll(".anim");
        const media = el.querySelectorAll(".anim-media");
        tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out" }, s.start);
        if (testi.length) tl.fromTo(testi, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power3.out" }, s.start + 0.1);
        if (media.length) {
          tl.fromTo(media, { opacity: 0, y: 120, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out" }, s.start + 0.15);
          tl.to(media, { scale: 1.04, duration: Math.max(s.dur - 1.4, 0.5), ease: "none" }, s.start + 1.05);
        }
        tl.to(el, { opacity: 0, duration: 0.35, ease: "power1.in" }, s.start + s.dur - 0.35);
      }
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;

fs.writeFileSync(path.join(buildDir, "index.html"), html);
fs.writeFileSync(
  path.join(buildDir, "package.json"),
  JSON.stringify({ name: nome, private: true, type: "module", scripts: {
    dev: `npx --yes hyperframes@${HF_VERSION} preview`,
    check: `npx --yes hyperframes@${HF_VERSION} check`,
    render: `npx --yes hyperframes@${HF_VERSION} render`,
  } }, null, 2),
);
fs.writeFileSync(path.join(buildDir, "meta.json"), JSON.stringify({ id: nome, name: nome }, null, 2));
fs.writeFileSync(
  path.join(buildDir, "hyperframes.json"),
  JSON.stringify({ $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
    paths: { blocks: "compositions", components: "compositions/components", assets: "assets" }, media: { autoProxy: true } }, null, 2),
);

// Sottotitoli .srt (da caricare su YouTube/LinkedIn per accessibilità e SEO)
const ts = (x) => {
  const ms = Math.round(x * 1000);
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
fs.mkdirSync(path.join(ROOT, "output"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, "output", `${nome}.srt`),
  tutteCaption.map((c, i) => `${i + 1}\n${ts(c.inizio)} --> ${ts(c.inizio + c.durata)}\n${c.testo}\n`).join("\n"),
);

console.log(`\n✅ Progetto HyperFrames: build/${nome}  (${scene.length} scene, ${totale}s, ${formato.w}x${formato.h})`);
console.log(`📝 Sottotitoli: output/${nome}.srt`);

if (flag("--solo-html")) process.exit(0);
if (flag("--anteprima")) {
  spawnSync("npx", [...HF, "preview"], { cwd: buildDir, stdio: "inherit" });
  process.exit(0);
}

const out = path.join(ROOT, "output", `${nome}.mp4`);
const res = spawnSync(
  "npx",
  [...HF, "render", buildDir, "-o", out, "-q", flag("--bozza") ? "draft" : "delivery", "--video-frame-format", "png", "--quiet"],
  { stdio: "inherit" },
);
if (res.status !== 0) process.exit(res.status ?? 1);
console.log(`\n🎬 Video pronto: output/${nome}.mp4`);
console.log(`   Passo successivo: bash scripts/esporta.sh output/${nome}.mp4`);
