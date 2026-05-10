# 01 — Connections Game Spec

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

Connections is a semantic grouping game. The user sees 16 terms and tries to organize them into 4 groups of 4 by hidden relationships.

This is a distinct game because the core task is category discovery, not spelling, anagramming, clue matching, or letter-position filtering.

## Modes inside this game

All of these are variations of one game, not separate games:
- Today’s Connections hints
- Connections answers
- Connections archive by date
- Progressive reveal levels
- “Reveal one group”
- Optional later: custom 16-word helper

## Primary routes

```text
/app/word-games/connections/page.tsx
/app/word-games/connections/hints/page.tsx
/app/word-games/connections/hints/[date]/page.tsx
/app/word-games/connections/answers/[date]/page.tsx
/app/word-games/connections/archive/page.tsx

/components/word-games/connections/ConnectionsGrid.tsx
/components/word-games/connections/ConnectionsHintCards.tsx
/components/word-games/connections/RevealControls.tsx

/lib/puzzles/connections.ts
/scripts/update-connections.ts
/data/generated/connections-latest.json
/data/generated/connections-archive.json
```

Recommended public URLs:

```text
/word-games/connections/
/word-games/connections/hints/
/word-games/connections/hints/2026-05-09/
/word-games/connections/answers/2026-05-09/
/word-games/connections/archive/
```

## User intent

Users usually fall into 3 groups:

1. Hint seeker: “I am stuck, help me without spoiling everything.”
2. Answer seeker: “Show the full answer now.”
3. Archive visitor: “I need a specific date.”

Do not force all 3 intents into one overloaded page. The game hub can link to each mode.

## MVP page behavior

The top of the hint page should show:

```text
H1: Connections Hints for Today
Updated timestamp
16-word grid
Reveal buttons:
  [Reveal Hint 1]
  [Reveal Hint 2]
  [Reveal Category]
  [Reveal Group]
Four hidden/revealed group cards
Link: Show full answer
Link: Yesterday
Link: Archive
```

Do not put long explanation above the game.

## Daily puzzle JSON shape

```json
{
  "$schema": "https://dailygridhelp.com/schemas/connections-day.schema.json",
  "date": "2026-05-09",
  "status": "published",
  "sourceMode": "manual_review",
  "grid": ["ALPHA", "BETA", "GAMMA", "DELTA"],
  "groups": [
    {
      "difficulty": "yellow",
      "category": "Greek letters",
      "words": ["ALPHA", "BETA", "GAMMA", "DELTA"],
      "hint1": "Think of an ordered set.",
      "hint2": "These are symbols you may see in math or science.",
      "hint3": "All four belong to the same alphabet family."
    }
  ],
  "review": {
    "reviewedBy": "editor1",
    "reviewedAt": "2026-05-09T04:05:00Z"
  },
  "updatedAt": "2026-05-09T04:05:00Z"
}
```

## Data source strategy

The uploaded research mentioned NYT V2 JSON endpoints and a community mirror. Treat those as operational inputs, not as legal safety.

Safer implementation:
- ingest daily data into a draft table
- normalize into your own JSON format
- write hints manually or semi-automatically
- require human review
- publish only approved normalized hints/answers
- never publish raw scraped HTML
- never clone publisher styling
- no “official” claim

High-risk pages:
- answer pages
- date archives
- anything that looks like a playable clone

Lower-risk pages:
- progressive hints
- solver-style “thinking help”
- no raw UI clone

## SQL table

```sql
create table daily_puzzles (
  id bigserial primary key,
  puzzle_type text not null check (puzzle_type in ('connections', 'wordle')),
  puzzle_date date not null,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'published', 'archived')),
  grid_json jsonb not null,
  groups_json jsonb not null,
  hints_json jsonb not null,
  source_mode text not null default 'manual_review',
  reviewed_by text,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (puzzle_type, puzzle_date)
);
```

## Core reveal algorithm

The MVP algorithm is safe reveal sequencing over approved group data. Do not use semantic clustering for the daily page after the answer is known.

