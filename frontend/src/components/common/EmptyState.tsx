import React from 'react';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 transition-colors">
      <div className="p-4 rounded-2xl bg-[#15803D]/15 dark:bg-emerald-950/70 border border-[#166534]/20 dark:border-emerald-600/40 text-[#166534] dark:text-emerald-400 mb-4">
        {icon}
      </div>
      <h4 className="text-base font-bold text-black dark:text-white">{title}</h4>
      <p className="text-xs sm:text-sm text-[#525252] dark:text-slate-400 max-w-sm mt-1.5 mb-5">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
