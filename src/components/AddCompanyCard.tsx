import Link from 'next/link';

export default function AddCompanyCard() {
  return (
    <Link
      href="/social/company/new"
      className="bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 flex flex-col items-center justify-center min-h-[140px] group"
    >
      <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center mb-3 transition-colors">
        <svg
          className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <span className="text-sm font-medium text-gray-500 group-hover:text-indigo-600 transition-colors">
        Add Company
      </span>
    </Link>
  );
}
