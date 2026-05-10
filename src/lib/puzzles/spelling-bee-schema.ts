import { z } from 'zod';

/**
 * Spelling Bee daily — HINT-ONLY publication.
 *
 * Per legal review: we do NOT expose the flat NYT answer list in HTML.
 * Instead we publish:
 *   - the 7-letter set (always public; no copyright)
 *   - aggregate hints (counts, distributions, pangram count)
 *   - an obfuscated answer "fingerprint" used client-side to validate
 *     user guesses (sha-256 hashes of valid words) — never the words themselves
 */

export const SpellingBeeHintsSchema = z.object({
  /** Total number of valid words (helps users gauge difficulty). 0 allowed for seed. */
  totalWords: z.number().int().min(0),
  /** Count of pangrams (usually 1, sometimes more). */
  pangramCount: z.number().int().min(0),
  /**
   * Distribution: word length → count.
   * Example: {"4":12,"5":18,"6":9,"7":3,"8":2}
   */
  lengthDistribution: z.record(z.string().regex(/^\d+$/), z.number().int().min(0)),
  /**
   * Distribution: starting letter → count.
   * Example: {"A":7,"L":12,"N":4,"P":3,"R":6,"S":3,"T":9}
   */
  startingLetterDistribution: z.record(z.string().regex(/^[A-Z]$/), z.number().int().min(0)),
  /**
   * Genius score threshold (NYT awards "Genius" rank when user reaches ~70% of max points).
   */
  geniusThreshold: z.number().int().min(0),
  /**
   * Maximum possible score (Queen Bee threshold, 100% of all words found).
   */
  queenBeeScore: z.number().int().min(0),
});

export const SpellingBeeDailySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.literal('published'),
  sourceMode: z.enum(['nyt-api-v2', 'manual_seed']),
  /** The center letter (must be present in every valid word). */
  centerLetter: z.string().length(1).regex(/^[A-Z]$/),
  /** The 6 outer letters. */
  outerLetters: z.tuple([
    z.string().length(1).regex(/^[A-Z]$/),
    z.string().length(1).regex(/^[A-Z]$/),
    z.string().length(1).regex(/^[A-Z]$/),
    z.string().length(1).regex(/^[A-Z]$/),
    z.string().length(1).regex(/^[A-Z]$/),
    z.string().length(1).regex(/^[A-Z]$/),
  ]),
  /** All 7 valid letters (centerLetter + outerLetters), uppercase. */
  validLetters: z.array(z.string().length(1).regex(/^[A-Z]$/)).length(7),
  /**
   * SHA-256 hex hashes of every valid answer (uppercase).
   * Used by the client to validate user guesses without exposing the answer list.
   * Stored as a sorted array of hex strings.
   */
  answerHashes: z.array(z.string().regex(/^[a-f0-9]{64}$/)),
  /**
   * SHA-256 hashes of pangrams only (subset of answerHashes).
   */
  pangramHashes: z.array(z.string().regex(/^[a-f0-9]{64}$/)),
  hints: SpellingBeeHintsSchema,
  updatedAt: z.string().datetime(),
});

export type SpellingBeeHints = z.infer<typeof SpellingBeeHintsSchema>;
export type SpellingBeeDaily = z.infer<typeof SpellingBeeDailySchema>;

export function validateSpellingBeeIntegrity(puzzle: SpellingBeeDaily): void {
  if (puzzle.outerLetters.length !== 6) {
    throw new Error(`Spelling Bee outerLetters must be 6; got ${puzzle.outerLetters.length}`);
  }
  if (puzzle.validLetters.length !== 7) {
    throw new Error(`Spelling Bee validLetters must be 7; got ${puzzle.validLetters.length}`);
  }
  const expected = new Set([puzzle.centerLetter, ...puzzle.outerLetters]);
  if (expected.size !== 7) {
    throw new Error('Spelling Bee letters must be unique (centerLetter + outerLetters)');
  }
  const actual = new Set(puzzle.validLetters);
  if (actual.size !== 7) {
    throw new Error(`Spelling Bee validLetters must contain 7 unique letters; got ${actual.size}`);
  }
  for (const letter of expected) {
    if (!actual.has(letter)) {
      throw new Error(`Spelling Bee validLetters missing "${letter}" (must equal centerLetter + outerLetters)`);
    }
  }
  // Hashes must each be 64 hex chars
  for (const h of puzzle.answerHashes) {
    if (!/^[a-f0-9]{64}$/.test(h)) throw new Error(`Invalid answer hash: ${h}`);
  }
  // Pangram count consistency
  if (puzzle.hints.pangramCount !== puzzle.pangramHashes.length) {
    throw new Error(`Pangram count mismatch: hints.pangramCount=${puzzle.hints.pangramCount} vs pangramHashes.length=${puzzle.pangramHashes.length}`);
  }
  // Total words consistency
  if (puzzle.hints.totalWords !== puzzle.answerHashes.length) {
    throw new Error(`Total words mismatch: hints.totalWords=${puzzle.hints.totalWords} vs answerHashes.length=${puzzle.answerHashes.length}`);
  }
}
