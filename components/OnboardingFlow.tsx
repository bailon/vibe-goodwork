
import React, { useState } from 'react';
import ConceptIntroScreen from './ConceptIntroScreen';
import PhaseSelectionScreen from './PhaseSelectionScreen';
import { CareerPhase } from '../types';

interface OnboardingFlowProps {
  onOnboardingComplete: (phase: CareerPhase) => void;
  careerPhasesOptions: Array<{ value: CareerPhase; label: string }>;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onOnboardingComplete, careerPhasesOptions }) => {
  const [currentStep, setCurrentStep] = useState<'intro' | 'phaseSelection'>('intro');

  const handleIntroComplete = () => {
    setCurrentStep('phaseSelection');
  };

  const handlePhaseSelected = (phase: CareerPhase) => {
    onOnboardingComplete(phase);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-rose-50 to-purple-100 flex flex-col items-center justify-center p-4">
      {currentStep === 'intro' && (
        <ConceptIntroScreen onNext={handleIntroComplete} />
      )}
      {currentStep === 'phaseSelection' && (
        <PhaseSelectionScreen 
          onPhaseSelect={handlePhaseSelected} 
          careerPhasesOptions={careerPhasesOptions.filter(p => p.value !== 'nicht_gesetzt')} // Filter out 'nicht_gesetzt' for selection
        />
      )}
    </div>
  );
};

export default OnboardingFlow;
