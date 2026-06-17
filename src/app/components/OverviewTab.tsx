'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface Agency {
  agency_id: number;
  agency_name: string;
  toptier_code: string;
  budget_authority_amount: number;
  percentage_of_total_budget: number;
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-emerald-500 mt-1">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm">
        <p className="text-white font-semibold mb-1">{d.name}</p>
        <p className="text-emerald-400">${payload[0].value.toFixed(1)}B</p>
        <p className="text-slate-400 text-xs">{d.pct}% of total budget</p>
      </div>
    );
  }
  return null;
};

function formatBillions(n: number) {
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}T`;
  return `$${n.toFixed(0)}B`;
}

export default function OverviewTab() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/spending');
        const data = await res.json();
        setAgencies(data.results || []);
      } catch (e) {
        console.error(e);
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
        <span>Querying federal data pipeline...</span>
      </div>
    );
  }

  const total = agencies.reduce((sum, a) => sum + (a.budget_authority_amount || 0), 0);
  const totalBillions = total / 1_000_000_000;

  const top10 = [...agencies]
    .sort((a, b) => b.budget_authority_amount - a.budget_authority_amount)
    .slice(0, 10)
    .map((a) => ({
      name: a.agency_name.length > 28 ? a.agency_name.slice(0, 26) + '…' : a.agency_name,
      fullName: a.agency_name,
      value: a.budget_authority_amount / 1_000_000_000,
      pct: a.percentage_of_total_budget?.toFixed(1) ?? '—',
    }));

  const COLORS = [
    '#34d399','#6ee7b7','#a7f3d0','#059669','#10b981',
    '#047857','#d1fae5','#6ee7b7','#34d399','#10b981',
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Budget Authority"
          value={formatBillions(totalBillions)}
          sub="All federal agencies · FY2024"
        />
        <StatCard
          label="Agencies Tracked"
          value={agencies.length.toString()}
          sub="Top-tier agency codes"
        />
        <StatCard
          label="Largest Agency"
          value={top10[0]?.name.split('…')[0].split(' ').slice(0, 2).join(' ') ?? '—'}
          sub={top10[0] ? `$${top10[0].value.toFixed(0)}B budget` : ''}
        />
        <StatCard
          label="Top 10 Share"
          value={
            top10.reduce((s, a) => s + a.value, 0) > 0 && totalBillions > 0
              ? `${((top10.reduce((s, a) => s + a.value, 0) / totalBillions) * 100).toFixed(0)}%`
              : '—'
          }
          sub="of total federal budget"
        />
      </div>

      {/* Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-6">
          Top 10 Agencies by Budget Authority
        </h2>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={top10} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => `$${v.toFixed(0)}B`}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={180}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {top10.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Agency Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">All Agencies</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
              <th className="text-left px-6 py-3">Agency</th>
              <th className="text-left px-6 py-3">Code</th>
              <th className="text-right px-6 py-3">Budget Authority</th>
              <th className="text-right px-6 py-3">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {[...agencies]
              .sort((a, b) => b.budget_authority_amount - a.budget_authority_amount)
              .map((agency, i) => (
                <tr
                  key={agency.agency_id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-6 py-3 text-slate-200">{agency.agency_name}</td>
                  <td className="px-6 py-3 font-mono text-emerald-500 text-xs">{agency.toptier_code}</td>
                  <td className="px-6 py-3 text-right text-slate-300">
                    {agency.budget_authority_amount
                      ? formatBillions(agency.budget_authority_amount / 1_000_000_000)
                      : '—'}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-emerald-400 font-mono text-xs">
                      {agency.percentage_of_total_budget?.toFixed(2) ?? '—'}%
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}