
import React from 'react';
import XMarkIcon from './icons/XMarkIcon';
import DocumentTextIcon from './icons/DocumentTextIcon'; // Import new icon
import BookmarkIcon from './icons/BookmarkIcon'; // Import new icon
import { GroundingMetadata, GroundingChunk } from '../types';

interface AiRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: string | null;
  sources?: GroundingMetadata;
  error: string | null;
  isLoading: boolean;
  onSaveToProfile: () => void; // New prop
  aiRecommendationText: string; // New prop for raw text export
}

const AiRecommendationModal: React.FC<AiRecommendationModalProps> = ({
  isOpen,
  onClose,
  recommendation,
  sources,
  error,
  isLoading,
  onSaveToProfile,
  aiRecommendationText,
}) => {
  if (!isOpen) return null;

  // Simple markdown to HTML (bold, lists)
  const formatMarkdown = (text: string) => {
    let html = text;
    // Headers (e.g., ## Header) - basic support
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold my-3">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold my-2">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium my-1">$1</h3>');
    
    // Bold **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italics *text* or _text_
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Unordered lists
    html = html.replace(/^\s*[-*+] (.*)/gm, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(/<\/li>\n<li/g, '</li><li'); 
    html = html.replace(/(<li.*<\/li>)+/g, (match) => `<ul>${match}</ul>`); 

    // Ordered lists
    html = html.replace(/^\s*\d+\. (.*)/gm, '<li class="ml-4 list-decimal">$1</li>');
    html = html.replace(/(<li.*<\/li>)+/g, (match) => `<ol>${match}</ol>`); 
    
    // Paragraphs (treat double newlines as paragraph breaks)
    html = html.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
    html = html.replace(/<p><\/p>/g, ''); 
    html = html.replace(/<p><([uo]l)>/g, '<$1>').replace(/<\/[uo]l><\/p>/g, '</$1>');


    return html;
  };
  
  const renderSources = (chunks?: GroundingChunk[]) => {
    if (!chunks || chunks.length === 0) return null;
    return (
      <div className="mt-6 pt-4 border-t border-gray-200 print:hidden">
        <h4 className="text-md font-semibold text-gray-700 mb-2">Mögliche Quellen (experimentell):</h4>
        <ul className="list-disc pl-5 space-y-1">
          {chunks.map((chunk, index) => (
            chunk.web && chunk.web.uri && (
              <li key={index} className="text-sm">
                <a 
                  href={chunk.web.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  title={chunk.web.title || chunk.web.uri}
                >
                  {chunk.web.title || chunk.web.uri}
                </a>
              </li>
            )
          ))}
        </ul>
      </div>
    );
  };

  const handleExportRecommendationAsTxt = () => {
    if (!aiRecommendationText) return;
    const blob = new Blob([aiRecommendationText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deine_dr-goodwork-tipps.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 transition-opacity duration-300 print:bg-transparent print:p-0 print:static print:block"
        onClick={onClose} 
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-modal-appear print:shadow-none print:rounded-none print:max-h-full print:h-auto print:border print:border-gray-300"
        onClick={(e) => e.stopPropagation()} 
        style={{animationFillMode: 'forwards'}} 
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200 print:hidden">
          <h3 className="text-xl font-semibold text-purple-700">Deine Dr. GoodWork Tipps</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow report-content-print"> {/* Added report-content-print */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-40 print:hidden">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              <p className="mt-4 text-gray-600">Dr. GoodWork denkt für Dich nach...</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-lg">
              <p className="font-semibold">Fehler</p>
              <p>{error}</p>
            </div>
          )}
          {recommendation && !isLoading && !error && (
            <div 
              className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-gray-700 space-y-3"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(recommendation) }} 
            />
          )}
          {!isLoading && !error && recommendation && sources && renderSources(sources.groundingChunks)}
        </div>

        <div className="p-4 sm:p-5 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3 print:hidden">
          {recommendation && !isLoading && !error && (
            <>
              <button
                onClick={handleExportRecommendationAsTxt}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors shadow hover:shadow-md flex items-center justify-center gap-2 text-sm"
                aria-label="Deine Tipps als TXT-Datei exportieren"
              >
                <DocumentTextIcon className="w-4 h-4" />
                Als TXT exportieren
              </button>
              <button
                onClick={onSaveToProfile}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors shadow hover:shadow-md flex items-center justify-center gap-2 text-sm"
                aria-label="Diese Tipps in Dein Profil speichern"
              >
                <BookmarkIcon className="w-4 h-4" />
                Im Profil speichern
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow hover:shadow-md text-sm"
          >
            Schließen
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modal-appear {
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-modal-appear {
          animation: modal-appear 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AiRecommendationModal;