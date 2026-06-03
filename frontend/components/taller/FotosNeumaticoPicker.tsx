'use client';

import { useRef } from 'react';
import { compressImageToDataUrl } from '@/lib/compress-image';

export const MAX_FOTOS_NEUMATICO = 4;

type Props = {
  fotos: string[];
  onChange: (fotos: string[]) => void;
  disabled?: boolean;
};

export function FotosNeumaticoPicker({ fotos, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const agregarArchivos = async (files: FileList | null) => {
    if (!files?.length || disabled) return;
    const restantes = MAX_FOTOS_NEUMATICO - fotos.length;
    if (restantes <= 0) return;

    const nuevas: string[] = [];
    for (let i = 0; i < files.length && nuevas.length < restantes; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      try {
        nuevas.push(await compressImageToDataUrl(file));
      } catch {
        /* omitir archivo ilegible */
      }
    }
    if (nuevas.length) {
      onChange([...fotos, ...nuevas].slice(0, MAX_FOTOS_NEUMATICO));
    }
  };

  const quitar = (idx: number) => {
    if (disabled) return;
    onChange(fotos.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-xs font-bold text-gray-500 uppercase mb-2">
        Fotos ({fotos.length}/{MAX_FOTOS_NEUMATICO})
      </p>
      <p className="text-xs text-gray-500 mb-3">
        Podés sacar una foto o elegir de la galería. Máximo {MAX_FOTOS_NEUMATICO} por orden.
      </p>

      {fotos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {fotos.map((src, i) => (
            <div
              key={`${i}-${src.slice(0, 32)}`}
              className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
            >
              <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              {!disabled && (
                <button
                  type="button"
                  aria-label={`Quitar foto ${i + 1}`}
                  onClick={() => quitar(i)}
                  className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-black/70 text-white text-lg leading-none font-bold"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {fotos.length < MAX_FOTOS_NEUMATICO && !disabled && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              void agregarArchivos(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full h-12 rounded-xl border-2 border-dashed border-gray-300 text-sm font-bold text-gray-700 active:scale-[0.99] transition-transform"
          >
            Agregar fotos
          </button>
        </>
      )}
    </div>
  );
}
