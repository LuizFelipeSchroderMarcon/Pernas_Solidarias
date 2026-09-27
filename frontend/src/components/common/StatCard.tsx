import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'purple';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'blue',
  onClick,
}) => {
  const iconVariants = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex items-center justify-between transition-all duration-200 ${
        onClick ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer' : ''
      }`}
    >
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <span className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 tracking-tight">
          {value}
        </span>
        {subtitle && (
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</span>
        )}
      </div>
      <div className={`p-3.5 rounded-2xl flex items-center justify-center shrink-0 ${iconVariants[variant]}`}>
        {icon}
      </div>
    </div>
  );
};
