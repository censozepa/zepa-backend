import { pool } from '../config/db.js';
import { CreateSightingInput, GetSightingsQuery } from '../schemas/sighting.schema.js';

export interface SightingRecord {
  id: string;
  userId: string;
  userFullName?: string;
  tenantId?: string | null;
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

export async function createSighting(
  userId: string,
  input: CreateSightingInput,
  tenantId?: string | null
): Promise<SightingRecord> {
  const query = `
    INSERT INTO sightings (
      user_id,
      species_name,
      count,
      sighted_at,
      location,
      accuracy_meters,
      notes,
      client_sync_id,
      tenant_id
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      ST_SetSRID(ST_MakePoint($5, $6), 4326),
      $7,
      $8,
      $9,
      $10
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
      tenant_id AS "tenantId",
      created_at AS "createdAt",
      updated_at AS "updatedAt";
  `;

  const values = [
    userId,
    input.speciesName,
    input.count,
    input.sightedAt,
    input.longitude,
    input.latitude,
    input.accuracyMeters ?? null,
    input.notes ?? null,
    input.clientSyncId ?? null,
    tenantId ?? null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function getSightings(query: GetSightingsQuery, tenantId?: string | null): Promise<any> {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (tenantId) {
    conditions.push(`s.tenant_id = $${paramIdx++}`);
    values.push(tenantId);
  }

  if (query.species) {
    conditions.push(
      `(s.species_name ILIKE $${paramIdx} OR s.scientific_name ILIKE $${paramIdx} OR s.common_name ILIKE $${paramIdx} OR s.species_code ILIKE $${paramIdx++})`
    );
    values.push(`%${query.species}%`);
  }

  if (query.zepaCode) {
    conditions.push(`s.zepa_code = $${paramIdx++}`);
    values.push(query.zepaCode);
  }

  if (query.sessionNumber !== undefined) {
    conditions.push(`s.session_number = $${paramIdx++}`);
    values.push(query.sessionNumber);
  }

  if (query.sessionId) {
    conditions.push(`s.session_id = $${paramIdx++}`);
    values.push(query.sessionId);
  }

  if (query.phenologicalAlert !== undefined) {
    conditions.push(`s.phenological_alert = $${paramIdx++}`);
    values.push(query.phenologicalAlert);
  }

  if (query.startDate) {
    conditions.push(`s.sighted_at >= $${paramIdx++}`);
    values.push(query.startDate);
  }

  if (query.endDate) {
    conditions.push(`s.sighted_at <= $${paramIdx++}`);
    values.push(query.endDate);
  }

  // Filtro por Bounding Box
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

  // Filtro por radio espacial
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
              'sessionId', s.session_id,
              'sessionNumber', s.session_number,
              'zepaCode', s.zepa_code,
              'speciesCode', s.species_code,
              'scientificName', s.scientific_name,
              'commonName', s.common_name,
              'speciesName', s.species_name,
              'count', s.count,
              'sightedAt', s.sighted_at,
              'phenologicalAlert', s.phenological_alert,
              'accuracyMeters', s.accuracy_meters,
              'notes', s.notes,
              'observer', u.full_name,
              'tenantId', s.tenant_id,
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

  // Formato JSON tabular
  const sql = `
    SELECT 
      s.id,
      s.user_id AS "userId",
      u.full_name AS "userFullName",
      s.session_id AS "sessionId",
      s.session_number AS "sessionNumber",
      s.zepa_code AS "zepaCode",
      s.species_code AS "speciesCode",
      s.scientific_name AS "scientificName",
      s.common_name AS "commonName",
      s.species_name AS "speciesName",
      s.count,
      s.sighted_at AS "sightedAt",
      s.phenological_alert AS "phenologicalAlert",
      ST_Y(s.location) AS latitude,
      ST_X(s.location) AS longitude,
      s.accuracy_meters AS "accuracyMeters",
      s.notes,
      s.client_sync_id AS "clientSyncId",
      s.tenant_id AS "tenantId",
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

