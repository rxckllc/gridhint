# 03 — Anagram / Jumble / Letter Rearrangement Game Spec

# Shared DailyGridHelp Build Foundation

Use this foundation for every game in this ZIP unless a game-specific section overrides it.

## Product architecture

DailyGridHelp is a static-first word-game / lexical-utility site.

Core stack:
- Next.js 15 App Router
- TypeScript strict mode
- `output: 'export'`
- Tailwind CSS
- shadcn/ui copy-paste components where helpful
- Lucide icons only when they add clarity
- Hostinger for static hosting
- GitHub as source of truth
- Google Cloud VM as the build, generation, cron, and artifact engine
- SQLite or Postgres on the VM for normalized source tables
- Static JSON artifacts committed back to GitHub before Hostinger builds
- Web Workers for any client computation that can stall interaction
- Static routes generated through `generateStaticParams()`

Do not design this as a request-time Node app. Static export means no ISR, no request-time route handlers, no cookies-dependent rendering, no runtime dynamic routes, and no server rewrites.

## Minimal Next config

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
```

## Shared repository structure

```text
daily-grid-help/
  app/
    layout.tsx
    page.tsx
    robots.ts
    sitemap.ts
    word-games/
      page.tsx
      connections/
      wordle/
      anagram-jumble/
      crossword/
      spelling-bee/
      hangman/
      word-ladder/
    word-tools/
      word-finder/
      letter-frequency/
      ngram-analyzer/
  components/
    word-games/
    word-tools/
    seo/
  lib/
    words/
    puzzles/
    seo/
  workers/
  data/
    words/
    generated/
    indexes/
  scripts/
    import-lexicon.ts
    generate-routes.ts
    generate-sitemap.ts
    submit-indexnow.ts
    commit-generated-data.ts
    update-daily-puzzles.ts
  sql/
    schema.sql
