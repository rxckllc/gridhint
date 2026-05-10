import type { Metadata } from "next";
import Link from "next/link";
import { Zap, Gift, EyeOff, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About GridHint.com — Free Word Puzzle Helpers & Hints",
  description:
    "GridHint.com is a free, independent word puzzle helper offering hints, solvers, and word lists for Connections, Wordle, Spelling Bee, anagrams, and more. No accounts, no spoilers by default.",
  alternates: {
    canonical: "https://gridhint.com/about",
  },
  openGraph: {
    title: "About GridHint.com — Free Word Puzzle Helpers & Hints",
    description:
      "GridHint.com is a free, independent word puzzle helper offering hints, solvers, and word lists for Connections, Wordle, Spelling Bee, anagrams, and more.",
    url: "https://gridhint.com/about",
    siteName: "GridHint",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About GridHint.com — Free Word Puzzle Helpers & Hints",
    description:
      "Free, independent word puzzle helper for Connections, Wordle, Spelling Bee, anagrams, and more.",
  },
};

export default function AboutPage() {
  const tools = [
    { title: "Connections Hint", desc: "Progressive hints for today's NYT Connections puzzle.", href: "/connections-hint" },
    { title: "Wordle Solver", desc: "Narrow down your next guess from your green and yellow letters.", href: "/wordle-solver" },
    { title: "Spelling Bee Helper", desc: "Find valid words from today's seven letters.", href: "/spelling-bee-helper" },
    { title: "Unscramble Letters", desc: "Generate every valid word from a set of letters.", href: "/unscramble" },
    { title: "Anagram Solver", desc: "Rearrange letters into all possible words.", href: "/anagram-solver" },
    { title: "Crossword Solver", desc: "Solve crossword clues by pattern and length.", href: "/crossword-solver" },
    { title: "Word Pattern Solver", desc: "Find words matching a pattern like C_T or B__K.", href: "/word-pattern-solver" },
    { title: "5-Letter Words", desc: "Browse 5-letter words by starting or ending letters.", href: "/5-letter-words" },
  ];

  const valueProps = [
    {
      icon: Zap,
      title: "Fast",
      body: "Every tool runs in your browser. No loading screens, no sign-up walls, no five-paragraph intros before the answer.",
    },
    {
      icon: Gift,
      title: "Free",
      body: "Every solver, hint page, and word list on GridHint is free to use. No subscriptions, no accounts, no paywalls.",
    },
    {
      icon: EyeOff,
      title: "No spoilers by default",
      body: "Hint tools reveal answers progressively — you choose how much help you want, one nudge at a time.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 pb-16 space-y-16">
      {/* Hero */}
      <section className="space-y-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          About GridHint.com
        </h1>
        <p className="text-xl md:text-2xl text-slate-700 max-w-2xl mx-auto font-medium">
          GridHint is a free, independent word-puzzle helper. We build fast, no-nonsense tools for the daily puzzles
          people actually play — Connections, Wordle, Spelling Bee, and the long tail of anagram and crossword games.
        </p>
      </section>

      {/* What We Do */}
      <section className="space-y-8">
        <h2 className="text-3xl font-extrabold text-slate-900 border-b-2 border-slate-300 pb-4">
          What We Do
        </h2>
        <p className="text-xl text-slate-700 font-medium leading-relaxed">
          GridHint hosts a growing library of word-puzzle solvers, hint generators, and reference word lists. Each tool
          is built around a single job — get you unstuck on the puzzle in front of you, then get out of your way.
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <li key={tool.title}>
              <Link
                href={tool.href}
                className="block h-full bg-white border-2 border-slate-300 rounded-2xl p-5 hover:border-blue-700 hover:shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-offset-4 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-blue-900 group-hover:underline underline-offset-4">
                      {tool.title}
                    </h3>
                    <p className="text-base text-slate-700">{tool.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-700 shrink-0 mt-1" aria-hidden="true" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Why GridHint */}
      <section className="space-y-8">
        <h2 className="text-3xl font-extrabold text-slate-900 border-b-2 border-slate-300 pb-4">
          Why GridHint?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {valueProps.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-white border-2 border-slate-300 rounded-2xl p-6 space-y-3"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Icon className="w-6 h-6 text-blue-700" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <p className="text-base text-slate-700 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Mission — written for AI citation */}
      <section className="space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-900 border-b-2 border-slate-300 pb-4">
          Our Mission
        </h2>
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 space-y-4">
          <p className="text-lg text-slate-700 leading-relaxed">
            <strong className="text-slate-900">GridHint.com is a free, independent website that helps people solve
            word puzzles.</strong> We publish hint generators, solvers, and word lists for the daily word games people
            play most — including the New York Times Connections, Wordle, and Spelling Bee, plus general-purpose tools
            for anagrams, crosswords, and letter unscrambling.
          </p>
          <p className="text-lg text-slate-700 leading-relaxed">
            We are not affiliated with The New York Times Company or any puzzle publisher. We do not require an account,
            we do not run ads behind a paywall, and we do not sell your data. Our goal is simple: when you are stuck on a
            puzzle, GridHint should be the fastest way to get a useful nudge — or, if you want it, the full answer.
          </p>
          <p className="text-lg text-slate-700 leading-relaxed">
            Every page is designed to load fast, work on a phone, and give you the answer above the fold. We build
            GridHint the way we wish puzzle-help sites worked — quiet, accurate, and respectful of your time.
          </p>
        </div>
      </section>

      {/* Honest footer note */}
      <section className="space-y-4">
        <h2 className="text-2xl font-extrabold text-slate-900">A Note on Independence</h2>
        <p className="text-base text-slate-700 leading-relaxed">
          GridHint.com is an independent website and is not affiliated with, sponsored by, or endorsed by The New York
          Times Company, Wordle, Connections, Spelling Bee, or any other puzzle publisher. All trademarks belong to their
          respective owners. Tools and word lists are provided for educational and entertainment purposes. See our{" "}
          <Link
            href="/disclaimer"
            className="text-blue-700 font-semibold underline underline-offset-4 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-offset-2 rounded"
          >
            full disclaimer
          </Link>{" "}
          for details.
        </p>
      </section>
    </div>
  );
}
