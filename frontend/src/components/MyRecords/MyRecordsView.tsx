import React, { useState, useMemo } from 'react';
import {
  Map as MapIcon,
  BarChart3,
  Table as TableIcon,
  Bird,
  Compass,
  RefreshCw,
} from 'lucide-react';
import { SamplingSession, SightingFeatureCollection, User, ZepaZone } from '../../types/sightings';
import { StatsCards } from '../Common/StatsCards';
import { RecordsTable } from '../Common/RecordsTable';
import { SightingsMap } from '../Map/SightingsMap';
import { SessionInspector } from '../Inspector/SessionInspector';
import { useTheme } from '../../context/ThemeContext';

interface MyRecordsViewProps {
  user: User;
  zepas: ZepaZone[];
  selectedZepaCode: string;
  onSelectZepa: (code: string) => void;
  sessions: SamplingSession[];
  activeSessionNum: number | null;
  onSelectSession: (num: number | null) => void;
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
  activeSessionNum,
  onSelectSession,
  sightingsData,
  loading,
  onRefresh,
}) => {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState<'map' | 'analytics' | 'table'>('map');

  const selectedZepa = zepas.find((z) => z.code === selectedZepaCode) || null;
  const allFeatures = sightingsData?.features || [];

  // Filtrar exclusivamente los registros introducidos por este usuario
  const myFeatures = useMemo(() => {
    return allFeatures.filter((f) => {
      const p = f.properties;
      const matchId = p.userId && p.userId === user.id;
      const matchEmail = p.observerEmail && p.observerEmail.toLowerCase() === user.email.toLowerCase();
      const matchName = p.observer && p.observer.toLowerCase() === user.full_name.toLowerCase();
      // Si el usuario es admin, también puede haber introducido avistamientos
      return matchId || matchEmail || matchName;
    });
  }, [allFeatures, user]);

  // Colección GeoJSON filtrada
  const mySightingsData: SightingFeatureCollection = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: myFeatures,
    };
  }, [myFeatures]);

  // Filtrar las sesiones de muestreo del usuario
  const mySessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchId = s.userId && s.userId === user.id;
      const matchEmail = s.userEmail && s.userEmail.toLowerCase() === user.email.toLowerCase();
      const matchName = s.userFullName && s.userFullName.toLowerCase() === user.full_name.toLowerCase();
      return matchId || matchEmail || matchName;
    });
  }, [sessions, user]);

  // Métricas personales
  const myStats = useMemo(() => {
    const totalSightings = myFeatures.length;
    let totalBirds = 0;
    const speciesSet = new Set<string>();
    let alertsCount = 0;

    myFeatures.forEach((f) => {
      totalBirds += f.properties.count || 0;
      if (f.properties.speciesCode) speciesSet.add(f.properties.speciesCode);
      if (f.properties.phenologicalAlert) alertsCount++;
    });

    const totalSessions = mySessions.length;
    const totalDistanceKm = mySessions.reduce((acc, s) => acc + (Number(s.distanceKm) || 0), 0);

    return {
      totalSightings,
      totalBirds,
      uniqueSpecies: speciesSet.size,
      totalSessions,
      totalDistanceKm,
      alertsCount,
    };
  }, [myFeatures, mySessions]);

  // Mis especies más observadas
  const myTopSpecies = useMemo(() => {
    const map = new Map<string, { common: string; scientific: string; count: number; sightings: number }>();
    myFeatures.forEach((f) => {
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
  }, [myFeatures]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Cabecera personalizada */}
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
              Mis Registros de Campo
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
            Observaciones y censos introducidos con tu cuenta a través de la App de Android.
          </p>
        </div>

        {/* Pestañas de vista personal */}
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
              <span>Mi Mapa ({myFeatures.length})</span>
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
              <span>Mis Estadísticas</span>
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
              <span>Mi Tabla</span>
            </button>
          </div>

          {/* Selector de ZEPA */}
          {zepas.length > 1 && (
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
          )}

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

      {/* Contenido según pestaña */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* MODO 1: MAPA Y MUESTREOS PERSONALES */}
        {viewMode === 'map' && (
          <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
            <main style={{ flex: 1, position: 'relative', height: '100%' }}>
              <SightingsMap
                data={mySightingsData}
                selectedZepa={selectedZepa}
                loading={loading}
                onSelectSession={(num) => onSelectSession(num)}
              />
            </main>
            <SessionInspector
              selectedZepa={selectedZepa}
              sessions={mySessions}
              activeSessionNum={activeSessionNum}
              onSelectSession={(num) => onSelectSession(num)}
              sightingsData={mySightingsData}
            />
          </div>
        )}

        {/* MODO 2: ESTADÍSTICAS PERSONALES */}
        {viewMode === 'analytics' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '24px' }}>
            <StatsCards
              totalSightings={myStats.totalSightings}
              totalBirds={myStats.totalBirds}
              uniqueSpecies={myStats.uniqueSpecies}
              totalSessions={myStats.totalSessions}
              totalDistanceKm={myStats.totalDistanceKm}
              alertsCount={myStats.alertsCount}
              title="Resumen de Mis Observaciones"
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
              {/* Especies detectadas por el usuario */}
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
                    Especies Detectadas en Mis Censos
                  </h3>
                </div>

                {myTopSpecies.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: colors.textSecondary }}>
                    No hay avistamientos registrados todavía con esta cuenta.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {myTopSpecies.map((sp, idx) => {
                      const maxCount = myTopSpecies[0]?.count || 1;
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
                )}
              </div>

              {/* Sesiones de campo personales */}
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
                    Mis Sesiones de Muestreo GPS ({mySessions.length})
                  </h3>
                </div>

                {mySessions.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: colors.textSecondary }}>
                    No hay sesiones asignadas a esta cuenta.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
                    {mySessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          onSelectSession(s.sessionNumber);
                          setViewMode('map');
                        }}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: colors.mainBg,
                          border: `1px solid ${colors.cardBorder}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
                            Sesión #{s.sessionNumber} ({s.zepaCode})
                          </div>
                          <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                            {new Date(s.startTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} · {s.distanceKm} km
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.accent }}>
                            {s.sightingCount} avistamientos
                          </div>
                          <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                            {s.totalBirds} aves ({s.uniqueSpecies} esp.)
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

        {/* MODO 3: TABLA PERSONAL */}
        {viewMode === 'table' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '20px' }}>
            <RecordsTable
              features={myFeatures}
              title={`Mis Registros (${user.full_name})`}
              subtitle="Registros capturados con tu dispositivo Android y sincronizados en la base de datos."
            />
          </div>
        )}
      </div>
    </div>
  );
};
