/**
 * Lee Repaso_Diario_Vendedores.pdf y genera supabase/migrations/024_seed_preguntas_diarias_repaso.sql
 * Uso: node scripts/build-repaso-sql.mjs <ruta-al.pdf>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function normalizeWs(s) {
  return String(s || '')
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sqlEscapeSingle(s) {
  return String(s || '').replace(/'/g, "''");
}

/** Extrae texto de opción letter hasta la siguiente opción o RESPUESTA */
function sliceOption(block, letter) {
  const letters = ['a', 'b', 'c', 'd'];
  const i = letters.indexOf(letter);
  const next = letters[i + 1];
  const startRe = new RegExp(`(?:^|\\n)${letter}\\)\\s*`, 'm');
  const sm = block.match(startRe);
  if (!sm) return '';
  const startIdx = sm.index + sm[0].length;
  let tail = block.slice(startIdx);
  if (next) {
    const endRe = new RegExp(`\\n${next}\\)\\s*`);
    const em = tail.match(endRe);
    if (em) tail = tail.slice(0, em.index);
  } else {
    const em = tail.match(/\n(?:3 )?RESPUESTA CORRECTA:/);
    if (em) tail = tail.slice(0, em.index);
  }
  return normalizeWs(tail);
}

function parseQuestions(text) {
  const chunks = text.split(/\n(?=PREGUNTA \d+ ·)/);
  const list = [];

  for (const chunk of chunks) {
    const hm = chunk.match(/^PREGUNTA (\d+) ·[^\n]*\n([\s\S]*)$/);
    if (!hm) continue;
    const num = parseInt(hm[1], 10);
    let body = hm[2];

    const aIdx = body.search(/(?:^|\n)a\)\s*/m);
    if (aIdx === -1) {
      console.warn('Sin opción a), pregunta', num);
      continue;
    }
    const enunciado = normalizeWs(body.slice(0, aIdx));
    const fromA = body.slice(aIdx);

    const options = {
      a: sliceOption(fromA, 'a'),
      b: sliceOption(fromA, 'b'),
      c: sliceOption(fromA, 'c'),
      d: sliceOption(fromA, 'd'),
    };

    const ansM =
      chunk.match(/RESPUESTA CORRECTA:\s*[\r\n\s]*Opción\s*([abcd])/i) ||
      chunk.match(/Opción\s*([abcd])/i);
    if (!ansM) {
      console.warn('Sin respuesta correcta, pregunta', num);
      continue;
    }
    const correct = ansM[1].toLowerCase();

    let expl = '';
    const exM = chunk.match(/EXPLICACIÓN:\s*([\s\S]*?)(?=\nPREGUNTA \d+ ·|\n-- \d+ of \d+ --|\nMartínez Neumáticos · Repaso|$)/i);
    if (exM) {
      expl = normalizeWs(exM[1]);
      expl = expl.replace(/-- \d+ of \d+ --.*$/i, '').trim();
    }

    list.push({ num, enunciado, options, correct, explicacion: expl });
  }

  list.sort((x, y) => x.num - y.num);
  return list;
}

async function main() {
  const pdfPath =
    process.argv[2] ||
    path.join(
      process.env.USERPROFILE || '',
      'AppData/Roaming/Cursor/User/workspaceStorage/93da7c8484172340c86134a9bf127800/pdfs/7db10533-3e44-4221-ae9e-1c8d5d3c5c39/Repaso_Diario_Vendedores.pdf'
    );

  const buf = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buf });
  const { text } = await parser.getText();
  await parser.destroy();

  const rows = parseQuestions(text);
  if (rows.length !== 100) {
    console.warn(`Advertencia: se parsearon ${rows.length} preguntas (esperado 100).`);
  }

  const tag = 'repaso_json_024';
  let sql =
    '-- Seed: Repaso Diario Vendedores (100 preguntas) · Abril 2026\n' +
    '-- Fuente: Repaso_Diario_Vendedores.pdf · Preguntas 1–50 ventas · 51–100 producto\n' +
    'begin;\n';

  for (const r of rows) {
    const categoria = r.num <= 50 ? 'ventas' : 'producto';
    const opcionesJson = JSON.stringify([
      { id: 'a', texto: r.options.a },
      { id: 'b', texto: r.options.b },
      { id: 'c', texto: r.options.c },
      { id: 'd', texto: r.options.d },
    ]);

    sql += `insert into preguntas_diarias (enunciado, categoria, opciones, respuesta_correcta, explicacion, activo) values (\n`;
    sql += `  '${sqlEscapeSingle(r.enunciado)}',\n`;
    sql += `  '${categoria}',\n`;
    sql += `  $${tag}$${opcionesJson}$${tag}$::jsonb,\n`;
    sql += `  '${sqlEscapeSingle(r.correct)}',\n`;
    sql += `  '${sqlEscapeSingle(r.explicacion ?? '')}',\n`;
    sql += `  true\n);\n`;
  }

  sql += 'commit;\n';

  const out = path.join(__dirname, '..', '..', 'supabase', 'migrations', '024_seed_preguntas_diarias_repaso.sql');
  fs.writeFileSync(out, sql, 'utf8');
  console.log('Escrito:', out, '| filas:', rows.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
