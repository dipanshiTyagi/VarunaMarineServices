import React from 'react';

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

/**
 * TabButton Component
 * Styled button for tab navigation
 */
export const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick, icon }) => {
  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-3 font-medium text-sm transition-all duration-200
        border-b-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${
          isActive
            ? 'border-primary-600 text-primary-700 bg-primary-50'
            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50'
        }
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        {label}
      </span>
    </button>
  );
};

