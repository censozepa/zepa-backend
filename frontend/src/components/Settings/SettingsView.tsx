import React, { useRef, useState } from 'react';
import {
  Palette,
  Camera,
  User as UserIcon,
  Copy,
  Check,
  Smartphone,
  Trash2,
  Upload,
  CheckCircle,
} from 'lucide-react';
import { User } from '../../types/sightings';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

interface SettingsViewProps {
  user: User;
}

const BIRD_AVATARS = [
  { id: 'aguila', label: 'Águila Imperial', emoji: '🦅', url: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&w=150&q=80' },
  { id: 'buho', label: 'Búho Real', emoji: '🦉', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=150&q=80' },
  { id: 'flamenco', label: 'Flamenco', emoji: '🦩', url: 'https://images.unsplash.com/photo-1539418561314-565804e349c0?auto=format&fit=crop&w=150&q=80' },
  { id: 'anade', label: 'Ánade Azulón', emoji: '🦆', url: 'https://images.unsplash.com/photo-1555861496-0666c8981751?auto=format&fit=crop&w=150&q=80' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ user }) => {
  const { theme, setTheme, colors, userAvatar, setUserAvatar } = useTheme();
  const [copiedToken, setCopiedToken] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyToken = () => {
    const token = localStorage.getItem('censozepa_token') || '';
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen seleccionada es demasiado grande. Máximo 2 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setUserAvatar(base64);
        showSuccess('Foto de perfil actualizada correctamente.');
      };
      reader.readAsDataURL(file);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const themesList: { id: ThemeMode; label: string; desc: string; previewColor: string; bgPreview: string }[] = [
    {
      id: 'light',
      label: 'Bosque ZEPA (Claro)',
      desc: 'Colores verde esmeralda y pizarras claros. Óptimo para uso diurno en oficina y campo con sol.',
      previewColor: '#047857',
      bgPreview: '#ffffff',
    },
    {
      id: 'dark',
      label: 'Noche de Censo (Oscuro)',
      desc: 'Fondo oscuro de bajo contraste. Diseñado para censos nocturnos de rapaces sin deslumbrar en el campo.',
      previewColor: '#10b981',
      bgPreview: '#1e293b',
    },
    {
      id: 'nature',
      label: 'Humedal Natura (Azul Marisma)',
      desc: 'Tonos azul marisma y humedal, inspirado en Doñana, Delta del Ebro y Gallocanta.',
      previewColor: '#0284c7',
      bgPreview: '#f0f9ff',
    },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '28px' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        {/* Cabecera */}
        <div style={{ marginBottom: '26px' }}>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 800, color: colors.textPrimary }}>
            Configuración de la Plataforma
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: colors.textSecondary }}>
            Personaliza el tema visual, tu foto de perfil y consulta los datos técnicos de tu cuenta.
          </p>
        </div>

        {successMessage && (
          <div
            style={{
              padding: '12px 18px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '12px',
              color: '#065f46',
              fontSize: '13.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <CheckCircle size={18} color="#10b981" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. SECCIÓN: TEMA DE LA PÁGINA */}
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
            <Palette size={20} color={colors.accent} />
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: colors.textPrimary }}>
              Tema y Apariencia Visual
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
            {themesList.map((t) => {
              const isSelected = theme === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    showSuccess(`Tema cambiado a: ${t.label}`);
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: t.bgPreview,
                    border: `2px solid ${isSelected ? colors.accent : colors.cardBorder}`,
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 0 3px rgba(4, 120, 87, 0.2)' : 'none',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: t.previewColor,
                          display: 'inline-block',
                        }}
                      />
                      <strong style={{ fontSize: '14px', color: t.id === 'dark' ? '#f8fafc' : '#0f172a' }}>
                        {t.label}
                      </strong>
                    </div>
                    {isSelected && <Check size={18} color={colors.accent} />}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: t.id === 'dark' ? '#94a3b8' : '#64748b', lineHeight: 1.4 }}>
                    {t.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. SECCIÓN: FOTO DE PERFIL / AVATAR */}
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
            <Camera size={20} color={colors.accent} />
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: colors.textPrimary }}>
              Foto de Perfil y Avatar
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* Vista previa actual */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  backgroundColor: colors.accent,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: 800,
                  overflow: 'hidden',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  border: `3px solid ${colors.cardBorder}`,
                }}
              >
                {userAvatar ? (
                  <img src={userAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user.full_name.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Acciones de foto */}
            <div style={{ flex: 1, minWidth: '220px' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: colors.accent,
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Upload size={15} />
                  <span>Subir foto de mi equipo</span>
                </button>

                {userAvatar && (
                  <button
                    onClick={() => {
                      setUserAvatar(null);
                      showSuccess('Foto eliminada. Mostrando iniciales por defecto.');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.cardBorder}`,
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={15} />
                    <span>Quitar foto</span>
                  </button>
                )}
              </div>

              {/* Avatares predefinidos */}
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                  O elige un avatar ornitológico:
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {BIRD_AVATARS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setUserAvatar(b.url);
                        showSuccess(`Avatar cambiado a: ${b.label}`);
                      }}
                      title={b.label}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: `1px solid ${colors.cardBorder}`,
                        backgroundColor: colors.mainBg,
                        cursor: 'pointer',
                        fontSize: '18px',
                      }}
                    >
                      {b.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SECCIÓN: DATOS DE LA CUENTA */}
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
            <UserIcon size={20} color={colors.accent} />
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: colors.textPrimary }}>
              Datos de la Cuenta de Usuario
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: colors.mainBg, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ fontSize: '11px', color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                Nombre Completo
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary, marginTop: '3px' }}>
                {user.full_name}
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: colors.mainBg, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ fontSize: '11px', color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                Correo Electrónico
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary, marginTop: '3px' }}>
                {user.email}
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: colors.mainBg, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ fontSize: '11px', color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                Rol en la Plataforma
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: colors.accent, marginTop: '3px' }}>
                {user.role === 'admin' ? '👑 Superadministrador Global' : '📍 Ornitólogo de Campo (Voluntario)'}
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: colors.mainBg, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ fontSize: '11px', color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                Espacio ZEPA / Tenant Asignado
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary, marginTop: '3px' }}>
                {user.role === 'admin' ? '🌐 Todas las 10 ZEPAs de España' : user.tenantName || 'ZEPA Asignada'}
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: colors.mainBg, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ fontSize: '11px', color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                Proveedor de Identidad
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary, marginTop: '3px' }}>
                Google OpenID Connect (OIDC)
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: colors.mainBg, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ fontSize: '11px', color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                ID Único (UUID)
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', color: colors.textSecondary, marginTop: '3px' }}>
                {user.id}
              </div>
            </div>
          </div>

          {/* Token JWT de Sesión */}
          <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '10px', backgroundColor: colors.mainBg, border: `1px solid ${colors.cardBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary }}>
                Token JWT de Autenticación (para sincronización con la App Android)
              </span>
              <button
                onClick={handleCopyToken}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.cardBorder}`,
                  backgroundColor: colors.cardBg,
                  color: colors.textPrimary,
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {copiedToken ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedToken ? 'Copiado' : 'Copiar Token'}</span>
              </button>
            </div>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: colors.textSecondary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {localStorage.getItem('censozepa_token') || 'No disponible'}
            </div>
          </div>
        </div>

        {/* 4. SECCIÓN: CONEXIÓN APP ANDROID */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Smartphone size={20} color={colors.accent} />
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: colors.textPrimary }}>
              Integración con App Móvil Android (Kotlin)
            </h2>
          </div>

          <p style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5, margin: '0 0 14px 0' }}>
            Los registros capturados en el campo con la aplicación móvil se sincronizan automáticamente con este servidor en cuanto el dispositivo recupera cobertura mediante <strong>WorkManager</strong>.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.mainBg, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ fontSize: '11px', color: colors.textSecondary }}>Precisión GPS Mínima</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>&lt; 10 metros</div>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.mainBg, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ fontSize: '11px', color: colors.textSecondary }}>Modo Offline</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>SQLite / Room activo</div>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.mainBg, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ fontSize: '11px', color: colors.textSecondary }}>Idempotencia</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>UUID clientSyncId</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
