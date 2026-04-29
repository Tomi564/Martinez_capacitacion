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

export class AdminService {
  /**
   * Dashboard con métricas globales del sistema.
   */
  async getDashboard() {
    // Total de vendedores activos
    const { data: vendedores, error: vendedoresError } = await supabase
      .from('users')
      .select('id, nombre, apellido, email')
      .eq('rol', 'vendedor')
      .eq('activo', true);

    if (vendedoresError) throw new AppError('Error al obtener vendedores', 500);

    // Total de módulos activos
    const { data: modulos, error: modulosError } = await supabase
      .from('modulos')
      .select('id')
      .eq('activo', true);

    if (modulosError) throw new AppError('Error al obtener módulos', 500);

    const totalModulos = modulos?.length || 0;

    // Progreso de todos los vendedores
    const { data: progresos } = await supabase
      .from('progreso')
      .select('user_id, estado, mejor_nota, ultimo_intento')
      .eq('estado', 'aprobado');

    // Calcular métricas por vendedor
    const vendedoresConProgreso = await Promise.all(
      (vendedores || []).map(async (vendedor) => {
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

        const ultimaActividad =
          progresoVendedor
            .map((p) => p.ultimo_intento)
            .filter(Boolean)
            .sort()
            .reverse()[0] || null;

        return {
          id: vendedor.id,
          nombre: vendedor.nombre,
          apellido: vendedor.apellido,
          email: vendedor.email,
          modulosAprobados,
          totalModulos,
          promedioNotas: Math.round(promedioNotas * 10) / 10,
          ultimaActividad,
        };
      })
    );

    // Vendedores que completaron todos los módulos
    const vendedoresCompletos = vendedoresConProgreso.filter(
      (v) => v.modulosAprobados === totalModulos && totalModulos > 0
    ).length;

    // Promedio general de notas
    const todasLasNotas = vendedoresConProgreso
      .map((v) => v.promedioNotas)
      .filter((n) => n > 0);

    const promedioGeneral =
      todasLasNotas.length > 0
        ? todasLasNotas.reduce((a, b) => a + b, 0) / todasLasNotas.length
        : 0;

    return {
      totalVendedores: vendedores?.length || 0,
      totalModulos,
      vendedoresCompletos,
      promedioGeneral: Math.round(promedioGeneral * 10) / 10,
      vendedores: vendedoresConProgreso,
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
    data: { activo?: boolean }
  ) {
    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', vendedorId)
      .eq('rol', 'vendedor');

    if (error) throw new AppError('Error al actualizar el vendedor', 500);

    return { mensaje: 'Vendedor actualizado correctamente' };
  }

  /**
   * Lista todos los módulos (activos e inactivos) para el admin.
   */
  async getModulos() {
    const { data: modulos, error } = await supabase
      .from('modulos')
      .select('*')
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
    }>
  ) {
    const { error } = await supabase
      .from('modulos')
      .update(data)
      .eq('id', moduloId);

    if (error) throw new AppError('Error al actualizar el módulo', 500);

    return { mensaje: 'Módulo actualizado correctamente' };
  }

