import React from 'react';
import SparklesIcon from './icons/SparklesIcon'; // Optional: for KI hint
import UserCircleIcon from './icons/UserCircleIcon'; // Optional: for Profil hint

interface ValouIntroScreenProps {
  onIntroComplete: () => void;
}

const ValouIntroScreen: React.FC<ValouIntroScreenProps> = ({ onIntroComplete }) => {
  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-sky-50 p-8 rounded-xl shadow-2xl text-center my-8 flex flex-col items-center">
      <h2 className="text-4xl font-bold mb-6 
                     bg-gradient-to-r from-pink-500 via-purple-600 to-sky-500 
                     gradient-text">
        Willkommen im Valou Styling Studio!
      </h2>
      
      <div className="max-w-2xl text-slate-700 space-y-5 text-lg leading-relaxed">
        <p>
          Hier legst Du fest, was Du und Deine Valous mögen und was nicht. Es geht um 
          <strong className="text-purple-600"> Vorlieben, Abneigungen, Must-Haves</strong> und 
          <strong className="text-purple-600"> No-Gos</strong> in Deinen einzelnen Lebensbereichen.
        </p>
        <p>
          Denke in Ruhe nach oder lass Dir von Dr. GoodWork und seiner KI 
          <SparklesIcon className="inline-block w-5 h-5 text-purple-500 align-text-bottom mx-1" />
          ein paar Vorschläge aufgrund Deines Profils
          <UserCircleIcon className="inline-block w-5 h-5 text-slate-500 align-text-bottom mx-1" />
          machen. Du kannst diese dann jederzeit ergänzen oder ändern.
        </p>
        <p className="font-semibold text-purple-700">
          Der Lohn sind Deine ganz persönlichen, perfekten Entscheidungskriterien für Deine berufliche Zukunft!
        </p>
      </div>

      <button
        onClick={onIntroComplete}
        className="mt-10 px-8 py-3 bg-purple-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
      >
        Los geht's zur Übersicht!
      </button>
    </div>
  );
};

export default ValouIntroScreen;