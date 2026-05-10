import { Menu } from "lucide-react";
import { LogoMark } from "./LogoMark";

export function Header() {
  return (
    <header className="bg-white border-b-2 border-slate-300 py-4 px-4 sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <LogoMark size="md" />
        <button className="md:hidden p-2 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-blue-700">
          <Menu className="w-8 h-8 text-blue-900" />
          <span className="sr-only">Open menu</span>
        </button>
      </div>
    </header>
  );
}
