
import React from 'react';
import { ValouAreaItem, UserDataEntry, UserDataCategoryKey, USER_DATA_CATEGORIES, CategorySuggestionLoadingState, CategorySuggestionItem } from '../types';
import { CATEGORY_LABELS } from '../constants';
import PlusIcon from './icons/PlusIcon';
import XMarkIcon from './icons/XMarkIcon';
import SparklesIcon from './icons/SparklesIcon';

interface ValouAreaCardProps {
  area: ValouAreaItem;
  userData: UserDataEntry;
  onStylingSatzChange: (value: string) => void;
  onAddItem: (category: UserDataCategoryKey, item: string) => void;
  onRemoveItem: (category: UserDataCategoryKey, index: number) => void;
  activeNewItemCategory: UserDataCategoryKey | null;
  setActiveNewItemCategory: (category: UserDataCategoryKey | null) => void;
  newItemText: string;
  setNewItemText: (text: string) => void;
  onGenerateSentence: () => void;
  isGeneratingSentence: boolean;
  onGenerateCategorySuggestions: (areaId: string, category: UserDataCategoryKey) => void;
  categorySuggestionLoading: CategorySuggestionLoadingState;
  currentCategorySuggestions: CategorySuggestionItem | null;
  clearCategorySuggestions: (areaId: string, category: UserDataCategoryKey) => void;
}

