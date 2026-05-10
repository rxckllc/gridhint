import latest from '@/data/generated/connections/latest.json';
import ConnectionsHintCards from '@/components/word-games/connections/ConnectionsHintCards';
import { Card } from '@/components/ui/card';
import { Metadata } from 'next';
import { type ConnectionsPuzzle, shuffleGrid } from '@/lib/puzzles/connections';
import fs from 'fs';
import path from 'path';

export const metadata: Metadata = {
  title: 'Connections Hints for Today | GridHint.com',
  description: 'Progressive Connections hints for today. Reveal one clue at a time without jumping straight to the full answer.',
  alternates: { canonical: '/connections/hints/' },
  openGraph: {
    title: 'Connections Hints for Today | GridHint.com',
    description: 'Progressive Connections hints for today. Reveal one clue at a time without jumping straight to the full answer.',
    images: ['https://gridhint.com/gridhint-logo.png'],
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Connections Hints for Today | GridHint.com',
    description: 'Progressive Connections hints for today. Reveal one clue at a time without jumping straight to the full answer.',
    images: ['https://gridhint.com/gridhint-logo.png'],
  },
};

export default function ConnectionsHintsPage() {
  const puzzle = latest as unknown as ConnectionsPuzzle;
  const shuffledGrid = shuffleGrid(puzzle.grid, puzzle.date);

  const todayET = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const isStale = puzzle.date !== todayET;

  let dateModified = new Date().toISOString();
  try {
    if (isStale) {
      dateModified = `${puzzle.date}T12:00:00Z`;
    } else {
      const manifestPath = path.join(process.cwd(), 'src/data/generated/connections/manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      dateModified = new Date(manifest.updatedAt).toISOString();
    }
  } catch (e) {
    dateModified = `${puzzle.date}T12:00:00Z`;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://gridhint.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Connections Hints",
            "item": "https://gridhint.com/connections/hints/"
          }
        ]
      },
      {
        "@type": "Article",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": "https://gridhint.com/connections/hints/"
        },
        "headline": `NYT Connections Hints and Answer for ${puzzle.date}`,
        "articleSection": "Games",
        "inLanguage": "en-US",
        "image": "https://gridhint.com/gridhint-logo.png",
        "datePublished": `${puzzle.date}T00:00:00-04:00`,
        "dateModified": dateModified,
        "author": {
          "@id": "https://gridhint.com/#organization"
        },
        "publisher": {
          "@id": "https://gridhint.com/#organization"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `How do Connections hints work?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Our hints use a progressive reveal system. You can request vague associations and wordplay clues to get you thinking without spoiling the answer. If you are still stuck, you can reveal the category relationship, or finally the full group of words.`
            }
          },
          {
            "@type": "Question",
            "name": `What are the Connections hints for today, ${puzzle.date}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Today's Connections puzzle features four hidden categories. We provide progressive hints for all four color groups on our page to help you solve it without spoilers.`
            }
          },
          {
            "@type": "Question",
            "name": "When does the Connections puzzle update?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The New York Times Connections puzzle updates daily at midnight local time."
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 pt-12 space-y-12">
        <section className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            NYT Connections Hints and Answer for {puzzle.date}
          </h1>
          <p className="text-lg text-slate-700 leading-relaxed">
            Today's NYT Connections hints for {puzzle.date} feature progressive clues to help you identify the four hidden categories without full spoilers. Reveal one level at a time.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-700 font-bold uppercase tracking-widest text-base">
            <span>Date: {puzzle.date}</span>
            <span className="hidden sm:inline" aria-hidden="true">•</span>
            <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-lg border-2 border-blue-200">
              Independent Helper
            </span>
          </div>
          {isStale && (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900 font-bold">
              Today's puzzle hasn't been published yet. Showing hints for {puzzle.date}.
            </div>
          )}
        </section>

        <section className="space-y-8">
          <h2 className="text-3xl font-extrabold text-slate-900 border-b-4 border-slate-300 pb-2">Today's Grid</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {shuffledGrid.map((word, index) => (
              <Card key={`${word}-${index}`} className="p-5 sm:p-8 text-center border-2 border-slate-400 rounded-2xl bg-white shadow-md">
                <span className="text-xl sm:text-3xl font-black text-slate-900 tracking-widest uppercase">
                  {word}
                </span>
              </Card>
            ))}
          </div>
        </section>

        <div className="mt-16 pt-12 border-t-4 border-slate-300">
          <h2 className="text-3xl font-extrabold text-slate-900 border-b-4 border-slate-300 pb-2">What are the Connections hints for today?</h2>
          <p className="text-xl text-slate-700 mt-6 font-medium">
            Get just enough help to solve the puzzle yourself. Reveal one level at a time.
          </p>
          <ConnectionsHintCards date={puzzle.date} groups={puzzle.groups} />
        </div>

        <section className="pt-16 border-t-4 border-slate-300 space-y-8">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">How to use these hints</h2>
          <div className="prose prose-slate max-w-none text-xl text-slate-800 leading-relaxed space-y-6">
            <p>
              Stuck on today's Connections puzzle? Our helper provides a "reveal ladder" designed for players who want a nudge, not a spoiler. 
            </p>
            <ul className="list-disc pl-8 space-y-4 font-medium">
              <li><strong>Hint 1 & 2:</strong> Vague associations and wordplay clues to get you thinking.</li>
              <li><strong>Category:</strong> Tells you the relationship between the four words.</li>
              <li><strong>The Words:</strong> Shows the full group if you're completely stumped.</li>
            </ul>
          </div>
        </section>

        <div className="bg-slate-900 text-white p-8 rounded-3xl mt-12">
           <p className="text-sm font-bold uppercase tracking-widest opacity-70 mb-2 italic">Disclaimer</p>
           <p className="text-base leading-relaxed">
             GridHint.com is an independent word-game utility. We are not affiliated with, sponsored by, or endorsed by The New York Times or the official Connections puzzle.
           </p>
        </div>
      </div>
    </>
  );
}
