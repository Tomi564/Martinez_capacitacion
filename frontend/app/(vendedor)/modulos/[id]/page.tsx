'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { ModuloConProgreso } from '@/types';

export default function ModuloDetallePage() {
  const params = useParams();
  const router = useRouter();
  const moduloId = params.id as string;

  const [modulo, setModulo] = useState<ModuloConProgreso | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModulo = async () => {
      try {
        const res = await apiClient.get<{ modulo: ModuloConProgreso }>(`/modulos/${moduloId}`);
        setModulo(res.modulo);
      } catch {
        setError('Error al cargar el módulo');
      } finally {
        setIsLoading(false);
      }
    };
    fetchModulo();
  }, [moduloId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !modulo) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error || 'Módulo no encontrado'}</p>
        </div>
      </div>
    );
  }

  if (modulo.estado === 'bloqueado') {
    router.replace('/modulos');
    return null;
  }

  const puedeRendir = modulo.estado === 'disponible' || modulo.estado === 'en_curso';

  return (
    <div className="flex flex-col max-w-lg mx-auto pb-8">

      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 sticky top-[52px] bg-gray-50 z-10 border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">Módulo {modulo.orden}</p>
          <h1 className="text-base font-bold text-gray-900 truncate">{modulo.titulo}</h1>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
          modulo.estado === 'aprobado' ? 'bg-green-100 text-green-700'
          : modulo.estado === 'en_curso' ? 'bg-amber-100 text-amber-700'
          : 'bg-blue-100 text-blue-700'
        }`}>
          {modulo.estado === 'aprobado' ? '✓ Aprobado'
            : modulo.estado === 'en_curso' ? 'En curso'
            : 'Disponible'}
        </span>
      </div>

      <div className="px-4 py-6 flex flex-col gap-5">

        {/* Descripción */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">{modulo.titulo}</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{modulo.descripcion}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-gray-900">{modulo.duracion_min}</p>
            <p className="text-xs text-gray-500 mt-0.5">minutos</p>
          </div>
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-gray-900">{modulo.intentos}</p>
            <p className="text-xs text-gray-500 mt-0.5">intentos</p>
          </div>
          {modulo.mejor_nota !== null && modulo.mejor_nota > 0 && (
            <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-green-600">{modulo.mejor_nota.toFixed(0)}%</p>
              <p className="text-xs text-gray-500 mt-0.5">mejor nota</p>
            </div>
          )}
        </div>

        {/* Material de estudio — siempre visible */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Material de estudio</h2>

          {modulo.pdf_url ? (
            <Link href={modulo.pdf_url} target="_blank">
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-4 active:scale-95 transition-transform">
                <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#C8102E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Descargar material PDF</p>
                  <p className="text-xs text-gray-500">Módulo {modulo.orden} — {modulo.titulo}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4 opacity-50">
              <div className="w-11 h-11 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">Material PDF</p>
                <p className="text-xs text-gray-400">Próximamente disponible</p>
              </div>
            </div>
          )}

          {modulo.video_url ? (
            <Link href={modulo.video_url} target="_blank">
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-4 active:scale-95 transition-transform">
                <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Ver video</p>
                  <p className="text-xs text-gray-500">Módulo {modulo.orden} — {modulo.titulo}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4 opacity-50">
              <div className="w-11 h-11 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">Video</p>
                <p className="text-xs text-gray-400">Próximamente disponible</p>
              </div>
            </div>
          )}
        </div>

        {/* Aprobado */}
        {modulo.estado === 'aprobado' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-800">Módulo aprobado</p>
              <p className="text-sm text-green-600">Mejor nota: {modulo.mejor_nota?.toFixed(1)}%</p>
            </div>
          </div>
        )}

        {/* Examen */}
        {puedeRendir && modulo.intentos < 3 && (
          <div className="flex flex-col gap-2 pt-2">
            {modulo.intentos > 0 && (
              <p className="text-xs text-center text-gray-500">
                Intentos usados: {modulo.intentos}/3
                {modulo.mejor_nota !== null && modulo.mejor_nota > 0 && ` · Mejor nota: ${modulo.mejor_nota.toFixed(1)}%`}
              </p>
            )}
            <Link href={`/modulos/${modulo.id}/examen`}>
              <button className="w-full py-4 bg-[#C8102E] text-white font-bold rounded-2xl text-base active:scale-95 transition-transform">
                {modulo.intentos === 0 ? 'Rendir examen' : 'Volver a rendir'} →
              </button>
            </Link>
            <p className="text-xs text-center text-gray-400">Necesitás 80% o más para aprobar</p>
          </div>
        )}

        {/* Límite de intentos */}
        {puedeRendir && modulo.intentos >= 3 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="font-semibold text-red-800 text-sm mb-1">Límite de intentos alcanzado</p>
            <p className="text-sm text-red-600">
              Usaste los 3 intentos disponibles. Contactá a tu supervisor para coordinar una sesión de apoyo.
            </p>
          </div>
        )}

        {/* Repasar si aprobó */}
        {modulo.estado === 'aprobado' && (
          <Link href={`/modulos/${modulo.id}/examen`}>
            <button className="w-full py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl text-sm active:scale-95 transition-transform">
              Repasar examen
            </button>
          </Link>
        )}

      </div>
    </div>
  );
}
