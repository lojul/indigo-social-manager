import { getAllCompanies } from '@/lib/db';
import CompaniesGrid from '@/components/CompaniesGrid';

export const dynamic = 'force-dynamic';

export default async function SocialPage() {
  const companies = await getAllCompanies();
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Social Media Manager</h1>
          <p className="text-gray-500 mt-1">Select a company workspace</p>
        </div>
        <CompaniesGrid companies={companies} />
      </div>
    </div>
  );
}
