import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { SightingFeatureCollection, ZepaZone } from '../../types/sightings';

// Icono verde estándar para avistamientos regulares
const regularBirdIcon = new L.DivIcon({
  className: 'custom-bird-marker',
  html: `
    <div style="
      background: #059669;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
      cursor: pointer;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 7h.01"/>
        <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 14"/>
        <path d="m20 7 2 .5-2 .5"/>
        <path d="M10 18v3"/>
        <path d="M14 17.75V21"/>
        <path d="M7 18a6 6 0 0 0 3.84-10.61"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

// Icono ámbar/rojo para alertas fenológicas
const alertBirdIcon = new L.DivIcon({
  className: 'custom-bird-marker-alert',
  html: `
    <div style="
      background: #dc2626;
      color: white;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #fef08a;
      box-shadow: 0 0 10px rgba(220, 38, 38, 0.6);
      cursor: pointer;
      animation: pulse 2s infinite;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -19],
});

interface SightingsMapProps {
  data: SightingFeatureCollection | null;
  selectedZepa: ZepaZone | null;
  loading: boolean;
  onSelectSession?: (sessionNumber: number) => void;
}

function ChangeView({
  data,
  selectedZepa,
}: {
  data: SightingFeatureCollection | null;
  selectedZepa: ZepaZone | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedZepa && selectedZepa.geometry) {
      try {
        const geojsonLayer = L.geoJSON(selectedZepa.geometry);
        map.fitBounds(geojsonLayer.getBounds(), { padding: [40, 40], maxZoom: 12 });
        return;
      } catch (e) {
        console.error('Error fitting bounds to ZEPA', e);
      }
    }

    if (data && data.features.length > 0) {
      const bounds = L.latLngBounds(
        data.features.map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [data, selectedZepa, map]);

  return null;
}

export const SightingsMap: React.FC<SightingsMapProps> = ({
  data,
  selectedZepa,
  loading,
  onSelectSession,
}) => {
  const defaultCenter: [number, number] = [42.26, -5.73];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '8px 16px',
            borderRadius: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            fontSize: '13px',
            fontWeight: 600,
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="spinner">⏳</span> Cargando mapa ornitológico...
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={10}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <ChangeView data={data} selectedZepa={selectedZepa} />

        {/* Polígono de la ZEPA activa */}
        {selectedZepa?.geometry && (
          <GeoJSON
            key={selectedZepa.code}
            data={selectedZepa.geometry}
            style={{
              color: '#059669',
              weight: 2.5,
              opacity: 0.9,
              dashArray: '6, 6',
              fillColor: '#10b981',
              fillOpacity: 0.12,
            }}
          />
        )}

        {/* Marcadores de avistamientos */}
        {data?.features.map((feature) => {
          const [lon, lat] = feature.geometry.coordinates;
          const {
            id,
            speciesCode,
            commonName,
            scientificName,
            speciesName,
            count,
            sightedAt,
            phenologicalAlert,
            sessionNumber,
            observer,
            notes,
            accuracyMeters,
          } = feature.properties;

          const isAlert = !!phenologicalAlert;
          const markerIcon = isAlert ? alertBirdIcon : regularBirdIcon;

          return (
            <Marker key={id} position={[lat, lon]} icon={markerIcon}>
              <Popup>
                <div style={{ minWidth: '240px', padding: '4px' }}>
                  {isAlert && (
                    <div
                      style={{
                        background: '#fee2e2',
                        border: '1px solid #f87171',
                        color: '#991b1b',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '8px',
                      }}
                    >
                      ⚠️ ALERTA FENOLÓGICA (Avistamiento anómalo)
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 2px 0', fontSize: '15px', color: '#0f172a' }}>
                        {commonName || speciesName}
                      </h3>
                      {scientificName && (
                        <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#64748b' }}>
                          {scientificName}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        background: '#ecfdf5',
                        color: '#065f46',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: '1px solid #a7f3d0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {count} {count === 1 ? 'ejemplar' : 'ejemplares'}
                    </span>
                  </div>

                  {speciesCode && (
                    <div style={{ marginTop: '6px' }}>
                      <span
                        style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        Directiva Aves: {speciesCode}
                      </span>
                    </div>
                  )}

                  <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

                  <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div>
                      <strong>Hora avistamiento:</strong> {new Date(sightedAt).toLocaleTimeString('es-ES')}
                    </div>
                    <div>
                      <strong>Fecha:</strong> {new Date(sightedAt).toLocaleDateString('es-ES')}
                    </div>
                    {sessionNumber && (
                      <div>
                        <strong>Sesión de censo:</strong>{' '}
                        <button
                          onClick={() => onSelectSession?.(sessionNumber)}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '1px 6px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            color: '#0284c7',
                            fontWeight: 600,
                          }}
                        >
                          Sesión #{sessionNumber} ↗
                        </button>
                      </div>
                    )}
                    {accuracyMeters && (
                      <div style={{ color: '#94a3b8' }}>
                        Precisión GPS: ±{accuracyMeters.toFixed(1)} m
                      </div>
                    )}
                    {observer && (
                      <div style={{ color: '#64748b' }}>
                        Observador: {observer}
                      </div>
                    )}
                  </div>

                  {notes && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '6px 8px',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#334155',
                        borderLeft: '3px solid #10b981',
                      }}
                    >
                      <em>"{notes}"</em>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
