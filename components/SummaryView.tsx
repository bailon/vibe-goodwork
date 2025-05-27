
import React from 'react';
import { ValouAreaItem, UserDataCollection, USER_DATA_CATEGORIES } from '../types';
import { CATEGORY_LABELS } from '../constants';

interface SummaryViewProps {
  areas: ValouAreaItem[];
  userData: UserDataCollection;
  valouZielstylingSummary?: string;
  renderFormattedText: (text: string | undefined, defaultText?: string) => JSX.Element | null;
}

const SummaryView: React.FC<SummaryViewProps> = ({ areas, userData, valouZielstylingSummary, renderFormattedText }) => {
  const hasAnyContent = areas.some(area => {
    const areaData = userData[area.id];
    if (!areaData) return false;
    return (areaData.stylingSatz && areaData.stylingSatz.trim() !== '') ||
           USER_DATA_CATEGORIES.some(cat => areaData[cat] && areaData[cat].length > 0);
  });

  const hasSummaryText = valouZielstylingSummary && valouZielstylingSummary.trim() !== "" && !valouZielstylingSummary.startsWith("Fehler:");

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl report-content-print">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 print:hidden">
        <h2 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Zusammenfassung Deiner Valou-Bereiche</h2>
      </div>
      
      {!hasAnyContent && !hasSummaryText && (
        <p className="text-center text-gray-500 py-10 print:hidden">
          Du hast noch keine Einträge in Deinen Valou-Bereichen vorgenommen oder die KI-Zusammenfassung wurde noch nicht generiert. Wechsle ins "Styling Studio", um Deine Daten zu erfassen.
        </p>
      )}

      {hasSummaryText && (
        <div className="mb-10 pb-6 border-b border-gray-300 print:border-b-2 print:border-black">
          <h3 className="text-2xl font-semibold mb-4 flex items-center" style={{ color: '#6d28d9' /* Purple */ }}>
            <span className="w-3 h-3 rounded-full mr-3 shrink-0 print:hidden" style={{backgroundColor: '#6d28d9'}}></span>
            Deine KI-generierte Valou Zusammenfassung
          </h3>
          <div className="p-4 bg-purple-50 rounded-lg shadow-inner border border-purple-200">
            {renderFormattedText(valouZielstylingSummary, "Zusammenfassung wird geladen oder ist nicht verfügbar.")}
          </div>
        </div>
      )}

      {hasAnyContent && <h3 className="text-2xl font-semibold mt-6 mb-4 text-gray-700 print:mt-4 print:text-xl">Detaillierte Einträge pro Bereich:</h3>}

      {areas.map(area => {
        const areaData = userData[area.id];
        if (!areaData) return null;

        const hasIndividualContent = 
          (areaData.stylingSatz && areaData.stylingSatz.trim() !== '') ||
          USER_DATA_CATEGORIES.some(cat => areaData[cat] && areaData[cat].length > 0);

        if (!hasIndividualContent) return null;

        return (
          <div key={area.id} className="mb-10 pb-6 border-b border-gray-200 last:border-b-0 print:break-inside-avoid print:border-none">
            <h4 className="text-xl font-semibold mb-2 flex items-center print:text-lg" style={{ color: area.color }}>
              <span className="w-2.5 h-2.5 rounded-full mr-2.5 shrink-0 print:hidden" style={{backgroundColor: area.color}}></span>
              {area.name}
            </h4>
            <p className="text-gray-600 italic text-sm mb-4 ml-0 sm:ml-5 print:text-xs">{area.description}</p>

            {areaData.stylingSatz && areaData.stylingSatz.trim() !== '' && (
              <div className="mb-4 pl-0 sm:pl-5">
                <p className="font-semibold text-gray-700 text-sm print:font-bold">Dein Stylingsatz:</p>
                <blockquote className="italic text-gray-800 bg-gray-50 p-2.5 rounded-md border-l-4 print:p-1 print:text-sm" style={{borderColor: area.color}}>"{areaData.stylingSatz}"</blockquote>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-3 pl-0 sm:pl-5">
              {USER_DATA_CATEGORIES.map(categoryKey => {
                if (areaData[categoryKey] && areaData[categoryKey].length > 0) {
                  return (
                    <div key={categoryKey}>
                      <p className="font-semibold text-gray-700 mb-1 text-sm print:font-bold" style={{color: area.color}}>{CATEGORY_LABELS[categoryKey]}:</p>
                      <ul className="list-disc pl-5 text-gray-700 space-y-0.5 text-xs print:text-2xs">
                        {areaData[categoryKey].map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        );
      })}
      {(hasAnyContent || hasSummaryText) && <p className="text-center text-gray-500 mt-8 print:hidden">Ende Deiner Zusammenfassung.</p>}
    </div>
  );
};

export default SummaryView;
