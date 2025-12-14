
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../services/mockApi';
import { SiteSettings } from '../types';

interface SettingsContextType {
  settings: SiteSettings | null;
  updateSettings: (newSettings: SiteSettings) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children?: ReactNode }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await api.settings.get();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: SiteSettings) => {
    // Optimistic update
    setSettings(newSettings);
    await api.settings.update(newSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
