import latest from '@/data/generated/spelling-bee/latest.json';
import { type SpellingBeeDaily } from '@/lib/puzzles/spelling-bee-schema';
import { Metadata } from 'next';
import Link from 'next/link';
import SpellingBeeTodayClient from '@/components/word-games/spelling-bee/SpellingBeeTodayClient';

export const metadata: Metadata = {
  title: "Today's NYT Spelling Bee Hints, Letters & Pangram Helper | GridHint",
  description:
    "Today's NYT Spelling Bee letters, pangram count, length distribution, and a guess-checker. We won't spoil the answer list — test your words against today's puzzle.",
  alternates: { canonical: '/word-games/spelling-bee/today/' },
};

export default function SpellingBeeTodayPage() {
  const puzzle = latest as unknown as SpellingBeeDaily;

  const todayET = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const isStale = puzzle.date !== todayET;

  // Sort length distribution keys numerically
  const lengthEntries = Object.entries(puzzle.hints.lengthDistribution)
    .map(([k, v]) => [Number(k), v as number] as const)
    .sort(([a], [b]) => a - b);

  const startingEntries = Object.entries(puzzle.hints.startingLetterDistribution)
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 space-y-12">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
          Today&apos;s NYT Spelling Bee
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Today&apos;s Spelling Bee Hints &amp; Helper
        </h1>
        <p className="text-xl text-slate-700 font-medium leading-relaxed">
          Today&apos;s 7 letters, total word count, pangram count, and a guess-checker — find words yourself with smart hints, no spoilers.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-700 font-bold uppercase tracking-widest text-sm">
          <span>Date: {puzzle.date}</span>
          <span aria-hidden="true">•</span>
          <span>{puzzle.hints.totalWords} words to find</span>
        </div>
        {isStale && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900 font-bold">
            Today&apos;s Spelling Bee hasn&apos;t been published yet. Showing data for {puzzle.date}.
          </div>
        )}
      </section>

      <SpellingBeeTodayClient
        centerLetter={puzzle.centerLetter}
        outerLetters={puzzle.outerLetters}
        answerHashes={puzzle.answerHashes}
        pangramHashes={puzzle.pangramHashes}
        totalWords={puzzle.hints.totalWords}
        pangramCount={puzzle.hints.pangramCount}
        geniusThreshold={puzzle.hints.geniusThreshold}
        queenBeeScore={puzzle.hints.queenBeeScore}
      />

      <section className="space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-900 border-b-4 border-slate-300 pb-2">
          Word Length Distribution
        </h2>
        <p className="text-lg text-slate-700">How many valid words exist for each length:</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {lengthEntries.map(([len, count]) => (
            <div key={len} className="bg-white border-2 border-slate-300 rounded-xl p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{len} letters</p>
              <p className="text-2xl font-extrabold text-amber-700 mt-1">{count}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-900 border-b-4 border-slate-300 pb-2">
          Starting Letter Distribution
        </h2>
        <p className="text-lg text-slate-700">How many valid words start with each letter:</p>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
          {startingEntries.map(([letter, count]) => (
            <div key={letter} className="bg-white border-2 border-slate-300 rounded-xl p-4 text-center">
              <p className="text-xl font-extrabold text-slate-900">{letter}</p>
              <p className="text-2xl font-extrabold text-amber-700 mt-1">{count as number}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 pt-8 border-t-2 border-slate-200">
        <h2 className="text-2xl font-extrabold text-slate-900">Want a different solver?</h2>
        <p className="text-lg text-slate-700">
          The <Link href="/word-games/spelling-bee/helper" className="text-blue-700 hover:text-blue-900 underline underline-offset-4 font-bold">general Spelling Bee Helper</Link> works with any 7 letters — useful for older puzzles or your own letter sets.
        </p>
      </section>

      <div className="bg-slate-900 text-white p-6 rounded-2xl mt-12">
        <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Disclaimer</p>
        <p className="text-sm leading-relaxed">
          GridHint is an independent puzzle helper and is not affiliated with, endorsed by, or sponsored by The New York Times Company. We provide only metadata hints (letter set, counts, distributions) and a private client-side guess-checker — we do not republish today&apos;s answer list.
        </p>
      </div>
    </div>
  );
}
