
import React, { useState, useEffect, useMemo } from 'react';
// Correct import path for RELEVANT_IDENTITY_PROFILE_FIELDS
import { ProfileData, AppCurrentPage, JobMatchingPreferences, JobMatch, GroundingChunkWeb } from '../types'; 
import { RELEVANT_IDENTITY_PROFILE_FIELDS } from '../constants';
import { isValouDataEffectivelyEmpty } from '../appUtils'; // Updated import path
import CheckCircleIcon from './icons/CheckCircleIcon';
import LightBulbIcon from './icons/LightBulbIcon';
import ListBulletIcon from './icons/ListBulletIcon';
import ScaleIcon from './icons/ScaleIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon'; 
import UserCircleIcon from './icons/UserCircleIcon';
import SparklesIcon from './icons/SparklesIcon';
import LinkIcon from './icons/LinkIcon';
import BriefcaseIcon from './icons/BriefcaseIcon'; 
import PuzzlePieceIcon from './icons/PuzzlePieceIcon'; 
import DocumentTextIcon from './icons/DocumentTextIcon'; 
import { exportTextAsFile } from '../services/exportService';


interface DecisionMakingOverviewPageProps {
  profileData: ProfileData;
  onNavigate: (page: AppCurrentPage) => void; 
  onNavigateHome: () => void;
  onGenerateCriteria: () => Promise<void>;
  isLoadingCriteria: boolean;
  showAppNotification: (message?: string, type?: 'success' | 'info' | 'error', duration?: number) => void;
  renderFormattedText: (text: string | undefined, defaultText?: string) => JSX.Element | null;
  onFindMatchingJobs: (preferences: JobMatchingPreferences) => Promise<void>; 
  isLoadingJobMatches: boolean; 
  onGenerateCultureMatch: () => Promise<void>; 
  isLoadingCultureMatch: boolean; 
}

