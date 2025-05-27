
import React, { useState, useEffect, useCallback } from 'react';
import {
  getValouAreas,
  INITIAL_USER_DATA,
  EXAMPLE_USER_DATA,
  CATEGORY_LABELS,
} from '../constants';
import {
  ProfileData,
  UserDataCollection,
  UserDataCategoryKey,
  ValouAreaItem,
  StylingSentenceLoadingState,
  CategorySuggestionLoadingState,
  CategorySuggestionItem
} from '../types';
import ValouAreaNavigation from './ValouAreaNavigation';
import ValouAreaCard from './ValouAreaCard';
import SummaryView from './SummaryView';
import ProgressOverview from './ProgressOverview';
import ActionButtons from './ActionButtons';
import ValouIntroScreen from './ValouIntroScreen'; 
import { 
  getStylingSentenceSuggestion, 
  getSuggestionsForCategoryItems,
  generateKiStylingForAllAreas
} from '../services/geminiService';
import { 
    generateTxtContentForValou, 
    isValouDataEffectivelyEmpty, 
    isProfileDataSufficientForKiStyling,
    // isIdentityProfileEmpty // This was not actively used, can be removed or imported from appUtils if needed
} from '../appUtils'; // Updated import path
import { exportTextAsFile } from '../services/exportService';


interface ValouStylingToolPageProps {
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  onNavigateHome: () => void; // This will navigate to 'toolsOverview'
  onGetAiRecommendation: () => void; 
  showAppNotification: (message?: string, type?: 'success' | 'info' | 'error', duration?: number) => void;
  onGenerateValouSummary: () => Promise<void>;
  renderFormattedText: (text: string | undefined, defaultText?: string) => JSX.Element | null;
}

