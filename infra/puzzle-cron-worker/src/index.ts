type Game = "connections" | "wordle" | "spelling-bee";
type ManualTarget = Game | "summary";

interface Env {
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_REF?: string;
  GITHUB_WORKFLOW_ID?: string;
  SUMMARY_WORKFLOW_ID?: string;
  MANUAL_TRIGGER_TOKEN?: string;
  GITHUB_PAT_EXPIRES?: string;
  CONNECTIONS_WINDOW_ET?: string;
  WORDLE_WINDOW_ET?: string;
  SPELLING_BEE_WINDOW_ET?: string;
  SUMMARY_DISPATCH_ET?: string;
  HEARTBEAT_PATH?: string;
}

interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface DispatchResult {
  ok: boolean;
  source: "cron" | "manual";
  target: ManualTarget;
  status?: number;
  statusText?: string;
  repo: string;
  workflowId: string;
  ref: string;
  startedAt: string;
  finishedAt: string;
  message: string;
}

const GAMES: Game[] = ["connections", "wordle", "spelling-bee"];

const DEFAULT_WINDOWS: Record<Game, string> = {
  connections: "00:05-02:05",
  wordle: "00:05-02:05",
  "spelling-bee": "03:05-06:05",
};

const WINDOW_ENV: Record<Game, keyof Env> = {
  connections: "CONNECTIONS_WINDOW_ET",
  wordle: "WORDLE_WINDOW_ET",
  "spelling-bee": "SPELLING_BEE_WINDOW_ET",
};

const TIME_ZONE = "America/New_York";
const DEFAULT_SUMMARY_DISPATCH_ET = "07:45";
const DEFAULT_HEARTBEAT_PATH = "src/data/generated/worker-heartbeat.json";

