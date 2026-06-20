import Link from 'next/link';

export const metadata = { title: 'Pricing – Soshio' };

const FREE_FEATURES = [
  '1 workspace',
  '5 posts per month',
  'AI post copy generation',
  'Live trend search',
  'Multilingual translation',
  'Buffer scheduling',
];

const PRO_FEATURES = [
  'Unlimited workspaces',
  'Unlimited posts per month',
  'AI image generation',
  'AI video reel generation',
  'All Free features',
  'Priority support',
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="h-14 border-b border-gray-100 px-4 sm:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900">Soshio</span>
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Sign in
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Simple, transparent pricing</h1>
          <p className="text-gray-500 text-lg">Start free. Upgrade when your business grows.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="border border-gray-200 rounded-2xl p-7">
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Free</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold text-gray-900">$0</span>
              </div>
              <p className="text-sm text-gray-400">Forever free — no credit card needed</p>
            </div>
            <ul className="space-y-3 mb-7">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="block w-full py-2.5 text-center border border-gray-200 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="border-2 border-indigo-600 rounded-2xl p-7 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="text-xs font-bold text-white bg-indigo-600 px-3 py-1 rounded-full">Most popular</span>
            </div>
            <div className="mb-6">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-2">Pro</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold text-gray-900">$29</span>
                <span className="text-sm text-gray-400 mb-1">/month</span>
              </div>
              <p className="text-sm text-gray-400">Cancel anytime</p>
            </div>
            <ul className="space-y-3 mb-7">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="block w-full py-2.5 text-center bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          All plans include access to Buffer scheduling and Tavily trend search.{' '}
          <Link href="/" className="text-indigo-600 hover:underline">Learn more →</Link>
        </p>
      </div>
    </div>
  );
}
