/**
 * ─────────────────────────────────────────────────────────────────────────
 *  GENERADOR DE IMAGEN SOCIAL E ICONOS
 *
 *  Rasteriza scripts/assets/*.html con el Chrome del sistema en modo
 *  headless. No añade dependencias al proyecto: sin puppeteer, sin sharp.
 *
 *  Uso:  npm run gen:assets
 *
 *  Salida (se versiona en public/, no se regenera en cada build):
 *    public/og/agencia-alsai-og.png   1200 × 630  vista previa social
 *    public/icons/favicon-32.png        32 × 32
 *    public/icons/apple-touch-icon.png 180 × 180
 * ─────────────────────────────────────────────────────────────────────────
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error(
    'No se encontró Chrome. Define CHROME_PATH con la ruta al ejecutable ' +
      'y vuelve a ejecutar `npm run gen:assets`.',
  );
  process.exit(1);
}

const JOBS = [
  { src: 'assets/og.html', out: 'public/og/agencia-alsai-og.png', w: 1200, h: 630 },
  { src: 'assets/icon.html', out: 'public/icons/favicon-32.png', w: 32, h: 32 },
  { src: 'assets/icon.html', out: 'public/icons/apple-touch-icon.png', w: 180, h: 180 },
];

/* Chrome necesita un perfil propio o reutiliza el del usuario y no arranca. */
const profile = join(root, '.chrome-profile-tmp');

for (const job of JOBS) {
  const src = pathToFileURL(join(root, 'scripts', job.src)).href;
  const out = join(root, job.out);
  await mkdir(dirname(out), { recursive: true });

  execFileSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--user-data-dir=${profile}`,
      `--window-size=${job.w},${job.h}`,
      `--screenshot=${out}`,
      src,
    ],
    { stdio: 'pipe' },
  );

  console.log(`[assets] ${job.out}  ${job.w}×${job.h}`);
}

await rm(profile, { recursive: true, force: true });
console.log('\n[assets] Listo. Los PNG viven en public/ y se versionan con el repo.');
