/**
 * CONNECTIONS DAILY PUZZLE IMPORT SCRIPT
 *
 * Flow:
 * 1. Cooldown guard
 * 2. Resolve target NY date
 * 3. Cookie warm-up via NYT homepage → /games/connections
 * 4. Fetch /svc/connections/v2/{date}.json with full retry/backoff
 * 5. Date integrity + difficulty mapping
 * 6. Gemini hint generation (fail-closed) with two-pass validation
 * 7. Atomic writes to src/data/generated/connections/
 * 8. Discord + Healthchecks notification
 *
 * Shared utilities live in ./lib/. Connections-specific logic
 * (hint prompt, Eyefyre fallback, hint quality validation) stays here.
 *
 * GitHub Actions handles git commit + push.
 */

import path from 'path';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import {
  ConnectionsPuzzleSchema,
  type ConnectionsPuzzle,
} from '../lib/puzzles/connections-schema';
import { validatePuzzleIntegrity, validateHintQuality } from '../lib/puzzles/connections-validate';
import { notifyStart, notifySuccess, notifyFailure } from './notify';
import { getNYDate } from './lib/atomic-write';
import { checkCooldown } from './lib/cooldown';
import { warmUpCookies, fetchNYTDaily, plainFetch, type FetchError } from './lib/nyt-fetch';
import { buildManifest, writePuzzleOutputs } from './lib/manifest';

const DATA_DIR = path.join(process.cwd(), 'src/data/generated/connections');
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

const DIFFICULTY_MAP: Record<number, 'yellow' | 'green' | 'blue' | 'purple'> = {
  0: 'yellow', 1: 'green', 2: 'blue', 3: 'purple',
};

// ---------------------------------------------------------------------------
// Gemini hint generation (Connections-specific prompt)
// ---------------------------------------------------------------------------

async function generateHints(
  category: string,
  words: string[],
): Promise<{ hint1: string; hint2: string; hint3: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 20) {
    throw new Error('GEMINI_API_KEY is missing or too short. Aborting — no stub hints allowed.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          hint1: { type: SchemaType.STRING },
          hint2: { type: SchemaType.STRING },
          hint3: { type: SchemaType.STRING },
        },
        required: ['hint1', 'hint2', 'hint3'],
      },
    },
  });

  const buildPrompt = (strict: boolean): string => `You are writing progressive hints for a word puzzle game (similar to NYT Connections).

Category: "${category}"
Words in this group: ${words.join(', ')}

Write exactly 3 progressive hints as JSON with keys hint1, hint2, hint3.
- hint1: Very vague, broad theme. Do NOT mention the category name.
- hint2: A helpful nudge, slightly more specific. Do NOT mention the category name.
- hint3: Very specific, almost giving it away — but do NOT say the category name, do NOT repeat any of the answer words.

STRICT RULES (violations will cause an automatic retry):
- NEVER include any of these words in any hint: ${words.join(', ')}
- NEVER include "${category}" in hint1 or hint2
- NEVER use markdown fences (\`\`\`)
- NEVER mention "category", "group", "NYT", or "Connections"
- Each hint must be under 120 characters${strict ? '\n- Be extra careful: no answer words whatsoever in any hint, even partial matches' : ''}

Respond ONLY with valid JSON like: {"hint1":"...","hint2":"...","hint3":"..."}`;

  async function attempt(strict: boolean) {
    const result = await model.generateContent(buildPrompt(strict));
    const text = result.response.text().trim();
    const parsed = JSON.parse(text);
    if (!parsed.hint1 || !parsed.hint2 || !parsed.hint3) {
      throw new Error('Gemini response missing hint fields');
    }
    return { hint1: String(parsed.hint1), hint2: String(parsed.hint2), hint3: String(parsed.hint3) };
  }

  let hints: { hint1: string; hint2: string; hint3: string };
  try {
    hints = await attempt(false);
  } catch (err) {
    console.warn(`[gemini] first attempt failed for "${category}": ${err}. retrying strict.`);
    hints = await attempt(true);
  }

  try {
    validateHintQuality(category, words, hints);
  } catch (valErr) {
    console.warn(`[gemini] hint validation failed for "${category}": ${valErr}. retrying strict.`);
    hints = await attempt(true);
    validateHintQuality(category, words, hints);
  }
  return hints;
}

// ---------------------------------------------------------------------------
// NYT response shape + normalisation
// ---------------------------------------------------------------------------

interface NYTCategory {
  title: string;
  cards: Array<{ content: string; position: number }>;
}

