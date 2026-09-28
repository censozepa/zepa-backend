import { pool } from '../config/db.js';

export interface MitecoTableMeta {
  name: string;
  displayName: string;
  category: string;
  description: string;
  rowCount: number;
  columns: { name: string; type: string }[];
}

export interface MitecoSummary {
  totalSites: number;
  sitesByType: { type: string; label: string; count: number; areaHa: number }[];
  totalSpeciesRecords: number;
  uniqueSpeciesCount: number;
  speciesByGroup: { group: string; count: number }[];
  totalHabitatsRecords: number;
  uniqueHabitatsCount: number;
  totalAreaHa: number;
  totalImpactRecords: number;
  tablesCount: number;
  totalRecordsCount: number;
}

const TABLE_METADATA_MAP: Record<
  string,
  { displayName: string; category: string; description: string }
> = {
  natura2000sites: {
    displayName: 'Espacios Oficiales Red Natura 2000',
    category: 'Espacios Natura 2000',
    description:
      'Catálogo maestro de todos los espacios protegidos de España (ZEPA, LIC, ZEC), superficies, coordenadas geográficas, fechas y referencias legales oficiales.',
  },
  species: {
    displayName: 'Especies de Interés Comunitario',
    category: 'Fauna y Flora',
    description:
      'Registros de aves de la Directiva Aves y fauna/flora de la Directiva Hábitats censadas en cada espacio con tamaño poblacional, tipo de presencia y estado de conservación.',
  },
  otherspecies: {
    displayName: 'Otras Especies Importantes de Flora y Fauna',
    category: 'Fauna y Flora',
    description:
      'Especies relevantes adicionales no listadas en los anexos principales (endemismos, especies amenazadas o de interés biogeográfico).',
  },
  directivespecies: {
    displayName: 'Especies Directivas Aves y Hábitats (Anexos)',
    category: 'Fauna y Flora',
    description:
      'Catálogo de referencia de especies europeas según los anexos I, II, IV y V de las Directivas de Aves y de Hábitats.',
  },
  habitats: {
    displayName: 'Tipos de Hábitats de Interés Comunitario',
    category: 'Hábitats',
    description:
      'Distribución de tipos de hábitats naturales protegidos por espacio Natura 2000, con porcentaje de cobertura, representatividad y grado de conservación.',
  },
  habitatclass: {
    displayName: 'Clases de Hábitats por Espacio',
    category: 'Hábitats',
    description:
      'Distribución porcentual de los grandes tipos de ecosistemas y coberturas del suelo dentro de cada espacio protegido.',
  },
  impact: {
    displayName: 'Impactos, Amenazas y Presiones',
    category: 'Gestión e Impactos',
    description:
      'Actividades humanas, amenazas ambientales y presiones (agricultura, urbanismo, turismo, contaminación) registradas dentro y fuera del perímetro del espacio.',
  },
  bioregion: {
    displayName: 'Regiones Biogeográficas',
    category: 'Espacios Natura 2000',
    description:
      'Distribución porcentual de las regiones biogeográficas (Mediterránea, Atlántica, Alpina, Macaronésica) representadas en cada espacio.',
  },
  management: {
    displayName: 'Gestión Territorial y Planes',
    category: 'Gestión e Impactos',
    description:
      'Resumen de las medidas de conservación y existencia de planes de gestión adoptados para el espacio.',
  },
  designationstatus: {
    displayName: 'Solapamiento con Espacios Protegidos',
    category: 'Espacios Natura 2000',
    description:
      'Solapamiento de los espacios Natura 2000 con figuras de protección nacionales, autonómicas e internacionales (Parques Nacionales, Naturales, Ramsar).',
  },
  national_dtype: {
    displayName: 'Tipos de Designación Nacional',
    category: 'Tablas de Referencia',
    description:
      'Catálogo y codificación de las figuras jurídicas de protección del patrimonio natural en el ámbito de las comunidades autónomas y el Estado.',
  },
  ownership: {
    displayName: 'Régimen de Propiedad del Suelo',
    category: 'Tablas de Referencia',
    description:
      'Clasificación de la titularidad de los terrenos: dominio público estatal, autonómico, local, propiedad privada o copropiedad.',
  },
  site_tot_def: {
    displayName: 'Resumen de Totales por Espacio',
    category: 'Espacios Natura 2000',
    description:
      'Totales consolidados de superficies terrestres y marinas protegidas por cada código de espacio.',
  },
  tbl_mgmt_body_site: {
    displayName: 'Órganos Responsables de Gestión',
    category: 'Gestión e Impactos',
    description:
      'Autoridades competentes, administraciones públicas u organismos gestores responsables de cada espacio.',
  },
  tbl_mgmt_plan_site: {
    displayName: 'Planes de Gestión Aprobados',
    category: 'Gestión e Impactos',
    description:
      'Instrumentos de gestión formalmente aprobados, decretos y publicaciones oficiales en boletines.',
  },
  tbl_resp_site: {
    displayName: 'Instituciones Responsables de la Ficha',
    category: 'Gestión e Impactos',
    description:
      'Organismos autonómicos o estatales que han cumplimentado y certificado la información oficial del Formulario Normalizado de Datos.',
  },
  tbl_doc_site: {
    displayName: 'Documentación Científica y Bibliografía',
    category: 'Gestión e Impactos',
    description:
      'Referencias bibliográficas, estudios científicos y fuentes cartográficas asociadas al espacio.',
  },
  tbl_map_site: {
    displayName: 'Información Cartográfica Oficial',
    category: 'Gestión e Impactos',
    description:
      'Metadatos de la delimitación cartográfica digital de los límites de los espacios.',
  },
  tbl_mgmt_site: {
    displayName: 'Medidas de Gestión Aplicables',
    category: 'Gestión e Impactos',
    description:
      'Detalle descriptivo de las directrices y normas de gestión específicas implementadas.',
  },
  ref_designations: {
    displayName: 'Referencia Códigos de Designación',
    category: 'Tablas de Referencia',
    description:
      'Códigos estándar europeos de tipos de designación legal y categorías de espacios.',
  },
  ref_biogeo: {
    displayName: 'Referencia Regiones Biogeográficas',
    category: 'Tablas de Referencia',
    description:
      'Definición de las regiones biogeográficas europeas presentes en el territorio nacional.',
  },
  taux_habitats_esp: {
    displayName: 'Nombres Oficiales de Hábitats en Español',
    category: 'Tablas de Referencia',
    description:
      'Traducción y descripción en castellano de los códigos de hábitats de la Directiva Hábitats (ej. 9340 Bosques de Quercus ilex).',
  },
  taux_bioregiones_esp: {
    displayName: 'Denominación de Bioregiones en Español',
    category: 'Tablas de Referencia',
    description:
      'Denominación en español de las regiones biogeográficas terrestres y marinas.',
  },
  taux_groups_es: {
    displayName: 'Grupos Taxonómicos en Español',
    category: 'Tablas de Referencia',
    description:
      'Traducción de los grupos taxonómicos (Aves, Mamíferos, Anfibios, Reptiles, Peces, Invertebrados, Plantas).',
  },
  taux_mngmt_status: {
    displayName: 'Estados de Gestión',
    category: 'Tablas de Referencia',
    description:
      'Estados tipificados de los planes de gestión (en elaboración, aprobado, en revisión).',
  },
  metadata: {
    displayName: 'Metadatos de la Base de Datos Oficial',
    category: 'Tablas de Referencia',
    description:
      'Información sobre la versión oficial oficial entregada por el MITECO a la Comisión Europea (cierre de 2024).',
  },
};

