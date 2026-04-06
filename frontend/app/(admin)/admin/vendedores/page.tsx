/**
 * admin/vendedores/page.tsx — Gestión de vendedores
 *
 * Permite al admin:
 *  - Ver todos los vendedores con su progreso
 *  - Crear nuevos vendedores
 *  - Activar/desactivar vendedores
 */

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface Vendedor {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  activo: boolean;
  created_at: string;
  modulosAprobados: number;
  totalModulos: number;
}

interface NuevoVendedor {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
}

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState<NuevoVendedor>({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
  });

  const fetchVendedores = async () => {
    try {
      const res = await apiClient.get<{ vendedores: Vendedor[] }>(
        '/admin/vendedores'
      );
      setVendedores(res.vendedores);
    } catch (err) {
      setError('Error al cargar los vendedores');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendedores();
  }, []);

  const handleCrear = async () => {
    if (!form.nombre || !form.apellido || !form.email || !form.password) {
      setCreateError('Todos los campos son requeridos');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      await apiClient.post('/admin/vendedores', form);
      setShowModal(false);
      setForm({ nombre: '', apellido: '', email: '', password: '' });
      fetchVendedores();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : 'Error al crear el vendedor'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActivo = async (vendedor: Vendedor) => {
    try {
      await apiClient.patch(`/admin/vendedores/${vendedor.id}`, {
        activo: !vendedor.activo,
      });
      fetchVendedores();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-6xl mx-auto">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendedores</h1>
          <p className="text-sm text-gray-500 mt-1">
            {vendedores.length} vendedores registrados
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo vendedor
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Lista de vendedores */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

        {/* Header tabla desktop */}
        <div className="hidden lg:grid grid-cols-5 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span className="col-span-2">Vendedor</span>
          <span className="text-center">Progreso</span>
          <span className="text-center">Estado</span>
          <span className="text-center">Acciones</span>
        </div>

        {vendedores
          .filter((v) => {
            const q = busqueda.toLowerCase();
            return (
              !q ||
              v.nombre.toLowerCase().includes(q) ||
              v.apellido.toLowerCase().includes(q) ||
              v.email.toLowerCase().includes(q)
            );
          })
          .map((vendedor, index) => {
          const porcentaje =
            vendedor.totalModulos > 0
              ? Math.round(
                  (vendedor.modulosAprobados / vendedor.totalModulos) * 100
                )
              : 0;

          return (
            <div
              key={vendedor.id}
              className={`px-4 py-4 flex items-center gap-3 ${
                index !== 0 ? 'border-t border-gray-100' : ''
              } ${!vendedor.activo ? 'opacity-50' : ''}`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                {vendedor.nombre.charAt(0)}{vendedor.apellido.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {vendedor.nombre} {vendedor.apellido}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {vendedor.email}
                </p>
                <p className="text-xs text-gray-400 lg:hidden mt-0.5">
                  {vendedor.modulosAprobados}/{vendedor.totalModulos} módulos · {porcentaje}%
                </p>
              </div>

              {/* Progreso desktop */}
              <div className="hidden lg:block w-32">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">
                    {vendedor.modulosAprobados}/{vendedor.totalModulos}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {porcentaje}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full">
                  <div
                    className="h-full bg-gray-900 rounded-full"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>

              {/* Badge activo/inactivo desktop */}
              <div className="hidden lg:block w-24 text-center">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  vendedor.activo
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {vendedor.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Acciones */}
              <div className="flex flex-col lg:flex-row items-end lg:items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => handleToggleActivo(vendedor)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  vendedor.activo
                    ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                    : 'border-green-200 text-green-600 hover:bg-green-50'
                }`}
              >
                {vendedor.activo ? 'Desactivar' : 'Activar'}
              </button>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar a ${vendedor.nombre} ${vendedor.apellido}? Esta acción no se puede deshacer.`)) {
                    apiClient.delete(`/admin/vendedores/${vendedor.id}`)
                      .then(() => fetchVendedores())
                      .catch((err) => console.error(err));
                  }
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors"
              >
                Eliminar
              </button>
              </div>
            </div>
          );
        })}

        {vendedores.filter((v) => {
          const q = busqueda.toLowerCase();
          return !q || v.nombre.toLowerCase().includes(q) || v.apellido.toLowerCase().includes(q) || v.email.toLowerCase().includes(q);
        }).length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-2xl mb-2">👥</p>
            <p className="text-gray-500 text-sm">
              {busqueda ? 'Sin resultados para esa búsqueda' : 'No hay vendedores aún'}
            </p>
          </div>
        )}
      </div>

      {/* Modal crear vendedor */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 flex flex-col gap-4">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Nuevo vendedor
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCreateError(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{createError}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Juan"
                    className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Apellido</label>
                  <input
                    type="text"
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                    placeholder="Pérez"
                    className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="juan@martinez.com"
                  className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Contraseña inicial</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setCreateError(null);
                }}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrear}
                disabled={isCreating}
                className="flex-1 py-3 bg-gray-900 text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear vendedor'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}