interface NYTResponse {
  print_date?: string;
  date?: string;
  puzzleDate?: string;
  id?: number;
  categories: NYTCategory[];
}

async function buildPuzzle(date: string, raw: unknown): Promise<ConnectionsPuzzle> {
  const data = raw as NYTResponse;

  const puzzleDate = data.print_date ?? data.date ?? data.puzzleDate;
  if (!puzzleDate) throw new Error('NYT response missing date field');
  if (puzzleDate !== date) throw new Error(`Date mismatch: expected ${date}, NYT returned ${puzzleDate}`);

  const allCards = data.categories.flatMap(c => c.cards);
  const grid = [...allCards].sort((a, b) => a.position - b.position).map(c => String(c.content).toUpperCase());

  const groups = [];
  for (let i = 0; i < data.categories.length; i++) {
    const cat = data.categories[i];
    const difficulty = DIFFICULTY_MAP[i];
    if (!difficulty) throw new Error(`Out-of-range category index ${i}`);
    const words = cat.cards.map(c => String(c.content).toUpperCase()) as [string, string, string, string];
    const hints = await generateHints(cat.title, words);
    groups.push({ difficulty, category: String(cat.title), words, ...hints });
  }

  return {
    date,
    status: 'published' as const,
    sourceMode: 'nyt-api-v2' as const,
    grid,
    groups,
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Eyefyre Tier-2 fallback (feature-flagged off by default)
// ---------------------------------------------------------------------------

interface EyefyreEntry {
  id?: number;
  date: string;
  answers: Array<{ level: number; group: string; members: string[] }>;
}

function eyefyreToNYTShape(entry: EyefyreEntry): NYTResponse & { _eyefyre: true } {
  const categories: NYTCategory[] = entry.answers.map(answer => ({
    title: answer.group,
    cards: answer.members.map((member, idx) => ({
      content: member,
      position: answer.level * 4 + idx,
    })),
  }));
  return { print_date: entry.date, categories, _eyefyre: true } as NYTResponse & { _eyefyre: true };
}

async function tryEyefyreFallback(date: string): Promise<unknown | null> {
  if (process.env.GRIDHINT_FALLBACK_EYEFYRE !== '1') return null;
  console.log('[eyefyre] attempting Tier-2 fallback...');
  try {
    const res = await plainFetch(
      'https://raw.githubusercontent.com/Eyefyre/NYT-Connections-Answers/main/connections.json',
    );
    if (!res.ok) {
      console.warn(`[eyefyre] fetch ${res.status}`);
      return null;
    }
    const all = (await res.json()) as EyefyreEntry[];
    const entry = all.find(e => e.date === date);
    if (!entry) {
      console.warn(`[eyefyre] no entry for ${date}`);
      return null;
    }
    console.log('[eyefyre] match found — converting to NYT shape');
    return eyefyreToNYTShape(entry);
  } catch (err) {
    console.warn(`[eyefyre] error: ${err}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey.length < 20) {
    throw new Error('GEMINI_API_KEY is missing or too short. Aborting.');
  }

  checkCooldown();
  await notifyStart();

  const targetDate = getNYDate();
  console.log(`[main] target date (NY): ${targetDate}`);

  let rawNYT: unknown;
  try {
    await warmUpCookies('https://www.nytimes.com/games/connections');
    rawNYT = await fetchNYTDaily({
      url: `https://www.nytimes.com/svc/connections/v2/${targetDate}.json`,
      referer: 'https://www.nytimes.com/games/connections',
      notFoundRetry: true,
    });
  } catch (err) {
    const fe = err as FetchError;
    if (fe.status !== 404) {
      const eyefyreRaw = await tryEyefyreFallback(targetDate);
      if (eyefyreRaw) rawNYT = eyefyreRaw;
      else throw err;
    } else {
      throw err;
    }
  }

  const puzzle = await buildPuzzle(targetDate, rawNYT);
  if ((rawNYT as Record<string, unknown>)._eyefyre) {
    (puzzle as Record<string, unknown>).sourceMode = 'fallback_eyefyre';
  }

  ConnectionsPuzzleSchema.parse(puzzle);
  validatePuzzleIntegrity(puzzle);

  const manifest = buildManifest(DATA_DIR, targetDate);
  writePuzzleOutputs(DATA_DIR, targetDate, puzzle, manifest);

  console.log(`[main] done — Connections for ${targetDate} written.`);
  await notifySuccess(targetDate);
}

main().catch(async err => {
  console.error('[main] FATAL:', err);
  await notifyFailure(err);
  process.exit(1);
});
