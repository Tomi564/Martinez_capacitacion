/**
 * admin/vendedores/[id]/page.tsx — Detalle de un vendedor
 *
 * Muestra:
 *  - Datos del vendedor
 *  - Progreso detallado por módulo
 *  - Historial de intentos
 *  - Calificaciones QR recibidas
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface VendedorDetalle {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  activo: boolean;
  created_at: string;
  progreso: {
    modulo_id: string;
    modulo_titulo: string;
    modulo_orden: number;
    estado: string;
    mejor_nota: number;
    intentos: number;
    completado_at: string | null;
  }[];
  calificaciones: {
    promedio: number;
    promedioVendedor: number;
    promedioEmpresa: number;
    total: number;
    distribucion: Record<number, number>;
    ultimas5: {
      fecha: string;
      estrellasVendedor: number;
      estrellasEmpresa: number;
      comentario: string | null;
    }[];
  };
}

export default function VendedorDetallePage() {
  const params = useParams();
  const router = useRouter();
  const vendedorId = params.id as string;

  const [vendedor, setVendedor] = useState<VendedorDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [showResetProgresoModal, setShowResetProgresoModal] = useState(false);
  const [resetProgresoLoading, setResetProgresoLoading] = useState(false);
  const [resetProgresoMsg, setResetProgresoMsg] = useState<string | null>(null);

  // Objetivos del mes
  const [objetivo, setObjetivo] = useState<{ meta_ventas: number; meta_conversion: number } | null>(null);
  const [editandoObjetivo, setEditandoObjetivo] = useState(false);
  const [objForm, setObjForm] = useState({ meta_ventas: '', meta_conversion: '' });
  const [guardandoObj, setGuardandoObj] = useState(false);

  useEffect(() => {
    const fetchVendedor = async () => {
      try {
        const [vendRes, objRes] = await Promise.all([
          apiClient.get<{ vendedor: VendedorDetalle }>(`/admin/vendedores/${vendedorId}`),
          apiClient.get<{ objetivo: { meta_ventas: number; meta_conversion: number } | null }>(
            `/admin/vendedores/${vendedorId}/objetivo`
          ),
        ]);
        setVendedor(vendRes.vendedor);
        if (objRes.objetivo) {
          setObjetivo(objRes.objetivo);
          setObjForm({
            meta_ventas: String(objRes.objetivo.meta_ventas || ''),
            meta_conversion: String(objRes.objetivo.meta_conversion || ''),
          });
        }
      } catch (err) {
        setError('Error al cargar el vendedor');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendedor();
  }, [vendedorId]);

  const handleToggleActivo = async () => {
    if (!vendedor) return;
    try {
      await apiClient.patch(`/admin/vendedores/${vendedorId}`, {
        activo: !vendedor.activo,
      });
      setVendedor({ ...vendedor, activo: !vendedor.activo });
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async () => {
    if (nuevaContrasena.length < 6) return;
    setResetLoading(true);
    setResetMsg(null);
    try {
      await apiClient.patch(`/admin/vendedores/${vendedorId}/reset-password`, {
        nuevaContrasena,
      });
      setResetMsg('Contraseña actualizada correctamente');
      setNuevaContrasena('');
      setTimeout(() => {
        setShowResetModal(false);
        setResetMsg(null);
      }, 1500);
    } catch (err) {
      setResetMsg(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    } finally {
      setResetLoading(false);
    }
  };

  const handleGuardarObjetivo = async () => {
    setGuardandoObj(true);
    try {
      const ahora = new Date();
      await apiClient.post(`/admin/vendedores/${vendedorId}/objetivo`, {
        mes: ahora.getMonth() + 1,
        anio: ahora.getFullYear(),
        meta_ventas: objForm.meta_ventas ? Number(objForm.meta_ventas) : 0,
        meta_conversion: objForm.meta_conversion ? Number(objForm.meta_conversion) : 0,
      });
      setObjetivo({
        meta_ventas: objForm.meta_ventas ? Number(objForm.meta_ventas) : 0,
        meta_conversion: objForm.meta_conversion ? Number(objForm.meta_conversion) : 0,
      });
      setEditandoObjetivo(false);
    } catch { /* silencioso */ }
    finally { setGuardandoObj(false); }
  };

  const handleResetProgreso = async () => {
    setResetProgresoLoading(true);
    setResetProgresoMsg(null);
    try {
      await apiClient.post(`/admin/vendedores/${vendedorId}/reset-progreso`, {});
      setResetProgresoMsg('Progreso reiniciado correctamente');
      setTimeout(() => {
        setShowResetProgresoModal(false);
        setResetProgresoMsg(null);
        // Recargar datos para reflejar el nuevo progreso
        window.location.reload();
      }, 1500);
    } catch (err) {
      setResetProgresoMsg(err instanceof Error ? err.message : 'Error al reiniciar el progreso');
    } finally {
      setResetProgresoLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !vendedor) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error || 'Vendedor no encontrado'}</p>
        </div>
      </div>
    );
  }

  const aprobados = vendedor.progreso.filter(
    (p) => p.estado === 'aprobado'
  ).length;
  const total = vendedor.progreso.length;
  const porcentaje = total > 0 ? Math.round((aprobados / total) * 100) : 0;

  return (
    <>
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-4xl mx-auto overflow-x-hidden">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {vendedor.nombre} {vendedor.apellido}
        </h1>
      </div>

      {/* Tarjeta de perfil */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 bg-[#C8102E] text-white rounded-2xl flex items-center justify-center text-lg font-bold shrink-0">
              {vendedor.nombre.charAt(0)}{vendedor.apellido.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-lg truncate">
                {vendedor.nombre} {vendedor.apellido}
              </p>
              <p className="text-sm text-gray-500 truncate">{vendedor.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Registrado el{' '}
                {new Date(vendedor.created_at).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={handleToggleActivo}
              className={`text-sm px-4 py-2 rounded-xl border font-medium transition-colors ${
                vendedor.activo
                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                  : 'border-green-200 text-green-600 hover:bg-green-50'
              }`}
            >
              {vendedor.activo ? 'Desactivar' : 'Activar'}
            </button>
            <button
              onClick={() => setShowResetModal(true)}
              className="text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
            >
              Cambiar contraseña
            </button>
            <button
              onClick={() => setShowResetProgresoModal(true)}
              className="text-sm px-4 py-2 rounded-xl border border-orange-200 text-orange-600 hover:bg-orange-50 font-medium transition-colors"
            >
              Reiniciar progreso
            </button>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{porcentaje}%</p>
            <p className="text-xs text-gray-500 mt-0.5">Completado</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {aprobados}/{total}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Módulos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {vendedor.calificaciones.promedio > 0
                ? vendedor.calificaciones.promedio.toFixed(1)
                : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Calificación</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>
      </div>

      {/* Progreso por módulo */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Progreso por módulo
        </p>
        <div className="flex flex-col gap-2">
          {vendedor.progreso
            .sort((a, b) => a.modulo_orden - b.modulo_orden)
            .map((p) => (
              <div
                key={p.modulo_id}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3"
              >
                {/* Indicador de estado */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${p.estado === 'aprobado'
                    ? 'bg-green-100 text-green-600'
                    : p.estado === 'en_curso'
                    ? 'bg-amber-100 text-amber-600'
                    : p.estado === 'disponible'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-400'
                  }
                `}>
                  {p.estado === 'aprobado' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : p.estado === 'bloqueado' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{p.modulo_orden}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {p.modulo_titulo}
                  </p>
                  <div className="flex gap-3 mt-0.5">
                    {p.intentos > 0 && (
                      <span className="text-xs text-gray-400">
                        {p.intentos} {p.intentos === 1 ? 'intento' : 'intentos'}
                      </span>
                    )}
                    {p.completado_at && (
                      <span className="text-xs text-gray-400">
                        Aprobado el{' '}
                        {new Date(p.completado_at).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nota */}
                {p.mejor_nota > 0 && (
                  <span className={`text-sm font-bold flex-shrink-0 ${
                    p.estado === 'aprobado' ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {p.mejor_nota.toFixed(1)}%
                  </span>
                )}

                {/* Badge estado */}
                <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                  p.estado === 'aprobado'
                    ? 'bg-green-100 text-green-700'
                    : p.estado === 'en_curso'
                    ? 'bg-amber-100 text-amber-700'
                    : p.estado === 'disponible'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {p.estado === 'aprobado' ? 'Aprobado'
                    : p.estado === 'en_curso' ? 'En curso'
                    : p.estado === 'disponible' ? 'Disponible'
                    : 'Bloqueado'}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Calificaciones QR */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Calificaciones recibidas
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          {vendedor.calificaciones.total === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Sin calificaciones aún
            </p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">
                  {vendedor.calificaciones.promedio.toFixed(1)}
                </p>
                <div className="flex gap-0.5 mt-1 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${
                        star <= Math.round(vendedor.calificaciones.promedio)
                          ? 'text-amber-400'
                          : 'text-gray-200'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {vendedor.calificaciones.total} calificaciones
                </p>
              </div>

              <div className="flex-1 flex flex-col gap-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const cantidad =
                    vendedor.calificaciones.distribucion[star] || 0;
                  const pct =
                    vendedor.calificaciones.total > 0
                      ? (cantidad / vendedor.calificaciones.total) * 100
                      : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-3">{star}</span>
                      <span className="text-amber-400 text-xs">★</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-4 text-right">
                        {cantidad}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desglose de valoraciones QR */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Desglose de valoraciones (QR)
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {vendedor.calificaciones.promedioVendedor > 0
                  ? vendedor.calificaciones.promedioVendedor.toFixed(1)
                  : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Promedio como vendedor</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {vendedor.calificaciones.promedioEmpresa > 0
                  ? vendedor.calificaciones.promedioEmpresa.toFixed(1)
                  : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Promedio a la empresa</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {vendedor.calificaciones.total}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Valoraciones totales</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">Últimas 5 valoraciones</p>
            {vendedor.calificaciones.ultimas5?.length ? (
              <div className="flex flex-col gap-2">
                {vendedor.calificaciones.ultimas5.map((item, idx) => (
                  <div
                    key={`${item.fecha}-${idx}`}
                    className="rounded-xl border border-gray-200 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-500">
                        {new Date(item.fecha).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs font-medium text-gray-700">
                        Vendedor: {item.estrellasVendedor}★ · Empresa: {item.estrellasEmpresa}★
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {item.comentario?.trim() || 'Sin comentario'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin valoraciones registradas aún</p>
            )}
          </div>
        </div>
      </div>

      {/* Objetivo del mes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Objetivo del mes
          </p>
          <button
            onClick={() => setEditandoObjetivo(v => !v)}
            className="text-xs text-gray-500 hover:text-gray-900 font-medium"
          >
            {editandoObjetivo ? 'Cancelar' : objetivo ? 'Editar' : '+ Asignar'}
          </button>
        </div>

        {editandoObjetivo ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Meta ventas</label>
                <input
                  type="number"
                  min="0"
                  value={objForm.meta_ventas}
                  onChange={e => setObjForm(f => ({ ...f, meta_ventas: e.target.value }))}
                  placeholder="Ej: 20"
                  className="h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Meta conversión %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={objForm.meta_conversion}
                  onChange={e => setObjForm(f => ({ ...f, meta_conversion: e.target.value }))}
                  placeholder="Ej: 60"
                  className="h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>
            </div>
            <button
              onClick={handleGuardarObjetivo}
              disabled={guardandoObj}
              className="w-full h-10 bg-[#C8102E] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {guardandoObj ? 'Guardando...' : 'Guardar objetivo'}
            </button>
          </div>
        ) : objetivo ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{objetivo.meta_ventas}</p>
              <p className="text-xs text-gray-500 mt-0.5">Ventas meta</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{objetivo.meta_conversion}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Conversión meta</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-400">Sin objetivo asignado para este mes</p>
          </div>
        )}
      </div>

    </div>

    {/* Modal reiniciar progreso */}
    {showResetProgresoModal && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Reiniciar progreso</h2>
            <button
              onClick={() => { setShowResetProgresoModal(false); setResetProgresoMsg(null); }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-500">
            Esto borrará todo el progreso de{' '}
            <strong>{vendedor.nombre} {vendedor.apellido}</strong> y lo dejará
            desde el módulo 1. Esta acción no se puede deshacer.
          </p>

          {resetProgresoMsg && (
            <div className={`p-3 rounded-xl text-sm ${
              resetProgresoMsg.includes('correctamente')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {resetProgresoMsg}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setShowResetProgresoModal(false); setResetProgresoMsg(null); }}
              className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleResetProgreso}
              disabled={resetProgresoLoading}
              className="flex-1 py-3 bg-orange-600 text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {resetProgresoLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal cambiar contraseña */}
    {showResetModal && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Cambiar contraseña</h2>
            <button
              onClick={() => { setShowResetModal(false); setNuevaContrasena(''); setResetMsg(null); }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-500">
            Nueva contraseña para <strong>{vendedor.nombre} {vendedor.apellido}</strong>
          </p>

          {resetMsg && (
            <div className={`p-3 rounded-xl text-sm ${
              resetMsg.includes('correctamente')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {resetMsg}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Nueva contraseña</label>
            <input
              type="password"
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setShowResetModal(false); setNuevaContrasena(''); setResetMsg(null); }}
              className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleResetPassword}
              disabled={resetLoading || nuevaContrasena.length < 6}
              className="flex-1 py-3 bg-[#C8102E] text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {resetLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}