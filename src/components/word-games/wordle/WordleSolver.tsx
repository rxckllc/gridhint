'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Search, RotateCcw, Info } from 'lucide-react';
import type { Pattern } from '@/lib/words/wordle';

// Initial state for 6 rows of 5 letters
const EMPTY_ROWS = Array(6).fill(null).map(() => ({
  guess: '',
  pattern: [0, 0, 0, 0, 0] as Pattern
}));

export default function WordleSolver() {
  const [rows, setRows] = useState(EMPTY_ROWS);
  const [currentRow, setCurrentRow] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize Web Worker
    const worker = new Worker(new URL('../../../workers/wordle.worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'ready') {
        setStatus('ready');
      } else if (type === 'result') {
        setResults(payload);
        setStatus('ready');
      } else if (type === 'error') {
        setStatus('error');
        console.error(payload);
      }
    };

    // Load data and init worker
    const initWorker = async () => {
      const [answers, guesses, freq] = await Promise.all([
        import('@/data/words/five-letter-answers.json').then(m => m.default),
        import('@/data/words/five-letter-guesses.json').then(m => m.default),
        import('@/data/words/five-letter-freq.json').then(m => m.default),
      ]);
      worker.postMessage({ type: 'init', payload: { answers, guesses, freq } });
    };

    initWorker();

    return () => {
      worker.terminate();
    };
  }, []);

  const handleGuessChange = (rowIndex: number, value: string) => {
    const cleanValue = value.replace(/[^a-zA-Z]/g, '').toLowerCase().slice(0, 5);
    setRows(prev => prev.map((row, i) => i === rowIndex ? { ...row, guess: cleanValue } : row));
  };

  const toggleTile = (rowIndex: number, tileIndex: number) => {
    setRows(prev => prev.map((row, i) => {
      if (i === rowIndex) {
        const nextPattern = [...row.pattern] as Pattern;
        nextPattern[tileIndex] = ((nextPattern[tileIndex] + 1) % 3) as 0 | 1 | 2;
        return { ...row, pattern: nextPattern };
      }
      return row;
    }));
  };

  const solve = () => {
    if (!workerRef.current || status !== 'ready') return;
    
    // Only send rows that have a 5-letter guess
    const validRows = rows.filter(r => r.guess.length === 5);
    if (validRows.length === 0) return;

    setStatus('loading');
    workerRef.current.postMessage({
      type: 'solve',
      payload: { rows: validRows }
    });
  };

  const reset = () => {
    setRows(EMPTY_ROWS);
    setCurrentRow(0);
    setResults(null);
  };

  const colorClasses = ['bg-slate-500', 'bg-yellow-500', 'bg-green-600'];

  return (
    <div className="space-y-12 mt-8">
      <section className="bg-white border-4 border-slate-300 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="space-y-6">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative w-full max-w-[350px]">
                <input 
                  type="text"
                  maxLength={5}
                  value={row.guess}
                  onChange={(e) => handleGuessChange(rowIndex, e.target.value)}
                  placeholder={`GUESS ${rowIndex + 1}`}
                  className="w-full h-16 sm:h-20 text-3xl sm:text-4xl font-black text-center border-4 border-slate-300 rounded-2xl focus:border-blue-700 focus:outline-none uppercase tracking-[0.2em] placeholder:text-slate-300 placeholder:tracking-normal"
                />
              </div>
              <div className="flex gap-2">
                {row.pattern.map((state, tileIndex) => (
                  <button
                    key={tileIndex}
                    onClick={() => toggleTile(rowIndex, tileIndex)}
                    disabled={row.guess.length <= tileIndex}
                    className={`w-12 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-slate-400 flex items-center justify-center transition-all ${row.guess.length > tileIndex ? colorClasses[state] : 'bg-slate-100 opacity-50'} shadow-[0_4px_0_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none`}
                  >
                    <span className="text-white text-xl font-black uppercase">
                      {row.guess[tileIndex] || ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-4 border-slate-100">
          <Button 
            onClick={solve}
            disabled={status === 'loading' || rows[0].guess.length < 5}
            className="flex-1 h-20 text-2xl font-black rounded-2xl bg-blue-700 hover:bg-blue-800 flex items-center justify-center gap-3 border-b-8 border-blue-900 active:border-b-0 active:translate-y-2 transition-all"
          >
            <CheckCircle2 className="w-8 h-8" /> {status === 'loading' ? 'ANALYZING...' : 'FIND BEST GUESS'}
          </Button>
          <Button 
            variant="outline"
            onClick={reset}
            className="h-20 px-8 text-xl font-bold rounded-2xl border-4 border-slate-300 hover:bg-slate-100 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-6 h-6" /> RESET
          </Button>
        </div>
      </section>

      {results && (
        <div className="grid gap-8 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500" aria-live="polite">
          <Card className="border-4 border-blue-200 rounded-3xl overflow-hidden shadow-lg">
            <CardHeader className="bg-blue-50 border-b-4 border-blue-200 p-6">
              <CardTitle className="text-2xl font-black text-blue-900 flex items-center gap-2 uppercase tracking-tight">
                <Search className="w-7 h-7" /> Best Next Guesses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y-4 divide-slate-100">
                {results.ranked.slice(0, 10).map((guess: any, idx: number) => (
                  <div key={guess.word} className="p-6 flex items-center justify-between hover:bg-blue-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400 font-black text-xl w-6">{idx + 1}.</span>
                      <span className="text-3xl font-black text-slate-900 tracking-widest uppercase">{guess.word}</span>
                      {guess.isPossibleAnswer && (
                        <Badge className="bg-green-600 text-white font-bold uppercase text-xs px-2">Answer</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-blue-600 uppercase tracking-widest">Entropy</p>
                      <p className="text-2xl font-black text-slate-900">{guess.entropy.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-4 border-slate-300 rounded-3xl overflow-hidden shadow-md">
            <CardHeader className="bg-slate-100 border-b-4 border-slate-300 p-6">
              <CardTitle className="text-2xl font-black text-slate-900 flex items-center justify-between uppercase tracking-tight">
                <span>Remaining Answers</span>
                <Badge variant="outline" className="border-2 border-slate-900 font-black text-lg">
                  {results.remainingCount}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-wrap gap-3">
                {results.remainingAnswers.map((word: string) => (
                  <span key={word} className="px-4 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xl text-slate-700 tracking-wider uppercase">
                    {word}
                  </span>
                ))}
                {results.remainingCount > 100 && (
                  <span className="text-slate-400 font-bold italic pt-2">...and {results.remainingCount - 100} more</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <section className="bg-slate-900 text-white p-8 sm:p-12 rounded-[2.5rem] space-y-6">
        <h2 className="text-3xl font-black flex items-center gap-3 uppercase">
          <Info className="w-8 h-8 text-blue-400" /> How it works
        </h2>
        <div className="prose prose-invert max-w-none text-xl leading-relaxed text-slate-300 space-y-4 font-medium">
          <p>
            1. Enter your guess in one of the slots above.
          </p>
          <p>
            2. Tap the colored tiles to match the feedback from the game (Gray = No match, Yellow = Wrong spot, Green = Perfect).
          </p>
          <p>
            3. Press "Find Best Guess" to see which words provide the most information to solve the puzzle.
          </p>
        </div>
      </section>
    </div>
  );
}
