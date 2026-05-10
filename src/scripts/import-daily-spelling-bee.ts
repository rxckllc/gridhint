/**
 * SPELLING BEE DAILY PUZZLE IMPORT SCRIPT
 *
 * Fetches the NYT Spelling Bee endpoint and publishes HINT-ONLY data.
 *
 * Per legal posture: we do NOT republish the flat answer list. Instead we
 * publish: letter set + aggregate distributions + sha-256 hashes of valid
 * answers. Client-side guess validation hashes user input and checks against
 * the hash set, so users can self-verify without us exposing the answer list.
 */

import path from 'path';
import { createHash } from 'crypto';
import {
  SpellingBeeDailySchema,
  validateSpellingBeeIntegrity,
  type SpellingBeeDaily,
} from '../lib/puzzles/spelling-bee-schema';
import { notifyStart, notifySuccess, notifyFailure } from './notify';
import { getNYDate } from './lib/atomic-write';
import { checkCooldown } from './lib/cooldown';
import { warmUpCookies, fetchNYTDaily } from './lib/nyt-fetch';
import { buildManifest, writePuzzleOutputs } from './lib/manifest';

const DATA_DIR = path.join(process.cwd(), 'src/data/generated/spelling-bee');

interface NYTSpellingBeeResponse {
  centerLetter?: string;
  outerLetters?: string[];
  validLetters?: string[];
  pangrams?: string[];
  answers?: string[];
  displayDate?: string;
  printDate?: string;
  id?: number;
}

function sha256(input: string): string {
  return createHash('sha256').update(input.toUpperCase()).digest('hex');
}

/**
 * NYT scoring rule (2026):
 *   - 4-letter word: 1 point
 *   - 5+ letter word: length points
 *   - pangram: length + 7 bonus
 * Genius threshold: ~70% of total. Queen Bee: 100%.
 */
function scoreWord(word: string, isPangram: boolean): number {
  const len = word.length;
  let pts = len === 4 ? 1 : len;
  if (isPangram) pts += 7;
  return pts;
}

function buildHints(answers: string[], pangrams: Set<string>) {
  const lengthDistribution: Record<string, number> = {};
  const startingLetterDistribution: Record<string, number> = {};
  let totalScore = 0;

  for (const ans of answers) {
    const upper = ans.toUpperCase();
    const lenKey = String(upper.length);
    lengthDistribution[lenKey] = (lengthDistribution[lenKey] ?? 0) + 1;
    const firstLetter = upper[0];
    startingLetterDistribution[firstLetter] = (startingLetterDistribution[firstLetter] ?? 0) + 1;
    totalScore += scoreWord(upper, pangrams.has(upper));
  }

  return {
    totalWords: answers.length,
    pangramCount: pangrams.size,
    lengthDistribution,
    startingLetterDistribution,
    geniusThreshold: Math.round(totalScore * 0.7),
    queenBeeScore: totalScore,
  };
}

async function buildPuzzle(date: string, raw: unknown): Promise<SpellingBeeDaily> {
  const data = raw as NYTSpellingBeeResponse;

  if (!data.centerLetter) throw new Error('NYT Spelling Bee response missing centerLetter');
  if (!data.outerLetters || data.outerLetters.length !== 6) {
    throw new Error(`NYT Spelling Bee outerLetters must be 6; got ${data.outerLetters?.length}`);
  }
  if (!data.answers || data.answers.length === 0) {
    throw new Error('NYT Spelling Bee response missing answers');
  }

  // SB response: printDate is YYYY-MM-DD (matches our format), displayDate is
  // "Month Day, Year". Only printDate is comparable; reject mismatches loudly.
  if (data.printDate && data.printDate !== date) {
    throw new Error(`Date mismatch: expected ${date}, NYT returned ${data.printDate}`);
  }

  const centerLetter = data.centerLetter.toUpperCase();
  const outerLetters = data.outerLetters.map(l => l.toUpperCase()) as [string, string, string, string, string, string];
  const validLetters = [centerLetter, ...outerLetters];
  const pangrams = new Set((data.pangrams ?? []).map(p => p.toUpperCase()));
  const answers = data.answers.map(a => a.toUpperCase());

  const answerHashes = answers.map(sha256).sort();
  const pangramHashes = Array.from(pangrams).map(sha256).sort();
  const hints = buildHints(answers, pangrams);

  return {
    date,
    status: 'published' as const,
    sourceMode: 'nyt-api-v2' as const,
    centerLetter,
    outerLetters,
    validLetters,
    answerHashes,
    pangramHashes,
    hints,
    updatedAt: new Date().toISOString(),
  };
}

async function main(): Promise<void> {
  checkCooldown();
  await notifyStart();

  const targetDate = getNYDate();
  console.log(`[bee] target date (NY): ${targetDate}`);

  await warmUpCookies('https://www.nytimes.com/puzzles/spelling-bee');

  // The Spelling Bee endpoint returns full puzzle metadata including the
  // answers array we need for hashing.
  const raw = await fetchNYTDaily({
    url: `https://www.nytimes.com/puzzles/spelling-bee/${targetDate}.json`,
    referer: 'https://www.nytimes.com/puzzles/spelling-bee',
    notFoundRetry: true,
  });

  const puzzle = await buildPuzzle(targetDate, raw);
  SpellingBeeDailySchema.parse(puzzle);
  validateSpellingBeeIntegrity(puzzle);

  const manifest = buildManifest(DATA_DIR, targetDate);
  writePuzzleOutputs(DATA_DIR, targetDate, puzzle, manifest);

  console.log(`[bee] done — ${targetDate}: ${puzzle.hints.totalWords} answers, ${puzzle.hints.pangramCount} pangrams`);
  await notifySuccess(`spelling-bee:${targetDate}`);
}

main().catch(async err => {
  console.error('[bee] FATAL:', err);
  await notifyFailure(err);
  process.exit(1);
});
