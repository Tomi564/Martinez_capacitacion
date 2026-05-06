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
  presion_psi: number | null;
  updated_by_admin_at: string | null;
  tren_delantero?: 'x2' | 'x4' | 'no' | null;
  tren_alineado?: boolean | null;
  tren_balanceo?: boolean | null;
  amortiguadores_revisados?: boolean | null;
  auxilio_revisado?: boolean | null;
  presupuesto?: string | null;
  fotos_neumatico_urls?: string[] | null;
  vehiculos: { patente: string; marca: string; modelo: string; clientes: { nombre: string; apellido: string } | null } | null;
}

const PSI_PER_BAR = 14.5037738;
function psiToBar(psi: number) {
  return psi / PSI_PER_BAR;
}
function barToPsi(bar: number) {
  return bar * PSI_PER_BAR;
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
    presion_psi: '',
    estado_visita: 'abierta',
    tren_delantero: '' as '' | 'x2' | 'x4' | 'no',
    tren_alineado: false,
    tren_balanceo: false,
    amortiguadores_revisados: null as boolean | null,
    auxilio_revisado: null as boolean | null,
    presupuesto: '',
  });

  useEffect(() => {
    apiClient
      .get<{ visita: VisitaDetalle }>(`/admin/visitas/${id}`)
      .then((r) => {
        setVisita(r.visita);
        setForm({
          observaciones: r.visita.observaciones || '',
          presion_psi:
            r.visita.presion_psi != null
              ? String(Number(psiToBar(r.visita.presion_psi).toFixed(1)))
              : '',
          estado_visita: (r.visita.estado_visita || 'abierta') as 'abierta' | 'cerrada',
          tren_delantero: r.visita.tren_delantero || '',
          tren_alineado: !!r.visita.tren_alineado,
          tren_balanceo: !!r.visita.tren_balanceo,
          amortiguadores_revisados:
            r.visita.amortiguadores_revisados == null ? null : !!r.visita.amortiguadores_revisados,
          auxilio_revisado:
            r.visita.auxilio_revisado == null ? null : !!r.visita.auxilio_revisado,
          presupuesto: r.visita.presupuesto || '',
        });
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const guardar = async () => {
    setIsSaving(true);
    setMsg('');
    try {
      const presionRaw = form.presion_psi.replace(',', '.').trim();
      const presionBar = presionRaw ? Number(presionRaw) : null;
      const presionPsi =
        presionBar != null && Number.isFinite(presionBar)
          ? Number(barToPsi(presionBar).toFixed(1))
          : null;

      await apiClient.patch(`/admin/visitas/${id}`, {
        observaciones: form.observaciones || null,
        presion_psi: presionPsi,
        estado_visita: form.estado_visita,
        tren_delantero: form.tren_delantero || null,
        tren_alineado: form.tren_alineado,
        tren_balanceo: form.tren_balanceo,
        amortiguadores_revisados: form.amortiguadores_revisados,
        auxilio_revisado: form.auxilio_revisado,
        presupuesto: form.presupuesto.trim() || null,
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
          <input
            type="number"
            min={1.5}
            max={3.5}
            step={0.1}
            placeholder="Presión BAR"
            value={form.presion_psi}
            onChange={(e) => setForm(f => ({ ...f, presion_psi: e.target.value }))}
            className="h-10 px-3 border border-gray-300 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/35 focus:border-[#C8102E]"
          />
          <select value={form.estado_visita} onChange={(e) => setForm(f => ({ ...f, estado_visita: e.target.value as 'abierta' | 'cerrada' }))} className="h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/35 focus:border-[#C8102E]">
            <option value="abierta">Abierta</option>
            <option value="cerrada">Cerrada</option>
          </select>
        </div>

        <div className="mt-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tren delantero</p>
          <div className="grid grid-cols-3 gap-2">
            {(['x2', 'x4', 'no'] as const).map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => setForm((f) => ({ ...f, tren_delantero: op }))}
                className={`py-3 rounded-xl font-bold text-sm border-2 ${
                  form.tren_delantero === op ? 'bg-[#C8102E] border-[#C8102E] text-white' : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                {op === 'no' ? 'No' : op.toUpperCase()}
              </button>
            ))}
          </div>
          {(form.tren_delantero === 'x2' || form.tren_delantero === 'x4') && (
            <div className="mt-3 flex gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <input type="checkbox" checked={form.tren_alineado} onChange={(e) => setForm((f) => ({ ...f, tren_alineado: e.target.checked }))} className="w-5 h-5 rounded" />
                Alineado
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <input type="checkbox" checked={form.tren_balanceo} onChange={(e) => setForm((f) => ({ ...f, tren_balanceo: e.target.checked }))} className="w-5 h-5 rounded" />
                Balanceo
              </label>
            </div>
          )}
        </div>

        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amortiguadores</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm((f) => ({ ...f, amortiguadores_revisados: true }))} className={`h-10 rounded-xl font-bold text-sm ${form.amortiguadores_revisados === true ? 'bg-green-600 text-white' : 'bg-white border-2 border-gray-200'}`}>Sí</button>
              <button type="button" onClick={() => setForm((f) => ({ ...f, amortiguadores_revisados: false }))} className={`h-10 rounded-xl font-bold text-sm ${form.amortiguadores_revisados === false ? 'bg-gray-800 text-white' : 'bg-white border-2 border-gray-200'}`}>No</button>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Auxilio</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm((f) => ({ ...f, auxilio_revisado: true }))} className={`h-10 rounded-xl font-bold text-sm ${form.auxilio_revisado === true ? 'bg-green-600 text-white' : 'bg-white border-2 border-gray-200'}`}>Sí</button>
              <button type="button" onClick={() => setForm((f) => ({ ...f, auxilio_revisado: false }))} className={`h-10 rounded-xl font-bold text-sm ${form.auxilio_revisado === false ? 'bg-gray-800 text-white' : 'bg-white border-2 border-gray-200'}`}>No</button>
            </div>
          </div>
        </div>

        <label className="text-sm text-gray-600 mt-1">Presupuesto</label>
        <textarea
          rows={3}
          value={form.presupuesto}
          onChange={(e) => setForm(f => ({ ...f, presupuesto: e.target.value }))}
          className="w-full border border-gray-300 bg-white shadow-sm rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/35 focus:border-[#C8102E]"
          placeholder="Texto libre…"
        />

        {Array.isArray(visita.fotos_neumatico_urls) && visita.fotos_neumatico_urls.length > 0 && (
          <div className="mt-1">
            <p className="text-sm text-gray-600 mb-2">Fotos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {visita.fotos_neumatico_urls.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        <button onClick={guardar} disabled={isSaving} className="h-11 bg-[#C8102E] text-white rounded-xl text-sm font-semibold disabled:opacity-50">
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
      </div>
    </div>
  );
}
