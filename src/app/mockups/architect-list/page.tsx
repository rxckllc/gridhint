import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ArchitectListMockup() {
  const sixLetter = ["SUBMIT", "BISTUM"];
  const fiveLetter = ["SMUT", "STUB", "TUMB"]; // Simplified for mockup
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 text-lg leading-relaxed">
      <header className="bg-white border-b-2 border-slate-300 py-6 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="#" className="p-3 bg-slate-100 hover:bg-slate-200 border-2 border-transparent hover:border-slate-300 rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-blue-700">
            <ArrowLeft className="w-6 h-6 text-slate-900" />
            <span className="sr-only">Go back</span>
          </Link>
          <img src="/gridhint-logo.png" alt="GridHint.com" className="h-12 w-auto" width="192" height="48" />
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 pt-12 space-y-12">
        <section className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Words for "SBITMU"
          </h1>
          <div className="inline-block bg-blue-100 text-blue-900 border-2 border-blue-200 px-6 py-3 rounded-xl text-xl font-bold">
            Found 14 words
          </div>
        </section>

        <div className="space-y-10">
          <section className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-100 border-b-2 border-slate-300 p-6 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-slate-900">6 Letters</h2>
              <span className="text-xl font-bold text-slate-500">2 words</span>
            </div>
            <div className="p-6 sm:p-8">
              <ul className="flex flex-wrap gap-4">
                {sixLetter.map(word => (
                  <li key={word} className="bg-white border-2 border-slate-300 px-6 py-4 rounded-xl text-2xl font-bold text-blue-900 hover:bg-blue-50 hover:border-blue-700 cursor-pointer transition-colors">
                    {word}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-100 border-b-2 border-slate-300 p-6 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-slate-900">4 Letters</h2>
              <span className="text-xl font-bold text-slate-500">3 words</span>
            </div>
            <div className="p-6 sm:p-8">
              <ul className="flex flex-wrap gap-4">
                {fiveLetter.map(word => (
                  <li key={word} className="bg-white border-2 border-slate-300 px-6 py-4 rounded-xl text-2xl font-bold text-blue-900 hover:bg-blue-50 hover:border-blue-700 cursor-pointer transition-colors">
                    {word}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
        
        <section className="bg-blue-900 text-white p-8 rounded-2xl space-y-6">
          <h2 className="text-3xl font-bold">Try another word?</h2>
          <form className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Enter letters..." 
              className="flex-1 text-2xl p-4 h-14 border-2 border-transparent rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-400 text-slate-900 uppercase"
            />
            <button 
              type="button"
              className="h-14 px-8 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-500 border-2 border-transparent focus:outline-none focus:ring-4 focus:ring-blue-400 transition-colors"
            >
              Solve
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}