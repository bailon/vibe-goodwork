

import React from 'react';
import { ProfileData, AppCurrentPage } from '../types'; // Added ProfileData
import { areAllIdentityScreeningsComplete } from '../appUtils'; // Import helper

// Placeholder Icons
const PersonalityIcon = () => <span className="text-4xl" role="img" aria-label="Personality">🎭</span>;
const InterestsIcon = () => <span className="text-4xl" role="img" aria-label="Interests">🧭</span>;
const MotivesIcon = () => <span className="text-4xl" role="img" aria-label="Motives">🔥</span>;
const SkillsIcon = () => <span className="text-4xl" role="img" aria-label="Skills">🎓</span>; 
const BackIcon = () => <span className="text-xl" role="img" aria-label="Back">↩️</span>;
const ReportIcon = () => <span className="text-4xl" role="img" aria-label="Report">📄</span>; // Icon for report button

type ExtendedAppCurrentPage = 
  | AppCurrentPage // Includes all existing pages from types.ts
  | 'futureSkillsScreeningTool'; // Ensure this specific one is covered if not already general

interface IdentityProfileOverviewPageProps {
  profileData: ProfileData; // Added
  onGenerateIdentityReport: () => Promise<void>; // Added
  isLoadingIdentityReport: boolean; // Added
  onNavigate: (page: ExtendedAppCurrentPage) => void;
  onNavigateBack: () => void; 
  showAppNotification: (message?: string, type?: 'success' | 'info' | 'error', duration?: number) => void;
}

