'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

export default function CertificadoPage() {
  const { nombreCompleto } = useAuth();
  const router = useRouter();
  const [fechaCompleta, setFechaCompleta] = useState('');
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    // Verificar que realmente completó todos los módulos
    const verificar = async () => {
      try {
        const res = await apiClient.get<{ modulos: { estado: string }[] }>('/modulos');
        const todos = res.modulos ?? [];
        const completo = todos.length > 0 && todos.every(m => m.estado === 'aprobado');
        if (!completo) {
          router.replace('/modulos');
          return;
        }
        setVerificado(true);
      } catch {
        router.replace('/modulos');
      }
    };
    verificar();

    const ahora = new Date();
    setFechaCompleta(ahora.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }));
  }, []);

  if (!verificado) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-10">

      {/* Tarjeta certificado */}
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">

        {/* Header oscuro con logo */}
        <div className="bg-[#1F1F1F] px-6 pt-8 pb-6 flex flex-col items-center gap-3">
          <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
            <circle cx="32" cy="32" r="28" fill="#C8102E"/>
            <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="2" strokeDasharray="6 4"/>
            <circle cx="32" cy="32" r="11" fill="white"/>
            <circle cx="32" cy="32" r="4" fill="#C8102E"/>
            <path d="M32 4 L32 14 M32 50 L32 60 M4 32 L14 32 M50 32 L60 32" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <div className="text-center">
            <p className="text-white font-extrabold text-lg tracking-tight">Martínez Neumáticos</p>
            <p className="text-gray-400 text-xs mt-0.5">Certificado de Capacitación</p>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-7 flex flex-col items-center gap-5 text-center">

          {/* Medalla */}
          <div className="w-16 h-16 bg-amber-50 border-2 border-amber-200 rounded-full flex items-center justify-center text-3xl">
            🏆
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Se certifica que</p>
            <p className="text-2xl font-extrabold text-gray-900 leading-tight">{nombreCompleto()}</p>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            completó exitosamente el programa de capacitación comercial de{' '}
            <strong className="text-gray-900">Martínez Neumáticos</strong>,
            demostrando los conocimientos necesarios para brindar un servicio de excelencia.
          </p>

          {/* Separador decorativo */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-gray-100"/>
            <div className="w-2 h-2 rounded-full bg-[#C8102E]"/>
            <div className="flex-1 h-px bg-gray-100"/>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xs text-gray-400">Fecha de finalización</p>
            <p className="text-sm font-semibold text-gray-700">{fechaCompleta}</p>
          </div>

          {/* Firma / sello */}
          <div className="w-full pt-2 border-t border-gray-100 flex flex-col items-center gap-1">
            <div className="w-24 h-0.5 bg-gray-300 rounded-full"/>
            <p className="text-xs font-semibold text-gray-700">Martínez Neumáticos</p>
            <p className="text-xs text-gray-400">Dirección Comercial</p>
          </div>
        </div>
      </div>

      {/* Mensaje motivacional */}
      <div className="mt-6 max-w-sm text-center">
        <p className="text-sm text-gray-500">
          ¡Felicitaciones! El equipo de administración va a coordinar tu premio en los próximos días.
        </p>
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="mt-6 px-6 py-3 bg-[#C8102E] text-white font-bold rounded-xl text-sm active:scale-95 transition-transform"
      >
        Volver al inicio
      </button>

    </div>
  );
}
