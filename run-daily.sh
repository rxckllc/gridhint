#!/bin/bash
set -e
cd ~/daily-grid-help

# Load environment variables
export $(grep -v "^#" .env | xargs)

# 1. Import all games
echo "[daily] Importing Connections..."
/usr/bin/node node_modules/.bin/tsx src/scripts/import-daily-puzzles.ts

echo "[daily] Importing Wordle..."
/usr/bin/node node_modules/.bin/tsx src/scripts/import-daily-wordle.ts

echo "[daily] Importing Spelling Bee..."
/usr/bin/node node_modules/.bin/tsx src/scripts/import-daily-spelling-bee.ts

# 2. Validate outputs
echo "[daily] Validating generated files..."
/usr/bin/node node_modules/.bin/tsx src/scripts/validate-generated.ts

# 3. Push changes to GitHub (triggers Hostinger deploy)
echo "[daily] Committing and pushing updates..."
git config user.name "gridhint-bot"
git config user.email "bot@gridhint.com"
git add src/data/generated/ .gridhint-cooldown.json 2>/dev/null || true
if git diff --cached --quiet; then
    echo "[daily] No changes to commit."
else
    git commit -m "daily: automated update $(date +%F)"
    git push origin main
fi

# 4. Ping IndexNow for SEO
echo "[daily] Pinging IndexNow..."
/usr/bin/node node_modules/.bin/tsx src/scripts/ping-indexnow.ts

echo "[daily] Done."
