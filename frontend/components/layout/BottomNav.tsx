'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FabMenuSheet, type FabMenuItem } from './FabMenuSheet';
import type { ReactNode } from 'react';

export interface BottomNavItem {
  href: string;
  label: string;
  icon: ReactNode;
  exactMatch?: boolean;
  badgeCount?: number;
  activePathPrefixes?: string[];
}

function pathnameMatchesNav(
  pathname: string,
  item: { href: string; exactMatch?: boolean; activePathPrefixes?: string[] },
) {
  if (item.exactMatch) return pathname === item.href;
  const prefixes = item.activePathPrefixes;
  if (prefixes?.length) return prefixes.some((p) => pathname.startsWith(p));
  return pathname.startsWith(item.href);
}

interface BottomNavProps {
  pathname: string;
  primaryItems: [BottomNavItem, BottomNavItem];
  fabItems?: FabMenuItem[];
  fabGridColumns?: 2 | 3;
}

export function BottomNav({
  pathname,
  primaryItems,
  fabItems = [],
  fabGridColumns = 2,
}: BottomNavProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasFab = fabItems.length > 0;

  const isActive = (item: BottomNavItem | FabMenuItem) =>
    pathnameMatchesNav(pathname, item);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20">
      {hasFab && (
        <FabMenuSheet
          open={sheetOpen}
          items={fabItems}
          pathname={pathname}
          onClose={() => setSheetOpen(false)}
          columns={fabGridColumns}
        />
      )}

      <div className="relative bg-white border-t border-gray-200 grid grid-cols-3 items-center h-16 px-1">
        {primaryItems.slice(0, 1).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-1 rounded-lg transition-colors ${
              isActive(item) ? 'text-[#C8102E]' : 'text-gray-500'
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span className={`text-xs ${isActive(item) ? 'font-semibold' : 'font-normal'}`}>
              {item.label}
            </span>
            {(item.badgeCount ?? 0) > 0 && (
              <span className="absolute top-1 right-[30%] bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {(item.badgeCount ?? 0) > 9 ? '9+' : item.badgeCount}
              </span>
            )}
          </Link>
        ))}

        {hasFab ? (
          <button
            onClick={() => setSheetOpen((v) => !v)}
            className={`relative -top-3 mx-auto w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 active:scale-95 ${
              sheetOpen
                ? 'bg-[#C8102E] border-[#C8102E] shadow-sm'
                : fabItems.some((item) => isActive(item))
                ? 'bg-[#C8102E] border-[#C8102E] shadow-sm'
                : 'bg-[#1F1F1F] border-[#1F1F1F] shadow-sm'
            }`}
            aria-label="Más opciones"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-5 h-5 text-white transition-transform duration-300 ${sheetOpen ? 'rotate-45' : ''}`}
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        ) : (
          <div />
        )}

        {primaryItems.slice(1).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-1 rounded-lg transition-colors ${
              isActive(item) ? 'text-[#C8102E]' : 'text-gray-500'
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span className={`text-xs ${isActive(item) ? 'font-semibold' : 'font-normal'}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
