/**
 * Generic manifest writer for daily-game JSON output.
 * Produces: {date}.json + latest.json + manifest.json in a single directory.
 */

import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { atomicWrite } from './atomic-write';

export const ManifestSchema = z.object({
  latest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  updatedAt: z.string().datetime(),
});

export type Manifest = z.infer<typeof ManifestSchema>;

/** Read or rebuild the manifest, prepending the new date. */
export function buildManifest(dir: string, date: string): Manifest {
  const manifestPath = path.join(dir, 'manifest.json');
  let existing: Manifest = { latest: date, dates: [], updatedAt: new Date().toISOString() };

  if (fs.existsSync(manifestPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      existing = ManifestSchema.parse(raw);
    } catch {
      console.warn(`[manifest] could not parse ${manifestPath} — rebuilding`);
    }
  }

  const dates = [date, ...existing.dates.filter(d => d !== date)];
  return { latest: date, dates, updatedAt: new Date().toISOString() };
}

/** Write {date}.json, latest.json, and manifest.json atomically. */
export function writePuzzleOutputs(
  dir: string,
  date: string,
  puzzle: unknown,
  manifest: Manifest,
): void {
  const datePath = path.join(dir, `${date}.json`);
  const latestPath = path.join(dir, 'latest.json');
  const manifestPath = path.join(dir, 'manifest.json');

  atomicWrite(datePath, puzzle);
  console.log(`[write] ${datePath}`);
  atomicWrite(latestPath, puzzle);
  console.log(`[write] ${latestPath}`);
  atomicWrite(manifestPath, manifest);
  console.log(`[write] ${manifestPath}`);
}
