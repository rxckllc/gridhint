'use client';

import { useEffect, useState } from 'react';
import { revealGroup, type ConnectionsGroup, type RevealLevel } from '@/lib/puzzles/connections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Eye, LayoutGrid, RotateCcw } from 'lucide-react';

type Props = {
  date: string;
  groups: ConnectionsGroup[];
};

export default function ConnectionsHintCards({ date, groups }: Props) {
  const storageKey = `connections-reveal-${date}`;
  const [levels, setLevels] = useState<RevealLevel[] | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === groups.length) {
          setLevels(parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to parse reveal levels", e);
      }
    }
    setLevels([0, 0, 0, 0]);
  }, [storageKey, groups.length]);

  useEffect(() => {
    if (levels) {
      window.localStorage.setItem(storageKey, JSON.stringify(levels));
    }
  }, [levels, storageKey]);

  function reveal(index: number) {
    if (!levels) return;
    setLevels(current =>
      current ? current.map((level, i) => i === index ? Math.min(4, level + 1) as RevealLevel : level) : null
    );
  }

  function resetAll() {
    setLevels([0, 0, 0, 0]);
  }

  if (!levels) {
    return <div className="min-h-[400px] flex items-center justify-center text-slate-400 font-bold">Loading hints...</div>;
  }

  const difficultyLabels: Record<string, string> = {
    yellow: "Easiest",
    green: "Easy",
    blue: "Medium",
    purple: "Hardest"
  };

  const difficultyColors: Record<string, string> = {
    yellow: "bg-yellow-100 text-yellow-950 border-yellow-200",
    green: "bg-green-100 text-green-950 border-green-200",
    blue: "bg-blue-100 text-blue-950 border-blue-200",
    purple: "bg-purple-100 text-purple-950 border-purple-200"
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-2 mt-8" aria-live="polite">
        {groups.map((group, index) => {
          const visible = revealGroup(group, levels[index]);
          const level = levels[index];

          return (
            <Card key={`${group.difficulty}-${index}`} className="border-2 shadow-sm rounded-2xl overflow-hidden border-slate-300">
              <CardHeader className={`${difficultyColors[group.difficulty]} py-4 border-b-2 border-slate-300`}>
                <CardTitle className="text-xl font-extrabold uppercase tracking-widest flex justify-between items-center">
                  <span className="text-lg sm:text-xl">Group {index + 1}</span>
                  <Badge variant="outline" className="font-bold border-current text-sm sm:text-base bg-white/50">
                    {difficultyLabels[group.difficulty]}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6 bg-white">
                <div className="space-y-4 min-h-[100px]">
                  {level >= 1 && 'hint1' in visible && (
                    <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
                      <p className="text-base font-bold text-slate-500 uppercase tracking-wide mb-1">Hint 1</p>
                      <p className="text-xl sm:text-2xl text-slate-900 font-bold leading-tight uppercase tracking-tight">
                        {visible.hint1}
                      </p>
                    </div>
                  )}
                  {level >= 2 && 'hint2' in visible && (
                    <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
                      <p className="text-base font-bold text-slate-500 uppercase tracking-wide mb-1">Hint 2</p>
                      <p className="text-xl sm:text-2xl text-slate-900 font-bold leading-tight uppercase tracking-tight">
                        {visible.hint2}
                      </p>
                    </div>
                  )}
                  {level >= 3 && 'category' in visible && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl motion-safe:animate-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
                      <p className="text-base font-bold text-blue-600 uppercase tracking-wide mb-1">Category</p>
                      <p className="text-2xl sm:text-3xl text-blue-900 font-black uppercase tracking-tight">
                        {visible.category}
                      </p>
                    </div>
                  )}
                  {level >= 4 && 'words' in visible && (
                    <div className="p-4 bg-slate-900 border-2 border-slate-900 rounded-xl motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-500">
                      <p className="text-base font-bold text-slate-300 uppercase tracking-wide mb-2">The Words</p>
                      <div className="flex flex-wrap gap-2">
                        {visible.words.map((word) => (
                          <span key={word} className="bg-white text-slate-900 px-4 py-2 rounded-lg font-black tracking-widest border-2 border-white text-xl">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {level < 4 && (
                  <Button 
                    onClick={() => reveal(index)} 
                    className="w-full h-16 text-xl font-bold rounded-xl flex items-center justify-center gap-3 transition-all border-b-4 active:border-b-0 active:translate-y-1"
                    variant={level === 0 ? "default" : "secondary"}
                    aria-expanded={level > 0}
                  >
                    {level === 0 && <><Lightbulb className="w-6 h-6" /> Reveal Hint 1</>}
                    {level === 1 && <><Lightbulb className="w-6 h-6" /> Reveal Hint 2</>}
                    {level === 2 && <><Eye className="w-6 h-6" /> Reveal Category</>}
                    {level === 3 && <><LayoutGrid className="w-6 h-6" /> Reveal All Words</>}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>
      
      <div className="flex justify-center pt-8">
        <Button 
          variant="outline" 
          onClick={resetAll}
          className="h-14 px-8 border-2 border-slate-300 text-lg font-bold rounded-xl hover:bg-slate-100"
        >
          <RotateCcw className="w-5 h-5 mr-2" /> Start Over / Hide All
        </Button>
      </div>
    </div>
  );
}
