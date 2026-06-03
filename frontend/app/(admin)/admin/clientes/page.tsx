'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError } from '@/lib/api';
import { PageState } from '@/components/ui/PageState';
import { BadgeRangoEtario } from '@/components/clientes/BadgeRangoEtario';
import { TabVentasClientes } from '@/components/clientes/TabVentasClientes';
import { BadgeOrdenEstado } from '@/components/taller/BadgeOrdenEstado';
import { ConfirmarEliminacionModal } from '@/components/admin/ConfirmarEliminacionModal';
import { SelectorSucursal } from '@/components/admin/SelectorSucursal';
import { appendSucursalQuery } from '@/lib/sucursales';

interface Visita {
  id: string; estado: string; orden_estado?: string | null; motivo: string | null; observaciones: string | null;
  km: number | null; diagnostico_enviado: boolean; created_at: string;
}
interface Vehiculo {
  id: string; patente: string; marca: string; modelo: string; anio: number | null;
  medida_rueda: string | null;
  clientes: { id: string; nombre: string; apellido: string; dni: string | null; telefono: string | null; email: string | null } | null;
  visitas_taller: Visita[];
}
interface Participante {
  id: string; nombre: string; apellido: string; dni: string; contacto: string; created_at: string;
  vendedor: { nombre: string; apellido: string } | null;
}

const ESTADO_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  en_espera:   { label: 'En espera',   color: 'text-amber-700',  bg: 'bg-amber-100' },
  en_revision: { label: 'En revisión', color: 'text-blue-700',   bg: 'bg-blue-100' },
  listo:       { label: 'Listo',       color: 'text-green-700',  bg: 'bg-green-100' },
  entregado:   { label: 'Entregado',   color: 'text-gray-600',   bg: 'bg-gray-100' },
};

