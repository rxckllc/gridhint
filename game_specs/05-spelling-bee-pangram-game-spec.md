# 05 — Spelling Bee / Pangram Game Spec

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

Spelling Bee / Pangram is a 7-letter hive word-building game. The user has one required center letter and six outer letters. Valid words must contain the center letter and use only letters from the hive.

This is distinct from Anagram/Jumble because letters can usually be reused, while anagram letters are limited by count.

## Modes inside this game

All of these belong inside this game:
- Spelling Bee helper
- Spelling Bee solver
- Pangram finder
- 7-letter hive helper
- Center-letter word finder
- Words using these 7 letters
- Pangrams only
- Hide answers / hint mode

## Primary routes

```text
/app/word-games/spelling-bee/page.tsx
/app/word-games/spelling-bee/helper/page.tsx
/app/word-games/spelling-bee/pangram-finder/page.tsx
/app/word-games/spelling-bee/[letters]/page.tsx

/components/word-games/spelling-bee/HiveInput.tsx
/components/word-games/spelling-bee/SpellingBeeResults.tsx
/components/word-games/spelling-bee/PangramPanel.tsx

/lib/words/spelling-bee.ts
/workers/spelling-bee.worker.ts

/data/words/spelling-bee-valid.json
/data/words/words-by-length.json
/data/generated/route-manifest-spelling-bee.json
```

Recommended public URLs:

```text
/word-games/spelling-bee/
/word-games/spelling-bee/helper/
/word-games/spelling-bee/pangram-finder/
/word-games/spelling-bee/a-c-t-r-e-s-l/
```

## User input

```ts
type SpellingBeeInput = {
  center: string;       // required single a-z letter
  outer: string[];      // exactly six unique a-z letters
  minLength?: number;   // default 4
  pangramsOnly?: boolean;
  commonOnly?: boolean;
  hideAnswers?: boolean;
};
```

Validation:
- center must be one letter
- outer must contain six unique letters
- center cannot repeat in outer
- total unique letters must be 7
- min length defaults to 4
- all input lowercased a-z

## Output

```ts
type SpellingBeeResult = {
  letters: string[];
  center: string;
  totalWords: number;
  pangrams: string[];
  wordsByLength: Array<{ length: number; words: string[] }>;
  scoreEstimate?: number;
  warnings: string[];
};
```

## Core bitmask algorithm

Every word gets a 26-bit letter mask.

```ts
// lib/words/spelling-bee.ts
import words from '@/data/words/spelling-bee-valid.json';

type WordRecord = {
  word: string;
  len: number;
  mask: number;
  freqZipf?: number;
};

export function letterMask(input: string): number {
  let mask = 0;
  for (const ch of input.toLowerCase().replace(/[^a-z]/g, '')) {
    mask |= 1 << (ch.charCodeAt(0) - 97);
  }
  return mask;
}

export function hasLetter(word: string, letter: string): boolean {
  return word.includes(letter);
}

export function isPangram(wordMask: number, allowedMask: number): boolean {
  return (wordMask & allowedMask) === allowedMask;
}

export function solveSpellingBee(input: {
  center: string;
  outer: string[];
  minLength?: number;
  pangramsOnly?: boolean;
  commonOnly?: boolean;
}) {
  const center = input.center.toLowerCase();
  const outer = input.outer.map(x => x.toLowerCase());
  const allLetters = [center, ...outer].join('');
  const allowedMask = letterMask(allLetters);
  const minLength = input.minLength ?? 4;

  const matches = (words as WordRecord[])
    .filter(row => row.len >= minLength)
    .filter(row => (row.mask & ~allowedMask) === 0)
    .filter(row => row.word.includes(center))
    .filter(row => input.pangramsOnly ? isPangram(row.mask, allowedMask) : true)
    .filter(row => input.commonOnly ? (row.freqZipf ?? 0) >= 3.5 : true)
    .sort((a, b) =>
      Number(isPangram(b.mask, allowedMask)) - Number(isPangram(a.mask, allowedMask)) ||
      b.len - a.len ||
      (b.freqZipf ?? 0) - (a.freqZipf ?? 0) ||
      a.word.localeCompare(b.word)
    );

  const pangrams = matches
    .filter(row => isPangram(row.mask, allowedMask))
    .map(row => row.word);

  const byLength = new Map<number, string[]>();
  for (const row of matches) {
    if (!byLength.has(row.len)) byLength.set(row.len, []);
    byLength.get(row.len)!.push(row.word);
  }

  return {
    letters: [...allLetters],
    center,
    totalWords: matches.length,
    pangrams,
    wordsByLength: [...byLength.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([length, words]) => ({ length, words })),
    warnings: []
  };
}
```

Complexity:
```text
O(N) over length-filtered word list
Each candidate check is constant-time bitmask + center-letter string check
```

## Dictionary preprocessing

Spelling Bee should use a filtered dictionary:
- lowercase a-z only
- length >= 4
- no hyphens/apostrophes
- optional “common” flag
- optional offensive-word filtering
- no need for exact letter counts because letters may repeat

```ts
// scripts/generate-spelling-bee-valid.ts
import fs from 'node:fs';
import allWords from '../data/words/all-words.json';

function mask(word: string) {
  let out = 0;
  for (const ch of word) out |= 1 << (ch.charCodeAt(0) - 97);
  return out;
}

const valid = (allWords as any[])
  .filter(row => row.word.length >= 4)
  .filter(row => /^[a-z]+$/.test(row.word))
  .map(row => ({
    word: row.word,
    len: row.word.length,
    mask: mask(row.word),
    freqZipf: row.freqZipf,
    flags: row.flags
  }));

fs.writeFileSync('data/words/spelling-bee-valid.json', JSON.stringify(valid));
```

