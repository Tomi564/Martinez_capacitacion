-- =====================================================
-- 014_examen_modulo_04_venta_emocional.sql
-- Carga banco de preguntas del Módulo 04 (según PDF oficial)
-- Requiere migración 011 (preguntas.tipo + preguntas.puntaje)
-- =====================================================

begin;

delete from preguntas
where modulo_id = (
  select id from modulos where orden = 4 limit 1
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
    'Antonio Damasio investigó pacientes con daño en la parte emocional del cerebro. ¿Cuál fue su conclusión sobre decisiones de compra?',
    '[{"id":"a","texto":"Decidían mejor al eliminar sesgo emocional"},{"id":"b","texto":"Eran incapaces de decidir pese a tener lógica intacta"},{"id":"c","texto":"Decidían más rápido pero menos informados"},{"id":"d","texto":"Preferían opciones más económicas por falta de motivación emocional"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Cliente dice: Voy a hacer un viaje largo y quiero revisar las gomas. ¿Qué necesidad emocional real hay detrás?',
    '[{"id":"a","texto":"Economía"},{"id":"b","texto":"Seguridad y tranquilidad"},{"id":"c","texto":"Orgullo"},{"id":"d","texto":"Urgencia"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    '¿Cuál es el orden correcto de registros emocional y técnico durante una venta, según el módulo?',
    '[{"id":"a","texto":"Técnico primero, emocional después"},{"id":"b","texto":"Simultáneamente"},{"id":"c","texto":"Emocional primero, técnico después"},{"id":"d","texto":"Siempre técnico"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    '¿En qué momento es más efectivo usar la frase Lo vas a sentir en la primera curva?',
    '[{"id":"a","texto":"Al inicio para crear expectativa"},{"id":"b","texto":"Cuando duda entre dos marcas similares"},{"id":"c","texto":"Cuando está decidiendo o en entrega, nunca al principio"},{"id":"d","texto":"Solo si hubo alineación y balanceo"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    'Cliente desconfiado, brazos cruzados y respuestas cortas. ¿Actitud correcta del vendedor?',
    '[{"id":"a","texto":"Adaptar ritmo y cerrar rápido"},{"id":"b","texto":"No presionar, usar hechos verificables, mostrar producto y dar tiempo"},{"id":"c","texto":"Usar historias para invalidar sus dudas"},{"id":"d","texto":"Preguntar por malas experiencias para diferenciarse"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Según el módulo, ¿qué diferencia escucha activa de esperar turno para hablar?',
    '[{"id":"a","texto":"Tomar nota para no olvidar datos"},{"id":"b","texto":"Atención completa, confirmar comprensión, profundizar y usar silencios"},{"id":"c","texto":"Repetir textual lo que dijo el cliente"},{"id":"d","texto":"No interrumpir nunca"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    '¿Qué frase está prohibida y cuál es su reemplazo correcto?',
    '[{"id":"a","texto":"Prohibida: Le recomendaría este. Reemplazo: Este es el mejor que tenemos"},{"id":"b","texto":"Prohibida: Cualquiera te sirve para tu auto. Reemplazo: Para el uso que me contás, tengo dos opciones que se ajustan bien. Te explico la diferencia"},{"id":"c","texto":"Prohibida: Para el uso que me describís. Reemplazo: En general, este es el más recomendado"},{"id":"d","texto":"Prohibida: Te recomendaría. Reemplazo: Este es definitivamente el que necesitás"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Una historia de venta efectiva tiene cuatro elementos. ¿Cuál es el orden correcto?',
    '[{"id":"a","texto":"Producto - precio - competencia - resultado"},{"id":"b","texto":"Contexto del cliente - problema o duda - solución en Martínez - resultado"},{"id":"c","texto":"Problema - solución técnica - beneficio emocional - cierre"},{"id":"d","texto":"Perfil - objeción - argumento - cierre"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    '¿Por qué usar invertís en lugar de gastás al hablar de precio?',
    '[{"id":"a","texto":"Porque suena más responsable financieramente"},{"id":"b","texto":"Porque cambia marco mental de pérdida a ganancia"},{"id":"c","texto":"Porque suena más formal"},{"id":"d","texto":"Porque gastás suena a crítica de presupuesto"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    '¿Qué principio de Cialdini construye voz unificada y protocolo de atención en Martínez?',
    '[{"id":"a","texto":"Simpatía"},{"id":"b","texto":"Reciprocidad"},{"id":"c","texto":"Consistencia"},{"id":"d","texto":"Escasez"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    'Decirle al cliente que sus neumáticos aún tienen vida cuando realmente la tienen es un error de venta.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'b',
    'verdadero_falso',
    1
  ),
  (
    'Según Gottschall, en ventas las fichas técnicas son más efectivas que las historias.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'b',
    'verdadero_falso',
    1
  ),
  (
    'La frase de la primera curva funciona igual al inicio o al final si se dice con convicción.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'b',
    'verdadero_falso',
    1
  ),
  (
    'Si no tenés historias propias, podés usar historias reales de compañeros indicando su origen.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'a',
    'verdadero_falso',
    1
  ),
  (
    'Con cliente apurado, hay que hacer todo el diagnóstico con calma aunque lo frustre.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'b',
    'verdadero_falso',
    1
  ),
  (
    'Caso práctico: Lorena llega nerviosa por susto en ruta con lluvia. ¿Respuesta que mejor aplica el módulo?',
    '[{"id":"a","texto":"Prometer solución directa con marca y precio"},{"id":"b","texto":"Validar emoción y hacer dos preguntas de diagnóstico antes de recomendar"},{"id":"c","texto":"Recomendar Continental de entrada por lluvia"},{"id":"d","texto":"Proponer combo completo y arrancar"}]',
    'b',
    'caso_practico',
    2
  ),
  (
    'Caso práctico: cliente pide precio exacto de 4 Dunlop 205/55 R16, decidido y con poco tiempo. ¿Respuesta correcta?',
    '[{"id":"a","texto":"Dar precio inmediato y ofrecer también Pirelli"},{"id":"b","texto":"Sentarlo para explicar diferencias de todas las marcas"},{"id":"c","texto":"Confirmar rápido y hacer una pregunta breve de uso para validar recomendación"},{"id":"d","texto":"Agregar servicios al presupuesto sin mencionarlos"}]',
    'c',
    'caso_practico',
    2
  ),
  (
    'Desarrollo: a) Describí las 4 motivaciones emocionales universales y un ejemplo para cada una. b) Explicá por qué usar historias no es manipulación según el módulo. c) Redactá cierre de venta de 4 Continental para una madre que lleva hijos al colegio, incluyendo lenguaje emocional, dato técnico traducido y frase de la primera curva en momento adecuado. Mínimo 12 oraciones.',
    '[]',
    'seguridad|tranquilidad|economia|orgullo|pertenencia|gottschall|historia real|autenticidad|lluvia|frenado de emergencia|beneficio|primera curva',
    'desarrollo',
    5
  )
) as q(enunciado, opciones, respuesta_correcta, tipo, puntaje)
where m.orden = 4;

commit;

