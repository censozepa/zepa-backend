import React, { useState, useMemo } from 'react';
import {
  Globe2,
  BarChart3,
  Table as TableIcon,
  RefreshCw,
  Bird,
  Compass,
} from 'lucide-react';
import { SamplingSession, SightingFeatureCollection, User, ZepaZone } from '../../types/sightings';
import { StatsCards } from '../Common/StatsCards';
import { RecordsTable } from '../Common/RecordsTable';
import { SessionsTable } from '../Common/SessionsTable';
import { HorizontalBarChart, DonutChart } from '../Charts/Charts';
import { useTheme } from '../../context/ThemeContext';

interface MyRecordsViewProps {
  user: User;
  zepas: ZepaZone[];
  selectedZepaCode: string;
  onSelectZepa: (code: string) => void;
  sessions: SamplingSession[];
  sightingsData: SightingFeatureCollection | null;
  loading: boolean;
  onRefresh: () => void;
}

export const MyRecordsView: React.FC<MyRecordsViewProps> = ({
  user,
  zepas,
  selectedZepaCode,
  onSelectZepa,
  sessions,
  sightingsData,
  loading,
  onRefresh,
}) => {
  const { colors } = useTheme();
  const [activeButton, setActiveButton] = useState<'global' | 'stats' | 'tables'>('global');
  const [tablesSubTab, setTablesSubTab] = useState<'sightings' | 'sessions'>('sightings');

  const allFeatures = sightingsData?.features || [];

  // Filtrar exclusivamente los registros introducidos por este usuario
  const myAllFeatures = useMemo(() => {
    return allFeatures.filter((f) => {
      const p = f.properties;
      const matchId = p.userId && p.userId === user.id;
      const matchEmail = p.observerEmail && p.observerEmail.toLowerCase() === user.email.toLowerCase();
      const matchName = p.observer && p.observer.toLowerCase() === user.full_name.toLowerCase();
      return matchId || matchEmail || matchName;
    });
  }, [allFeatures, user]);

  const myAllSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchId = s.userId && s.userId === user.id;
      const matchEmail = s.userEmail && s.userEmail.toLowerCase() === user.email.toLowerCase();
      const matchName = s.userFullName && s.userFullName.toLowerCase() === user.full_name.toLowerCase();
      return matchId || matchEmail || matchName;
    });
  }, [sessions, user]);

  // Filtrar por ZEPA seleccionada (o 'ALL' para todas)
  const myFilteredFeatures = useMemo(() => {
    if (selectedZepaCode === 'ALL') return myAllFeatures;
    return myAllFeatures.filter((f) => f.properties.zepaCode === selectedZepaCode);
  }, [myAllFeatures, selectedZepaCode]);

  const myFilteredSessions = useMemo(() => {
    if (selectedZepaCode === 'ALL') return myAllSessions;
    return myAllSessions.filter((s) => s.zepaCode === selectedZepaCode);
  }, [myAllSessions, selectedZepaCode]);

  // Métricas personales de la selección
  const myCurrentStats = useMemo(() => {
    const totalSightings = myFilteredFeatures.length;
    let totalBirds = 0;
    const speciesSet = new Set<string>();
    let alertsCount = 0;

    myFilteredFeatures.forEach((f) => {
      totalBirds += f.properties.count || 0;
      if (f.properties.speciesCode) speciesSet.add(f.properties.speciesCode);
      if (f.properties.phenologicalAlert) alertsCount++;
    });

    const totalSessions = myFilteredSessions.length;
    const totalDistanceKm = myFilteredSessions.reduce((acc, s) => acc + (Number(s.distanceKm) || 0), 0);

    return {
      totalSightings,
      totalBirds,
      uniqueSpecies: speciesSet.size,
      totalSessions,
      totalDistanceKm,
      alertsCount,
      zepasCount: selectedZepaCode === 'ALL' ? zepas.length : 1,
    };
  }, [myFilteredFeatures, myFilteredSessions, selectedZepaCode, zepas]);

  // =========================================================================
  // GRÁFICAS PARA MI VISIÓN GLOBAL
  // =========================================================================
  // 1. Mis Aves por ZEPA
  const myBirdsByZepaData = useMemo(() => {
    const map = new Map<string, { name: string; count: number; sightings: number }>();
    zepas.forEach((z) => map.set(z.code, { name: z.name, count: 0, sightings: 0 }));

    myAllFeatures.forEach((f) => {
      const code = f.properties.zepaCode || 'OTRA';
      const entry = map.get(code) || { name: code, count: 0, sightings: 0 };
      entry.count += f.properties.count || 1;
      entry.sightings += 1;
      map.set(code, entry);
    });

    return Array.from(map.entries())
      .filter(([_, val]) => val.count > 0)
      .map(([code, val]) => ({
        id: code,
        label: val.name,
        sublabel: code,
        value: val.count,
        badge: `${val.sightings} obs.`,
        color: colors.accent,
      }))
      .sort((a, b) => b.value - a.value);
  }, [zepas, myAllFeatures, colors.accent]);

  // 2. Mis Especies más observadas (Barras)
  const myTopSpeciesData = useMemo(() => {
    const map = new Map<string, { common: string; scientific: string; count: number }>();
    myAllFeatures.forEach((f) => {
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
  }, [myAllFeatures]);

  // 3. Mis Alertas vs Normales (Donut)
  const myAlertsDonutData = useMemo(() => {
    let normal = 0;
    let alert = 0;
    myAllFeatures.forEach((f) => {
      if (f.properties.phenologicalAlert) alert += f.properties.count || 1;
      else normal += f.properties.count || 1;
    });

    return [
      { label: 'Normales', value: normal, color: '#10b981' },
      { label: 'Alertas', value: alert, color: '#ef4444' },
    ];
  }, [myAllFeatures]);

  // 4. Donut de especies del usuario
  const mySpeciesDonutColors = ['#059669', '#0284c7', '#7c3aed', '#d97706', '#dc2626', '#0891b2', '#2563eb'];
  const mySpeciesDonutData = useMemo(() => {
    return myTopSpeciesData.slice(0, 6).map((sp, idx) => ({
      label: sp.label,
      value: sp.value,
      color: mySpeciesDonutColors[idx % mySpeciesDonutColors.length],
    }));
  }, [myTopSpeciesData]);

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
              Mis Registros
            </h1>
            <span
              style={{
                backgroundColor: 'rgba(2, 132, 199, 0.1)',
                color: '#0284c7',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              👤 {user.full_name}
            </span>
          </div>
          <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: colors.textSecondary }}>
            Visualización y análisis de tus datos de campo sincronizados desde la App Android.
          </p>
        </div>

        {/* 3 botones y desplegable */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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

          {/* Desplegable de ZEPAs con 'Todas' */}
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

          <button
            onClick={onRefresh}
            title="Refrescar mis datos"
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

      {/* CUERPO PRINCIPAL */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {/* BOTÓN 1: VISIÓN GLOBAL PERSONAL */}
        {activeButton === 'global' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <StatsCards
              totalSightings={myAllFeatures.length}
              totalBirds={myAllFeatures.reduce((acc, f) => acc + (f.properties.count || 0), 0)}
              uniqueSpecies={myTopSpeciesData.length}
              totalSessions={myAllSessions.length}
              totalDistanceKm={myAllSessions.reduce((acc, s) => acc + (Number(s.distanceKm) || 0), 0)}
              alertsCount={myAllFeatures.filter((f) => f.properties.phenologicalAlert).length}
              title="Resumen General de Mis Observaciones"
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
              <HorizontalBarChart
                data={myBirdsByZepaData.length > 0 ? myBirdsByZepaData : [{ id: 'none', label: 'Sin registros', value: 0 }]}
                title="Mis Aves Censadas por ZEPA"
                subtitle="Ejemplares registrados en cada territorio con mi cuenta"
                valueSuffix="aves"
                maxBars={8}
              />

              <DonutChart
                data={mySpeciesDonutData.length > 0 ? mySpeciesDonutData : [{ label: 'Sin datos', value: 1, color: '#94a3b8' }]}
                title="Distribución de Mis Especies Principales"
                subtitle="Porcentaje de observaciones de tus especies más registradas"
                centerLabel="Total Aves"
                centerValue={myAllFeatures.reduce((acc, f) => acc + (f.properties.count || 0), 0)}
                size={190}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
              <HorizontalBarChart
                data={myTopSpeciesData}
                title="Mis Especies más Observadas"
                subtitle="Ranking de especies según el número de ejemplares censados por ti"
                valueSuffix="ejemplares"
                maxBars={8}
              />

              <DonutChart
                data={myAlertsDonutData}
                title="Alertas Fenológicas Registradas por Mí"
                subtitle="Proporción de avistamientos con alerta fenológica"
                centerLabel="Registros"
                centerValue={myAllFeatures.length}
                size={190}
              />
            </div>
          </div>
        )}

        {/* BOTÓN 2: ESTADÍSTICAS PERSONALES */}
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
                  Filtro ZEPA de mis registros:{' '}
                  <span style={{ color: colors.accent }}>
                    {selectedZepaCode === 'ALL'
                      ? 'Todas las ZEPAs'
                      : zepas.find((z) => z.code === selectedZepaCode)?.name || selectedZepaCode}
                  </span>
                </strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: colors.textSecondary }}>
                  Estadísticas de tus censos para la zona seleccionada en el desplegable.
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

            <StatsCards
              totalSightings={myCurrentStats.totalSightings}
              totalBirds={myCurrentStats.totalBirds}
              uniqueSpecies={myCurrentStats.uniqueSpecies}
              totalSessions={myCurrentStats.totalSessions}
              totalDistanceKm={myCurrentStats.totalDistanceKm}
              alertsCount={myCurrentStats.alertsCount}
              zepasCount={myCurrentStats.zepasCount}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
              <HorizontalBarChart
                data={myTopSpeciesData}
                title={`Mis Especies en ${selectedZepaCode === 'ALL' ? 'Todas las ZEPAs' : selectedZepaCode}`}
                subtitle={`${myCurrentStats.uniqueSpecies} especies identificadas`}
                valueSuffix="aves"
                maxBars={10}
              />

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
                    Mis Sesiones de Muestreo ({myFilteredSessions.length})
                  </h3>
                </div>

                {myFilteredSessions.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: colors.textSecondary }}>
                    No has registrado sesiones en esta ZEPA.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                    {myFilteredSessions.map((s) => (
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
                            {new Date(s.startTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} · {s.distanceKm} km
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
                            {s.totalBirds} aves ({s.uniqueSpecies} esp.)
                          </div>
                          <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                            {s.sightingCount} obs.
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

        {/* BOTÓN 3: MIS TABLAS */}
        {activeButton === 'tables' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                  <span>Mis Avistamientos ({myFilteredFeatures.length})</span>
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
                  <span>Mis Sesiones / Transectos ({myFilteredSessions.length})</span>
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

            {tablesSubTab === 'sightings' && (
              <RecordsTable
                features={myFilteredFeatures}
                title={`Mis Registros (${selectedZepaCode === 'ALL' ? 'Todas las ZEPAs' : selectedZepaCode})`}
                subtitle="Observaciones capturadas personalmente con tu dispositivo Android."
              />
            )}

            {tablesSubTab === 'sessions' && (
              <SessionsTable
                sessions={myFilteredSessions}
                title={`Mis Sesiones GPS (${selectedZepaCode === 'ALL' ? 'Todas las ZEPAs' : selectedZepaCode})`}
                subtitle="Transectos de censo registrados con tu cuenta."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