const DecisionMakingOverviewPage: React.FC<DecisionMakingOverviewPageProps> = ({
  profileData,
  onNavigate,
  onNavigateHome,
  onGenerateCriteria,
  isLoadingCriteria,
  showAppNotification,
  renderFormattedText,
  onFindMatchingJobs, 
  isLoadingJobMatches, 
  onGenerateCultureMatch, 
  isLoadingCultureMatch, 
}) => {
  const [fullIdentityProfileComplete, setFullIdentityProfileComplete] = useState(false);
  const [valouStylingComplete, setValouStylingComplete] = useState(false);
  const [criteriaPrerequisitesMet, setCriteriaPrerequisitesMet] = useState(false);
  const [decisionCriteriaReportExists, setDecisionCriteriaReportExists] = useState(false);
  const [cultureMatchReportExists, setCultureMatchReportExists] = useState(false); 


  // State for Job Matching form
  const [jobPrefs, setJobPrefs] = useState<JobMatchingPreferences>(
    profileData.jobMatchingPreferences || {
      keywords: '',
      industries: '',
      regions: '',
      companySize: 'Beliebig',
      workModel: 'Beliebig',
    }
  );

  // Effect to derive boolean states based on profileData
  useEffect(() => {
    const idProfileDone = !!(profileData.riasec?.lastRun && profileData.riasec.report &&
                           profileData.personalityScreening?.lastRun && profileData.personalityScreening.report);
    setFullIdentityProfileComplete(idProfileDone);

    const valouDone = !isValouDataEffectivelyEmpty(profileData.valouZielstylingData);
    setValouStylingComplete(valouDone);

    const anyManualIdentityData = RELEVANT_IDENTITY_PROFILE_FIELDS.some(
      field => !!profileData[field as keyof ProfileData] && (profileData[field as keyof ProfileData] as string).trim() !== ''
    );
    const anyToolIdentityData = !!profileData.riasec?.scores || !!profileData.personalityScreening?.bigFiveScores;
    const generalProfileSufficient = anyManualIdentityData || anyToolIdentityData;
    
    setCriteriaPrerequisitesMet(valouDone && generalProfileSufficient);
    setDecisionCriteriaReportExists(!!profileData.decisionCriteriaReport && !profileData.decisionCriteriaReport.startsWith("Fehler:"));
    setCultureMatchReportExists(!!profileData.cultureMatchReport && !profileData.cultureMatchReport.startsWith("Fehler:")); 

  }, [profileData]); 


  useEffect(() => {
    if (profileData.jobMatchingPreferences) {
      if (JSON.stringify(profileData.jobMatchingPreferences) !== JSON.stringify(jobPrefs)) {
        setJobPrefs(profileData.jobMatchingPreferences);
      }
    } else {
      setJobPrefs({
        keywords: '', industries: '', regions: '', companySize: 'Beliebig', workModel: 'Beliebig',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData.jobMatchingPreferences]);


  const handleJobPrefsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setJobPrefs(prev => ({ ...prev, [name]: value }));
  };

  const handleFindJobsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionCriteriaReportExists) {
        showAppNotification("Bitte erstelle zuerst Deine Entscheidungskriterien, um die Jobsuche optimal zu nutzen.", "info");
        return;
    }
    onFindMatchingJobs(jobPrefs);
  };


  const handleGenerateCriteriaWithNotification = async () => {
    if (!criteriaPrerequisitesMet) {
        showAppNotification("Bitte vervollständige zuerst Dein Valou Zielstyling und mache mindestens einige Angaben in Deinem persönlichen Profil (manuell oder durch Tools).", "info");
        return;
    }
    if (!fullIdentityProfileComplete) {
        showAppNotification("Hinweis: Deine Entscheidungskriterien werden erstellt. Für noch präzisere Ergebnisse empfehlen wir, auch das vollständige berufliche Identitätsprofil (RIASEC & Persönlichkeits-Screening) durchzuführen.", "info", 6000);
    }
    await onGenerateCriteria();
  };

  const handleGenerateCultureMatchWithNotification = async () => {
    if (!criteriaPrerequisitesMet) { // Can use same prerequisites as decision criteria
        showAppNotification("Bitte vervollständige zuerst Dein Valou Zielstyling und Dein persönliches Profil (manuell oder durch Tools), um eine aussagekräftige Culture Match Analyse zu erhalten.", "info");
        return;
    }
     if (!decisionCriteriaReportExists) {
        showAppNotification("Hinweis: Die Culture Match Analyse wird erstellt. Für noch präzisere Ergebnisse empfehlen wir, auch zuerst den 'Meine Entscheidungskriterien'-Report zu generieren.", "info", 6000);
    }
    await onGenerateCultureMatch();
  };

  const handleExportReport = (reportContent: string | undefined, filename: string, successMessage: string) => {
    if (exportTextAsFile(reportContent, filename)) {
      showAppNotification(successMessage, "success");
    } else {
      showAppNotification(`Kein gültiger Report zum Exportieren für "${filename.replace('.txt','').replace(/_/g, ' ')}".`, "info");
    }
  };



  const SubModuleCard: React.FC<{
    title: string;
    icon: JSX.Element;
    status?: 'complete' | 'incomplete' | 'pending' | 'actionable' | 'future';
    description: string;
    actionText?: string;
    onAction?: () => void;
    navigateTo?: AppCurrentPage; 
    isActionDisabled?: boolean;
    isLoadingAction?: boolean;
    reportContent?: string | undefined;
    accentColor?: string;
    children?: React.ReactNode; 
    exportFilename?: string;
    exportNotificationMessage?: string;
  }> = ({ title, icon, status, description, actionText, onAction, navigateTo, isActionDisabled, isLoadingAction, reportContent, accentColor = 'indigo', children, exportFilename, exportNotificationMessage }) => {
    
    const handleNavigationOrAction = () => {
        if (navigateTo && onNavigate) {
            onNavigate(navigateTo);
        } else if (onAction) {
            onAction();
        }
    };
    
    let statusElement = null;
    if (status === 'complete') {
        statusElement = (
            <div className={`flex items-center text-green-600 bg-green-100 p-2 rounded-md text-xs font-medium`}>
              <CheckCircleIcon className="w-4 h-4 mr-1.5" />
              Voraussetzung erfüllt / Modul abgeschlossen
            </div>
        );
    } else if (status === 'incomplete') {
         statusElement = (
            <div className={`flex items-center text-amber-600 bg-amber-100 p-2 rounded-md text-xs font-medium`}>
              <DocumentArrowDownIcon className="w-4 h-4 mr-1.5" />
              Vervollständigung erforderlich
            </div>
        );
    } else if (status === 'future') {
        statusElement = (
             <span className="block text-center text-xs font-semibold bg-slate-200 text-slate-500 px-3 py-1.5 rounded-full">
                Demnächst verfügbar
            </span>
        )
    } else if (status === 'actionable' && !reportContent && onAction) { 
         statusElement = (
            <div className={`flex items-center text-${accentColor}-600 bg-${accentColor}-100 p-2 rounded-md text-xs font-medium`}>
                <LightBulbIcon className="w-4 h-4 mr-1.5" />
                Bereit zur Generierung durch Dr. GoodWork
            </div>
        );
    }


    return (
      <div className={`bg-white p-6 rounded-2xl shadow-xl border border-slate-200 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1`}>
        <div>
          <div className="flex items-center mb-4">
            <div className={`p-2.5 rounded-full mr-4 bg-${accentColor}-100 text-${accentColor}-600`}>
                {React.cloneElement(icon, { className: "w-7 h-7" })}
            </div>
            <h3 className={`text-xl font-semibold text-slate-800`}>{title}</h3>
          </div>
          <p className="text-sm text-slate-600 mb-5 min-h-[40px] leading-relaxed">{description}</p>
          
          {statusElement}

          {reportContent && (status === 'complete' || (status === 'actionable' && reportContent) ) && ( 
            <div className="mt-4 space-y-2">
                <details className="group printable-details-section"> {/* Added printable-details-section */}
                    <summary className={`cursor-pointer text-xs font-medium text-${accentColor}-600 hover:text-${accentColor}-800 flex items-center group-open:mb-1`}>
                        <SparklesIcon className="w-3.5 h-3.5 mr-1"/> Report anzeigen/verbergen
                    </summary>
                    <div className="mt-1 p-3 bg-slate-50 rounded-lg max-h-60 overflow-y-auto text-xs border border-slate-200 shadow-inner report-content-print"> {/* Added report-content-print */}
                        {renderFormattedText(reportContent, "Report wird geladen...")}
                    </div>
                </details>
                {exportFilename && exportNotificationMessage && (
                    <button
                        onClick={() => handleExportReport(reportContent, exportFilename, exportNotificationMessage)}
                        className={`w-full px-3 py-1.5 text-xs font-medium rounded-md transition-colors shadow-sm print:hidden
                                    bg-${accentColor}-100 text-${accentColor}-700 hover:bg-${accentColor}-200 focus:ring-${accentColor}-500
                                    border border-${accentColor}-300 flex items-center justify-center gap-1.5`}
                    >
                        <DocumentTextIcon className="w-3.5 h-3.5"/> Report als TXT exportieren
                    </button>
                )}
            </div>
           )}
           {children 
           }
        </div>
        {(actionText && (status === 'actionable' || status === 'incomplete' || (status==='pending' && !!onAction) || (status === 'complete' && onAction && !navigateTo) )) && (
          <button
            onClick={handleNavigationOrAction}
            disabled={isActionDisabled || isLoadingAction}
            className={`mt-5 w-full px-4 py-3 text-sm font-semibold rounded-lg transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 print:hidden
                        ${isActionDisabled ? `bg-slate-300 text-slate-500 cursor-not-allowed focus:ring-slate-400` 
                                         : `bg-${accentColor}-600 text-white hover:bg-${accentColor}-700 focus:ring-${accentColor}-500`}`}
          >
            {isLoadingAction ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Wird verarbeitet...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                 {navigateTo && <LinkIcon className="w-4 h-4"/>}
                 {onAction && !navigateTo && <SparklesIcon className="w-4 h-4"/>}
                 {actionText}
              </div>
            )}
          </button>
        )}
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-purple-50 p-4 sm:p-8">
       <button
        onClick={onNavigateHome}
        className="mb-8 px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow hover:shadow-md text-sm flex items-center gap-2 print:hidden"
      >
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Zurück zur Crafting Zentrale
      </button>
      <header className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4
                       bg-gradient-to-r from-indigo-600 via-sky-500 to-purple-600
                       gradient-text">
          Gute Entscheidungen treffen
        </h1>
        <p className="text-lg sm:text-xl text-slate-700 max-w-3xl mx-auto">
          Nutze Deine persönlichen Daten, um klare und passende Entscheidungen für Deine Zukunft zu fällen.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
        <SubModuleCard
          title="Berufliches Identitätsprofil"
          icon={<UserCircleIcon />}
          accentColor="sky"
          status={fullIdentityProfileComplete ? 'complete' : 'incomplete'}
          description="Stelle sicher, dass Dein RIASEC- und Persönlichkeits-Screening aktuell sind. Diese bilden die Basis für Deine Entscheidungskriterien."
          actionText={fullIdentityProfileComplete ? "Profil ansehen/aktualisieren" : "Zum Identitätsprofil"}
          navigateTo="identityProfileOverview"
        />
        <SubModuleCard
          title="Valou Zielstyling"
          icon={<SparklesIcon />}
          accentColor="rose"
          status={valouStylingComplete ? 'complete' : 'incomplete'}
          description="Definiere Deine Wünsche, Vorlieben, Must-Haves und No-Gos in den sechs wichtigen Lebensbereichen."
          actionText={valouStylingComplete ? "Valou ansehen/aktualisieren" : "Zum Valou Styling"}
          navigateTo="valouStyling"
        />
        <SubModuleCard
          title="Meine Entscheidungskriterien"
          icon={<LightBulbIcon />}
          accentColor="indigo"
          status={decisionCriteriaReportExists ? 'complete' : (criteriaPrerequisitesMet ? 'actionable' : 'pending')}
          description={criteriaPrerequisitesMet ? "Dr. GoodWork erstellt Deine persönliche Entscheidungsmatrix und einen Report basierend auf Deinem Profil und Valou-Styling." : "Vervollständige zuerst Dein Identitätsprofil und Valou Zielstyling."}
          actionText={decisionCriteriaReportExists ? "Report erneut generieren" : (criteriaPrerequisitesMet ? "Kriterien von Dr. GoodWork erstellen lassen" : "Voraussetzungen prüfen")}
          onAction={handleGenerateCriteriaWithNotification}
          isActionDisabled={!criteriaPrerequisitesMet && !decisionCriteriaReportExists} 
          isLoadingAction={isLoadingCriteria}
          reportContent={profileData.decisionCriteriaReport}
          exportFilename="meine_entscheidungskriterien_report.txt"
          exportNotificationMessage="Entscheidungskriterien-Report als TXT exportiert."
        />
        
        <SubModuleCard
          title="Culture Match Analyse"
          icon={<PuzzlePieceIcon />}
          accentColor="teal"
          status={cultureMatchReportExists ? 'complete' : (criteriaPrerequisitesMet ? 'actionable' : 'pending')}
          description={criteriaPrerequisitesMet ? "Dr. GoodWork analysiert, welche Unternehmenskulturen am besten zu Deinem Profil und Deinen Werten passen." : "Vervollständige zuerst Dein Identitätsprofil und Valou Zielstyling für eine aussagekräftige Analyse."}
          actionText={cultureMatchReportExists ? "Culture Match erneut analysieren" : "Culture Match Analyse durchführen"}
          onAction={handleGenerateCultureMatchWithNotification}
          isActionDisabled={!criteriaPrerequisitesMet && !cultureMatchReportExists}
          isLoadingAction={isLoadingCultureMatch}
          reportContent={profileData.cultureMatchReport}
          exportFilename="mein_culture_match_report.txt"
          exportNotificationMessage="Culture Match Report als TXT exportiert."
        />

        
        <SubModuleCard
          title="Job Matching mit Dr. GoodWork"
          icon={<BriefcaseIcon />}
          accentColor="lime"
          status={decisionCriteriaReportExists ? 'actionable' : 'pending'}
          description={decisionCriteriaReportExists ? "Gib Deine Präferenzen ein und lasse Dr. GoodWork passende Jobangebote für Dich suchen. Nutzt Deine erstellten Entscheidungskriterien und Dein gesamtes Profil." : "Erstelle zuerst Deine Entscheidungskriterien (siehe Modul oben), um dieses Tool optimal zu nutzen."}
          actionText="Passende Jobs finden" 
          isActionDisabled={!decisionCriteriaReportExists || isLoadingJobMatches}
        >
          {decisionCriteriaReportExists && (
            <form onSubmit={handleFindJobsSubmit} className="mt-4 space-y-3 text-sm print:hidden">
              <div>
                <label htmlFor="keywords" className="block text-xs font-medium text-slate-700 mb-0.5">Schlüsselwörter/Tätigkeiten:</label>
                <textarea
                  id="keywords"
                  name="keywords"
                  rows={2}
                  value={jobPrefs.keywords}
                  onChange={handleJobPrefsChange}
                  placeholder="z.B. Frontend Entwicklung, Projektleitung, Datenanalyse"
                  className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500 text-xs"
                />
              </div>
              <div>
                <label htmlFor="industries" className="block text-xs font-medium text-slate-700 mb-0.5">Branchen (optional):</label>
                <textarea
                  id="industries"
                  name="industries"
                  rows={2}
                  value={jobPrefs.industries}
                  onChange={handleJobPrefsChange}
                  placeholder="z.B. Erneuerbare Energien, E-Commerce, Bildung"
                  className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500 text-xs"
                />
              </div>
              <div>
                <label htmlFor="regions" className="block text-xs font-medium text-slate-700 mb-0.5">Regionen/Orte (optional):</label>
                <input
                  type="text"
                  id="regions"
                  name="regions"
                  value={jobPrefs.regions}
                  onChange={handleJobPrefsChange}
                  placeholder="z.B. Berlin, Remote, Süddeutschland"
                  className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="companySize" className="block text-xs font-medium text-slate-700 mb-0.5">Unternehmensgröße:</label>
                    <select 
                        name="companySize" 
                        id="companySize" 
                        value={jobPrefs.companySize} 
                        onChange={handleJobPrefsChange}
                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500 text-xs"
                    >
                        <option value="Beliebig">Beliebig</option>
                        <option value="Klein">Klein (bis 50 MA)</option>
                        <option value="Mittel">Mittel (51-500 MA)</option>
                        <option value="Groß">Groß (500+ MA)</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="workModel" className="block text-xs font-medium text-slate-700 mb-0.5">Arbeitsmodell:</label>
                    <select 
                        name="workModel" 
                        id="workModel" 
                        value={jobPrefs.workModel} 
                        onChange={handleJobPrefsChange}
                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500 text-xs"
                    >
                        <option value="Beliebig">Beliebig</option>
                        <option value="Vor Ort">Vor Ort</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Remote">Remote</option>
                    </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={!decisionCriteriaReportExists || isLoadingJobMatches}
                className={`w-full mt-3 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2
                            ${(!decisionCriteriaReportExists || isLoadingJobMatches) ? `bg-slate-300 text-slate-500 cursor-not-allowed focus:ring-slate-400` 
                                             : `bg-lime-600 text-white hover:bg-lime-700 focus:ring-lime-500`}`}
              >
                {isLoadingJobMatches ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Sucht Jobs...
                  </div>
                ) : (
                   <div className="flex items-center justify-center gap-2">
                     <BriefcaseIcon className="w-4 h-4"/> Passende Jobs finden
                   </div>
                )}
              </button>
            </form>
          )}
          {!isLoadingJobMatches && profileData.jobMatches && profileData.jobMatches.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-200">
              <h4 className="text-md font-semibold text-lime-700 mb-3">Gefundene Job-Matches ({profileData.jobMatches.length}):</h4>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 text-xs">
                {profileData.jobMatches.map((job, index) => (
                  <div key={index} className="p-3 bg-lime-50 border border-lime-200 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                        <h5 className="font-semibold text-lime-800 flex-grow pr-2">{job.title}</h5>
                        {job.matchingDegree && job.matchingDegree !== "N/A" && (
                            <span 
                                className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap shrink-0"
                                style={{ 
                                    backgroundColor: parseInt(job.matchingDegree) >= 85 ? '#22c55e' /* green-500 */ : parseInt(job.matchingDegree) >= 70 ? '#f97316' /* orange-500 */ : '#ef4444' /* red-500 */, 
                                    color: 'white' 
                                }}
                                title={`Übereinstimmungsgrad: ${job.matchingDegree}`}
                            >
                                {job.matchingDegree}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-600"><span className="font-medium">Firma:</span> {job.company}</p>
                    <p className="text-slate-600"><span className="font-medium">Ort:</span> {job.location}</p>
                    <p className="text-slate-500 italic my-1">{job.snippet}</p>
                    <p className="text-lime-700"><span className="font-medium">Relevanz:</span> {job.relevance}</p>
                    <a 
                      href={job.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-block text-lime-600 hover:text-lime-800 hover:underline font-medium"
                    >
                      Zur Stellenanzeige <LinkIcon className="inline-block w-3 h-3 ml-0.5"/>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!isLoadingJobMatches && profileData.jobMatches && profileData.jobMatches.length === 0 && jobPrefs.keywords && ( 
            <p className="mt-4 text-xs text-slate-500 italic">Keine passenden Jobs für Deine aktuellen Präferenzen gefunden. Versuche, die Kriterien anzupassen.</p>
          )}
          {!isLoadingJobMatches && profileData.jobSearchGroundingSources && profileData.jobSearchGroundingSources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200 print:hidden">
              <h5 className="text-xs font-semibold text-slate-500 mb-1.5">Genutzte Quellen für Jobsuche (Google Search):</h5>
              <ul className="list-disc list-inside space-y-1 text-xs">
                {profileData.jobSearchGroundingSources.map((source, index) => (
                  <li key={index}>
                    <a 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-slate-500 hover:text-slate-700 hover:underline"
                      title={source.title || source.uri}
                    >
                      {source.title || source.uri}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SubModuleCard>

        <SubModuleCard
          title="Prioritäten-Matrix"
          icon={<ScaleIcon />}
          accentColor="amber"
          status="future"
          description="Gewichte Deine Kriterien und Optionen visuell, um komplexe Entscheidungen zu vereinfachen (Demnächst)."
          actionText="Zur Matrix"
          isActionDisabled={true}
        />
      </div>
    </div>
  );
};

export default DecisionMakingOverviewPage;
