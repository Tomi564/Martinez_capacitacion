/**
 * clientes.service.ts — Búsqueda y listados de clientes (taller, QR, ventas)
 */

import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { validarDatosCliente, type ClienteDatosValidados } from '../utils/validarCliente';

export interface ClienteInput {
  nombre?: string;
  apellido?: string;
  email?: string | null;
  telefono?: string;
}

export interface SugerenciaCliente {
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

function etiquetaSugerencia(
  nombre: string,
  apellido: string,
  telefono: string | null,
  email: string | null,
  extra?: string
): string {
  const partes = [`${nombre} ${apellido}`.trim()];
  if (telefono) partes.push(telefono);
  if (email) partes.push(email);
  if (extra) partes.push(extra);
  return partes.filter(Boolean).join(' · ');
}

type SupabaseErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function textoErrorPostgres(err: SupabaseErrorLike): string {
  return `${err.message ?? ''} ${err.details ?? ''} ${err.hint ?? ''}`.toLowerCase();
}

function esViolacionUnica(err: SupabaseErrorLike): boolean {
  if (err.code === '23505') return true;
  const t = textoErrorPostgres(err);
  return t.includes('duplicate key') || t.includes('unique constraint');
}

function mapErrorActualizacionCliente(err: SupabaseErrorLike): AppError {
  if (esViolacionUnica(err)) {
    const t = textoErrorPostgres(err);
    if (t.includes('email') || t.includes('mail')) {
      return new AppError('Ya existe otro cliente con ese mail', 400);
    }
    if (t.includes('telefono') || t.includes('phone')) {
      return new AppError('Ya existe otro cliente con ese teléfono', 400);
    }
    if (t.includes('dni')) {
      return new AppError('Ya existe otro cliente con ese DNI', 400);
    }
    return new AppError('Ya existe otro cliente con ese teléfono, mail o DNI', 400);
  }
  if (err.code === '23514' || textoErrorPostgres(err).includes('check constraint')) {
    return new AppError('Los datos del cliente no son válidos (revisá el mail)', 400);
  }
  console.error('[ClientesService] Error actualizando cliente', {
    code: err.code,
    message: err.message,
    details: err.details,
    hint: err.hint,
  });
  return new AppError('Error al actualizar datos del cliente', 500);
}

/** maybeSingle con 0 o 2+ filas: loguear y seguir (insert / siguiente criterio). */
function logBusquedaClienteAmbigua(
  criterio: 'telefono' | 'email',
  valor: string,
  error: SupabaseErrorLike,
): void {
  console.warn('[ClientesService] Búsqueda de cliente ambigua o fallida, se continúa', {
    criterio,
    valor,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

export type ActualizarClienteOpts = {
  /** No actualizar teléfono (evita unique en prod si hay duplicados). */
  omitirTelefono?: boolean;
};

/** Payload de update: no envía email vacío/null para no violar NOT NULL ni borrar sin intención. */
function buildClienteUpdatePayload(
  datos: ClienteDatosValidados,
  opts?: ActualizarClienteOpts,
): Record<string, string | null> {
  const payload: Record<string, string | null> = {
    nombre: datos.nombre,
    apellido: datos.apellido,
  };
  if (!opts?.omitirTelefono) {
    payload.telefono = datos.telefono || null;
  }
  if (datos.email) {
    payload.email = datos.email;
  }
  return payload;
}

async function actualizarClientePorId(
  clienteId: string,
  datos: ClienteDatosValidados,
  opts?: ActualizarClienteOpts,
): Promise<void> {
  if (datos.telefono && !opts?.omitirTelefono) {
    const { data: conflicto, error: conflictoErr } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefono', datos.telefono)
      .neq('id', clienteId)
      .maybeSingle();
    if (conflictoErr) {
      console.warn('[ClientesService] No se pudo validar unicidad de teléfono, se continúa', {
        clienteId,
        telefono: datos.telefono,
        code: conflictoErr.code,
        message: conflictoErr.message,
      });
    } else if (conflicto) {
      throw new AppError('Ya existe otro cliente con ese teléfono', 400);
    }
  }

  const payload = buildClienteUpdatePayload(datos, opts);

  // Corregir mail inválido en DB: actualizar email primero (CHECK/unique suelen fallar si el row queda inconsistente).
  if (datos.email) {
    const { error: emailErr } = await supabase
      .from('clientes')
      .update({ email: datos.email })
      .eq('id', clienteId);
    if (emailErr) {
      throw mapErrorActualizacionCliente(emailErr);
    }
  }

  const resto: Record<string, string | null> = {
    nombre: payload.nombre,
    apellido: payload.apellido,
  };
  if (payload.telefono !== undefined) {
    resto.telefono = payload.telefono;
  }

  const { error: updErr } = await supabase.from('clientes').update(resto).eq('id', clienteId);

  if (updErr) {
    throw mapErrorActualizacionCliente(updErr);
  }
}

/** Cliente IDs con al menos una atención del vendedor (opcional: restringir a un subconjunto). */
export async function clienteIdsConAtencionesVendedor(
  vendedorId: string,
  soloIds?: string[],
): Promise<Set<string>> {
  let query = supabase
    .from('atenciones')
    .select('cliente_id')
    .eq('user_id', vendedorId)
    .not('cliente_id', 'is', null);

  if (soloIds?.length) {
    query = query.in('cliente_id', soloIds);
  }

  const { data, error } = await query;
  if (error) return new Set();
  return new Set(
    (data || []).map((r) => r.cliente_id as string).filter(Boolean),
  );
}

export class ClientesService {
  /**
   * Sugerencias para autocompletar en el formulario de atenciones.
   * Vendedor: solo clientes con atenciones propias y participantes QR propios.
   */
  async buscarSugerencias(
    q: string,
    limit = 12,
    opts?: { vendedorId?: string },
  ) {
    const term = q.trim();
    const soloDigitos = term.replace(/\D/g, '');
    const esSoloTelefono = soloDigitos.length > 0 && soloDigitos.length === term.replace(/\s/g, '').length;

    if (term.includes('@')) {
      return { sugerencias: [] as SugerenciaCliente[] };
    }

    if (esSoloTelefono) {
      if (soloDigitos.length < 6) {
        return { sugerencias: [] as SugerenciaCliente[] };
      }
    } else if (term.length < 4) {
      return { sugerencias: [] as SugerenciaCliente[] };
    }

    const esc = term.replace(/,/g, '').replace(/%/g, '');
    const pattern = `%${esc}%`;
    const orClientes = `nombre.ilike.${pattern},apellido.ilike.${pattern},telefono.ilike.${pattern},dni.ilike.${pattern}`;
    const orQr = esSoloTelefono
      ? `nombre.ilike.${pattern},apellido.ilike.${pattern},dni.ilike.${pattern},contacto.ilike.${pattern}`
      : `nombre.ilike.${pattern},apellido.ilike.${pattern},dni.ilike.${pattern}`;

    let clienteIdsVendedor: string[] | null = null;
    if (opts?.vendedorId) {
      const ids = await clienteIdsConAtencionesVendedor(opts.vendedorId);
      if (!ids.size) {
        clienteIdsVendedor = [];
      } else {
        clienteIdsVendedor = [...ids];
      }
    }

    type ClienteSugerenciaRow = {
      id: string;
      nombre: string;
      apellido: string;
      dni: string | null;
      telefono: string | null;
      email: string | null;
    };

    let clientesData: ClienteSugerenciaRow[] = [];

    if (clienteIdsVendedor === null || clienteIdsVendedor.length > 0) {
      let clientesQuery = supabase
        .from('clientes')
        .select('id, nombre, apellido, dni, telefono, email')
        .or(orClientes)
        .order('nombre', { ascending: true })
        .limit(limit);

      if (clienteIdsVendedor !== null) {
        clientesQuery = clientesQuery.in('id', clienteIdsVendedor);
      }

      const { data, error } = await clientesQuery;
      if (error) {
        throw new AppError('Error al buscar clientes', 500);
      }
      clientesData = data || [];
    }

    let qrQuery = supabase
      .from('participantes_sorteo')
      .select('id, nombre, apellido, dni, contacto')
      .or(orQr)
      .order('nombre', { ascending: true })
      .limit(limit);

    if (opts?.vendedorId) {
      qrQuery = qrQuery.eq('vendedor_id', opts.vendedorId);
    }

    const { data: qrData, error: qrError } = await qrQuery;

    if (qrError) {
      throw new AppError('Error al buscar participantes QR', 500);
    }

    const sugerencias: SugerenciaCliente[] = [];

    for (const c of clientesData) {
      sugerencias.push({
        tipo: 'cliente',
        id: c.id,
        nombre: c.nombre,
        apellido: c.apellido,
        telefono: c.telefono,
        email: c.email,
        dni: c.dni,
        contacto: null,
        etiqueta: etiquetaSugerencia(c.nombre, c.apellido, c.telefono, c.email, 'Taller / sistema'),
      });
    }

    for (const p of qrData || []) {
      sugerencias.push({
        tipo: 'qr',
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        telefono: null,
        email: null,
        dni: p.dni,
        contacto: p.contacto,
        etiqueta: etiquetaSugerencia(p.nombre, p.apellido, null, null, `QR · ${p.contacto}`),
      });
    }

    return { sugerencias: sugerencias.slice(0, limit) };
  }

  /**
   * Resuelve cliente_id al crear/editar atención: vincula existente o crea en clientes.
   */
  async resolverClienteParaAtencion(
    input: {
      cliente_id?: string | null;
      cliente: ClienteInput | ClienteDatosValidados;
      participante_qr_id?: string | null;
    },
    opts?: { mutarDatosCliente?: boolean; omitirTelefonoEnUpdate?: boolean },
  ): Promise<string> {
    const datos = validarDatosCliente(input.cliente);
    const mutarDatosCliente = opts?.mutarDatosCliente !== false;
    const updateOpts: ActualizarClienteOpts | undefined = opts?.omitirTelefonoEnUpdate
      ? { omitirTelefono: true }
      : undefined;

    if (input.cliente_id) {
      const { data, error } = await supabase
        .from('clientes')
        .select('id')
        .eq('id', input.cliente_id)
        .maybeSingle();
      if (error) throw new AppError('Error al validar el cliente', 500);
      if (!data) throw new AppError('El cliente seleccionado no existe', 400);

      if (mutarDatosCliente) {
        await actualizarClientePorId(data.id, datos, updateOpts);
      }

      return data.id;
    }

    if (input.participante_qr_id) {
      const { data: p, error } = await supabase
        .from('participantes_sorteo')
        .select('id, dni')
        .eq('id', input.participante_qr_id)
        .maybeSingle();
      if (error) throw new AppError('Error al validar participante QR', 500);
      if (!p) throw new AppError('Participante QR no encontrado', 400);

      if (p.dni) {
        const { data: porDni } = await supabase
          .from('clientes')
          .select('id')
          .eq('dni', p.dni)
          .maybeSingle();
        if (porDni) {
          if (mutarDatosCliente) {
            await actualizarClientePorId(porDni.id, datos, updateOpts);
          }
          return porDni.id;
        }
      }
    }

    if (datos.telefono) {
      const { data: porTel, error: telErr } = await supabase
        .from('clientes')
        .select('id')
        .eq('telefono', datos.telefono)
        .maybeSingle();
      if (telErr) {
        logBusquedaClienteAmbigua('telefono', datos.telefono, telErr);
      } else if (porTel) {
        if (mutarDatosCliente) {
          await actualizarClientePorId(porTel.id, datos, updateOpts);
        }
        return porTel.id;
      }
    }

    if (datos.email) {
      const { data: porEmail, error: emailErr } = await supabase
        .from('clientes')
        .select('id')
        .ilike('email', datos.email)
        .maybeSingle();
      if (emailErr) {
        logBusquedaClienteAmbigua('email', datos.email, emailErr);
      } else if (porEmail) {
        if (mutarDatosCliente) {
          await actualizarClientePorId(porEmail.id, datos, updateOpts);
        }
        return porEmail.id;
      }
    }

    const dniQr = input.participante_qr_id
      ? (
          await supabase
            .from('participantes_sorteo')
            .select('dni')
            .eq('id', input.participante_qr_id)
            .maybeSingle()
        ).data?.dni ?? null
      : null;

    const { data: creado, error } = await supabase
      .from('clientes')
      .insert({
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        telefono: datos.telefono,
        dni: dniQr,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Ya existe un cliente con ese teléfono, mail o DNI', 400);
      }
      throw new AppError('Error al crear el cliente', 500);
    }

    return creado.id;
  }

  /**
   * Clientes vinculados a atenciones (pestaña Ventas).
   */
  async listarClientesVentas(vendedorId?: string) {
    let query = supabase
      .from('atenciones')
      .select(
        `
        id,
        canal,
        resultado,
        producto,
        monto,
        created_at,
        user_id,
        cliente_id,
        clientes (
          id,
          nombre,
          apellido,
          dni,
          telefono,
          email
        ),
        users (
          nombre,
          apellido
        )
      `
      )
      .not('cliente_id', 'is', null)
      .order('created_at', { ascending: false });

    if (vendedorId) {
      query = query.eq('user_id', vendedorId);
    }

    const { data, error } = await query;
    if (error) throw new AppError('Error al listar clientes de ventas', 500);

    type RowAtencion = {
      id: string;
      canal: string;
      resultado: string;
      producto: string | null;
      monto: number | null;
      created_at: string;
      clientes: {
        id: string;
        nombre: string;
        apellido: string;
        dni: string | null;
        telefono: string | null;
        email: string | null;
      } | null;
      users: { nombre: string; apellido: string } | null;
    };

    const porCliente = new Map<
      string,
      {
        cliente: NonNullable<RowAtencion['clientes']>;
        atenciones: Array<{
          id: string;
          canal: string;
          resultado: string;
          producto: string | null;
          monto: number | null;
          created_at: string;
          vendedor: string | null;
        }>;
      }
    >();

    for (const row of (data || []) as unknown as RowAtencion[]) {
      const c = row.clientes;
      if (!c?.id) continue;

      const u = row.users;
      const entry = porCliente.get(c.id) || { cliente: c, atenciones: [] };
      entry.atenciones.push({
        id: row.id,
        canal: row.canal,
        resultado: row.resultado,
        producto: row.producto,
        monto: row.monto,
        created_at: row.created_at,
        vendedor: u ? `${u.nombre} ${u.apellido}` : null,
      });
      porCliente.set(c.id, entry);
    }

    const clientes = Array.from(porCliente.values())
      .map((item) => ({
        ...item.cliente,
        total_atenciones: item.atenciones.length,
        ultima_atencion: item.atenciones[0]?.created_at || null,
        atenciones: item.atenciones,
      }))
      .sort((a, b) => {
        const ta = a.ultima_atencion ? new Date(a.ultima_atencion).getTime() : 0;
        const tb = b.ultima_atencion ? new Date(b.ultima_atencion).getTime() : 0;
        return tb - ta;
      });

    return { clientes };
  }

  async dependenciasCliente(clienteId: string, opts?: { vendedorId?: string }) {
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', clienteId)
      .maybeSingle();
    if (error || !cliente) throw new AppError('Cliente no encontrado', 404);

    if (opts?.vendedorId) {
      const { count: propias, error: aErr } = await supabase
        .from('atenciones')
        .select('id', { count: 'exact', head: true })
        .eq('cliente_id', clienteId)
        .eq('user_id', opts.vendedorId);
      if (aErr) throw new AppError('Error al verificar el cliente', 500);
      if (!propias) throw new AppError('Cliente no encontrado', 404);
    }

    const [{ count: vehiculos }, { count: atenciones }, vehiculosIdsRes] = await Promise.all([
      supabase.from('vehiculos').select('id', { count: 'exact', head: true }).eq('cliente_id', clienteId),
      supabase.from('atenciones').select('id', { count: 'exact', head: true }).eq('cliente_id', clienteId),
      supabase.from('vehiculos').select('id').eq('cliente_id', clienteId),
    ]);

    let visitas = 0;
    const vehiculoIds = (vehiculosIdsRes.data || []).map((v) => v.id);
    if (vehiculoIds.length > 0) {
      const { count } = await supabase
        .from('visitas_taller')
        .select('id', { count: 'exact', head: true })
        .in('vehiculo_id', vehiculoIds);
      visitas = count || 0;
    }

    return {
      vehiculos: vehiculos || 0,
      atenciones: atenciones || 0,
      visitas,
    };
  }

  async eliminarCliente(clienteId: string, opts?: { vendedorId?: string }) {
    const { data: anterior, error: readErr } = await supabase
      .from('clientes')
      .select('id, nombre, apellido, dni, telefono, email')
      .eq('id', clienteId)
      .maybeSingle();
    if (readErr || !anterior) throw new AppError('Cliente no encontrado', 404);

    if (opts?.vendedorId) {
      const { count: propias, error: pErr } = await supabase
        .from('atenciones')
        .select('id', { count: 'exact', head: true })
        .eq('cliente_id', clienteId)
        .eq('user_id', opts.vendedorId);
      if (pErr) throw new AppError('Error al verificar el cliente', 500);
      if (!propias) throw new AppError('Cliente no encontrado', 404);

      const { count: ajenas, error: aErr } = await supabase
        .from('atenciones')
        .select('id', { count: 'exact', head: true })
        .eq('cliente_id', clienteId)
        .neq('user_id', opts.vendedorId);
      if (aErr) throw new AppError('Error al verificar el cliente', 500);
      if ((ajenas || 0) > 0) {
        throw new AppError(
          'No podés eliminar un cliente que también tiene atenciones de otros vendedores.',
          403,
        );
      }
    }

    const { error } = await supabase.from('clientes').delete().eq('id', clienteId);
    if (error) throw new AppError('Error al eliminar cliente', 500);

    return { mensaje: 'Cliente eliminado', anterior };
  }
}

export const clientesService = new ClientesService();
