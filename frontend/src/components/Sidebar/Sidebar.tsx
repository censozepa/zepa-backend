import React, { useState } from 'react';
import {
  LayoutDashboard,
  Bird,
  Settings,
  Info,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { User } from '../../types/sightings';
import { useTheme } from '../../context/ThemeContext';

export type ActiveTab = 'dashboard' | 'my-records' | 'settings' | 'about';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  user: User;
  onLogout: () => void;
  personalSightingsCount: number;
  totalSightingsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  user,
  onLogout,
  personalSightingsCount,
  totalSightingsCount,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { colors, userAvatar } = useTheme();

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: totalSightingsCount,
      tooltip: 'Estadísticas y registros de toda la plataforma',
    },
    {
      id: 'my-records' as ActiveTab,
      label: 'Mis Registros',
      icon: Bird,
      badge: personalSightingsCount,
      tooltip: 'Datos y observaciones introducidos por mí',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Configuraciones',
      icon: Settings,
      tooltip: 'Tema de la página, foto de perfil y cuenta',
    },
    {
      id: 'about' as ActiveTab,
      label: 'Acerca De',
      icon: Info,
      tooltip: 'Información técnica, ZEPAs y arquitectura',
    },
  ];

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '260px',
        backgroundColor: colors.sidebarBg,
        color: colors.sidebarText,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
        zIndex: 100,
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Botón flotante para colapsar/expandir */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          top: '24px',
          right: '-14px',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: colors.cardBg,
          color: colors.textPrimary,
          border: `1px solid ${colors.cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          zIndex: 10,
        }}
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Cabecera / Branding */}
      <div
        style={{
          padding: collapsed ? '20px 12px' : '22px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <img
          src="/zepa-logo.png"
          alt="CensoZEPA"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            flexShrink: 0,
          }}
        />
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
              CensoZEPA
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
              Red Natura 2000
            </div>
          </div>
        )}
      </div>

      {/* Lista de Navegación */}
      <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '12px 0' : '11px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                backgroundColor: isActive ? colors.sidebarActive : 'transparent',
                color: isActive ? '#ffffff' : colors.sidebarText,
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.15s ease',
                position: 'relative',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = colors.sidebarHover;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={20} style={{ flexShrink: 0, color: isActive ? '#ffffff' : '#94a3b8' }} />

              {!collapsed && (
                <>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
                    <span
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '10px',
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sección inferior: Usuario y Salir */}
      <div
        style={{
          padding: collapsed ? '16px 8px' : '16px 14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.12)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: collapsed ? '0' : '12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          {/* Avatar del usuario (personalizado o inicial) */}
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: user.role === 'admin' ? '#047857' : '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '15px',
              flexShrink: 0,
              overflow: 'hidden',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {userAvatar ? (
              <img src={userAvatar} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user.full_name.charAt(0).toUpperCase()
            )}
          </div>

          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.full_name}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.email}
              </div>
              <div style={{ marginTop: '2px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: user.role === 'admin' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                    color: user.role === 'admin' ? '#fde047' : '#7dd3fc',
                  }}
                >
                  {user.role === 'admin' ? '👑 Superadmin' : '📍 Ornitólogo'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Botón Cerrar Sesión */}
        <button
          onClick={onLogout}
          title={collapsed ? 'Cerrar Sesión' : undefined}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '8px',
            padding: collapsed ? '10px 0' : '8px 12px',
            backgroundColor: 'transparent',
            color: '#f87171',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <LogOut size={16} />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};
