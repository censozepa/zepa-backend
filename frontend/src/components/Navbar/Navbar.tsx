import React from 'react';
import { Bird, Search, RotateCw, LogOut, MapPin, Building2 } from 'lucide-react';
import { User, ZepaZone } from '../../types/sightings';

interface NavbarProps {
  zepas: ZepaZone[];
  selectedZepaCode: string;
  onSelectZepa: (code: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  totalSightings: number;
  user: User;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  zepas,
  selectedZepaCode,
  onSelectZepa,
  searchTerm,
  onSearchChange,
  onRefresh,
  totalSightings,
  user,
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
        padding: '0 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1100,
        position: 'relative',
      }}
    >
      {/* 1. Logo y Selector de ZEPA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <Bird size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              CensoZEPA
            </h1>
            <span style={{ fontSize: '10px', color: '#6ee7b7' }}>
              Ciencia Ciudadana
            </span>
          </div>
        </div>

        {/* Dropdown Selector de ZEPA */}
        {zepas.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#043828',
              borderRadius: '8px',
              padding: '4px 10px',
              border: '1px solid #065f46',
              gap: '6px',
            }}
          >
            <MapPin size={15} color="#34d399" />
            <select
              value={selectedZepaCode}
              onChange={(e) => onSelectZepa(e.target.value)}
              style={{
                background: 'transparent',
                color: 'white',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {zepas.map((z) => (
                <option key={z.code} value={z.code} style={{ background: '#064e3b', color: 'white' }}>
                  {z.code} - {z.name} ({z.totalSightings} avist.)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Barra de búsqueda y refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '420px', margin: '0 24px' }}>
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
          <Search size={16} color="#9ca3af" style={{ marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Buscar especie o código (ej. A129, Avutarda...)"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontSize: '13px',
              width: '100%',
            }}
          />
        </div>

        <button
          onClick={onRefresh}
          title="Actualizar datos"
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
          <RotateCw size={16} />
        </button>
      </div>

      {/* 3. Tenant, Usuario y Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            background: '#043828',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#a7f3d0',
            border: '1px solid #065f46',
          }}
        >
          {totalSightings} {totalSightings === 1 ? 'registro' : 'registros'}
        </div>

        {/* Badge del Tenant / Organización */}
        {user.tenantName && (
          <div
            style={{
              background: '#022c22',
              border: '1px solid #10b981',
              color: '#a7f3d0',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Building2 size={13} color="#34d399" />
            <span>{user.tenantName}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#e5e7eb' }}>
            👤 {user.full_name}
          </span>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            style={{
              background: '#dc2626',
              border: 'none',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <LogOut size={14} /> Salir
          </button>
        </div>
      </div>
    </header>
  );
};

