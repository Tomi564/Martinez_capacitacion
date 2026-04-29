-- =====================================================
-- 015_examen_modulo_10_certificacion_final.sql
-- Carga banco de preguntas del Modulo 10 (segun PDF oficial)
-- Requiere migracion 011 (preguntas.tipo + preguntas.puntaje)
-- =====================================================

begin;

delete from preguntas
where modulo_id = (
  select id from modulos where orden = 10 limit 1
);

insert into preguntas (modulo_id, enunciado, opciones, respuesta_correcta, tipo, puntaje, activo)
select
  m.id,
  q.enunciado,
  q.opciones::jsonb,
  q.respuesta_correcta,
  q.tipo,
  q.puntaje::numeric,
  true
from modulos m
cross join (
  values
  (
    'Un cliente pregunta: "Por que deberia venir a Martinez Neumaticos en lugar de ir a la gomeria del barrio?" Cual es la respuesta que mejor representa la propuesta de valor de la empresa segun el Modulo 1?',
    '[{"id":"a","texto":"Porque tenemos mas anos de experiencia y precios competitivos."},{"id":"b","texto":"Porque somos un centro de servicio automotriz integral: su auto entra con un problema y sale resuelto, todo en el mismo lugar, con personal propio y garantia."},{"id":"c","texto":"Porque la familia Martinez trabaja en el negocio y eso genera una atencion mas personalizada."},{"id":"d","texto":"Porque tenemos las mejores marcas del mercado y equipos de ultima tecnologia."}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Un cliente con un auto familiar que hace 1.500 km mensuales entre ciudad y ruta, con lluvia frecuente en su zona, tiene presupuesto razonable y no discute precio. Segun el portafolio del Modulo 2, cual es la primera opcion y el argumento principal?',
    '[{"id":"a","texto":"Pirelli - Lo mejor disponible. Seguridad y rendimiento sin compromisos."},{"id":"b","texto":"Falken - Rendimiento y estetica que acompanan el perfil del vehiculo para uso mixto."},{"id":"c","texto":"Continental - Menor distancia de frenado en mojado. Disenada para proteger lo que mas importa en ruta con lluvia."},{"id":"d","texto":"Dunlop - Calidad premium a precio de entrada. Tecnologia DECTES para mayor duracion."}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    'Un cliente llega a instalar cuatro neumaticos nuevos. Al revisar el vehiculo, el vendedor detecta desgaste pronunciado en el lado interno de los dos neumaticos delanteros, y que uno de los traseros tiene un corte visible en el flanco. Cual es el orden correcto de acciones segun los Modulos 2 y 3?',
    '[{"id":"a","texto":"Instalar los cuatro neumaticos nuevos, luego hacer alineacion y recomendar revision del trasero daniado."},{"id":"b","texto":"Informar al cliente del corte en el trasero, recomendar revision de tren delantero antes de la alineacion, y proceder con el cambio de los cuatro mas alineacion y balanceo."},{"id":"c","texto":"Hacer la alineacion primero, luego instalar los neumaticos, y recomendar el trasero daniado como opcional."},{"id":"d","texto":"Instalar solo los delanteros ahora y recomendar al cliente volver en una semana para el trasero."}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Cual es la diferencia entre el cierre de un neumatico que tiene 4 mm de profundidad de dibujo y uno que tiene 1.6 mm, y como debe comunicarselo el vendedor al cliente que dice que "todavia anda"?',
    '[{"id":"a","texto":"No hay diferencia legal: ambos son aptos para circular en Argentina."},{"id":"b","texto":"El de 4 mm esta en condicion de uso normal; el de 1.6 mm esta en el limite legal minimo de seguridad. Debe comunicarlo con evidencia visual y riesgo real en lluvia."},{"id":"c","texto":"Solo importa el desgaste visual de la banda: si el dibujo se ve, el neumatico esta bien."},{"id":"d","texto":"El vendedor no debe mencionar el limite legal para no presionar al cliente."}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Cual de los siguientes describe correctamente los 5 valores de Martinez Neumaticos segun el Modulo 1?',
    '[{"id":"a","texto":"Calidad, Precio competitivo, Servicio rapido, Atencion personalizada, Garantia."},{"id":"b","texto":"Calidad, Honestidad, Compromiso con el cliente, Trabajo en equipo, Capacitacion continua."},{"id":"c","texto":"Confianza, Profesionalismo, Innovacion, Trabajo en equipo, Satisfaccion del cliente."},{"id":"d","texto":"Honestidad, Puntualidad, Calidad, Experiencia, Fidelizacion."}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Un cliente de seguridad con familia llega al local. El vendedor recomienda Continental con datos tecnicos, pero el cliente al final dice: "Esta bien, lo pienso." Que modulos indica que el vendedor no aplico correctamente y que debio hacer?',
    '[{"id":"a","texto":"Solo el Modulo 6: no manejo la objecion con E.V.A."},{"id":"b","texto":"Modulos 4, 5 y 6: no conecto emocionalmente, no adapto argumento al perfil y no descubrio la objecion real antes de que se fuera."},{"id":"c","texto":"Solo el Modulo 4: hablo solo de forma tecnica."},{"id":"d","texto":"Solo el Modulo 5: no identifico correctamente el perfil."}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Un vendedor aplica SPIN con un cliente que hace ruta Salta-Jujuy todos los dias con carga variable. Tras preguntas S y P, el cliente dice que los neumaticos se ven gastados pero no tuvo problemas. Cual es la siguiente pregunta correcta?',
    '[{"id":"a","texto":"Pregunta N: Si tuvieras neumaticos nuevos, te daria mas tranquilidad para los viajes?"},{"id":"b","texto":"Pregunta I: Si el desgaste sigue asi, cuanto tiempo mas crees que van a aguantar? Eso te genera alguna preocupacion para los viajes de carga?"},{"id":"c","texto":"Pregunta S: Con que frecuencia haces el viaje Salta-Jujuy por semana?"},{"id":"d","texto":"Recomendacion directa: Para ese uso te recomiendo Cargo Power por la durabilidad."}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Un cliente dice: "En internet los consigo $4.000 mas baratos por unidad." El vendedor responde comparando servicios incluidos. Que paso del E.V.A. omitio?',
    '[{"id":"a","texto":"No omitio ninguno: la respuesta es correcta y completa."},{"id":"b","texto":"Omitio Escuchar completo: respondio antes de que el cliente terminara de explicar su objecion."},{"id":"c","texto":"Omitio Validar: no reconocio que la objecion era legitima."},{"id":"d","texto":"Omitio Aportar: la informacion no resuelve la objecion."}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Cuales son las cuatro motivaciones emocionales universales en la compra de neumaticos segun el Modulo 4, y cual activa la frase: "Para lo que me contaste de sus viajes frecuentes, yo elegiria este porque frena mejor en lluvia"?',
    '[{"id":"a","texto":"Seguridad, confort, economia, velocidad. Activa economia."},{"id":"b","texto":"Seguridad, tranquilidad, economia, pertenencia/orgullo. Activa seguridad."},{"id":"c","texto":"Seguridad, confianza, precio, estetica. Activa confianza."},{"id":"d","texto":"Tranquilidad, economia, durabilidad, marca. Activa tranquilidad."}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Segun el Modulo 6, cuales son los 5 obstaculos de Zig Ziglar que impiden la compra, y cual se activa cuando el cliente dice: "No conozco esa marca, no se si me va a dar resultado"?',
    '[{"id":"a","texto":"No hay necesidad, no hay dinero, no hay prisa, no hay deseo, no hay confianza. Se activa no hay confianza."},{"id":"b","texto":"No hay necesidad, no hay presupuesto, no hay urgencia, no hay interes, no hay experiencia. Se activa no hay experiencia."},{"id":"c","texto":"No hay necesidad, no hay dinero, no hay prisa, no hay deseo, no hay confianza. Se activa no hay deseo."},{"id":"d","texto":"No hay tiempo, no hay dinero, no hay urgencia, no hay informacion, no hay confianza. Se activa no hay informacion."}]',
    'a',
    'opcion_unica',
    1
  ),
  (
    'Son las 10:15 de un martes. Un cliente escribe por WhatsApp: "Hola, busco neumaticos para mi auto. Cuanto salen los 185/65 R15?" El vendedor tiene tres clientes presenciales en ese momento. Que debe hacer segun los Modulos 7 y 9?',
    '[{"id":"a","texto":"Ignorar el mensaje hasta tener tiempo: los presenciales son prioridad absoluta."},{"id":"b","texto":"Acusar recibo de inmediato (Hola, en un momento te respondo) y responder completo antes de 10 minutos."},{"id":"c","texto":"Responder solo con el precio para no perder al cliente digital."},{"id":"d","texto":"Transferir la consulta al supervisor."}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Un vendedor revisa su panel del viernes: 28 consultas en la semana, 6 ventas (21%). WhatsApp 15/5 (33%), ML 10/1 (10%), Presencial 3/0 (0%). Tiempo de respuesta ML: 28 minutos promedio. Cual es la UNA accion para la semana siguiente segun Modulo 8?',
    '[{"id":"a","texto":"Mejorar protocolo presencial por ser el peor porcentaje."},{"id":"b","texto":"Reducir tiempo de respuesta en ML a menos de 10 minutos por impacto potencial y causa probable del bajo cierre."},{"id":"c","texto":"Aumentar volumen total de consultas para que suba conversion automaticamente."},{"id":"d","texto":"Mejorar objeciones en WhatsApp aunque ya convierte bien."}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Segun los Modulos 8 y 9, que KPI del programa indica que el vendedor esta listo para candidatarse al nivel Elite?',
    '[{"id":"a","texto":"Tasa de conversion mayor al 35% y calificacion promedio mayor a 4.5 estrellas durante 3 meses consecutivos."},{"id":"b","texto":"Tasa de conversion mayor al 25% y calificacion promedio mayor a 4.2 estrellas durante 1 mes."},{"id":"c","texto":"Todos los modulos aprobados con nota mayor al 95% y calificacion promedio mayor a 4.0."},{"id":"d","texto":"Nivel Profesional activo durante 6 meses consecutivos sin sanciones disciplinarias."}]',
    'a',
    'opcion_unica',
    1
  ),
  (
    'Segun el Modulo 9, que sucede si el cliente que retira su auto esta claramente insatisfecho con algo y el vendedor igualmente le solicita la calificacion QR?',
    '[{"id":"a","texto":"Es el momento correcto: permite capturar feedback negativo."},{"id":"b","texto":"Es un error: casi garantiza una resena negativa y refuerza que solo importan los numeros. Primero hay que resolver la insatisfaccion."},{"id":"c","texto":"Depende del nivel de insatisfaccion."},{"id":"d","texto":"El protocolo indica pedirla siempre."}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Segun el Modulo 10, cuales son los requisitos para alcanzar el nivel Profesional dentro del sistema de niveles del programa?',
    '[{"id":"a","texto":"Modulos M01 a M06 con promedio mayor al 80% y al menos 30 atenciones registradas."},{"id":"b","texto":"Los 10 modulos completados y aprobados, certificacion digital y presencial aprobadas, calificacion promedio mayor o igual a 4.2 estrellas y tasa de conversion mayor o igual al 25% sostenida por un mes."},{"id":"c","texto":"Los 10 modulos completados, calificacion mayor a 4.5 durante 3 meses y conversion mayor al 35%."},{"id":"d","texto":"Solo completar los 10 modulos y aprobar examen digital con 95%; presencial opcional."}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Caso integrador: Roberto, transportista, consulta por WhatsApp, recibe respuesta tardia y solo precio, luego pide tambien para auto familiar, y en local no se fundamenta recomendacion ni se cierra turno para el segundo vehiculo. Identifica la opcion correcta.',
    '[{"id":"a","texto":"Hay 2 errores: tiempo de respuesta y falta de fundamento en Dunlop."},{"id":"b","texto":"Hay al menos 5 errores en Modulos 5, 6, 7, 8 y 9: demora en WhatsApp, respuesta sin diagnostico, recomendacion sin fundamento ni argumento emocional, rendicion ante precio, y no cerrar con turno concreto."},{"id":"c","texto":"Hay 3 errores: tiempo, frase del mas barato y no pedir QR."},{"id":"d","texto":"No hay errores graves porque se cerro la venta del camion."}]',
    'b',
    'caso_practico',
    5
  ),
  (
    'Desarrollo final: Una madre llega con sus hijos, dice que no sabe del tema y pide ayuda por posible problema de gomas. Describi la atencion completa desde el primer minuto hasta despedida y solicitud de calificacion, incluyendo perfil, diagnostico, recomendacion emocional, manejo de objecion de precio con E.V.A. y cierre concreto. Minimo 15 oraciones en primera persona.',
    '[]',
    'bienvenida|nombre|presentacion|perfil de seguridad|hijos|diagnostico|preguntas de uso|frecuencia|zona|inspeccion visual|mostrar desgaste|argumento emocional|eva|objecion de precio|proteccion de la familia|cierre concreto|agendar|despedida|proxima revision|calificacion qr',
    'desarrollo',
    4
  )
) as q(enunciado, opciones, respuesta_correcta, tipo, puntaje)
where m.orden = 10;

commit;
