import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  borderColor: string;
  available: boolean;
  action?: () => void;
}

interface NavCardProps {
  item: NavItem;
  comingSoonLabel: string;
}

const NavCard: React.FC<NavCardProps> = ({ item, comingSoonLabel }) => (
  <button
    onClick={item.action || (() => {})}
    className={`p-8 rounded-xl shadow-xl border-2
                transform hover:scale-105 transition-all duration-300 ease-in-out
                text-left flex flex-col items-center h-full
                ${item.id === 'tools' ? `${item.bgColor} border-purple-500 shadow-purple-200/50` : `${item.bgColor} ${item.borderColor}`}
                ${item.textColor}
                ${!item.available ? 'opacity-70 cursor-not-allowed' : ''}`}
    aria-label={`Navigiere zu ${item.label}`}
    disabled={!item.available && !item.action}
  >
    <div className="mb-4">{item.icon}</div>
    <h3 className="text-2xl font-semibold mb-3 text-center">{item.label}</h3>
    <p className="text-md flex-grow text-center">{item.description}</p>
    {!item.available && (
      <span className="mt-3 text-xs font-semibold bg-slate-500 text-white px-2.5 py-1 rounded-full">
        {comingSoonLabel}
      </span>
    )}
  </button>
);

export default NavCard;
