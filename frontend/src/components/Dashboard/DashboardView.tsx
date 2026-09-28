import React, { useState, useMemo } from 'react';
import {
  Map as MapIcon,
  BarChart3,
  Table as TableIcon,
  RefreshCw,
  Bird,
  MapPin,
  Search,
} from 'lucide-react';
import { SamplingSession, SightingFeatureCollection, User, ZepaZone } from '../../types/sightings';
import { StatsCards } from '../Common/StatsCards';
import { RecordsTable } from '../Common/RecordsTable';
import { SightingsMap } from '../Map/SightingsMap';
import { SessionInspector } from '../Inspector/SessionInspector';
import { useTheme } from '../../context/ThemeContext';

interface DashboardViewProps {
  user: User;
  zepas: ZepaZone[];
  selectedZepaCode: string;
  onSelectZepa: (code: string) => void;
  sessions: SamplingSession[];
  activeSessionNum: number | null;
  onSelectSession: (num: number | null) => void;
  sightingsData: SightingFeatureCollection | null;
  loading: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  zepas,
  selectedZepaCode,
  onSelectZepa,
  sessions,
  activeSessionNum,
  onSelectSession,
  sightingsData,
  loading,
  searchTerm = '',
  onSearchChange,
  onRefresh,
}) => {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState<'map' | 'analytics' | 'table'>('map');

  const selectedZepa = zepas.find((z) => z.code === selectedZepaCode) || null;
  const features = sightingsData?.features || [];

  // Métricas agregadas
  const stats = useMemo(() => {
    const totalSightings = features.length;
    let totalBirds = 0;
    const speciesSet = new Set<string>();
    let alertsCount = 0;

    features.forEach((f) => {
      totalBirds += f.properties.count || 0;
      if (f.properties.speciesCode) speciesSet.add(f.properties.speciesCode);
      if (f.properties.phenologicalAlert) alertsCount++;
    });

    const totalSessions = sessions.length;
    const totalDistanceKm = sessions.reduce((acc, s) => acc + (Number(s.distanceKm) || 0), 0);

    return {
      totalSightings,
      totalBirds,
      uniqueSpecies: speciesSet.size,
      totalSessions,
      totalDistanceKm,
      alertsCount,
      zepasCount: zepas.length,
    };
  }, [features, sessions, zepas]);

  // Especies más observadas para la pestaña de analítica
  const topSpecies = useMemo(() => {
    const map = new Map<string, { common: string; scientific: string; count: number; sightings: number }>();
    features.forEach((f) => {
      const p = f.properties;
      const key = p.speciesCode || p.commonName || p.speciesName;
      const existing = map.get(key) || {
        common: p.commonName || p.speciesName,
        scientific: p.scientificName || '',
        count: 0,
        sightings: 0,
      };
      existing.count += p.count || 1;
      existing.sightings += 1;
      map.set(key, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [features]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Cabecera y controles del Dashboard */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: colors.textPrimary }}>
              Dashboard Global
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
              10 ZEPAs Red Natura 2000
            </span>
          </div>
          <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: colors.textSecondary }}>
            Estadísticas y avistamientos consolidados desde la App Android.
          </p>
        </div>

        {/* Pestañas de modo de vista */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: colors.mainBg,
              borderRadius: '10px',
              padding: '3px',
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <button
              onClick={() => setViewMode('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: viewMode === 'map' ? colors.accent : 'transparent',
                color: viewMode === 'map' ? '#ffffff' : colors.textSecondary,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <MapIcon size={16} />
              <span>Mapa & Muestreos</span>
            </button>

            <button
              onClick={() => setViewMode('analytics')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: viewMode === 'analytics' ? colors.accent : 'transparent',
                color: viewMode === 'analytics' ? '#ffffff' : colors.textSecondary,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <BarChart3 size={16} />
              <span>Estadísticas</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: viewMode === 'table' ? colors.accent : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : colors.textSecondary,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <TableIcon size={16} />
              <span>Tabla ({features.length})</span>
            </button>
          </div>

          {/* Selector de ZEPA */}
          <select
            value={selectedZepaCode}
            onChange={(e) => onSelectZepa(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${colors.cardBorder}`,
              backgroundColor: colors.cardBg,
              color: colors.textPrimary,
              fontSize: '13px',
              fontWeight: 600,
              outline: 'none',
            }}
          >
            {zepas.map((z) => (
              <option key={z.code} value={z.code}>
                📍 {z.name} ({z.code})
              </option>
            ))}
          </select>

          {/* Campo de búsqueda rápida */}
          {onSearchChange && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: '8px',
                padding: '6px 10px',
                gap: '6px',
              }}
            >
              <Search size={15} color={colors.textSecondary} />
              <input
                type="text"
                placeholder="Filtrar por ave..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  outline: 'none',
                  fontSize: '13px',
                  color: colors.textPrimary,
                  width: '130px',
                }}
              />
            </div>
          )}

          {/* Botón Refrescar */}
          <button
            onClick={onRefresh}
            title="Refrescar datos"
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: `1px solid ${colors.cardBorder}`,
              backgroundColor: colors.cardBg,
              color: colors.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={17} className={loading ? 'spinner' : ''} />
          </button>
        </div>
      </div>

      {/* Contenido principal según el modo de vista */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* MODO 1: MAPA Y MUESTREOS */}
        {viewMode === 'map' && (
          <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
            <main style={{ flex: 1, position: 'relative', height: '100%' }}>
              <SightingsMap
                data={sightingsData}
                selectedZepa={selectedZepa}
                loading={loading}
                onSelectSession={(num) => onSelectSession(num)}
              />
            </main>
            <SessionInspector
              selectedZepa={selectedZepa}
              sessions={sessions}
              activeSessionNum={activeSessionNum}
              onSelectSession={(num) => onSelectSession(num)}
              sightingsData={sightingsData}
            />
          </div>
        )}

        {/* MODO 2: ESTADÍSTICAS Y ANALÍTICA */}
        {viewMode === 'analytics' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '24px' }}>
            {/* Tarjetas KPI */}
            <StatsCards
              totalSightings={stats.totalSightings}
              totalBirds={stats.totalBirds}
              uniqueSpecies={stats.uniqueSpecies}
              totalSessions={stats.totalSessions}
              totalDistanceKm={stats.totalDistanceKm}
              alertsCount={stats.alertsCount}
              zepasCount={stats.zepasCount}
            />

            {/* Cuadrícula de Análisis */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
              {/* Especies Más Observadas */}
              <div
                style={{
                  backgroundColor: colors.cardBg,
                  borderRadius: '16px',
                  padding: '22px',
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Bird size={20} color={colors.accent} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: colors.textPrimary }}>
                    Especies con Mayor Registro de Ejemplares
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {topSpecies.map((sp, idx) => {
                    const maxCount = topSpecies[0]?.count || 1;
                    const percentage = Math.round((sp.count / maxCount) * 100);

                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                          <div>
                            <strong style={{ color: colors.textPrimary }}>{sp.common}</strong>{' '}
                            {sp.scientific && (
                              <span style={{ fontStyle: 'italic', color: colors.textSecondary, fontSize: '11.5px' }}>
                                ({sp.scientific})
                              </span>
                            )}
                          </div>
                          <div style={{ fontWeight: 700, color: colors.accent }}>
                            {sp.count} ejemplares <span style={{ color: colors.textSecondary, fontWeight: 400, fontSize: '11px' }}>({sp.sightings} obs.)</span>
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div
                          style={{
                            height: '8px',
                            backgroundColor: colors.mainBg,
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${percentage}%`,
                              height: '100%',
                              backgroundColor: colors.accent,
                              borderRadius: '4px',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Distribución por ZEPAs */}
              <div
                style={{
                  backgroundColor: colors.cardBg,
                  borderRadius: '16px',
                  padding: '22px',
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <MapPin size={20} color={colors.accent} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: colors.textPrimary }}>
                    Resumen por Zona de Especial Protección (ZEPA)
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
                  {zepas.map((z) => (
                    <div
                      key={z.code}
                      onClick={() => onSelectZepa(z.code)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: z.code === selectedZepaCode ? colors.accentBg : colors.mainBg,
                        border: `1px solid ${z.code === selectedZepaCode ? colors.accent : colors.cardBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
                          {z.name}
                        </div>
                        <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                          Código: {z.code}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.accent }}>
                          {z.totalBirds} aves ({z.totalSightings} obs.)
                        </div>
                        <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                          {z.uniqueSpecies} especies · {z.totalSessions} sesiones
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODO 3: TABLA DE REGISTROS */}
        {viewMode === 'table' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '20px' }}>
            <RecordsTable
              features={features}
              title="Registros Globales de la Plataforma"
              subtitle="Conjunto completo de observaciones sincronizadas desde todos los dispositivos móviles."
            />
          </div>
        )}
      </div>
    </div>
  );
};
