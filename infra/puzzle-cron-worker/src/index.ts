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
  CONNECTIONS_WINDOW_UTC?: string;
  WORDLE_WINDOW_UTC?: string;
  SPELLING_BEE_WINDOW_UTC?: string;
}

interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

const GAMES: Game[] = ["connections", "wordle", "spelling-bee"];

const DEFAULT_WINDOWS: Record<Game, string> = {
  connections: "04:05-06:05",
  wordle: "04:05-06:05",
  "spelling-bee": "07:05-10:05",
};

const WINDOW_ENV: Record<Game, keyof Env> = {
  connections: "CONNECTIONS_WINDOW_UTC",
  wordle: "WORDLE_WINDOW_UTC",
  "spelling-bee": "SPELLING_BEE_WINDOW_UTC",
};

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
  // second scheduling layer.
  if (isSummaryTick(now)) {
    const result = await dispatchSummary(env, "cron");
    console.log(
      JSON.stringify({
        level: result.ok ? "info" : "error",
        event: "summary_dispatch_complete",
        cron: event.cron,
        scheduledTime: now.toISOString(),
        result,
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

  console.log(
    JSON.stringify({
      level: results.every((result) => result.ok) ? "info" : "error",
      event: "cron_dispatch_complete",
      scheduledTime: now.toISOString(),
      results,
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
  return jsonResponse(result, result.ok ? 202 : 502);
}

function authorizeManualRequest(request: Request, env: Env, url: URL): Response | null {
  // Leave manual triggering open only if no token is configured. Production
  // should set MANUAL_TRIGGER_TOKEN and use the Authorization header.
  if (!env.MANUAL_TRIGGER_TOKEN) {
    return null;
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
) {
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

function isSummaryTick(now: Date): boolean {
  return now.getUTCHours() === 11 && now.getUTCMinutes() === 30;
}

function isGameInWindow(game: Game, env: Env, now: Date): boolean {
  const windowSpec = String(env[WINDOW_ENV[game]] || DEFAULT_WINDOWS[game]);
  return parseWindowSpec(windowSpec).some(([startMinute, endMinute]) => {
    const currentMinute = now.getUTCHours() * 60 + now.getUTCMinutes();
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
    throw new Error(`Invalid UTC time '${value}'. Expected HH:MM.`);
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    throw new Error(`Invalid UTC time '${value}'. Expected HH:MM.`);
  }

  return hour * 60 + minute;
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
