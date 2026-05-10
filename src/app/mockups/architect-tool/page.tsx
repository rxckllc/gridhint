import { Search } from "lucide-react";

export default function ArchitectToolMockup() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 text-lg leading-relaxed">
      <header className="bg-white border-b-2 border-slate-300 py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <img src="/gridhint-logo.png" alt="GridHint.com" className="h-12 w-auto" width="192" height="48" />
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 pt-12 space-y-12">
        <section className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Unscramble Letters
          </h1>
          <p className="text-xl text-slate-700">
            Enter your scrambled letters below to instantly find all valid words.
          </p>
        </section>

        <section className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 shadow-sm">
          <form className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="letters" className="block text-2xl font-bold text-slate-900">
                Letters to unscramble
              </label>
              <input 
                id="letters"
                type="text" 
                placeholder="e.g. SBITMU" 
                className="w-full text-2xl p-4 h-16 border-2 border-slate-300 rounded-xl focus:border-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-opacity-20 transition-all uppercase placeholder:normal-case placeholder:text-slate-400"
              />
            </div>
            
            <button 
              type="button"
              className="w-full sm:w-auto h-16 px-10 bg-blue-700 text-white text-2xl font-bold rounded-xl hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-offset-4 transition-colors flex items-center justify-center gap-3"
            >
              <Search className="w-6 h-6" /> 
              Find Words
            </button>
          </form>
        </section>

        <section className="pt-8 border-t-2 border-slate-200 space-y-6">
          <h2 className="text-3xl font-bold text-slate-900">How to use this tool</h2>
          <p className="text-xl text-slate-700">
            Type any jumbled letters into the box above and press "Find Words". The solver will scan the dictionary and return every possible word that can be made, organized by length.
          </p>
        </section>
      </main>
    </div>
  );
}