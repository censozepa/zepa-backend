import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export async function testDbConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT PostGIS_Version() as postgis_version, NOW() as current_time;');
    console.log(`✅ Conexión con PostgreSQL exitosa. PostGIS versión: ${res.rows[0].postgis_version}`);
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL/PostGIS:', error);
    throw error;
  } finally {
    client.release();
  }
}
