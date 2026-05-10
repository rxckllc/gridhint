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
  } catch (e) {
    console.error(`Sitemap: failed to read manifest for ${game}`, e);
    // Fallback to build time so sitemap still emits if manifest missing.
    // The cron writes the manifest daily, so this only matters on first deploy.
    return new Date();
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gridhint.com';
  const now = new Date();

  // ---------------------------------------------------------------
  // Daily puzzle pages — change DAILY, lastmod from each manifest
  // ---------------------------------------------------------------
  const dailyRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/connections/hints/`,
      lastModified: readManifestUpdatedAt('connections'),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/wordle/today/`,
      lastModified: readManifestUpdatedAt('wordle'),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/spelling-bee/today/`,
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
    '/wordle/solver/',
    '/spelling-bee/helper/',
    '/anagram-jumble/unscramble/',
    '/anagram-jumble/anagram-solver/',
    '/anagram-jumble/word-descrambler/',
    '/anagram-jumble/word-scrambler/',
    '/crossword/solver/',
    '/hangman/solver/',
    '/word-ladder/solver/',
    '/word-pattern-solver/',
    '/5-letter-words/',
    '/unscramble/',
    '/word-scrambler/',
    '/word-descrambler/',
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
    '/connections/',
    '/wordle/',
    '/spelling-bee/',
    '/anagram-jumble/',
    '/crossword/',
    '/hangman/',
    '/word-ladder/',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // ---------------------------------------------------------------
  // Archive Pages — Expose historical data for long-tail traffic
  // ---------------------------------------------------------------
  const archiveRoutes: MetadataRoute.Sitemap = [];
  const games = [
    { dir: 'connections', path: '/connections/hints/' },
  ];

  for (const game of games) {
    try {
      const dirPath = path.join(process.cwd(), 'src/data/generated', game.dir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          if (file.match(/^\d{4}-\d{2}-\d{2}\.json$/)) {
            const dateStr = file.replace('.json', '');
            const stat = fs.statSync(path.join(dirPath, file));
            
            // Note: you must ensure these dynamic routes actually exist in your Next.js app
            // e.g., src/app/connections/hints/[date]/page.tsx
            archiveRoutes.push({
              url: `${baseUrl}${game.path}${dateStr}/`,
              lastModified: stat.mtime,
              changeFrequency: 'never',
              priority: 0.5,
            });
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // Homepage — top priority, daily change frequency (because daily-puzzle cards rotate)
  const homepage = {
    url: `${baseUrl}/`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 1.0,
  };

  return [homepage, ...dailyRoutes, ...weeklyRoutes, ...monthlyRoutes, ...archiveRoutes];
}
