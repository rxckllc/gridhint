/**
 * Notification helpers for import-daily-puzzles.ts
 * Discord webhook + Healthchecks.io pings
 * All functions are no-ops if the env vars are not set.
 */

async function discordPost(content: string): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    // Never let notification failure abort the main flow
  }
}

async function healthchecksPost(suffix: string): Promise<void> {
  const base = process.env.HEALTHCHECKS_URL;
  if (!base) return;
  const url = suffix ? `${base.replace(/\/$/, '')}/${suffix}` : base;
  try {
    await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    // Never let notification failure abort the main flow
  }
}

export async function notifyStart(): Promise<void> {
  await healthchecksPost('start');
}

export async function notifySuccess(context: string): Promise<void> {
  await Promise.all([
    healthchecksPost(''),
    discordPost(`[gridhint-bot] ${context} updated successfully.`),
  ]);
}

export async function notifyFailure(error: unknown, context: string = 'import'): Promise<void> {
  const stack = error instanceof Error
    ? `${error.message}\n${error.stack ?? ''}`
    : String(error);
  // Strip backticks (ˋ = modifier-letter grave, visually similar but won't break code fences)
  // and truncate to 1500 chars to stay well under Discord's 2000-char message limit.
  const cleaned = stack.replace(/`/g, 'ˋ').slice(0, 1500);
  await Promise.all([
    healthchecksPost('fail'),
    discordPost(`[gridhint-bot] FAILURE during ${context}:\n\`\`\`\n${cleaned}\n\`\`\``),
  ]);
}
