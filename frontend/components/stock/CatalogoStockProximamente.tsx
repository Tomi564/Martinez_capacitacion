'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CatalogoStockProximamenteProps {
  inicioHref: string;
}

export function CatalogoStockProximamente({ inicioHref }: CatalogoStockProximamenteProps) {
  return (
    <div className="px-4 py-16 flex flex-col items-center text-center max-w-md mx-auto gap-6">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
        <Package className="w-8 h-8 text-gray-400" aria-hidden />
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900">Catálogo y stock</h1>
        <p className="text-sm text-gray-600 mt-3 leading-relaxed">
          Esta sección estará disponible próximamente
        </p>
      </div>
      <Link href={inicioHref}>
        <Button className="rounded-xl">Volver al inicio</Button>
      </Link>
    </div>
  );
}
