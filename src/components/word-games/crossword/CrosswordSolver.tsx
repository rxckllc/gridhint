'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, RotateCcw, Info, HelpCircle } from 'lucide-react';

export default function CrosswordSolver() {
  const [clue, setClue] = useState('');
  const [pattern, setPattern] = useState('');
  const [length, setLength] = useState<number | ''>(0);
  const [results, setResults] = useState<any[]>([]);
  const [isSolving, setIsLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../../../workers/crossword.worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'result') {
        setResults((payload as any[]).slice(0, 100));
        setIsLoading(false);
      } else if (type === 'error') {
        console.error(payload);
        setIsLoading(false);
      }
    };

    return () => worker.terminate();
  }, []);

  const handleSolve = () => {
    if (!workerRef.current) return;
    setIsLoading(true);
    workerRef.current.postMessage({
      type: 'solve',
      payload: { pattern, clue, length: length || undefined },
    });
  };

  const reset = () => {
    setClue('');
    setPattern('');
    setLength(0);
    setResults([]);
  };

  return (
    <div className="space-y-12 mt-8">
      <section className="bg-white border-4 border-slate-300 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Label htmlFor="clue" className="text-2xl font-black text-slate-900 uppercase">Crossword Clue</Label>
            <textarea
              id="clue"
              value={clue}
              onChange={(e) => setClue(e.target.value)}
              placeholder="e.g. Ocean movement"
              className="w-full h-32 text-2xl p-4 border-4 border-slate-300 rounded-2xl focus:border-blue-700 focus:outline-none placeholder:text-slate-300 resize-none"
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="pattern" className="text-2xl font-black text-slate-900 uppercase">Pattern</Label>
              <input
                id="pattern"
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value.replace(/[^a-zA-Z_?.*]/g, ''))}
                placeholder="e.g. W_V_"
                className="w-full h-16 text-3xl font-black text-center border-4 border-slate-300 rounded-2xl focus:border-blue-700 focus:outline-none uppercase tracking-widest placeholder:tracking-normal placeholder:text-slate-300"
              />
              <p className="text-sm font-bold text-slate-500">Use _ or ? for unknown letters.</p>
            </div>

            <div className="space-y-4">
              <Label htmlFor="length" className="text-2xl font-black text-slate-900 uppercase">Word Length</Label>
              <select
                id="length"
                className="w-full h-16 text-2xl font-bold border-4 border-slate-300 rounded-2xl px-4 focus:border-blue-700 outline-none"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value) || 0)}
              >
                <option value={0}>Any Length</option>
                {Array.from({ length: 15 }, (_, i) => i + 2).map(n => (
                  <option key={n} value={n}>{n} Letters</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-4 border-slate-100">
          <Button
            onClick={handleSolve}
            disabled={isSolving || (!pattern && !clue)}
            className="flex-1 h-20 text-2xl font-black rounded-2xl bg-blue-700 hover:bg-blue-800 flex items-center justify-center gap-3 border-b-8 border-blue-900 active:border-b-0 active:translate-y-2 transition-all"
          >
            <Search className="w-8 h-8" /> {isSolving ? 'SOLVING...' : 'FIND ANSWERS'}
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

      {results.length > 0 && (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" aria-live="polite">
          <h2 className="text-3xl font-black text-slate-900 uppercase border-b-4 border-slate-300 pb-2 flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-700" /> Possible Answers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((res) => {
              const displayPct = Math.min(100, Math.round(res.score * 100));
              return (
                <Card key={res.word} className="border-4 border-slate-300 rounded-[2rem] overflow-hidden hover:border-blue-700 transition-all shadow-sm">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-3xl font-black text-blue-900 tracking-widest uppercase">{res.word}</span>
                      <Badge className="bg-slate-100 text-slate-700 border-2 border-slate-200 font-bold">{res.length}L</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-bold uppercase tracking-wider">
                        <span className="text-slate-500">Likelihood</span>
                        <span className="text-blue-700">{displayPct}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-700 rounded-full transition-all" style={{ width: `${displayPct}%` }} />
                      </div>
                    </div>
                    {res.scoreParts && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {res.scoreParts.frequency > 0 && (
                          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            freq {(res.scoreParts.frequency * 100).toFixed(0)}
                          </span>
                        )}
                        {res.scoreParts.crosswordCommon > 0 && (
                          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-50 text-green-700 border border-green-200">
                            common
                          </span>
                        )}
                        {res.scoreParts.clue > 0 && (
                          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            clue match
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section className="bg-slate-900 text-white p-8 sm:p-12 rounded-[2.5rem] space-y-6">
        <h2 className="text-3xl font-black flex items-center gap-3 uppercase">
          <Info className="w-8 h-8 text-blue-400" /> Solving Tips
        </h2>
        <div className="prose prose-invert max-w-none text-xl leading-relaxed text-slate-300 space-y-4 font-medium">
          <p>
            1. Enter known letters in the <strong>Pattern</strong> box. Use underscores (_) or question marks (?) for missing letters.
          </p>
          <p>
            2. If you have the clue text, paste it into the <strong>Clue</strong> box to help the solver rank the most relevant words.
          </p>
          <p>
            3. Results are ranked by pattern match, common crossword word frequency, and clue keyword relevance.
          </p>
        </div>
      </section>
    </div>
  );
}