const IdentityProfileOverviewPage: React.FC<IdentityProfileOverviewPageProps> = ({ 
    profileData,
    onGenerateIdentityReport,
    isLoadingIdentityReport,
    onNavigate, 
    onNavigateBack, 
    showAppNotification 
}) => {
  
  const screeningNavItems = [
    { 
      id: 'personality', 
      label: 'Meine Persönlichkeit und Eigenschaften', 
      icon: <PersonalityIcon />, 
      targetPage: 'personalityScreeningTool' as ExtendedAppCurrentPage,
      description: "Erkunde Deine Kernpersönlichkeitsmerkmale (Big Five) und selbst zugeschriebene Eigenschaften.", 
      bgColor: 'bg-red-100 hover:bg-red-200', 
      textColor: 'text-red-700', 
      borderColor: 'border-red-300',
      available: true, 
    },
    { 
      id: 'riasec', 
      label: 'Neigungs- & Interessenprofil (RIASEC)', 
      icon: <InterestsIcon />, 
      targetPage: 'riasecTool' as ExtendedAppCurrentPage, 
      description: "Entdecke Deine beruflichen Grundinteressen nach dem RIASEC-Modell von Holland.",
      bgColor: 'bg-teal-100 hover:bg-teal-200', 
      textColor: 'text-teal-700', 
      borderColor: 'border-teal-300',
      available: true,
    },
    { 
      id: 'motives', 
      label: 'Antriebe & Motivation', 
      icon: <MotivesIcon />, 
      targetPage: 'motivationScreeningTool' as ExtendedAppCurrentPage, 
      description: "Verstehe, was Dich wirklich antreibt und motiviert anhand von Anreizdimensionen.", 
      bgColor: 'bg-orange-100 hover:bg-orange-200', 
      textColor: 'text-orange-700', 
      borderColor: 'border-orange-300',
      available: true, 
    },
    { 
      id: 'skills', 
      label: 'Future Skills Screening', 
      icon: <SkillsIcon />, 
      targetPage: 'futureSkillsScreeningTool' as ExtendedAppCurrentPage, 
      description: "Identifiziere Deine Schlüsselkompetenzen für die Arbeitswelt von morgen.",
      bgColor: 'bg-lime-100 hover:bg-lime-200',
      textColor: 'text-lime-700', 
      borderColor: 'border-lime-300',
      available: true, 
    },
  ];

  const handleNavigation = (targetPage: ExtendedAppCurrentPage, label: string, available: boolean) => {
    if (available) {
      onNavigate(targetPage);
    } else {
      showAppNotification(`Das Screening "${label}" ist noch in Entwicklung. Bald mehr dazu!`, 'info');
    }
  };

  const allScreeningsDone = areAllIdentityScreeningsComplete(profileData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50 to-indigo-50 p-4 sm:p-8">
      <button
        onClick={onNavigateBack}
        className="mb-8 px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow hover:shadow-md text-sm flex items-center gap-2"
      >
        <BackIcon /> Zurück zur Tool-Übersicht
      </button>

      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold mb-3 
                       bg-gradient-to-r from-teal-500 via-indigo-500 to-pink-500
                       gradient-text">
          Berufliches Identitätsprofil
        </h1>
        <p className="text-lg sm:text-xl text-slate-600">Gewinne tiefere Einblicke in Deine berufliche Identität durch verschiedene Screenings.</p>
      </header>

      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {screeningNavItems.map((item) => (
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

      <section className="mt-12 p-6 bg-white rounded-xl shadow-xl border border-indigo-200">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-4 text-center">Dein Identitätsprofil-Report</h2>
        <p className="text-slate-600 mb-6 text-center">
          Nachdem Du die einzelnen Screenings durchgeführt hast, kann Dr. GoodWork einen zusammenfassenden Report für Dich erstellen.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={onGenerateIdentityReport}
            disabled={isLoadingIdentityReport || !allScreeningsDone}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors shadow-md hover:shadow-lg
                        flex items-center justify-center gap-2
                        ${(!allScreeningsDone || isLoadingIdentityReport) 
                            ? 'bg-slate-400 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700'}`}
            title={!allScreeningsDone ? "Bitte zuerst alle vier Screenings (Persönlichkeit, RIASEC, Motive, Future Skills) abschließen." : "Generiert einen prägnanten Kurzreport basierend auf allen vier Identitäts-Screenings."}
          >
            {isLoadingIdentityReport ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Report wird erstellt...
              </>
            ) : (
              <>
                <ReportIcon /> Kurzreport zum Identitätsprofil erstellen
              </>
            )}
          </button>
          <button
            onClick={onGenerateIdentityReport}
            disabled={isLoadingIdentityReport}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors shadow-md hover:shadow-lg
                        flex items-center justify-center gap-2
                        ${isLoadingIdentityReport 
                            ? 'bg-slate-400 cursor-not-allowed' 
                            : 'bg-purple-600 hover:bg-purple-700'}`}
            title="Generiert einen umfassenden Bericht, der alle Deine Profildaten integriert. Wenn alle 4 Screenings erledigt sind, wird der prägnante Kurzreport erstellt."
          >
            {isLoadingIdentityReport ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Report wird erstellt...
              </>
            ) : (
              <>
                <ReportIcon /> Gesamtbericht zum Identitätsprofil erstellen
              </>
            )}
          </button>
        </div>
         {!allScreeningsDone && (
            <p className="text-xs text-center mt-3 text-amber-700 bg-amber-100 p-2 rounded-md">
                Hinweis: Für den prägnanten "Kurzreport" müssen erst alle vier Screenings (Persönlichkeit, RIASEC, Motive, Future Skills) ausgefüllt werden. Der "Gesamtbericht" kann auch mit weniger Daten erstellt werden, ist dann aber allgemeiner.
            </p>
        )}
        {allScreeningsDone && (
             <p className="text-xs text-center mt-3 text-green-700 bg-green-100 p-2 rounded-md">
                Sehr gut! Alle Screenings sind abgeschlossen. Du kannst jetzt den prägnanten "Kurzreport zum Identitätsprofil" erstellen lassen.
            </p>
        )}
      </section>

    </div>
  );
};

export default IdentityProfileOverviewPage;