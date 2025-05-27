
import React from 'react';
import { ValouAreaItem } from '../types';

interface ValouAreaNavigationProps {
  areas: ValouAreaItem[];
  activeAreaId: string;
  onSelectArea: (areaId: string) => void;
}

const ValouAreaNavigation: React.FC<ValouAreaNavigationProps> = ({ areas, activeAreaId, onSelectArea }) => {
  return (
    <div className="flex overflow-x-auto mb-8 pb-2 border-b border-gray-300 print:hidden">
      {areas.map(area => (
        <button
          key={area.id}
          onClick={() => onSelectArea(area.id)}
          style={{
            backgroundColor: activeAreaId === area.id ? area.color : 'transparent',
            color: activeAreaId === area.id ? 'white' : area.color,
            borderColor: area.color,
          }}
          className={`px-4 py-3 mr-2 whitespace-nowrap rounded-t-lg text-sm font-medium border-b-4 hover:opacity-90 transition-all duration-200 ease-in-out focus:outline-none
            ${activeAreaId === area.id ? `shadow-md` : `hover:bg-gray-100`}
          `}
        >
          {area.name}
        </button>
      ))}
    </div>
  );
};

export default ValouAreaNavigation;
