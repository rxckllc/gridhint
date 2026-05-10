import fs from 'fs';
import path from 'path';
import { atomicWrite } from './atomic-write';

const COOLDOWN_FILE = path.join(process.cwd(), '.gridhint-cooldown.json');

interface CooldownFile {
  pausedUntil: string;
}

/** Exits 0 cleanly if a cooldown is active; clears expired cooldowns. */
export function checkCooldown(): void {
  if (!fs.existsSync(COOLDOWN_FILE)) return;
  try {
    const data = JSON.parse(fs.readFileSync(COOLDOWN_FILE, 'utf8')) as CooldownFile;
    const until = new Date(data.pausedUntil);
    if (until > new Date()) {
      console.log(`[cooldown] IP cooling down until ${until.toISOString()}. Exiting cleanly.`);
      process.exit(0);
    }
    fs.unlinkSync(COOLDOWN_FILE);
    console.log('[cooldown] Cooldown expired, proceeding.');
  } catch {
    // Corrupt file — ignore and proceed
  }
}

export function writeCooldown(hours: number): void {
  const pausedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  atomicWrite(COOLDOWN_FILE, { pausedUntil });
  console.error(`[cooldown] Wrote cooldown until ${pausedUntil}`);
}
