import React from 'react';
import { Eye, Bird, Compass, AlertTriangle, Layers, MapPin } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface StatsCardsProps {
  totalSightings: number;
  totalBirds: number;
  uniqueSpecies: number;
  totalSessions: number;
  totalDistanceKm: number;
  alertsCount: number;
  zepasCount?: number;
  title?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalSightings,
  totalBirds,
  uniqueSpecies,
  totalSessions,
  totalDistanceKm,
  alertsCount,
  zepasCount,
}) => {
  const { colors } = useTheme();

  const cards = [
    {
      label: 'Avistamientos',
      value: totalSightings,
      icon: Eye,
      color: '#059669',
      bg: '#ecfdf5',
      hint: 'Registros de campo sincronizados',
    },
    {
      label: 'Ejemplares Censados',
      value: totalBirds,
      icon: Bird,
      color: '#0284c7',
      bg: '#f0f9ff',
      hint: 'Individuos totales observados',
    },
    {
      label: 'Especies Distintas',
      value: uniqueSpecies,
      icon: Layers,
      color: '#7c3aed',
      bg: '#f5f3ff',
      hint: 'Taxones de aves identificados',
    },
    {
      label: 'Sesiones / Transectos',
      value: totalSessions,
      icon: Compass,
      color: '#d97706',
      bg: '#fffbeb',
      hint: 'Muestreos geolocalizados con GPS',
    },
    {
      label: 'Distancia Recorrida',
      value: `${totalDistanceKm.toFixed(1)} km`,
      icon: MapPin,
      color: '#2563eb',
      bg: '#eff6ff',
      hint: 'Longitud de transectos de censo',
    },
    {
      label: 'Alertas Fenológicas',
      value: alertsCount,
      icon: AlertTriangle,
      color: alertsCount > 0 ? '#dc2626' : '#64748b',
      bg: alertsCount > 0 ? '#fef2f2' : '#f8fafc',
      hint: 'Comportamientos o fechas anómalas',
    },
  ];

  if (zepasCount !== undefined) {
    cards.splice(4, 0, {
      label: 'ZEPAs Monitorizadas',
      value: zepasCount,
      icon: MapPin,
      color: '#0891b2',
      bg: '#ecfeff',
      hint: 'Espacios protegidos activos',
    });
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '20px',
      }}
    >
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: '14px',
              padding: '16px 18px',
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary }}>
                {card.label}
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: card.bg,
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={17} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: colors.textPrimary, lineHeight: 1.2 }}>
                {card.value}
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '4px' }}>
                {card.hint}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
