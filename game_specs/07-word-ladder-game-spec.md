# 07 — Word Ladder Game Spec

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

Word Ladder is a pathfinding word game. The user enters a start word and an end word. The solver finds the shortest sequence where each step changes one letter and every intermediate word is valid.

This is distinct because it is graph search, not filtering, anagramming, semantic grouping, or entropy guessing.

## Modes inside this game

All of these belong inside Word Ladder:
- Word ladder solver
- Shortest word ladder
- Change-one-letter game
- Word transformation solver
- Word ladder answers
- Alternative ladders
- Beginner/hard mode

## Primary routes

```text
/app/word-games/word-ladder/page.tsx
/app/word-games/word-ladder/solver/page.tsx
/app/word-games/word-ladder/[start]/to/[end]/page.tsx

/components/word-games/word-ladder/WordLadderInput.tsx
/components/word-games/word-ladder/WordLadderPath.tsx
/components/word-games/word-ladder/AlternativePaths.tsx

/lib/words/word-ladder.ts
/workers/word-ladder.worker.ts
/scripts/generate-ladder-index.ts

/data/words/ladder-words-by-length.json
/data/indexes/word-ladder/wildcards-len-3.json
/data/indexes/word-ladder/wildcards-len-4.json
/data/indexes/word-ladder/wildcards-len-5.json
```

Recommended public URLs:

```text
/word-games/word-ladder/
/word-games/word-ladder/solver/
/word-games/word-ladder/cold/to/warm/
```

## User input

```ts
type WordLadderInput = {
  start: string;
  end: string;
  dictionaryMode?: 'common' | 'broad' | 'scrabble';
  maxDepth?: number;
  allowProperNouns?: false;
};
```

Validation:
- start and end must be same length
- lowercase a-z only
- length typically 3–7 for MVP
- both words must exist in chosen dictionary
- no spaces/hyphens
- reject huge lengths unless broad dictionary index exists

## Output

```ts
type WordLadderResult = {
  found: boolean;
  path: string[];
  steps: number;
  alternatives?: string[][];
  visitedCount: number;
  warnings: string[];
};
```

Example:
```text
cold -> cord -> word -> ward -> warm
```

## Graph model

Words are nodes. An edge exists when two words differ by exactly one letter.

Naive adjacency is expensive:
```text
O(N^2 * M)
```

Use wildcard intermediate states:
```text
cat -> *at, c*t, ca*
cot -> *ot, c*t, co*
cut -> *ut, c*t, cu*
```

Words sharing a wildcard bucket are neighbors.

Build complexity:
```text
O(N * M^2) depending on substring implementation
```

Lookup complexity:
```text
O(M * bucket size)
```

## Index generation

```ts
// scripts/generate-ladder-index.ts
import fs from 'node:fs';
import wordsByLength from '../data/words/words-by-length.json';

function wildcardPatterns(word: string) {
  const out: string[] = [];
  for (let i = 0; i < word.length; i++) {
    out.push(word.slice(0, i) + '*' + word.slice(i + 1));
  }
  return out;
}

for (const [len, words] of Object.entries(wordsByLength as Record<string, string[]>)) {
  const n = Number(len);
  if (n < 3 || n > 7) continue;

  const index: Record<string, string[]> = {};

  for (const word of words) {
    if (!/^[a-z]+$/.test(word)) continue;
    for (const pattern of wildcardPatterns(word)) {
      (index[pattern] ??= []).push(word);
    }
  }

  fs.mkdirSync('data/indexes/word-ladder', { recursive: true });
  fs.writeFileSync(
    `data/indexes/word-ladder/wildcards-len-${len}.json`,
    JSON.stringify(index)
  );
}
```

## BFS shortest path

Breadth-first search guarantees shortest path in an unweighted graph.

