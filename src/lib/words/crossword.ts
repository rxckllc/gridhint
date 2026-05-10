import { findByPattern, type PatternOptions } from './pattern';
import freq from '@/data/words/freq-rank.json';
import crosswordCommon from '@/data/words/crossword-common.json';

const commonSet = new Set(crosswordCommon as string[]);

function tokenize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function clueKeywordScore(word: string, clue: string | undefined) {
  if (!clue) return 0;
  const tokens = new Set(tokenize(clue));
  if (tokens.has(word.toLowerCase())) return 0.2;
  return 0;
}

export function solveCrossword(input: PatternOptions & { clue?: string }) {
  const words = findByPattern(input);

  return words
    .map(word => {
      const wordFreq = (freq as Record<string, number>)[word.toLowerCase()] ?? 0;
      const crosswordCommonBoost = commonSet.has(word.toLowerCase()) ? 0.25 : 0;
      const clueBoost = clueKeywordScore(word, input.clue);

      return {
        word,
        length: word.length,
        score: wordFreq + crosswordCommonBoost + clueBoost,
        scoreParts: {
          pattern: 1,
          frequency: wordFreq,
          clue: clueBoost,
          crosswordCommon: crosswordCommonBoost
        }
      };
    })
    .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));
}
