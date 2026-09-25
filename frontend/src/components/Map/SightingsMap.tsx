import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { SightingFeatureCollection } from '../../types/sightings';

// Icono personalizado SVG para Leaflet (evita problemas de rutas de Vite con los pngs por defecto)
const birdIcon = new L.DivIcon({
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

interface SightingsMapProps {
  data: SightingFeatureCollection | null;
  loading: boolean;
  selectedSightingId?: string | null;
}

// Componente para ajustar la vista del mapa automáticamente cuando hay marcadores
function ChangeView({ data }: { data: SightingFeatureCollection | null }) {
  const map = useMap();

  useEffect(() => {
    if (data && data.features.length > 0) {
      const bounds = L.latLngBounds(
        data.features.map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [data, map]);

  return null;
}

export const SightingsMap: React.FC<SightingsMapProps> = ({ data, loading }) => {
  // Centro por defecto: Península Ibérica
  const defaultCenter: [number, number] = [40.4168, -3.7038];

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 64px)' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '8px 16px',
            borderRadius: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            fontSize: '14px',
            fontWeight: 500,
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="spinner">⏳</span> Cargando avistamientos...
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={6}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <ChangeView data={data} />

        {data?.features.map((feature) => {
          const [lon, lat] = feature.geometry.coordinates;
          const { id, speciesName, count, sightedAt, observer, notes, accuracyMeters } =
            feature.properties;

          return (
            <Marker key={id} position={[lat, lon]} icon={birdIcon}>
              <Popup>
                <div style={{ minWidth: '220px', padding: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#065f46' }}>
                      {speciesName}
                    </h3>
                    <span
                      style={{
                        background: '#ecfdf5',
                        color: '#065f46',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '1px solid #a7f3d0',
                      }}
                    >
                      {count} {count === 1 ? 'ejemplar' : 'ejemplares'}
                    </span>
                  </div>

                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#4b5563' }}>
                    <strong>Observador:</strong> {observer}
                  </p>

                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#4b5563' }}>
                    <strong>Fecha:</strong> {new Date(sightedAt).toLocaleString('es-ES')}
                  </p>

                  {accuracyMeters && (
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#6b7280' }}>
                      <strong>Precisión GPS:</strong> ±{accuracyMeters.toFixed(1)} m
                    </p>
                  )}

                  {notes && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '8px',
                        background: '#f9fafb',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#374151',
                        borderLeft: '3px solid #10b981',
                      }}
                    >
                      <em>"{notes}"</em>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '11px',
                      color: '#9ca3af',
                      textAlign: 'right',
                    }}
                  >
                    Lat: {lat.toFixed(4)}, Lon: {lon.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
