/**
 * Common string and letter utility functions used across multiple games.
 * Consolidating these prevents DRY violations and ensures consistent logic.
 */

export function normalize(input: string): string {
  return input.toLowerCase().replace(/[^a-z]/g, '');
}

export function includesAll(word: string, letters: string): boolean {
  const cleanLetters = normalize(letters);
  if (!cleanLetters) return true;
  const wordLower = word.toLowerCase();
  for (const char of cleanLetters) {
    if (!wordLower.includes(char)) return false;
  }
  return true;
}

/**
 * Returns true if NONE of the characters in `letters` appear in `word`.
 * (Renamed from excludesAll to better reflect "Excludes Any" semantics)
 */
export function excludesAny(word: string, letters: string): boolean {
  const cleanLetters = normalize(letters);
  if (!cleanLetters) return true;
  const wordLower = word.toLowerCase();
  for (const char of cleanLetters) {
    if (wordLower.includes(char)) return false;
  }
  return true;
}

export function getLetterMask(word: string): number {
  let mask = 0;
  for (const char of word.toLowerCase()) {
    const code = char.charCodeAt(0) - 97;
    if (code >= 0 && code < 26) {
      mask |= 1 << code;
    }
  }
  return mask;
}
