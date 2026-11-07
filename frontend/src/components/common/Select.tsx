import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, children, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-black">
            {label} {props.required && <span className="text-[#FF0000]">*</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full bg-white border text-black text-sm rounded-xl px-3.5 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#166534]/30 focus:border-[#166534] disabled:opacity-50 disabled:bg-[#EBEAEA] ${
            error
              ? 'border-[#F51414] focus:border-[#F51414] focus:ring-[#F51414]/20'
              : 'border-[#B7B7B7] hover:border-[#7C7C7C]'
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error ? (
          <p className="text-xs text-[#FF0000] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#7C7C7C]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
