/**
 * atenciones/page.tsx — Registro de atenciones del vendedor
 *
 * El vendedor registra cada consulta con:
 *  - Canal de contacto
 *  - Resultado (venta / no venta / pendiente)
 *  - Producto y monto opcional
 *  - Historial con estadísticas de conversión
 */

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface Atencion {
  id: string;
  canal: string;
  resultado: string;
  producto: string | null;
  monto: number | null;
  observaciones: string | null;
  created_at: string;
}

interface StatsAtenciones {
  total: number;
  ventas: number;
  noVentas: number;
  pendientes: number;
  tasaConversion: number;
  montoTotal: number;
}

interface AtencionesData {
  atenciones: Atencion[];
  stats: StatsAtenciones;
}

interface ProductoSugerencia {
  id: string;
  nombre: string;
  marca: string;
  precio: number | null;
  stock: number;
}

const CANALES = [
  { id: 'whatsapp',     label: 'WhatsApp',      icono: '💬' },
  { id: 'mercadolibre', label: 'Mercado Libre',  icono: '🛒' },
  { id: 'instagram',    label: 'Instagram',      icono: '📸' },
  { id: 'presencial',   label: 'Presencial',     icono: '🏪' },
  { id: 'otro',         label: 'Otro',           icono: '📞' },
];

const RESULTADOS = [
  { id: 'venta_cerrada', label: 'Venta cerrada',  icono: '✅', color: 'bg-green-50 border-green-200 text-green-700' },
  { id: 'no_venta',  label: 'Sin venta',      icono: '❌', color: 'bg-red-50 border-red-200 text-red-700' },
  { id: 'pendiente', label: 'Pendiente',      icono: '⏳', color: 'bg-amber-50 border-amber-200 text-amber-700' },
];

