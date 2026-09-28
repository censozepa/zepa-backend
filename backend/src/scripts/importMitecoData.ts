import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function importMitecoData() {
  const accdbPath = path.resolve(__dirname, '../../../tests-data/Natura2000_end2024_ES.accdb');
  if (!fs.existsSync(accdbPath)) {
    throw new Error(`Archivo Access no encontrado en: ${accdbPath}`);
  }

  console.log('🚀 Iniciando importación del Banco de Datos MITECO (Natura2000_end2024_ES.accdb)...');

  // 1. Crear esquema miteco en PostgreSQL
  console.log('📦 Creando esquema "miteco" si no existe...');
  execSync('podman exec -i censozepa_postgres psql -U censozepa -d censozepa -c "CREATE SCHEMA IF NOT EXISTS miteco;"', {
    stdio: 'inherit',
  });

  // 2. Extraer y aplicar esquema DDL de mdb-schema
  console.log('📐 Generando y aplicando DDL para las tablas de MITECO...');
  const schemaCmd = `mdb-schema -N miteco "${accdbPath}" postgres | podman exec -i censozepa_postgres psql -U censozepa -d censozepa`;
  try {
    execSync(schemaCmd, { stdio: 'pipe' });
  } catch (err) {
    // Ignorar errores de tablas internas de Access (MSysNavPane...)
  }

  // 3. Obtener lista de tablas
  const tablesRaw = execSync(`mdb-tables -1 "${accdbPath}"`).toString().trim().split('\n');
  const tables = tablesRaw.map((t) => t.trim()).filter((t) => t.length > 0 && !t.startsWith('MSys'));

  console.log(`📋 Se han detectado ${tables.length} tablas oficiales para importar.`);

  // 4. Importar cada tabla vía mdb-export y \\copy
  for (const table of tables) {
    const tableLower = table.toLowerCase();
    process.stdout.write(`  ⏳ Importando tabla ${table} -> miteco."${tableLower}"... `);

    // Truncar para idempotencia
    execSync(
      `podman exec -i censozepa_postgres psql -U censozepa -d censozepa -c "TRUNCATE TABLE miteco.\\"${tableLower}\\";"`,
      { stdio: 'pipe' }
    );

    // Exportar y copiar
    const copyCmd = `mdb-export -D '%Y-%m-%d' -T '%Y-%m-%d %H:%M:%S' "${accdbPath}" "${table}" | podman exec -i censozepa_postgres psql -U censozepa -d censozepa -c "\\copy miteco.\\"${tableLower}\\" FROM STDIN WITH (FORMAT csv, HEADER true);"`;
    const out = execSync(copyCmd, { stdio: 'pipe' }).toString().trim();
    console.log(`✅ ${out}`);
  }

  console.log('\n🎉 ¡Base de datos oficial MITECO importada con éxito en PostgreSQL!');
}

if (process.argv[1]?.endsWith('importMitecoData.ts') || process.argv[1]?.endsWith('importMitecoData.js')) {
  importMitecoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error en importación MITECO:', err);
      process.exit(1);
    });
}
