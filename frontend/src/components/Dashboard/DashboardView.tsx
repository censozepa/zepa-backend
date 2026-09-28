import React, { useState, useMemo } from 'react';
import {
  Globe2,
  BarChart3,
  Table as TableIcon,
  RefreshCw,
  Bird,
  Compass,
  FileSpreadsheet,
} from 'lucide-react';
import { SamplingSession, SightingFeatureCollection, User, ZepaZone } from '../../types/sightings';
import { StatsCards } from '../Common/StatsCards';
import { RecordsTable } from '../Common/RecordsTable';
import { SessionsTable } from '../Common/SessionsTable';
import { HorizontalBarChart, DonutChart } from '../Charts/Charts';
import { UserActivityRanking } from './UserActivityRanking';
import { useTheme } from '../../context/ThemeContext';

interface DashboardViewProps {
  user: User;
  zepas: ZepaZone[];
  selectedZepaCode: string;
  onSelectZepa: (code: string) => void;
  sessions: SamplingSession[];
  sightingsData: SightingFeatureCollection | null;
  loading: boolean;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  zepas,
  selectedZepaCode,
  onSelectZepa,
  sessions,
  sightingsData,
  loading,
  onRefresh,
}) => {
  const { colors } = useTheme();
  // 3 botones requeridos: 'global' (Visión Global), 'stats' (Estadísticas), 'tables' (Tablas)
  const [activeButton, setActiveButton] = useState<'global' | 'stats' | 'tables'>('global');
  const [tablesSubTab, setTablesSubTab] = useState<'sightings' | 'sessions' | 'zepas'>('sightings');

  const allFeatures = sightingsData?.features || [];

  // Filtrado según el desplegable de ZEPA (o 'ALL' para todas)
  const filteredFeatures = useMemo(() => {
    if (selectedZepaCode === 'ALL') return allFeatures;
    return allFeatures.filter((f) => f.properties.zepaCode === selectedZepaCode);
  }, [allFeatures, selectedZepaCode]);

  const filteredSessions = useMemo(() => {
    if (selectedZepaCode === 'ALL') return sessions;
    return sessions.filter((s) => s.zepaCode === selectedZepaCode);
  }, [sessions, selectedZepaCode]);

  // Métricas agregadas para la selección actual
  const currentStats = useMemo(() => {
    const totalSightings = filteredFeatures.length;
    let totalBirds = 0;
    const speciesSet = new Set<string>();
    let alertsCount = 0;

    filteredFeatures.forEach((f) => {
      totalBirds += f.properties.count || 0;
      if (f.properties.speciesCode) speciesSet.add(f.properties.speciesCode);
      if (f.properties.phenologicalAlert) alertsCount++;
    });

    const totalSessions = filteredSessions.length;
    const totalDistanceKm = filteredSessions.reduce((acc, s) => acc + (Number(s.distanceKm) || 0), 0);

    return {
      totalSightings,
      totalBirds,
      uniqueSpecies: speciesSet.size,
      totalSessions,
      totalDistanceKm,
      alertsCount,
      zepasCount: selectedZepaCode === 'ALL' ? zepas.length : 1,
    };
  }, [filteredFeatures, filteredSessions, selectedZepaCode, zepas]);

  // =========================================================================
  // DATOS PARA GRÁFICAS DE VISIÓN GLOBAL (Consolidado de toda la plataforma)
  // =========================================================================
  // 1. Aves por ZEPA (Barras)
  const birdsByZepaBarData = useMemo(() => {
    return zepas
      .map((z) => ({
        id: z.code,
        label: z.name,
        sublabel: z.code,
        value: z.totalBirds,
        badge: `${z.totalSightings} obs.`,
        color: colors.accent,
      }))
      .sort((a, b) => b.value - a.value);
  }, [zepas, colors.accent]);

  // 2. Distribución porcentual por ZEPA (Donut)
  const zepaDonutColors = [
    '#059669', '#0284c7', '#7c3aed', '#d97706', '#dc2626',
    '#0891b2', '#2563eb', '#16a34a', '#db2777', '#ea580c',
  ];
  const birdsByZepaDonutData = useMemo(() => {
    return zepas
      .map((z, idx) => ({
        label: z.name,
        value: z.totalBirds,
        color: zepaDonutColors[idx % zepaDonutColors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [zepas]);

  // 3. Top 10 Especies más abundantes en la plataforma (Barras)
  const topSpeciesBarData = useMemo(() => {
    const map = new Map<string, { common: string; scientific: string; count: number }>();
    allFeatures.forEach((f) => {
      const p = f.properties;
      const key = p.speciesCode || p.commonName || p.speciesName;
      const existing = map.get(key) || {
        common: p.commonName || p.speciesName,
        scientific: p.scientificName || '',
        count: 0,
      };
      existing.count += p.count || 1;
      map.set(key, existing);
    });

    return Array.from(map.entries())
      .map(([id, val]) => ({
        id,
        label: val.common,
        sublabel: val.scientific,
        value: val.count,
        color: '#0284c7',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [allFeatures]);

  // 4. Estado Fenológico (Donut)
  const alertsDonutData = useMemo(() => {
    let normalCount = 0;
    let alertCount = 0;
    allFeatures.forEach((f) => {
      if (f.properties.phenologicalAlert) {
        alertCount += f.properties.count || 1;
      } else {
        normalCount += f.properties.count || 1;
      }
    });

    return [
      { label: 'Normal / Esperado', value: normalCount, color: '#10b981' },
      { label: 'Alerta Fenológica', value: alertCount, color: '#ef4444' },
    ];
  }, [allFeatures]);

  // 5. Esfuerzo de Muestreo (Km de transectos por ZEPA)
  const distanceByZepaBarData = useMemo(() => {
    const map = new Map<string, { name: string; km: number; sessions: number }>();
    zepas.forEach((z) => map.set(z.code, { name: z.name, km: 0, sessions: 0 }));

    sessions.forEach((s) => {
      const entry = map.get(s.zepaCode) || { name: s.zepaCode, km: 0, sessions: 0 };
      entry.km += Number(s.distanceKm) || 0;
      entry.sessions += 1;
      map.set(s.zepaCode, entry);
    });

    return Array.from(map.entries())
      .map(([code, val]) => ({
        id: code,
        label: val.name,
        sublabel: code,
        value: parseFloat(val.km.toFixed(1)),
        badge: `${val.sessions} sesiones`,
        color: '#7c3aed',
      }))
      .sort((a, b) => b.value - a.value);
  }, [zepas, sessions]);

  // =========================================================================
  // DATOS PARA PESTAÑA ESTADÍSTICAS (Filtradas según selección ZEPA o Todas)
  // =========================================================================
  const filteredSpeciesBarData = useMemo(() => {
    const map = new Map<string, { common: string; scientific: string; count: number }>();
    filteredFeatures.forEach((f) => {
      const p = f.properties;
      const key = p.speciesCode || p.commonName || p.speciesName;
      const existing = map.get(key) || {
        common: p.commonName || p.speciesName,
        scientific: p.scientificName || '',
        count: 0,
      };
      existing.count += p.count || 1;
      map.set(key, existing);
    });

    return Array.from(map.entries())
      .map(([id, val]) => ({
        id,
        label: val.common,
        sublabel: val.scientific,
        value: val.count,
        color: colors.accent,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredFeatures, colors.accent]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Cabecera y los 3 botones principales */}
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
              Dashboard
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
            Panel de control y analítica de datos sincronizados desde la App de Android.
          </p>
        </div>

        {/* Los 3 botones requeridos y el desplegable */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Botones de navegación: Visión Global, Estadísticas, Tablas */}
          <div
            style={{
              display: 'flex',
              backgroundColor: colors.mainBg,
              borderRadius: '10px',
              padding: '3px',
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            {/* 1. Visión Global */}
            <button
              onClick={() => setActiveButton('global')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeButton === 'global' ? colors.accent : 'transparent',
                color: activeButton === 'global' ? '#ffffff' : colors.textSecondary,
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Globe2 size={16} />
              <span>Visión Global</span>
            </button>

            {/* 2. Estadísticas */}
            <button
              onClick={() => setActiveButton('stats')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeButton === 'stats' ? colors.accent : 'transparent',
                color: activeButton === 'stats' ? '#ffffff' : colors.textSecondary,
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <BarChart3 size={16} />
              <span>Estadísticas</span>
            </button>

            {/* 3. Tablas */}
            <button
              onClick={() => setActiveButton('tables')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeButton === 'tables' ? colors.accent : 'transparent',
                color: activeButton === 'tables' ? '#ffffff' : colors.textSecondary,
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <TableIcon size={16} />
              <span>Tablas</span>
            </button>
          </div>

          {/* Desplegable de ZEPAs con opción 'Todas' (presente en Estadísticas y Tablas, o siempre accesible) */}
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
              cursor: 'pointer',
            }}
          >
            <option value="ALL">🌐 Todas las ZEPAs ({zepas.length})</option>
            {zepas.map((z) => (
              <option key={z.code} value={z.code}>
                📍 {z.name} ({z.code})
              </option>
            ))}
          </select>

          {/* Botón Refrescar */}
          <button
            onClick={onRefresh}
            title="Refrescar datos de la plataforma"
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

      {/* ===================================================================== */}
      {/* CUERPO PRINCIPAL SEGÚN EL BOTÓN ACTIVO                                */}
      {/* ===================================================================== */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {/* ------------------------------------------------------------------- */}
        {/* BOTÓN 1: VISIÓN GLOBAL (Gráficas de todas las ZEPAs y aves)          */}
        {/* ------------------------------------------------------------------- */}
        {activeButton === 'global' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Resumen KPI Global */}
            <StatsCards
              totalSightings={allFeatures.length}
              totalBirds={zepas.reduce((acc, z) => acc + z.totalBirds, 0)}
              uniqueSpecies={topSpeciesBarData.length}
              totalSessions={sessions.length}
              totalDistanceKm={sessions.reduce((acc, s) => acc + (Number(s.distanceKm) || 0), 0)}
              alertsCount={allFeatures.filter((f) => f.properties.phenologicalAlert).length}
              zepasCount={zepas.length}
            />

            {/* Fila 1 de Gráficas: Barras de Aves por ZEPA + Donut de Distribución */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
              <HorizontalBarChart
                data={birdsByZepaBarData}
                title="Censo de Aves por Espacio ZEPA"
                subtitle="Total acumulado de ejemplares observados en cada zona de la Red Natura 2000"
                valueSuffix="aves"
                maxBars={10}
              />

              <DonutChart
                data={birdsByZepaDonutData}
                title="Distribución Porcentual del Censo"
                subtitle="Proporción del volumen de avifauna registrada entre ZEPAs"
                centerLabel="Total Aves"
                centerValue={zepas.reduce((acc, z) => acc + z.totalBirds, 0)}
                size={190}
              />
            </div>

            {/* Fila 2 de Gráficas: Top Especies + Alertas Fenológicas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
              <HorizontalBarChart
                data={topSpeciesBarData}
                title="Top 10 Especies con Mayor Conteo de Ejemplares"
                subtitle="Especies de aves más censadas en el conjunto de todas las ZEPAs"
                valueSuffix="ejemplares"
                maxBars={10}
              />

              <DonutChart
                data={alertsDonutData}
                title="Detección de Alertas Fenológicas"
                subtitle="Observaciones en fechas habituales vs anomalías reproductivas o migratorias"
                centerLabel="Observaciones"
                centerValue={allFeatures.length}
                size={190}
              />
            </div>

            {/* Fila 3: Esfuerzo de Muestreo (Km recorridos por ZEPA) */}
            <div>
              <HorizontalBarChart
                data={distanceByZepaBarData}
                title="Esfuerzo de Muestreo en Campo (Distancia en Km por ZEPA)"
                subtitle="Longitud total de transectos de censo GPS recorridos por los ornitólogos"
                valueSuffix="km"
                maxBars={10}
              />
            </div>

            {/* Fila 4: Top 10 Usuarios más activos */}
            <UserActivityRanking sessions={sessions} sightings={allFeatures} />
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* BOTÓN 2: ESTADÍSTICAS (Detalle con desplegable ZEPA o Todas)        */}
        {/* ------------------------------------------------------------------- */}
        {activeButton === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: '14px',
                padding: '14px 20px',
                border: `1px solid ${colors.cardBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong style={{ fontSize: '15px', color: colors.textPrimary }}>
                  Filtro activo:{' '}
                  <span style={{ color: colors.accent }}>
                    {selectedZepaCode === 'ALL'
                      ? 'Todas las ZEPAs registradas (10)'
                      : zepas.find((z) => z.code === selectedZepaCode)?.name || selectedZepaCode}
                  </span>
                </strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: colors.textSecondary }}>
                  Estadísticas cuantitativas y desglose ornitológico según la zona seleccionada en el desplegable.
                </p>
              </div>

              {selectedZepaCode !== 'ALL' && (
                <button
                  onClick={() => onSelectZepa('ALL')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.cardBorder}`,
                    backgroundColor: colors.mainBg,
                    color: colors.textPrimary,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Ver Todas
                </button>
              )}
            </div>

            {/* Tarjetas KPI de la selección */}
            <StatsCards
              totalSightings={currentStats.totalSightings}
              totalBirds={currentStats.totalBirds}
              uniqueSpecies={currentStats.uniqueSpecies}
              totalSessions={currentStats.totalSessions}
              totalDistanceKm={currentStats.totalDistanceKm}
              alertsCount={currentStats.alertsCount}
              zepasCount={currentStats.zepasCount}
            />

            {/* Gráfica de especies en la selección */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
              <HorizontalBarChart
                data={filteredSpeciesBarData}
                title={`Especies Registradas (${selectedZepaCode === 'ALL' ? 'Todas las ZEPAs' : selectedZepaCode})`}
                subtitle={`${filteredSpeciesBarData.length} taxones distintos detectados en campo`}
                valueSuffix="aves"
                maxBars={12}
              />

              {/* Sesiones y transectos en la selección */}
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
                  <Compass size={20} color={colors.accent} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: colors.textPrimary }}>
                    Transectos de Censo ({filteredSessions.length} sesiones)
                  </h3>
                </div>

                {filteredSessions.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: colors.textSecondary }}>
                    No hay sesiones registradas para la ZEPA seleccionada.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                    {filteredSessions.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: colors.mainBg,
                          border: `1px solid ${colors.cardBorder}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
                            Sesión #{s.sessionNumber} · <span style={{ color: colors.accent }}>{s.zepaCode}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                            {new Date(s.startTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} · {s.distanceKm} km · {s.userFullName || s.userEmail || 'Ornitólogo'}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
                            {s.totalBirds} aves ({s.uniqueSpecies} esp.)
                          </div>
                          <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                            {s.sightingCount} observaciones
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* BOTÓN 3: TABLAS (Con desplegable ZEPA o Todas)                      */}
        {/* ------------------------------------------------------------------- */}
        {activeButton === 'tables' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Sub-selector de Tablas */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                backgroundColor: colors.cardBg,
                padding: '12px 18px',
                borderRadius: '14px',
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setTablesSubTab('sightings')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: tablesSubTab === 'sightings' ? colors.accent : colors.mainBg,
                    color: tablesSubTab === 'sightings' ? '#ffffff' : colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Bird size={15} />
                  <span>Avistamientos ({filteredFeatures.length})</span>
                </button>

                <button
                  onClick={() => setTablesSubTab('sessions')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: tablesSubTab === 'sessions' ? colors.accent : colors.mainBg,
                    color: tablesSubTab === 'sessions' ? '#ffffff' : colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Compass size={15} />
                  <span>Sesiones / Transectos ({filteredSessions.length})</span>
                </button>

                <button
                  onClick={() => setTablesSubTab('zepas')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: tablesSubTab === 'zepas' ? colors.accent : colors.mainBg,
                    color: tablesSubTab === 'zepas' ? '#ffffff' : colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <FileSpreadsheet size={15} />
                  <span>Resumen ZEPAs ({zepas.length})</span>
                </button>
              </div>

              <span style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: 500 }}>
                Filtrado por:{' '}
                <strong>
                  {selectedZepaCode === 'ALL'
                    ? 'Todas las ZEPAs'
                    : zepas.find((z) => z.code === selectedZepaCode)?.name || selectedZepaCode}
                </strong>
              </span>
            </div>

            {/* TABLA 1: AVISTAMIENTOS */}
            {tablesSubTab === 'sightings' && (
              <RecordsTable
                features={filteredFeatures}
                title={`Tabla de Avistamientos (${selectedZepaCode === 'ALL' ? 'Todas las ZEPAs' : selectedZepaCode})`}
                subtitle="Listado exhaustivo de observaciones capturadas por ornitólogos con la App Android."
              />
            )}

            {/* TABLA 2: SESIONES */}
            {tablesSubTab === 'sessions' && (
              <SessionsTable
                sessions={filteredSessions}
                title={`Tabla de Sesiones y Transectos GPS (${selectedZepaCode === 'ALL' ? 'Todas las ZEPAs' : selectedZepaCode})`}
                subtitle="Muestreos geolocalizados con duración, distancia y esfuerzo de observación."
              />
            )}

            {/* TABLA 3: RESUMEN ZEPAS */}
            {tablesSubTab === 'zepas' && (
              <div
                style={{
                  backgroundColor: colors.cardBg,
                  borderRadius: '16px',
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.cardBorder}` }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: colors.textPrimary }}>
                    Tabla Comparativa de las 10 ZEPAs
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: colors.textSecondary }}>
                    Balance general de datos ornitológicos por espacio protegido.
                  </p>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: colors.tableHeaderBg, borderBottom: `1px solid ${colors.cardBorder}` }}>
                        <th style={{ padding: '12px 16px', color: colors.textSecondary, fontWeight: 600 }}>Código</th>
                        <th style={{ padding: '12px 16px', color: colors.textSecondary, fontWeight: 600 }}>Nombre de la ZEPA</th>
                        <th style={{ padding: '12px 16px', color: colors.textSecondary, fontWeight: 600 }}>Total Sesiones</th>
                        <th style={{ padding: '12px 16px', color: colors.textSecondary, fontWeight: 600 }}>Avistamientos</th>
                        <th style={{ padding: '12px 16px', color: colors.textSecondary, fontWeight: 600 }}>Total Aves Censadas</th>
                        <th style={{ padding: '12px 16px', color: colors.textSecondary, fontWeight: 600 }}>Especies Únicas</th>
                        <th style={{ padding: '12px 16px', color: colors.textSecondary, fontWeight: 600 }}>Alertas</th>
                        <th style={{ padding: '12px 16px', color: colors.textSecondary, fontWeight: 600 }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zepas.map((z) => (
                        <tr
                          key={z.code}
                          style={{
                            borderBottom: `1px solid ${colors.cardBorder}`,
                            backgroundColor: z.code === selectedZepaCode ? colors.accentBg : 'transparent',
                          }}
                        >
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: colors.accent }}>{z.code}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.textPrimary }}>{z.name}</td>
                          <td style={{ padding: '12px 16px', color: colors.textSecondary }}>{z.totalSessions}</td>
                          <td style={{ padding: '12px 16px', color: colors.textSecondary }}>{z.totalSightings}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: colors.textPrimary }}>{z.totalBirds}</td>
                          <td style={{ padding: '12px 16px', color: colors.textSecondary }}>{z.uniqueSpecies}</td>
                          <td style={{ padding: '12px 16px' }}>
                            {z.alertsCount > 0 ? (
                              <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                                {z.alertsCount}
                              </span>
                            ) : (
                              <span style={{ color: colors.textSecondary, fontSize: '11px' }}>0</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <button
                              onClick={() => {
                                onSelectZepa(z.code);
                                setActiveButton('stats');
                              }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: `1px solid ${colors.cardBorder}`,
                                backgroundColor: colors.cardBg,
                                color: colors.accent,
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Ver Estadísticas
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
