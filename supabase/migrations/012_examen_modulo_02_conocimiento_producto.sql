-- =====================================================
-- 012_examen_modulo_02_conocimiento_producto.sql
-- Carga banco de preguntas del Módulo 02 (según PDF oficial)
-- Requiere migración 011 (preguntas.tipo + preguntas.puntaje)
-- =====================================================

begin;

-- 1) Limpiar preguntas actuales del módulo 2 para evitar duplicados
delete from preguntas
where modulo_id = (
  select id from modulos where orden = 2 limit 1
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
    'Neil Rackham analizó más de 35.000 llamadas de ventas en 23 países. ¿Cuál fue su conclusión sobre los vendedores de alto rendimiento?',
    '[{"id":"a","texto":"Son los que mejor conocen las técnicas de cierre"},{"id":"b","texto":"Son los que más argumentos de venta dominan"},{"id":"c","texto":"Son los que mejor preguntan y mejor escuchan"},{"id":"d","texto":"Son los que mayor conocimiento técnico del producto tienen"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    'En la medida 185/65 R15 88H, ¿qué representa el número 65?',
    '[{"id":"a","texto":"El diámetro del aro en pulgadas"},{"id":"b","texto":"El índice de carga del neumático"},{"id":"c","texto":"El ancho de la banda en milímetros"},{"id":"d","texto":"El perfil: la altura del flanco como porcentaje del ancho"}]',
    'd',
    'opcion_unica',
    1
  ),
  (
    '¿Qué velocidad máxima de operación indica la letra H en el índice de velocidad?',
    '[{"id":"a","texto":"190 km/h"},{"id":"b","texto":"210 km/h"},{"id":"c","texto":"240 km/h"},{"id":"d","texto":"270 km/h"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    '¿Cuál es el diferencial técnico principal de la marca Continental según el módulo?',
    '[{"id":"a","texto":"Su origen alemán y alianza con fabricantes de autos de lujo"},{"id":"b","texto":"Su tecnología DECTES para mayor duración de la banda"},{"id":"c","texto":"Su foco específico en seguridad activa y comportamiento en condiciones adversas"},{"id":"d","texto":"Su compuesto de caucho de última generación desarrollado en el automovilismo"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    'Un cliente llega con una camioneta 4x4 de uso recreativo y dice que le importa tanto el rendimiento como la estética del neumático. ¿Cuál es la primera opción según la tabla de segmentación?',
    '[{"id":"a","texto":"Pirelli"},{"id":"b","texto":"Continental"},{"id":"c","texto":"Dunlop SUV"},{"id":"d","texto":"Falken"}]',
    'd',
    'opcion_unica',
    1
  ),
  (
    '¿Cuál es la diferencia estructural entre un neumático radial y uno diagonal, y en qué aplicación sobrevive hoy el diagonal?',
    '[{"id":"a","texto":"El radial tiene capas diagonales para uso en camionetas; el diagonal tiene capas perpendiculares para autos deportivos"},{"id":"b","texto":"El radial tiene capas perpendiculares al sentido de marcha y es el estándar actual; el diagonal tiene capas en diagonal y se usa en maquinaria agrícola y vial"},{"id":"c","texto":"El radial es más rígido y se usa en transporte pesado; el diagonal es más flexible para autos de pasajeros"},{"id":"d","texto":"No hay diferencia estructural relevante para el vendedor"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    '¿Cuál es el momento correcto para mencionar la Garantía Pinin Farina durante una venta?',
    '[{"id":"a","texto":"Al inicio de la presentación del producto como característica destacada"},{"id":"b","texto":"Siempre que se mencione la marca Eximia by Pininfarina"},{"id":"c","texto":"Cuando el cliente duda entre Martínez y otra gomería, o duda si vale la pena pagar más"},{"id":"d","texto":"Al final de cualquier venta cerrada, como confirmación de la decisión"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    '¿Qué situación NO está cubierta por la Garantía Pinin Farina?',
    '[{"id":"a","texto":"Rotura por golpe contra un bache en la vía"},{"id":"b","texto":"Grieta en la estructura del neumático por impacto severo"},{"id":"c","texto":"Desgaste normal del neumático por uso cotidiano"},{"id":"d","texto":"Pinchadura irreparable por pérdida súbita de presión"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    '¿Cuántas alternativas como máximo debe presentar el vendedor al mostrar físicamente el producto y por qué?',
    '[{"id":"a","texto":"Una sola, la que mejor se adapta al cliente, para no generar confusión"},{"id":"b","texto":"Dos alternativas reales"},{"id":"c","texto":"Tres alternativas: económica, media y premium"},{"id":"d","texto":"Las que el cliente pida ver, sin límite definido"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    '¿Cuál es el perfil de cliente para quien se recomienda Chao Yang como primera opción?',
    '[{"id":"a","texto":"El conductor joven con vehículo modificado que busca estética y rendimiento"},{"id":"b","texto":"El remisero con presupuesto ajustado que hace uso urbano intensivo"},{"id":"c","texto":"El cliente con presupuesto muy restringido, vehículo antiguo o de bajo uso, o que necesita una medida poco común"},{"id":"d","texto":"El transportista mediano que necesita durabilidad a costo accesible"}]',
    'c',
    'opcion_unica',
    1
  ),
  (
    'Un cliente con un auto de alta gama que hace ruta frecuente y no discute el precio entra al local. ¿Cuál es la primera opción y el argumento clave?',
    '[{"id":"a","texto":"Continental - Menor distancia de frenado en mojado. Diseñada para proteger lo que más importa"},{"id":"b","texto":"Pirelli - Lo mejor disponible. Seguridad y rendimiento sin compromisos"},{"id":"c","texto":"Dunlop - Calidad premium a precio de entrada. Tecnología DECTES para mayor duración"},{"id":"d","texto":"Falken - Rendimiento y estética que acompañan el perfil del vehículo"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    '¿Por qué el módulo afirma que un vendedor que no conoce las diferencias entre sus marcas solo puede tirar un precio?',
    '[{"id":"a","texto":"Porque sin conocimiento técnico no puede calcular el precio correcto"},{"id":"b","texto":"Porque el cliente que recibe solo un precio lo compara con otros y elige al más barato; el conocimiento convierte el precio en valor"},{"id":"c","texto":"Porque las marcas tienen estructuras de precios distintas que requieren conocimiento especializado"},{"id":"d","texto":"Porque sin conocimiento el vendedor no puede acceder al sistema de precios del local"}]',
    'b',
    'opcion_unica',
    1
  ),
  (
    'Según el módulo, si el cliente técnico hace una pregunta cuyo dato no recordamos, lo correcto es dar una respuesta aproximada para no perder autoridad frente al cliente.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'b',
    'verdadero_falso',
    1
  ),
  (
    'La marca Falken pertenece al grupo Sumitomo Rubber Industries de Japón y está orientada principalmente al segmento deportivo y 4x4.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'a',
    'verdadero_falso',
    1
  ),
  (
    'Según el módulo, la característica técnica banda de rodamiento ancha con canales de evacuación de agua se traduce para el cliente como mayor resistencia a pinchazos y mejor estabilidad a alta velocidad.',
    '[{"id":"a","texto":"Verdadero"},{"id":"b","texto":"Falso"}]',
    'b',
    'verdadero_falso',
    1
  ),
  (
    'Caso práctico: Rodrigo pide cambiar 4 Pirelli P7, pero al revisar el vehículo se ve que tres están casi nuevos y uno tiene corte en flanco. ¿Qué respuesta corresponde?',
    '[{"id":"a","texto":"Cambiar los cuatro como pidió, sin mencionar el estado de los otros tres"},{"id":"b","texto":"Explicar que solo necesita cambiar el delantero derecho porque los otros tres están casi nuevos, y señalar el corte en el flanco que lo inhabilita"},{"id":"c","texto":"Cambiar solo uno y recomendar rotación de los otros tres"},{"id":"d","texto":"Cambiar los cuatro para evitar conflicto con el cliente"}]',
    'b',
    'caso_practico',
    2
  ),
  (
    'Caso práctico: una clienta pide repetir Chao Yang, pero el vendedor detecta desgaste irregular interno en ambos delanteros. ¿Qué debe hacer?',
    '[{"id":"a","texto":"Venderle los Chao Yang porque está satisfecha con la marca"},{"id":"b","texto":"Explicar que el desgaste irregular indica probable problema de alineación y conviene corregir antes de poner neumáticos nuevos"},{"id":"c","texto":"Recomendar marca superior porque Chao Yang no rindió bien"},{"id":"d","texto":"Derivar directo al taller sin atender la consulta de neumáticos"}]',
    'b',
    'caso_practico',
    2
  ),
  (
    'Desarrollo: a) Explicá diferencia entre Continental y Dunlop y cuándo conviene cada una. b) Definí perfil ideal de cliente SEAT Agrícola y la ventaja competitiva de dominar ese segmento. c) Explicá el procedimiento de reclamo de Garantía Pinin Farina y qué frases nunca deben decirse. Mínimo 10 oraciones.',
    '[]',
    'continental|dunlop|seguridad activa|lluvia|dectes|durabilidad|seat agricola|productor agropecuario|contratista|medidas especificas|garantia pinin farina|factura|evaluacion tecnica|administracion|exclusiones|no tengo ese dato',
    'desarrollo',
    3
  )
) as q(enunciado, opciones, respuesta_correcta, tipo, puntaje)
where m.orden = 2;

commit;

