import AnagramSolver from '@/components/word-games/anagram/AnagramSolver';
import { Metadata } from 'next';
import { softwareAppJsonLd } from '@/lib/seo/jsonLd';

export const metadata: Metadata = {
  title: 'Word Scrambler | Scramble Words or Unscramble Letters',
  description: 'Scramble a word for practice or enter letters to find valid words and anagrams.',
  alternates: { canonical: '/anagram-jumble/word-scrambler/' }
};

const BASE = 'https://gridhint.com';

export default function WordScramblerPage() {
  const ld = softwareAppJsonLd({
    name: 'Word Scrambler',
    description: 'Scramble a word for practice or enter letters to find valid words and anagrams.',
    breadcrumbs: [
      { name: 'Home', url: BASE },
      { name: 'Word Games', url: `${BASE}/` },
      { name: 'Anagram and Jumble', url: `${BASE}/anagram-jumble/` },
      { name: 'Word Scrambler', url: `${BASE}/anagram-jumble/word-scrambler/` },
    ],
  });

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <AnagramSolver
        title="Word Scrambler"
        subtitle="Need to mix up a word? Enter it below to get multiple scrambled versions instantly."
        mode="scramble"
      />
    </div>
  );
}
