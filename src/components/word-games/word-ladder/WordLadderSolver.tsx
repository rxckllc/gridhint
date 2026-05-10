'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Search, RotateCcw, Info, ArrowDown, AlertCircle } from 'lucide-react';

export default function WordLadderSolver() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isSolving, setIsLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../../../workers/word-ladder.worker.ts', import.meta.url));
    workerRef.current = worker;
    worker.onmessage = (e) => {
      setResults(e.data.payload);
      setIsLoading(false);
    };
    return () => worker.terminate();
  }, []);

  const handleSolve = () => {
    if (!start || !end || !workerRef.current) return;
    setIsLoading(true);
    workerRef.current.postMessage({
      type: 'solve',
      payload: { start, end, maxVisited: 50000 }
    });
  };

  const reset = () => {
    setStart('');
    setEnd('');
    setResults(null);
  };

  return (
    <div className="space-y-12 mt-8">
      <section className="bg-white border-4 border-slate-300 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Label htmlFor="start" className="text-2xl font-black text-slate-900 uppercase tracking-tight">Start Word</Label>
            <input 
              id="start"
              type="text" 
              value={start}
              onChange={(e) => setStart(e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase())}
              placeholder="e.g. COLD" 
              className="w-full h-20 text-4xl font-black text-center border-4 border-slate-300 rounded-2xl focus:border-blue-700 focus:outline-none uppercase tracking-widest placeholder:tracking-normal placeholder:text-slate-300"
            />
          </div>
          <div className="space-y-4">
            <Label htmlFor="end" className="text-2xl font-black text-slate-900 uppercase tracking-tight">End Word</Label>
            <input 
              id="end"
              type="text" 
              value={end}
              onChange={(e) => setEnd(e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase())}
              placeholder="e.g. WARM" 
              className="w-full h-20 text-4xl font-black text-center border-4 border-slate-300 rounded-2xl focus:border-blue-700 focus:outline-none uppercase tracking-widest placeholder:tracking-normal placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-4 border-slate-100">
          <Button 
            onClick={handleSolve}
            disabled={isSolving || !start || !end || start.length !== end.length}
            className="flex-1 h-20 text-2xl font-black rounded-2xl bg-blue-700 hover:bg-blue-800 flex items-center justify-center gap-3 border-b-8 border-blue-900 active:border-b-0 active:translate-y-2 transition-all"
          >
            <Search className="w-8 h-8" /> {isSolving ? 'SOLVING...' : 'FIND LADDER'}
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
        <div className="bg-amber-50 border-4 border-amber-200 p-8 rounded-3xl flex items-center gap-6">
           <AlertCircle className="w-12 h-12 text-amber-600 flex-shrink-0" />
           <p className="text-xl font-bold text-amber-900 leading-tight">{results.warnings[0]}</p>
        </div>
      )}

      {results && results.found && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="max-w-md mx-auto space-y-4">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-slate-900 uppercase">Shortest Path Found</h2>
                <p className="text-xl font-bold text-blue-700">{results.steps} steps</p>
             </div>
             <div className="space-y-4 relative">
                {/* Connector Line */}
                <div className="absolute left-1/2 top-10 bottom-10 w-2 bg-slate-200 -translate-x-1/2 z-0" />
                
                {results.path.map((word: string, idx: number) => (
                  <div key={word} className="relative z-10 flex flex-col items-center">
                    <Card className={`w-full max-w-[280px] border-4 ${idx === 0 || idx === results.path.length - 1 ? 'border-blue-700 bg-blue-50' : 'border-slate-300 bg-white'} rounded-2xl shadow-md`}>
                       <CardContent className="p-4 text-center">
                          <span className="text-3xl font-black tracking-widest text-slate-900 uppercase">{word}</span>
                       </CardContent>
                    </Card>
                    {idx < results.path.length - 1 && (
                      <div className="bg-white border-2 border-slate-300 rounded-full p-1 my-2">
                        <ArrowDown className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>
                ))}
             </div>
          </div>
        </section>
      )}

      <section className="bg-slate-900 text-white p-8 sm:p-12 rounded-[2.5rem] space-y-6">
        <h2 className="text-3xl font-black flex items-center gap-3 uppercase">
          <Info className="w-8 h-8 text-blue-400" /> Game Rules
        </h2>
        <div className="prose prose-invert max-w-none text-xl leading-relaxed text-slate-300 space-y-4 font-medium">
          <p>1. Start and end words must be the <strong>same length</strong>.</p>
          <p>2. Each step must change exactly <strong>one letter</strong>.</p>
          <p>3. Every intermediate word must be a <strong>valid dictionary word</strong>.</p>
          <p>4. The solver finds the <strong>shortest possible ladder</strong> between your two chosen words.</p>
        </div>
      </section>
    </div>
  );
}
