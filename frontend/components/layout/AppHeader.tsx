'use client';

import type { ReactNode } from 'react';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onLogout: () => void;
  leading?: ReactNode;
  titleIcon?: ReactNode;
}

export function AppHeader({
  title,
  subtitle,
  onLogout,
  leading,
  titleIcon,
}: AppHeaderProps) {
  return (
    <header className="bg-[#1F1F1F] text-white px-4 h-14 flex items-center justify-between sticky top-0 z-10 border-b border-[#2F2F2F]">
      <div className="flex items-center gap-3 min-w-0">
        {leading}
        <div className="min-w-0">
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          <div className="flex items-center gap-2 min-w-0">
            {titleIcon}
            <p className="text-sm font-semibold tracking-tight truncate">{title}</p>
          </div>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="p-2 rounded-md hover:bg-[#2F2F2F] transition-colors"
        aria-label="Cerrar sesión"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </header>
  );
}
