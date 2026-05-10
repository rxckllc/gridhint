import { CheckCircle2 } from "lucide-react";

export default function WordleSolverMockup() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-12">
      <section className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Wordle Solver
        </h1>
        <p className="text-xl text-slate-700">
          Enter your guess and colors to find the best next word.
        </p>
      </section>

      <section className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
        <div className="space-y-4">
          <label className="block text-2xl font-bold text-slate-900">
            Enter your guess
          </label>
          <div className="flex gap-2 sm:gap-4 justify-center">
            {['S', 'L', 'A', 'T', 'E'].map((letter, i) => (
              <input 
                key={i}
                type="text" 
                maxLength={1}
                defaultValue={letter}
                className="w-14 h-16 sm:w-20 sm:h-24 text-3xl sm:text-4xl font-extrabold text-center border-2 border-slate-300 rounded-xl focus:border-blue-700 focus:outline-none uppercase"
              />
            ))}
          </div>
          <div className="flex justify-center gap-4 mt-6">
             <button className="px-6 py-3 bg-slate-500 text-white font-bold rounded-lg">Gray</button>
             <button className="px-6 py-3 bg-yellow-500 text-white font-bold rounded-lg">Yellow</button>
             <button className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg">Green</button>
          </div>
        </div>

        <button className="w-full h-16 bg-blue-700 text-white text-2xl font-bold rounded-xl hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-offset-4 transition-colors flex items-center justify-center gap-3">
          <CheckCircle2 className="w-6 h-6" /> Analyze
        </button>

        <div className="bg-slate-50 p-6 border-2 border-slate-200 rounded-xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Best Next Guesses</h2>
          <ul className="space-y-3">
            <li className="flex justify-between items-center bg-white p-4 border-2 border-slate-200 rounded-lg">
              <span className="text-2xl font-bold text-blue-900 tracking-widest">CRANE</span>
              <span className="text-lg text-slate-500 font-bold">99% match</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