const ValouAreaCard: React.FC<ValouAreaCardProps> = ({
  area,
  userData,
  onStylingSatzChange,
  onAddItem,
  onRemoveItem,
  activeNewItemCategory,
  setActiveNewItemCategory,
  newItemText,
  setNewItemText,
  onGenerateSentence,
  isGeneratingSentence,
  onGenerateCategorySuggestions,
  categorySuggestionLoading,
  currentCategorySuggestions,
  clearCategorySuggestions,
}) => {

  const handleAddNewItem = () => {
    if (newItemText.trim() !== '' && activeNewItemCategory) {
      onAddItem(activeNewItemCategory, newItemText.trim());
      setNewItemText('');
      // Optionally close input field after adding:
      // setActiveNewItemCategory(null); 
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl border-t-4" style={{ borderColor: area.color }}>
      <h2 className="text-2xl font-bold mb-1" style={{ color: area.color }}>
        {area.name}
      </h2>
      <p className="text-md italic mb-4 text-gray-600">{area.description}</p>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 shadow-inner" style={{ borderColor: area.color }}>
        <h4 className="font-semibold mb-2 text-sm" style={{ color: area.color }}>Hilfreiche Stichpunkte:</h4>
        <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
          {area.tipps.map((tipp, index) => (
            <li key={index}>{tipp}</li>
          ))}
        </ul>
      </div>

      <div className="mb-8">
        <label htmlFor={`stylingSatz-${area.id}`} className="block text-lg font-semibold mb-2 text-gray-800">
          Stylingsatz – Wie würdest Du in einem Satz sagen, worauf es hier ankommt?
        </label>
        <div className="flex items-start gap-2">
          <textarea
            id={`stylingSatz-${area.id}`}
            value={userData.stylingSatz}
            onChange={(e) => onStylingSatzChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1"
            style={{'--tw-ring-color': area.color} as React.CSSProperties}
            rows={3}
            placeholder="Dein prägnanter Satz oder KI-Vorschlag..."
          />
          <button
            onClick={onGenerateSentence}
            disabled={isGeneratingSentence}
            className="p-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-purple-300 transition-colors flex items-center justify-center shrink-0 h-[50px] mt-0.5"
            aria-label="KI-Vorschlag für Stylingsatz generieren"
          >
            {isGeneratingSentence ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <SparklesIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {USER_DATA_CATEGORIES.map((categoryKey) => {
          const isLoadingSuggestions = categorySuggestionLoading?.areaId === area.id && categorySuggestionLoading?.category === categoryKey;
          const suggestionsToShow = currentCategorySuggestions?.areaId === area.id && currentCategorySuggestions?.category === categoryKey ? currentCategorySuggestions.list : null;

          return (
            <div
              key={categoryKey}
              className="p-4 rounded-lg shadow-lg bg-white border-l-4"
              style={{ borderColor: area.color }}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold" style={{ color: area.color }}>
                  {CATEGORY_LABELS[categoryKey]}
                </h3>
                <button
                  onClick={() => onGenerateCategorySuggestions(area.id, categoryKey)}
                  disabled={isLoadingSuggestions}
                  className="p-1.5 text-purple-500 hover:text-purple-700 disabled:text-purple-300 rounded-full hover:bg-purple-50 transition-colors"
                  aria-label={`KI-Vorschläge für ${CATEGORY_LABELS[categoryKey]} generieren`}
                  title="KI-Vorschläge generieren"
                >
                  {isLoadingSuggestions ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500"></div>
                  ) : (
                    <SparklesIcon className="w-4 h-4" />
                  )}
                </button>
              </div>

              {userData[categoryKey].length > 0 ? (
                <ul className="mb-4 space-y-2">
                  {userData[categoryKey].map((item, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded-md text-sm text-gray-700 shadow-sm">
                      <span>{item}</span>
                      <button
                        onClick={() => onRemoveItem(categoryKey, index)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                        aria-label="Eintrag entfernen"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                 !suggestionsToShow && <p className="text-sm text-gray-500 mb-4 italic">Noch keine Einträge.</p>
              )}
              
              {suggestionsToShow && suggestionsToShow.length > 0 && (
                <div className="mb-4 mt-2 p-3 bg-purple-50 border border-purple-200 rounded-md shadow">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-xs font-semibold text-purple-700">KI-Vorschläge:</h4>
                    <button 
                      onClick={() => clearCategorySuggestions(area.id, categoryKey)} 
                      className="text-purple-400 hover:text-purple-600"
                      aria-label="Vorschläge ausblenden"
                      title="Vorschläge ausblenden"
                      >
                        <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                  <ul className="space-y-1.5">
                    {suggestionsToShow.map((suggestion, idx) => (
                      <li key={idx} className="flex justify-between items-center text-xs text-purple-800 bg-purple-100 p-1.5 rounded">
                        <span>{suggestion}</span>
                        <button 
                          onClick={() => {
                            onAddItem(categoryKey, suggestion);
                            // Optional: Remove from suggestions list or mark as added if suggestions become stateful here
                          }}
                          className="p-1 text-purple-600 hover:text-purple-900 bg-purple-200 hover:bg-purple-300 rounded-full"
                          aria-label={`Vorschlag "${suggestion}" hinzufügen`}
                          title="Hinzufügen"
                        >
                          <PlusIcon className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
               {suggestionsToShow && suggestionsToShow.length === 0 && !isLoadingSuggestions && (
                 <div className="mb-4 mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-xs text-gray-500 italic">Keine spezifischen KI-Vorschläge gefunden. Versuchen Sie es später erneut oder fügen Sie manuell Einträge hinzu.</p>
                 </div>
               )}


              {activeNewItemCategory === categoryKey ? (
                <div className="flex flex-col space-y-2">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{'--tw-ring-color': area.color} as React.CSSProperties}
                    placeholder="Neuen Eintrag hinzufügen"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNewItem()}
                    autoFocus
                  />
                  <div className="flex gap-2">
                      <button
                          onClick={handleAddNewItem}
                          style={{ backgroundColor: area.color }}
                          className="w-full px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1 text-sm shadow-md"
                      >
                          <PlusIcon className="w-4 h-4"/> Hinzufügen
                      </button>
                      <button
                          onClick={() => {setActiveNewItemCategory(null); setNewItemText('');}}
                          className="w-full px-3 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm shadow-md"
                      >
                          Abbrechen
                      </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActiveNewItemCategory(categoryKey);
                    setNewItemText(''); 
                  }}
                  style={{ 
                    color: area.color, 
                    borderColor: area.color 
                  }}
                  className="w-full px-4 py-2 rounded-lg border-2 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium hover:shadow-sm"
                >
                  <PlusIcon className="w-4 h-4"/> Manuellen Eintrag hinzufügen
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ValouAreaCard;
