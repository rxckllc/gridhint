import { ArrowRight, Lightbulb } from "lucide-react";

export default function ConnectionsHintMockup() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-12">
      <section className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Connections Hint for Today
        </h1>
        <p className="text-xl text-slate-700">
          Get progressive clues without spoiling the whole puzzle.
        </p>
      </section>

      <section className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="flex-1 h-16 bg-blue-700 text-white text-xl font-bold rounded-xl hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-offset-4 transition-colors flex items-center justify-center gap-3">
            <Lightbulb className="w-6 h-6" /> Reveal Hint 1
          </button>
          <button className="flex-1 h-16 bg-slate-100 text-slate-900 text-xl font-bold rounded-xl hover:bg-slate-200 border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-400 transition-colors">
            Reveal Hint 2
          </button>
        </div>

        <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Hint 1</h2>
          <p className="text-xl text-slate-700 italic">
            "Think about things you might wear on your head..."
          </p>
        </div>

        <div className="border-t-2 border-slate-200 pt-8">
          <button className="w-full h-16 bg-white text-blue-700 text-xl font-bold rounded-xl hover:bg-blue-50 border-2 border-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-offset-4 transition-colors flex items-center justify-center gap-3">
            Show Full Category <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>
    </div>
  );
}
