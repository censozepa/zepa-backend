import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Trash2,
  AlertTriangle,
  Search,
  Calendar,
  Mail,
  Shield,
  ShieldAlert,
  Smartphone,
  Laptop,
  RefreshCw,
  Bird,
  Compass,
  Clock,
  CheckCircle2,
  X,
  Lock,
  Ban,
  UserCheck,
} from 'lucide-react';
import { User, ManagedUser } from '../../types/sightings';
import { fetchAdminUsers, deleteUserTotally, toggleUserStatus } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface UsersManagementViewProps {
  user: User;
  onRefreshGlobalData?: () => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  user,
  onRefreshGlobalData,
}) => {
  const { colors } = useTheme();

  // Estados de datos
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtro y búsqueda
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Estados de eliminación (Derecho al Olvido / RGPD) y suspensión temporal
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [confirmText, setConfirmText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Cargar usuarios desde la API administrativa
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el directorio de usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filtrado reactivo de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.tenantName && u.tenantName.toLowerCase().includes(term));

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;

      let matchProvider = true;
      if (providerFilter === 'android_google') {
        matchProvider = u.authProvider === 'android_google';
      } else if (providerFilter === 'google') {
        matchProvider = u.authProvider === 'google';
      } else if (providerFilter === 'local') {
        matchProvider = u.authProvider === 'local';
      }

      let matchStatus = true;
      if (statusFilter === 'active') {
        matchStatus = u.isActive === true;
      } else if (statusFilter === 'suspended') {
        matchStatus = u.isActive === false;
      }

      return matchSearch && matchRole && matchProvider && matchStatus;
    });
  }, [users, searchTerm, roleFilter, providerFilter, statusFilter]);

  // Métricas agregadas
  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const adminsCount = users.filter((u) => u.role === 'admin').length;
    const volunteersCount = users.filter((u) => u.role === 'volunteer').length;
    const suspendedCount = users.filter((u) => !u.isActive).length;
    const androidUsersCount = users.filter((u) => u.authProvider === 'android_google').length;
    const totalSessions = users.reduce((acc, u) => acc + (u.sessionsCount || 0), 0);
    const totalSightings = users.reduce((acc, u) => acc + (u.sightingsCount || 0), 0);
    const totalBirds = users.reduce((acc, u) => acc + (u.totalBirds || 0), 0);
    const totalKm = users.reduce((acc, u) => acc + (u.distanceKm || 0), 0);

    return {
      totalUsers,
      adminsCount,
      volunteersCount,
      suspendedCount,
      androidUsersCount,
      totalSessions,
      totalSightings,
      totalBirds,
      totalKm: parseFloat(totalKm.toFixed(1)),
    };
  }, [users]);

  // Suspender (desactivar) o reactivar el login de un usuario
  const handleToggleStatus = async (targetUser: ManagedUser) => {
    try {
      setTogglingUserId(targetUser.id);
      setActionError(null);
      setError(null);
      const nextStatus = !targetUser.isActive;
      const res = await toggleUserStatus(targetUser.id, nextStatus);
      setActionSuccess(res.message);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el estado del usuario.');
    } finally {
      setTogglingUserId(null);
    }
  };

  // Ejecutar eliminación según Derecho al Olvido
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    if (confirmText.trim().toUpperCase() !== 'ELIMINAR') {
      setActionError('Debes escribir la palabra ELIMINAR para autorizar la acción.');
      return;
    }

    try {
      setIsDeleting(true);
      setActionError(null);
      const res = await deleteUserTotally(userToDelete.id);
      
      setActionSuccess(
        `Usuario ${userToDelete.fullName} (${userToDelete.email}) purgado con éxito. ` +
        `Se eliminaron ${res.deleted.deletedSightings} avistamientos y ${res.deleted.deletedSessions} sesiones asociadas.`
      );
      
      setUserToDelete(null);
      setConfirmText('');
      await loadUsers();
      onRefreshGlobalData?.();
    } catch (err: any) {
      setActionError(err.message || 'Error al ejecutar la eliminación del usuario.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrador Global',
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          border: 'rgba(239, 68, 68, 0.3)',
        };
      case 'researcher':
        return {
          label: 'Investigador',
          bg: 'rgba(168, 85, 247, 0.15)',
          color: '#a855f7',
          border: 'rgba(168, 85, 247, 0.3)',
        };
      default:
        return {
          label: 'Voluntario / Ornitólogo',
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          border: 'rgba(16, 185, 129, 0.3)',
        };
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'android_google':
        return {
          label: 'Android App (Google)',
          icon: Smartphone,
          bg: 'rgba(59, 130, 246, 0.12)',
          color: '#3b82f6',
        };
      case 'google':
        return {
          label: 'Google OAuth',
          icon: Laptop,
          bg: 'rgba(245, 158, 11, 0.12)',
          color: '#f59e0b',
        };
      default:
        return {
          label: 'Email & Password',
          icon: Mail,
          bg: 'rgba(100, 116, 139, 0.12)',
          color: '#64748b',
        };
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: colors.mainBg,
        overflowY: 'auto',
      }}
    >
      {/* 1. Cabecera Principal */}
      <div
        style={{
          padding: '24px 32px 18px 32px',
          borderBottom: `1px solid ${colors.cardBorder}`,
          backgroundColor: colors.cardBg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(2, 132, 199, 0.15)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: colors.textPrimary }}>
                Directorio y Gestión de Usuarios
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Shield size={12} />
                Solo Administrador
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: colors.textSecondary }}>
              Control global de observadores, analíticas de censo y gestión legal de datos personales (Derecho al Olvido / RGPD).
            </p>
          </div>
        </div>

        {/* Botón Refrescar */}
        <button
          onClick={loadUsers}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: '10px',
            backgroundColor: colors.mainBg,
            color: colors.textPrimary,
            border: `1px solid ${colors.cardBorder}`,
            fontSize: '13px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Recargar listado"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Banner de mensajes de éxito o error */}
      {actionSuccess && (
        <div
          style={{
            margin: '18px 32px 0 32px',
            padding: '12px 18px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10b981',
            borderRadius: '10px',
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13.5px',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            margin: '18px 32px 0 32px',
            padding: '12px 18px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13.5px',
          }}
        >
          <AlertTriangle size={18} color="#ef4444" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Tarjetas de Métricas de la Plataforma */}
      <div
        style={{
          padding: '24px 32px 12px 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Card 1: Total Usuarios */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '14px',
            padding: '18px 20px',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>
              Total Usuarios
            </span>
            <Users size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, margin: '8px 0 4px 0' }}>
            {metrics.totalUsers}
          </div>
          <div style={{ fontSize: '11.5px', color: colors.textSecondary, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span><strong>{metrics.adminsCount}</strong> admin</span>
            <span>•</span>
            <span><strong>{metrics.volunteersCount}</strong> voluntarios</span>
            {metrics.suspendedCount > 0 && (
              <>
                <span>•</span>
                <span style={{ color: '#f97316', fontWeight: 700 }}>
                  {metrics.suspendedCount} suspendidos
                </span>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Conexión Móvil Android */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '14px',
            padding: '18px 20px',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>
              App Móvil Android
            </span>
            <Smartphone size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, margin: '8px 0 4px 0' }}>
            {metrics.androidUsersCount}
          </div>
          <div style={{ fontSize: '11.5px', color: colors.textSecondary }}>
            Sincronizados desde dispositivos de campo
          </div>
        </div>

        {/* Card 3: Sesiones y Muestreos */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '14px',
            padding: '18px 20px',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>
              Muestreos Totales
            </span>
            <Compass size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, margin: '8px 0 4px 0' }}>
            {metrics.totalSessions}
          </div>
          <div style={{ fontSize: '11.5px', color: colors.textSecondary }}>
            {metrics.totalKm} km de transectos acumulados
          </div>
        </div>

        {/* Card 4: Avistamientos y Aves */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '14px',
            padding: '18px 20px',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>
              Aves Registradas
            </span>
            <Bird size={18} color="#eab308" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, margin: '8px 0 4px 0' }}>
            {metrics.totalBirds.toLocaleString()}
          </div>
          <div style={{ fontSize: '11.5px', color: colors.textSecondary }}>
            en {metrics.totalSightings} observaciones de campo
          </div>
        </div>
      </div>

      {/* 3. Barra de Búsqueda y Filtros */}
      <div
        style={{
          padding: '12px 32px 18px 32px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
          {/* Buscador de texto */}
          <div
            style={{
              position: 'relative',
              flex: 1,
              minWidth: '240px',
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.textSecondary,
              }}
            />
            <input
              type="text"
              placeholder="Buscar por nombre, correo electrónico o entidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: `1px solid ${colors.cardBorder}`,
                backgroundColor: colors.cardBg,
                color: colors.textPrimary,
                fontSize: '13px',
                outline: 'none',
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.textSecondary,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtro por Rol */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              border: `1px solid ${colors.cardBorder}`,
              backgroundColor: colors.cardBg,
              color: colors.textPrimary,
              fontSize: '13px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">Todos los Roles</option>
            <option value="admin">Administradores</option>
            <option value="volunteer">Voluntarios</option>
            <option value="researcher">Investigadores</option>
          </select>

          {/* Filtro por Proveedor */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              border: `1px solid ${colors.cardBorder}`,
              backgroundColor: colors.cardBg,
              color: colors.textPrimary,
              fontSize: '13px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">Todos los accesos</option>
            <option value="android_google">Android App</option>
            <option value="google">Google OAuth</option>
            <option value="local">Email / Contraseña</option>
          </select>

          {/* Filtro por Estado de Cuenta */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              border: `1px solid ${colors.cardBorder}`,
              backgroundColor: colors.cardBg,
              color: colors.textPrimary,
              fontSize: '13px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">Todos los estados</option>
            <option value="active">Cuentas Activas</option>
            <option value="suspended">Cuentas Suspendidas</option>
          </select>
        </div>

        <div style={{ fontSize: '12.5px', color: colors.textSecondary, fontWeight: 600 }}>
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </div>
      </div>

      {/* 4. Tabla de Usuarios */}
      <div style={{ padding: '0 32px 32px 32px', flex: 1 }}>
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '14px',
            border: `1px solid ${colors.cardBorder}`,
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${colors.cardBorder}`,
                    backgroundColor: colors.mainBg,
                    fontSize: '12px',
                    fontWeight: 800,
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  <th style={{ padding: '14px 20px' }}>Usuario</th>
                  <th style={{ padding: '14px 16px' }}>Rol & Entidad</th>
                  <th style={{ padding: '14px 16px' }}>Acceso / Origen</th>
                  <th style={{ padding: '14px 16px' }}>Fecha Registro</th>
                  <th style={{ padding: '14px 16px' }}>Muestreos & Aves</th>
                  <th style={{ padding: '14px 16px' }}>Última Actividad</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Control Acceso & RGPD</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: colors.textSecondary }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                      <div>Cargando directorio de usuarios...</div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: colors.textSecondary }}>
                      <Users size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>No se encontraron usuarios</div>
                      <div style={{ fontSize: '12px' }}>Prueba ajustando los filtros de búsqueda.</div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const roleBadge = getRoleBadge(u.role);
                    const providerBadge = getProviderBadge(u.authProvider);
                    const ProviderIcon = providerBadge.icon;
                    const isSelf = u.id === user.id;

                    const dateFormatted = new Date(u.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });

                    const lastActiveFormatted = u.lastActiveAt
                      ? new Date(u.lastActiveAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Sin actividad';

                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: `1px solid ${colors.cardBorder}`,
                          transition: 'background-color 0.15s ease',
                          fontSize: '13px',
                          backgroundColor: !u.isActive ? 'rgba(249, 115, 22, 0.04)' : 'transparent',
                          opacity: !u.isActive ? 0.85 : 1,
                        }}
                      >
                        {/* Columna 1: Usuario con Avatar y Email */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: !u.isActive
                                  ? '#94a3b8'
                                  : isSelf
                                  ? '#0284c7'
                                  : colors.accent,
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                flexShrink: 0,
                              }}
                            >
                              {u.fullName ? u.fullName.charAt(0) : u.email.charAt(0)}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <strong
                                  style={{
                                    color: colors.textPrimary,
                                    fontSize: '13.5px',
                                    textDecoration: !u.isActive ? 'line-through' : 'none',
                                  }}
                                >
                                  {u.fullName || 'Sin nombre'}
                                </strong>
                                {isSelf && (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      backgroundColor: 'rgba(2, 132, 199, 0.15)',
                                      color: '#0284c7',
                                    }}
                                  >
                                    Tú
                                  </span>
                                )}
                                {!u.isActive ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: 'rgba(249, 115, 22, 0.15)',
                                      color: '#ea580c',
                                      border: '1px solid rgba(249, 115, 22, 0.35)',
                                    }}
                                  >
                                    <Ban size={10} />
                                    Suspendido
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                      color: '#059669',
                                    }}
                                  >
                                    Activo
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: colors.textSecondary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  marginTop: '2px',
                                }}
                              >
                                <Mail size={12} />
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Columna 2: Rol & Entidad */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                width: 'fit-content',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: roleBadge.bg,
                                color: roleBadge.color,
                                border: `1px solid ${roleBadge.border}`,
                              }}
                            >
                              {roleBadge.label}
                            </span>
                            <span style={{ fontSize: '11.5px', color: colors.textSecondary }}>
                              {u.tenantName}
                            </span>
                          </div>
                        </td>

                        {/* Columna 3: Proveedor de Acceso */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: providerBadge.bg,
                              color: providerBadge.color,
                            }}
                          >
                            <ProviderIcon size={13} />
                            {providerBadge.label}
                          </span>
                        </td>

                        {/* Columna 4: Fecha Registro */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.textPrimary }}>
                            <Calendar size={13} color={colors.textSecondary} />
                            <span>{dateFormatted}</span>
                          </div>
                        </td>

                        {/* Columna 5: Muestreos & Aves */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ fontWeight: 700, color: colors.textPrimary }}>
                              {u.sessionsCount} muestreos ({u.distanceKm} km)
                            </div>
                            <div style={{ fontSize: '11.5px', color: colors.textSecondary }}>
                              {u.sightingsCount} avistamientos ({u.totalBirds} aves)
                            </div>
                          </div>
                        </td>

                        {/* Columna 6: Última Actividad */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.textSecondary, fontSize: '12px' }}>
                            <Clock size={13} />
                            <span>{lastActiveFormatted}</span>
                          </div>
                        </td>

                        {/* Columna 7: Acciones (Desactivar / Activar Cuenta y Derecho al Olvido) */}
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          {isSelf ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                color: colors.textSecondary,
                                backgroundColor: colors.mainBg,
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: `1px solid ${colors.cardBorder}`,
                              }}
                              title="No puedes desactivar ni eliminar tu propia cuenta de administrador"
                            >
                              <Lock size={12} />
                              Protegido
                            </span>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {/* Botón Desactivar / Activar Cuenta */}
                              <button
                                onClick={() => handleToggleStatus(u)}
                                disabled={togglingUserId === u.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  backgroundColor: u.isActive
                                    ? 'rgba(249, 115, 22, 0.1)'
                                    : 'rgba(16, 185, 129, 0.12)',
                                  color: u.isActive ? '#ea580c' : '#059669',
                                  border: u.isActive
                                    ? '1px solid rgba(249, 115, 22, 0.3)'
                                    : '1px solid rgba(16, 185, 129, 0.3)',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: togglingUserId === u.id ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                title={
                                  u.isActive
                                    ? 'Suspender / desactivar temporalmente el acceso (login) de este usuario'
                                    : 'Reactivar el acceso (login) de este usuario'
                                }
                              >
                                {togglingUserId === u.id ? (
                                  <RefreshCw size={13} className="animate-spin" />
                                ) : u.isActive ? (
                                  <Ban size={13} />
                                ) : (
                                  <UserCheck size={13} />
                                )}
                                {u.isActive ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                              </button>

                              {/* Botón Derecho al Olvido */}
                              <button
                                onClick={() => {
                                  setUserToDelete(u);
                                  setConfirmText('');
                                  setActionError(null);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  color: '#ef4444',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Eliminar usuario y todos sus registros (Derecho al Olvido RGPD)"
                              >
                                <Trash2 size={14} />
                                Derecho al Olvido
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Modal de Confirmación: Derecho al Olvido (RGPD / LOPD-GDD) */}
      {userToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => {
            if (!isDeleting) setUserToDelete(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: '16px',
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              maxWidth: '540px',
              width: '100%',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {/* Cabecera del Modal */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={26} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: colors.textPrimary }}>
                  Ejercicio del Derecho al Olvido
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444', fontWeight: 700 }}>
                  Art. 17 RGPD (Reglamento General de Protección de Datos) / Ley Orgánica 3/2018 (LOPDGDD)
                </p>
              </div>
              <button
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  color: colors.textSecondary,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Advertencia destructiva */}
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '14px',
                fontSize: '13px',
                color: colors.textPrimary,
                lineHeight: '1.5',
              }}
            >
              <p style={{ margin: '0 0 8px 0', fontWeight: 700, color: '#ef4444' }}>
                ⚠️ Esta operación es permanente, definitiva e irreversible:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: colors.textSecondary }}>
                <li>
                  Se eliminará la cuenta de <strong>{userToDelete.fullName}</strong> ({userToDelete.email}).
                </li>
                <li>
                  Se purgarán <strong>{userToDelete.sessionsCount} sesiones de muestreo</strong> registradas.
                </li>
                <li>
                  Se borrarán <strong>{userToDelete.sightingsCount} avistamientos</strong> ({userToDelete.totalBirds} aves).
                </li>
                <li>
                  Toda geolocalización o rastro de este usuario desaparecerá del sistema central PostGIS.
                </li>
              </ul>
            </div>

            {actionError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
              >
                {actionError}
              </div>
            )}

            {/* Input de confirmación */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: colors.textPrimary,
                  marginBottom: '6px',
                }}
              >
                Para confirmar la eliminación legal, escribe <strong style={{ color: '#ef4444' }}>ELIMINAR</strong> a continuación:
              </label>
              <input
                type="text"
                placeholder="Escribe ELIMINAR"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isDeleting}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${confirmText.trim().toUpperCase() === 'ELIMINAR' ? '#ef4444' : colors.cardBorder}`,
                  backgroundColor: colors.mainBg,
                  color: colors.textPrimary,
                  fontSize: '13px',
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  backgroundColor: colors.mainBg,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.cardBorder}`,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting || confirmText.trim().toUpperCase() !== 'ELIMINAR'}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  backgroundColor: confirmText.trim().toUpperCase() === 'ELIMINAR' ? '#ef4444' : 'rgba(239, 68, 68, 0.4)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isDeleting || confirmText.trim().toUpperCase() !== 'ELIMINAR' ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    Purgando registros...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Confirmar Eliminación Definitiva
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
