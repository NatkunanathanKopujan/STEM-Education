import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

const THEME_KEY = 'ai_smart_lms_theme';
const validPreferences = new Set(['light', 'dark', 'system']);

export const ThemeContext = createContext(null);

function getStoredThemePreference() {
  const stored = localStorage.getItem(THEME_KEY);
  return validPreferences.has(stored) ? stored : 'light';
}

function getSystemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolvedTheme, preference) {
  const root = document.documentElement;
  const isDark = resolvedTheme === 'dark';

  root.classList.toggle('dark', isDark);
  root.classList.toggle('theme-dark', isDark);
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children }) {
  const [themePreference, setThemePreferenceState] = useState(getStoredThemePreference);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  const resolvedTheme = themePreference === 'system' ? systemTheme : themePreference;

  useEffect(() => {
    applyTheme(resolvedTheme, themePreference);
    localStorage.setItem(THEME_KEY, themePreference);
  }, [resolvedTheme, themePreference]);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return undefined;

    const handleChange = (event) => setSystemTheme(event.matches ? 'dark' : 'light');
    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  const setThemePreference = useCallback((preference) => {
    setThemePreferenceState(validPreferences.has(preference) ? preference : 'light');
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreferenceState((current) => {
      const currentResolved = current === 'system' ? getSystemTheme() : current;
      return currentResolved === 'dark' ? 'light' : 'dark';
    });
  }, []);

  const value = useMemo(
    () => ({
      themePreference,
      resolvedTheme,
      isDark: resolvedTheme === 'dark',
      setThemePreference,
      toggleTheme,
    }),
    [resolvedTheme, setThemePreference, themePreference, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
