import { Search } from "lucide-react";

export default function FiveLetterWordsMockup() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-12">
      <section className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          5-Letter Word Finder
        </h1>
        <p className="text-xl text-slate-700">
          Browse and filter all valid 5-letter words. Perfect for Wordle and other daily games.
        </p>
      </section>

      <section className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 shadow-sm">
        <form className="space-y-6">
          <div className="space-y-3">
            <label className="block text-2xl font-bold text-slate-900">
              Pattern (use _ for blanks)
            </label>
            <div className="grid grid-cols-5 gap-2 sm:gap-4">
              {['_', 'R', 'A', '_', 'E'].map((letter, i) => (
                <input 
                  key={i}
                  type="text" 
                  maxLength={1}
                  defaultValue={letter !== '_' ? letter : ''}
                  className="h-16 w-full min-w-0 text-3xl font-extrabold text-center border-2 border-slate-300 rounded-xl focus:border-blue-700 focus:outline-none uppercase sm:h-20 sm:text-4xl"
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-3 pt-6 border-t-2 border-slate-200">
             <label htmlFor="includes" className="block text-xl font-bold text-slate-900">
              Must include letters
            </label>
            <input 
              id="includes"
              type="text" 
              placeholder="e.g. S, T" 
              className="w-full text-xl p-4 h-14 border-2 border-slate-300 rounded-xl focus:border-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-opacity-20 uppercase"
            />
          </div>

          <button 
            type="button"
            className="w-full sm:w-auto h-16 px-10 bg-blue-700 text-white text-2xl font-bold rounded-xl hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-offset-4 transition-colors flex items-center justify-center gap-3"
          >
            <Search className="w-6 h-6" /> Find Words
          </button>
        </form>
      </section>
    </div>
  );
}
