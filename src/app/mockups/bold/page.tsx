import { Search } from "lucide-react";

export default function BoldMockup() {
  const tools = [
    { title: "Connections Hint", desc: "Clues without spoilers", color: "bg-[#E6F4EA]", border: "border-[#1E8E3E]" },
    { title: "Wordle Solver", desc: "Find your next guess", color: "bg-[#FEF7E0]", border: "border-[#F9AB00]" },
    { title: "Unscramble", desc: "Solve jumbled letters", color: "bg-[#E8F0FE]", border: "border-[#1A73E8]" },
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#202124] font-sans pb-20">
      <header className="bg-white py-6 px-4 shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
          <img src="/gridhint-logo.png" alt="GridHint.com" className="h-12 w-auto" width="192" height="48" />
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto px-4 pt-12 space-y-16">
        <section className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-gray-200">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-[#202124]">
            Hints & answers,<br/>
            <span className="text-[#1A73E8]">made simple.</span>
          </h2>
          <p className="text-2xl text-[#5F6368] mb-10 max-w-3xl">
            Everything you need to solve today's word puzzles, designed to be easy to read and simple to use.
          </p>
          
          <div className="bg-[#F8F9FA] rounded-[1.5rem] p-6 md:p-8 flex flex-col sm:flex-row gap-4 border border-gray-200">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-[#5F6368]" />
              <input 
                type="text" 
                placeholder="Unscramble letters..." 
                className="w-full text-2xl md:text-3xl p-6 pl-16 rounded-2xl border-2 border-gray-300 focus:border-[#1A73E8] outline-none shadow-inner"
              />
            </div>
            <button className="bg-[#1A73E8] text-white text-2xl font-bold py-6 px-12 rounded-2xl hover:bg-[#1557B0] transition-colors shadow-md">
              Go
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-8 pl-4">Top Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tools.map(tool => (
              <div key={tool.title} className={`${tool.color} border-2 ${tool.border} rounded-[2rem] p-8 hover:shadow-lg transition-shadow cursor-pointer`}>
                <h3 className="text-3xl font-extrabold text-[#202124] mb-4">{tool.title}</h3>
                <p className="text-xl text-[#3C4043] font-medium">{tool.desc}</p>
                <div className="mt-8">
                  <span className="inline-block bg-white text-[#202124] font-bold text-lg py-3 px-6 rounded-full border border-gray-300 shadow-sm">
                    Open Tool
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}