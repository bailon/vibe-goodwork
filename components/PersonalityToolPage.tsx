
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ProfileData, 
    PersonalityScreeningData, 
    PersonalityAdjectiveData, 
    BigFiveTraitScore,
    BigFiveDimensionScore,
} from '../types';
import { 
    GENERAL_PERSONALITY_ADJECTIVES,
    BIG_FIVE_TRAITS_CONFIG, 
    BIG_FIVE_DIMENSION_DEFINITIONS 
} from '../constants';
import { getPersonalityReport } from '../services/geminiService';
import DocumentTextIcon from './icons/DocumentTextIcon';
import { exportTextAsFile } from '../services/exportService';

interface PersonalityToolPageProps {
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  onNavigateHome: () => void; 
  showAppNotification: (message?: string, type?: 'success' | 'info' | 'error', duration?: number) => void;
}

interface ShuffledBigFiveAdjective {
  id: string; 
  text: string;
}

const ADJECTIVE_RATING_SCALE_MIN = 1;
const ADJECTIVE_RATING_SCALE_MAX = 10;
const ADJECTIVE_RATING_SCALE_NEUTRAL = Math.ceil((ADJECTIVE_RATING_SCALE_MIN + ADJECTIVE_RATING_SCALE_MAX) / 2);


const PersonalityToolPage: React.FC<PersonalityToolPageProps> = ({
  profileData,
  setProfileData,
  onNavigateHome,
  showAppNotification,
}) => {
  const initialBigFiveSliderValues = useMemo(() => 
    BIG_FIVE_TRAITS_CONFIG.reduce((acc, trait) => {
      acc[trait.id] = ADJECTIVE_RATING_SCALE_NEUTRAL;
      return acc;
    }, {} as PersonalityAdjectiveData), 
  []);

  const [currentPart, setCurrentPart] = useState<'intro' | 'generalAdjectiveSelection' | 'bigFiveRating' | 'results'>('intro');
  const [userSelectedGeneralAdjectives, setUserSelectedGeneralAdjectives] = useState<Set<string>>(new Set());
  const [bigFiveSliderValues, setBigFiveSliderValues] = useState<PersonalityAdjectiveData>(initialBigFiveSliderValues);
  
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [currentPersonalityData, setCurrentPersonalityData] = useState<PersonalityScreeningData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [shuffledBigFiveAdjectives, setShuffledBigFiveAdjectives] = useState<ShuffledBigFiveAdjective[]>([]);

  useEffect(() => {
    const screeningData = profileData.personalityScreening;

    // If user is actively in the form, don't interfere unless a new complete report arrives from outside
    // or the screeningData itself becomes null (e.g. full profile reset)
    if (currentPart === 'generalAdjectiveSelection' || currentPart === 'bigFiveRating') {
      if (!screeningData) { // Handle case where profileData.personalityScreening is cleared entirely
        setCurrentPart('intro');
        setUserSelectedGeneralAdjectives(new Set());
        setBigFiveSliderValues(initialBigFiveSliderValues);
        setCurrentPersonalityData(null);
        return;
      }
      if (screeningData?.lastRun && screeningData?.report && screeningData !== currentPersonalityData) {
        // A new full report was generated elsewhere or loaded, reflect it.
        setCurrentPersonalityData(screeningData);
        setUserSelectedGeneralAdjectives(new Set(screeningData.selectedGeneralAdjectives || []));
        setBigFiveSliderValues(screeningData.adjectiveScores ? { ...initialBigFiveSliderValues, ...screeningData.adjectiveScores } : initialBigFiveSliderValues);
        setCurrentPart('results');
      }
      return; 
    }
    
    if (screeningData) {
      setCurrentPersonalityData(screeningData); // Store the loaded data
      setUserSelectedGeneralAdjectives(new Set(screeningData.selectedGeneralAdjectives || []));
      setBigFiveSliderValues(screeningData.adjectiveScores ? { ...initialBigFiveSliderValues, ...screeningData.adjectiveScores } : initialBigFiveSliderValues);

      // Determine current part based on loaded data
      if (screeningData.lastRun && screeningData.report) {
        setCurrentPart('results');
      } else if (screeningData.selectedGeneralAdjectives && screeningData.selectedGeneralAdjectives.length > 0) {
        // General adjectives are selected. Now check Big Five scores.
        if (screeningData.adjectiveScores) {
            // Sliders were filled (or at least scores exist), but no full report. Show results (which handles missing report).
            setCurrentPart('results');
        } else {
            // Sliders not filled yet. Go to Big Five rating step.
            setCurrentPart('bigFiveRating');
            if (shuffledBigFiveAdjectives.length === 0) {
                const adjectivesToShuffle = BIG_FIVE_TRAITS_CONFIG.map(trait => ({ id: trait.id, text: trait.adjective }));
                setShuffledBigFiveAdjectives(adjectivesToShuffle.sort(() => Math.random() - 0.5));
            }
        }
      } else {
          // No general adjectives selected (or array is empty), or other incomplete states not leading to results/rating.
          // Default to the first step of the form if any screening data exists.
          setCurrentPart('generalAdjectiveSelection');
      }
    } else { // screeningData is null/undefined in profile
      setCurrentPart('intro');
      setUserSelectedGeneralAdjectives(new Set());
      setBigFiveSliderValues(initialBigFiveSliderValues);
      setCurrentPersonalityData(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData.personalityScreening, initialBigFiveSliderValues]);
  

  const startTest = () => {
    setUserSelectedGeneralAdjectives(new Set());
    setBigFiveSliderValues(initialBigFiveSliderValues);
    setCurrentPersonalityData(null); 
    setError(null);
    
    const adjectivesToShuffle = BIG_FIVE_TRAITS_CONFIG.map(trait => ({
      id: trait.id,
      text: trait.adjective
    }));
    setShuffledBigFiveAdjectives(adjectivesToShuffle.sort(() => Math.random() - 0.5));
    
    setCurrentPart('generalAdjectiveSelection');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleStartOverConfirmation = () => {
    if (window.confirm("Möchtest Du das Screening wirklich neu starten? Deine aktuellen Ergebnisse werden überschrieben, sobald Du das neue Screening auswertest.")) {
        setProfileData(prev => ({
            ...prev,
            personalityScreening: { 
                selectedGeneralAdjectives: [],
                adjectiveScores: undefined,
                traitScores: undefined,
                bigFiveScores: undefined,
                report: undefined,
                lastRun: undefined,
            }
        }));
        startTest(); 
        showAppNotification("Screening wird neu gestartet. Bitte wähle Deine Eigenschaften.", "info");
    }
  };

  const handleToggleGeneralAdjective = (adjective: string) => {
    setUserSelectedGeneralAdjectives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(adjective)) {
        newSet.delete(adjective);
      } else {
        newSet.add(adjective);
      }
      return newSet;
    });
  };

  const proceedToBigFiveRating = () => {
    if (shuffledBigFiveAdjectives.length === 0) {
      const adjectivesToShuffle = BIG_FIVE_TRAITS_CONFIG.map(trait => ({
        id: trait.id,
        text: trait.adjective
      }));
      setShuffledBigFiveAdjectives(adjectivesToShuffle.sort(() => Math.random() - 0.5));
    }
    
    const selectedAdjArray = Array.from(userSelectedGeneralAdjectives);
    // Persist selected adjectives before moving to next part
    setProfileData(prev => ({ 
        ...prev,
        personalityScreening: {
            ...(prev.personalityScreening || { 
                selectedGeneralAdjectives: [], 
                adjectiveScores: undefined,
                traitScores: undefined,
                bigFiveScores: undefined,
                report: undefined,
                lastRun: undefined,
            }),
            selectedGeneralAdjectives: selectedAdjArray,
            adjectiveScores: prev.personalityScreening?.adjectiveScores, 
            traitScores: prev.personalityScreening?.traitScores,
            bigFiveScores: prev.personalityScreening?.bigFiveScores,
            report: prev.personalityScreening?.report, // Keep existing report/lastRun if user is just re-doing parts
            lastRun: prev.personalityScreening?.lastRun,
        }
    }));
    setCurrentPart('bigFiveRating'); 
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleBigFiveSliderChange = (adjectiveId: string, value: number) => {
    setBigFiveSliderValues(prev => ({ ...prev, [adjectiveId]: value }));
  };

  const calculateBigFiveScores = (): Omit<PersonalityScreeningData, 'report' | 'lastRun' | 'selectedGeneralAdjectives'> => {
    const traitScores: BigFiveTraitScore[] = BIG_FIVE_TRAITS_CONFIG.map(config => {
      const rawScore = bigFiveSliderValues[config.id] === undefined ? ADJECTIVE_RATING_SCALE_NEUTRAL : bigFiveSliderValues[config.id];
      const normalizedScore = config.pole === '-' ? (ADJECTIVE_RATING_SCALE_MAX + ADJECTIVE_RATING_SCALE_MIN - rawScore) : rawScore;
      return {
        traitId: config.id,
        adjective: config.adjective,
        score: rawScore,
        normalizedScore,
        dimension: config.dimension,
        pole: config.pole,
      };
    });

    const dimensionScores: BigFiveDimensionScore[] = BIG_FIVE_DIMENSION_DEFINITIONS.map(dimDef => {
      const relevantTraits = traitScores.filter(ts => ts.dimension === dimDef.dimension);
      const positivePoleAssociatedTraits = relevantTraits.filter(t => t.pole === '+');
      const negativePoleAssociatedTraits = relevantTraits.filter(t => t.pole === '-');

      const positivePoleScoreValue = positivePoleAssociatedTraits.length > 0 
        ? positivePoleAssociatedTraits.reduce((sum, t) => sum + t.score, 0) / positivePoleAssociatedTraits.length
        : ADJECTIVE_RATING_SCALE_NEUTRAL;

      const negativePoleScoreValue = negativePoleAssociatedTraits.length > 0
        ? negativePoleAssociatedTraits.reduce((sum, t) => sum + t.score, 0) / negativePoleAssociatedTraits.length
        : ADJECTIVE_RATING_SCALE_NEUTRAL;

      const dimensionTotalNormalizedScore = relevantTraits.reduce((sum, t) => sum + t.normalizedScore, 0);
      const overallDimensionScore = relevantTraits.length > 0 ? dimensionTotalNormalizedScore / relevantTraits.length : ADJECTIVE_RATING_SCALE_NEUTRAL;
      
      let posLabel = `Hohe ${dimDef.label}`, negLabel = `Niedrige ${dimDef.label}`;
      if (dimDef.dimension === 'E') { posLabel = 'Extraversion'; negLabel = 'Introversion'; }
      if (dimDef.dimension === 'N') { posLabel = 'Neurotizismus (Emotionale Labilität)'; negLabel = 'Emotionale Stabilität (Gelassenheit)'; }
      if (dimDef.dimension === 'O') { posLabel = 'Offenheit'; negLabel = 'Traditionsbewusstsein/Konventionalität';} 
      if (dimDef.dimension === 'A') { posLabel = 'Verträglichkeit'; negLabel = 'Wettbewerbsorientierung/Kritische Haltung';} 
      if (dimDef.dimension === 'C') { posLabel = 'Gewissenhaftigkeit'; negLabel = 'Spontanität/Flexibilität';}


      return {
        dimension: dimDef.dimension,
        label: dimDef.label,
        score: overallDimensionScore,
        positivePole: { poleLabel: posLabel, score: positivePoleScoreValue, color: dimDef.color },
        negativePole: { poleLabel: negLabel, score: negativePoleScoreValue, color: dimDef.color },
        description: dimDef.description,
        color: dimDef.color,
      };
    });

    return {
      adjectiveScores: { ...bigFiveSliderValues },
      traitScores,
      bigFiveScores: dimensionScores,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoadingReport(true);
    showAppNotification("Deine Ergebnisse werden ausgewertet und der KI-Report wird generiert...", "info", 4000);

    const bigFiveCalculatedData = calculateBigFiveScores();
    const finalSelectedGeneralAdjectives = Array.from(userSelectedGeneralAdjectives);

    // Prepare a temporary profileData that includes the latest user selections and calculations for the AI
    const tempProfileDataForAI: ProfileData = {
        ...profileData,
        personalityScreening: { // This structure is what getPersonalityReport expects for context
            ...(profileData.personalityScreening || {}), // Keep other unrelated profile data
            selectedGeneralAdjectives: finalSelectedGeneralAdjectives,
            bigFiveScores: bigFiveCalculatedData.bigFiveScores,
            // Include raw adjective scores if the AI needs them, though typically it uses processed BigFiveScores
            adjectiveScores: bigFiveCalculatedData.adjectiveScores, 
            traitScores: bigFiveCalculatedData.traitScores, // Also potentially useful for AI context
        }
    };
    
    try {
      const { reportText } = await getPersonalityReport(
        bigFiveCalculatedData.bigFiveScores!, // Ensure bigFiveScores is passed
        tempProfileDataForAI, // Pass the augmented profileData for full context
        ADJECTIVE_RATING_SCALE_MAX, 
        ADJECTIVE_RATING_SCALE_NEUTRAL
      );
      
      const newPersonalityData: PersonalityScreeningData = {
        selectedGeneralAdjectives: finalSelectedGeneralAdjectives,
        ...bigFiveCalculatedData,
        report: reportText,
        lastRun: new Date().toISOString(),
      };
      setCurrentPersonalityData(newPersonalityData); // Update local state for immediate display
      setProfileData(prev => ({ ...prev, personalityScreening: newPersonalityData })); // Persist to global profile
      setCurrentPart('results');
      showAppNotification("Dein Persönlichkeitsreport wurde erfolgreich generiert und im Profil gespeichert!", "success");
    } catch (e: any) {
      console.error("Fehler beim Generieren des Persönlichkeitsreports:", e);
      setError(`Fehler beim Generieren des Reports: ${e.message}`);
      showAppNotification(`Fehler beim Generieren des Reports: ${e.message}`, "error");
      const fallbackData: PersonalityScreeningData = {
        selectedGeneralAdjectives: finalSelectedGeneralAdjectives,
        ...bigFiveCalculatedData,
        lastRun: new Date().toISOString(),
        report: `Fehler beim Laden des Reports: ${e.message}`
      };
      setCurrentPersonalityData(fallbackData);
      setProfileData(prev => ({ ...prev, personalityScreening: fallbackData }));
      setCurrentPart('results'); 
    } finally {
      setIsLoadingReport(false);
    }
  };
  
  const handleExportReport = () => {
    if (!currentPersonalityData) {
      showAppNotification("Keine Daten zum Exportieren vorhanden.", "info");
      return;
    }
    let reportContent = `Meine Persönlichkeit und Eigenschaften - Report\n`;
    reportContent += `Test durchgeführt am: ${currentPersonalityData.lastRun ? new Date(currentPersonalityData.lastRun).toLocaleString('de-DE') : 'N/A'}\n\n`;

    if (currentPersonalityData.selectedGeneralAdjectives && currentPersonalityData.selectedGeneralAdjectives.length > 0) {
      reportContent += `Von Dir ausgewählte allgemeine Eigenschaften:\n- ${currentPersonalityData.selectedGeneralAdjectives.join('\n- ')}\n\n`;
    }

    if (currentPersonalityData.bigFiveScores) {
        reportContent += `Big Five Ergebnisübersicht (Skala ${ADJECTIVE_RATING_SCALE_MIN}-${ADJECTIVE_RATING_SCALE_MAX}, Neutral: ${ADJECTIVE_RATING_SCALE_NEUTRAL}):\n`;
        currentPersonalityData.bigFiveScores.forEach(dim => {
        reportContent += `Dimension: ${dim.label} (${dim.dimension})\n`;
        reportContent += `  Gesamtscore (Tendenz): ${dim.score.toFixed(2)}\n`;
        reportContent += `  Ausprägung ${dim.positivePole.poleLabel}: ${dim.positivePole.score.toFixed(2)}\n`;
        reportContent += `  Ausprägung ${dim.negativePole.poleLabel}: ${dim.negativePole.score.toFixed(2)}\n\n`;
        });
    }
    
    if (currentPersonalityData.report) {
      reportContent += `\n\n--- KI-BASIERTER PERSÖNLICHKEITSREPORT ---\n\n`;
      let plainTextReport = currentPersonalityData.report;
      plainTextReport = plainTextReport.replace(/### (.*?)\n/g, "$1\n");
      plainTextReport = plainTextReport.replace(/## (.*?)\n/g, "$1\n\n");
      plainTextReport = plainTextReport.replace(/\*\*(.*?)\*\*/g, "$1");
      plainTextReport = plainTextReport.replace(/\*(.*?)\*/g, "$1");
      plainTextReport = plainTextReport.replace(/^\s*[-*+] (.*)/gm, " - $1");
      reportContent += plainTextReport;
    }

    if(exportTextAsFile(reportContent, 'meine_persoenlichkeit_eigenschaften_report.txt')) {
        showAppNotification("Report 'Meine Persönlichkeit und Eigenschaften' als TXT exportiert.", "success");
    } else {
        showAppNotification("Fehler beim Exportieren des Persönlichkeitsreports.", "error");
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

  const getBriefInterpretation = (dim: BigFiveDimensionScore): string => {
    let interpretation = "";
    const isHigh = dim.score > ADJECTIVE_RATING_SCALE_NEUTRAL + 1.5; 
    const isLow = dim.score < ADJECTIVE_RATING_SCALE_NEUTRAL - 1.5; 

    if (isHigh) {
      interpretation = `Ihre Ausprägung für ${dim.label} ist eher hoch. Dies deutet darauf hin, dass Sie tendenziell Merkmale des Pols "${dim.positivePole.poleLabel}" zeigen.`;
    } else if (isLow) {
      interpretation = `Ihre Ausprägung für ${dim.label} ist eher niedrig. Dies deutet darauf hin, dass Sie tendenziell Merkmale des Pols "${dim.negativePole.poleLabel}" zeigen.`;
    } else { 
      interpretation = `Ihre Ausprägung für ${dim.label} ist im mittleren Bereich. Dies deutet auf eine ausgewogene Mischung von Merkmalen der Pole "${dim.positivePole.poleLabel}" und "${dim.negativePole.poleLabel}" hin.`;
    }
    return interpretation;
  };


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-xl shadow-2xl mt-8">
       <style>{`
        /* Add any specific styles needed for this page if Tailwind isn't enough */
        .adjective-chip {
          padding: 0.5rem 1rem;
          border-radius: 9999px; /* pill shape */
          border: 1px solid #d1d5db; /* gray-300 */
          background-color: white;
          color: #374151; /* gray-700 */
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          font-size: 0.875rem; /* text-sm */
          text-align: center;
        }
        .adjective-chip:hover {
          border-color: #f87171; /* red-400 */
          background-color: #fef2f2; /* red-50 */
        }
        .adjective-chip.selected {
          background-color: #ef4444; /* red-500 */
          color: white;
          border-color: #dc2626; /* red-600 */
        }
        .personality-slider-wrap input[type="range"] {
          width: calc(100% - 3rem); /* Adjust width to make space for value display */
          margin-right: 1rem;
          vertical-align: middle;
        }
        .personality-slider-wrap .personality-value {
          display: inline-block;
          width: 2rem; /* Fixed width for value */
          text-align: right;
          font-weight: bold;
          vertical-align: middle;
          color: #c026d3; /* purple-600 */
        }
        .personality-bar-container {
            height: 1rem; /* 16px */
            width: 100%;
            background-color: #e5e7eb; /* gray-200 */
            border-radius: 0.25rem; /* 4px */
            overflow: hidden; /* Ensures the inner bar respects the border radius */
        }
        .personality-bar {
            height: 100%;
            border-radius: 0.25rem; /* Match container for smooth look */
            transition: width 0.3s ease-in-out;
        }
        .pole-text-normal { color: #4b5563; /* gray-600 */ }
        .pole-text-dominant { font-weight: 600; /* semibold */ }
      `}</style>

      <button
        onClick={onNavigateHome}
        className="mb-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow hover:shadow-md text-sm print:hidden"
      >
        Zurück zum Identitätsprofil
      </button>

      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-800">Meine Persönlichkeit und Eigenschaften</h1>
        <p className="text-lg text-slate-600 mt-2">Erfahre mehr über Deine grundlegenden Persönlichkeitsmerkmale.</p>
      </header>

      {currentPart === 'intro' && (
        <div className="bg-red-50 p-6 md:p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-3xl font-bold text-red-700 mb-4">Entdecke Deine Persönlichkeit!</h2>
          <img src="/dr_goodwork_avatar.png" alt="Dr. GoodWork" className="w-32 h-32 mx-auto rounded-full mb-4 shadow-md border-2 border-red-200" />
          <p className="text-slate-700 text-lg mb-3 leading-relaxed">
            Dieses Screening besteht aus zwei Teilen:
            <ol className="list-decimal list-inside text-left my-2 mx-auto max-w-md">
                <li><strong>Allgemeine Eigenschaften:</strong> Wähle aus einer Liste von Adjektiven diejenigen aus, die Du mit Dir verbindest.</li>
                <li><strong>Big Five Bewertung:</strong> Bewerte spezifische Eigenschaften auf einer Skala, um Dein Profil nach dem Big Five Modell zu erstellen.</li>
            </ol>
          </p>
          <p className="text-slate-700 text-lg mb-6 leading-relaxed">
            Sei ehrlich zu Dir selbst – es gibt keine richtigen oder falschen Antworten. Dein Ergebnisprofil und ein darauf basierender KI-Report helfen Dir, Deine Stärken und Potenziale besser zu verstehen.
          </p>
          <button
            onClick={startTest}
            className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md text-lg print:hidden"
          >
            Screening starten
          </button>
        </div>
      )}

      {currentPart === 'generalAdjectiveSelection' && (
        <div className="p-4 md:p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-red-700 mb-2">Teil 1: Allgemeine Eigenschaften</h2>
          <p className="text-slate-600 mb-6">Wähle die Adjektive aus der folgenden Liste aus, die Deiner Meinung nach gut zu Dir passen. Klicke einfach auf ein Wort, um es auszuwählen oder die Auswahl aufzuheben.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
            {GENERAL_PERSONALITY_ADJECTIVES.map(adj => (
              <button
                key={adj}
                onClick={() => handleToggleGeneralAdjective(adj)}
                className={`adjective-chip ${userSelectedGeneralAdjectives.has(adj) ? 'selected' : ''}`}
              >
                {adj}
              </button>
            ))}
          </div>
          <div className="flex justify-center print:hidden">
            <button
              onClick={proceedToBigFiveRating}
              className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md text-lg"
            >
              Weiter zum Big Five Screening
            </button>
          </div>
        </div>
      )}

      {currentPart === 'bigFiveRating' && (
        <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-red-700 mb-2">Teil 2: Big Five Eigenschaften-Bewertung</h2>
          <p className="text-sm text-slate-600 bg-red-50 p-3 rounded-md">
            Bewerte nun auf einer Skala von {ADJECTIVE_RATING_SCALE_MIN} (trifft gar nicht zu) bis {ADJECTIVE_RATING_SCALE_MAX} (trifft voll und ganz zu), inwieweit die folgenden spezifischen Eigenschaften auf Dich zutreffen.
          </p>
          <div id="adjectiveContainer" className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            {shuffledBigFiveAdjectives.map((adj, displayIndex) => (
              <div key={adj.id} className="personality-q-block p-4 border border-slate-200 rounded-lg shadow-sm bg-white">
                <label htmlFor={adj.id} className="text-slate-700">
                  {displayIndex + 1}. Ich bin eher: <strong>{adj.text}</strong>
                </label>
                <div className="personality-slider-wrap mt-2 flex items-center">
                  <input
                    type="range"
                    id={adj.id}
                    name={adj.id}
                    min={ADJECTIVE_RATING_SCALE_MIN}
                    max={ADJECTIVE_RATING_SCALE_MAX}
                    value={bigFiveSliderValues[adj.id] === undefined ? ADJECTIVE_RATING_SCALE_NEUTRAL : bigFiveSliderValues[adj.id]}
                    onChange={(e) => handleBigFiveSliderChange(adj.id, parseInt(e.target.value))}
                    className="w-full accent-purple-600" // Use accent for slider color
                  />
                  <span className="personality-value ml-3 text-purple-700 w-8 text-right">{bigFiveSliderValues[adj.id] === undefined ? ADJECTIVE_RATING_SCALE_NEUTRAL : bigFiveSliderValues[adj.id]}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 print:hidden">
             <button
                type="button"
                onClick={() => setCurrentPart('generalAdjectiveSelection')}
                className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors shadow-md text-lg"
            >
                Zurück zur Adjektivauswahl
            </button>
            <button
              type="submit"
              disabled={isLoadingReport}
              className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-wait flex items-center justify-center text-lg"
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

      {currentPart === 'results' && currentPersonalityData && (
        <section id="result" className="personality-results-section mt-8 p-4 md:p-6 bg-slate-50 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-center text-red-800">Meine Persönlichkeit und Eigenschaften – Dein Ergebnisprofil</h2>
          
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">Fehler: {error}</p>}

          {currentPersonalityData.selectedGeneralAdjectives && currentPersonalityData.selectedGeneralAdjectives.length > 0 && (
            <div className="mb-8 p-4 bg-white rounded-lg shadow border-l-4 border-red-500 report-content-print"> 
              <h3 className="text-xl font-semibold text-red-700 mb-3">Deine ausgewählten allgemeinen Eigenschaften:</h3>
              <div className="flex flex-wrap gap-2 print:hidden">
                {currentPersonalityData.selectedGeneralAdjectives.map(adj => (
                  <span key={adj} className="adjective-chip selected !cursor-default">
                    {adj}
                  </span>
                ))}
              </div>
               <ul className="list-disc list-inside text-sm text-slate-700 columns-2 sm:columns-3 hidden print:block">
                  {currentPersonalityData.selectedGeneralAdjectives.map(adj => <li key={adj}>{adj}</li>)}
              </ul>
            </div>
          )}

          {currentPersonalityData.bigFiveScores && currentPersonalityData.bigFiveScores.length > 0 && (
            <div className="space-y-6 mb-8 report-content-print"> 
                <h3 className="text-xl font-semibold text-red-700 mb-1 mt-6">Dein Big Five Profil:</h3>
                {currentPersonalityData.bigFiveScores.map(dim => {
                  const positivePoleDominant = dim.positivePole.score >= dim.negativePole.score;
                  return (
                    <div key={dim.dimension} className="p-4 bg-white rounded-lg shadow border-l-4" style={{ borderColor: dim.color }}>
                        <h4 className="text-lg font-semibold mb-1" style={{ color: dim.color }}>{dim.label} ({dim.dimension})</h4>
                        <p className="text-sm text-slate-600">
                            Gesamtscore (Tendenz): <strong className="text-slate-800">{dim.score.toFixed(2)} / {ADJECTIVE_RATING_SCALE_MAX}</strong>
                        </p>
                        <div className="personality-bar-container my-2 print:hidden"> 
                        <div 
                            className="personality-bar" 
                            style={{ width: `${(dim.score / ADJECTIVE_RATING_SCALE_MAX) * 100}%`, backgroundColor: dim.color }}
                        ></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-2">
                            <div>
                                <span 
                                    className={positivePoleDominant ? 'pole-text-dominant' : 'pole-text-normal'}
                                    style={positivePoleDominant ? {color: dim.color} : {}}
                                >
                                    {dim.positivePole.poleLabel}: 
                                </span> 
                                <strong className={`text-slate-800 ${positivePoleDominant ? 'font-bold' : ''}`}>
                                    {dim.positivePole.score.toFixed(2)}
                                </strong>
                            </div>
                            <div className="sm:text-right">
                                <span 
                                    className={!positivePoleDominant ? 'pole-text-dominant' : 'pole-text-normal'}
                                     style={!positivePoleDominant ? {color: dim.color} : {}}
                                >
                                    {dim.negativePole.poleLabel}:
                                </span>
                                <strong className={`text-slate-800 ${!positivePoleDominant ? 'font-bold' : ''}`}>
                                    {dim.negativePole.score.toFixed(2)}
                                </strong>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 mt-3 bg-stone-50 p-2 rounded border border-stone-200">
                            <em>Kurzinterpretation:</em> {getBriefInterpretation(dim)}
                        </p>
                    </div>
                  );
                })}
            </div>
          )}
          
          {isLoadingReport && (
            <div className="flex flex-col items-center justify-center my-6 p-6 bg-white rounded-md shadow print:hidden">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-500"></div>
              <p className="mt-4 text-slate-600 text-lg">Dein persönlicher KI-Report wird generiert...</p>
            </div>
          )}
          
          {currentPersonalityData.report && !isLoadingReport && (
            <details className="mt-8 p-4 md:p-6 bg-white rounded-md shadow printable-details-section" open> 
              <summary className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-3 gap-2 cursor-pointer">
                 <h3 className="text-2xl font-semibold" style={{color: BIG_FIVE_DIMENSION_DEFINITIONS[0]?.color || '#B91C1C'}}>Dein KI-basierter Persönlichkeitsreport</h3>
                 <button
                    onClick={handleExportReport}
                    className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors shadow hover:shadow-md flex items-center gap-1.5 shrink-0 print:hidden"
                    aria-label="Report als TXT-Datei exportieren"
                    title="Report als TXT exportieren"
                >
                    <DocumentTextIcon className="w-4 h-4" /> TXT Export
                </button>
              </summary>
              {renderFormattedText(currentPersonalityData.report)}
            </details>
          )}

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 print:hidden">
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

export default PersonalityToolPage;
