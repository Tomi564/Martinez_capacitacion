'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { ModuloConProgreso } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, CircleAlert, Download, FileText, PlayCircle, Video } from 'lucide-react';

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
      <div className="px-4 py-6 flex flex-col gap-4 max-w-lg mx-auto">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
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
          aria-label="Volver"
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">Módulo {modulo.orden}</p>
          <h1 className="text-base font-bold text-gray-900 truncate">{modulo.titulo}</h1>
        </div>
        <Badge variant={modulo.estado === 'aprobado' ? 'success' : modulo.estado === 'en_curso' ? 'warning' : 'warning'}>
          {modulo.estado === 'aprobado' ? 'Completado' : modulo.estado === 'en_curso' ? 'En progreso' : 'Disponible'}
        </Badge>
      </div>

      <div className="px-4 py-6 flex flex-col gap-5">

        {/* Descripción */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">{modulo.titulo}</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{modulo.descripcion}</p>
        </div>

        {/* Nota de aprobación */}
        {(modulo as any).nota_aprobacion && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <CircleAlert className="w-4 h-4 text-amber-600 mt-0.5" />
            <p className="text-sm text-amber-800 font-medium">{(modulo as any).nota_aprobacion}</p>
          </div>
        )}

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
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 active:scale-[0.99] transition-transform">
                <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#C8102E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Descargar material PDF</p>
                  <p className="text-xs text-gray-500">Módulo {modulo.orden} — {modulo.titulo}</p>
                </div>
                <Download className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-60">
              <div className="w-11 h-11 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">Material PDF</p>
                <p className="text-xs text-gray-400">Próximamente disponible</p>
              </div>
            </div>
          )}

          {modulo.video_url ? (
            <Link href={modulo.video_url} target="_blank">
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 active:scale-[0.99] transition-transform">
                <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <PlayCircle className="w-5 h-5 text-gray-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Ver video</p>
                  <p className="text-xs text-gray-500">Módulo {modulo.orden} — {modulo.titulo}</p>
                </div>
                <Video className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-60">
              <div className="w-11 h-11 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 text-gray-400" />
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
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-white" />
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
              <Button className="w-full py-4 text-base">
                {modulo.intentos === 0 ? 'Rendir examen' : 'Volver a rendir'} →
              </Button>
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
            <Button variant="outline" className="w-full py-3 text-sm">
              Repasar examen
            </Button>
          </Link>
        )}

      </div>
    </div>
  );
}
