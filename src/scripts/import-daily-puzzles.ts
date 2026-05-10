/**
 * CONNECTIONS DAILY PUZZLE IMPORT SCRIPT
 *
 * Flow:
 * 1. Check cooldown file — exit 0 if IP is cooling down
 * 2. Resolve target date (New York timezone)
 * 3. Cookie warm-up (NYT homepage → /games/connections → API)
 * 4. Fetch NYT Connections v2 API with full headers + cookie jar
 * 5. Date-integrity check
 * 6. Difficulty-mapping (fail-loud)
 * 7. Gemini 2.5 Flash hint generation (fail-closed, no stubs)
 * 8. Hint validation (word-boundary leak check)
 * 9. Atomic file writes → connections/{date}.json, latest.json, manifest.json
 * 10. Discord + Healthchecks alerting
 *
 * GitHub Actions handles git commit + push — this script never calls git.
 */

import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import {
  ConnectionsPuzzleSchema,
  ConnectionsManifestSchema,
  type ConnectionsPuzzle,
  type ConnectionsManifest,
} from '../lib/puzzles/connections-schema';
import { validatePuzzleIntegrity, validateHintQuality } from '../lib/puzzles/connections-validate';
import { notifyStart, notifySuccess, notifyFailure } from './notify';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), 'src/data/generated/connections');
const COOLDOWN_FILE = path.join(process.cwd(), '.gridhint-cooldown.json');

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

const DIFFICULTY_MAP: Record<number, 'yellow' | 'green' | 'blue' | 'purple'> = {
  0: 'yellow',
  1: 'green',
  2: 'blue',
  3: 'purple',
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getNYDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Writes data atomically: write to .tmp then rename */
function atomicWrite(filePath: string, data: unknown): void {
  const tmp = `${filePath}.tmp`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);
}

// ---------------------------------------------------------------------------
// Cooldown guard (403/429 protection)
// ---------------------------------------------------------------------------

interface CooldownFile {
  pausedUntil: string; // ISO datetime
}

function checkCooldown(): void {
  if (!fs.existsSync(COOLDOWN_FILE)) return;
  try {
    const raw = fs.readFileSync(COOLDOWN_FILE, 'utf8');
    const data = JSON.parse(raw) as CooldownFile;
    const until = new Date(data.pausedUntil);
    if (until > new Date()) {
      console.log(`[cooldown] IP cooling down until ${until.toISOString()}. Exiting cleanly.`);
      process.exit(0);
    } else {
      // Cooldown expired — remove the file
      fs.unlinkSync(COOLDOWN_FILE);
      console.log('[cooldown] Cooldown expired, proceeding.');
    }
  } catch {
    // Corrupt file — ignore and proceed
  }
}

function writeCooldown(hours: number): void {
  const pausedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  atomicWrite(COOLDOWN_FILE, { pausedUntil });
  console.error(`[cooldown] Wrote cooldown until ${pausedUntil}`);
}

// ---------------------------------------------------------------------------
// HTTP helpers with in-memory cookie jar
// ---------------------------------------------------------------------------

const cookieJar = new Map<string, string>();

function parseCookies(setCookieHeaders: string[]): void {
  for (const header of setCookieHeaders) {
    const parts = header.split(';')[0].trim();
    const eqIdx = parts.indexOf('=');
    if (eqIdx === -1) continue;
    const name = parts.slice(0, eqIdx).trim();
    const value = parts.slice(eqIdx + 1).trim();
    cookieJar.set(name, value);
  }
}

