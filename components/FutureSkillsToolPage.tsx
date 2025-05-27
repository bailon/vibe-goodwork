
import React, { useState, useEffect, useMemo } from 'react';
import { ProfileData, FutureSkillsScreeningData, FutureSkillItemScore, FutureSkillDimensionScore } from '../types'; // Adjusted types
import { FUTURE_SKILLS_DIMENSIONS_CONFIG } from '../constants'; // Adjusted constants
import { getFutureSkillsReport } from '../services/geminiService'; // Adjusted service
import DocumentTextIcon from './icons/DocumentTextIcon';
import { exportTextAsFile } from '../services/exportService';

interface FutureSkillsToolPageProps {
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  onNavigateHome: () => void;
  showAppNotification: (message?: string, type?: 'success' | 'info' | 'error', duration?: number) => void;
  renderFormattedText: (text: string | undefined, defaultText?: string) => JSX.Element | null;
}

interface ShuffledSkill {
  id: string;
  label: string;
  question: string;
  dimensionId: string;
  dimensionColor: string;
}

const initialSliderValues = FUTURE_SKILLS_DIMENSIONS_CONFIG.reduce((acc, dim) => {
  dim.skills.forEach(skill => {
    acc[skill.id] = 5; // Default to 5 on a 1-10 scale
  });
  return acc;
}, {} as { [skillId: string]: number });


