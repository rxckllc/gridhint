import Link from "next/link";
import { LogoMark } from "./LogoMark";

export function Footer() {
  return (
    <footer className="bg-white border-t-2 border-slate-300 mt-auto py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-4">
            <LogoMark size="sm" />
            <p className="text-lg text-slate-700 max-w-sm">
              Fast, simple tools for your daily word puzzles and games.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Links</h3>
            <ul className="space-y-3 text-lg">
              <li><Link href="/about/" className="text-blue-700 hover:text-blue-900 underline underline-offset-4 font-medium">About</Link></li>
              <li><Link href="/contact/" className="text-blue-700 hover:text-blue-900 underline underline-offset-4 font-medium">Contact</Link></li>
              <li><Link href="/disclaimer/" className="text-blue-700 hover:text-blue-900 underline underline-offset-4 font-medium">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t-2 border-slate-200">
          <p className="text-base text-slate-600 font-bold">
            © {new Date().getFullYear()} GridHint.com. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
