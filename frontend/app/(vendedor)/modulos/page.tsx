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
import { apiClient } from '@/lib/api';
import type { ModuloConProgreso } from '@/types';
import { ModuloCard } from '@/components/modulos/ModuloCard';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';

export default function ModulosPage() {
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
      <div className="px-4 py-6 flex flex-col gap-4 max-w-lg mx-auto">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="flex items-center justify-between gap-3">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="danger" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
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
      <Card className="rounded-xl">
        <CardContent>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Progreso general</p>
          <p className="text-sm font-bold text-gray-900">
            {aprobados}/{total}
          </p>
        </div>
        <Progress value={porcentaje} className="h-2.5" indicatorClassName="bg-[#C8102E]" />
        <p className="text-xs text-gray-400 mt-2">{porcentaje}% completado</p>
        </CardContent>
      </Card>

      {/* Leyenda de estados */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">Completado</Badge>
        <Badge variant="warning">En progreso</Badge>
        <Badge variant="danger">Bloqueado</Badge>
      </div>

      {/* Lista de módulos */}
      <div className="flex flex-col gap-3">
        {modulos.map((modulo) => (
          <ModuloCard key={modulo.id} modulo={modulo} />
        ))}
      </div>

      {/* Mensaje si no hay módulos */}
      {modulos.length === 0 && (
        <Card className="rounded-xl">
          <CardContent className="text-center py-10">
            <BookOpen className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No hay módulos disponibles todavía.</p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}