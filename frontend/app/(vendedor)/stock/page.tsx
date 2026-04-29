'use client';

import { useEffect, useMemo, useState } from 'react';
import { BuscadorProductos } from '@/components/ui/BuscadorProductos';
import { apiClient } from '@/lib/api';
import { Expand, ImageIcon, Minimize2, Search } from 'lucide-react';

interface ProductoCatalogo {
  id: string;
  nombre: string;
  marca: string;
  descripcion: string | null;
  codigo: string | null;
  precio: number | null;
  stock: number | null;
  imagen_url?: string | null;
  medida?: string | null;
}

export default function StockVendedorPage() {
  const [modoCliente, setModoCliente] = useState(false);
  const [query, setQuery] = useState('');
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!modoCliente) return;
    const t = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<{ productos: ProductoCatalogo[] }>(
          `/productos${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`
        );
        setProductos(res.productos || []);
      } catch {
        setProductos([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [query, modoCliente]);

  const productosOrdenados = useMemo(
    () =>
      [...productos].sort((a, b) => {
        if (a.precio == null && b.precio == null) return 0;
        if (a.precio == null) return 1;
        if (b.precio == null) return -1;
        return b.precio - a.precio;
      }),
    [productos]
  );

  const extraerMedida = (p: ProductoCatalogo) => {
    if (p.medida) return p.medida;
    const fuente = `${p.nombre} ${p.descripcion ?? ''} ${p.codigo ?? ''}`;
    const match = fuente.match(/\b\d{3}\/\d{2}\s?R\d{2}\b/i);
    return match?.[0]?.toUpperCase() || 'Medida no informada';
  };

  return (
    <div className="px-4 py-6 flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Consulta de stock</h1>
          <p className="text-sm text-gray-500 mt-1">
            Buscá por nombre de producto, marca o código
          </p>
        </div>
        <button
          onClick={() => {
            setModoCliente((v) => !v);
            setQuery('');
          }}
          className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 flex items-center gap-2"
        >
          <Expand className="w-4 h-4" />
          Mostrar al cliente
        </button>
      </div>
      <BuscadorProductos />

      {modoCliente && (
        <div className="fixed inset-0 z-40 bg-gray-50 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm font-semibold text-gray-900">Modo consulta con cliente</p>
              <button
                onClick={() => setModoCliente(false)}
                className="h-9 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <Minimize2 className="w-4 h-4" />
                Salir
              </button>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar producto para mostrar"
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pb-8">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-36 rounded-xl border border-gray-200 bg-white animate-pulse" />
                ))}
              </div>
            ) : productosOrdenados.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-gray-500">No hay productos para mostrar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {productosOrdenados.map((p) => (
                  <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4 flex gap-4 items-center">
                    <div className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                      {p.imagen_url ? (
                        <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500">{p.marca}</p>
                      <p className="text-lg font-bold text-gray-900 leading-tight">{p.nombre}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{extraerMedida(p)}</p>
                      <p className="text-2xl font-bold text-[#C8102E] mt-2">
                        {p.precio != null ? `$${p.precio.toLocaleString('es-AR')}` : 'Consultar'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