## Hint mode

Some users do not want full answers. Add a toggle:

```text
[Show Hints Only]
```

Hint mode output:
- count by length
- first letter distribution
- pangram count
- optionally first two letters
- hide full word list until user clicks reveal

```ts
export function summarizeHints(words: string[], pangrams: string[]) {
  const byLength: Record<number, number> = {};
  const byFirstLetter: Record<string, number> = {};

  for (const word of words) {
    byLength[word.length] = (byLength[word.length] ?? 0) + 1;
    byFirstLetter[word[0]] = (byFirstLetter[word[0]] ?? 0) + 1;
  }

  return {
    total: words.length,
    pangramCount: pangrams.length,
    byLength,
    byFirstLetter
  };
}
```

## Worker

```ts
// workers/spelling-bee.worker.ts
/// <reference lib="webworker" />

import { solveSpellingBee } from '@/lib/words/spelling-bee';

self.onmessage = (event) => {
  const { type, payload } = event.data;
  if (type === 'solve') {
    self.postMessage({
      type: 'result',
      payload: solveSpellingBee(payload)
    });
  }
};
```

This tool is fast enough without Worker on desktop, but Worker is still useful on mobile and keeps the architecture consistent.

## UI skeleton

```tsx
// app/word-games/spelling-bee/helper/page.tsx
import SpellingBeeHelper from '@/components/word-games/spelling-bee/SpellingBeeHelper';

export const metadata = {
  title: 'Spelling Bee Helper | Find Words and Pangrams',
  description: 'Enter a center letter and six outer letters to find valid words, pangrams, and hint counts for a 7-letter word game.',
  alternates: { canonical: '/word-games/spelling-bee/helper/' }
};

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-3xl font-semibold">Spelling Bee Helper</h1>
      <p className="mt-2 text-slate-600">
        Enter the center letter and six outer letters to find words and pangrams.
      </p>
      <SpellingBeeHelper />
    </main>
  );
}
```

UI layout:
```text
Center letter input: [ A ]
Outer letters: [ C ] [ T ] [ R ] [ E ] [ S ] [ L ]
Minimum length: [4]
Toggles:
  [Pangrams only]
  [Common words only]
  [Hide answers / hint mode]
Button: Find words
Results:
  Pangrams
  Total words
  Words by length
  First-letter hints
```

## Programmatic pages

Generate only high-quality pages:
- 7 unique letters
- result count above threshold
- at least 1 pangram if targeting pangram route
- noindex thin combinations

Slug format:
```text
/word-games/spelling-bee/a-c-t-r-e-s-l/
```

Route manifest:
```json
{
  "slug": "a-c-t-r-e-s-l",
  "center": "a",
  "outer": ["c", "t", "r", "e", "s", "l"],
  "canonical": "/word-games/spelling-bee/a-c-t-r-e-s-l/",
  "index": true,
  "resultsCount": 94,
  "pangramCount": 3
}
```

## SEO metadata

Helper:
```ts
title: 'Spelling Bee Helper | Find Words and Pangrams'
description: 'Enter a center letter and six outer letters to find valid words, pangrams, and hint counts.'
```

Pangram finder:
```ts
title: 'Pangram Finder | Find Words Using All 7 Letters'
description: 'Find pangrams and words that use a required center letter plus six outer letters.'
```

Generated page:
```ts
title: 'Words Using {letters} with Center {center} | Spelling Bee Helper'
description: 'Find words and pangrams using the letters {letters}, with {center} as the required center letter.'
```

FAQ ideas:
1. What is a pangram?
2. Does the center letter have to appear in every word?
3. Can letters be reused?
4. Why are some words missing?
5. Can I hide answers and only see hints?

## JSON-LD

Use `SoftwareApplication`, `BreadcrumbList`, and optional `ItemList`.

```ts
export const spellingBeeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Spelling Bee Helper',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web',
      description: 'A 7-letter word game helper for finding valid words and pangrams.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dailygridhelp.com/' },
        { '@type': 'ListItem', position: 2, name: 'Word Games', item: 'https://dailygridhelp.com/word-games/' },
        { '@type': 'ListItem', position: 3, name: 'Spelling Bee', item: 'https://dailygridhelp.com/word-games/spelling-bee/' }
      ]
    }
  ]
};
```

## Tests

```ts
import { describe, expect, it } from 'vitest';
import { isPangram, letterMask, solveSpellingBee } from '@/lib/words/spelling-bee';

describe('spelling bee masks', () => {
  it('detects pangram by full mask', () => {
    const mask = letterMask('abcdefg');
    expect(isPangram(letterMask('gfedcba'), mask)).toBe(true);
    expect(isPangram(letterMask('abcde'), mask)).toBe(false);
  });
});

describe('spelling bee solver', () => {
  it('requires the center letter', () => {
    const result = solveSpellingBee({
      center: 'a',
      outer: ['b', 'c', 'd', 'e', 'f', 'g']
    });

    for (const group of result.wordsByLength) {
      for (const word of group.words) {
        expect(word.includes('a')).toBe(true);
      }
    }
  });
});
```

Checklist:
- center letter required
- six unique outer letters
- no center/outer duplicate
- letters can be reused
- min length
- pangrams only
- common words only
- hint mode hides full answers
- no publisher branding
- generated page noindex logic

## Acceptance criteria

- Solver returns only words that contain center and use allowed letters.
- Pangram detection requires all 7 unique letters.
- Hint mode gives counts without revealing answers.
- No cloned publisher UI.
- Programmatic pages are generated only for strong combinations.
