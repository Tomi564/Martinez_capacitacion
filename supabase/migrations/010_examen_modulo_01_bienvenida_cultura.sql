-- =====================================================
-- 010_examen_modulo_01_bienvenida_cultura.sql
-- Carga banco de preguntas del Módulo 01 (según PDF oficial)
-- =====================================================
-- Fuente: M01_Examen_Bienvenida_Cultura.pdf
-- Requiere migración 011 (preguntas.tipo + preguntas.puntaje).

begin;

-- 1) Limpiar preguntas actuales del módulo 1 para evitar duplicados
delete from preguntas
where modulo_id = (
  select id from modulos where orden = 1 limit 1
);

-- 2) Cargar preguntas del examen completo (incluye desarrollo)
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
    'Antes de abrir Martínez Neumáticos, Don José Enrique Martínez ya tenía una trayectoria específica en el rubro. ¿Cuántos años de experiencia acumulaba?',
    '[{"id":"a","texto":"20 años"},{"id":"b","texto":"25 años"},{"id":"c","texto":"Más de 30 años"},{"id":"d","texto":"Casi 40 años"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    'Según el módulo, ¿qué porcentaje del impacto de la comunicación en ventas proviene del lenguaje no verbal, según Brian Tracy?',
    '[{"id":"a","texto":"7%"},{"id":"b","texto":"38%"},{"id":"c","texto":"45%"},{"id":"d","texto":"55%"}]',
    'd',
    'opcion_unica',
    1
  ),
  (
    '¿Qué concepto acuñó Jan Carlzon para describir cada interacción entre el cliente y la empresa como una oportunidad para construir o destruir la relación?',
    '[{"id":"a","texto":"Ciclo de fidelización"},{"id":"b","texto":"Momentos de la verdad"},{"id":"c","texto":"Puntos de contacto críticos"},{"id":"d","texto":"Experiencia de marca"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Según la tabla de evaluación de desempeño, ¿qué dimensión tiene el mayor peso porcentual?',
    '[{"id":"a","texto":"Volumen de ventas - 30%"},{"id":"b","texto":"Fidelización y postventa - 25%"},{"id":"c","texto":"Cumplimiento de atención - 25%, empatado con volumen de ventas"},{"id":"d","texto":"Gestión administrativa - 25%"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    'Un cliente ingresa al salón y el vendedor está atendiendo a otra persona. Según el protocolo de recepción, ¿qué debe hacer el vendedor?',
    '[{"id":"a","texto":"Continuar la atención actual y esperar a que el nuevo cliente se acerque"},{"id":"b","texto":"Pedirle al personal de taller que reciba al cliente mientras termina"},{"id":"c","texto":"Hacer un gesto de reconocimiento y decirle ''Ya lo atiendo, un momento''"},{"id":"d","texto":"Pedirle a un compañero vendedor que lo atienda"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    '¿Cuál de los siguientes comportamientos describe correctamente al vendedor con la actitud correcta según el módulo?',
    '[{"id":"a","texto":"Aprovecha los momentos sin clientes para descansar y reponer energía"},{"id":"b","texto":"Cuando no hay clientes, revisa stock, llama para seguimiento y estudia el material"},{"id":"c","texto":"Llega puntual al horario de apertura y espera al primer cliente"},{"id":"d","texto":"Prioriza cerrar ventas rápidas para cumplir la meta mensual"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    '¿Qué debe hacer el vendedor con los clientes que NO compran durante su visita?',
    '[{"id":"a","texto":"No es necesario registrarlos, ya que no generaron una venta"},{"id":"b","texto":"Registrar solo el nombre y teléfono como referencia"},{"id":"c","texto":"Registrar nombre, teléfono, vehículo, medida consultada y motivo de contacto"},{"id":"d","texto":"Registrarlos solo si expresaron interés en volver"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    '¿Qué autor identificó la consistencia como uno de los seis principios fundamentales de la persuasión, y cómo lo aplica el módulo?',
    '[{"id":"a","texto":"Dale Carnegie - a través del uso del nombre del cliente"},{"id":"b","texto":"Zig Ziglar - a través del servicio como filosofía de venta"},{"id":"c","texto":"Brian Tracy - a través de la psicología del comprador"},{"id":"d","texto":"Robert Cialdini - a través de la voz unificada de la empresa"}]',
    'd',
    'opcion_unica',
    1
  ),
  (
    '¿Cuánto tiempo dura la garantía Pinin Farina y por qué se usa como ejemplo en el módulo?',
    '[{"id":"a","texto":"3 meses - para mostrar la diferencia con la competencia"},{"id":"b","texto":"6 meses - para ilustrar qué pasa cuando la empresa no habla con una sola voz"},{"id":"c","texto":"12 meses - como diferencial competitivo en la venta"},{"id":"d","texto":"6 meses - como argumento de cierre ante objeciones de precio"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    '¿Cuál es la diferencia entre rendimiento esperado y rendimiento destacado según el módulo?',
    '[{"id":"a","texto":"Esperado: 80% global. Destacado: 90% con todos los ítems completos"},{"id":"b","texto":"Esperado: 85% global. Destacado: 95% con cumplimiento integral de todos los ítems"},{"id":"c","texto":"Esperado: 90% global. Destacado: 100% sin observaciones"},{"id":"d","texto":"Esperado: cumplir metas de venta. Destacado: superarlas en un 20%"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Según el módulo, el tono correcto de comunicación en Martínez Neumáticos es cálido e informal, priorizando la cercanía por sobre el profesionalismo.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'b',
    'verdadero_falso',
    1
  ),
  (
    'Según Brian Tracy, los clientes toman decisiones de compra principalmente por razones lógicas y las justifican después con razones emocionales.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'b',
    'verdadero_falso',
    1
  ),
  (
    'El módulo indica que tecnicismos como camber o toe son herramientas útiles para demostrar conocimiento técnico y generar confianza en el cliente.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'b',
    'verdadero_falso',
    1
  ),
  (
    'La Misión de Martínez Neumáticos incluye convertirse en referente de todo el Norte Argentino.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'b',
    'verdadero_falso',
    1
  ),
  (
    'Caso práctico: Son las 17:45. Sebastián entra al salón apurado y pide precio de 4 Pirelli para su camioneta. ¿Qué respuesta aplica mejor el módulo?',
    '[{"id":"a","texto":"Claro, qué medida necesita? Le doy el precio y listo"},{"id":"b","texto":"Bienvenido Sebastián, soy [nombre]. Entiendo que viene con el tiempo justo. Para darle el precio más preciso necesito saber la medida exacta y para qué usa la camioneta, así me aseguro de cotizarle lo que realmente le conviene. Me da un minuto?"},{"id":"c","texto":"Le recomendaría revisar primero el estado de las gomas actuales"},{"id":"d","texto":"Buenas tardes. Los Pirelli varían según modelo. Tiene la medida del lateral de la goma?"}]',
    'b',
    'caso_practico',
    2
  ),
  (
    'Caso práctico: Un compañero dice que no hace falta estudiar el material porque se aprende en la cancha. Según el módulo, ¿cuál es la respuesta más completa?',
    '[{"id":"a","texto":"Tenés razón en parte, la práctica es fundamental, pero el material te da marco teórico"},{"id":"b","texto":"Si no aprobás exámenes no podés avanzar"},{"id":"c","texto":"Un jugador de primera liga no improvisa. Aprende antes para no equivocarse cuando importa. El cliente no es el entrenamiento, es el partido. Y un cliente mal atendido no vuelve"},{"id":"d","texto":"Cada uno aprende como puede, pero te recomendaría al menos leer resúmenes"}]',
    'c',
    'caso_practico',
    2
  ),
  (
    'Desarrollo: Es tu primera semana. a) ¿Qué es Martínez Neumáticos y en qué se diferencia de una gomería común? Mencioná al menos 3 servicios del local. b) ¿Por qué registrar a cada cliente, incluso sin venta, es base del negocio? Mínimo 8 oraciones, con tus palabras.',
    '[]',
    'centro de servicio|alineacion|balanceo|frenos|amortiguadores|tren delantero|rotacion|chequeo general|seguimiento|competencia|transparencia|codigo de vendedor',
    'desarrollo',
    2
  )
) as q(enunciado, opciones, respuesta_correcta, tipo, puntaje)
where m.orden = 1;

commit;

