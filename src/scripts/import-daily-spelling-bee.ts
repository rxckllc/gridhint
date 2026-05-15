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
import fs from 'fs';
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
  center_letter?: string;
  centerLetter?: string;
  outer_letters?: string[] | string;
  outerLetters?: string[];
  valid_letters?: string[] | string;
  validLetters?: string[];
  pangrams?: string[];
  answers?: string[];
  display_date?: string;
  displayDate?: string;
  print_date?: string;
  printDate?: string;
  id?: number;
  editor?: string;
}

interface NormalizedSpellingBeeResponse {
  centerLetter: string;
  outerLetters: string[];
  validLetters?: string[];
  pangrams: string[];
  answers: string[];
  printDate?: string;
}

function existingPuzzleIsFresh(date: string): boolean {
  const datePath = path.join(DATA_DIR, `${date}.json`);
  if (!fs.existsSync(datePath)) return false;

  try {
    const puzzle = SpellingBeeDailySchema.parse(JSON.parse(fs.readFileSync(datePath, 'utf8')));
    if (puzzle.date !== date) {
      throw new Error(`date field ${puzzle.date} does not match ${date}`);
    }
    validateSpellingBeeIntegrity(puzzle);
    return true;
  } catch (err) {
    console.warn(`[bee] existing ${datePath} failed validation: ${err}`);
    return false;
  }
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

function normalizeLetters(value: string[] | string | undefined): string[] | undefined {
  if (Array.isArray(value)) return value.map(letter => String(letter));
  if (typeof value === 'string') return value.split('');
  return undefined;
}

function normalizeNYTSpellingBeeResponse(raw: unknown): NormalizedSpellingBeeResponse {
  const data = raw as NYTSpellingBeeResponse;
  const centerLetter = data.center_letter ?? data.centerLetter;
  const outerLetters = normalizeLetters(data.outer_letters ?? data.outerLetters);
  const validLetters = normalizeLetters(data.valid_letters ?? data.validLetters);
  const printDate = data.print_date ?? data.printDate;

  if (!centerLetter) throw new Error('NYT Spelling Bee response missing center_letter/centerLetter');
  if (!outerLetters || outerLetters.length !== 6) {
    throw new Error(`NYT Spelling Bee outer_letters/outerLetters must be 6; got ${outerLetters?.length}`);
  }
  if (!data.answers || data.answers.length === 0) {
    throw new Error('NYT Spelling Bee response missing answers');
  }

  return {
    centerLetter,
    outerLetters,
    validLetters,
    pangrams: data.pangrams ?? [],
    answers: data.answers,
    printDate,
  };
}

async function buildPuzzle(date: string, raw: unknown): Promise<SpellingBeeDaily> {
  const data = normalizeNYTSpellingBeeResponse(raw);

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

function getTargetDate(): string {
  const args = process.argv.slice(2);
  const dateFlagIndex = args.findIndex(arg => arg === '--date');
  const targetDate = dateFlagIndex >= 0
    ? args[dateFlagIndex + 1]
    : args.find(arg => arg.startsWith('--date='))?.slice('--date='.length);

  if (!targetDate) return getNYDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    throw new Error(`Invalid --date "${targetDate}". Expected YYYY-MM-DD.`);
  }
  return targetDate;
}

async function main(): Promise<void> {
  const targetDate = getTargetDate();
  console.log(`[bee] target date (NY): ${targetDate}`);
  if (existingPuzzleIsFresh(targetDate)) {
    console.log(`[bee] already fresh: ${targetDate}`);
    return;
  }

  checkCooldown();
  await notifyStart();

  await warmUpCookies('https://www.nytimes.com/puzzles/spelling-bee');

  // The Spelling Bee endpoint returns full puzzle metadata including the
  // answers array we need for hashing.
  const raw = await fetchNYTDaily({
    url: `https://www.nytimes.com/svc/spelling-bee/v1/${targetDate}.json`,
    referer: 'https://www.nytimes.com/puzzles/spelling-bee',
    notFoundRetry: true,
  });

  const puzzle = await buildPuzzle(targetDate, raw);
  SpellingBeeDailySchema.parse(puzzle);
  validateSpellingBeeIntegrity(puzzle);

  const manifest = buildManifest(DATA_DIR, targetDate);
  writePuzzleOutputs(DATA_DIR, targetDate, puzzle, manifest);

  console.log(`[bee] done — ${targetDate}: ${puzzle.hints.totalWords} answers, ${puzzle.hints.pangramCount} pangrams`);
  await notifySuccess(`Spelling Bee (${targetDate})`);
}

main().catch(async err => {
  console.error('[bee] FATAL:', err);
  await notifyFailure(err);
  process.exit(1);
});
