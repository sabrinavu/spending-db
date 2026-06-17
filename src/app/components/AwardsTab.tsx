'use client';

import { useEffect, useState } from 'react';

const TYPE_OPTIONS = [
  { label: 'Contracts', codes: ['A', 'B', 'C', 'D'] },
  { label: 'Grants', codes: ['02', '03', '04', '05'] },
  { label: 'Loans', codes: ['07', '08'] },
  { label: 'Direct Payments', codes: ['06', '10'] },
];

function formatAmount(n: number) {
  if (!n) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function AwardsTab() {
  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedType, setSelectedType] = useState(TYPE_OPTIONS[0]);
  const [search, setSearch] = useState('');

  async function fetchAwards(types: string[], p: number) {
    setLoading(true);
    try {
      const res = await fetch('/api/awards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types, page: p }),
      });
      const data = await res.json();
      setAwards(data.results || []);
      setHasNext(data.page_metadata?.hasNext || false);
      setTotal(data.page_metadata?.total || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAwards(selectedType.codes, page);
  }, [selectedType, page]);

  function handleTypeChange(opt: typeof TYPE_OPTIONS[0]) {
    setSelectedType(opt);
    setPage(1);
    setSearch('');
  }

  const filtered = awards.filter((a) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a['Recipient Name']?.toLowerCase().includes(s) ||
      a['Awarding Agency']?.toLowerCase().includes(s) ||
      a['Award ID']?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-0 border-b border-slate-100">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleTypeChange(opt)}
              className={`px-4 py-2.5 text-sm transition-colors relative ${
                selectedType.label === opt.label
                  ? 'text-blue-600 font-medium'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {opt.label}
              {selectedType.label === opt.label && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
              )}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Filter results..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-b border-slate-200 py-2 px-0 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-blue-400 transition-colors bg-transparent w-64"
        />
      </div>

      {!loading && (
        <p className="text-xs text-slate-400">
          {filtered.length} of {total.toLocaleString()} {selectedType.label.toLowerCase()} · FY2024
        </p>
      )}

      {/* Table */}
      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100">
              <th className="text-left py-3 font-normal">Award ID</th>
              <th className="text-left py-3 font-normal">Recipient</th>
              <th className="text-left py-3 font-normal">Agency</th>
              <th className="text-left py-3 font-normal">Period</th>
              <th className="text-right py-3 font-normal">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="py-3">
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-slate-300 text-sm">
                  No results found
                </td>
              </tr>
            ) : (
              filtered.map((award, i) => (
                <tr key={award['Award ID'] ?? i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 font-mono text-xs text-blue-500">{award['Award ID'] ?? '—'}</td>
                  <td className="py-3 text-slate-700 max-w-[200px]">
                    <span className="block truncate" title={award['Recipient Name']}>
                      {award['Recipient Name'] ?? '—'}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 text-xs max-w-[180px]">
                    <span className="block truncate" title={award['Awarding Agency']}>
                      {award['Awarding Agency'] ?? '—'}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 text-xs whitespace-nowrap">
                    {award['Start Date'] ?? '—'} → {award['End Date'] ?? '—'}
                  </td>
                  <td className="py-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                    {formatAmount(award['Award Amount'])}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-sm text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-300">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
            className="text-sm text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}