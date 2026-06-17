'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';

function formatT(n: number) {
  if (!n) return '—';
  return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
}
function formatB(n: number) {
  if (!n) return '—';
  return `$${(n / 1_000_000_000).toFixed(0)}B`;
}

const LineTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="text-slate-400 mb-0.5">FY{d.fiscal_year} Q{d.quarter}</p>
      <p className="text-blue-600">{formatT(d.total_budgetary_resources)}</p>
    </div>
  );
};

const BarTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="text-slate-400 mb-0.5">FY{d.fiscal_year}</p>
      <p className="text-blue-600">{formatT(d.total)}</p>
      {d.growth !== null && (
        <p className={d.growth > 0 ? 'text-emerald-500' : 'text-red-400'}>
          {d.growth > 0 ? '+' : ''}{d.growth?.toFixed(1)}% YoY
        </p>
      )}
    </div>
  );
};

export default function TrendsTab() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trends')
      .then((r) => r.json())
      .then((d) => setRawData(d.results || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-24 text-slate-300 text-sm animate-pulse">Loading...</div>;
  }

  const quarterlyData = [...rawData]
    .sort((a, b) => a.fiscal_year - b.fiscal_year || a.quarter - b.quarter)
    .map((d) => ({ ...d, label: `FY${d.fiscal_year} Q${d.quarter}` }));

  const byYear: Record<number, number[]> = {};
  rawData.forEach((d) => {
    if (!byYear[d.fiscal_year]) byYear[d.fiscal_year] = [];
    byYear[d.fiscal_year].push(d.total_budgetary_resources);
  });

  const annualData = Object.entries(byYear)
    .map(([year, vals]) => ({
      fiscal_year: Number(year),
      total: vals.reduce((s, v) => s + v, 0),
      quarters: vals.length,
    }))
    .sort((a, b) => a.fiscal_year - b.fiscal_year)
    .map((d, i, arr) => ({
      ...d,
      growth: i === 0 ? null : ((d.total - arr[i - 1].total) / arr[i - 1].total) * 100,
    }));

  const latest = annualData[annualData.length - 1];
  const prev = annualData[annualData.length - 2];
  const peak = [...annualData].sort((a, b) => b.total - a.total)[0];

  const BLUES = ['#1d4ed8','#2563eb','#3b82f6','#60a5fa','#93c5fd',
                 '#1d4ed8','#2563eb','#3b82f6','#60a5fa','#93c5fd'];

  return (
    <div className="space-y-14">
      {/* Stats */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-6">Federal budget authority · all agencies</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8">
          <div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{formatT(latest?.total)}</p>
            <p className="text-sm text-slate-400 mt-1">FY{latest?.fiscal_year} total</p>
          </div>
          <div>
            <p className={`text-3xl font-semibold tracking-tight ${latest?.growth && latest.growth > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
              {latest?.growth ? `${latest.growth > 0 ? '+' : ''}${latest.growth.toFixed(1)}%` : '—'}
            </p>
            <p className="text-sm text-slate-400 mt-1">vs FY{prev?.fiscal_year}</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{formatT(peak?.total)}</p>
            <p className="text-sm text-slate-400 mt-1">Peak year · FY{peak?.fiscal_year}</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{annualData.length}</p>
            <p className="text-sm text-slate-400 mt-1">Years of data</p>
          </div>
        </div>
      </div>

      {/* Line chart */}
      <div>
        <div className="border-b border-slate-100 pb-4 mb-6 flex items-baseline justify-between">
          <p className="text-sm font-medium text-slate-700">Quarterly budget authority</p>
          <p className="text-xs text-slate-400">$ trillions</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={quarterlyData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#cbd5e1', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={3}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1e12).toFixed(1)}T`}
              tick={{ fill: '#cbd5e1', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<LineTip />} />
            <Line
              type="monotone"
              dataKey="total_budgetary_resources"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar chart */}
      <div>
        <div className="border-b border-slate-100 pb-4 mb-6 flex items-baseline justify-between">
          <p className="text-sm font-medium text-slate-700">Annual budget authority</p>
          <p className="text-xs text-slate-400">$ trillions</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={annualData} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
            <XAxis
              dataKey="fiscal_year"
              tick={{ fill: '#cbd5e1', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1e12).toFixed(0)}T`}
              tick={{ fill: '#cbd5e1', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<BarTip />} />
            <Bar dataKey="total" radius={[3, 3, 0, 0]}>
              {annualData.map((_, i) => <Cell key={i} fill={BLUES[i % BLUES.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div>
        <div className="border-b border-slate-100 pb-4 mb-0">
          <p className="text-sm font-medium text-slate-700">Year-over-year summary</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100">
              <th className="text-left py-3 font-normal">Year</th>
              <th className="text-right py-3 font-normal">Total budget</th>
              <th className="text-right py-3 font-normal">Quarters</th>
              <th className="text-right py-3 font-normal">YoY change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[...annualData].reverse().map((y) => (
              <tr key={y.fiscal_year} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 font-mono text-xs text-slate-500">FY{y.fiscal_year}</td>
                <td className="py-3 text-right text-slate-700">{formatT(y.total)}</td>
                <td className="py-3 text-right text-slate-400 text-xs">{y.quarters}Q</td>
                <td className="py-3 text-right font-mono text-xs">
                  {y.growth === null ? (
                    <span className="text-slate-300">—</span>
                  ) : (
                    <span className={y.growth > 0 ? 'text-emerald-500' : 'text-red-400'}>
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