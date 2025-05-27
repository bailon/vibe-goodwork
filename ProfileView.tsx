



import React, { ChangeEvent, useState } from 'react';
import { ProfileData, UserDataCategoryKey, UserDataCollection, RiasecData, PersonalityScreeningData, BigFiveDimensionScore, CareerPhase } from '../types';
import { VALOU_AREAS, CATEGORY_LABELS, RIASEC_DESCRIPTIONS, BIG_FIVE_DIMENSION_DEFINITIONS, CAREER_PHASES } from '../constants';
import UserCircleIcon from './icons/UserCircleIcon';
import { isValouDataEffectivelyEmpty } from '../appUtils';
import RefreshIcon from './icons/RefreshIcon'; // Using an existing icon

interface ProfileViewProps {
  profileData: ProfileData;
  onProfileChange: (field: keyof ProfileData, value: string | UserDataCollection | RiasecData | PersonalityScreeningData | CareerPhase | undefined) => void;
  onSaveProfile: () => void;
  onResetProfile: () => void;
  // Fix: Use the renderFormattedText prop passed from App/HomePage
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
  const ADJECTIVE_RATING_SCALE_MAX = 10; // Consistent with PersonalityToolPage

  return (
    <div className="p-0 md:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-4 sm:mb-0">Dein GoodWork Profil</h2>
        <button
          onClick={onSaveProfile}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow hover:shadow-md text-sm"
          aria-label="Deine Profiländerungen speichern"
        >
          Profil speichern
        </button>
      </div>

      <div className="mb-10 pb-6 border-b border-slate-300">
        <h3 className="text-2xl font-semibold text-slate-700 mb-4">Deine Basisdaten</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
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
        
        {/* Current Career Phase Selector */}
        <div className="mb-6 max-w-md">
          <label htmlFor="currentPhase" className="block text-md font-semibold text-slate-700 mb-1">
            Meine aktuelle berufliche Phase:
          </label>
          <select
            id="currentPhase"
            name="currentPhase"
            value={profileData.currentPhase || 'nicht_gesetzt'}
            onChange={(e) => onProfileChange('currentPhase', e.target.value as CareerPhase)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700"
          >
            {CAREER_PHASES.map(phase => (
              <option key={phase.value} value={phase.value}>
                {phase.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">Diese Angabe hilft, die KI-Empfehlungen besser auf Deine Situation zuzuschneiden.</p>
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700"
                  placeholder={field.placeholder}
                  value={profileData[field.key] as string}
                  onChange={(e) => onProfileChange(field.key, e.target.value)}
                />
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700"
                  placeholder={field.placeholder}
                  value={profileData[field.key] as string}
                  onChange={(e) => onProfileChange(field.key, e.target.value)}
                />
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-10 pt-6 border-t border-slate-300">
        <h3 className="text-2xl font-semibold text-slate-700 mb-6">Dein berufliches Identitätsprofil</h3>
        
        <div className="mb-6">
            <label htmlFor="identitaetProfilGesamtbericht" className="block text-md font-semibold text-slate-700 mb-1">
                Dein Gesamtreport / Deine Zusammenfassung zum beruflichen Identitätsprofil
            </label>
            <textarea
                id="identitaetProfilGesamtbericht"
                name="identitaetProfilGesamtbericht"
                rows={5}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700"
                placeholder="Hier kannst Du einen Gesamtreport einfügen oder eine ausführliche Selbstbeschreibung Deiner beruflichen Identität verfassen."
                value={profileData.identitaetProfilGesamtbericht}
                onChange={(e) => onProfileChange('identitaetProfilGesamtbericht', e.target.value)}
            />
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700"
                placeholder={fieldInfo.placeholder}
                value={profileData[fieldInfo.key] as string}
                onChange={(e) => onProfileChange(fieldInfo.key, e.target.value)}
              />
              {fieldInfo.key === 'neigungenInteressen' && profileData.riasec && (
                <div className="mt-2 p-3 bg-sky-50 border border-sky-200 rounded-md text-sm text-sky-700 shadow-sm">
                  <p className="font-semibold">
                    Hinweis zum RIASEC Interessen-Check:
                  </p>
                  <p>
                    Deine detaillierten Ergebnisse aus dem RIASEC Interessen-Check (Holland Code: <strong className="text-sky-800">{profileData.riasec.hollandCode || 'N/A'}</strong>
                    {profileData.riasec.hollandType && ` - ${profileData.riasec.hollandType}`}) ergänzen diese manuellen Eingaben.
                    Du findest den vollständigen RIASEC-Report weiter unten in Deinem Profil.
                  </p>
                </div>
              )}
              {fieldInfo.key === 'eigenschaftenPersoenlichkeit' && profileData.personalityScreening && (
                 <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 shadow-sm">
                  <p className="font-semibold">
                    Hinweis zum Persönlichkeits-Screening:
                  </p>
                  <p>
                    Deine Ergebnisse aus dem Persönlichkeits-Screening (z.B. Big Five) ergänzen diese manuellen Eingaben. Den vollständigen Report findest Du weiter unten.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {profileData.riasec && (
        <div className="mb-10 pt-6 border-t border-slate-300">
          <h3 className="text-2xl font-semibold text-slate-700 mb-4">Dein RIASEC Interessenprofil (Detailansicht)</h3>
          <div className="bg-sky-50 p-4 rounded-lg shadow">
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
              <div className="overflow-x-auto mt-4 mb-4">
                <table className="min-w-full bg-white shadow rounded-md text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 text-left font-semibold text-slate-600">Bereich</th>
                      <th className="p-2 text-left font-semibold text-slate-600">Kürzel</th>
                      <th className="p-2 text-left font-semibold text-slate-600">Ø Wert</th>
                      <th className="p-2 text-left font-semibold text-slate-600 w-[50%]">Ausprägung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileData.riasec.sortedScores.map(item => (
                      <tr key={item.area} className="border-b border-slate-200 last:border-b-0">
                        <td className="p-2 text-slate-700">{item.label}</td>
                        <td className="p-2 text-slate-700">{item.area}</td>
                        <td className="p-2 text-slate-700">{item.value.toFixed(2)}</td>
                        <td className="p-2">
                          <div className="h-5 rounded bg-slate-200 relative overflow-hidden">
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

            {profileData.riasec.report && (
              <details className="mt-4">
                <summary className="cursor-pointer text-md font-semibold text-sky-700 hover:text-sky-800">
                  Deinen persönlichen RIASEC KI-Report anzeigen/verbergen
                </summary>
                <div className="mt-2 p-4 bg-white rounded-md border border-sky-200 shadow-inner">
                  {renderFormattedText(profileData.riasec.report)}
                </div>
              </details>
            )}
          </div>
        </div>
      )}

      {profileData.personalityScreening && (
        <div className="mb-10 pt-6 border-t border-slate-300">
          <h3 className="text-2xl font-semibold text-slate-700 mb-4">Dein Persönlichkeits-Profil (Detailansicht)</h3>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <p className="text-sm text-slate-600 mb-3">Screening durchgeführt am: {profileData.personalityScreening.lastRun ? new Date(profileData.personalityScreening.lastRun).toLocaleString('de-DE') : 'N/A'}</p>
            
            {profileData.personalityScreening.selectedGeneralAdjectives && profileData.personalityScreening.selectedGeneralAdjectives.length > 0 && (
                 <div className="mb-4 p-3 bg-white rounded shadow-sm border border-red-200">
                    <h4 className="font-semibold text-md text-red-700 mb-2">Deine selbst zugeschriebenen Eigenschaften:</h4>
                    <ul className="list-disc list-inside text-sm text-slate-700 columns-2 sm:columns-3">
                        {profileData.personalityScreening.selectedGeneralAdjectives.map(adj => <li key={adj}>{adj}</li>)}
                    </ul>
                 </div>
            )}

            {profileData.personalityScreening.bigFiveScores && profileData.personalityScreening.bigFiveScores.length > 0 && (
                <>
                    <h4 className="font-semibold text-md text-red-700 mb-3 mt-4">Big Five Ergebnisse:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
                    {profileData.personalityScreening.bigFiveScores.map((dim: BigFiveDimensionScore) => (
                        <div key={dim.dimension} className="p-3 bg-white rounded shadow-sm border-l-4" style={{ borderColor: dim.color }}>
                        <h5 className="font-semibold text-md" style={{ color: dim.color }}>{dim.label} ({dim.dimension})</h5>
                        <p className="text-sm text-slate-600">Score: <strong className="text-slate-800">{dim.score.toFixed(2)} / {ADJECTIVE_RATING_SCALE_MAX}</strong></p>
                        <div className="mt-1 h-2.5 w-full bg-slate-200 rounded">
                            <div style={{ width: `${(dim.score / ADJECTIVE_RATING_SCALE_MAX) * 100}%`, backgroundColor: dim.color }} className="h-2.5 rounded"></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Tendenz zu: {dim.score > (ADJECTIVE_RATING_SCALE_MAX / 2) ? `${dim.positivePole.poleLabel} (${dim.positivePole.score.toFixed(2)})` : `${dim.negativePole.poleLabel} (${dim.negativePole.score.toFixed(2)})`}
                        </p>
                        </div>
                    ))}
                    </div>
                </>
            )}

            {profileData.personalityScreening.report && (
              <details className="mt-4">
                <summary className="cursor-pointer text-md font-semibold text-red-700 hover:text-red-800">
                  Deinen persönlichen KI-Report (Big Five & Selbstbild) anzeigen/verbergen
                </summary>
                <div className="mt-2 p-4 bg-white rounded-md border border-red-200 shadow-inner">
                  {renderFormattedText(profileData.personalityScreening.report)}
                </div>
              </details>
            )}
          </div>
        </div>
      )}
      
      {profileData.beruflichesIdentitaetsProfilReport && profileData.beruflichesIdentitaetsProfilReport.trim() !== "" && (
        <div className="mb-10 pt-6 border-t border-slate-300">
          <h3 className="text-2xl font-semibold text-slate-700 mb-4">Mein von Dr. GoodWork erstelltes Berufliches Identitätsprofil</h3>
           <details className="mt-4" open>
            <summary className="cursor-pointer text-md font-semibold text-purple-700 hover:text-purple-800">
              Umfassenden Identitätsreport anzeigen/verbergen
            </summary>
            <div className="mt-2 p-4 bg-purple-50 rounded-lg shadow-inner border border-purple-200">
              {renderFormattedText(profileData.beruflichesIdentitaetsProfilReport)}
            </div>
          </details>
        </div>
      )}


      {!isValouDataEffectivelyEmpty(profileData.valouZielstylingData) && (
        <div className="mb-10 pt-6 border-t border-slate-300">
            <h3 className="text-2xl font-semibold text-slate-700 mb-4">Deine Valou Zielstyling Zusammenfassung</h3>
            <details>
                 <summary className="cursor-pointer text-md font-semibold text-purple-700 hover:text-purple-800">
                  Valou Zielstyling Zusammenfassung anzeigen/verbergen
                </summary>
                <div className="mt-2 p-4 bg-purple-50 rounded-lg shadow-inner border border-purple-200">
                    {renderFormattedText(profileData.valouZielstylingSummary, "Du hast noch keine Valou Styling Daten erfasst.")}
                </div>
            </details>
        </div>
      )}
      
      {profileData.savedAiRecommendation && (
        <div className="mb-10 pt-6 border-t border-slate-300">
          <h3 className="text-2xl font-semibold text-slate-700 mb-4">Deine Dr. GoodWork Gesamt-Tipps</h3>
          <details>
            <summary className="cursor-pointer text-md font-semibold text-indigo-700 hover:text-indigo-800">
              Gespeicherte Dr. GoodWork Tipps anzeigen/verbergen
            </summary>
            <div className="mt-2 p-4 bg-indigo-50 rounded-lg shadow-inner border border-indigo-200">
              {renderFormattedText(profileData.savedAiRecommendation)}
            </div>
          </details>
        </div>
      )}
      
      {profileData.decisionCriteriaReport && (
        <div className="mb-10 pt-6 border-t border-slate-300">
          <h3 className="text-2xl font-semibold text-slate-700 mb-4">Deine Persönliche Entscheidungshilfe von Dr. GoodWork</h3>
           <details className="mt-4" open>
            <summary className="cursor-pointer text-md font-semibold text-green-700 hover:text-green-800">
              Entscheidungsmatrix und Report anzeigen/verbergen
            </summary>
            <div className="mt-2 p-4 bg-green-50 rounded-lg shadow-inner border border-green-200">
              {renderFormattedText(profileData.decisionCriteriaReport)}
            </div>
          </details>
        </div>
      )}

      {profileData.cultureMatchReport && (
        <div className="mb-10 pt-6 border-t border-slate-300">
          <h3 className="text-2xl font-semibold text-slate-700 mb-4">Dein Persönlicher Culture Match Report von Dr. GoodWork</h3>
           <details className="mt-4" open>
            <summary className="cursor-pointer text-md font-semibold text-teal-700 hover:text-teal-800">
              Culture Match Report anzeigen/verbergen
            </summary>
            <div className="mt-2 p-4 bg-teal-50 rounded-lg shadow-inner border border-teal-200">
              {renderFormattedText(profileData.cultureMatchReport)}
            </div>
          </details>
        </div>
      )}


      <div className="mt-12 pt-8 border-t-2 border-dashed border-red-300">
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