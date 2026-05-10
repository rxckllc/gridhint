import Link from 'next/link';
import { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronRight, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Crossword Solver | Find Answers by Clue and Pattern',
  description: 'Solve crossword clues and fill in letter patterns using our free crossword solver with frequency-ranked results.',
  alternates: { canonical: '/crossword/' },
};

export default function CrosswordHubPage() {
  const modes = [
    {
      title: 'Crossword Solver',
      desc: 'Enter a clue and known letters to find ranked crossword answers.',
      href: '/crossword/solver',
      icon: Search,
      color: 'bg-blue-50 text-blue-700',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-16">
      <section className="space-y-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Crossword Helper
        </h1>
        <p className="text-xl md:text-2xl text-slate-700 max-w-2xl mx-auto font-medium">
          Stuck on a crossword clue? Enter the letters you know and the clue text to find the best candidate answers.
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
