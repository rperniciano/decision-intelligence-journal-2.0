import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeVariant = 'dark' | 'oled';

interface ThemeContextType {
  theme: ThemeVariant;
  setTheme: (theme: ThemeVariant) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'decision-journal-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeVariant>('dark');
  const [, setIsInitialized] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeVariant | null;
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'oled')) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    }
    setIsInitialized(true);
  }, []);

  const setTheme = (newTheme: ThemeVariant) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

function applyTheme(theme: ThemeVariant) {
  const root = document.documentElement;

  if (theme === 'oled') {
    // OLED Black theme - pure black background
    root.style.setProperty('--bg-deep', '#000000');
    root.style.setProperty('--bg-gradient', '#0a0a0a');
  } else {
    // Default dark theme
    root.style.setProperty('--bg-deep', '#0a0a0f');
    root.style.setProperty('--bg-gradient', '#1a1a2e');
  }
}
