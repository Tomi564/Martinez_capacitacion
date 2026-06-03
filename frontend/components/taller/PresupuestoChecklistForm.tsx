'use client';

import { useMemo, useState } from 'react';
import {
  PRESUPUESTO_GRUPOS,
  PRESUPUESTO_GRUPO_LABELS,
  type PresupuestoGrupoKey,
  type PresupuestoLineaState,
  lineaKey,
  lineaMarcadaSinPrecio,
  subtotalGrupo,
  totalGeneral,
  etiquetaMontoChecklist,
} from '@/lib/presupuesto-checklist';

type Props = {
  lineas: PresupuestoLineaState[];
  onChange: (lineas: PresupuestoLineaState[]) => void;
  operario: string;
  onOperarioChange: (v: string) => void;
  observaciones: string;
  onObservacionesChange: (v: string) => void;
  disabled?: boolean;
};

export function PresupuestoChecklistForm({
  lineas,
  onChange,
  operario,
  onOperarioChange,
  observaciones,
  onObservacionesChange,
  disabled = false,
}: Props) {
  const [abiertos, setAbiertos] = useState<Partial<Record<PresupuestoGrupoKey, boolean>>>({
    tren_delantero: true,
  });

  const total = useMemo(() => totalGeneral(lineas), [lineas]);

  const toggleGrupo = (g: PresupuestoGrupoKey) => {
    setAbiertos((prev) => ({ ...prev, [g]: !prev[g] }));
  };

  const actualizarLinea = (key: string, patch: Partial<PresupuestoLineaState>) => {
    onChange(lineas.map((l) => (lineaKey(l) === key ? { ...l, ...patch } : l)));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Presupuesto interno</p>

      {PRESUPUESTO_GRUPOS.map((grupo) => {
        const delGrupo = lineas.filter((l) => l.grupo === grupo);
        const sub = subtotalGrupo(delGrupo);
        const abierto = !!abiertos[grupo];

        return (
          <div key={grupo} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              disabled={disabled}
              onClick={() => toggleGrupo(grupo)}
              className="w-full flex items-center justify-between px-4 py-4 bg-[#1F1F1F] text-white active:opacity-90"
            >
              <span className="font-black text-sm uppercase tracking-wide">
                {PRESUPUESTO_GRUPO_LABELS[grupo]}
              </span>
              <span className="flex items-center gap-3 text-sm">
                {delGrupo.some((l) => l.marcado) && (
                  <span className="font-bold">{etiquetaMontoChecklist(delGrupo, sub)}</span>
                )}
                <span className="text-lg leading-none">{abierto ? '−' : '+'}</span>
              </span>
            </button>

            {abierto && (
              <div className="divide-y divide-gray-100">
                {delGrupo.map((linea) => {
                  const key = lineaKey(linea);
                  return (
                  <div key={key} className="px-4 py-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={linea.marcado}
                        onChange={(e) =>
                          actualizarLinea(key, {
                            marcado: e.target.checked,
                            precio: e.target.checked ? linea.precio : '',
                          })
                        }
                        className="mt-1 w-6 h-6 shrink-0 rounded border-gray-300"
                      />
                      <span className="text-sm font-semibold text-gray-900 leading-snug flex-1">
                        {linea.etiqueta}
                      </span>
                    </label>

                    {linea.marcado && (
                      <div className="mt-3 ml-9 flex gap-2">
                        <div className="w-16">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Cant.</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            disabled={disabled}
                            value={linea.cantidad}
                            onChange={(e) =>
                              actualizarLinea(key, { cantidad: e.target.value })
                            }
                            className="mt-1 w-full h-12 px-2 text-center font-bold rounded-xl border-2 border-gray-200 text-base"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">
                            Precio (opcional)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            disabled={disabled}
                            value={linea.precio}
                            onChange={(e) =>
                              actualizarLinea(key, { precio: e.target.value })
                            }
                            placeholder="Opcional"
                            className="mt-1 w-full h-12 px-3 font-bold rounded-xl border-2 border-gray-200 text-base"
                          />
                          {lineaMarcadaSinPrecio(linea) && (
                            <p className="mt-1 text-xs font-semibold text-amber-700">Sin precio</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}

                <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Subtotal</span>
                  <span className="text-base font-black text-gray-900">
                    {etiquetaMontoChecklist(delGrupo, sub)}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="bg-[#C8102E] text-white rounded-2xl px-4 py-4 flex justify-between items-center">
        <span className="font-black uppercase text-sm tracking-wide">Total general</span>
        <span className="text-xl font-black">{etiquetaMontoChecklist(lineas, total)}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
        <label className="text-xs font-bold text-gray-500 uppercase">Operario responsable</label>
        <input
          type="text"
          disabled={disabled}
          value={operario}
          onChange={(e) => onOperarioChange(e.target.value)}
          placeholder="Nombre del operario"
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base font-semibold"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
        <label className="text-xs font-bold text-gray-500 uppercase">Observaciones generales</label>
        <textarea
          disabled={disabled}
          value={observaciones}
          onChange={(e) => onObservacionesChange(e.target.value)}
          rows={3}
          placeholder="Notas para la clientela o el taller…"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base resize-none focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40"
        />
      </div>
    </div>
  );
}
