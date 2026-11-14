import React from 'react';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variants: Record<BadgeVariant, string> = {
    primary: 'bg-[#15803D]/15 dark:bg-emerald-950/80 text-[#166534] dark:text-emerald-300 border-[#15803D]/40 dark:border-emerald-600/60 font-bold',
    success: 'bg-[#22C55E]/20 dark:bg-emerald-900/50 text-[#166534] dark:text-emerald-300 border-[#16A34A]/50 dark:border-emerald-500/60 font-bold',
    warning: 'bg-amber-100 dark:bg-amber-950/60 text-black dark:text-amber-200 border-amber-400 dark:border-amber-600 font-bold',
    danger: 'bg-[#F51414]/20 dark:bg-red-950/60 text-[#F51414] dark:text-red-300 border-[#F51414] dark:border-red-600 font-bold',
    info: 'bg-[#D9D9D9] dark:bg-slate-800 text-black dark:text-slate-200 border-[#A4A4A4] dark:border-slate-700 font-medium',
    neutral: 'bg-[#D9D9D9]/80 dark:bg-slate-800 text-black dark:text-slate-200 border-[#B7B7B7] dark:border-slate-700 font-medium',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border leading-none ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
