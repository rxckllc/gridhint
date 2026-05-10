import latest from '@/data/generated/connections/latest.json';
import ConnectionsHintCards from '@/components/word-games/connections/ConnectionsHintCards';
import { Card } from '@/components/ui/card';
import { Metadata } from 'next';
import { type ConnectionsPuzzle, shuffleGrid } from '@/lib/puzzles/connections';

export const metadata: Metadata = {
  title: 'Connections Hints for Today | GridHint.com',
  description: 'Progressive Connections hints for today. Reveal one clue at a time without jumping straight to the full answer.',
  alternates: { canonical: '/word-games/connections/hints/' }
};

export default function ConnectionsHintsPage() {
  // `as unknown as ConnectionsPuzzle` is intentional: JSON imports are typed as the
  // literal JSON shape which TypeScript can't narrow to the strict Zod-derived type
  // (e.g. sourceMode is inferred as a string literal, status as string).
  const puzzle = latest as unknown as ConnectionsPuzzle;

  // Deterministically shuffle the grid based on the date so it's not pre-grouped
  const shuffledGrid = shuffleGrid(puzzle.grid, puzzle.date);

  const todayET = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const isStale = puzzle.date !== todayET;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-12">
      <section className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Connections Hints for Today
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-700 font-bold uppercase tracking-widest text-base">
          <span>Date: {puzzle.date}</span>
          <span className="hidden sm:inline" aria-hidden="true">•</span>
          <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-lg border-2 border-blue-200">
            Independent Helper
          </span>
        </div>
        {isStale && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900 font-bold">
            Today's puzzle hasn't been published yet. Showing hints for {puzzle.date}.
          </div>
        )}
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-extrabold text-slate-900 border-b-4 border-slate-300 pb-2">Today's Grid</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {shuffledGrid.map((word, index) => (
            <Card key={`${word}-${index}`} className="p-5 sm:p-8 text-center border-2 border-slate-400 rounded-2xl bg-white shadow-md">
              <span className="text-xl sm:text-3xl font-black text-slate-900 tracking-widest uppercase">
                {word}
              </span>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-16 pt-12 border-t-4 border-slate-300">
        <h2 className="text-3xl font-extrabold text-slate-900 border-b-4 border-slate-300 pb-2">Progressive Hints</h2>
        <p className="text-xl text-slate-700 mt-6 font-medium">
          Get just enough help to solve the puzzle yourself. Reveal one level at a time.
        </p>
        <ConnectionsHintCards date={puzzle.date} groups={puzzle.groups} />
      </div>

      <section className="pt-16 border-t-4 border-slate-300 space-y-8">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">How to use these hints</h2>
        <div className="prose prose-slate max-w-none text-xl text-slate-800 leading-relaxed space-y-6">
          <p>
            Stuck on today's Connections puzzle? Our helper provides a "reveal ladder" designed for players who want a nudge, not a spoiler. 
          </p>
          <ul className="list-disc pl-8 space-y-4 font-medium">
            <li><strong>Hint 1 & 2:</strong> Vague associations and wordplay clues to get you thinking.</li>
            <li><strong>Category:</strong> Tells you the relationship between the four words.</li>
            <li><strong>The Words:</strong> Shows the full group if you're completely stumped.</li>
          </ul>
        </div>
      </section>

    </div>
  );
}
