import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, X, User as UserIcon } from 'lucide-react';
import { loginUser, loginWithGoogle } from '../../services/api';
import { User } from '../../types/sightings';

interface LoginScreenProps {
  onLoginSuccess: (user: User, token: string) => void;
}

const GOOGLE_ACCOUNTS = [
  {
    name: 'Javier Román (Administrador)',
    email: 'jroman.espinar@gmail.com',
    zepa: '👑 Superadministrador Global (10 ZEPAs)',
    color: '#047857',
  },
  {
    name: 'Laura Ornitóloga',
    email: 'laura.ornito@gmail.com',
    zepa: 'Páramo Leonés (ES0000365)',
    color: '#e11d48',
  },
  {
    name: 'Marcos Aves',
    email: 'marcos.birds@gmail.com',
    zepa: 'Doñana (ES0000024)',
    color: '#2563eb',
  },
  {
    name: 'Elena del Campo',
    email: 'elena.campo@gmail.com',
    zepa: 'Monfragüe (ES0000033)',
    color: '#059669',
  },
  {
    name: 'Carlos Esteparias',
    email: 'carlos.esteparias@gmail.com',
    zepa: 'Laguna de Gallocanta (ES0000015)',
    color: '#d97706',
  },
  {
    name: 'Javier Zepa',
    email: 'javier.zepa@gmail.com',
    zepa: 'Hoces del Río Duratón (ES0000043)',
    color: '#7c3aed',
  },
  {
    name: 'Lucía Natura',
    email: 'lucia.natura@gmail.com',
    zepa: 'Tablas de Daimiel (ES0000018)',
    color: '#0891b2',
  },
  {
    name: 'Pablo Rapaces',
    email: 'pablo.rapaces@gmail.com',
    zepa: 'Delta del Ebro (ES0000020)',
    color: '#4f46e5',
  },
  {
    name: 'Marta Fauna',
    email: 'marta.fauna@gmail.com',
    zepa: 'Cabo de Gata-Níjar (ES0000005)',
    color: '#db2777',
  },
  {
    name: 'Sergio Silvestre',
    email: 'sergio.silvestre@gmail.com',
    zepa: 'Somiedo (ES0000055)',
    color: '#16a34a',
  },
  {
    name: 'Beatriz Vuelo',
    email: 'beatriz.vuelo@gmail.com',
    zepa: 'Sierra de Guadarrama (ES0000039)',
    color: '#9333ea',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal simulador OpenID Connect con Google
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginUser(email, password);
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGoogleAccount = async (selectedEmail: string) => {
    setError(null);
    setLoading(true);
    setShowGoogleModal(false);

    try {
      const data = await loginWithGoogle(selectedEmail);
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Error al autenticar con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 45%, #0f172a 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Círculos decorativos de fondo */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(5,150,105,0.12) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Tarjeta Principal de Login */}
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '38px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          zIndex: 10,
          margin: '20px',
        }}
      >
        {/* Cabecera con Logo Oficial ZEPA */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <img
            src="/zepa-logo.png"
            alt="Logo ZEPA"
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              boxShadow: '0 8px 24px -4px rgba(4, 120, 87, 0.4)',
              marginBottom: '14px',
              objectFit: 'cover',
              display: 'inline-block',
            }}
          />

          <h1 style={{ margin: '0 0 6px 0', fontSize: '25px', fontWeight: 800, color: '#0f172a' }}>
            CensoZEPA
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
            Plataforma multitenant para monitorización y gestión de avifauna en la Red Natura 2000.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '18px',
              border: '1px solid #f87171',
            }}
          >
            {error}
          </div>
        )}

        {/* 1. Botón Login Social con Google (OpenID Connect) */}
        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: '#ffffff',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '11px 16px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            transition: 'background-color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
        >
          {/* Logo oficial Google G SVG */}
          <svg width="19" height="19" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continuar con Google</span>
        </button>

        {/* Separador */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 18px 0', color: '#94a3b8' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          <span style={{ padding: '0 12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            o con contraseña
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        </div>

        {/* 2. Formulario de Login tradicional */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Correo electrónico
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px', backgroundColor: '#f8fafc' }}>
              <Mail size={18} color="#94a3b8" style={{ marginRight: '10px' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@censozepa.org"
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  color: '#0f172a',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Contraseña
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px', backgroundColor: '#f8fafc' }}>
              <Lock size={18} color="#94a3b8" style={{ marginRight: '10px' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  color: '#0f172a',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#047857',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '11px 0',
              fontWeight: 700,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(4, 120, 87, 0.3)',
            }}
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>

      {/* ===================================================================== */}
      {/* 3. Modal de Selección de Cuenta Google (Simulación OpenID Connect) */}
      {/* ===================================================================== */}
      {showGoogleModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowGoogleModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '450px',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: '"Google Sans", Roboto, -apple-system, sans-serif',
            }}
          >
            {/* Cabecera Google */}
            <div style={{ padding: '24px 28px 16px 28px', borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
              <button
                onClick={() => setShowGoogleModal(false)}
                style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  borderRadius: '50%',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#3c4043' }}>Iniciar sesión con Google</span>
              </div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                Elige una cuenta
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                para continuar en <strong style={{ color: '#047857' }}>CensoZEPA</strong> (OpenID Connect)
              </p>
            </div>

            {/* Lista de cuentas Google disponibles */}
            <div style={{ overflowY: 'auto', padding: '8px 12px', flex: 1, maxHeight: '360px' }}>
              {GOOGLE_ACCOUNTS.map((acc) => (
                <div
                  key={acc.email}
                  onClick={() => handleSelectGoogleAccount(acc.email)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: acc.color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {acc.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {acc.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {acc.email}
                    </div>
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: 500, marginTop: '2px' }}>
                      📍 {acc.zepa}
                    </div>
                  </div>
                </div>
              ))}

              {/* Opción para escribir otra cuenta */}
              <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '6px', paddingTop: '6px' }}>
                {!showCustomInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 14px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '12px',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: '#e2e8f0',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <UserIcon size={18} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      Usar otra cuenta de Google...
                    </span>
                  </button>
                ) : (
                  <div style={{ padding: '10px 14px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      Escribe tu correo de Google:
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="email"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="tu.cuenta@gmail.com"
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          fontSize: '13px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customGoogleEmail.trim()) {
                            handleSelectGoogleAccount(customGoogleEmail.trim());
                          }
                        }}
                        style={{
                          backgroundColor: '#047857',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Entrar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pie del modal OpenID Connect */}
            <div style={{ padding: '14px 28px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
              Simulación de flujo estándar OAuth 2.0 / OpenID Connect (OIDC) para desarrollo local
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
