import { supabase } from '../config/database';

type VisitaDiagCampos = {
  tren_delantero?: string | null;
  presion_psi?: number | null;
  presupuesto?: string | null;
  fotos_neumatico_urls?: string[] | null;
  estado_neumaticos?: string | null;
  estado_frenos?: string | null;
  recomendacion?: string | null;
  diagnostico_enviado?: boolean | null;
  tren_alineado?: boolean | null;
  tren_balanceo?: boolean | null;
  amortiguadores_revisados?: boolean | null;
  auxilio_revisado?: boolean | null;
};

function tieneDiagnosticoLegacy(v: VisitaDiagCampos): boolean {
  if (v.diagnostico_enviado) return true;
  if (v.tren_delantero) return true;
  if (v.presion_psi != null) return true;
  if (v.presupuesto?.trim()) return true;
  if (v.estado_neumaticos?.trim()) return true;
  if (v.estado_frenos?.trim()) return true;
  if (v.recomendacion?.trim()) return true;
  if (v.tren_alineado || v.tren_balanceo || v.amortiguadores_revisados || v.auxilio_revisado) {
    return true;
  }
  return Array.isArray(v.fotos_neumatico_urls) && v.fotos_neumatico_urls.length > 0;
}

/** True si la visita tiene checklist, presupuesto por ítems o campos de diagnóstico cargados. */
export async function visitaTieneDiagnosticoCargado(visitaId: string): Promise<boolean> {
  const [checklistRes, lineasRes, visitaRes] = await Promise.all([
    supabase
      .from('checklist_respuestas')
      .select('id', { count: 'exact', head: true })
      .eq('visita_id', visitaId),
    supabase
      .from('visita_presupuesto_lineas')
      .select('id', { count: 'exact', head: true })
      .eq('visita_id', visitaId)
      .eq('marcado', true),
    supabase
      .from('visitas_taller')
      .select(
        'tren_delantero, presion_psi, presupuesto, fotos_neumatico_urls, estado_neumaticos, estado_frenos, recomendacion, diagnostico_enviado, tren_alineado, tren_balanceo, amortiguadores_revisados, auxilio_revisado',
      )
      .eq('id', visitaId)
      .maybeSingle(),
  ]);

  if ((checklistRes.count ?? 0) > 0) return true;
  if ((lineasRes.count ?? 0) > 0) return true;
  if (visitaRes.data && tieneDiagnosticoLegacy(visitaRes.data)) return true;
  return false;
}
