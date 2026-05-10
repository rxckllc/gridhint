import HangmanSolver from '@/components/word-games/hangman/HangmanSolver';
import { Metadata } from 'next';
import { softwareAppJsonLd } from '@/lib/seo/jsonLd';

export const metadata: Metadata = {
  title: 'Hangman Solver | Best Next Letter and Possible Words',
  description: 'Enter your Hangman pattern and wrong letters to find possible words and the best next letter to guess.',
  alternates: { canonical: '/word-games/hangman/solver/' }
};

const BASE = 'https://www.gridhint.com';

export default function HangmanSolverPage() {
  const ld = softwareAppJsonLd({
    name: 'Hangman Solver',
    description: 'Enter your Hangman pattern and wrong letters to find possible words and the best next letter to guess.',
    breadcrumbs: [
      { name: 'Home', url: BASE },
      { name: 'Word Games', url: `${BASE}/word-games/` },
      { name: 'Hangman', url: `${BASE}/word-games/hangman/` },
      { name: 'Solver', url: `${BASE}/word-games/hangman/solver/` },
    ],
  });

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="space-y-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Hangman Solver
        </h1>
        <p className="text-xl md:text-2xl text-slate-700 max-w-2xl mx-auto font-medium">
          Win every game of Hangman. Enter your current progress and wrong guesses to see every possible word and the safest next move.
        </p>
      </section>

      <HangmanSolver />
    </div>
  );
}
