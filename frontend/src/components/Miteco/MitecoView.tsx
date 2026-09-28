import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Database,
  Search,
  RefreshCw,
  Table as TableIcon,
  Layers,
  Bird,
  Trees,
  ShieldAlert,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  X,
  MapPin,
  Info,
} from 'lucide-react';
import { MitecoSummary, MitecoTableData, MitecoTableMeta } from '../../types/sightings';
import { fetchMitecoSummary, fetchMitecoTableData, fetchMitecoTables } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export const MitecoView: React.FC = () => {
  const { colors } = useTheme();

  // Estados de datos
  const [summary, setSummary] = useState<MitecoSummary | null>(null);
  const [tables, setTables] = useState<MitecoTableMeta[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('natura2000sites');
  const [tableData, setTableData] = useState<MitecoTableData | null>(null);

  // Estados de UI y filtros
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sitecodeFilter, setSitecodeFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Estados de carga y modal
  const [loadingMeta, setLoadingMeta] = useState<boolean>(true);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [detailRow, setDetailRow] = useState<Record<string, any> | null>(null);

  // 1. Cargar Resumen y Tablas
  const loadInitialMeta = useCallback(async () => {
    setLoadingMeta(true);
    try {
      const [sum, tbls] = await Promise.all([fetchMitecoSummary(), fetchMitecoTables()]);
      setSummary(sum);
      setTables(tbls);
    } catch (e) {
      console.error('Error al cargar metadatos MITECO:', e);
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    loadInitialMeta();
  }, [loadInitialMeta]);

  // 2. Cargar datos de la tabla seleccionada
  const loadTableData = useCallback(async () => {
    if (!selectedTable) return;
    setLoadingData(true);
    try {
      const result = await fetchMitecoTableData(selectedTable, {
        page,
        pageSize,
        search: searchTerm,
        sitecode: sitecodeFilter,
        sortBy: sortBy || undefined,
        sortOrder,
      });
      setTableData(result);
    } catch (e) {
      console.error('Error al cargar datos de la tabla:', e);
    } finally {
      setLoadingData(false);
    }
  }, [selectedTable, page, pageSize, searchTerm, sitecodeFilter, sortBy, sortOrder]);

  // Disparar carga de datos con debounce en búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTableData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadTableData]);

  // Metadatos de la tabla activa
  const activeTableMeta = useMemo(() => {
    return tables.find((t) => t.name === selectedTable) || null;
  }, [tables, selectedTable]);

  // Comprobar si la tabla activa tiene la columna sitecode
  const hasSitecode = useMemo(() => {
    if (!activeTableMeta) return false;
    return activeTableMeta.columns.some((c) => c.name.toLowerCase() === 'sitecode');
  }, [activeTableMeta]);

  // Categorías únicas disponibles
  const categories = useMemo(() => {
    const set = new Set<string>();
    tables.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, [tables]);

  // Tablas filtradas por categoría
  const filteredTables = useMemo(() => {
    if (categoryFilter === 'ALL') return tables;
    return tables.filter((t) => t.category === categoryFilter);
  }, [tables, categoryFilter]);

  // Cambiar tabla seleccionada
  const handleSelectTable = (tblName: string) => {
    setSelectedTable(tblName);
    setPage(1);
    setSearchTerm('');
    setSitecodeFilter('');
    setSortBy('');
    setSortOrder('asc');
  };

  // Manejo de ordenación por columna
  const handleSort = (colName: string) => {
    if (sortBy === colName) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(colName);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Exportar filas visibles a CSV
  const handleExportCsv = () => {
    if (!tableData || tableData.rows.length === 0) return;
    const cols = tableData.columns.map((c) => c.name);
    const headerLine = cols.join(';');
    const rowLines = tableData.rows.map((row) =>
      cols
        .map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(';')
    );
    const csvContent = [headerLine, ...rowLines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `miteco_${selectedTable}_pag${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ===================================================================== */}
      {/* 1. CABECERA GENERAL                                                   */}
      {/* ===================================================================== */}
      <div
        style={{
          padding: '16px 24px',
          backgroundColor: colors.cardBg,
          borderBottom: `1px solid ${colors.cardBorder}`,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(2, 132, 199, 0.15)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: colors.textPrimary }}>
                  Banco de Datos de la Naturaleza (MITECO)
                </h1>
                <span
                  style={{
                    backgroundColor: colors.accentBg,
                    color: colors.accent,
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  🏛️ Datos Oficiales Red Natura 2000
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: colors.textSecondary }}>
                Base de datos oficial española completa (diciembre 2024): 26 tablas relacionales con más de 177.000 registros de ZEPAs, LICs, especies y hábitats.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              loadInitialMeta();
              loadTableData();
            }}
            title="Refrescar datos del Banco MITECO"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1px solid ${colors.cardBorder}`,
              backgroundColor: colors.mainBg,
              color: colors.textPrimary,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} className={loadingData || loadingMeta ? 'spinner' : ''} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* CUERPO CON SCROLL                                                     */}
      {/* ===================================================================== */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* =================================================================== */}
        {/* 2. RESUMEN KPI GLOBAL MITECO                                         */}
        {/* =================================================================== */}
        {summary && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '14px',
            }}
          >
            {/* KPI 1: Espacios Natura 2000 */}
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary }}>ESPACIOS NATURA 2000</span>
                <MapPin size={18} color="#0284c7" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: colors.textPrimary }}>
                {summary.totalSites.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '4px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ color: '#0284c7', fontWeight: 700 }}>387 ZEPAs</span> •
                <span style={{ color: '#059669', fontWeight: 700 }}>1.203 LICs</span> •
                <span style={{ color: '#7c3aed', fontWeight: 700 }}>271 Ambos</span>
              </div>
            </div>

            {/* KPI 2: Superficie Total Protegida */}
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary }}>SUPERFICIE PROTEGIDA</span>
                <Layers size={18} color="#059669" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: colors.textPrimary }}>
                {(summary.totalAreaHa / 1000000).toFixed(2)} M ha
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '4px' }}>
                {summary.totalAreaHa.toLocaleString()} hectáreas terrestres y marinas
              </div>
            </div>

            {/* KPI 3: Especies Registradas */}
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary }}>ESPECIES REGISTRADAS</span>
                <Bird size={18} color="#d97706" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: colors.textPrimary }}>
                {summary.totalSpeciesRecords.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '4px' }}>
                {summary.uniqueSpeciesCount} especies únicas ({summary.speciesByGroup.find((g) => g.group === 'Birds')?.count.toLocaleString() || '43.667'} aves)
              </div>
            </div>

            {/* KPI 4: Tipos de Hábitats */}
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary }}>HÁBITATS DE INTERÉS</span>
                <Trees size={18} color="#10b981" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: colors.textPrimary }}>
                {summary.totalHabitatsRecords.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '4px' }}>
                {summary.uniqueHabitatsCount} tipos de hábitats naturales protegidos
              </div>
            </div>

            {/* KPI 5: Amenazas e Impactos */}
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary }}>IMPACTOS Y AMENAZAS</span>
                <ShieldAlert size={18} color="#ef4444" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: colors.textPrimary }}>
                {summary.totalImpactRecords.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '4px' }}>
                Presiones y actividades humanas evaluadas
              </div>
            </div>

            {/* KPI 6: Tablas Relacionales */}
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary }}>TABLAS RELACIONALES</span>
                <Database size={18} color="#8b5cf6" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: colors.textPrimary }}>
                {summary.tablesCount} tablas
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '4px' }}>
                ~{summary.totalRecordsCount.toLocaleString()} filas oficiales migradas
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 3. EXPLORADOR DE TABLAS                                             */}
        {/* =================================================================== */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '14px',
            padding: '20px',
            border: `1px solid ${colors.cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Barra de Filtro de Categorías */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={18} color={colors.accent} />
              <strong style={{ fontSize: '15px', color: colors.textPrimary }}>
                Catálogo de Tablas Oficiales MITECO
              </strong>
              <span style={{ fontSize: '12px', color: colors.textSecondary }}>({tables.length} tablas disponibles)</span>
            </div>

            {/* Botones de Categorías */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setCategoryFilter('ALL')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: `1px solid ${categoryFilter === 'ALL' ? colors.accent : colors.cardBorder}`,
                  backgroundColor: categoryFilter === 'ALL' ? colors.accent : 'transparent',
                  color: categoryFilter === 'ALL' ? '#ffffff' : colors.textSecondary,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Todas ({tables.length})
              </button>
              {categories.map((cat) => {
                const count = tables.filter((t) => t.category === cat).length;
                const isSelected = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: `1px solid ${isSelected ? colors.accent : colors.cardBorder}`,
                      backgroundColor: isSelected ? colors.accent : 'transparent',
                      color: isSelected ? '#ffffff' : colors.textSecondary,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Carrusel / Grid de Botones de Tabla */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '10px',
              maxHeight: '190px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {filteredTables.map((t) => {
              const isSelected = selectedTable === t.name;
              return (
                <div
                  key={t.name}
                  onClick={() => handleSelectTable(t.name)}
                  title={t.description}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? colors.accentBg : colors.mainBg,
                    border: `1px solid ${isSelected ? colors.accent : colors.cardBorder}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: isSelected ? colors.accent : colors.textPrimary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {t.displayName}
                    </div>
                    <div style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: 'monospace' }}>
                      {t.name}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? colors.accent : colors.cardBg,
                      color: isSelected ? '#ffffff' : colors.textSecondary,
                      border: `1px solid ${colors.cardBorder}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.rowCount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 4. VISUALIZADOR Y GRILLA DE DATOS DE LA TABLA SELECCIONADA           */}
        {/* =================================================================== */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '14px',
            padding: '20px',
            border: `1px solid ${colors.cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Cabecera de la tabla activa */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TableIcon size={20} color={colors.accent} />
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: colors.textPrimary }}>
                  {activeTableMeta?.displayName || selectedTable}
                </h2>
                <span
                  style={{
                    backgroundColor: colors.mainBg,
                    border: `1px solid ${colors.cardBorder}`,
                    color: colors.textSecondary,
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                  }}
                >
                  miteco."{selectedTable}"
                </span>
                <span
                  style={{
                    backgroundColor: colors.accentBg,
                    color: colors.accent,
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {tableData ? `${tableData.total.toLocaleString()} registros` : `${activeTableMeta?.rowCount.toLocaleString()} registros`}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: colors.textSecondary }}>
                {activeTableMeta?.description}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleExportCsv}
                title="Descargar datos actuales en CSV"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${colors.cardBorder}`,
                  backgroundColor: colors.mainBg,
                  color: colors.textPrimary,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Download size={14} />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Barra de Filtros: Búsqueda global, Filtro Sitecode, Selector de Tamaño de Página */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              padding: '12px 14px',
              backgroundColor: colors.mainBg,
              borderRadius: '10px',
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
              {/* Búsqueda general */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '8px',
                  padding: '6px 12px',
                  gap: '8px',
                  minWidth: '240px',
                  maxWidth: '380px',
                  flex: 1,
                }}
              >
                <Search size={15} color={colors.textSecondary} />
                <input
                  type="text"
                  placeholder="Buscar texto en esta tabla..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: colors.textPrimary,
                    fontSize: '13px',
                    width: '100%',
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setPage(1);
                    }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: colors.textSecondary }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filtro SiteCode si aplica */}
              {hasSitecode && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: '8px',
                    padding: '6px 12px',
                    gap: '8px',
                    width: '180px',
                  }}
                >
                  <MapPin size={15} color="#0284c7" />
                  <input
                    type="text"
                    placeholder="Filtrar SITECODE..."
                    value={sitecodeFilter}
                    onChange={(e) => {
                      setSitecodeFilter(e.target.value.toUpperCase());
                      setPage(1);
                    }}
                    style={{
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      color: colors.textPrimary,
                      fontSize: '13px',
                      width: '100%',
                      fontFamily: 'monospace',
                    }}
                  />
                  {sitecodeFilter && (
                    <button
                      onClick={() => {
                        setSitecodeFilter('');
                        setPage(1);
                      }}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: colors.textSecondary }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Selector de Tamaño de Página */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: colors.textSecondary }}>
              <span>Filas por página:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.cardBorder}`,
                  backgroundColor: colors.cardBg,
                  color: colors.textPrimary,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Grilla Interactiva */}
          <div
            style={{
              overflowX: 'auto',
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: '10px',
              backgroundColor: colors.cardBg,
              maxHeight: '520px',
            }}
          >
            {loadingData ? (
              <div style={{ padding: '60px', textAlign: 'center', color: colors.textSecondary }}>
                <RefreshCw size={26} className="spinner" style={{ margin: '0 auto 12px auto' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Consultando tabla miteco."{selectedTable}"...</p>
              </div>
            ) : !tableData || tableData.rows.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: colors.textSecondary }}>
                <Info size={32} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: colors.textPrimary }}>
                  No se encontraron registros
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                  Prueba a modificar los términos de búsqueda o el filtro de SITECODE.
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: colors.mainBg, borderBottom: `2px solid ${colors.cardBorder}` }}>
                    <th style={{ padding: '10px 12px', width: '40px', textAlign: 'center' }}>#</th>
                    {tableData.columns.map((col) => {
                      const isSorted = sortBy === col.name;
                      return (
                        <th
                          key={col.name}
                          onClick={() => handleSort(col.name)}
                          style={{
                            padding: '10px 12px',
                            fontWeight: 700,
                            color: isSorted ? colors.accent : colors.textPrimary,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            userSelect: 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{col.name}</span>
                            {isSorted && (
                              <span style={{ fontSize: '11px', color: colors.accent }}>
                                {sortOrder === 'asc' ? '▲' : '▼'}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th style={{ padding: '10px 12px', textAlign: 'center', width: '60px' }}>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row, idx) => {
                    const rowNum = (page - 1) * pageSize + idx + 1;
                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: `1px solid ${colors.cardBorder}`,
                          backgroundColor: idx % 2 === 0 ? colors.cardBg : colors.mainBg,
                          transition: 'background-color 0.1s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.sidebarHover)}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? colors.cardBg : colors.mainBg)
                        }
                      >
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: colors.textSecondary, fontSize: '11px' }}>
                          {rowNum}
                        </td>
                        {tableData.columns.map((col) => {
                          const val = row[col.name];
                          let displayVal = val === null || val === undefined ? '—' : String(val);
                          const isSitecode = col.name.toLowerCase() === 'sitecode';
                          const isSpeciesCode = col.name.toLowerCase() === 'speciescode';

                          return (
                            <td
                              key={col.name}
                              title={String(val || '')}
                              style={{
                                padding: '8px 12px',
                                color: colors.textPrimary,
                                maxWidth: '240px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontFamily: isSitecode || isSpeciesCode ? 'monospace' : 'inherit',
                                fontWeight: isSitecode ? 700 : 'normal',
                              }}
                            >
                              {displayVal}
                            </td>
                          );
                        })}
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            onClick={() => setDetailRow(row)}
                            title="Ver ficha completa de este registro"
                            style={{
                              border: 'none',
                              backgroundColor: colors.accentBg,
                              color: colors.accent,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginación */}
          {tableData && tableData.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '12.5px', color: colors.textSecondary }}>
                Mostrando{' '}
                <strong>
                  {((page - 1) * pageSize + 1).toLocaleString()} -{' '}
                  {Math.min(page * pageSize, tableData.total).toLocaleString()}
                </strong>{' '}
                de <strong>{tableData.total.toLocaleString()}</strong> registros
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.cardBorder}`,
                    backgroundColor: colors.mainBg,
                    color: page <= 1 ? colors.textSecondary : colors.textPrimary,
                    fontSize: '12.5px',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    opacity: page <= 1 ? 0.5 : 1,
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </button>

                <span style={{ fontSize: '12.5px', fontWeight: 700, padding: '0 8px', color: colors.textPrimary }}>
                  Página {page} de {tableData.totalPages}
                </span>

                <button
                  disabled={page >= tableData.totalPages}
                  onClick={() => setPage((p) => Math.min(tableData.totalPages, p + 1))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.cardBorder}`,
                    backgroundColor: colors.mainBg,
                    color: page >= tableData.totalPages ? colors.textSecondary : colors.textPrimary,
                    fontSize: '12.5px',
                    cursor: page >= tableData.totalPages ? 'not-allowed' : 'pointer',
                    opacity: page >= tableData.totalPages ? 0.5 : 1,
                  }}
                >
                  <span>Siguiente</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. MODAL DE FICHA TÉCNICA / DETALLE DE REGISTRO                       */}
      {/* ===================================================================== */}
      {detailRow && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setDetailRow(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: `1px solid ${colors.cardBorder}`,
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: `1px solid ${colors.cardBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.mainBg,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: colors.textPrimary }}>
                  Ficha Técnica Oficial del Registro
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: colors.textSecondary }}>
                  Tabla: miteco."{selectedTable}" ({activeTableMeta?.displayName})
                </p>
              </div>
              <button
                onClick={() => setDetailRow(null)}
                style={{
                  border: 'none',
                  backgroundColor: colors.cardBg,
                  color: colors.textSecondary,
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '14px',
                }}
              >
                {Object.entries(detailRow).map(([key, value]) => {
                  const isLongText = String(value || '').length > 60;
                  return (
                    <div
                      key={key}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: colors.mainBg,
                        border: `1px solid ${colors.cardBorder}`,
                        gridColumn: isLongText ? '1 / -1' : undefined,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: colors.textSecondary,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px',
                          fontFamily: 'monospace',
                        }}
                      >
                        {key}
                      </div>
                      <div
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 500,
                          color: colors.textPrimary,
                          wordBreak: 'break-word',
                          whiteSpace: isLongText ? 'pre-wrap' : 'normal',
                          lineHeight: '1.45',
                        }}
                      >
                        {value === null || value === undefined ? (
                          <span style={{ color: colors.textSecondary, fontStyle: 'italic' }}>Sin datos</span>
                        ) : (
                          String(value)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: `1px solid ${colors.cardBorder}`,
                display: 'flex',
                justifyContent: 'flex-end',
                backgroundColor: colors.mainBg,
              }}
            >
              <button
                onClick={() => setDetailRow(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: colors.accent,
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
