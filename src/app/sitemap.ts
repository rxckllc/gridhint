import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.gridhint.com';

  const staticRoutes = [
    '',
    '/word-games',
    '/word-games/unscramble',
    '/word-games/word-scrambler',
    '/word-games/word-descrambler',
    '/disclaimer',
    // New spec-shaped hub routes
    '/word-games/wordle/',
    '/word-games/wordle/solver/',
    '/word-games/anagram-jumble/',
    '/word-games/anagram-jumble/unscramble/',
    '/word-games/anagram-jumble/word-descrambler/',
    '/word-games/anagram-jumble/word-scrambler/',
    '/word-games/anagram-jumble/anagram-solver/',
    '/word-games/crossword/',
    '/word-games/crossword/solver/',
    '/word-games/spelling-bee/',
    '/word-games/spelling-bee/helper/',
    '/word-games/hangman/',
    '/word-games/hangman/solver/',
    '/word-games/word-ladder/',
    '/word-games/word-ladder/solver/',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const testLetters = ['sbitmu', 'elzzpu', 'pleap'];
  const programmaticRoutes = testLetters.map((letters) => ({
    url: `${baseUrl}/word-games/unscramble/${letters}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...programmaticRoutes];
}