```ts
// lib/words/word-ladder.ts

export function wildcardPatterns(word: string) {
  const out: string[] = [];
  for (let i = 0; i < word.length; i++) {
    out.push(word.slice(0, i) + '*' + word.slice(i + 1));
  }
  return out;
}

export function getNeighbors(
  word: string,
  wildcardIndex: Record<string, string[]>
) {
  const neighbors = new Set<string>();

  for (const pattern of wildcardPatterns(word)) {
    for (const candidate of wildcardIndex[pattern] ?? []) {
      if (candidate !== word) neighbors.add(candidate);
    }
  }

  return [...neighbors];
}

export function bfsShortestPath(input: {
  start: string;
  end: string;
  wildcardIndex: Record<string, string[]>;
  wordSet: Set<string>;
  maxVisited?: number;
}) {
  const start = input.start.toLowerCase();
  const end = input.end.toLowerCase();

  const warnings: string[] = [];

  if (start.length !== end.length) {
    return {
      found: false,
      path: [],
      steps: 0,
      visitedCount: 0,
      warnings: ['Start and end words must be the same length.']
    };
  }

  if (!input.wordSet.has(start)) warnings.push(`Start word "${start}" is not in the selected dictionary.`);
  if (!input.wordSet.has(end)) warnings.push(`End word "${end}" is not in the selected dictionary.`);

  if (warnings.length) {
    return { found: false, path: [], steps: 0, visitedCount: 0, warnings };
  }

  const queue: string[] = [start];
  const parent = new Map<string, string | null>([[start, null]]);
  const visited = new Set<string>([start]);
  const maxVisited = input.maxVisited ?? 50000;

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === end) {
      const path: string[] = [];
      let node: string | null = end;

      while (node) {
        path.push(node);
        node = parent.get(node) ?? null;
      }

      path.reverse();

      return {
        found: true,
        path,
        steps: path.length - 1,
        visitedCount: visited.size,
        warnings: []
      };
    }

    if (visited.size > maxVisited) {
      return {
        found: false,
        path: [],
        steps: 0,
        visitedCount: visited.size,
        warnings: ['Search stopped after visiting too many words. Try common dictionary mode.']
      };
    }

    for (const next of getNeighbors(current, input.wildcardIndex)) {
      if (visited.has(next)) continue;
      visited.add(next);
      parent.set(next, current);
      queue.push(next);
    }
  }

  return {
    found: false,
    path: [],
    steps: 0,
    visitedCount: visited.size,
    warnings: ['No ladder found in the selected dictionary.']
  };
}
```

## Bidirectional BFS optimization

For longer words or broad dictionary mode, use bidirectional BFS.

```ts
export function bidirectionalBfs(input: {
  start: string;
  end: string;
  wildcardIndex: Record<string, string[]>;
  wordSet: Set<string>;
}) {
  // MVP can ship normal BFS first.
  // Later implementation:
  // - frontierA starts at start
  // - frontierB starts at end
  // - always expand smaller frontier
  // - stop when frontiers intersect
  // - reconstruct path from both parent maps
}
```

## Alternative ladders

After the shortest path is found:
- Find additional paths up to same length + 1 or + 2.
- Use BFS with path tracking and cap result count.
- Do not run unbounded path enumeration.

```ts
type AlternativeOptions = {
  maxPaths: number;      // default 5
  maxExtraSteps: number; // default 1
  maxVisited: number;
};
```

## Worker

Graph search can stall the UI, so use a Worker.

```ts
// workers/word-ladder.worker.ts
/// <reference lib="webworker" />

import { bfsShortestPath } from '@/lib/words/word-ladder';

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === 'solve') {
    const len = payload.start.length;
    const wildcardIndex = await import(`@/data/indexes/word-ladder/wildcards-len-${len}.json`);
    const words = await import(`@/data/words/ladder-words-len-${len}.json`);

    const result = bfsShortestPath({
      start: payload.start,
      end: payload.end,
      wildcardIndex: wildcardIndex.default,
      wordSet: new Set(words.default),
      maxVisited: payload.maxVisited
    });

    self.postMessage({ type: 'result', payload: result });
  }
};
```

Note: If bundler dynamic imports for JSON inside Workers become awkward, load JSON by URL from `/data/indexes/...` instead.

## UI skeleton

```tsx
// app/word-games/word-ladder/solver/page.tsx
import WordLadderSolver from '@/components/word-games/word-ladder/WordLadderSolver';

export const metadata = {
  title: 'Word Ladder Solver | Find the Shortest Word Path',
  description: 'Enter a start word and end word to find the shortest word ladder where each step changes one letter.',
  alternates: { canonical: '/word-games/word-ladder/solver/' }
};

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-3xl font-semibold">Word Ladder Solver</h1>
      <p className="mt-2 text-slate-600">
        Find the shortest path from one word to another by changing one letter at a time.
      </p>
      <WordLadderSolver />
    </main>
  );
}
```

