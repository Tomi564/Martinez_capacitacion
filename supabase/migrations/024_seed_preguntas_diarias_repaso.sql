-- Seed: Repaso Diario Vendedores (100 preguntas) · Abril 2026
-- Fuente: Repaso_Diario_Vendedores.pdf · Preguntas 1–50 ventas · 51–100 producto
begin;
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según la filosofía de ventas de Martínez Neumáticos, ¿cuál es la premisa fundamental?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Vender la mayor cantidad de neumáticos posible en el menor tiempo."},{"id":"b","texto":"No vendemos neumáticos, construimos confianza y seguridad para cada cliente."},{"id":"c","texto":"El precio es el factor más importante para cerrar una venta."},{"id":"d","texto":"La publicidad trae clientes y el vendedor solo despacha el producto."}]$repaso_json_024$::jsonb,
  'b',
  'La filosofía central de Martínez Neumáticos, definida en el M01, es que la venta no es una transacción sino un proceso de construcción de confianza. El vendedor es un asesor, no un despachador.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuáles son las tres preguntas de diagnóstico que el vendedor debe hacer ANTES de recomendar cualquier neumático?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"¿Qué marca preferís? ¿Cuánto querés gastar? ¿Cuándo lo necesitás?"},{"id":"b","texto":"¿Para qué vehículo es? ¿Para qué uso? ¿Cuál es el presupuesto?"},{"id":"c","texto":"¿Ya usaste esta marca? ¿Cuántos kilómetros hacés? ¿Tenés tarjeta?"},{"id":"d","texto":"¿Querés balanceo incluido? ¿Pagás con tarjeta? ¿Traés el auto ahora?"}]$repaso_json_024$::jsonb,
  'b',
  'Las tres preguntas de diagnóstico del M02 son: vehículo, uso y presupuesto. Sin esas respuestas, cualquier recomendación es una apuesta, no un asesoramiento.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué significa la secuencia E.V.A. en el manejo de objeciones?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Evaluar, Vender, Agradecer."},{"id":"b","texto":"Escuchar, Validar, Aportar."},{"id":"c","texto":"Escuchar, Verificar, Avanzar."},{"id":"d","texto":"Entender, Valorar, Argumentar."}]$repaso_json_024$::jsonb,
  'b',
  'E.V.A. es la secuencia del M06: Escuchar completo sin interrumpir, Validar la objeción (''Entiendo lo que decís''), y Aportar con información o una pregunta que abra el diálogo. Es la base de todo manejo de objeciones efectivo.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿En cuánto tiempo máximo debe responderse una consulta por WhatsApp durante el horario comercial?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"30 minutos."},{"id":"b","texto":"1 hora."},{"id":"c","texto":"10 minutos."},{"id":"d","texto":"5 minutos."}]$repaso_json_024$::jsonb,
  'c',
  'Según el M07, el tiempo máximo de respuesta en WhatsApp y Mercado Libre es de 10 minutos. El 50% de los clientes sin respuesta en ese tiempo ya contactaron a la competencia.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la frase que resume la propuesta de valor experiencial de Martínez Neumáticos?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"El precio más bajo del mercado, garantizado."},{"id":"b","texto":"Compre neumáticos donde saben de neumáticos."},{"id":"c","texto":"Cuando entrás a Martínez, tu auto sale diferente. Lo vas a sentir en la primera curva."},{"id":"d","texto":"Somos la gomería más grande del NOA."}]$repaso_json_024$::jsonb,
  'c',
  'Esta frase, trabajada en el M04, no es publicidad sino la descripción exacta de la experiencia que el cliente vive cuando el trabajo se hace bien. Es el cierre emocional más poderoso del programa.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según el M05, ¿cómo identificás en los primeros 30 segundos que el cliente es del perfil ''de precio''?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Viene al local sin el auto y pregunta si tienen estacionamiento."},{"id":"b","texto":"Su primera pregunta es el precio antes de dar cualquier otro dato."},{"id":"c","texto":"Pregunta por el neumático más seguro para su familia."},{"id":"d","texto":"Menciona que ya tiene la medida exacta y el modelo que quiere."}]$repaso_json_024$::jsonb,
  'b',
  'El cliente de precio se identifica porque su primera pregunta siempre es ''¿cuánto sale?'' antes de dar información sobre el vehículo o el uso. Este perfil requiere mostrar valor, no entrar en guerra de precios.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Un cliente dice ''lo voy a pensar''. Según la metodología del M06, ¿cuál es la primera respuesta correcta del vendedor?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Perfecto, te dejo mi número para cuando decidas."},{"id":"b","texto":"Dale, no hay problema, volvé cuando quieras."},{"id":"c","texto":"¿Hay algo que no terminó de quedar claro? A veces el 'lo pienso' tiene detrás una duda que no llegamos a resolver."},{"id":"d","texto":"Mirá, hoy tenemos oferta especial que vence mañana."}]$repaso_json_024$::jsonb,
  'c',
  'El M06 enseña que ''lo pienso'' casi nunca significa que va a pensar — esconde una objeción no verbalizada. La respuesta correcta busca descubrir esa objeción real. Las opciones a y b dejan ir la oportunidad sin intentar nada.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué son los ''momentos de la verdad'' según Jan Carlzon, citado en el M09?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Los momentos en que el vendedor debe decirle la verdad al cliente sobre el estado de sus neumáticos."},{"id":"b","texto":"Cada interacción entre el cliente y la empresa donde se puede construir o destruir la relación."},{"id":"c","texto":"Las estadísticas reales de conversión que se miden en el panel."},{"id":"d","texto":"Los tres intentos disponibles para aprobar cada módulo del programa."}]$repaso_json_024$::jsonb,
  'b',
  'Carlzon definió que cada punto de contacto entre el cliente y la empresa es una oportunidad de construir o destruir confianza. En Martínez, esto aplica desde el primer mensaje hasta la despedida final.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según Brian Tracy citado en el M04, ¿cuándo toman los clientes sus decisiones de compra?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Siempre de forma racional, comparando precios y características técnicas."},{"id":"b","texto":"Por razones emocionales, y las justifican después con razones lógicas."},{"id":"c","texto":"Exclusivamente por el precio, sin importar el servicio."},{"id":"d","texto":"Solo cuando el vendedor presenta argumentos técnicos convincentes."}]$repaso_json_024$::jsonb,
  'b',
  'Tracy demostró que las decisiones de compra son fundamentalmente emocionales y se justifican con lógica después. Por eso el M04 enseña a conectar primero con la emoción y respaldar después con datos técnicos.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué información debe registrar el vendedor en el sistema cuando un cliente NO compra?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Nada, solo se registran las ventas cerradas."},{"id":"b","texto":"Solo el nombre del cliente por si vuelve."},{"id":"c","texto":"Nombre, canal, vehículo, medida consultada y motivo de no venta."},{"id":"d","texto":"El motivo por el que el cliente eligió la competencia."}]$repaso_json_024$::jsonb,
  'c',
  'El M08 establece que cargar solo las ventas exitosas infla artificialmente la tasa de conversión. Las atenciones sin venta son igual de importantes para analizar dónde está el problema y hacer seguimiento.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál de estas es la técnica de cierre ''por opción'' según el M09?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"'¿Querés que te lo instalemos ahora mismo?'"},{"id":"b","texto":"'¿Preferís llevarte dos hoy y los otros dos la próxima visita, o los cuatro juntos para mayor seguridad?'"},{"id":"c","texto":"'Estos neumáticos tienen stock limitado, conviene decidir hoy.'"},{"id":"d","texto":"'Para el viaje que me describiste, lo más importante es la seguridad en lluvia. ¿Estás de acuerdo?'"}]$repaso_json_024$::jsonb,
  'b',
  'El cierre por opción presenta dos alternativas de compra en lugar de una decisión binaria (comprar/no comprar). El cliente elige entre opciones, lo que facilita la decisión y evita el ''no'' directo.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según los cinco obstáculos de Zig Ziglar del M06, ¿cuál corresponde cuando el cliente dice ''los míos todavía están bien, no necesito cambiarlos ahora''?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"No hay dinero."},{"id":"b","texto":"No hay confianza."},{"id":"c","texto":"No hay necesidad."},{"id":"d","texto":"No hay prisa."}]$repaso_json_024$::jsonb,
  'c',
  'Cuando el cliente no percibe que tiene un problema real, el obstáculo activo es ''no hay necesidad''. La respuesta correcta es mostrar evidencia concreta (inspección visual, datos de desgaste) para que el cliente vea el problema.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuándo es el momento correcto para usar la frase ''lo vas a sentir en la primera curva''?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Al inicio de la conversación para captar la atención del cliente."},{"id":"b","texto":"Cuando el cliente ya está considerando comprar y necesita el empuje final, o en el momento de la entrega."},{"id":"c","texto":"Siempre que se mencione cualquier servicio de Martínez Neumáticos."},{"id":"d","texto":"Solo cuando el cliente pregunta específicamente por la calidad."}]$repaso_json_024$::jsonb,
  'b',
  'El M04 enseña que esta frase usada muy temprano suena a slogan. Su poder está en el momento justo: cuando el cliente está decidiendo o cuando retira el vehículo. Ahí funciona como cierre emocional perfecto.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué debe hacer el vendedor si el cliente técnico pregunta por un dato específico que no recuerda?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Dar una respuesta aproximada para no perder credibilidad."},{"id":"b","texto":"Decir que ese dato no existe en esa marca."},{"id":"c","texto":"Admitirlo con honestidad y verificar: 'No tengo ese dato de memoria, lo verifico y te respondo.'"},{"id":"d","texto":"Cambiar de tema hacia las características que sí conoce."}]$repaso_json_024$::jsonb,
  'c',
  'El M05 y el M02 son claros: nunca improvisar datos técnicos con el cliente técnico. Admitir una duda y resolverla genera más confianza que inventar. El cliente técnico detecta inmediatamente la imprecisión.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál de estos es un principio universal que aplica a TODOS los canales digitales según el M07?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Enviar el precio inmediatamente para no hacer esperar al cliente."},{"id":"b","texto":"Siempre cerrar la conversación con una acción concreta propuesta."},{"id":"c","texto":"Responder solo cuando el cliente hace una segunda consulta."},{"id":"d","texto":"Derivar todas las consultas digitales al local presencial."}]$repaso_json_024$::jsonb,
  'b',
  'El M07 establece que toda conversación digital debe terminar con una acción propuesta (pregunta, invitación o propuesta concreta). Las conversaciones sin dirección mueren. El vendedor propone el próximo paso.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según la metodología SPIN del M05, ¿qué tipo de pregunta es: ''¿Si el auto frenara mejor en lluvia, te daría más tranquilidad para los viajes?''',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Situación (S)."},{"id":"b","texto":"Problema (P)."},{"id":"c","texto":"Implicación (I)."},{"id":"d","texto":"Necesidad de solución (N)."}]$repaso_json_024$::jsonb,
  'd',
  'Las preguntas tipo N (Need-payoff) llevan al cliente a verbalizar el beneficio de la solución por sí mismo. En SPIN Selling, cuando el cliente dice qué valor le daría resolver el problema, está a un paso de comprar.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Un cliente dice que en Mercado Libre encontró el mismo neumático $3.000 más barato por unidad. ¿Cuál es la respuesta correcta según el M06?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Igualamos el precio, no hay problema."},{"id":"b","texto":"'¿Y quién te hace la instalación y el balanceo? Eso no viene en el envío. Acá el precio incluye todo y si hay algún problema, estamos a una llamada.'"},{"id":"c","texto":"'Eso es imposible, los precios de ML no son reales.'"},{"id":"d","texto":"'Si lo comprás ahí, el neumático no va a tener garantía.'"}]$repaso_json_024$::jsonb,
  'b',
  'Esta es la objeción 12 del M06. La respuesta correcta no ataca el canal ni baja el precio. Hace explícito el costo oculto de la compra online: instalación, balanceo, garantía local y accesibilidad. Con todo incluido, el precio cambia.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál de los seis principios de Cialdini del M04 explica por qué el vendedor debe ser consistente en su tono y mensajes?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Simpatía."},{"id":"b","texto":"Reciprocidad."},{"id":"c","texto":"Consistencia."},{"id":"d","texto":"Escasez."}]$repaso_json_024$::jsonb,
  'c',
  'Cialdini demostró que las personas confían más en organizaciones que son predecibles y firmes en su discurso. La voz unificada de Martínez Neumáticos (M08) aplica este principio: todos transmiten el mismo mensaje con el mismo tono.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿En qué canal digital el interés del cliente se enfría más rápido y por qué?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"WhatsApp, porque los mensajes quedan en visto sin respuesta."},{"id":"b","texto":"Mercado Libre, porque hay muchos competidores listados juntos."},{"id":"c","texto":"TikTok, porque el usuario no estaba buscando activamente el producto."},{"id":"d","texto":"Facebook, porque el algoritmo no muestra los mensajes de negocios."}]$repaso_json_024$::jsonb,
  'c',
  'El M07 explica que en TikTok el usuario encontró el contenido por el algoritmo, no porque estaba buscando. Ese interés espontáneo se enfría rápido si no hay respuesta en menos de 30 minutos. El tiempo crítico es mayor que en otros canales.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según el M08, ¿por qué analizar la tasa de conversión por canal es más útil que el total?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Porque el total siempre da un número más alto que por canal."},{"id":"b","texto":"Porque el total puede ocultar que un canal específico está fallando mientras otro funciona bien."},{"id":"c","texto":"Porque el panel solo permite ver datos por canal, no totales."},{"id":"d","texto":"Porque los clientes presenciales no se cuentan en el total general."}]$repaso_json_024$::jsonb,
  'b',
  'El M08 da el ejemplo: 40% de conversión en WhatsApp y 10% en ML da un promedio del 25%. Ese número no dice nada sobre dónde está el problema real. La granularidad por canal permite enfocar la mejora.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuáles son los 8 pasos del Mapa de la Atención Perfecta del M09?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Recibir, Cotizar, Vender, Cobrar, Instalar, Entregar, Despedir, Cerrar."},{"id":"b","texto":"Bienvenida, Diagnóstico, Recomendación, Objeciones, Cierre, Local, Despedida, Calificación."},{"id":"c","texto":"Saludo, Precio, Negociación, Pago, Servicio, Control, Seguimiento, Registro."},{"id":"d","texto":"Apertura, Consulta, Oferta, Descuento, Acuerdo, Trabajo, Entrega, Factura."}]$repaso_json_024$::jsonb,
  'b',
  'Los 8 pasos del M09 son: Bienvenida cálida → Diagnóstico → Recomendación fundamentada → Manejo de dudas → Cierre → Experiencia en el local → Despedida y agradecimiento → Solicitud de calificación QR.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Con qué frase se debe pedir la calificación QR al cliente según el M09?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"'Calificame bien, por favor, me ayuda mucho.'"},{"id":"b","texto":"'Tenés que llenar este formulario antes de irte.'"},{"id":"c","texto":"'Si quedaste conforme con la atención, te agradecería que le dedicaras un minuto a esto. Tu opinión nos ayuda a mejorar.'"},{"id":"d","texto":"'¿Podés darnos 5 estrellas en Google?'"}]$repaso_json_024$::jsonb,
  'c',
  'Esta es la frase exacta del M09. Es condicional (solo si quedó conforme), pide tiempo específico y conecta con un propósito real. Nunca pedir la calificación de forma ansiosa, forzada u obligatoria.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué hace el protocolo de postventa a las 24 horas de una venta según el M09?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Enviar la factura por WhatsApp."},{"id":"b","texto":"Llamar para ofrecer un descuento en la próxima compra."},{"id":"c","texto":"Enviar un mensaje verificando que todo quedó bien y recordando la experiencia de la primera curva."},{"id":"d","texto":"Solicitar una reseña en Google Maps."}]$repaso_json_024$::jsonb,
  'c',
  'El M09 establece que el seguimiento a las 24 horas tiene dos objetivos: verificar la satisfacción del cliente y, si no dejó calificación QR, hacer el recordatorio amable. Refuerza la experiencia positiva y construye fidelización.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según el M01, ¿por qué Martínez Neumáticos no debe presentarse como ''una gomería''?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Porque la palabra gomería tiene connotación negativa en el NOA."},{"id":"b","texto":"Porque los clientes prefieren el término 'empresa automotriz'."},{"id":"c","texto":"Porque somos un centro de servicio automotriz integral que ofrece todos los servicios en el local propio."},{"id":"d","texto":"Porque gomería es un término informal que resta seriedad."}]$repaso_json_024$::jsonb,
  'c',
  'El M01 explica que la distinción ''centro de servicio automotriz integral'' no es semántica sino estratégica: comunica que el cliente puede resolver todos los problemas de su auto en un solo lugar, lo que es el diferencial real.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuándo es el momento correcto para hacer up-selling de alineación y balanceo al cliente urgente según el M05?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Nunca, el cliente urgente no quiere escuchar nada más."},{"id":"b","texto":"En dos frases, justo después de confirmar la disponibilidad del neumático."},{"id":"c","texto":"Al final, cuando el auto ya está listo."},{"id":"d","texto":"Antes de mencionar el precio del neumático."}]$repaso_json_024$::jsonb,
  'b',
  'El M05 es claro: con el cliente urgente, el up-selling se hace en dos frases máximo, justo después de confirmar que tenemos el neumático. Si acepta, bien. Si no, no insistir. El error es extenderse cuando el cliente está mirando el reloj.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la diferencia entre el cierre ''consultivo'' y el cierre ''afirmativo'' del M09?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"El consultivo es para clientes nuevos y el afirmativo para clientes habituales."},{"id":"b","texto":"El consultivo usa la propia respuesta del cliente para formular el cierre; el afirmativo asume que la decisión ya fue tomada y propone el siguiente paso logístico."},{"id":"c","texto":"El consultivo cierra con precio y el afirmativo cierra con servicios incluidos."},{"id":"d","texto":"Son la misma técnica con diferente nombre según el canal."}]$repaso_json_024$::jsonb,
  'b',
  'El M09 los diferencia claramente: el cierre consultivo (SPIN) confirma con el cliente que la solución resuelve su necesidad. El afirmativo se usa cuando las señales de compra son claras y solo falta que alguien tome la iniciativa.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según el ciclo de mejora del M08, ¿cuál es el error más común al analizar datos de desempeño?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Analizar la tasa de conversión en lugar del ticket promedio."},{"id":"b","texto":"Revisar los datos cada semana en lugar de cada mes."},{"id":"c","texto":"Analizar y no actuar — identificar el problema sin tomar una acción específica y concreta."},{"id":"d","texto":"Usar el total en lugar del dato por canal."}]$repaso_json_024$::jsonb,
  'c',
  'El M08 lo dice explícitamente: el ciclo solo funciona cuando el Paso 3 (Actuar) es específico y concreto. No ''voy a responder más rápido'' sino ''voy a activar las notificaciones de ML hoy''. Sin acción, el análisis no cambia nada.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Kotler calculó que un cliente insatisfecho cuenta su experiencia a entre 9 y 15 personas. ¿Cuánto cuesta adquirir un cliente nuevo versus retener uno existente?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"El doble."},{"id":"b","texto":"Lo mismo."},{"id":"c","texto":"Entre 5 y 7 veces más."},{"id":"d","texto":"10 veces más."}]$repaso_json_024$::jsonb,
  'c',
  'Dato del M09 y M01. Kotler calculó que la retención cuesta entre 5 y 7 veces menos que la adquisición. Por eso la postventa y la fidelización no son extras del trabajo — son la inversión más rentable que puede hacer un vendedor.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuáles son los 5 valores institucionales de Martínez Neumáticos según el M01?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Velocidad, Precio, Variedad, Garantía y Calidad."},{"id":"b","texto":"Calidad, Honestidad, Compromiso con el cliente, Trabajo en equipo y Capacitación continua."},{"id":"c","texto":"Profesionalismo, Rapidez, Atención, Resultado y Economía."},{"id":"d","texto":"Confianza, Precio justo, Servicio, Experiencia y Familia."}]$repaso_json_024$::jsonb,
  'b',
  'Los 5 valores del M01 son: Calidad, Honestidad, Compromiso con el cliente, Trabajo en equipo y Capacitación continua. El programa completo está construido sobre estos valores.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué significa ''la objeción encubierta'' según el M06?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Una objeción que el cliente expresa de forma muy agresiva."},{"id":"b","texto":"La duda real que el cliente no verbaliza y que se esconde detrás de 'lo pienso' u otras respuestas evasivas."},{"id":"c","texto":"Una objeción sobre el precio que el vendedor no puede resolver."},{"id":"d","texto":"La queja que el cliente deja en las redes sociales después de la compra."}]$repaso_json_024$::jsonb,
  'b',
  'El M06 explica que la objeción encubierta es la más difícil porque no se puede responder a algo que no se dice. La herramienta para descubrirla es la pregunta directa: ''¿Hay algo que no terminó de quedar claro?''',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según el M01, ¿qué rol cumple el vendedor en la estrategia digital de Martínez Neumáticos?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"La IA y los bots manejan el canal digital, el vendedor solo atiende en persona."},{"id":"b","texto":"La publicidad y la IA traen consultas, pero el vendedor es quien convierte. Nunca delegar el cierre a un bot."},{"id":"c","texto":"El vendedor publica contenido en redes sociales para generar consultas."},{"id":"d","texto":"El vendedor responde preguntas técnicas que la IA no puede responder."}]$repaso_json_024$::jsonb,
  'b',
  'Esta es la filosofía central del programa: la automatización trae al cliente a la puerta, el vendedor humano lo hace entrar y cierra la venta. El M07 repite: ''La IA puede responder el primer mensaje. El vendedor es el que convierte.''',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según el M04, ¿qué descubrió el neurocientífico Antonio Damasio sobre las emociones y las decisiones?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Que las personas toman mejores decisiones cuando están tranquilas emocionalmente."},{"id":"b","texto":"Que las personas sin acceso a sus emociones son incapaces de tomar decisiones, aunque su capacidad lógica esté intacta."},{"id":"c","texto":"Que las emociones negativas bloquean la compra y deben evitarse."},{"id":"d","texto":"Que los compradores con alto nivel educativo deciden más racionalmente."}]$repaso_json_024$::jsonb,
  'b',
  'Damasio estudió pacientes con daño en la parte emocional del cerebro: podían comparar opciones infinitamente pero no podían elegir. Esto demuestra que las decisiones de compra son fundamentalmente emocionales, base del M04.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué hace un vendedor de primera liga cuando no tiene clientes en el salón?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Descansa para estar fresco cuando lleguen los clientes."},{"id":"b","texto":"Actualiza sus redes sociales personales."},{"id":"c","texto":"Revisa el sistema, llama clientes para seguimiento, estudia el material del programa."},{"id":"d","texto":"Espera pacientemente hasta que llegue el próximo cliente."}]$repaso_json_024$::jsonb,
  'c',
  'El M01 describe que el tiempo sin clientes presenciales se destina a acciones de postventa, revisión de registros, actualización de la agenda o capacitación. ''El vendedor que mantiene contacto permanente con sus clientes nunca se queda sin trabajo.''',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la regla de oro del up-selling honesto según el M03?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Siempre ofrecer todos los servicios disponibles para maximizar el ticket."},{"id":"b","texto":"Hacer las tres preguntas: ¿hay señal real? ¿puedo explicar el beneficio? ¿lo recomendaría a un familiar? Si las tres son sí, hacerlo."},{"id":"c","texto":"Ofrecer servicios adicionales solo cuando el cliente los pide."},{"id":"d","texto":"Incluir siempre alineación y balanceo sin preguntar."}]$repaso_json_024$::jsonb,
  'b',
  'El M03 define el up-selling honesto como aquel que responde sí a tres preguntas: señal real, beneficio explicable y recomendable a un familiar. Si alguna respuesta es no, no hacer la recomendación.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según el M05, ¿qué debe hacer el vendedor si detecta que el cliente con miedo tiene los neumáticos en buen estado?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Aprovechar la visita para recomendar el cambio preventivo igual."},{"id":"b","texto":"Decírselo con total honestidad: 'Tus neumáticos están bien, no necesitás cambiarlos todavía.'"},{"id":"c","texto":"No mencionar el estado y ofrecer una revisión paga."},{"id":"d","texto":"Recomendarle que vuelva en un mes para una segunda revisión."}]$repaso_json_024$::jsonb,
  'b',
  'El M05 es explícito: la honestidad es el único camino con el cliente desconfiado. Si el neumático está bien y se lo decís, ese cliente vuelve cuando realmente necesita. Mentir o inflar el problema destruye la confianza para siempre.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la nota mínima escalonada del programa según la dificultad de los módulos?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"80% en todos los módulos."},{"id":"b","texto":"85% en M01-M03, 90% en M04-M07, 95% en M08-M10."},{"id":"c","texto":"90% en todos los módulos."},{"id":"d","texto":"85% en M01-M05, 95% en M06-M10."}]$repaso_json_024$::jsonb,
  'b',
  'El programa tiene nota mínima escalonada: 85% para los módulos de base (M01-M03), 90% para los módulos de venta y canales (M04-M07) y 95% para los módulos de análisis, cierre y certificación (M08-M10).',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según el M09, ¿qué es lo que NUNCA debe hacer el cliente cuando su vehículo está siendo atendido?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Retirarse del local mientras el auto está en el taller."},{"id":"b","texto":"Preguntar al mecánico directamente qué le están haciendo al auto."},{"id":"c","texto":"Llamar por teléfono para consultar si ya está listo."},{"id":"d","texto":"Pagar antes de ver el resultado del trabajo."}]$repaso_json_024$::jsonb,
  'b',
  'El M09 establece que el vendedor es el intermediario entre el taller y el cliente. El cliente nunca debe tener que preguntar al mecánico — el vendedor lo informa. Este protocolo protege la imagen profesional del local.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué información sobre el cliente debe registrar el vendedor en el sistema después de cada atención, según el M08?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Solo nombre y teléfono."},{"id":"b","texto":"Canal, resultado, vehículo, medida, código de vendedor, servicios y motivo de no venta si aplica."},{"id":"c","texto":"Únicamente las ventas cerradas con monto total."},{"id":"d","texto":"Nombre, correo electrónico y calificación QR."}]$repaso_json_024$::jsonb,
  'b',
  'El M08 detalla todos los campos obligatorios. Sin estos datos, el análisis de conversión por canal, el seguimiento y el cálculo del ticket promedio son imposibles. El registro completo es la base de toda mejora.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según Dale Carnegie citado en el M07, ¿cuál es ''el sonido más dulce en cualquier idioma para cualquier persona''?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"La palabra 'gratis'."},{"id":"b","texto":"El nombre propio de cada persona."},{"id":"c","texto":"Las palabras 'te entiendo'."},{"id":"d","texto":"El sonido del dinero."}]$repaso_json_024$::jsonb,
  'b',
  'Carnegie identificó que usar el nombre del cliente genera sensación de atención personalizada. El M07 lo aplica al canal digital donde la comunicación es masiva por naturaleza: usar el nombre personaliza y genera cercanía.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué porcentaje del impacto de la comunicación en ventas proviene del lenguaje no verbal según Brian Tracy, citado en el M01?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"25%."},{"id":"b","texto":"38%."},{"id":"c","texto":"55%."},{"id":"d","texto":"70%."}]$repaso_json_024$::jsonb,
  'c',
  'Tracy cita que el 55% del impacto de la comunicación en ventas proviene del lenguaje no verbal (postura, gestos, contacto visual). Solo el 7% proviene de las palabras. Por eso el M01 dedica una sección completa al lenguaje corporal y la imagen profesional.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la ''agenda rápida'' de recepción del cliente definida en el M01?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Saludar, Preguntar, Cotizar, Cerrar, Registrar."},{"id":"b","texto":"Levantate, Sonreí, Presentate, Agradecé, Asesora."},{"id":"c","texto":"Bienvenida, Precio, Servicio, Pago, Despedida."},{"id":"d","texto":"Escuchar, Validar, Aportar, Cerrar, Registrar."}]$repaso_json_024$::jsonb,
  'b',
  'Esta es la secuencia del M01 para la recepción del cliente: Levantate (nunca atender sentado), Sonreí (genuino), Presentate (nombre y apellido), Agradecé (la visita) y Asesora. Son los cinco pasos mínimos de un primer contacto profesional.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Un cliente comenta en Instagram: ''¿Cuánto salen los Pirelli?'' ¿Cuál es la respuesta correcta del vendedor según el M07?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Publicar el precio en el comentario para que todos los seguidores lo vean."},{"id":"b","texto":"Ignorar el comentario porque Instagram no es canal de ventas."},{"id":"c","texto":"Responder públicamente y redirigir al DM, luego en el DM redirigir al WhatsApp."},{"id":"d","texto":"Enviar directamente al local sin más información."}]$repaso_json_024$::jsonb,
  'c',
  'El M07 establece que en comentarios públicos se responde brevemente y se redirige al DM. Nunca se da precio en comentarios (lo ven los competidores). Desde el DM, se redirige al WhatsApp donde la conversación de venta puede desarrollarse bien.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según el M04, ¿cuál es el banco de historias y por qué es valioso?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"El registro de todas las marcas disponibles con sus fichas técnicas."},{"id":"b","texto":"Un repositorio de historias reales de clientes satisfechos que el vendedor usa para generar identificación."},{"id":"c","texto":"El historial de ventas del vendedor que se revisa mensualmente."},{"id":"d","texto":"Los testimonios escritos que los clientes dejan en el local."}]$repaso_json_024$::jsonb,
  'b',
  'El M04, basado en Jonathan Gottschall, explica que las historias activan zonas del cerebro vinculadas a la experiencia propia. Una historia real de un cliente similar hace que el prospecto se vea a sí mismo en esa historia y quiera ese resultado.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál de las siguientes frases es una ''frase prohibida'' según el M04?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"'Para el uso que me describís, este neumático es el que más te conviene.'"},{"id":"b","texto":"'Cualquiera sirve para tu auto.'"},{"id":"c","texto":"'Lo vas a sentir en la primera curva.'"},{"id":"d","texto":"'Para los viajes que hacés, yo elegiría Continental.'"}]$repaso_json_024$::jsonb,
  'b',
  'El M04 lista ''cualquiera sirve para tu auto'' como frase prohibida porque comunica que el vendedor no está interesado en encontrar la mejor solución para el cliente. Destruye la percepción de asesoramiento profesional de inmediato.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según el M06, ¿cuándo es el momento correcto para dejar de insistir con un cliente?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Después del primer 'no'."},{"id":"b","texto":"Cuando el cliente ha dicho no de forma clara más de dos veces, o cuando seguir genera incomodidad."},{"id":"c","texto":"Nunca — siempre hay que insistir hasta cerrar."},{"id":"d","texto":"Cuando el cliente menciona a la competencia."}]$repaso_json_024$::jsonb,
  'b',
  'El M06 define que hay un límite donde insistir destruye una relación. La señal: el no reiterado, el lenguaje corporal cerrado, o la incomodidad visible. El vendedor que para bien mantiene abierta la posibilidad de que ese cliente vuelva.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la meta inicial de calificación promedio del cliente para el equipo completo según las KPIs del programa?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"4.0 estrellas."},{"id":"b","texto":"4.8 estrellas."},{"id":"c","texto":"4.2 estrellas."},{"id":"d","texto":"3.5 estrellas."}]$repaso_json_024$::jsonb,
  'c',
  'Las KPIs del M10 establecen una meta inicial de 4.2 estrellas promedio para el equipo. El nivel Élite individual requiere 4.5 sostenido durante 3 meses. La diferencia es que el equipo empieza con una meta alcanzable que sube con el tiempo.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Por qué no se debe pedir la calificación QR a un cliente que claramente quedó insatisfecho?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Porque el sistema solo acepta calificaciones positivas."},{"id":"b","texto":"Porque casi garantiza una reseña negativa y refuerza que la empresa solo se preocupa por los números, no por el cliente."},{"id":"c","texto":"Porque los clientes insatisfechos nunca completan las encuestas."},{"id":"d","texto":"Porque la calificación baja penaliza al vendedor automáticamente."}]$repaso_json_024$::jsonb,
  'b',
  'El M09 es claro: primero resolver la insatisfacción, después pedir la calificación si corresponde. Pedir calificación a un cliente insatisfecho es un doble error: obtés una reseña negativa y demostrás que priorizás el número sobre el cliente real.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuáles son los tres niveles de necesidad del cliente definidos en el M05?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Necesidad básica, necesidad media, necesidad premium."},{"id":"b","texto":"Necesidad explícita, necesidad implícita, necesidad latente."},{"id":"c","texto":"Necesidad de precio, necesidad de seguridad, necesidad de urgencia."},{"id":"d","texto":"Necesidad técnica, necesidad emocional, necesidad económica."}]$repaso_json_024$::jsonb,
  'b',
  'El M05 define tres niveles: Explícita (lo que el cliente dice que necesita), Implícita (el problema de fondo que no nombra) y Latente (lo que no sabe que necesita hasta que alguien se lo muestra). El diagnóstico completo trabaja los tres niveles.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según el M01, ¿cuál es el rol de la ''voz unificada'' en Martínez Neumáticos?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Que todos los vendedores usen exactamente las mismas frases memorizadas."},{"id":"b","texto":"Garantizar que cualquier cliente, en cualquier punto de contacto, reciba la misma calidad de atención y el mismo mensaje central."},{"id":"c","texto":"Que el gerente apruebe todos los mensajes antes de enviarlos a clientes."},{"id":"d","texto":"Publicar el mismo contenido en todas las redes sociales simultáneamente."}]$repaso_json_024$::jsonb,
  'b',
  'Kotler y Keller explican que la coherencia en la comunicación convierte transacciones en relaciones. El M01 aplica esto: no es repetir frases sino actuar bajo los mismos valores, protocolos y estándares en cada interacción.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué debe hacer el vendedor cuando el cliente no puede dejar el auto hoy pero está interesado, según el M09?',
  'ventas',
  $repaso_json_024$[{"id":"a","texto":"Despedirse y esperar que el cliente vuelva por su cuenta."},{"id":"b","texto":"Bajar el precio para motivar que vuelva pronto."},{"id":"c","texto":"Agendar el turno en ese momento: 'Te agendo ahora y cuando vengas ya tenemos todo listo para que no pierdas tiempo.'"},{"id":"d","texto":"Enviarle el precio por WhatsApp y esperar su respuesta."}]$repaso_json_024$::jsonb,
  'c',
  'El cierre ''por agenda'' del M09 establece que el cliente que agenda, en el 80% de los casos, viene. El cliente que se va sin agendar rara vez vuelve por cuenta propia. El vendedor propone el turno en el momento — no lo deja para después.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué significa la letra ''R'' en la medida de un neumático como ''185/65 R15 88H''?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Radio del neumático en centímetros."},{"id":"b","texto":"Refuerzo lateral del flanco."},{"id":"c","texto":"Construcción Radial."},{"id":"d","texto":"Resistencia al desgaste."}]$repaso_json_024$::jsonb,
  'c',
  'La ''R'' indica construcción Radial, que es el estándar actual en vehículos de pasajeros. Los neumáticos radiales tienen las capas de la carcasa perpendiculares al sentido de marcha, lo que da mayor superficie de contacto, mejor confort y menor temperatura.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'En la medida ''185/65 R15 88H'', ¿qué indica el número ''185''?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"El peso máximo que soporta el neumático en kg."},{"id":"b","texto":"El ancho de la banda de rodamiento en milímetros."},{"id":"c","texto":"El radio del aro en pulgadas."},{"id":"d","texto":"La velocidad máxima en km/h."}]$repaso_json_024$::jsonb,
  'b',
  'El primer número siempre es el ancho de la banda de rodamiento en milímetros. En este caso, 185 mm de flanco a flanco. Es la primera medida que hay que verificar al recomendar un neumático.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué neumático se recomienda para un cliente que busca máxima seguridad en ruta con lluvia frecuente y tiene familia?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Chao Yang."},{"id":"b","texto":"Corven."},{"id":"c","texto":"Continental."},{"id":"d","texto":"Cargo Power."}]$repaso_json_024$::jsonb,
  'c',
  'Continental es el referente mundial en seguridad activa. Sus neumáticos están diseñados para adherencia en condiciones adversas, menor distancia de frenado en mojado y comportamiento en curvas con lluvia. Es la elección correcta para este perfil según el M02.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la principal señal de alerta que indica que un auto necesita alineación?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"El motor hace más ruido de lo normal."},{"id":"b","texto":"El auto tira hacia un lado al manejar en línea recta."},{"id":"c","texto":"El volante vibra a velocidades altas."},{"id":"d","texto":"El auto consume más combustible."}]$repaso_json_024$::jsonb,
  'b',
  'La señal más característica de la desalineación es que el auto tira hacia un lado al manejar en línea recta en superficie plana. La vibración del volante a alta velocidad es señal de desbalanceo, no de desalineación.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué servicio deben realizarse siempre que se instala un neumático nuevo, sin excepción?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Rotación."},{"id":"b","texto":"Revisión de frenos."},{"id":"c","texto":"Balanceo."},{"id":"d","texto":"Cambio de válvulas de aire."}]$repaso_json_024$::jsonb,
  'c',
  'El M03 establece que el balanceo es obligatorio cada vez que se cambia un neumático. Aunque el neumático sea nuevo y de alta calidad, siempre presenta pequeñas variaciones de peso que generan vibración sin el balanceo corrector.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué marca del portafolio de Martínez Neumáticos está orientada exclusivamente al segmento agropecuario?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Cargo Power."},{"id":"b","texto":"Guestlake."},{"id":"c","texto":"SEAT Agrícola."},{"id":"d","texto":"Corven Camión."}]$repaso_json_024$::jsonb,
  'c',
  'SEAT Agrícola es la marca especializada en maquinaria del agro: tractores, cosechadoras, sembradoras e implementos. El M02 señala que un vendedor que conoce este segmento tiene una ventaja enorme porque la competencia en neumáticos agrícolas especializados es menor.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué diferencia existe entre el desgaste ''en los bordes'' y el desgaste ''en el centro'' de un neumático?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Desgaste en bordes = subinflado. Desgaste en centro = sobreinflado."},{"id":"b","texto":"Desgaste en bordes = sobreinflado. Desgaste en centro = subinflado."},{"id":"c","texto":"Ambos indican desalineación."},{"id":"d","texto":"Ambos indican desbalanceo."}]$repaso_json_024$::jsonb,
  'a',
  'El M09 explica el protocolo de inspección visual. Desgaste en los bordes indica que el neumático está trabajando con presión insuficiente (subinflado) y apoya solo los laterales. Desgaste en el centro indica sobreinflado, donde solo toca el asfalto la parte central.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la tecnología diferencial de la marca Dunlop que reduce el desgaste y mejora el frenado?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"TurboBand."},{"id":"b","texto":"DECTES."},{"id":"c","texto":"RunFlat System."},{"id":"d","texto":"GreenSystem."}]$repaso_json_024$::jsonb,
  'b',
  'La tecnología DECTES (Dunlop) está diseñada para optimizar el frenado y reducir el desgaste desigual. Es el diferencial técnico que permite recomendarla como ''calidad premium a precio de entrada'', según el M02.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué indica el número ''88'' en la medida ''185/65 R15 88H''?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"La presión de inflado recomendada en PSI."},{"id":"b","texto":"El índice de carga: la capacidad máxima de peso que soporta cada neumático (88 = 560 kg)."},{"id":"c","texto":"El año de fabricación del neumático."},{"id":"d","texto":"El porcentaje de caucho natural en la composición."}]$repaso_json_024$::jsonb,
  'b',
  'El índice de carga es un número que corresponde a la capacidad máxima de peso que puede soportar ese neumático. El valor 88 equivale a 560 kg por unidad. Para camionetas y uso de carga, este dato es crítico.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la señal más característica que indica que un neumático necesita balanceo?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"El auto tira hacia la derecha al frenar."},{"id":"b","texto":"Vibración en el volante que aparece a velocidades específicas (generalmente entre 80 y 120 km/h)."},{"id":"c","texto":"Desgaste excesivo en los bordes del neumático."},{"id":"d","texto":"El volante no queda centrado al ir recto."}]$repaso_json_024$::jsonb,
  'b',
  'La vibración que aparece y desaparece a velocidades específicas es la firma del desbalanceo. El desequilibrio de peso de la rueda genera resonancia a ciertas velocidades de rotación. Es exactamente diferente a la vibración de alineación.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la marca del portafolio más recomendada para un cliente joven con camioneta 4x4 que valora la estética además del rendimiento?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Pirelli."},{"id":"b","texto":"Continental."},{"id":"c","texto":"Falken."},{"id":"d","texto":"Chao Yang."}]$repaso_json_024$::jsonb,
  'c',
  'Falken es la marca japonesa (Sumitomo) con fuerte presencia en el segmento deportivo y SUV. Diseño agresivo, buen agarre y resistencia a altas velocidades. El M02 la define para clientes jóvenes con vehículos modificados o de perfil deportivo.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué ángulo de la alineación afecta directamente la estabilidad direccional y el retorno del volante al centro?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Convergencia (Toe)."},{"id":"b","texto":"Avance (Caster)."},{"id":"c","texto":"Ángulo de caída (Camber)."},{"id":"d","texto":"Índice de velocidad."}]$repaso_json_024$::jsonb,
  'b',
  'El Caster o avance es el ángulo del eje de dirección visto desde el lateral. Afecta la estabilidad direccional en línea recta y la tendencia del volante a volver al centro después de una curva. El M03 explica los tres ángulos principales de la alineación.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué indica la letra ''H'' en el índice de velocidad de un neumático?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"El neumático es de uso en hielo y nieve."},{"id":"b","texto":"Velocidad máxima de operación segura de 210 km/h."},{"id":"c","texto":"Alta resistencia al desgaste (High Durability)."},{"id":"d","texto":"Velocidad máxima de 190 km/h."}]$repaso_json_024$::jsonb,
  'b',
  'El índice H indica una velocidad máxima de operación segura de 210 km/h. No significa que deba circular a esa velocidad, sino que el neumático está certificado para soportarla de forma segura. El M02 incluye la tabla completa de índices.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué es la rotación de neumáticos y para qué sirve?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Girar los neumáticos sobre su eje para revisar el interior."},{"id":"b","texto":"Cambiar la posición de los neumáticos entre ejes para distribuir el desgaste parejo en los cuatro."},{"id":"c","texto":"Verificar que los neumáticos giren libremente sin fricción."},{"id":"d","texto":"Cambiar el sentido de rotación del neumático para alargar su vida."}]$repaso_json_024$::jsonb,
  'b',
  'La rotación cambia la posición de los neumáticos entre ejes (delanteros a traseros y viceversa) para equilibrar el desgaste. En tracción delantera, las ruedas delanteras trabajan más y se desgastan hasta un 40% más rápido.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la diferencia técnica principal entre un neumático radial y uno diagonal?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"El radial es para verano y el diagonal para invierno."},{"id":"b","texto":"En el radial las capas van perpendiculares al sentido de marcha; en el diagonal van a 45°."},{"id":"c","texto":"El diagonal tiene más bandas de acero que el radial."},{"id":"d","texto":"El radial es para camiones y el diagonal para autos de pasajeros."}]$repaso_json_024$::jsonb,
  'b',
  'El M02 explica que en los radiales las capas de la carcasa van perpendiculares al sentido de marcha (mayor contacto, mejor eficiencia, más confort). En los diagonales van en diagonal. Los diagonales sobreviven hoy en aplicaciones agrícolas y viales por su rigidez.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuándo se recomienda realizar la alineación según el M03?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Solo cuando el auto tira claramente hacia un lado."},{"id":"b","texto":"Cada 10.000 km o 6 meses, al cambiar neumáticos, y después de cualquier impacto significativo."},{"id":"c","texto":"Una vez al año, independientemente del uso."},{"id":"d","texto":"Solo cuando se reemplaza toda la suspensión."}]$repaso_json_024$::jsonb,
  'b',
  'El M03 establece múltiples motivos para alinear: periodicidad (10.000 km / 6 meses), al instalar neumáticos nuevos, después de golpes fuertes (pozo, cordón) y al reemplazar componentes de suspensión o dirección.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué tipo de desgaste en la banda de rodamiento indica que el amortiguador está fallando?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Desgaste uniforme en toda la banda."},{"id":"b","texto":"Desgaste solo en el borde interno."},{"id":"c","texto":"Desgaste en forma de 'copas' o manchas irregulares en la banda."},{"id":"d","texto":"Desgaste en forma de sierra (un lado sí, un lado no)."}]$repaso_json_024$::jsonb,
  'c',
  'El M03 explica que cuando el amortiguador está gastado, el neumático pierde contacto con el asfalto repetidamente al rebotar. Eso genera puntos de desgaste acelerado en la banda, creando el patrón de ''copas'' o manchas que identifica este problema.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué marcas del portafolio de Martínez Neumáticos están orientadas al transporte de carga y uso intensivo?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Pirelli y Continental."},{"id":"b","texto":"Falken y Dunlop."},{"id":"c","texto":"Cargo Power y Guestlake."},{"id":"d","texto":"Corven y Chao Yang."}]$repaso_json_024$::jsonb,
  'c',
  'Cargo Power y Guestlake están diseñadas para transporte de carga y uso intensivo, priorizando durabilidad y carga útil sobre confort. También existe Pirelli Camión para flotas de larga distancia de alta exigencia.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es el límite mínimo legal de profundidad del dibujo de un neumático en Argentina?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"3 mm."},{"id":"b","texto":"2 mm."},{"id":"c","texto":"1.6 mm."},{"id":"d","texto":"0.8 mm."}]$repaso_json_024$::jsonb,
  'c',
  'El M09 establece que el límite legal de profundidad del dibujo es de 1.6 mm (indicador de desgaste mínimo). Menos de 3 mm: recomendar cambio próximo. Menos de 2 mm: cambio urgente. Por debajo del indicador, el neumático es inapto para circulación segura.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué componente del sistema de frenos se recomienda revisar cada 2 años o 40.000 km por su degradación química?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Las pastillas de freno."},{"id":"b","texto":"Los discos de freno."},{"id":"c","texto":"El líquido de frenos."},{"id":"d","texto":"Los cilindros de rueda."}]$repaso_json_024$::jsonb,
  'c',
  'El M03 explica que el líquido de frenos absorbe humedad con el tiempo, lo que reduce su punto de ebullición. En frenadas intensas, el líquido contaminado puede vaporizarse y generar pérdida total del frenado (''fading''). Se recomienda cambiar cada 2 años o 40.000 km.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la marca argentina del portafolio que ofrece buena relación precio-durabilidad para uso urbano?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Falken."},{"id":"b","texto":"Dunlop."},{"id":"c","texto":"Corven."},{"id":"d","texto":"Continental."}]$repaso_json_024$::jsonb,
  'c',
  'Corven es la marca nacional del portafolio. El M02 la define para remiseros, autos de trabajo diario y clientes con presupuesto ajustado que necesitan durabilidad sin inversión premium.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué es el ''número DOT'' de un neumático y para qué sirve?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"El código que identifica la resistencia al calor del neumático."},{"id":"b","texto":"El número de serie que identifica el neumático y contiene la fecha de fabricación."},{"id":"c","texto":"El índice de tracción en piso mojado."},{"id":"d","texto":"La presión máxima de inflado permitida."}]$repaso_json_024$::jsonb,
  'b',
  'El DOT (Department of Transportation) es el código de identificación del neumático impreso en el flanco. Incluye la fecha de fabricación (las últimas 4 cifras indican semana y año). Es obligatorio para los reclamos de garantía.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la señal principal de que el cliente necesita revisión de amortiguadores según el M03?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"El auto tira hacia un lado al frenar."},{"id":"b","texto":"El auto rebota excesivamente después de pasar un pozo — más de un rebote antes de estabilizarse."},{"id":"c","texto":"El volante vibra a velocidades altas."},{"id":"d","texto":"Los neumáticos delanteros se gastan más rápido que los traseros."}]$repaso_json_024$::jsonb,
  'b',
  'El M03 define el rebote excesivo como la señal más característica de amortiguadores gastados. El amortiguador controla la extensión del resorte; cuando falla, el resorte rebota sin control y la rueda pierde contacto con el suelo en esos momentos.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué ángulo de la alineación se ve afectado cuando el neumático muestra desgaste excesivo en el borde interno o externo?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Caster (avance)."},{"id":"b","texto":"Toe (convergencia/divergencia)."},{"id":"c","texto":"Camber (ángulo de caída)."},{"id":"d","texto":"Presión de inflado."}]$repaso_json_024$::jsonb,
  'c',
  'El M03 explica que el camber incorrecto hace que el neumático apoye solo una parte de su banda en el asfalto. Si está negativo (parte superior hacia adentro), se desgasta el borde interno. Si está positivo, el externo.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Para qué perfil de vehículo se recomienda la marca Falken según el portafolio de Martínez Neumáticos?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Camiones de larga distancia."},{"id":"b","texto":"Maquinaria agrícola."},{"id":"c","texto":"Camionetas 4x4, autos deportivos y vehículos con perfil estético agresivo."},{"id":"d","texto":"Autos familiares de tracción delantera con uso urbano."}]$repaso_json_024$::jsonb,
  'c',
  'Falken (Sumitomo) está orientada al segmento deportivo y SUV. Diseño agresivo, buen agarre en seco y resistencia a altas velocidades. El M02 la recomienda para clientes jóvenes que valoran tanto el rendimiento como la estética.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué consecuencia directa tiene un amortiguador gastado en los neumáticos nuevos que se instalaron?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Aumenta el consumo de combustible del vehículo."},{"id":"b","texto":"Genera desgaste irregular tipo 'copas' porque la rueda pierde contacto con el asfalto repetidamente."},{"id":"c","texto":"Provoca que los neumáticos delanteros se desgasten antes que los traseros."},{"id":"d","texto":"Aumenta la presión de inflado de los neumáticos automáticamente."}]$repaso_json_024$::jsonb,
  'b',
  'El argumento de venta del M03: los neumáticos nuevos van a durar la mitad si los amortiguadores no están bien. El rebote sin control hace que la rueda pierda contacto en fracciones de segundo, generando desgaste puntual en esos momentos.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Con qué frecuencia se recomienda realizar la rotación de neumáticos según el M03?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Cada 5.000 km."},{"id":"b","texto":"Cada 20.000 km."},{"id":"c","texto":"Cada 10.000 km, aprovechando cuando se hace alineación y balanceo."},{"id":"d","texto":"Una sola vez, cuando los delanteros muestran mayor desgaste."}]$repaso_json_024$::jsonb,
  'c',
  'El M03 recomienda la rotación cada 10.000 km, idealmente junto con la alineación y el balanceo para aprovechar que el auto ya está en el local. La sinergia de los tres servicios maximiza la vida útil de los cuatro neumáticos.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la diferencia entre una banda de rodamiento asimétrica y una direccional?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"La asimétrica no se puede rotar; la direccional sí."},{"id":"b","texto":"La asimétrica tiene zonas internas y externas con diseños diferentes para distintas funciones; la direccional tiene una flecha que indica el sentido de rotación y no puede cruzarse de lado."},{"id":"c","texto":"La asimétrica es para lluvia y la direccional para seco."},{"id":"d","texto":"Son términos distintos para el mismo tipo de neumático."}]$repaso_json_024$::jsonb,
  'b',
  'El M02 diferencia ambos tipos. Los asimétricos tienen zonas internas (estabilidad) y externas (agarre en curva) distintas — no se cruzan de lado. Los direccionales tienen flecha de rotación y se rotan solo delantero-trasero del mismo lado.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuáles son los tres ángulos principales que se ajustan en una alineación?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Presión, desgaste y convergencia."},{"id":"b","texto":"Convergencia/divergencia (Toe), ángulo de caída (Camber) y avance (Caster)."},{"id":"c","texto":"Radio, altura y anchura de banda."},{"id":"d","texto":"Índice de carga, índice de velocidad y profundidad del dibujo."}]$repaso_json_024$::jsonb,
  'b',
  'El M03 explica los tres ángulos: Toe (si las ruedas apuntan adentro o afuera), Camber (inclinación vertical de la rueda) y Caster (inclinación del eje de dirección). Cada uno afecta el desgaste y el comportamiento del vehículo de forma diferente.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué indica el índice de velocidad ''V'' en un neumático?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Velocidad máxima de 190 km/h."},{"id":"b","texto":"Velocidad máxima de 210 km/h."},{"id":"c","texto":"Velocidad máxima de 240 km/h."},{"id":"d","texto":"Velocidad máxima de 270 km/h."}]$repaso_json_024$::jsonb,
  'c',
  'Según la tabla del M02: V = 240 km/h. La escala va de N (140 km/h) hasta W/Y (270-300 km/h). El índice V es típico de autos de alta performance y algunos SUV deportivos.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué tipo de neumático se recomienda para un productor agropecuario con un tractor?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Dunlop DECTES."},{"id":"b","texto":"SEAT Agrícola."},{"id":"c","texto":"Falken AT."},{"id":"d","texto":"Guestlake."}]$repaso_json_024$::jsonb,
  'b',
  'SEAT Agrícola es la línea específica para maquinaria del agro. Sus diseños de banda están optimizados para minimizar la compactación del suelo, maximizar la tracción en terrenos blandos y resistir las condiciones del trabajo rural.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es el rol del cinturón de acero en la construcción de un neumático?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Aportar flexibilidad lateral para mayor confort."},{"id":"b","texto":"Reforzar la estructura bajo la banda para mayor resistencia a pinchazos y estabilidad a alta velocidad."},{"id":"c","texto":"Conectar el neumático a la llanta en el talón."},{"id":"d","texto":"Regular la presión de aire en el interior."}]$repaso_json_024$::jsonb,
  'b',
  'El M02 explica que los cinturones de acero van debajo de la banda de rodamiento. Dan mayor resistencia a pinchazos, mejor estabilidad a alta velocidad y mayor vida útil. Son uno de los indicadores de calidad de un neumático premium.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  'Según el M03, ¿cuándo es obligatorio hacer el balanceo aunque el cliente no tenga síntomas de vibración?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Cuando el auto cumple 20.000 km."},{"id":"b","texto":"Siempre que se cambia un neumático, sin excepción."},{"id":"c","texto":"Solo cuando se detectan vibraciones visibles."},{"id":"d","texto":"Cuando se hace la alineación al mismo tiempo."}]$repaso_json_024$::jsonb,
  'b',
  'El M03 es categórico: el balanceo se realiza siempre que se cambia un neumático. Los neumáticos nuevos siempre tienen pequeñas variaciones de peso. Sin balanceo, el trabajo queda a medias aunque el cliente no lo note de inmediato.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es el argumento económico correcto para vender la rotación de neumáticos a un cliente que no quiere gastar más?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"La rotación es muy barata así que conviene hacerla igual."},{"id":"b","texto":"Sin rotación, los delanteros se gastan antes y el cliente termina comprando en momentos separados, sin optimizar la inversión. Con rotación, los cuatro llegan juntos al fin de su vida útil."},{"id":"c","texto":"La rotación evita tener que hacer balanceo después."},{"id":"d","texto":"La rotación es obligatoria por ley cada 10.000 km."}]$repaso_json_024$::jsonb,
  'b',
  'El M03 define este como el argumento económico de la rotación: sin ella, el cliente cambia dos neumáticos ahora y dos más tarde, con costos separados y neumáticos de diferente desgaste. Con rotación, los cuatro rinden parejo y se cambian juntos.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué sucede con el vehículo cuando los amortiguadores están gastados y el cliente frena de emergencia?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"El auto frena más rápido porque el peso se transfiere al eje delantero."},{"id":"b","texto":"El auto no frena bien porque la rueda puede perder contacto con el asfalto en los rebotes, perdiendo tracción."},{"id":"c","texto":"El ABS compensa automáticamente la falta de amortiguación."},{"id":"d","texto":"Solo afecta el confort, no la capacidad de frenado."}]$repaso_json_024$::jsonb,
  'b',
  'El M03 explica que el amortiguador mantiene el contacto del neumático con el suelo. Cuando falla, en los rebotes la rueda pierde contacto por fracciones de segundo. En ese momento el auto no frena ni responde a la dirección, lo que es peligroso en emergencias.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es el perfil del dibujo que corresponde a un neumático con desgaste de ''un solo lado''?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Desbalanceo."},{"id":"b","texto":"Sobreinflado."},{"id":"c","texto":"Problema de alineación (camber o toe fuera de rango)."},{"id":"d","texto":"Neumático de mala calidad."}]$repaso_json_024$::jsonb,
  'c',
  'El M03 y M09 explican que el desgaste localizado en un solo borde (interno o externo) es señal de problema de alineación. El ángulo de camber o toe incorrecto hace que el neumático apoye de forma asimétrica en el asfalto.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la diferencia entre Pirelli Automóvil y Pirelli Camión del portafolio de Martínez?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Pirelli Automóvil es importado y Pirelli Camión es de producción nacional."},{"id":"b","texto":"Pirelli Automóvil está orientado a autos de alta gama y conductores exigentes; Pirelli Camión cubre transporte pesado de larga distancia con foco en durabilidad operativa."},{"id":"c","texto":"Son exactamente iguales pero en diferentes medidas."},{"id":"d","texto":"Pirelli Camión no tiene garantía Pinin Farina."}]$repaso_json_024$::jsonb,
  'b',
  'El M02 define ambas líneas por separado. Pirelli Automóvil apunta al segmento premium de pasajeros (performance, seguridad). Pirelli Camión apunta al transporte pesado de larga distancia donde el costo por kilómetro es el indicador clave.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué es el ''aquaplaning'' y qué característica del neumático lo previene?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Es el desgaste acelerado por agua. Lo previene el compuesto de caucho duro."},{"id":"b","texto":"Es la pérdida de contacto del neumático con el asfalto al circular sobre agua. Lo previene el diseño eficiente de evacuación de agua de la banda de rodamiento."},{"id":"c","texto":"Es la corrosión interna del neumático por humedad. Lo previene el cinturón de acero."},{"id":"d","texto":"Es el calentamiento excesivo del neumático en lluvia. Lo previene el perfil bajo."}]$repaso_json_024$::jsonb,
  'b',
  'El aquaplaning ocurre cuando el neumático no puede desalojar el agua a suficiente velocidad y ''flota'' sobre ella perdiendo toda tracción, dirección y frenado. Los canales de evacuación de agua en la banda son el principal factor preventivo.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la señal de que los frenos necesitan revisión urgente según el M03?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"El pedal del freno está rígido y duro."},{"id":"b","texto":"Se escucha ruido de raspado profundo al frenar (metal contra metal)."},{"id":"c","texto":"El auto demora 3 segundos más en frenar que antes."},{"id":"d","texto":"Las llantas se calientan más de lo normal."}]$repaso_json_024$::jsonb,
  'b',
  'El ruido de raspado profundo al frenar es la señal de máxima urgencia: indica que la pastilla llegó al límite y el metal está rozando directamente sobre el disco. En ese punto el sistema de frenos está comprometido y debe revisarse de inmediato.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la función técnica del tren delantero en relación directa con la durabilidad de los neumáticos?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Regula la presión de inflado automáticamente."},{"id":"b","texto":"Si rótulas o terminales están desgastadas, la alineación no dura porque los ángulos se van de rango apenas el vehículo circula."},{"id":"c","texto":"Evita que los neumáticos se sobreinfladen al tomar curvas."},{"id":"d","texto":"Conecta el motor con las ruedas delanteras en tracción delantera."}]$repaso_json_024$::jsonb,
  'b',
  'El M03 explica que alinear un auto con tren delantero desgastado es inútil: los ángulos vuelven a salirse de rango inmediatamente. Es como ajustar un cuadro en una pared floja. Primero verificar el tren, después alinear.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuántos servicios ofrece Martínez Neumáticos en su local propio?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Solo neumáticos y alineación."},{"id":"b","texto":"Neumáticos, alineación, balanceo, frenos, amortiguadores, rotación y chequeo general."},{"id":"c","texto":"Neumáticos y balanceo únicamente."},{"id":"d","texto":"Todos los servicios de mecánica incluyendo motor y caja."}]$repaso_json_024$::jsonb,
  'b',
  'El M01 y M03 listan los 7 servicios del local propio: venta de neumáticos, alineación, balanceo, reparación de frenos, colocación de amortiguadores, rotación de neumáticos y chequeo general. Todo en el mismo lugar es el diferencial central.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la diferencia de uso recomendado entre Continental y Dunlop del portafolio?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Continental para camiones, Dunlop para autos."},{"id":"b","texto":"Continental prioriza la seguridad activa en condiciones adversas (lluvia, frenado de emergencia); Dunlop ofrece calidad premium a precio de entrada para uso mixto ciudad-ruta."},{"id":"c","texto":"Continental es nacional y Dunlop es importado."},{"id":"d","texto":"Son intercambiables para cualquier uso."}]$repaso_json_024$::jsonb,
  'b',
  'El M02 los diferencia claramente. Continental para clientes que priorizan seguridad en condiciones adversas (lluvia, ruta, familia). Dunlop para quienes quieren calidad de primer nivel sin pagar el tope de gama.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué sucede con el consumo de combustible de un vehículo cuando los neumáticos están desalineados?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Disminuye porque las ruedas desalineadas giran más rápido."},{"id":"b","texto":"No cambia; la alineación no afecta el consumo."},{"id":"c","texto":"Aumenta porque las ruedas desalineadas generan mayor resistencia al rodamiento y el motor debe trabajar más."},{"id":"d","texto":"Aumenta solo en vehículos diesel, no en nafteros."}]$repaso_json_024$::jsonb,
  'c',
  'El M03 explica que con desalineación, las ruedas no trabajan en la misma dirección y algunas son arrastradas lateralmente. Ese arrastre genera resistencia al rodamiento que obliga al motor a compensar, aumentando el consumo.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Qué información aparece en el flanco del neumático que permite identificar cuándo fue fabricado?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"El número de serie DOT — las últimas 4 cifras indican la semana y el año de fabricación."},{"id":"b","texto":"La fecha de vencimiento impresa en relieve."},{"id":"c","texto":"El código de color en la banda lateral."},{"id":"d","texto":"El número de lote en el talón interior."}]$repaso_json_024$::jsonb,
  'a',
  'El número DOT, explicado en el M02, incluye en sus últimas 4 cifras la semana y el año de fabricación. Ejemplo: 2323 = semana 23 del año 2023. Es el dato que se verifica para reclamos de garantía.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál de estos servicios es especialmente importante para detectar necesidades futuras y fidelizar al cliente?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"La alineación."},{"id":"b","texto":"El balanceo."},{"id":"c","texto":"El chequeo general del auto."},{"id":"d","texto":"La rotación de neumáticos."}]$repaso_json_024$::jsonb,
  'c',
  'El M03 define el chequeo general como ''la herramienta de fidelización más poderosa del local''. Permite detectar necesidades futuras y comunicárselas al cliente: ''en 3 meses revisemos los traseros''. Ese cliente vuelve porque alguien lo cuidó.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Por qué el desgaste irregular de un solo flanco del neumático puede indicar un problema en el tren delantero y no solo de alineación?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Porque el tren delantero regula la presión de los neumáticos."},{"id":"b","texto":"Porque si las rótulas o terminales tienen juego, la alineación se pierde continuamente y el neumático desgasta de forma asimétrica a pesar de haber sido alineado recientemente."},{"id":"c","texto":"Porque el tren delantero afecta solo a los neumáticos traseros."},{"id":"d","texto":"Porque el desgaste en un flanco siempre indica sobrecarga del vehículo."}]$repaso_json_024$::jsonb,
  'b',
  'El M03 explica esta relación: si el tren delantero tiene componentes desgastados (rótulas, terminales), los ángulos de alineación se mueven durante la conducción. El resultado es desgaste asimétrico aunque el auto haya sido alineado correctamente.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es la condición principal de la Garantía Pinin Farina que cubre roturas accidentales?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Cubre todo tipo de daños en cualquier neumático de Martínez Neumáticos."},{"id":"b","texto":"Solo aplica a la línea Eximia by Pininfarina durante los primeros 6 meses desde la compra."},{"id":"c","texto":"Aplica a todas las marcas premium por 12 meses."},{"id":"d","texto":"Cubre neumáticos comprados tanto en el local como por internet."}]$repaso_json_024$::jsonb,
  'b',
  'El M02 es específico: la garantía por roturas accidentales aplica exclusivamente a la línea Eximia by Pininfarina (en sus versiones Eximia, Sport, SUV, HP, HP SUV) y tiene una duración de 6 meses desde la fecha de la factura de compra.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es el argumento técnico correcto para explicar por qué un neumático nuevo sin balanceo puede desgastarse irregularmente?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Los neumáticos nuevos tienen caucho más blando que necesita adaptarse al asfalto."},{"id":"b","texto":"Todo neumático tiene pequeñas variaciones de peso en su construcción. Sin balanceo, la rueda vibra y genera puntos de mayor presión en la banda que se desgastan antes."},{"id":"c","texto":"Los neumáticos nuevos necesitan un período de rodaje de 500 km antes del balanceo."},{"id":"d","texto":"Solo los neumáticos de marcas económicas necesitan balanceo; los premium no."}]$repaso_json_024$::jsonb,
  'b',
  'El M03 explica que incluso los neumáticos premium tienen variaciones de peso por construcción. Sin balanceo, el desequilibrio genera vibración que a su vez genera puntos de mayor presión en la banda de rodamiento, acelerando el desgaste en esos puntos.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál de estas combinaciones de servicios es la más natural y recomendable cuando el cliente cambia los cuatro neumáticos?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Neumáticos + revisión de frenos."},{"id":"b","texto":"Neumáticos + alineación + balanceo + chequeo general."},{"id":"c","texto":"Neumáticos + rotación (de los que acaban de poner)."},{"id":"d","texto":"Neumáticos + cambio de líquido de frenos."}]$repaso_json_024$::jsonb,
  'b',
  'El M03 define esta como la combinación más natural: alineación (para que el neumático nuevo dure lo que tiene que durar), balanceo (obligatorio al cambiar), y chequeo general (para detectar necesidades y fidelizar). Juntos maximizan el ticket y el servicio.',
  true
);
insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (
  '¿Cuál es el impacto técnico de circular con presión incorrecta (subinflado) en la vida útil del neumático?',
  'producto',
  $repaso_json_024$[{"id":"a","texto":"Ninguno, la presión solo afecta el confort del conductor."},{"id":"b","texto":"Reduce la vida útil porque el neumático apoya solo en los bordes, genera calor excesivo y deforma la estructura interna."},{"id":"c","texto":"Aumenta la vida útil porque hay mayor superficie de contacto con el asfalto."},{"id":"d","texto":"Solo afecta el consumo de combustible, no el desgaste."}]$repaso_json_024$::jsonb,
  'b',
  'Con subinflado, el neumático no mantiene su forma correcta: los bordes tocan el asfalto más que el centro, generando desgaste asimétrico, mayor temperatura interna (que degrada el caucho) y riesgo de deformación estructural permanente.',
  true
);
commit;
