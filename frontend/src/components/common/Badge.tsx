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
    primary: 'bg-[#15803D]/15 text-[#166534] border-[#15803D]/40',
    success: 'bg-[#22C55E]/20 text-[#166534] border-[#16A34A]/50',
    warning: 'bg-amber-100 text-black border-amber-400',
    danger: 'bg-[#F51414]/20 text-[#F51414] border-[#F51414]',
    info: 'bg-[#D9D9D9] text-black border-[#A4A4A4]',
    neutral: 'bg-[#D9D9D9]/80 text-black border-[#B7B7B7]',
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
