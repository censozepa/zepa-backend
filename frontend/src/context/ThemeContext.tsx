import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'nature';

export interface ThemeColors {
  name: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarHover: string;
  sidebarActive: string;
  mainBg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  accentBg: string;
  tableHeaderBg: string;
  tableRowHover: string;
}

const THEME_PALETTES: Record<ThemeMode, ThemeColors> = {
  light: {
    name: 'Bosque ZEPA (Claro)',
    sidebarBg: '#064e3b', // Esmeralda bosque oscuro
    sidebarText: '#e2e8f0',
    sidebarHover: 'rgba(255, 255, 255, 0.08)',
    sidebarActive: '#047857',
    mainBg: '#f8fafc',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    accent: '#047857',
    accentHover: '#065f46',
    accentBg: '#ecfdf5',
    tableHeaderBg: '#f8fafc',
    tableRowHover: '#f8fafc',
  },
  dark: {
    name: 'Noche de Censo (Oscuro)',
    sidebarBg: '#090d16',
    sidebarText: '#cbd5e1',
    sidebarHover: 'rgba(255, 255, 255, 0.06)',
    sidebarActive: '#10b981',
    mainBg: '#0f172a',
    cardBg: '#1e293b',
    cardBorder: '#334155',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    accent: '#10b981',
    accentHover: '#059669',
    accentBg: 'rgba(16, 185, 129, 0.15)',
    tableHeaderBg: '#0b1120',
    tableRowHover: '#26334d',
  },
  nature: {
    name: 'Humedal Natura (Azul Marisma)',
    sidebarBg: '#0c4a6e', // Azul océano profundo
    sidebarText: '#e0f2fe',
    sidebarHover: 'rgba(255, 255, 255, 0.1)',
    sidebarActive: '#0284c7',
    mainBg: '#f0f9ff',
    cardBg: '#ffffff',
    cardBorder: '#bae6fd',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    accent: '#0284c7',
    accentHover: '#0369a1',
    accentBg: '#e0f2fe',
    tableHeaderBg: '#f0f9ff',
    tableRowHover: '#f0f9ff',
  },
};

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  setTheme: (theme: ThemeMode) => void;
  userAvatar: string | null;
  setUserAvatar: (avatar: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colors: THEME_PALETTES.light,
  setTheme: () => {},
  userAvatar: null,
  setUserAvatar: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('censozepa_theme') as ThemeMode) || 'light';
  });

  const [userAvatar, setUserAvatarState] = useState<string | null>(() => {
    return localStorage.getItem('censozepa_avatar') || null;
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('censozepa_theme', newTheme);
  };

  const setUserAvatar = (avatar: string | null) => {
    setUserAvatarState(avatar);
    if (avatar) {
      localStorage.setItem('censozepa_avatar', avatar);
    } else {
      localStorage.removeItem('censozepa_avatar');
    }
  };

  const colors = THEME_PALETTES[theme] || THEME_PALETTES.light;

  useEffect(() => {
    // Aplicar clase o fondo al body
    document.body.style.backgroundColor = colors.mainBg;
    document.body.style.color = colors.textPrimary;
  }, [colors]);

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme, userAvatar, setUserAvatar }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
