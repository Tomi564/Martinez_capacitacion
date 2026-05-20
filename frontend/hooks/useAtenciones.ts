'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api';

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
};

export function clienteFormCompleto(form: FormAtencionState): boolean {
  return (
    form.cliente_nombre.trim().length > 0 &&
    form.cliente_apellido.trim().length > 0 &&
    form.cliente_telefono.trim().length > 0 &&
    form.cliente_email.trim().length > 0 &&
    form.cliente_email.includes('@')
  );
}

export function ventaCerradaCamposCompletos(form: FormAtencionState): boolean {
  if (form.resultado !== 'venta_cerrada') return true;
  const monto = Number(form.monto);
  return form.producto.trim().length > 0 && form.monto.trim().length > 0 && !Number.isNaN(monto) && monto > 0;
}

export function puedeGuardarAtencion(form: FormAtencionState): boolean {
  return !!form.canal && !!form.resultado && clienteFormCompleto(form) && ventaCerradaCamposCompletos(form);
}

export function validarFormularioAtencion(form: FormAtencionState): string | null {
  if (!form.canal || !form.resultado) {
    return 'Canal y resultado son requeridos';
  }
  if (!form.cliente_nombre.trim() || !form.cliente_apellido.trim()) {
    return 'Nombre y apellido del cliente son obligatorios';
  }
  if (!form.cliente_telefono.trim()) {
    return 'El teléfono del cliente es obligatorio';
  }
  if (!form.cliente_email.trim()) {
    return 'El mail del cliente es obligatorio';
  }
  if (!form.cliente_email.includes('@')) {
    return 'Ingresá un mail válido';
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

function emailDesdeSugerencia(s: ClienteSugerencia): string {
  if (s.email?.trim()) return s.email.trim();
  const contacto = (s.contacto || '').trim();
  if (contacto.includes('@')) return contacto;
  return '';
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
    cliente_email: form.cliente_email.trim(),
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
  };
}

export function useAtenciones() {
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
  const [form, setForm] = useState<FormAtencionState>(FORM_VACIO);
  const clienteDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const ejecutarBusquedaCliente = async (texto: string) => {
    if (texto.length < 2) {
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

  const programarBusquedaCliente = (texto: string) => {
    if (clienteDebounce.current) clearTimeout(clienteDebounce.current);
    if (texto.length < 2) {
      setSugerenciasCliente([]);
      return;
    }
    clienteDebounce.current = setTimeout(() => {
      ejecutarBusquedaCliente(texto);
    }, 300);
  };

  const onClienteNombreChange = (texto: string) => {
    setForm((prev) => ({
      ...prev,
      cliente_nombre: texto,
      ...limpiarVinculoCliente(),
    }));
    programarBusquedaCliente(texto);
  };

  const onClienteTelefonoChange = (texto: string) => {
    setForm((prev) => ({
      ...prev,
      cliente_telefono: texto,
      ...limpiarVinculoCliente(),
    }));
    programarBusquedaCliente(texto);
  };

  const onClienteApellidoChange = (texto: string) => {
    setForm((prev) => ({
      ...prev,
      cliente_apellido: texto,
      ...limpiarVinculoCliente(),
    }));
  };

  const onClienteEmailChange = (texto: string) => {
    setForm((prev) => ({
      ...prev,
      cliente_email: texto,
      ...limpiarVinculoCliente(),
    }));
  };

  const seleccionarCliente = (s: ClienteSugerencia) => {
    const email = emailDesdeSugerencia(s);
    const telefono = telefonoDesdeSugerencia(s);
    setForm((prev) => ({
      ...prev,
      cliente_id: s.tipo === 'cliente' ? s.id : null,
      participante_qr_id: s.tipo === 'qr' ? s.id : null,
      cliente_nombre: s.nombre,
      cliente_apellido: s.apellido,
      cliente_email: email || prev.cliente_email,
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

  const buildPayload = () => ({
    canal: form.canal,
    resultado: form.resultado,
    producto: form.producto || null,
    monto: form.monto ? Number(form.monto) : null,
    observaciones: form.observaciones || null,
    ...clientePayloadFromForm(form),
  });

  const cerrarForm = () => {
    setShowForm(false);
    setError(null);
    setSugerencias([]);
    setSugerenciasCliente([]);
    setMostrarDetalles(false);
  };

  const resetForm = () => setForm(FORM_VACIO);

  const handleGuardar = async () => {
    const validacion = validarFormularioAtencion(form);
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
    const validacion = validarFormularioAtencion(form);
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
