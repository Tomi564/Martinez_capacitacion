'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function MecanicoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, logout, nombreCompleto, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    if (user?.rol !== 'mecanico') { router.replace('/login'); return; }
  }, []);

  if (!mounted || !isAuthenticated()) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Header */}
      <header className="bg-[#1F1F1F] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {pathname !== '/mecanico' && (
            <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[#2F2F2F]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}
          <div>
            <p className="text-xs text-gray-400">Mecánico</p>
            <p className="text-sm font-bold">{nombreCompleto()}</p>
          </div>
        </div>
        <button onClick={logout} className="p-2 rounded-lg hover:bg-[#2F2F2F]">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </header>

      <main className="flex-1 pb-6">
        {children}
      </main>

      {/* Nav inferior simple */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-10">
        <Link href="/mecanico" className={`flex-1 flex flex-col items-center py-3 gap-0.5 ${pathname === '/mecanico' ? 'text-[#C8102E]' : 'text-gray-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span className="text-xs font-medium">Inicio</span>
        </Link>
        <Link href="/mecanico/nueva-visita" className={`flex-1 flex flex-col items-center py-3 gap-0.5 ${pathname.includes('nueva-visita') ? 'text-[#C8102E]' : 'text-gray-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          <span className="text-xs font-medium">Nueva visita</span>
        </Link>
      </nav>
    </div>
  );
}
