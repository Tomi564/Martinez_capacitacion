'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api';
import { PageState } from '@/components/ui/PageState';
import { BadgeRangoEtario } from '@/components/clientes/BadgeRangoEtario';
import { Badge } from '@/components/ui/badge';
import { BadgeOrdenEstado } from '@/components/taller/BadgeOrdenEstado';
import {
  agruparLineasInforme,
  formatPesosAr,
  lineasMarcadasParaApi,
  subtotalLineaInforme,
  tieneItemsMarcadosInforme,
  tienePresupuestoNuevoInforme,
  type PresupuestoLineaInforme,
} from '@/lib/presupuesto-checklist';
import { PresupuestoVendedorEditor } from '@/components/taller/PresupuestoVendedorEditor';

export interface InformeVisita {
  id: string;
  estado: string;
  estado_visita?: string | null;
  orden_estado?: string | null;
  motivo: string | null;
  observaciones: string | null;
  operario_responsable?: string | null;
  km: number | null;
  presion_psi?: number | null;
  neumaticos_cambiados?: boolean | null;
  marca_neumatico?: string | null;
  medida_neumatico?: string | null;
  observaciones_gomero?: string | null;
  tren_delantero?: string | null;
  tren_alineado?: boolean | null;
  tren_balanceo?: boolean | null;
  amortiguadores_revisados?: boolean | null;
  auxilio_revisado?: boolean | null;
  presupuesto?: string | null;
  fotos_neumatico_urls?: string[] | null;
  created_at: string;
  updated_at?: string | null;
  enviado_al_mecanico_at?: string | null;
  mecanico_tomo_at?: string | null;
  vehiculos: {
    patente: string;
    marca: string;
    modelo: string;
    anio: number | null;
    medida_rueda: string | null;
    clientes: { nombre: string; apellido: string; dni: string | null; email: string | null; telefono: string | null } | null;
  } | null;
}

function fmt(ts: string | null | undefined) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function boolTxt(v: boolean | null | undefined) {
  if (v === true) return 'Sí';
  if (v === false) return 'No';
  return '—';
}

function trenTxt(v: string | null | undefined) {
  if (v === 'x2') return '2 ruedas';
  if (v === 'x4') return '4 ruedas';
  if (v === 'no') return 'No';
  return '—';
}

const PSI_PER_BAR = 14.5037738;
function psiToBar(psi: number) {
  return psi / PSI_PER_BAR;
}

export type PresupuestoPdfApiBase = '/vendedor/visitas' | '/admin/visitas';