```ts
// lib/puzzles/connections.ts

export type Difficulty = 'yellow' | 'green' | 'blue' | 'purple';

export type ConnectionsGroup = {
  difficulty: Difficulty;
  category: string;
  words: [string, string, string, string];
  hint1: string;
  hint2: string;
  hint3: string;
};

export type RevealLevel = 0 | 1 | 2 | 3 | 4;

export function revealGroup(group: ConnectionsGroup, level: RevealLevel) {
  if (level === 0) return { difficulty: group.difficulty };
  if (level === 1) return { difficulty: group.difficulty, hint1: group.hint1 };
  if (level === 2) return { difficulty: group.difficulty, hint1: group.hint1, hint2: group.hint2 };
  if (level === 3) {
    return {
      difficulty: group.difficulty,
      hint1: group.hint1,
      hint2: group.hint2,
      hint3: group.hint3,
      category: group.category
    };
  }
  return {
    difficulty: group.difficulty,
    hint1: group.hint1,
    hint2: group.hint2,
    hint3: group.hint3,
    category: group.category,
    words: group.words
  };
}
```

Complexity: O(1) per reveal.

## Optional custom helper algorithm

This is optional and should be separate from the daily hint page.

User enters 16 words. The tool estimates possible groups.

Algorithm:
1. Normalize tokens.
2. Compute pairwise semantic similarity.
3. Combine sources:
   - word embeddings if available
   - category dictionaries
   - phrase/fill-in-the-blank detection
   - shared prefixes/suffixes
   - common collocations
4. Propose candidate 4-word clusters.
5. Score clusters by high internal similarity and low cross-cluster similarity.
6. Label results as “estimated.”

Cosine similarity:

```text
similarity(A, B) = dot(A, B) / (||A|| * ||B||)
```

Do not promise correctness.

## Client architecture

Connections does not need a Web Worker for MVP.

Use:
- static JSON imported at build time for today/date pages
- client component for reveal state
- localStorage only inside `useEffect()`
- optional reveal state persistence by date

```tsx
// components/word-games/connections/ConnectionsHintCards.tsx
'use client';

import { useEffect, useState } from 'react';
import type { ConnectionsGroup, RevealLevel } from '@/lib/puzzles/connections';
import { revealGroup } from '@/lib/puzzles/connections';

type Props = {
  date: string;
  groups: ConnectionsGroup[];
};

export default function ConnectionsHintCards({ date, groups }: Props) {
  const storageKey = `connections-reveal-${date}`;
  const [levels, setLevels] = useState<RevealLevel[]>([0, 0, 0, 0]);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) setLevels(JSON.parse(raw));
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(levels));
  }, [levels, storageKey]);

  function reveal(index: number) {
    setLevels(current =>
      current.map((level, i) => i === index ? Math.min(4, level + 1) as RevealLevel : level)
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {groups.map((group, index) => {
        const visible = revealGroup(group, levels[index]);
        return (
          <article key={group.difficulty} className="rounded-2xl border p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide">{group.difficulty}</p>
            {'hint1' in visible && <p>Hint 1: {visible.hint1}</p>}
            {'hint2' in visible && <p>Hint 2: {visible.hint2}</p>}
            {'hint3' in visible && <p>Hint 3: {visible.hint3}</p>}
            {'category' in visible && <p className="font-semibold">Category: {visible.category}</p>}
            {'words' in visible && <p className="font-bold">{visible.words.join(', ')}</p>}
            {levels[index] < 4 && (
              <button onClick={() => reveal(index)} className="mt-3 rounded-xl border px-3 py-2">
                {['Reveal Hint 1', 'Reveal Hint 2', 'Reveal Hint 3', 'Reveal Group'][levels[index]]}
              </button>
            )}
          </article>
        );
      })}
    </section>
  );
}
```

## VM script

```ts
// scripts/update-connections.ts
import fs from 'node:fs';
import path from 'node:path';

type Status = 'draft' | 'reviewed' | 'published';

async function fetchDailyConnections(date: string) {
  // Implementation detail intentionally isolated.
  // This script can fetch from a configured source, but it must write only normalized draft JSON.
  // Human review must happen before status becomes "published".
  return null;
}

function generateSoftHints(raw: any) {
  // Do not rely fully on automation.
  // Return draft hints for a human editor to approve.
  return raw.categories.map((category: any, index: number) => ({
    difficulty: ['yellow', 'green', 'blue', 'purple'][index],
    category: category.title,
    words: category.cards.map((c: any) => c.content),
    hint1: 'A shared category.',
    hint2: `Starts with "${category.title[0]}".`,
    hint3: category.title
  }));
}

async function main() {
  const date = process.env.PUZZLE_DATE || new Date().toISOString().slice(0, 10);
  const raw = await fetchDailyConnections(date);

  if (!raw) throw new Error(`No draft data for ${date}`);

  const output = {
    date,
    status: 'draft' satisfies Status,
    sourceMode: 'manual_review',
    grid: raw.categories.flatMap((cat: any) => cat.cards.map((c: any) => c.content)),
    groups: generateSoftHints(raw),
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'data/generated/connections-latest-draft.json'),
    JSON.stringify(output, null, 2)
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
```

