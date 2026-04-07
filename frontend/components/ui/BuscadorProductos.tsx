/**
 * BuscadorProductos.tsx — Buscador de stock compartido
 * Usado tanto en el panel admin como en el panel vendedor.
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/lib/api';

interface Producto {
  id: string;
  nombre: string;
  marca: string;
  descripcion: string | null;
  codigo: string | null;
  precio: number | null;
  stock: number | null;
  stock_minimo: number | null;
}

export function BuscadorProductos() {
  const [query, setQuery] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setProductos([]);
      setBuscado(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<{ productos: Producto[] }>(
          `/productos?q=${encodeURIComponent(query.trim())}`
        );
        setProductos(res.productos);
        setBuscado(true);
      } catch {
        setProductos([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-4">
      {/* Input de búsqueda */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre, marca o código..."
          className="w-full h-12 pl-10 pr-4 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
          autoFocus
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Resultados */}
      {buscado && !isLoading && productos.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">
            No se encontraron productos para <strong>"{query}"</strong>
          </p>
        </div>
      )}

      {productos.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-400">
            {productos.length} resultado{productos.length !== 1 ? 's' : ''}
          </p>
          {productos.map(p => (
            <div
              key={p.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-4"
            >
              {/* Marca badge */}
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-gray-500 text-center leading-tight px-1">
                  {p.marca.slice(0, 6).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{p.nombre}</p>
                    <p className="text-xs text-gray-500">{p.marca}</p>
                    {p.codigo && (
                      <p className="text-xs text-gray-400 mt-0.5">Cód: {p.codigo}</p>
                    )}
                    {p.descripcion && (
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{p.descripcion}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {p.precio != null && (
                      <p className="text-sm font-bold text-gray-900">
                        ${p.precio.toLocaleString('es-AR')}
                      </p>
                    )}
                    {p.stock != null && (() => {
                      const bajo = (p.stock_minimo ?? 0) > 0 && p.stock <= (p.stock_minimo ?? 0);
                      return (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                          p.stock === 0
                            ? 'bg-red-100 text-red-600'
                            : bajo
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {p.stock === 0 ? 'Sin stock' : bajo ? `⚠️ Bajo stock (${p.stock})` : `${p.stock} en stock`}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!buscado && !isLoading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm text-gray-500">
            Escribí el nombre del producto, la marca o el código para buscarlo
          </p>
        </div>
      )}
    </div>
  );
}
