'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export interface FabMenuItem {
  href: string;
  label: string;
  icon: ReactNode;
  exactMatch?: boolean;
  /** Si hay varios prefijos, el ítem aparece activo si la ruta coincide con alguno */
  activePathPrefixes?: string[];
}

interface FabMenuSheetProps {
  open: boolean;
  items: FabMenuItem[];
  pathname: string;
  columns?: 2 | 3;
  onClose: () => void;
}

export function FabMenuSheet({
  open,
  items,
  pathname,
  columns = 2,
  onClose,
}: FabMenuSheetProps) {
  const isActive = (item: FabMenuItem) => {
    if (item.exactMatch) return pathname === item.href;
    const prefixes = item.activePathPrefixes;
    if (prefixes?.length) return prefixes.some((p) => pathname.startsWith(p));
    return pathname.startsWith(item.href);
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          open ? 'opacity-40 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div
        className={`absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-sm transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-6 py-2">
          Navegación
        </p>
        <div className={`grid ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2 px-4 pb-5 pt-1`}>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex ${columns === 3 ? 'flex-col' : 'items-center'} items-center gap-1.5 px-3 py-3 rounded-xl border transition-colors active:scale-[0.99] ${
                isActive(item)
                  ? 'bg-[#C8102E] text-white border-[#C8102E]'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span className={columns === 3 ? 'text-xs font-medium' : 'text-sm font-medium'}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
