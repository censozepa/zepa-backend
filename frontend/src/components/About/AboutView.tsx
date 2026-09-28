import React from 'react';
import {
  Smartphone,
  Server,
  Database,
  Globe,
  MapPin,
  Layers,
  Award,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const AboutView: React.FC = () => {
  const { colors } = useTheme();

  const zepasList = [
    { code: 'ES0000365', name: 'Páramo Leonés', region: 'Castilla y León', species: 'Otis tarda (Avutarda)', user: 'laura.ornito@gmail.com' },
    { code: 'ES0000024', name: 'Doñana', region: 'Andalucía', species: 'Aquila adalberti (Águila imperial)', user: 'marcos.birds@gmail.com' },
    { code: 'ES0000033', name: 'Monfragüe', region: 'Extremadura', species: 'Aegypius monachus (Buitre negro)', user: 'elena.campo@gmail.com' },
    { code: 'ES0000015', name: 'Laguna de Gallocanta', region: 'Aragón', species: 'Grus grus (Grulla común)', user: 'carlos.esteparias@gmail.com' },
    { code: 'ES0000043', name: 'Hoces del Río Duratón', region: 'Castilla y León', species: 'Gyps fulvus (Buitre leonado)', user: 'javier.zepa@gmail.com' },
    { code: 'ES0000018', name: 'Tablas de Daimiel', region: 'Castilla-La Mancha', species: 'Netta rufina (Pato colorado)', user: 'lucia.natura@gmail.com' },
    { code: 'ES0000020', name: 'Delta del Ebro', region: 'Cataluña', species: 'Phoenicopterus roseus (Flamenco)', user: 'pablo.rapaces@gmail.com' },
    { code: 'ES0000005', name: 'Cabo de Gata-Níjar', region: 'Andalucía', species: 'Chlamydotis undulata (Hubara)', user: 'marta.fauna@gmail.com' },
    { code: 'ES0000055', name: 'Somiedo', region: 'Asturias', species: 'Tetrao urogallus (Urogallo cantábrico)', user: 'sergio.silvestre@gmail.com' },
    { code: 'ES0000039', name: 'Sierra de Guadarrama', region: 'Madrid / CyL', species: 'Cinclus cinclus (Mirlo acuático)', user: 'beatriz.vuelo@gmail.com' },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '28px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Cabecera Principal */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '20px',
            padding: '32px',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            marginBottom: '26px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          <img
            src="/zepa-logo.png"
            alt="Logo CensoZEPA"
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              boxShadow: '0 8px 24px -4px rgba(4, 120, 87, 0.35)',
              objectFit: 'cover',
            }}
          />

          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: colors.textPrimary }}>
                CensoZEPA
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
                v1.2.0 (Red Natura 2000)
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '14.5px', color: colors.textSecondary, lineHeight: 1.5 }}>
              Plataforma tecnológica para la monitorización, inventariado y gestión geoespacial de avifauna en Zonas de Especial Protección para las Aves (ZEPA).
            </p>
          </div>
        </div>

        {/* 1. SECCIÓN: CONTEXTO ECOLÓGICO */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Globe size={20} color={colors.accent} />
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: colors.textPrimary }}>
              Propósito y Contexto Ecológico
            </h2>
          </div>

          <p style={{ fontSize: '13.5px', color: colors.textSecondary, lineHeight: 1.6, margin: '0 0 12px 0' }}>
            Las <strong>Zonas de Especial Protección para las Aves (ZEPA)</strong> forman parte esencial de la red europea <strong>Natura 2000</strong>, designadas con arreglo a la <strong>Directiva Aves 2009/147/CE</strong>. Su finalidad es asegurar la supervivencia y reproducción de las especies de aves silvestres amenazadas, migratorias y esteparias en sus áreas naturales de distribución.
          </p>

          <p style={{ fontSize: '13.5px', color: colors.textSecondary, lineHeight: 1.6, margin: 0 }}>
            <strong>CensoZEPA</strong> resuelve el reto de la recogida de datos en campo: conecta la toma de datos offline realizada por los ornitólogos con dispositivos móviles Android, mediante sincronización automática con un servidor central dotado de capacidades cartográficas y análisis multitenant.
          </p>
        </div>

        {/* 2. SECCIÓN: ARQUITECTURA TÉCNICA */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Layers size={20} color={colors.accent} />
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: colors.textPrimary }}>
              Arquitectura Técnica del Sistema
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {/* Componente 1: App Móvil */}
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: colors.mainBg, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Smartphone size={18} color="#0284c7" />
                <strong style={{ fontSize: '14px', color: colors.textPrimary }}>App Móvil Android (Kotlin)</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: colors.textSecondary, lineHeight: 1.6 }}>
                <li>Arquitectura offline-first con base de datos local SQLite y Room.</li>
                <li>Geolocalización precisa con FusedLocationProviderClient (precisión &lt; 10m).</li>
                <li>Sincronización en segundo plano con WorkManager e idempotencia vía UUID.</li>
                <li>Exportación de transectos de censo a formato CSV normalizado.</li>
              </ul>
            </div>

            {/* Componente 2: Backend API */}
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: colors.mainBg, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Server size={18} color="#059669" />
                <strong style={{ fontSize: '14px', color: colors.textPrimary }}>Backend API (Node.js + Fastify)</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: colors.textSecondary, lineHeight: 1.6 }}>
                <li>Framework Fastify con TypeScript y alto rendimiento en I/O.</li>
                <li>Autenticación segura con JWT y soporte Google OpenID Connect (OIDC).</li>
                <li>Validación estricta de esquemas con Zod en endpoints de ingesta.</li>
                <li>Servicio de datos espaciales en formato GeoJSON RFC 7946 estándar.</li>
              </ul>
            </div>

            {/* Componente 3: Base de Datos */}
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: colors.mainBg, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Database size={18} color="#7c3aed" />
                <strong style={{ fontSize: '14px', color: colors.textPrimary }}>Base Geoespacial (PostgreSQL + PostGIS)</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: colors.textSecondary, lineHeight: 1.6 }}>
                <li>PostgreSQL 16 con extensión espacial PostGIS 3.4.</li>
                <li>Geometrías en sistema de coordenadas WGS 84 (EPSG:4326).</li>
                <li>Índices espaciales GiST para consultas rápidas por polígonos y radios.</li>
                <li>Aislamiento multitenant por ZEPA y grupos ornitológicos.</li>
              </ul>
            </div>

            {/* Componente 4: Frontend SPA */}
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: colors.mainBg, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Globe size={18} color="#d97706" />
                <strong style={{ fontSize: '14px', color: colors.textPrimary }}>Frontend SPA (React 18 + Vite + Leaflet)</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: colors.textSecondary, lineHeight: 1.6 }}>
                <li>Visualización cartográfica interactiva con Leaflet y capas CartoDB.</li>
                <li>Dashboard global y vista privada ("Mis Registros").</li>
                <li>Soporte de temas visuales (Bosque, Noche de censo, Humedal).</li>
                <li>Exportación de tablas de avistamientos a CSV/Excel.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 3. SECCIÓN: RED DE 10 ZEPAS MONITORIZADAS */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <MapPin size={20} color={colors.accent} />
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: colors.textPrimary }}>
              Red de 10 ZEPAs Integradas
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ backgroundColor: colors.tableHeaderBg, borderBottom: `1px solid ${colors.cardBorder}` }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: colors.textSecondary }}>Código Natura 2000</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: colors.textSecondary }}>Espacio ZEPA</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: colors.textSecondary }}>Comunidad Autónoma</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: colors.textSecondary }}>Especie Emblemática</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: colors.textSecondary }}>Ornitólogo Asignado</th>
                </tr>
              </thead>
              <tbody>
                {zepasList.map((z, idx) => (
                  <tr
                    key={z.code}
                    style={{
                      borderBottom: `1px solid ${colors.cardBorder}`,
                      backgroundColor: idx % 2 === 0 ? 'transparent' : colors.mainBg,
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: colors.accent }}>{z.code}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: colors.textPrimary }}>{z.name}</td>
                    <td style={{ padding: '10px 14px', color: colors.textSecondary }}>{z.region}</td>
                    <td style={{ padding: '10px 14px', fontStyle: 'italic', color: colors.textPrimary }}>{z.species}</td>
                    <td style={{ padding: '10px 14px', color: colors.textSecondary }}>{z.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. SECCIÓN: ESPECIFICACIONES TÉCNICAS Y CRÉDITOS */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Award size={20} color={colors.accent} />
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: colors.textPrimary }}>
              Datos del Proyecto y Créditos
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', fontSize: '13px' }}>
            <div>
              <strong style={{ color: colors.textPrimary }}>Administrador de la Plataforma:</strong>
              <p style={{ margin: '4px 0 0 0', color: colors.textSecondary }}>
                Javier Román Espinar (<code>jroman.espinar@gmail.com</code>)
              </p>
            </div>

            <div>
              <strong style={{ color: colors.textPrimary }}>Sistema de Coordenadas:</strong>
              <p style={{ margin: '4px 0 0 0', color: colors.textSecondary }}>
                EPSG:4326 (WGS 84 Lat/Lng) compatible con ETRS89
              </p>
            </div>

            <div>
              <strong style={{ color: colors.textPrimary }}>Fuentes de Información Cartográfica:</strong>
              <p style={{ margin: '4px 0 0 0', color: colors.textSecondary }}>
                MITECO (Ministerio para la Transición Ecológica) & IGN
              </p>
            </div>

            <div>
              <strong style={{ color: colors.textPrimary }}>Protocolo de Identidad:</strong>
              <p style={{ margin: '4px 0 0 0', color: colors.textSecondary }}>
                OAuth 2.0 / OpenID Connect (Google Identity Services)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
