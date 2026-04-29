import { supabase } from '../config/database';

type RankingFila = {
  user_id: string;
  nombre: string;
  posicion: number;
  ventas: number;
  monto: number;
};

function ahoraArgentina() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Salta' }));
}

function inicioSemanaLunes(fecha: Date) {
  const copia = new Date(fecha);
  const dia = copia.getDay(); // 0 domingo
  const delta = dia === 0 ? -6 : 1 - dia;
  copia.setDate(copia.getDate() + delta);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function rankingActivoAhora(fecha: Date) {
  const dia = fecha.getDay(); // 0=dom, 6=sab
  const hora = fecha.getHours();
  if (dia === 0) return false; // domingo congelado
  if (dia === 6 && hora >= 18) return false; // cierre sábado 18:00
  return true;
}

async function pushUsuario(userId: string, titulo: string, cuerpo: string) {
  try {
    const vapidConfigured = !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;
    if (!vapidConfigured) return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webpush = require('web-push') as typeof import('web-push');
    webpush.setVapidDetails(
      'mailto:admin@martinez.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );

    const { data: suscripciones } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (!suscripciones?.length) return;

    const payload = JSON.stringify({ titulo, cuerpo });
    await Promise.allSettled(
      suscripciones.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
        } catch {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        }
      }),
    );
  } catch {
    // silencioso
  }
}

async function logRankingNotificacion(params: {
  tipo: 'te_superaron' | 'subiste_posicion' | 'cierre_semanal' | 'reinicio_lunes';
  userId: string;
  titulo: string;
  cuerpo: string;
  payload?: Record<string, unknown>;
}) {
  await supabase.from('ranking_notificaciones_log').insert({
    user_id: params.userId,
    tipo: params.tipo,
    titulo: params.titulo,
    cuerpo: params.cuerpo,
    payload: params.payload || {},
  });
}

async function obtenerRankingSemana(fechaBase: Date): Promise<RankingFila[]> {
  const lunes = inicioSemanaLunes(fechaBase);
  const { data: vendedores } = await supabase
    .from('users')
    .select('id, nombre, apellido')
    .eq('rol', 'vendedor')
    .eq('activo', true);

  const { data: atenciones } = await supabase
    .from('atenciones')
    .select('user_id, monto')
    .eq('resultado', 'venta_cerrada')
    .gte('created_at', lunes.toISOString())
    .lte('created_at', fechaBase.toISOString());

  const ranking = (vendedores || []).map((v) => {
    const ventas = (atenciones || []).filter((a) => a.user_id === v.id);
    return {
      user_id: v.id,
      nombre: `${v.nombre} ${v.apellido}`,
      posicion: 0,
      ventas: ventas.length,
      monto: ventas.reduce((acc, a) => acc + (a.monto || 0), 0),
    };
  });

  ranking.sort((a, b) => {
    if (b.ventas !== a.ventas) return b.ventas - a.ventas;
    return b.monto - a.monto;
  });

  ranking.forEach((r, idx) => {
    r.posicion = idx + 1;
  });

  return ranking;
}

async function guardarSnapshotSemana(fechaBase: Date, ranking: RankingFila[]) {
  const semanaInicio = inicioSemanaLunes(fechaBase).toISOString().slice(0, 10);
  if (!ranking.length) return;

  await supabase
    .from('ranking_estado_semanal')
    .upsert(
      ranking.map((r) => ({
        semana_inicio: semanaInicio,
        user_id: r.user_id,
        posicion: r.posicion,
        ventas: r.ventas,
        monto: r.monto,
      })),
      { onConflict: 'semana_inicio,user_id' },
    );
}

async function obtenerSnapshotSemana(fechaBase: Date) {
  const semanaInicio = inicioSemanaLunes(fechaBase).toISOString().slice(0, 10);
  const { data } = await supabase
    .from('ranking_estado_semanal')
    .select('user_id, posicion, ventas')
    .eq('semana_inicio', semanaInicio);
  return data || [];
}

