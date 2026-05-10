import { z } from 'zod';

export const WordleHintsSchema = z.object({
  /** First letter of the answer — must be uppercase A-Z. */
  firstLetter: z.string().regex(/^[A-Z]$/),
  /** Vowel/consonant pattern, e.g. "CVCVC". */
  pattern: z.string().regex(/^[CV]{5}$/),
  /** Definition or thematic clue (does NOT contain the answer word). */
  definition: z.string().min(1).max(200),
});

export const WordleDailySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.literal('published'),
  sourceMode: z.enum(['nyt-api-v2', 'manual_seed']),
  /** The 5-letter solution (UPPERCASE). */
  solution: z.string().regex(/^[A-Z]{5}$/),
  /** NYT internal day counter (e.g. 1397 for 2026-05-10). Optional. */
  dayNumber: z.number().int().nonnegative().optional(),
  /** NYT editor name (if provided). */
  editor: z.string().optional(),
  hints: WordleHintsSchema,
  updatedAt: z.string().datetime(),
});

export type WordleHints = z.infer<typeof WordleHintsSchema>;
export type WordleDaily = z.infer<typeof WordleDailySchema>;

/** Structural integrity: solution length, all letters in alphabet. */
export function validateWordleIntegrity(puzzle: WordleDaily): void {
  if (puzzle.solution.length !== 5) {
    throw new Error(`Wordle solution must be 5 letters; got ${puzzle.solution.length}`);
  }
  if (!/^[A-Z]{5}$/.test(puzzle.solution)) {
    throw new Error(`Wordle solution must be uppercase A-Z only; got "${puzzle.solution}"`);
  }
  if (puzzle.hints.firstLetter !== puzzle.solution[0]) {
    throw new Error(`Wordle hint firstLetter must match solution[0]; got "${puzzle.hints.firstLetter}" vs "${puzzle.solution[0]}"`);
  }
  // Definition must NOT contain the solution word
  const upperDef = puzzle.hints.definition.toUpperCase();
  if (upperDef.includes(puzzle.solution)) {
    throw new Error(`Wordle definition leaks solution word "${puzzle.solution}"`);
  }
  // Pattern must match solution
  const expectedPattern = puzzle.solution
    .split('')
    .map(ch => /[AEIOU]/.test(ch) ? 'V' : 'C')
    .join('');
  if (puzzle.hints.pattern !== expectedPattern) {
    throw new Error(`Wordle pattern mismatch: expected ${expectedPattern}, got ${puzzle.hints.pattern}`);
  }
}
