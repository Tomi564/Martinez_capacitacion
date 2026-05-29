'use client';

import type { ReactNode } from 'react';

interface ConfirmarEliminacionModalProps {
  open: boolean;
  titulo: string;
  descripcion: ReactNode;
  advertencia?: string | null;
  eliminando: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
  idTitulo?: string;
}

export function ConfirmarEliminacionModal({
  open,
  titulo,
  descripcion,
  advertencia,
  eliminando,
  onCancelar,
  onConfirmar,
  idTitulo = 'confirmar-eliminacion-titulo',
}: ConfirmarEliminacionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl flex flex-col gap-4"
      >
        <h2 id={idTitulo} className="text-lg font-bold text-gray-900">
          {titulo}
        </h2>
        <div className="text-sm text-gray-600">{descripcion}</div>
        {advertencia && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            {advertencia}
          </p>
        )}
        <p className="text-xs text-gray-500">
          ¿Estás seguro? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={eliminando}
            className="flex-1 h-11 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={eliminando}
            className="flex-1 h-11 bg-[#C8102E] text-white rounded-xl text-sm font-semibold hover:bg-gray-900 disabled:opacity-50"
          >
            {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
