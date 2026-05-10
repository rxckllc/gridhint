import SpellingBeeHelper from '@/components/word-games/spelling-bee/SpellingBeeHelper';
import { Metadata } from 'next';
import { softwareAppJsonLd } from '@/lib/seo/jsonLd';

export const metadata: Metadata = {
  title: 'Spelling Bee Helper | Find Words and Pangrams',
  description: 'Enter a center letter and six outer letters to find valid words, pangrams, and hint counts for a 7-letter word game.',
  alternates: { canonical: '/spelling-bee/helper/' }
};

const BASE = 'https://gridhint.com';

export default function SpellingBeeHelperPage() {
  const ld = softwareAppJsonLd({
    name: 'Spelling Bee Helper',
    description: 'Enter a center letter and six outer letters to find valid words, pangrams, and hint counts for a 7-letter word game.',
    breadcrumbs: [
      { name: 'Home', url: BASE },
      { name: 'Word Games', url: `${BASE}/` },
      { name: 'Spelling Bee', url: `${BASE}/spelling-bee/` },
      { name: 'Helper', url: `${BASE}/spelling-bee/helper/` },
    ],
  });

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="space-y-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Spelling Bee Helper
        </h1>
        <p className="text-xl md:text-2xl text-slate-700 max-w-2xl mx-auto font-medium">
          Get help finding all valid words and pangrams for today's Spelling Bee hive.
        </p>
      </section>

      <SpellingBeeHelper />
    </div>
  );
}
