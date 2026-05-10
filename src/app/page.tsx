import Link from "next/link";
import type { Metadata } from "next";
import {
  Grid3x3,
  Target,
  Hexagon,
  Shuffle,
  ArrowRightLeft,
  SpellCheck,
  Type,
  LayoutGrid,
  HelpCircle,
  MoveRight,
  ArrowRight,
  List,
  ScanText,
} from "lucide-react";

export const metadata: Metadata = {
  title: "GridHint — Daily Word Puzzle Hints, Solvers & Answers",
  description:
    "Free daily hints and answers for NYT Connections, Wordle, and Spelling Bee — plus solvers for anagrams, crosswords, hangman, and word ladders. Updated every day. No sign-up.",
  keywords: [
    // Connections
    "NYT Connections hints today",
    "Connections hints today",
    "New York Times Connections hints",
    "Connections answers today",
    "Connections puzzle helper",
    "Connections hint without spoilers",
    "NYT Connections answer",
    // Wordle
    "Wordle solver",
    "Wordle answer today",
    "NYT Wordle today",
    "Wordle helper",
    "Wordle word finder",
    "today's Wordle answer",
    // Spelling Bee
    "NYT Spelling Bee answers today",
    "Spelling Bee helper today",
    "Spelling Bee pangram today",
    "New York Times Spelling Bee words",
    "Spelling Bee word finder",
    "Spelling Bee answers",
    // General
    "word puzzle hints",
    "word game solver",
    "daily word puzzle help",
    "word puzzle answers today",
    "unscramble letters",
    "anagram solver",
    "crossword solver",
    "hangman solver",
    "word ladder solver",
    "5 letter words",
    "word descrambler",
    "word scrambler",
    "gridhint",
    "gridhint.com",
  ],
  alternates: { canonical: "https://gridhint.com" },
  openGraph: {
    title: "GridHint — Daily Word Puzzle Hints, Solvers & Answers",
    description:
      "Today's hints for NYT Connections, Wordle, and Spelling Bee — plus a full toolkit of word solvers. Free, updated daily.",
    url: "https://gridhint.com",
    siteName: "GridHint.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GridHint — Daily Word Puzzle Hints, Solvers & Answers",
    description:
      "Free hints for NYT Connections, Wordle, Spelling Bee and more. Updated daily.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://gridhint.com/#website",
      "url": "https://gridhint.com",
      "name": "GridHint",
      "description": "Free daily hints and solvers for NYT Connections, Wordle, Spelling Bee and more word puzzles.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://gridhint.com/word-games/anagram-jumble/unscramble?letters={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the NYT Connections hint for today?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "GridHint provides progressive hints for today's NYT Connections puzzle. Visit our Connections Hints page to reveal category clues one at a time without full spoilers."
          }
        },
        {
          "@type": "Question",
          "name": "What is today's Wordle answer?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Our Wordle Solver helps you find today's NYT Wordle answer by entering your green and yellow letters to narrow down the word list."
          }
        },
        {
          "@type": "Question",
          "name": "What are the NYT Spelling Bee answers today?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The GridHint Spelling Bee Helper lists every valid word for today's NYT Spelling Bee puzzle, including the pangram, with filters by length and starting letter."
          }
        },
        {
          "@type": "Question",
          "name": "What is GridHint?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "GridHint.com is a free, independent word puzzle helper. It provides daily hints and solvers for NYT Connections, Wordle, and Spelling Bee, plus tools for anagrams, crosswords, hangman, and word ladders."
          }
        }
      ]
    }
  ]
};

const dailyPuzzles = [
  {
    href: "/word-games/connections/hints",
    eyebrow: "Today's NYT Connections",
    title: "Connections Hints",
    description:
      "Progressive hints for today's New York Times Connections puzzle — reveal one category at a time, no spoilers until you ask.",
    Icon: Grid3x3,
    accentBar: "bg-purple-500",
    iconTint: "text-purple-600",
    iconBg: "bg-purple-50",
    eyebrowTint: "text-purple-700",
  },
  {
    href: "/word-games/wordle/today",
    eyebrow: "Today's NYT Wordle",
    title: "Wordle Hints & Answer",
    description:
      "Today's NYT Wordle: progressive hints (first letter, pattern, definition) plus the full answer behind a reveal — pick how much help you want.",
    Icon: Target,
    accentBar: "bg-emerald-500",
    iconTint: "text-emerald-600",
    iconBg: "bg-emerald-50",
    eyebrowTint: "text-emerald-700",
  },
  {
    href: "/word-games/spelling-bee/today",
    eyebrow: "Today's NYT Spelling Bee",
    title: "Spelling Bee Hints",
    description:
      "Today's NYT Spelling Bee letters, total word count, pangram count, and a private guess-checker — find words yourself with smart hints.",
    Icon: Hexagon,
    accentBar: "bg-amber-500",
    iconTint: "text-amber-600",
    iconBg: "bg-amber-50",
    eyebrowTint: "text-amber-700",
  },
];

