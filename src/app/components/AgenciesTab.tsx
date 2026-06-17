'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Agency {
  agency_id: number;
  agency_name: string;
  toptier_code: string;
  budget_authority_amount: number;
  percentage_of_total_budget: number;
}

function formatBillions(n: number) {
  if (!n) return '—';
  const b = n / 1_000_000_000;
  if (b >= 1_000) return `$${(b / 1_000).toFixed(1)}T`;
  return `$${b.toFixed(1)}B`;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="text-slate-400 mb-0.5">FY{payload[0].payload.fiscal_year}</p>
      <p className="text-blue-600">Budget: {formatBillions(payload[0].payload.agency_budgetary_resources)}</p>
      <p className="text-slate-500">Obligated: {formatBillions(payload[0].payload.agency_total_obligated)}</p>
    </div>
  );
};

export default function AgenciesTab() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Agency | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/spending')
      .then((r) => r.json())
      .then((d) => {
        const sorted = (d.results || []).sort(
          (a: Agency, b: Agency) => b.budget_authority_amount - a.budget_authority_amount
        );
        setAgencies(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  async function selectAgency(agency: Agency) {
    setSelected(agency);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/agency/${agency.toptier_code}`);
      setDetail(await res.json());
    } finally {
      setDetailLoading(false);
    }
  }

  const filtered = agencies.filter((a) =>
    a.agency_name.toLowerCase().includes(search.toLowerCase()) ||
    a.toptier_code.includes(search)
  );

  const chartData = detail?.budget?.agency_data_by_year
    ?.slice().reverse()
    .map((y: any) => ({
      fiscal_year: y.fiscal_year,
      agency_budgetary_resources: y.agency_budgetary_resources,
      agency_total_obligated: y.agency_total_obligated,
    })) ?? [];

  return (
    <div className="flex gap-12 h-[calc(100vh-160px)]">
      {/* Left — agency list */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <input
          type="text"
          placeholder="Search agencies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border-b border-slate-200 py-2 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-blue-400 transition-colors bg-transparent"
        />
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-slate-300 text-sm py-4 animate-pulse">Loading...</p>
          ) : (
            filtered.map((agency) => (
              <button
                key={agency.agency_id}
                onClick={() => selectAgency(agency)}
                className={`w-full text-left py-3 border-b border-slate-50 transition-colors ${
                  selected?.agency_id === agency.agency_id
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <p className="text-sm font-medium leading-snug">{agency.agency_name}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {agency.toptier_code} · {formatBillions(agency.budget_authority_amount)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right — detail */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-slate-300 text-sm">
            Select an agency to explore
          </div>
        ) : detailLoading ? (
          <div className="py-12 text-slate-300 text-sm animate-pulse">Loading agency data...</div>
        ) : (
          <div className="space-y-12">
            {/* Header */}
            <div>
              <p className="text-xs text-slate-400 font-mono mb-2">{selected.toptier_code}</p>
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight mb-6">{selected.agency_name}</h2>
              <div className="grid grid-cols-3 gap-x-12">
                <div>
                  <p className="text-2xl font-semibold text-slate-900 tracking-tight">
                    {formatBillions(selected.budget_authority_amount)}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">FY2024 budget</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900 tracking-tight">
                    {selected.percentage_of_total_budget?.toFixed(2)}%
                  </p>
                  <p className="text-sm text-slate-400 mt-1">of federal budget</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900 tracking-tight">
                    {formatBillions(chartData[chartData.length - 1]?.agency_total_obligated)}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">latest obligated</p>
                </div>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <div>
                <div className="border-b border-slate-100 pb-4 mb-6 flex items-baseline justify-between">
                  <p className="text-sm font-medium text-slate-700">Budget vs obligations by year</p>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" /> Budget
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm bg-slate-300 inline-block" /> Obligated
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="fiscal_year"
                      tick={{ fill: '#cbd5e1', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${(v / 1_000_000_000).toFixed(0)}B`}
                      tick={{ fill: '#cbd5e1', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                    <Bar dataKey="agency_budgetary_resources" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="agency_total_obligated" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Table */}
            {chartData.length > 0 && (
              <div>
                <div className="border-b border-slate-100 pb-4 mb-0">
                  <p className="text-sm font-medium text-slate-700">Year-by-year breakdown</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 border-b border-slate-100">
                      <th className="text-left py-3 font-normal">Year</th>
                      <th className="text-right py-3 font-normal">Budget authority</th>
                      <th className="text-right py-3 font-normal">Obligated</th>
                      <th className="text-right py-3 font-normal">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...chartData].reverse().map((y: any) => {
                      const util = y.agency_budgetary_resources > 0
                        ? ((y.agency_total_obligated / y.agency_budgetary_resources) * 100).toFixed(1)
                        : '—';
                      return (
                        <tr key={y.fiscal_year} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 font-mono text-xs text-slate-500">FY{y.fiscal_year}</td>
                          <td className="py-3 text-right text-slate-600">{formatBillions(y.agency_budgetary_resources)}</td>
                          <td className="py-3 text-right text-slate-500">{formatBillions(y.agency_total_obligated)}</td>
                          <td className="py-3 text-right font-mono text-xs">
                            <span className={parseFloat(util) > 80 ? 'text-blue-500' : 'text-amber-500'}>
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