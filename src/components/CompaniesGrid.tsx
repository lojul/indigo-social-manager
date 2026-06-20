'use client';

import CompanyCard from './CompanyCard';
import AddCompanyCard from './AddCompanyCard';

interface Company {
  id: number;
  name: string;
  tagline: string;
  theme: string;
}

interface CompaniesGridProps {
  companies: Company[];
  basePath?: string;
}

export default function CompaniesGrid({ companies, basePath = '/dashboard' }: CompaniesGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {companies.map((company) => (
        <CompanyCard
          key={company.id}
          id={company.id}
          name={company.name}
          tagline={company.tagline}
          theme={company.theme}
          basePath={basePath}
        />
      ))}
      <AddCompanyCard basePath={basePath} />
    </div>
  );
}
