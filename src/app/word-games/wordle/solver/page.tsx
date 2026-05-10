import WordleSolver from '@/components/word-games/wordle/WordleSolver';
import { Metadata } from 'next';
import { softwareAppJsonLd } from '@/lib/seo/jsonLd';

export const metadata: Metadata = {
  title: 'Wordle Solver | Best Next Guess and Possible Answers',
  description: 'Enter green, yellow, and gray feedback to filter possible Wordle answers and rank the best next guess by information gain.',
  alternates: { canonical: '/word-games/wordle/solver/' }
};

const BASE = 'https://www.gridhint.com';

export default function WordleSolverPage() {
  const ld = softwareAppJsonLd({
    name: 'Wordle Solver',
    description: 'Enter green, yellow, and gray feedback to filter possible Wordle answers and rank the best next guess by information gain.',
    breadcrumbs: [
      { name: 'Home', url: BASE },
      { name: 'Word Games', url: `${BASE}/word-games/` },
      { name: 'Wordle', url: `${BASE}/word-games/wordle/` },
      { name: 'Solver', url: `${BASE}/word-games/wordle/solver/` },
    ],
  });

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="space-y-6">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Wordle Solver
        </h1>
        <p className="text-xl md:text-2xl text-slate-700 font-medium">
          Stuck on Wordle? Enter your guesses and tile colors below to find the most likely answers and the mathematically best next guess.
        </p>
      </section>

      <WordleSolver />
    </div>
  );
}
