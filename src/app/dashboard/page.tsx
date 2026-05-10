import fs from "fs";
import path from "path";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Traffic Dashboard | GridHint",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  const dataPath = path.join(process.cwd(), "src/data/dashboard.json");
  let dashboardData = null;

  try {
    if (fs.existsSync(dataPath)) {
      dashboardData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    }
  } catch (e) {
    console.error("Failed to read dashboard data", e);
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Traffic Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500 flex items-center gap-3">
            <span>Last 30 Days</span>
            <span>•</span>
            <span>Updated {dashboardData?.updatedAt ? new Date(dashboardData.updatedAt).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' }) + ' ET' : "Never"}</span>
            {dashboardData?.isMock && (
              <span className="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Mock Data (Missing API Keys)
              </span>
            )}
          </p>
        </header>

        {dashboardData ? (
          <DashboardClient data={dashboardData} />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">No dashboard data found. The fetch script may not have run.</p>      
          </div>
        )}
      </div>
    </div>
  );
}
