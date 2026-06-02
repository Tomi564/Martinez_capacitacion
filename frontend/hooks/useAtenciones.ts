'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { formatPatenteArDisplay, normalizePatenteAr } from '@/lib/patente';
import type { VehiculoSugerido } from '@/hooks/usePatenteSugerencias';

export interface ClienteAtencion {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
}

export interface Atencion {
  id: string;
  canal: string;
  resultado: string;
  producto: string | null;
  monto: number | null;
  observaciones: string | null;
  created_at: string;
  cliente_id?: string | null;
  clientes?: ClienteAtencion | null;
}

export interface StatsAtenciones {
  total: number;
  ventas: number;
  noVentas: number;
  pendientes: number;
  tasaConversion: number;
  montoTotal: number;
}

export interface AtencionesData {
  atenciones: Atencion[];
  stats: StatsAtenciones;
}

export interface ProductoSugerencia {
  id: string;
  nombre: string;
  marca: string;
  precio: number | null;
  stock: number;
}

export interface ClienteSugerencia {
  tipo: 'cliente' | 'qr';
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  dni: string | null;
  contacto: string | null;
  etiqueta: string;
}

export interface FormAtencionState {
  canal: string;
  resultado: string;
  producto: string;
  monto: string;
  observaciones: string;
  cliente_id: string | null;
  participante_qr_id: string | null;
  cliente_nombre: string;
  cliente_apellido: string;
  cliente_email: string;
  cliente_telefono: string;
  patente: string;
  vehiculo_id: string | null;
  vehiculo_marca: string;
  vehiculo_modelo: string;
  vehiculo_anio: string;
}

const FORM_VACIO: FormAtencionState = {
  canal: '',
  resultado: '',
  producto: '',
  monto: '',
  observaciones: '',
  cliente_id: null,
  participante_qr_id: null,
  cliente_nombre: '',
  cliente_apellido: '',
  cliente_email: '',
  cliente_telefono: '',
  patente: '',
  vehiculo_id: null,
  vehiculo_marca: '',
  vehiculo_modelo: '',
  vehiculo_anio: '',
};

const MIN_BUSQUEDA_NOMBRE = 4;
const MIN_BUSQUEDA_TELEFONO_DIGITOS = 6;

function digitosTelefono(texto: string): string {
  return texto.replace(/\D/g, '');
}

function esTextoSoloTelefono(texto: string): boolean {
  const sinEspacios = texto.replace(/\s/g, '');
  if (!sinEspacios.length) return false;
  return /^\d+$/.test(sinEspacios);
}

export function cumpleMinimoBusquedaCliente(texto: string, campo: 'nombre' | 'telefono'): boolean {
  if (campo === 'telefono' || esTextoSoloTelefono(texto)) {
    return digitosTelefono(texto).length >= MIN_BUSQUEDA_TELEFONO_DIGITOS;
  }
  return texto.trim().length >= MIN_BUSQUEDA_NOMBRE;
}

export function emailEsDelVendedor(clienteEmail: string, vendedorEmail: string | undefined | null): boolean {
  const cliente = clienteEmail.trim().toLowerCase();
  const vendedor = (vendedorEmail || '').trim().toLowerCase();
  if (!cliente || !vendedor) return false;
  return cliente === vendedor;
}

export function clienteFormCompleto(form: FormAtencionState): boolean {
  return (
    form.cliente_nombre.trim().length > 0 &&
    form.cliente_apellido.trim().length > 0 &&
    form.cliente_telefono.trim().length > 0
  );
}

export function ventaCerradaCamposCompletos(form: FormAtencionState): boolean {
  if (form.resultado !== 'venta_cerrada') return true;
  const monto = Number(form.monto);
  return form.producto.trim().length > 0 && form.monto.trim().length > 0 && !Number.isNaN(monto) && monto > 0;
}

export function puedeGuardarAtencion(
  form: FormAtencionState,
  opts?: { mailPropioVendedor?: boolean },
): boolean {
  if (opts?.mailPropioVendedor) return false;
  const email = form.cliente_email.trim();
  if (email && !email.includes('@')) return false;
  return !!form.canal && !!form.resultado && clienteFormCompleto(form) && ventaCerradaCamposCompletos(form);
}