  /**
   * Reportes completos de progreso y calificaciones.
   */
  async getReportes() {
    // Obtener todos los vendedores
    const { data: vendedores } = await supabase
      .from('users')
      .select('id, nombre, apellido, email')
      .eq('rol', 'vendedor')
      .order('apellido', { ascending: true });

    // Total módulos
    const { data: modulos } = await supabase
      .from('modulos')
      .select('id')
      .eq('activo', true);

    const totalModulos = modulos?.length || 0;

    // Progreso de todos
    const { data: progresos } = await supabase
      .from('progreso')
      .select('user_id, estado, mejor_nota, ultimo_intento, intentos');

    // Calificaciones de todos
    const { data: calificaciones } = await supabase
      .from('calificaciones_qr')
      .select('vendedor_id, estrellas, estrellas_vendedor, estrellas_empresa');

    // Construir reporte de progreso
    const reporteProgreso = (vendedores || []).map((vendedor) => {
      const progresoVendedor = (progresos || []).filter(
        (p) => p.user_id === vendedor.id
      );

      const aprobados = progresoVendedor.filter(
        (p) => p.estado === 'aprobado'
      );

      const notasValidas = aprobados
        .map((p) => p.mejor_nota)
        .filter((n) => n > 0);

      const promedioNotas =
        notasValidas.length > 0
          ? notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length
          : 0;

      const totalIntentos = progresoVendedor.reduce(
        (acc, p) => acc + (p.intentos || 0),
        0
      );

      const ultimaActividad =
        progresoVendedor
          .map((p) => p.ultimo_intento)
          .filter(Boolean)
          .sort()
          .reverse()[0] || null;

      return {
        vendedor: `${vendedor.nombre} ${vendedor.apellido}`,
        email: vendedor.email,
        modulosAprobados: aprobados.length,
        totalModulos,
        porcentaje:
          totalModulos > 0
            ? Math.round((aprobados.length / totalModulos) * 100)
            : 0,
        promedioNotas: Math.round(promedioNotas * 10) / 10,
        totalIntentos,
        fechaUltimaActividad: ultimaActividad,
      };
    });

    // Construir reporte de calificaciones
    const reporteCalificaciones = (vendedores || []).map((vendedor) => {
      const calificacionesVendedor = (calificaciones || []).filter(
        (c) => c.vendedor_id === vendedor.id
      );

      const total = calificacionesVendedor.length;
      const suma = calificacionesVendedor.reduce(
        (acc, c: any) => acc + (c.estrellas_vendedor ?? c.estrellas),
        0
      );

      const sumaEmpresa = calificacionesVendedor.reduce(
        (acc, c: any) => acc + (c.estrellas_empresa ?? c.estrellas),
        0
      );

      const contarEstrellas = (n: number) =>
        calificacionesVendedor.filter((c) => c.estrellas === n).length;

      return {
        vendedor: `${vendedor.nombre} ${vendedor.apellido}`,
        email: vendedor.email,
        promedio: total > 0 ? Math.round((suma / total) * 10) / 10 : 0,
        promedioVendedor: total > 0 ? Math.round((suma / total) * 10) / 10 : 0,
        promedioEmpresa: total > 0 ? Math.round((sumaEmpresa / total) * 10) / 10 : 0,
        totalCalificaciones: total,
        estrellas5: contarEstrellas(5),
        estrellas4: contarEstrellas(4),
        estrellas3: contarEstrellas(3),
        estrellas2: contarEstrellas(2),
        estrellas1: contarEstrellas(1),
        vendedor5: calificacionesVendedor.filter((c: any) => (c.estrellas_vendedor ?? c.estrellas) === 5).length,
        vendedor4: calificacionesVendedor.filter((c: any) => (c.estrellas_vendedor ?? c.estrellas) === 4).length,
        vendedor3: calificacionesVendedor.filter((c: any) => (c.estrellas_vendedor ?? c.estrellas) === 3).length,
        vendedor2: calificacionesVendedor.filter((c: any) => (c.estrellas_vendedor ?? c.estrellas) === 2).length,
        vendedor1: calificacionesVendedor.filter((c: any) => (c.estrellas_vendedor ?? c.estrellas) === 1).length,
        empresa5: calificacionesVendedor.filter((c: any) => (c.estrellas_empresa ?? c.estrellas) === 5).length,
        empresa4: calificacionesVendedor.filter((c: any) => (c.estrellas_empresa ?? c.estrellas) === 4).length,
        empresa3: calificacionesVendedor.filter((c: any) => (c.estrellas_empresa ?? c.estrellas) === 3).length,
        empresa2: calificacionesVendedor.filter((c: any) => (c.estrellas_empresa ?? c.estrellas) === 2).length,
        empresa1: calificacionesVendedor.filter((c: any) => (c.estrellas_empresa ?? c.estrellas) === 1).length,
      };
    });

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
  async eliminarVendedor(vendedorId: string) {
    const { error } = await supabase
      .from('users')
      .update({ activo: false })
      .eq('id', vendedorId)
      .eq('rol', 'vendedor');

    if (error) throw new AppError('Error al desactivar el vendedor', 500);

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