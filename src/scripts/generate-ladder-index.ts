/**
 * Reads words-by-length.json and emits wildcard index files for word-ladder.
 * Outputs:
 *   src/data/indexes/word-ladder/wildcards-len-{N}.json
 *   src/data/words/ladder-words-len-{N}.json
 * for N in 3..7.
 *
 * Usage: npx tsx src/scripts/generate-ladder-index.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const WORDS_BY_LENGTH_PATH = join(process.cwd(), 'src', 'data', 'words', 'words-by-length.json');
const INDEX_DIR = join(process.cwd(), 'src', 'data', 'indexes', 'word-ladder');
const WORDS_DIR = join(process.cwd(), 'src', 'data', 'words');

const LENGTHS = [3, 4, 5, 6, 7];

function wildcardPatterns(word: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < word.length; i++) {
    out.push(word.slice(0, i) + '*' + word.slice(i + 1));
  }
  return out;
}

function main() {
  const wordsByLength: Record<string, string[]> = JSON.parse(readFileSync(WORDS_BY_LENGTH_PATH, 'utf-8'));

  mkdirSync(INDEX_DIR, { recursive: true });

  for (const len of LENGTHS) {
    const words: string[] = wordsByLength[String(len)] ?? [];
    if (words.length === 0) {
      console.warn(`No words for length ${len}, skipping`);
      continue;
    }

    const index: Record<string, string[]> = {};
    for (const word of words) {
      for (const pat of wildcardPatterns(word)) {
        if (!index[pat]) index[pat] = [];
        index[pat].push(word);
      }
    }

    const indexPath = join(INDEX_DIR, `wildcards-len-${len}.json`);
    writeFileSync(indexPath, JSON.stringify(index));
    const sizeKb = Math.round(Buffer.byteLength(JSON.stringify(index)) / 1024);
    console.log(`  wildcards-len-${len}.json: ${words.length} words, ${Object.keys(index).length} patterns (${sizeKb} KB)`);

    const wordsPath = join(WORDS_DIR, `ladder-words-len-${len}.json`);
    writeFileSync(wordsPath, JSON.stringify(words));
    console.log(`  ladder-words-len-${len}.json`);
  }

  console.log('\nLadder index generation complete.');
}

main();
