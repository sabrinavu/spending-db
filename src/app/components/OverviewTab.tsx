'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Agency {
  agency_id: number;
  agency_name: string;
  toptier_code: string;
  budget_authority_amount: number;
  percentage_of_total_budget: number;
}

function formatBillions(n: number) {
  if (!n) return '—';
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}T`;
  return `$${n.toFixed(0)}B`;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-slate-800 mb-0.5">{d.fullName}</p>
      <p className="text-blue-600">${payload[0].value.toFixed(1)}B</p>
      <p className="text-slate-400">{d.pct}% of federal budget</p>
    </div>
  );
};

export default function OverviewTab() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/spending')
      .then((r) => r.json())
      .then((d) => setAgencies(d.results || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex items-center gap-2 text-slate-300 text-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
        Loading...
      </div>
    );
  }

  const sorted = [...agencies].sort((a, b) => b.budget_authority_amount - a.budget_authority_amount);
  const total = agencies.reduce((s, a) => s + (a.budget_authority_amount || 0), 0);
  const totalB = total / 1_000_000_000;

  const top10 = sorted.slice(0, 10).map((a) => ({
    name: a.agency_name.length > 30 ? a.agency_name.slice(0, 28) + '…' : a.agency_name,
    fullName: a.agency_name,
    value: a.budget_authority_amount / 1_000_000_000,
    pct: a.percentage_of_total_budget?.toFixed(1) ?? '—',
  }));

  const top10Share = ((top10.reduce((s, a) => s + a.value, 0) / totalB) * 100).toFixed(0);

  const BLUES = ['#1d4ed8','#2563eb','#3b82f6','#60a5fa','#93c5fd',
                 '#1d4ed8','#2563eb','#3b82f6','#60a5fa','#93c5fd'];

  return (
    <div className="space-y-14">
      {/* Hero stats — no cards, just numbers */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-6">Fiscal Year 2024 · All Federal Agencies</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8">
          <div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{formatBillions(totalB)}</p>
            <p className="text-sm text-slate-400 mt-1">Total budget authority</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{agencies.length}</p>
            <p className="text-sm text-slate-400 mt-1">Federal agencies</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">
              {formatBillions(sorted[0]?.budget_authority_amount / 1_000_000_000)}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {sorted[0]?.agency_name.split(' ').slice(0, 3).join(' ')}
            </p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{top10Share}%</p>
            <p className="text-sm text-slate-400 mt-1">Held by top 10 agencies</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div>
        <div className="flex items-baseline justify-between mb-6 border-b border-slate-100 pb-4">
          <p className="text-sm font-medium text-slate-700">Top 10 agencies by budget authority</p>
          <p className="text-xs text-slate-400">$ billions</p>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={top10} layout="vertical" margin={{ left: 0, right: 32, top: 0, bottom: 0 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => `$${v.toFixed(0)}B`}
              tick={{ fill: '#cbd5e1', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={190}
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Bar dataKey="value" radius={[0, 3, 3, 0]}>
              {top10.map((_, i) => <Cell key={i} fill={BLUES[i % BLUES.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div>
        <div className="border-b border-slate-100 pb-4 mb-0">
          <p className="text-sm font-medium text-slate-700">All agencies</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100">
              <th className="text-left py-3 font-normal">Agency</th>
              <th className="text-left py-3 font-normal">Code</th>
              <th className="text-right py-3 font-normal">Budget authority</th>
              <th className="text-right py-3 font-normal">% of total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((agency) => (
              <tr key={agency.agency_id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 text-slate-700">{agency.agency_name}</td>
                <td className="py-3 font-mono text-xs text-blue-500">{agency.toptier_code}</td>
                <td className="py-3 text-right text-slate-600">
                  {agency.budget_authority_amount
                    ? formatBillions(agency.budget_authority_amount / 1_000_000_000)
                    : '—'}
                </td>
                <td className="py-3 text-right font-mono text-xs text-slate-500">
                  {agency.percentage_of_total_budget?.toFixed(2) ?? '—'}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}