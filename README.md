# GridHint

GridHint is a Next.js app for daily puzzle hints and word-game tools. Daily puzzle data is generated into `src/data/generated/` and committed back to the repository by automation.

## Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Useful checks:

```bash
npm run lint
npm run build
npm run data:validate
```

## Daily Puzzle Automation

The daily data path is:

1. Cloudflare Worker Cron is the only scheduler.
2. The Worker dispatches `.github/workflows/daily-puzzle.yml` with `game=connections`, `game=wordle`, or `game=spelling-bee`.
3. The workflow runs the matching import script, validates generated files, commits changes under `src/data/generated/`, rebases, pushes to `main`, and pings IndexNow only when content changed.
4. IndexNow results are committed to `src/data/generated/<game>/indexnow-status.json`.
5. The Worker dispatches `.github/workflows/daily-puzzle-summary.yml` once daily for the combined puzzle + IndexNow email.

Manual fire path:

```text
GitHub Actions -> Daily Puzzle Update -> Run workflow -> choose all/connections/wordle/spelling-bee
```

Generated status files:

- `src/data/generated/<game>/{date}.json`
- `src/data/generated/<game>/latest.json`
- `src/data/generated/<game>/manifest.json`
- `src/data/generated/<game>/indexnow-status.json`
- `.gridhint-cooldown.json` when NYT returns 403 or 429 and imports should pause

Retry behavior:

- If today's generated file already exists and validates, the import logs `already fresh` and exits without fetch, commit, or push.
- If NYT returns 404, the import logs `not posted yet, will retry next tick` and exits successfully. The next Worker tick tries again.
- Network, parse, Gemini, and validation errors fail the workflow and surface in the daily summary when the puzzle is still missing or invalid.
- IndexNow is soft-fail for the refresh workflow but records per-endpoint status for Bing, Yandex, Seznam, Naver, and Yep.

The Cloudflare Worker runbook for the external scheduler, including trigger flow, debugging, fine-grained PAT rotation, DST dates for 2026 and 2027, retries, manual firing, status files, and deploy/test steps, is in [infra/puzzle-cron-worker/README.md](infra/puzzle-cron-worker/README.md).
