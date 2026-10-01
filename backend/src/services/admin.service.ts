import { pool } from '../config/db.js';

export interface AdminUserListItem {
  id: string;
  email: string;
  fullName: string;
  role: 'volunteer' | 'admin' | 'researcher';
  isActive: boolean;
  googleId: string | null;
  authProvider: 'google' | 'local' | 'android_google';
  createdAt: string;
  tenantName: string | null;
  sessionsCount: number;
  sightingsCount: number;
  totalBirds: number;
  distanceKm: number;
  lastActiveAt: string | null;
}

export async function getAllUsersForAdmin(): Promise<AdminUserListItem[]> {
  const query = `
    SELECT 
      u.id,
      u.email,
      u.full_name AS "fullName",
      u.role,
      u.is_active AS "isActive",
      u.google_id AS "googleId",
      u.created_at AS "createdAt",
      t.name AS "tenantName",
      COUNT(DISTINCT ss.id)::int AS "sessionsCount",
      COUNT(DISTINCT s.id)::int AS "sightingsCount",
      COALESCE(SUM(s.count), 0)::int AS "totalBirds",
      COALESCE(ROUND(SUM(ss.distance_km)::numeric, 1), 0)::float AS "distanceKm",
      MAX(GREATEST(ss.created_at, s.created_at)) AS "lastActiveAt"
    FROM users u
    LEFT JOIN tenants t ON t.id = u.tenant_id
    LEFT JOIN sampling_sessions ss ON ss.user_id = u.id
    LEFT JOIN sightings s ON s.user_id = u.id
    GROUP BY u.id, u.email, u.full_name, u.role, u.is_active, u.google_id, u.created_at, t.name
    ORDER BY u.created_at DESC;
  `;

  const result = await pool.query(query);

  return result.rows.map((row) => {
    let authProvider: 'google' | 'local' | 'android_google' = 'local';
    if (row.googleId) {
      authProvider = row.googleId.startsWith('google_auth_') ? 'android_google' : 'google';
    }

    return {
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      role: row.role,
      isActive: row.isActive,
      googleId: row.googleId,
      authProvider,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      tenantName: row.tenantName || 'Sin entidad asignada',
      sessionsCount: row.sessionsCount || 0,
      sightingsCount: row.sightingsCount || 0,
      totalBirds: row.totalBirds || 0,
      distanceKm: row.distanceKm || 0,
      lastActiveAt: row.lastActiveAt ? new Date(row.lastActiveAt).toISOString() : null,
    };
  });
}

export async function deleteUserTotally(userId: string, currentAdminId: string) {
  if (userId === currentAdminId) {
    throw {
      statusCode: 400,
      message: 'No puedes eliminar tu propia cuenta de administrador.',
    };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verificar si el usuario existe
    const userRes = await client.query('SELECT id, email, full_name, role FROM users WHERE id = $1', [userId]);
    if (userRes.rowCount === 0) {
      throw {
        statusCode: 404,
        message: 'El usuario especificado no existe.',
      };
    }
    const targetUser = userRes.rows[0];

    // 2. Contar avistamientos y sesiones a purgar (Derecho al Olvido / RGPD Art. 17)
    const sightingsCountRes = await client.query(
      `SELECT COUNT(*)::int AS count 
       FROM sightings 
       WHERE user_id = $1 OR session_id IN (SELECT id FROM sampling_sessions WHERE user_id = $1)`,
      [userId]
    );
    const sessionsCountRes = await client.query(
      'SELECT COUNT(*)::int AS count FROM sampling_sessions WHERE user_id = $1',
      [userId]
    );

    const deletedSightings = sightingsCountRes.rows[0]?.count || 0;
    const deletedSessions = sessionsCountRes.rows[0]?.count || 0;

    // 3. Eliminar avistamientos del usuario o asociados a sus sesiones
    await client.query(
      `DELETE FROM sightings 
       WHERE user_id = $1 OR session_id IN (SELECT id FROM sampling_sessions WHERE user_id = $1)`,
      [userId]
    );

    // 4. Eliminar las sesiones de muestreo del usuario
    await client.query('DELETE FROM sampling_sessions WHERE user_id = $1', [userId]);

    // 5. Eliminar el usuario definitivamente
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');

    return {
      status: 'success',
      message: `El usuario ${targetUser.full_name} (${targetUser.email}) y todos sus registros han sido eliminados permanentemente de la base de datos (Derecho al Olvido / RGPD).`,
      deleted: {
        userId,
        email: targetUser.email,
        fullName: targetUser.full_name,
        role: targetUser.role,
        deletedSightings,
        deletedSessions,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
