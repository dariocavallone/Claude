#!/usr/bin/env node
// Registra da solo una web app con un browser automatico (Playwright), seguendo una lista di azioni.
// Così Claude può creare le registrazioni delle funzionalità senza che tu tocchi niente.
//
//   node scripts/registra-web.mjs registrazioni/01-aggiungi.json
//
// File azioni (JSON):
// {
//   "nome": "01-aggiungi",                 -> assets/registrazioni/01-aggiungi.mp4
//   "url": "https://tuaapp.it/login",
//   "dispositivo": "telefono",             // "telefono" (390x844) oppure "desktop" (1440x900)
//   "azioni": [
//     { "compila": "#email", "testo": "demo@tuaapp.it" },
//     { "clic": "text=Accedi" },
//     { "attendi": 1500 },
//     { "scrivi": "Dentista giovedì alle 17", "in": "[placeholder='Nuova attività']" },
//     { "scorri": 600 },
//     { "vai": "https://tuaapp.it/impostazioni" }
//   ]
// }
// Usa account e dati DI PROVA: tutto ciò che compare nella registrazione finisce nel video.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = process.argv[2];
if (!file) {
  console.error("Uso: node scripts/registra-web.mjs <azioni.json>");
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
const telefono = (cfg.dispositivo || "telefono") === "telefono";
const viewport = telefono ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const tmp = path.join(ROOT, "build", ".registrazioni", cfg.nome);
fs.rmSync(tmp, { recursive: true, force: true });

// Negli ambienti cloud (claude.ai/code) Chromium è preinstallato e la rete passa da un proxy.
const exe = ["/opt/pw-browsers/chromium"].find((p) => fs.existsSync(p));
const locale = /^https?:\/\/(localhost|127\.0\.0\.1)[:/]/.test(cfg.url); // app avviata in locale: niente proxy
const px = !locale && (process.env.HTTPS_PROXY || process.env.https_proxy);
const proxy = px ? (({ origin, username, password }) => ({ server: origin, username: decodeURIComponent(username), password: decodeURIComponent(password) }))(new URL(px)) : undefined;
const browser = await chromium.launch({ ...(exe && { executablePath: exe }), ...(proxy && { proxy }) });
const context = await browser.newContext({
  viewport,
  deviceScaleFactor: telefono ? 3 : 2,
  isMobile: telefono,
  hasTouch: telefono,
  locale: "it-IT",
  recordVideo: { dir: tmp, size: viewport },
});
const page = await context.newPage();
const pausa = (ms) => page.waitForTimeout(ms);

await page.goto(cfg.url, { waitUntil: "networkidle" });
await pausa(1200);
for (const a of cfg.azioni || []) {
  if (a.clic) await page.locator(a.clic).first().click();
  else if (a.compila) await page.locator(a.compila).first().fill(a.testo);
  else if (a.scrivi) await page.locator(a.in).first().pressSequentially(a.scrivi, { delay: 70 }); // effetto "digitato a mano"
  else if (a.tasto) await page.keyboard.press(a.tasto);
  else if (a.scorri) await page.mouse.wheel(0, a.scorri);
  else if (a.vai) await page.goto(a.vai, { waitUntil: "networkidle" });
  else if (a.attendi) await pausa(a.attendi);
  await pausa(a.pausa ?? 900); // ritmo leggibile per chi guarda
}
await pausa(1000);
const video = page.video();
await context.close();
await browser.close();

const webm = await video.path();
execFileSync("bash", [path.join(ROOT, "scripts/prepara-registrazione.sh"), webm, cfg.nome, "--da", "0.8"], { stdio: "inherit" });
