import React from 'react';
import { Bird, Search, RotateCw, User as UserIcon, LogOut } from 'lucide-react';
import { User } from '../../types/sightings';

interface NavbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  totalSightings: number;
  user: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchTerm,
  onSearchChange,
  onRefresh,
  totalSightings,
  user,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header
      style={{
        height: '64px',
        backgroundColor: '#064e3b',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1100,
        position: 'relative',
      }}
    >
      {/* Logo y Nombre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            background: '#10b981',
            borderRadius: '10px',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bird size={24} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            CensoZEPA
          </h1>
          <span style={{ fontSize: '11px', color: '#6ee7b7' }}>
            Plataforma de Ciencia Ciudadana
          </span>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '500px', margin: '0 32px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#043828',
            borderRadius: '8px',
            padding: '6px 12px',
            width: '100%',
            border: '1px solid #065f46',
          }}
        >
          <Search size={18} color="#9ca3af" style={{ marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Buscar por especie (ej. Águila, Buitre, Milano...)"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontSize: '14px',
              width: '100%',
            }}
          />
        </div>

        <button
          onClick={onRefresh}
          title="Actualizar avistamientos"
          style={{
            background: '#043828',
            border: '1px solid #065f46',
            borderRadius: '8px',
            padding: '8px',
            color: '#6ee7b7',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <RotateCw size={18} />
        </button>
      </div>

      {/* Contador y Perfil / Login */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            background: '#043828',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#a7f3d0',
            border: '1px solid #065f46',
          }}
        >
          {totalSightings} {totalSightings === 1 ? 'avistamiento' : 'avistamientos'}
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#e5e7eb' }}>
              👤 {user.full_name} ({user.role})
            </span>
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              style={{
                background: '#dc2626',
                border: 'none',
                color: 'white',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
              }}
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UserIcon size={16} /> Iniciar Sesión
          </button>
        )}
      </div>
    </header>
  );
};
