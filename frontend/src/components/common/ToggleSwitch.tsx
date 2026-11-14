import React from 'react';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  size = 'md',
}) => {
  const switchSizes = {
    sm: 'w-8 h-4.5',
    md: 'w-11 h-6',
  };

  const thumbSizes = {
    sm: 'w-3.5 h-3.5 translate-x-0.5 peer-checked:translate-x-3.5',
    md: 'w-5 h-5 translate-x-0.5 peer-checked:translate-x-5',
  };

  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div
          className={`${switchSizes[size]} bg-[#D9D9D9] dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-[#166534] dark:peer-checked:bg-emerald-600 transition-colors duration-200 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        ></div>
        <div
          className={`absolute ${thumbSizes[size]} bg-white rounded-full transition-transform duration-200 shadow-sm pointer-events-none`}
        ></div>
      </div>
      {label && (
        <span
          className={`text-xs font-semibold ${
            checked
              ? 'text-[#166534] dark:text-emerald-400 font-bold'
              : 'text-[#7C7C7C] dark:text-slate-300'
          }`}
        >
          {label}
        </span>
      )}
    </label>
  );
};