export function validarFormularioAtencion(
  form: FormAtencionState,
  opts?: { vendedorEmail?: string | null },
): string | null {
  if (!form.canal || !form.resultado) {
    return 'Canal y resultado son requeridos';
  }
  if (!form.cliente_nombre.trim() || !form.cliente_apellido.trim()) {
    return 'Nombre y apellido del cliente son obligatorios';
  }
  if (!form.cliente_telefono.trim()) {
    return 'El teléfono del cliente es obligatorio';
  }
  const email = form.cliente_email.trim();
  if (email && !email.includes('@')) {
    return 'Ingresá un mail válido o dejá el campo vacío';
  }
  if (emailEsDelVendedor(form.cliente_email, opts?.vendedorEmail)) {
    return 'Este mail es el tuyo. Si el cliente no tiene mail, dejá el campo vacío.';
  }
  if (form.resultado === 'venta_cerrada') {
    if (!form.producto.trim()) {
      return 'El producto vendido es obligatorio en una venta cerrada';
    }
    const monto = Number(form.monto);
    if (!form.monto.trim() || Number.isNaN(monto) || monto <= 0) {
      return 'El monto es obligatorio y debe ser mayor a 0 en una venta cerrada';
    }
  }
  return null;
}

function telefonoDesdeSugerencia(s: ClienteSugerencia): string {
  if (s.telefono?.trim()) return s.telefono.trim();
  const contacto = (s.contacto || '').trim();
  if (contacto && !contacto.includes('@')) return contacto;
  return '';
}

function clientePayloadFromForm(form: FormAtencionState) {
  return {
    cliente_id: form.cliente_id,
    participante_qr_id: form.participante_qr_id,
    cliente_nombre: form.cliente_nombre.trim(),
    cliente_apellido: form.cliente_apellido.trim(),
    cliente_telefono: form.cliente_telefono.trim(),
    cliente_email: form.cliente_email.trim() || null,
  };
}

export function resultadoConPatente(resultado: string) {
  return resultado === 'venta_cerrada' || resultado === 'pendiente';
}

function patentePayloadFromForm(form: FormAtencionState) {
  if (!resultadoConPatente(form.resultado)) return {};
  const canon = normalizePatenteAr(form.patente);
  if (!canon && !form.vehiculo_id) return {};
  return {
    vehiculo_id: form.vehiculo_id,
    patente: canon || null,
  };
}

export function formFromAtencion(atencion: Atencion): FormAtencionState {
  const c = atencion.clientes;
  return {
    canal: atencion.canal || '',
    resultado: atencion.resultado || '',
    producto: atencion.producto || '',
    monto: atencion.monto != null ? String(atencion.monto) : '',
    observaciones: atencion.observaciones || '',
    cliente_id: atencion.cliente_id ?? c?.id ?? null,
    participante_qr_id: null,
    cliente_nombre: c?.nombre || '',
    cliente_apellido: c?.apellido || '',
    cliente_email: c?.email || '',
    cliente_telefono: c?.telefono || '',
    patente: '',
    vehiculo_id: null,
    vehiculo_marca: '',
    vehiculo_modelo: '',
    vehiculo_anio: '',
  };
}

