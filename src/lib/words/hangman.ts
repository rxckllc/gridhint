import { findByPattern } from './pattern';
import { includesAll, excludesAny } from './utils';

export function filterHangmanCandidates(input: {
  pattern: string;
  wrongLetters?: string;
  knownLetters?: string;
}) {
  const wrong = (input.wrongLetters ?? '').toLowerCase().replace(/[^a-z]/g, '');
  const known = (input.knownLetters ?? '').toLowerCase().replace(/[^a-z]/g, '');

  let candidates = findByPattern({
    pattern: input.pattern,
    excludes: wrong
  });

  if (known) {
    candidates = candidates.filter(word => includesAll(word, known));
  }

  // Double check excludesAny
  candidates = candidates.filter(word => excludesAny(word, wrong));

  return candidates;
}

export function rankHangmanLetters(input: {
  candidates: string[];
  guessedLetters: string;
  mode?: 'safe' | 'aggressive';
}) {
  const guessed = new Set(input.guessedLetters.toLowerCase().replace(/[^a-z]/g, '').split(''));
  const n = input.candidates.length;

  if (n === 0) return [];

  const rows = [];

  for (let code = 97; code <= 122; code++) {
    const letter = String.fromCharCode(code);
    if (guessed.has(letter)) continue;

    const hitWords = input.candidates.filter(word => word.toLowerCase().includes(letter));
    const hitRate = hitWords.length / n;
    const missRate = 1 - hitRate;
    const expectedRemaining = hitRate * hitWords.length + missRate * (n - hitWords.length);

    let score = -expectedRemaining;

    if (input.mode === 'safe') {
      score += hitRate * 5;
      score -= missRate * 2;
    } else {
      score += hitWords.length / n;
    }

    rows.push({
      letter,
      score,
      hitRate,
      coverage: hitWords.length,
      expectedRemaining,
      examples: hitWords.slice(0, 5)
    });
  }

  return rows.sort((a, b) => b.score - a.score || b.hitRate - a.hitRate);
}

export function validateHangmanInput(input: {
  pattern: string;
  wrongLetters?: string;
}) {
  const warnings: string[] = [];
  const patternLetters = new Set(input.pattern.toLowerCase().replace(/[^a-z]/g, '').split(''));
  const wrongLetters = new Set((input.wrongLetters ?? '').toLowerCase().replace(/[^a-z]/g, '').split(''));

  for (const letter of wrongLetters) {
    if (patternLetters.has(letter)) {
      warnings.push(`Wrong letter "${letter.toUpperCase()}" also appears in the known pattern.`);
    }
  }

  return warnings;
}

export function solveHangman(input: {
  pattern: string;
  wrongLetters?: string;
  knownLetters?: string;
  mode?: 'safe' | 'aggressive';
}) {
  const candidates = filterHangmanCandidates(input);
  const patternClean = input.pattern.toLowerCase().replace(/[^a-z]/g, '');
  const wrongClean = (input.wrongLetters ?? '').toLowerCase().replace(/[^a-z]/g, '');
  const knownClean = (input.knownLetters ?? '').toLowerCase().replace(/[^a-z]/g, '');
  
  const guessedLetters = `${patternClean}${wrongClean}${knownClean}`;

  return {
    possibleWords: candidates.slice(0, 100),
    total: candidates.length,
    bestLetters: rankHangmanLetters({
      candidates,
      guessedLetters,
      mode: input.mode
    }).slice(0, 10),
    warnings: validateHangmanInput(input)
  };
}
