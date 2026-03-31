-- =====================================================
-- 003_seed_data.sql
-- Datos iniciales para desarrollo y pruebas
-- Ejecutar DESPUÉS de 001 y 002
--
-- IMPORTANTE: Este archivo es solo para desarrollo.
-- En producción crear el admin desde el panel de Supabase
-- o con un script separado con contraseñas seguras.
-- =====================================================

-- ─────────────────────────────────────────────────────
-- USUARIO ADMIN inicial
-- Email: admin@martinez.com
-- Password: Admin1234!
-- Hash generado con bcrypt, saltRounds: 12
-- ─────────────────────────────────────────────────────
INSERT INTO users (
  id,
  email,
  password_hash,
  nombre,
  apellido,
  rol,
  activo
) VALUES (
  uuid_generate_v4(),
  'admin@martinez.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oA6D.c5hy', -- Admin1234!
  'Administrador',
  'Martínez',
  'admin',
  true
);

-- ─────────────────────────────────────────────────────
-- VENDEDOR de prueba
-- Email: vendedor@martinez.com
-- Password: Vendedor1234!
-- ─────────────────────────────────────────────────────
INSERT INTO users (
  id,
  email,
  password_hash,
  nombre,
  apellido,
  rol,
  activo
) VALUES (
  uuid_generate_v4(),
  'vendedor@martinez.com',
  '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uAfRZQ5yK', -- Vendedor1234!
  'Juan',
  'Pérez',
  'vendedor',
  true
);

-- ─────────────────────────────────────────────────────
-- MÓDULOS de capacitación de ejemplo
-- ─────────────────────────────────────────────────────
INSERT INTO modulos (titulo, descripcion, orden, duracion_min, activo)
VALUES
  (
    'Introducción a los Neumáticos',
    'Conocé los tipos de neumáticos, sus componentes y cómo leer la nomenclatura. Base fundamental para todo vendedor.',
    1,
    45,
    true
  ),
  (
    'Técnicas de Venta',
    'Estrategias para identificar las necesidades del cliente y recomendar el neumático correcto según su vehículo y uso.',
    2,
    60,
    true
  ),
  (
    'Mantenimiento y Seguridad',
    'Presión correcta, rotación, alineación y cuándo recomendar el cambio. Argumentos de seguridad para el cliente.',
    3,
    45,
    true
  ),
  (
    'Marcas y Productos del Catálogo',
    'Conocé en profundidad las marcas que comercializamos, sus diferencias y cuándo recomendar cada una.',
    4,
    60,
    true
  ),
  (
    'Atención al Cliente',
    'Manejo de objeciones, clientes difíciles, postventa y cómo generar recomendaciones boca a boca.',
    5,
    30,
    true
  );

-- ─────────────────────────────────────────────────────
-- PREGUNTAS de ejemplo para el Módulo 1
-- ─────────────────────────────────────────────────────
INSERT INTO preguntas (modulo_id, enunciado, opciones, respuesta_correcta, activo)
SELECT
  m.id,
  '¿Qué indica el número "205" en la nomenclatura 205/55 R16?',
  '[
    {"id": "a", "texto": "El diámetro del aro en pulgadas"},
    {"id": "b", "texto": "El ancho del neumático en milímetros"},
    {"id": "c", "texto": "La altura del perfil en porcentaje"},
    {"id": "d", "texto": "El índice de carga"}
  ]'::jsonb,
  'b',
  true
FROM modulos m WHERE m.orden = 1;

INSERT INTO preguntas (modulo_id, enunciado, opciones, respuesta_correcta, activo)
SELECT
  m.id,
  '¿Qué significa la letra "R" en la nomenclatura de un neumático?',
  '[
    {"id": "a", "texto": "Reforzado"},
    {"id": "b", "texto": "Radial"},
    {"id": "c", "texto": "Resistente"},
    {"id": "d", "texto": "Rodado"}
  ]'::jsonb,
  'b',
  true
FROM modulos m WHERE m.orden = 1;

INSERT INTO preguntas (modulo_id, enunciado, opciones, respuesta_correcta, activo)
SELECT
  m.id,
  '¿Cuál es la presión de inflado recomendada para la mayoría de los autos de pasajeros?',
  '[
    {"id": "a", "texto": "15 a 20 PSI"},
    {"id": "b", "texto": "20 a 25 PSI"},
    {"id": "c", "texto": "30 a 35 PSI"},
    {"id": "d", "texto": "40 a 50 PSI"}
  ]'::jsonb,
  'c',
  true
FROM modulos m WHERE m.orden = 1;

