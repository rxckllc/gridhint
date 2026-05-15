import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const OUTPUT_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'dashboard.json');

function parseJson(value) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function maybeDecodeBase64(value) {
    const normalized = value.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    if (!normalized || normalized.length % 4 === 1 || !/^[A-Za-z0-9+/=]+$/.test(normalized)) {
        return null;
    }

    try {
        const decoded = Buffer.from(normalized, 'base64').toString('utf8').trim();
        return decoded.startsWith('{') || decoded.startsWith('"') ? decoded : null;
    } catch {
        return null;
    }
}

function repairPrivateKeyNewlines(value) {
    return value.replace(/("private_key"\s*:\s*")([\s\S]*?)("\s*(?:,|}))/m, (_match, prefix, key, suffix) => {
        const normalizedKey = key
            .replace(/\\r\\n/g, '\n')
            .replace(/\\n/g, '\n')
            .replace(/\\(?=\r?\n)/g, '')
            .replace(/\r?\n/g, '\n');

        return `${prefix.slice(0, -1)}${JSON.stringify(normalizedKey)}${suffix.slice(1)}`;
    });
}

function parseServiceAccountCredentials(rawValue) {
    const raw = rawValue.trim();
    const candidates = [{ label: 'raw JSON', value: raw }];

    const unwrapped = parseJson(raw);
    if (typeof unwrapped === 'string') {
        candidates.push({ label: 'JSON string', value: unwrapped.trim() });
    }

    const decoded = maybeDecodeBase64(raw);
    if (decoded) {
        candidates.push({ label: 'base64 JSON', value: decoded });
    }

    for (const candidate of candidates) {
        const parsed = parseJson(candidate.value);
        if (parsed && typeof parsed === 'object') {
            return { credentials: parsed, source: candidate.label };
        }

        const repaired = repairPrivateKeyNewlines(candidate.value);
        if (repaired !== candidate.value) {
            const repairedParsed = parseJson(repaired);
            if (repairedParsed && typeof repairedParsed === 'object') {
                return { credentials: repairedParsed, source: `${candidate.label} with repaired private_key newlines` };
            }
        }
    }

    throw new Error('GA4_SERVICE_ACCOUNT_KEY must be valid service account JSON or base64-encoded JSON.');
}

async function main() {
    if (!PROPERTY_ID) {
        if (process.env.CI) {
            throw new Error('❌ Missing GA4_PROPERTY_ID env var in CI. Cannot proceed.');
        }
        console.warn('⚠️ Missing GA4_PROPERTY_ID env var. Generating mock data for dashboard.');
        generateMockData();
        return;
    }

    let clientOpts = {};
    if (process.env.GA4_SERVICE_ACCOUNT_KEY) {
        try {
            console.log('Parsing GA4_SERVICE_ACCOUNT_KEY...');
            const { credentials, source } = parseServiceAccountCredentials(process.env.GA4_SERVICE_ACCOUNT_KEY);
            clientOpts.credentials = credentials;
            console.log(`GA4 client configured for: ${clientOpts.credentials.client_email} (${source})`);
        } catch (e) {
            console.error('Failed to parse GA4_SERVICE_ACCOUNT_KEY:', e.message);
            if (process.env.CI) throw e;
            generateMockData();
            return;
        }
    } else if (process.env.CI) {
        throw new Error('❌ Missing GA4_SERVICE_ACCOUNT_KEY env var in CI.');
    }

    const analytics = new BetaAnalyticsDataClient(clientOpts);

    async function query(dims, metrics, orderBy, limit = 20, dateRange = '30daysAgo', endDate = 'today') {      
        const propPath = PROPERTY_ID.includes('properties/') ? PROPERTY_ID : `properties/${PROPERTY_ID}`;       
        const [res] = await analytics.runReport({
            property: propPath,
            dateRanges: [{ startDate: dateRange, endDate }],
            dimensions: dims.map(name => ({ name })),
            metrics: metrics.map(name => ({ name })),
            orderBys: orderBy ? [orderBy] : [],
            limit,
        });
        return (res.rows || []).map(r => ({
            dims: r.dimensionValues.map(v => v.value),
            vals: r.metricValues.map(v => v.value),
        }));
    }

    try {
        const desc = (m) => ({ metric: { metricName: m }, desc: true });

        const [overview30d, topPages, referrers, dailyTrend] = await Promise.all([
            query([], ['sessions', 'activeUsers', 'screenPageViews', 'averageSessionDuration', 'bounceRate'], null, 1, '30daysAgo'),
            query(['pagePath'], ['screenPageViews', 'activeUsers'], desc('screenPageViews'), 20, '30daysAgo'),  
            query(['sessionSource'], ['sessions'], desc('sessions'), 10, '30daysAgo'),
            query(['date'], ['sessions', 'activeUsers', 'screenPageViews'], { dimension: { dimensionName: 'date' }, desc: false }, 30, '30daysAgo')
        ]);

        const data = {
            overview30d: overview30d[0] || { dims: [], vals: ['0', '0', '0', '0', '0'] },
            topPages,
            referrers,
            dailyTrend,
            updatedAt: new Date().toISOString(),
            isMock: false
        };

        if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
        console.log(`✅ Dashboard data written to ${OUTPUT_FILE}`);

    } catch (e) {
        console.error('❌ Failed to fetch GA4 data:', e.message);
        generateMockData();
    }
}

function generateMockData() {
    const today = new Date();
    const dailyTrend = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const yyyymmdd = d.toISOString().split('T')[0].replace(/-/g, '');
        // Simulate a traffic spike 5 days ago and 15 days ago
        let sessions = Math.floor(Math.random() * 50 + 200);
        if (i === 5 || i === 6) sessions += 400;
        if (i === 15 || i === 16) sessions += 350;

        dailyTrend.push({
            dims: [yyyymmdd],
            vals: [sessions.toString(), "0", (sessions * 1.8).toString()]
        });
    }

    const data = {
        overview30d: { dims: [], vals: ['8520', '7100', '15200', '145', '0.35'] },
        topPages: [
            { dims: ['/'], vals: ['5100', '3500'] },
            { dims: ['/word-games/connections/hints'], vals: ['4500', '3200'] },
            { dims: ['/word-games/wordle/today'], vals: ['3900', '2800'] },
            { dims: ['/word-games/spelling-bee/today'], vals: ['2750', '2100'] },
            { dims: ['/word-games/anagram-jumble/unscramble'], vals: ['1200', '900'] }
        ],
        referrers: [
            { dims: ['google'], vals: ['5500'] },
            { dims: ['direct'], vals: ['2200'] },
            { dims: ['bing'], vals: ['600'] }
        ],
        dailyTrend,
        updatedAt: new Date().toISOString(),
        isMock: true
    };
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log(`✅ Mock dashboard data written to ${OUTPUT_FILE}`);
}

main();
