'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

interface UserData {
  plan: string;
  hasBufferToken: boolean;
  postsThisMonth: number;
  email: string;
  name: string;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get('upgraded') === 'true';

  const [user, setUser] = useState<UserData | null>(null);
  const [bufferToken, setBufferToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    fetch('/api/user')
      .then(r => r.json())
      .then(setUser)
      .catch(console.error);
  }, []);

  async function handleSaveToken() {
    if (!bufferToken.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bufferToken: bufferToken.trim() }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
      setBufferToken('');
      setUser(u => u ? { ...u, hasBufferToken: true } : u);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save token. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpgrade() {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || 'Failed to start checkout');
    } catch {
      setError('Failed to start checkout. Please try again.');
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleManageBilling() {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || 'Failed to open billing portal');
    } catch {
      setError('Failed to open billing portal.');
    } finally {
      setBillingLoading(false);
    }
  }

  const isPro = user?.plan === 'pro';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8 flex items-center gap-2">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {upgraded && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-green-800 font-medium">Welcome to Pro! Your plan is being activated — it may take a moment.</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Buffer Integration */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Buffer Integration</h2>
            <p className="text-xs text-gray-500">Connect your Buffer account to publish posts</p>
          </div>
          {user?.hasBufferToken && (
            <span className="ml-auto text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">Connected</span>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {user?.hasBufferToken ? 'Update Buffer API token' : 'Buffer API token'}
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={bufferToken}
                onChange={e => setBufferToken(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveToken(); }}
                placeholder={user?.hasBufferToken ? '••••••••••••••••' : 'Paste your Buffer API token…'}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-300"
              />
              <button
                onClick={handleSaveToken}
                disabled={saving || !bufferToken.trim()}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Get your token at{' '}
            <a href="https://publish.buffer.com/settings/api" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
              publish.buffer.com/settings/api
            </a>
          </p>
        </div>
      </div>

      {/* Plan & Billing */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Plan & Billing</h2>
            <p className="text-xs text-gray-500">Manage your subscription</p>
          </div>
          <span className={`ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full border ${isPro ? 'text-indigo-700 bg-indigo-50 border-indigo-100' : 'text-gray-600 bg-gray-50 border-gray-100'}`}>
            {isPro ? 'Pro' : 'Free'}
          </span>
        </div>

        {!isPro ? (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Posts used</p>
                <p className="font-semibold text-gray-900 text-base mt-0.5">{user?.postsThisMonth ?? 0} / 5</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Workspaces</p>
                <p className="font-semibold text-gray-900 text-base mt-0.5">1 max</p>
              </div>
            </div>
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-3">
              <p className="text-sm font-semibold text-indigo-900 mb-1">Upgrade to Pro — $29/month</p>
              <ul className="text-xs text-indigo-700 space-y-1 mb-3">
                <li>✓ Unlimited workspaces</li>
                <li>✓ Unlimited posts per month</li>
                <li>✓ AI image & video generation</li>
                <li>✓ Priority support</li>
              </ul>
              <button
                onClick={handleUpgrade}
                disabled={billingLoading}
                className="w-full py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {billingLoading ? 'Redirecting…' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-gray-500 mb-3">You're on the Pro plan. Enjoy unlimited workspaces and posts.</p>
            <button
              onClick={handleManageBilling}
              disabled={billingLoading}
              className="w-full py-2 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {billingLoading ? 'Redirecting…' : 'Manage billing'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-10 text-sm text-gray-400">Loading…</div>}>
      <SettingsContent />
    </Suspense>
  );
}
