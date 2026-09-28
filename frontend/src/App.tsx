import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar/Navbar';
import { SightingsMap } from './components/Map/SightingsMap';
import { SessionInspector } from './components/Inspector/SessionInspector';
import { LoginScreen } from './components/Auth/LoginScreen';
import { fetchZepas, fetchSessions, fetchSightingsGeoJSON } from './services/api';
import { SamplingSession, SightingFeatureCollection, User, ZepaZone } from './types/sightings';

export const App: React.FC = () => {
  // Estado de usuario y autenticación
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('censozepa_user');
    const token = localStorage.getItem('censozepa_token');
    if (savedUser && token) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [zepas, setZepas] = useState<ZepaZone[]>([]);
  const [selectedZepaCode, setSelectedZepaCode] = useState<string>('ES0000365');
  const [sessions, setSessions] = useState<SamplingSession[]>([]);
  const [activeSessionNum, setActiveSessionNum] = useState<number | null>(null);

  const [data, setData] = useState<SightingFeatureCollection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 1. Cargar ZEPAs asignadas al Tenant del usuario
  const loadZepas = useCallback(async () => {
    if (!user) return;
    try {
      const zepaList = await fetchZepas();
      setZepas(zepaList);
      if (zepaList.length > 0 && !zepaList.some((z) => z.code === selectedZepaCode)) {
        setSelectedZepaCode(zepaList[0].code);
      }
    } catch (e) {
      console.error('Error cargando ZEPAs', e);
    }
  }, [user, selectedZepaCode]);

  // 2. Cargar sesiones de la ZEPA activa
  const loadSessions = useCallback(
    async (zepaCode: string) => {
      if (!user) return;
      try {
        const sessionList = await fetchSessions(zepaCode);
        setSessions(sessionList);
      } catch (e) {
        console.error('Error cargando sesiones', e);
      }
    },
    [user]
  );

  // 3. Cargar avistamientos geolocalizados
  const loadSightings = useCallback(
    async (speciesFilter?: string, zepaCode?: string, sessionNum?: number | null) => {
      if (!user) return;
      setLoading(true);
      try {
        const geojson = await fetchSightingsGeoJSON({
          species: speciesFilter,
          zepaCode: zepaCode || selectedZepaCode,
          sessionNumber: sessionNum ?? undefined,
        });
        setData(geojson);
      } catch (err) {
        console.error('Error al cargar avistamientos:', err);
      } finally {
        setLoading(false);
      }
    },
    [user, selectedZepaCode]
  );

  // Disparar carga de ZEPAs cuando el usuario inicia sesión
  useEffect(() => {
    if (user) {
      loadZepas();
    }
  }, [user, loadZepas]);

  // Disparar carga de sesiones al cambiar ZEPA
  useEffect(() => {
    if (user && selectedZepaCode) {
      loadSessions(selectedZepaCode);
      setActiveSessionNum(null);
    }
  }, [user, selectedZepaCode, loadSessions]);

  // Disparar carga de avistamientos con debounce
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      loadSightings(searchTerm, selectedZepaCode, activeSessionNum);
    }, 300);
    return () => clearTimeout(timer);
  }, [user, searchTerm, selectedZepaCode, activeSessionNum, loadSightings]);

  // Manejo de inicio de sesión exitoso
  const handleLoginSuccess = (loggedInUser: User, token: string) => {
    localStorage.setItem('censozepa_user', JSON.stringify(loggedInUser));
    localStorage.setItem('censozepa_token', token);
    setUser(loggedInUser);
  };

  // Manejo de cierre de sesión
  const handleLogout = () => {
    localStorage.removeItem('censozepa_user');
    localStorage.removeItem('censozepa_token');
    setUser(null);
    setZepas([]);
    setSessions([]);
    setData(null);
  };

  // =========================================================================
  // GATEKEEPER DE SEGURIDAD:
  // Si no hay usuario autenticado, SE MUESTRA ÚNICAMENTE LA PANTALLA DE LOGIN
  // La aplicación NO está abierta al público y NO muestra mapas sin login
  // =========================================================================
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const selectedZepa = zepas.find((z) => z.code === selectedZepaCode) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Navbar
        zepas={zepas}
        selectedZepaCode={selectedZepaCode}
        onSelectZepa={(code) => {
          setSelectedZepaCode(code);
          setActiveSessionNum(null);
        }}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={() => {
          loadZepas();
          loadSessions(selectedZepaCode);
          loadSightings(searchTerm, selectedZepaCode, activeSessionNum);
        }}
        totalSightings={data?.features.length ?? 0}
        user={user}
        onLogout={handleLogout}
      />

      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        {/* Panel Cartográfico Principal (Izquierda) */}
        <main style={{ flex: 1, position: 'relative', height: '100%' }}>
          <SightingsMap
            data={data}
            selectedZepa={selectedZepa}
            loading={loading}
            onSelectSession={(num) => setActiveSessionNum(num)}
          />
        </main>

        {/* Panel Inspector de Sesiones y Taxonomía (Derecha) */}
        <SessionInspector
          selectedZepa={selectedZepa}
          sessions={sessions}
          activeSessionNum={activeSessionNum}
          onSelectSession={(num) => setActiveSessionNum(num)}
          sightingsData={data}
        />
      </div>
    </div>
  );
};

export default App;
