
import React from 'react';

interface LightBulbIconProps {
  className?: string;
}

const LightBulbIcon: React.FC<LightBulbIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.354a15.055 15.055 0 01-3 0M12.75 4.5v-.75A.75.75 0 0012 3a.75.75 0 00-.75.75v.75m0 0A2.25 2.25 0 0012 6.75h0A2.25 2.25 0 0012.75 4.5M12 18.75h.008v.008H12v-.008z" />
  </svg>
);

export default LightBulbIcon;
