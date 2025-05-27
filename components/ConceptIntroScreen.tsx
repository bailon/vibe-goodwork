
import React from 'react';
import { getValouAreas } from '../constants';

const ConceptIntroScreen: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const valouEmojis = ['💼', '🏡', '💰', '🧠', '🎨', '❤️']; // Emojis aligned with VALOU areas
  const valouAreas = getValouAreas();

  return (
    <div className="bg-white p-6 sm:p-10 rounded-xl shadow-2xl max-w-3xl w-full text-center animate-fadeIn">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 
                     bg-gradient-to-r from-pink-500 via-purple-600 to-sky-500 
                     gradient-text">
        Willkommen bei Deiner GoodWork Crafting Zentrale!
      </h1>
      
      <p className="text-slate-700 text-lg mb-6 leading-relaxed">
        GoodWork ist ein ganzheitliches Konzept, das Dein Wohlbefinden und Deine Leistungszufriedenheit miteinander verbindet. Es schafft eine neue Qualität von Arbeit – <strong>menschlich, wirksam und zukunftsfähig</strong>.
      </p>
      <p className="text-slate-700 text-lg mb-8 leading-relaxed">
        Wir fokussieren uns hier auf Dich als einzelnen Menschen und wie Du Deine Arbeit und Dein Leben optimal gestalten kannst.
      </p>

      <div className="mb-10 text-left bg-purple-50 p-6 rounded-lg shadow-inner border-l-4 border-purple-400">
        <h2 className="text-2xl font-semibold text-purple-700 mb-4 text-center">Die sechs Valous – Deine persönlichen Begleiter</h2>
        <p className="text-slate-600 mb-6 text-center">
          Zentral im GoodWork-Konzept stehen sechs Valous. Jeder Valou hat eine klare Rolle und Aufgabe:
        </p>
        <ul className="space-y-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {valouAreas.map((valou, index) => (
            <li key={valou.id} className="flex items-start p-3 bg-white rounded-md shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
              <span className="text-2xl mr-3" role="img" aria-label={valou.name}>{valouEmojis[index % valouEmojis.length]}</span>
              <div>
                <strong className="block text-purple-600">{valou.name}:</strong>
                <span className="text-sm text-slate-600">
                  {valou.id === 'taetigkeit' && 'Gestalter von Arbeit und Karriere.'}
                  {valou.id === 'privatesLeben' && 'Hüter der Lebensbalance.'}
                  {valou.id === 'ressourcenMittel' && 'Verwalter der Mittel und Ressourcen.'}
                  {valou.id === 'persoenlichkeitSkills' && 'Entwicklungsbegleiter und Coach für Selbstreflexion.'}
                  {valou.id === 'stilWirkung' && 'Berater für Auftreten und Kommunikation.'}
                  {valou.id === 'gesundheit' && 'Wächter über körperliche, mentale und emotionale Gesundheit.'}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-slate-600 mt-6 text-center">
          Es gilt sicherzustellen, dass es jedem Valou gut geht und sie optimal zusammenwirken. Dieser spielerische Ansatz stärkt Deine Eigenverantwortung.
        </p>
      </div>

      <button
        onClick={onNext}
        className="px-8 py-3 bg-purple-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
      >
        Verstanden, weiter zur persönlichen Einordnung!
      </button>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ConceptIntroScreen;
