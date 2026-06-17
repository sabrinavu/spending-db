'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, Legend
} from 'recharts';

function formatBillions(n: number) {
  if (!n) return '—';
  const b = n / 1_000_000_000;
  if (b >= 1_000) return `$${(b / 1_000).toFixed(2)}T`;
  return `$${b.toFixed(0)}B`;
}

function formatTrillions(n: number) {
  if (!n) return '—';
  const t = n / 1_000_000_000_000;
  return `$${t.toFixed(2)}T`;
}

const LineTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm space-y-1">
        <p className="text-slate-400 font-mono text-xs">FY{d.fiscal_year} Q{d.quarter}</p>
        <p className="text-emerald-400">Budget: {formatTrillions(d.total_budgetary_resources)}</p>
      </div>
    );
  }
  return null;
};

const BarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm space-y-1">
        <p className="text-slate-400 font-mono text-xs">FY{d.fiscal_year}</p>
        <p className="text-emerald-400">Total: {formatTrillions(d.total)}</p>
        <p className="text-blue-400">Avg/Quarter: {formatBillions(d.avg)}</p>
      </div>
    );
  }
  return null;
};

export default function TrendsTab() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/trends');
        const data = await res.json();
        setRawData(data.results || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 animate-pulse py-12">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
        <span>Fetching historical trend data...</span>
      </div>
    );
  }

  // Quarterly line chart data — all quarters sorted
  const quarterlyData = [...rawData]
    .sort((a, b) => a.fiscal_year - b.fiscal_year || a.quarter - b.quarter)
    .map((d) => ({
      fiscal_year: d.fiscal_year,
      quarter: d.quarter,
      label: `FY${d.fiscal_year} Q${d.quarter}`,
      total_budgetary_resources: d.total_budgetary_resources,
    }));

  // Annual bar chart — group by year, sum quarters
  const byYear: Record<number, number[]> = {};
  rawData.forEach((d) => {
    if (!byYear[d.fiscal_year]) byYear[d.fiscal_year] = [];
    byYear[d.fiscal_year].push(d.total_budgetary_resources);
  });

  const annualData = Object.entries(byYear)
    .map(([year, vals]) => {
      const total = vals.reduce((s, v) => s + v, 0);
      return {
        fiscal_year: Number(year),
        total,
        avg: total / vals.length,
        quarters: vals.length,
      };
    })
    .sort((a, b) => a.fiscal_year - b.fiscal_year);

  // YoY growth
  const annualWithGrowth = annualData.map((d, i) => ({
    ...d,
    growth: i === 0 ? null : ((d.total - annualData[i - 1].total) / annualData[i - 1].total) * 100,
  }));

  const latestYear = annualWithGrowth[annualWithGrowth.length - 1];
  const prevYear = annualWithGrowth[annualWithGrowth.length - 2];
  const peakYear = [...annualData].sort((a, b) => b.total - a.total)[0];

  const COLORS = ['#34d399','#6ee7b7','#10b981','#059669','#047857',
                  '#34d399','#6ee7b7','#10b981','#059669','#047857'];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Latest Full Year</p>
          <p className="text-2xl font-bold text-white">FY{latestYear?.fiscal_year}</p>
          <p className="text-xs text-emerald-500 mt-1">{formatTrillions(latestYear?.total)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">YoY Growth</p>
          <p className={`text-2xl font-bold ${latestYear?.growth && latestYear.growth > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {latestYear?.growth ? `${latestYear.growth > 0 ? '+' : ''}${latestYear.growth.toFixed(1)}%` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">vs FY{prevYear?.fiscal_year}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Peak Year</p>
          <p className="text-2xl font-bold text-white">FY{peakYear?.fiscal_year}</p>
          <p className="text-xs text-emerald-500 mt-1">{formatTrillions(peakYear?.total)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Years of Data</p>
          <p className="text-2xl font-bold text-white">{annualData.length}</p>
          <p className="text-xs text-slate-500 mt-1">{annualData[0]?.fiscal_year} — {annualData[annualData.length - 1]?.fiscal_year}</p>
        </div>
      </div>

      {/* Quarterly Line Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-1">
          Quarterly Budget Authority Over Time
        </h3>
        <p className="text-xs text-slate-500 mb-6">Total budgetary resources per quarter, all federal agencies</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={quarterlyData} margin={{ left: 8, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={3}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1_000_000_000_000).toFixed(1)}T`}
              tick={{ fill: '#475569', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<LineTooltip />} />
            <Line
              type="monotone"
              dataKey="total_budgetary_resources"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#34d399' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Annual Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-1">
          Annual Budget Authority
        </h3>
        <p className="text-xs text-slate-500 mb-6">Summed across all quarters per fiscal year</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={annualData} margin={{ left: 8, right: 8, top: 4, bottom: 0 }}>
            <XAxis
              dataKey="fiscal_year"
              tick={{ fill: '#475569', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1_000_000_000_000).toFixed(0)}T`}
              tick={{ fill: '#475569', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<BarTooltip />} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {annualData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* YoY Growth Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Year-over-Year Summary</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
              <th className="text-left px-6 py-3">Fiscal Year</th>
              <th className="text-right px-6 py-3">Total Budget</th>
              <th className="text-right px-6 py-3">Quarters</th>
              <th className="text-right px-6 py-3">YoY Change</th>
            </tr>
          </thead>
          <tbody>
            {[...annualWithGrowth].reverse().map((y) => (
              <tr key={y.fiscal_year} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-3 font-mono text-emerald-500 text-xs">FY{y.fiscal_year}</td>
                <td className="px-6 py-3 text-right text-slate-300">{formatTrillions(y.total)}</td>
                <td className="px-6 py-3 text-right text-slate-500 text-xs">{y.quarters}Q</td>
                <td className="px-6 py-3 text-right">
                  {y.growth === null ? (
                    <span className="text-slate-600 text-xs">—</span>
                  ) : (
                    <span className={`font-mono text-xs font-semibold ${y.growth > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {y.growth > 0 ? '+' : ''}{y.growth.toFixed(1)}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}