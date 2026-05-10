# 04 — Crossword Game Spec

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

Crossword is a clue-and-pattern solving game.

This is distinct from generic word filtering because the user often enters clue text plus known letter positions. The tool ranks likely answers, not just all possible words.

## Modes inside this game

All of these belong inside Crossword:
- Crossword solver
- Crossword clue solver
- Crossword helper
- Known-letter solver
- Pattern crossword solver
- Crossword answer finder
- Length + pattern + clue ranking

## Primary routes

```text
/app/word-games/crossword/page.tsx
/app/word-games/crossword/solver/page.tsx
/app/word-games/crossword/clue-solver/page.tsx
/app/word-games/crossword/pattern/[pattern]/page.tsx

/components/word-games/crossword/CrosswordInput.tsx
/components/word-games/crossword/CrosswordResults.tsx
/components/word-games/crossword/PatternInput.tsx
/components/word-games/crossword/ClueInput.tsx

/lib/words/pattern.ts
/lib/words/crossword.ts
/lib/words/clue-rank.ts
/workers/crossword.worker.ts

/data/words/words-by-length.json
/data/words/crossword-common.json
/data/indexes/pattern/
/data/indexes/clues/
```

Recommended public URLs:

```text
/word-games/crossword/
/word-games/crossword/solver/
/word-games/crossword/clue-solver/
/word-games/crossword/pattern/_a_e_/
```

## MVP scope

Build in phases.

Phase 1:
- pattern-only solver
- length filter
- known letters
- contains/excludes
- commonness ranking

Phase 2:
- clue keyword scoring
- crossword-common answer list
- definitions/examples if licensed

Phase 3:
- historical clue-answer retrieval
- TF-IDF/BM25 over clue-answer dataset
- optional dense embeddings / FAISS on VM only
- grid constraint solver later

Do not start with a complex FAISS/Z3 system. Start with pattern ranking because it is robust, static-friendly, and useful.

## User input

```ts
type CrosswordInput = {
  pattern: string;      // "_a_e", "??A??", ".a.e."
  clue?: string;        // "ocean movement"
  length?: number;      // inferred from pattern when present
  contains?: string;
  excludes?: string;
  startsWith?: string;
  endsWith?: string;
};
```

Accept wildcard characters:
```text
_
?
.
*
```

Normalize them to `.` for regex.

## Output

```ts
type CrosswordCandidate = {
  word: string;
  length: number;
  score: number;
  scoreParts: {
    pattern: number;
    frequency: number;
    clue: number;
    crosswordCommon: number;
  };
  matchedClues?: string[];
};
```

## Shared pattern engine

Pattern engine is also used by Hangman and Wordle support filters.

```ts
// lib/words/pattern.ts
import wordsByLength from '@/data/words/words-by-length.json';

export type PatternOptions = {
  pattern?: string;
  length?: number;
  contains?: string;
  excludes?: string;
  startsWith?: string;
  endsWith?: string;
};

export function normalizePattern(pattern: string): string {
  return pattern
    .toLowerCase()
    .replace(/[^a-z_?.*]/g, '')
    .replace(/[?_*]/g, '.');
}

export function patternToRegex(pattern: string) {
  const normalized = normalizePattern(pattern);
  return new RegExp(`^${normalized}$`, 'i');
}

function includesAll(word: string, letters: string) {
  return [...letters.toLowerCase()].every(ch => word.includes(ch));
}

function excludesAll(word: string, letters: string) {
  return ![...letters.toLowerCase()].some(ch => word.includes(ch));
}

export function findByPattern(opts: PatternOptions): string[] {
  const pattern = opts.pattern ? normalizePattern(opts.pattern) : '';
  const length = opts.length ?? pattern.length;

  if (!length) return [];

  let candidates = ((wordsByLength as Record<string, string[]>)[String(length)] ?? []);

  if (pattern) {
    const regex = patternToRegex(pattern);
    candidates = candidates.filter(word => regex.test(word));
  }

  if (opts.startsWith) candidates = candidates.filter(w => w.startsWith(opts.startsWith!.toLowerCase()));
  if (opts.endsWith) candidates = candidates.filter(w => w.endsWith(opts.endsWith!.toLowerCase()));
  if (opts.contains) candidates = candidates.filter(w => includesAll(w, opts.contains!));
  if (opts.excludes) candidates = candidates.filter(w => excludesAll(w, opts.excludes!));

  return candidates;
}
```

## Crossword ranking

MVP ranking:
```text
score = patternScore + frequencyScore + crosswordCommonBoost + clueScore
```

Pattern score:
- exact regex match = required
- no match = excluded

Frequency score:
- wordfreq or Norvig normalized commonness

Crossword common boost:
- +0.25 if in crossword-common list
- +0.10 if answer length is common for clue

Clue score Phase 1:
- tokenize clue
- tokenize definitions/examples if licensed
- simple overlap / BM25 if data exists
- if no clue data, clueScore = 0