export default function AtencionesPage() {
  const [data, setData] = useState<AtencionesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isGuardando, setIsGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [atencionDetalle, setAtencionDetalle] = useState<Atencion | null>(null);

  const [form, setForm] = useState({
    canal: '',
    resultado: '',
    producto: '',
    monto: '',
    observaciones: '',
  });

  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [sugerencias, setSugerencias] = useState<ProductoSugerencia[]>([]);
  const [buscandoProducto, setBuscandoProducto] = useState(false);

  const fetchAtenciones = async () => {
    try {
      const res = await apiClient.get<AtencionesData>('/atenciones/mias');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAtenciones();
  }, []);

  const handleGuardar = async () => {
    if (!form.canal || !form.resultado) {
      setError('Canal y resultado son requeridos');
      return;
    }

    setIsGuardando(true);
    setError(null);

    try {
      await apiClient.post('/atenciones', {
        canal: form.canal,
        resultado: form.resultado,
        producto: form.producto || null,
        monto: form.monto ? Number(form.monto) : null,
        observaciones: form.observaciones || null,
      });

      setForm({ canal: '', resultado: '', producto: '', monto: '', observaciones: '' });
      setMostrarDetalles(false);
      setSugerencias([]);
      setShowForm(false);
      setSuccessMsg('¡Atención registrada!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchAtenciones();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsGuardando(false);
    }
  };

  const formatCanal = (canal: string) =>
    CANALES.find(c => c.id === canal) || { label: canal, icono: '📞' };

  const formatResultado = (resultado: string) =>
    RESULTADOS.find(r => r.id === resultado) || { label: resultado, icono: '○', color: 'bg-gray-50 border-gray-200 text-gray-700' };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 flex flex-col gap-6 max-w-lg mx-auto">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis atenciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Registrá cada consulta que recibís
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Registrar
        </button>
      </div>

      {/* Mensaje de éxito */}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-700 font-medium">{successMsg}</p>
        </div>
      )}

      {/* Stats de conversión */}
      {data && (
        <div className="flex flex-col gap-3">
          {/* Tasa de conversión destacada */}
          <div className="bg-gray-900 text-white rounded-2xl p-5">
            <p className="text-sm text-gray-400 mb-1">Tasa de conversión</p>
            <p className="text-4xl font-black">{data.stats.tasaConversion}%</p>
            <div className="w-full h-2 bg-gray-700 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${data.stats.tasaConversion}%` }}
              />
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-400">
              <span>✅ {data.stats.ventas} ventas</span>
              <span>❌ {data.stats.noVentas} sin venta</span>
              <span>⏳ {data.stats.pendientes} pendientes</span>
            </div>
          </div>

          {/* Grid de stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-2xl font-bold text-gray-900">{data.stats.total}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total atenciones</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-2xl font-bold text-green-600">
                {data.stats.montoTotal > 0
                  ? `$${data.stats.montoTotal.toLocaleString('es-AR')}`
                  : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Monto vendido</p>
            </div>
          </div>
        </div>
      )}

      {/* Historial */}
      {data && data.atenciones.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Historial reciente
          </p>
          <div className="flex flex-col gap-2">
            {data.atenciones.map((atencion) => {
              const canal = formatCanal(atencion.canal);
              const resultado = formatResultado(atencion.resultado);
              return (
                <button
                  key={atencion.id}
                  onClick={() => setAtencionDetalle(atencion)}
                  className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-start gap-3 text-left w-full active:scale-[0.99] transition-transform"
                >
                  <span className="text-xl shrink-0 mt-0.5">{canal.icono}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {canal.label}
                      </p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${resultado.color}`}>
                        {resultado.icono} {resultado.label}
                      </span>
                    </div>
                    {atencion.producto && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {atencion.producto}
                        {atencion.monto ? ` · $${atencion.monto.toLocaleString('es-AR')}` : ''}
                      </p>
                    )}
                    {atencion.observaciones && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {atencion.observaciones}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(atencion.created_at).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300 shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sin atenciones */}
      {data && data.atenciones.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-3xl mb-2">📋</p>
          <p className="font-semibold text-gray-700">Sin atenciones registradas</p>
          <p className="text-sm text-gray-400 mt-1">
            Registrá tu primera consulta tocando el botón de arriba
          </p>
        </div>
      )}

      {/* Modal detalle de atención */}
      {atencionDetalle && (() => {
        const canal = formatCanal(atencionDetalle.canal);
        const resultado = formatResultado(atencionDetalle.resultado);
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Detalle de atención</h2>
                <button
                  onClick={() => setAtencionDetalle(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Canal</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {canal.icono} {canal.label}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Resultado</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${resultado.color}`}>
                    {resultado.icono} {resultado.label}
                  </span>
                </div>
                {atencionDetalle.producto && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Producto</span>
                    <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%]">
                      {atencionDetalle.producto}
                    </span>
                  </div>
                )}
                {atencionDetalle.monto && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Monto</span>
                    <span className="text-sm font-bold text-green-600">
                      ${atencionDetalle.monto.toLocaleString('es-AR')}
                    </span>
                  </div>
                )}
                {atencionDetalle.observaciones && (
                  <div className="flex flex-col gap-1 py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Observaciones</span>
                    <span className="text-sm text-gray-700">{atencionDetalle.observaciones}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500">Fecha</span>
                  <span className="text-sm text-gray-700">
                    {new Date(atencionDetalle.created_at).toLocaleDateString('es-AR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setAtencionDetalle(null)}
                className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}

      {/* Modal de registro */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Registrar atención</h2>
              <button
                onClick={() => { setShowForm(false); setError(null); setSugerencias([]); setMostrarDetalles(false); }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* PASO 1: Resultado — lo más importante primero */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-900">¿Cómo terminó?</label>
              <div className="grid grid-cols-3 gap-2">
                {RESULTADOS.map((resultado) => (
                  <button
                    key={resultado.id}
                    onClick={() => setForm({ ...form, resultado: resultado.id })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium ${
                      form.resultado === resultado.id
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <span className="text-2xl">{resultado.icono}</span>
                    {resultado.label}
                  </button>
                ))}
              </div>
            </div>

            {/* PASO 2: Canal */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-900">¿Por dónde llegó?</label>
              <div className="grid grid-cols-5 gap-1.5">
                {CANALES.map((canal) => (
                  <button
                    key={canal.id}
                    onClick={() => setForm({ ...form, canal: canal.id })}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 transition-all text-xs font-medium ${
                      form.canal === canal.id
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <span className="text-lg">{canal.icono}</span>
                    <span className="text-[10px] leading-tight text-center">{canal.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Producto con autocomplete — siempre visible si hay resultado */}
            {form.resultado && (
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-sm font-semibold text-gray-900">
                  Producto
                  <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.producto}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setForm({ ...form, producto: val });
                      if (val.length < 2) { setSugerencias([]); return; }
                      setBuscandoProducto(true);
                      try {
                        const res = await apiClient.get<{ productos: ProductoSugerencia[] }>(
                          `/productos?q=${encodeURIComponent(val)}`
                        );
                        setSugerencias(res.productos.slice(0, 6));
                      } catch { setSugerencias([]); }
                      finally { setBuscandoProducto(false); }
                    }}
                    onBlur={() => setTimeout(() => setSugerencias([]), 150)}
                    placeholder="Buscar por marca o medida…"
                    className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400 w-full"
                  />
                  {buscandoProducto && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {sugerencias.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden mt-1">
                    {sugerencias.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={() => {
                          setForm({
                            ...form,
                            producto: `${s.marca} ${s.nombre}`,
                            monto: s.precio ? String(s.precio) : form.monto,
                          });
                          setSugerencias([]);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between gap-3 border-b border-gray-100 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {s.marca} {s.nombre}
                          </p>
                          {s.precio && (
                            <p className="text-xs text-gray-400">${s.precio.toLocaleString('es-AR')}</p>
                          )}
                        </div>
                        <span className={`text-xs shrink-0 font-medium px-2 py-0.5 rounded-full ${
                          s.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {s.stock > 0 ? `Stock: ${s.stock}` : 'Sin stock'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Monto — solo si es venta */}
            {form.resultado === 'venta_cerrada' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-900">
                  Monto
                  <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                    placeholder="85000"
                    className="h-11 pl-7 pr-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 w-full placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}

            {/* Más detalles — colapsable */}
            <button
              type="button"
              onClick={() => setMostrarDetalles(!mostrarDetalles)}
              className="flex items-center gap-2 text-sm text-gray-500 self-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${mostrarDetalles ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              {mostrarDetalles ? 'Ocultar nota' : 'Agregar nota'}
            </button>

            {mostrarDetalles && (
              <textarea
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                placeholder="Ej: Cliente vuelve la semana que viene por otro modelo…"
                rows={2}
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none placeholder:text-gray-400"
              />
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowForm(false); setError(null); setSugerencias([]); setMostrarDetalles(false); }}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={isGuardando || !form.canal || !form.resultado}
                className="flex-1 py-3 bg-gray-900 text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGuardando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
