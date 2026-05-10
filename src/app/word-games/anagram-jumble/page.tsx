import Link from 'next/link';
import { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronRight, Shuffle, ArrowLeftRight, Layers, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Anagram and Jumble Solver | Unscramble Any Word',
  description: 'Unscramble letters, find anagrams, descramble jumbled words, and create word scrambles. Free tools for puzzle lovers.',
  alternates: { canonical: '/word-games/anagram-jumble/' },
};

export default function AnagramJumbleHubPage() {
  const modes = [
    {
      title: 'Unscramble Words',
      desc: 'Turn scrambled letters into valid words, grouped by length.',
      href: '/word-games/anagram-jumble/unscramble',
      icon: Shuffle,
      color: 'bg-purple-50 text-purple-700',
    },
    {
      title: 'Word Descrambler',
      desc: 'Decode jumbled text back into real dictionary words instantly.',
      href: '/word-games/anagram-jumble/word-descrambler',
      icon: ArrowLeftRight,
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      title: 'Word Scrambler',
      desc: 'Scramble any word or phrase to create a custom puzzle for others.',
      href: '/word-games/anagram-jumble/word-scrambler',
      icon: Layers,
      color: 'bg-pink-50 text-pink-700',
    },
    {
      title: 'Anagram Solver',
      desc: 'Find exact anagrams, partial matches, and every word hiding in your letters.',
      href: '/word-games/anagram-jumble/anagram-solver',
      icon: Search,
      color: 'bg-blue-50 text-blue-700',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-16">
      <section className="space-y-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Anagram and Jumble Solver
        </h1>
        <p className="text-xl md:text-2xl text-slate-700 max-w-2xl mx-auto font-medium">
          Every tool you need to unscramble letters, solve jumbles, and find hidden anagrams in any word or phrase.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {modes.map((mode) => (
          <Link key={mode.title} href={mode.href} className="group">
            <Card className="h-full border-2 border-slate-300 rounded-2xl p-8 hover:border-blue-700 hover:shadow-md transition-all">
              <div className={`${mode.color} w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:opacity-80 transition-opacity`}>
                <mode.icon className="w-10 h-10" />
              </div>
              <CardHeader className="p-0 space-y-3">
                <CardTitle className="text-3xl font-bold text-blue-900 group-hover:underline underline-offset-4">{mode.title}</CardTitle>
                <CardDescription className="text-xl text-slate-700 font-medium leading-relaxed">
                  {mode.desc}
                </CardDescription>
              </CardHeader>
              <div className="mt-8 flex items-center gap-2 text-blue-700 font-bold text-lg">
                <span>Open Tool</span>
                <ChevronRight className="w-6 h-6" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
