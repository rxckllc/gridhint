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

const GENERATED_ROOT = path.join(__dirname, '../data/generated');

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

function subjectFor(rows) {
  const puzzleProblem = rows.find((row) => row.puzzle.status === 'MISSING' || row.puzzle.status === 'ERROR');
  if (puzzleProblem) return `GridHint daily: ${puzzleProblem.label} ${puzzleProblem.puzzle.status}`;

  const failedIndexNow = rows.find((row) => row.indexNow.status === 'FAILED');
  if (failedIndexNow) return `GridHint daily: ${failedIndexNow.label} IndexNow failed`;

  const repeated = rows.find((row) => row.indexNow.repeatedFailures.length > 0);
  if (repeated) {
    const first = repeated.indexNow.repeatedFailures[0];
    return `GridHint daily: ${repeated.label} ${first.endpoint} IndexNow failed ${first.days} days`;
  }

  const notAttempted = rows.find((row) => row.indexNow.status === 'NOT_ATTEMPTED');
  if (notAttempted) return `GridHint daily: ${notAttempted.label} IndexNow not attempted`;

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

function buildHtml(rows, subject) {
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
  const subject = subjectFor(rows);
  const html = buildHtml(rows, subject);

  console.log(`[daily-puzzle-summary] date=${TARGET_DATE} subject="${subject}"`);
  for (const row of rows) {
    console.log(`[daily-puzzle-summary] ${row.key}: puzzle=${row.puzzle.status} indexnow=${row.indexNow.status}`);
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
