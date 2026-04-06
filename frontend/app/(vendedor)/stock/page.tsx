'use client';

import { BuscadorProductos } from '@/components/ui/BuscadorProductos';

export default function StockVendedorPage() {
  return (
    <div className="px-4 py-6 flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Consulta de stock</h1>
        <p className="text-sm text-gray-500 mt-1">
          Buscá por nombre de producto, marca o código
        </p>
      </div>
      <BuscadorProductos />
    </div>
  );
}
