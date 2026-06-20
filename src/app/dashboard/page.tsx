import Link from 'next/link';
import { getAllCompanies } from '@/lib/db';
import CompaniesGrid from '@/components/CompaniesGrid';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const companies = await getAllCompanies();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Workspaces</h1>
          <p className="text-sm text-gray-500 mt-1">Select a workspace to create posts.</p>
        </div>
        <Link
          href="/"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Dashboard
        </Link>
      </div>
      <CompaniesGrid companies={companies} basePath="/dashboard" />
    </div>
  );
}