UI layout:
```text
Start word: [cold]
End word: [warm]
Dictionary mode: [Common] [Broad] [Scrabble]
Button: Find ladder
Result:
  cold
  cord
  word
  ward
  warm
Steps: 4
Alternative paths
```

## Generated pages

Generated pages can be powerful but should be limited.

Route:
```text
/word-games/word-ladder/[start]/to/[end]/
```

Only generate high-value pairs:
- common words
- same length 3–5 initially
- path exists
- reasonable search demand or internal link value
- noindex pairs with no path

Manifest:
```json
{
  "start": "cold",
  "end": "warm",
  "canonical": "/word-games/word-ladder/cold/to/warm/",
  "index": true,
  "steps": 4,
  "path": ["cold", "cord", "word", "ward", "warm"]
}
```

## SEO metadata

Solver:
```ts
title: 'Word Ladder Solver | Find the Shortest Word Path'
description: 'Enter two words to find the shortest word ladder where each step changes one letter into another valid word.'
```

Generated route:
```ts
title: 'Word Ladder from {start} to {end} | Shortest Path'
description: 'Find a word ladder from {start} to {end}, with each step changing one letter into a valid word.'
```

FAQ ideas:
1. What is a word ladder?
2. Why must the words be the same length?
3. How does the solver find the shortest path?
4. Why is there no ladder for my words?
5. Can I see alternative ladders?

## JSON-LD

Use `SoftwareApplication` and optional `HowTo` for generated solved ladders.

```ts
export const wordLadderJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Word Ladder Solver',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web',
      description: 'A word ladder solver that finds the shortest path between two words.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dailygridhelp.com/' },
        { '@type': 'ListItem', position: 2, name: 'Word Games', item: 'https://dailygridhelp.com/word-games/' },
        { '@type': 'ListItem', position: 3, name: 'Word Ladder', item: 'https://dailygridhelp.com/word-games/word-ladder/' }
      ]
    }
  ]
};
```

Generated path `HowTo`:
```ts
export function ladderHowToJsonLd(path: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `Word ladder from ${path[0]} to ${path[path.length - 1]}`,
    step: path.map((word, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: word.toUpperCase(),
      text: index === 0
        ? `Start with ${word.toUpperCase()}.`
        : `Change one letter to make ${word.toUpperCase()}.`
    }))
  };
}
```

## Tests

```ts
import { describe, expect, it } from 'vitest';
import { getNeighbors, wildcardPatterns, bfsShortestPath } from '@/lib/words/word-ladder';

describe('word ladder wildcard patterns', () => {
  it('creates one wildcard per position', () => {
    expect(wildcardPatterns('cat')).toEqual(['*at', 'c*t', 'ca*']);
  });
});

describe('word ladder BFS', () => {
  it('finds shortest path', () => {
    const wildcardIndex = {
      '*at': ['cat'],
      'c*t': ['cat', 'cot'],
      'ca*': ['cat'],
      '*ot': ['cot'],
      'co*': ['cot', 'cog'],
      'c*g': ['cog'],
      '*og': ['cog', 'dog'],
      'd*g': ['dog'],
      'do*': ['dog']
    };

    const result = bfsShortestPath({
      start: 'cat',
      end: 'dog',
      wildcardIndex,
      wordSet: new Set(['cat', 'cot', 'cog', 'dog'])
    });

    expect(result.path).toEqual(['cat', 'cot', 'cog', 'dog']);
  });
});
```

Checklist:
- start/end length mismatch
- start not in dictionary
- end not in dictionary
- no path
- same start/end word
- broad dictionary timeout
- generated route path exists
- alternative path cap
- worker error handling
- mobile UI

## Acceptance criteria

- Solver finds shortest path using BFS.
- Same-length validation works.
- Worker prevents UI blocking.
- Wildcard index is prebuilt.
- Generated pages only index solved/high-value pairs.
- Alternative paths are capped.
