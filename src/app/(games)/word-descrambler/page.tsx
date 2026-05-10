import { Search } from "lucide-react";

export default function WordDescramblerMockup() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-12">
      <section className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Word Descrambler
        </h1>
        <p className="text-xl text-slate-700">
          Turn jumbled letters back into valid dictionary words.
        </p>
      </section>

      <section className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 shadow-sm">
        <form className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="descramble" className="block text-2xl font-bold text-slate-900">
              Letters to descramble
            </label>
            <input 
              id="descramble"
              type="text" 
              placeholder="e.g. ELZZPU" 
              className="w-full text-2xl p-4 h-16 border-2 border-slate-300 rounded-xl focus:border-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-opacity-20 uppercase"
            />
          </div>
          
          <button 
            type="button"
            className="w-full sm:w-auto h-16 px-10 bg-blue-700 text-white text-2xl font-bold rounded-xl hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-offset-4 transition-colors flex items-center justify-center gap-3"
          >
            <Search className="w-6 h-6" /> Descramble
          </button>
        </form>
      </section>
    </div>
  );
}