import React, { useMemo, useState } from 'react';
import {
  Trophy,
  Users,
  Compass,
  MapPin,
  Flame,
} from 'lucide-react';
import { SamplingSession, SightingFeature } from '../../types/sightings';
import { useTheme } from '../../context/ThemeContext';

interface UserActivityRankingProps {
  sessions: SamplingSession[];
  sightings: SightingFeature[];
}

export interface UserStatsRank {
  rank: number;
  name: string;
  sessionsCount: number;
  sightingsCount: number;
  totalBirds: number;
  uniqueSpecies: number;
  distanceKm: number;
  alertsCount: number;
  zepas: string[];
}

export const UserActivityRanking: React.FC<UserActivityRankingProps> = ({
  sessions,
  sightings,
}) => {
  const { colors } = useTheme();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Computar agregación de usuarios ordenados de mayor a menor número de muestreos
  const topUsers = useMemo<UserStatsRank[]>(() => {
    const usersMap = new Map<
      string,
      {
        name: string;
        email: string;
        sessionsCount: number;
        sightingsCount: number;
        totalBirds: number;
        speciesSet: Set<string>;
        distanceKm: number;
        alertsCount: number;
        zepasSet: Set<string>;
      }
    >();

    // 1. Acumular desde sesiones
    sessions.forEach((s) => {
      const email = s.userEmail || '';
      // Priorizar nombre completo. Si no está disponible, usar alias previo a la arroba para proteger la privacidad.
      const rawName = s.userFullName && s.userFullName.trim().length > 0
        ? s.userFullName
        : (email ? email.split('@')[0] : 'Ornitólogo ZEPA');
      const name = rawName.includes('@') ? rawName.split('@')[0] : rawName;
      const key = (email || name).toLowerCase();
      if (!key) return;

      const current = usersMap.get(key) || {
        name,
        email,
        sessionsCount: 0,
        sightingsCount: 0,
        totalBirds: 0,
        speciesSet: new Set<string>(),
        distanceKm: 0,
        alertsCount: 0,
        zepasSet: new Set<string>(),
      };

      current.sessionsCount += 1;
      current.distanceKm += Number(s.distanceKm) || 0;
      if (s.zepaCode) current.zepasSet.add(s.zepaCode);

      usersMap.set(key, current);
    });

    // 2. Acumular desde avistamientos
    sightings.forEach((f) => {
      const p = f.properties;
      const email = p.observerEmail || '';
      const rawName = p.observer && p.observer.trim().length > 0
        ? p.observer
        : (email ? email.split('@')[0] : 'Ornitólogo ZEPA');
      const name = rawName.includes('@') ? rawName.split('@')[0] : rawName;
      const key = (email || name).toLowerCase();
      if (!key) return;

      const current = usersMap.get(key) || {
        name,
        email,
        sessionsCount: 0,
        sightingsCount: 0,
        totalBirds: 0,
        speciesSet: new Set<string>(),
        distanceKm: 0,
        alertsCount: 0,
        zepasSet: new Set<string>(),
      };

      current.sightingsCount += 1;
      current.totalBirds += p.count || 1;
      if (p.speciesCode) current.speciesSet.add(p.speciesCode);
      if (p.phenologicalAlert) current.alertsCount += 1;
      if (p.zepaCode) current.zepasSet.add(p.zepaCode);

      usersMap.set(key, current);
    });

    // 3. Ordenar de mayor a menor número de muestreos (sesiones), luego por avistamientos y aves
    const sorted = Array.from(usersMap.values()).sort((a, b) => {
      if (b.sessionsCount !== a.sessionsCount) {
        return b.sessionsCount - a.sessionsCount;
      }
      if (b.sightingsCount !== a.sightingsCount) {
        return b.sightingsCount - a.sightingsCount;
      }
      return b.totalBirds - a.totalBirds;
    });

    // 4. Tomar los Top 10
    return sorted.slice(0, 10).map((u, idx) => ({
      rank: idx + 1,
      name: u.name,
      sessionsCount: u.sessionsCount,
      sightingsCount: u.sightingsCount,
      totalBirds: u.totalBirds,
      uniqueSpecies: u.speciesSet.size,
      distanceKm: parseFloat(u.distanceKm.toFixed(1)),
      alertsCount: u.alertsCount,
      zepas: Array.from(u.zepasSet),
    }));
  }, [sessions, sightings]);

  const maxSessions = topUsers[0]?.sessionsCount || 1;

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return { emoji: '🥇', bg: 'rgba(234, 179, 8, 0.2)', border: '#eab308', text: '#ca8a04' };
      case 2:
        return { emoji: '🥈', bg: 'rgba(148, 163, 184, 0.2)', border: '#94a3b8', text: '#64748b' };
      case 3:
        return { emoji: '🥉', bg: 'rgba(217, 119, 6, 0.2)', border: '#d97706', text: '#b45309' };
      default:
        return { emoji: `#${rank}`, bg: colors.mainBg, border: colors.cardBorder, text: colors.textSecondary };
    }
  };

  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Cabecera del Ranking */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                color: '#eab308',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: colors.textPrimary }}>
                Top 10 Usuarios más activos
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: colors.textSecondary }}>
                Ornitólogos ordenados de mayor a menor número de muestreos y censos registrados en la plataforma.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: colors.accent, fontWeight: 700 }}>
          <Flame size={16} />
          <span>Ordenado por Muestreos Realizados</span>
        </div>
      </div>

      {/* Grid de 2 columnas: Gráfica de Barras de Muestreos + Tabla Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '22px' }}>
        {/* COLUMNA 1: Gráfica de Barras Visual de Muestreos */}
        <div
          style={{
            backgroundColor: colors.mainBg,
            borderRadius: '14px',
            padding: '18px',
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Users size={17} color={colors.accent} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
              Gráfica de Muestreos por Usuario
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            {topUsers.map((u, idx) => {
              const percentage = Math.round((u.sessionsCount / maxSessions) * 100);
              const badge = getRankBadge(u.rank);
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={`${u.rank}-${u.name}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    backgroundColor: isHovered ? colors.cardBg : 'transparent',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          minWidth: '22px',
                          textAlign: 'center',
                          padding: '1px 4px',
                          borderRadius: '4px',
                          backgroundColor: badge.bg,
                          color: badge.text,
                        }}
                      >
                        {badge.emoji}
                      </span>
                      <strong
                        style={{
                          fontSize: '13px',
                          color: colors.textPrimary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {u.name}
                      </strong>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 800, color: colors.accent, whiteSpace: 'nowrap' }}>
                      {u.sessionsCount} muestreo{u.sessionsCount !== 1 ? 's' : ''}
                      <span style={{ fontSize: '11px', fontWeight: 500, color: colors.textSecondary, marginLeft: '6px' }}>
                        ({u.totalBirds} aves)
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: colors.cardBg,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: `1px solid ${colors.cardBorder}`,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(percentage, 5)}%`,
                        backgroundColor: idx === 0 ? '#eab308' : idx === 1 ? '#0284c7' : colors.accent,
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

        {/* COLUMNA 2: Tarjetas / Tabla Detallada con Estadísticas Completas */}
        <div
          style={{
            backgroundColor: colors.mainBg,
            borderRadius: '14px',
            padding: '18px',
            border: `1px solid ${colors.cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Compass size={17} color={colors.accent} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
              Estadísticas Detalladas de Actividad
            </span>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '430px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topUsers.map((u, idx) => {
              const badge = getRankBadge(u.rank);
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={`${u.rank}-${u.name}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    backgroundColor: colors.cardBg,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    border: `1px solid ${isHovered ? colors.accent : colors.cardBorder}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Fila superior: Usuario y Muestreos */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          backgroundColor: badge.bg,
                          color: badge.text,
                        }}
                      >
                        {badge.emoji}
                      </span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
                          {u.name}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          backgroundColor: colors.accentBg,
                          color: colors.accent,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 800,
                        }}
                      >
                        {u.sessionsCount} Muestreos
                      </span>
                    </div>
                  </div>

                  {/* Fila de métricas: Avistamientos, Aves, Especies, Distancia, ZEPAs */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      paddingTop: '6px',
                      borderTop: `1px solid ${colors.cardBorder}`,
                      fontSize: '11.5px',
                    }}
                  >
                    <div>
                      <span style={{ color: colors.textSecondary, display: 'block', fontSize: '10px' }}>Avistamientos</span>
                      <strong style={{ color: colors.textPrimary }}>{u.sightingsCount}</strong>
                    </div>

                    <div>
                      <span style={{ color: colors.textSecondary, display: 'block', fontSize: '10px' }}>Aves Censadas</span>
                      <strong style={{ color: colors.textPrimary }}>{u.totalBirds}</strong>
                    </div>

                    <div>
                      <span style={{ color: colors.textSecondary, display: 'block', fontSize: '10px' }}>Especies</span>
                      <strong style={{ color: colors.textPrimary }}>{u.uniqueSpecies}</strong>
                    </div>

                    <div>
                      <span style={{ color: colors.textSecondary, display: 'block', fontSize: '10px' }}>Distancia</span>
                      <strong style={{ color: colors.textPrimary }}>{u.distanceKm} km</strong>
                    </div>
                  </div>

                  {/* ZEPAs cubiertas por el usuario */}
                  {u.zepas.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <MapPin size={12} color={colors.textSecondary} />
                      <span style={{ fontSize: '10.5px', color: colors.textSecondary }}>ZEPAs:</span>
                      {u.zepas.map((zepa) => (
                        <span
                          key={zepa}
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: colors.mainBg,
                            color: colors.textPrimary,
                            border: `1px solid ${colors.cardBorder}`,
                          }}
                        >
                          {zepa}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
