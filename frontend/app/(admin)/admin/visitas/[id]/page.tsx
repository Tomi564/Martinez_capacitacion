'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface VisitaDetalle {
  id: string;
  created_at: string;
  estado_visita: 'abierta' | 'cerrada' | null;
  motivo: string | null;
  observaciones: string | null;
  estado_neumaticos: 'buen_estado' | 'desgaste_medio' | 'reemplazo_urgente' | null;
  estado_frenos: 'buen_estado' | 'desgaste_medio' | 'reemplazo_urgente' | null;
  presion_psi: number | null;
  recomendacion: string | null;
  updated_by_admin_at: string | null;
  vehiculos: { patente: string; marca: string; modelo: string; clientes: { nombre: string; apellido: string } | null } | null;
}

export default function AdminVisitaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [visita, setVisita] = useState<VisitaDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    observaciones: '',
    estado_neumaticos: '',
    estado_frenos: '',
    presion_psi: '',
    recomendacion: '',
    estado_visita: 'abierta',
  });

  useEffect(() => {
    apiClient
      .get<{ visita: VisitaDetalle }>(`/admin/visitas/${id}`)
      .then((r) => {
        setVisita(r.visita);
        setForm({
          observaciones: r.visita.observaciones || '',
          estado_neumaticos: r.visita.estado_neumaticos || '',
          estado_frenos: r.visita.estado_frenos || '',
          presion_psi: r.visita.presion_psi != null ? String(r.visita.presion_psi) : '',
          recomendacion: r.visita.recomendacion || '',
          estado_visita: (r.visita.estado_visita || 'abierta') as 'abierta' | 'cerrada',
        });
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const guardar = async () => {
    setIsSaving(true);
    setMsg('');
    try {
      await apiClient.patch(`/admin/visitas/${id}`, {
        observaciones: form.observaciones || null,
        estado_neumaticos: form.estado_neumaticos || null,
        estado_frenos: form.estado_frenos || null,
        presion_psi: form.presion_psi ? Number(form.presion_psi) : null,
        recomendacion: form.recomendacion || null,
        estado_visita: form.estado_visita,
      });
      setMsg('Guardado. Editado por admin.');
      setVisita((v) => v ? { ...v, updated_by_admin_at: new Date().toISOString() } : v);
    } catch {
      setMsg('Error al guardar cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-6 text-sm text-gray-500">Cargando visita...</div>;
  if (!visita) return <div className="p-6 text-sm text-gray-500">Visita no encontrada.</div>;

  return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto flex flex-col gap-4">
      <button onClick={() => router.back()} className="text-sm text-gray-500">← Volver</button>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="font-semibold text-gray-900">
          {visita.vehiculos?.patente} · {visita.vehiculos?.marca} {visita.vehiculos?.modelo}
        </p>
        <p className="text-xs text-gray-500">
          Cliente: {visita.vehiculos?.clientes ? `${visita.vehiculos.clientes.nombre} ${visita.vehiculos.clientes.apellido}` : 'Sin cliente'}
        </p>
        <p className="text-xs text-gray-500">
          Creada: {new Date(visita.created_at).toLocaleString('es-AR')}
        </p>
        {visita.updated_by_admin_at && (
          <p className="text-xs text-gray-500 mt-1">
            Editado por admin el {new Date(visita.updated_by_admin_at).toLocaleString('es-AR')}
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
        <label className="text-sm text-gray-600">Observaciones</label>
        <textarea
          rows={3}
          value={form.observaciones}
          onChange={(e) => setForm(f => ({ ...f, observaciones: e.target.value }))}
          className="w-full border border-gray-300 bg-white shadow-sm rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/35 focus:border-[#C8102E]"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select value={form.estado_neumaticos} onChange={(e) => setForm(f => ({ ...f, estado_neumaticos: e.target.value }))} className="h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/35 focus:border-[#C8102E]">
            <option value="">Estado neumáticos</option>
            <option value="buen_estado">Buen estado</option>
            <option value="desgaste_medio">Desgaste medio</option>
            <option value="reemplazo_urgente">Reemplazo urgente</option>
          </select>
          <select value={form.estado_frenos} onChange={(e) => setForm(f => ({ ...f, estado_frenos: e.target.value }))} className="h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/35 focus:border-[#C8102E]">
            <option value="">Estado frenos</option>
            <option value="buen_estado">Buen estado</option>
            <option value="desgaste_medio">Desgaste medio</option>
            <option value="reemplazo_urgente">Reemplazo urgente</option>
          </select>
          <input type="number" placeholder="Presión PSI" value={form.presion_psi} onChange={(e) => setForm(f => ({ ...f, presion_psi: e.target.value }))} className="h-10 px-3 border border-gray-300 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/35 focus:border-[#C8102E]" />
          <select value={form.estado_visita} onChange={(e) => setForm(f => ({ ...f, estado_visita: e.target.value as 'abierta' | 'cerrada' }))} className="h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/35 focus:border-[#C8102E]">
            <option value="abierta">Abierta</option>
            <option value="cerrada">Cerrada</option>
          </select>
        </div>

        <label className="text-sm text-gray-600">Recomendación</label>
        <textarea
          rows={3}
          value={form.recomendacion}
          onChange={(e) => setForm(f => ({ ...f, recomendacion: e.target.value }))}
          className="w-full border border-gray-300 bg-white shadow-sm rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/35 focus:border-[#C8102E]"
        />

        <button onClick={guardar} disabled={isSaving} className="h-11 bg-[#C8102E] text-white rounded-xl text-sm font-semibold disabled:opacity-50">
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
      </div>
    </div>
  );
}