const ValouStylingToolPage: React.FC<ValouStylingToolPageProps> = ({
  profileData,
  setProfileData,
  onNavigateHome,
  onGetAiRecommendation,
  showAppNotification,
  onGenerateValouSummary,
  renderFormattedText,
}) => {
  const valouAreas = getValouAreas();
  const [activeAreaId, setActiveAreaId] = useState<string>(valouAreas[0].id);
  const [currentInternalView, setCurrentInternalView] = useState<'intro' | 'summary' | 'editor'>('intro'); 
  
  const [activeNewItemCategory, setActiveNewItemCategory] = useState<UserDataCategoryKey | null>(null);
  const [newItemText, setNewItemText] = useState<string>('');
  
  const [stylingSentenceLoading, setStylingSentenceLoading] = useState<StylingSentenceLoadingState>(null);
  const [categorySuggestionLoading, setCategorySuggestionLoading] = useState<CategorySuggestionLoadingState>(null);
  const [currentCategorySuggestions, setCurrentCategorySuggestions] = useState<CategorySuggestionItem | null>(null);
  const [isKiStylingInProgress, setIsKiStylingInProgress] = useState<boolean>(false);

  const valouData = profileData.valouZielstylingData || INITIAL_USER_DATA;

  const handleValouDataChange = (newValouData: UserDataCollection) => {
    setProfileData(prev => ({
      ...prev,
      valouZielstylingData: newValouData,
    }));
  };

  const handleStylingSatzChange = (areaId: string, value: string) => {
    const newData = { ...valouData, [areaId]: { ...valouData[areaId], stylingSatz: value } };
    handleValouDataChange(newData);
  };

  const handleAddItem = (areaId: string, category: UserDataCategoryKey, item: string) => {
    const currentItems = valouData[areaId]?.[category] || [];
    if (item.trim() && !currentItems.includes(item.trim())) {
      const newData = {
        ...valouData,
        [areaId]: {
          ...valouData[areaId],
          [category]: [...currentItems, item.trim()],
        },
      };
      handleValouDataChange(newData);
    }
  };

  const handleRemoveItem = (areaId: string, category: UserDataCategoryKey, index: number) => {
    const currentItems = valouData[areaId]?.[category] || [];
    const updatedItems = currentItems.filter((_, i) => i !== index);
    const newData = {
      ...valouData,
      [areaId]: { ...valouData[areaId], [category]: updatedItems },
    };
    handleValouDataChange(newData);
  };

  const handleGenerateStylingSentence = async (areaId: string) => {
    const area = valouAreas.find(a => a.id === areaId);
    if (!area || !valouData[areaId]) return;
    setStylingSentenceLoading(areaId);
    try {
      const suggestion = await getStylingSentenceSuggestion(area.name, area.description, valouData[areaId], profileData);
      if (!suggestion.startsWith("Fehler:")) {
        handleStylingSatzChange(areaId, suggestion);
        showAppNotification("KI-Stylingsatz für Dich generiert!");
      } else {
        showAppNotification(suggestion, "error");
      }
    } catch (e: any) {
      showAppNotification(`Fehler beim Generieren Deines Stylingsatzes: ${e.message}`, "error");
    } finally {
      setStylingSentenceLoading(null);
    }
  };
  
  const handleGenerateCategorySuggestions = async (areaId: string, category: UserDataCategoryKey) => {
    const area = valouAreas.find(a => a.id === areaId);
    if (!area || !valouData[areaId]) return;
    setCategorySuggestionLoading({ areaId, category });
    setCurrentCategorySuggestions(null);
    try {
      const suggestions = await getSuggestionsForCategoryItems(
        area.name, 
        area.description, 
        area.tipps, 
        category, 
        valouData[areaId][category], 
        profileData
      );
      setCurrentCategorySuggestions({ list: suggestions, areaId, category });
      if (suggestions.length > 0) {
        showAppNotification(`KI-Vorschläge für ${CATEGORY_LABELS[category]} geladen.`);
      } else {
        showAppNotification(`Keine spezifischen KI-Vorschläge für ${CATEGORY_LABELS[category]} für Dich gefunden.`, "info");
      }
    } catch (e: any) {
       showAppNotification(`Fehler bei Deinen KI-Vorschlägen: ${e.message}`, "error");
    } finally {
      setCategorySuggestionLoading(null);
    }
  };

  const handleClearCategorySuggestions = (areaId: string, category: UserDataCategoryKey) => {
    if (currentCategorySuggestions?.areaId === areaId && currentCategorySuggestions?.category === category) {
      setCurrentCategorySuggestions(null);
    }
  };

  const canLoadExampleValouData = isValouDataEffectivelyEmpty(valouData);
  const canUseKiStylingForValou = isProfileDataSufficientForKiStyling(profileData);

  const handleLoadExampleValouData = () => {
    if (canLoadExampleValouData) {
        if (window.confirm("Möchtest Du die Beispieldaten für das Valou Styling laden? Deine aktuellen Valou-Einträge werden überschrieben. Dein Hauptprofil bleibt unberührt.")) {
            const deepClonedExampleData = JSON.parse(JSON.stringify(EXAMPLE_USER_DATA));
            setProfileData(prev => ({
                ...prev,
                valouZielstylingData: deepClonedExampleData,
            }));
            setCurrentInternalView('editor'); 
            setActiveAreaId(valouAreas[0].id);
            showAppNotification("Beispieldaten für Dein Valou Styling geladen.");
        }
    } else {
        showAppNotification("Beispieldaten kannst Du nur laden, wenn Deine Valou-Bereiche noch leer sind.", "info");
    }
  };

  const handleResetValouData = () => {
    if (window.confirm("Möchtest Du wirklich alle Deine Valou Styling-Einträge zurücksetzen?")) {
      handleValouDataChange(INITIAL_USER_DATA);
      setCurrentInternalView('summary'); 
      showAppNotification("Deine Valou Styling Daten wurden zurückgesetzt.");
    }
  };
  
  const handleKiStylingForAllValouAreas = async () => {
    if (!canUseKiStylingForValou) {
      showAppNotification("Bitte fülle zuerst einige Angaben in Deinem Profil (insbesondere Identitätsprofil oder RIASEC-Ergebnisse) aus, damit die KI gute Ergänzungen für Dein Valou-Styling vorschlagen kann.", "info");
      return;
    }

    setIsKiStylingInProgress(true);
    showAppNotification("KI Styling für alle Bereiche wird für Dich generiert/ergänzt...", "info", 5000);
    try {
      const newStylingData = await generateKiStylingForAllAreas(profileData, valouAreas);
      handleValouDataChange(newStylingData);
      // After KI styling, also regenerate and save the overall summary
      await onGenerateValouSummary();
      setCurrentInternalView('summary'); 
      showAppNotification("KI Styling für alle Bereiche erfolgreich für Dich generiert/ergänzt!");
    } catch (e: any) {
      showAppNotification(`Fehler beim globalen KI Styling für Dich: ${e.message}`, "error");
    } finally {
      setIsKiStylingInProgress(false);
    }
  };

  const handleExportValouDataAsTxt = () => {
    const txtContent = generateTxtContentForValou(valouData, profileData.valouZielstylingSummary);
    if (exportTextAsFile(txtContent, 'dein_valou_zielstyling.txt')) {
      showAppNotification("Deine Valou Styling Daten wurden als TXT exportiert.", "success");
    } else {
      showAppNotification("Fehler beim Exportieren der Valou Styling Daten oder keine Daten vorhanden.", "info");
    }
  };

  const handleIntroComplete = () => {
    setCurrentInternalView('summary'); 
  };

  const handleToggleDisplayView = async () => {
    if (currentInternalView === 'editor') {
      setCurrentInternalView('summary');
      // Call the passed prop to generate and save summary
      await onGenerateValouSummary();
    } else if (currentInternalView === 'summary') {
      setCurrentInternalView('editor');
    }
  };
  
  const currentArea = valouAreas.find(a => a.id === activeAreaId) || valouAreas[0];
  const currentAreaData = valouData[activeAreaId] || INITIAL_USER_DATA[activeAreaId];

  const actionButtonsViewMode = (currentInternalView === 'editor') ? 'editor' : 'summary';

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-xl shadow-2xl mt-8">
      <button
        onClick={onNavigateHome} // This now navigates to ToolsOverviewPage
        className="mb-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow hover:shadow-md text-sm print:hidden"
      >
        Zurück zur Tool-Übersicht
      </button>

      <header className="text-center mb-8 print:hidden">
        <h1 className="text-4xl font-bold text-slate-800">Valou Styling Tool</h1>
        {currentInternalView === 'intro' && (
             <p className="text-lg text-slate-600">Entdecke, was Dir wirklich wichtig ist.</p>
        )}
        {currentInternalView !== 'intro' && (
            <p className="text-lg text-slate-600">Definiere Deine Ziele und Präferenzen für ein erfülltes Berufsleben.</p>
        )}
      </header>

      {currentInternalView === 'intro' ? (
        <ValouIntroScreen onIntroComplete={handleIntroComplete} />
      ) : (
        <>
          <ActionButtons
            onLoadExampleValouData={handleLoadExampleValouData}
            onResetValouData={handleResetValouData}
            onExportValouData={handleExportValouDataAsTxt}
            onToggleValouSummary={handleToggleDisplayView} 
            onGetDrGoodWorkTipps={onGetAiRecommendation}
            currentValouView={actionButtonsViewMode} 
            onKiStylingForValou={handleKiStylingForAllValouAreas}
            isKiStylingForValouInProgress={isKiStylingInProgress}
            canLoadExampleValouData={canLoadExampleValouData} 
            canUseKiStylingForValou={canUseKiStylingForValou}
          />

          {currentInternalView === 'editor' ? (
            <>
              <ValouAreaNavigation
                areas={valouAreas}
                activeAreaId={activeAreaId}
                onSelectArea={setActiveAreaId}
              />
              <ValouAreaCard
                area={currentArea}
                userData={currentAreaData}
                onStylingSatzChange={(value) => handleStylingSatzChange(activeAreaId, value)}
                onAddItem={(category, item) => handleAddItem(activeAreaId, category, item)}
                onRemoveItem={(category, index) => handleRemoveItem(activeAreaId, category, index)}
                activeNewItemCategory={activeNewItemCategory}
                setActiveNewItemCategory={setActiveNewItemCategory}
                newItemText={newItemText}
                setNewItemText={setNewItemText}
                onGenerateSentence={() => handleGenerateStylingSentence(activeAreaId)}
                isGeneratingSentence={stylingSentenceLoading === activeAreaId}
                onGenerateCategorySuggestions={handleGenerateCategorySuggestions}
                categorySuggestionLoading={categorySuggestionLoading}
                currentCategorySuggestions={currentCategorySuggestions}
                clearCategorySuggestions={handleClearCategorySuggestions}
              />
            </>
          ) : ( 
            <div className="report-content-print"> {/* Wrapper for print styles */}
              <SummaryView
                areas={valouAreas}
                userData={valouData}
                valouZielstylingSummary={profileData.valouZielstylingSummary}
                renderFormattedText={renderFormattedText}
              />
            </div>
          )}
          <ProgressOverview areas={valouAreas} userData={valouData} />
        </>
      )}
    </div>
  );
};

export default ValouStylingToolPage;
