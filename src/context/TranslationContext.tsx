import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import useLocalStorage from '../hooks/useLocalStorage';

// Importeer alle vertaalbestanden direct. Dit is snel en betrouwbaar.
import nlTranslations from '../translations/nl.json';
import enTranslations from '../translations/en.json';
import deTranslations from '../translations/de.json';

// Bundel alle vertalingen in één object voor gemakkelijke toegang.
const allTranslations: Record<string, Record<string, string>> = {
    nl: nlTranslations,
    en: enTranslations,
    de: deTranslations
};

interface TranslationContextType {
    language: string;
    t: (key: string, replacements?: Record<string, string | number | undefined>) => string;
    setLanguage: (lang: string) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [storedLang, setStoredLang] = useLocalStorage<string>('preferred_lang', '');

    // Slimme logica voor het bepalen van de starttaal
    const [language, setLanguageState] = useState<string>(() => {
        // 1. Voorkeur van ingelogde gebruiker
        if (user?.lang) return user.lang;
        // 2. Eerder opgeslagen voorkeur van de bezoeker
        if (storedLang && ['nl', 'en', 'de'].includes(storedLang)) return storedLang;
        // 3. Taal van de browser
        const browserLang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en';
        if (['nl', 'en', 'de'].includes(browserLang)) {
            return browserLang;
        }
        // 4. Fallback voor alle andere talen
        return 'en';
    });

    useEffect(() => {
        if (user?.lang && user.lang !== language) {
            setLanguageState(user.lang);
        }
    }, [user, language]);

    const setLanguage = (lang: string) => {
        if (['nl', 'en', 'de'].includes(lang)) {
            setStoredLang(lang);
            setLanguageState(lang);
        }
    };

    const t = useCallback((key: string, replacements?: Record<string, string | number | undefined>): string => {
        // Zoek de vertaling in de huidige taal.
        // Val terug op Nederlands (de basistaal) als de sleutel niet bestaat in de huidige taal.
        // Val terug op de sleutel zelf als deze nergens wordt gevonden.
        let translatedString = allTranslations[language]?.[key] || allTranslations['nl']?.[key] || key;
        
        if (replacements) {
            Object.keys(replacements).forEach(placeholder => {
                const value = replacements[placeholder];
                if (value !== undefined) {
                    const regex = new RegExp(`%{${placeholder}}`, 'g');
                    translatedString = translatedString.replace(regex, String(value));
                }
            });
        }
        
        return translatedString;
    }, [language]);

    return (
        <TranslationContext.Provider value={{ language, t, setLanguage }}>
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
