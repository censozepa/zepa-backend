import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar/Navbar';
import { SightingsMap } from './components/Map/SightingsMap';
import { LoginModal } from './components/Auth/LoginModal';
import { fetchSightingsGeoJSON } from './services/api';
import { SightingFeatureCollection, User } from './types/sightings';

export const App: React.FC = () => {
  const [data, setData] = useState<SightingFeatureCollection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);

  // Cargar usuario guardado al iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('censozepa_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error al restaurar sesión guardada', e);
      }
    }
  }, []);

  const loadSightings = useCallback(async (speciesFilter?: string) => {
    setLoading(true);
    try {
      const geojson = await fetchSightingsGeoJSON(speciesFilter);
      setData(geojson);
    } catch (err) {
      console.error('Error al cargar avistamientos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadSightings();
  }, [loadSightings]);

  // Debounce para la búsqueda por especie
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSightings(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, loadSightings]);

  const handleLoginSuccess = (loggedInUser: User, token: string) => {
    setUser(loggedInUser);
    localStorage.setItem('censozepa_user', JSON.stringify(loggedInUser));
    localStorage.setItem('censozepa_token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('censozepa_user');
    localStorage.removeItem('censozepa_token');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={() => loadSightings(searchTerm)}
        totalSightings={data?.features.length ?? 0}
        user={user}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, position: 'relative' }}>
        <SightingsMap data={data} loading={loading} />
      </main>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default App;
