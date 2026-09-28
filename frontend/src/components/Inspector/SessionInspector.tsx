import React, { useState } from 'react';
import {
  Clock,
  Navigation,
  AlertTriangle,
  Download,
  CheckCircle,
  FileSpreadsheet,
  Binoculars,
  Search,
} from 'lucide-react';
import { SamplingSession, SightingFeatureCollection, ZepaZone } from '../../types/sightings';

interface SessionInspectorProps {
  selectedZepa: ZepaZone | null;
  sessions: SamplingSession[];
  activeSessionNum: number | null;
  onSelectSession: (num: number | null) => void;
  sightingsData: SightingFeatureCollection | null;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

export const SessionInspector: React.FC<SessionInspectorProps> = ({
  selectedZepa,
  sessions,
  activeSessionNum,
  onSelectSession,
  sightingsData,
}) => {
  const [filterSpecies, setFilterSpecies] = useState('');

  // Sesión actualmente seleccionada
  const currentSession = sessions.find((s) => s.sessionNumber === activeSessionNum);

  // Filtrar avistamientos para la lista
  const visibleFeatures = (sightingsData?.features || []).filter((f) => {
    if (activeSessionNum !== null && f.properties.sessionNumber !== activeSessionNum) {
      return false;
    }
    if (filterSpecies.trim()) {
      const q = filterSpecies.toLowerCase();
      const p = f.properties;
      return (
        (p.commonName && p.commonName.toLowerCase().includes(q)) ||
        (p.scientificName && p.scientificName.toLowerCase().includes(q)) ||
        (p.speciesCode && p.speciesCode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Exportar a CSV
  const handleExportCsv = () => {
    if (!sightingsData || sightingsData.features.length === 0) return;
    const headers = [
      'id_sesion',
      'id_zepa',
      'id_especie',
      'nombre_comun',
      'nombre_cientifico',
      'cantidad',
      'hora_avistamiento',
      'alerta_fenologica',
      'longitud',
      'latitud',
    ];
    const rows = sightingsData.features.map((f) => [
      f.properties.sessionNumber ?? '',
      f.properties.zepaCode ?? selectedZepa?.code ?? '',
      f.properties.speciesCode ?? '',
      `"${f.properties.commonName || f.properties.speciesName}"`,
      `"${f.properties.scientificName || ''}"`,
      f.properties.count,
      f.properties.sightedAt,
      f.properties.phenologicalAlert ? 'true' : 'false',
      f.geometry.coordinates[0],
      f.geometry.coordinates[1],
    ]);
    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `censo_zepa_${selectedZepa?.code || 'export'}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Exportar a GeoJSON
  const handleExportGeoJson = () => {
    if (!sightingsData) return;
    const jsonString = JSON.stringify(sightingsData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `censo_zepa_${selectedZepa?.code || 'export'}_${Date.now()}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside
      style={{
        width: '450px',
        height: '100%',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.05)',
        zIndex: 1050,
      }}
    >
      {/* 1. Cabecera de la ZEPA */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(to right, #f8fafc, #ffffff)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span
            style={{
              background: '#047857',
              color: 'white',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              letterSpacing: '0.5px',
            }}
          >
            ZEPA {selectedZepa?.code || 'ES0000365'}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
            Red Natura 2000
          </span>
        </div>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 700 }}>
          {selectedZepa?.name || 'Páramo Leonés'}
        </h2>

        {/* Métricas consolidadas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginTop: '12px',
          }}
        >
          <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              {selectedZepa?.totalSessions ?? sessions.length}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Sesiones</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#047857' }}>
              {selectedZepa?.uniqueSpecies ?? 0}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Especies</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0284c7' }}>
              {selectedZepa?.totalBirds ?? 0}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Individuos</div>
          </div>
          <div
            style={{
              background: (selectedZepa?.alertsCount ?? 0) > 0 ? '#fee2e2' : '#f8fafc',
              padding: '8px',
              borderRadius: '8px',
              textAlign: 'center',
              border: (selectedZepa?.alertsCount ?? 0) > 0 ? '1px solid #f87171' : '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: (selectedZepa?.alertsCount ?? 0) > 0 ? '#b91c1c' : '#64748b',
              }}
            >
              {selectedZepa?.alertsCount ?? 0}
            </div>
            <div style={{ fontSize: '10px', color: (selectedZepa?.alertsCount ?? 0) > 0 ? '#b91c1c' : '#64748b' }}>
              Alertas ⚠️
            </div>
          </div>
        </div>
      </div>

      {/* 2. Barra de Selección de Sesiones (Timeline horizontal con scroll) */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
            Sesiones de Muestreo:
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {sessions.length} registradas
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          <button
            onClick={() => onSelectSession(null)}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              border: 'none',
              background: activeSessionNum === null ? '#047857' : '#e2e8f0',
              color: activeSessionNum === null ? 'white' : '#334155',
            }}
          >
            Todas ({sessions.length})
          </button>

          {sessions.map((sess) => {
            const isSelected = activeSessionNum === sess.sessionNumber;
            const isEmpty = !sess.hasObservations;

            return (
              <button
                key={sess.id}
                onClick={() => onSelectSession(sess.sessionNumber)}
                title={`${new Date(sess.startTime).toLocaleDateString('es-ES')} - ${sess.totalBirds} aves`}
                style={{
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: isSelected ? '1px solid #047857' : '1px solid #cbd5e1',
                  background: isSelected ? '#047857' : isEmpty ? '#f1f5f9' : '#ffffff',
                  color: isSelected ? 'white' : isEmpty ? '#94a3b8' : '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>#{sess.sessionNumber}</span>
                {isEmpty && <span style={{ fontSize: '10px', opacity: 0.8 }}>(0)</span>}
                {sess.alertsCount > 0 && <span style={{ color: isSelected ? '#fef08a' : '#dc2626' }}>⚠️</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tarjeta de detalle de la sesión seleccionada */}
      {currentSession && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#f0fdf4',
            borderBottom: '1px solid #bbf7d0',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, color: '#166534', fontSize: '13px' }}>
              Sesión #{currentSession.sessionNumber}
            </span>
            <span style={{ color: '#15803d', fontWeight: 500 }}>
              {new Date(currentSession.startTime).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '16px', color: '#166534' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} />
              <span>{formatDuration(currentSession.durationSeconds)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Navigation size={13} />
              <span>{currentSession.distanceKm} km</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Binoculars size={13} />
              <span>{currentSession.totalBirds} aves ({currentSession.uniqueSpecies} esp.)</span>
            </div>
          </div>

          {!currentSession.hasObservations && (
            <div
              style={{
                marginTop: '8px',
                padding: '6px 10px',
                background: '#ffffff',
                borderRadius: '6px',
                border: '1px solid #86efac',
                color: '#15803d',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle size={14} color="#16a34a" />
              <span>Muestreo completado sin avistamientos (esfuerzo registrado).</span>
            </div>
          )}
        </div>
      )}

      {/* 4. Lista de Avistamientos / Especies */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            Avistamientos {activeSessionNum ? `(Sesión #${activeSessionNum})` : '(Todos)'}:
          </h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {visibleFeatures.length} registros
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '6px', padding: '4px 8px', marginBottom: '12px' }}>
          <Search size={14} color="#94a3b8" style={{ marginRight: '6px' }} />
          <input
            type="text"
            placeholder="Filtrar por especie o código en la lista..."
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              width: '100%',
              color: '#334155',
            }}
          />
        </div>

        {visibleFeatures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '13px' }}>
            No hay avistamientos en este filtro.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {visibleFeatures.map((f) => {
              const p = f.properties;
              return (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: p.phenologicalAlert ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {p.phenologicalAlert && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#b91c1c',
                        fontSize: '10px',
                        fontWeight: 700,
                        marginBottom: '4px',
                      }}
                    >
                      <AlertTriangle size={12} /> ALERTA FENOLÓGICA
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                        {p.commonName || p.speciesName}
                      </div>
                      {p.scientificName && (
                        <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#64748b' }}>
                          {p.scientificName}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        background: '#f0fdf4',
                        color: '#166534',
                        fontWeight: 700,
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      {p.count} {p.count === 1 ? 'ejemplar' : 'ejemplares'}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                      fontSize: '11px',
                      color: '#64748b',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {p.speciesCode && (
                        <span
                          style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}
                        >
                          {p.speciesCode}
                        </span>
                      )}
                      <span>Sesión #{p.sessionNumber}</span>
                    </div>

                    <span>{new Date(p.sightedAt).toLocaleTimeString('es-ES')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Barra de Exportación Inferior */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          onClick={handleExportCsv}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
          }}
        >
          <FileSpreadsheet size={15} color="#059669" />
          <span>Exportar CSV</span>
        </button>

        <button
          onClick={handleExportGeoJson}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
          }}
        >
          <Download size={15} color="#0284c7" />
          <span>Exportar GeoJSON</span>
        </button>
      </div>
    </aside>
  );
};