## Page skeleton

```tsx
// app/word-games/connections/hints/page.tsx
import latest from '@/data/generated/connections-latest.json';
import ConnectionsHintCards from '@/components/word-games/connections/ConnectionsHintCards';

export const metadata = {
  title: 'Connections Hints for Today | DailyGridHelp',
  description: 'Progressive Connections hints for today. Reveal one clue at a time without jumping straight to the full answer.',
  alternates: { canonical: '/word-games/connections/hints/' }
};

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-3xl font-semibold">Connections Hints for Today</h1>
      <p className="mt-2 text-sm text-slate-600">Updated {latest.updatedAt}</p>

      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {latest.grid.map((word: string) => (
          <div key={word} className="rounded-xl border bg-white p-3 text-center font-medium">
            {word}
          </div>
        ))}
      </section>

      <div className="mt-6">
        <ConnectionsHintCards date={latest.date} groups={latest.groups} />
      </div>
    </main>
  );
}
```

## SEO metadata

Game hub:
```ts
title: 'Connections Helper | Hints, Answers, and Archive'
description: 'Get progressive Connections hints, reveal categories one at a time, or view reviewed answer pages by date.'
```

Today hint page:
```ts
title: 'Connections Hints for Today | DailyGridHelp'
description: 'Progressive Connections hints for today. Start with a soft clue, then reveal category and group only when ready.'
```

Answer page:
```ts
title: 'Connections Answer for {date} | DailyGridHelp'
description: 'Reviewed Connections answer for {date}, organized by group and category.'
```

FAQ ideas:
1. Can I get a hint without seeing the full answer?
2. How do the reveal levels work?
3. Are these official Connections answers?
4. Why is there a manual review step?
5. Can I view past puzzles?

## JSON-LD

Use `WebPage` for hint/answer pages and `BreadcrumbList`.

```ts
export function connectionsJsonLd(date: string, mode: 'hints' | 'answers') {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: mode === 'hints' ? 'Connections Hints' : 'Connections Answers',
        description: mode === 'hints'
          ? 'Progressive hints for a Connections-style word grouping puzzle.'
          : 'Reviewed grouped answers for a Connections-style word puzzle.'
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dailygridhelp.com/' },
          { '@type': 'ListItem', position: 2, name: 'Word Games', item: 'https://dailygridhelp.com/word-games/' },
          { '@type': 'ListItem', position: 3, name: 'Connections', item: 'https://dailygridhelp.com/word-games/connections/' }
        ]
      }
    ]
  };
}
```

## Tests

Vitest:
```ts
import { describe, expect, it } from 'vitest';
import { revealGroup } from '@/lib/puzzles/connections';

describe('Connections reveal ladder', () => {
  const group = {
    difficulty: 'yellow',
    category: 'Greek letters',
    words: ['ALPHA', 'BETA', 'GAMMA', 'DELTA'],
    hint1: 'Think symbols',
    hint2: 'Math and science',
    hint3: 'Alphabet family'
  } as const;

  it('reveals progressively', () => {
    expect(revealGroup(group, 1)).toEqual({ difficulty: 'yellow', hint1: 'Think symbols' });
    expect(revealGroup(group, 4)).toMatchObject({ category: 'Greek letters', words: group.words });
  });
});
```

Checklist:
- no draft record can publish accidentally
- page handles fewer than 16 words as invalid
- duplicate grid word warning
- date page canonical correct
- archive links generated only for reviewed/published dates
- reveal state survives refresh
- full answer button does not appear above hint UI
- disclaimer visible in footer

## Acceptance criteria

- Today hint page builds statically.
- Date hint pages build from route manifest.
- Answer pages require `status='published'`.
- No raw scraped HTML is committed.
- No publisher logo or official styling.
- `connections-latest.json` validates against schema.
- Lighthouse passes Core Web Vitals targets.
