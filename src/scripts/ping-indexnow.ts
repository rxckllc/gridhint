/**
 * INDEXNOW PING SCRIPT
 *
 * Runs at the END of the daily workflow (after commit + Hostinger deploy).
 * Polls each daily-puzzle page for fresh content (today's date in body) before
 * submitting the URL to IndexNow.
 *
 * Per Gemini 3.1 Pro review: do NOT submit until the deployed page is actually
 * serving fresh content. Otherwise Bing crawls stale HTML and we waste crawl
 * budget.
 *
 * Required env: INDEXNOW_KEY (32-char hex matching public/{key}.txt)
 */

import { submitToIndexNow, type IndexNowSubmission } from './lib/indexnow';
import { getNYDate } from './lib/atomic-write';

async function main(): Promise<void> {
  const today = getNYDate();
  console.log(`[indexnow-ping] today (NY) = ${today}`);

  const submissions: IndexNowSubmission[] = [
    {
      url: 'https://www.gridhint.com/word-games/connections/hints/',
      freshToken: today,
    },
    {
      url: 'https://www.gridhint.com/word-games/wordle/today/',
      freshToken: today,
    },
    {
      url: 'https://www.gridhint.com/word-games/spelling-bee/today/',
      freshToken: today,
    },
    // Sitemap doesn't need a freshness check — submit unconditionally
    { url: 'https://www.gridhint.com/sitemap.xml' },
    { url: 'https://www.gridhint.com/' },
  ];

  await submitToIndexNow(submissions);
}

main().catch(err => {
  console.error('[indexnow-ping] error:', err);
  // Soft fail — IndexNow problems shouldn't fail the workflow
  process.exit(0);
});
