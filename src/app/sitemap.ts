import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

interface Manifest {
  latest: string;
  updatedAt: string;
}

function readManifestUpdatedAt(game: string): Date {
  try {
    const p = path.join(process.cwd(), 'src/data/generated', game, 'manifest.json');
    const m = JSON.parse(fs.readFileSync(p, 'utf8')) as Manifest;
    return new Date(m.updatedAt);
  } catch {
    return new Date();
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.gridhint.com';
  const now = new Date();

  // Daily-puzzle pages — lastmod from each game's manifest so Google sees
  // a fresh signal even without IndexNow.
  const connectionsLastmod = readManifestUpdatedAt('connections');
  const wordleLastmod = readManifestUpdatedAt('wordle');
  const beeLastmod = readManifestUpdatedAt('spelling-bee');

  const dailyRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/word-games/connections/hints/`,
      lastModified: connectionsLastmod,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/word-games/wordle/today/`,
      lastModified: wordleLastmod,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/word-games/spelling-bee/today/`,
      lastModified: beeLastmod,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/disclaimer',
    '/word-games',
    '/word-games/unscramble',
    '/word-games/word-scrambler',
    '/word-games/word-descrambler',
    '/word-games/word-pattern-solver',
    '/word-games/5-letter-words',
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
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const testLetters = ['sbitmu', 'elzzpu', 'pleap'];
  const programmaticRoutes = testLetters.map((letters) => ({
    url: `${baseUrl}/word-games/unscramble/${letters}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...dailyRoutes, ...staticRoutes, ...programmaticRoutes];
}
