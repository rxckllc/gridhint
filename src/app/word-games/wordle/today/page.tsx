import latest from '@/data/generated/wordle/latest.json';
import { type WordleDaily } from '@/lib/puzzles/wordle-schema';
import { Metadata } from 'next';
import Link from 'next/link';
import WordleAnswerReveal from '@/components/word-games/wordle/WordleAnswerReveal';

export const metadata: Metadata = {
  title: "Today's NYT Wordle Hints & Answer | GridHint",
  description:
    "Today's NYT Wordle hints and answer — start with progressive clues (first letter, pattern, definition) before revealing the full solution.",
  alternates: { canonical: '/word-games/wordle/today/' },
};

export default function WordleTodayPage() {
  const puzzle = latest as unknown as WordleDaily;

  const todayET = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const isStale = puzzle.date !== todayET;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 space-y-12">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Today&apos;s NYT Wordle
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Today&apos;s Wordle Hints &amp; Answer
        </h1>
        <p className="text-xl text-slate-700 font-medium leading-relaxed">
          Stuck on today&apos;s New York Times Wordle? Reveal one hint at a time, or jump straight to the answer.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-700 font-bold uppercase tracking-widest text-sm">
          <span>Date: {puzzle.date}</span>
          {puzzle.dayNumber !== undefined && (
            <>
              <span aria-hidden="true">•</span>
              <span>Wordle #{puzzle.dayNumber}</span>
            </>
          )}
        </div>
        {isStale && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900 font-bold">
            Today&apos;s Wordle hasn&apos;t been published yet. Showing data for {puzzle.date}.
          </div>
        )}
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-900 border-b-4 border-slate-300 pb-2">
          Progressive Hints
        </h2>

        <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 space-y-3">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Hint 1 — First Letter</p>
          <p className="text-3xl font-extrabold text-emerald-700">
            Today&apos;s answer starts with <span className="text-slate-900">{puzzle.hints.firstLetter}</span>
          </p>
        </div>

        <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 space-y-3">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Hint 2 — Letter Pattern</p>
          <p className="text-2xl font-bold text-slate-900">
            Vowel/consonant pattern: <span className="font-mono text-emerald-700">{puzzle.hints.pattern}</span>
          </p>
          <p className="text-base text-slate-600">
            (V = vowel, C = consonant)
          </p>
        </div>

        <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 space-y-3">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Hint 3 — Definition</p>
          <p className="text-xl text-slate-900 leading-relaxed">
            {puzzle.hints.definition}
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-900 border-b-4 border-slate-300 pb-2">
          Today&apos;s Wordle Answer
        </h2>
        <WordleAnswerReveal solution={puzzle.solution} />
      </section>

      <section className="space-y-4 pt-8 border-t-2 border-slate-200">
        <h2 className="text-2xl font-extrabold text-slate-900">Want to solve it yourself?</h2>
        <p className="text-lg text-slate-700">
          Use our <Link href="/word-games/wordle/solver" className="text-blue-700 hover:text-blue-900 underline underline-offset-4 font-bold">Wordle Solver</Link> to narrow down possibilities from your green and yellow letters.
        </p>
      </section>

      <div className="bg-slate-900 text-white p-6 rounded-2xl mt-12">
        <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Disclaimer</p>
        <p className="text-sm leading-relaxed">
          GridHint is an independent puzzle helper and is not affiliated with, endorsed by, or sponsored by The New York Times Company. Wordle is a trademark of The New York Times Company.
        </p>
      </div>
    </div>
  );
}
