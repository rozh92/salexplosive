import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import nlTranslations from '../translations/nl.json';
import enTranslations from '../translations/en.json';
import deTranslations from '../translations/de.json';

// VERSIEBEHEER: Verhoog dit getal als je teksten aanpast.
// Dit dwingt de browser om de nieuwe JSON bestanden te laden in plaats van de oude cache.
const CACHE_KEY = 'cached_translations_v6';

const translationMap: Record<string, Record<string, string>> = {
  nl: nlTranslations,
  en: enTranslations,
  de: deTranslations
};

interface TranslationContextType {
  t: (key: string, params?: Record<string, string | number>) => string;
  language: 'nl' | 'en' | 'de';
  setLanguage: (lang: 'nl' | 'en' | 'de') => void;
  translations: Record<string, string>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // We gebruiken de CACHE_KEY nu ook in de naam van de localStorage variabele
  const [language, setLanguage] = useLocalStorage<'nl' | 'en' | 'de'>(`app_language_${CACHE_KEY}`, 'nl');
  
  // Start direct met de juiste vertalingen uit de import
  const [translations, setTranslations] = useState<Record<string, string>>(translationMap[language] || nlTranslations);

  useEffect(() => {
    // Als de taal verandert, laad direct de juiste JSON file uit de imports
    const newTranslations = translationMap[language];
    if (newTranslations) {
      setTranslations(newTranslations);
    } else {
      setTranslations(nlTranslations);
    }
  }, [language]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[key] || nlTranslations[key as keyof typeof nlTranslations] || key;
    
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(`%{${paramKey}}`, String(paramValue));
      });
    }
    return text;
  }, [translations]);

  return (
    <TranslationContext.Provider value={{ t, language, setLanguage, translations }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};