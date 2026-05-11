import AnagramSolver from '@/components/word-games/anagram/AnagramSolver';
import { Metadata } from 'next';
import { softwareAppJsonLd } from '@/lib/seo/jsonLd';

export const metadata: Metadata = {
  title: 'Anagram Solver | Find Exact and Partial Anagrams',
  description: 'Find exact anagrams, partial anagrams, and words made from your letters.',
  alternates: { canonical: '/anagram-jumble/anagram-solver/' }
};

const BASE = 'https://gridhint.com';

export default function AnagramSolverPage() {
  const ld = softwareAppJsonLd({
    name: 'Anagram Solver',
    description: 'Find exact anagrams, partial anagrams, and words made from your letters.',
    breadcrumbs: [
      { name: 'Home', url: BASE },
      { name: 'Word Games', url: `${BASE}/` },
      { name: 'Anagram and Jumble', url: `${BASE}/anagram-jumble/` },
      { name: 'Anagram Solver', url: `${BASE}/anagram-jumble/anagram-solver/` },
    ],
  });

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <AnagramSolver
        title="Anagram Solver"
        subtitle="Find every possible anagram for a word or phrase. Toggle 'Exact Only' to find perfect matches."
        mode="unscramble"
        defaultOptions={{ exactOnly: true }}
      />
    </div>
  );
}
