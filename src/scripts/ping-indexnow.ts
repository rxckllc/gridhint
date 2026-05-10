/**
 * INDEXNOW PING SCRIPT
 *
 * Submits today's just-updated URLs to IndexNow (Bing/Yandex/Seznam/Naver/Yep).
 *
 * Honours GRIDHINT_INDEXNOW_TARGET env var:
 *   - "connections"   → submit just /word-games/connections/hints/
 *   - "wordle"        → submit just /word-games/wordle/today/
 *   - "spelling-bee"  → submit just /word-games/spelling-bee/today/
 *   - "all" / unset   → submit all three
 *
 * In all cases we also submit the homepage + sitemap.
 *
 * Per Gemini 3.1 Pro review: the script polls each /today URL for today's
 * date in the rendered HTML BEFORE submitting, so we don't ping IndexNow
 * before Hostinger has actually deployed the fresh content.
 *
 * Required env: INDEXNOW_KEY (matches public/{key}.txt at the site root).
 */

import { submitToIndexNow, type IndexNowSubmission } from './lib/indexnow';
import { getNYDate } from './lib/atomic-write';

type Target = 'connections' | 'wordle' | 'spelling-bee' | 'all';

const URL_BY_GAME: Record<Exclude<Target, 'all'>, string> = {
  'connections': 'https://www.gridhint.com/word-games/connections/hints/',
  'wordle': 'https://www.gridhint.com/word-games/wordle/today/',
  'spelling-bee': 'https://www.gridhint.com/word-games/spelling-bee/today/',
};

async function main(): Promise<void> {
  const today = getNYDate();
  const target = (process.env.GRIDHINT_INDEXNOW_TARGET ?? 'all') as Target;
  console.log(`[indexnow-ping] target=${target} date=${today}`);

  const submissions: IndexNowSubmission[] = [];

  if (target === 'all') {
    for (const url of Object.values(URL_BY_GAME)) {
      submissions.push({ url, freshToken: today });
    }
  } else if (URL_BY_GAME[target]) {
    submissions.push({ url: URL_BY_GAME[target], freshToken: today });
  } else {
    console.warn(`[indexnow-ping] unknown target "${target}" — falling back to all`);
    for (const url of Object.values(URL_BY_GAME)) {
      submissions.push({ url, freshToken: today });
    }
  }

  // Always include homepage + sitemap (no fresh-token check — they're always recent)
  submissions.push({ url: 'https://www.gridhint.com/' });
  submissions.push({ url: 'https://www.gridhint.com/sitemap.xml' });

  await submitToIndexNow(submissions);
}

main().catch(err => {
  console.error('[indexnow-ping] error:', err);
  process.exit(0); // soft fail — don't block workflow
});
