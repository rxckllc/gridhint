import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function WordGamesHub() {
  const categories = [
    {
      title: "Daily Puzzle Solvers",
      items: [
        { title: "Connections Hint", desc: "Progressive hints for today's Connections.", href: "/connections-hint" },
        { title: "Wordle Solver", desc: "Get the best next guess for Wordle.", href: "/wordle-solver" },
      ]
    },
    {
      title: "Letter Scramblers",
      items: [
        { title: "Unscramble Letters", desc: "Find valid words from scrambled letters.", href: "/unscramble" },
        { title: "Word Descrambler", desc: "Descramble jumbled letters into words.", href: "/word-descrambler" },
        { title: "Word Scrambler", desc: "Mix up letters to create your own puzzles.", href: "/word-scrambler" },
        { title: "Anagram Solver", desc: "Find exact anagrams for a word or phrase.", href: "/anagram-solver" },
      ]
    },
    {
      title: "Finders & Patterns",
      items: [
        { title: "5-Letter Word Finder", desc: "Browse 5-letter words by pattern.", href: "/5-letter-words" },
        { title: "Crossword Solver", desc: "Fill in the blanks to find crossword answers.", href: "/crossword-solver" },
        { title: "Spelling Bee Helper", desc: "Find valid words matching Spelling Bee rules.", href: "/spelling-bee-helper" },
        { title: "Word Pattern Solver", desc: "Solve words based on wildcard patterns.", href: "/word-pattern-solver" },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-16">
      <section className="space-y-6">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          All Word Games & Solvers
        </h1>
        <p className="text-xl md:text-2xl text-slate-700 max-w-2xl font-medium">
          Choose a tool below to get instant hints, answers, or word lists.
        </p>
      </section>

      <div className="space-y-16">
        {categories.map((category) => (
          <section key={category.title} className="space-y-8">
            <h2 className="text-3xl font-extrabold text-slate-900 border-b-2 border-slate-300 pb-4">
              {category.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {category.items.map((tool) => (
                <Link key={tool.title} href={tool.href} className="block group">
                  <div className="h-full bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 flex items-center justify-between hover:border-blue-700 hover:shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-offset-4">
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-blue-900 group-hover:underline underline-offset-4">
                        {tool.title}
                      </h3>
                      <p className="text-xl text-slate-700 font-medium">
                        {tool.desc}
                      </p>
                    </div>
                    <div className="hidden sm:flex bg-slate-100 p-4 rounded-xl group-hover:bg-blue-50 transition-colors">
                      <ChevronRight className="w-8 h-8 text-blue-700" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
