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
    // Fallback to build time so sitemap still emits if manifest missing.
    // The cron writes the manifest daily, so this only matters on first deploy.
    return new Date();
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.gridhint.com';
  const now = new Date();

  // ---------------------------------------------------------------
  // Daily puzzle pages — change DAILY, lastmod from each manifest
  // ---------------------------------------------------------------
  const dailyRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/word-games/connections/hints/`,
      lastModified: readManifestUpdatedAt('connections'),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/word-games/wordle/today/`,
      lastModified: readManifestUpdatedAt('wordle'),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/word-games/spelling-bee/today/`,
      lastModified: readManifestUpdatedAt('spelling-bee'),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // ---------------------------------------------------------------
  // High-traffic solver/helper pages — change WEEKLY (refinements,
  // not daily content updates).
  // All paths end in trailing slash to match next.config trailingSlash:true
  // and avoid Google "Page with redirect" errors.
  // ---------------------------------------------------------------
  const weeklyRoutes = [
    '/word-games/wordle/solver/',
    '/word-games/spelling-bee/helper/',
    '/word-games/anagram-jumble/unscramble/',
    '/word-games/anagram-jumble/anagram-solver/',
    '/word-games/anagram-jumble/word-descrambler/',
    '/word-games/anagram-jumble/word-scrambler/',
    '/word-games/crossword/solver/',
    '/word-games/hangman/solver/',
    '/word-games/word-ladder/solver/',
    '/word-games/word-pattern-solver/',
    '/word-games/5-letter-words/',
    '/word-games/unscramble/',
    '/word-games/word-scrambler/',
    '/word-games/word-descrambler/',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // ---------------------------------------------------------------
  // Hub & static pages — change MONTHLY
  // ---------------------------------------------------------------
  const monthlyRoutes = [
    '/about/',
    '/contact/',
    '/disclaimer/',
    '/word-games/',
    '/word-games/connections/',
    '/word-games/wordle/',
    '/word-games/spelling-bee/',
    '/word-games/anagram-jumble/',
    '/word-games/crossword/',
    '/word-games/hangman/',
    '/word-games/word-ladder/',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Homepage — top priority, daily change frequency (because daily-puzzle cards rotate)
  const homepage = {
    url: `${baseUrl}/`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 1.0,
  };

  return [homepage, ...dailyRoutes, ...weeklyRoutes, ...monthlyRoutes];
}
