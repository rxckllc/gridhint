import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SMTP_HOST = process.env.REPORT_SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.REPORT_SMTP_PORT || '465', 10);
const SMTP_USER = process.env.REPORT_SMTP_USER;
const SMTP_PASS = process.env.REPORT_SMTP_PASS;
const REPORT_RECEIVER = process.env.REPORT_RECEIVER || 'bernicetsai@yahoo.com';
const DRY_RUN = process.argv.includes('--dry-run');
const HTML_OUT = process.env.SUMMARY_HTML_OUT || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'rxckllc/gridhint';
const PUZZLE_WORKFLOW_ID = process.env.PUZZLE_WORKFLOW_ID || 'daily-puzzle.yml';

const GENERATED_ROOT = path.join(__dirname, '../data/generated');
const WORKER_HEARTBEAT_PATH = path.join(GENERATED_ROOT, 'worker-heartbeat.json');

const GAMES = [
  {
    key: 'connections',
    label: 'Connections',
    summary: (data) => `${Array.isArray(data.grid) ? data.grid.length : 0} words, ${Array.isArray(data.groups) ? data.groups.length : 0} groups`,
    validate: (data) => {
      const errors = [];
      if (!Array.isArray(data.grid) || data.grid.length !== 16) errors.push('grid must contain 16 words');
      if (!Array.isArray(data.groups) || data.groups.length !== 4) errors.push('groups must contain 4 entries');
      return errors;
    },
  },
  {
    key: 'wordle',
    label: 'Wordle',
    summary: (data) => `answer ${String(data.solution || '').toUpperCase() || 'unknown'}${data.dayNumber ? `, puzzle #${data.dayNumber}` : ''}`,
    validate: (data) => {
      const errors = [];
      if (typeof data.solution !== 'string' || !/^[A-Za-z]{5}$/.test(data.solution)) errors.push('solution must be a 5-letter word');
      return errors;
    },
  },
  {
    key: 'spelling-bee',
    label: 'Spelling Bee',
    summary: (data) => `${data.centerLetter || '?'} + ${Array.isArray(data.outerLetters) ? data.outerLetters.join('') : '?'}, ${data.hints?.totalWords || 0} words`,
    validate: (data) => {
      const errors = [];
      if (typeof data.centerLetter !== 'string' || data.centerLetter.length !== 1) errors.push('centerLetter must be one letter');
      if (!Array.isArray(data.outerLetters) || data.outerLetters.length !== 6) errors.push('outerLetters must contain 6 letters');
      if (typeof data.hints?.totalWords !== 'number') errors.push('hints.totalWords must be numeric');
      return errors;
    },
  },
];

function todayInNewYork() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

const TARGET_DATE = process.env.SUMMARY_DATE || todayInNewYork();

