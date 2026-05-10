import allWords from '@/data/words/all-words.json';
import { letterMask, sigSubset, signature as getSignature } from './signature';

type WordRecord = {
  word: string;
  len: number;
  sig: string;
  mask: number;
  freqZipf?: number;
};

export type UnscrambleOptions = {
  minLength?: number;
  maxLength?: number;
  exactOnly?: boolean;
  useAllLetters?: boolean;
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  excludes?: string;
  commonOnly?: boolean;
};

function passesTextFilters(word: string, opts: UnscrambleOptions) {
  if (opts.startsWith && !word.startsWith(opts.startsWith.toLowerCase())) return false;
  if (opts.endsWith && !word.endsWith(opts.endsWith.toLowerCase())) return false;
  if (opts.contains && !opts.contains.toLowerCase().split('').every(c => word.includes(c))) return false;
  if (opts.excludes && opts.excludes.toLowerCase().split('').some(c => word.includes(c))) return false;
  return true;
}

export function unscramble(input: string, opts: UnscrambleOptions = {}) {
  const letters = input.toLowerCase().replace(/[^a-z]/g, '');
  const minLength = opts.minLength ?? 2;
  const maxLength = opts.maxLength ?? letters.length;
  const queryMask = letterMask(letters);
  const querySig = getSignature(letters);

  const candidates = allWords as WordRecord[];

  const filtered = candidates.filter(r => {
    if (r.len < minLength || r.len > maxLength) return false;
    
    if (opts.exactOnly || opts.useAllLetters) {
      if (r.len !== letters.length) return false;
      if (r.sig !== querySig) return false;
    } else {
      if ((r.mask & ~queryMask) !== 0) return false;
      if (!sigSubset(r.sig, querySig)) return false;
    }

    if (!passesTextFilters(r.word, opts)) return false;
    
    return true;
  });

  // Sort by frequency (if available), then length, then alphabetical
  filtered.sort((a, b) =>
    (b.freqZipf ?? 0) - (a.freqZipf ?? 0) ||
    b.len - a.len ||
    a.word.localeCompare(b.word)
  );

  const byLength = new Map<number, string[]>();
  for (const row of filtered) {
    if (!byLength.has(row.len)) byLength.set(row.len, []);
    byLength.get(row.len)!.push(row.word);
  }

  return Array.from(byLength.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([length, words]) => ({ length, words }));
}
