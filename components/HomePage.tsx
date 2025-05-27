
import React from 'react';
import { useTranslation } from '../i18n';
import { ProfileData, UserDataCollection, AppCurrentPage, CareerPhase } from '../types';
import ProfileView from './ProfileView';
import NavCard, { NavItem } from './NavCard';

// Icons for the main navigation card
const ToolsIcon = () => <span className="text-5xl" role="img" aria-label="Tools">🧰</span>;
const FeelIcon = () => <span className="text-5xl" role="img" aria-label="Feel Better">😊</span>;
const DecideIcon = () => <span className="text-5xl" role="img" aria-label="Decisions">🎯</span>;
const DevelopIcon = () => <span className="text-5xl" role="img" aria-label="Development">🚀</span>;
const KioskIcon = () => <span className="text-5xl" role="img" aria-label="Kiosk">🏪</span>;
const CoachingIcon = () => <span className="text-5xl" role="img" aria-label="Coaching">💡</span>;
const LogbookIconNav = () => <span className="text-5xl" role="img" aria-label="Logbook">📓</span>;


interface HomePageProps {
  profileData: ProfileData;
  onProfileChange: (field: keyof ProfileData, value: string | UserDataCollection | CareerPhase | any) => void; // any for other complex types
  onNavigate: (page: AppCurrentPage) => void;
  onSaveProfile: () => void;
  showAppNotification: (message?: string, type?: 'success' | 'info' | 'error', duration?: number) => void;
  onGetDrGoodWorkTipps: () => void;
  onResetProfile: () => void;
  renderFormattedText: (text: string | undefined, defaultText?: string) => JSX.Element | null;
}

const HomePage: React.FC<HomePageProps> = ({
  profileData,
  onProfileChange,
  onNavigate,
  onSaveProfile,
  showAppNotification,
  onGetDrGoodWorkTipps,
  onResetProfile,
  renderFormattedText
}) => {
  const { t } = useTranslation();

  // Main navigation items on Home Page
  const mainNavItems: NavItem[] = [
    {
      id: 'tools',
      label: t('home.nav.tools'),
      icon: <ToolsIcon />,
      targetPage: 'toolsOverview' as AppCurrentPage,
      description: t('home.nav.tools.desc'),
      bgColor: 'bg-purple-100 hover:bg-purple-200',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-400',
      available: true,
      action: () => onNavigate('toolsOverview'),
    },
    {
      id: 'coaching',
      label: t('home.nav.coaching'),
      icon: <CoachingIcon />,
      targetPage: null,
      description: t('home.nav.coaching.desc'),
      bgColor: 'bg-indigo-100 hover:bg-indigo-200',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-300',
      available: true,
      action: onGetDrGoodWorkTipps,
    },
    {
      id: 'logbook',
      label: t('home.nav.logbook'),
      icon: <LogbookIconNav />,
      targetPage: 'logbook' as AppCurrentPage,
      description: t('home.nav.logbook.desc'),
      bgColor: 'bg-amber-100 hover:bg-amber-200',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-300',
      available: true,
      action: () => onNavigate('logbook'),
    },
    {
      id: 'decisions',
      label: t('home.nav.decisions'),
      icon: <DecideIcon />,
      targetPage: 'decisionMakingOverview' as AppCurrentPage,
      description: t('home.nav.decisions.desc'),
      bgColor: 'bg-green-100 hover:bg-green-200',
      textColor: 'text-green-700',
      borderColor: 'border-green-300',
      available: true,
      action: () => onNavigate('decisionMakingOverview'),
    },
    {
      id: 'feelBetter',
      label: t('home.nav.feelBetter'),
      icon: <FeelIcon />,
      targetPage: 'feelBetterPage' as AppCurrentPage, // Cast for now
      description: t('home.nav.feelBetter.desc'),
      bgColor: 'bg-yellow-100 hover:bg-yellow-200',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-300',
      available: false,
      action: () => showAppNotification(`Das Modul "Besser fühlen" ist noch in Entwicklung und bald für Dich verfügbar!`, 'info'),
    },
    {
      id: 'development',
      label: t('home.nav.development'),
      icon: <DevelopIcon />,
      targetPage: 'developmentPage' as AppCurrentPage, // Cast for now
      description: t('home.nav.development.desc'),
      bgColor: 'bg-sky-100 hover:bg-sky-200',
      textColor: 'text-sky-700',
      borderColor: 'border-sky-300',
      available: false,
      action: () => showAppNotification(`Das Modul "Persönliche Entwicklung" ist noch in Entwicklung und bald für Dich verfügbar!`, 'info'),
    },
    // Kiosk kann ans Ende, da es weniger zentral ist als die anderen aktiven Tools
    {
      id: 'kiosk',
      label: t('home.nav.kiosk'),
      icon: <KioskIcon />,
      targetPage: 'kioskPage' as AppCurrentPage, // Cast for now
      description: t('home.nav.kiosk.desc'),
      bgColor: 'bg-teal-100 hover:bg-teal-200',
      textColor: 'text-teal-700',
      borderColor: 'border-teal-300',
      available: false,
      action: () => showAppNotification(`Das Modul "Ressourcen Kiosk" ist noch in Entwicklung und bald für Dich verfügbar!`, 'info'),
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-rose-50 to-purple-100 text-slate-800 p-4 sm:p-8">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-bold mb-3
                       bg-gradient-to-r from-pink-500 via-purple-500 to-sky-500
                       gradient-text">
          {t('home.title')}
        </h1>
        <p className="text-xl text-slate-600">{t('home.subtitle')}</p>
      </header>

      <div className="flex justify-center mb-10">
        <img
            src="/valou_figures.png"
            alt="Die sechs Valou-Figuren, die die Lebensbereiche repräsentieren"
            className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg shadow-xl border-4 border-white"
        />
      </div>

      <details className="mb-12 bg-white bg-opacity-90 backdrop-blur-md shadow-2xl rounded-2xl border border-slate-200 overflow-hidden group">
        <summary className="text-2xl font-semibold text-purple-700 p-6 cursor-pointer list-none flex justify-between items-center hover:bg-purple-50 transition-colors duration-200 group-open:border-b group-open:border-slate-200">
          {t('home.profile.title')}
          <span className="text-purple-500 transform transition-transform duration-300 ease-in-out group-open:rotate-180">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </span>
        </summary>
        <div className="p-6 bg-white">
            <ProfileView
            key="profile-view-main" /* Explicit, stable key */
            profileData={profileData}
            onProfileChange={onProfileChange}
            onSaveProfile={onSaveProfile}
            onResetProfile={onResetProfile}
            renderFormattedText={renderFormattedText}
            showAppNotification={showAppNotification}
            />
        </div>
      </details>
      <style>{`
        details summary::-webkit-details-marker { display:none; }
      `}</style>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-center text-purple-600 mb-8">{t('home.controlCenter')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {mainNavItems.map((item) => (
            <NavCard key={item.id} item={item} comingSoonLabel={t('home.nav.comingSoon')} />
          ))}
        </div>
      </section>

       <p className="text-center text-xs text-slate-500 mt-16">
        {t('home.footer')}
      </p>
    </div>
  );
};

export default HomePage;
