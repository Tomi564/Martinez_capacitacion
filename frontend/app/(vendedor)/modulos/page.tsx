/**
 * modulos/page.tsx — Lista de módulos del vendedor
 *
 * Muestra todos los módulos con su estado visual:
 *  - Bloqueado: grisado con candado
 *  - Disponible: activo con botón "Empezar"
 *  - En curso: activo con botón "Continuar"
 *  - Aprobado: tilde verde con nota
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import type { ModuloConProgreso } from '@/types';
import { ModuloCard } from '@/components/modulos/ModuloCard';

export default function ModulosPage() {
  const { user } = useAuth();
  const [modulos, setModulos] = useState<ModuloConProgreso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const res = await apiClient.get<{ modulos: ModuloConProgreso[] }>(
          '/modulos'
        );
        setModulos(res.modulos);
      } catch (err) {
        setError('Error al cargar los módulos');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModulos();
  }, []);

  // Calcular progreso general
  const aprobados = modulos.filter((m) => m.estado === 'aprobado').length;
  const total = modulos.length;
  const porcentaje = total > 0 ? Math.round((aprobados / total) * 100) : 0;

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
        <h1 className="text-2xl font-bold text-gray-900">Módulos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Completá cada módulo en orden para avanzar
        </p>
      </div>

      {/* Barra de progreso general */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Progreso general</p>
          <p className="text-sm font-bold text-gray-900">
            {aprobados}/{total}
          </p>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-500"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">{porcentaje}% completado</p>
      </div>

      {/* Leyenda de estados */}
      <div className="flex flex-wrap gap-3">
        {[
          { color: 'bg-green-500', label: 'Aprobado' },
          { color: 'bg-amber-500', label: 'En curso' },
          { color: 'bg-blue-500', label: 'Disponible' },
          { color: 'bg-gray-300', label: 'Bloqueado' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-xs text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Lista de módulos */}
      <div className="flex flex-col gap-3">
        {modulos.map((modulo) => (
          <ModuloCard key={modulo.id} modulo={modulo} />
        ))}
      </div>

      {/* Mensaje si no hay módulos */}
      {modulos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-gray-500">No hay módulos disponibles aún</p>
        </div>
      )}

    </div>
  );
}