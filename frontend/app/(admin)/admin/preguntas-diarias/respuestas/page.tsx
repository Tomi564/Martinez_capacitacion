'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { RespuestaDiariaAdminRow } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface VendedorOpt {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

export default function RespuestasPreguntasDiariasPage() {
  const [filas, setFilas] = useState<RespuestaDiariaAdminRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendedores, setVendedores] = useState<VendedorOpt[]>([]);

  const [vendedorId, setVendedorId] = useState('');
  const [fecha, setFecha] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 40;

  const cargarVendedores = async () => {
    try {
      const res = await apiClient.get<{ vendedores: VendedorOpt[] }>('/admin/vendedores');
      const solo = (res.vendedores || []).filter((v) => v.rol === 'vendedor');
      setVendedores(solo);
    } catch {
      /* opcional */
    }
  };

  const cargar = async (nextOffset = 0) => {
    setError(null);
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('limit', String(limit));
      q.set('offset', String(nextOffset));
      if (vendedorId) q.set('vendedor_id', vendedorId);
      if (fecha) q.set('fecha', fecha);
      if (fechaDesde) q.set('fecha_desde', fechaDesde);
      if (fechaHasta) q.set('fecha_hasta', fechaHasta);

      const res = await apiClient.get<{
        respuestas: RespuestaDiariaAdminRow[];
        total: number;
        offset: number;
      }>(`/admin/preguntas-diarias/respuestas?${q.toString()}`);

      setFilas(res.respuestas || []);
      setTotal(res.total || 0);
      setOffset(nextOffset);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar respuestas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVendedores();
    cargar(0);
  }, []);

  const aplicar = () => cargar(0);

  const fmtDt = (iso: string) =>
    new Date(iso).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const userNombre = (row: RespuestaDiariaAdminRow) => {
    const u = row.users;
    if (!u || Array.isArray(u)) return '—';
    return `${u.nombre} ${u.apellido}`.trim();
  };

  const preguntaTxt = (row: RespuestaDiariaAdminRow) => {
    const p = row.preguntas_diarias;
    if (!p || Array.isArray(p)) return '—';
    return p.enunciado;
  };

  const categoriaTxt = (row: RespuestaDiariaAdminRow) => {
    const p = row.preguntas_diarias;
    if (!p || Array.isArray(p)) return '';
    return p.categoria;
  };

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-5 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link href="/admin/preguntas-diarias" className="text-sm font-semibold text-[#C8102E]">
            ← Preguntas diarias
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Respuestas</h1>
          <p className="text-sm text-gray-500 mt-1">Quién respondió qué y cuándo (fecha operativa Argentina).</p>
        </div>
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Vendedor</label>
              <select
                value={vendedorId}
                onChange={(e) => setVendedorId(e.target.value)}
                className="h-11 rounded-xl border border-gray-200 px-3 text-sm"
              >
                <option value="">Todos</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre} {v.apellido}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Fecha exacta</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="h-11 rounded-xl border border-gray-200 px-3 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="h-11 rounded-xl border border-gray-200 px-3 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="h-11 rounded-xl border border-gray-200 px-3 text-sm"
              />
            </div>
          </div>
          <Button variant="outline" className="w-full sm:w-auto rounded-xl" onClick={aplicar}>
            Aplicar filtros
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-800">{error}</CardContent>
        </Card>
      )}

      <p className="text-xs text-gray-500">
        Total: {total} · Mostrando {filas.length} (offset {offset})
      </p>

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : filas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500 text-sm">Sin resultados.</CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filas.map((row) => (
            <Card key={row.id} className="rounded-xl border border-gray-100">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{userNombre(row)}</p>
                    <p className="text-xs text-gray-500">{row.users && !Array.isArray(row.users) ? row.users.email : ''}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant="muted">{row.fecha}</Badge>
                    <Badge variant={row.es_correcta ? 'success' : 'danger'}>
                      {row.es_correcta ? 'Correcta' : 'Incorrecta'}
                    </Badge>
                    {categoriaTxt(row) && <Badge variant="default">{categoriaTxt(row)}</Badge>}
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-snug">{preguntaTxt(row)}</p>
                <p className="text-xs text-gray-500">
                  Opción elegida: <span className="font-mono font-semibold">{row.opcion_elegida}</span> ·{' '}
                  {fmtDt(row.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && offset + filas.length < total && (
        <Button variant="outline" className="rounded-xl" onClick={() => cargar(offset + limit)}>
          Cargar más
        </Button>
      )}
    </div>
  );
}
