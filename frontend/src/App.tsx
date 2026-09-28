import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar/Sidebar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { MyRecordsView } from './components/MyRecords/MyRecordsView';
import { SettingsView } from './components/Settings/SettingsView';
import { AboutView } from './components/About/AboutView';
import { LoginScreen } from './components/Auth/LoginScreen';
import { fetchZepas, fetchSessions, fetchSightingsGeoJSON } from './services/api';
import { SamplingSession, SightingFeatureCollection, User, ZepaZone } from './types/sightings';
import { useTheme } from './context/ThemeContext';

export const App: React.FC = () => {
  const { colors } = useTheme();

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

  // Pestaña activa en el menú lateral
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Datos globales
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

  // Conteo de registros personales del usuario actual
  const personalSightingsCount = useMemo(() => {
    if (!data || !user) return 0;
    return data.features.filter((f) => {
      const p = f.properties;
      return (
        (p.userId && p.userId === user.id) ||
        (p.observerEmail && p.observerEmail.toLowerCase() === user.email.toLowerCase()) ||
        (p.observer && p.observer.toLowerCase() === user.full_name.toLowerCase())
      );
    }).length;
  }, [data, user]);

  const totalSightingsCount = data?.features.length || 0;

  // Gatekeeper: si no hay usuario, mostrar pantalla de login (sin contraseñas)
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: colors.mainBg,
        color: colors.textPrimary,
      }}
    >
      {/* Menú lateral izquierdo (Sidebar) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onLogout={handleLogout}
        personalSightingsCount={personalSightingsCount}
        totalSightingsCount={totalSightingsCount}
      />

      {/* Área de contenido principal según la pestaña activa */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {activeTab === 'dashboard' && (
          <DashboardView
            user={user}
            zepas={zepas}
            selectedZepaCode={selectedZepaCode}
            onSelectZepa={(code) => {
              setSelectedZepaCode(code);
              setActiveSessionNum(null);
            }}
            sessions={sessions}
            activeSessionNum={activeSessionNum}
            onSelectSession={(num) => setActiveSessionNum(num)}
            sightingsData={data}
            loading={loading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onRefresh={() => {
              loadZepas();
              loadSessions(selectedZepaCode);
              loadSightings(searchTerm, selectedZepaCode, activeSessionNum);
            }}
          />
        )}

        {activeTab === 'my-records' && (
          <MyRecordsView
            user={user}
            zepas={zepas}
            selectedZepaCode={selectedZepaCode}
            onSelectZepa={(code) => {
              setSelectedZepaCode(code);
              setActiveSessionNum(null);
            }}
            sessions={sessions}
            activeSessionNum={activeSessionNum}
            onSelectSession={(num) => setActiveSessionNum(num)}
            sightingsData={data}
            loading={loading}
            onRefresh={() => {
              loadZepas();
              loadSessions(selectedZepaCode);
              loadSightings(searchTerm, selectedZepaCode, activeSessionNum);
            }}
          />
        )}

        {activeTab === 'settings' && <SettingsView user={user} />}

        {activeTab === 'about' && <AboutView />}
      </main>
    </div>
  );
};

export default App;
