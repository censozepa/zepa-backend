import { pool } from '../config/db.js';

export interface MitecoZepaSummary {
  totalZepas: number;
  pureZepasCount: number; // Tipo A
  coincidentZepasCount: number; // Tipo C
  totalAreaHa: number;
  totalBirdSpeciesRecords: number;
  uniqueBirdSpeciesCount: number;
}

export interface ZepaQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sitecode?: string;
  sitetype?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ZepaRecord {
  sitecode: string;
  sitename: string;
  sitetype: string;
  date_spa: string | null;
  spa_legal_reference: string | null;
  areaha: number;
  marine_area_percentage: number | null;
  longitude: number;
  latitude: number;
  bird_species_count: number;
  quality: string | null;
  explanations: string | null;
  documentation: string | null;
  othercharact: string | null;
  date_compilation: string | null;
  date_update: string | null;
}

export interface ZepaSpeciesRecord {
  speciesname: string;
  speciescode: string;
  population_type: string | null;
  lowerbound: number | null;
  upperbound: number | null;
  counting_unit: string | null;
  abundance_category: string | null;
  dataquality: string | null;
  conservation: string | null;
}

export async function getMitecoSummary(): Promise<MitecoZepaSummary> {
  const [zepaStatsRes, speciesStatsRes] = await Promise.all([
    pool.query(`
      SELECT 
        COUNT(*)::int AS total_zepas,
        COUNT(*) FILTER (WHERE sitetype = 'A')::int AS pure_zepas,
        COUNT(*) FILTER (WHERE sitetype = 'C')::int AS coincident_zepas,
        COALESCE(SUM(areaha), 0)::float AS total_area_ha
      FROM miteco.directiva_aves
    `),
    pool.query(`
      SELECT 
        COUNT(*)::int AS total_records,
        COUNT(DISTINCT speciesname)::int AS unique_species
      FROM miteco.directiva_aves_especies
    `),
  ]);

  const z = zepaStatsRes.rows[0];
  const s = speciesStatsRes.rows[0];

  return {
    totalZepas: z?.total_zepas || 0,
    pureZepasCount: z?.pure_zepas || 0,
    coincidentZepasCount: z?.coincident_zepas || 0,
    totalAreaHa: Math.round(z?.total_area_ha || 0),
    totalBirdSpeciesRecords: s?.total_records || 0,
    uniqueBirdSpeciesCount: s?.unique_species || 0,
  };
}

export async function getMitecoZepas(params: ZepaQueryParams) {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (params.sitecode && params.sitecode.trim()) {
    conditions.push(`"sitecode" = $${paramIdx++}`);
    values.push(params.sitecode.trim().toUpperCase());
  }

  if (params.sitetype && ['A', 'C'].includes(params.sitetype.toUpperCase())) {
    conditions.push(`"sitetype" = $${paramIdx++}`);
    values.push(params.sitetype.toUpperCase());
  }

  if (params.search && params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    conditions.push(
      `("sitename" ILIKE $${paramIdx} OR "sitecode" ILIKE $${paramIdx} OR "spa_legal_reference" ILIKE $${paramIdx} OR "quality" ILIKE $${paramIdx})`
    );
    values.push(term);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Conteo total con filtros
  const countSql = `SELECT COUNT(*)::int AS total FROM miteco.directiva_aves ${whereClause}`;
  const countRes = await pool.query(countSql, values);
  const total = countRes.rows[0]?.total || 0;

  // Paginación y ordenación
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize || 25));
  const offset = (page - 1) * pageSize;

  const validSortCols = new Set(['sitecode', 'sitename', 'sitetype', 'date_spa', 'areaha', 'bird_species_count']);
  let orderClause = 'ORDER BY "sitecode" ASC';

  if (params.sortBy && validSortCols.has(params.sortBy)) {
    const order = params.sortOrder?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    orderClause = `ORDER BY "${params.sortBy}" ${order}`;
  }

  const dataSql = `
    SELECT 
      sitecode,
      sitename,
      sitetype,
      date_spa,
      spa_legal_reference,
      areaha,
      marine_area_percentage,
      longitude,
      latitude,
      bird_species_count,
      quality,
      explanations,
      documentation,
      othercharact,
      date_compilation,
      date_update
    FROM miteco.directiva_aves
    ${whereClause}
    ${orderClause}
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;

  values.push(pageSize, offset);
  const dataRes = await pool.query(dataSql, values);

  return {
    rows: dataRes.rows as ZepaRecord[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getMitecoZepaDetails(sitecode: string): Promise<{
  zepa: ZepaRecord | null;
  species: ZepaSpeciesRecord[];
}> {
  const cleanCode = sitecode.trim().toUpperCase();

  const [zepaRes, speciesRes] = await Promise.all([
    pool.query(`SELECT * FROM miteco.directiva_aves WHERE sitecode = $1`, [cleanCode]),
    pool.query(
      `SELECT 
        speciesname,
        speciescode,
        population_type,
        lowerbound,
        upperbound,
        counting_unit,
        abundance_category,
        dataquality,
        conservation
       FROM miteco.directiva_aves_especies
       WHERE sitecode = $1
       ORDER BY speciesname ASC`,
      [cleanCode]
    ),
  ]);

  return {
    zepa: zepaRes.rows[0] || null,
    species: speciesRes.rows as ZepaSpeciesRecord[],
  };
}
