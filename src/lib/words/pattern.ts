import wordsByLength from '@/data/words/words-by-length.json';
import { includesAll, excludesAny } from './utils';

export type PatternOptions = {
  pattern?: string;
  length?: number;
  contains?: string;
  excludes?: string;
  startsWith?: string;
  endsWith?: string;
};

/**
 * Normalizes pattern characters.
 * ? and _ match exactly one character.
 * * matches zero or more characters.
 */
export function normalizePattern(pattern: string): string {
  return pattern
    .toLowerCase()
    .replace(/[^a-z_?.*]/g, '')
    .replace(/[?_]/g, '.')
    .replace(/\*/g, '.*');
}

export function compilePattern(normalized: string): RegExp {
  return new RegExp(`^${normalized}$`);
}

export function findByPattern(opts: PatternOptions): string[] {
  const rawPattern = opts.pattern || '';
  const normalized = normalizePattern(rawPattern);
  const regex = compilePattern(normalized);
  
  // If pattern has a '*' (zero or more), we check multiple length buckets.
  // If not, we only check the exact length bucket.
  const hasStar = rawPattern.includes('*');
  const exactLength = opts.length ?? (hasStar ? 0 : rawPattern.length);

  let lengthKeys = Object.keys(wordsByLength);
  if (exactLength > 0) {
    lengthKeys = [String(exactLength)];
  }

  const results: string[] = [];

  for (const key of lengthKeys) {
    const candidates = (wordsByLength as Record<string, string[]>)[key] || [];
    for (const word of candidates) {
      if (!regex.test(word)) continue;
      if (opts.startsWith && !word.toLowerCase().startsWith(opts.startsWith.toLowerCase())) continue;
      if (opts.endsWith && !word.toLowerCase().endsWith(opts.endsWith.toLowerCase())) continue;
      if (opts.contains && !includesAll(word, opts.contains)) continue;
      if (opts.excludes && !excludesAny(word, opts.excludes)) continue;
      
      results.push(word);
    }
  }

  return results;
}
