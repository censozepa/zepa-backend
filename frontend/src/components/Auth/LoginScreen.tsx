import React, { useState } from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { loginUser } from '../../services/api';
import { User } from '../../types/sightings';

interface LoginScreenProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
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
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img
            src="/zepa-logo.png"
            alt="Logo ZEPA"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              boxShadow: '0 8px 24px -4px rgba(4, 120, 87, 0.45)',
              marginBottom: '16px',
              objectFit: 'cover',
              display: 'inline-block',
            }}
          />

          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>
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

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
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

          <div style={{ marginBottom: '24px' }}>
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
              padding: '12px 0',
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
    </div>
  );
};
