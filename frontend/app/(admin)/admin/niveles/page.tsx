/**
 * admin/niveles/page.tsx — Panel de niveles y premios
 *
 * Muestra el nivel actual de cada vendedor,
 * su progreso hacia el siguiente nivel
 * y los premios que desbloqueó.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface VendedorNivel {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  nivel: string;
  label: string;
  color: string;
  progresoPorcentaje: number;
  modulosAprobados: number;
  totalModulos: number;
  siguienteNivel: string | null;
  requisiteSiguiente: string | null;
}

const PREMIOS: Record<string, {
  premio: string;
  icono: string;
  descripcion: string;
}> = {
  sin_inicio: {
    premio: '—',
    icono: '○',
    descripcion: 'Completá los primeros módulos para desbloquear premios',
  },
  aprendiz: {
    premio: 'Reconocimiento interno',
    icono: '🎖️',
    descripcion: 'Tu nombre en el tablero de logros del equipo',
  },
  vendedor: {
    premio: 'Beneficio económico',
    icono: '💰',
    descripcion: 'Bono de rendimiento por completar la primera mitad del programa',
  },
  profesional: {
    premio: 'Celular de trabajo + bono',
    icono: '📱',
    descripcion: 'Celular de trabajo propio y bono de rendimiento especial',
  },
  elite: {
    premio: 'Bono élite + reconocimiento público',
    icono: '🏆',
    descripcion: 'Bono especial y reconocimiento como vendedor de élite de Martínez',
  },
};

const COLORES_NIVEL: Record<string, {
  bg: string; text: string; border: string; badge: string;
}> = {
  sin_inicio: { bg: 'bg-gray-50',    text: 'text-gray-600',   border: 'border-gray-200',   badge: 'bg-gray-100 text-gray-600' },
  aprendiz:   { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700' },
  vendedor:   { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700' },
  profesional:{ bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700' },
  elite:      { bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
};

export default function NivelesPage() {
  const [vendedores, setVendedores] = useState<VendedorNivel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');

  useEffect(() => {
    const fetchNiveles = async () => {
      try {
        const res = await apiClient.get<{ vendedores: VendedorNivel[] }>(
          '/admin/niveles'
        );
        setVendedores(res.vendedores);
      } catch (err) {
        setError('Error al cargar los niveles');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNiveles();
  }, []);

  const vendedoresFiltrados = filtroNivel === 'todos'
    ? vendedores
    : vendedores.filter(v => v.nivel === filtroNivel);

  // Contar por nivel
  const conteoNiveles = vendedores.reduce((acc, v) => {
    acc[v.nivel] = (acc[v.nivel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-4xl mx-auto">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Niveles y premios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Progreso del equipo en el programa "Jugando en Primera Liga"
        </p>
      </div>

      {/* Resumen por nivel */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { nivel: 'elite',       label: 'Élite',        icono: '🏆' },
          { nivel: 'profesional', label: 'Profesional',  icono: '📱' },
          { nivel: 'vendedor',    label: 'Vendedor',     icono: '💰' },
          { nivel: 'aprendiz',    label: 'Aprendiz',     icono: '🎖️' },
          { nivel: 'sin_inicio',  label: 'Sin inicio',   icono: '○' },
        ].map((item) => {
          const colores = COLORES_NIVEL[item.nivel];
          const cantidad = conteoNiveles[item.nivel] || 0;
          return (
            <button
              key={item.nivel}
              onClick={() => setFiltroNivel(
                filtroNivel === item.nivel ? 'todos' : item.nivel
              )}
              className={`
                rounded-2xl border-2 p-3 text-center transition-all
                ${filtroNivel === item.nivel
                  ? `${colores.bg} ${colores.border} shadow-sm`
                  : 'bg-white border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <p className="text-xl mb-1">{item.icono}</p>
              <p className={`text-2xl font-black ${
                filtroNivel === item.nivel ? colores.text : 'text-gray-900'
              }`}>
                {cantidad}
              </p>
              <p className={`text-xs font-medium ${
                filtroNivel === item.nivel ? colores.text : 'text-gray-500'
              }`}>
                {item.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Lista de vendedores */}
      <div className="flex flex-col gap-3">
        {vendedoresFiltrados.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-sm">
              No hay vendedores en este nivel
            </p>
          </div>
        )}

        {vendedoresFiltrados.map((vendedor) => {
          const colores = COLORES_NIVEL[vendedor.nivel] || COLORES_NIVEL.sin_inicio;
          const premio = PREMIOS[vendedor.nivel] || PREMIOS.sin_inicio;

          return (
            <Link key={vendedor.id} href={`/admin/vendedores/${vendedor.id}`}>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 active:scale-95 transition-transform hover:border-gray-300">

                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                    {vendedor.nombre.charAt(0)}{vendedor.apellido.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">
                      {vendedor.nombre} {vendedor.apellido}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{vendedor.email}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${colores.badge}`}>
                    {vendedor.label}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">
                      {vendedor.modulosAprobados}/{vendedor.totalModulos} módulos
                    </span>
                    <span className="font-semibold text-gray-700">
                      {vendedor.progresoPorcentaje}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        vendedor.nivel === 'elite'       ? 'bg-purple-500' :
                        vendedor.nivel === 'profesional' ? 'bg-green-500'  :
                        vendedor.nivel === 'vendedor'    ? 'bg-amber-500'  :
                        vendedor.nivel === 'aprendiz'    ? 'bg-blue-500'   :
                        'bg-gray-300'
                      }`}
                      style={{ width: `${vendedor.progresoPorcentaje}%` }}
                    />
                  </div>
                </div>

                {/* Premio desbloqueado */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${colores.bg}`}>
                  <span className="text-base shrink-0">{premio.icono}</span>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold ${colores.text}`}>
                      Premio: {premio.premio}
                    </p>
                    <p className={`text-xs ${colores.text} opacity-75 truncate`}>
                      {premio.descripcion}
                    </p>
                  </div>
                </div>

                {/* Siguiente nivel */}
                {vendedor.siguienteNivel && (
                  <p className="text-xs text-gray-400">
                    Siguiente: <strong className="text-gray-600">{vendedor.siguienteNivel}</strong>
                    {' — '}{vendedor.requisiteSiguiente}
                  </p>
                )}

              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
