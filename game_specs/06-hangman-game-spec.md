# 06 — Hangman Game Spec

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

Hangman is a missing-word deduction game. The user knows some positions and wrong guesses, then wants possible words and the best next letter.

This is distinct from Crossword because Hangman optimizes guessing strategy under penalty risk. Crossword wants likely answer; Hangman wants best next move.

## Modes inside this game

All of these belong inside Hangman:
- Hangman solver
- Hangman helper
- Best letter for Hangman
- Missing letter solver
- Word guessing helper
- Possible words
- Easy/hard mode
- Probability display

## Primary routes

```text
/app/word-games/hangman/page.tsx
/app/word-games/hangman/solver/page.tsx
/app/word-games/hangman/best-letter/page.tsx
/app/word-games/hangman/pattern/[pattern]/page.tsx

/components/word-games/hangman/HangmanInput.tsx
/components/word-games/hangman/HangmanResults.tsx
/components/word-games/hangman/BestLetterPanel.tsx

/lib/words/pattern.ts
/lib/words/hangman.ts
/workers/hangman.worker.ts

/data/words/words-by-length.json
/data/words/freq-rank.json
/data/indexes/pattern/
```

Recommended public URLs:

```text
/word-games/hangman/
/word-games/hangman/solver/
/word-games/hangman/best-letter/
/word-games/hangman/pattern/_a__e/
```

## User input

```ts
type HangmanInput = {
  pattern: string;          // "_a__e" or "?a??e"
  wrongLetters: string;     // "rst"
  knownLetters?: string;    // optional letters known to be present
  maxWrongGuesses?: number;
  mode?: 'safe' | 'aggressive';
};
```

Pattern:
- `_`, `?`, `.`, `*` mean unknown
- letters indicate known positions

Wrong letters:
- excluded from all candidates
- should not overlap with known pattern letters

Known letters:
- letters that must appear somewhere, even if position unknown

## Output

```ts
type HangmanResult = {
  possibleWords: string[];
  total: number;
  bestLetters: Array<{
    letter: string;
    score: number;
    hitRate: number;
    coverage: number;
    expectedRemaining: number;
    examples: string[];
  }>;
  warnings: string[];
};
```

## Candidate filtering

Reuse shared pattern logic, then add Hangman-specific constraints.

```ts
// lib/words/hangman.ts
import { findByPattern } from './pattern';

function includesAll(word: string, letters: string) {
  return [...letters].every(ch => word.includes(ch));
}

function excludesAll(word: string, letters: string) {
  return ![...letters].some(ch => word.includes(ch));
}

export function filterHangmanCandidates(input: {
  pattern: string;
  wrongLetters?: string;
  knownLetters?: string;
}) {
  const wrong = (input.wrongLetters ?? '').toLowerCase().replace(/[^a-z]/g, '');
  const known = (input.knownLetters ?? '').toLowerCase().replace(/[^a-z]/g, '');

  let candidates = findByPattern({
    pattern: input.pattern,
    excludes: wrong
  });

  if (known) {
    candidates = candidates.filter(word => includesAll(word, known));
  }

  candidates = candidates.filter(word => excludesAll(word, wrong));

  return candidates;
}
```

## Best next-letter strategy

Simple greedy frequency:
```text
For each unguessed letter L:
score(L) = number of candidate words containing L / total candidate words
```

Better expected reduction:
1. For each candidate word, check if it contains letter.
2. Split into hit bucket and miss bucket.
3. Expected remaining = P(hit) * hitCount + P(miss) * missCount.
4. Choose lowest expected remaining.
5. Optionally penalize miss probability when few wrong guesses remain.

```ts
// lib/words/hangman.ts continued

export function rankHangmanLetters(input: {
  candidates: string[];
  guessedLetters: string;
  mode?: 'safe' | 'aggressive';
}) {
  const guessed = new Set(input.guessedLetters.toLowerCase().replace(/[^a-z]/g, '').split(''));
  const n = input.candidates.length;

  if (n === 0) return [];

  const rows = [];

  for (let code = 97; code <= 122; code++) {
    const letter = String.fromCharCode(code);
    if (guessed.has(letter)) continue;

    const hitWords = input.candidates.filter(word => word.includes(letter));
    const missWords = input.candidates.length - hitWords.length;
    const hitRate = hitWords.length / n;
    const missRate = 1 - hitRate;
    const expectedRemaining = hitRate * hitWords.length + missRate * missWords;

    const coverage = hitWords.length;

    let score = -expectedRemaining;

    if (input.mode === 'safe') {
      score += hitRate * 5;
      score -= missRate * 2;
    } else {
      score += coverage / n;
    }

    rows.push({
      letter,
      score,
      hitRate,
      coverage,
      expectedRemaining,
      examples: hitWords.slice(0, 10)
    });
  }

  return rows.sort((a, b) => b.score - a.score || b.hitRate - a.hitRate);
}

export function solveHangman(input: {
  pattern: string;
  wrongLetters?: string;
  knownLetters?: string;
  mode?: 'safe' | 'aggressive';
}) {
  const candidates = filterHangmanCandidates(input);
  const guessedLetters = `${input.wrongLetters ?? ''}${input.knownLetters ?? ''}${input.pattern.replace(/[^a-z]/gi, '')}`;

  return {
    possibleWords: candidates.slice(0, 300),
    total: candidates.length,
    bestLetters: rankHangmanLetters({
      candidates,
      guessedLetters,
      mode: input.mode
    }).slice(0, 10),
    warnings: validateHangmanInput(input)
  };
}

export function validateHangmanInput(input: {
  pattern: string;
  wrongLetters?: string;
  knownLetters?: string;
}) {
  const warnings: string[] = [];
  const patternLetters = new Set(input.pattern.toLowerCase().replace(/[^a-z]/g, '').split(''));
  const wrongLetters = new Set((input.wrongLetters ?? '').toLowerCase().replace(/[^a-z]/g, '').split(''));

  for (const letter of wrongLetters) {
    if (patternLetters.has(letter)) {
      warnings.push(`Wrong letter "${letter}" also appears in the known pattern.`);
    }
  }

  return warnings;
}
```