export function useAtenciones() {
  const user = useAuth((s) => s.user);
  const [data, setData] = useState<AtencionesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [listReloading, setListReloading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isGuardando, setIsGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [atencionDetalle, setAtencionDetalle] = useState<Atencion | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [sugerencias, setSugerencias] = useState<ProductoSugerencia[]>([]);
  const [sugerenciasCliente, setSugerenciasCliente] = useState<ClienteSugerencia[]>([]);
  const [buscandoProducto, setBuscandoProducto] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [sugerenciasPatente, setSugerenciasPatente] = useState<VehiculoSugerido[]>([]);
  const [buscandoPatente, setBuscandoPatente] = useState(false);
  const [form, setForm] = useState<FormAtencionState>(FORM_VACIO);
  const clienteDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const patenteDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadListaAtenciones = useCallback(async () => {
    try {
      const res = await apiClient.get<AtencionesData>('/atenciones/mias');
      setData(res);
      setLoadError(null);
    } catch (err) {
      console.error('[useAtenciones] Error cargando atenciones', err);
      const mensaje =
        err instanceof Error && err.message
          ? err.message
          : 'No pudimos cargar tus atenciones. Revisá la conexión y reintentá.';
      setLoadError(mensaje);
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      await loadListaAtenciones();
      if (vivo) setIsLoading(false);
    })();
    return () => {
      vivo = false;
    };
  }, [loadListaAtenciones]);

  const fetchAtenciones = loadListaAtenciones;

  const reintentarCarga = async () => {
    setListReloading(true);
    try {
      await loadListaAtenciones();
    } finally {
      setListReloading(false);
    }
  };

  const limpiarVinculoCliente = () => ({
    cliente_id: null as string | null,
    participante_qr_id: null as string | null,
  });

  const buscarProductos = async (texto: string) => {
    setForm((prev) => ({ ...prev, producto: texto }));
    if (texto.length < 2) {
      setSugerencias([]);
      return;
    }
    setBuscandoProducto(true);
    try {
      const res = await apiClient.get<{ productos: ProductoSugerencia[] }>(
        `/productos?q=${encodeURIComponent(texto)}`
      );
      setSugerencias(res.productos.slice(0, 6));
    } catch (err) {
      console.error('[useAtenciones] Error buscando productos', err);
      setSugerencias([]);
    } finally {
      setBuscandoProducto(false);
    }
  };

  const ejecutarBusquedaCliente = async (texto: string, campo: 'nombre' | 'telefono') => {
    if (!cumpleMinimoBusquedaCliente(texto, campo)) {
      setSugerenciasCliente([]);
      return;
    }
    setBuscandoCliente(true);
    try {
      const res = await apiClient.get<{ sugerencias: ClienteSugerencia[] }>(
        `/clientes/sugerencias?q=${encodeURIComponent(texto)}`
      );
      setSugerenciasCliente(res.sugerencias.slice(0, 8));
    } catch (err) {
      console.error('[useAtenciones] Error buscando clientes', err);
      setSugerenciasCliente([]);
    } finally {
      setBuscandoCliente(false);
    }
  };

  const programarBusquedaCliente = (texto: string, campo: 'nombre' | 'telefono') => {
    if (clienteDebounce.current) clearTimeout(clienteDebounce.current);
    if (!cumpleMinimoBusquedaCliente(texto, campo)) {
      setSugerenciasCliente([]);
      return;
    }
    clienteDebounce.current = setTimeout(() => {
      void ejecutarBusquedaCliente(texto, campo);
    }, 300);
  };

  const onClienteNombreChange = (texto: string) => {
    setForm((prev) => ({
      ...prev,
      cliente_nombre: texto,
      ...limpiarVinculoCliente(),
    }));
    programarBusquedaCliente(texto, 'nombre');
  };

  const onClienteTelefonoChange = (texto: string) => {
    setForm((prev) => ({
      ...prev,
      cliente_telefono: texto,
      ...limpiarVinculoCliente(),
    }));
    programarBusquedaCliente(texto, 'telefono');
  };

  const onClienteApellidoChange = (texto: string) => {
    setForm((prev) => ({
      ...prev,
      cliente_apellido: texto,
      ...limpiarVinculoCliente(),
    }));
  };

  const onClienteEmailChange = (texto: string) => {
    setSugerenciasCliente([]);
    setForm((prev) => ({
      ...prev,
      cliente_email: texto,
      ...limpiarVinculoCliente(),
    }));
  };

  const seleccionarCliente = (s: ClienteSugerencia) => {
    const telefono = telefonoDesdeSugerencia(s);
    setForm((prev) => ({
      ...prev,
      cliente_id: s.tipo === 'cliente' ? s.id : null,
      participante_qr_id: s.tipo === 'qr' ? s.id : null,
      cliente_nombre: s.nombre,
      cliente_apellido: s.apellido,
      cliente_telefono: telefono || prev.cliente_telefono,
    }));
    setSugerenciasCliente([]);
  };

  const seleccionarProducto = (producto: ProductoSugerencia) => {
    setForm((prev) => ({
      ...prev,
      producto: `${producto.marca} ${producto.nombre}`,
      monto: producto.precio ? String(producto.precio) : prev.monto,
    }));
    setSugerencias([]);
  };

  const buildPayload = () => {
    const esVentaCerrada = form.resultado === 'venta_cerrada';
    return {
      canal: form.canal,
      resultado: form.resultado,
      producto: form.producto.trim() || null,
      monto:
        esVentaCerrada && form.monto.trim()
          ? Number(form.monto)
          : null,
      observaciones: form.observaciones.trim() || null,
      ...clientePayloadFromForm(form),
      ...patentePayloadFromForm(form),
    };
  };

  const limpiarVehiculoPatente = () => ({
    vehiculo_id: null as string | null,
    vehiculo_marca: '',
    vehiculo_modelo: '',
    vehiculo_anio: '',
  });

  const onPatenteChange = (texto: string) => {
    setForm((prev) => ({
      ...prev,
      patente: texto.toUpperCase(),
      ...limpiarVehiculoPatente(),
    }));
    programarBusquedaPatente(texto);
  };

  const aplicarVehiculoPatente = (v: VehiculoSugerido) => {
    const canon = normalizePatenteAr(v.patente || '');
    setForm((prev) => ({
      ...prev,
      patente: canon ? formatPatenteArDisplay(canon) : prev.patente,
      vehiculo_id: v.id,
      vehiculo_marca: v.marca || '',
      vehiculo_modelo: v.modelo || '',
      vehiculo_anio: v.anio ? String(v.anio) : '',
    }));
  };

  const buscarPatenteExacta = async () => {
    const canon = normalizePatenteAr(form.patente);
    if (canon.length < 6) return;
    try {
      const res = await apiClient.get<{ vehiculo: VehiculoSugerido | null }>(
        `/vendedor/vehiculos/buscar/${encodeURIComponent(canon)}`,
      );
      if (res.vehiculo) {
        aplicarVehiculoPatente(res.vehiculo);
        setSugerenciasPatente([]);
      } else {
        setForm((prev) => ({
          ...prev,
          patente: formatPatenteArDisplay(canon),
          ...limpiarVehiculoPatente(),
        }));
      }
    } catch (err) {
      console.error('[useAtenciones] Error buscando patente', err);
    }
  };

  const programarBusquedaPatente = (texto: string) => {
    if (patenteDebounce.current) clearTimeout(patenteDebounce.current);
    const q = texto.trim();
    if (q.length < 3) {
      setSugerenciasPatente([]);
      return;
    }
    patenteDebounce.current = setTimeout(async () => {
      setBuscandoPatente(true);
      try {
        const res = await apiClient.get<{ vehiculos: VehiculoSugerido[] }>(
          `/vendedor/vehiculos/sugerencias?q=${encodeURIComponent(q)}`,
        );
        setSugerenciasPatente((res.vehiculos || []).slice(0, 8));
      } catch {
        setSugerenciasPatente([]);
      } finally {
        setBuscandoPatente(false);
      }
    }, 300);
  };

  const seleccionarVehiculoPatente = (v: VehiculoSugerido) => {
    aplicarVehiculoPatente(v);
    setSugerenciasPatente([]);
  };

  const cerrarForm = () => {
    setShowForm(false);
    setError(null);
    setSugerencias([]);
    setSugerenciasCliente([]);
    setSugerenciasPatente([]);
    setMostrarDetalles(false);
  };

  const resetForm = () => setForm(FORM_VACIO);

  const handleGuardar = async () => {
    const validacion = validarFormularioAtencion(form, { vendedorEmail: user?.email });
    if (validacion) {
      setError(validacion);
      return false;
    }

    setIsGuardando(true);
    setError(null);
    try {
      await apiClient.post('/atenciones', buildPayload());
      resetForm();
      setMostrarDetalles(false);
      setSugerencias([]);
      setSugerenciasCliente([]);
      setSugerenciasPatente([]);
      setShowForm(false);
      setSuccessMsg('¡Atención registrada!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchAtenciones();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      return false;
    } finally {
      setIsGuardando(false);
    }
  };

  const actualizarAtencion = async (atencionId: string) => {
    const validacion = validarFormularioAtencion(form, { vendedorEmail: user?.email });
    if (validacion) {
      setError(validacion);
      return false;
    }

    setIsGuardando(true);
    setError(null);
    try {
      await apiClient.patch(`/atenciones/${atencionId}`, buildPayload());
      resetForm();
      setMostrarDetalles(false);
      setSugerencias([]);
      setSugerenciasCliente([]);
      setSugerenciasPatente([]);
      setShowForm(false);
      setSuccessMsg('Atención actualizada');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchAtenciones();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
      return false;
    } finally {
      setIsGuardando(false);
    }
  };

  return {
    data,
    isLoading,
    loadError,
    reintentarCarga,
    listReloading,
    showForm,
    setShowForm,
    isGuardando,
    error,
    setError,
    successMsg,
    atencionDetalle,
    setAtencionDetalle,
    mostrarDetalles,
    setMostrarDetalles,
    sugerencias,
    setSugerencias,
    sugerenciasCliente,
    setSugerenciasCliente,
    buscandoProducto,
    buscandoCliente,
    form,
    setForm,
    buscarProductos,
    onClienteNombreChange,
    onClienteTelefonoChange,
    onClienteApellidoChange,
    onClienteEmailChange,
    seleccionarCliente,
    seleccionarProducto,
    sugerenciasPatente,
    setSugerenciasPatente,
    buscandoPatente,
    onPatenteChange,
    buscarPatenteExacta,
    seleccionarVehiculoPatente,
    resultadoConPatente,
    clienteFormCompleto,
    puedeGuardarAtencion,
    fetchAtenciones,
    handleGuardar,
    actualizarAtencion,
    formFromAtencion,
    cerrarForm,
    resetForm,
  };
}
