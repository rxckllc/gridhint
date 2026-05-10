import WordLadderSolver from '@/components/word-games/word-ladder/WordLadderSolver';
import { Metadata } from 'next';
import { softwareAppJsonLd } from '@/lib/seo/jsonLd';

export const metadata: Metadata = {
  title: 'Word Ladder Solver | Find the Shortest Word Path',
  description: 'Enter a start word and end word to find the shortest word ladder where each step changes one letter.',
  alternates: { canonical: '/word-ladder/solver/' }
};

const BASE = 'https://gridhint.com';

export default function WordLadderSolverPage() {
  const ld = softwareAppJsonLd({
    name: 'Word Ladder Solver',
    description: 'Enter a start word and end word to find the shortest word ladder where each step changes one letter.',
    breadcrumbs: [
      { name: 'Home', url: BASE },
      { name: 'Word Games', url: `${BASE}/` },
      { name: 'Word Ladder', url: `${BASE}/word-ladder/` },
      { name: 'Solver', url: `${BASE}/word-ladder/solver/` },
    ],
  });

  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Solve a Word Ladder Puzzle",
    "description": "Learn how to step from a starting word to an ending word by changing exactly one letter at a time, ensuring every intermediate step is a valid dictionary word.",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Identify Start and End Words",
        "text": "Check your puzzle for the beginning and ending words. Ensure they are exactly the same length."
      },
      {
        "@type": "HowToStep",
        "name": "Look for Shared Letters",
        "text": "Identify any letters in the starting word that are already in the correct position for the ending word."
      },
      {
        "@type": "HowToStep",
        "name": "Change One Letter at a Time",
        "text": "Modify exactly one letter of the current word to form a new, valid dictionary word that brings you closer to the target."
      }
    ]
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
      <section className="space-y-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Word Ladder Solver
        </h1>
        <p className="text-xl md:text-2xl text-slate-700 max-w-2xl mx-auto font-medium">
          A Word Ladder Solver finds the shortest sequence of single-letter changes between two words. Find the shortest path between any two words by changing one letter at a time.
        </p>
      </section>

      <WordLadderSolver />

      <section className="space-y-6 mt-16 pt-12 border-t-4 border-slate-300">
        <h2 className="text-3xl font-extrabold text-slate-900">How Word Ladders Work</h2>
        <div className="prose prose-slate max-w-none text-lg text-slate-800 leading-relaxed space-y-4">
          <p>
            A Word Ladder, also known as a doublets, word-links, or word golf puzzle, is a classic word game invented by Lewis Carroll in 1877. The objective is simple but the execution can be devilishly difficult: you must transform a starting word into a target word by changing exactly one letter at a time.
          </p>
          <p>
            The cardinal rule of the game is that <strong>every intermediate step must be a valid dictionary word</strong>. For example, to go from COLD to WARM, you might transition through COLD &rarr; CORD &rarr; CARD &rarr; WARD &rarr; WARM. You cannot use nonsense words or proper nouns as stepping stones.
          </p>
          <h3 className="text-2xl font-bold mt-8">Strategies for Solving Word Ladders</h3>
          <p>
            When tackling a difficult word ladder, start by comparing the first and last words. Note which letters need to change and which (if any) can remain the same. A common strategy is to work backwards from the target word, as the constraints often feel tighter at the end of the sequence.
          </p>
          <p>
            Look for "hub words" — words that have many valid anagrams or single-letter replacements. Words ending in common suffixes like -ING, -ERS, or -EST, or words with flexible vowel centers (like CAT, COT, CUT) make excellent stepping stones. If you find yourself stuck in a loop, you may need to entirely change a vowel or consonant that you previously thought was correct in order to unlock a new pathway of valid dictionary words.
          </p>
          <p>
            Our automated Word Ladder Solver uses a sophisticated Breadth-First Search (BFS) algorithm to mathematically guarantee the absolute shortest possible path between your two chosen words. It scans a comprehensive dictionary of valid English words, building out a tree of every possible valid next step until it connects with your destination.
          </p>
        </div>
      </section>
    </div>
  );
}
