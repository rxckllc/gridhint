import WordLadderSolver from '@/components/word-games/word-ladder/WordLadderSolver';
import { Metadata } from 'next';
import { softwareAppJsonLd } from '@/lib/seo/jsonLd';

export const metadata: Metadata = {
  title: 'Word Ladder Solver | Find the Shortest Word Path',
  description: 'Enter a start word and end word to find the shortest word ladder where each step changes one letter.',
  alternates: { canonical: '/word-games/word-ladder/solver/' }
};

const BASE = 'https://www.gridhint.com';

export default function WordLadderSolverPage() {
  const ld = softwareAppJsonLd({
    name: 'Word Ladder Solver',
    description: 'Enter a start word and end word to find the shortest word ladder where each step changes one letter.',
    breadcrumbs: [
      { name: 'Home', url: BASE },
      { name: 'Word Games', url: `${BASE}/word-games/` },
      { name: 'Word Ladder', url: `${BASE}/word-games/word-ladder/` },
      { name: 'Solver', url: `${BASE}/word-games/word-ladder/solver/` },
    ],
  });

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="space-y-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Word Ladder Solver
        </h1>
        <p className="text-xl md:text-2xl text-slate-700 max-w-2xl mx-auto font-medium">
          Find the shortest path between any two words by changing one letter at a time.
        </p>
      </section>

      <WordLadderSolver />
    </div>
  );
}
