'use client';

import {
  puedeGuardarAtencion,
  type ClienteSugerencia,
  type FormAtencionState,
  type ProductoSugerencia,
} from '@/hooks/useAtenciones';

const CANALES = [
  { id: 'whatsapp', label: 'WhatsApp', icono: '💬' },
  { id: 'mercadolibre', label: 'Mercado Libre', icono: '🛒' },
  { id: 'instagram', label: 'Instagram', icono: '📸' },
  { id: 'presencial', label: 'Presencial', icono: '🏪' },
  { id: 'telefono', label: 'Teléfono', icono: '📞' },
  { id: 'otro', label: 'Otro', icono: '⋯' },
];

const RESULTADOS = [
  { id: 'venta_cerrada', label: 'Venta cerrada', icono: '✅' },
  { id: 'no_venta', label: 'Sin venta', icono: '❌' },
  { id: 'pendiente', label: 'Pendiente', icono: '⏳' },
];

interface FormAtencionProps {
  form: FormAtencionState;
  setForm: React.Dispatch<React.SetStateAction<FormAtencionState>>;
  error: string | null;
  isGuardando: boolean;
  mostrarDetalles: boolean;
  setMostrarDetalles: (v: boolean) => void;
  sugerencias: ProductoSugerencia[];
  sugerenciasCliente: ClienteSugerencia[];
  buscandoProducto: boolean;
  buscandoCliente: boolean;
  onBuscarProductos: (texto: string) => void;
  onClienteNombreChange: (texto: string) => void;
  onClienteApellidoChange: (texto: string) => void;
  onClienteTelefonoChange: (texto: string) => void;
  onClienteEmailChange: (texto: string) => void;
  onSeleccionarProducto: (producto: ProductoSugerencia) => void;
  onSeleccionarCliente: (cliente: ClienteSugerencia) => void;
  onCerrar: () => void;
  onGuardar: () => void;
  onLimpiarSugerencias: () => void;
  onLimpiarSugerenciasCliente: () => void;
  title?: string;
  submitLabel?: string;
}

