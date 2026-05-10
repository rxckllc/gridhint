import words from '@/data/words/spelling-bee-valid.json';
import { getLetterMask } from './utils';

type WordRecord = {
  word: string;
  len: number;
  mask: number;
  freqZipf?: number;
};

export function solveSpellingBee(input: {
  center: string;
  outer: string[];
  minLength?: number;
  pangramsOnly?: boolean;
  commonOnly?: boolean;
}) {
  const center = input.center.toLowerCase();
  const centerMask = 1 << (center.charCodeAt(0) - 97);
  const outer = input.outer.map(x => x.toLowerCase());
  const allLetters = [center, ...outer].join('');
  const allowedMask = getLetterMask(allLetters);
  const minLength = input.minLength ?? 4;

  const matches: string[] = [];
  const pangrams: string[] = [];
  const byLength = new Map<number, string[]>();

  // Single pass through words for maximum efficiency
  for (const row of (words as WordRecord[])) {
    if (row.len < minLength) continue;
    if ((row.mask & centerMask) === 0) continue; // Must contain center letter
    if ((row.mask & ~allowedMask) !== 0) continue; // Must use only allowed letters
    
    const isPan = (row.mask & allowedMask) === allowedMask;
    if (input.pangramsOnly && !isPan) continue;
    if (input.commonOnly && (row.freqZipf ?? 0) < 3.5) continue;

    matches.push(row.word);
    if (isPan) pangrams.push(row.word);

    if (!byLength.has(row.len)) byLength.set(row.len, []);
    byLength.get(row.len)!.push(row.word);
  }

  // Sorting results for better UX (longest words first)
  const wordsByLength = Array.from(byLength.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([length, words]) => ({ 
      length, 
      words: words.sort((a, b) => a.localeCompare(b)) 
    }));

  return {
    letters: Array.from(new Set(allLetters.split(''))),
    center,
    totalWords: matches.length,
    pangrams: pangrams.sort((a, b) => a.localeCompare(b)),
    wordsByLength,
    warnings: []
  };
}
