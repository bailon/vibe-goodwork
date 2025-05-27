
import React, { ChangeEvent, useState } from 'react';
import { ProfileData, UserDataCategoryKey, UserDataCollection, RiasecData, PersonalityScreeningData, BigFiveDimensionScore, CareerPhase, MotiveDimensionScore, FutureSkillDimensionScore } from '../types';
import { VALOU_AREAS, CATEGORY_LABELS, RIASEC_DESCRIPTIONS, BIG_FIVE_DIMENSION_DEFINITIONS, CAREER_PHASES, MOTIVATION_DIMENSIONS_CONFIG, FUTURE_SKILLS_DIMENSIONS_CONFIG } from '../constants';
import UserCircleIcon from './icons/UserCircleIcon';
import { isValouDataEffectivelyEmpty } from '../appUtils';
import RefreshIcon from './icons/RefreshIcon'; 
import DocumentTextIcon from './icons/DocumentTextIcon';
import { exportTextAsFile } from '../services/exportService'; 

interface ProfileViewProps {
  profileData: ProfileData;
  onProfileChange: (field: keyof ProfileData, value: string | UserDataCollection | RiasecData | PersonalityScreeningData | CareerPhase | undefined) => void;
  onSaveProfile: () => void;
  onResetProfile: () => void;
  renderFormattedText: (text: string | undefined, defaultText?: string) => JSX.Element | null;
  showAppNotification: (message?: string, type?: 'success' | 'info' | 'error', duration?: number) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
    profileData, 
    onProfileChange, 
    onSaveProfile, 
    onResetProfile,
    renderFormattedText, // Use this prop
    showAppNotification 
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        onProfileChange('profilePicture', base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleExport = (content: string | undefined, filename: string, successMessage: string) => {
    if (exportTextAsFile(content, filename)) {
      showAppNotification(successMessage, "success");
    } else {
      showAppNotification(`Kein gültiger Inhalt zum Exportieren für "${filename.replace('.txt','').replace(/_/g, ' ')}".`, "info");
    }
  };


  const generalFormFields: Array<{ key: keyof ProfileData; label: string; placeholder: string; type?: 'textarea' | 'text', rows?: number }> = [
    { key: 'personalNotes', label: 'Persönliche Notizen / Über mich', placeholder: 'Was Dich bewegt, Deine Motivation, Deine Werte...', type: 'textarea', rows: 4 },
    { key: 'experience', label: 'Berufliche Erfahrungen', placeholder: 'Deine wichtigsten Stationen, Projekte, Verantwortlichkeiten...', type: 'textarea', rows: 4 },
    { key: 'qualifications', label: 'Qualifikationen & Ausbildungen', placeholder: 'Deine Abschlüsse, Zertifikate, Weiterbildungen...', type: 'textarea', rows: 4 },
    { key: 'targetIndustries', label: 'Zielbranchen & Wunschunternehmen', placeholder: 'In welchen Bereichen möchtest Du arbeiten? Gibt es konkrete Unternehmen?', type: 'textarea', rows: 3 },
    { key: 'exclusionCriteria', label: 'Ausschlusskriterien', placeholder: 'Welche Branchen, Tätigkeiten oder Unternehmensformen kommen für Dich nicht in Frage?', type: 'textarea', rows: 3 },
  ];

  const identityProfileFields: Array<{ key: keyof ProfileData; label: string; placeholder: string, rows?: number }> = [
    { key: 'eigenschaftenPersoenlichkeit', label: 'Meine Eigenschaften und Persönlichkeit (manuelle Ergänzung)', placeholder: 'z.B. analytisch, kreativ, teamorientiert... (Ergänzend zum Persönlichkeits-Screening)', rows: 3 },
    { key: 'neigungenInteressen', label: 'Meine Neigungen und Interessen (allgemein & manuell)', placeholder: 'z.B. Technologie-Trends, Nachhaltigkeit, Kunst... (Ergänzend zum RIASEC-Check)', rows: 3 },
    { key: 'motiveAntriebe', label: 'Meine Motive und Antriebe', placeholder: 'z.B. Wissenserweiterung, positive Wirkung erzielen...', rows: 3 },
    { key: 'faehigkeitenKompetenzen', label: 'Meine besonderen Fähigkeiten und Kompetenzen', placeholder: 'z.B. Softwareentwicklung, Projektmanagement, Kommunikation...', rows: 3 },
  ];

  const displayProfilePicture = selectedImage || profileData.profilePicture;
  const RATING_SCALE_MAX = 10; // Shared scale for display

  const ExportButton: React.FC<{onClick: () => void, className?: string, children?: React.ReactNode}> = ({onClick, children, className}) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }} // Stop propagation to prevent details from closing
      className={`print:hidden ml-auto px-3 py-1.5 text-xs rounded-md transition-colors shadow-sm flex items-center gap-1 ${className || 'bg-yellow-500 text-white hover:bg-yellow-600'}`}>
        <DocumentTextIcon className="w-3.5 h-3.5"/> {children || "Als TXT exportieren"}
    </button>
  );

  const ReportSection: React.FC<{title: string, reportContent: string | undefined, exportFilename: string, exportSuccessMessage: string, defaultOpen?: boolean, accentColor?: string, children?: React.ReactNode}> = 
  ({ title, reportContent, exportFilename, exportSuccessMessage, defaultOpen = false, accentColor = "purple", children }) => {
    // Render section if children are provided, OR if reportContent is valid (not empty and not an error message)
    const shouldRender = children || (reportContent && reportContent.trim() !== "" && !reportContent.startsWith("Fehler:"));
    
    if (!shouldRender) return null;

    return (
        <details className="printable-details-section bg-white rounded-lg shadow-sm overflow-hidden group" open={defaultOpen}>
            <summary 
              className={`flex justify-between items-center p-3 cursor-pointer list-none transition-colors duration-200 border-l-4 group-open:border-b 
                         border-${accentColor}-500 bg-${accentColor}-50 hover:bg-${accentColor}-100`}
            >
                <span className={`text-md font-semibold text-${accentColor}-700`}>{title}</span>
                <div className="flex items-center">
                   {reportContent && !reportContent.startsWith("Fehler:") && exportFilename &&
                     <ExportButton 
                        onClick={() => handleExport(reportContent, exportFilename, exportSuccessMessage)} 
                        className={`bg-${accentColor}-500 hover:bg-${accentColor}-600 text-white mr-2`} 
                      />
                   }
                  <span className={`text-${accentColor}-500 transform transition-transform duration-300 ease-in-out group-open:rotate-180`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </div>
            </summary>
            <div className={`p-4 border-t border-${accentColor}-200`}>
                {children ? children : renderFormattedText(reportContent, "Kein Report für diesen Bereich vorhanden oder Daten sind noch nicht ausreichend für eine Generierung.")}
            </div>
        </details>
    );
  };


  return (
    <div className="p-0 md:p-0">
      {/* Header and Save Button are part of HomePage's details summary */}

      <div className="mb-10 pb-6 border-b border-slate-300">
        <h3 className="text-2xl font-semibold text-slate-700 mb-4">Deine Basisdaten</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 print:hidden">
          <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-slate-300">
            {displayProfilePicture ? (
              <img src={displayProfilePicture} alt="Profilbild" className="w-full h-full object-cover" />
            ) : (
              <UserCircleIcon className="w-20 h-20 text-slate-400" />
            )}
          </div>
          <div>
            <input
              type="file"
              id="profilePictureUpload"
              accept="image/png, image/jpeg, image/gif"
              onChange={handleImageUpload}
              className="hidden"
            />
            <label
              htmlFor="profilePictureUpload"
              className="cursor-pointer px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow text-sm"
            >
              Bild auswählen
            </label>
            {displayProfilePicture && (
                 <button
                    onClick={() => {
                        setSelectedImage(null);
                        onProfileChange('profilePicture', '');
                    }}
                    className="ml-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow text-sm"
                >
                    Bild entfernen
                </button>
            )}
            <p className="text-xs text-slate-500 mt-2">PNG, JPG oder GIF. Max. 2MB empfohlen.</p>
          </div>
        </div>
        
        <div className="mb-6 max-w-md">
          <label htmlFor="currentPhase" className="block text-md font-semibold text-slate-700 mb-1">
            Meine aktuelle berufliche Phase:
          </label>
          <select
            id="currentPhase"
            name="currentPhase"
            value={profileData.currentPhase || 'nicht_gesetzt'}
            onChange={(e) => onProfileChange('currentPhase', e.target.value as CareerPhase)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 print:hidden"
          >
            {CAREER_PHASES.map(phase => (
              <option key={phase.value} value={phase.value}>
                {phase.label}
              </option>
            ))}
          </select>
           <p className="text-md text-slate-700 mt-1 hidden print:block"> {/* For print view */}
            {CAREER_PHASES.find(p => p.value === (profileData.currentPhase || 'nicht_gesetzt'))?.label || 'Nicht angegeben'}
          </p>
          <p className="text-xs text-slate-500 mt-1 print:hidden">Diese Angabe hilft, die KI-Empfehlungen besser auf Deine Situation zuzuschneiden.</p>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 mb-10">
        <div className="space-y-6">
          {generalFormFields.slice(0, Math.ceil(generalFormFields.length / 2)).map(field => (
            <div key={field.key}>
              <label htmlFor={field.key as string} className="block text-md font-semibold text-slate-700 mb-1">
                {field.label}
              </label>
              <textarea
                  id={field.key as string}
                  name={field.key as string}
                  rows={field.rows || 4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 print:hidden"
                  placeholder={field.placeholder}
                  value={profileData[field.key] as string}
                  onChange={(e) => onProfileChange(field.key, e.target.value)}
                />
                 <div className="p-1 text-slate-700 hidden print:block print:border print:border-slate-200 print:rounded-md print:bg-slate-50 min-h-[2em]">
                    {(profileData[field.key] as string || "").split('\n').map((line, i) => <p key={i} className="mb-0">{line}</p>)}
                </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
           {generalFormFields.slice(Math.ceil(generalFormFields.length / 2)).map(field => (
            <div key={field.key}>
              <label htmlFor={field.key as string} className="block text-md font-semibold text-slate-700 mb-1">
                {field.label}
              </label>
              <textarea
                  id={field.key as string}
                  name={field.key as string}
                  rows={field.rows || 4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 print:hidden"
                  placeholder={field.placeholder}
                  value={profileData[field.key] as string}
                  onChange={(e) => onProfileChange(field.key, e.target.value)}
                />
                <div className="p-1 text-slate-700 hidden print:block print:border print:border-slate-200 print:rounded-md print:bg-slate-50 min-h-[2em]">
                    {(profileData[field.key] as string || "").split('\n').map((line, i) => <p key={i} className="mb-0">{line}</p>)}
                </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-10 pt-6 border-t border-slate-300">
        <h3 className="text-2xl font-semibold text-slate-700 mb-6">Dein berufliches Identitätsprofil (Manuelle Angaben)</h3>
        
        <div className="mb-6">
            <label htmlFor="identitaetProfilGesamtbericht" className="block text-md font-semibold text-slate-700 mb-1">
                Deine Gesamteinschätzung / Zusammenfassung zum Identitätsprofil (manuell)
            </label>
            <textarea
                id="identitaetProfilGesamtbericht"
                name="identitaetProfilGesamtbericht"
                rows={5}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 print:hidden"
                placeholder="Hier kannst Du eine ausführliche Selbstbeschreibung Deiner beruflichen Identität verfassen."
                value={profileData.identitaetProfilGesamtbericht}
                onChange={(e) => onProfileChange('identitaetProfilGesamtbericht', e.target.value)}
            />
             <div className="p-1 text-slate-700 hidden print:block print:border print:border-slate-200 print:rounded-md print:bg-slate-50 min-h-[2em]">
                {(profileData.identitaetProfilGesamtbericht || "").split('\n').map((line, i) => <p key={i} className="mb-0">{line}</p>)}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {identityProfileFields.map(fieldInfo => (
            <div key={fieldInfo.key}>
              <label htmlFor={fieldInfo.key as string} className="block text-md font-semibold text-slate-700 mb-1">
                {fieldInfo.label}
              </label>
              <textarea
                id={fieldInfo.key as string}
                name={fieldInfo.key as string}
                rows={fieldInfo.rows || 3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 print:hidden"
                placeholder={fieldInfo.placeholder}
                value={profileData[fieldInfo.key] as string}
                onChange={(e) => onProfileChange(fieldInfo.key, e.target.value)}
              />
              <div className="p-1 text-slate-700 hidden print:block print:border print:border-slate-200 print:rounded-md print:bg-slate-50 min-h-[2em]">
                 {(profileData[fieldInfo.key] as string || "").split('\n').map((line, i) => <p key={i} className="mb-0">{line}</p>)}
              </div>

              {fieldInfo.key === 'neigungenInteressen' && profileData.riasec && (
                <div className="mt-2 p-3 bg-sky-50 border border-sky-200 rounded-md text-sm text-sky-700 shadow-sm print:hidden">
                  <p className="font-semibold">
                    Hinweis zum RIASEC Interessen-Check:
                  </p>
                  <p>
                    Ergebnisse aus dem RIASEC Tool (Holland Code: <strong className="text-sky-800">{profileData.riasec.hollandCode || 'N/A'}</strong>) ergänzen dies. Vollständiger Report unten.
                  </p>
                </div>
              )}
              {fieldInfo.key === 'eigenschaftenPersoenlichkeit' && profileData.personalityScreening && (
                 <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 shadow-sm print:hidden">
                  <p className="font-semibold">
                    Hinweis zum Persönlichkeits-Screening:
                  </p>
                  <p>
                    Ergebnisse aus dem Persönlichkeits-Screening (Big Five) ergänzen dies. Vollständiger Report unten.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-10 pt-6 border-t-2 border-purple-300 bg-purple-50/30 p-4 rounded-lg">
        <details className="printable-details-section group" open>
          <summary className="text-2xl font-semibold text-purple-700 mb-1 cursor-pointer list-none flex justify-between items-center p-2 rounded-md hover:bg-purple-100 transition-colors">
            Meine Analysen & Empfehlungen von Dr. GoodWork
            <span className="text-purple-500 transform transition-transform duration-300 ease-in-out group-open:rotate-180">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </span>
          </summary>
          <div className="space-y-4 mt-4">
            <ReportSection
                title="Gespeicherte Dr. GoodWork Gesamt-Tipps"
                reportContent={profileData.savedAiRecommendation}
                exportFilename="dr_goodwork_gesamt_tipps.txt"
                exportSuccessMessage="Dr. GoodWork Gesamt-Tipps exportiert."
                accentColor="indigo"
                defaultOpen={!!profileData.savedAiRecommendation}
            />
            <ReportSection
                title="Von Dr. GoodWork erstelltes Berufliches Identitätsprofil"
                reportContent={profileData.beruflichesIdentitaetsProfilReport}
                exportFilename="berufliches_identitaetsprofil_report.txt"
                exportSuccessMessage="Berufliches Identitätsprofil Report exportiert."
                accentColor="purple"
                defaultOpen={!!profileData.beruflichesIdentitaetsProfilReport}
            />
            <ReportSection
                title="Persönliche Entscheidungshilfe von Dr. GoodWork"
                reportContent={profileData.decisionCriteriaReport}
                exportFilename="persoenliche_entscheidungshilfe.txt"
                exportSuccessMessage="Persönliche Entscheidungshilfe exportiert."
                accentColor="green"
                defaultOpen={!!profileData.decisionCriteriaReport}
            />
            <ReportSection
                title="Persönlicher Culture Match Report von Dr. GoodWork"
                reportContent={profileData.cultureMatchReport}
                exportFilename="culture_match_report.txt"
                exportSuccessMessage="Culture Match Report exportiert."
                accentColor="teal"
                defaultOpen={!!profileData.cultureMatchReport}
            />
          </div>
        </details>
      </div>

      {/* Tool Specific Reports Section */}
       <div className="mb-10 pt-6 border-t-2 border-sky-300 bg-sky-50/30 p-4 rounded-lg">
        <details className="printable-details-section group" open>
            <summary className="text-2xl font-semibold text-sky-700 mb-1 cursor-pointer list-none flex justify-between items-center p-2 rounded-md hover:bg-sky-100 transition-colors">
                Meine individuellen Tool-Ergebnisreports
                 <span className="text-sky-500 transform transition-transform duration-300 ease-in-out group-open:rotate-180">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </span>
            </summary>
            <div className="space-y-4 mt-4">
                <ReportSection
                    title="Dein RIASEC Interessenprofil (Detailansicht)"
                    reportContent={profileData.riasec?.report}
                    exportFilename="riasec_interessen_report.txt"
                    exportSuccessMessage="RIASEC Report exportiert."
                    accentColor="sky"
                    defaultOpen={!!profileData.riasec?.report}
                >
                   {profileData.riasec && (
                       <>
                        <p className="text-sm text-slate-600 mb-1">Test durchgeführt am: {profileData.riasec.lastRun ? new Date(profileData.riasec.lastRun).toLocaleString('de-DE') : 'N/A'}</p>
                        {profileData.riasec.hollandCode && (
                        <p className="text-md font-semibold text-slate-700">Dein Holland-Code: <span className="font-bold text-sky-600">{profileData.riasec.hollandCode}</span>
                            {profileData.riasec.hollandType && <span className="text-slate-600"> ({profileData.riasec.hollandType})</span>}
                        </p>
                        )}
                        {profileData.riasec.hierarchy && profileData.riasec.hierarchy.length > 0 && (
                            <p className="text-md font-semibold text-slate-700 mt-1">Interessen-Hierarchie: <span className="font-normal text-sky-600">{profileData.riasec.hierarchy.join(' > ')}</span></p>
                        )}
                        {profileData.riasec.sortedScores && profileData.riasec.sortedScores.length > 0 && (
                        <div className="overflow-x-auto mt-3 mb-2">
                            <table className="min-w-full bg-white shadow rounded-md text-xs">
                            <thead className="bg-slate-100">
                                <tr>
                                <th className="p-1.5 text-left font-semibold text-slate-600">Bereich</th>
                                <th className="p-1.5 text-left font-semibold text-slate-600">Ø Wert</th>
                                <th className="p-1.5 text-left font-semibold text-slate-600 w-[40%]">Ausprägung</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profileData.riasec.sortedScores.map(item => (
                                <tr key={item.area} className="border-b border-slate-200 last:border-b-0">
                                    <td className="p-1.5 text-slate-700">{item.label} ({item.area})</td>
                                    <td className="p-1.5 text-slate-700">{item.value.toFixed(2)}</td>
                                    <td className="p-1.5">
                                    <div className="h-4 rounded bg-slate-200 relative overflow-hidden">
                                        <span 
                                        className="absolute h-full left-0 top-0 rounded"
                                        style={{ width: `${item.value * 10}%`, backgroundColor: item.color }}
                                        ></span>
                                    </div>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                        )}
                        {profileData.riasec.report ? renderFormattedText(profileData.riasec.report, "Kein RIASEC Report vorhanden.") : <p className="italic text-sm text-slate-500 mt-2">Der detaillierte KI-Report zu Deinem RIASEC Profil wird hier angezeigt, sobald er generiert wurde.</p>}
                       </>
                   )}
                </ReportSection>

                <ReportSection
                    title="Dein Persönlichkeits-Profil (Detailansicht)"
                    reportContent={profileData.personalityScreening?.report}
                    exportFilename="persoenlichkeit_report.txt"
                    exportSuccessMessage="Persönlichkeits-Report exportiert."
                    accentColor="red"
                    defaultOpen={!!profileData.personalityScreening?.report}
                >
                  {profileData.personalityScreening && (
                    <>
                        <p className="text-sm text-slate-600 mb-2">Screening durchgeführt am: {profileData.personalityScreening.lastRun ? new Date(profileData.personalityScreening.lastRun).toLocaleString('de-DE') : 'N/A'}</p>
                        {profileData.personalityScreening.selectedGeneralAdjectives && profileData.personalityScreening.selectedGeneralAdjectives.length > 0 && (
                            <div className="mb-3 p-2 bg-white rounded shadow-sm border border-red-100">
                                <h4 className="font-medium text-xs text-red-700 mb-1">Selbst zugeschriebene Eigenschaften:</h4>
                                <ul className="list-disc list-inside text-xs text-slate-600 columns-2">
                                    {profileData.personalityScreening.selectedGeneralAdjectives.map(adj => <li key={adj}>{adj}</li>)}
                                </ul>
                            </div>
                        )}
                        {profileData.personalityScreening.bigFiveScores && profileData.personalityScreening.bigFiveScores.length > 0 && (
                        <>
                            <h4 className="font-medium text-xs text-red-700 mb-1 mt-2">Big Five Ergebnisse (Skala 1-10):</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                            {profileData.personalityScreening.bigFiveScores.map((dim: BigFiveDimensionScore) => (
                                <div key={dim.dimension} className="p-2 bg-white rounded shadow-sm border-l-2" style={{ borderColor: dim.color }}>
                                <h5 className="font-semibold" style={{ color: dim.color }}>{dim.label}</h5>
                                <p className="text-slate-600">Score: <strong>{dim.score.toFixed(2)}</strong></p>
                                 <div className="mt-0.5 h-2 w-full bg-slate-200 rounded">
                                    <div style={{ width: `${(dim.score / RATING_SCALE_MAX) * 100}%`, backgroundColor: dim.color }} className="h-2 rounded"></div>
                                </div>
                                <p className="text-slate-500 mt-0.5">
                                    Pole: {dim.positivePole.poleLabel} ({dim.positivePole.score.toFixed(2)}) vs. {dim.negativePole.poleLabel} ({dim.negativePole.score.toFixed(2)})
                                </p>
                                </div>
                            ))}
                            </div>
                        </>
                        )}
                         {profileData.personalityScreening.report ? renderFormattedText(profileData.personalityScreening.report, "Kein Persönlichkeits-Report vorhanden.") : <p className="italic text-sm text-slate-500 mt-2">Der detaillierte KI-Report zu Deinem Persönlichkeitsprofil wird hier angezeigt.</p>}
                    </>
                  )}
                </ReportSection>
                
                <ReportSection
                    title="Dein Antriebe & Motivation Profil (Detailansicht)"
                    reportContent={profileData.motivationScreening?.report}
                    exportFilename="motivation_report.txt"
                    exportSuccessMessage="Motivations-Report exportiert."
                    accentColor="orange"
                    defaultOpen={!!profileData.motivationScreening?.report}
                >
                  {profileData.motivationScreening && (
                    <>
                        <p className="text-sm text-slate-600 mb-2">Screening durchgeführt am: {profileData.motivationScreening.lastRun ? new Date(profileData.motivationScreening.lastRun).toLocaleString('de-DE') : 'N/A'}</p>
                        {profileData.motivationScreening.dimensionScores && profileData.motivationScreening.dimensionScores.length > 0 && (
                        <>
                            <h4 className="font-medium text-xs text-orange-700 mb-1 mt-2">Anreizdimensionen (Durchschnittswerte, sortiert):</h4>
                            <div className="space-y-2 text-xs">
                            {profileData.motivationScreening.dimensionScores.map((dim: MotiveDimensionScore) => (
                                <div key={dim.id} className="p-2 bg-white rounded shadow-sm border-l-2" style={{ borderColor: dim.color }}>
                                <h5 className="font-semibold" style={{ color: dim.color }}>{dim.label}</h5>
                                <p className="text-slate-600">Durchschnitt: <strong>{dim.averageScore.toFixed(1)} / 10</strong></p>
                                 <div className="mt-0.5 h-2 w-full bg-slate-200 rounded">
                                    <div style={{ width: `${(dim.averageScore / RATING_SCALE_MAX) * 100}%`, backgroundColor: dim.color }} className="h-2 rounded"></div>
                                </div>
                                <details className="text-2xs mt-1">
                                    <summary className="cursor-pointer text-slate-500">Motive anzeigen (sortiert)</summary>
                                    <ul className="list-disc list-inside pl-2">
                                        {dim.motivations.map(m => <li key={m.id}>{m.label}: {m.value}</li>)}
                                    </ul>
                                </details>
                                </div>
                            ))}
                            </div>
                        </>
                        )}
                         {profileData.motivationScreening.report ? renderFormattedText(profileData.motivationScreening.report, "Kein Motivations-Report vorhanden.") : <p className="italic text-sm text-slate-500 mt-2">Der detaillierte KI-Report zu Deinen Antrieben und Motiven wird hier angezeigt.</p>}
                    </>
                  )}
                </ReportSection>

                 <ReportSection
                    title="Dein Future Skills Profil (Detailansicht)"
                    reportContent={profileData.futureSkillsScreening?.report}
                    exportFilename="future_skills_report.txt"
                    exportSuccessMessage="Future Skills Report exportiert."
                    accentColor="lime"
                    defaultOpen={!!profileData.futureSkillsScreening?.report}
                >
                  {profileData.futureSkillsScreening && (
                    <>
                        <p className="text-sm text-slate-600 mb-2">Screening durchgeführt am: {profileData.futureSkillsScreening.lastRun ? new Date(profileData.futureSkillsScreening.lastRun).toLocaleString('de-DE') : 'N/A'}</p>
                        {profileData.futureSkillsScreening.dimensionScores && profileData.futureSkillsScreening.dimensionScores.length > 0 && (
                        <>
                            <h4 className="font-medium text-xs text-lime-700 mb-1 mt-2">Kompetenzdimensionen (Durchschnittswerte, sortiert):</h4>
                            <div className="space-y-2 text-xs">
                            {profileData.futureSkillsScreening.dimensionScores.map((dim: FutureSkillDimensionScore) => (
                                <div key={dim.id} className="p-2 bg-white rounded shadow-sm border-l-2" style={{ borderColor: dim.color }}>
                                <h5 className="font-semibold" style={{ color: dim.color }}>{dim.label}</h5>
                                <p className="text-slate-600">Durchschnitt: <strong>{dim.averageScore.toFixed(1)} / 10</strong></p>
                                 <div className="mt-0.5 h-2 w-full bg-slate-200 rounded">
                                    <div style={{ width: `${(dim.averageScore / RATING_SCALE_MAX) * 100}%`, backgroundColor: dim.color }} className="h-2 rounded"></div>
                                </div>
                                <details className="text-2xs mt-1">
                                    <summary className="cursor-pointer text-slate-500">Skills anzeigen (sortiert)</summary>
                                    <ul className="list-disc list-inside pl-2">
                                        {dim.skills.map(s => <li key={s.id}>{s.label}: {s.value}</li>)}
                                    </ul>
                                </details>
                                </div>
                            ))}
                            </div>
                        </>
                        )}
                        {profileData.futureSkillsScreening.report ? renderFormattedText(profileData.futureSkillsScreening.report, "Kein Future Skills Report vorhanden.") : <p className="italic text-sm text-slate-500 mt-2">Der detaillierte KI-Report zu Deinen Future Skills wird hier angezeigt.</p>}
                    </>
                  )}
                </ReportSection>
            </div>
        </details>
      </div>

      <div className="mt-12 pt-8 border-t-2 border-dashed border-red-300 bg-red-50/30 p-4 rounded-lg">
        <h3 className="text-xl font-semibold text-red-700 mb-3">Achtung: Gefahrenzone</h3>
        <p className="text-sm text-slate-600 mb-4">
          Mit der folgenden Aktion kannst Du Dein gesamtes Profil unwiderruflich auf die Werkseinstellungen zurücksetzen.
          Alle Deine Eingaben, Ergebnisse aus Tools (Valou, RIASEC, Persönlichkeit etc.) und gespeicherte KI-Empfehlungen gehen dabei verloren.
        </p>
        <button
          onClick={onResetProfile}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg text-sm font-semibold flex items-center gap-2"
          aria-label="Gesamtes Profil unwiderruflich zurücksetzen"
        >
          <RefreshIcon className="w-5 h-5" />
          Gesamtes Profil zurücksetzen
        </button>
      </div>

    </div>
  );
};

export default ProfileView;
