'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, RotateCcw, Copy, Check } from 'lucide-react';
import type { UnscrambleOptions } from '@/lib/words/unscramble';

type Props = {
  initialLetters?: string;
  defaultOptions?: UnscrambleOptions;
  title: string;
  subtitle: string;
  mode?: 'unscramble' | 'scramble' | 'anagram';
};

export default function AnagramSolver({ initialLetters = '', defaultOptions = {}, title, subtitle, mode = 'unscramble' }: Props) {
  const [letters, setLetters] = useState(initialLetters);
  const [options, setOptions] = useState<UnscrambleOptions>({ minLength: 2, ...defaultOptions });
  const [results, setResults] = useState<any[]>([]);
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [isSolving, setIsLoading] = useState(false);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../../../workers/unscramble.worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'unscramble:result') {
        setResults(payload);
        setIsLoading(false);
      } else if (type === 'scramble:result') {
        setScrambled(payload);
        setIsLoading(false);
      }
    };

    if (initialLetters) {
      handleSolve(initialLetters);
    }

    return () => worker.terminate();
  }, [initialLetters]);

  const handleSolve = (input: string = letters) => {
    if (!input || !workerRef.current) return;
    setIsLoading(true);
    setScrambled([]);
    
    if (mode === 'scramble') {
      workerRef.current.postMessage({
        type: 'scramble',
        payload: { word: input, count: 12, derangement: true }
      });
    } else {
      workerRef.current.postMessage({
        type: 'unscramble',
        payload: { letters: input, options }
      });
    }
  };

  const copyToClipboard = (word: string) => {
    navigator.clipboard.writeText(word);
    setCopiedWord(word);
    setTimeout(() => setCopiedWord(null), 2000);
  };

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight uppercase">
          {title}
        </h1>
        <p className="text-xl md:text-2xl text-slate-700 font-medium">
          {subtitle}
        </p>
      </section>

      <section className="bg-white border-4 border-slate-300 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="letters" className="text-2xl font-black text-slate-900 uppercase">Enter Letters or Word</Label>
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                id="letters"
                type="text" 
                value={letters}
                onChange={(e) => setLetters(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                placeholder="e.g. SBITMU" 
                className="flex-1 h-20 text-3xl sm:text-4xl font-black text-center border-4 border-slate-300 rounded-2xl focus:border-blue-700 focus:outline-none uppercase tracking-widest placeholder:tracking-normal placeholder:text-slate-300"
                onKeyDown={(e) => e.key === 'Enter' && handleSolve()}
              />
              <Button 
                onClick={() => handleSolve()}
                disabled={isSolving || !letters}
                className="h-20 px-10 text-2xl font-black rounded-2xl bg-blue-700 hover:bg-blue-800 flex items-center justify-center gap-3 border-b-8 border-blue-900 active:border-b-0 active:translate-y-2 transition-all"
              >
                <Search className="w-8 h-8" /> {mode === 'scramble' ? 'SCRAMBLE' : 'SOLVE'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t-4 border-slate-100">
             <div className="space-y-2">
                <Label className="font-bold text-slate-500 uppercase tracking-widest text-sm">Min Length</Label>
                <select 
                  className="w-full h-12 border-2 border-slate-300 rounded-xl px-3 font-bold"
                  value={options.minLength}
                  onChange={(e) => setOptions(prev => ({ ...prev, minLength: parseInt(e.target.value) }))}
                >
                  {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Letters</option>)}
                </select>
             </div>
             <div className="space-y-2">
                <Label className="font-bold text-slate-500 uppercase tracking-widest text-sm">Starts With</Label>
                <Input 
                  className="h-12 border-2 border-slate-300 rounded-xl font-bold uppercase"
                  value={options.startsWith || ''}
                  onChange={(e) => setOptions(prev => ({ ...prev, startsWith: e.target.value }))}
                />
             </div>
             <div className="space-y-2">
                <Label className="font-bold text-slate-500 uppercase tracking-widest text-sm">Ends With</Label>
                <Input 
                  className="h-12 border-2 border-slate-300 rounded-xl font-bold uppercase"
                  value={options.endsWith || ''}
                  onChange={(e) => setOptions(prev => ({ ...prev, endsWith: e.target.value }))}
                />
             </div>
             <div className="flex items-end">
                <Button 
                  variant="outline"
                  onClick={() => { setLetters(''); setResults([]); setScrambled([]); setOptions({ minLength: 2 }); }}
                  className="w-full h-12 text-lg font-bold border-2 border-slate-300 rounded-xl"
                >
                  <RotateCcw className="w-5 h-5 mr-2" /> Reset
                </Button>
             </div>
          </div>
        </div>
      </section>

      {scrambled.length > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500" aria-live="polite">
          {scrambled.map((word, idx) => (
            <div key={`${word}-${idx}`} className="bg-white border-2 border-slate-300 p-6 rounded-2xl text-center shadow-sm">
              <span className="text-2xl font-black text-slate-900 tracking-widest uppercase">{word}</span>
            </div>
          ))}
        </section>
      )}

      {results.length > 0 && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500" aria-live="polite">
          {results.map((group) => (
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
                    <button
                      key={word}
                      onClick={() => copyToClipboard(word)}
                      className="group relative px-6 py-4 bg-white border-2 border-slate-300 rounded-2xl text-2xl font-black text-blue-900 hover:border-blue-700 hover:bg-blue-50 transition-all flex items-center gap-3"
                    >
                      <span className="tracking-widest uppercase">{word}</span>
                      {copiedWord === word ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {!isSolving && results.length === 0 && letters && !scrambled.length && (
        <div className="p-12 text-center bg-slate-100 rounded-3xl border-4 border-dashed border-slate-300">
           <p className="text-2xl font-bold text-slate-500 uppercase tracking-widest">No words found for "{letters.toUpperCase()}"</p>
        </div>
      )}
    </div>
  );
}
