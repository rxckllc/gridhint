import type { ConnectionsPuzzle } from './connections-schema';

/**
 * Validates structural integrity of a Connections puzzle:
 * - Exactly 16 unique grid words
 * - Exactly 4 groups each with 4 words
 * - All group words appear in the grid
 * - No duplicate words across groups
 */
export function validatePuzzleIntegrity(puzzle: ConnectionsPuzzle): void {
  const { grid, groups } = puzzle;

  // 16 unique grid words
  if (grid.length !== 16) {
    throw new Error(`Grid must have 16 words, got ${grid.length}`);
  }
  const uniqueGrid = new Set(grid.map(w => w.toUpperCase()));
  if (uniqueGrid.size !== 16) {
    throw new Error(`Grid contains duplicate words (${16 - uniqueGrid.size} duplicates)`);
  }

  // 4 groups × 4 words
  if (groups.length !== 4) {
    throw new Error(`Puzzle must have 4 groups, got ${groups.length}`);
  }

  const allGroupWords: string[] = [];
  for (const group of groups) {
    if (group.words.length !== 4) {
      throw new Error(`Group "${group.category}" must have 4 words, got ${group.words.length}`);
    }
    allGroupWords.push(...group.words.map(w => w.toUpperCase()));
  }

  // All group words appear in grid
  for (const word of allGroupWords) {
    if (!uniqueGrid.has(word)) {
      throw new Error(`Group word "${word}" not found in grid`);
    }
  }

  // No duplicates across groups (16 group words should all be unique)
  const uniqueGroupWords = new Set(allGroupWords);
  if (uniqueGroupWords.size !== 16) {
    throw new Error(`Duplicate words across groups (${16 - uniqueGroupWords.size} duplicates)`);
  }
}

/**
 * Validates hint quality for a single group:
 * - No answer word appears in any hint (word-boundary regex)
 * - Category name doesn't appear in hint1 or hint2
 * - No markdown fences
 * - Max 140 chars per hint
 */
export function validateHintQuality(
  category: string,
  words: string[],
  hints: { hint1: string; hint2: string; hint3: string }
): void {
  const { hint1, hint2, hint3 } = hints;
  const allHints = [hint1, hint2, hint3];

  // Max 140 chars
  for (const [i, hint] of allHints.entries()) {
    if (hint.length > 140) {
      throw new Error(`hint${i + 1} exceeds 140 chars (${hint.length}) for category "${category}"`);
    }
  }

  // No markdown fences
  for (const [i, hint] of allHints.entries()) {
    if (hint.includes('```') || hint.includes('~~~')) {
      throw new Error(`hint${i + 1} contains markdown fences for category "${category}"`);
    }
  }

  // No answer word in any hint (word-boundary check)
  for (const word of words) {
    const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    for (const [i, hint] of allHints.entries()) {
      if (wordRegex.test(hint)) {
        throw new Error(
          `hint${i + 1} leaks answer word "${word}" for category "${category}"`
        );
      }
    }
  }

  // Category name not in hint1 or hint2
  const catRegex = new RegExp(`\\b${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  if (catRegex.test(hint1)) {
    throw new Error(`hint1 contains category name "${category}"`);
  }
  if (catRegex.test(hint2)) {
    throw new Error(`hint2 contains category name "${category}"`);
  }
}
