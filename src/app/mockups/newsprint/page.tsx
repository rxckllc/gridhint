import { Search } from "lucide-react";

export default function NewsprintMockup() {
  const tools = [
    { title: "Connections Hint", desc: "Gentle nudges for today's categories." },
    { title: "Wordle Solver", desc: "Optimize your next guess." },
    { title: "Unscramble Letters", desc: "Make sense of your jumbled letters." },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2A25] font-serif pb-20">
      <header className="border-b-[3px] border-[#2C2A25] py-6 px-4 md:px-8 mb-10">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-widest" style={{ fontFamily: "Georgia, serif" }}>
            GridHint.com
          </h1>
          <div className="w-full border-t border-b border-[#2C2A25] py-2 mt-4 flex justify-between font-sans text-sm font-bold uppercase tracking-wider">
            <span>Vol. 1</span>
            <span>Word Puzzle Utilities</span>
            <span>Est. 2026</span>
          </div>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 md:px-8 space-y-16">
        <section className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#1A1814]" style={{ fontFamily: "Georgia, serif" }}>
            The Morning Solver
          </h2>
          <p className="text-xl md:text-2xl text-[#4A473E] mb-10 leading-relaxed max-w-2xl mx-auto">
            A quiet, ad-free space to find hints and answers for your daily word games.
          </p>
          
          <div className="p-1 max-w-xl mx-auto border-2 border-[#2C2A25]">
            <div className="border-[3px] border-[#2C2A25] p-6 bg-white flex flex-col gap-4">
              <label className="text-lg font-bold font-sans uppercase tracking-widest text-left">Unscramble Letters</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  className="flex-1 text-2xl p-3 border border-[#8A8573] font-sans focus:outline-none focus:ring-2 focus:ring-[#2C2A25]"
                />
                <button className="bg-[#2C2A25] text-[#FDFBF7] font-sans font-bold text-xl py-3 px-8 hover:bg-black uppercase tracking-wider flex items-center justify-center gap-2">
                  <Search className="w-5 h-5" /> Solve
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-[3px] border-[#2C2A25] pt-10">
            {tools.map((tool, i) => (
              <div key={tool.title} className={`p-6 bg-white border border-[#E5E0D5] shadow-[4px_4px_0px_#2C2A25] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#2C2A25] transition-all cursor-pointer ${i === 0 ? 'md:col-span-2 text-center' : ''}`}>
                <h3 className="text-3xl font-bold mb-3" style={{ fontFamily: "Georgia, serif" }}>{tool.title}</h3>
                <p className="text-xl text-[#4A473E] font-sans">{tool.desc}</p>
                <div className="mt-4 text-[#8A8573] font-sans font-bold uppercase text-sm tracking-widest flex items-center justify-center gap-2">
                  Read More <span className="text-xl">→</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}