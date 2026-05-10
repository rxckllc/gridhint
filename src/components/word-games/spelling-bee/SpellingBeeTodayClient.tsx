'use client';

import { useState, useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface Props {
  centerLetter: string;
  outerLetters: string[];
  answerHashes: string[];
  pangramHashes: string[];
  totalWords: number;
  pangramCount: number;
  geniusThreshold: number;
  queenBeeScore: number;
}

// Client-side SHA-256 via Web Crypto API
async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.toUpperCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function scoreWord(word: string, isPangram: boolean): number {
  const len = word.length;
  let pts = len === 4 ? 1 : len;
  if (isPangram) pts += 7;
  return pts;
}

export default function SpellingBeeTodayClient({
  centerLetter,
  outerLetters,
  answerHashes,
  pangramHashes,
  totalWords,
  pangramCount,
  geniusThreshold,
  queenBeeScore,
}: Props) {
  const [input, setInput] = useState('');
  const [foundWords, setFoundWords] = useState<{ word: string; isPangram: boolean }[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const answerSet = useMemo(() => new Set(answerHashes), [answerHashes]);
  const pangramSet = useMemo(() => new Set(pangramHashes), [pangramHashes]);
  const validLettersSet = useMemo(() => new Set([centerLetter, ...outerLetters]), [centerLetter, outerLetters]);

  const score = foundWords.reduce((acc, w) => acc + scoreWord(w.word, w.isPangram), 0);

  let rank = 'Beginner';
  const pct = queenBeeScore > 0 ? score / queenBeeScore : 0;
  if (score >= queenBeeScore) rank = 'Queen Bee';
  else if (score >= geniusThreshold) rank = 'Genius';
  else if (pct >= 0.5) rank = 'Amazing';
  else if (pct >= 0.25) rank = 'Nice';
  else if (pct >= 0.15) rank = 'Solid';
  else if (pct >= 0.08) rank = 'Good';
  else if (pct > 0) rank = 'Moving Up';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const word = input.trim().toUpperCase();
    setFeedback(null);

    if (word.length < 4) {
      setFeedback({ type: 'err', msg: 'Too short — words must be 4 or more letters.' });
      return;
    }
    if (!word.includes(centerLetter)) {
      setFeedback({ type: 'err', msg: `Missing center letter "${centerLetter}".` });
      return;
    }
    for (const ch of word) {
      if (!validLettersSet.has(ch)) {
        setFeedback({ type: 'err', msg: `"${ch}" is not in today's letter set.` });
        return;
      }
    }
    if (foundWords.some(w => w.word === word)) {
      setFeedback({ type: 'err', msg: 'Already found.' });
      return;
    }

    const hash = await sha256Hex(word);
    if (!answerSet.has(hash)) {
      setFeedback({ type: 'err', msg: 'Not in today\'s answer list.' });
      return;
    }

    const isPangram = pangramSet.has(hash);
    setFoundWords(prev => [...prev, { word, isPangram }].sort((a, b) => a.word.localeCompare(b.word)));
    setInput('');
    setFeedback({
      type: 'ok',
      msg: isPangram ? `🎉 Pangram! +${scoreWord(word, true)} points` : `+${scoreWord(word, false)} points`,
    });
  }

  return (
    <div className="space-y-8">
      {/* Hive */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8">
        <p className="text-sm font-bold uppercase tracking-widest text-amber-700 mb-4">Today&apos;s Letters</p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-400 text-slate-900 text-3xl sm:text-4xl font-extrabold rounded-xl flex items-center justify-center border-2 border-amber-600">
            {centerLetter}
          </div>
          {outerLetters.map(letter => (
            <div
              key={letter}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 text-slate-900 text-3xl sm:text-4xl font-extrabold rounded-xl flex items-center justify-center border-2 border-slate-300"
            >
              {letter}
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-600 text-center mt-4">
          Center letter <strong className="text-amber-700">{centerLetter}</strong> must appear in every word.
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label htmlFor="sb-guess" className="block text-xl font-bold text-slate-900">
          Test your guess
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="sb-guess"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Type a word..."
            className="flex-1 text-2xl p-4 h-14 border-2 border-slate-300 rounded-xl focus:border-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-300 uppercase"
          />
          <button
            type="submit"
            className="h-14 px-8 bg-amber-600 text-white text-xl font-bold rounded-xl hover:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-700 focus:ring-offset-4"
          >
            Check
          </button>
        </div>
        {feedback && (
          <div className={`flex items-center gap-2 p-3 rounded-xl font-bold ${
            feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-300' : 'bg-rose-50 text-rose-800 border-2 border-rose-300'
          }`}>
            {feedback.type === 'ok' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <span>{feedback.msg}</span>
          </div>
        )}
      </form>

      {/* Score + rank */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Score</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{score}</p>
        </div>
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Rank</p>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{rank}</p>
        </div>
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Found</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{foundWords.length}/{totalWords}</p>
        </div>
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Pangrams</p>
          <p className="text-3xl font-extrabold text-amber-700 mt-1">
            {foundWords.filter(w => w.isPangram).length}/{pangramCount}
          </p>
        </div>
      </div>

      {/* Found words list */}
      {foundWords.length > 0 && (
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-6">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">Your Found Words</p>
          <ul className="flex flex-wrap gap-2">
            {foundWords.map(w => (
              <li
                key={w.word}
                className={`px-3 py-1 rounded-lg text-base font-bold ${
                  w.isPangram ? 'bg-amber-100 text-amber-900 border-2 border-amber-400' : 'bg-slate-100 text-slate-800'
                }`}
              >
                {w.word}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