## Entropy-style letter ranking

Optional advanced score:

For each letter L, partition candidates into:
- words with L in positions set S
- words without L

A letter can reveal multiple positions. Pattern buckets are more informative than just hit/miss.

```ts
function revealPatternForLetter(word: string, letter: string) {
  return word
    .split('')
    .map((ch, i) => ch === letter ? String(i) : '')
    .filter(Boolean)
    .join(',') || 'miss';
}

export function letterEntropy(letter: string, candidates: string[]) {
  const buckets = new Map<string, number>();

  for (const word of candidates) {
    const key = revealPatternForLetter(word, letter);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  let h = 0;
  for (const count of buckets.values()) {
    const p = count / candidates.length;
    h -= p * Math.log2(p);
  }

  return h;
}
```

Final formula:
```text
score = entropy + safeModeHitBonus - missPenalty
```

## Worker

```ts
// workers/hangman.worker.ts
/// <reference lib="webworker" />

import { solveHangman } from '@/lib/words/hangman';

self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === 'solve') {
    self.postMessage({
      type: 'result',
      payload: solveHangman(payload)
    });
  }
};
```

## UI skeleton

```tsx
// app/word-games/hangman/solver/page.tsx
import HangmanSolver from '@/components/word-games/hangman/HangmanSolver';

export const metadata = {
  title: 'Hangman Solver | Best Next Letter and Possible Words',
  description: 'Enter your Hangman pattern and wrong letters to find possible words and the best next letter to guess.',
  alternates: { canonical: '/word-games/hangman/solver/' }
};

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-3xl font-semibold">Hangman Solver</h1>
      <p className="mt-2 text-slate-600">
        Enter known letters and wrong guesses to find possible words and the safest next letter.
      </p>
      <HangmanSolver />
    </main>
  );
}
```

UI layout:
```text
Pattern: [_ A _ _ E]
Wrong letters: [R S T]
Known letters: optional
Mode:
  [Safe] [Aggressive]
Button: Solve
Results:
  Best next letters
  Hit rate
  Expected remaining words
  Possible words
```

## Generated pattern pages

Static pages can target long-tail pattern searches, but be careful with thin pages.

Example:
```text
/word-games/hangman/pattern/_a__e/
```

Only index if:
- result count is useful
- not too broad
- not empty
- contains explanatory content and examples

Otherwise noindex.

## SEO metadata

Solver:
```ts
title: 'Hangman Solver | Best Next Letter and Possible Words'
description: 'Enter a Hangman pattern and wrong letters to find matching words and the best next letter by probability.'
```

Best letter page:
```ts
title: 'Best Letter for Hangman | Guess Smarter'
description: 'Find the strongest next letter in Hangman based on possible words, hit rate, and expected remaining answers.'
```

FAQ ideas:
1. How does the Hangman solver choose the best letter?
2. What should I enter for unknown letters?
3. Should I use safe mode or aggressive mode?
4. Why is the most common letter not always the best?
5. Can this solve phrases?

## JSON-LD

Use `SoftwareApplication`.

```ts
export const hangmanJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Hangman Solver',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web',
      description: 'A Hangman helper that finds possible words and ranks the best next letter.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dailygridhelp.com/' },
        { '@type': 'ListItem', position: 2, name: 'Word Games', item: 'https://dailygridhelp.com/word-games/' },
        { '@type': 'ListItem', position: 3, name: 'Hangman', item: 'https://dailygridhelp.com/word-games/hangman/' }
      ]
    }
  ]
};
```

## Tests

```ts
import { describe, expect, it } from 'vitest';
import { filterHangmanCandidates, rankHangmanLetters } from '@/lib/words/hangman';

describe('hangman filtering', () => {
  it('excludes wrong letters', () => {
    const results = filterHangmanCandidates({
      pattern: '_a__e',
      wrongLetters: 'rst'
    });

    for (const word of results) {
      expect(/[rst]/.test(word)).toBe(false);
      expect(word[1]).toBe('a');
      expect(word[4]).toBe('e');
    }
  });
});

describe('hangman letter ranking', () => {
  it('does not recommend already guessed letters', () => {
    const ranked = rankHangmanLetters({
      candidates: ['cable', 'camel', 'caper'],
      guessedLetters: 'cae'
    });

    expect(ranked.some(row => ['c', 'a', 'e'].includes(row.letter))).toBe(false);
  });
});
```

Checklist:
- pattern parser accepts `_`, `?`, `.`
- wrong letters excluded
- wrong letters conflict with known positions warning
- repeated known letters
- zero results
- one result
- best letter excludes guessed letters
- safe/aggressive mode changes ranking
- mobile input
- generated pattern noindex

## Acceptance criteria

- Candidate filtering is correct.
- Best next letter is ranked by candidate reduction and hit probability.
- Pattern engine is shared with Crossword.
- Users can understand why a letter is recommended.
- Tool remains useful even without generated SEO pages.
