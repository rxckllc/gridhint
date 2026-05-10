# DailyGridHelp - Project Instructions

## Claude Usage Protocol
**CRITICAL:** Never use raw Anthropic API calls or the `ANTHROPIC_API_KEY` for this project. The user has a **Claude Max** subscription authenticated via the `claude` CLI.

To use Claude, always shell out to the `claude` CLI and explicitly unset the API key to force usage of the Max OAuth session.

**Correct Syntax:**
```powershell
$env:ANTHROPIC_API_KEY = $null; claude -p "Your prompt here"
```

## Frontend Design Standards (40+ Demographic)
- **Stack:** Next.js (Static Export), Tailwind CSS, Shadcn UI, Lucide React.
- **Typography:** `text-lg` base size, `font-extrabold` headings.
- **Contrast:** High contrast (Navy/Dark Gray on Off-White).
- **Targets:** Large `h-14` or `h-16` touch targets for all inputs and buttons.
- **Aesthetic:** "Faceless Digital Brand" - pure utility, no clutter, no preamble.

## Infrastructure
- **Deployment:** GitHub -> Hostinger (Static).
- **Automation:** Google VM (Cron jobs for daily puzzle data).
- **Data:** Static JSON files in `/src/data/`.
