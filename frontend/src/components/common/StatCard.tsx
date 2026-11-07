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
    blue: 'bg-[#15803D]/15 text-[#166534]',
    indigo: 'bg-[#16A34A]/20 text-[#166534]',
    emerald: 'bg-[#22C55E]/25 text-[#166534]',
    amber: 'bg-amber-100 text-amber-700',
    purple: 'bg-[#D9D9D9] text-[#166534]',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#B9B9B9] rounded-2xl p-5 shadow-xs flex items-center justify-between transition-all duration-200 ${
        onClick ? 'hover:shadow-md hover:border-[#166534] cursor-pointer' : ''
      }`}
    >
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#525252]">
          {title}
        </span>
        <span className="text-3xl font-extrabold text-black mt-1.5 tracking-tight">
          {value}
        </span>
        {subtitle && (
          <span className="text-xs text-[#7C7C7C] mt-1">{subtitle}</span>
        )}
      </div>
      <div className={`p-3.5 rounded-2xl flex items-center justify-center shrink-0 ${iconVariants[variant]}`}>
        {icon}
      </div>
    </div>
  );
};
