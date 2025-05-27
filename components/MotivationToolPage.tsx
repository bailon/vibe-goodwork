
import React, { useState, useEffect, useMemo } from 'react';
import { ProfileData, MotivationScreeningData, MotiveScoreData, MotiveDimensionScore, MotivItemScore } from '../types';
import { MOTIVATION_DIMENSIONS_CONFIG } from '../constants';
import { getMotivationReport } from '../services/geminiService';
import DocumentTextIcon from './icons/DocumentTextIcon';
import { exportTextAsFile } from '../services/exportService';

interface MotivationToolPageProps {
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  onNavigateHome: () => void;
  showAppNotification: (message?: string, type?: 'success' | 'info' | 'error', duration?: number) => void;
  renderFormattedText: (text: string | undefined, defaultText?: string) => JSX.Element | null;
}

interface ShuffledMotive {
  id: string;
  label: string;
  question: string;
  dimensionId: string;
  dimensionColor: string;
}

const initialSliderValues = MOTIVATION_DIMENSIONS_CONFIG.reduce((acc, dim) => {
  dim.motivations.forEach(motiv => {
    acc[motiv.id] = 5; // Default to 5
  });
  return acc;
}, {} as MotiveScoreData);


const MotivationToolPage: React.FC<MotivationToolPageProps> = ({
  profileData,
  setProfileData,
  onNavigateHome,
  showAppNotification,
  renderFormattedText,
}) => {
  const [view, setView] = useState<'intro' | 'form' | 'results'>('intro');
  const [sliderValues, setSliderValues] = useState<MotiveScoreData>(initialSliderValues);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [currentMotivationData, setCurrentMotivationData] = useState<MotivationScreeningData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shuffledMotives, setShuffledMotives] = useState<ShuffledMotive[]>([]);

  useEffect(() => {
    if (profileData.motivationScreening) {
      setCurrentMotivationData(profileData.motivationScreening);
      if (profileData.motivationScreening.dimensionScores && view !== 'form') {
        const loadedSliderValues: MotiveScoreData = {};
        profileData.motivationScreening.dimensionScores.forEach(dim => {
            dim.motivations.forEach(motiv => {
                loadedSliderValues[motiv.id] = motiv.value;
            });
        });
        setSliderValues(loadedSliderValues);
      }
      setView('results');
    } else {
      setView('intro');
      setSliderValues(initialSliderValues);
      setCurrentMotivationData(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData.motivationScreening]);


  const startScreening = () => {
    const allMotivesFlat: ShuffledMotive[] = MOTIVATION_DIMENSIONS_CONFIG.flatMap(dim =>
      dim.motivations.map(motiv => ({
        id: motiv.id,
        label: motiv.label,
        question: motiv.question,
        dimensionId: dim.id,
        dimensionColor: dim.color,
      }))
    );
    setShuffledMotives(allMotivesFlat.sort(() => Math.random() - 0.5));
    setSliderValues(initialSliderValues);
    setCurrentMotivationData(null);
    setError(null);
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSliderChange = (motiveId: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [motiveId]: value }));
  };

  const calculateDimensionScores = (): MotiveDimensionScore[] => {
    return MOTIVATION_DIMENSIONS_CONFIG.map(dimConfig => {
      const motiveScoresInDimension: MotivItemScore[] = dimConfig.motivations.map(motivConfig => ({
        id: motivConfig.id,
        label: motivConfig.label,
        value: sliderValues[motivConfig.id] || 5,
      })).sort((a,b) => b.value - a.value); // Sort motives within dimension by value

      const sum = motiveScoresInDimension.reduce((acc, motiv) => acc + motiv.value, 0);
      const average = motiveScoresInDimension.length > 0 ? sum / motiveScoresInDimension.length : 0;

      return {
        id: dimConfig.id,
        label: dimConfig.label,
        averageScore: parseFloat(average.toFixed(1)),
        color: dimConfig.color,
        description: dimConfig.description,
        motivations: motiveScoresInDimension,
      };
    }).sort((a,b) => b.averageScore - a.averageScore); // Sort dimensions by average score
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoadingReport(true);
    showAppNotification("Deine Ergebnisse werden ausgewertet und der KI-Report wird generiert...", "info", 4000);

    const calculatedDimensionScores = calculateDimensionScores();
    const initialDataForReport: MotivationScreeningData = {
        dimensionScores: calculatedDimensionScores,
        lastRun: new Date().toISOString(),
    };

    try {
      const reportText = await getMotivationReport(initialDataForReport, profileData);
      
      const newMotivationData: MotivationScreeningData = {
        ...initialDataForReport,
        report: reportText,
      };
      setCurrentMotivationData(newMotivationData);
      setProfileData(prev => ({ ...prev, motivationScreening: newMotivationData }));
      setView('results');
      if (!reportText.startsWith("Fehler:")) {
        showAppNotification("Dein Motivationsreport wurde erfolgreich generiert und im Profil gespeichert!", "success");
      } else {
        showAppNotification(reportText, "error");
      }
    } catch (e: any) {
      console.error("Fehler beim Generieren des Motivationsreports:", e);
      setError(`Fehler beim Generieren des Reports: ${e.message}`);
      showAppNotification(`Fehler beim Generieren des Reports: ${e.message}`, "error");
      setCurrentMotivationData(initialDataForReport);
      setProfileData(prev => ({ ...prev, motivationScreening: initialDataForReport }));
      setView('results'); 
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleStartOverConfirmation = () => {
    if (window.confirm("Möchtest Du das Screening wirklich neu starten? Deine aktuellen Ergebnisse werden überschrieben, sobald Du das neue Screening auswertest.")) {
      setProfileData(prev => ({ ...prev, motivationScreening: undefined }));
      startScreening();
      showAppNotification("Screening wird neu gestartet. Bitte bewerte Deine Antriebe.", "info");
    }
  };
  
  const handleExportReport = () => {
    if (!currentMotivationData) {
        showAppNotification("Keine Daten zum Exportieren vorhanden.", "info");
        return;
    }

    let content = `SCREENING: ANTRIEBE & MOTIVATION - Ergebnisreport\n`;
    content += `Test durchgeführt am: ${currentMotivationData.lastRun ? new Date(currentMotivationData.lastRun).toLocaleString('de-DE') : 'N/A'}\n\n`;
    content += "ERGEBNISÜBERSICHT DER ANREIZDIMENSIONEN (Durchschnittswerte, sortiert nach Relevanz):\n";
    content += "-----------------------------------------------------------\n";
    // Use currentMotivationData which already has sorted dimensions
    currentMotivationData.dimensionScores.forEach(dim => {
        content += `${dim.label.padEnd(30)}: ${dim.averageScore.toFixed(1)} / 10\n`;
        // Motives within dimension are also already sorted in currentMotivationData
        dim.motivations.forEach(motiv => {
            content += `  - ${motiv.label.padEnd(26)}: ${motiv.value} / 10\n`;
        });
        content += "\n";
    });

    if (currentMotivationData.report && !currentMotivationData.report.startsWith("Fehler:")) {
        content += `\n\n--- KI-BASIERTER REPORT ZU DEINEN ANTRIEBEN & MOTIVEN ---\n\n`;
        let plainTextReport = currentMotivationData.report;
        plainTextReport = plainTextReport.replace(/^### (.*?)\s*$/gm, "--- $1 ---\n");
        plainTextReport = plainTextReport.replace(/^## (.*?)\s*$/gm, "\n=== $1 ===\n");
        plainTextReport = plainTextReport.replace(/^# (.*?)\s*$/gm, "\n==== $1 ====\n");
        plainTextReport = plainTextReport.replace(/\*\*(.*?)\*\*/g, "$1");
        plainTextReport = plainTextReport.replace(/\*(.*?)\*/g, "$1");  
        plainTextReport = plainTextReport.replace(/^\s*[-*+]\s*(.*)/gm, "- $1");
        plainTextReport = plainTextReport.replace(/^\s*\d+\.\s*(.*)/gm, "  $1."); 
        content += plainTextReport;
    } else if (currentMotivationData.report) {
        content += `\n\n--- HINWEIS ZUM KI-REPORT ---\n\n`;
        content += `Der KI-Report konnte nicht generiert werden oder enthielt einen Fehler:\n${currentMotivationData.report}\n`;
    }

    if (exportTextAsFile(content, 'antriebe_motivation_report.txt')) {
        showAppNotification("Motivationsreport als TXT exportiert.", "success");
    } else {
        showAppNotification("Fehler beim Exportieren des Motivationsreports oder keine relevanten Daten.", "error");
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-xl shadow-2xl mt-8">
      <button
        onClick={onNavigateHome}
        className="mb-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow hover:shadow-md text-sm print:hidden"
      >
        Zurück zum Identitätsprofil
      </button>

      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-800">Antriebe & Motivation Screening</h1>
        <p className="text-lg text-slate-600 mt-2">Verstehe, was Dich im Kern antreibt.</p>
      </header>

      {view === 'intro' && (
        <div className="bg-orange-50 p-6 md:p-8 rounded-xl shadow-xl text-center">
          <h2 className="text-3xl font-bold text-orange-700 mb-4">Hallo von Dr. GoodWork!</h2>
          <img src="/dr_goodwork_avatar.png" alt="Dr. GoodWork" className="w-32 h-32 mx-auto rounded-full mb-4 shadow-md border-2 border-orange-200" />
          <p className="text-slate-700 text-lg mb-3 leading-relaxed">
            Willkommen zum Screening Deiner Antriebe und Motive! Dieses Tool hilft Dir, Deine inneren Beweggründe und die wichtigsten Anreize für Dein berufliches Handeln zu identifizieren.
          </p>
          <p className="text-slate-700 text-lg mb-6 leading-relaxed">
            Nimm Dir einen Moment Zeit, um die Fragen zu den verschiedenen Motivationsbereichen ehrlich und intuitiv zu beantworten. Dein Ergebnisprofil und der darauf basierende KI-Report geben Dir wertvolle Einblicke, wie Du Deine Arbeit und Karriere so gestalten kannst, dass sie Deinen tiefsten Bedürfnissen entspricht.
          </p>
          <button
            onClick={startScreening}
            className="px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-md text-lg print:hidden"
          >
            Screening starten
          </button>
        </div>
      )}

      {view === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm text-slate-600 bg-orange-50 p-4 rounded-lg shadow-sm">
            Bitte bewerte auf einer Skala von 1 (trifft gar nicht zu) bis 10 (trifft voll und ganz zu), wie wichtig Dir die folgenden Aspekte sind oder inwieweit die Aussagen auf Dich zutreffen. Die Fragen werden in zufälliger Reihenfolge dargestellt.
          </p>
          <div className="space-y-8">
            {shuffledMotives.map((motive, index) => (
              <div key={motive.id} className="p-5 border border-slate-200 rounded-xl shadow-lg bg-white">
                  <label htmlFor={motive.id} className="block text-md font-medium text-slate-700 mb-2">
                    {index + 1}. {motive.question}
                  </label>
                  <div className="flex items-center space-x-3 mt-1">
                    <input
                      type="range"
                      id={motive.id}
                      name={motive.id}
                      min="1"
                      max="10"
                      value={sliderValues[motive.id] || 5}
                      onChange={(e) => handleSliderChange(motive.id, parseInt(e.target.value))}
                      className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: motive.dimensionColor }}
                    />
                    <span className="text-lg font-semibold w-10 text-right" style={{ color: motive.dimensionColor }}>
                      {sliderValues[motive.id] || 5}
                    </span>
                  </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center pt-4 print:hidden">
            <button
              type="submit"
              disabled={isLoadingReport}
              className="px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-wait flex items-center justify-center text-lg"
            >
              {isLoadingReport ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                  Auswerten...
                </>
              ) : (
                "Auswerten & KI-Report anfordern"
              )}
            </button>
          </div>
        </form>
      )}

      {view === 'results' && currentMotivationData && (
        <section id="result" className="mt-8 p-4 md:p-6 bg-slate-50 rounded-xl shadow-xl">
          <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: MOTIVATION_DIMENSIONS_CONFIG[0]?.color || '#F97316' }}>Dein Motivationsprofil</h2>
          
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">Fehler: {error}</p>}

          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dimensions are already sorted in currentMotivationData.dimensionScores by calculateDimensionScores */}
            {currentMotivationData.dimensionScores.map(dim => (
              <div key={dim.id} className="p-4 bg-white rounded-lg shadow border-l-4" style={{borderColor: dim.color}}>
                <h4 className="text-lg font-semibold mb-1" style={{color: dim.color}}>{dim.label}</h4>
                <p className="text-sm text-slate-600">
                    Durchschnittliche Ausprägung: <strong className="text-slate-800">{dim.averageScore.toFixed(1)} / 10</strong>
                </p>
                <div className="mt-2 h-3 w-full bg-slate-200 rounded-full">
                  <div style={{ width: `${(dim.averageScore / 10) * 100}%`, backgroundColor: dim.color }} className="h-3 rounded-full"></div>
                </div>
                <details className="mt-3 text-xs">
                    <summary className="cursor-pointer font-medium text-slate-500 hover:text-slate-700">Details zu den Motivbereichen anzeigen (sortiert)</summary>
                    <ul className="mt-1 space-y-0.5 pl-2">
                        {/* Motives are also already sorted within dim.motivations */}
                        {dim.motivations.map(motiv => (
                            <li key={motiv.id} className="flex justify-between">
                                <span className="text-slate-600">{motiv.label}:</span>
                                <span className="font-semibold" style={{color: dim.color}}>{motiv.value}</span>
                            </li>
                        ))}
                    </ul>
                </details>
              </div>
            ))}
          </div>
          
          {isLoadingReport && (
            <div className="flex flex-col items-center justify-center my-6 p-6 bg-white rounded-md shadow print:hidden">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4" style={{borderColor: MOTIVATION_DIMENSIONS_CONFIG[1]?.color || '#EA580C'}}></div>
              <p className="mt-4 text-slate-600 text-lg">Dein persönlicher KI-Report wird generiert...</p>
            </div>
          )}
          
          {currentMotivationData.report && !isLoadingReport && (
            <details className="mt-8 p-4 md:p-6 bg-white rounded-xl shadow-lg printable-details-section" open>
              <summary className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b-2 border-slate-200 pb-3 cursor-pointer gap-2">
                 <h3 className="text-2xl font-semibold" style={{color: MOTIVATION_DIMENSIONS_CONFIG[1]?.color || '#EA580C'}}>Dein KI-basierter Motivationsreport</h3>
                 <button
                    onClick={handleExportReport}
                    className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors shadow hover:shadow-md flex items-center gap-1.5 print:hidden self-start sm:self-center"
                    aria-label="Report als TXT-Datei exportieren"
                    title="Report als TXT exportieren"
                >
                    <DocumentTextIcon className="w-4 h-4" /> TXT Export
                </button>
              </summary>
              {renderFormattedText(currentMotivationData.report)}
            </details>
          )}

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 print:hidden">
            <button
              onClick={handleStartOverConfirmation}
              className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors shadow-md text-lg"
            >
              Screening neu starten
            </button>
             <button
                onClick={onNavigateHome}
                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-md text-lg"
            >
                Zurück zum Identitätsprofil
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default MotivationToolPage;