function buildCookieHeader(): string {
  return Array.from(cookieJar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

interface FetchError extends Error {
  status: number;
}

function makeFetchError(status: number, message: string): FetchError {
  const err = new Error(message) as FetchError;
  err.status = status;
  return err;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const signal = AbortSignal.timeout(15000);
  return fetch(url, { ...options, signal });
}

/** HTML-page fetch (navigation) — updates cookie jar */
async function fetchPage(url: string, extraHeaders: Record<string, string> = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
    ...extraHeaders,
  };
  if (cookieJar.size > 0) {
    headers['Cookie'] = buildCookieHeader();
  }
  const res = await fetchWithTimeout(url, { headers });
  const setCookies = res.headers.getSetCookie?.() ?? [];
  if (setCookies.length > 0) parseCookies(setCookies);
  return res;
}

/** XHR/JSON fetch — uses cookie jar built from warm-up */
async function fetchJSON(url: string): Promise<Response> {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'X-Games-Auth-Bypass': 'true',
    'Referer': 'https://www.nytimes.com/games/connections',
    'Cookie': buildCookieHeader(),
  };
  return fetchWithTimeout(url, { headers });
}

// ---------------------------------------------------------------------------
// Cookie warm-up
// ---------------------------------------------------------------------------

async function warmUpCookies(): Promise<void> {
  console.log('[warmup] Fetching NYT homepage...');
  await fetchPage('https://www.nytimes.com/');
  const delay1 = randomBetween(8000, 15000);
  console.log(`[warmup] Sleeping ${delay1}ms...`);
  await sleep(delay1);

  console.log('[warmup] Fetching /games/connections...');
  await fetchPage('https://www.nytimes.com/games/connections', {
    'Referer': 'https://www.nytimes.com/',
    'Sec-Fetch-Site': 'same-origin',
  });
  const delay2 = randomBetween(4000, 8000);
  console.log(`[warmup] Sleeping ${delay2}ms...`);
  await sleep(delay2);

  console.log(`[warmup] Cookie jar has ${cookieJar.size} entries.`);
}

// ---------------------------------------------------------------------------
// NYT fetch with status-differentiated retry
// ---------------------------------------------------------------------------

async function fetchNYTWithRetry(date: string): Promise<unknown> {
  const url = `https://www.nytimes.com/svc/connections/v2/${date}.json`;

  // 404 retry schedule: 0, +15min, +30min, +60min
  const notFoundDelays = [0, 15 * 60 * 1000, 30 * 60 * 1000, 60 * 60 * 1000];

  for (let attempt = 0; attempt < notFoundDelays.length; attempt++) {
    if (notFoundDelays[attempt] > 0) {
      console.log(`[fetch] 404 retry in ${notFoundDelays[attempt] / 60000} min...`);
      await sleep(notFoundDelays[attempt]);
    }

    // 5xx/network: exponential backoff, max 3 attempts
    let lastError: unknown;
    for (let retry = 0; retry < 3; retry++) {
      try {
        if (retry > 0) {
          const backoff = 5000 * Math.pow(2, retry - 1);
          console.log(`[fetch] Retry ${retry}/2 after ${backoff}ms...`);
          await sleep(backoff);
        }

        console.log(`[fetch] GET ${url} (attempt ${attempt + 1})`);
        const res = await fetchJSON(url);

        if (res.ok) {
          return await res.json();
        }

        if (res.status === 404) {
          console.warn(`[fetch] 404 — puzzle not yet posted.`);
          break; // break inner loop, continue outer 404-retry loop
        }

        if (res.status === 403 || res.status === 429) {
          console.error(`[fetch] BLOCKED: HTTP ${res.status}. Writing 48h cooldown and aborting.`);
          writeCooldown(48);
          throw makeFetchError(res.status, `NYT blocked us with ${res.status}`);
        }

        if (res.status >= 500) {
          lastError = makeFetchError(res.status, `NYT returned ${res.status}`);
          continue; // retry with backoff
        }

        throw makeFetchError(res.status, `Unexpected HTTP ${res.status}`);

      } catch (err) {
        const fe = err as FetchError;
        // Re-throw blocking errors immediately
        if (fe.status === 403 || fe.status === 429) throw err;
        // Re-throw 404 inner-loop break (handled above)
        lastError = err;
        if (retry === 2) {
          // All 3 5xx/network retries exhausted
          throw lastError;
        }
      }
    }
    // If we broke out of the inner loop due to 404, continue the outer loop
    if (attempt === notFoundDelays.length - 1) {
      // Final 404 — soft fail
      console.error(`[fetch] Puzzle still not posted after all 404 retries. Exit 2.`);
      process.exit(2);
    }
  }

  // Should not reach here
  throw new Error('fetchNYTWithRetry: unexpected exit');
}

