import { pool } from '../config/db.js';
import { CreateSightingInput, GetSightingsQuery } from '../schemas/sighting.schema.js';

export interface SightingRecord {
  id: string;
  userId: string;
  userFullName?: string;
  speciesName: string;
  count: number;
  sightedAt: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  notes?: string | null;
  clientSyncId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createSighting(userId: string, input: CreateSightingInput): Promise<SightingRecord> {
  // Manejo de idempotencia para Android WorkManager:
  // Si ya existe un registro con el mismo clientSyncId, se devuelve sin duplicar
  const query = `
    INSERT INTO sightings (
      user_id,
      species_name,
      count,
      sighted_at,
      location,
      accuracy_meters,
      notes,
      client_sync_id
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      ST_SetSRID(ST_MakePoint($5, $6), 4326),
      $7,
      $8,
      $9
    )
    ON CONFLICT (client_sync_id) 
    DO UPDATE SET updated_at = sightings.updated_at
    RETURNING 
      id,
      user_id AS "userId",
      species_name AS "speciesName",
      count,
      sighted_at AS "sightedAt",
      ST_Y(location) AS latitude,
      ST_X(location) AS longitude,
      accuracy_meters AS "accuracyMeters",
      notes,
      client_sync_id AS "clientSyncId",
      created_at AS "createdAt",
      updated_at AS "updatedAt";
  `;

  const values = [
    userId,
    input.speciesName,
    input.count,
    input.sightedAt,
    input.longitude, // PostGIS ST_MakePoint recibe primero Longitud (X) y luego Latitud (Y)
    input.latitude,
    input.accuracyMeters ?? null,
    input.notes ?? null,
    input.clientSyncId ?? null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function getSightings(query: GetSightingsQuery): Promise<any> {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (query.species) {
    conditions.push(`s.species_name ILIKE $${paramIdx++}`);
    values.push(`%${query.species}%`);
  }

  if (query.startDate) {
    conditions.push(`s.sighted_at >= $${paramIdx++}`);
    values.push(query.startDate);
  }

  if (query.endDate) {
    conditions.push(`s.sighted_at <= $${paramIdx++}`);
    values.push(query.endDate);
  }

  // Filtro por Bounding Box (Vista actual del mapa en React Leaflet)
  if (
    query.minLng !== undefined &&
    query.minLat !== undefined &&
    query.maxLng !== undefined &&
    query.maxLat !== undefined
  ) {
    conditions.push(
      `s.location && ST_MakeEnvelope($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, 4326)`
    );
    values.push(query.minLng, query.minLat, query.maxLng, query.maxLat);
  }

  // Filtro por radio espacial (coordenada central + radio en metros)
  if (
    query.centerLng !== undefined &&
    query.centerLat !== undefined &&
    query.radiusMeters !== undefined
  ) {
    conditions.push(
      `ST_DWithin(s.location::geography, ST_SetSRID(ST_MakePoint($${paramIdx++}, $${paramIdx++}), 4326)::geography, $${paramIdx++})`
    );
    values.push(query.centerLng, query.centerLat, query.radiusMeters);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  if (query.format === 'geojson') {
    // Generación directa de GeoJSON FeatureCollection en PostgreSQL (máxima velocidad)
    const sqlGeoJson = `
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(
          json_build_object(
            'type', 'Feature',
            'id', s.id,
            'geometry', ST_AsGeoJSON(s.location)::json,
            'properties', json_build_object(
              'id', s.id,
              'speciesName', s.species_name,
              'count', s.count,
              'sightedAt', s.sighted_at,
              'accuracyMeters', s.accuracy_meters,
              'notes', s.notes,
              'observer', u.full_name,
              'createdAt', s.created_at
            )
          )
        ), '[]'::json)
      ) AS geojson
      FROM (
        SELECT s.*, u.full_name
        FROM sightings s
        JOIN users u ON u.id = s.user_id
        ${whereClause}
        ORDER BY s.sighted_at DESC
        LIMIT $${paramIdx++} OFFSET $${paramIdx++}
      ) s
      JOIN users u ON u.id = s.user_id;
    `;

    values.push(query.limit, query.offset);
    const result = await pool.query(sqlGeoJson, values);
    return result.rows[0]?.geojson || { type: 'FeatureCollection', features: [] };
  }

  // Formato JSON tabular estándar
  const sql = `
    SELECT 
      s.id,
      s.user_id AS "userId",
      u.full_name AS "userFullName",
      s.species_name AS "speciesName",
      s.count,
      s.sighted_at AS "sightedAt",
      ST_Y(s.location) AS latitude,
      ST_X(s.location) AS longitude,
      s.accuracy_meters AS "accuracyMeters",
      s.notes,
      s.client_sync_id AS "clientSyncId",
      s.created_at AS "createdAt"
    FROM sightings s
    JOIN users u ON u.id = s.user_id
    ${whereClause}
    ORDER BY s.sighted_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++};
  `;

  values.push(query.limit, query.offset);
  const result = await pool.query(sql, values);
  return result.rows;
}
