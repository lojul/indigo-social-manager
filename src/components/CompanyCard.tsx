'use client';

import Link from 'next/link';
import { THEMES, ThemeKey } from '@/lib/themes';

interface CompanyCardProps {
  id: number;
  name: string;
  tagline: string;
  theme: string;
  basePath?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function CompanyCard({ id, name, tagline, theme, basePath = '/dashboard' }: CompanyCardProps) {
  const themeKey = (theme in THEMES ? theme : 'indigo') as ThemeKey;
  const themeConfig = THEMES[themeKey];

  return (
    <Link href={`${basePath}/company/${id}`} className="block">
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer">
        {/* Coloured top banner */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: themeConfig.bg }}
        />
        <div className="p-5">
          {/* Avatar with initials */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg mb-3"
            style={{ backgroundColor: themeConfig.bg }}
          >
            {getInitials(name)}
          </div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1 leading-tight">{name}</h3>
          <p className="text-gray-500 text-xs leading-tight">{tagline}</p>
        </div>
      </div>
    </Link>
  );
}
