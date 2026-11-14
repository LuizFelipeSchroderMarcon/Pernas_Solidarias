import React, { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-black dark:text-slate-200">
            {label} {props.required && <span className="text-[#FF0000]">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[#525252] dark:text-slate-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-white dark:bg-slate-800 border text-black dark:text-white placeholder-[#808080] dark:placeholder-slate-500 text-sm rounded-xl px-3.5 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#166534]/30 focus:border-[#166534] disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error
                ? 'border-[#F51414] focus:border-[#F51414] focus:ring-[#F51414]/20'
                : 'border-[#B7B7B7] dark:border-slate-700 hover:border-[#7C7C7C] dark:hover:border-slate-500'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-[#525252] dark:text-slate-400 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[#FF0000] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#7C7C7C] dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
