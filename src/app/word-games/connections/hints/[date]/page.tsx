import latest from '@/data/generated/connections/latest.json';
import manifest from '@/data/generated/connections/manifest.json';
import ConnectionsHintCards from '@/components/word-games/connections/ConnectionsHintCards';
import { Card } from '@/components/ui/card';
import { notFound } from 'next/navigation';

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
    title: `Connections Hints for ${resolvedParams.date} | GridHint.com`,
    description: `Progressive Connections hints for the puzzle on ${resolvedParams.date}.`,
  };
}

export default async function ConnectionsDateHintsPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  // TODO: When archive grows, switch to a build-time import map keyed by date.
  // For now, only the latest date is supported; any other date 404s.
  if (resolvedParams.date !== latest.date) {
    notFound();
  }

  const typedLatest = latest as any;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-12">
      <section className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Connections Hints: {resolvedParams.date}
        </h1>
        <p className="text-xl text-slate-700">
          Progressive clues for the Connections puzzle on {resolvedParams.date}.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-slate-300 pb-2">Puzzle Grid</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {typedLatest.grid.map((word: string) => (
            <Card key={word} className="p-4 sm:p-6 text-center border-2 border-slate-300 rounded-xl bg-white">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider">
                {word}
              </span>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-12">
        <ConnectionsHintCards date={typedLatest.date} groups={typedLatest.groups} />
      </div>
    </div>
  );
}
