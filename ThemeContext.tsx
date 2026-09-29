import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'day' | 'night';

interface ThemeContextType {
  theme: AppTheme;
  isDayMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'day', // Default to clean, crystal-clear day mode
  isDayMode: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('sse_app_theme');
    // Default to clean, simple Day mode for maximum clarity and readability
    return saved === 'night' ? 'night' : 'day';
  });

  useEffect(() => {
    localStorage.setItem('sse_app_theme', theme);
    if (theme === 'day') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'day' ? 'night' : 'day'));
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDayMode: theme === 'day',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
