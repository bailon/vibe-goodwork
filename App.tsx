
import React, { useState, useEffect, useCallback } from 'react';
import { 
  VALOU_AREAS, 
  INITIAL_PROFILE_DATA, 
  // CATEGORY_LABELS, // No longer needed here, moved to appUtils
  INITIAL_USER_DATA, 
  // RELEVANT_IDENTITY_PROFILE_FIELDS, // No longer needed here, moved to appUtils
  getInitialLogbookEntryValues,
  CAREER_PHASES,
  EXAMPLE_PROFILE_DATA
} from './constants';
import { 
  ProfileData, 
  UserDataCollection,
  UserDataCategoryKey,
  RiasecData,
  PersonalityScreeningData,
  AppCurrentPage, // AppCurrentPage is correctly typed in types.ts
  JobMatchingPreferences, 
  JobMatch, 
  GroundingMetadata, 
  GroundingChunkWeb,
  LogbookEntry,
  LogbookEntryValues,
  CareerPhase,
  FutureSkillsScreeningData // Added for Future Skills
} from './types';
import HomePage from './components/HomePage'; 
import ValouStylingToolPage from './components/ValouStylingToolPage'; 
import RiasecToolPage from './components/RiasecToolPage';
import ToolsOverviewPage from './components/ToolsOverviewPage'; 
import IdentityProfileOverviewPage from './components/IdentityProfileOverviewPage'; 
import PersonalityToolPage from './components/PersonalityToolPage';
import MotivationToolPage from './components/MotivationToolPage'; 
import FutureSkillsToolPage from './components/FutureSkillsToolPage'; // Added
import DecisionMakingOverviewPage from './components/DecisionMakingOverviewPage';
import LogbookPage from './components/LogbookPage'; 
import AiRecommendationModal from './components/AiRecommendationModal'; 
import OnboardingFlow from './components/OnboardingFlow';
import LanguageSwitcher from './components/LanguageSwitcher';
import { 
  loadProfileDataFromLocalStorage,
  saveProfileDataToLocalStorage
} from './services/localStorageService';
import { 
  getComprehensiveCoachingReport, 
  AiRecommendationResponse,
  generateValouZielsummary,
  generateComprehensiveIdentityProfileReport, // This function is now updated internally
  generateDecisionMatrixReport,
  findMatchingJobs,
  generateCultureMatchReport
} from './services/geminiService';
import { 
  isValouDataEffectivelyEmpty,
  isProfileDataSufficientForKiStyling,
  isIdentityProfileEmpty,
  generateTxtContentForValou,
  areAllIdentityScreeningsComplete // Import the new helper
} from './appUtils';


// Moved to appUtils.ts:
// export const isValouDataEffectivelyEmpty = (valouData: UserDataCollection): boolean => { ... };
// export const isProfileDataSufficientForKiStyling = (currentProfileData: ProfileData): boolean => { ... };
// export const isIdentityProfileEmpty = (currentProfileData: ProfileData): boolean => { ... };
// export const generateTxtContentForValou = (valouData: UserDataCollection, valouSummary?: string): string => { ... };

