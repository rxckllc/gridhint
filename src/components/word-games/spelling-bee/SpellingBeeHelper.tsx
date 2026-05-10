'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, RotateCcw, Info, Trophy, Eye, EyeOff, Filter } from 'lucide-react';

function validateInputs(center: string, outer: string): string | null {
  if (center.length !== 1 || !/^[a-z]$/.test(center)) return 'Center must be exactly one letter (a-z).';
  if (outer.length !== 6 || !/^[a-z]{6}$/.test(outer)) return 'Outer must be exactly 6 letters (a-z).';
  if (outer.includes(center)) return 'Center letter must not appear in the outer letters.';
  const unique = new Set([center, ...outer.split('')]);
  if (unique.size !== 7) return 'All 7 letters must be unique.';
  return null;
}

export default function SpellingBeeHelper() {
  const [center, setCenter] = useState('');
  const [outer, setOuter] = useState('');
  const [minLength, setMinLength] = useState(4);
  const [pangramsOnly, setPangramsOnly] = useState(false);
  const [commonOnly, setCommonOnly] = useState(false);
  const [hideAnswers, setHideAnswers] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isSolving, setIsLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const validationError = validateInputs(center, outer);
  const isValid = validationError === null;

  useEffect(() => {
    const worker = new Worker(new URL('../../../workers/spelling-bee.worker.ts', import.meta.url));
    workerRef.current = worker;
    worker.onmessage = (e) => {
      setResults(e.data.payload);
      setIsLoading(false);
    };
    return () => worker.terminate();
  }, []);

  const handleSolve = () => {
    if (!isValid || !workerRef.current) return;
    setIsLoading(true);
    workerRef.current.postMessage({
      type: 'solve',
      payload: {
        center,
        outer: outer.split(''),
        minLength,
        pangramsOnly,
        commonOnly,
      },
    });
  };

  const reset = () => {
    setCenter('');
    setOuter('');
    setMinLength(4);
    setResults(null);
  };

  return (
    <div className="space-y-12 mt-8">
      <section className="bg-white border-4 border-slate-300 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
          <div className="space-y-4 text-center">
            <Label htmlFor="center" className="text-xl font-black text-slate-900 uppercase">Center Letter</Label>
            <input
              id="center"
              type="text"
              maxLength={1}
              value={center}
              onChange={(e) => setCenter(e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase())}
              placeholder="?"
              className="w-24 h-24 text-5xl font-black text-center border-8 border-yellow-400 bg-yellow-50 rounded-full focus:border-blue-700 focus:outline-none uppercase"
            />
          </div>

          <div className="space-y-4 text-center">
            <Label htmlFor="outer" className="text-xl font-black text-slate-900 uppercase">Outer Letters (6)</Label>
            <input
              id="outer"
              type="text"
              maxLength={6}
              value={outer}
              onChange={(e) => setOuter(e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase())}
              placeholder="ABCDEF"
              className="w-full max-w-[300px] h-20 text-4xl font-black text-center border-4 border-slate-300 rounded-2xl focus:border-blue-700 focus:outline-none uppercase tracking-[0.4em] placeholder:tracking-normal placeholder:text-slate-300"
            />
          </div>
        </div>

        {(center || outer) && !isValid && (
          <div className="rounded-2xl border-4 border-amber-400 bg-amber-50 px-6 py-4 text-amber-900 font-bold text-lg">
            {validationError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t-4 border-slate-100">
          <div className="space-y-2">
            <Label className="font-bold text-slate-500 uppercase tracking-widest text-xs">Min Length</Label>
            <select className="w-full h-12 border-2 border-slate-300 rounded-xl px-3 font-bold" value={minLength} onChange={(e) => setMinLength(parseInt(e.target.value))}>
              {[3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Letters</option>)}
            </select>
          </div>
          <div className="flex flex-col justify-end space-y-2">
            <Button
              variant={pangramsOnly ? 'default' : 'outline'}
              onClick={() => setPangramsOnly(!pangramsOnly)}
              className="h-12 font-bold border-2 border-slate-300 rounded-xl flex items-center justify-center gap-2"
            >
              <Trophy className="w-5 h-5" /> Pangrams Only
            </Button>
          </div>
          <div className="flex flex-col justify-end space-y-2">
            <Button
              variant={commonOnly ? 'default' : 'outline'}
              onClick={() => setCommonOnly(!commonOnly)}
              className="h-12 font-bold border-2 border-slate-300 rounded-xl flex items-center justify-center gap-2"
            >
              <Filter className="w-5 h-5" /> Common Only
            </Button>
          </div>
          <div className="flex flex-col justify-end space-y-2">
            <Button
              variant={hideAnswers ? 'default' : 'outline'}
              onClick={() => setHideAnswers(!hideAnswers)}
              className="h-12 font-bold border-2 border-slate-300 rounded-xl flex items-center justify-center gap-2"
            >
              {hideAnswers ? <><EyeOff className="w-5 h-5" /> Hint Mode</> : <><Eye className="w-5 h-5" /> Full List</>}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Button
            onClick={handleSolve}
            disabled={isSolving || !isValid}
            className="flex-1 h-20 text-2xl font-black rounded-2xl bg-blue-700 hover:bg-blue-800 flex items-center justify-center gap-3 border-b-8 border-blue-900 active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-8 h-8" /> {isSolving ? 'FINDING WORDS...' : 'SOLVE HIVE'}
          </Button>
          <Button variant="outline" onClick={reset} className="h-20 px-8 text-xl font-bold rounded-2xl border-4 border-slate-300 hover:bg-slate-100 flex items-center justify-center gap-2">
            <RotateCcw className="w-6 h-6" /> RESET
          </Button>
        </div>
      </section>

      {results && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500" aria-live="polite">
          {results.pangrams.length > 0 && (
            <Card className="border-4 border-yellow-400 rounded-3xl overflow-hidden shadow-lg">
              <CardHeader className="bg-yellow-50 border-b-4 border-yellow-200 p-6 flex justify-between items-center">
                <CardTitle className="text-2xl font-black text-yellow-900 flex items-center gap-3 uppercase">
                  <Trophy className="w-8 h-8" /> Pangrams Found
                </CardTitle>
                <Badge className="bg-yellow-400 text-yellow-950 font-black px-4 py-1 text-lg">
                  {results.pangrams.length}
                </Badge>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-wrap gap-4">
                  {results.pangrams.map((word: string) => (
                    <span key={word} className="px-6 py-3 bg-white border-4 border-yellow-400 rounded-2xl text-2xl font-black text-slate-900 tracking-widest uppercase">
                      {word}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!hideAnswers ? (
            <div className="space-y-10">
              {results.wordsByLength.map((group: any) => (
                <section key={group.length} className="bg-white border-4 border-slate-300 rounded-[2.5rem] overflow-hidden shadow-md">
                  <div className="bg-slate-100 border-b-4 border-slate-300 p-6 flex justify-between items-center">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{group.length} Letter Words</h2>
                    <Badge variant="outline" className="border-2 border-slate-900 font-black text-xl px-4 py-1">
                      {group.words.length}
                    </Badge>
                  </div>
                  <div className="p-8">
                    <div className="flex flex-wrap gap-4">
                      {group.words.map((word: string) => (
                        <div key={word} className="px-6 py-4 bg-white border-2 border-slate-300 rounded-2xl text-2xl font-black text-blue-900 tracking-widest uppercase">
                          {word}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <section className="bg-white border-4 border-slate-300 rounded-[2.5rem] p-10 shadow-md space-y-8">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight border-b-4 border-slate-100 pb-4">Hive Hints</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <p className="text-slate-500 font-black uppercase text-sm tracking-widest">Total Words</p>
                  <p className="text-5xl font-black text-blue-900">{results.totalWords}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-500 font-black uppercase text-sm tracking-widest">Pangrams</p>
                  <p className="text-5xl font-black text-yellow-600">{results.pangrams.length}</p>
                </div>
                {results.wordsByLength.map((g: any) => (
                  <div key={g.length} className="space-y-2">
                    <p className="text-slate-500 font-black uppercase text-sm tracking-widest">{g.length} Letter Count</p>
                    <p className="text-5xl font-black text-slate-900">{g.words.length}</p>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setHideAnswers(false)}
                className="w-full h-16 text-xl font-bold rounded-xl border-2 border-slate-300"
                variant="secondary"
              >
                Reveal All Answers
              </Button>
            </section>
          )}
        </div>
      )}

      <section className="bg-slate-900 text-white p-8 sm:p-12 rounded-[2.5rem] space-y-6">
        <h2 className="text-3xl font-black flex items-center gap-3 uppercase">
          <Info className="w-8 h-8 text-blue-400" /> Rules
        </h2>
        <div className="prose prose-invert max-w-none text-xl leading-relaxed text-slate-300 space-y-4 font-medium">
          <p>1. Words must contain at least 4 letters (or your chosen minimum).</p>
          <p>2. Words must include the center letter.</p>
          <p>3. Our dictionary does not include proper nouns, hyphens, or obscenities.</p>
          <p>4. Letters can be used more than once.</p>
        </div>
      </section>
    </div>
  );
}
