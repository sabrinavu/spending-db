'use client';

import { useState } from 'react';
import OverviewTab from './components/OverviewTab';
import AgenciesTab from './components/AgenciesTab';
import TrendsTab from './components/TrendsTab';


const TABS = ['Overview', 'Agencies', 'Trends', 'Awards'] as const;
type Tab = typeof TABS[number];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 px-8 py-5 flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-emerald-400 tracking-tight">USASpending Explorer</h1>
          <p className="text-xs text-slate-500 mt-0.5">Federal spending data · fiscal year 2024</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 px-8">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="px-8 py-6">
        {activeTab === 'Overview' && <OverviewTab />}
        {activeTab === 'Agencies' && <AgenciesTab />}
        {activeTab === 'Trends' && <TrendsTab />}
        {activeTab === 'Awards' && <div className="text-slate-500">Awards coming soon...</div>}
      </div>
    </main>
  );
}