function dateInNewYork(date) {
  const value = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function parseDateOnly(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function daysUntil(expirationDate, fromDate) {
  const expires = parseDateOnly(expirationDate);
  const from = parseDateOnly(fromDate);
  if (expires === null || from === null) return null;
  return Math.ceil((expires - from) / 86400000);
}

function isWithinLastHours(isoValue, hours) {
  if (!isoValue) return false;
  const timestamp = Date.parse(isoValue);
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp <= hours * 60 * 60 * 1000;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function relative(filePath) {
  return path.relative(process.cwd(), filePath);
}

function statusRank(status) {
  return { OK: 0, NOT_ATTEMPTED: 1, PARTIAL: 2, MISSING: 3, ERROR: 4, FAILED: 5 }[status] ?? 0;
}

function maxStatus(current, next) {
  return statusRank(next) > statusRank(current) ? next : current;
}

function checkGeneratedPuzzle(game) {
  const gameDir = path.join(GENERATED_ROOT, game.key);
  const datePath = path.join(gameDir, `${TARGET_DATE}.json`);
  const latestPath = path.join(gameDir, 'latest.json');
  const manifestPath = path.join(gameDir, 'manifest.json');
  const notes = [];
  let status = 'OK';
  let dateData = null;
  let manifest = null;

  function mark(nextStatus, message) {
    status = maxStatus(status, nextStatus);
    if (message) notes.push(message);
  }

  if (!fs.existsSync(gameDir)) {
    return {
      status: 'MISSING',
      summary: 'generated directory missing',
      notes: [`Missing ${relative(gameDir)}`],
      lastAttempt: '',
    };
  }

  if (!fs.existsSync(datePath)) {
    mark('MISSING', `Missing ${relative(datePath)}`);
  } else {
    try {
      dateData = readJson(datePath);
      if (dateData.date !== TARGET_DATE) mark('ERROR', `Date file contains ${dateData.date || 'missing date'}`);
      const validationErrors = game.validate(dateData);
      if (validationErrors.length) mark('ERROR', validationErrors.join('; '));
    } catch (err) {
      mark('ERROR', `Could not parse ${relative(datePath)}: ${err.message}`);
    }
  }

  if (!fs.existsSync(latestPath)) {
    mark('MISSING', `Missing ${relative(latestPath)}`);
  } else {
    try {
      const latest = readJson(latestPath);
      if (latest.date !== TARGET_DATE) mark('ERROR', `latest.json points to ${latest.date || 'missing date'}`);
    } catch (err) {
      mark('ERROR', `Could not parse latest.json: ${err.message}`);
    }
  }

  if (!fs.existsSync(manifestPath)) {
    mark('MISSING', `Missing ${relative(manifestPath)}`);
  } else {
    try {
      manifest = readJson(manifestPath);
      if (manifest.latest !== TARGET_DATE) mark('ERROR', `manifest latest is ${manifest.latest || 'missing date'}`);
      if (!Array.isArray(manifest.dates) || !manifest.dates.includes(TARGET_DATE)) {
        mark('ERROR', `manifest dates does not include ${TARGET_DATE}`);
      }
    } catch (err) {
      mark('ERROR', `Could not parse manifest.json: ${err.message}`);
    }
  }

  return {
    status,
    summary: dateData ? game.summary(dateData) : 'no current puzzle data',
    notes,
    lastAttempt: dateData?.updatedAt || manifest?.updatedAt || '',
  };
}

function endpointStatus(endpoint, overall) {
  if (endpoint?.ok) return 'OK';
  if (overall === 'NOT_ATTEMPTED') return 'NOT_ATTEMPTED';
  return 'FAILED';
}

function checkIndexNow(game) {
  const statusPath = path.join(GENERATED_ROOT, game.key, 'indexnow-status.json');
  if (!fs.existsSync(statusPath)) {
    return {
      status: 'NOT_ATTEMPTED',
      endpoints: [],
      repeatedFailures: [],
      notes: [`Missing ${relative(statusPath)}`],
      lastAttempt: '',
    };
  }

  try {
    const data = readJson(statusPath);
    const overall = ['OK', 'PARTIAL', 'FAILED', 'NOT_ATTEMPTED'].includes(data.overall)
      ? data.overall
      : 'NOT_ATTEMPTED';
    const endpointConsecutiveFailures = data.endpointConsecutiveFailures || {};
    const endpoints = Object.entries(data.endpoints || {}).map(([name, endpoint]) => ({
      endpoint: name,
      status: endpointStatus(endpoint, overall),
      httpStatus: endpoint?.status ?? null,
      detail: endpoint?.error || endpoint?.body || '',
      consecutiveFailures: endpointConsecutiveFailures[name] || 0,
    }));
    const repeatedFailures = endpoints
      .filter((endpoint) => endpoint.status === 'FAILED' && endpoint.consecutiveFailures >= 2)
      .map((endpoint) => ({
        endpoint: endpoint.endpoint,
        days: endpoint.consecutiveFailures,
      }));

    return {
      status: overall,
      endpoints,
      repeatedFailures,
      notes: data.reason ? [data.reason] : [],
      lastAttempt: data.timestamp || data.updatedAt || '',
    };
  } catch (err) {
    return {
      status: 'FAILED',
      endpoints: [],
      repeatedFailures: [],
      notes: [`Could not parse ${relative(statusPath)}: ${err.message}`],
      lastAttempt: '',
    };
  }
}

function readWorkerHeartbeat() {
  if (!fs.existsSync(WORKER_HEARTBEAT_PATH)) {
    return {
      status: 'MISSING',
      notes: [`Missing ${relative(WORKER_HEARTBEAT_PATH)}`],
      data: null,
    };
  }

  try {
    return { status: 'OK', notes: [], data: readJson(WORKER_HEARTBEAT_PATH) };
  } catch (err) {
    return {
      status: 'ERROR',
      notes: [`Could not parse ${relative(WORKER_HEARTBEAT_PATH)}: ${err.message}`],
      data: null,
    };
  }
}

async function fetchWorkflowRuns() {
  if (!GITHUB_TOKEN) {
    return {
      status: 'UNKNOWN',
      notes: ['GITHUB_TOKEN is unavailable; workflow run checks skipped'],
      runs: [],
    };
  }

  const url = `https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/workflows/${PUZZLE_WORKFLOW_ID}/runs?event=workflow_dispatch&per_page=100`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'User-Agent': 'gridhint-daily-puzzle-summary',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  const body = await response.text();
  if (!response.ok) {
    return {
      status: 'ERROR',
      notes: [`GitHub workflow run check failed: HTTP ${response.status} ${body.slice(0, 240)}`],
      runs: [],
    };
  }

  const payload = JSON.parse(body);
  return {
    status: 'OK',
    notes: [],
    runs: Array.isArray(payload.workflow_runs) ? payload.workflow_runs : [],
  };
}

function workflowRunMatchesGame(run, game) {
  const title = `${run.display_title || ''} ${run.name || ''}`.toLowerCase();
  return title.includes(`(${game.key})`) || title.includes('(all)');
}

function buildWorkflowHealth(workflowRuns) {
  const todayRuns = workflowRuns.runs.filter((run) => dateInNewYork(run.created_at) === TARGET_DATE);
  const byGame = Object.fromEntries(GAMES.map((game) => {
    const matches = todayRuns.filter((run) => workflowRunMatchesGame(run, game));
    const latest = matches.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0] || null;
    return [game.key, {
      status: latest ? 'OK' : 'MISSING',
      lastRunAt: latest?.created_at || '',
      conclusion: latest?.conclusion || latest?.status || '',
      url: latest?.html_url || '',
    }];
  }));

  return {
    status: workflowRuns.status,
    notes: workflowRuns.notes,
    byGame,
  };
}

function buildPatHealth(heartbeat) {
  const expirationDate = process.env.GITHUB_PAT_EXPIRES || heartbeat?.githubPatExpires || heartbeat?.patExpires || '';
  const remainingDays = daysUntil(expirationDate, TARGET_DATE);

  if (!expirationDate || remainingDays === null) {
    return {
      status: 'UNKNOWN',
      color: 'YELLOW',
      subject: null,
      message: 'GitHub PAT: expiration date unknown',
      detail: 'Set GITHUB_PAT_EXPIRES in the Worker vars.',
      remainingDays: null,
      expirationDate,
    };
  }

  if (remainingDays < 0) {
    return {
      status: 'EXPIRED',
      color: 'RED',
      subject: 'PAT EXPIRED - puzzle refresh broken',
      message: 'GitHub PAT: expired',
      detail: `Expiration date: ${expirationDate}`,
      remainingDays,
      expirationDate,
    };
  }

  if (remainingDays < 7) {
    return {
      status: 'URGENT',
      color: 'RED',
      subject: `URGENT: PAT expires in ${remainingDays} days`,
      message: `GitHub PAT: expires in ${remainingDays} days`,
      detail: `Expiration date: ${expirationDate}`,
      remainingDays,
      expirationDate,
    };
  }

  if (remainingDays < 30) {
    return {
      status: 'WARNING',
      color: 'YELLOW',
      subject: `PAT expires in ${remainingDays} days`,
      message: `GitHub PAT: expires in ${remainingDays} days`,
      detail: `Expiration date: ${expirationDate}`,
      remainingDays,
      expirationDate,
    };
  }

  return {
    status: 'OK',
    color: 'GREEN',
    subject: null,
    message: `GitHub PAT: expires in ${remainingDays} days`,
    detail: `Expiration date: ${expirationDate}`,
    remainingDays,
    expirationDate,
  };
}

function buildCronHealth(heartbeatState, workflowHealth) {
  const heartbeat = heartbeatState.data;
  const dispatches = heartbeat?.dispatches || {};
  const dispatchByGame = Object.fromEntries(GAMES.map((game) => {
    const entry = dispatches[game.key] || {};
    const okToday = entry.lastSuccessfulDispatchEtDate === TARGET_DATE;
    return [game.key, {
      status: okToday ? 'OK' : 'MISSING',
      lastDispatchAt: entry.lastSuccessfulDispatchAt || '',
      message: entry.lastMessage || '',
    }];
  }));

  const successfulDispatchTimes = Object.values(dispatches)
    .map((entry) => entry?.lastSuccessfulDispatchAt)
    .filter(Boolean);
  const silent24h = successfulDispatchTimes.length === 0
    || !successfulDispatchTimes.some((value) => isWithinLastHours(value, 24));
  const missingDispatches = Object.values(dispatchByGame).some((entry) => entry.status !== 'OK');
  const missingRuns = Object.values(workflowHealth.byGame || {}).some((entry) => entry.status !== 'OK');
  const status = silent24h ? 'SILENT' : (missingDispatches || missingRuns || heartbeatState.status !== 'OK' || workflowHealth.status === 'ERROR' ? 'WARNING' : 'OK');

  return {
    status,
    color: status === 'OK' ? 'GREEN' : (silent24h ? 'RED' : 'YELLOW'),
    subject: silent24h ? 'URGENT: Cron pipeline silent for 24h' : null,
    dispatchByGame,
    workflowByGame: workflowHealth.byGame,
    silent24h,
    notes: [...heartbeatState.notes, ...workflowHealth.notes],
  };
}

function buildDstHealth() {
  return {
    status: 'OK',
    color: 'GREEN',
    message: 'DST: automatic America/New_York filtering active',
    detail: 'Cloudflare cron fires a wide UTC window; the Worker filters real ET puzzle windows.',
  };
}

function buildSystemHealth(heartbeatState, workflowHealth) {
  const heartbeat = heartbeatState.data || {};
  return {
    pat: buildPatHealth(heartbeat),
    cron: buildCronHealth(heartbeatState, workflowHealth),
    dst: buildDstHealth(),
  };
}

function subjectFor(rows, systemHealth) {
  if (systemHealth.pat.status === 'EXPIRED') return systemHealth.pat.subject;
  if (systemHealth.pat.status === 'URGENT') return systemHealth.pat.subject;
  if (systemHealth.cron.silent24h) return systemHealth.cron.subject;

  const puzzleProblem = rows.find((row) => row.puzzle.status === 'MISSING' || row.puzzle.status === 'ERROR');
  if (puzzleProblem) return `GridHint daily: ${puzzleProblem.label} ${puzzleProblem.puzzle.status}`;

  const failedIndexNow = rows.find((row) => row.indexNow.status === 'FAILED');
  if (failedIndexNow) return `GridHint daily: ${failedIndexNow.label} IndexNow failed`;

  const repeated = rows.find((row) => row.indexNow.repeatedFailures.length > 0);
  if (repeated) {
    const first = repeated.indexNow.repeatedFailures[0];
    return `GridHint daily: ${repeated.label} ${first.endpoint} IndexNow failed ${first.days} days`;
  }

  if (systemHealth.pat.status === 'WARNING') return systemHealth.pat.subject;

  return 'GridHint daily: all OK';
}

function statusColor(status) {
  return {
    OK: '#166534',
    MISSING: '#92400e',
    ERROR: '#991b1b',
    PARTIAL: '#92400e',
    FAILED: '#991b1b',
    NOT_ATTEMPTED: '#475569',
  }[status] || '#334155';
}

function statusBackground(status) {
  return {
    OK: '#dcfce7',
    MISSING: '#fef3c7',
    ERROR: '#fee2e2',
    PARTIAL: '#fef3c7',
    FAILED: '#fee2e2',
    NOT_ATTEMPTED: '#e2e8f0',
  }[status] || '#f1f5f9';
}

function statusPill(status) {
  return `<span style="display:inline-block; min-width:92px; text-align:center; padding:4px 8px; border-radius:999px; font-size:12px; font-weight:700; color:${statusColor(status)}; background:${statusBackground(status)};">${escapeHtml(status)}</span>`;
}

function healthColors(color) {
  return {
    GREEN: { border: '#86efac', background: '#f0fdf4', text: '#166534' },
    YELLOW: { border: '#facc15', background: '#fefce8', text: '#854d0e' },
    RED: { border: '#fca5a5', background: '#fef2f2', text: '#991b1b' },
  }[color] || { border: '#cbd5e1', background: '#f8fafc', text: '#334155' };
}

function renderHealthRow(label, color, message, detail) {
  const colors = healthColors(color);
  return `
    <tr>
      <td style="padding:10px 12px; border-top:1px solid #e2e8f0; font-weight:700;">${escapeHtml(label)}</td>
      <td style="padding:10px 12px; border-top:1px solid #e2e8f0;">
        <span style="display:inline-block; min-width:72px; text-align:center; padding:4px 8px; border-radius:999px; font-size:12px; font-weight:700; color:${colors.text}; background:${colors.background}; border:1px solid ${colors.border};">${escapeHtml(color)}</span>
      </td>
      <td style="padding:10px 12px; border-top:1px solid #e2e8f0;">${escapeHtml(message)}<br><span style="color:#64748b;">${escapeHtml(detail)}</span></td>
    </tr>
  `;
}

function summarizeGameMap(prefix, byGame) {
  const parts = GAMES.map((game) => `${game.key} ${byGame?.[game.key]?.status || 'UNKNOWN'}`);
  return `${prefix}: ${parts.join(', ')}`;
}

function renderSystemHealth(systemHealth) {
  const cronDetail = [
    summarizeGameMap('Worker dispatches today', systemHealth.cron.dispatchByGame),
    summarizeGameMap('Workflow runs today', systemHealth.cron.workflowByGame),
    ...systemHealth.cron.notes,
  ].filter(Boolean).join(' | ');

  return `
    <div style="margin:0 0 18px; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
      <div style="padding:12px 14px; background:#ecfeff; border-bottom:1px solid #e2e8f0;">
        <h2 style="margin:0; font-size:18px; color:#164e63;">System Health</h2>
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; font-size:14px;">
        <tbody>
          ${renderHealthRow('GitHub PAT', systemHealth.pat.color, systemHealth.pat.message, systemHealth.pat.detail)}
          ${renderHealthRow('Cron pipeline', systemHealth.cron.color, systemHealth.cron.silent24h ? 'Cron pipeline silent for 24h' : 'Cron pipeline heartbeat active', cronDetail)}
          ${renderHealthRow('DST', systemHealth.dst.color, systemHealth.dst.message, systemHealth.dst.detail)}
        </tbody>
      </table>
    </div>
  `;
}

function renderList(items, empty = 'None') {
  const clean = [...new Set(items.filter(Boolean))];
  if (!clean.length) return `<span style="color:#64748b;">${escapeHtml(empty)}</span>`;
  return `<ul style="margin:0; padding-left:18px;">${clean.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function renderEndpointSummary(endpoints) {
  if (!endpoints.length) return '<span style="color:#64748b;">No endpoint details</span>';
  return `<ul style="margin:0; padding-left:18px;">${endpoints.map((endpoint) => {
    const http = endpoint.httpStatus ? ` HTTP ${endpoint.httpStatus}` : '';
    const detail = endpoint.detail ? ` - ${endpoint.detail}` : '';
    return `<li><strong>${escapeHtml(endpoint.status)}</strong> ${escapeHtml(endpoint.endpoint)}${escapeHtml(http)}${escapeHtml(detail)}</li>`;
  }).join('')}</ul>`;
}

function buildHtml(rows, subject, systemHealth) {
  const tableRows = rows.map((row) => {
    const lastAttempt = row.indexNow.lastAttempt || row.puzzle.lastAttempt || 'unknown';
    const notes = [
      ...row.puzzle.notes,
      ...row.indexNow.notes,
      ...row.indexNow.repeatedFailures.map((failure) => `${failure.endpoint} failed ${failure.days} consecutive days`),
    ];
    return `
      <tr>
        <td style="padding:10px 12px; border-top:1px solid #e2e8f0; font-weight:700;">${escapeHtml(row.label)}</td>
        <td style="padding:10px 12px; border-top:1px solid #e2e8f0;">${statusPill(row.puzzle.status)}</td>
        <td style="padding:10px 12px; border-top:1px solid #e2e8f0;">${statusPill(row.indexNow.status)}</td>
        <td style="padding:10px 12px; border-top:1px solid #e2e8f0;">${escapeHtml(lastAttempt)}</td>
        <td style="padding:10px 12px; border-top:1px solid #e2e8f0;">${escapeHtml(row.puzzle.summary)}<br>${renderEndpointSummary(row.indexNow.endpoints)}</td>
        <td style="padding:10px 12px; border-top:1px solid #e2e8f0;">${renderList(notes)}</td>
      </tr>
    `;
  }).join('');

  const partialOnly = rows.filter((row) => row.indexNow.status === 'PARTIAL' && !row.indexNow.repeatedFailures.length);

  return `
    <div style="font-family:Arial, sans-serif; max-width:900px; margin:0 auto; color:#1e293b;">
      <div style="background:#1e2d4a; padding:24px; border-radius:12px 12px 0 0;">
        <h1 style="color:#ffffff; margin:0; font-size:24px;">GridHint Daily Puzzle Summary</h1>
        <p style="color:#cbd5e1; margin:6px 0 0; font-size:14px;">${escapeHtml(TARGET_DATE)} - ${escapeHtml(subject)}</p>
      </div>
      <div style="padding:24px; border:1px solid #e2e8f0; border-top:none; background:#f8fafc; border-radius:0 0 12px 12px;">
        ${renderSystemHealth(systemHealth)}
        <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; font-size:14px;">
          <thead>
            <tr style="background:#eef2ff; color:#334155; text-align:left;">
              <th style="padding:10px 12px;">Game</th>
              <th style="padding:10px 12px;">Puzzle</th>
              <th style="padding:10px 12px;">IndexNow</th>
              <th style="padding:10px 12px;">Last attempt</th>
              <th style="padding:10px 12px;">Details</th>
              <th style="padding:10px 12px;">Notes</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        ${partialOnly.length ? `<p style="margin:16px 0 0; padding:12px; background:#fff7ed; border:1px solid #fed7aa; border-radius:8px; color:#9a3412; font-size:14px;">Single-day PARTIAL IndexNow status is noted here only and did not affect the subject: ${escapeHtml(partialOnly.map((row) => row.label).join(', '))}.</p>` : ''}
      </div>
      <div style="text-align:center; margin-top:16px; color:#64748b; font-size:12px;">
        &copy; ${new Date().getFullYear()} GridHint.com
      </div>
    </div>
  `;
}

async function sendSummary() {
  const rows = GAMES.map((game) => ({
    key: game.key,
    label: game.label,
    puzzle: checkGeneratedPuzzle(game),
    indexNow: checkIndexNow(game),
  }));
  const heartbeatState = readWorkerHeartbeat();
  const workflowRuns = await fetchWorkflowRuns();
  const workflowHealth = buildWorkflowHealth(workflowRuns);
  const systemHealth = buildSystemHealth(heartbeatState, workflowHealth);
  const subject = subjectFor(rows, systemHealth);
  const html = buildHtml(rows, subject, systemHealth);

  console.log(`[daily-puzzle-summary] date=${TARGET_DATE} subject="${subject}"`);
  console.log(`[daily-puzzle-summary] system: pat=${systemHealth.pat.status} cron=${systemHealth.cron.status} dst=${systemHealth.dst.status}`);
  console.log(`[daily-puzzle-summary] ${summarizeGameMap('worker-dispatches', systemHealth.cron.dispatchByGame)}`);
  console.log(`[daily-puzzle-summary] ${summarizeGameMap('workflow-runs', systemHealth.cron.workflowByGame)}`);
  for (const row of rows) {
    console.log(`[daily-puzzle-summary] ${row.key}: puzzle=${row.puzzle.status} indexnow=${row.indexNow.status}`);
  }

  if (HTML_OUT) {
    fs.mkdirSync(path.dirname(HTML_OUT), { recursive: true });
    fs.writeFileSync(HTML_OUT, html, 'utf8');
    console.log(`[daily-puzzle-summary] wrote HTML preview to ${HTML_OUT}`);
  }

  if (DRY_RUN) {
    console.log('[daily-puzzle-summary] dry run complete; email not sent.');
    return;
  }

  if (!SMTP_USER || !SMTP_PASS) {
    if (process.env.CI) {
      throw new Error('Missing SMTP credentials (REPORT_SMTP_USER/PASS) in CI. Cannot send puzzle summary.');
    }
    console.warn('[daily-puzzle-summary] SMTP credentials missing. Skipping email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: `"GridHint Bot" <${SMTP_USER}>`,
    to: REPORT_RECEIVER,
    subject,
    html,
  });

  console.log(`[daily-puzzle-summary] email sent to ${REPORT_RECEIVER}`);
}

sendSummary().catch((err) => {
  console.error('[daily-puzzle-summary] failed:', err);
  process.exit(1);
});