```

## Shared dictionary strategy

Build a layered lexicon instead of relying on one list.

Recommended layers:
1. SCOWL / ESDB as the open core lexicon.
2. ENABLE2K / ENABLE word list as a game-friendly permissive overlay.
3. wordfreq Zipf ranking for commonness and ordering.
4. Peter Norvig `count_1w` as fallback count ranking.
5. Optional Wordnik open wordlist for playable words.
6. Optional Wordnik Game Developer’s Dataset if you need licensed offline definitions, labels, root forms, or parts of speech.

Do not build a cached local dictionary from live Wordnik API responses. If Wordnik API is used, treat it as display-time enrichment only.

## Shared word record

```json
{
  "$schema": "https://dailygridhelp.com/schemas/word-entry.schema.json",
  "id": 182731,
  "word": "stare",
  "len": 5,
  "sig": "aerst",
  "mask": 524577,
  "counts": [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
  "freqZipf": 4.91,
  "norvigCount": 192834,
  "flags": {
    "common": true,
    "wordleAnswer": false,
    "wordleGuess": true,
    "offensive": false
  },
  "sources": ["scowl", "enable2k", "wordfreq"]
}
```

## Shared generated artifacts

```text
data/words/all-words.json
data/words/words-by-length.json
data/words/freq-rank.json
data/words/signature-map/shard-a.json
data/words/signature-map/shard-b.json
data/indexes/pattern/len-5.json
data/indexes/five-letter/contains-a.json
data/generated/route-manifest.json
data/generated/sitemap-index.json
```

## VM deployment flow

```text
Google VM cron jobs
  -> Normalize word lists and daily puzzle drafts
  -> Human review queue for sensitive daily puzzle pages
  -> Generate JSON artifacts, route manifests, and sitemaps
  -> git commit && git push
  -> GitHub repository
  -> Hostinger webhook / auto deploy
  -> Static build and publish
  -> Live HTML, JSON, robots.txt, sitemap index
  -> IndexNow submission
```

## Shared SQL tables

```sql
create table words (
  id bigserial primary key,
  word text not null unique,
  len smallint not null,
  sig text not null,
  mask integer not null,
  counts smallint[] not null,
  freq_zipf real,
  norvig_count bigint,
  flags jsonb not null default '{}',
  sources text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create index words_len_idx on words(len);
create index words_sig_idx on words(sig);
create index words_mask_idx on words(mask);
create index words_freq_idx on words(freq_zipf desc nulls last);

create table generated_routes (
  id bigserial primary key,
  game text not null,
  route text not null unique,
  params jsonb not null default '{}',
  indexable boolean not null default true,
  priority real not null default 0.5,
  result_count integer,
  updated_at timestamptz not null default now()
);
```

## Shared SEO rules

Use separate routes for distinct search intent, but keep the product architecture grouped by real game.

Every game page needs:
- `<h1>` immediately explaining the tool
- interactive utility above the fold
- 1 short explanatory paragraph under the tool
- internal links to related modes
- JSON-LD: `SoftwareApplication` or `WebApplication`
- `BreadcrumbList`
- `FAQPage` only where there are real visible FAQs
- canonical tags
- noindex for empty, thin, or generated pages with weak result sets
- sitemap segmentation when programmatic route count grows

## Shared performance rules

- Main interactive area should render quickly from static HTML.
- Move entropy, large filtering, graph search, phrase anagram search, and clue ranking into Web Workers.
- Use typed arrays or transferable ArrayBuffers when payloads become large.
- Avoid shipping the entire dictionary to every page.
- Shard JSON by length, signature, route, or game.
- Target:
  - LCP under 2.5 seconds, internal goal 1.5 seconds.
  - INP under 200 ms, internal goal near zero for simple tools.
  - CLS near zero.
  - Worker computation under 300 ms for common queries.

## Shared legal / IP posture

For publisher-adjacent daily games:
- no publisher logos
- no “official” claim
- no cloned UI
- no raw scraped HTML in the repo
- no full playable archive clone
- use normalized hints, solver outputs, or user-entered inputs
- maintain manual review before publishing daily answer pages
- be ready to remove archive pages if challenged

For open lexical utilities:
- keep source attributions in build docs
- avoid offensive word surfacing by default unless user opts into broad dictionary mode
- include disclaimer that results are word-game help, not official puzzle answers unless manually reviewed


# Game identity

This game covers every user task where the user enters letters or a word and wants valid rearrangements.

This is one distinct game, not separate games for each keyword variation.

## Modes inside this game

All of these belong inside this game:
- Unscramble letters
- Word descrambler
- Word scrambler
- Anagram solver
- Jumble solver
- Exact anagram
- Partial word finder
- Use all letters
- Use some letters
- Scramble a word
- Optional phrase anagrams

## Why they are one game

The core user action is letter rearrangement.

The shared engine:
- normalizes letters
- creates sorted-letter signatures
- uses letter counts
- uses length buckets
- filters by starts/ends/contains/excludes if needed
- sorts results by commonness, length, and alphabetically

Word Scrambler adds Fisher-Yates shuffle, but the default high-intent flow still uses the same unscramble engine.

## Primary routes

```text
/app/word-games/anagram-jumble/page.tsx
/app/word-games/anagram-jumble/unscramble/page.tsx
/app/word-games/anagram-jumble/unscramble/[letters]/page.tsx
/app/word-games/anagram-jumble/word-descrambler/page.tsx
/app/word-games/anagram-jumble/word-scrambler/page.tsx
/app/word-games/anagram-jumble/anagram-solver/page.tsx
/app/word-games/anagram-jumble/jumble-solver/page.tsx

/components/word-games/anagram/LetterInput.tsx
/components/word-games/anagram/AnagramTabs.tsx
/components/word-games/anagram/ResultsByLength.tsx
/components/word-games/anagram/ScrambleWordPanel.tsx

/lib/words/signature.ts
/lib/words/unscramble.ts
/lib/words/anagram.ts
/lib/words/scramble.ts
/workers/unscramble.worker.ts
/workers/anagram.worker.ts

/scripts/import-words.ts
/scripts/generate-unscramble-routes.ts
/data/words/all-words.json
/data/words/sorted-letter-map.json
/data/words/words-by-length.json
/data/generated/route-manifest-unscramble.json
```

Recommended public URLs:

```text
/word-games/anagram-jumble/
/word-games/anagram-jumble/unscramble/
/word-games/anagram-jumble/unscramble/sbitmu/
/word-games/anagram-jumble/word-descrambler/
/word-games/anagram-jumble/word-scrambler/
/word-games/anagram-jumble/anagram-solver/
/word-games/anagram-jumble/jumble-solver/
```

## Page design

Use one product UI with tabs.

```text
H1: Unscramble Letters / Anagram Solver / Word Scrambler depending on route
Input: letters or word
Tabs:
  [Unscramble Letters]
  [Exact Anagrams]
  [Partial Words]
  [Scramble a Word]
  [Jumble Solver]
Filters:
  min length
  max length
  use all letters only
  starts with
  ends with
  contains
  excludes
  common words only
Results:
  Exact anagrams
  7-letter words
  6-letter words
  5-letter words
  4-letter words
  3-letter words
Related searches
```

Each SEO route can use the same component with different defaults:
- `word-descrambler`: min length defaults to 3, results longest first.
- `unscramble`: min length defaults to 2, broader output.
- `anagram-solver`: exact anagrams first.
- `word-scrambler`: show “Scramble a Word” tab, but keep unscramble option visible.
- `jumble-solver`: beginner-friendly copy and exact/partial toggle.

## Core data preprocessing

```ts
// scripts/import-words.ts
import fs from 'node:fs';

const ENABLE_URL = 'https://raw.githubusercontent.com/rressler/data_raw_courses/main/enable1_words.txt';

function signature(word: string): string {
  return [...word].sort().join('');
}

function mask(word: string): number {
  let m = 0;
  for (const ch of word) m |= 1 << (ch.charCodeAt(0) - 97);
  return m;
}

function counts(word: string): number[] {
  const out = Array(26).fill(0);
  for (const ch of word) out[ch.charCodeAt(0) - 97]++;
  return out;
}

async function main() {
  const txt = await (await fetch(ENABLE_URL)).text();
  const words = txt
    .split('\n')
    .map(w => w.trim().toLowerCase())
    .filter(w => /^[a-z]+$/.test(w) && w.length >= 2 && w.length <= 15);

  const sortedMap: Record<string, string[]> = {};
  const byLength: Record<string, string[]> = {};
  const records = words.map((word, id) => {
    const sig = signature(word);
    (sortedMap[sig] ??= []).push(word);
    (byLength[word.length] ??= []).push(word);

    return {
      id,
      word,
      len: word.length,
      sig,
      mask: mask(word),
      counts: counts(word)
    };
  });

  fs.mkdirSync('data/words', { recursive: true });
  fs.writeFileSync('data/words/all-words.json', JSON.stringify(records));
  fs.writeFileSync('data/words/sorted-letter-map.json', JSON.stringify(sortedMap));
  fs.writeFileSync('data/words/words-by-length.json', JSON.stringify(byLength));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
```

## Signature map algorithm

Exact anagrams:

```text
sig(word) = sort(chars(word))
```

Example:
```text
stare -> aerst
tears -> aerst
rates -> aerst
```

Lookup:
```text
query letters -> sort -> map lookup -> exact anagrams
```

Complexity:
```text
O(k log k) to sort query
O(1) hash lookup
```

```ts
// lib/words/signature.ts
export function normalizeLetters(input: string): string {
  return input.toLowerCase().replace(/[^a-z]/g, '');
}

export function signature(input: string): string {
  return [...normalizeLetters(input)].sort().join('');
}

export function letterCounts(input: string): Uint8Array {
  const out = new Uint8Array(26);
  for (const ch of normalizeLetters(input)) {
    out[ch.charCodeAt(0) - 97]++;
  }
  return out;
}

export function letterMask(input: string): number {
  let m = 0;
  for (const ch of normalizeLetters(input)) {
    m |= 1 << (ch.charCodeAt(0) - 97);
  }
  return m;
}

export function multisetSubset(wordCounts: ArrayLike<number>, queryCounts: ArrayLike<number>) {
  for (let i = 0; i < 26; i++) {
    if (wordCounts[i] > queryCounts[i]) return false;
  }
  return true;
}
```

## Partial unscramble algorithm

A result word is valid when every letter count in the result is less than or equal to the input count.

```text
counts_query[i] >= counts_word[i] for all i in a-z
```

Use fast rejection first:
```text
(wordMask & ~queryMask) === 0
```

Then exact count check.

```ts
// lib/words/unscramble.ts
import records from '@/data/words/all-words.json';
import sortedMap from '@/data/words/sorted-letter-map.json';
import { letterCounts, letterMask, multisetSubset, signature } from './signature';

type WordRecord = {
  word: string;
  len: number;
  sig: string;
  mask: number;
  counts: number[];
  freqZipf?: number;
};

export type UnscrambleOptions = {
  minLength?: number;
  maxLength?: number;
  exactOnly?: boolean;
  useAllLetters?: boolean;
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  excludes?: string;
  commonOnly?: boolean;
};

function passesTextFilters(word: string, opts: UnscrambleOptions) {
  if (opts.startsWith && !word.startsWith(opts.startsWith.toLowerCase())) return false;
  if (opts.endsWith && !word.endsWith(opts.endsWith.toLowerCase())) return false;
  if (opts.contains && !opts.contains.toLowerCase().split('').every(c => word.includes(c))) return false;
  if (opts.excludes && opts.excludes.toLowerCase().split('').some(c => word.includes(c))) return false;
  return true;
}

export function exactAnagrams(input: string): string[] {
  const sig = signature(input);
  return ((sortedMap as Record<string, string[]>)[sig] ?? []).filter(w => w !== input);
}

export function unscramble(input: string, opts: UnscrambleOptions = {}) {
  const letters = input.toLowerCase().replace(/[^a-z]/g, '');
  const minLength = opts.minLength ?? 2;
  const maxLength = opts.maxLength ?? letters.length;
  const queryMask = letterMask(letters);
  const queryCounts = letterCounts(letters);

  let candidates: WordRecord[];

  if (opts.exactOnly || opts.useAllLetters) {
    const exact = exactAnagrams(letters);
    candidates = (records as WordRecord[]).filter(r => exact.includes(r.word));
  } else {
    candidates = (records as WordRecord[]).filter(r => {
      if (r.len < minLength || r.len > maxLength) return false;
      if ((r.mask & ~queryMask) !== 0) return false;
      if (!multisetSubset(r.counts, queryCounts)) return false;
      return true;
    });
  }

  const filtered = candidates
    .filter(r => passesTextFilters(r.word, opts))
    .sort((a, b) =>
      (b.freqZipf ?? 0) - (a.freqZipf ?? 0) ||
      b.len - a.len ||
      a.word.localeCompare(b.word)
    );

  const byLength = new Map<number, string[]>();
  for (const row of filtered) {
    if (!byLength.has(row.len)) byLength.set(row.len, []);
    byLength.get(row.len)!.push(row.word);
  }

  return [...byLength.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([length, words]) => ({ length, words }));
}
```

## Word scrambler mode

Use Fisher-Yates shuffle.

```ts
// lib/words/scramble.ts
export function scrambleWord(word: string, options: { derangement?: boolean } = {}) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  const chars = clean.split('');

  if (chars.length <= 1) return clean;

  for (let attempt = 0; attempt < 100; attempt++) {
    const shuffled = [...chars];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    if (!options.derangement) return shuffled.join('');
    if (shuffled.every((ch, index) => ch !== chars[index])) return shuffled.join('');
  }

  return chars.reverse().join('');
}

export function scrambleMany(word: string, count = 10, derangement = false) {
  const out = new Set<string>();
  while (out.size < count && out.size < 100) {
    out.add(scrambleWord(word, { derangement }));
  }
  return [...out];
}
```

## Phrase anagram mode

Keep phrase anagrams out of MVP if latency matters. Add later using a separate Worker.

Strategy:
1. Normalize phrase.
2. Compute total letter counts.
3. Generate candidate words whose counts fit phrase.
4. DFS/backtracking to assemble multi-word combinations.
5. Hard cap:
   - max candidates
   - max depth
   - max results
   - max time budget

```ts
// lib/words/anagram.ts
import { letterCounts, multisetSubset } from './signature';

export function phraseAnagramSearch(
  phrase: string,
  candidateWords: string[],
  options = { maxDepth: 3, maxResults: 100, maxMs: 500 }
) {
  const started = performance.now();
  const targetCounts = letterCounts(phrase);
  const results: string[][] = [];

  function dfs(remaining: Uint8Array, startIndex: number, path: string[]) {
    if (performance.now() - started > options.maxMs) return;
    if (results.length >= options.maxResults) return;
    if (path.length > options.maxDepth) return;

    const empty = [...remaining].every(n => n === 0);
    if (empty) {
      results.push([...path]);
      return;
    }

    for (let i = startIndex; i < candidateWords.length; i++) {
      const word = candidateWords[i];
      const counts = letterCounts(word);
      if (!multisetSubset(counts, remaining)) continue;

      const next = new Uint8Array(remaining);
      for (let j = 0; j < 26; j++) next[j] -= counts[j];

      path.push(word);
      dfs(next, i, path);
      path.pop();
    }
  }

  dfs(targetCounts, 0, []);
  return results;
}
```

## Web Worker

Use Worker for large partial solves and phrase anagrams.

```ts
// workers/unscramble.worker.ts
/// <reference lib="webworker" />
import { unscramble } from '@/lib/words/unscramble';
import { scrambleMany } from '@/lib/words/scramble';

self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === 'unscramble') {
    self.postMessage({
      type: 'unscramble:result',
      payload: unscramble(payload.letters, payload.options)
    });
  }

  if (type === 'scramble') {
    self.postMessage({
      type: 'scramble:result',
      payload: scrambleMany(payload.word, payload.count, payload.derangement)
    });
  }
};
```

## Programmatic route generation

Static export requires all indexable letter pages up front.

Phased rollout:
- Phase 1: 10k–50k high-value pages
- Phase 2: 250k if indexing is healthy
- Phase 3: 500k only after performance and crawl review

```ts
// scripts/generate-unscramble-routes.ts
import fs from 'node:fs';
import { unscramble } from '../lib/words/unscramble';

