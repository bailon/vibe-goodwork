
import React, { useState, useEffect, useMemo } from 'react';
import { ProfileData, RiasecData, RiasecScoreData, RiasecScoreDetail } from '../types';
import { RIASEC_QUESTIONS, RIASEC_MAPPING, RIASEC_DESCRIPTIONS } from '../constants';
import { getRiasecReport } from '../services/geminiService';
import DocumentTextIcon from './icons/DocumentTextIcon'; // For TXT export
import { exportTextAsFile } from '../services/exportService';

interface RiasecToolPageProps {
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  onNavigateHome: () => void; // Navigates to IdentityProfileOverviewPage
  showAppNotification: (message?: string, type?: 'success' | 'info' | 'error', duration?: number) => void;
}

interface ShuffledQuestion {
  text: string;
  originalQNum: number; // 1-based original question number
  sliderId: string; // e.g., "q1", "q2" based on originalQNum
}

const initialSliderValues = RIASEC_QUESTIONS.reduce((acc, _, index) => {
  acc[`q${index + 1}`] = 5; // Keyed by original question number
  return acc;
}, {} as { [key: string]: number });

const RiasecToolPage: React.FC<RiasecToolPageProps> = ({
  profileData,
  setProfileData,
  onNavigateHome,
  showAppNotification,
}) => {
  const [sliderValues, setSliderValues] = useState<{ [key: string]: number }>(initialSliderValues);
  const [view, setView] = useState<'intro' | 'form' | 'results'>('intro');
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [currentRiasecData, setCurrentRiasecData] = useState<RiasecData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>([]);

  useEffect(() => {
    if (profileData.riasec) {
      setCurrentRiasecData(profileData.riasec);
      setView('results'); 
    } else {
      setView('intro');
      setSliderValues(initialSliderValues);
      setCurrentRiasecData(null);
    }
  }, [profileData.riasec]);

  const startTest = () => {
    const questionsToShuffle = RIASEC_QUESTIONS.map((text, index) => ({
      text,
      originalQNum: index + 1,
      sliderId: `q${index + 1}`
    }));
    setShuffledQuestions(questionsToShuffle.sort(() => Math.random() - 0.5));
    setSliderValues(initialSliderValues);
    setCurrentRiasecData(null);
    setError(null);
    setView('form');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };


  const handleSliderChange = (questionId: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateResults = () => {
    const averages: RiasecScoreData = {};
    for (const [area, qs] of Object.entries(RIASEC_MAPPING)) {
      const sum = qs.reduce((acc, qNum) => acc + (sliderValues[`q${qNum}`] || 0), 0);
      averages[area] = parseFloat((sum / qs.length).toFixed(2));
    }

    const sorted: RiasecScoreDetail[] = Object.entries(averages)
      .map(([area, value]) => ({
        area,
        value,
        label: RIASEC_DESCRIPTIONS[area]?.label || area,
        color: RIASEC_DESCRIPTIONS[area]?.color || '#ccc',
        description: RIASEC_DESCRIPTIONS[area]?.description || 'N/A'
      }))
      .sort((a, b) => b.value - a.value);
      
    return { scores: averages, sortedScores: sorted, hierarchy: sorted.map(s => s.area) };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoadingReport(true);
    showAppNotification("Deine Ergebnisse werden ausgewertet und der KI-Report wird generiert...", "info", 4000);

    const { scores, sortedScores, hierarchy } = calculateResults();

    try {
      const { reportText, hollandCode, hollandType } = await getRiasecReport(sortedScores, profileData);
      
      const newRiasecData: RiasecData = {
        scores,
        sortedScores,
        hierarchy,
        hollandCode,
        hollandType,
        report: reportText,
        lastRun: new Date().toISOString(),
      };
      setCurrentRiasecData(newRiasecData);
      setProfileData(prev => ({ ...prev, riasec: newRiasecData }));
      setView('results');
      showAppNotification("Dein RIASEC Report wurde erfolgreich generiert und im Profil gespeichert!", "success");
    } catch (e: any) {
      console.error("Fehler beim Generieren des RIASEC Reports:", e);
      setError(`Fehler beim Generieren des Reports: ${e.message}`);
      showAppNotification(`Fehler beim Generieren des Reports: ${e.message}`, "error");
       const fallbackRiasecData: RiasecData = {
        scores,
        sortedScores,
        hierarchy,
        lastRun: new Date().toISOString(),
      };
      setCurrentRiasecData(fallbackRiasecData);
      setProfileData(prev => ({ ...prev, riasec: fallbackRiasecData }));
      setView('results'); 
    } finally {
      setIsLoadingReport(false);
    }
  };
  
  const handleStartOverConfirmation = () => {
    if (window.confirm("Möchtest Du den Test wirklich neu starten? Deine aktuellen Testergebnisse (falls vorhanden) werden überschrieben, sobald Du den neuen Test auswertest.")) {
        startTest();
        window.scrollTo({top: 0, behavior: 'smooth'});
    }
  };

  const handleExportReport = () => {
    if (!currentRiasecData || !currentRiasecData.report) {
      showAppNotification("Kein Report zum Exportieren vorhanden.", "info");
      return;
    }
    let content = `RIASEC Interessen-Self-Check - Kurzreport\n`;
    content += `Test durchgeführt am: ${currentRiasecData.lastRun ? new Date(currentRiasecData.lastRun).toLocaleString('de-DE') : 'N/A'}\n`;
    if (currentRiasecData.hollandCode) {
      content += `Holland-Code: ${currentRiasecData.hollandCode}${currentRiasecData.hollandType ? ` (${currentRiasecData.hollandType})` : ''}\n`;
    }
    content += `Interessen-Hierarchie: ${currentRiasecData.hierarchy.join(' > ')}\n\n`;
    content += `Ergebnistabelle:\n`;
    content += `Bereich (Label) | Kürzel | Ø Wert | Beschreibung\n`;
    content += `----------------- | ------ | ------ | ------------\n`;
    currentRiasecData.sortedScores.forEach(score => {
      content += `${score.label.padEnd(17)} | ${score.area.padEnd(6)} | ${score.value.toFixed(2).padEnd(6)} | ${RIASEC_DESCRIPTIONS[score.area].description}\n`;
    });
    content += `\n\n--- KI-BASIERTER KURZREPORT ---\n\n`;
    
    // Basic Markdown to Plain Text for Export
    let plainTextReport = currentRiasecData.report;
    plainTextReport = plainTextReport.replace(/^### (.*?)\s*$/gm, "--- $1 ---\n");
    plainTextReport = plainTextReport.replace(/^## (.*?)\s*$/gm, "\n=== $1 ===\n");
    plainTextReport = plainTextReport.replace(/^# (.*?)\s*$/gm, "\n==== $1 ====\n");
    plainTextReport = plainTextReport.replace(/\*\*(.*?)\*\*/g, "$1"); // Remove bold
    plainTextReport = plainTextReport.replace(/\*(.*?)\*/g, "$1");   // Remove italic
    plainTextReport = plainTextReport.replace(/^\s*[-*+]\s*(.*)/gm, "- $1"); // Normalize lists
    plainTextReport = plainTextReport.replace(/^\s*\d+\.\s*(.*)/gm, "  $1."); // Normalize ordered lists
    
    content += plainTextReport;


    if (exportTextAsFile(content, 'riasec_interessen_report.txt')) {
        showAppNotification("RIASEC Report als TXT exportiert.", "success");
    } else {
        showAppNotification("Fehler beim Exportieren des RIASEC Reports.", "error");
    }
  };
  
  const renderFormattedText = (text: string | undefined) => {
    if (!text) return <p className="text-slate-500 italic">Report-Inhalt nicht verfügbar.</p>;
    let html = text;
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold my-4 text-gray-800">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold my-3 text-gray-700">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium my-2 text-gray-700">$1</h3>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    html = html.replace(/^\s*[-*+] (.*(?:\n(?!^\s*[-*+])\s*.*)*)/gm, (match, itemContent) => {
      const lines = itemContent.split('\n').map((line: string) => line.trim()).filter((line: string) => line);
      return `<li class="ml-5 list-disc text-gray-700">${lines.join('<br/>')}</li>`;
    });
    html = html.replace(/(<\/li>\s*<li class="ml-5 list-disc)/g, '</li><li class="ml-5 list-disc'); 
    html = html.replace(/(?:<li class="ml-5 list-disc text-gray-700">.*?<\/li>\s*)+/gs, (match) => `<ul class="mb-3">${match}</ul>`);
    html = html.replace(/^\s*\d+\.\s+(.*(?:\n(?!^\s*\d+\.)\s*.*)*)/gm, (match, itemContent) => {
        const lines = itemContent.split('\n').map((line:string) => line.trim()).filter((line:string) => line);
        return `<li class="ml-5 list-decimal text-gray-700">${lines.join('<br/>')}</li>`;
    });
    html = html.replace(/(<\/li>\s*<li class="ml-5 list-decimal)/g, '</li><li class="ml-5 list-decimal');
    html = html.replace(/(?:<li class="ml-5 list-decimal text-gray-700">.*?<\/li>\s*)+/gs, (match) => `<ol class="mb-3">${match}</ol>`);
    html = html.split(/\n\s*\n/).map(p => 
        `<p class="mb-3 text-gray-700 leading-relaxed">${p.replace(/\n/g, '<br/>')}</p>`
    ).join('');
    html = html.replace(/<p><\/p>/g, ''); 
    html = html.replace(/<p><([uo]l class="mb-3">)/g, '<$1').replace(/<\/[uo]l><\/p>/g, '</$1>');
    return <div className="prose prose-sm sm:prose lg:prose-lg max-w-none report-content-print" dangerouslySetInnerHTML={{ __html: html }} />;
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
        <h1 className="text-4xl font-bold text-slate-800">RIASEC Interessen-Self-Check</h1>
        <p className="text-lg text-slate-600 mt-2">Entdecke Deine beruflichen Neigungen und Interessen.</p>
      </header>

      {view === 'intro' && (
        <div className="bg-sky-50 p-6 md:p-8 rounded-xl shadow-xl text-center">
          <h2 className="text-3xl font-bold text-sky-700 mb-4">Hallo von Dr. GoodWork!</h2>
          <img src="/dr_goodwork_avatar.png" alt="Dr. GoodWork" className="w-32 h-32 mx-auto rounded-full mb-4 shadow-md border-2 border-sky-200" />
          <p className="text-slate-700 text-lg mb-3 leading-relaxed">
            Schön, dass Du hier bist! Mit diesem kurzen Selbst-Check findest Du heraus, welche beruflichen Tätigkeiten und Umfelder am besten zu Deinen natürlichen Neigungen passen. Das RIASEC-Modell ist ein bewährtes Werkzeug, um Deine Interessen-Struktur besser zu verstehen.
          </p>
          <p className="text-slate-700 text-lg mb-6 leading-relaxed">
            Nimm Dir ein paar Minuten Zeit, beantworte die Fragen intuitiv und sei gespannt auf Deinen persönlichen Ergebnisreport. Dieser wird Dir wertvolle Hinweise für Deine weitere Karriereplanung geben. Los geht's!
          </p>
          <button
            onClick={startTest}
            className="px-8 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-md text-lg print:hidden"
          >
            Test starten
          </button>
        </div>
      )}

      {view === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm text-slate-600 bg-sky-50 p-4 rounded-lg shadow-sm">
            Bitte bewerte auf einer Skala von 1 (trifft gar nicht zu) bis 10 (trifft voll und ganz zu), inwieweit die folgenden Aussagen auf Dich zutreffen.
          </p>
          <div id="questionContainer" className="space-y-8">
            {shuffledQuestions.map((sq, displayIndex) => (
              <div key={sq.sliderId} className="p-5 border border-slate-200 rounded-xl shadow-lg bg-white">
                <label htmlFor={sq.sliderId} className="block text-md font-medium text-slate-700 mb-3">
                  {displayIndex + 1}. {sq.text}
                </label>
                <div className="flex items-center space-x-3 mt-2">
                  <input
                    type="range"
                    id={sq.sliderId}
                    name={sq.sliderId}
                    min="1"
                    max="10"
                    value={sliderValues[sq.sliderId]}
                    onChange={(e) => handleSliderChange(sq.sliderId, parseInt(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-lg font-semibold text-blue-700 w-10 text-right">{sliderValues[sq.sliderId]}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center pt-4 print:hidden">
            <button
              type="submit"
              disabled={isLoadingReport}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-wait flex items-center justify-center text-lg"
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

      {view === 'results' && currentRiasecData && (
        <section id="result" className="mt-8 p-4 md:p-6 bg-slate-50 rounded-xl shadow-xl">
          <h2 className="text-3xl font-bold mb-6 text-center text-blue-800">Dein RIASEC-Profil</h2>
          
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">Fehler: {error}</p>}

          <div className="overflow-x-auto mb-8 report-content-print">
            <table className="min-w-full bg-white shadow-lg rounded-lg text-sm">
              <thead className="bg-slate-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-slate-700">Bereich</th>
                  <th className="p-3 text-left font-semibold text-slate-700">Kürzel</th>
                  <th className="p-3 text-left font-semibold text-slate-700">Ø Wert</th>
                  <th className="p-3 text-left font-semibold text-slate-700 w-2/5 sm:w-1/2">Ausprägung</th>
                </tr>
              </thead>
              <tbody>
                {currentRiasecData.sortedScores.map(item => (
                  <tr key={item.area} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-slate-800">{item.label}</td>
                    <td className="p-3 text-slate-600">{item.area}</td>
                    <td className="p-3 text-slate-700 font-semibold">{item.value.toFixed(2)}</td>
                    <td className="p-3">
                      <div className="h-5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${item.value * 10}%`, backgroundColor: item.color }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="text-center my-6 p-4 bg-blue-100 rounded-lg shadow-md report-content-print">
            <p className="text-xl font-semibold text-blue-700">
                Deine Interessen-Hierarchie: <span className="font-bold">{currentRiasecData.hierarchy.join('  >  ')}</span>
            </p>
            {currentRiasecData.hollandCode && (
                <p className="text-lg font-medium text-blue-600 mt-1">
                    Dein Holland-Code: <span className="font-bold">{currentRiasecData.hollandCode}</span>
                    {currentRiasecData.hollandType && ` (${currentRiasecData.hollandType})`}
                </p>
            )}
          </div>

          {isLoadingReport && (
            <div className="flex flex-col items-center justify-center my-6 p-6 bg-white rounded-md shadow print:hidden">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
              <p className="mt-4 text-slate-600 text-lg">Dein persönlicher KI-Report wird generiert...</p>
            </div>
          )}
          
          {currentRiasecData.report && !isLoadingReport && (
            <details className="mt-8 p-4 md:p-6 bg-white rounded-xl shadow-lg printable-details-section" open>
              <summary className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b-2 border-slate-200 pb-3 cursor-pointer gap-2">
                 <h3 className="text-2xl font-semibold text-blue-700">Dein KI-basierter Kurzreport</h3>
                 <button
                    onClick={handleExportReport}
                    className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors shadow hover:shadow-md flex items-center gap-1.5 print:hidden self-start sm:self-center"
                    aria-label="Report als TXT-Datei exportieren"
                    title="Report als TXT exportieren"
                >
                    <DocumentTextIcon className="w-4 h-4" /> TXT Export
                </button>
              </summary>
              {renderFormattedText(currentRiasecData.report)}
            </details>
          )}

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 print:hidden">
            <button
              onClick={handleStartOverConfirmation}
              className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors shadow-md text-lg"
            >
              Test neu starten
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

export default RiasecToolPage;

 // Legacy CSS (can be removed if all styles are Tailwind or inline)
        /*
        .riasec-q-block { 
          padding: 1rem;
          border: 1px solid #e5e7eb; 
          border-radius: 0.5rem; 
          background-color: #f9fafb; 
          box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06); 
          margin-bottom: 1.5rem; 
        }
        .riasec-q-block label { 
          display: block;
          font-weight: 500; 
          color: #374151; 
          margin-bottom: 0.75rem; 
        }
        .riasec-slider-wrap { 
          display: flex;
          align-items: center;
        }
        .riasec-slider-wrap input[type="range"] {
          flex-grow: 1; 
          height: 0.5rem; 
          background-color: #d1d5db; 
          border-radius: 9999px; 
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;
        }
        .riasec-slider-wrap input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 1.25rem; 
          height: 1.25rem; 
          background-color: #2563eb; 
          border-radius: 9999px; 
          cursor: pointer;
        }
        .riasec-slider-wrap input[type="range"]::-moz-range-thumb {
          width: 1.25rem; 
          height: 1.25rem; 
          background-color: #2563eb; 
          border-radius: 9999px; 
          cursor: pointer;
          border: none;
        }
        .riasec-value { 
          min-width: 2.5rem; 
          text-align: right;
          font-weight: 600; 
          color: #1d4ed8; 
          margin-left: 1rem; 
        }
        .riasec-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5rem;
        }
        .riasec-table th, .riasec-table td {
          border: 1px solid #e5e7eb;
          padding: 0.75rem;
          text-align: left;
        }
        .riasec-table th {
          background-color: #f3f4f6;
        }
        .riasec-bar {
          height: 1.25rem; 
          background-color: #e5e7eb;
          border-radius: 0.25rem;
          overflow: hidden;
        }
        .riasec-bar span {
          display: block;
          height: 100%;
          border-radius: 0.25rem;
        }
        .riasec-results-section .prose strong { color: inherit; } 
        .riasec-results-section .prose em { color: inherit; }
        .riasec-results-section .prose h1, 
        .riasec-results-section .prose h2, 
        .riasec-results-section .prose h3 {
          color: #1f2937; 
        }
        .riasec-results-section .prose p, 
        .riasec-results-section .prose li {
          color: #374151; 
        }
        */
      
 // Print-specific styles are in index.html via .report-content-print
      
