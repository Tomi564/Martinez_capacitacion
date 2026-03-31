/**
 * encuesta/[vendedorId]/page.tsx — Encuesta pública para el cliente
 *
 * Esta página NO requiere login.
 * El cliente llega acá escaneando el QR del vendedor.
 *
 * Flujo:
 *  1. Carga datos básicos del vendedor (nombre, calificación promedio)
 *  2. Cliente selecciona estrellas (1-5)
 *  3. Cliente escribe comentario opcional
 *  4. Envía → pantalla de agradecimiento
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface VendedorPublico {
  nombre: string;
  apellido: string;
  promedio: number;
  totalCalificaciones: number;
}

type EstadoEncuesta = 'cargando' | 'respondiendo' | 'enviando' | 'gracias' | 'error';

export default function EncuestaPage() {
  const params = useParams();
  const codigo = params.vendedorId as string;

  const [estado, setEstado] = useState<EstadoEncuesta>('cargando');
  const [vendedor, setVendedor] = useState<VendedorPublico | null>(null);
  const [estrellas, setEstrellas] = useState<number>(0);
  const [estrellasHover, setEstrellasHover] = useState<number>(0);
  const [comentario, setComentario] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendedor = async () => {
      try {
        const res = await apiClient.get<VendedorPublico>(
          `/qr/encuesta/${codigo}`
        );
        setVendedor(res);
        setEstado('respondiendo');
      } catch {
        setEstado('error');
        setErrorMsg('El código QR no es válido o expiró.');
      }
    };

    fetchVendedor();
  }, [codigo]);

  const handleSubmit = async () => {
    if (estrellas === 0) return;

    setEstado('enviando');
    try {
      await apiClient.post(`/qr/calificar/${codigo}`, {
        estrellas,
        comentario: comentario.trim() || null,
      });
      setEstado('gracias');
    } catch {
      setEstado('respondiendo');
      setErrorMsg('Error al enviar la calificación. Intentá de nuevo.');
    }
  };

  const labelEstrellas: Record<number, string> = {
    1: 'Muy malo',
    2: 'Malo',
    3: 'Regular',
    4: 'Bueno',
    5: '¡Excelente!',
  };

  // ─── CARGANDO ──────────────────────────────────────
  if (estado === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando encuesta...</p>
        </div>
      </div>
    );
  }

  // ─── ERROR ─────────────────────────────────────────
  if (estado === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-sm w-full text-center">
          <p className="text-5xl mb-4">❌</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            QR inválido
          </h1>
          <p className="text-sm text-gray-500">{errorMsg}</p>
        </div>
      </div>
    );
  }

  // ─── GRACIAS ───────────────────────────────────────
  if (estado === 'gracias') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-sm w-full text-center flex flex-col gap-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ¡Muchas gracias!
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Tu opinión nos ayuda a mejorar el servicio.
            </p>
          </div>

          {/* Estrellas enviadas */}
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-3xl ${
                  star <= estrellas ? 'text-amber-400' : 'text-gray-200'
                }`}
              >
                ★
              </span>
            ))}
          </div>

          <p className="text-sm text-gray-400">
            Podés cerrar esta página
          </p>
        </div>
      </div>
    );
  }

  // ─── ENCUESTA ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-gray-900 text-white px-6 pt-12 pb-8">
        <div className="max-w-sm mx-auto">
          {/* Avatar del vendedor */}
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4 text-xl font-bold">
            {vendedor?.nombre.charAt(0)}{vendedor?.apellido.charAt(0)}
          </div>

          <p className="text-gray-400 text-sm mb-1">Calificá la atención de</p>
          <h1 className="text-2xl font-bold">
            {vendedor?.nombre} {vendedor?.apellido}
          </h1>

          {/* Calificación actual */}
          {vendedor && vendedor.totalCalificaciones > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-sm ${
                      star <= Math.round(vendedor.promedio)
                        ? 'text-amber-400'
                        : 'text-gray-600'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-400 text-xs">
                {vendedor.promedio.toFixed(1)} · {vendedor.totalCalificaciones}{' '}
                {vendedor.totalCalificaciones === 1
                  ? 'calificación'
                  : 'calificaciones'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Formulario */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-sm mx-auto flex flex-col gap-6">

          {/* Error */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{errorMsg}</p>
            </div>
          )}

          {/* Selección de estrellas */}
          <div>
            <p className="text-base font-semibold text-gray-900 mb-4 text-center">
              ¿Cómo fue tu experiencia?
            </p>

            <div className="flex justify-center gap-3 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setEstrellas(star)}
                  onMouseEnter={() => setEstrellasHover(star)}
                  onMouseLeave={() => setEstrellasHover(0)}
                  className="text-5xl transition-transform active:scale-110 hover:scale-110"
                >
                  <span className={
                    star <= (estrellasHover || estrellas)
                      ? 'text-amber-400'
                      : 'text-gray-200'
                  }>
                    ★
                  </span>
                </button>
              ))}
            </div>

            {/* Label de la selección */}
            <p className="text-center text-sm font-medium text-gray-600 h-5">
              {estrellasHover > 0
                ? labelEstrellas[estrellasHover]
                : estrellas > 0
                ? labelEstrellas[estrellas]
                : ''}
            </p>
          </div>

          {/* Comentario opcional */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Comentario{' '}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Contanos tu experiencia..."
              rows={3}
              maxLength={300}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">
              {comentario.length}/300
            </p>
          </div>

          {/* Botón enviar */}
          <button
            onClick={handleSubmit}
            disabled={estrellas === 0 || estado === 'enviando'}
            className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl disabled:opacity-40 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            {estado === 'enviando' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar calificación'
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            Tu opinión es anónima y ayuda a mejorar el servicio
          </p>

        </div>
      </div>

    </div>
  );
}