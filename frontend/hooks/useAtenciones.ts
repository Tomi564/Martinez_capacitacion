'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

export interface Atencion {
  id: string;
  canal: string;
  resultado: string;
  producto: string | null;
  monto: number | null;
  observaciones: string | null;
  created_at: string;
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

export function useAtenciones() {
  const [data, setData] = useState<AtencionesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isGuardando, setIsGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [atencionDetalle, setAtencionDetalle] = useState<Atencion | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [sugerencias, setSugerencias] = useState<ProductoSugerencia[]>([]);
  const [buscandoProducto, setBuscandoProducto] = useState(false);
  const [form, setForm] = useState({
    canal: '',
    resultado: '',
    producto: '',
    monto: '',
    observaciones: '',
  });

  const fetchAtenciones = async () => {
    try {
      const res = await apiClient.get<AtencionesData>('/atenciones/mias');
      setData(res);
    } catch (err) {
      console.error('[useAtenciones] Error cargando atenciones', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAtenciones();
  }, []);

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

  const seleccionarProducto = (producto: ProductoSugerencia) => {
    setForm((prev) => ({
      ...prev,
      producto: `${producto.marca} ${producto.nombre}`,
      monto: producto.precio ? String(producto.precio) : prev.monto,
    }));
    setSugerencias([]);
  };

  const cerrarForm = () => {
    setShowForm(false);
    setError(null);
    setSugerencias([]);
    setMostrarDetalles(false);
  };

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

  return {
    data,
    isLoading,
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
    buscandoProducto,
    form,
    setForm,
    buscarProductos,
    seleccionarProducto,
    fetchAtenciones,
    handleGuardar,
    cerrarForm,
  };
}
