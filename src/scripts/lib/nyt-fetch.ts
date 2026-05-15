/**
 * Shared NYT fetch helpers — cookie warm-up, retry/backoff, cooldown on 403/429.
 * Used by Connections, Wordle, and Spelling Bee daily ingestion scripts.
 */

import { sleep, randomBetween } from './atomic-write';
import { writeCooldown } from './cooldown';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const cookieJar = new Map<string, string>();

function parseCookies(setCookieHeaders: string[]): void {
  for (const header of setCookieHeaders) {
    const parts = header.split(';')[0].trim();
    const eqIdx = parts.indexOf('=');
    if (eqIdx === -1) continue;
    cookieJar.set(parts.slice(0, eqIdx).trim(), parts.slice(eqIdx + 1).trim());
  }
}

function buildCookieHeader(): string {
  return Array.from(cookieJar.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}

export interface FetchError extends Error {
  status: number;
}

function makeFetchError(status: number, message: string): FetchError {
  const err = new Error(message) as FetchError;
  err.status = status;
  return err;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const signal = AbortSignal.timeout(15000);
  return fetch(url, { ...options, signal });
}

/** Navigation-style fetch — updates cookie jar. */
async function fetchPage(url: string, extraHeaders: Record<string, string> = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
    ...extraHeaders,
  };
  if (cookieJar.size > 0) headers['Cookie'] = buildCookieHeader();
  const res = await fetchWithTimeout(url, { headers });
  const setCookies = res.headers.getSetCookie?.() ?? [];
  if (setCookies.length > 0) parseCookies(setCookies);
  return res;
}

/** XHR-style JSON fetch — uses cookie jar. */
async function fetchJSON(url: string, referer: string): Promise<Response> {
  const headers: Record<string, string> = {
    'User-Agent': UA,
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'X-Games-Auth-Bypass': 'true',
    'Referer': referer,
    'Cookie': buildCookieHeader(),
  };
  return fetchWithTimeout(url, { headers });
}

/**
 * Warm cookies via NYT homepage → game landing page.
 * Pass the game-specific landing URL (e.g. /games/connections, /games/wordle, /puzzles/spelling-bee).
 */
export async function warmUpCookies(gameLandingUrl: string): Promise<void> {
  console.log('[warmup] GET https://www.nytimes.com/');
  await fetchPage('https://www.nytimes.com/');
  const d1 = randomBetween(8000, 15000);
  console.log(`[warmup] sleep ${d1}ms`);
  await sleep(d1);

  console.log(`[warmup] GET ${gameLandingUrl}`);
  await fetchPage(gameLandingUrl, {
    'Referer': 'https://www.nytimes.com/',
    'Sec-Fetch-Site': 'same-origin',
  });
  const d2 = randomBetween(4000, 8000);
  console.log(`[warmup] sleep ${d2}ms`);
  await sleep(d2);

  console.log(`[warmup] cookie jar has ${cookieJar.size} entries`);
}

export interface FetchOptions {
  /** Full URL of the daily JSON endpoint. */
  url: string;
  /** Referer for the XHR fetch (typically the game landing page). */
  referer: string;
  /** Deprecated: NYT 404 is now treated as a soft "not posted yet" exit. */
  notFoundRetry?: boolean;
}

/**
 * Fetch a daily NYT JSON endpoint with status-differentiated retry.
 * - 404: log "not posted yet, will retry next tick" and exit 0
 * - 5xx/network: exponential backoff (5s, 10s, 20s) up to 3 attempts
 * - 403/429: write 48h cooldown and abort
 *
 * Returns the parsed JSON.
 */
export async function fetchNYTDaily(opts: FetchOptions): Promise<unknown> {
  const { url, referer } = opts;

  let lastError: unknown;
  for (let retry = 0; retry < 3; retry++) {
    try {
      if (retry > 0) {
        const backoff = 5000 * Math.pow(2, retry - 1);
        console.log(`[fetch] retry ${retry}/2 after ${backoff}ms`);
        await sleep(backoff);
      }

      console.log(`[fetch] GET ${url} (attempt ${retry + 1})`);
      const res = await fetchJSON(url, referer);

      if (res.ok) return await res.json();

      if (res.status === 404) {
        console.warn('[fetch] not posted yet, will retry next tick');
        process.exit(0);
      }

      if (res.status === 403 || res.status === 429) {
        console.error(`[fetch] BLOCKED: HTTP ${res.status}. Writing 48h cooldown and aborting.`);
        writeCooldown(48);
        throw makeFetchError(res.status, `NYT blocked us with ${res.status}`);
      }

      if (res.status >= 500) {
        lastError = makeFetchError(res.status, `NYT returned ${res.status}`);
        continue;
      }

      throw makeFetchError(res.status, `Unexpected HTTP ${res.status}`);
    } catch (err) {
      const fe = err as FetchError;
      if (fe.status === 403 || fe.status === 429) throw err;
      lastError = err;
      if (retry === 2) throw lastError;
    }
  }

  throw new Error('fetchNYTDaily: unexpected exit');
}

/** Plain GET (no cookie jar) for fallback URLs like GitHub raw or our own deployed pages. */
export async function plainFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetchWithTimeout(url, init);
}
