'use client';

import { useState } from 'react';
import OverviewTab from './components/OverviewTab';
import AgenciesTab from './components/AgenciesTab';
import TrendsTab from './components/TrendsTab';
import AwardsTab from './components/AwardsTab';

const TABS = ['Overview', 'Agencies', 'Trends', 'Awards'] as const;
type Tab = typeof TABS[number];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  return (
    <main className="min-h-screen bg-white text-slate-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Nav */}
      <div className="border-b border-slate-100 px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold tracking-tight">US</span>
          </div>
          <span className="text-sm font-semibold text-slate-900">USASpending</span>
          <span className="text-slate-300 text-sm">·</span>
          <span className="text-sm text-slate-400">Federal Budget Explorer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          <span className="text-xs text-slate-400">Live · FY2024</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-100 px-10">
        <nav className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3.5 text-sm transition-colors relative ${
                activeTab === tab
                  ? 'text-slate-900 font-medium'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="px-10 py-10 max-w-7xl mx-auto">
        {activeTab === 'Overview' && <OverviewTab />}
        {activeTab === 'Agencies' && <AgenciesTab />}
        {activeTab === 'Trends' && <TrendsTab />}
        {activeTab === 'Awards' && <AwardsTab />}
      </div>
    </main>
  );
}