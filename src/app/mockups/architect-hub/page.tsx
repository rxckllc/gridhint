import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ArchitectHubMockup() {
  const tools = [
    { title: "Connections Hint", desc: "Get progressive hints for today's puzzle." },
    { title: "Wordle Solver", desc: "Find the best next guess for Wordle." },
    { title: "Unscramble Letters", desc: "Find valid words from scrambled letters." },
    { title: "5-Letter Words", desc: "Browse 5-letter words by pattern." },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 text-lg leading-relaxed">
      <header className="bg-white border-b-2 border-slate-300 py-6 px-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <img src="/gridhint-logo.png" alt="GridHint.com" className="h-12 w-auto" width="192" height="48" />
          <Link href="#" className="font-bold text-blue-700 hover:text-blue-900 underline underline-offset-4">
            All Tools
          </Link>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 pt-12 space-y-12">
        <section className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Word Puzzle Solvers
          </h1>
          <p className="text-xl text-slate-700">
            Select a tool below to get instant hints and answers for your daily word games.
          </p>
        </section>

        <section className="space-y-6">
          {tools.map((tool) => (
            <Link key={tool.title} href="#" className="block group">
              <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 flex items-center justify-between hover:border-blue-700 hover:shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-offset-4">
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 group-hover:underline underline-offset-4">
                    {tool.title}
                  </h2>
                  <p className="text-xl text-slate-700">
                    {tool.desc}
                  </p>
                </div>
                <div className="hidden sm:flex bg-slate-100 p-4 rounded-xl group-hover:bg-blue-50 transition-colors">
                  <ChevronRight className="w-8 h-8 text-blue-700" />
                </div>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}