import React, { useState, useMemo } from 'react';
import { Search, Download, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { SightingFeature } from '../../types/sightings';
import { useTheme } from '../../context/ThemeContext';

interface RecordsTableProps {
  features: SightingFeature[];
  title?: string;
  subtitle?: string;
  onSelectFeature?: (feature: SightingFeature) => void;
}

export const RecordsTable: React.FC<RecordsTableProps> = ({
  features,
  title = 'Tabla de Registros de Campo',
  subtitle,
}) => {
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [selectedZepa, setSelectedZepa] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Lista única de ZEPAs presentes en los registros
  const zepaCodes = useMemo(() => {
    const set = new Set<string>();
    features.forEach((f) => {
      if (f.properties.zepaCode) set.add(f.properties.zepaCode);
    });
    return Array.from(set).sort();
  }, [features]);

  // Filtrado de registros
  const filteredFeatures = useMemo(() => {
    return features.filter((f) => {
      const p = f.properties;
      const matchesSearch =
        !searchTerm ||
        p.commonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.scientificName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.speciesName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.observer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.zepaCode?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAlert = !onlyAlerts || p.phenologicalAlert === true;
      const matchesZepa = selectedZepa === 'ALL' || p.zepaCode === selectedZepa;

      return matchesSearch && matchesAlert && matchesZepa;
    });
  }, [features, searchTerm, onlyAlerts, selectedZepa]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredFeatures.length / pageSize));
  const paginatedFeatures = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFeatures.slice(start, start + pageSize);
  }, [filteredFeatures, currentPage, pageSize]);

  // Exportar a CSV
  const handleExportCSV = () => {
    if (filteredFeatures.length === 0) return;

    const headers = [
      'ID',
      'Especie Comun',
      'Especie Cientifico',
      'Codigo Especie',
      'Cantidad',
      'Codigo ZEPA',
      'Sesion Muestreo',
      'Fecha Hora',
      'Observador',
      'Longitud',
      'Latitud',
      'Precision Metros',
      'Alerta Fenologica',
      'Notas',
    ];

    const rows = filteredFeatures.map((f) => {
      const p = f.properties;
      return [
        p.id,
        `"${p.commonName || p.speciesName}"`,
        `"${p.scientificName || ''}"`,
        p.speciesCode || '',
        p.count,
        p.zepaCode || '',
        p.sessionNumber ?? '',
        p.sightedAt,
        `"${p.observer || ''}"`,
        f.geometry.coordinates[0],
        f.geometry.coordinates[1],
        p.accuracyMeters ?? '',
        p.phenologicalAlert ? 'SI' : 'NO',
        `"${(p.notes || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `censo_zepa_registros_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: '16px',
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Barra superior de herramientas */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.cardBorder}`,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: colors.textPrimary }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: colors.textSecondary }}>
              {subtitle} ({filteredFeatures.length} registros)
            </p>
          )}
        </div>

        {/* Filtros y acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Búsqueda */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: colors.mainBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: '8px',
              padding: '6px 10px',
              gap: '6px',
            }}
          >
            <Search size={16} color={colors.textSecondary} />
            <input
              type="text"
              placeholder="Buscar especie, notas, observador..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                outline: 'none',
                fontSize: '13px',
                color: colors.textPrimary,
                width: '180px',
              }}
            />
          </div>

          {/* Filtro ZEPA */}
          {zepaCodes.length > 1 && (
            <select
              value={selectedZepa}
              onChange={(e) => {
                setSelectedZepa(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                border: `1px solid ${colors.cardBorder}`,
                backgroundColor: colors.mainBg,
                color: colors.textPrimary,
                fontSize: '12.5px',
                fontWeight: 500,
                outline: 'none',
              }}
            >
              <option value="ALL">Todas las ZEPAs ({zepaCodes.length})</option>
              {zepaCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          )}

          {/* Botón Alertas */}
          <button
            onClick={() => {
              setOnlyAlerts(!onlyAlerts);
              setCurrentPage(1);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              border: onlyAlerts ? '1px solid #ef4444' : `1px solid ${colors.cardBorder}`,
              backgroundColor: onlyAlerts ? '#fee2e2' : colors.mainBg,
              color: onlyAlerts ? '#b91c1c' : colors.textSecondary,
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <AlertTriangle size={15} />
            <span>Solo alertas</span>
          </button>

          {/* Botón Exportar CSV */}
          <button
            onClick={handleExportCSV}
            disabled={filteredFeatures.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: colors.accent,
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: filteredFeatures.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Tabla con scroll horizontal */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: colors.tableHeaderBg, borderBottom: `1px solid ${colors.cardBorder}` }}>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Especie</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>ZEPA</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Sesión</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Cant.</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Fecha / Hora</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Observador</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Coordenadas GPS</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Estado</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Notas de campo</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFeatures.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: colors.textSecondary }}>
                  No se han encontrado registros con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              paginatedFeatures.map((f) => {
                const p = f.properties;
                const isAlert = p.phenologicalAlert;
                const dateStr = new Date(p.sightedAt).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: `1px solid ${colors.cardBorder}`,
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.tableRowHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Especie */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: colors.textPrimary }}>
                        {p.commonName || p.speciesName}
                      </div>
                      {p.scientificName && (
                        <div style={{ fontSize: '11px', fontStyle: 'italic', color: colors.textSecondary }}>
                          {p.scientificName} ({p.speciesCode})
                        </div>
                      )}
                    </td>

                    {/* ZEPA */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: colors.accentBg,
                          color: colors.accent,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {p.zepaCode || 'N/A'}
                      </span>
                    </td>

                    {/* Sesión */}
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>
                      #{p.sessionNumber ?? '-'}
                    </td>

                    {/* Cantidad */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '14px',
                          color: colors.textPrimary,
                        }}
                      >
                        {p.count}
                      </span>
                    </td>

                    {/* Fecha / Hora */}
                    <td style={{ padding: '12px 16px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                      {dateStr}
                    </td>

                    {/* Observador */}
                    <td style={{ padding: '12px 16px', color: colors.textPrimary, fontWeight: 500 }}>
                      {p.observer || 'Voluntario ZEPA'}
                    </td>

                    {/* GPS */}
                    <td style={{ padding: '12px 16px', fontSize: '11px', color: colors.textSecondary, fontFamily: 'monospace' }}>
                      {f.geometry.coordinates[1].toFixed(4)}°, {f.geometry.coordinates[0].toFixed(4)}°
                    </td>

                    {/* Estado / Alerta */}
                    <td style={{ padding: '12px 16px' }}>
                      {isAlert ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          <AlertTriangle size={13} />
                          Alerta
                        </span>
                      ) : (
                        <span
                          style={{
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          Normal
                        </span>
                      )}
                    </td>

                    {/* Notas */}
                    <td
                      style={{
                        padding: '12px 16px',
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: colors.textSecondary,
                        fontSize: '12px',
                      }}
                      title={p.notes || ''}
                    >
                      {p.notes || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: `1px solid ${colors.cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12.5px',
          color: colors.textSecondary,
          backgroundColor: colors.tableHeaderBg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Filas por página:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              padding: '3px 6px',
              borderRadius: '6px',
              border: `1px solid ${colors.cardBorder}`,
              backgroundColor: colors.cardBg,
              color: colors.textPrimary,
              fontSize: '12px',
              outline: 'none',
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>
            Mostrando {filteredFeatures.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, filteredFeatures.length)} de {filteredFeatures.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: `1px solid ${colors.cardBorder}`,
              backgroundColor: colors.cardBg,
              color: currentPage === 1 ? '#cbd5e1' : colors.textPrimary,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: `1px solid ${colors.cardBorder}`,
              backgroundColor: colors.cardBg,
              color: currentPage === totalPages ? '#cbd5e1' : colors.textPrimary,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
