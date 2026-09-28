import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

// =========================================================================
// 1. HORIZONTAL BAR CHART
// =========================================================================
export interface BarItem {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  color?: string;
  badge?: string;
}

interface HorizontalBarChartProps {
  data: BarItem[];
  title?: string;
  subtitle?: string;
  valueSuffix?: string;
  maxBars?: number;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  data,
  title,
  subtitle,
  valueSuffix = '',
  maxBars = 10,
}) => {
  const { colors } = useTheme();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const displayData = data.slice(0, maxBars);
  const maxValue = Math.max(...displayData.map((d) => d.value), 1);

  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: '16px',
        padding: '22px',
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {title && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: colors.textPrimary }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: colors.textSecondary }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {displayData.map((item) => {
          const percentage = Math.round((item.value / maxValue) * 100);
          const isHovered = hoveredId === item.id;
          const barColor = item.color || colors.accent;

          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                cursor: 'default',
                padding: '6px 8px',
                borderRadius: '8px',
                backgroundColor: isHovered ? colors.tableRowHover : 'transparent',
                transition: 'background-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: colors.textPrimary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.label}
                  </span>
                  {item.sublabel && (
                    <span style={{ fontSize: '11px', color: colors.textSecondary, fontStyle: 'italic' }}>
                      ({item.sublabel})
                    </span>
                  )}
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: colors.accentBg,
                        color: colors.accent,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <div style={{ fontWeight: 700, fontSize: '13.5px', color: barColor, whiteSpace: 'nowrap', marginLeft: '12px' }}>
                  {item.value.toLocaleString()} {valueSuffix}
                </div>
              </div>

              {/* Barra de progreso */}
              <div
                style={{
                  height: '8px',
                  backgroundColor: colors.mainBg,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${percentage}%`,
                    backgroundColor: barColor,
                    borderRadius: '4px',
                    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =========================================================================
// 2. DONUT / PIE CHART (SVG)
// =========================================================================
export interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: PieSlice[];
  title?: string;
  subtitle?: string;
  centerLabel?: string;
  centerValue?: string | number;
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  subtitle,
  centerLabel,
  centerValue,
  size = 180,
}) => {
  const { colors } = useTheme();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((acc, d) => acc + d.value, 0);
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = 0;

  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: '16px',
        padding: '22px',
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {title && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: colors.textPrimary }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: colors.textSecondary }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
        {/* SVG Donut */}
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {total === 0 ? (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={colors.mainBg}
                strokeWidth={strokeWidth}
              />
            ) : (
              data.map((slice, idx) => {
                const percentage = slice.value / total;
                const strokeDasharray = `${percentage * circumference} ${circumference}`;
                const strokeDashoffset = -accumulatedAngle * circumference;
                accumulatedAngle += percentage;
                const isHovered = hoveredIdx === idx;

                return (
                  <circle
                    key={idx}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{
                      transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                      cursor: 'pointer',
                      opacity: hoveredIdx !== null && !isHovered ? 0.6 : 1,
                    }}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })
            )}
          </svg>

          {/* Centro del Donut */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 800, color: colors.textPrimary, lineHeight: 1.1 }}>
              {centerValue !== undefined ? centerValue : total.toLocaleString()}
            </div>
            {centerLabel && (
              <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>
                {centerLabel}
              </div>
            )}
          </div>
        </div>

        {/* Leyenda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' }}>
          {data.map((slice, idx) => {
            const percentage = total > 0 ? Math.round((slice.value / total) * 100) : 0;
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: isHovered ? colors.tableRowHover : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: slice.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '12.5px', color: colors.textPrimary, fontWeight: isHovered ? 700 : 500 }}>
                    {slice.label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: colors.textPrimary }}>
                    {slice.value}
                  </span>
                  <span style={{ fontSize: '11px', color: colors.textSecondary }}>
                    ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
