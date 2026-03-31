/**
 * mi-qr/page.tsx — QR personal del vendedor
 *
 * Muestra:
 *  - Código QR único del vendedor
 *  - Instrucciones de uso
 *  - Calificaciones recibidas
 *  - Botón para descargar el QR
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import type { ResumenCalificaciones } from '@/types';

// Generamos el QR con la librería qrcode
import QRCode from 'qrcode';

interface QRData {
  codigo: string;
}

export default function MiQRPage() {
  const { user } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [codigo, setCodigo] = useState<string>('');
  const [calificaciones, setCalificaciones] =
    useState<ResumenCalificaciones | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        // Obtener código QR del backend
        const [qrRes, calRes] = await Promise.all([
          apiClient.get<QRData>('/qr/mio'),
          apiClient.get<ResumenCalificaciones>('/qr/mis-calificaciones'),
        ]);

        setCodigo(qrRes.codigo);
        setCalificaciones(calRes);

        // Generar imagen QR en el navegador
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const encuestaUrl = `${appUrl}/encuesta/${qrRes.codigo}`;

        const dataUrl = await QRCode.toDataURL(encuestaUrl, {
          width: 280,
          margin: 2,
          color: {
            dark: '#111827',
            light: '#ffffff',
          },
        });

        setQrDataUrl(dataUrl);
      } catch (err) {
        setError('Error al cargar tu código QR');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQR();
  }, []);

  const handleDescargar = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `qr-${user?.nombre}-${user?.apellido}.png`.toLowerCase();
    link.href = qrDataUrl;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 flex flex-col gap-6 max-w-lg mx-auto">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi código QR</h1>
        <p className="text-sm text-gray-500 mt-1">
          Mostralo al cliente después de cada atención
        </p>
      </div>

      {/* QR */}
      <div className="flex flex-col items-center gap-4">
        <div className="bg-white border-2 border-gray-200 rounded-3xl p-5 shadow-sm">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Mi código QR"
              className="w-56 h-56"
            />
          ) : (
            <div className="w-56 h-56 bg-gray-100 rounded-2xl flex items-center justify-center">
              <p className="text-sm text-gray-400">Sin QR</p>
            </div>
          )}
        </div>

        {/* Nombre del vendedor bajo el QR */}
        <div className="text-center">
          <p className="font-bold text-gray-900">
            {user?.nombre} {user?.apellido}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Código: {codigo}
          </p>
        </div>
      </div>

      {/* Instrucciones de uso */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-2">
          ¿Cómo usarlo?
        </p>
        <div className="flex flex-col gap-2">
          {[
            'Atendé al cliente y cerrá la venta',
            'Mostrá este QR con la pantalla del celular',
            'El cliente lo escanea con su cámara',
            'Califica tu atención de forma anónima',
          ].map((paso, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-blue-700">{paso}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Calificaciones recibidas */}
      {calificaciones && calificaciones.total > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Mis calificaciones
          </p>

          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">
                {calificaciones.promedio.toFixed(1)}
              </p>
              <div className="flex gap-0.5 mt-1 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-lg ${
                      star <= Math.round(calificaciones.promedio)
                        ? 'text-amber-400'
                        : 'text-gray-200'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {calificaciones.total}{' '}
                {calificaciones.total === 1
                  ? 'calificación'
                  : 'calificaciones'}
              </p>
            </div>

            {/* Distribución de estrellas */}
            <div className="flex-1 flex flex-col gap-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const cantidad = calificaciones.distribucion[star] || 0;
                const porcentaje =
                  calificaciones.total > 0
                    ? (cantidad / calificaciones.total) * 100
                    : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-3">{star}</span>
                    <span className="text-amber-400 text-xs">★</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-4 text-right">
                      {cantidad}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sin calificaciones aún */}
      {calificaciones && calificaciones.total === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-2xl mb-2">⭐</p>
          <p className="text-sm font-medium text-gray-700">
            Todavía no recibiste calificaciones
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Empezá a mostrar tu QR a los clientes
          </p>
        </div>
      )}

      {/* Botón descargar */}
      <button
        onClick={handleDescargar}
        disabled={!qrDataUrl}
        className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl disabled:opacity-40 active:scale-95 transition-transform flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Descargar QR
      </button>

    </div>
  );
}