// This Worker is an orchestrator only. It never fetches NYT data itself; it
// decides which GitHub workflow_dispatch events should be sent for a cron tick.
const handler = {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduled(event, env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};

export default handler;

async function handleScheduled(event: ScheduledEvent, env: Env): Promise<void> {
  const now = new Date(event.scheduledTime);
  const minute = now.getUTCMinutes();

  // The daily email is also Worker-triggered so GitHub schedule cron is not a
  // second scheduling layer. The comparison is done in ET so DST is automatic.
  if (isSummaryTick(now, env)) {
    const result = await dispatchSummary(env, "cron");
    const heartbeat = await recordHeartbeat(env, [result]);
    console.log(
      JSON.stringify({
        level: result.ok ? "info" : "error",
        event: "summary_dispatch_complete",
        cron: event.cron,
        scheduledTime: now.toISOString(),
        result,
        heartbeat,
      }),
    );
    return;
  }

  if (![5, 25, 45].includes(minute)) {
    console.log(
      JSON.stringify({
        level: "info",
        event: "cron_skipped_minute",
        cron: event.cron,
        minute,
        scheduledTime: now.toISOString(),
      }),
    );
    return;
  }

  const eligibleGames: Game[] = [];
  const windowErrors: Array<{ game: Game; message: string }> = [];

  // Multiple games can share the same cron expression. The per-game windows
  // keep Connections/Wordle independent from the later Spelling Bee window.
  for (const game of GAMES) {
    try {
      if (isGameInWindow(game, env, now)) {
        eligibleGames.push(game);
      }
    } catch (error) {
      windowErrors.push({
        game,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(
    JSON.stringify({
      level: windowErrors.length > 0 ? "error" : "info",
      event: "cron_tick",
      cron: event.cron,
      scheduledTime: now.toISOString(),
      eligibleGames,
      windowErrors,
    }),
  );

  const results = await Promise.all(eligibleGames.map((game) => dispatchGame(game, env, "cron")));
  const heartbeat = await recordHeartbeat(env, results);

  console.log(
    JSON.stringify({
      level: results.every((result) => result.ok) && heartbeat.ok ? "info" : "error",
      event: "cron_dispatch_complete",
      scheduledTime: now.toISOString(),
      results,
      heartbeat,
    }),
  );
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/health") {
    return jsonResponse({
      ok: true,
      service: "puzzle-cron-worker",
      games: GAMES,
      manualTargets: [...GAMES, "summary"],
      workflowId: workflowId(env),
      summaryWorkflowId: summaryWorkflowId(env),
      repo: repoSlug(env),
      timeZone: TIME_ZONE,
      summaryDispatchEt: summaryDispatchEt(env),
      patExpires: env.GITHUB_PAT_EXPIRES || null,
      heartbeatPath: heartbeatPath(env),
    });
  }

  if (url.pathname !== "/trigger") {
    return jsonResponse(
      {
        ok: false,
        error: "not_found",
        routes: ["/health", "/trigger?game=connections", "/trigger?game=summary"],
      },
      404,
    );
  }

  if (request.method !== "POST" && request.method !== "GET") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405, {
      Allow: "GET, POST",
    });
  }

  const authError = authorizeManualRequest(request, env, url);
  if (authError) {
    return authError;
  }

  const game = url.searchParams.get("game");
  if (!isManualTarget(game)) {
    return jsonResponse(
      {
        ok: false,
        error: "invalid_target",
        allowedTargets: [...GAMES, "summary"],
      },
      400,
    );
  }

  const result = game === "summary"
    ? await dispatchSummary(env, "manual")
    : await dispatchGame(game, env, "manual");
  const heartbeat = await recordHeartbeat(env, [result]);
  return jsonResponse({ ...result, heartbeat }, result.ok ? 202 : 502);
}

function authorizeManualRequest(request: Request, env: Env, url: URL): Response | null {
  if (!env.MANUAL_TRIGGER_TOKEN) {
    return jsonResponse({ ok: false, error: "manual_trigger_token_not_configured" }, 503);
  }

  const authorization = request.headers.get("Authorization") || "";
  const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  const queryToken = url.searchParams.get("token") || "";

  if (bearerToken === env.MANUAL_TRIGGER_TOKEN || queryToken === env.MANUAL_TRIGGER_TOKEN) {
    return null;
  }

  return jsonResponse({ ok: false, error: "unauthorized" }, 401);
}

async function dispatchGame(game: Game, env: Env, source: "cron" | "manual") {
  return dispatchWorkflow(
    {
      target: game,
      workflowId: workflowId(env),
      inputs: { game },
    },
    env,
    source,
  );
}

async function dispatchSummary(env: Env, source: "cron" | "manual") {
  return dispatchWorkflow(
    {
      target: "summary",
      workflowId: summaryWorkflowId(env),
      inputs: {},
    },
    env,
    source,
  );
}

async function dispatchWorkflow(
  dispatch: { target: ManualTarget; workflowId: string; inputs: Record<string, string> },
  env: Env,
  source: "cron" | "manual",
): Promise<DispatchResult> {
  const startedAt = new Date().toISOString();
  const endpoint = `https://api.github.com/repos/${repoSlug(env)}/actions/workflows/${dispatch.workflowId}/dispatches`;
  const body = {
    ref: env.GITHUB_REF || "main",
    inputs: dispatch.inputs,
  };

  console.log(
    JSON.stringify({
      level: "info",
      event: "dispatch_start",
      source,
      target: dispatch.target,
      repo: repoSlug(env),
      workflowId: dispatch.workflowId,
      ref: body.ref,
      startedAt,
    }),
  );

  try {
    assertRequiredEnv(env);

    // GitHub returns 204 No Content when workflow_dispatch is accepted.
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "gridhint-puzzle-cron-worker",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    const result = {
      ok: response.status === 204,
      source,
      target: dispatch.target,
      status: response.status,
      statusText: response.statusText,
      repo: repoSlug(env),
      workflowId: dispatch.workflowId,
      ref: body.ref,
      startedAt,
      finishedAt: new Date().toISOString(),
      message:
        response.status === 204
          ? "workflow_dispatch accepted by GitHub"
          : trimForLog(responseText || "GitHub did not accept workflow_dispatch"),
    };

    console.log(
      JSON.stringify({
        level: result.ok ? "info" : "error",
        event: "dispatch_finish",
        ...result,
      }),
    );

    return result;
  } catch (error) {
    const result = {
      ok: false,
      source,
      target: dispatch.target,
      repo: repoSlug(env),
      workflowId: dispatch.workflowId,
      ref: body.ref,
      startedAt,
      finishedAt: new Date().toISOString(),
      message: error instanceof Error ? error.message : String(error),
    };

    console.log(JSON.stringify({ level: "error", event: "dispatch_error", ...result }));
    return result;
  }
}

async function recordHeartbeat(env: Env, results: DispatchResult[]) {
  if (results.length === 0) {
    return { ok: true, skipped: true, message: "no dispatches to record" };
  }

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const existing = await readHeartbeat(env);
      const next = mergeHeartbeat(existing.content, results, env);
      const response = await putHeartbeat(env, next, existing.sha);
      if (response.ok) {
        return {
          ok: true,
          path: heartbeatPath(env),
          status: response.status,
          attempt,
          recordedTargets: results.map((result) => result.target),
        };
      }

      const body = await response.text();
      if (response.status === 409 && attempt < 3) {
        console.log(
          JSON.stringify({
            level: "warn",
            event: "heartbeat_conflict_retry",
            attempt,
            path: heartbeatPath(env),
          }),
        );
        continue;
      }

      return {
        ok: false,
        path: heartbeatPath(env),
        status: response.status,
        attempt,
        message: trimForLog(body || response.statusText),
      };
    } catch (error) {
      return {
        ok: false,
        path: heartbeatPath(env),
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return { ok: false, path: heartbeatPath(env), message: "heartbeat write retry limit reached" };
}

async function readHeartbeat(env: Env): Promise<{ content: Record<string, unknown>; sha?: string }> {
  const endpoint = `https://api.github.com/repos/${repoSlug(env)}/contents/${encodePath(heartbeatPath(env))}?ref=${encodeURIComponent(env.GITHUB_REF || "main")}`;
  const response = await githubFetch(env, endpoint, { method: "GET" });

  if (response.status === 404) {
    return { content: {} };
  }

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Could not read heartbeat: HTTP ${response.status} ${trimForLog(body)}`);
  }

  const payload = JSON.parse(body) as { content?: string; encoding?: string; sha?: string };
  const raw = payload.content && payload.encoding === "base64"
    ? base64DecodeUtf8(payload.content.replace(/\s/g, ""))
    : "{}";
  return { content: JSON.parse(raw), sha: payload.sha };
}

async function putHeartbeat(env: Env, heartbeat: Record<string, unknown>, sha?: string): Promise<Response> {
  const endpoint = `https://api.github.com/repos/${repoSlug(env)}/contents/${encodePath(heartbeatPath(env))}`;
  const body: Record<string, unknown> = {
    message: "chore: update puzzle worker heartbeat",
    branch: env.GITHUB_REF || "main",
    content: base64EncodeUtf8(`${JSON.stringify(heartbeat, null, 2)}\n`),
  };
  if (sha) body.sha = sha;

  return githubFetch(env, endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mergeHeartbeat(
  existing: Record<string, unknown>,
  results: DispatchResult[],
  env: Env,
): Record<string, unknown> {
  const now = new Date().toISOString();
  const previousDispatches = isRecord(existing.dispatches) ? existing.dispatches : {};
  const dispatches: Record<string, unknown> = { ...previousDispatches };

  for (const result of results) {
    const previous: Record<string, unknown> = isRecord(dispatches[result.target])
      ? dispatches[result.target] as Record<string, unknown>
      : {};
    const previousHistory = Array.isArray(previous.history) ? previous.history : [];
    const finished = new Date(result.finishedAt);
    const entry = {
      at: result.finishedAt,
      etDate: localDate(finished),
      source: result.source,
      ok: result.ok,
      status: result.status ?? null,
      workflowId: result.workflowId,
      message: result.message,
    };

    dispatches[result.target] = {
      ...previous,
      target: result.target,
      workflowId: result.workflowId,
      lastAttemptAt: result.finishedAt,
      lastAttemptEtDate: localDate(finished),
      lastSource: result.source,
      lastStatus: result.status ?? null,
      lastMessage: result.message,
      ...(result.ok
        ? {
            lastSuccessfulDispatchAt: result.finishedAt,
            lastSuccessfulDispatchEtDate: localDate(finished),
            lastSuccessfulStatus: result.status ?? null,
          }
        : {}),
      history: [...previousHistory, entry].slice(-50),
    };
  }

  return {
    ...existing,
    version: 1,
    updatedAt: now,
    timeZone: TIME_ZONE,
    githubPatExpires: env.GITHUB_PAT_EXPIRES || null,
    summaryDispatchEt: formatEtTime(summaryDispatchEt(env)),
    dispatches,
  };
}

function githubFetch(env: Env, endpoint: string, init: RequestInit): Promise<Response> {
  assertRequiredEnv(env);
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/vnd.github+json");
  headers.set("Authorization", `Bearer ${env.GITHUB_TOKEN}`);
  headers.set("User-Agent", "gridhint-puzzle-cron-worker");
  headers.set("X-GitHub-Api-Version", "2022-11-28");

  return fetch(endpoint, {
    ...init,
    headers,
  });
}

function isSummaryTick(now: Date, env: Env): boolean {
  const [hour, minute] = summaryDispatchEt(env);
  const parts = zonedParts(now);
  return parts.hour === hour && parts.minute === minute;
}

function isGameInWindow(game: Game, env: Env, now: Date): boolean {
  const windowSpec = String(env[WINDOW_ENV[game]] || DEFAULT_WINDOWS[game]);
  return parseWindowSpec(windowSpec).some(([startMinute, endMinute]) => {
    const parts = zonedParts(now);
    const currentMinute = parts.hour * 60 + parts.minute;
    if (startMinute <= endMinute) {
      return currentMinute >= startMinute && currentMinute <= endMinute;
    }

    return currentMinute >= startMinute || currentMinute <= endMinute;
  });
}

function parseWindowSpec(spec: string): Array<[number, number]> {
  return spec
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [start, end] = part.split("-").map((value) => value.trim());
      return [parseTime(start), parseTime(end)] as [number, number];
    });
}

function parseTime(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Invalid ET time '${value}'. Expected HH:MM.`);
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    throw new Error(`Invalid ET time '${value}'. Expected HH:MM.`);
  }

  return hour * 60 + minute;
}

function summaryDispatchEt(env: Env): [number, number] {
  const value = env.SUMMARY_DISPATCH_ET || DEFAULT_SUMMARY_DISPATCH_ET;
  const minutes = parseTime(value);
  return [Math.floor(minutes / 60), minutes % 60];
}

function formatEtTime([hour, minute]: [number, number]): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function heartbeatPath(env: Env): string {
  return env.HEARTBEAT_PATH || DEFAULT_HEARTBEAT_PATH;
}

function zonedParts(date: Date): { year: number; month: number; day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
    hour: Number(byType.hour),
    minute: Number(byType.minute),
  };
}

function localDate(date: Date): string {
  const parts = zonedParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function encodePath(value: string): string {
  return value.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function base64EncodeUtf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64DecodeUtf8(value: string): string {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function assertRequiredEnv(env: Env): void {
  const missing = ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"].filter(
    (key) => !env[key as keyof Env],
  );

  if (missing.length > 0) {
    throw new Error(`Missing required environment values: ${missing.join(", ")}`);
  }
}

function repoSlug(env: Env): string {
  return `${env.GITHUB_OWNER || "unset-owner"}/${env.GITHUB_REPO || "unset-repo"}`;
}

function workflowId(env: Env): string {
  return env.GITHUB_WORKFLOW_ID || "daily-puzzle.yml";
}

function summaryWorkflowId(env: Env): string {
  return env.SUMMARY_WORKFLOW_ID || "daily-puzzle-summary.yml";
}

function isGame(value: string | null): value is Game {
  return GAMES.includes(value as Game);
}

function isManualTarget(value: string | null): value is ManualTarget {
  return isGame(value) || value === "summary";
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function trimForLog(value: string): string {
  return value.length > 500 ? `${value.slice(0, 500)}...` : value;
}
