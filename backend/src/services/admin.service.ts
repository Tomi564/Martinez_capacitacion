/**
 * admin.service.ts — Lógica de negocio del panel de administración
 *
 * Responsabilidades:
 *  - Dashboard con métricas globales
 *  - CRUD de vendedores
 *  - CRUD de módulos
 *  - Reportes de progreso y calificaciones
 */

import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { modulosService } from './modulos.service';
import bcrypt from 'bcryptjs';

interface ActorAuditoria {
  id: string;
  rol?: string;
}

/** Fila devuelta por RPC `admin_dashboard_resumen`. */
interface AdminDashboardVendedorRow {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  modulos_aprobados?: number | null;
  total_modulos?: number | null;
  promedio_notas?: number | null;
  ultima_actividad?: string | null;
}

export interface DashboardVendedorResumen {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  modulosAprobados: number;
  totalModulos: number;
  promedioNotas: number;
  ultimaActividad: string | null;
}

/** Fila RPC `admin_reportes_progreso`. */
interface AdminReporteProgresoRow {
  nombre?: string | null;
  apellido?: string | null;
  email: string;
  modulos_aprobados?: number | null;
  total_modulos?: number | null;
  porcentaje?: number | null;
  promedio_notas?: number | null;
  total_intentos?: number | null;
  fecha_ultima_actividad?: string | null;
}

/** Fila RPC `admin_reportes_calificaciones`. */
interface AdminReporteCalificacionesRow {
  nombre?: string | null;
  apellido?: string | null;
  email: string;
  promedio?: number | null;
  promedio_vendedor?: number | null;
  promedio_empresa?: number | null;
  total_calificaciones?: number | null;
  estrellas5?: number | null;
  estrellas4?: number | null;
  estrellas3?: number | null;
  estrellas2?: number | null;
  estrellas1?: number | null;
  vendedor5?: number | null;
  vendedor4?: number | null;
  vendedor3?: number | null;
  vendedor2?: number | null;
  vendedor1?: number | null;
  empresa5?: number | null;
  empresa4?: number | null;
  empresa3?: number | null;
  empresa2?: number | null;
  empresa1?: number | null;
}

export interface ReporteProgresoItem {
  vendedor: string;
  email: string;
  modulosAprobados: number;
  totalModulos: number;
  porcentaje: number;
  promedioNotas: number;
  totalIntentos: number;
  fechaUltimaActividad: string | null;
}

export interface ReporteCalificacionesItem {
  vendedor: string;
  email: string;
  promedio: number;
  promedioVendedor: number;
  promedioEmpresa: number;
  totalCalificaciones: number;
  estrellas5: number;
  estrellas4: number;
  estrellas3: number;
  estrellas2: number;
  estrellas1: number;
  vendedor5: number;
  vendedor4: number;
  vendedor3: number;
  vendedor2: number;
  vendedor1: number;
  empresa5: number;
  empresa4: number;
  empresa3: number;
  empresa2: number;
  empresa1: number;
}

export class AdminService {
  private async registrarAuditoria(params: {
    actor?: ActorAuditoria;
    accion: string;
    entidad: string;
    entidadId?: string | null;
    datosAnteriores?: unknown;
    datosNuevos?: unknown;
  }) {
    if (!params.actor?.id) return;
    await supabase.rpc('registrar_auditoria_operacional', {
      p_usuario_id: params.actor.id,
      p_rol: params.actor.rol || 'admin',
      p_accion: params.accion,
      p_entidad: params.entidad,
      p_entidad_id: params.entidadId || null,
      p_datos_anteriores: (params.datosAnteriores ?? null) as any,
      p_datos_nuevos: (params.datosNuevos ?? null) as any,
    });
  }

