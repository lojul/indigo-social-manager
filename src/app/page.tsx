import Link from 'next/link';

const TOOLS = [
  {
    href: '/dashboard',
    title: 'Social Media Manager',
    description: 'Generate and publish Facebook posts for your companies via Buffer.',
    tags: ['Buffer', 'OpenRouter', 'Azure AI'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    status: 'live' as const,
    external: false,
  },
  {
    href: '/studio',
    title: 'Content Studio',
    description: 'Manage website content, blog posts, and media via Sanity CMS.',
    tags: ['Next.js', 'Sanity', 'Tailwind'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    status: 'live' as const,
    external: false,
  },
  {
    href: 'https://stock-signals-hkg.web.app',
    title: 'Stock Signals',
    description: 'Technical analysis scanner for HSI and US stocks — TD9, RSI, Bollinger Bands, and MACD signals with AI scoring.',
    tags: ['Python', 'Firebase', 'scikit-learn'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    status: 'live' as const,
    external: true,
  },
  {
    href: 'https://nextjs-dashboard-kappa-one-24.vercel.app',
    title: 'Document Processor',
    description: 'OCR pipeline and property intelligence chatbot for Hong Kong property documents.',
    tags: ['Next.js', 'FastAPI', 'OCR', 'RAG'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    status: 'live' as const,
    external: true,
  },
];

export default function AdminDashboard() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Select a tool to get started.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map((tool) =>
          tool.external ? (
            <a
              key={tool.href}
              href={tool.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-indigo-100 transition-all group"
            >
              <ToolCardContent tool={tool} />
            </a>
          ) : (
            <Link
              key={tool.href}
              href={tool.href}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-indigo-100 transition-all group"
            >
              <ToolCardContent tool={tool} />
            </Link>
          )
        )}
      </div>
    </div>
  );
}

function ToolCardContent({ tool }: { tool: typeof TOOLS[0] }) {
  return (
    <>
      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
        {tool.icon}
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        <h3 className="text-sm font-semibold text-gray-900">{tool.title}</h3>
        {tool.external && (
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </div>
      <p className="text-xs text-gray-500 leading-relaxed mb-4">{tool.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {tool.tags.map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full border border-gray-100">
            {tag}
          </span>
        ))}
      </div>
    </>
  );
}
