// Senja di Pasar — entry program for make.fun "Make the best card game".
// Node 22, standard library only. The game itself lives in game/ (static
// files, no network); the screenshots live in screenshots/. This program's
// only job is to hand both over: copy them into the grader's output folder
// and write dossier.json there, built with the kit's vendored library.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Run it twice and the two outputs must be byte-identical.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Folder this file sits in (the repository root) and the output folder.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fresh output folder, then the game and its screenshots, copied whole.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

const shotsInRepo = join(repoRoot, 'screenshots');
const shotsInOut = join(outputDir, 'screenshots');
mkdirSync(shotsInOut, { recursive: true });
if (existsSync(shotsInRepo)) {
  for (const name of readdirSync(shotsInRepo)) {
    cpSync(join(shotsInRepo, name), join(shotsInOut, name));
  }
}

// The dossier the judge reads: the same caps the gate enforces, so what we
// hand in is exactly what the gate measures (at most 4 screenshots of at
// most 256 KiB, game/ at most 993 files / 48 MiB, paths at most 1000 bytes,
// dossier text at most 160 KiB).
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
