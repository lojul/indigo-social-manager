import Link from 'next/link';
import { auth } from '@/auth';
import { getAllCompanies, getUserById } from '@/lib/db';
import CompaniesGrid from '@/components/CompaniesGrid';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [companies, user] = await Promise.all([
    getAllCompanies(session.user.id),
    getUserById(session.user.id),
  ]);

  const plan = user?.plan ?? 'free';
  const hasBufferToken = !!user?.buffer_api_token;
  const postsThisMonth = user?.posts_this_month ?? 0;
  const isAtLimit = plan === 'free' && postsThisMonth >= 5;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Banners */}
      {!hasBufferToken && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">Connect your Buffer account</p>
            <p className="text-xs text-amber-600 mt-0.5">Add your Buffer API token in Settings to start publishing posts.</p>
          </div>
          <Link href="/dashboard/settings" className="shrink-0 text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2">
            Go to Settings →
          </Link>
        </div>
      )}

      {isAtLimit && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <svg className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-indigo-800">Monthly post limit reached</p>
            <p className="text-xs text-indigo-600 mt-0.5">You've used all 5 free posts this month. Upgrade to Pro for unlimited posts.</p>
          </div>
          <Link href="/dashboard/settings" className="shrink-0 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors">
            Upgrade
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Workspaces</h1>
          <p className="text-sm text-gray-500 mt-1">
            Select a workspace to create posts.
            {plan === 'free' && (
              <span className="ml-1 text-gray-400">({postsThisMonth}/5 posts used this month)</span>
            )}
          </p>
        </div>
        <Link
          href="/billing"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-100"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          AI Billing
        </Link>
      </div>

      <CompaniesGrid companies={companies} basePath="/dashboard" />
    </div>
  );
}
