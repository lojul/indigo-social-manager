'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const TOOLS = [
  {
    href: '/studio',
    title: 'Content Studio',
    description: 'Manage website content, blog posts, and media via Sanity CMS.',
    tags: ['Next.js', 'Sanity', 'Tailwind'],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    status: 'live' as const,
    external: false,
  },
  {
    href: '/social',
    title: 'Social Media Manager',
    description: 'Generate and publish Facebook posts for your companies via Buffer.',
    tags: ['Next.js', 'Buffer', 'OpenRouter', 'Neon'],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    status: 'live' as const,
    external: false,
  },
  {
    href: '/billing',
    title: 'AI Billing',
    description: 'Track AI generation costs (images and reels) per company and month.',
    tags: ['Neon', 'Azure OpenAI', 'OpenRouter'],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    status: 'live' as const,
    external: false,
  },
  {
    href: 'https://stock-signals-hkg.web.app',
    title: 'Stock Signals',
    description: 'Technical analysis scanner for HSI and US stocks — TD9, RSI, Bollinger Bands, and MACD signals with AI scoring.',
    tags: ['Python', 'Firebase', 'scikit-learn', 'Yahoo Finance'],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    status: 'live' as const,
    external: true,
  },
];

export default function AdminDashboard() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 leading-none">Indigo Admin</h1>
              <p className="text-xs text-gray-400 mt-0.5">Internal tools</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Select a tool to get started.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool) => (
            tool.status === 'live' ? (
              tool.external ? (
                <a key={tool.href} href={tool.href} target="_blank" rel="noopener noreferrer"
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                    {tool.icon}
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{tool.title}</h3>
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{tool.description}</p>
                  {'tags' in tool && tool.tags && (
                    <div className="flex flex-wrap gap-1.5">
                      {tool.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </a>
              ) : (
                <Link key={tool.href} href={tool.href}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                    {tool.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{tool.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{tool.description}</p>
                  {'tags' in tool && tool.tags && (
                    <div className="flex flex-wrap gap-1.5">
                      {tool.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </Link>
              )
            ) : (
              <div key={tool.href}
                className="bg-white rounded-xl border border-dashed border-gray-200 p-6 opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center mb-4">
                  {tool.icon}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-700">{tool.title}</h3>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">Soon</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{tool.description}</p>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
