# GridHint Puzzle Cron Worker

Cloudflare Worker scheduler for GridHint daily puzzle refreshes. The Worker is the only cron layer. GitHub Actions keeps `workflow_dispatch` for manual runs and for Worker API dispatches, but GitHub schedule cron is intentionally not used.

Configured route after deployment:

- `https://gridhint.com/puzzle-cron-worker/*`

## Trigger Flow

1. Cloudflare Cron Trigger fires this Worker on the configured UTC schedule.
2. For puzzle ticks, the Worker checks each game's UTC window and dispatches `.github/workflows/daily-puzzle.yml` with the matching `game` input.
3. GitHub Actions runs the import script, validates generated files, commits changed puzzle data, pushes to `main`, waits for fresh public content, pings IndexNow, and commits `src/data/generated/<game>/indexnow-status.json`.
4. The repository push triggers the site deploy.
5. At the daily summary tick, the Worker dispatches `.github/workflows/daily-puzzle-summary.yml` for one combined puzzle + IndexNow email.

## Current UTC Schedule

These expressions are for Eastern daylight time, UTC-4.

Puzzle ticks use minute offsets `05`, `25`, `45` and never `00`.

- Connections and Wordle, 12:05 AM-2:05 AM ET: `5,25,45 4-5 * * *` and `5 6 * * *`
- Spelling Bee, 3:05 AM-6:05 AM ET: `5,25,45 7-9 * * *` and `5 10 * * *`
- Daily summary email, 7:30 AM ET: `30 11 * * *`

Cloudflare cron is UTC. When Eastern time switches to standard time, move these one hour later in UTC:

- Connections and Wordle: `5,25,45 5-6 * * *` and `5 7 * * *`
- Spelling Bee: `5,25,45 8-10 * * *` and `5 11 * * *`
- Daily summary email: `30 12 * * *`

DST dates to remember:

- 2026 daylight saving starts March 8, 2026 and ends November 1, 2026.
- 2027 daylight saving starts March 14, 2027 and ends November 7, 2027.

## Required Configuration

Worker vars in `wrangler.toml`:

- `routes`: `gridhint.com/puzzle-cron-worker/*`
- `GITHUB_OWNER=rxckllc`
- `GITHUB_REPO=gridhint`
- `GITHUB_REF=main`
- `GITHUB_WORKFLOW_ID=daily-puzzle.yml`
- `SUMMARY_WORKFLOW_ID=daily-puzzle-summary.yml`
- `CONNECTIONS_WINDOW_UTC=04:05-06:05`
- `WORDLE_WINDOW_UTC=04:05-06:05`
- `SPELLING_BEE_WINDOW_UTC=07:05-10:05`

Worker secrets:

- `GITHUB_TOKEN`: fine-grained PAT for dispatching GridHint workflows.
- `MANUAL_TRIGGER_TOKEN`: shared secret required for `/trigger`.

## Fine-Grained PAT

Create the PAT in the browser. Do not use a classic broad token.

1. GitHub -> Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens.
2. Generate new token.
3. Resource owner: `rxckllc`.
4. Repository access: Only select repositories -> `gridhint`.
5. Repository permissions: set `Actions` to `Read and write`. Leave unrelated permissions at `No access`.
6. Choose an expiration and generate the token.
7. Store it in Cloudflare:

```bash
cd infra/puzzle-cron-worker
npx wrangler secret put GITHUB_TOKEN
```

Also store a manual trigger token:

```bash
npx wrangler secret put MANUAL_TRIGGER_TOKEN
```

Rotate before expiry by putting the new secret, testing one manual dispatch, then revoking the old token in GitHub.

## Retry Behavior

- Worker retries by schedule: it dispatches during each game window every 20 minutes until the generated file is already fresh.
- Import scripts check `src/data/generated/<game>/<today-ET>.json` first. If it exists and validates, they log `already fresh` and exit without fetch, commit, or push.
- NYT 404 logs `not posted yet, will retry next tick` and exits `0`.
- Network, parse, Gemini, validation, auth, and push errors exit non-zero and are visible in GitHub Actions.
- IndexNow remains soft-fail for the refresh workflow, but it records per-endpoint results for Bing, Yandex, Seznam, Naver, and Yep.

## Manual Firing

GitHub UI:

```text
Actions -> Daily Puzzle Update -> Run workflow -> choose all/connections/wordle/spelling-bee
Actions -> Daily Puzzle Summary Email -> Run workflow
```

Worker HTTP endpoint after deployment:

```bash
curl -X POST "https://<worker-url>/trigger?game=wordle" \
  -H "Authorization: Bearer <MANUAL_TRIGGER_TOKEN>"
```

Allowed targets are `connections`, `wordle`, `spelling-bee`, and `summary`.

Local scheduled test:

```bash
cd infra/puzzle-cron-worker
npx wrangler dev --test-scheduled
curl "http://127.0.0.1:8787/__scheduled?cron=5,25,45+4-5+*+*+*"
```

## Status Files

Puzzle data:

- `src/data/generated/<game>/<YYYY-MM-DD>.json`
- `src/data/generated/<game>/latest.json`
- `src/data/generated/<game>/manifest.json`

IndexNow:

- `src/data/generated/<game>/indexnow-status.json`

The IndexNow status file contains `timestamp`, `overall`, `submittedUrls`, per-endpoint HTTP results, and consecutive endpoint failure counts used by the daily summary email.

Cooldown:

- `.gridhint-cooldown.json` appears when NYT returns 403 or 429.

## Debugging

Worker side:

- `npx wrangler tail`
- `npx wrangler secret list`
- Check `/health`
- Check `/trigger?game=wordle` with the manual token

GitHub side:

- Confirm the Worker received HTTP `204` from workflow dispatch.
- Check the `Daily Puzzle Update` run input.
- Check import logs for `already fresh`, `not posted yet`, or real errors.
- Check the commit step for `pushed=true`.
- Check `Ping IndexNow` and `Commit IndexNow status`.
- Check the `Daily Puzzle Summary Email` run after 7:30 AM ET.

Do not log the PAT, manual trigger token, or Authorization headers.

## Deploy and Test

Deployment is intentionally manual.

```bash
cd infra/puzzle-cron-worker
npx wrangler deploy --dry-run
npx wrangler deploy
```

After deploy:

1. Tail logs with `npx wrangler tail`.
2. Fire `POST /trigger?game=wordle`.
3. Confirm a `Daily Puzzle Update` run starts in `rxckllc/gridhint`.
4. Confirm the run exits `already fresh` or completes the refresh path.
