import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronRight, Calculator } from 'lucide-react';

export default function WordleHubPage() {
  const modes = [
    {
      title: "Wordle Solver",
      desc: "Enter your guesses and feedback to find the solution.",
      href: "/word-games/wordle/solver",
      icon: Calculator,
      color: "bg-blue-50 text-blue-700"
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 space-y-16">
      <section className="space-y-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Wordle Helper
        </h1>
        <p className="text-xl md:text-2xl text-slate-700 max-w-2xl mx-auto font-medium">
          Master the daily word game with our solver, hint system, and analysis tools.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {modes.map((mode) => (
          <Link key={mode.title} href={mode.href} className="group">
            <Card className="h-full border-2 border-slate-300 rounded-2xl p-8 hover:border-blue-700 hover:shadow-md transition-all">
              <div className={`${mode.color} w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:opacity-80 transition-opacity`}>
                <mode.icon className="w-10 h-10" />
              </div>
              <CardHeader className="p-0 space-y-3">
                <CardTitle className="text-3xl font-bold text-blue-900 group-hover:underline underline-offset-4">{mode.title}</CardTitle>
                <CardDescription className="text-xl text-slate-700 font-medium leading-relaxed">
                  {mode.desc}
                </CardDescription>
              </CardHeader>
              <div className="mt-8 flex items-center gap-2 text-blue-700 font-bold text-lg">
                <span>Open Tool</span>
                <ChevronRight className="w-6 h-6" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
