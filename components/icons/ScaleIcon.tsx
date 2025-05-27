
import React from 'react';

interface ScaleIconProps {
  className?: string;
}

const ScaleIcon: React.FC<ScaleIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52c2.625.98 4.5 3.625 4.5 6.75v.5a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75v-.5c0-3.125 1.875-5.77 4.5-6.75m0-1.04a48.285 48.285 0 003-.52c.99-.203 1.99-.377 3-.52M3.75 4.97A48.496 48.496 0 0112 4.5c2.291 0 4.545.16 6.75.47m-13.5 0c-1.01.143-2.01.317-3 .52m3-.52c-2.625.98-4.5 3.625-4.5 6.75v.5a.75.75 0 00.75.75h13.5a.75.75 0 00.75-.75v-.5c0-3.125-1.875-5.77-4.5-6.75M12 12.75h.008v.008H12v-.008z" />
  </svg>
);

export default ScaleIcon;