export default function ClientesAdminPage() {
  const router = useRouter();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [tab, setTab] = useState<'taller' | 'qr' | 'ventas'>('taller');
  const [filtroSucursal, setFiltroSucursal] = useState('');
  const [hasError, setHasError] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [advertenciaModal, setAdvertenciaModal] = useState<string | null>(null);

  type ModalEliminar =
    | { tipo: 'vehiculo'; vehiculo: Vehiculo }
    | { tipo: 'visita'; visita: Visita; patente: string; clienteNombre?: string }
    | { tipo: 'cliente'; cliente: NonNullable<Vehiculo['clientes']> }
    | { tipo: 'participante'; participante: Participante };
  const [modalEliminar, setModalEliminar] = useState<ModalEliminar | null>(null);

  const cargarClientes = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [vRes, pRes] = await Promise.all([
      apiClient.get<{ vehiculos: Vehiculo[] }>(
        appendSucursalQuery('/mecanico/clientes?include_empty=true', filtroSucursal),
      ),
      apiClient.get<{ participantes: Participante[] }>('/qr/participantes'),
      ]);
      setVehiculos(vRes.vehiculos);
      setParticipantes(pRes.participantes);
    } catch (error) {
      console.error('[ClientesAdminPage] Error cargando clientes/participantes', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [filtroSucursal]);

  useEffect(() => {
    void cargarClientes();
  }, [cargarClientes]);

  const abrirEliminarVehiculo = async (v: Vehiculo) => {
    setAdvertenciaModal(null);
    setModalEliminar({ tipo: 'vehiculo', vehiculo: v });
    const n = v.visitas_taller?.length || 0;
    if (n > 0) {
      setAdvertenciaModal(
        `Este vehículo tiene ${n} ${n === 1 ? 'visita asociada' : 'visitas asociadas'} que también se eliminarán.`
      );
      return;
    }
    try {
      const res = await apiClient.get<{ visitas: number }>(`/admin/vehiculos/${v.id}/dependencias`);
      if (res.visitas > 0) {
        setAdvertenciaModal(
          `Este vehículo tiene ${res.visitas} ${res.visitas === 1 ? 'visita asociada' : 'visitas asociadas'} que también se eliminarán.`
        );
      }
    } catch {
      /* sin advertencia extra */
    }
  };

  const abrirEliminarCliente = async (c: NonNullable<Vehiculo['clientes']>) => {
    setAdvertenciaModal(null);
    setModalEliminar({ tipo: 'cliente', cliente: c });
    try {
      const res = await apiClient.get<{ vehiculos: number; atenciones: number; visitas: number }>(
        `/admin/clientes/${c.id}/dependencias`
      );
      const partes: string[] = [];
      if (res.vehiculos > 0) partes.push(`${res.vehiculos} vehículo${res.vehiculos === 1 ? '' : 's'}`);
      if (res.atenciones > 0) partes.push(`${res.atenciones} atención${res.atenciones === 1 ? '' : 'es'}`);
      if (res.visitas > 0) partes.push(`${res.visitas} visita${res.visitas === 1 ? '' : 's'} en taller`);
      if (partes.length > 0) {
        setAdvertenciaModal(
          `Este cliente tiene datos asociados: ${partes.join(', ')}. Al eliminarlo, los vehículos quedarán sin titular y las atenciones sin vínculo al cliente.`
        );
      }
    } catch {
      /* sin advertencia extra */
    }
  };

  const abrirEliminarParticipante = async (p: Participante) => {
    setAdvertenciaModal(null);
    setModalEliminar({ tipo: 'participante', participante: p });
    try {
      const res = await apiClient.get<{ vehiculos: number; atenciones: number }>(
        `/admin/participantes/${p.id}/dependencias`
      );
      const partes: string[] = [];
      if (res.vehiculos > 0) partes.push(`${res.vehiculos} vehículo${res.vehiculos === 1 ? '' : 's'} con el mismo DNI`);
      if (res.atenciones > 0) partes.push(`${res.atenciones} atención${res.atenciones === 1 ? '' : 'es'}`);
      if (partes.length > 0) {
        setAdvertenciaModal(`Este participante tiene datos vinculados por DNI: ${partes.join(' y ')}.`);
      }
    } catch {
      /* sin advertencia extra */
    }
  };

  const confirmarEliminar = async () => {
    if (!modalEliminar) return;
    setEliminando(true);
    setMsg(null);
    try {
      if (modalEliminar.tipo === 'vehiculo') {
        await apiClient.delete(`/admin/vehiculos/${modalEliminar.vehiculo.id}`);
        setMsg({ tipo: 'ok', texto: 'Vehículo eliminado' });
      } else if (modalEliminar.tipo === 'visita') {
        await apiClient.delete(`/admin/visitas/${modalEliminar.visita.id}`);
        setMsg({ tipo: 'ok', texto: 'Visita eliminada' });
      } else if (modalEliminar.tipo === 'cliente') {
        await apiClient.delete(`/admin/clientes/${modalEliminar.cliente.id}`);
        setMsg({ tipo: 'ok', texto: 'Cliente eliminado' });
      } else {
        await apiClient.delete(`/admin/participantes/${modalEliminar.participante.id}`);
        setMsg({ tipo: 'ok', texto: 'Participante eliminado' });
      }
      setModalEliminar(null);
      setAdvertenciaModal(null);
      await cargarClientes();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      const texto =
        err instanceof ApiError ? err.message : 'No se pudo completar la eliminación';
      setMsg({ tipo: 'error', texto });
    } finally {
      setEliminando(false);
    }
  };

  const tituloModal = () => {
    if (!modalEliminar) return '';
    switch (modalEliminar.tipo) {
      case 'vehiculo':
        return '¿Eliminar este vehículo?';
      case 'visita':
        return '¿Eliminar esta orden de taller?';
      case 'cliente':
        return '¿Eliminar este cliente?';
      case 'participante':
        return '¿Eliminar este participante?';
    }
  };

  const descripcionModal = () => {
    if (!modalEliminar) return null;
    switch (modalEliminar.tipo) {
      case 'vehiculo': {
        const v = modalEliminar.vehiculo;
        return (
          <>
            Se borrará el vehículo{' '}
            <span className="font-semibold text-gray-900">{v.patente}</span> ({v.marca} {v.modelo}).
          </>
        );
      }
      case 'visita': {
        const { visita, patente, clienteNombre } = modalEliminar;
        return (
          <>
            Se borrará la orden del vehículo{' '}
            <span className="font-semibold text-gray-900">{patente}</span>
            {clienteNombre ? (
              <>
                {' '}
                (cliente: <span className="font-semibold text-gray-900">{clienteNombre}</span>)
              </>
            ) : null}{' '}
            del {new Date(visita.created_at).toLocaleDateString('es-AR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            .
          </>
        );
      }
      case 'cliente': {
        const c = modalEliminar.cliente;
        return (
          <>
            Se borrará a{' '}
            <span className="font-semibold text-gray-900">
              {c.nombre} {c.apellido}
            </span>
            {c.dni ? ` (DNI ${c.dni})` : ''}.
          </>
        );
      }
      case 'participante': {
        const p = modalEliminar.participante;
        return (
          <>
            Se borrará a{' '}
            <span className="font-semibold text-gray-900">
              {p.nombre} {p.apellido}
            </span>{' '}
            (DNI {p.dni}) del registro QR.
          </>
        );
      }
    }
  };

  const abrirEliminarVisita = async (visita: Visita, vehiculo: Vehiculo) => {
    setAdvertenciaModal(null);
    const c = vehiculo.clientes;
    setModalEliminar({
      tipo: 'visita',
      visita,
      patente: vehiculo.patente,
      clienteNombre: c ? `${c.nombre} ${c.apellido}`.trim() : undefined,
    });
    try {
      const res = await apiClient.get<{ tiene_diagnostico_cargado?: boolean }>(
        `/admin/visitas/${visita.id}`,
      );
      if (res.tiene_diagnostico_cargado) {
        setAdvertenciaModal('Esta orden tiene diagnóstico cargado que también se eliminará.');
      }
    } catch {
      /* sin advertencia extra */
    }
  };

  const vehiculosConVisitas = vehiculos.filter(v => (v.visitas_taller?.length || 0) > 0);

  const filtradosVehiculos = vehiculosConVisitas.filter(v => {
    const q = busqueda.toLowerCase();
    const c = v.clientes;
    return v.patente.toLowerCase().includes(q) || v.marca.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) || (c?.nombre || '').toLowerCase().includes(q) ||
      (c?.apellido || '').toLowerCase().includes(q) || (c?.telefono || '').includes(q) || (c?.dni || '').includes(q);
  });

  const filtradosParticipantes = participantes.filter(p => {
    const q = busqueda.toLowerCase();
    return p.nombre.toLowerCase().includes(q) || p.apellido.toLowerCase().includes(q) ||
      p.dni.includes(q) || p.contacto.toLowerCase().includes(q);
  });

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-5 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clientes y visitas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Historial por vehículo, checklist y base del taller y del QR
          </p>
        </div>
        <SelectorSucursal
          modo="filtro"
          value={filtroSucursal}
          onChange={setFiltroSucursal}
          className="sm:w-56 shrink-0"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{vehiculosConVisitas.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">vehículos con visitas</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{participantes.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">del QR</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{vehiculos.reduce((a, v) => a + v.visitas_taller.length, 0)}</p>
          <p className="text-xs text-gray-500 mt-0.5">visitas totales</p>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl text-sm ${
            msg.tipo === 'ok'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}
        >
          {msg.texto}
        </div>
      )}

      {/* Buscador */}
      <input
        type="text" value={busqueda} onChange={e => { setBusqueda(e.target.value); setExpandido(null); }}
        placeholder="Buscar por nombre, patente, DNI, contacto..."
        className="h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
      />

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        <button onClick={() => setTab('taller')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === 'taller' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          Taller ({filtradosVehiculos.length})
        </button>
        <button onClick={() => setTab('qr')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === 'qr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          QR ({filtradosParticipantes.length})
        </button>
        <button onClick={() => setTab('ventas')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === 'ventas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          Ventas
        </button>
      </div>

      <PageState state={isLoading && tab !== 'ventas' ? 'loading' : hasError && tab !== 'ventas' ? 'error' : 'content'} onRetry={cargarClientes}>
      {/* ── Tab Taller ── */}
      {tab === 'taller' && (
        <PageState
          state={filtradosVehiculos.length === 0 ? 'empty' : 'content'}
          emptyMessage={busqueda ? 'Sin resultados para esa búsqueda.' : 'Aún no hay visitas registradas.'}
        >
          <div className="flex flex-col gap-3">
            {filtradosVehiculos.map(v => {
              const abierto = expandido === v.id;
              const c = v.clientes;
              const visitasOrdenadas = [...v.visitas_taller].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              return (
                <div key={v.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="w-full p-4 flex items-start justify-between gap-3">
                  <button type="button" onClick={() => setExpandido(abierto ? null : v.id)} className="flex-1 min-w-0 text-left">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 tracking-wider text-lg">{v.patente}</p>
                      <p className="text-sm text-gray-600">{v.marca} {v.modelo}{v.anio && ` · ${v.anio}`}</p>
                      {c ? (
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <p className="text-xs text-gray-500">
                            {c.nombre} {c.apellido}
                            {c.telefono && ` · ${c.telefono}`}
                          </p>
                          <BadgeRangoEtario dni={c.dni} />
                        </div>
                      ) : (
                        <p className="text-xs text-gray-300 mt-0.5">Sin cliente asociado</p>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">{v.visitas_taller.length} {v.visitas_taller.length === 1 ? 'visita' : 'visitas'}</span>
                    </div>
                  </button>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 mt-1 transition-transform ${abierto ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                    <button
                      type="button"
                      onClick={() => void abrirEliminarVehiculo(v)}
                      className="text-xs px-2.5 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                    >
                      Eliminar vehículo
                    </button>
                  </div>
                  </div>
                  {abierto && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-3 flex flex-col gap-3">
                      {c && (
                        <div className="bg-blue-50 rounded-xl p-3 flex flex-col gap-0.5">
                          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Cliente</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-gray-800 text-sm">{c.nombre} {c.apellido}</p>
                            <BadgeRangoEtario dni={c.dni} />
                          </div>
                          {c.dni && <p className="text-xs text-gray-500">DNI: {c.dni}</p>}
                          {c.telefono && <p className="text-xs text-gray-500">{c.telefono}</p>}
                          {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                          <button
                            type="button"
                            onClick={() => void abrirEliminarCliente(c)}
                            className="mt-2 text-xs px-2.5 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium self-start"
                          >
                            Eliminar cliente
                          </button>
                        </div>
                      )}
                      {v.medida_rueda && <p className="text-xs text-gray-400">Rueda: {v.medida_rueda}</p>}
                      {visitasOrdenadas.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Historial de visitas</p>
                          {visitasOrdenadas.map(visita => {
                            const est = ESTADO_LABEL[visita.estado];
                            return (
                              <div key={visita.id} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-gray-500">{new Date(visita.created_at).toLocaleDateString('es-AR')}</span>
                                  {visita.orden_estado ? (
                                    <BadgeOrdenEstado ordenEstado={visita.orden_estado} />
                                  ) : (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${est?.bg || 'bg-gray-100'} ${est?.color || 'text-gray-600'}`}>{est?.label || visita.estado}</span>
                                  )}
                                </div>
                                {visita.motivo && <p className="text-xs text-gray-600">Motivo: {visita.motivo}</p>}
                                {visita.km && <p className="text-xs text-gray-400">{visita.km.toLocaleString()} km</p>}
                                {visita.observaciones && <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-1.5">{visita.observaciones}</p>}
                                <div className="flex items-center justify-between gap-2 mt-0.5 flex-wrap">
                                  {visita.diagnostico_enviado && (
                                    <span className="text-xs text-blue-600 font-medium">✓ Diagnóstico enviado</span>
                                  )}
                                  <div className="flex items-center gap-2 ml-auto">
                                    <button
                                      type="button"
                                      onClick={() => void abrirEliminarVisita(visita, v)}
                                      className="text-xs px-2 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                                    >
                                      Eliminar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => router.push(`/admin/clientes/visita/${visita.id}`)}
                                      className="text-xs text-[#C8102E] font-bold"
                                    >
                                      Ver checklist →
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </PageState>
      )}

      {/* ── Tab QR ── */}
      {tab === 'qr' && (
        <PageState
          state={filtradosParticipantes.length === 0 ? 'empty' : 'content'}
          emptyMessage={busqueda ? 'Sin resultados para esa búsqueda.' : 'Sin participantes registrados.'}
        >
          <div className="flex flex-col gap-2">
            {filtradosParticipantes.map(p => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-2 overflow-hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 break-words">{p.nombre} {p.apellido}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-gray-500">DNI: {p.dni}</p>
                      <BadgeRangoEtario dni={p.dni} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-600 break-all">{p.contacto}</p>
                    {p.vendedor && (
                      <p className="text-xs text-gray-400 mt-0.5 break-words">
                        vía {p.vendedor.nombre} {p.vendedor.apellido}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void abrirEliminarParticipante(p)}
                    className="text-xs px-2.5 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium shrink-0 self-end sm:self-center"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </PageState>
      )}

      {tab === 'ventas' && (
        <TabVentasClientes
          busqueda={busqueda}
          showVendedor
          clientesApiBase="/admin/clientes"
          onMensaje={(m) => setMsg(m)}
        />
      )}
      </PageState>

      <ConfirmarEliminacionModal
        open={!!modalEliminar}
        titulo={tituloModal()}
        descripcion={descripcionModal()}
        advertencia={advertenciaModal}
        eliminando={eliminando}
        onCancelar={() => {
          setModalEliminar(null);
          setAdvertenciaModal(null);
        }}
        onConfirmar={confirmarEliminar}
        idTitulo="eliminar-clientes-titulo"
      />
    </div>
  );
}
