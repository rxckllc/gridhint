import { Search, ChevronRight } from "lucide-react";

export default function ClassicMockup() {
  const tools = [
    { title: "Connections Hint", desc: "Step-by-step clues for today's puzzle" },
    { title: "Wordle Solver", desc: "Find the best next guess based on your letters" },
    { title: "Unscramble Letters", desc: "Type your letters to find all possible words" },
  ];

  return (
    <div className="min-h-screen bg-white text-black font-sans pb-20">
      <header className="bg-[#003366] text-white py-6 px-4 md:px-8 border-b-8 border-[#CC0000]">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-wide">GridHint.com</h1>
          <span className="text-lg font-medium underline cursor-pointer">Menu</span>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 md:px-8 pt-10 space-y-12">
        <section>
          <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight text-[#003366]">
            Fast & Easy Word Game Solvers
          </h2>
          <p className="text-2xl text-gray-800 mb-8 leading-relaxed">
            Get instant help for your daily word puzzles. No confusing menus, just the tools you need.
          </p>
          
          <div className="bg-gray-100 border-4 border-gray-300 p-8 rounded-xl shadow-md">
            <h3 className="text-2xl font-bold mb-4">Unscramble Letters Now</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                placeholder="Enter letters here..." 
                className="flex-1 text-2xl p-4 border-4 border-gray-400 rounded-lg focus:border-[#003366] outline-none"
              />
              <button className="bg-[#003366] text-white text-2xl font-bold py-4 px-10 rounded-lg hover:bg-[#002244] flex items-center justify-center gap-2">
                <Search className="w-8 h-8" /> Find Words
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold border-b-4 border-gray-300 pb-4 mb-6">Popular Tools</h2>
          <div className="flex flex-col gap-6">
            {tools.map(tool => (
              <div key={tool.title} className="flex items-center justify-between p-6 border-4 border-gray-200 rounded-xl hover:border-[#003366] hover:bg-[#F5F8FA] cursor-pointer transition-colors group">
                <div>
                  <h3 className="text-2xl font-bold text-[#003366] group-hover:underline mb-2">{tool.title}</h3>
                  <p className="text-xl text-gray-700">{tool.desc}</p>
                </div>
                <ChevronRight className="w-10 h-10 text-[#CC0000]" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}