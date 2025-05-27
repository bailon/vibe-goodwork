
import React from 'react';
import { ValouAreaItem, UserDataCollection, USER_DATA_CATEGORIES } from '../types';

interface ProgressOverviewProps {
  areas: ValouAreaItem[];
  userData: UserDataCollection;
}

const ProgressOverview: React.FC<ProgressOverviewProps> = ({ areas, userData }) => {
  return (
    <div className="mt-12 p-6 bg-white rounded-lg shadow-md print:hidden">
      <h3 className="text-xl font-semibold mb-6 text-gray-700 text-center">Fortschrittsübersicht</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {areas.map(area => {
          const areaData = userData[area.id];
          if (!areaData) return null;

          const totalItems = USER_DATA_CATEGORIES.reduce((sum, cat) => sum + areaData[cat].length, 0);
          const hasStyling = areaData.stylingSatz && areaData.stylingSatz.trim() !== '';
          const isComplete = totalItems > 0 || hasStyling;

          return (
            <div key={area.id} className="text-center group">
              <div className="relative h-20 w-20 mx-auto rounded-full border-4 flex items-center justify-center transition-all duration-300"
                   style={{ borderColor: isComplete ? area.color : '#e5e7eb' }}>
                 <div className="absolute inset-0 rounded-full transition-all duration-300 opacity-20 group-hover:opacity-30"
                      style={{ backgroundColor: isComplete ? area.color : '#e5e7eb' }}>
                 </div>
                 <span className="text-2xl font-bold relative" style={{color: isComplete ? area.color : '#9ca3af'}}>
                    {isComplete ? '✓' : '?'}
                 </span>
              </div>
              <span className={`block text-xs mt-2 font-medium ${isComplete ? 'text-gray-700' : 'text-gray-500'}`}>{area.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressOverview;
