import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

interface UserMeta {
  fullName: string;
  tenantName: string;
  tenantSlug: string;
  tenantDescription: string;
}

const USER_METADATA: Record<string, UserMeta> = {
  'laura.ornito@gmail.com': {
    fullName: 'Laura Ornitóloga',
    tenantName: 'Grupo Ornitológico Páramo Leonés',
    tenantSlug: 'paramo-leones',
    tenantDescription: 'Entidad de seguimiento y censo de aves esteparias en la comarca del Páramo',
  },
  'marcos.birds@gmail.com': {
    fullName: 'Marcos Aves',
    tenantName: 'Estación Biológica de Doñana',
    tenantSlug: 'donana',
    tenantDescription: 'Grupo de monitorización de avifauna en humedales y marismas',
  },
  'elena.campo@gmail.com': {
    fullName: 'Elena del Campo',
    tenantName: 'Sociedad Extremeña de Zoología - Monfragüe',
    tenantSlug: 'monfrague',
    tenantDescription: 'Conservación y seguimiento de grandes rapaces y aves forestales en Monfragüe',
  },
  'javier.zepa@gmail.com': {
    fullName: 'Javier Zepa',
    tenantName: 'Amigos de las Hoces del Río Duratón',
    tenantSlug: 'hoces-duraton',
    tenantDescription: 'Censos y anillamiento científico en cañones y cortados fluviales de Segovia',
  },
  'lucia.natura@gmail.com': {
    fullName: 'Lucía Natura',
    tenantName: 'Humedales Manchegos - Tablas de Daimiel',
    tenantSlug: 'tablas-daimiel',
    tenantDescription: 'Protección y censo de anátidas y limícolas en el Parque Nacional de las Tablas de Daimiel',
  },
  'carlos.esteparias@gmail.com': {
    fullName: 'Carlos Esteparias',
    tenantName: 'Centro de Estudios Laguna de Gallocanta',
    tenantSlug: 'gallocanta',
    tenantDescription: 'Monitorización de grullas y aves de estepa en la cuenca endorreica de Gallocanta',
  },
  'pablo.rapaces@gmail.com': {
    fullName: 'Pablo Rapaces',
    tenantName: 'Parc Natural Delta de l\'Ebre',
    tenantSlug: 'delta-ebro',
    tenantDescription: 'Censos de aves acuáticas coloniales y gaviotas amenazadas en el Delta del Ebro',
  },
  'marta.fauna@gmail.com': {
    fullName: 'Marta Fauna',
    tenantName: 'Asociación Cabo de Gata-Níjar',
    tenantSlug: 'cabo-gata',
    tenantDescription: 'Estudio de aves esteparias semiáridas y marinas en el litoral almeriense',
  },
  'sergio.silvestre@gmail.com': {
    fullName: 'Sergio Silvestre',
    tenantName: 'Custodia Cordillera Cantábrica - Somiedo',
    tenantSlug: 'somiedo',
    tenantDescription: 'Vigilancia de tetraónidas y avifauna de alta montaña cantábrica',
  },
  'beatriz.vuelo@gmail.com': {
    fullName: 'Beatriz Vuelo',
    tenantName: 'Observatorio Sierra de Guadarrama',
    tenantSlug: 'guadarrama',
    tenantDescription: 'Seguimiento de paseriformes alpinos y rapaces en la Sierra de Guadarrama',
  },
};