export async function getMitecoTables(): Promise<MitecoTableMeta[]> {
  // 1. Obtener lista de tablas reales en esquema miteco
  const tablesRes = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'miteco' AND table_type = 'BASE TABLE'
     ORDER BY table_name`
  );

  const tableNames = tablesRes.rows.map((r) => r.table_name);

  // 2. Obtener columnas de todas las tablas
  const colsRes = await pool.query(
    `SELECT table_name, column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = 'miteco'
     ORDER BY table_name, ordinal_position`
  );

  const columnsByTable = new Map<string, { name: string; type: string }[]>();
  colsRes.rows.forEach((row) => {
    const list = columnsByTable.get(row.table_name) || [];
    list.push({ name: row.column_name, type: row.data_type });
    columnsByTable.set(row.table_name, list);
  });

  // 3. Conteo de filas de cada tabla
  const metaList: MitecoTableMeta[] = [];

  for (const tableName of tableNames) {
    const countRes = await pool.query(`SELECT COUNT(*)::int AS count FROM miteco."${tableName}"`);
    const rowCount = countRes.rows[0]?.count || 0;
    const meta = TABLE_METADATA_MAP[tableName] || {
      displayName: tableName.toUpperCase(),
      category: 'Otras Tablas',
      description: `Tabla oficial del banco de datos MITECO (${tableName})`,
    };

    metaList.push({
      name: tableName,
      displayName: meta.displayName,
      category: meta.category,
      description: meta.description,
      rowCount,
      columns: columnsByTable.get(tableName) || [],
    });
  }

  // Ordenar primero las tablas principales y luego las de referencia
  const priorityTables = ['natura2000sites', 'species', 'habitats', 'impact', 'bioregion', 'directivespecies'];
  metaList.sort((a, b) => {
    const aPri = priorityTables.indexOf(a.name);
    const bPri = priorityTables.indexOf(b.name);
    if (aPri !== -1 && bPri !== -1) return aPri - bPri;
    if (aPri !== -1) return -1;
    if (bPri !== -1) return 1;
    return b.rowCount - a.rowCount;
  });

  return metaList;
}

export async function getMitecoSummary(): Promise<MitecoSummary> {
  const [
    sitesCountRes,
    sitesByTypeRes,
    speciesStatsRes,
    speciesByGroupRes,
    habitatsStatsRes,
    impactStatsRes,
    totalTablesRes,
  ] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total_sites, COALESCE(SUM(areaha), 0)::float AS total_area_ha FROM miteco.natura2000sites`),
    pool.query(`
      SELECT 
        sitetype AS type, 
        COUNT(*)::int AS count, 
        COALESCE(SUM(areaha), 0)::float AS area_ha
      FROM miteco.natura2000sites
      GROUP BY sitetype
      ORDER BY sitetype
    `),
    pool.query(`
      SELECT 
        COUNT(*)::int AS total_species_records, 
        COUNT(DISTINCT speciescode)::int AS unique_species
      FROM miteco.species
    `),
    pool.query(`
      SELECT COALESCE(NULLIF(spgroup, ''), 'Otros') AS "group", COUNT(*)::int AS count
      FROM miteco.species
      GROUP BY spgroup
      ORDER BY count DESC
    `),
    pool.query(`
      SELECT 
        COUNT(*)::int AS total_habitats_records, 
        COUNT(DISTINCT habitatcode)::int AS unique_habitats
      FROM miteco.habitats
    `),
    pool.query(`SELECT COUNT(*)::int AS total_impacts FROM miteco.impact`),
    pool.query(`
      SELECT 
        COUNT(DISTINCT table_name)::int AS tables_count
      FROM information_schema.tables
      WHERE table_schema = 'miteco' AND table_type = 'BASE TABLE'
    `),
  ]);

  const typeLabels: Record<string, string> = {
    A: 'ZEPA (Zonas de Especial Protección para las Aves)',
    B: 'LIC / ZEC (Lugares de Importancia Comunitaria)',
    C: 'ZEPA + LIC (Espacios Coincidentes)',
  };

  const sitesByType = sitesByTypeRes.rows.map((r) => ({
    type: r.type,
    label: typeLabels[r.type] || `Tipo ${r.type}`,
    count: r.count,
    areaHa: Math.round(r.area_ha),
  }));

  // Conteo total acumulado de filas en todo el esquema
  const countAllRes = await pool.query(`
    SELECT SUM(n_live_tup)::int AS total_rows
    FROM pg_stat_user_tables
    WHERE schemaname = 'miteco'
  `);

  return {
    totalSites: sitesCountRes.rows[0]?.total_sites || 0,
    sitesByType,
    totalSpeciesRecords: speciesStatsRes.rows[0]?.total_species_records || 0,
    uniqueSpeciesCount: speciesStatsRes.rows[0]?.unique_species || 0,
    speciesByGroup: speciesByGroupRes.rows,
    totalHabitatsRecords: habitatsStatsRes.rows[0]?.total_habitats_records || 0,
    uniqueHabitatsCount: habitatsStatsRes.rows[0]?.unique_habitats || 0,
    totalAreaHa: Math.round(sitesCountRes.rows[0]?.total_area_ha || 0),
    totalImpactRecords: impactStatsRes.rows[0]?.total_impacts || 0,
    tablesCount: totalTablesRes.rows[0]?.tables_count || 0,
    totalRecordsCount: countAllRes.rows[0]?.total_rows || 175000,
  };
}

