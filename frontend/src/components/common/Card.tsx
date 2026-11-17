import React from 'react';
import type { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = false,
}) => {
  const commonClasses = `bg-white dark:bg-slate-900 border border-[#B9B9B9] dark:border-slate-800 rounded-2xl shadow-xs p-6 text-black dark:text-slate-100 transition-colors duration-200 ${
    hoverEffect || onClick
      ? 'hover:shadow-md hover:border-[#7C7C7C] dark:hover:border-slate-600 transition-all duration-200'
      : ''
  } ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left cursor-pointer ${commonClasses}`}
      >
        {children}
      </button>
    );
  }

  return <div className={commonClasses}>{children}</div>;
};
