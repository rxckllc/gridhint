import { encodePattern, scoreGuess } from './wordle';

/**
 * Calculates Shannon entropy for a given guess against the remaining answers.
 * Uses an Int32Array for bucket storage to avoid Map allocations in hot loops.
 */
export function entropyScore(
  guess: string,
  answers: string[],
  freq: Record<string, number> = {}
): { entropy: number; expectedRemaining: number } {
  if (answers.length === 0) return { entropy: 0, expectedRemaining: 0 };
  
  // There are 243 possible Wordle patterns (3^5)
  const buckets = new Int32Array(243);

  for (const answer of answers) {
    const key = encodePattern(scoreGuess(guess, answer));
    buckets[key]++;
  }

  let entropy = 0;
  let expectedRemaining = 0;
  const n = answers.length;

  for (let i = 0; i < 243; i++) {
    const count = buckets[i];
    if (count > 0) {
      const p = count / n;
      entropy -= p * Math.log2(p);
      expectedRemaining += p * count;
    }
  }

  // Pure entropy return. Heuristics (like duplicate penalties) are handled in the ranker tiebreakers.
  return {
    entropy,
    expectedRemaining
  };
}

export function rankGuesses(
  guesses: string[],
  remainingAnswers: string[],
  freq: Record<string, number>,
  topN = 25
) {
  if (remainingAnswers.length === 0) return [];
  
  // Optimization: If very few answers left, prioritizing possible answers is usually better.
  const candidateGuesses = remainingAnswers.length <= 2 
    ? remainingAnswers 
    : guesses;

  return candidateGuesses
    .map(word => {
      const score = entropyScore(word, remainingAnswers, freq);
      const uniqueCount = new Set(word).size;
      
      return {
        word,
        entropy: score.entropy,
        expectedRemaining: score.expectedRemaining,
        isPossibleAnswer: remainingAnswers.includes(word),
        freqZipf: freq[word] || 0,
        uniqueCount
      };
    })
    .sort((a, b) => {
      // 1. Primary sort: Entropy
      if (Math.abs(b.entropy - a.entropy) > 0.001) return b.entropy - a.entropy;
      
      // 2. Tiebreaker: Is it a possible answer?
      if (a.isPossibleAnswer !== b.isPossibleAnswer) return a.isPossibleAnswer ? -1 : 1;
      
      // 3. Tiebreaker: Unique letters (more is usually better for info gain)
      if (a.uniqueCount !== b.uniqueCount) return b.uniqueCount - a.uniqueCount;
      
      // 4. Tiebreaker: Frequency
      return b.freqZipf - a.freqZipf;
    })
    .slice(0, topN);
}
