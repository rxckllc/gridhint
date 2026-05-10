import CrosswordSolver from '@/components/word-games/crossword/CrosswordSolver';
import { Metadata } from 'next';
import { softwareAppJsonLd } from '@/lib/seo/jsonLd';

export const metadata: Metadata = {
  title: 'Crossword Solver | Find Answers by Clue and Pattern',
  description: 'Enter a crossword clue, known letters, and word length to find likely crossword answers ranked by pattern and commonness.',
  alternates: { canonical: '/word-games/crossword/solver/' }
};

const BASE = 'https://www.gridhint.com';

export default function CrosswordSolverPage() {
  const ld = softwareAppJsonLd({
    name: 'Crossword Solver',
    description: 'Enter a crossword clue, known letters, and word length to find likely crossword answers ranked by pattern and commonness.',
    breadcrumbs: [
      { name: 'Home', url: BASE },
      { name: 'Word Games', url: `${BASE}/word-games/` },
      { name: 'Crossword', url: `${BASE}/word-games/crossword/` },
      { name: 'Solver', url: `${BASE}/word-games/crossword/solver/` },
    ],
  });

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="space-y-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Crossword Solver
        </h1>
        <p className="text-xl md:text-2xl text-slate-700 max-w-2xl mx-auto font-medium">
          Find missing crossword answers using our powerful pattern and clue solver.
        </p>
      </section>

      <CrosswordSolver />
    </div>
  );
}
