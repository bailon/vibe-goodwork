import React from 'react';

interface SparklesIconProps {
  className?: string;
}

const SparklesIcon: React.FC<SparklesIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 14.188l-1.25-2.188a2.25 2.25 0 01-1.544-1.544L12 9.25l1.25-1.206a2.25 2.25 0 011.544-1.544L17 4.312l1.25 2.188a2.25 2.25 0 011.544 1.544L21.75 9.25l-1.25 1.206a2.25 2.25 0 01-1.544 1.544L18.25 12zM12 2.25l.75 1.688M12 14.25l.75 1.688M12 21.75l.75-1.688" />
  </svg>
);

export default SparklesIcon;
