/**
 * WORDLE DAILY PUZZLE IMPORT SCRIPT
 *
 * Fetches /svc/wordle/v2/{date}.json, generates safe hints (first letter,
 * vowel/consonant pattern, definition that does NOT contain the answer),
 * and writes to src/data/generated/wordle/.
 */

import path from 'path';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import {
  WordleDailySchema,
  validateWordleIntegrity,
  type WordleDaily,
} from '../lib/puzzles/wordle-schema';
import { notifyStart, notifySuccess, notifyFailure } from './notify';
import { getNYDate } from './lib/atomic-write';
import { checkCooldown } from './lib/cooldown';
import { warmUpCookies, fetchNYTDaily } from './lib/nyt-fetch';
import { buildManifest, writePuzzleOutputs } from './lib/manifest';

const DATA_DIR = path.join(process.cwd(), 'src/data/generated/wordle');
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

interface NYTWordleResponse {
  id?: number;
  solution: string;
  print_date?: string;
  days_since_launch?: number;
  editor?: string;
}

function patternFor(word: string): string {
  return word
    .split('')
    .map(ch => /[AEIOU]/.test(ch) ? 'V' : 'C')
    .join('');
}

async function generateWordleHint(solution: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 20) {
    throw new Error('GEMINI_API_KEY missing/short — Wordle hint generation requires Gemini.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: { definition: { type: SchemaType.STRING } },
        required: ['definition'],
      },
    },
  });

  const prompt = (strict: boolean) => `You are writing a single-line definition hint for today's NYT Wordle.

Word: "${solution}"

Write a one-sentence definition (under 160 characters) that hints at the word's meaning WITHOUT spelling it.

STRICT RULES:
- NEVER include the word "${solution}" anywhere in the response, in any case.
- NEVER include any 4+ character substring of "${solution}" verbatim.
- NEVER reveal the first letter explicitly (e.g. "starts with A").
- Do NOT mention "Wordle", "answer", "today", or "5-letter".
- Do NOT use markdown.${strict ? '\n- Be extra cautious: stay metaphorical, avoid synonyms that overlap on letters.' : ''}

Respond ONLY with JSON: {"definition":"..."}`;

  async function attempt(strict: boolean): Promise<string> {
    const result = await model.generateContent(prompt(strict));
    const parsed = JSON.parse(result.response.text().trim());
    if (!parsed.definition) throw new Error('Gemini response missing definition');
    return String(parsed.definition);
  }

  let definition: string;
  try {
    definition = await attempt(false);
  } catch (err) {
    console.warn(`[gemini] first wordle hint attempt failed: ${err}, retrying strict.`);
    definition = await attempt(true);
  }

  // Leak-check: retry strict once if the answer appears
  if (definition.toUpperCase().includes(solution)) {
    console.warn(`[gemini] definition leaked "${solution}", retrying strict.`);
    definition = await attempt(true);
    if (definition.toUpperCase().includes(solution)) {
      throw new Error(`[gemini] definition still leaks "${solution}" after retry — aborting.`);
    }
  }

  return definition;
}

async function buildPuzzle(date: string, raw: unknown): Promise<WordleDaily> {
  const data = raw as NYTWordleResponse;

  if (!data.solution) throw new Error('NYT Wordle response missing solution');
  const solution = String(data.solution).toUpperCase();
  if (!/^[A-Z]{5}$/.test(solution)) {
    throw new Error(`NYT Wordle returned non-5-letter solution: "${data.solution}"`);
  }

  if (data.print_date && data.print_date !== date) {
    throw new Error(`Date mismatch: expected ${date}, NYT returned ${data.print_date}`);
  }

  const definition = await generateWordleHint(solution);

  return {
    date,
    status: 'published' as const,
    sourceMode: 'nyt-api-v2' as const,
    solution,
    dayNumber: data.days_since_launch,
    editor: data.editor,
    hints: {
      firstLetter: solution[0],
      pattern: patternFor(solution),
      definition,
    },
    updatedAt: new Date().toISOString(),
  };
}

async function main(): Promise<void> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey.length < 20) {
    throw new Error('GEMINI_API_KEY missing or too short.');
  }

  checkCooldown();
  await notifyStart();

  const targetDate = getNYDate();
  console.log(`[wordle] target date (NY): ${targetDate}`);

  await warmUpCookies('https://www.nytimes.com/games/wordle');
  const raw = await fetchNYTDaily({
    url: `https://www.nytimes.com/svc/wordle/v2/${targetDate}.json`,
    referer: 'https://www.nytimes.com/games/wordle',
    notFoundRetry: true,
  });

  const puzzle = await buildPuzzle(targetDate, raw);
  WordleDailySchema.parse(puzzle);
  validateWordleIntegrity(puzzle);

  const manifest = buildManifest(DATA_DIR, targetDate);
  writePuzzleOutputs(DATA_DIR, targetDate, puzzle, manifest);

  console.log(`[wordle] done — ${targetDate} solution=${puzzle.solution}`);
  await notifySuccess(`Wordle (${targetDate})`);
}

main().catch(async err => {
  console.error('[wordle] FATAL:', err);
  await notifyFailure(err, 'Wordle import');
  process.exit(1);
});
