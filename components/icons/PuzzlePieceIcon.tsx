
import React from 'react';

interface PuzzlePieceIconProps {
  className?: string;
}

const PuzzlePieceIcon: React.FC<PuzzlePieceIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.083c-.528-.258-1.09-.445-1.688-.575a4.504 4.504 0 00-4.124 0 4.492 4.492 0 00-1.688.575M14.25 6.083C15.368 6.506 16.5 7.643 16.5 9c0 1.357-1.132 2.494-2.25 2.917M14.25 6.083c.11.25.188.516.188.792v3.042c0 .428-.168.82-.468 1.12a3.007 3.007 0 01-4.02 0 2.995 2.995 0 01-.469-1.12V6.875c0-.276.078-.542.188-.792M9.75 6.083C8.632 6.506 7.5 7.643 7.5 9c0 1.357 1.132 2.494 2.25 2.917M9.75 6.083C9.641 5.833 9.562 5.567 9.562 5.292V2.25c0-.428.168-.82.468-1.12a3.007 3.007 0 014.02 0c.299.3.469.692.469 1.12v3.042c0 .276-.078.542-.188.792M12 21.75c3.438 0 6.235-2.063 7.312-5.063M12 21.75c-3.438 0-6.235-2.063-7.312-5.063M12 21.75v-2.25" />
  </svg>
);

export default PuzzlePieceIcon;
