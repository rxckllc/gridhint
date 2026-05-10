# 02 — Wordle Game Spec

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

Wordle is a 5-letter deduction game. Users enter guesses and colored feedback, then the solver narrows the candidate set and recommends the best next guess.

This is a distinct game because its algorithm is feedback simulation plus information theory, not generic 5-letter filtering.

## Modes inside this game

All of these are Wordle modes, not separate games:
- Wordle solver
- Best next guess
- Best starting words
- Today’s hint
- Today’s answer
- 5-letter filter for Wordle-style play
- Green/yellow/gray row input
- Remaining answers list

## Primary routes

```text
/app/word-games/wordle/page.tsx
/app/word-games/wordle/solver/page.tsx
/app/word-games/wordle/best-starting-words/page.tsx
/app/word-games/wordle/hints/[date]/page.tsx
/app/word-games/wordle/answers/[date]/page.tsx

/components/word-games/wordle/WordleGrid.tsx
/components/word-games/wordle/WordleSolver.tsx
/components/word-games/wordle/BestGuessPanel.tsx
/components/word-games/wordle/RemainingAnswers.tsx

/lib/words/wordle.ts
/lib/words/wordleEntropy.ts
/workers/wordle.worker.ts
/scripts/update-wordle.ts

/data/words/five-letter-answers.json
/data/words/five-letter-guesses.json
/data/words/five-letter-freq.json
/data/generated/wordle-latest.json
```

Recommended public URLs:

```text
/word-games/wordle/
/word-games/wordle/solver/
/word-games/wordle/best-starting-words/
/word-games/wordle/hints/2026-05-09/
/word-games/wordle/answers/2026-05-09/
```

## Data strategy

Use a self-contained curated word list for the solver:
- answer candidates
- allowed guesses
- frequency ranking
- optional “common” flags

Do not require live daily answer fetching for the solver to work.

Daily answer/hint pages are optional and should use manual review before publishing.

## Input model

Up to 6 rows.

Each row:
```ts
type WordleRow = {
  guess: string; // exactly 5 lowercase a-z letters
  pattern: [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2];
};
```

Pattern:
```text
0 = gray
1 = yellow
2 = green
```

## Output model

```ts
type WordleSolveResult = {
  remainingCount: number;
  remainingAnswers: string[];
  rankedGuesses: Array<{
    word: string;
    entropy: number;
    expectedRemaining: number;
    isPossibleAnswer: boolean;
    freqZipf?: number;
  }>;
  letterPositionFrequencies: Record<string, number[]>;
  warnings: string[];
};
```

## Two-pass duplicate-letter scoring

This is the most important correctness issue.

Rules:
1. Mark exact matches green first.
2. Remove consumed answer letters.
3. Mark yellows only if an unconsumed copy remains.
4. Otherwise gray.

```ts
// lib/words/wordle.ts

export type Pattern = [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2];

export function scoreGuess(guess: string, answer: string): Pattern {
  const out: number[] = [0, 0, 0, 0, 0];
  const remaining = new Map<string, number>();

  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) {
      out[i] = 2;
    } else {
      remaining.set(answer[i], (remaining.get(answer[i]) ?? 0) + 1);
    }
  }

  for (let i = 0; i < 5; i++) {
    if (out[i] === 2) continue;
    const count = remaining.get(guess[i]) ?? 0;
    if (count > 0) {
      out[i] = 1;
      remaining.set(guess[i], count - 1);
    }
  }

  return out as Pattern;
}

export function encodePattern(pattern: Pattern): number {
  return pattern.reduce((acc, value) => acc * 3 + value, 0);
}

export function samePattern(a: Pattern, b: Pattern): boolean {
  return a.every((value, index) => value === b[index]);
}

export function filterAnswers(
  answers: string[],
  constraints: Array<{ guess: string; pattern: Pattern }>
): string[] {
  return answers.filter(answer =>
    constraints.every(row => samePattern(scoreGuess(row.guess, answer), row.pattern))
  );
}
```

