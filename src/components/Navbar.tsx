'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function Navbar({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <nav className="h-12 bg-white border-b border-gray-100 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-gray-900">Indigo Admin</span>
      </Link>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
        >
          {user?.image ? (
            <img src={user.image} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
              {initials}
            </div>
          )}
          <span className="text-sm text-gray-700 hidden sm:block">{user?.name?.split(' ')[0]}</span>
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
            <div className="px-3 py-2.5 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
