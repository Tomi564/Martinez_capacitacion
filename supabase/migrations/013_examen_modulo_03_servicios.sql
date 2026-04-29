-- =====================================================
-- 013_examen_modulo_03_servicios.sql
-- Carga banco de preguntas del Módulo 03 (según PDF oficial)
-- Requiere migración 011 (preguntas.tipo + preguntas.puntaje)
-- =====================================================

begin;

delete from preguntas
where modulo_id = (
  select id from modulos where orden = 3 limit 1
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
    'Un cliente dice: A partir de los 90 km/h el volante empieza a temblar, pero a 110 ya no tiembla tanto. ¿Cuál es el problema más probable y el servicio que corresponde?',
    '[{"id":"a","texto":"Alineación - el auto tira hacia un lado a alta velocidad"},{"id":"b","texto":"Balanceo - la vibración a velocidades específicas es la señal característica del desbalanceo"},{"id":"c","texto":"Revisión de tren delantero - el juego en las rótulas genera vibración variable"},{"id":"d","texto":"Amortiguadores - el rebote a alta velocidad genera vibraciones en el volante"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Al revisar neumáticos actuales, uno delantero tiene desgaste pronunciado en borde interno. ¿Qué indica y qué se recomienda?',
    '[{"id":"a","texto":"Desbalanceo - hacer balanceo antes de instalar nuevos"},{"id":"b","texto":"Desgaste normal en tracción delantera - recomendar rotación"},{"id":"c","texto":"Desalineación - hacer alineación después de instalar y posiblemente revisar tren delantero"},{"id":"d","texto":"Amortiguador gastado - revisar amortiguadores antes de instalar"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    'Un cliente relata que al frenar en ruta el pedal pulsa rítmicamente. ¿Qué indica y cuál es la urgencia?',
    '[{"id":"a","texto":"Desbalanceo transmitido al pedal - balanceo próxima visita"},{"id":"b","texto":"Disco de freno deformado o con runout - revisión de frenos urgente"},{"id":"c","texto":"Rodamiento desgastado - revisar tren delantero cuando pueda"},{"id":"d","texto":"Amortiguador gastado - rebote transmitido al frenado"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Auto se bambolea en curvas y rebota varias veces tras un pozo. ¿Qué servicio corresponde y cuál es el argumento clave?',
    '[{"id":"a","texto":"Alineación - ángulos fuera de rango"},{"id":"b","texto":"Balanceo - vibración de alta amplitud"},{"id":"c","texto":"Revisión de amortiguadores - neumáticos nuevos van a durar la mitad si no funcionan bien"},{"id":"d","texto":"Revisión de tren delantero - juego en rótulas o terminales"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    'Un cliente se alineó hace 3 semanas en otro local y ya vuelve a tirar para un lado. ¿Qué explicación probable y qué servicio debe preceder?',
    '[{"id":"a","texto":"Alineación mal hecha - repetir alineación 3D"},{"id":"b","texto":"Desgaste de neumáticos muy avanzado - cambiar neumáticos primero"},{"id":"c","texto":"Componentes del tren delantero con juego - revisar tren delantero antes de alinear"},{"id":"d","texto":"Balanceo mal hecho - corregir balanceo y luego alinear"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    'Cliente con presupuesto ajustado pregunta si puede saltear balanceo al instalar 4 neumáticos nuevos. ¿Respuesta correcta?',
    '[{"id":"a","texto":"Sí, con neumáticos nuevos de buena marca no suele ser necesario"},{"id":"b","texto":"Podés esperar a ver si vibra"},{"id":"c","texto":"El balanceo es parte del servicio de instalación, incluso con neumáticos nuevos"},{"id":"d","texto":"Hacer balanceo solo adelante para reducir costo"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    'Cliente cambia dos delanteros; traseros aún con buen dibujo. ¿Qué servicio adicional es más relevante?',
    '[{"id":"a","texto":"Chequeo general"},{"id":"b","texto":"Rotación de neumáticos para distribuir desgaste"},{"id":"c","texto":"Alineación por desgaste diferencial"},{"id":"d","texto":"Revisión de amortiguadores"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Antes de retirar vehículo, el cliente rechaza chequeo general. ¿Respuesta más adecuada?',
    '[{"id":"a","texto":"Como quiera, es opcional"},{"id":"b","texto":"Son 10 minutos, sin costo; revisamos frenos, amortiguadores y presión, para irse tranquilo"},{"id":"c","texto":"Le recomiendo porque encontramos cosas seguido"},{"id":"d","texto":"Al menos revisemos presión trasera"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Si se detecta juego en una rótula, igual hay que hacer alineación y recomendar reparar después.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'b',
    'verdadero_falso',
    1
  ),
  (
    'El líquido de frenos no requiere reemplazo periódico si el pedal se siente firme.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'b',
    'verdadero_falso',
    1
  ),
  (
    'La rotación de neumáticos direccionales se hace cruzando en diagonal como en estándar.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'b',
    'verdadero_falso',
    1
  ),
  (
    'Si el pedal chirría al frenar, puede programarse revisión para la semana siguiente.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'b',
    'verdadero_falso',
    1
  ),
  (
    'El chequeo general solo aporta valor si se detecta algún problema.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'b',
    'verdadero_falso',
    1
  ),
  (
    'Caso práctico: delanteros lisos, traseros al 50%, desgaste interno en delanteros y tirón en ruta. ¿Recomendación integral?',
    '[{"id":"a","texto":"Cambiar dos delanteros y recomendar alineación"},{"id":"b","texto":"Cambiar dos delanteros, hacer alineación y balanceo, ofrecer rotación de traseros y proponer chequeo general antes de retirar"},{"id":"c","texto":"Cambiar cuatro, alinear, balancear y chequeo general"},{"id":"d","texto":"Cambiar dos delanteros y volver en seis meses"}]',
    'b',
    'caso_practico',
    3
  ),
  (
    'Caso práctico: clienta duda de diagnóstico de otra gomería. ¿Actitud/procedimiento correcto?',
    '[{"id":"a","texto":"Afirmar que en Martínez nunca se vende de más y cotizar todo"},{"id":"b","texto":"Hacer revisión visual en el vehículo, identificar señales reales y explicar en términos simples sin confirmar ni desmentir a la competencia"},{"id":"c","texto":"Hacer chequeo general y entregar informe escrito"},{"id":"d","texto":"Diagnosticar solo por síntomas sin revisar físicamente"}]',
    'b',
    'caso_practico',
    3
  ),
  (
    'Desarrollo: cliente compra 4 Pirelli nuevos y dice que no necesita nada más. a) ¿Qué dos servicios son obligatorios y por qué? b) ¿Qué revisión adicional proponés y cómo la presentás como cuidado? c) ¿Qué le decís sobre cuándo volver para generar relación de largo plazo? Mínimo 10 oraciones.',
    '[]',
    'balanceo|alineacion|variaciones de peso|geometria|chequeo general|sin costo|10 minutos|frenos|amortiguadores|presion|10.000 km|6 meses|rotacion|agendar|fidelizacion',
    'desarrollo',
    6
  )
) as q(enunciado, opciones, respuesta_correcta, tipo, puntaje)
where m.orden = 3;

commit;

