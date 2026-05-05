'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import type { OpcionPregunta, PreguntaDiariaAdmin, CategoriaPreguntaDiaria } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const OPCIONES_VACIAS: OpcionPregunta[] = [
  { id: 'a', texto: '' },
  { id: 'b', texto: '' },
  { id: 'c', texto: '' },
  { id: 'd', texto: '' },
];

export default function EditarPreguntaDiariaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enunciado, setEnunciado] = useState('');
  const [categoria, setCategoria] = useState<CategoriaPreguntaDiaria>('ventas');
  const [opciones, setOpciones] = useState<OpcionPregunta[]>(OPCIONES_VACIAS.map((o) => ({ ...o })));
  const [respuesta_correcta, setRespuesta_correcta] = useState('');
  const [explicacion, setExplicacion] = useState('');
  const [activo, setActivo] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<{ pregunta: PreguntaDiariaAdmin }>(`/admin/preguntas-diarias/${id}`);
        const p = res.pregunta;
        setEnunciado(p.enunciado);
        setCategoria(p.categoria);
        const letters = ['a', 'b', 'c', 'd'];
        const incoming = Array.isArray(p.opciones) ? p.opciones : [];
        const nextOpts = letters.map((letter, i) => {
          const found = incoming[i];
          return found ? { id: found.id, texto: found.texto } : { id: letter, texto: '' };
        });
        setOpciones(nextOpts);
        setRespuesta_correcta(p.respuesta_correcta);
        setExplicacion(p.explicacion || '');
        setActivo(p.activo);
      } catch {
        setErr('No se pudo cargar la pregunta.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const guardar = async () => {
    setErr(null);
    const opc = opciones.filter((o) => o.texto.trim());
    if (!enunciado.trim()) {
      setErr('El enunciado es obligatorio.');
      return;
    }
    if (opc.length < 2) {
      setErr('Completá al menos 2 opciones.');
      return;
    }
    if (!respuesta_correcta.trim()) {
      setErr('Marcá cuál es la opción correcta.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.patch(`/admin/preguntas-diarias/${id}`, {
        enunciado: enunciado.trim(),
        categoria,
        opciones: opc,
        respuesta_correcta: respuesta_correcta.trim(),
        explicacion: explicacion.trim() || null,
        activo,
      });
      router.push('/admin/preguntas-diarias');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-2xl mx-auto flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-2xl mx-auto flex flex-col gap-5 pb-24">
      <Link href="/admin/preguntas-diarias" className="text-sm font-semibold text-[#C8102E] w-fit">
        ← Volver al listado
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">Editar pregunta</h1>

      {err && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-800">{err}</CardContent>
        </Card>
      )}

      <Card className="rounded-xl">
        <CardContent className="p-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaPreguntaDiaria)}
              className="mt-1 w-full h-12 rounded-xl border border-gray-200 px-3 text-base"
            >
              <option value="ventas">Ventas</option>
              <option value="producto">Producto</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Enunciado</label>
            <textarea
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-base"
            />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold text-gray-500 uppercase">Opciones</p>
            {opciones.slice(0, 4).map((op, idx) => (
              <div key={`${op.id}-${idx}`} className="flex gap-2 items-center">
                <span className="w-8 text-center font-bold text-gray-500">{op.id.toUpperCase()}</span>
                <input
                  value={op.texto}
                  onChange={(e) => {
                    const next = [...opciones];
                    next[idx] = { ...next[idx], texto: e.target.value };
                    setOpciones(next);
                  }}
                  className="flex-1 h-11 rounded-xl border border-gray-200 px-3 text-sm"
                />
                <label className="flex items-center gap-1 shrink-0 text-xs text-gray-600 whitespace-nowrap">
                  <input
                    type="radio"
                    name="correcta"
                    checked={respuesta_correcta === op.id}
                    onChange={() => setRespuesta_correcta(op.id)}
                  />
                  OK
                </label>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Explicación</label>
            <textarea
              value={explicacion}
              onChange={(e) => setExplicacion(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            Activa
          </label>
        </CardContent>
      </Card>

      <Button className="h-12 rounded-xl font-bold" disabled={saving} onClick={guardar}>
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </div>
  );
}
