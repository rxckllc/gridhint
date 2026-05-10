/**
 * IndexNow integration — pings Bing/Yandex/Seznam/Naver/Yep simultaneously
 * via the central api.indexnow.org endpoint.
 *
 * IndexNow does NOT trigger Google indexing — Google handles its own crawl
 * scheduling. We rely on sitemap lastmod for Google.
 *
 * Requires: INDEXNOW_KEY env var, plus a public/{key}.txt file served at
 *   https://www.gridhint.com/{key}.txt
 *
 * Per Gemini 3.1 Pro review: do NOT submit URLs until the deployed site is
 * actually serving fresh content. We poll a known cache-buster (lastmod or
 * date string) before submitting.
 */

import { plainFetch } from './nyt-fetch';
import { sleep } from './atomic-write';

const INDEXNOW_HOST = 'www.gridhint.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export interface IndexNowSubmission {
  /** Absolute URL to ping. */
  url: string;
  /**
   * A token expected to appear in the body of `url` AFTER deploy
   * (e.g. today's date "2026-05-10"). If supplied, we'll poll the URL
   * until the token appears (or timeout) before pinging IndexNow.
   */
  freshToken?: string;
}

interface PollOptions {
  url: string;
  token: string;
  /** Total seconds to poll. Default 600s (10min) — Hostinger build can take 2-4min. */
  timeoutSeconds?: number;
  /** Seconds between polls. Default 15s. */
  intervalSeconds?: number;
}

/**
 * Poll a URL until its body contains `token`, or timeout.
 * Returns true if the token appeared, false if we timed out.
 *
 * Uses a per-poll cache-buster query param so any intermediary CDN that
 * ignores Cache-Control still serves the fresh edge response.
 */
async function pollForFreshContent(opts: PollOptions): Promise<boolean> {
  const { url, token, timeoutSeconds = 600, intervalSeconds = 15 } = opts;
  const deadline = Date.now() + timeoutSeconds * 1000;

  while (Date.now() < deadline) {
    try {
      const cacheBuster = `_t=${Date.now()}`;
      const sep = url.includes('?') ? '&' : '?';
      const fetchUrl = `${url}${sep}${cacheBuster}`;
      const res = await plainFetch(fetchUrl, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      });
      if (res.ok) {
        const body = await res.text();
        if (body.includes(token)) {
          console.log(`[indexnow] fresh content confirmed at ${url} (token "${token}")`);
          return true;
        }
        console.log(`[indexnow] ${url} OK but token "${token}" not yet present, retrying...`);
      } else {
        console.log(`[indexnow] ${url} returned ${res.status}, retrying...`);
      }
    } catch (err) {
      console.log(`[indexnow] ${url} fetch error: ${err}, retrying...`);
    }
    await sleep(intervalSeconds * 1000);
  }

  console.warn(`[indexnow] timed out waiting for fresh content at ${url} (token "${token}")`);
  return false;
}

/**
 * Submit URLs to IndexNow.
 * If any submission has a `freshToken`, we poll its URL first and skip submitting if stale.
 */
export async function submitToIndexNow(submissions: IndexNowSubmission[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || key.length < 8) {
    console.warn('[indexnow] INDEXNOW_KEY missing or too short — skipping submission.');
    return;
  }

  const verifiedUrls: string[] = [];
  for (const sub of submissions) {
    if (sub.freshToken) {
      const fresh = await pollForFreshContent({ url: sub.url, token: sub.freshToken });
      if (!fresh) {
        console.warn(`[indexnow] skipping ${sub.url} — could not verify fresh content`);
        continue;
      }
    }
    verifiedUrls.push(sub.url);
  }

  if (verifiedUrls.length === 0) {
    console.warn('[indexnow] no URLs verified fresh — nothing to submit');
    return;
  }

  const payload = {
    host: INDEXNOW_HOST,
    key,
    keyLocation: `https://${INDEXNOW_HOST}/${key}.txt`,
    urlList: verifiedUrls,
  };

  try {
    const res = await plainFetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    // IndexNow returns 200 (received) or 202 (accepted) on success
    if (res.status === 200 || res.status === 202) {
      console.log(`[indexnow] submitted ${verifiedUrls.length} URL(s) — HTTP ${res.status}`);
    } else {
      console.error(`[indexnow] submission failed — HTTP ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error(`[indexnow] submission error: ${err}`);
  }
}
