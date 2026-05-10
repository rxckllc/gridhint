#!/bin/bash
cd ~/daily-grid-help
export $(grep -v "^#" .env | xargs)
/usr/bin/node node_modules/.bin/tsx import-daily-puzzles.ts
