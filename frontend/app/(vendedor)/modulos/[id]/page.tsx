/**
 * modulos/[id]/page.tsx — Detalle de un módulo
 *
 * Muestra:
 *  - Video del módulo
 *  - Descripción y material descargable (PDF)
 *  - Botón para ir al examen (solo si el módulo está disponible/en curso)
 *  - Nota actual si ya rindió el examen
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
        const res = await apiClient.get<{ modulo: ModuloConProgreso }>(
          `/modulos/${moduloId}`
        );
        setModulo(res.modulo);
      } catch (err) {
        setError('Error al cargar el módulo');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModulo();
  }, [moduloId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
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

  // Si el módulo está bloqueado, redirigir a la lista
  if (modulo.estado === 'bloqueado') {
    router.replace('/modulos');
    return null;
  }

  const puedeRendirExamen = modulo.estado === 'disponible' || modulo.estado === 'en_curso';

  return (
    <div className="flex flex-col max-w-lg mx-auto">

      {/* Header con botón volver */}
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
          <h1 className="text-base font-bold text-gray-900 truncate">
            {modulo.titulo}
          </h1>
        </div>

        {/* Badge de estado */}
        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
          modulo.estado === 'aprobado'
            ? 'bg-green-100 text-green-700'
            : modulo.estado === 'en_curso'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {modulo.estado === 'aprobado' ? '✓ Aprobado'
            : modulo.estado === 'en_curso' ? 'En curso'
            : 'Disponible'}
        </span>
      </div>

      {/* Video */}
      {modulo.video_url ? (
        <div className="w-full bg-black aspect-video">
          <video
            className="w-full h-full"
            controls
            preload="metadata"
            playsInline
            src={modulo.video_url}
          >
            Tu navegador no soporta la reproducción de video.
          </video>
        </div>
      ) : (
        <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-2">🎬</p>
            <p className="text-sm text-gray-500">Video próximamente</p>
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="px-4 py-6 flex flex-col gap-6">

        {/* Descripción */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Sobre este módulo
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {modulo.descripcion}
          </p>
        </div>

        {/* Info del módulo */}
        <div className="flex gap-4">
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
              <p className="text-xl font-bold text-green-600">
                {modulo.mejor_nota.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500 mt-0.5">mejor nota</p>
            </div>
          )}
        </div>

        {/* Material de estudio (contenido escrito) */}
        {modulo.contenido && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Material de estudio
            </h2>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 prose prose-sm max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-strong:text-gray-900
              prose-table:text-sm prose-table:w-full
              prose-th:bg-gray-100 prose-th:text-gray-800 prose-th:font-semibold prose-th:px-3 prose-th:py-2 prose-th:text-left
              prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-gray-100 prose-td:text-gray-700
              prose-ul:text-gray-700 prose-li:text-gray-700
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {modulo.contenido}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Material descargable */}
        {modulo.pdf_url && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">
              Material de estudio
            </h2>
            <Link href={modulo.pdf_url} target="_blank">
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 active:scale-95 transition-transform">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-xl">📄</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Material del módulo {modulo.orden}
                  </p>
                  <p className="text-xs text-gray-500">PDF · Toca para abrir</p>
                </div>
              </div>
            </Link>
          </div>
        )}
        {/* Resultado del examen si ya aprobó */}
        {modulo.estado === 'aprobado' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-800">Módulo aprobado</p>
                <p className="text-sm text-green-600">
                  Mejor nota: {modulo.mejor_nota?.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA: Ir al examen */}
        {puedeRendirExamen && modulo.intentos < 3 && (
          <div className="flex flex-col gap-3">
            {modulo.intentos > 0 && (
              <p className="text-xs text-center text-gray-500">
                Ya rendiste este examen {modulo.intentos}{' '}
                {modulo.intentos === 1 ? 'vez' : 'veces'}.
                {modulo.mejor_nota !== null && modulo.mejor_nota > 0 &&
                  ` Tu mejor nota fue ${modulo.mejor_nota.toFixed(1)}%.`
                }
              </p>
            )}
            <Link href={`/modulos/${modulo.id}/examen`}>
              <button className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl text-base active:scale-95 transition-transform">
                {modulo.intentos === 0 ? 'Rendir examen' : 'Volver a rendir'} →
              </button>
            </Link>
            <p className="text-xs text-center text-gray-400">
              Necesitás 80% o más para aprobar
            </p>
          </div>
        )}

        {/* Bloqueado por intentos */}
        {puedeRendirExamen && modulo.intentos >= 3 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <p className="font-semibold text-red-800 text-sm">Límite de intentos alcanzado</p>
            </div>
            <p className="text-sm text-red-600">
              Usaste los 3 intentos disponibles para este módulo.
              Contactá a tu supervisor para coordinar una sesión de apoyo presencial.
            </p>
          </div>
        )}

        {/* Repasar si ya aprobó */}
        {modulo.estado === 'aprobado' && (
          <Link href={`/modulos/${modulo.id}/examen`}>
            <button className="w-full py-3 border-2 border-gray-900 text-gray-900 font-semibold rounded-2xl text-sm active:scale-95 transition-transform">
              Repasar examen
            </button>
          </Link>
        )}

      </div>
    </div>
  );
}