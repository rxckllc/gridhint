import { unscrambleWords } from "@/lib/words/dictionary";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{
    letters: string;
  }>;
}

export async function generateStaticParams() {
  // Phase 1: Generate a small safe test set first
  const testLetters = ['sbitmu', 'elzzpu', 'pleap'];
  
  return testLetters.map((letters) => ({
    letters: letters,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const upperLetters = resolvedParams.letters.toUpperCase();
  return {
    title: `Unscramble ${upperLetters} - Word Descrambler & Anagram Solver`,
    description: `Find all valid words that can be made from the letters ${upperLetters}. Grouped by word length for easy puzzle solving.`,
  };
}

export default async function ProgrammaticUnscramblePage({ params }: PageProps) {
  const resolvedParams = await params;
  const letters = resolvedParams.letters.toLowerCase();
  const upperLetters = letters.toUpperCase();
  
  const results = unscrambleWords(letters);
  const lengths = Object.keys(results).map(Number).sort((a, b) => b - a);
  const hasResults = lengths.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <h1 className="text-4xl font-extrabold text-slate-900">Unscramble {upperLetters}</h1>
      
      {!hasResults ? (
        <p className="text-lg text-slate-600">No words found for these letters.</p>
      ) : (
        <div className="space-y-8">
          {lengths.map((len) => (
            <Card key={len} className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-xl text-slate-800 flex justify-between items-center">
                  <span>{len}-Letter Words</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {results[len].length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                  {results[len].map((word) => (
                    <div 
                      key={word} 
                      className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-lg font-medium text-slate-800 shadow-sm"
                    >
                      {word}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
