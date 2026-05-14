import { LogoMark } from "./LogoMark";

export function Header() {
  return (
    <header className="bg-white border-b-2 border-slate-300 py-4 px-4 sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <LogoMark size="md" />
      </div>
    </header>
  );
}
