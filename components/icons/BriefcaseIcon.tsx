
import React from 'react';

interface BriefcaseIconProps {
  className?: string;
}

const BriefcaseIcon: React.FC<BriefcaseIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.098a2.25 2.25 0 01-2.25 2.25h-13.5a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 014.5 4.5h6.75a2.25 2.25 0 012.25 2.25v3.75m0 0h-13.5M21 12h-6.75M21 12a2.25 2.25 0 00-2.25-2.25H15M21 12a2.25 2.25 0 01-2.25 2.25H15M3 7.5h6.75m6.75 0H21m-9.75 0V4.5m0 12V6.75m0 0a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 6.75v11.55A2.25 2.25 0 004.5 20.55h13.5a2.25 2.25 0 002.25-2.25V14.15M12 6.75v3.75m0 0h3.75m-3.75 0a2.25 2.25 0 01-2.25-2.25V6.75" />
  </svg>
);

export default BriefcaseIcon;
