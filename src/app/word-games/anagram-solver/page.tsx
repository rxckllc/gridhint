import { Search } from "lucide-react";

export default function AnagramSolverMockup() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-12">
      <section className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Anagram Solver
        </h1>
        <p className="text-xl text-slate-700">
          Find exact anagrams for any word or phrase.
        </p>
      </section>

      <section className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 shadow-sm">
        <form className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="anagram" className="block text-2xl font-bold text-slate-900">
              Enter word or phrase
            </label>
            <input 
              id="anagram"
              type="text" 
              placeholder="e.g. LISTEN" 
              className="w-full text-2xl p-4 h-16 border-2 border-slate-300 rounded-xl focus:border-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-opacity-20 uppercase"
            />
          </div>
          
          <button 
            type="button"
            className="w-full sm:w-auto h-16 px-10 bg-blue-700 text-white text-2xl font-bold rounded-xl hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-offset-4 transition-colors flex items-center justify-center gap-3"
          >
            <Search className="w-6 h-6" /> Find Anagrams
          </button>
        </form>
      </section>
    </div>
  );
}