export async function procesarCambioRankingPorVenta() {
  const ahora = ahoraArgentina();
  if (!rankingActivoAhora(ahora)) return;

  const rankingActual = await obtenerRankingSemana(ahora);
  const snapshot = await obtenerSnapshotSemana(ahora);
  const prevMap = new Map(snapshot.map((s) => [s.user_id, s.posicion]));
  const nowMap = new Map(rankingActual.map((r) => [r.user_id, r.posicion]));

  const subieron = rankingActual.filter((r) => {
    const prevPos = prevMap.get(r.user_id);
    return prevPos && r.posicion < prevPos;
  });

  for (const v of subieron) {
    const titulo = '🔼 Subiste de posición';
    const cuerpo = `🔼 Subiste al puesto ${v.posicion} en el ranking. ¡Seguí así!`;
    await pushUsuario(v.user_id, titulo, cuerpo);
    await logRankingNotificacion({
      tipo: 'subiste_posicion',
      userId: v.user_id,
      titulo,
      cuerpo,
      payload: { posicion: v.posicion, ventas: v.ventas },
    });
  }

  const bajaron = rankingActual.filter((r) => {
    const prevPos = prevMap.get(r.user_id);
    return prevPos && r.posicion > prevPos;
  });

  for (const superado of bajaron) {
    const prevPosSuperado = prevMap.get(superado.user_id)!;
    const superador = subieron.find((cand) => {
      const prevPosCand = prevMap.get(cand.user_id);
      if (!prevPosCand) return false;
      return prevPosCand > prevPosSuperado && cand.posicion < superado.posicion;
    });
    if (!superador) continue;

    const titulo = '⚡ Te superaron en el ranking';
    const cuerpo = `⚡ ${superador.nombre} te superó en el ranking. ¡Seguí vendiendo!`;
    await pushUsuario(superado.user_id, titulo, cuerpo);
    await logRankingNotificacion({
      tipo: 'te_superaron',
      userId: superado.user_id,
      titulo,
      cuerpo,
      payload: { superador: superador.nombre, posicionActual: nowMap.get(superado.user_id) },
    });
  }

  await guardarSnapshotSemana(ahora, rankingActual);
}

export async function enviarCierreSemanalRanking() {
  const ahora = ahoraArgentina();
  const ranking = await obtenerRankingSemana(ahora);

  for (const fila of ranking) {
    const titulo = '📊 Cierre semanal del ranking';
    const cuerpo = `📊 El ranking cerró. Quedaste ${fila.posicion}° con ${fila.ventas} ventas. ¡Buen trabajo!`;
    await pushUsuario(fila.user_id, titulo, cuerpo);
    await logRankingNotificacion({
      tipo: 'cierre_semanal',
      userId: fila.user_id,
      titulo,
      cuerpo,
      payload: { posicion: fila.posicion, ventas: fila.ventas },
    });
  }

  await guardarSnapshotSemana(ahora, ranking);
}

export async function enviarReinicioLunesRanking() {
  const ahora = ahoraArgentina();
  const { data: vendedores } = await supabase
    .from('users')
    .select('id')
    .eq('rol', 'vendedor')
    .eq('activo', true);

  if (!vendedores?.length) return;

  for (const vendedor of vendedores) {
    const titulo = '🏁 Nuevo ranking semanal';
    const cuerpo = '🏁 Nuevo ranking, nueva semana. ¡A vender!';
    await pushUsuario(vendedor.id, titulo, cuerpo);
    await logRankingNotificacion({
      tipo: 'reinicio_lunes',
      userId: vendedor.id,
      titulo,
      cuerpo,
    });
  }

  const semanaInicio = inicioSemanaLunes(ahora).toISOString().slice(0, 10);
  await supabase.from('ranking_estado_semanal').delete().eq('semana_inicio', semanaInicio);
}

