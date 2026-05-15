/**
 * IndexNow integration for GridHint daily puzzle pages.
 *
 * The import workflow calls this after fresh content has been pushed. We first
 * poll the public URL until today's date appears, then submit the changed URLs
 * to each IndexNow participant separately so the daily summary can report
 * per-endpoint health.
 */

import fs from 'fs';
import path from 'path';
import { plainFetch } from './nyt-fetch';
import { atomicWrite, sleep } from './atomic-write';

const INDEXNOW_HOST = 'gridhint.com';

type Game = 'connections' | 'wordle' | 'spelling-bee';
type EndpointName = 'bing' | 'yandex' | 'seznam' | 'naver' | 'yep';
type OverallStatus = 'OK' | 'PARTIAL' | 'FAILED' | 'NOT_ATTEMPTED';

const INDEXNOW_ENDPOINTS: Record<EndpointName, string> = {
  bing: 'https://www.bing.com/indexnow',
  yandex: 'https://yandex.com/indexnow',
  seznam: 'https://search.seznam.cz/indexnow',
  naver: 'https://searchadvisor.naver.com/indexnow',
  yep: 'https://indexnow.yep.com/indexnow',
};

export interface IndexNowSubmission {
  url: string;
  freshToken?: string;
}

interface PollOptions {
  url: string;
  token: string;
  timeoutSeconds?: number;
  intervalSeconds?: number;
}

interface EndpointResult {
  endpoint: EndpointName;
  url: string;
  status: number | null;
  ok: boolean;
  error?: string;
  body?: string;
}

interface IndexNowHistoryEntry {
  timestamp: string;
  overall: OverallStatus;
  submittedUrls: string[];
  endpoints: Record<EndpointName, EndpointResult>;
  reason?: string;
}

interface IndexNowStatusFile {
  timestamp: string;
  updatedAt: string;
  game: Game;
  overall: OverallStatus;
  submittedUrls: string[];
  endpoints: Record<EndpointName, EndpointResult>;
  consecutiveFailures: number;
  endpointConsecutiveFailures: Record<EndpointName, number>;
  history: IndexNowHistoryEntry[];
  reason?: string;
}

function inferGameFromUrl(url: string): Game | null {
  try {
    const pathname = new URL(url).pathname;
    if (pathname.includes('connections')) return 'connections';
    if (pathname.includes('wordle')) return 'wordle';
    if (pathname.includes('spelling-bee')) return 'spelling-bee';
  } catch {
    return null;
  }
  return null;
}

function statusPathForGame(game: Game): string {
  return path.join(process.cwd(), 'src/data/generated', game, 'indexnow-status.json');
}

function readPreviousStatus(game: Game): IndexNowStatusFile | null {
  const filePath = statusPathForGame(game);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as IndexNowStatusFile;
  } catch {
    console.warn(`[indexnow] could not parse previous status for ${game}; resetting history`);
    return null;
  }
}

function emptyEndpointResults(reason: string): Record<EndpointName, EndpointResult> {
  return Object.fromEntries(
    Object.entries(INDEXNOW_ENDPOINTS).map(([endpoint, url]) => [
      endpoint,
      { endpoint: endpoint as EndpointName, url, status: null, ok: false, error: reason },
    ]),
  ) as Record<EndpointName, EndpointResult>;
}

function overallFromResults(results: Record<EndpointName, EndpointResult>): OverallStatus {
  const values = Object.values(results);
  const okCount = values.filter((result) => result.ok).length;
  if (okCount === values.length) return 'OK';
  if (okCount > 0) return 'PARTIAL';
  return 'FAILED';
}

function writeIndexNowStatus(
  game: Game,
  overall: OverallStatus,
  endpoints: Record<EndpointName, EndpointResult>,
  submittedUrls: string[],
  reason?: string,
): void {
  const previous = readPreviousStatus(game);
  const timestamp = new Date().toISOString();
  const previousEndpointFailures: Partial<Record<EndpointName, number>> =
    previous?.endpointConsecutiveFailures ?? {};
  const endpointConsecutiveFailures = Object.fromEntries(
    Object.entries(endpoints).map(([endpoint, result]) => [
      endpoint,
      result.ok ? 0 : (previousEndpointFailures[endpoint as EndpointName] ?? 0) + 1,
    ]),
  ) as Record<EndpointName, number>;

  const entry: IndexNowHistoryEntry = { timestamp, overall, submittedUrls, endpoints, reason };
  const history = [...(previous?.history ?? []), entry].slice(-30);
  const status: IndexNowStatusFile = {
    timestamp,
    updatedAt: timestamp,
    game,
    overall,
    submittedUrls,
    endpoints,
    consecutiveFailures: overall === 'OK' ? 0 : (previous?.consecutiveFailures ?? 0) + 1,
    endpointConsecutiveFailures,
    history,
    reason,
  };

  const filePath = statusPathForGame(game);
  atomicWrite(filePath, status);
  console.log(`[indexnow] wrote ${filePath} (${overall})`);
}

