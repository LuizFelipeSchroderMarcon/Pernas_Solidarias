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
    blue: 'bg-[#15803D]/15 dark:bg-[#15803D]/30 text-[#166534] dark:text-[#4ADE80]',
    indigo: 'bg-[#16A34A]/20 dark:bg-[#16A34A]/30 text-[#166534] dark:text-[#4ADE80]',
    emerald: 'bg-[#22C55E]/25 dark:bg-[#22C55E]/30 text-[#166534] dark:text-[#4ADE80]',
    amber: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400',
    purple: 'bg-[#15803D]/15 dark:bg-[#15803D]/30 text-[#166534] dark:text-[#4ADE80]',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-[#B9B9B9] dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between transition-all duration-200 ${
        onClick ? 'hover:shadow-md hover:border-[#166534] dark:hover:border-[#22C55E] cursor-pointer' : ''
      }`}
    >
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#525252] dark:text-slate-400">
          {title}
        </span>
        <span className="text-3xl font-extrabold text-black dark:text-white mt-1.5 tracking-tight">
          {value}
        </span>
        {subtitle && (
          <span className="text-xs text-[#7C7C7C] dark:text-slate-400 mt-1">{subtitle}</span>
        )}
      </div>
      <div className={`p-3.5 rounded-2xl flex items-center justify-center shrink-0 ${iconVariants[variant]}`}>
        {icon}
      </div>
    </div>
  );
};
