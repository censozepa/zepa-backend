import { pool } from '../config/db.js';
import { CreateUserInput, AddRegistryInput } from '../schemas/android.schema.js';

export interface AndroidUserResult {
  statusCode: number;
  response: {
    status: 'success' | 'error';
    message: string;
    user: {
      email: string;
      name: string;
    };
  };
}

export interface AndroidRegistryResult {
  statusCode: number;
  response: {
    status: 'success' | 'error';
    message: string;
    sesiones_procesadas: number;
  };
}

/**
 * Registra o verifica un usuario desde la aplicación móvil Android.
 */
export async function createOrVerifyAndroidUser(input: CreateUserInput): Promise<AndroidUserResult> {
  const cleanEmail = input.email.trim().toLowerCase();

  // 1. Comprobar si el usuario con ese email ya existe en la base de datos
  const existingUserRes = await pool.query(
    `SELECT id, email, full_name, role, is_active, google_id 
     FROM users 
     WHERE LOWER(email) = $1`,
    [cleanEmail]
  );

  if (existingUserRes.rows.length > 0) {
    const existingUser = existingUserRes.rows[0];

    // Si la cuenta fue suspendida por el administrador, bloquear el acceso
    if (!existingUser.is_active) {
      return {
        statusCode: 403,
        response: {
          status: 'error',
          message: 'Su cuenta fue suspendida temporalmente. Por favor, póngase en contacto con el administrador.',
          user: {
            email: existingUser.email,
            name: existingUser.full_name,
          },
        },
      };
    }

    // Si ya existe y está activo, actualizar google_id si procede
    if (!existingUser.google_id && input.google_id) {
      await pool.query(
        `UPDATE users 
         SET google_id = COALESCE(google_id, $2),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [existingUser.id, input.google_id || null]
      );
    }

    return {
      statusCode: 200,
      response: {
        status: 'success',
        message: 'Usuario registrado o verificado con éxito',
        user: {
          email: existingUser.email,
          name: existingUser.full_name,
        },
      },
    };
  }

  // 2. Si no existe, crearlo y guardarlo
  // Asegurar o asignar el Tenant por defecto para voluntarios móviles
  const tenantRes = await pool.query(
    `INSERT INTO tenants (name, slug, description)
     VALUES ('Voluntarios Red CensoZEPA', 'censozepa-voluntarios', 'Comunidad y voluntarios de la aplicación móvil CensoZEPA')
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`
  );
  const tenantId = tenantRes.rows[0].id;

  const displayName = input.name?.trim() || cleanEmail.split('@')[0];

  const newUserRes = await pool.query(
    `INSERT INTO users (email, google_id, full_name, role, is_active, tenant_id)
     VALUES ($1, $2, $3, 'volunteer', true, $4)
     RETURNING id, email, full_name`,
    [cleanEmail, input.google_id || `google_auth_${cleanEmail}`, displayName, tenantId]
  );

  const newUser = newUserRes.rows[0];

  return {
    statusCode: 201,
    response: {
      status: 'success',
      message: 'Usuario registrado o verificado con éxito',
      user: {
        email: newUser.email,
        name: newUser.full_name,
      },
    },
  };
}

/**
 * Recibe y procesa los muestreos de campo y avistamientos enviados desde la app Android.
 * Evita duplicados comprobando la combinación del email y el id_sesion de la app.
 */
export async function addAndroidRegistry(input: AddRegistryInput): Promise<AndroidRegistryResult> {
  const cleanEmail = input.email.trim().toLowerCase();

  // 1. Validar que el campo email corresponda a un usuario existente y activo
  const userRes = await pool.query(
    `SELECT id, email, full_name, tenant_id, is_active 
     FROM users 
     WHERE LOWER(email) = $1`,
    [cleanEmail]
  );

  if (userRes.rows.length === 0) {
    const error: any = new Error(
      `El usuario con email "${input.email}" no existe. Regístrese previamente mediante /createuser.`
    );
    error.statusCode = 404;
    throw error;
  }

  const user = userRes.rows[0];
  if (!user.is_active) {
    const error: any = new Error(
      'Su cuenta fue suspendida temporalmente. Por favor, póngase en contacto con el administrador.'
    );
    error.statusCode = 403;
    throw error;
  }
  let sesionesProcesadas = 0;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const reg of input.registros) {
      const sessionNum = reg.id_sesion;

      // 2. Evitar duplicados comprobando la combinación del email (user.id) y el id_sesion de la app
      const existingSessionRes = await client.query(
        `SELECT id FROM sampling_sessions 
         WHERE user_id = $1 AND session_number = $2`,
        [user.id, sessionNum]
      );

      let sessionId: string;

      if (existingSessionRes.rows.length > 0) {
        // La sesión ya existe previamente
        sessionId = existingSessionRes.rows[0].id;
      } else {
        // Parsear fecha inicio y fin
        const startTime = new Date(reg.fecha_hora_inicio);
        const endTime =
          reg.fecha_hora_fin && reg.fecha_hora_fin > 0 ? new Date(reg.fecha_hora_fin) : startTime;
        const distanceKm = reg.distancia_recorrida || 0.0;

        const insertSessionRes = await client.query(
          `INSERT INTO sampling_sessions (
             session_number,
             zepa_code,
             start_time,
             end_time,
             distance_km,
             user_id,
             tenant_id,
             notes
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            sessionNum,
            reg.id_zepa,
            startTime,
            endTime,
            distanceKm,
            user.id,
            user.tenant_id,
            `Sesión ${sessionNum} sincronizada desde CensoZEPA Android`,
          ]
        );

        sessionId = insertSessionRes.rows[0].id;
      }

      sesionesProcesadas++;

      // 3. Obtener coordenadas geográficas representativas de la ZEPA
      let baseLon = -3.7038;
      let baseLat = 40.4168;

      const zepaGeoRes = await client.query(
        `SELECT ST_X(ST_PointOnSurface(geometry)) as lon, ST_Y(ST_PointOnSurface(geometry)) as lat
         FROM zepa_zones WHERE code = $1`,
        [reg.id_zepa]
      );

      if (zepaGeoRes.rows.length > 0 && zepaGeoRes.rows[0].lon !== null) {
        baseLon = parseFloat(zepaGeoRes.rows[0].lon);
        baseLat = parseFloat(zepaGeoRes.rows[0].lat);
      } else {
        const mitecoGeoRes = await client.query(
          `SELECT longitude as lon, latitude as lat 
           FROM miteco.directiva_aves WHERE sitecode = $1`,
          [reg.id_zepa]
        );
        if (mitecoGeoRes.rows.length > 0 && mitecoGeoRes.rows[0].lon !== null) {
          baseLon = parseFloat(mitecoGeoRes.rows[0].lon);
          baseLat = parseFloat(mitecoGeoRes.rows[0].lat);
        }
      }

      // 4. Insertar los avistamientos asociados a la sesión
      for (let i = 0; i < reg.avistamientos.length; i++) {
        const av = reg.avistamientos[i];

        // Calcular hora del avistamiento
        let sightingTime = new Date(reg.fecha_hora_inicio);
        if (typeof av.hora === 'number' && av.hora > 0) {
          sightingTime = new Date(av.hora);
        } else if (typeof av.hora === 'string' && av.hora.includes(':')) {
          const parts = av.hora.split(':');
          const h = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          if (!isNaN(h) && !isNaN(m)) {
            sightingTime = new Date(reg.fecha_hora_inicio);
            sightingTime.setHours(h, m, 0, 0);
          }
        } else if (typeof av.hora === 'string' && !isNaN(Number(av.hora)) && Number(av.hora) > 0) {
          sightingTime = new Date(Number(av.hora));
        }

        // Evitar duplicados de avistamiento en la misma sesión
        const existingSightingRes = await client.query(
          `SELECT id FROM sightings 
           WHERE session_id = $1 
             AND (species_code = $2 OR scientific_name = $3) 
             AND sighted_at = $4`,
          [sessionId, av.id_especie, av.nombre_cientifico, sightingTime]
        );

        if (existingSightingRes.rows.length === 0) {
          // Desplazamiento leve para no superponer puntos si no vienen coordenadas GPS exactas
          let lon = baseLon + i * 0.002;
          let lat = baseLat + i * 0.0015;
          if (av.longitud !== undefined && av.latitud !== undefined && (av.longitud !== 0 || av.latitud !== 0)) {
            lon = av.longitud;
            lat = av.latitud;
          }

          const speciesName = av.nombre_comun || av.nombre_cientifico || 'Aves';

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
               $1, $2, $3, $4, $5,
               $6, $7, $8, $9, $10,
               $11, $12, ST_SetSRID(ST_MakePoint($13, $14), 4326), 5.0, $15
             )`,
            [
              user.id,
              user.tenant_id,
              sessionId,
              sessionNum,
              reg.id_zepa,
              av.id_especie || '',
              av.nombre_cientifico || '',
              av.nombre_comun || '',
              speciesName,
              Math.max(1, av.cantidad || 1),
              sightingTime,
              Boolean(av.alerta_fenologica),
              lon,
              lat,
              `Avistamiento de ${speciesName} registrado en ${reg.id_zepa} vía Android App`,
            ]
          );
        }
      }
    }

    await client.query('COMMIT');

    return {
      statusCode: 200,
      response: {
        status: 'success',
        message: 'Registros de avistamientos guardados con éxito',
        sesiones_procesadas: sesionesProcesadas,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