async function pollForFreshContent(opts: PollOptions): Promise<boolean> {
  const { url, token, timeoutSeconds = 600, intervalSeconds = 15 } = opts;
  const deadline = Date.now() + timeoutSeconds * 1000;

  while (Date.now() < deadline) {
    try {
      const cacheBuster = `_t=${Date.now()}`;
      const sep = url.includes('?') ? '&' : '?';
      const fetchUrl = `${url}${sep}${cacheBuster}`;
      const res = await plainFetch(fetchUrl, {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
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

async function submitToEndpoint(
  endpoint: EndpointName,
  url: string,
  key: string,
  verifiedUrls: string[],
): Promise<[EndpointName, EndpointResult]> {
  const payload = {
    host: INDEXNOW_HOST,
    key,
    keyLocation: `https://${INDEXNOW_HOST}/${key}.txt`,
    urlList: verifiedUrls,
  };

  try {
    const res = await plainFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    const result: EndpointResult = {
      endpoint,
      url,
      status: res.status,
      ok: res.status === 200 || res.status === 202,
      body: body ? trim(body) : undefined,
    };
    if (result.ok) {
      console.log(`[indexnow] ${endpoint} submitted ${verifiedUrls.length} URL(s) - HTTP ${res.status}`);
    } else {
      console.error(`[indexnow] ${endpoint} submitted ${verifiedUrls.length} URL(s) - HTTP ${res.status}`);
    }
    return [endpoint, result];
  } catch (err) {
    const result: EndpointResult = {
      endpoint,
      url,
      status: null,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    console.error(`[indexnow] ${endpoint} submission error: ${result.error}`);
    return [endpoint, result];
  }
}

async function submitToEndpoints(
  key: string,
  verifiedUrls: string[],
): Promise<Record<EndpointName, EndpointResult>> {
  const entries = await Promise.all(
    Object.entries(INDEXNOW_ENDPOINTS).map(([endpoint, url]) => (
      submitToEndpoint(endpoint as EndpointName, url, key, verifiedUrls)
    )),
  );
  return Object.fromEntries(entries) as Record<EndpointName, EndpointResult>;
}

export async function submitToIndexNow(submissions: IndexNowSubmission[]): Promise<void> {
  const touchedGames = Array.from(
    new Set(submissions.map((sub) => inferGameFromUrl(sub.url)).filter(Boolean)),
  ) as Game[];

  const key = process.env.INDEXNOW_KEY;
  if (!key || key.length < 8) {
    console.warn('[indexnow] INDEXNOW_KEY missing or too short - skipping submission.');
    for (const game of touchedGames) {
      writeIndexNowStatus(
        game,
        'NOT_ATTEMPTED',
        emptyEndpointResults('INDEXNOW_KEY missing or too short'),
        [],
        'INDEXNOW_KEY missing or too short',
      );
    }
    return;
  }

  const verifiedUrls: string[] = [];
  const verifiedGames = new Set<Game>();
  for (const sub of submissions) {
    const game = inferGameFromUrl(sub.url);
    if (sub.freshToken) {
      const fresh = await pollForFreshContent({ url: sub.url, token: sub.freshToken });
      if (!fresh) {
        console.warn(`[indexnow] skipping ${sub.url} - could not verify fresh content`);
        continue;
      }
    }
    verifiedUrls.push(sub.url);
    if (game) verifiedGames.add(game);
  }

  if (verifiedUrls.length === 0) {
    console.warn('[indexnow] no URLs verified fresh - nothing to submit');
    for (const game of touchedGames) {
      writeIndexNowStatus(
        game,
        'NOT_ATTEMPTED',
        emptyEndpointResults('No URLs verified fresh'),
        [],
        'No URLs verified fresh',
      );
    }
    return;
  }

  for (const game of touchedGames.filter((game) => !verifiedGames.has(game))) {
    writeIndexNowStatus(
      game,
      'NOT_ATTEMPTED',
      emptyEndpointResults('Game URL did not verify fresh'),
      [],
      'Game URL did not verify fresh',
    );
  }

  const endpointResults = await submitToEndpoints(key, verifiedUrls);
  const overall = overallFromResults(endpointResults);
  for (const game of verifiedGames) {
    writeIndexNowStatus(game, overall, endpointResults, verifiedUrls);
  }

  if (overall === 'OK') {
    console.log(`[indexnow] submitted ${verifiedUrls.length} URL(s) to all endpoints`);
  } else {
    console.error(`[indexnow] submission completed with ${overall}`);
  }
}

function trim(value: string): string {
  return value.length > 500 ? `${value.slice(0, 500)}...` : value;
}
