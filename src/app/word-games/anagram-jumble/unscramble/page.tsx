import AnagramSolver from '@/components/word-games/anagram/AnagramSolver';
import { Metadata } from 'next';
import { softwareAppJsonLd } from '@/lib/seo/jsonLd';

export const metadata: Metadata = {
  title: 'Unscramble Letters | Find Words From Scrambled Letters',
  description: 'Enter letters to find every valid word, grouped by length with exact anagrams and common word suggestions.',
  alternates: { canonical: '/word-games/anagram-jumble/unscramble/' }
};

const BASE = 'https://www.gridhint.com';

export default function UnscramblePage() {
  const ld = softwareAppJsonLd({
    name: 'Unscramble Letters',
    description: 'Enter letters to find every valid word, grouped by length with exact anagrams and common word suggestions.',
    breadcrumbs: [
      { name: 'Home', url: BASE },
      { name: 'Word Games', url: `${BASE}/word-games/` },
      { name: 'Anagram and Jumble', url: `${BASE}/word-games/anagram-jumble/` },
      { name: 'Unscramble', url: `${BASE}/word-games/anagram-jumble/unscramble/` },
    ],
  });

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <AnagramSolver
        title="Unscramble Letters"
        subtitle="Enter letters to find every valid word from our dictionary. Results are organized by word length."
        mode="unscramble"
      />
    </div>
  );
}
