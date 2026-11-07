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
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-[#A4A4A4] bg-[#EBEAEA]/50">
      <div className="p-4 rounded-2xl bg-[#15803D]/15 text-[#166534] mb-4">
        {icon}
      </div>
      <h4 className="text-base font-bold text-black">{title}</h4>
      <p className="text-xs sm:text-sm text-[#525252] max-w-sm mt-1.5 mb-5">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
