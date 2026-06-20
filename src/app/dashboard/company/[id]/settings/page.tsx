import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getCompanyById } from '@/lib/db';
import { THEMES, ThemeKey } from '@/lib/themes';
import CompanySettingsForm from '@/components/CompanySettingsForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function DashboardCompanySettingsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  const company = await getCompanyById(id, session.user.id);
  if (!company) notFound();

  const themeKey = (company.theme in THEMES ? company.theme : 'indigo') as ThemeKey;
  const theme = THEMES[themeKey];
  const initials = company.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href={`/dashboard/company/${company.id}`}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <div className="flex items-center gap-3 ml-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: theme.bg }}
            >
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-none">{company.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">Workspace Settings</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <CompanySettingsForm company={company} />
      </div>
    </div>
  );
}