Complexity:
```text
scoreGuess: O(5)
filterAnswers: O(|answers| * rows * 5)
```

## Shannon entropy ranking

Each possible guess partitions the current remaining answer set into feedback buckets.

Formula:

```text
H(g) = - Σ p_r * log2(p_r)
p_r = n_r / |A|
```

Where:
- `g` is the candidate guess
- `A` is the remaining answer set
- `r` is a response pattern
- `n_r` is number of answers producing pattern `r`
- max number of patterns is 3^5 = 243

```ts
// lib/words/wordleEntropy.ts

import { encodePattern, scoreGuess } from './wordle';

export function entropyScore(
  guess: string,
  answers: string[],
  freq: Record<string, number> = {}
): { entropy: number; expectedRemaining: number } {
  const buckets = new Map<number, number>();

  for (const answer of answers) {
    const key = encodePattern(scoreGuess(guess, answer));
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  let entropy = 0;
  let expectedRemaining = 0;
  const n = answers.length;

  for (const count of buckets.values()) {
    const p = count / n;
    entropy -= p * Math.log2(p);
    expectedRemaining += p * count;
  }

  const duplicatePenalty = new Set(guess).size < 5 ? 0.05 : 0;
  const frequencyBonus = (freq[guess] ?? 0) * 0.01;

  return {
    entropy: entropy - duplicatePenalty + frequencyBonus,
    expectedRemaining
  };
}

export function rankGuesses(
  guesses: string[],
  remainingAnswers: string[],
  freq: Record<string, number>,
  topN = 25
) {
  return guesses
    .map(word => {
      const score = entropyScore(word, remainingAnswers, freq);
      return {
        word,
        entropy: score.entropy,
        expectedRemaining: score.expectedRemaining,
        isPossibleAnswer: remainingAnswers.includes(word),
        freqZipf: freq[word]
      };
    })
    .sort((a, b) => {
      if (b.entropy !== a.entropy) return b.entropy - a.entropy;
      if (a.isPossibleAnswer !== b.isPossibleAnswer) return a.isPossibleAnswer ? -1 : 1;
      return (b.freqZipf ?? 0) - (a.freqZipf ?? 0);
    })
    .slice(0, topN);
}
```

## Worker architecture

The first full ranking can be large:
```text
~13k guesses * ~2.3k answers * 5 letter checks
```

Run it inside a persistent Worker.

```ts
// workers/wordle.worker.ts
/// <reference lib="webworker" />

import { filterAnswers, Pattern } from '@/lib/words/wordle';
import { rankGuesses } from '@/lib/words/wordleEntropy';

let answers: string[] = [];
let guesses: string[] = [];
let freq: Record<string, number> = {};

type InitMessage = {
  type: 'init';
  payload: {
    answers: string[];
    guesses: string[];
    freq: Record<string, number>;
  };
};

type SolveMessage = {
  type: 'solve';
  payload: {
    rows: Array<{ guess: string; pattern: Pattern }>;
    topN?: number;
  };
};

self.onmessage = (event: MessageEvent<InitMessage | SolveMessage>) => {
  const { type, payload } = event.data;

  if (type === 'init') {
    answers = payload.answers;
    guesses = payload.guesses;
    freq = payload.freq;
    self.postMessage({ type: 'ready' });
    return;
  }

  if (type === 'solve') {
    const remaining = filterAnswers(answers, payload.rows);
    const ranked = rankGuesses(guesses, remaining, freq, payload.topN ?? 25);
    self.postMessage({
      type: 'result',
      payload: {
        remainingCount: remaining.length,
        remainingAnswers: remaining.slice(0, 200),
        ranked
      }
    });
  }
};
```

## Optional precomputed pattern matrix

