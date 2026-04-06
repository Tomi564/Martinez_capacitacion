/**
 * admin/stock/page.tsx — Gestión de stock de productos
 *
 * Tabs:
 *  - Buscar: buscador compartido con vendedores
 *  - Gestionar: listado con edición, alta manual y carga CSV
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api';
import { BuscadorProductos } from '@/components/ui/BuscadorProductos';

interface Producto {
  id: string;
  nombre: string;
  marca: string;
  descripcion: string | null;
  codigo: string | null;
  precio: number | null;
  stock: number | null;
}

const FORM_VACIO = { nombre: '', marca: '', descripcion: '', codigo: '', precio: '', stock: '' };

export default function StockAdminPage() {
  const [tab, setTab] = useState<'buscar' | 'gestionar'>('buscar');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState<'nuevo' | 'editar' | null>(null);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [csvStatus, setCsvStatus] = useState<{ tipo: 'ok' | 'error'; msg: string } | null>(null);
  const [csvCargando, setCsvCargando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProductos = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ productos: Producto[] }>('/productos');
      setProductos(res.productos);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'gestionar') fetchProductos();
  }, [tab]);

  const abrirNuevo = () => {
    setForm(FORM_VACIO);
    setEditando(null);
    setModal('nuevo');
  };

  const abrirEditar = (p: Producto) => {
    setForm({
      nombre:      p.nombre,
      marca:       p.marca,
      descripcion: p.descripcion || '',
      codigo:      p.codigo || '',
      precio:      p.precio != null ? String(p.precio) : '',
      stock:       p.stock != null ? String(p.stock) : '',
    });
    setEditando(p);
    setModal('editar');
  };

  const handleGuardar = async () => {
    if (!form.nombre.trim() || !form.marca.trim()) return;
    setGuardando(true);
    try {
      const body = {
        nombre:      form.nombre.trim(),
        marca:       form.marca.trim(),
        descripcion: form.descripcion.trim() || null,
        codigo:      form.codigo.trim() || null,
        precio:      form.precio !== '' ? Number(form.precio) : null,
        stock:       form.stock !== '' ? Number(form.stock) : 0,
      };

      if (modal === 'nuevo') {
        await apiClient.post('/productos', body);
      } else if (editando) {
        await apiClient.patch(`/productos/${editando.id}`, body);
      }

      setModal(null);
      fetchProductos();
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await apiClient.delete(`/productos/${id}`);
    setProductos(prev => prev.filter(p => p.id !== id));
  };

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvCargando(true);
    setCsvStatus(null);
    try {
      const csv = await file.text();
      const res = await apiClient.post<{ mensaje: string; importados: number }>(
        '/productos/bulk',
        { csv }
      );
      setCsvStatus({ tipo: 'ok', msg: res.mensaje });
      fetchProductos();
    } catch {
      setCsvStatus({ tipo: 'error', msg: 'Error al importar. Verificá el formato del archivo.' });
    } finally {
      setCsvCargando(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-4xl mx-auto">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock de productos</h1>
        <p className="text-sm text-gray-500 mt-1">Buscá o gestioná el catálogo de productos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['buscar', 'gestionar'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'buscar' ? 'Buscar' : 'Gestionar'}
          </button>
        ))}
      </div>

      {/* Tab: Buscar */}
      {tab === 'buscar' && <BuscadorProductos />}

      {/* Tab: Gestionar */}
      {tab === 'gestionar' && (
        <div className="flex flex-col gap-4">

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={abrirNuevo}
              className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              + Nuevo producto
            </button>

            {/* CSV upload */}
            <div className="flex items-center gap-3">
              <label className="h-10 px-4 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:border-gray-400 transition-colors cursor-pointer flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {csvCargando ? 'Importando...' : 'Importar CSV'}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSV}
                  disabled={csvCargando}
                />
              </label>
              <a
                href="data:text/csv;charset=utf-8,nombre,marca,descripcion,codigo,precio,stock%0APirelli P400 185/65 R15,Pirelli,Neum%C3%A1tico para autos,P400-185,45000,12"
                download="plantilla_productos.csv"
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Descargar plantilla
              </a>
            </div>
          </div>

          {/* Estado CSV */}
          {csvStatus && (
            <div className={`px-4 py-3 rounded-xl text-sm ${
              csvStatus.tipo === 'ok'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {csvStatus.msg}
            </div>
          )}

          {/* Lista */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : productos.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-gray-400 text-sm">No hay productos cargados aún</p>
            </div>
          ) : (
            <>
              {/* Cards — mobile */}
              <div className="flex flex-col gap-2 lg:hidden">
                {productos.map(p => (
                  <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{p.nombre}</p>
                      <p className="text-xs text-gray-500">{p.marca}</p>
                      {p.codigo && <p className="text-xs text-gray-400">Cód: {p.codigo}</p>}
                      <div className="flex gap-3 mt-1">
                        {p.precio != null && <span className="text-xs font-semibold text-gray-900">${p.precio.toLocaleString('es-AR')}</span>}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          (p.stock ?? 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {(p.stock ?? 0) > 0 ? `${p.stock} en stock` : 'Sin stock'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => abrirEditar(p)} className="p-1.5 text-gray-400 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button onClick={() => handleEliminar(p.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla — desktop */}
              <div className="hidden lg:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p, i) => (
                      <tr key={p.id} className={i !== 0 ? 'border-t border-gray-100' : ''}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{p.nombre}</p>
                          <p className="text-xs text-gray-400">{p.marca}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{p.codigo || '—'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {p.precio != null ? `$${p.precio.toLocaleString('es-AR')}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            (p.stock ?? 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {(p.stock ?? 0) > 0 ? p.stock : 'Sin stock'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => abrirEditar(p)} className="p-1.5 text-gray-400 hover:text-gray-700">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button onClick={() => handleEliminar(p.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6"/><path d="M14 11v6"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal nuevo/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md flex flex-col gap-4 p-5">
            <h2 className="text-lg font-bold text-gray-900">
              {modal === 'nuevo' ? 'Nuevo producto' : 'Editar producto'}
            </h2>

            <div className="flex flex-col gap-3">
              {[
                { key: 'nombre',      label: 'Nombre',       placeholder: 'Ej: Pirelli P400 185/65 R15', required: true },
                { key: 'marca',       label: 'Marca',        placeholder: 'Ej: Pirelli',                 required: true },
                { key: 'codigo',      label: 'Código',       placeholder: 'Ej: P400-185-65-R15',         required: false },
                { key: 'descripcion', label: 'Descripción',  placeholder: 'Ej: Neumático para autos medianos', required: false },
                { key: 'precio',      label: 'Precio ($)',   placeholder: 'Ej: 45000',                   required: false },
                { key: 'stock',       label: 'Stock',        placeholder: 'Ej: 12',                      required: false },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type={f.key === 'precio' || f.key === 'stock' ? 'number' : 'text'}
                    value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setModal(null)}
                className="flex-1 h-11 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando || !form.nombre.trim() || !form.marca.trim()}
                className="flex-1 h-11 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
