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

interface BudgetYear {
  fiscal_year: number;
  total_budgetary_resources: number;
  agency_budgetary_resources: number;
  agency_total_obligated: number;
}

function formatBillions(n: number) {
  if (!n) return '—';
  const b = n / 1_000_000_000;
  if (b >= 1_000) return `$${(b / 1_000).toFixed(1)}T`;
  return `$${b.toFixed(1)}B`;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm">
        <p className="text-slate-400 mb-1">FY{payload[0].payload.fiscal_year}</p>
        <p className="text-emerald-400">Budget: {formatBillions(payload[0].payload.agency_budgetary_resources)}</p>
        <p className="text-blue-400">Obligated: {formatBillions(payload[0].payload.agency_total_obligated)}</p>
      </div>
    );
  }
  return null;
};

export default function AgenciesTab() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Agency | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/spending');
        const data = await res.json();
        const sorted = (data.results || []).sort(
          (a: Agency, b: Agency) => b.budget_authority_amount - a.budget_authority_amount
        );
        setAgencies(sorted);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function selectAgency(agency: Agency) {
    setSelected(agency);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/agency/${agency.toptier_code}`);
      const data = await res.json();
      setDetail(data);
    } finally {
      setDetailLoading(false);
    }
  }

  const filtered = agencies.filter((a) =>
    a.agency_name.toLowerCase().includes(search.toLowerCase()) ||
    a.toptier_code.includes(search)
  );

  const chartData = detail?.budget?.agency_data_by_year
    ?.slice()
    .reverse()
    .map((y: BudgetYear) => ({
      fiscal_year: y.fiscal_year,
      agency_budgetary_resources: y.agency_budgetary_resources,
      agency_total_obligated: y.agency_total_obligated,
    })) ?? [];

  return (
    <div className="flex gap-6 h-[calc(100vh-160px)]">
      {/* Left Panel — Agency List */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-3">
        <input
          type="text"
          placeholder="Search agencies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {loading ? (
            <p className="text-slate-500 animate-pulse text-sm px-2">Loading agencies...</p>
          ) : (
            filtered.map((agency) => (
              <button
                key={agency.agency_id}
                onClick={() => selectAgency(agency)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  selected?.agency_id === agency.agency_id
                    ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                <p className="text-sm font-medium leading-snug">{agency.agency_name}</p>
                <p className="text-xs font-mono text-emerald-600 mt-0.5">
                  {agency.toptier_code} · {formatBillions(agency.budget_authority_amount)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel — Detail */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
            <p className="text-4xl">←</p>
            <p className="text-sm">Select an agency to explore its budget</p>
          </div>
        ) : detailLoading ? (
          <div className="flex items-center gap-2 text-slate-500 animate-pulse py-12">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
            <span>Fetching agency data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Agency Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-1">{selected.agency_name}</h2>
              <p className="text-xs font-mono text-emerald-500 mb-4">Toptier Code: {selected.toptier_code}</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">FY2024 Budget</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {formatBillions(selected.budget_authority_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">% of Federal Budget</p>
                  <p className="text-xl font-bold text-white">
                    {selected.percentage_of_total_budget?.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Latest Obligated</p>
                  <p className="text-xl font-bold text-blue-400">
                    {formatBillions(chartData[chartData.length - 1]?.agency_total_obligated)}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget History Chart */}
            {chartData.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-6">
                  Budget vs Obligations — Historical
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="fiscal_year"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${(v / 1_000_000_000).toFixed(0)}B`}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="agency_budgetary_resources" name="Budget" fill="#34d399" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="agency_total_obligated" name="Obligated" fill="#60a5fa" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Budget Authority
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" /> Obligations
                  </span>
                </div>
              </div>
            )}

            {/* Year-by-Year Table */}
            {chartData.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Year-by-Year Breakdown</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                      <th className="text-left px-6 py-3">Fiscal Year</th>
                      <th className="text-right px-6 py-3">Budget Authority</th>
                      <th className="text-right px-6 py-3">Total Obligated</th>
                      <th className="text-right px-6 py-3">Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...chartData].reverse().map((y: any) => {
                      const util = y.agency_budgetary_resources > 0
                        ? ((y.agency_total_obligated / y.agency_budgetary_resources) * 100).toFixed(1)
                        : '—';
                      return (
                        <tr key={y.fiscal_year} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-3 font-mono text-emerald-500 text-xs">FY{y.fiscal_year}</td>
                          <td className="px-6 py-3 text-right text-slate-300">{formatBillions(y.agency_budgetary_resources)}</td>
                          <td className="px-6 py-3 text-right text-blue-400">{formatBillions(y.agency_total_obligated)}</td>
                          <td className="px-6 py-3 text-right">
                            <span className={`font-mono text-xs ${parseFloat(util) > 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                              {util}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}