
import React from 'react';

// Placeholder Icons
const ValouIcon = () => <span className="text-4xl" role="img" aria-label="Valou">🎨</span>;
const IdentityIcon = () => <span className="text-4xl" role="img" aria-label="Identity">👤</span>;
const LogbookIcon = () => <span className="text-4xl" role="img" aria-label="Logbook">📓</span>;
const MoreIcon = () => <span className="text-4xl" role="img" aria-label="More Tools">🧩</span>;
const HomeIcon = () => <span className="text-xl" role="img" aria-label="Home">🏠</span>;


type AppCurrentPage = 'home' | 'valouStyling' | 'riasecTool' | 'toolsOverview' | 'identityProfileOverview' | 'logbook'; // 'logbook' hinzugefügt

interface ToolsOverviewPageProps {
  onNavigate: (page: AppCurrentPage) => void;
  onNavigateHome: () => void;
  showAppNotification: (message?: string, type?: 'success' | 'info' | 'error', duration?: number) => void;
}

const ToolsOverviewPage: React.FC<ToolsOverviewPageProps> = ({ onNavigate, onNavigateHome, showAppNotification }) => {
  
  const toolNavItems = [
    { 
      id: 'valou', 
      label: 'Valou Ziel-Styling', 
      icon: <ValouIcon />, 
      targetPage: 'valouStyling', 
      description: "Definiere Deine Idealvorstellungen in sechs Lebensbereichen für Dein GoodWork Setup.",
      bgColor: 'bg-rose-100 hover:bg-rose-200', 
      textColor: 'text-rose-700', 
      borderColor: 'border-rose-300',
      available: true,
    },
    { 
      id: 'identity', 
      label: 'Berufliches Identitätsprofil', 
      icon: <IdentityIcon />, 
      targetPage: 'identityProfileOverview', 
      description: "Screenings zu Persönlichkeit, Interessen, Motiven und Future Skills.",
      bgColor: 'bg-sky-100 hover:bg-sky-200', 
      textColor: 'text-sky-700', 
      borderColor: 'border-sky-300',
      available: true,
    },
    { 
      id: 'logbook', 
      label: 'GoodWork Logbuch', 
      icon: <LogbookIcon />, 
      targetPage: 'logbook', 
      description: "Dein persönliches Logbuch für Erkenntnisse, Wohlbefinden und Fortschritte.", // Beschreibung aktualisiert
      bgColor: 'bg-amber-100 hover:bg-amber-200', 
      textColor: 'text-amber-700', 
      borderColor: 'border-amber-300',
      available: true, // Verfügbar gemacht
    },
    { 
      id: 'more', 
      label: 'Weitere Tools', 
      icon: <MoreIcon />, 
      targetPage: 'moreTools', 
      description: "Zukünftige Erweiterungen für Deine GoodWork Journey (Demnächst).",
      bgColor: 'bg-lime-100 hover:bg-lime-200', 
      textColor: 'text-lime-700', 
      borderColor: 'border-lime-300',
      available: false,
    },
  ];

  const handleNavigation = (targetPage: string, label: string, available: boolean) => {
    if (available) {
      onNavigate(targetPage as AppCurrentPage);
    } else {
      showAppNotification(`Das Modul "${label}" ist noch in Entwicklung. Bald mehr dazu!`, 'info');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-sky-50 to-green-50 p-4 sm:p-8">
      <button
        onClick={onNavigateHome}
        className="mb-8 px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow hover:shadow-md text-sm flex items-center gap-2"
      >
        <HomeIcon /> Zurück zur Crafting Zentrale
      </button>

      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold mb-3 
                       bg-gradient-to-r from-purple-500 via-sky-500 to-teal-500
                       gradient-text">
          Deine GoodWork Tools
        </h1>
        <p className="text-lg sm:text-xl text-slate-600">Wähle ein Werkzeug, um Deine berufliche Klarheit zu schmieden.</p>
      </header>

      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {toolNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.targetPage, item.label, item.available)}
              className={`p-6 rounded-xl shadow-lg border 
                         transform hover:scale-105 transition-all duration-300 ease-in-out
                         text-left flex flex-col items-center h-full
                         ${item.bgColor} ${item.borderColor} ${item.textColor}
                         ${!item.available ? 'opacity-70 cursor-not-allowed' : ''}`}
              aria-label={`Navigiere zu ${item.label}`}
              disabled={!item.available}
            >
              <div className="mb-4 text-5xl">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-center">{item.label}</h3>
              <p className="text-sm flex-grow text-center">{item.description}</p>
              {!item.available && <span className="mt-2 text-xs font-semibold bg-slate-500 text-white px-2 py-0.5 rounded-full">Demnächst</span>}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ToolsOverviewPage;