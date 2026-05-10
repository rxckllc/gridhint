import latest from '@/data/generated/connections/latest.json';
import manifest from '@/data/generated/connections/manifest.json';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{
    date: string;
  }>;
}

export async function generateStaticParams() {
  return manifest.dates.map(date => ({ date }));
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  return {
    title: `Connections Answer for ${resolvedParams.date} | GridHint.com`,
    description: `View the fully grouped answers for the Connections puzzle on ${resolvedParams.date}.`,
  };
}

export default async function ConnectionsAnswerPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  // TODO: When archive grows, switch to a build-time import map keyed by date.
  // For now, only the latest date is supported; any other date 404s.
  if (resolvedParams.date !== latest.date) {
    notFound();
  }

  const typedLatest = latest as any;

  const difficultyColors: Record<string, string> = {
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    green: "bg-green-100 text-green-800 border-green-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200"
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-12">
      <header className="space-y-6">
        <Link 
          href={`/connections/hints/${resolvedParams.date}`} 
          className="inline-flex items-center gap-2 text-blue-700 font-bold hover:underline underline-offset-4"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Hints
        </Link>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Connections Answer: {resolvedParams.date}
        </h1>
        <p className="text-xl text-slate-700">
          The following groups and categories are the reviewed solution for today's puzzle.
        </p>
      </header>

      <div className="grid gap-8">
        {typedLatest.groups.map((group: any) => (
          <Card key={group.difficulty} className="border-2 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className={`${difficultyColors[group.difficulty]} py-6 border-b-2`}>
              <CardTitle className="text-2xl font-black uppercase tracking-widest flex justify-between items-center">
                <span>{group.category}</span>
                <Badge variant="outline" className="font-bold border-current text-lg">
                  {group.difficulty}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 bg-white">
              <div className="flex flex-wrap gap-4">
                {group.words.map((word: string) => (
                  <div key={word} className="px-6 py-4 bg-slate-900 text-white rounded-xl text-2xl font-black tracking-widest border-2 border-slate-900">
                    {word}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="pt-12 border-t-2 border-slate-200 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Need more help?</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/connections/archive" className="h-14 px-8 bg-slate-100 text-slate-900 text-lg font-bold rounded-xl border-2 border-slate-300 hover:bg-slate-200 transition-colors flex items-center justify-center">
            Browse Archive
          </Link>
          <Link href="/wordle-solver" className="h-14 px-8 bg-blue-700 text-white text-lg font-bold rounded-xl hover:bg-blue-800 transition-colors flex items-center justify-center">
            Wordle Solver
          </Link>
        </div>
      </section>
    </div>
  );
}
