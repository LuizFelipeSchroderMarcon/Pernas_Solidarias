import React from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-[#166534] hover:bg-[#15803D] text-white font-semibold border border-[#166534] shadow-xs focus:ring-[#22C55E] active:scale-[0.98]',
    secondary:
      'bg-[#D9D9D9] hover:bg-[#c8c8c8] text-black font-medium border border-[#B7B7B7] focus:ring-[#7C7C7C] active:scale-[0.98]',
    outline:
      'bg-white hover:bg-[#16A34A] hover:text-white text-black border border-black/50 focus:ring-[#16A34A] active:scale-[0.98]',
    danger:
      'bg-[#F51414] hover:bg-[#F25353] text-white font-semibold border border-[#B7B7B7] shadow-xs focus:ring-[#F51414] active:scale-[0.98]',
    warning:
      'bg-amber-400 hover:bg-amber-500 text-black font-semibold shadow-xs focus:ring-amber-500 active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-[#D9D9D9]/60 text-black focus:ring-[#7C7C7C]',
    success:
      'bg-[#15803D] hover:bg-[#16A34A] text-white font-semibold border border-[#166534] shadow-xs focus:ring-[#22C55E] active:scale-[0.98]',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