export async function importAllCsvData() {
  const client = await pool.connect();
  try {
    console.log('🚀 Iniciando proceso de ingesta de datos CSV...');
    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    // 1. Asegurar usuario Superadministrador Global (role: admin)
    const adminEmail = 'jroman.espinar@gmail.com';
    const adminCheck = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (adminCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO users (email, password_hash, full_name, role, is_active)
         VALUES ($1, $2, $3, 'admin', true)`,
        [adminEmail, defaultPasswordHash, 'Javier Román Espinar']
      );
      console.log('  👤 Usuario Administrador creado: jroman.espinar@gmail.com');
    } else {
      await client.query(
        `UPDATE users SET role = 'admin', full_name = 'Javier Román Espinar', password_hash = $1 WHERE email = $2`,
        [defaultPasswordHash, adminEmail]
      );
    }

    // Eliminar voluntario1@censozepa.org si existiera
    await client.query(`DELETE FROM users WHERE email = 'voluntario1@censozepa.org'`);

    // 2. Localizar directorio tests-data
    const testsDataDir = path.resolve(__dirname, '../../../tests-data');
    if (!fs.existsSync(testsDataDir)) {
      throw new Error(`Directorio no encontrado: ${testsDataDir}`);
    }

    const files = fs.readdirSync(testsDataDir).filter((f) => f.startsWith('censo_') && f.endsWith('.csv'));
    console.log(`📂 Se han encontrado ${files.length} archivos CSV en ${testsDataDir}`);

    let totalSightingsCount = 0;
    let totalSessionsCount = 0;

    for (const file of files) {
      const filePath = path.join(testsDataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');
      if (lines.length < 2) continue;

      const header = lines[0].split(';').map((h) => h.trim());
      const hasUserField = header[0] === 'usuario';

      if (!hasUserField) {
        // Archivo CSV antiguo sin campo de usuario, lo ignoramos o manejamos si procede
        continue;
      }

      console.log(`\n📄 Procesando archivo: ${file}`);

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(';').map((c) => c.trim());

        const [
          userEmail,
          rawSessionNumber,
          zepaCode,
          rawStartTime,
          rawEndTime,
          rawDistanceKm,
          speciesCode,
          scientificName,
          commonName,
          rawSightingTime,
          rawCount,
          rawAlert,
        ] = cols;

        const sessionNumber = parseInt(rawSessionNumber, 10);
        const startTime = new Date(parseInt(rawStartTime, 10));
        const endTime = new Date(parseInt(rawEndTime, 10));
        const distanceKm = parseFloat(rawDistanceKm) || 0.0;
        const sightingTime = new Date(parseInt(rawSightingTime, 10));
        const count = parseInt(rawCount, 10) || 1;
        const isAlert = rawAlert === 'true';

        // 3. Obtener o crear Tenant para este usuario
        const meta = USER_METADATA[userEmail] || {
          fullName: userEmail.split('@')[0].replace('.', ' '),
          tenantName: `Organización ${userEmail.split('@')[0]}`,
          tenantSlug: userEmail.split('@')[0].replace('.', '-'),
          tenantDescription: `Organización asociada a ${userEmail}`,
        };

        let tenantId: string;
        const tenantRes = await client.query('SELECT id FROM tenants WHERE slug = $1', [meta.tenantSlug]);
        if (tenantRes.rows.length > 0) {
          tenantId = tenantRes.rows[0].id;
        } else {
          const newTenant = await client.query(
            `INSERT INTO tenants (name, slug, description)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [meta.tenantName, meta.tenantSlug, meta.tenantDescription]
          );
          tenantId = newTenant.rows[0].id;
          console.log(`  🏢 Tenant creado: ${meta.tenantName} (${meta.tenantSlug})`);
        }

        // 4. Obtener o crear Usuario
        let userId: string;
        const userRes = await client.query('SELECT id FROM users WHERE email = $1', [userEmail.toLowerCase()]);
        if (userRes.rows.length > 0) {
          userId = userRes.rows[0].id;
          // Actualizar tenant_id y full_name si procede
          await client.query('UPDATE users SET tenant_id = $1, full_name = $2 WHERE id = $3', [
            tenantId,
            meta.fullName,
            userId,
          ]);
        } else {
          const newUser = await client.query(
            `INSERT INTO users (email, password_hash, full_name, role, tenant_id, is_active)
             VALUES ($1, $2, $3, 'volunteer', $4, true)
             RETURNING id`,
            [userEmail.toLowerCase(), defaultPasswordHash, meta.fullName, tenantId]
          );
          userId = newUser.rows[0].id;
          console.log(`  👤 Usuario creado: ${userEmail} -> ${meta.fullName}`);
        }

        // 5. Upsert Sesión de Muestreo
        const sessionUpsert = await client.query(
          `INSERT INTO sampling_sessions (
            session_number, zepa_code, start_time, end_time, distance_km, user_id, tenant_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (session_number, zepa_code, start_time)
          DO UPDATE SET
            end_time = EXCLUDED.end_time,
            distance_km = EXCLUDED.distance_km,
            user_id = EXCLUDED.user_id,
            tenant_id = EXCLUDED.tenant_id,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id`,
          [sessionNumber, zepaCode, startTime, endTime, distanceKm, userId, tenantId]
        );
        const sessionId = sessionUpsert.rows[0].id;
        totalSessionsCount++;

        // 6. Obtener coordenadas representativas dentro del polígono de la ZEPA
        const zepaGeoRes = await client.query(
          `SELECT ST_X(ST_PointOnSurface(geometry)) as x, ST_Y(ST_PointOnSurface(geometry)) as y
           FROM zepa_zones WHERE code = $1`,
          [zepaCode]
        );

        let lon = -3.7038;
        let lat = 40.4168;
        if (zepaGeoRes.rows.length > 0) {
          const baseX = parseFloat(zepaGeoRes.rows[0].x);
          const baseY = parseFloat(zepaGeoRes.rows[0].y);
          // Leve desplazamiento según el índice de avistamiento para dispersión cartográfica
          const offsetLon = (i - 3) * 0.005;
          const offsetLat = (i - 3) * 0.0035;
          lon = baseX + offsetLon;
          lat = baseY + offsetLat;
        }

        // 7. Upsert Avistamiento
        // Comprobar si ya existe para evitar duplicados en re-ejecución
        const existingSighting = await client.query(
          `SELECT id FROM sightings 
           WHERE session_id = $1 AND species_code = $2 AND sighted_at = $3`,
          [sessionId, speciesCode, sightingTime]
        );

        if (existingSighting.rows.length === 0) {
          await client.query(
            `INSERT INTO sightings (
              user_id,
              tenant_id,
              session_id,
              session_number,
              zepa_code,
              species_code,
              scientific_name,
              common_name,
              species_name,
              count,
              sighted_at,
              phenological_alert,
              location,
              accuracy_meters,
              notes
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
              ST_SetSRID(ST_MakePoint($13, $14), 4326),
              5.0,
              $15
            )`,
            [
              userId,
              tenantId,
              sessionId,
              sessionNumber,
              zepaCode,
              speciesCode,
              scientificName,
              commonName,
              commonName, // species_name
              count,
              sightingTime,
              isAlert,
              lon,
              lat,
              `Observación registrada en censo de ${commonName} (${scientificName})`,
            ]
          );
          totalSightingsCount++;
        }
      }
    }

    console.log(`\n🎉 Ingesta completada con éxito:`);
    console.log(`   - Sesiones procesadas/actualizadas: ${totalSessionsCount}`);
    console.log(`   - Nuevos avistamientos insertados: ${totalSightingsCount}`);
  } catch (error) {
    console.error('❌ Error durante la ingesta de datos:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecución directa si se llama mediante tsx/node
if (process.argv[1]?.endsWith('importCsvData.ts') || process.argv[1]?.endsWith('importCsvData.js')) {
  importAllCsvData()
    .then(() => {
      console.log('✅ Ingesta finalizada.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
