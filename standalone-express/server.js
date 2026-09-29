/**
 * CensoZEPA - Servidor Backend Express para la aplicación Android
 * Escucha en 0.0.0.0:3000 con CORS y express.json() habilitados.
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Conexión a Base de Datos PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://censozepa:censozepa_secret@localhost:5432/censozepa',
});

// Inicialización de las 3 tablas recomendadas
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        google_id VARCHAR(255),
        name VARCHAR(150) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_session_id INTEGER NOT NULL,
        zepa_code VARCHAR(50) NOT NULL,
        start_time BIGINT NOT NULL,
        end_time BIGINT DEFAULT 0,
        distance_km REAL DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_user_client_session UNIQUE (user_id, client_session_id)
      );

      CREATE TABLE IF NOT EXISTS sightings (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        species_code VARCHAR(50),
        common_name VARCHAR(200),
        scientific_name VARCHAR(200),
        sighting_time VARCHAR(20),
        count INTEGER NOT NULL DEFAULT 1,
        phenological_alert BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tablas (users, sessions, sightings) verificadas en la base de datos.');
  } catch (err) {
    console.error('⚠️  Error al inicializar tablas:', err.message);
  } finally {
    client.release();
  }
}

// --------------------------------------------------------------------------
// Endpoint 1: Crear / Conectar Usuario
// POST /createuser
// --------------------------------------------------------------------------
app.post('/createuser', async (req, res) => {
  try {
    const { email, google_id, name } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        status: 'error',
        message: 'El campo "email" es obligatorio y debe ser válido',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const displayName = name?.trim() || cleanEmail.split('@')[0];

    // Comprobar si el usuario con ese email ya existe
    const existing = await pool.query(
      'SELECT id, email, name, is_active FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      // Si ya existe, confirmar que está activo
      if (!user.is_active || google_id) {
        await pool.query(
          'UPDATE users SET is_active = true, google_id = COALESCE(google_id, $2) WHERE id = $1',
          [user.id, google_id || null]
        );
      }

      return res.status(200).json({
        status: 'success',
        message: 'Usuario registrado o verificado con éxito',
        user: {
          email: user.email,
          name: user.name,
        },
      });
    }

    // Si no existe, crearlo y guardarlo
    const insertRes = await pool.query(
      `INSERT INTO users (email, google_id, name, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING email, name`,
      [cleanEmail, google_id || `google_auth_${cleanEmail}`, displayName]
    );

    const newUser = insertRes.rows[0];
    return res.status(201).json({
      status: 'success',
      message: 'Usuario registrado o verificado con éxito',
      user: {
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    console.error('Error en /createuser:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor al procesar usuario',
    });
  }
});

// --------------------------------------------------------------------------
// Endpoint 2: Recibir Muestreos y Avistamientos
// POST /addregistry
// --------------------------------------------------------------------------
app.post('/addregistry', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, total_sesiones, registros } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'El campo "email" es obligatorio',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Validar que el campo email corresponda a un usuario existente
    const userRes = await client.query(
      'SELECT id, email, name FROM users WHERE LOWER(email) = $1 AND is_active = true',
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `El usuario con email "${email}" no existe. Debe registrarse primero en /createuser.`,
      });
    }

    const user = userRes.rows[0];
    const sessionList = Array.isArray(registros) ? registros : [];
    let sesionesProcesadas = 0;

    await client.query('BEGIN');

    for (const reg of sessionList) {
      const clientSessionId = reg.id_sesion;

      // 2. Evitar duplicados comprobando la combinación de email (user_id) y id_sesion
      const existingSession = await client.query(
        'SELECT id FROM sessions WHERE user_id = $1 AND client_session_id = $2',
        [user.id, clientSessionId]
      );

      let sessionId;
      if (existingSession.rows.length > 0) {
        sessionId = existingSession.rows[0].id;
      } else {
        const insertSessionRes = await client.query(
          `INSERT INTO sessions (user_id, client_session_id, zepa_code, start_time, end_time, distance_km)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            user.id,
            clientSessionId,
            reg.id_zepa || '',
            reg.fecha_hora_inicio || Date.now(),
            reg.fecha_hora_fin || 0,
            reg.distancia_recorrida || 0.0,
          ]
        );
        sessionId = insertSessionRes.rows[0].id;
      }

      sesionesProcesadas++;

      // 3. Insertar avistamientos de la sesión
      const avistamientos = Array.isArray(reg.avistamientos) ? reg.avistamientos : [];
      for (const av of avistamientos) {
        // Evitar duplicados en la misma sesión
        const existingSighting = await client.query(
          `SELECT id FROM sightings 
           WHERE session_id = $1 AND species_code = $2 AND sighting_time = $3`,
          [sessionId, av.id_especie || '', av.hora || '']
        );

        if (existingSighting.rows.length === 0) {
          await client.query(
            `INSERT INTO sightings (
               session_id, species_code, common_name, scientific_name, sighting_time, count, phenological_alert
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              sessionId,
              av.id_especie || '',
              av.nombre_comun || '',
              av.nombre_cientifico || '',
              av.hora || '',
              av.cantidad || 1,
              Boolean(av.alerta_fenologica),
            ]
          );
        }
      }
    }

    await client.query('COMMIT');

    return res.status(200).json({
      status: 'success',
      message: 'Registros de avistamientos guardados con éxito',
      sesiones_procesadas: sesionesProcesadas,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en /addregistry:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor al guardar avistamientos',
    });
  } finally {
    client.release();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'censozepa-android-backend', timestamp: new Date().toISOString() });
});

// Arrancar servidor
initDb().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 CensoZEPA Backend (Express) escuchando en http://${HOST}:${PORT}`);
  });
});