const FutureSkillsToolPage: React.FC<FutureSkillsToolPageProps> = ({
  profileData,
  setProfileData,
  onNavigateHome,
  showAppNotification,
  renderFormattedText,
}) => {
  const [view, setView] = useState<'intro' | 'form' | 'results'>('intro');
  const [sliderValues, setSliderValues] = useState<{ [skillId: string]: number }>(initialSliderValues);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [currentFutureSkillsData, setCurrentFutureSkillsData] = useState<FutureSkillsScreeningData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shuffledSkills, setShuffledSkills] = useState<ShuffledSkill[]>([]);

  useEffect(() => {
    if (profileData.futureSkillsScreening) {
      setCurrentFutureSkillsData(profileData.futureSkillsScreening);
       if (profileData.futureSkillsScreening.dimensionScores && view !== 'form') {
        const loadedSliderValues: { [skillId: string]: number } = {};
        profileData.futureSkillsScreening.dimensionScores.forEach(dim => {
            dim.skills.forEach(skill => {
                loadedSliderValues[skill.id] = skill.value;
            });
        });
        setSliderValues(loadedSliderValues);
      }
      setView('results');
    } else {
      setView('intro');
      setSliderValues(initialSliderValues);
      setCurrentFutureSkillsData(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData.futureSkillsScreening]);


  const startScreening = () => {
    const allSkillsFlat: ShuffledSkill[] = FUTURE_SKILLS_DIMENSIONS_CONFIG.flatMap(dim =>
      dim.skills.map(skill => ({
        id: skill.id,
        label: skill.label,
        question: skill.question,
        dimensionId: dim.id,
        dimensionColor: dim.color,
      }))
    );
    setShuffledSkills(allSkillsFlat.sort(() => Math.random() - 0.5));
    setSliderValues(initialSliderValues);
    setCurrentFutureSkillsData(null);
    setError(null);
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSliderChange = (skillId: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [skillId]: value }));
  };

  const calculateDimensionScores = (): FutureSkillDimensionScore[] => {
    return FUTURE_SKILLS_DIMENSIONS_CONFIG.map(dimConfig => {
      const skillScoresInDimension: FutureSkillItemScore[] = dimConfig.skills.map(skillConfig => ({
        id: skillConfig.id,
        label: skillConfig.label,
        value: sliderValues[skillConfig.id] || 5,
      })).sort((a,b) => b.value - a.value); 

      const sum = skillScoresInDimension.reduce((acc, skill) => acc + skill.value, 0);
      const average = skillScoresInDimension.length > 0 ? sum / skillScoresInDimension.length : 0;

      return {
        id: dimConfig.id,
        label: dimConfig.label,
        averageScore: parseFloat(average.toFixed(1)),
        color: dimConfig.color,
        description: dimConfig.description,
        skills: skillScoresInDimension,
      };
    }).sort((a,b) => b.averageScore - a.averageScore); 
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoadingReport(true);
    showAppNotification("Deine Ergebnisse werden ausgewertet und der KI-Report wird generiert...", "info", 4000);

    const calculatedDimensionScores = calculateDimensionScores();
    const initialDataForReport: FutureSkillsScreeningData = {
        dimensionScores: calculatedDimensionScores,
        lastRun: new Date().toISOString(),
    };

    try {
      // Pass the calculated data and the full profile for context
      const reportText = await getFutureSkillsReport(initialDataForReport, profileData);
      
      const newFutureSkillsData: FutureSkillsScreeningData = {
        ...initialDataForReport,
        report: reportText,
      };
      setCurrentFutureSkillsData(newFutureSkillsData);
      setProfileData(prev => ({ ...prev, futureSkillsScreening: newFutureSkillsData }));
      setView('results');
      if (!reportText.startsWith("Fehler:")) {
        showAppNotification("Dein Future Skills Report wurde erfolgreich generiert und im Profil gespeichert!", "success");
      } else {
         showAppNotification(reportText, "error");
      }
    } catch (e: any) {
      console.error("Fehler beim Generieren des Future Skills Reports:", e);
      setError(`Fehler beim Generieren des Reports: ${e.message}`);
      showAppNotification(`Fehler beim Generieren des Reports: ${e.message}`, "error");
      setCurrentFutureSkillsData(initialDataForReport); // Save data without report on error
      setProfileData(prev => ({ ...prev, futureSkillsScreening: initialDataForReport }));
      setView('results'); 
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleStartOverConfirmation = () => {
    if (window.confirm("Möchtest Du das Screening wirklich neu starten? Deine aktuellen Ergebnisse werden überschrieben, sobald Du das neue Screening auswertest.")) {
      setProfileData(prev => ({ ...prev, futureSkillsScreening: undefined }));
      startScreening();
      showAppNotification("Screening wird neu gestartet. Bitte bewerte Deine Future Skills.", "info");
    }
  };
  
  const handleExportReport = () => {
    if (!currentFutureSkillsData) {
        showAppNotification("Keine Daten zum Exportieren vorhanden.", "info");
        return;
    }

    let content = `SCREENING: FUTURE SKILLS - Ergebnisreport\n`;
    content += `Test durchgeführt am: ${currentFutureSkillsData.lastRun ? new Date(currentFutureSkillsData.lastRun).toLocaleString('de-DE') : 'N/A'}\n\n`;
    content += "ERGEBNISÜBERSICHT DER KOMPETENZDIMENSIONEN (Durchschnittswerte, sortiert nach Relevanz):\n";
    content += "-----------------------------------------------------------\n";
    
    currentFutureSkillsData.dimensionScores.forEach(dim => {
        content += `${dim.label.padEnd(45)}: ${dim.averageScore.toFixed(1)} / 10\n`;
        dim.skills.forEach(skill => {
            content += `  - ${skill.label.padEnd(41)}: ${skill.value} / 10\n`;
        });
        content += "\n";
    });

    if (currentFutureSkillsData.report && !currentFutureSkillsData.report.startsWith("Fehler:")) {
        content += `\n\n--- KI-BASIERTER REPORT ZU DEINEN FUTURE SKILLS ---\n\n`;
        let plainTextReport = currentFutureSkillsData.report;
        plainTextReport = plainTextReport.replace(/^### (.*?)\s*$/gm, "--- $1 ---\n");
        plainTextReport = plainTextReport.replace(/^## (.*?)\s*$/gm, "\n=== $1 ===\n");
        plainTextReport = plainTextReport.replace(/^# (.*?)\s*$/gm, "\n==== $1 ====\n");
        plainTextReport = plainTextReport.replace(/\*\*(.*?)\*\*/g, "$1");
        plainTextReport = plainTextReport.replace(/\*(.*?)\*/g, "$1");  
        plainTextReport = plainTextReport.replace(/^\s*[-*+]\s*(.*)/gm, "- $1");
        plainTextReport = plainTextReport.replace(/^\s*\d+\.\s*(.*)/gm, "  $1."); 
        content += plainTextReport;
    }  else if (currentFutureSkillsData.report) { // Report exists but indicates an error
        content += `\n\n--- HINWEIS ZUM KI-REPORT ---\n\n`;
        content += `Der KI-Report konnte nicht generiert werden oder enthielt einen Fehler:\n${currentFutureSkillsData.report}\n`;
    }


    if (exportTextAsFile(content, 'future_skills_report.txt')) {
        showAppNotification("Future Skills Report als TXT exportiert.", "success");
    } else {
        showAppNotification("Fehler beim Exportieren des Future Skills Reports oder keine relevanten Daten.", "error");
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
        <h1 className="text-4xl font-bold text-slate-800">Future Skills Screening</h1>
        <p className="text-lg text-slate-600 mt-2">Schätze Deine Kompetenzen für die Arbeitswelt von morgen ein.</p>
      </header>

      {view === 'intro' && (
        <div className="bg-lime-50 p-6 md:p-8 rounded-xl shadow-xl text-center">
          <h2 className="text-3xl font-bold text-lime-700 mb-4">Hallo von Dr. GoodWork!</h2>
          <img src="/dr_goodwork_avatar.png" alt="Dr. GoodWork" className="w-32 h-32 mx-auto rounded-full mb-4 shadow-md border-2 border-lime-200" />
          <p className="text-slate-700 text-lg mb-3 leading-relaxed">
            Willkommen beim Future Skills Screening! Dieses Tool hilft Dir, Deine Stärken in den Kompetenzfeldern zu erkennen, die für die zukünftige Arbeitswelt besonders relevant sind.
          </p>
          <p className="text-slate-700 text-lg mb-6 leading-relaxed">
            Bewerte ehrlich, wie ausgeprägt Du die folgenden Fähigkeiten bei Dir siehst. Die Ergebnisse und der darauf basierende KI-Report helfen Dir, Entwicklungsfelder zu identifizieren und Deine berufliche Zukunft aktiv zu gestalten.
          </p>
          <button
            onClick={startScreening}
            className="px-8 py-3 bg-lime-600 text-white font-semibold rounded-lg hover:bg-lime-700 transition-colors shadow-md text-lg print:hidden"
          >
            Screening starten
          </button>
        </div>
      )}

      {view === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm text-slate-600 bg-lime-50 p-4 rounded-lg shadow-sm">
            Bitte bewerte auf einer Skala von 1 (trifft gar nicht zu / gering ausgeprägt) bis 10 (trifft voll und ganz zu / stark ausgeprägt), wie Du Deine Kompetenzen in den folgenden Bereichen einschätzt. Die Fragen werden in zufälliger Reihenfolge dargestellt.
          </p>
          <div className="space-y-8">
            {shuffledSkills.map((skill, index) => (
              <div key={skill.id} className="p-5 border border-slate-200 rounded-xl shadow-lg bg-white">
                  <label htmlFor={skill.id} className="block text-md font-medium text-slate-700 mb-2">
                    {index + 1}. {skill.question}
                  </label>
                  <div className="flex items-center space-x-3 mt-1">
                    <input
                      type="range"
                      id={skill.id}
                      name={skill.id}
                      min="1"
                      max="10"
                      value={sliderValues[skill.id] || 5}
                      onChange={(e) => handleSliderChange(skill.id, parseInt(e.target.value))}
                      className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: skill.dimensionColor }}
                    />
                    <span className="text-lg font-semibold w-10 text-right" style={{ color: skill.dimensionColor }}>
                      {sliderValues[skill.id] || 5}
                    </span>
                  </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center pt-4 print:hidden">
            <button
              type="submit"
              disabled={isLoadingReport}
              className="px-8 py-3 bg-lime-600 text-white font-semibold rounded-lg hover:bg-lime-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-wait flex items-center justify-center text-lg"
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

      {view === 'results' && currentFutureSkillsData && (
        <section id="result" className="mt-8 p-4 md:p-6 bg-slate-50 rounded-xl shadow-xl">
          <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: FUTURE_SKILLS_DIMENSIONS_CONFIG[0]?.color || '#84cc16' }}>Dein Future Skills Profil</h2>
          
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">Fehler: {error}</p>}

          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentFutureSkillsData.dimensionScores.map(dim => (
              <div key={dim.id} className="p-4 bg-white rounded-lg shadow border-l-4" style={{borderColor: dim.color}}>
                <h4 className="text-lg font-semibold mb-1" style={{color: dim.color}}>{dim.label}</h4>
                <p className="text-sm text-slate-600">
                    Durchschnittliche Ausprägung: <strong className="text-slate-800">{dim.averageScore.toFixed(1)} / 10</strong>
                </p>
                <div className="mt-2 h-3 w-full bg-slate-200 rounded-full">
                  <div style={{ width: `${(dim.averageScore / 10) * 100}%`, backgroundColor: dim.color }} className="h-3 rounded-full"></div>
                </div>
                <details className="mt-3 text-xs">
                    <summary className="cursor-pointer font-medium text-slate-500 hover:text-slate-700">Details zu den Kompetenzen anzeigen (sortiert)</summary>
                    <ul className="mt-1 space-y-0.5 pl-2">
                        {dim.skills.map(skill => (
                            <li key={skill.id} className="flex justify-between">
                                <span className="text-slate-600">{skill.label}:</span>
                                <span className="font-semibold" style={{color: dim.color}}>{skill.value}</span>
                            </li>
                        ))}
                    </ul>
                </details>
              </div>
            ))}
          </div>
          
          {isLoadingReport && (
            <div className="flex flex-col items-center justify-center my-6 p-6 bg-white rounded-md shadow print:hidden">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4" style={{borderColor: FUTURE_SKILLS_DIMENSIONS_CONFIG[1]?.color || '#84cc16'}}></div>
              <p className="mt-4 text-slate-600 text-lg">Dein persönlicher KI-Report wird generiert...</p>
            </div>
          )}
          
          {currentFutureSkillsData.report && !isLoadingReport && (
            <details className="mt-8 p-4 md:p-6 bg-white rounded-xl shadow-lg printable-details-section" open>
              <summary className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b-2 border-slate-200 pb-3 cursor-pointer gap-2">
                 <h3 className="text-2xl font-semibold" style={{color: FUTURE_SKILLS_DIMENSIONS_CONFIG[1]?.color || '#84cc16'}}>Dein KI-basierter Future Skills Report</h3>
                 <button
                    onClick={handleExportReport}
                    className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors shadow hover:shadow-md flex items-center gap-1.5 print:hidden self-start sm:self-center"
                    aria-label="Report als TXT-Datei exportieren"
                    title="Report als TXT exportieren"
                >
                    <DocumentTextIcon className="w-4 h-4" /> TXT Export
                </button>
              </summary>
              {renderFormattedText(currentFutureSkillsData.report)}
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

export default FutureSkillsToolPage;
