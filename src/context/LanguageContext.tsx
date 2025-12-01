import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language } from '../locales/translations';
import { translations } from '../locales/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get from localStorage or default to 'en'
    const saved = localStorage.getItem('prodegi_language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('prodegi_language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: Record<string, any> | string | undefined = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, any>)[k];
      } else {
        // Fallback to English if translation key not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = (value as Record<string, any>)[fallbackKey];
          } else {
            return key; // Return the key itself if translation not found
          }
        }
        return typeof value === 'string' ? value : key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
