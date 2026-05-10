import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronRight, Calendar, HelpCircle, CheckCircle2 } from 'lucide-react';
import latest from '@/data/generated/connections/latest.json';

export default function ConnectionsHubPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-16">
      <section className="space-y-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Connections Helper
        </h1>
        <p className="text-xl md:text-2xl text-slate-700 max-w-2xl mx-auto font-medium">
          Get progressive hints, reveal categories, or view today's answers for the Connections word game.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link href="/connections/hints" className="group">
          <Card className="h-full border-2 border-slate-300 rounded-2xl p-8 hover:border-blue-700 hover:shadow-md transition-all">
            <div className="bg-blue-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
              <HelpCircle className="w-10 h-10 text-blue-700" />
            </div>
            <CardHeader className="p-0 space-y-3">
              <CardTitle className="text-3xl font-bold text-blue-900 group-hover:underline underline-offset-4">Today's Hints</CardTitle>
              <CardDescription className="text-xl text-slate-700 font-medium leading-relaxed">
                Need a nudge? Get progressive clues that help you solve the puzzle without giving it all away.
              </CardDescription>
            </CardHeader>
            <div className="mt-8 flex items-center gap-2 text-blue-700 font-bold text-lg">
              <span>Get Hints</span>
              <ChevronRight className="w-6 h-6" />
            </div>
          </Card>
        </Link>

        <Link href={`/connections/answers/${latest.date}`} className="group">
          <Card className="h-full border-2 border-slate-300 rounded-2xl p-8 hover:border-blue-700 hover:shadow-md transition-all">
            <div className="bg-green-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-100 transition-colors">
              <CheckCircle2 className="w-10 h-10 text-green-700" />
            </div>
            <CardHeader className="p-0 space-y-3">
              <CardTitle className="text-3xl font-bold text-blue-900 group-hover:underline underline-offset-4">View Answers</CardTitle>
              <CardDescription className="text-xl text-slate-700 font-medium leading-relaxed">
                Stumped? See the fully grouped categories and words for today's Connections puzzle.
              </CardDescription>
            </CardHeader>
            <div className="mt-8 flex items-center gap-2 text-blue-700 font-bold text-lg">
              <span>See Solution</span>
              <ChevronRight className="w-6 h-6" />
            </div>
          </Card>
        </Link>
      </div>

      <section className="bg-white border-2 border-slate-300 rounded-2xl p-8 sm:p-12 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-500 uppercase font-black tracking-widest">
              <Calendar className="w-6 h-6" />
              <span>Archive</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Looking for a past puzzle?</h2>
            <p className="text-xl text-slate-700">Browse our collection of previous Connections hints and answers.</p>
          </div>
          <Link href="/connections/archive" className="w-full md:w-auto h-16 px-12 bg-slate-900 text-white text-xl font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center">
            Browse Archive
          </Link>
        </div>
      </section>
    </div>
  );
}