export interface TableQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sitecode?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getMitecoTableData(tableName: string, params: TableQueryParams) {
  const cleanTableName = tableName.toLowerCase();

  // 1. Validar que la tabla existe en miteco para evitar inyecciones SQL
  const tableCheck = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'miteco' AND table_name = $1 AND table_type = 'BASE TABLE'`,
    [cleanTableName]
  );

  if (tableCheck.rows.length === 0) {
    throw new Error(`Tabla no encontrada en el esquema MITECO: ${cleanTableName}`);
  }

  // 2. Obtener columnas válidas de la tabla
  const colsRes = await pool.query(
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = 'miteco' AND table_name = $1
     ORDER BY ordinal_position`,
    [cleanTableName]
  );

  const columns = colsRes.rows.map((c) => ({ name: c.column_name, type: c.data_type }));
  const columnNames = new Set(columns.map((c) => c.name));

  // 3. Construir cláusula WHERE
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  // Filtro por sitecode si la tabla tiene esa columna
  if (params.sitecode && columnNames.has('sitecode')) {
    conditions.push(`"sitecode" = $${paramIdx++}`);
    values.push(params.sitecode.trim().toUpperCase());
  }

  // Búsqueda de texto en columnas textuales
  if (params.search && params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    const textCols = columns
      .filter((c) => ['character varying', 'text', 'character'].includes(c.type))
      .map((c) => c.name);

    if (textCols.length > 0) {
      const searchConditions = textCols.map((col) => {
        const cond = `"${col}" ILIKE $${paramIdx}`;
        return cond;
      });
      conditions.push(`(${searchConditions.join(' OR ')})`);
      values.push(term);
      paramIdx++;
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 4. Conteo total de registros con filtros
  const countSql = `SELECT COUNT(*)::int AS total FROM miteco."${cleanTableName}" ${whereClause}`;
  const countRes = await pool.query(countSql, values);
  const total = countRes.rows[0]?.total || 0;

  // 5. Paginación y ordenación
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize || 25));
  const offset = (page - 1) * pageSize;

  let orderClause = '';
  if (params.sortBy && columnNames.has(params.sortBy)) {
    const order = params.sortOrder?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    orderClause = `ORDER BY "${params.sortBy}" ${order}`;
  } else if (columnNames.has('sitecode')) {
    orderClause = `ORDER BY "sitecode" ASC`;
  }

  const dataSql = `
    SELECT *
    FROM miteco."${cleanTableName}"
    ${whereClause}
    ${orderClause}
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;

  values.push(pageSize, offset);
  const dataRes = await pool.query(dataSql, values);

  return {
    table: cleanTableName,
    columns,
    rows: dataRes.rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