Later optimization:
- Encode all guess-answer feedback patterns as `Uint8Array`.
- Index: `guessIndex * answerCount + answerIndex`.
- Store compressed `.bin` in `public/data/wordle-patterns.bin`.
- Load in Worker.
- Transfer ArrayBuffer, do histogram only.

Keep this optional. Do not block MVP.

## UI skeleton

```tsx
// app/word-games/wordle/solver/page.tsx
import WordleSolver from '@/components/word-games/wordle/WordleSolver';

export const metadata = {
  title: 'Wordle Solver | Best Next Guess and Possible Answers',
  description: 'Enter green, yellow, and gray feedback to filter possible Wordle answers and rank the best next guess by information gain.',
  alternates: { canonical: '/word-games/wordle/solver/' }
};

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-3xl font-semibold">Wordle Solver</h1>
      <p className="mt-2 text-slate-600">
        Enter your guesses and tile colors to see possible answers and the best next guess.
      </p>
      <WordleSolver />
    </main>
  );
}
```

## Daily hint / answer pages

Daily pages are optional.

JSON:
```json
{
  "date": "2026-05-09",
  "status": "published",
  "answer": "STARE",
  "hints": {
    "startsWith": "S",
    "containsVowelCount": 2,
    "repeatedLetters": false,
    "softHint": "A common word.",
    "nearSpoiler": "Often connected with looking."
  },
  "reviewedAt": "2026-05-09T05:10:00Z"
}
```

Routes:
```text
/word-games/wordle/hints/[date]/
/word-games/wordle/answers/[date]/
```

Do not publish daily answer pages without manual review.

## SEO metadata

Solver:
```ts
title: 'Wordle Solver | Best Next Guess and Possible Answers'
description: 'Enter Wordle feedback to filter possible answers and rank the best next guess by entropy and letter-position logic.'
```

Best starting words:
```ts
title: 'Best Wordle Starting Words | Ranked by Information Gain'
description: 'Compare strong Wordle starting words using answer coverage, duplicate-letter penalties, and expected information gain.'
```

FAQ ideas:
1. How does the Wordle solver handle duplicate letters?
2. What does entropy mean in Wordle?
3. Should I always guess the highest entropy word?
4. Why is a guess recommended even if it cannot be the answer?
5. Can I use this for hard mode?

## JSON-LD

Use `SoftwareApplication`.

```ts
export const wordleSolverJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Wordle Solver',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web',
      description: 'A browser-based Wordle solver that filters possible answers and ranks next guesses by entropy.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dailygridhelp.com/' },
        { '@type': 'ListItem', position: 2, name: 'Word Games', item: 'https://dailygridhelp.com/word-games/' },
        { '@type': 'ListItem', position: 3, name: 'Wordle', item: 'https://dailygridhelp.com/word-games/wordle/' }
      ]
    }
  ]
};
```

## Tests

```ts
import { describe, expect, it } from 'vitest';
import { scoreGuess, filterAnswers } from '@/lib/words/wordle';

describe('Wordle duplicate handling', () => {
  it('scores duplicate letters correctly', () => {
    expect(scoreGuess('array', 'carry')).toEqual([0, 1, 2, 2, 2]);
  });

  it('does not over-yellow duplicate guesses', () => {
    expect(scoreGuess('allee', 'apple')).toEqual([2, 0, 0, 1, 2]);
  });
});
```

Checklist:
- invalid row length
- non-alpha input
- repeated guesses
- zero candidates
- one candidate
- duplicate-letter gray/yellow conflict
- hard mode warnings
- Worker init race
- Worker restart after error
- mobile tile tapping
- keyboard input

## Acceptance criteria

- Solver works with no network request.
- Initial UI renders statically.
- Worker computes without blocking input.
- Duplicate letters match Wordle rules.
- Remaining answers and ranked guesses update after every submitted row.
- Daily answer pages are separated from solver and manually reviewed.
- No publisher logo, official claim, or cloned styling.
