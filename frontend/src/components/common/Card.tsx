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
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-[#B9B9B9] dark:border-slate-800 rounded-2xl shadow-xs p-6 text-black dark:text-slate-100 transition-colors duration-200 ${
        hoverEffect
          ? 'hover:shadow-md hover:border-[#7C7C7C] dark:hover:border-slate-600 transition-all duration-200 cursor-pointer'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
