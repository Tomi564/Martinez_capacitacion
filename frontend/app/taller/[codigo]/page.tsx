/**
 * taller/[codigo]/page.tsx — Calificación pública del taller
 *
 * El cliente escanea el QR del gomero o mecánico.
 * Sin login, sin datos personales, sin sorteo.
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient, ApiError } from '@/lib/api';
import Image from 'next/image';

interface EmpleadoPublico {
  nombre: string;
  apellido: string;
  rol: 'gomero' | 'mecanico';
  rolLabel: string;
  promedio: number;
  totalCalificaciones: number;
}

type Estado = 'cargando' | 'respondiendo' | 'enviando' | 'gracias' | 'error';

export default function CalificacionTallerPage() {
  const params = useParams();
  const codigo = params.codigo as string;

  const [estado, setEstado] = useState<Estado>('cargando');
  const [empleado, setEmpleado] = useState<EmpleadoPublico | null>(null);
  const [estrellas, setEstrellas] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmpleado = async () => {
      try {
        const res = await apiClient.get<EmpleadoPublico>(`/taller/encuesta/${codigo}`);
        setEmpleado(res);
        setEstado('respondiendo');
      } catch {
        setEstado('error');
        setErrorMsg('El código QR no es válido o expiró.');
      }
    };

    void fetchEmpleado();
  }, [codigo]);

  const handleSubmit = async () => {
    if (estrellas === 0) return;

    setEstado('enviando');
    setErrorMsg(null);
    try {
      await apiClient.post('/taller/calificaciones', {
        codigo,
        estrellas,
        comentario: comentario.trim() || null,
      });
      setEstado('gracias');
    } catch (err) {
      setEstado('respondiendo');
      setErrorMsg(
        err instanceof ApiError ? err.message : 'Error al enviar la calificación. Intentá de nuevo.',
      );
    }
  };

  const labelEstrellas: Record<number, string> = {
    1: 'Muy malo',
    2: 'Malo',
    3: 'Regular',
    4: 'Bueno',
    5: '¡Excelente!',
  };

  const nombreCompleto = empleado ? `${empleado.nombre} ${empleado.apellido}`.trim() : '';

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando…</p>
        </div>
      </div>
    );
  }

  if (estado === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-sm w-full text-center">
          <Image src="/icons/martinez-logo.svg" alt="Martínez Neumáticos" width={72} height={72} className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">QR inválido</h1>
          <p className="text-sm text-gray-500">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (estado === 'gracias') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-sm w-full text-center flex flex-col gap-4">
          <Image src="/icons/martinez-logo.svg" alt="Martínez Neumáticos" width={80} height={80} className="mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Gracias por tu calificación</h1>
          <p className="text-sm text-gray-400">Podés cerrar esta página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#111111] text-white px-6 pt-10 pb-6 border-b-4 border-[#C8102E]">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/icons/martinez-logo.svg" alt="Martínez Neumáticos" width={44} height={44} />
            <div>
              <p className="text-xs text-gray-300 uppercase tracking-wide">Taller Martínez</p>
              <p className="text-sm font-bold">Martínez Neumáticos</p>
            </div>
          </div>

          <p className="text-gray-300 text-sm mb-1">Te atendió</p>
          <h1 className="text-2xl font-bold text-white">{nombreCompleto}</h1>
          {empleado?.rolLabel && (
            <p className="text-sm text-gray-400 mt-1">{empleado.rolLabel}</p>
          )}

          {empleado && empleado.totalCalificaciones > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-sm ${
                      star <= Math.round(empleado.promedio) ? 'text-amber-400' : 'text-gray-600'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-400 text-xs">
                {empleado.promedio.toFixed(1)} · {empleado.totalCalificaciones}{' '}
                {empleado.totalCalificaciones === 1 ? 'calificación' : 'calificaciones'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 py-8 bg-[#FAFAFA]">
        <div className="max-w-sm mx-auto flex flex-col gap-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{errorMsg}</p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Calificá el trabajo de {empleado?.nombre || 'nuestro equipo'}
            </p>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setEstrellas(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="text-5xl leading-none active:scale-110 transition-transform"
                  aria-label={`Valorar ${star} estrellas`}
                >
                  <span className={star <= (hover || estrellas) ? 'text-[#F5C400]' : 'text-gray-200'}>
                    ★
                  </span>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-500 h-4">
              {(hover || estrellas) ? labelEstrellas[hover || estrellas] : ''}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Comentario <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Contanos tu experiencia en el taller…"
              rows={3}
              maxLength={300}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8102E] resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{comentario.length}/300</p>
          </div>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={estrellas === 0 || estado === 'enviando'}
            className="w-full py-4 bg-[#C8102E] text-white font-bold rounded-2xl disabled:opacity-40 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            {estado === 'enviando' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando…
              </>
            ) : (
              'Enviar calificación'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