function nombrePresupuestoPdf(patente: string, createdAt: string): string {
  const pat = patente.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'SIN-PATENTE';
  const f = new Date(createdAt)
    .toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .replace(/\//g, '-');
  return `presupuesto-${pat}-${f}.pdf`;
}

function mapLineasApi(raw: PresupuestoLineaInforme[] | undefined): PresupuestoLineaInforme[] {
  return (raw || []).map((l) => ({
    item_catalogo_id: l.item_catalogo_id,
    grupo: l.grupo,
    etiqueta: l.etiqueta,
    orden: l.orden ?? 0,
    marcado: !!l.marcado,
    cantidad: Number(l.cantidad ?? 1),
    precio: l.precio != null ? Number(l.precio) : null,
  }));
}

function PresupuestoChecklistInforme({ lineas }: { lineas: PresupuestoLineaInforme[] }) {
  const secciones = useMemo(() => agruparLineasInforme(lineas), [lineas]);
  const total = useMemo(
    () => lineas.filter((l) => l.marcado).reduce((s, l) => s + subtotalLineaInforme(l), 0),
    [lineas],
  );

  if (!secciones.length) {
    return <p className="text-sm text-gray-500">Sin ítems presupuestados.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {secciones.map((sec) => (
        <div key={sec.grupo} className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-[#1F1F1F] text-white px-3 py-2 flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-wide">{sec.titulo}</span>
            <span className="text-xs font-bold">{formatPesosAr(sec.subtotal)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <th className="px-3 py-2 font-bold">Ítem</th>
                  <th className="px-2 py-2 font-bold text-center w-14">Cant.</th>
                  <th className="px-2 py-2 font-bold text-right w-24">P. unit.</th>
                  <th className="px-3 py-2 font-bold text-right w-24">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {sec.items.map((l) => (
                  <tr key={l.item_catalogo_id} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-900">{l.etiqueta}</td>
                    <td className="px-2 py-2 text-center text-gray-700">{l.cantidad}</td>
                    <td className="px-2 py-2 text-right text-gray-700">
                      {formatPesosAr(l.precio || 0)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900">
                      {formatPesosAr(subtotalLineaInforme(l))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 bg-gray-50 flex justify-between text-xs">
            <span className="font-bold text-gray-500 uppercase">Subtotal sección</span>
            <span className="font-black text-gray-900">{formatPesosAr(sec.subtotal)}</span>
          </div>
        </div>
      ))}

      <div className="rounded-xl bg-[#C8102E] text-white px-4 py-3 flex justify-between items-center">
        <span className="font-black uppercase text-sm">Total general</span>
        <span className="text-lg font-black">{formatPesosAr(total)}</span>
      </div>
    </div>
  );
}

function MecanicoLegacyInforme({ visita }: { visita: InformeVisita }) {
  return (
    <ul className="text-sm text-gray-800 space-y-2">
      <li>
        <span className="text-gray-500">Tren delantero:</span> {trenTxt(visita.tren_delantero)}
      </li>
      <li>
        <span className="text-gray-500">Alineado:</span> {boolTxt(visita.tren_alineado)}
      </li>
      <li>
        <span className="text-gray-500">Balanceo:</span> {boolTxt(visita.tren_balanceo)}
      </li>
      <li>
        <span className="text-gray-500">Amortiguadores:</span> {boolTxt(visita.amortiguadores_revisados)}
      </li>
      <li>
        <span className="text-gray-500">Auxilio:</span> {boolTxt(visita.auxilio_revisado)}
      </li>
      {visita.presupuesto?.trim() && (
        <li className="pt-2 border-t border-gray-100">
          <span className="text-gray-500 block mb-1">Presupuesto (texto)</span>
          <span className="whitespace-pre-wrap">{visita.presupuesto}</span>
        </li>
      )}
    </ul>
  );
}

export function InformeVisitaTaller({
  visitaId,
  presupuestoApiBase,
  habilitarArmarPresupuesto = false,
}: {
  visitaId: string;
  presupuestoApiBase: PresupuestoPdfApiBase;
  habilitarArmarPresupuesto?: boolean;
}) {
  const [visita, setVisita] = useState<InformeVisita | null>(null);
  const [presupuestoLineas, setPresupuestoLineas] = useState<PresupuestoLineaInforme[]>([]);
  const [preciosVendedor, setPreciosVendedor] = useState<Record<string, string>>({});
  const [modo, setModo] = useState<'informe' | 'presupuesto'>('informe');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [errorPdf, setErrorPdf] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    setError(false);
    try {
      const r = await apiClient.get<{
        visita: InformeVisita;
        presupuesto_lineas?: PresupuestoLineaInforme[];
      }>(`/mecanico/visitas/${visitaId}`);
      setVisita(r.visita);
      const lineas = mapLineasApi(r.presupuesto_lineas);
      setPresupuestoLineas(lineas);
      const preciosIniciales: Record<string, string> = {};
      for (const l of lineas) {
        if (l.marcado && l.precio != null) {
          preciosIniciales[l.item_catalogo_id] = String(Math.round(l.precio));
        }
      }
      setPreciosVendedor(preciosIniciales);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [visitaId]);

  const descargarPresupuesto = async () => {
    if (!visita) return;
    setDescargandoPdf(true);
    setErrorPdf(null);
    try {
      const patente = visita.vehiculos?.patente || 'sin-patente';
      const fallback = nombrePresupuestoPdf(patente, visita.created_at);
      await apiClient.downloadFile(
        `${presupuestoApiBase}/${visitaId}/presupuesto.pdf`,
        fallback,
      );
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'No se pudo descargar el presupuesto.';
      setErrorPdf(msg);
    } finally {
      setDescargandoPdf(false);
    }
  };

  const generarPresupuestoVendedor = async () => {
    if (!visita || presupuestoApiBase !== '/vendedor/visitas') return;
    setDescargandoPdf(true);
    setErrorPdf(null);
    try {
      const payload = lineasMarcadasParaApi(presupuestoLineas, preciosVendedor);
      const res = await apiClient.patch<{ presupuesto_lineas: PresupuestoLineaInforme[] }>(
        `/vendedor/visitas/${visitaId}/presupuesto`,
        { presupuesto_lineas: payload },
      );
      const lineas = mapLineasApi(res.presupuesto_lineas);
      setPresupuestoLineas(lineas);

      const patente = visita.vehiculos?.patente || 'sin-patente';
      const fallback = nombrePresupuestoPdf(patente, visita.created_at);
      await apiClient.downloadFile(
        `${presupuestoApiBase}/${visitaId}/presupuesto.pdf`,
        fallback,
      );
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'No se pudo generar el presupuesto.';
      setErrorPdf(msg);
    } finally {
      setDescargandoPdf(false);
    }
  };

  if (loading || error || !visita) {
    return (
      <div className="px-4 py-5 max-w-lg mx-auto lg:max-w-3xl">
        <PageState
          state={loading ? 'loading' : error ? 'error' : 'empty'}
          onRetry={cargar}
          emptyMessage="No se encontró la visita."
        />
      </div>
    );
  }

  const v = visita.vehiculos;
  const c = v?.clientes;
  const fotos = Array.isArray(visita.fotos_neumatico_urls) ? visita.fotos_neumatico_urls : [];
  const tieneParteGomero =
    visita.neumaticos_cambiados != null ||
    visita.km != null ||
    !!visita.marca_neumatico ||
    !!visita.medida_neumatico ||
    visita.presion_psi != null ||
    !!visita.observaciones_gomero;
  const ordenCerrada = visita.orden_estado === 'finalizado' || visita.orden_estado === 'incompleto';
  const usaPresupuestoNuevo = tienePresupuestoNuevoInforme(presupuestoLineas);
  const itemsMarcados = tieneItemsMarcadosInforme(presupuestoLineas);
  const mostrarModoPresupuesto = habilitarArmarPresupuesto && itemsMarcados;

  return (
    <div className="px-4 py-5 pb-24 flex flex-col gap-5 max-w-lg mx-auto lg:max-w-3xl">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Informe de orden</span>
        {visita.orden_estado ? (
          <BadgeOrdenEstado ordenEstado={visita.orden_estado} />
        ) : (
          <Badge variant="muted">Sin estado de orden</Badge>
        )}
        {!ordenCerrada && (
          <Badge variant={visita.estado === 'entregado' ? 'muted' : 'default'}>
            {visita.estado.replace(/_/g, ' ')}
          </Badge>
        )}
      </div>

      {mostrarModoPresupuesto && (
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setModo('informe')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
              modo === 'informe' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Informe completo
          </button>
          <button
            type="button"
            onClick={() => setModo('presupuesto')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
              modo === 'presupuesto' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Armar presupuesto
          </button>
        </div>
      )}

      {modo === 'presupuesto' && mostrarModoPresupuesto ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Presupuesto para el cliente
          </p>
          <PresupuestoVendedorEditor
            lineas={presupuestoLineas}
            precios={preciosVendedor}
            onPrecioChange={(itemId, valor) =>
              setPreciosVendedor((prev) => ({ ...prev, [itemId]: valor }))
            }
            operario={visita.operario_responsable}
            observaciones={visita.observaciones}
            onGenerarPdf={generarPresupuestoVendedor}
            generando={descargandoPdf}
            errorPdf={errorPdf}
          />
        </section>
      ) : (
        <>
      <div className="flex flex-col gap-2">
        {usaPresupuestoNuevo && (
          <>
            <button
              type="button"
              onClick={descargarPresupuesto}
              disabled={descargandoPdf}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8102E] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#a50d26] disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {descargandoPdf ? 'Generando PDF…' : 'Descargar presupuesto'}
            </button>
            {errorPdf && <p className="text-sm text-red-600">{errorPdf}</p>}
          </>
        )}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Vehículo y cliente</p>
        <p className="text-3xl font-black tracking-widest text-gray-900">{v?.patente}</p>
        <p className="text-gray-700 font-medium mt-1">
          {v?.marca} {v?.modelo}
          {v?.anio ? ` · ${v.anio}` : ''}
        </p>
        {v?.medida_rueda && <p className="text-sm text-gray-500 mt-1">Medida rueda: {v.medida_rueda}</p>}
        {c && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-gray-900">
                {c.nombre} {c.apellido}
              </p>
              <BadgeRangoEtario dni={c.dni} />
            </div>
            {c.dni && <p className="text-xs text-gray-500">DNI: {c.dni}</p>}
            {c.telefono && <p className="text-sm text-gray-600">{c.telefono}</p>}
            {c.email && <p className="text-sm text-gray-500">{c.email}</p>}
          </div>
        )}
      </section>

      {tieneParteGomero && (
        <section className="rounded-2xl border-2 border-amber-200 bg-amber-50/40 p-4">
          <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-3">Parte del gomero</p>
          <ul className="text-sm text-gray-800 space-y-2">
            <li>
              <span className="text-gray-500">Neumáticos cambiados:</span>{' '}
              {visita.neumaticos_cambiados === true ? 'Sí' : visita.neumaticos_cambiados === false ? 'No' : '—'}
            </li>
            <li>
              <span className="text-gray-500">Kilometraje:</span>{' '}
              {visita.km != null ? `${visita.km.toLocaleString('es-AR')} km` : '—'}
            </li>
            <li>
              <span className="text-gray-500">Marca:</span> {visita.marca_neumatico || '—'}
            </li>
            <li>
              <span className="text-gray-500">Medida:</span> {visita.medida_neumatico || '—'}
            </li>
            <li>
              <span className="text-gray-500">Presión:</span>{' '}
              {visita.presion_psi != null
                ? `${psiToBar(visita.presion_psi).toLocaleString('es-AR', { maximumFractionDigits: 1 })} BAR`
                : '—'}
            </li>
            {visita.observaciones_gomero && (
              <li className="pt-2 border-t border-amber-200/80">
                <span className="text-gray-500 block mb-1">Observaciones</span>
                <span className="text-gray-800 whitespace-pre-wrap">{visita.observaciones_gomero}</span>
              </li>
            )}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Parte del mecánico</p>
        {usaPresupuestoNuevo ? (
          <PresupuestoChecklistInforme lineas={presupuestoLineas} />
        ) : (
          <MecanicoLegacyInforme visita={visita} />
        )}

        {(visita.operario_responsable || visita.observaciones || visita.motivo) && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {visita.operario_responsable && (
              <p className="text-sm">
                <span className="text-gray-500 font-medium">Operario responsable:</span>{' '}
                <span className="text-gray-900 font-semibold">{visita.operario_responsable}</span>
              </p>
            )}
            {visita.observaciones && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Observaciones generales</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{visita.observaciones}</p>
              </div>
            )}
            {visita.motivo && (
              <p className="text-sm text-gray-600">
                <span className="text-gray-500">Motivo visita:</span> {visita.motivo}
              </p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Fotos</p>
        {fotos.length === 0 ? (
          <p className="text-sm text-gray-500">Sin fotos cargadas.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {fotos.map((src, i) => (
              <a
                key={i}
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
              >
                <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Etapas y horarios</p>
        <ul className="text-sm space-y-2">
          <li className="flex justify-between gap-3">
            <span className="text-gray-500">Visita creada</span>
            <span className="font-medium text-gray-900 text-right">{fmt(visita.created_at)}</span>
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-gray-500">Enviada al mecánico</span>
            <span className="font-medium text-gray-900 text-right">{fmt(visita.enviado_al_mecanico_at)}</span>
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-gray-500">Mecánico tomó la orden</span>
            <span className="font-medium text-gray-900 text-right">{fmt(visita.mecanico_tomo_at)}</span>
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-gray-500">Última actualización</span>
            <span className="font-medium text-gray-900 text-right">{fmt(visita.updated_at)}</span>
          </li>
        </ul>
      </section>
        </>
      )}
    </div>
  );
}