const COMMON_LETTERS = 'etaoinsrhldcumfpgwybvkxjqz';

function* combos(pool: string, len: number, prefix = '', start = 0): Generator<string> {
  if (prefix.length === len) {
    yield prefix;
    return;
  }

  for (let i = start; i < pool.length; i++) {
    yield* combos(pool, len, prefix + pool[i], i);
  }
}

const routes = [];

for (let len = 3; len <= 7; len++) {
  for (const letters of combos(COMMON_LETTERS, len)) {
    const groups = unscramble(letters, { minLength: 3 });
    const resultCount = groups.reduce((sum, g) => sum + g.words.length, 0);
    if (resultCount < 5) continue;

    routes.push({
      slug: letters,
      canonical: `/word-games/anagram-jumble/unscramble/${letters}/`,
      index: true,
      resultsCount: resultCount,
      priority: Math.min(1, resultCount / 100)
    });

    if (routes.length >= 50000) break;
  }
  if (routes.length >= 50000) break;
}

fs.writeFileSync(
  'data/generated/route-manifest-unscramble.json',
  JSON.stringify(routes, null, 2)
);
```

## Dynamic static page

```tsx
// app/word-games/anagram-jumble/unscramble/[letters]/page.tsx
import routes from '@/data/generated/route-manifest-unscramble.json';
import { unscramble } from '@/lib/words/unscramble';
import ResultsByLength from '@/components/word-games/anagram/ResultsByLength';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return routes.map((route: any) => ({ letters: route.slug }));
}

