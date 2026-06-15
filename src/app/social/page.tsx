import Link from 'next/link';
import { getAllCompanies } from '@/lib/db';
import CompaniesGrid from '@/components/CompaniesGrid';

export const dynamic = 'force-dynamic';

export default async function SocialPage() {
  const companies = await getAllCompanies();
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Social Media Manager</h1>
            <p className="text-gray-500 mt-1">Select a company workspace</p>
          </div>
          <Link
            href="/billing"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            AI Billing
          </Link>
        </div>
        <CompaniesGrid companies={companies} />
      </div>
    </div>
  );
}
