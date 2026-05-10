/**
 * validate-generated.ts
 *
 * Lightweight smoke test run by GitHub Actions after import-daily-puzzles.ts.
 * Re-validates the freshly-written connections files using the canonical schemas.
 * Exits non-zero on any failure so the GHA step fails clearly.
 */

import fs from 'fs';
import path from 'path';
import { ConnectionsPuzzleSchema, ConnectionsManifestSchema } from '../lib/puzzles/connections-schema';
import { validatePuzzleIntegrity } from '../lib/puzzles/connections-validate';

const DATA_DIR = path.join(process.cwd(), 'src/data/generated/connections');

function readJson(filePath: string): unknown {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function run(): void {
  let errors = 0;

  // 1. Validate manifest.json — read once, reuse for per-date enumeration below
  const manifestPath = path.join(DATA_DIR, 'manifest.json');
  let manifest: { dates?: string[] } = {};
  try {
    const manifestRaw = readJson(manifestPath);
    const parsed = ConnectionsManifestSchema.parse(manifestRaw);
    console.log(`[validate] manifest.json OK — latest: ${parsed.latest}, dates: ${parsed.dates.length}`);
    manifest = parsed;
  } catch (err) {
    console.error(`[validate] manifest.json FAILED: ${err}`);
    errors++;
    // Fall back to the raw shape for per-date file enumeration so we still find files
    try {
      const manifestRaw = readJson(manifestPath);
      if (manifestRaw && typeof manifestRaw === 'object' && Array.isArray((manifestRaw as { dates?: string[] }).dates)) {
        manifest = manifestRaw as { dates?: string[] };
      }
    } catch {
      // already logged above; manifest stays empty
    }
  }

  // 2. Validate latest.json
  const latestPath = path.join(DATA_DIR, 'latest.json');
  try {
    const latest = ConnectionsPuzzleSchema.parse(readJson(latestPath));
    validatePuzzleIntegrity(latest);
    console.log(`[validate] latest.json OK — date: ${latest.date}`);
  } catch (err) {
    console.error(`[validate] latest.json FAILED: ${err}`);
    errors++;
  }

  // 3. Validate per-date files mentioned in manifest
  for (const date of manifest.dates ?? []) {
    const datePath = path.join(DATA_DIR, `${date}.json`);
    try {
      const puzzle = ConnectionsPuzzleSchema.parse(readJson(datePath));
      validatePuzzleIntegrity(puzzle);
      console.log(`[validate] ${date}.json OK`);
    } catch (err) {
      console.error(`[validate] ${date}.json FAILED: ${err}`);
      errors++;
    }
  }

  if (errors > 0) {
    console.error(`[validate] ${errors} validation error(s). Aborting.`);
    process.exit(1);
  }

  console.log('[validate] All generated files passed validation.');
}

run();