  /**
   * Lista eventos de auditoría operacional (panel admin).
   */
  async listAuditoriaOperacional(params: {
    desde?: string;
    hasta?: string;
    rol?: string;
    accion?: string;
    limit: number;
    offset: number;
  }) {
    const { desde, hasta, rol, accion, limit, offset } = params;

    let query = supabase
      .from('auditoria_operacional')
      .select(
        `
        id, usuario_id, rol, accion, entidad, entidad_id, datos_anteriores, datos_nuevos, created_at,
        users!auditoria_operacional_usuario_id_fkey(nombre, apellido, email)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (rol) query = query.eq('rol', rol);
    if (accion) query = query.eq('accion', accion);
    if (desde) {
      query = query.gte('created_at', new Date(`${desde}T00:00:00.000Z`).toISOString());
    }
    if (hasta) {
      query = query.lte('created_at', new Date(`${hasta}T23:59:59.999Z`).toISOString());
    }

    const { data, error, count } = await query;
    if (error) throw new AppError('Error al obtener auditoría operacional', 500);

    return {
      eventos: data || [],
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Dashboard con métricas globales del sistema.
   */
  async getDashboard() {
    const { data, error } = await supabase.rpc('admin_dashboard_resumen');
    if (error) throw new AppError('Error al obtener dashboard', 500);

    const vendedores: DashboardVendedorResumen[] = (data || []).map((row: AdminDashboardVendedorRow) => ({
      id: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      email: row.email,
      modulosAprobados: Number(row.modulos_aprobados || 0),
      totalModulos: Number(row.total_modulos || 0),
      promedioNotas: Math.round(Number(row.promedio_notas || 0) * 10) / 10,
      ultimaActividad: row.ultima_actividad || null,
    }));

    const totalModulos = vendedores[0]?.totalModulos || 0;
    const vendedoresCompletos = vendedores.filter(
      (v) => v.modulosAprobados === totalModulos && totalModulos > 0
    ).length;
    const promedioGeneral =
      vendedores.length > 0
        ? vendedores.reduce((acc, v) => acc + v.promedioNotas, 0) / vendedores.length
        : 0;

    return {
      totalVendedores: vendedores.length,
      totalModulos,
      vendedoresCompletos,
      promedioGeneral: Math.round(promedioGeneral * 10) / 10,
      vendedores,
    };
  }

  /**
   * Lista todos los vendedores con su progreso.
   */
  async getVendedores() {
    const { data: vendedores, error } = await supabase
      .from('users')
      .select('id, nombre, apellido, email, activo, created_at')
      .eq('rol', 'vendedor')
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Error al obtener vendedores', 500);

    // Total de módulos activos
    const { data: modulos } = await supabase
      .from('modulos')
      .select('id')
      .eq('activo', true);

    const totalModulos = modulos?.length || 0;

    // Progreso de todos
    const { data: progresos } = await supabase
      .from('progreso')
      .select('user_id, estado, mejor_nota')
      .eq('estado', 'aprobado');

    const vendedoresConProgreso = (vendedores || []).map((vendedor) => {
      const progresoVendedor = (progresos || []).filter(
        (p) => p.user_id === vendedor.id
      );

      const modulosAprobados = progresoVendedor.length;

      const notasValidas = progresoVendedor
        .map((p) => p.mejor_nota)
        .filter((n) => n > 0);

      const promedioNotas =
        notasValidas.length > 0
          ? notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length
          : 0;

      return {
        ...vendedor,
        modulosAprobados,
        totalModulos,
        promedioNotas: Math.round(promedioNotas * 10) / 10,
      };
    });

    return { vendedores: vendedoresConProgreso };
  }

  /**
   * Crea un nuevo vendedor e inicializa su progreso.
   */
  async crearVendedor(data: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
  }) {
    // Verificar que el email no esté en uso
    const { data: existente } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email.toLowerCase().trim())
      .single();

    if (existente) {
      throw new AppError('Ya existe un usuario con ese email', 400);
    }

    // Validar longitud mínima de contraseña
    if (data.password.length < 8) {
      throw new AppError('La contraseña debe tener al menos 8 caracteres', 400);
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Crear usuario
    const { data: nuevoUsuario, error } = await supabase
      .from('users')
      .insert({
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        email: data.email.toLowerCase().trim(),
        password_hash: passwordHash,
        rol: 'vendedor',
        activo: true,
      })
      .select('id')
      .single();

    if (error || !nuevoUsuario) {
      throw new AppError('Error al crear el vendedor', 500);
    }

    // Inicializar progreso para todos los módulos activos
    await modulosService.inicializarProgreso(nuevoUsuario.id);

    return { mensaje: 'Vendedor creado correctamente', id: nuevoUsuario.id };
  }

  /**
   * Actualiza el estado activo/inactivo de un vendedor.
   */
  async updateVendedor(
    vendedorId: string,
    data: { activo?: boolean },
    actor?: ActorAuditoria
  ) {
    const { data: antes } = await supabase
      .from('users')
      .select('id, nombre, apellido, email, activo, updated_at')
      .eq('id', vendedorId)
      .eq('rol', 'vendedor')
      .single();

    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', vendedorId)
      .eq('rol', 'vendedor');

    if (error) throw new AppError('Error al actualizar el vendedor', 500);

    const { data: despues } = await supabase
      .from('users')
      .select('id, nombre, apellido, email, activo, updated_at')
      .eq('id', vendedorId)
      .eq('rol', 'vendedor')
      .single();

    await this.registrarAuditoria({
      actor,
      accion: data.activo === false ? 'desactivar_vendedor' : 'editar_vendedor',
      entidad: 'vendedor',
      entidadId: vendedorId,
      datosAnteriores: antes || null,
      datosNuevos: despues || null,
    });

    return { mensaje: 'Vendedor actualizado correctamente' };
  }

  /**
   * Lista todos los módulos (activos e inactivos) para el admin.
   */
  async getModulos() {
    const { data: modulos, error } = await supabase
      .from('modulos')
      .select('id, titulo, descripcion, orden, duracion_min, activo, video_url, pdf_url, nota_aprobacion, porcentaje_aprobacion, created_at')
      .order('orden', { ascending: true });

    if (error) throw new AppError('Error al obtener módulos', 500);

    return { modulos: modulos || [] };
  }

  /**
   * Crea un nuevo módulo e inicializa el progreso de todos
   * los vendedores existentes para ese módulo.
   */
  async crearModulo(data: {
    titulo: string;
    descripcion: string;
    orden: number;
    duracion_min: number;
  }) {
    // Verificar que el orden no esté en uso
    const { data: existente } = await supabase
      .from('modulos')
      .select('id')
      .eq('orden', data.orden)
      .single();

    if (existente) {
      throw new AppError(
        `Ya existe un módulo con el orden ${data.orden}`,
        400
      );
    }

    // Crear módulo
    const { data: nuevoModulo, error } = await supabase
      .from('modulos')
      .insert({
        titulo: data.titulo.trim(),
        descripcion: data.descripcion.trim(),
        orden: data.orden,
        duracion_min: data.duracion_min,
        activo: true,
      })
      .select('id')
      .single();

    if (error || !nuevoModulo) {
      throw new AppError('Error al crear el módulo', 500);
    }

    // Inicializar progreso para todos los vendedores activos
    const { data: vendedores } = await supabase
      .from('users')
      .select('id')
      .eq('rol', 'vendedor')
      .eq('activo', true);

    if (vendedores?.length) {
      const registros = vendedores.map((v) => ({
        user_id: v.id,
        modulo_id: nuevoModulo.id,
        // Si es el primer módulo, disponible; si no, bloqueado
        estado: data.orden === 1 ? 'disponible' : 'bloqueado',
        intentos: 0,
        mejor_nota: 0,
      }));

      await supabase.from('progreso').insert(registros);
    }

    return { mensaje: 'Módulo creado correctamente', id: nuevoModulo.id };
  }

  /**
   * Actualiza un módulo (activo/inactivo, título, etc.)
   */
  async updateModulo(
    moduloId: string,
    data: Partial<{
      titulo: string;
      descripcion: string;
      duracion_min: number;
      activo: boolean;
      video_url: string;
      pdf_url: string;
    }>,
    actor?: ActorAuditoria
  ) {
    const { data: antes } = await supabase
      .from('modulos')
      .select('id, titulo, descripcion, duracion_min, activo, video_url, pdf_url, nota_aprobacion, porcentaje_aprobacion, updated_at')
      .eq('id', moduloId)
      .single();

    const { error } = await supabase
      .from('modulos')
      .update(data)
      .eq('id', moduloId);

    if (error) throw new AppError('Error al actualizar el módulo', 500);

    const { data: despues } = await supabase
      .from('modulos')
      .select('id, titulo, descripcion, duracion_min, activo, video_url, pdf_url, nota_aprobacion, porcentaje_aprobacion, updated_at')
      .eq('id', moduloId)
      .single();

    await this.registrarAuditoria({
      actor,
      accion: 'editar_modulo',
      entidad: 'modulo',
      entidadId: moduloId,
      datosAnteriores: antes || null,
      datosNuevos: despues || null,
    });

    return { mensaje: 'Módulo actualizado correctamente' };
  }

  /**
   * Reportes completos de progreso y calificaciones.
   */
  async getReportes(): Promise<{
    progreso: ReporteProgresoItem[];
    calificaciones: ReporteCalificacionesItem[];
  }> {
    const [{ data: progresoRows, error: progresoError }, { data: calificacionesRows, error: calificacionesError }] =
      await Promise.all([
        supabase.rpc('admin_reportes_progreso'),
        supabase.rpc('admin_reportes_calificaciones'),
      ]);

    if (progresoError) throw new AppError('Error al obtener reporte de progreso', 500);
    if (calificacionesError) throw new AppError('Error al obtener reporte de calificaciones', 500);

    const reporteProgreso: ReporteProgresoItem[] = (progresoRows || []).map((row: AdminReporteProgresoRow) => ({
      vendedor: `${row.nombre || ''} ${row.apellido || ''}`.trim(),
      email: row.email,
      modulosAprobados: Number(row.modulos_aprobados || 0),
      totalModulos: Number(row.total_modulos || 0),
      porcentaje: Number(row.porcentaje || 0),
      promedioNotas: Math.round(Number(row.promedio_notas || 0) * 10) / 10,
      totalIntentos: Number(row.total_intentos || 0),
      fechaUltimaActividad: row.fecha_ultima_actividad || null,
    }));

    const reporteCalificaciones: ReporteCalificacionesItem[] = (calificacionesRows || []).map(
      (row: AdminReporteCalificacionesRow) => ({
      vendedor: `${row.nombre || ''} ${row.apellido || ''}`.trim(),
      email: row.email,
      promedio: Math.round(Number(row.promedio || 0) * 10) / 10,
      promedioVendedor: Math.round(Number(row.promedio_vendedor || 0) * 10) / 10,
      promedioEmpresa: Math.round(Number(row.promedio_empresa || 0) * 10) / 10,
      totalCalificaciones: Number(row.total_calificaciones || 0),
      estrellas5: Number(row.estrellas5 || 0),
      estrellas4: Number(row.estrellas4 || 0),
      estrellas3: Number(row.estrellas3 || 0),
      estrellas2: Number(row.estrellas2 || 0),
      estrellas1: Number(row.estrellas1 || 0),
      vendedor5: Number(row.vendedor5 || 0),
      vendedor4: Number(row.vendedor4 || 0),
      vendedor3: Number(row.vendedor3 || 0),
      vendedor2: Number(row.vendedor2 || 0),
      vendedor1: Number(row.vendedor1 || 0),
      empresa5: Number(row.empresa5 || 0),
      empresa4: Number(row.empresa4 || 0),
      empresa3: Number(row.empresa3 || 0),
      empresa2: Number(row.empresa2 || 0),
      empresa1: Number(row.empresa1 || 0),
    })
    );

    return {
      progreso: reporteProgreso,
      calificaciones: reporteCalificaciones,
    };
  }

  /**
   * Obtiene un módulo con todas sus preguntas (para el admin).
   */
  async getModuloById(moduloId: string) {
    const { data: modulo, error } = await supabase
      .from('modulos')
      .select('*')
      .eq('id', moduloId)
      .single();

    if (error || !modulo) {
      throw new AppError('Módulo no encontrado', 404);
    }

    // Obtener preguntas incluyendo respuesta_correcta (solo para admin)
    const { data: preguntas } = await supabase
      .from('preguntas')
      .select('id, enunciado, opciones, respuesta_correcta, explicacion, tipo, puntaje')
      .eq('modulo_id', moduloId)
      .eq('activo', true)
      .order('created_at', { ascending: true });

    return { modulo: { ...modulo, preguntas: preguntas || [] } };
  }

  /**
   * Crea una nueva pregunta en el banco de un módulo.
   */
  async crearPregunta(
    moduloId: string,
    data: {
      enunciado: string;
      opciones: { id: string; texto: string }[];
      respuesta_correcta: string;
      explicacion?: string;
      tipo?: 'opcion_unica' | 'verdadero_falso' | 'caso_practico' | 'desarrollo';
      puntaje?: number;
    }
  ) {
    // Verificar que el módulo existe
    const { data: modulo } = await supabase
      .from('modulos')
      .select('id')
      .eq('id', moduloId)
      .single();

    if (!modulo) throw new AppError('Módulo no encontrado', 404);

    // Verificar que la respuesta correcta corresponde a una opción válida
    if (data.tipo !== 'desarrollo') {
      const opcionValida = data.opciones.find(
        (o) => o.id === data.respuesta_correcta
      );
      if (!opcionValida) {
        throw new AppError(
          'La respuesta correcta debe corresponder a una de las opciones',
          400
        );
      }
    }

    const { error } = await supabase.from('preguntas').insert({
      modulo_id: moduloId,
      enunciado: data.enunciado.trim(),
      opciones: data.opciones,
      respuesta_correcta: data.respuesta_correcta,
      explicacion: data.explicacion?.trim() || null,
      tipo: data.tipo || 'opcion_unica',
      puntaje: data.puntaje ?? 1,
      activo: true,
    });

    if (error) throw new AppError('Error al crear la pregunta', 500);

    return { mensaje: 'Pregunta creada correctamente' };
  }

  /**
   * Actualiza una pregunta del banco.
   */
  async updatePregunta(
    preguntaId: string,
    data: Partial<{
      activo: boolean;
      enunciado: string;
      opciones: { id: string; texto: string }[];
      respuesta_correcta: string;
      explicacion: string | null;
      tipo: 'opcion_unica' | 'verdadero_falso' | 'caso_practico' | 'desarrollo';
      puntaje: number;
    }>
  ) {
    if (data.tipo && data.tipo !== 'desarrollo' && data.opciones && data.respuesta_correcta) {
      const opcionValida = data.opciones.find((o) => o.id === data.respuesta_correcta);
      if (!opcionValida) {
        throw new AppError('La respuesta correcta debe corresponder a una opción válida', 400);
      }
    }

    const { error } = await supabase
      .from('preguntas')
      .update(data)
      .eq('id', preguntaId);

    if (error) throw new AppError('Error al actualizar la pregunta', 500);

    return { mensaje: 'Pregunta actualizada correctamente' };
  }

  /**
   * Obtiene el detalle completo de un vendedor con su progreso y calificaciones.
   */
  async getVendedorById(vendedorId: string) {
    // Datos del vendedor
    const { data: vendedor, error } = await supabase
      .from('users')
      .select('id, nombre, apellido, email, activo, created_at')
      .eq('id', vendedorId)
      .eq('rol', 'vendedor')
      .single();

    if (error || !vendedor) {
      throw new AppError('Vendedor no encontrado', 404);
    }

    // Progreso con nombre del módulo
    const { data: progresos } = await supabase
      .from('progreso')
      .select(`
        modulo_id,
        estado,
        mejor_nota,
        intentos,
        completado_at,
        modulos (
          titulo,
          orden
        )
      `)
      .eq('user_id', vendedorId);

    const progreso = (progresos || []).map((p: any) => ({
      modulo_id: p.modulo_id,
      modulo_titulo: p.modulos?.titulo || '',
      modulo_orden: p.modulos?.orden || 0,
      estado: p.estado,
      mejor_nota: p.mejor_nota || 0,
      intentos: p.intentos || 0,
      completado_at: p.completado_at,
    }));

    // Calificaciones
    const { data: calificaciones } = await supabase
      .from('calificaciones_qr')
      .select('estrellas, estrellas_vendedor, estrellas_empresa, comentario, created_at')
      .eq('vendedor_id', vendedorId);

    const total = calificaciones?.length || 0;
    const sumaVendedor = (calificaciones || []).reduce(
      (acc, c: any) => acc + (c.estrellas_vendedor ?? c.estrellas), 0
    );
    const sumaEmpresa = (calificaciones || []).reduce(
      (acc, c: any) => acc + (c.estrellas_empresa ?? c.estrellas), 0
    );
    const distribucion: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
    };
    (calificaciones || []).forEach((c: any) => {
      const estrellaVendedor = c.estrellas_vendedor ?? c.estrellas;
      distribucion[estrellaVendedor] = (distribucion[estrellaVendedor] || 0) + 1;
    });

    const ultimas5 = [...(calificaciones || [])]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((c: any) => ({
        fecha: c.created_at,
        estrellasVendedor: c.estrellas_vendedor ?? c.estrellas,
        estrellasEmpresa: c.estrellas_empresa ?? c.estrellas,
        comentario: c.comentario || null,
      }));

    return {
      vendedor: {
        ...vendedor,
        progreso,
        calificaciones: {
          promedio: total > 0 ? Math.round((sumaVendedor / total) * 10) / 10 : 0,
          promedioVendedor: total > 0 ? Math.round((sumaVendedor / total) * 10) / 10 : 0,
          promedioEmpresa: total > 0 ? Math.round((sumaEmpresa / total) * 10) / 10 : 0,
          total,
          distribucion,
          ultimas5,
        },
      },
    };
  }

  /**
   * Cambia la contraseña de un vendedor.
   */
  async resetPasswordVendedor(vendedorId: string, nuevaContrasena: string) {
    const passwordHash = await bcrypt.hash(nuevaContrasena, 12);

    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', vendedorId)
      .eq('rol', 'vendedor');

    if (error) throw new AppError('Error al cambiar la contraseña', 500);

    return { mensaje: 'Contraseña actualizada correctamente' };
  }

  /**
   * Desactiva un vendedor (soft delete — preserva historial).
   */
  async eliminarVendedor(vendedorId: string, actor?: ActorAuditoria) {
    const { data: antes } = await supabase
      .from('users')
      .select('id, nombre, apellido, email, activo, updated_at')
      .eq('id', vendedorId)
      .eq('rol', 'vendedor')
      .single();

    const { error } = await supabase
      .from('users')
      .update({ activo: false })
      .eq('id', vendedorId)
      .eq('rol', 'vendedor');

    if (error) throw new AppError('Error al desactivar el vendedor', 500);

    const { data: despues } = await supabase
      .from('users')
      .select('id, nombre, apellido, email, activo, updated_at')
      .eq('id', vendedorId)
      .eq('rol', 'vendedor')
      .single();

    await this.registrarAuditoria({
      actor,
      accion: 'desactivar_vendedor',
      entidad: 'vendedor',
      entidadId: vendedorId,
      datosAnteriores: antes || null,
      datosNuevos: despues || null,
    });

    return { mensaje: 'Vendedor desactivado correctamente' };
  }

  /**
   * Reinicia el progreso de un vendedor a estado inicial
   * (módulo 1 = disponible, resto = bloqueado, intentos = 0, mejor_nota = 0).
   */
  async resetProgresoVendedor(vendedorId: string) {
    // Verificar que el vendedor existe
    const { data: vendedor } = await supabase
      .from('users')
      .select('id')
      .eq('id', vendedorId)
      .eq('rol', 'vendedor')
      .single();

    if (!vendedor) throw new AppError('Vendedor no encontrado', 404);

    // Eliminar todo el progreso existente
    const { error: deleteError } = await supabase
      .from('progreso')
      .delete()
      .eq('user_id', vendedorId);

    if (deleteError) throw new AppError('Error al reiniciar el progreso', 500);

    // Re-inicializar desde cero
    await modulosService.inicializarProgreso(vendedorId);

    return { mensaje: 'Progreso reiniciado correctamente' };
  }

  /**
   * Desactiva un módulo (soft delete — preserva historial de exámenes).
   */
  async eliminarModulo(moduloId: string) {
    const { error } = await supabase
      .from('modulos')
      .update({ activo: false })
      .eq('id', moduloId);

    if (error) throw new AppError('Error al desactivar el módulo', 500);

    return { mensaje: 'Módulo desactivado correctamente' };
  }
}

export const adminService = new AdminService();