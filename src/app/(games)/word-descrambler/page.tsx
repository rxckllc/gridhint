import AnagramSolver from '@/components/word-games/anagram/AnagramSolver';
import { Metadata } from 'next';
import { softwareAppJsonLd } from '@/lib/seo/jsonLd';

export const metadata: Metadata = {
  title: 'Word Descrambler | Decode Scrambled Letters Into Words',
  description: 'Paste scrambled letters and find possible words instantly. Results are grouped by length with exact and partial matches.',
  alternates: { canonical: '/anagram-jumble/word-descrambler/' }
};

const BASE = 'https://gridhint.com';

export default function WordDescramblerPage() {
  const ld = softwareAppJsonLd({
    name: 'Word Descrambler',
    description: 'Paste scrambled letters and find possible words instantly. Results are grouped by length with exact and partial matches.',
    breadcrumbs: [
      { name: 'Home', url: BASE },
      { name: 'Word Games', url: `${BASE}/` },
      { name: 'Anagram and Jumble', url: `${BASE}/anagram-jumble/` },
      { name: 'Word Descrambler', url: `${BASE}/anagram-jumble/word-descrambler/` },
    ],
  });

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <AnagramSolver
        title="Word Descrambler"
        subtitle="Turn jumbled letters back into valid dictionary words. Organized by length for easy solving."
        mode="unscramble"
        defaultOptions={{ minLength: 3 }}
      />
    </div>
  );
}