export function FormAtencion({
  form,
  setForm,
  error,
  isGuardando,
  mostrarDetalles,
  setMostrarDetalles,
  sugerencias,
  sugerenciasCliente,
  buscandoProducto,
  buscandoCliente,
  onBuscarProductos,
  onClienteNombreChange,
  onClienteApellidoChange,
  onClienteTelefonoChange,
  onClienteEmailChange,
  onSeleccionarProducto,
  onSeleccionarCliente,
  onCerrar,
  onGuardar,
  onLimpiarSugerencias,
  onLimpiarSugerenciasCliente,
  title = 'Registrar atención',
  submitLabel = 'Guardar',
}: FormAtencionProps) {
  const esVentaCerrada = form.resultado === 'venta_cerrada';
  const puedeGuardar = puedeGuardarAtencion(form);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onCerrar} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-900">¿Cómo terminó?</label>
          <div className="grid grid-cols-3 gap-2">
            {RESULTADOS.map((resultado) => (
              <button
                key={resultado.id}
                onClick={() => setForm((prev) => ({ ...prev, resultado: resultado.id }))}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium ${
                  form.resultado === resultado.id
                    ? 'border-gray-900 bg-[#C8102E] text-white'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                <span className="text-2xl">{resultado.icono}</span>
                {resultado.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-900">¿Por dónde llegó?</label>
          <div className="grid grid-cols-3 gap-1.5">
            {CANALES.map((canal) => (
              <button
                key={canal.id}
                onClick={() => setForm((prev) => ({ ...prev, canal: canal.id }))}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 transition-all text-xs font-medium ${
                  form.canal === canal.id
                    ? 'border-gray-900 bg-[#C8102E] text-white'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                <span className="text-lg">{canal.icono}</span>
                <span className="text-[10px] leading-tight text-center">{canal.label}</span>
              </button>
            ))}
          </div>
        </div>

        
        <div className="flex flex-col gap-2 relative">
          <label className="text-sm font-semibold text-gray-900">Cliente</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="text"
                required
                value={form.cliente_nombre}
                onChange={(e) => onClienteNombreChange(e.target.value)}
                onBlur={() => setTimeout(onLimpiarSugerenciasCliente, 150)}
                placeholder="Nombre *"
                className="h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8102E] placeholder:text-gray-400 w-full"
              />
            </div>
            <input
              type="text"
              required
              value={form.cliente_apellido}
              onChange={(e) => onClienteApellidoChange(e.target.value)}
              placeholder="Apellido *"
              className="h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8102E] placeholder:text-gray-400"
            />
            <div className="relative">
              <input
                type="tel"
                required
                value={form.cliente_telefono}
                onChange={(e) => onClienteTelefonoChange(e.target.value)}
                onBlur={() => setTimeout(onLimpiarSugerenciasCliente, 150)}
                placeholder="Teléfono *"
                className="h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8102E] placeholder:text-gray-400 w-full"
              />
              {buscandoCliente && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input
              type="email"
              required
              value={form.cliente_email}
              onChange={(e) => onClienteEmailChange(e.target.value)}
              placeholder="Mail *"
              className="h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8102E] placeholder:text-gray-400"
            />
          </div>
          {sugerenciasCliente.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {sugerenciasCliente.map((s) => (
                <button
                  key={`${s.tipo}-${s.id}`}
                  type="button"
                  onMouseDown={() => onSeleccionarCliente(s)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{s.etiqueta}</p>
                  <p className="text-xs text-gray-400">{s.tipo === 'qr' ? 'Participante QR' : 'Cliente registrado'}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {form.resultado && (
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-sm font-semibold text-gray-900">
              Producto vendido
              {esVentaCerrada ? (
                <span className="text-[#C8102E] font-normal ml-1">*</span>
              ) : (
                <span className="text-gray-400 font-normal ml-1">(opcional)</span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                required={esVentaCerrada}
                value={form.producto}
                onChange={(e) => onBuscarProductos(e.target.value)}
                onBlur={() => setTimeout(onLimpiarSugerencias, 150)}
                placeholder={esVentaCerrada ? 'Qué se vendió…' : 'Buscar por marca o medida… (opcional)'}
                className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8102E] placeholder:text-gray-400 w-full"
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
                    onMouseDown={() => onSeleccionarProducto(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between gap-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {s.marca} {s.nombre}
                      </p>
                      {s.precio && <p className="text-xs text-gray-400">${s.precio.toLocaleString('es-AR')}</p>}
                    </div>
                    <span
                      className={`text-xs shrink-0 font-medium px-2 py-0.5 rounded-full ${
                        s.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {s.stock > 0 ? `Stock: ${s.stock}` : 'Sin stock'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {esVentaCerrada && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-900">
              Monto
              <span className="text-[#C8102E] font-normal ml-1">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                required
                min={1}
                value={form.monto}
                onChange={(e) => setForm((prev) => ({ ...prev, monto: e.target.value }))}
                placeholder="85000"
                className="h-11 pl-7 pr-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8102E] w-full placeholder:text-gray-400"
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMostrarDetalles(!mostrarDetalles)}
          className="flex items-center gap-2 text-sm text-gray-500 self-start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${mostrarDetalles ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          {mostrarDetalles ? 'Ocultar nota' : 'Agregar nota'}
        </button>

        {mostrarDetalles && (
          <textarea
            value={form.observaciones}
            onChange={(e) => setForm((prev) => ({ ...prev, observaciones: e.target.value }))}
            placeholder="Ej: Cliente vuelve la semana que viene por otro modelo…"
            rows={2}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8102E] resize-none placeholder:text-gray-400"
          />
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onCerrar} className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm">
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            disabled={isGuardando || !puedeGuardar}
            className="flex-1 py-3 bg-[#C8102E] text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGuardando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
