'use client';

import { useState, useEffect } from 'react';

const HISTORY_KEY = 'search-history';
const MAX_HISTORY = 8;

export interface Topic {
  title: string;
  summary: string;
}

interface SearchStepProps {
  onTopicSelect: (topic: Topic) => void;
  companyCategory: string;
}

const TOPIC_MAP: Record<string, string[]> = {
  'Technology / SaaS':     ['AI startup funding announcements', 'SaaS product launches this month', 'cloud computing industry developments'],
  'E-commerce / Retail':   ['online retail sales growth report', 'e-commerce platform new features', 'retail consumer spending trends'],
  'Healthcare':            ['digital health startup funding', 'AI in healthcare breakthroughs', 'telemedicine adoption statistics'],
  'Finance / Fintech':     ['fintech startup investment rounds', 'digital banking new product launches', 'crypto regulation news'],
  'Education / EdTech':    ['edtech funding and acquisitions', 'AI tutoring tools launch', 'online learning platform growth'],
  'Marketing / Media':     ['social media algorithm changes', 'content marketing ROI report', 'influencer marketing platform news'],
  'Consulting / Services': ['management consulting industry report', 'business transformation case studies', 'professional services technology adoption'],
  'Food & Beverage':       ['restaurant industry recovery trends', 'food delivery platform news', 'sustainable food innovation'],
  'Real Estate':           ['commercial real estate market report', 'proptech startup funding', 'housing market interest rate impact'],
  'Manufacturing':         ['factory automation investment news', 'supply chain disruption report', 'industrial AI adoption'],
  'Non-profit / NGO':      ['nonprofit fundraising record campaigns', 'social enterprise impact report', 'ESG corporate donation trends'],
};

function getPresetTopics(category: string): string[] {
  if (category in TOPIC_MAP) return TOPIC_MAP[category];
  const label = category.trim();
  return label
    ? [`${label} industry news this week`, `${label} business developments`, 'small business growth strategies']
    : ['business innovation news', 'startup funding this week', 'industry growth report'];
}

export default function SearchStep({ onTopicSelect, companyCategory }: SearchStepProps) {
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedQueries, setSavedQueries] = useState<string[]>([]);

  const presets = getPresetTopics(companyCategory);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setSavedQueries(JSON.parse(stored));
    } catch {}
  }, []);

  function persistQuery(query: string) {
    if (presets.includes(query)) return;
    setSavedQueries(prev => {
      const updated = [query, ...prev.filter(q => q !== query)].slice(0, MAX_HISTORY);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  function removeQuery(query: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSavedQueries(prev => {
      const updated = prev.filter(q => q !== query);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  async function handleSearch(query: string) {
    if (!query.trim()) return;
    setActiveQuery(query);
    setLoading(true);
    setError('');
    setTopics([]);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setTopics(data.results || []);
    } catch {
      setError('Failed to search topics. Check your Tavily API key.');
    } finally {
      setLoading(false);
    }
  }

  function handleCustomSearch() {
    if (!customQuery.trim()) return;
    persistQuery(customQuery.trim());
    handleSearch(customQuery);
    setCustomQuery('');
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
        Search Topics
      </h2>

      {/* Preset chips + saved custom queries */}
      <div className="flex flex-wrap gap-2 mb-3">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => handleSearch(preset)}
            disabled={loading}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeQuery === preset
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
            } disabled:opacity-50`}
          >
            {preset}
          </button>
        ))}
        {savedQueries.map((q) => (
          <div key={q} className={`flex items-center rounded-full text-xs font-medium transition-all ${
            activeQuery === q ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'
          } ${loading ? 'opacity-50' : ''}`}>
            <button
              onClick={() => handleSearch(q)}
              disabled={loading}
              className="pl-3 pr-1 py-1.5 hover:opacity-80 transition-opacity"
            >
              {q}
            </button>
            <button
              onClick={(e) => removeQuery(q, e)}
              disabled={loading}
              className={`pr-2 pl-0.5 py-1.5 transition-opacity hover:opacity-60 ${
                activeQuery === q ? 'text-white' : 'text-indigo-400'
              }`}
              aria-label="Remove"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Freetext search */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCustomSearch(); }}
          placeholder="Search anything…"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-300"
        />
        <button
          onClick={handleCustomSearch}
          disabled={loading || !customQuery.trim()}
          className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Searching…
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="space-y-2">
        {topics.map((topic, i) => (
          <button
            key={i}
            onClick={() => onTopicSelect(topic)}
            className="w-full text-left p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg transition-all group"
          >
            <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 leading-tight mb-1">
              {topic.title}
            </p>
            <p className="text-xs text-gray-500 leading-snug line-clamp-2">
              {topic.summary}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
