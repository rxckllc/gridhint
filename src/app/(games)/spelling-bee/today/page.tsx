import latest from '@/data/generated/spelling-bee/latest.json';
import { type SpellingBeeDaily } from '@/lib/puzzles/spelling-bee-schema';
import { Metadata } from 'next';
import Link from 'next/link';
import SpellingBeeTodayClient from '@/components/word-games/spelling-bee/SpellingBeeTodayClient';
import fs from 'fs';
import path from 'path';

export const metadata: Metadata = {
  title: "Today's NYT Spelling Bee Hints, Letters & Pangram Helper | GridHint",
  description:
    "Today's NYT Spelling Bee letters, pangram count, length distribution, and a guess-checker. We won't spoil the answer list — test your words against today's puzzle.",
  alternates: { canonical: '/spelling-bee/today/' },
  openGraph: {
    title: "Today's NYT Spelling Bee Hints, Letters & Pangram Helper | GridHint",
    description: "Today's NYT Spelling Bee letters, pangram count, length distribution, and a guess-checker. We won't spoil the answer list — test your words against today's puzzle.",
    images: ['https://gridhint.com/gridhint-logo.png'],
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Today's NYT Spelling Bee Hints, Letters & Pangram Helper | GridHint",
    description: "Today's NYT Spelling Bee letters, pangram count, length distribution, and a guess-checker. We won't spoil the answer list — test your words against today's puzzle.",
    images: ['https://gridhint.com/gridhint-logo.png'],
  },
};

export default function SpellingBeeTodayPage() {
  const puzzle = latest as unknown as SpellingBeeDaily;

  const todayET = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const isStale = puzzle.date !== todayET;
  const isSeedData = puzzle.sourceMode === 'manual_seed';

  // Sort length distribution keys numerically
  const lengthEntries = Object.entries(puzzle.hints.lengthDistribution)
    .map(([k, v]) => [Number(k), v as number] as const)
    .sort(([a], [b]) => a - b);

  const startingEntries = Object.entries(puzzle.hints.startingLetterDistribution)
    .sort(([a], [b]) => a.localeCompare(b));

  let dateModified = new Date().toISOString();
  try {
    if (isStale) {
      dateModified = `${puzzle.date}T12:00:00Z`;
    } else {
      const manifestPath = path.join(process.cwd(), 'src/data/generated/spelling-bee/manifest.json');
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
            "name": "Spelling Bee Today",
            "item": "https://gridhint.com/spelling-bee/today/"
          }
        ]
      },
      {
        "@type": "Article",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": "https://gridhint.com/spelling-bee/today/"
        },
        "headline": `NYT Spelling Bee Hints and Letters for ${puzzle.date}`,
        "articleSection": "Games",
        "inLanguage": "en-US",
        "image": "https://gridhint.com/gridhint-logo.png",
        "datePublished": `${puzzle.date}T03:00:00-04:00`,
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
            "name": `What is the pangram for today's Spelling Bee, ${puzzle.date}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": isSeedData
                ? `Today's Spelling Bee center letter is ${puzzle.centerLetter}. Full puzzle data including pangrams will be available shortly.`
                : `There are ${puzzle.hints.pangramCount} pangrams in today's Spelling Bee puzzle. The center letter is ${puzzle.centerLetter}.`
            }
          },
          {
            "@type": "Question",
            "name": "How does the Spelling Bee guess checker work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Our guess checker evaluates your words privately on your device. It confirms if a word is valid and if it's a pangram without revealing the full answer list."
            }
          },
          {
            "@type": "Question",
            "name": "When does the Spelling Bee puzzle update?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The New York Times Spelling Bee puzzle goes live at 3:00 a.m. Eastern Time every day."
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
      <div className="max-w-3xl mx-auto px-4 pt-12 space-y-12">
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            Today&apos;s NYT Spelling Bee
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            NYT Spelling Bee Hints for {puzzle.date}
          </h1>
          {isSeedData ? (
            <p className="text-xl text-slate-700 font-medium leading-relaxed">
              Today&apos;s NYT Spelling Bee letters are shown below. Use the center letter <strong>{puzzle.centerLetter}</strong> in every word — find as many as you can.
            </p>
          ) : (
            <p className="text-xl text-slate-700 font-medium leading-relaxed">
              Today&apos;s NYT Spelling Bee for {puzzle.date} requires you to find {puzzle.hints.totalWords} words, including {puzzle.hints.pangramCount} pangram(s), using the center letter {puzzle.centerLetter}.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-700 font-bold uppercase tracking-widest text-sm">
            <span>Date: {puzzle.date}</span>
            {!isSeedData && (
              <>
                <span aria-hidden="true">•</span>
                <span>{puzzle.hints.totalWords} words to find</span>
              </>
            )}
          </div>
          {isStale && !isSeedData && (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900 font-bold">
              Today&apos;s Spelling Bee hasn&apos;t been published yet. Showing data for {puzzle.date}.
            </div>
          )}
        </section>

        <SpellingBeeTodayClient
          centerLetter={puzzle.centerLetter}
          outerLetters={puzzle.outerLetters}
          answerHashes={puzzle.answerHashes}
          pangramHashes={puzzle.pangramHashes}
          totalWords={puzzle.hints.totalWords}
          pangramCount={puzzle.hints.pangramCount}
          geniusThreshold={puzzle.hints.geniusThreshold}
          queenBeeScore={puzzle.hints.queenBeeScore}
        />

        {!isSeedData && lengthEntries.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-3xl font-extrabold text-slate-900 border-b-4 border-slate-300 pb-2">
              What is the Spelling Bee hint for today? (Length)
            </h2>
            <p className="text-lg text-slate-700">How many valid words exist for each length:</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {lengthEntries.map(([len, count]) => (
                <div key={len} className="bg-white border-2 border-slate-300 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{len} letters</p>
                  <p className="text-2xl font-extrabold text-amber-700 mt-1">{count}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isSeedData && startingEntries.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-3xl font-extrabold text-slate-900 border-b-4 border-slate-300 pb-2">
              What are the starting letters for today's Spelling Bee?
            </h2>
            <p className="text-lg text-slate-700">How many valid words start with each letter:</p>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              {startingEntries.map(([letter, count]) => (
                <div key={letter} className="bg-white border-2 border-slate-300 rounded-xl p-4 text-center">
                  <p className="text-xl font-extrabold text-slate-900">{letter}</p>
                  <p className="text-2xl font-extrabold text-amber-700 mt-1">{count as number}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4 pt-8 border-t-2 border-slate-200">
          <h2 className="text-2xl font-extrabold text-slate-900">Want a different solver?</h2>
          <p className="text-lg text-slate-700">
            The <Link href="/spelling-bee/helper/" className="text-blue-700 hover:text-blue-900 underline underline-offset-4 font-bold">general Spelling Bee Helper</Link> works with any 7 letters — useful for older puzzles or your own letter sets.
          </p>
        </section>

        <div className="bg-slate-900 text-white p-6 rounded-2xl mt-12">
          <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Disclaimer</p>
          <p className="text-sm leading-relaxed">
            GridHint is an independent puzzle helper and is not affiliated with, endorsed by, or sponsored by The New York Times Company. We provide only metadata hints (letter set, counts, distributions) and a private client-side guess-checker — we do not republish today&apos;s answer list.
          </p>
        </div>
      </div>
    </>
  );
}