export async function generateMetadata({ params }: { params: { letters: string } }) {
  const letters = params.letters.toUpperCase();
  const groups = unscramble(params.letters, { minLength: 3 });
  const total = groups.reduce((sum, group) => sum + group.words.length, 0);

  return {
    title: `Unscramble ${letters} | Words Made From ${letters}`,
    description: `Unscramble ${letters} into valid words, grouped by length with exact anagrams and common word suggestions.`,
    robots: {
      index: total >= 5,
      follow: true
    }
  };
}

export default function Page({ params }: { params: { letters: string } }) {
  if (!/^[a-z]{2,15}$/.test(params.letters)) notFound();

  const groups = unscramble(params.letters, { minLength: 3 });
  const total = groups.reduce((sum, group) => sum + group.words.length, 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-3xl font-semibold">Unscramble {params.letters.toUpperCase()}</h1>
      <p className="mt-2 text-slate-600">
        {total} words found from the letters {params.letters.toUpperCase()}.
      </p>
      <ResultsByLength groups={groups} />
    </main>
  );
}
```

## SEO metadata by route

Unscramble:
```ts
title: 'Unscramble Letters | Find Words From Scrambled Letters'
description: 'Enter letters to find every valid word, grouped by length with exact anagrams and common word suggestions.'
```

Word Descrambler:
```ts
title: 'Word Descrambler | Decode Scrambled Letters Into Words'
description: 'Paste scrambled letters and find possible words instantly. Results are grouped by length with exact and partial matches.'
```

Word Scrambler:
```ts
title: 'Word Scrambler | Scramble Words or Unscramble Letters'
description: 'Scramble a word for practice or enter letters to find valid words and anagrams.'
```

Anagram Solver:
```ts
title: 'Anagram Solver | Find Exact and Partial Anagrams'
description: 'Find exact anagrams, partial anagrams, and words made from your letters.'
```

Jumble Solver:
```ts
title: 'Jumble Solver | Solve Jumbled Letters'
description: 'Enter jumbled letters to find possible answers, common words, and exact anagrams.'
```

## FAQ ideas

1. What is the difference between unscramble and anagram?
2. Does the tool use all letters?
3. Can I find words using only some letters?
4. Can I scramble a word instead of solving one?
5. Why are some obscure words shown?
6. Can I filter by word length?
7. How are results ranked?

## JSON-LD

Use `SoftwareApplication` and `ItemList` on result pages.

```ts
export function anagramJsonLd(name: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Web',
        description,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dailygridhelp.com/' },
          { '@type': 'ListItem', position: 2, name: 'Word Games', item: 'https://dailygridhelp.com/word-games/' },
          { '@type': 'ListItem', position: 3, name: 'Anagram & Jumble', item: 'https://dailygridhelp.com/word-games/anagram-jumble/' }
        ]
      }
    ]
  };
}
```

## Tests

```ts
import { describe, expect, it } from 'vitest';
import { signature, letterCounts, multisetSubset } from '@/lib/words/signature';
import { scrambleWord } from '@/lib/words/scramble';

describe('signature', () => {
  it('matches anagrams', () => {
    expect(signature('stare')).toBe(signature('tears'));
  });
});

describe('multiset subset', () => {
  it('rejects words requiring too many copies', () => {
    expect(multisetSubset(letterCounts('letter'), letterCounts('later'))).toBe(false);
  });
});

describe('scramble', () => {
  it('preserves letters', () => {
    expect(signature(scrambleWord('planet'))).toBe(signature('planet'));
  });
});
```

Checklist:
- normalize spaces and punctuation
- duplicate letters
- exact-only toggle
- use-all-letters toggle
- partial mode
- max 15 letters
- no results
- offensive words hidden by default
- route manifest excludes thin pages
- generated pages use canonical
- Word Scrambler derangement fallback

## Acceptance criteria

- One shared component powers all route variations.
- Exact anagrams and partial words are correct with duplicate letters.
- Programmatic pages are static and route-manifest driven.
- Thin generated pages are noindexed.
- Word Scrambler tab works without changing the core game taxonomy.
- Worker is used for large inputs.
