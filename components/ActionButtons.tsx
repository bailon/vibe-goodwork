
import React from 'react';
import SparklesIcon from './icons/SparklesIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import RefreshIcon from './icons/RefreshIcon'; 
import LightBulbIcon from './icons/LightBulbIcon'; 
// EyeIcon und PlayIcon bleiben lokal, da sie spezifisch hier verwendet werden oder nicht global benötigt.

interface ActionButtonsProps {
  onLoadExampleValouData: () => void;
  onResetValouData: () => void;
  onExportValouData: () => void;
  onToggleValouSummary: () => void;
  onGetDrGoodWorkTipps: () => void; 
  currentValouView: 'editor' | 'summary';
  onKiStylingForValou: () => void;
  isKiStylingForValouInProgress: boolean;
  canLoadExampleValouData: boolean;
  canUseKiStylingForValou: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onLoadExampleValouData,
  onResetValouData,
  onExportValouData,
  onToggleValouSummary,
  onGetDrGoodWorkTipps, 
  currentValouView,
  onKiStylingForValou,
  isKiStylingForValouInProgress,
  canLoadExampleValouData,
  canUseKiStylingForValou,
}) => {
  const isEditorView = currentValouView === 'editor';

  let kiStylingTitle = "KI Styling für Valou (nur im Styling Studio verfügbar)";
  if (isEditorView) {
    if (!canUseKiStylingForValou) {
      kiStylingTitle = "Voraussetzung: Dein Profil (insb. Identitätsprofil oder RIASEC-Ergebnisse) muss für die KI-Analyse ausreichend gefüllt sein.";
    } else {
      kiStylingTitle = "KI ergänzt Deine aktuellen Valou-Einträge oder generiert einen Erstentwurf, falls Bereiche leer sind. Basiert auf Deinem Profil.";
    }
  }
  
  let loadExampleTitle = "Beispieldaten für Valou laden (nur im Styling Studio)";
  if (isEditorView && !canLoadExampleValouData) {
    loadExampleTitle = "Beispieldaten kannst Du nur laden, wenn Deine Valou-Bereiche noch leer sind.";
  } else if (isEditorView && canLoadExampleValouData) {
    loadExampleTitle = "Lädt Beispieldaten in alle Valou-Bereiche. Deine aktuellen Valou-Daten werden überschrieben."
  }


  return (
    <div className="flex flex-col items-center mb-8 gap-4 print:hidden p-4 bg-gray-50 rounded-lg shadow-md">
      {/* Centered Main Toggle Button */}
      <div className="w-full flex justify-center mb-3">
        <button
          onClick={onToggleValouSummary}
          className="px-8 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors shadow-lg hover:shadow-xl text-lg font-semibold flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75"
          aria-label={currentValouView === 'summary' ? "Styling Studio anzeigen" : "Zusammenfassung anzeigen"}
        >
          <EyeIcon className="w-5 h-5" />
          {currentValouView === 'summary' ? "Styling Studio" : "Zusammenfassung"}
        </button>
      </div>

      {/* Row of other buttons */}
      <div className="flex flex-wrap justify-center items-center gap-3 w-full">
        {isEditorView && (
          <>
            <button
              onClick={onLoadExampleValouData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm"
              disabled={!canLoadExampleValouData} 
              aria-label="Beispieldaten für Valou laden"
              title={loadExampleTitle}
            >
              <PlayIcon className="w-4 h-4" /> Beispieldaten
            </button>
            <button
              onClick={onKiStylingForValou}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm"
              disabled={!canUseKiStylingForValou || isKiStylingForValouInProgress}
              aria-label="KI Styling für alle Deine Valou-Bereiche generieren oder ergänzen"
              title={kiStylingTitle}
            >
              {isKiStylingForValouInProgress ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Generiere...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  KI Styling
                </>
              )}
            </button>
          </>
        )}
        <button
          onClick={onResetValouData}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow hover:shadow-md flex items-center gap-1.5 text-sm"
          aria-label="Deine Valou Styling Daten zurücksetzen"
          title="Setzt alle Einträge in Deinen Valou-Bereichen zurück."
        >
         <RefreshIcon className="w-4 h-4" /> Zurücksetzen (Valou)
        </button>
         <button
          onClick={onExportValouData}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors shadow hover:shadow-md flex items-center gap-1.5 text-sm"
          aria-label="Deine Valou Zusammenfassung als TXT exportieren"
        >
          <DocumentTextIcon className="w-4 h-4" /> Valou TXT Export
        </button>
         <button
          onClick={onGetDrGoodWorkTipps} 
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow hover:shadow-md flex items-center gap-1.5 text-sm"
          aria-label="Dr. GoodWork Gesamt-Tipps basierend auf Deinem Profil und Valou-Daten anfordern" 
          title="Fordert umfassende Tipps von Dr. GoodWork an, die alle Deine Profildaten, Valou-Styling und Tool-Ergebnisse berücksichtigen." 
        >
          <LightBulbIcon className="w-4 h-4" />
          Dr. GoodWork Tipps 
        </button>
      </div>
    </div>
  );
};

const EyeIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PlayIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
);


export default ActionButtons;
