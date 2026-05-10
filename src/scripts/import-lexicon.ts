/**
 * Fetches the ENABLE2K word list and Norvig frequency data, then emits
 * all dictionary JSON files consumed by the game solvers.
 *
 * Usage: npx tsx src/scripts/import-lexicon.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'src', 'data', 'words');

function sig(word: string): string {
  return word.split('').sort().join('');
}

function letterMask(word: string): number {
  let m = 0;
  for (const c of word) {
    const bit = c.charCodeAt(0) - 97;
    if (bit >= 0 && bit < 26) m |= 1 << bit;
  }
  return m;
}

async function fetchText(url: string): Promise<string> {
  console.log(`Fetching ${url} ...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

async function main() {
  // --- 1. Fetch word list ---
  let wordListText: string;
  try {
    wordListText = await fetchText('https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt');
  } catch {
    console.warn('Primary URL failed, trying fallback...');
    wordListText = await fetchText('https://norvig.com/ngrams/enable1.txt');
  }

  const rawWords = wordListText.split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(w => /^[a-z]{2,15}$/.test(w));
  console.log(`Word list: ${rawWords.length} words after filtering`);

  // --- 2. Fetch frequency data ---
  let freqText: string;
  try {
    freqText = await fetchText('https://norvig.com/ngrams/count_1w.txt');
  } catch (e) {
    console.error('Failed to fetch frequency data:', e);
    process.exit(1);
  }

  const rawFreq: Record<string, number> = {};
  for (const line of freqText.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
      const word = parts[0].toLowerCase();
      const count = parseInt(parts[1], 10);
      if (!isNaN(count)) rawFreq[word] = count;
    }
  }
  console.log(`Frequency data: ${Object.keys(rawFreq).length} entries`);

  let maxCount = 0;
  for (const v of Object.values(rawFreq)) if (v > maxCount) maxCount = v;
  const log10Max = Math.log10(maxCount + 1);

  function normalizedFreq(word: string): number {
    const count = rawFreq[word] ?? 0;
    return Math.log10(count + 1) / log10Max;
  }

  // --- 3. Build all-words records ---
  const wordSet = new Set(rawWords);
  interface WordRecord {
    word: string;
    len: number;
    sig: string;
    mask: number;
    freqZipf: number;
  }

  const allWords: WordRecord[] = rawWords.map(word => ({
    word,
    len: word.length,
    sig: sig(word),
    mask: letterMask(word),
    freqZipf: normalizedFreq(word),
  }));

  // --- 4. words-by-length ---
  const wordsByLength: Record<string, string[]> = {};
  for (const w of rawWords) {
    const key = String(w.length);
    if (!wordsByLength[key]) wordsByLength[key] = [];
    wordsByLength[key].push(w);
  }

  // --- 5. freq-rank ---
  const freqRank: Record<string, number> = {};
  for (const w of rawWords) freqRank[w] = normalizedFreq(w);

  // --- 6. sorted-letter-map (signature -> words) ---
  const sortedLetterMap: Record<string, string[]> = {};
  for (const w of rawWords) {
    const s = sig(w);
    if (!sortedLetterMap[s]) sortedLetterMap[s] = [];
    sortedLetterMap[s].push(w);
  }

  // --- 7. spelling-bee-valid (len >= 4) ---
  const spellingBeeValid = allWords
    .filter(r => r.len >= 4)
    .map(r => ({ word: r.word, len: r.len, mask: r.mask, freqZipf: r.freqZipf }));

  // --- 8. five-letter-answers (top ~2300 by freq, len=5) ---
  const fiveLetterAll = allWords.filter(r => r.len === 5).sort((a, b) => b.freqZipf - a.freqZipf);
  const fiveLetterAnswers = fiveLetterAll.slice(0, 2300).map(r => r.word);
  const fiveLetterGuesses = rawWords.filter(w => w.length === 5);
  const fiveLetterFreq: Record<string, number> = {};
  for (const r of fiveLetterAll) fiveLetterFreq[r.word] = r.freqZipf;

  // --- 9. crossword-common (top ~5000 by freq, len 3-15) ---
  const crosswordCommon = allWords
    .filter(r => r.len >= 3 && r.len <= 15)
    .sort((a, b) => b.freqZipf - a.freqZipf)
    .slice(0, 5000)
    .map(r => r.word);

  // --- 10. Write files ---
  mkdirSync(DATA_DIR, { recursive: true });

  function write(name: string, data: unknown) {
    const path = join(DATA_DIR, name);
    writeFileSync(path, JSON.stringify(data));
    const sizeKb = Math.round(Buffer.byteLength(JSON.stringify(data)) / 1024);
    console.log(`  Written ${name} (${sizeKb} KB)`);
  }

  write('all-words.json', allWords);
  write('words-by-length.json', wordsByLength);
  write('freq-rank.json', freqRank);
  write('sorted-letter-map.json', sortedLetterMap);
  write('spelling-bee-valid.json', spellingBeeValid);
  write('five-letter-answers.json', fiveLetterAnswers);
  write('five-letter-guesses.json', fiveLetterGuesses);
  write('five-letter-freq.json', fiveLetterFreq);
  write('crossword-common.json', crosswordCommon);

  console.log('\nDone. Run `npx tsx src/scripts/generate-ladder-index.ts` next.');
}

main().catch(e => { console.error(e); process.exit(1); });