INSERT INTO preguntas (modulo_id, enunciado, opciones, respuesta_correcta, activo)
SELECT
  m.id,
  '¿Qué parte del neumático está en contacto directo con el suelo?',
  '[
    {"id": "a", "texto": "El flanco"},
    {"id": "b", "texto": "El talón"},
    {"id": "c", "texto": "La banda de rodadura"},
    {"id": "d", "texto": "La carcasa"}
  ]'::jsonb,
  'c',
  true
FROM modulos m WHERE m.orden = 1;

INSERT INTO preguntas (modulo_id, enunciado, opciones, respuesta_correcta, activo)
SELECT
  m.id,
  '¿Qué indica el número "55" en la nomenclatura 205/55 R16?',
  '[
    {"id": "a", "texto": "El ancho en centímetros"},
    {"id": "b", "texto": "El índice de velocidad"},
    {"id": "c", "texto": "La relación de aspecto (altura/ancho) en porcentaje"},
    {"id": "d", "texto": "El peso máximo soportado"}
  ]'::jsonb,
  'c',
  true
FROM modulos m WHERE m.orden = 1;

INSERT INTO preguntas (modulo_id, enunciado, opciones, respuesta_correcta, activo)
SELECT
  m.id,
  '¿Cuándo se recomienda rotar los neumáticos?',
  '[
    {"id": "a", "texto": "Cada 5.000 km"},
    {"id": "b", "texto": "Cada 10.000 km"},
    {"id": "c", "texto": "Cada 20.000 km"},
    {"id": "d", "texto": "Solo cuando hay desgaste visible"}
  ]'::jsonb,
  'b',
  true
FROM modulos m WHERE m.orden = 1;

INSERT INTO preguntas (modulo_id, enunciado, opciones, respuesta_correcta, activo)
SELECT
  m.id,
  '¿Qué tipo de neumático es más adecuado para un vehículo 4x4 que circula por caminos de tierra?',
  '[
    {"id": "a", "texto": "Turismo de verano"},
    {"id": "b", "texto": "All terrain (AT)"},
    {"id": "c", "texto": "Alta performance"},
    {"id": "d", "texto": "Runflat"}
  ]'::jsonb,
  'b',
  true
FROM modulos m WHERE m.orden = 1;

INSERT INTO preguntas (modulo_id, enunciado, opciones, respuesta_correcta, activo)
SELECT
  m.id,
  '¿Qué es el índice de carga de un neumático?',
  '[
    {"id": "a", "texto": "La velocidad máxima que puede soportar"},
    {"id": "b", "texto": "El peso máximo que puede soportar cada neumático"},
    {"id": "c", "texto": "La presión máxima de inflado"},
    {"id": "d", "texto": "La cantidad de capas de la carcasa"}
  ]'::jsonb,
  'b',
  true
FROM modulos m WHERE m.orden = 1;

INSERT INTO preguntas (modulo_id, enunciado, opciones, respuesta_correcta, activo)
SELECT
  m.id,
  '¿Cuál es la profundidad mínima legal de la banda de rodadura en Argentina?',
  '[
    {"id": "a", "texto": "1 mm"},
    {"id": "b", "texto": "1.6 mm"},
    {"id": "c", "texto": "3 mm"},
    {"id": "d", "texto": "4 mm"}
  ]'::jsonb,
  'b',
  true
FROM modulos m WHERE m.orden = 1;

INSERT INTO preguntas (modulo_id, enunciado, opciones, respuesta_correcta, activo)
SELECT
  m.id,
  '¿Qué significa que un neumático sea "runflat"?',
  '[
    {"id": "a", "texto": "Que está diseñado para alta velocidad"},
    {"id": "b", "texto": "Que puede seguir rodando con presión cero por un tiempo limitado"},
    {"id": "c", "texto": "Que tiene doble banda de rodadura"},
    {"id": "d", "texto": "Que es apto para nieve y hielo"}
  ]'::jsonb,
  'b',
  true
FROM modulos m WHERE m.orden = 1;

-- ─────────────────────────────────────────────────────
-- INICIALIZAR PROGRESO del vendedor de prueba
-- El primer módulo empieza disponible, el resto bloqueado
-- ─────────────────────────────────────────────────────
INSERT INTO progreso (user_id, modulo_id, estado)
SELECT
  u.id,
  m.id,
  CASE
    WHEN m.orden = 1 THEN 'disponible'
    ELSE 'bloqueado'
  END
FROM
  users u
  CROSS JOIN modulos m
WHERE
  u.email = 'vendedor@martinez.com';