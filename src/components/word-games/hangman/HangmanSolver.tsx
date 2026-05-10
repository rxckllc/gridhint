'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Search, RotateCcw, Info, AlertTriangle, Lightbulb, Target } from 'lucide-react';

export default function HangmanSolver() {
  const [pattern, setPattern] = useState('');
  const [wrongLetters, setWrongLetters] = useState('');
  const [knownLetters, setKnownLetters] = useState('');
  const [mode, setMode] = useState<'safe' | 'aggressive'>('safe');
  const [results, setResults] = useState<any>(null);
  const [isSolving, setIsLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../../../workers/hangman.worker.ts', import.meta.url));
    workerRef.current = worker;
    worker.onmessage = (e) => {
      setResults(e.data.payload);
      setIsLoading(false);
    };
    return () => worker.terminate();
  }, []);

  const handleSolve = () => {
    if (!pattern || !workerRef.current) return;
    setIsLoading(true);
    workerRef.current.postMessage({
      type: 'solve',
      payload: { pattern, wrongLetters, knownLetters, mode }
    });
  };

  const reset = () => {
    setPattern('');
    setWrongLetters('');
    setKnownLetters('');
    setResults(null);
  };

  return (
    <div className="space-y-12 mt-8">
      <section className="bg-white border-4 border-slate-300 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <Label htmlFor="pattern" className="text-2xl font-black text-slate-900 uppercase">Word Pattern</Label>
            <input 
              id="pattern"
              type="text" 
              value={pattern}
              onChange={(e) => setPattern(e.target.value.replace(/[^a-zA-Z_?.*]/g, ''))}
              placeholder="e.g. _A__E" 
              className="w-full h-20 text-4xl sm:text-5xl font-black text-center border-4 border-slate-300 rounded-2xl focus:border-blue-700 focus:outline-none uppercase tracking-[0.3em] placeholder:tracking-normal placeholder:text-slate-300"
            />
            <p className="text-sm font-bold text-slate-500">Use _ for unknown letters. Example: _A__E for "APPLE"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <Label htmlFor="wrong" className="text-xl font-black text-slate-900 uppercase">Wrong Letters</Label>
                <input 
                  id="wrong"
                  type="text" 
                  value={wrongLetters}
                  onChange={(e) => setWrongLetters(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                  placeholder="RSTLN" 
                  className="w-full h-16 text-2xl font-bold border-4 border-red-200 bg-red-50/30 rounded-2xl px-4 focus:border-red-500 outline-none uppercase tracking-widest"
                />
             </div>
             <div className="space-y-4">
                <Label htmlFor="known" className="text-xl font-black text-slate-900 uppercase">Other Known Letters</Label>
                <input 
                  id="known"
                  type="text" 
                  value={knownLetters}
                  onChange={(e) => setKnownLetters(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                  placeholder="Found elsewhere" 
                  className="w-full h-16 text-2xl font-bold border-4 border-green-200 bg-green-50/30 rounded-2xl px-4 focus:border-green-500 outline-none uppercase tracking-widest"
                />
             </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
             <Button 
                variant={mode === 'safe' ? "default" : "outline"} 
                onClick={() => setMode('safe')}
                className="h-14 px-8 text-lg font-bold rounded-xl border-2"
              >
                Safe Mode (Lower Risk)
              </Button>
              <Button 
                variant={mode === 'aggressive' ? "default" : "outline"} 
                onClick={() => setMode('aggressive')}
                className="h-14 px-8 text-lg font-bold rounded-xl border-2"
              >
                Aggressive (High Coverage)
              </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-4 border-slate-100">
          <Button 
            onClick={handleSolve}
            disabled={isSolving || !pattern}
            className="flex-1 h-20 text-2xl font-black rounded-2xl bg-blue-700 hover:bg-blue-800 flex items-center justify-center gap-3 border-b-8 border-blue-900 active:border-b-0 active:translate-y-2 transition-all"
          >
            <Search className="w-8 h-8" /> {isSolving ? 'ANALYZING...' : 'FIND BEST MOVE'}
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

      {results && results.warnings.length > 0 && (
        <div className="bg-amber-50 border-4 border-amber-200 p-6 rounded-3xl flex items-start gap-4">
           <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0" />
           <div className="space-y-1">
              <p className="text-xl font-bold text-amber-900">Input Warnings</p>
              <ul className="list-disc pl-5 text-amber-800 font-medium">
                 {results.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
           </div>
        </div>
      )}

      {results && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500" aria-live="polite">
          <Card className="border-4 border-blue-700 rounded-[2.5rem] overflow-hidden shadow-xl">
             <CardHeader className="bg-blue-700 border-b-4 border-blue-800 p-8">
                <CardTitle className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                   <Target className="w-8 h-8" /> Recommended Letters
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <div className="divide-y-4 divide-slate-100">
                   {results.bestLetters.map((item: any, idx: number) => (
                     <div key={item.letter} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-blue-50/30 transition-colors">
                        <div className="flex items-center gap-8">
                           <span className="text-6xl font-black text-blue-900 uppercase w-16">{item.letter}</span>
                           <div className="space-y-1">
                              <p className="text-xl font-black text-slate-900 uppercase">Hit Probability</p>
                              <div className="flex items-center gap-3">
                                 <div className="w-48 h-4 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-200">
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${item.hitRate * 100}%` }} />
                                 </div>
                                 <span className="text-2xl font-black text-green-600">{(item.hitRate * 100).toFixed(0)}%</span>
                              </div>
                           </div>
                        </div>
                        <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl flex-1 max-w-md">
                           <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Example Words</p>
                           <div className="flex flex-wrap gap-2">
                              {item.examples.map((ex: string) => (
                                <span key={ex} className="px-2 py-1 bg-white border border-slate-300 rounded-md font-bold text-slate-700 uppercase text-sm">{ex}</span>
                              ))}
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </CardContent>
          </Card>

          <Card className="border-4 border-slate-300 rounded-[2.5rem] overflow-hidden shadow-md">
            <CardHeader className="bg-slate-100 border-b-4 border-slate-300 p-8 flex justify-between items-center">
              <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Possible Words</CardTitle>
              <Badge variant="outline" className="border-4 border-slate-900 font-black text-2xl px-6 py-2">
                {results.total}
              </Badge>
            </CardHeader>
            <CardContent className="p-10">
              <div className="flex flex-wrap gap-4">
                {results.possibleWords.map((word: string) => (
                  <div key={word} className="px-6 py-4 bg-white border-2 border-slate-300 rounded-2xl text-2xl font-black text-blue-900 tracking-widest uppercase">
                    {word}
                  </div>
                ))}
                {results.total > 100 && (
                  <div className="w-full text-center pt-8">
                     <p className="text-xl font-bold text-slate-400 italic">Showing first 100 of {results.total} matches</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <section className="bg-slate-900 text-white p-8 sm:p-12 rounded-[2.5rem] space-y-6">
        <h2 className="text-3xl font-black flex items-center gap-3 uppercase">
          <Info className="w-8 h-8 text-blue-400" /> Strategies
        </h2>
        <div className="prose prose-invert max-w-none text-xl leading-relaxed text-slate-300 space-y-4 font-medium">
          <p>
            <strong>Safe Mode:</strong> Prioritizes letters that appear in most remaining words, reducing the risk of a "wrong guess" penalty.
          </p>
          <p>
            <strong>Aggressive Mode:</strong> Prioritizes letters that reveal the most information, potentially narrowing the list of words faster even if the risk is higher.
          </p>
        </div>
      </section>
    </div>
  );
}
