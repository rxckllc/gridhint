'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface WordleAnswerRevealProps {
  solution: string;
}

export default function WordleAnswerReveal({ solution }: WordleAnswerRevealProps) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-8 sm:p-12 text-center space-y-6">
        <p className="text-lg text-slate-700">
          Last chance — reveal today&apos;s NYT Wordle answer?
        </p>
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="inline-flex items-center gap-3 bg-emerald-600 text-white text-2xl font-extrabold py-4 px-10 rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-700 focus:ring-offset-4 transition-colors"
        >
          <Eye className="w-6 h-6" /> Reveal Answer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-8 sm:p-12 text-center space-y-6">
      <p className="text-sm font-bold uppercase tracking-widest text-emerald-800">Today&apos;s Wordle Answer</p>
      <div className="flex justify-center gap-2 sm:gap-3">
        {solution.split('').map((letter, i) => (
          <div
            key={i}
            className="w-14 h-14 sm:w-20 sm:h-20 bg-emerald-600 text-white text-3xl sm:text-5xl font-extrabold rounded-lg flex items-center justify-center"
          >
            {letter}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRevealed(false)}
        className="inline-flex items-center gap-2 text-emerald-800 font-bold underline underline-offset-4 hover:text-emerald-900"
      >
        <EyeOff className="w-4 h-4" /> Hide answer
      </button>
    </div>
  );
}
