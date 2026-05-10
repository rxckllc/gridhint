import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SMTP_HOST = process.env.REPORT_SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.REPORT_SMTP_PORT || '465');
const SMTP_USER = process.env.REPORT_SMTP_USER;
const SMTP_PASS = process.env.REPORT_SMTP_PASS;
const REPORT_RECEIVER = process.env.REPORT_RECEIVER || 'bernicetsai@yahoo.com';

const DASHBOARD_DATA_PATH = path.join(__dirname, '../data/dashboard.json');

async function sendReport() {
    if (!SMTP_USER || !SMTP_PASS) {
        if (process.env.CI) {
            throw new Error('❌ Missing SMTP credentials (REPORT_SMTP_USER/PASS) in CI. Cannot send report.');  
        }
        console.warn('⚠️ SMTP credentials missing. Skipping email report.');
        return;
    }

    console.log(`Preparing report for ${REPORT_RECEIVER} via ${SMTP_HOST}:${SMTP_PORT}...`);

    let data;
    try {
        data = JSON.parse(fs.readFileSync(DASHBOARD_DATA_PATH, 'utf8'));
        console.log(`Loaded dashboard data. Updated at: ${data.updatedAt} (isMock: ${data.isMock})`);
    } catch (e) {
        console.error('❌ Failed to read dashboard data for report:', e.message);
        if (process.env.CI) throw e;
        return;
    }

    // Get stats for the last 24h from the daily trend
    const latestDay = data.dailyTrend[data.dailyTrend.length - 1];
    const latestSessions = latestDay?.vals[0] || '0';
    const latestViews = latestDay?.vals[2] || '0';
    const latestDate = latestDay?.dims[0] || 'N/A';

    // Top pages from the last 30d (aggregate)
    const topPages = data.topPages.slice(0, 5).map(p => `<li>${p.dims[0]}: <strong>${Number(p.vals[0]).toLocaleString()}</strong> views</li>`).join('');

    // Top referrers
    const referrers = data.referrers.slice(0, 5).map(r => `<li>${r.dims[0]}: <strong>${Number(r.vals[0]).toLocaleString()}</strong> sessions</li>`).join('');

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: true,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    });

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e2d4a;">
            <div style="background: #1e2d4a; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;"> 
                <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">GridHint Daily Report</h1>
                <p style="color: #ffffff; margin: 4px 0 0; font-size: 14px;">Snapshot for ${latestDate.slice(4,6)}/${latestDate.slice(6,8)}</p>
            </div>

            <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; background: #f8fafc; border-radius: 0 0 12px 12px;">
                <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                    <div style="flex: 1; background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${Number(latestViews).toLocaleString()}</div>   
                        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Page Views</div>
                    </div>
                    <div style="flex: 1; background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${Number(latestSessions).toLocaleString()}</div>
                        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Sessions</div> 
                    </div>
                </div>

                <h2 style="font-size: 16px; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; color: #1e2d4a;">Top Pages (Last 30d)</h2>
                <ul style="padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.6;">${topPages}</ul>

                <h2 style="font-size: 16px; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; color: #1e2d4a;">Top Sources (Last 30d)</h2>
                <ul style="padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.6;">${referrers}</ul>

                <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <a href="https://gridhint.com/dashboard" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">View Full Dashboard</a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 16px; color: #64748b; font-size: 12px;">
                &copy; ${new Date().getFullYear()} GridHint.com
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"GridHint Bot" <${SMTP_USER}>`,
            to: REPORT_RECEIVER,
            subject: `GridHint Stats Report — ${Number(latestViews).toLocaleString()} views on ${latestDate.slice(4,6)}/${latestDate.slice(6,8)}`,
            html: html
        });
        console.log('✅ Daily report email sent!');
    } catch (e) {
        console.error('❌ Failed to send report email:', e.message);
    }
}

sendReport();
