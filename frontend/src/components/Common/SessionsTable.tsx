import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import { SamplingSession } from '../../types/sightings';
import { useTheme } from '../../context/ThemeContext';

interface SessionsTableProps {
  sessions: SamplingSession[];
  title?: string;
  subtitle?: string;
}

export const SessionsTable: React.FC<SessionsTableProps> = ({
  sessions,
  title = 'Sesiones de Muestreo (Transectos GPS)',
  subtitle,
}) => {
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const term = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        s.zepaCode?.toLowerCase().includes(term) ||
        s.sessionNumber?.toString().includes(term) ||
        s.userFullName?.toLowerCase().includes(term) ||
        s.userEmail?.toLowerCase().includes(term)
      );
    });
  }, [sessions, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, currentPage, pageSize]);

  const handleExportCSV = () => {
    if (filteredSessions.length === 0) return;

    const headers = [
      'ID',
      'Numero Sesion',
      'Codigo ZEPA',
      'Observador',
      'Email Observador',
      'Fecha Inicio',
      'Fecha Fin',
      'Duracion Minutos',
      'Distancia Km',
      'Total Avistamientos',
      'Total Aves',
      'Especies Unicas',
      'Alertas Fenologicas',
    ];

    const rows = filteredSessions.map((s) => {
      const durationMin = Math.round((s.durationSeconds || 0) / 60);
      return [
        s.id,
        s.sessionNumber,
        s.zepaCode,
        `"${s.userFullName || ''}"`,
        `"${s.userEmail || ''}"`,
        s.startTime,
        s.endTime,
        durationMin,
        s.distanceKm,
        s.sightingCount,
        s.totalBirds,
        s.uniqueSpecies,
        s.alertsCount,
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `censo_zepa_sesiones_${new Date().toISOString().slice(0, 10)}.csv`);
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
      {/* Cabecera */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} color={colors.accent} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: colors.textPrimary }}>
              {title}
            </h3>
          </div>
          {subtitle && (
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: colors.textSecondary }}>
              {subtitle} ({filteredSessions.length} sesiones)
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <Search size={15} color={colors.textSecondary} />
            <input
              type="text"
              placeholder="Buscar sesión o ZEPA..."
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

          <button
            onClick={handleExportCSV}
            disabled={filteredSessions.length === 0}
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
              cursor: filteredSessions.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: colors.tableHeaderBg, borderBottom: `1px solid ${colors.cardBorder}` }}>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}># Sesión</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>ZEPA</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Observador</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Fecha Inicio</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Duración</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Distancia</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Avistamientos</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Total Aves</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Especies</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: colors.textSecondary }}>Alertas</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSessions.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '36px', textAlign: 'center', color: colors.textSecondary }}>
                  No se han encontrado sesiones de muestreo con los filtros actuales.
                </td>
              </tr>
            ) : (
              paginatedSessions.map((s) => {
                const durationMin = Math.round((s.durationSeconds || 0) / 60);
                const startDateStr = new Date(s.startTime).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: `1px solid ${colors.cardBorder}`,
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.tableRowHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: colors.textPrimary }}>
                      Sesión #{s.sessionNumber}
                    </td>

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
                        {s.zepaCode}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', color: colors.textPrimary, fontWeight: 500 }}>
                      {s.userFullName || s.userEmail || 'Ornitólogo ZEPA'}
                    </td>

                    <td style={{ padding: '12px 16px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                      {startDateStr}
                    </td>

                    <td style={{ padding: '12px 16px', color: colors.textSecondary }}>
                      {durationMin} min
                    </td>

                    <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.textPrimary }}>
                      {Number(s.distanceKm).toFixed(2)} km
                    </td>

                    <td style={{ padding: '12px 16px', fontWeight: 700, color: colors.accent }}>
                      {s.sightingCount} obs.
                    </td>

                    <td style={{ padding: '12px 16px', fontWeight: 800, color: colors.textPrimary }}>
                      {s.totalBirds} aves
                    </td>

                    <td style={{ padding: '12px 16px', color: colors.textSecondary }}>
                      {s.uniqueSpecies} esp.
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {s.alertsCount > 0 ? (
                        <span
                          style={{
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          {s.alertsCount} alerta{s.alertsCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span style={{ color: colors.textSecondary, fontSize: '11px' }}>0</span>
                      )}
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
            Mostrando {filteredSessions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, filteredSessions.length)} de {filteredSessions.length}
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