const renderFormattedTextInternal = (text: string | undefined, defaultText = "Keine Inhalte vorhanden.") => {
    if (!text || text.trim() === "") {
      return <p className="text-slate-500 italic">{defaultText}</p>;
    }
    let html = text;
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold my-2 text-slate-700">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold my-1 text-slate-700">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-md font-medium text-slate-700">$1</h3>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    html = html.replace(/^\s*[-*+] (.*)/gm, '<li class="ml-4 list-disc text-slate-700">$1</li>');
    html = html.replace(/<\/li>\n<li/g, '</li><li');
    html = html.replace(/(<li.*<\/li>)+/g, (match) => `<ul class="mb-2">${match}</ul>`);
    html = html.replace(/^\s*\d+\.\s+(.*)/gm, '<li class="ml-4 list-decimal text-slate-700">$1</li>');
    html = html.replace(/(<li.*<\/li>)+/g, (match) => `<ol class="mb-2">${match}</ol>`);
    
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    const processedLines = [];

    for (const line of lines) {
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableHtml = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-slate-400 text-sm">';
            }
            const cells = line.split('|').map(cell => cell.trim()).slice(1, -1);
            if (line.includes('---')) { 
                tableHtml += '<thead><tr class="bg-slate-100">';
                cells.forEach(cell => tableHtml += `<th class="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-600">${cell.replace(/-+/g, '').trim() || '&nbsp;'}</th>`);
                tableHtml += '</tr></thead><tbody>';
            } else if (tableHtml.includes('<thead>')) { 
                tableHtml += '<tr class="border-b border-slate-200 hover:bg-slate-50">';
                cells.forEach(cell => tableHtml += `<td class="border border-slate-300 px-3 py-2 text-slate-700">${cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/⚠️/g, '<span role="img" aria-label="Warnung" title="No-Go">⚠️</span>')}</td>`);
                tableHtml += '</tr>';
            } else { 
                 tableHtml += '<thead><tr class="bg-slate-100">';
                 cells.forEach(cell => tableHtml += `<th class="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-600">${cell.trim() || '&nbsp;'}</th>`);
                 tableHtml += '</tr></thead><tbody>';
            }
        } else {
            if (inTable) {
                inTable = false;
                tableHtml += '</tbody></table></div>';
                processedLines.push(tableHtml);
                tableHtml = '';
            }
            processedLines.push(line);
        }
    }
    if (inTable) {
        tableHtml += '</tbody></table></div>';
        processedLines.push(tableHtml);
    }
    html = processedLines.join('\n');
    html = html.split(/\n\s*\n/).map(p => {
        if (p.startsWith('<div class="overflow-x-auto')) return p;
        return `<p class="mb-2 text-slate-700">${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('');
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p><([uo]l class="mb-2">)/g, '<$1').replace(/<\/[uo]l><\/p>/g, '</$1>');
    html = html.replace(/<br\/><div class="overflow-x-auto/g, '<div class="overflow-x-auto').replace(/<\/table><\/div><br\/>/g, '</table></div>');

    // Wrap the entire output in a div with report-content-print class
    return <div className="report-content-print" dangerouslySetInnerHTML={{ __html: html }} />;
};

const App = (): JSX.Element => {
  const [profileData, setProfileData] = useState<ProfileData>(loadProfileDataFromLocalStorage());
  const [currentAppPage, setCurrentAppPage] = useState<AppCurrentPage>('home');
  
  const [isLoadingAiRecommendation, setIsLoadingAiRecommendation] = useState<boolean>(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [aiSources, setAiSources] = useState<GroundingMetadata | undefined>(undefined);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<{ message: string; type: 'success' | 'info' | 'error'; show: boolean }>({ message: '', type: 'info', show: false });

  const [isLoadingDecisionCriteria, setIsLoadingDecisionCriteria] = useState<boolean>(false);
  const [isLoadingJobMatches, setIsLoadingJobMatches] = useState<boolean>(false);
  const [isLoadingCultureMatch, setIsLoadingCultureMatch] = useState<boolean>(false);
  const [isLoadingShortIdentityReport, setIsLoadingShortIdentityReport] = useState<boolean>(false); // New state

  useEffect(() => {
    saveProfileDataToLocalStorage(profileData);
  }, [profileData]);
  
  const handleSetCareerPhase = (phase: CareerPhase) => {
    setProfileData(prev => ({ ...prev, currentPhase: phase }));
    // Optionally navigate to home or another page after phase selection
    setCurrentAppPage('home'); 
  };

  const handleProfileChange = (
    field: keyof ProfileData, 
    value: string | UserDataCollection | RiasecData | PersonalityScreeningData | FutureSkillsScreeningData | undefined // motivationScreeningData will fit here too
  ) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    saveProfileDataToLocalStorage(profileData);
    displayAppNotification("Dein Profil wurde erfolgreich gespeichert!", "success");
  };

  const handleResetProfile = () => {
    if (window.confirm("Möchtest Du Dein gesamtes GoodWork Profil wirklich unwiderruflich zurücksetzen? Alle Deine Daten gehen dabei verloren.")) {
      setProfileData(INITIAL_PROFILE_DATA);
      saveProfileDataToLocalStorage(INITIAL_PROFILE_DATA); // Ensure reset is persisted
      setCurrentAppPage('home'); // Navigate to home after reset
      displayAppNotification("Dein Profil wurde zurückgesetzt.", "info");
    }
  };

  const displayAppNotification = (message: string = "Aktion erfolgreich!", type: 'success' | 'info' | 'error' = 'success', duration: number = 3000) => {
    setShowNotification({ message, type, show: true });
    setTimeout(() => {
      setShowNotification({ message: '', type: 'info', show: false });
    }, duration);
  };

  const handleGetDrGoodWorkTipps = async () => {
    setIsLoadingAiRecommendation(true);
    setAiError(null);
    setAiRecommendation(null);
    setAiSources(undefined);
    setIsModalOpen(true);
    try {
      const response: AiRecommendationResponse = await getComprehensiveCoachingReport(profileData);
      setAiRecommendation(response.text);
      setAiSources(response.sources);
      if(response.text.startsWith("Fehler:")) {
        setAiError(response.text);
        setAiRecommendation(null);
      }
    } catch (e: any) {
      setAiError(e.message || "Ein unbekannter Fehler ist aufgetreten.");
      setAiRecommendation(null);
    } finally {
      setIsLoadingAiRecommendation(false);
    }
  };

  const handleSaveRecommendationToProfile = () => {
    if (aiRecommendation && !aiRecommendation.startsWith("Fehler:")) {
      setProfileData(prev => ({ ...prev, savedAiRecommendation: aiRecommendation }));
      setIsModalOpen(false);
      displayAppNotification("Deine Dr. GoodWork Tipps wurden im Profil gespeichert!", "success");
    } else {
      displayAppNotification("Es gibt keine gültigen Tipps zum Speichern.", "info");
    }
  };

   const handleGenerateValouSummary = async () => {
    displayAppNotification("Valou Zielstyling Zusammenfassung wird für Dich generiert...", "info", 3000);
    try {
      const summary = await generateValouZielsummary(profileData.valouZielstylingData, profileData);
      setProfileData(prev => ({ ...prev, valouZielstylingSummary: summary }));
      if (!summary.startsWith("Fehler:")) {
        displayAppNotification("Valou Zielstyling Zusammenfassung erfolgreich erstellt und im Profil gespeichert!");
      } else {
        displayAppNotification(summary, "error");
      }
    } catch (e: any) {
      displayAppNotification("Fehler beim Generieren der Valou Zusammenfassung: " + e.message, "error");
      setProfileData(prev => ({ ...prev, valouZielstylingSummary: `Fehler: ${e.message}` }));
    }
  };

  const handleGenerateIdentityProfileReport = async () => {
    // This function now calls generateComprehensiveIdentityProfileReport,
    // which internally decides to call getShortIdentityScreeningReport if conditions are met.
    const isShortReportAttempt = areAllIdentityScreeningsComplete(profileData);
    const notificationMessage = isShortReportAttempt 
        ? "Dein Kurzreport zum Identitätsprofil wird erstellt..." 
        : "Dein Gesamtbericht zum Identitätsprofil wird erstellt...";
    
    displayAppNotification(notificationMessage, "info", 5000);
    setIsLoadingShortIdentityReport(true); // Use a general loading state or a specific one
    try {
      // generateComprehensiveIdentityProfileReport will internally decide which report to make
      const report = await generateComprehensiveIdentityProfileReport(profileData);
      setProfileData(prev => ({ ...prev, beruflichesIdentitaetsProfilReport: report }));
      if (!report.startsWith("Fehler:")) {
          displayAppNotification("Bericht zum beruflichen Identitätsprofil erfolgreich erstellt und im Profil gespeichert!");
      } else {
          displayAppNotification(report, "error", 6000); // Longer duration for error messages
      }
    } catch (e:any) {
      displayAppNotification(`Fehler beim Generieren des Identitätsprofil Reports: ${e.message}`, "error", 6000);
      setProfileData(prev => ({ ...prev, beruflichesIdentitaetsProfilReport: `Fehler: ${e.message}` }));
    } finally {
      setIsLoadingShortIdentityReport(false);
    }
  };


   const handleGenerateDecisionCriteria = async () => {
    setIsLoadingDecisionCriteria(true);
    displayAppNotification("Deine Entscheidungskriterien werden erstellt...", "info", 4000);
    try {
        const report = await generateDecisionMatrixReport(profileData);
        setProfileData(prev => ({ ...prev, decisionCriteriaReport: report }));
        if (!report.startsWith("Fehler:")) {
            displayAppNotification("Entscheidungskriterien erfolgreich generiert und im Profil gespeichert!");
        } else {
            displayAppNotification(report, "error");
        }
    } catch (error: any) {
        displayAppNotification(`Fehler beim Erstellen der Entscheidungskriterien: ${error.message}`, "error");
        setProfileData(prev => ({ ...prev, decisionCriteriaReport: `Fehler: ${error.message}` }));
    } finally {
        setIsLoadingDecisionCriteria(false);
    }
  };

  const handleFindMatchingJobs = async (preferences: JobMatchingPreferences) => {
    setIsLoadingJobMatches(true);
    setProfileData(prev => ({ ...prev, jobMatchingPreferences: preferences, jobMatches: [], jobSearchGroundingSources: [] }));
    displayAppNotification("Suche passende Jobs für Dich...", "info", 4000);
    try {
        const { matches, groundingMetadata } = await findMatchingJobs(profileData);
        const sources = groundingMetadata?.groundingChunks?.map(chunk => chunk.web).filter(Boolean) as GroundingChunkWeb[] || [];
        setProfileData(prev => ({ ...prev, jobMatches: matches, jobSearchGroundingSources: sources }));
        if (matches.length > 0) {
            displayAppNotification(`${matches.length} Job-Matches gefunden!`, "success");
        } else {
            displayAppNotification("Keine spezifischen Job-Matches gefunden. Versuche, Deine Präferenzen anzupassen.", "info");
        }
    } catch (error: any) {
        displayAppNotification(`Fehler bei der Jobsuche: ${error.message}`, "error");
    } finally {
        setIsLoadingJobMatches(false);
    }
  };

  const handleGenerateCultureMatch = async () => {
    setIsLoadingCultureMatch(true);
    displayAppNotification("Culture Match Report wird für Dich erstellt...", "info", 4000);
    try {
        const report = await generateCultureMatchReport(profileData);
        setProfileData(prev => ({ ...prev, cultureMatchReport: report }));
        if (!report.startsWith("Fehler:")) {
            displayAppNotification("Culture Match Report erfolgreich erstellt und im Profil gespeichert!");
        } else {
            displayAppNotification(report, "error");
        }
    } catch (error: any) {
        displayAppNotification(`Fehler beim Erstellen des Culture Match Reports: ${error.message}`, "error");
        setProfileData(prev => ({ ...prev, cultureMatchReport: `Fehler: ${error.message}` }));
    } finally {
        setIsLoadingCultureMatch(false);
    }
  };

  // Logbook handlers
  const handleAddLogbookEntry = (newEntry: LogbookEntry) => {
    setProfileData(prev => ({
      ...prev,
      logbookEntries: [...(prev.logbookEntries || []), newEntry]
    }));
    displayAppNotification("Logbucheintrag hinzugefügt!", "success");
  };

  const handleUpdateLogbookEntry = (updatedEntry: LogbookEntry) => {
    setProfileData(prev => ({
      ...prev,
      logbookEntries: (prev.logbookEntries || []).map(entry =>
        entry.id === updatedEntry.id ? updatedEntry : entry
      )
    }));
    displayAppNotification("Logbucheintrag aktualisiert!", "success");
  };

  const handleDeleteLogbookEntry = (entryId: string | number) => {
    setProfileData(prev => ({
      ...prev,
      logbookEntries: (prev.logbookEntries || []).filter(entry => entry.id !== entryId)
    }));
    displayAppNotification("Logbucheintrag gelöscht.", "info");
  };


  const renderPage = () => {
    if (profileData.currentPhase === 'nicht_gesetzt') {
      return <OnboardingFlow key="onboarding" onOnboardingComplete={handleSetCareerPhase} careerPhasesOptions={CAREER_PHASES} />;
    }

    switch (currentAppPage) {
      case 'home':
        return <HomePage 
                  key="home"
                  profileData={profileData} 
                  onProfileChange={handleProfileChange} 
                  onNavigate={setCurrentAppPage} 
                  onSaveProfile={handleSaveProfile}
                  showAppNotification={displayAppNotification}
                  onGetDrGoodWorkTipps={handleGetDrGoodWorkTipps}
                  onResetProfile={handleResetProfile}
                  renderFormattedText={renderFormattedTextInternal}
               />;
      case 'valouStyling':
        return <ValouStylingToolPage 
                  key="valouStyling"
                  profileData={profileData} 
                  setProfileData={setProfileData} 
                  onNavigateHome={() => setCurrentAppPage('toolsOverview')} 
                  onGetAiRecommendation={handleGetDrGoodWorkTipps}
                  showAppNotification={displayAppNotification}
                  onGenerateValouSummary={handleGenerateValouSummary}
                  renderFormattedText={renderFormattedTextInternal}
               />;
      case 'riasecTool':
        return <RiasecToolPage
                  key="riasecTool"
                  profileData={profileData}
                  setProfileData={setProfileData}
                  onNavigateHome={() => setCurrentAppPage('identityProfileOverview')}
                  showAppNotification={displayAppNotification}
                />;
      case 'personalityScreeningTool':
        return <PersonalityToolPage
                    key="personalityScreeningTool"
                    profileData={profileData}
                    setProfileData={setProfileData}
                    onNavigateHome={() => setCurrentAppPage('identityProfileOverview')}
                    showAppNotification={displayAppNotification}
                />;
      case 'motivationScreeningTool': 
        return <MotivationToolPage
                    key="motivationScreeningTool"
                    profileData={profileData}
                    setProfileData={setProfileData}
                    onNavigateHome={() => setCurrentAppPage('identityProfileOverview')}
                    showAppNotification={displayAppNotification}
                    renderFormattedText={renderFormattedTextInternal} 
                />;
      case 'futureSkillsScreeningTool': // Added case for Future Skills
        return <FutureSkillsToolPage
                    key="futureSkillsScreeningTool"
                    profileData={profileData}
                    setProfileData={setProfileData}
                    onNavigateHome={() => setCurrentAppPage('identityProfileOverview')}
                    showAppNotification={displayAppNotification}
                    renderFormattedText={renderFormattedTextInternal} 
                />;
      case 'toolsOverview':
        return <ToolsOverviewPage 
                  key="toolsOverview"
                  onNavigate={setCurrentAppPage} 
                  onNavigateHome={() => setCurrentAppPage('home')}
                  showAppNotification={displayAppNotification}
                />;
      case 'identityProfileOverview':
          return <IdentityProfileOverviewPage
                    key="identityProfileOverview"
                    profileData={profileData} // Pass profileData
                    onGenerateIdentityReport={handleGenerateIdentityProfileReport} // Pass handler
                    isLoadingIdentityReport={isLoadingShortIdentityReport} // Pass loading state
                    onNavigate={setCurrentAppPage}
                    onNavigateBack={() => setCurrentAppPage('toolsOverview')}
                    showAppNotification={displayAppNotification}
                 />;
      case 'decisionMakingOverview':
          return <DecisionMakingOverviewPage
                    key="decisionMakingOverview"
                    profileData={profileData}
                    onNavigate={setCurrentAppPage}
                    onNavigateHome={() => setCurrentAppPage('home')}
                    onGenerateCriteria={handleGenerateDecisionCriteria}
                    isLoadingCriteria={isLoadingDecisionCriteria}
                    showAppNotification={displayAppNotification}
                    renderFormattedText={renderFormattedTextInternal}
                    onFindMatchingJobs={handleFindMatchingJobs}
                    isLoadingJobMatches={isLoadingJobMatches}
                    onGenerateCultureMatch={handleGenerateCultureMatch}
                    isLoadingCultureMatch={isLoadingCultureMatch}
                 />;
      case 'logbook':
          return <LogbookPage
                    key="logbook"
                    logbookEntries={profileData.logbookEntries || []}
                    onAddEntry={handleAddLogbookEntry}
                    onUpdateEntry={handleUpdateLogbookEntry}
                    onDeleteEntry={handleDeleteLogbookEntry}
                    onNavigateBack={() => setCurrentAppPage('toolsOverview')}
                    showAppNotification={displayAppNotification}
                    valouAreas={VALOU_AREAS}
                    getInitialLogbookEntryValues={getInitialLogbookEntryValues}
                  />;
      default:
        return <HomePage 
                  key="defaultHome"
                  profileData={profileData} 
                  onProfileChange={handleProfileChange} 
                  onNavigate={setCurrentAppPage} 
                  onSaveProfile={handleSaveProfile}
                  showAppNotification={displayAppNotification}
                  onGetDrGoodWorkTipps={handleGetDrGoodWorkTipps}
                  onResetProfile={handleResetProfile}
                  renderFormattedText={renderFormattedTextInternal}
                />;
    }
  };

  return (
    <div className="app bg-slate-100 min-h-screen">
      <LanguageSwitcher />
      {renderPage()}
      <AiRecommendationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recommendation={aiRecommendation}
        sources={aiSources}
        error={aiError}
        isLoading={isLoadingAiRecommendation}
        onSaveToProfile={handleSaveRecommendationToProfile}
        aiRecommendationText={aiRecommendation || ""}
      />
      {showNotification.show && (
        <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white print:hidden
                         ${showNotification.type === 'success' ? 'bg-green-500' : 
                           showNotification.type === 'info' ? 'bg-blue-500' : 'bg-red-500'}
                         transition-opacity duration-300 ${showNotification.show ? 'opacity-100' : 'opacity-0'}`}
             role="alert"
        >
          {showNotification.message}
        </div>
      )}
    </div>
  );
};

export default App;