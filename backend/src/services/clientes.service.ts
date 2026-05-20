/**
 * clientes.service.ts — Búsqueda y listados de clientes (taller, QR, ventas)
 */

import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { validarDatosCliente } from '../utils/validarCliente';

export interface ClienteInput {
  nombre?: string;
  apellido?: string;
  email?: string;
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

export class ClientesService {
  /**
   * Sugerencias para autocompletar en el formulario de atenciones.
   */
  async buscarSugerencias(q: string, limit = 12) {
    const term = q.trim();
    if (term.length < 2) {
      return { sugerencias: [] as SugerenciaCliente[] };
    }

    const esc = term.replace(/,/g, '').replace(/%/g, '');
    const pattern = `%${esc}%`;
    const orClientes = `nombre.ilike.${pattern},apellido.ilike.${pattern},email.ilike.${pattern},telefono.ilike.${pattern},dni.ilike.${pattern}`;
    const orQr = `nombre.ilike.${pattern},apellido.ilike.${pattern},dni.ilike.${pattern},contacto.ilike.${pattern}`;

    const [clientesRes, qrRes] = await Promise.all([
      supabase
        .from('clientes')
        .select('id, nombre, apellido, dni, telefono, email')
        .or(orClientes)
        .order('nombre', { ascending: true })
        .limit(limit),
      supabase
        .from('participantes_sorteo')
        .select('id, nombre, apellido, dni, contacto')
        .or(orQr)
        .order('nombre', { ascending: true })
        .limit(limit),
    ]);

    if (clientesRes.error) {
      throw new AppError('Error al buscar clientes', 500);
    }
    if (qrRes.error) {
      throw new AppError('Error al buscar participantes QR', 500);
    }

    const sugerencias: SugerenciaCliente[] = [];

    for (const c of clientesRes.data || []) {
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

    for (const p of qrRes.data || []) {
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
  async resolverClienteParaAtencion(input: {
    cliente_id?: string | null;
    cliente: ClienteInput;
    participante_qr_id?: string | null;
  }): Promise<string> {
    const datos = validarDatosCliente(input.cliente);

    if (input.cliente_id) {
      const { data, error } = await supabase
        .from('clientes')
        .select('id')
        .eq('id', input.cliente_id)
        .maybeSingle();
      if (error) throw new AppError('Error al validar el cliente', 500);
      if (!data) throw new AppError('El cliente seleccionado no existe', 400);

      await supabase
        .from('clientes')
        .update({
          nombre: datos.nombre,
          apellido: datos.apellido,
          telefono: datos.telefono,
          email: datos.email,
        })
        .eq('id', data.id);

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
          await supabase
            .from('clientes')
            .update({
              nombre: datos.nombre,
              apellido: datos.apellido,
              telefono: datos.telefono,
              email: datos.email,
            })
            .eq('id', porDni.id);
          return porDni.id;
        }
      }
    }

    const { data: porTel } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefono', datos.telefono)
      .maybeSingle();
    if (porTel) {
      await supabase
        .from('clientes')
        .update({
          nombre: datos.nombre,
          apellido: datos.apellido,
          email: datos.email,
        })
        .eq('id', porTel.id);
      return porTel.id;
    }

    const { data: porEmail } = await supabase
      .from('clientes')
      .select('id')
      .ilike('email', datos.email)
      .maybeSingle();
    if (porEmail) {
      await supabase
        .from('clientes')
        .update({
          nombre: datos.nombre,
          apellido: datos.apellido,
          telefono: datos.telefono,
        })
        .eq('id', porEmail.id);
      return porEmail.id;
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
}

export const clientesService = new ClientesService();
