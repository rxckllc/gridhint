import Link from "next/link";

interface LogoMarkProps {
  size?: "sm" | "md";
}

export function LogoMark({ size = "md" }: LogoMarkProps) {
  const svgSize = size === "sm" ? 40 : 72;
  const textClass = size === "sm" ? "text-2xl" : "text-5xl";

  return (
    <Link
      href="/"
      aria-label="GridHint home"
      className="inline-flex items-center gap-3 rounded-sm hover:opacity-90 transition-opacity duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB]"
    >
      <svg
        viewBox="0 0 24 24"
        width={svgSize}
        height={svgSize}
        role="img"
        aria-hidden="true"
        focusable="false"
        className="shrink-0"
      >
        {/* Row 1 — navy */}
        <rect x="0"   y="0"   width="7" height="7" rx="1.6" fill="#1E2D4A" />
        <rect x="8.5" y="0"   width="7" height="7" rx="1.6" fill="#1E2D4A" />
        <rect x="17"  y="0"   width="7" height="7" rx="1.6" fill="#1E2D4A" />
        {/* Row 2 — left & right navy, center blue */}
        <rect x="0"   y="8.5" width="7" height="7" rx="1.6" fill="#1E2D4A" />
        <rect x="8.5" y="8.5" width="7" height="7" rx="1.6" fill="#2563EB" />
        <rect x="17"  y="8.5" width="7" height="7" rx="1.6" fill="#1E2D4A" />
        {/* Row 3 — navy */}
        <rect x="0"   y="17"  width="7" height="7" rx="1.6" fill="#1E2D4A" />
        <rect x="8.5" y="17"  width="7" height="7" rx="1.6" fill="#1E2D4A" />
        <rect x="17"  y="17"  width="7" height="7" rx="1.6" fill="#1E2D4A" />
        {/* White lightbulb in center tile */}
        <path
          d="M 10.5 11.3
             A 1.5 1.5 0 0 1 13.5 11.3
             C 13.5 12.15 13.1 12.8 12.8 13.25
             H 11.2
             C 10.9 12.8 10.5 12.15 10.5 11.3
             Z"
          fill="white"
        />
        <rect x="11.1" y="13.5"  width="1.8" height="0.45" rx="0.18" fill="white" />
        <rect x="11.2" y="14.08" width="1.6" height="0.45" rx="0.18" fill="white" />
      </svg>
      <span className={`${textClass} font-bold leading-none tracking-tight`}>
        <span className="text-[#1E2D4A]">Grid</span>
        <span className="text-[#2563EB]">Hint</span>
      </span>
    </Link>
  );
}
