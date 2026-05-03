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

import { FormAtencion } from '@/components/atenciones/FormAtencion';
import { useAtenciones } from '@/hooks/useAtenciones';

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
  const {
    data,
    isLoading,
    showForm,
    setShowForm,
    isGuardando,
    error,
    successMsg,
    atencionDetalle,
    setAtencionDetalle,
    mostrarDetalles,
    setMostrarDetalles,
    sugerencias,
    setSugerencias,
    buscandoProducto,
    form,
    setForm,
    buscarProductos,
    seleccionarProducto,
    handleGuardar,
    cerrarForm,
  } = useAtenciones();

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
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C8102E] text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform"
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
          <div className="bg-[#C8102E] text-white rounded-2xl p-5">
            <p className="text-sm text-red-50/95 mb-1">Tasa de conversión</p>
            <p className="text-4xl font-black">{data.stats.tasaConversion}%</p>
            <div className="w-full h-2 bg-gray-700 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${data.stats.tasaConversion}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-red-50/95">
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
                className="w-full py-3 bg-[#C8102E] text-white font-semibold rounded-xl text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}

      {/* Modal de registro */}
      {showForm && (
        <FormAtencion
          form={form}
          setForm={setForm}
          error={error}
          isGuardando={isGuardando}
          mostrarDetalles={mostrarDetalles}
          setMostrarDetalles={setMostrarDetalles}
          sugerencias={sugerencias}
          buscandoProducto={buscandoProducto}
          onBuscarProductos={buscarProductos}
          onSeleccionarProducto={seleccionarProducto}
          onCerrar={cerrarForm}
          onGuardar={handleGuardar}
          onLimpiarSugerencias={() => setSugerencias([])}
        />
      )}

    </div>
  );
}
