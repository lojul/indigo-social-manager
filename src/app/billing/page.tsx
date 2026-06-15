'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BillingMonth {
  month: string;
  total_usd: number;
  image_usd: number;
  video_usd: number;
  image_count: number;
  video_count: number;
}

interface BillingCompany {
  company_id: number | null;
  company_name: string;
  total_usd: number;
  image_count: number;
  video_count: number;
}

interface BillingStats {
  monthly: BillingMonth[];
  by_company: BillingCompany[];
  total_usd: number;
}

function fmt(usd: number) {
  return `$${Number(usd).toFixed(2)}`;
}

function monthLabel(m: string) {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
}

export default function BillingPage() {
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [months, setMonths] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/billing?months=${months}`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => { setError('Failed to load billing data'); setLoading(false); });
  }, [months]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/social" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">AI Generation Billing</h1>
          </div>
          <select
            value={months}
            onChange={e => setMonths(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={1}>Last 1 month</option>
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {stats && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Cost</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{fmt(stats.total_usd)}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Images Generated</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">
                  {stats.monthly.reduce((s, m) => s + m.image_count, 0)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fmt(stats.monthly.reduce((s, m) => s + Number(m.image_usd), 0))} total
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reels Generated</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {stats.monthly.reduce((s, m) => s + m.video_count, 0)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fmt(stats.monthly.reduce((s, m) => s + Number(m.video_usd), 0))} total
                </p>
              </div>
            </div>

            {/* Monthly breakdown */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">Monthly Breakdown</h2>
              </div>
              {stats.monthly.length === 0 ? (
                <p className="px-5 py-8 text-sm text-gray-400 text-center">No generations recorded yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left">Month</th>
                      <th className="px-5 py-3 text-right">Images</th>
                      <th className="px-5 py-3 text-right">Image Cost</th>
                      <th className="px-5 py-3 text-right">Reels</th>
                      <th className="px-5 py-3 text-right">Reel Cost</th>
                      <th className="px-5 py-3 text-right font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.monthly.map(m => (
                      <tr key={m.month} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{monthLabel(m.month)}</td>
                        <td className="px-5 py-3 text-right text-gray-600">{m.image_count}</td>
                        <td className="px-5 py-3 text-right text-indigo-600">{fmt(m.image_usd)}</td>
                        <td className="px-5 py-3 text-right text-gray-600">{m.video_count}</td>
                        <td className="px-5 py-3 text-right text-purple-600">{fmt(m.video_usd)}</td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-900">{fmt(m.total_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Per-company breakdown */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">By Company</h2>
              </div>
              {stats.by_company.length === 0 ? (
                <p className="px-5 py-8 text-sm text-gray-400 text-center">No generations recorded yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left">Company</th>
                      <th className="px-5 py-3 text-right">Images</th>
                      <th className="px-5 py-3 text-right">Reels</th>
                      <th className="px-5 py-3 text-right font-semibold text-gray-700">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.by_company.map(c => (
                      <tr key={c.company_id ?? 'unknown'} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{c.company_name}</td>
                        <td className="px-5 py-3 text-right text-gray-600">{c.image_count}</td>
                        <td className="px-5 py-3 text-right text-gray-600">{c.video_count}</td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-900">{fmt(c.total_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
