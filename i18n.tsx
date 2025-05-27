import React, { createContext, useContext, useState } from 'react';
import en from './locales/en.json';
import de from './locales/de.json';

export type SupportedLanguage = 'en' | 'de';

// Allow other modules to access the currently selected language
let currentLanguage: SupportedLanguage = 'de';
export const getCurrentLanguage = () => currentLanguage;

type TranslationDictionaries = Record<string, string>;

const dictionaries: Record<SupportedLanguage, TranslationDictionaries> = {
  en,
  de,
};

interface I18nContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  language: 'de',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLang] = useState<SupportedLanguage>(currentLanguage);

  const updateLanguage = (lang: SupportedLanguage) => {
    currentLanguage = lang;
    setLang(lang);
  };

  const translate = (key: string): string => {
    const dict = dictionaries[language] || {};
    return dict[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: updateLanguage, t: translate }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