const moreTools = [
  {
    href: "/word-games/anagram-jumble/unscramble",
    title: "Unscramble Letters",
    description: "Turn jumbled tiles into every possible word.",
    Icon: Shuffle,
  },
  {
    href: "/word-games/anagram-jumble/anagram-solver",
    title: "Anagram Solver",
    description: "Find every anagram of a word or phrase.",
    Icon: ArrowRightLeft,
  },
  {
    href: "/word-games/anagram-jumble/word-descrambler",
    title: "Word Descrambler",
    description: "Sort scrambled letters into valid words by length.",
    Icon: SpellCheck,
  },
  {
    href: "/word-games/anagram-jumble/word-scrambler",
    title: "Word Scrambler",
    description: "Generate scrambled letter sets for puzzles and games.",
    Icon: Type,
  },
  {
    href: "/word-games/crossword/solver",
    title: "Crossword Solver",
    description: "Match clues and patterns across major crossword grids.",
    Icon: LayoutGrid,
  },
  {
    href: "/word-games/hangman/solver",
    title: "Hangman Solver",
    description: "Best-guess letters based on known positions and misses.",
    Icon: HelpCircle,
  },
  {
    href: "/word-games/word-ladder/solver",
    title: "Word Ladder Solver",
    description: "Build the shortest one-letter-change path between two words.",
    Icon: MoveRight,
  },
  {
    href: "/word-games/5-letter-words",
    title: "5-Letter Words",
    description: "Browse every 5-letter word by starting letters, pattern, or endings.",
    Icon: List,
  },
  {
    href: "/word-games/word-pattern-solver",
    title: "Word Pattern Solver",
    description: "Find words matching a pattern — use _ for any unknown letter (e.g. C_T, B__K).",
    Icon: ScanText,
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-slate-50">
        {/* HERO — compact: ~1/3 viewport on desktop */}
        <section className="mx-auto max-w-4xl px-4 pt-6 pb-6 sm:pt-8 sm:pb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Updated daily · Free, no sign-up
          </p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-[#1E2D4A] sm:text-4xl">
            Daily Word Puzzle{" "}
            <span className="text-blue-700">Hints &amp; Answers</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-700 sm:text-lg">
            Free helpers for NYT Connections, Wordle, and Spelling Bee — plus anagram, crossword, hangman, and word ladder solvers. Get unstuck in seconds.
          </p>
        </section>

        {/* TODAY'S NYT PUZZLES */}
        <section
          aria-labelledby="daily-heading"
          className="mx-auto max-w-4xl px-4 pb-12 sm:pb-16"
        >
          <div className="mb-6 sm:mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Updated for today
            </p>
            <h2
              id="daily-heading"
              className="mt-1 text-2xl font-extrabold text-[#1E2D4A] sm:text-3xl"
            >
              Today&apos;s NYT Puzzles
            </h2>
          </div>

          <ul className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
            {dailyPuzzles.map(
              ({ href, eyebrow, title, description, Icon, accentBar, iconTint, iconBg, eyebrowTint }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-slate-300 bg-white transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:transform-none"
                  >
                    <span aria-hidden className={`block h-1 w-full ${accentBar}`} />
                    <div className="flex flex-1 flex-col p-6 sm:p-7">
                      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
                        <Icon className={`h-6 w-6 ${iconTint}`} aria-hidden={true} />
                      </div>
                      <p className={`mt-5 text-xs font-semibold uppercase tracking-wider ${eyebrowTint}`}>
                        {eyebrow}
                      </p>
                      <h3 className="mt-1 text-2xl font-bold text-[#1E2D4A]">{title}</h3>
                      <p className="mt-3 flex-1 text-base leading-relaxed text-slate-700">{description}</p>
                      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 group-hover:text-blue-800">
                        Open today&apos;s helper
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden={true} />
                      </span>
                    </div>
                  </Link>
                </li>
              )
            )}
          </ul>
        </section>

        {/* MORE WORD TOOLS */}
        <section
          aria-labelledby="more-heading"
          className="mx-auto max-w-4xl px-4 pb-16 sm:pb-20"
        >
          <div className="mb-6 sm:mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Always available
            </p>
            <h2
              id="more-heading"
              className="mt-1 text-2xl font-extrabold text-[#1E2D4A] sm:text-3xl"
            >
              More Word Tools
            </h2>
            <p className="mt-2 max-w-2xl text-base text-slate-700">
              Crossword clues, scrambled tiles, hangman positions, 5-letter words — pick the solver that matches your puzzle.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {moreTools.map(({ href, title, description, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex h-full flex-col rounded-2xl border-2 border-slate-300 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:transform-none"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Icon className="h-5 w-5 text-blue-700" aria-hidden={true} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#1E2D4A]">{title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-700">{description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 group-hover:text-blue-800">
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden={true} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-xs leading-relaxed text-slate-500">
            GridHint is an independent puzzle helper and is not affiliated with, endorsed by, or sponsored by The New York Times Company.
            &quot;NYT&quot;, &quot;New York Times&quot;, &quot;Connections&quot;, &quot;Wordle&quot;, and &quot;Spelling Bee&quot; are referenced
            descriptively to indicate the puzzles our tools help you solve. All trademarks belong to their respective owners.
          </p>
        </section>
      </div>
    </>
  );
}