// ---------------------------------------------------------------------------
// Gemini hint generation (fail-closed — no stubs)
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

  async function attempt(strict: boolean): Promise<{ hint1: string; hint2: string; hint3: string }> {
    const result = await model.generateContent(buildPrompt(strict));
    const text = result.response.text().trim();
    const parsed = JSON.parse(text);
    if (!parsed.hint1 || !parsed.hint2 || !parsed.hint3) {
      throw new Error('Gemini response missing hint fields');
    }
    return { hint1: String(parsed.hint1), hint2: String(parsed.hint2), hint3: String(parsed.hint3) };
  }

  // First attempt
  let hints: { hint1: string; hint2: string; hint3: string };
  try {
    hints = await attempt(false);
  } catch (err) {
    console.warn(`[gemini] First attempt failed for "${category}": ${err}. Retrying with stricter prompt.`);
    hints = await attempt(true);
  }

  // Validate — retry once if it leaks
  try {
    validateHintQuality(category, words, hints);
  } catch (valErr) {
    console.warn(`[gemini] Hint validation failed for "${category}": ${valErr}. Retrying with strict prompt.`);
    hints = await attempt(true);
    // If still fails, throw and abort the day
    validateHintQuality(category, words, hints);
  }

  return hints;
}

// ---------------------------------------------------------------------------
// NYT response normaliser
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

  // Date integrity check
  const puzzleDate = data.print_date ?? data.date ?? data.puzzleDate;
  if (!puzzleDate) {
    throw new Error('NYT response is missing a date field (tried print_date, date, puzzleDate)');
  }
  if (puzzleDate !== date) {
    throw new Error(`Date mismatch: expected ${date}, NYT returned ${puzzleDate}`);
  }

  // Build grid from all cards sorted by position
  const allCards = data.categories.flatMap(c => c.cards);
  const grid = [...allCards]
    .sort((a, b) => a.position - b.position)
    .map(c => String(c.content).toUpperCase());

  // Build groups with hint generation
  const groups = [];
  for (let i = 0; i < data.categories.length; i++) {
    const cat = data.categories[i];
    const difficulty = DIFFICULTY_MAP[i];
    if (!difficulty) {
      throw new Error(`Out-of-range category index ${i} — expected 0–3. NYT format may have changed.`);
    }
    const words = cat.cards.map(c => String(c.content).toUpperCase()) as [string, string, string, string];
    const hints = await generateHints(cat.title, words);
    groups.push({
      difficulty,
      category: String(cat.title),
      words,
      ...hints,
    });
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

/**
 * Actual Eyefyre shape (verified 2026-05-09 via WebFetch):
 * {
 *   "id": 1,
 *   "date": "2023-06-12",
 *   "answers": [
 *     { "level": 0, "group": "WET WEATHER", "members": ["HAIL","RAIN","SLEET","SNOW"] },
 *     { "level": 1, "group": "NBA TEAMS",   "members": ["BUCKS","HEAT","JAZZ","NETS"] },
 *     ...
 *   ]
 * }
 * No `print_date` or `categories` fields — uses `date` and `answers`.
 */
interface EyefyreEntry {
  id?: number;
  date: string;
  answers: Array<{
    level: number;
    group: string;
    members: string[];
  }>;
}

/**
 * Converts an Eyefyre entry to NYT shape expected by buildPuzzle().
 *
 * Position values: Eyefyre doesn't preserve the original grid positions.
 * We assign positions as `level * 4 + memberIndex` so the grid renders
 * group-clustered. shuffleGrid() on the page side will re-shuffle anyway.
 */
function eyefyreToNYTShape(entry: EyefyreEntry): NYTResponse & { _eyefyre: true } {
  const categories: NYTCategory[] = entry.answers.map(answer => ({
    title: answer.group,
    cards: answer.members.map((member, idx) => ({
      content: member,
      position: answer.level * 4 + idx,
    })),
  }));

  return {
    print_date: entry.date,
    categories,
    _eyefyre: true,
  } as NYTResponse & { _eyefyre: true };
}

async function tryEyefyreFallback(date: string): Promise<unknown | null> {
  if (process.env.GRIDHINT_FALLBACK_EYEFYRE !== '1') return null;

  console.log('[eyefyre] Attempting Tier-2 fallback from Eyefyre archive...');
  try {
    const res = await fetchWithTimeout(
      'https://raw.githubusercontent.com/Eyefyre/NYT-Connections-Answers/main/connections.json'
    );
    if (!res.ok) {
      console.warn(`[eyefyre] Fetch returned ${res.status}`);
      return null;
    }
    const all = await res.json() as EyefyreEntry[];
    const entry = all.find(e => e.date === date);
    if (!entry) {
      console.warn(`[eyefyre] No entry for ${date}`);
      return null;
    }
    console.log('[eyefyre] Found entry — converting to NYT shape with sourceMode=fallback_eyefyre');
    return eyefyreToNYTShape(entry);
  } catch (err) {
    console.warn(`[eyefyre] Error: ${err}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// File output
// ---------------------------------------------------------------------------

function writeOutputs(puzzle: ConnectionsPuzzle, manifest: ConnectionsManifest): void {
  const datePath = path.join(DATA_DIR, `${puzzle.date}.json`);
  const latestPath = path.join(DATA_DIR, 'latest.json');
  const manifestPath = path.join(DATA_DIR, 'manifest.json');

  atomicWrite(datePath, puzzle);
  console.log(`[write] Written ${datePath}`);

  atomicWrite(latestPath, puzzle);
  console.log(`[write] Written ${latestPath}`);

  atomicWrite(manifestPath, manifest);
  console.log(`[write] Written ${manifestPath}`);
}

function buildManifest(date: string): ConnectionsManifest {
  let existing: ConnectionsManifest = {
    latest: date,
    dates: [],
    updatedAt: new Date().toISOString(),
  };

  const manifestPath = path.join(DATA_DIR, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      existing = ConnectionsManifestSchema.parse(raw);
    } catch {
      console.warn('[manifest] Could not parse existing manifest — rebuilding.');
    }
  }

  // Prepend new date (avoid duplicates)
  const dates = [date, ...existing.dates.filter(d => d !== date)];
  return { latest: date, dates, updatedAt: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Validate Gemini key at startup
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey.length < 20) {
    throw new Error('GEMINI_API_KEY is missing or too short (< 20 chars). Aborting.');
  }

  // Cooldown guard
  checkCooldown();

  await notifyStart();

  const targetDate = getNYDate();
  console.log(`[main] Target date (NY): ${targetDate}`);

  let rawNYT: unknown;

  try {
    // Cookie warm-up
    await warmUpCookies();
    // Fetch with status-differentiated retry
    rawNYT = await fetchNYTWithRetry(targetDate);
  } catch (err) {
    const fe = err as FetchError;
    // Try Eyefyre fallback for 403/429/network errors (if enabled)
    if (fe.status !== 404) {
      const eyefyreRaw = await tryEyefyreFallback(targetDate);
      if (eyefyreRaw) {
        rawNYT = eyefyreRaw;
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }

  // Normalise + generate hints
  const puzzle = await buildPuzzle(targetDate, rawNYT);

  // If came from Eyefyre, override sourceMode
  if ((rawNYT as Record<string, unknown>)._eyefyre) {
    (puzzle as Record<string, unknown>).sourceMode = 'fallback_eyefyre';
  }

  // Full schema validation
  ConnectionsPuzzleSchema.parse(puzzle);

  // Structural integrity
  validatePuzzleIntegrity(puzzle);

  // Build manifest + write files
  const manifest = buildManifest(targetDate);
  writeOutputs(puzzle, manifest);

  console.log(`[main] Done. Connections for ${targetDate} written successfully.`);
  await notifySuccess(targetDate);
}

main().catch(async err => {
  console.error('[main] FATAL:', err);
  await notifyFailure(err);
  process.exit(1);
});
