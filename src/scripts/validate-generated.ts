/**
 * validate-generated.ts
 *
 * Smoke-test all daily puzzle JSON outputs (Connections, Wordle, Spelling Bee).
 * Run by GitHub Actions after the import scripts. Exits non-zero on any failure.
 */

import fs from 'fs';
import path from 'path';
import { ConnectionsPuzzleSchema, ConnectionsManifestSchema } from '../lib/puzzles/connections-schema';
import { validatePuzzleIntegrity } from '../lib/puzzles/connections-validate';
import { WordleDailySchema, validateWordleIntegrity } from '../lib/puzzles/wordle-schema';
import { SpellingBeeDailySchema, validateSpellingBeeIntegrity } from '../lib/puzzles/spelling-bee-schema';
import { ManifestSchema } from './lib/manifest';

const ROOT = path.join(process.cwd(), 'src/data/generated');

function readJson(filePath: string): unknown {
  if (!fs.existsSync(filePath)) throw new Error(`Not found: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

interface GameValidator {
  dir: string;
  label: string;
  validate: (data: unknown) => void;
  manifestSchema: typeof ConnectionsManifestSchema | typeof ManifestSchema;
}

function validateGame(g: GameValidator): number {
  let errors = 0;
  const fullDir = path.join(ROOT, g.dir);
  if (!fs.existsSync(fullDir)) {
    console.warn(`[validate] ${g.label}: directory ${fullDir} does not exist — skipping`);
    return 0;
  }

  // 1. Manifest
  const manifestPath = path.join(fullDir, 'manifest.json');
  let manifest: { dates?: string[] } = {};
  try {
    const raw = readJson(manifestPath);
    const parsed = g.manifestSchema.parse(raw);
    console.log(`[validate] ${g.label}/manifest.json OK — latest: ${parsed.latest}, dates: ${parsed.dates.length}`);
    manifest = parsed;
  } catch (err) {
    console.error(`[validate] ${g.label}/manifest.json FAILED: ${err}`);
    errors++;
    try {
      const raw = readJson(manifestPath);
      if (raw && typeof raw === 'object' && Array.isArray((raw as { dates?: string[] }).dates)) {
        manifest = raw as { dates?: string[] };
      }
    } catch { /* fall-through */ }
  }

  // 2. latest.json
  const latestPath = path.join(fullDir, 'latest.json');
  try {
    g.validate(readJson(latestPath));
    console.log(`[validate] ${g.label}/latest.json OK`);
  } catch (err) {
    console.error(`[validate] ${g.label}/latest.json FAILED: ${err}`);
    errors++;
  }

  // 3. per-date files
  for (const date of manifest.dates ?? []) {
    const datePath = path.join(fullDir, `${date}.json`);
    try {
      g.validate(readJson(datePath));
      console.log(`[validate] ${g.label}/${date}.json OK`);
    } catch (err) {
      console.error(`[validate] ${g.label}/${date}.json FAILED: ${err}`);
      errors++;
    }
  }

  return errors;
}

function run(): void {
  let totalErrors = 0;

  totalErrors += validateGame({
    dir: 'connections',
    label: 'connections',
    manifestSchema: ConnectionsManifestSchema,
    validate: (data) => {
      const puzzle = ConnectionsPuzzleSchema.parse(data);
      validatePuzzleIntegrity(puzzle);
    },
  });

  totalErrors += validateGame({
    dir: 'wordle',
    label: 'wordle',
    manifestSchema: ManifestSchema,
    validate: (data) => {
      const puzzle = WordleDailySchema.parse(data);
      validateWordleIntegrity(puzzle);
    },
  });

  totalErrors += validateGame({
    dir: 'spelling-bee',
    label: 'spelling-bee',
    manifestSchema: ManifestSchema,
    validate: (data) => {
      const puzzle = SpellingBeeDailySchema.parse(data);
      validateSpellingBeeIntegrity(puzzle);
    },
  });

  if (totalErrors > 0) {
    console.error(`[validate] ${totalErrors} validation error(s). Aborting.`);
    process.exit(1);
  }
  console.log('[validate] All generated files passed validation.');
}

run();
