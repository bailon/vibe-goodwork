import React from 'react';
import { useTranslation } from '../i18n';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useTranslation();
  return (
    <div className="fixed top-2 right-2 flex gap-2 text-xl print:hidden">
      <button
        onClick={() => setLanguage('de')}
        aria-label="Deutsch"
        className={`hover:opacity-100 ${language === 'de' ? 'opacity-100' : 'opacity-50'}`}
      >
        <span role="img" aria-label="Deutsch">🇩🇪</span>
      </button>
      <button
        onClick={() => setLanguage('en')}
        aria-label="English"
        className={`hover:opacity-100 ${language === 'en' ? 'opacity-100' : 'opacity-50'}`}
      >
        <span role="img" aria-label="English">🇬🇧</span>
      </button>
    </div>
  );
};

export default LanguageSwitcher;
