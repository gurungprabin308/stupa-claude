
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark'; 
export type AccentColor = 'blue' | 'amber' | 'emerald' | 'rose' | 'violet';

interface ThemeContextType {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  isDark: boolean;
  colorClasses: {
    text: string;
    textHover: string;
    bg: string;
    bgHover: string;
    border: string;
    borderFocus: string;
    ring: string;
    softBg: string;
    shadow: string;
    hoverShadow: string;
    mainBg: string;
    
    inputFocus: string;
    cardHover: string;
    
    contrastBg: string;
    contrastBgHover: string;
    contrastText: string;
    contrastBorder: string;
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Using a new key to force reset previous stuck preferences
const THEME_STORAGE_KEY = 'skystupa_theme_v2';
const ACCENT_STORAGE_KEY = 'skystupa_accent_v2';

const contrastMap: Record<AccentColor, AccentColor> = {
  blue: 'amber',
  amber: 'blue',
  emerald: 'rose',
  rose: 'emerald',
  violet: 'amber'
};

const shadowColors: Record<AccentColor, string> = {
  blue: '59, 130, 246',
  amber: '245, 158, 11',
  emerald: '16, 185, 129',
  rose: '244, 63, 94',
  violet: '139, 92, 246'
};

export const ThemeProvider = ({ children }: { children?: ReactNode }) => {
  // Initialize state based on LocalStorage OR System Preference
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    // 1. Check if user has manually saved a preference
    const storedMode = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
    if (storedMode === 'light' || storedMode === 'dark') {
      return storedMode;
    }
    
    // 2. If not, check System Preference
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // 3. Default to light
    return 'light';
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>('blue');
  const [isDark, setIsDark] = useState(themeMode === 'dark');

  // Load saved accent color
  useEffect(() => {
    const storedAccent = localStorage.getItem(ACCENT_STORAGE_KEY) as AccentColor;
    if (storedAccent) setAccentColorState(storedAccent);
  }, []);

  // Listen for System Theme Changes (Only if user hasn't manually overridden)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if there is NO manual override in local storage
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        const newMode = e.matches ? 'dark' : 'light';
        setThemeModeState(newMode);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply Theme to HTML Tag
  useEffect(() => {
    const root = window.document.documentElement;
    const darkMode = themeMode === 'dark';
    
    setIsDark(darkMode);

    if (darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem(ACCENT_STORAGE_KEY, accentColor);
  }, [accentColor]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    // When user manually clicks toggle, save preference
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  };
  
  const setAccentColor = (color: AccentColor) => setAccentColorState(color);

  const contrastColor = contrastMap[accentColor];
  const neonShadowColor = shadowColors[accentColor];
  const contrastShadowColor = shadowColors[contrastColor];

  const mainBgGradient = isDark
    ? `bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-${accentColor}-900/50 via-slate-950 to-slate-950 text-slate-100 min-h-screen selection:bg-${accentColor}-500/30`
    : `bg-gradient-to-b from-${accentColor}-50 via-white to-white text-slate-900 min-h-screen selection:bg-${accentColor}-100`;

  const colorClasses = {
    text: `text-${accentColor}-600 dark:text-${accentColor}-400`,
    textHover: `hover:text-${accentColor}-700 dark:hover:text-${accentColor}-300`,
    bg: `bg-${accentColor}-600`,
    bgHover: `hover:bg-${accentColor}-700`,
    border: `border-${accentColor}-500`,
    borderFocus: `focus:border-${accentColor}-500`,
    ring: `focus:ring-${accentColor}-500`,
    softBg: `bg-${accentColor}-50 dark:bg-${accentColor}-900/30`,
    shadow: `shadow-${accentColor}-500/30`,
    
    hoverShadow: isDark 
        ? `hover:shadow-[0_0_30px_rgba(${neonShadowColor},0.4)]` 
        : `hover:shadow-xl`,
    
    mainBg: mainBgGradient,

    inputFocus: `focus:border-${accentColor}-500 focus:shadow-[0_0_15px_rgba(${neonShadowColor},0.3)] transition-all duration-300 outline-none`,
    
    cardHover: `hover:border-${accentColor}-500/50 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,${isDark ? '0.8' : '0.1'}),0_0_20px_rgba(${neonShadowColor},${isDark ? '0.4' : '0.2'})] hover:-translate-y-2 hover:scale-[1.01] transition-all duration-300 transform perspective-1000 z-0 hover:z-10 relative`,
    
    contrastBg: `bg-${contrastColor}-500`,
    contrastBgHover: `hover:bg-${contrastColor}-400 hover:shadow-[0_10px_20px_-5px_rgba(${contrastShadowColor},0.5)] hover:-translate-y-1 hover:scale-105 transition-all duration-300 transform`,
    contrastText: `text-${contrastColor}-600 dark:text-${contrastColor}-400`,
    contrastBorder: `border-${contrastColor}-500`,
  };

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, accentColor, setAccentColor, isDark, colorClasses }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
