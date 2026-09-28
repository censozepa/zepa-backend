import { pool } from '../config/db.js';

export interface ZepaSummary {
  code: string;
  name: string;
  geometry: any;
  totalSessions: number;
  totalSightings: number;
  totalBirds: number;
  uniqueSpecies: number;
  alertsCount: number;
}

export interface SessionSummary {
  id: string;
  sessionNumber: number;
  zepaCode: string;
  tenantId: string | null;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  distanceKm: number;
  sightingCount: number;
  totalBirds: number;
  uniqueSpecies: number;
  alertsCount: number;
  hasObservations: boolean;
}

export async function getZepas(tenantId?: string | null): Promise<ZepaSummary[]> {
  const values: any[] = [];
  let tenantFilterSessions = '';
  let tenantFilterSightings = '';

  if (tenantId) {
    values.push(tenantId);
    tenantFilterSessions = `AND ss.tenant_id = $1`;
    tenantFilterSightings = `AND s.tenant_id = $1`;
  }

  const sql = `
    SELECT 
      z.code,
      z.name,
      ST_AsGeoJSON(z.geometry)::json AS geometry,
      COUNT(DISTINCT ss.id)::int AS "totalSessions",
      COUNT(s.id)::int AS "totalSightings",
      COALESCE(SUM(s.count), 0)::int AS "totalBirds",
      COUNT(DISTINCT s.species_code)::int AS "uniqueSpecies",
      COUNT(s.id) FILTER (WHERE s.phenological_alert = true)::int AS "alertsCount"
    FROM zepa_zones z
    LEFT JOIN sampling_sessions ss ON ss.zepa_code = z.code ${tenantFilterSessions}
    LEFT JOIN sightings s ON s.zepa_code = z.code ${tenantFilterSightings}
    GROUP BY z.code, z.name, z.geometry
    HAVING COUNT(DISTINCT ss.id) > 0 OR COUNT(s.id) > 0
    ORDER BY z.name;
  `;
  const result = await pool.query(sql, values);
  return result.rows;
}

export async function getSessions(tenantId?: string | null, zepaCode?: string): Promise<SessionSummary[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (tenantId) {
    conditions.push(`ss.tenant_id = $${paramIdx++}`);
    values.push(tenantId);
  }

  if (zepaCode) {
    conditions.push(`ss.zepa_code = $${paramIdx++}`);
    values.push(zepaCode);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      ss.id,
      ss.session_number AS "sessionNumber",
      ss.zepa_code AS "zepaCode",
      ss.tenant_id AS "tenantId",
      ss.start_time AS "startTime",
      ss.end_time AS "endTime",
      ROUND(EXTRACT(EPOCH FROM (ss.end_time - ss.start_time)))::int AS "durationSeconds",
      ss.distance_km AS "distanceKm",
      COUNT(s.id)::int AS "sightingCount",
      COALESCE(SUM(s.count), 0)::int AS "totalBirds",
      COUNT(DISTINCT s.species_code)::int AS "uniqueSpecies",
      COUNT(s.id) FILTER (WHERE s.phenological_alert = true)::int AS "alertsCount",
      (COUNT(s.id) > 0) AS "hasObservations"
    FROM sampling_sessions ss
    LEFT JOIN sightings s ON s.session_id = ss.id
    ${whereClause}
    GROUP BY ss.id, ss.session_number, ss.zepa_code, ss.tenant_id, ss.start_time, ss.end_time, ss.distance_km
    ORDER BY ss.start_time DESC;
  `;

  const result = await pool.query(sql, values);
  return result.rows;
}

export async function getSessionDetails(sessionId: string, tenantId?: string | null): Promise<any> {
  const conditions = ['ss.id = $1'];
  const values: any[] = [sessionId];

  if (tenantId) {
    conditions.push('ss.tenant_id = $2');
    values.push(tenantId);
  }

  const sessionRes = await pool.query(
    `
    SELECT 
      ss.id,
      ss.session_number AS "sessionNumber",
      ss.zepa_code AS "zepaCode",
      ss.tenant_id AS "tenantId",
      z.name AS "zepaName",
      ss.start_time AS "startTime",
      ss.end_time AS "endTime",
      ROUND(EXTRACT(EPOCH FROM (ss.end_time - ss.start_time)))::int AS "durationSeconds",
      ss.distance_km AS "distanceKm",
      ss.notes
    FROM sampling_sessions ss
    LEFT JOIN zepa_zones z ON z.code = ss.zepa_code
    WHERE ${conditions.join(' AND ')}
    `,
    values
  );

  if (sessionRes.rows.length === 0) {
    return null;
  }

  const session = sessionRes.rows[0];

  const sightingsRes = await pool.query(
    `
    SELECT 
      s.id,
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
      u.full_name AS "observer"
    FROM sightings s
    LEFT JOIN users u ON u.id = s.user_id
    WHERE s.session_id = $1
    ORDER BY s.sighted_at ASC
    `,
    [sessionId]
  );

  return {
    ...session,
    sightings: sightingsRes.rows,
  };
}