```ts
// lib/words/crossword.ts
import { findByPattern, PatternOptions } from './pattern';
import freq from '@/data/words/freq-rank.json';
import crosswordCommon from '@/data/words/crossword-common.json';

const commonSet = new Set(crosswordCommon as string[]);

function tokenize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function clueKeywordScore(word: string, clue: string | undefined) {
  if (!clue) return 0;

  // MVP placeholder: real implementation can use licensed definitions, clue datasets, or BM25.
  const tokens = new Set(tokenize(clue));
  if (tokens.has(word)) return 0.2;
  return 0;
}

export function solveCrossword(input: PatternOptions & { clue?: string }) {
  const words = findByPattern(input);

  return words
    .map(word => {
      const frequency = (freq as Record<string, number>)[word] ?? 0;
      const crosswordCommonBoost = commonSet.has(word) ? 0.25 : 0;
      const clue = clueKeywordScore(word, input.clue);

      return {
        word,
        length: word.length,
        score: frequency + crosswordCommonBoost + clue,
        scoreParts: {
          pattern: 1,
          frequency,
          clue,
          crosswordCommon: crosswordCommonBoost
        }
      };
    })
    .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));
}
```

## Optional clue retrieval system

If you have a historical clue-answer CSV:

```text
src/data/clues_answers.csv
answer,clue,source,date
WAVE,Ocean movement,...
```

Preprocess on VM:
1. Normalize clue text.
2. Build inverted index / BM25.
3. Store top clues per answer.
4. Generate static shard:
   - `data/indexes/clues/a.json`
   - `data/indexes/clues/b.json`
5. Client sends clue text to Worker.
6. Worker loads only needed shard or lightweight index.

Optional dense retrieval:
- Build embeddings on VM.
- Use FAISS on VM for offline route/artifact generation.
- Do not require FAISS in browser.
- For static hosting, precompute common clue pages or keep clue-ranking client-side with small JSON.

## Optional grid constraint solver

Later:
- User enters small grid with across/down intersections.
- Candidate words are generated for each slot.
- Constraint propagation prunes candidates.
- Use backtracking before Z3; Z3 is overkill for MVP.

```ts
type Slot = {
  id: string;
  direction: 'across' | 'down';
  length: number;
  pattern: string;
};

type Intersection = {
  aSlot: string;
  aIndex: number;
  bSlot: string;
  bIndex: number;
};
```

## Worker

```ts
// workers/crossword.worker.ts
/// <reference lib="webworker" />

import { solveCrossword } from '@/lib/words/crossword';

self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === 'solve') {
    const results = solveCrossword(payload).slice(0, payload.limit ?? 200);
    self.postMessage({ type: 'result', payload: results });
  }
};
```

## UI skeleton

```tsx
// app/word-games/crossword/solver/page.tsx
import CrosswordSolver from '@/components/word-games/crossword/CrosswordSolver';

export const metadata = {
  title: 'Crossword Solver | Find Answers by Clue and Pattern',
  description: 'Enter a crossword clue, known letters, and word length to find likely crossword answers ranked by pattern and commonness.',
  alternates: { canonical: '/word-games/crossword/solver/' }
};

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-3xl font-semibold">Crossword Solver</h1>
      <p className="mt-2 text-slate-600">
        Enter a clue and any known letters to find likely crossword answers.
      </p>
      <CrosswordSolver />
    </main>
  );
}
```

Input labels:
```text
Clue
Known letters / pattern
Word length
Contains
Excludes
```

Pattern examples:
```text
_a_e = 4 letters, second letter A, last letter E
??A?? = 5 letters with A in the middle
```

## SEO metadata

Main solver:
```ts
title: 'Crossword Solver | Find Answers by Clue and Pattern'
description: 'Enter a crossword clue, word length, and known letters to find likely answers ranked by pattern match and commonness.'
```

Clue solver:
```ts
title: 'Crossword Clue Solver | Search Likely Answers'
description: 'Search possible crossword answers using clue text, known letters, and answer length.'
```

Pattern page:
```ts
title: 'Crossword Pattern Solver for {pattern} | Matching Words'
description: 'Find crossword answers matching the pattern {pattern}, with filters for clue text, contains, and excludes.'
```

## FAQ ideas

1. How do I enter unknown crossword letters?
2. Can I search by clue and pattern together?
3. Why do some answers appear without clue matches?
4. What does pattern-only mode do?
5. How are crossword answers ranked?
6. Can this solve an entire grid?

## JSON-LD

Use `SoftwareApplication` for solver and `ItemList` for pattern result pages.

```ts
export const crosswordJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Crossword Solver',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web',
      description: 'A crossword helper that finds answers by clue, pattern, and word length.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dailygridhelp.com/' },
        { '@type': 'ListItem', position: 2, name: 'Word Games', item: 'https://dailygridhelp.com/word-games/' },
        { '@type': 'ListItem', position: 3, name: 'Crossword', item: 'https://dailygridhelp.com/word-games/crossword/' }
      ]
    }
  ]
};
```

## Tests

```ts
import { describe, expect, it } from 'vitest';
import { normalizePattern, patternToRegex, findByPattern } from '@/lib/words/pattern';

describe('crossword pattern parser', () => {
  it('normalizes wildcards', () => {
    expect(normalizePattern('_a?e*')).toBe('.a.e.');
  });

  it('matches known positions', () => {
    const regex = patternToRegex('_a_e');
    expect(regex.test('wave')).toBe(true);
    expect(regex.test('tide')).toBe(false);
  });
});
```

Checklist:
- pattern hyphens
- apostrophes
- spaces
- wildcard parsing
- repeated-letter constraints
- clue empty state
- exact length
- no results
- commonness ranking
- result limit
- offensive word hiding
- mobile keyboard

## Acceptance criteria

- Pattern-only solver works before clue engine.
- Clue input improves ranking but does not block results.
- Shared pattern engine can be reused by Hangman.
- No cached Wordnik API raw data.
- Generated pattern pages are noindexed if thin.
- Results explain why each candidate matched.
