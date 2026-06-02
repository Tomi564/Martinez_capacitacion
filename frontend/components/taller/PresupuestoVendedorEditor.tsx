'use client';

import { useMemo } from 'react';
import { Download } from 'lucide-react';
import {
  agruparLineasMarcadasInforme,
  formatPesosAr,
  parsePrecioInput,
  type PresupuestoLineaInforme,
} from '@/lib/presupuesto-checklist';

type Props = {
  lineas: PresupuestoLineaInforme[];
  precios: Record<string, string>;
  onPrecioChange: (itemId: string, valor: string) => void;
  operario?: string | null;
  observaciones?: string | null;
  onGenerarPdf: () => void;
  generando: boolean;
  errorPdf: string | null;
  yaGuardado?: boolean;
};

export function PresupuestoVendedorEditor({
  lineas,
  precios,
  onPrecioChange,
  operario,
  observaciones,
  onGenerarPdf,
  generando,
  errorPdf,
  yaGuardado = false,
}: Props) {
  const secciones = useMemo(() => agruparLineasMarcadasInforme(lineas), [lineas]);

  const total = useMemo(() => {
    return lineas
      .filter((l) => l.marcado)
      .reduce((s, l) => {
        const precioStr = precios[l.item_catalogo_id] ?? (l.precio != null ? String(Math.round(l.precio)) : '');
        const precio = parsePrecioInput(precioStr);
        return s + precio * (l.cantidad || 1);
      }, 0);
  }, [lineas, precios]);

  const faltanPrecios = useMemo(() => {
    return lineas
      .filter((l) => l.marcado)
      .some((l) => {
        const precioStr = precios[l.item_catalogo_id] ?? (l.precio != null ? String(Math.round(l.precio)) : '');
        return parsePrecioInput(precioStr) <= 0;
      });
  }, [lineas, precios]);

  if (!secciones.length) {
    return (
      <p className="text-sm text-gray-500">
        El mecánico aún no marcó ítems en el presupuesto de esta orden.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        {yaGuardado
          ? 'Podés modificar los precios guardados y volver a generar el PDF cuando quieras.'
          : 'Revisá los ítems marcados por el mecánico y cargá los precios para el cliente.'}
      </p>

      {secciones.map((sec) => {
        const subtotalSec = sec.items.reduce((s, l) => {
          const precioStr = precios[l.item_catalogo_id] ?? (l.precio != null ? String(Math.round(l.precio)) : '');
          const precio = parsePrecioInput(precioStr);
          return s + precio * (l.cantidad || 1);
        }, 0);

        return (
          <div key={sec.grupo} className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-[#1F1F1F] text-white px-3 py-2 flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wide">{sec.titulo}</span>
              <span className="text-xs font-bold">{formatPesosAr(subtotalSec)}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {sec.items.map((l) => {
                const precioVal =
                  precios[l.item_catalogo_id] ??
                  (l.precio != null ? String(Math.round(l.precio)) : '');
                const sub = parsePrecioInput(precioVal) * (l.cantidad || 1);

                return (
                  <div key={l.item_catalogo_id} className="px-3 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{l.etiqueta}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Cantidad: {l.cantidad || 1}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:w-52 shrink-0">
                      <label className="sr-only" htmlFor={`precio-${l.item_catalogo_id}`}>
                        Precio de {l.etiqueta}
                      </label>
                      <span className="text-xs font-bold text-gray-400">$</span>
                      <input
                        id={`precio-${l.item_catalogo_id}`}
                        type="text"
                        inputMode="decimal"
                        value={precioVal}
                        onChange={(e) => onPrecioChange(l.item_catalogo_id, e.target.value)}
                        placeholder="0"
                        className="flex-1 h-11 px-3 text-base font-bold rounded-xl border-2 border-gray-200 focus:border-[#C8102E] focus:outline-none"
                      />
                    </div>
                    <p className="text-sm font-bold text-gray-900 sm:w-24 sm:text-right shrink-0">
                      {formatPesosAr(sub)}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="px-3 py-2 bg-gray-50 flex justify-between text-xs">
              <span className="font-bold text-gray-500 uppercase">Subtotal sección</span>
              <span className="font-black text-gray-900">{formatPesosAr(subtotalSec)}</span>
            </div>
          </div>
        );
      })}

      <div className="rounded-xl bg-[#C8102E] text-white px-4 py-3 flex justify-between items-center">
        <span className="font-black uppercase text-sm">Total general</span>
        <span className="text-lg font-black">{formatPesosAr(total)}</span>
      </div>

      {(operario || observaciones) && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-2 text-sm">
          {operario && (
            <p>
              <span className="text-gray-500 font-medium">Operario responsable:</span>{' '}
              <span className="text-gray-900 font-semibold">{operario}</span>
            </p>
          )}
          {observaciones && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Observaciones</p>
              <p className="text-gray-800 whitespace-pre-wrap">{observaciones}</p>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onGenerarPdf}
        disabled={generando || faltanPrecios}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8102E] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#a50d26] disabled:opacity-60"
      >
        <Download className="w-4 h-4" />
        {generando ? 'Generando PDF…' : yaGuardado ? 'Actualizar presupuesto PDF' : 'Generar presupuesto PDF'}
      </button>
      {faltanPrecios && (
        <p className="text-xs text-amber-700">Completá el precio de todos los ítems marcados.</p>
      )}
      {errorPdf && <p className="text-sm text-red-600">{errorPdf}</p>}
    </div>
  );
}
