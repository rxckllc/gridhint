"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatNumber(num: string | number) {
  return Number(num).toLocaleString();
}

function duration(secStr: string) {
  const sec = Math.round(Number(secStr));
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function percentage(decStr: string) {
  return (Number(decStr) * 100).toFixed(1) + "%";
}

type ChartPoint = { date: string; fullDate: string; sessions: number; pageviews: number };

// Custom tooltip moved outside to avoid re-creation during render
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; color: string; payload: ChartPoint }[] }) => {
  if (active && payload && payload.length) {
    const pointData = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-slate-200 shadow-md rounded-xl text-sm">        
        <p className="font-bold text-slate-900 mb-2">{pointData.fullDate}</p>
        {payload.map((p, i: number) => (
          <p key={i} className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></span>
            <span className="text-slate-500">{p.name}:</span>
            <span className="font-bold tabular-nums text-slate-900">{formatNumber(p.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface DashboardData {
  dailyTrend: { dims: string[]; vals: string[] }[];
  overview30d: { vals: string[] };
  topPages: { dims: string[]; vals: string[] }[];
  referrers: { dims: string[]; vals: string[] }[];
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const chartData = useMemo((): ChartPoint[] => {
    return data.dailyTrend.map((row) => {
      const dateStr = row.dims[0]; // YYYYMMDD
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      const formattedDate = `${year}-${month}-${day}`;

      return {
        date: `${month}/${day}`,
        fullDate: formattedDate,
        sessions: Number(row.vals[0]),
        pageviews: Number(row.vals[2]),
      };
    });
  }, [data.dailyTrend]);

  const overview = data.overview30d.vals;

  return (
    <div className="space-y-8 pb-20">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Sessions", value: formatNumber(overview[0]) },
          { label: "Users", value: formatNumber(overview[1]) },
          { label: "Page Views", value: formatNumber(overview[2]) },
          { label: "Avg Duration", value: duration(overview[3]) },
          { label: "Bounce Rate", value: percentage(overview[4]) },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm text-center">    
            <div className="tabular-nums text-3xl font-extrabold text-blue-700">
              {kpi.value}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Traffic Trend (30 Days)</h2>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} dy={10} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={formatNumber} dx={-10} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4' }} />

              <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#1e293b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6, fill: "#1e293b" }} />
              <Line type="monotone" dataKey="pageviews" name="Page Views" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6, fill: "#3b82f6" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#1e293b]"></div><span className="text-slate-600 font-medium">Sessions</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-slate-600 font-medium">Page Views</span></div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="font-bold text-slate-900">Top Pages</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">Page Path</th>
                  <th className="px-5 py-3 font-semibold text-right">Views</th>
                  <th className="px-5 py-3 font-semibold text-right">Users</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.topPages.map((row, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-900 truncate max-w-[200px] sm:max-w-[300px]" title={row.dims[0]}>{row.dims[0]}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-900 font-medium">{formatNumber(row.vals[0])}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-500">{formatNumber(row.vals[1])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="font-bold text-slate-900">Top Referrers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">Source</th>
                  <th className="px-5 py-3 font-semibold text-right">Sessions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.referrers.map((row, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-900 capitalize">{row.dims[0] === '(direct)' ? 'Direct' : row.dims[0]}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-900 font-medium">{formatNumber(row.vals[0])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
