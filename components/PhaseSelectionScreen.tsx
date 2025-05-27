
import React, { useState } from 'react';
import { CareerPhase } from '../types';

interface PhaseSelectionScreenProps {
  onPhaseSelect: (phase: CareerPhase) => void;
  careerPhasesOptions: Array<{ value: CareerPhase; label: string }>;
}

const PhaseSelectionScreen: React.FC<PhaseSelectionScreenProps> = ({ onPhaseSelect, careerPhasesOptions }) => {
  const [selectedPhase, setSelectedPhase] = useState<CareerPhase | ''>('');

  const handleSubmit = () => {
    if (selectedPhase && selectedPhase !== 'nicht_gesetzt') {
      onPhaseSelect(selectedPhase);
    } else {
      // Optional: Show an alert or message if no phase is selected
      alert("Bitte wähle eine Phase aus.");
    }
  };

  return (
    <div className="bg-white p-6 sm:p-10 rounded-xl shadow-2xl max-w-lg w-full text-center animate-fadeIn">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 
                     bg-gradient-to-r from-sky-500 via-purple-600 to-pink-500 
                     gradient-text">
        In welcher Phase befindest Du Dich aktuell?
      </h1>
      <p className="text-slate-700 text-lg mb-8 leading-relaxed">
        Diese Angabe hilft uns, die Inhalte und Empfehlungen der App besser auf Deine aktuelle Situation zuzuschneiden.
      </p>

      <div className="space-y-4 mb-10 text-left">
        {careerPhasesOptions.map(option => (
          <label 
            key={option.value} 
            htmlFor={`phase-${option.value}`}
            className={`block p-4 border rounded-lg cursor-pointer transition-all duration-200 ease-in-out
                        ${selectedPhase === option.value 
                            ? 'bg-purple-600 text-white border-purple-700 shadow-lg ring-2 ring-purple-400 ring-offset-1' 
                            : 'bg-white text-slate-700 border-slate-300 hover:border-purple-400 hover:shadow-md'}`}
          >
            <input
              type="radio"
              id={`phase-${option.value}`}
              name="careerPhase"
              value={option.value}
              checked={selectedPhase === option.value}
              onChange={() => setSelectedPhase(option.value)}
              className="sr-only" // Hide actual radio button, style label instead
            />
            <span className="font-semibold text-lg">{option.label}</span>
          </label>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedPhase || selectedPhase === 'nicht_gesetzt'}
        className="w-full px-8 py-3 bg-purple-600 text-white text-lg font-semibold rounded-lg shadow-md 
                   hover:bg-purple-700 transition-all duration-300 ease-in-out 
                   disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none
                   transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
      >
        Phase speichern und GoodWork Zentrale starten
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

export default PhaseSelectionScreen;
