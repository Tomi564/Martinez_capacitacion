'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { PreguntaDiariaAdmin } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const CAT: Record<string, string> = { ventas: 'Ventas', producto: 'Producto' };

export default function AdminPreguntasDiariasPage() {
  const [preguntas, setPreguntas] = useState<PreguntaDiariaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const cargar = async () => {
    setError(null);
    try {
      const res = await apiClient.get<{ preguntas: PreguntaDiariaAdmin[] }>('/admin/preguntas-diarias');
      setPreguntas(res.preguntas || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const toggleActivo = async (p: PreguntaDiariaAdmin) => {
    setTogglingId(p.id);
    try {
      await apiClient.patch(`/admin/preguntas-diarias/${p.id}`, { activo: !p.activo });
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-5 max-w-4xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preguntas diarias</h1>
          <p className="text-sm text-gray-500 mt-1">
            Refuerzo para vendedores que completaron la capacitación (1 ventas + 1 producto por día).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/preguntas-diarias/respuestas">
            <Button variant="outline" className="rounded-xl">
              Ver respuestas
            </Button>
          </Link>
          <Link href="/admin/preguntas-diarias/nueva">
            <Button className="rounded-xl">Nueva pregunta</Button>
          </Link>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-800">{error}</CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {preguntas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500 text-sm">
              No hay preguntas cargadas. Creá al menos una de cada categoría (ventas y producto).
            </CardContent>
          </Card>
        ) : (
          preguntas.map((p) => (
            <Card key={p.id} className="rounded-xl border border-gray-200">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="muted">{CAT[p.categoria] || p.categoria}</Badge>
                    <Badge variant={p.activo ? 'success' : 'danger'}>{p.activo ? 'Activa' : 'Inactiva'}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="rounded-lg text-xs h-9 px-3"
                      disabled={togglingId === p.id}
                      onClick={() => toggleActivo(p)}
                    >
                      {p.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Link href={`/admin/preguntas-diarias/${p.id}`}>
                      <Button className="rounded-lg text-xs h-9 px-3">
                        Editar
                      </Button>
                    </Link>
                  </div>
                </div>
                <p className="text-sm text-gray-900 font-medium leading-snug line-clamp-4">{p.enunciado}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
