import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close tooltip on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80 ${className}`}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h1>

        {/* Help tooltip trigger */}
        <div
          ref={containerRef}
          className="relative inline-flex items-center"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={`Informações sobre ${title}`}
            aria-expanded={isOpen}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 shadow-xs select-none ${
              isOpen
                ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-500/30'
                : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className="leading-none text-sm font-black">?</span>
          </button>

          {/* Tooltip Card */}
          {isOpen && (
            <div
              role="tooltip"
              className="absolute left-0 top-full mt-2.5 z-50 w-72 sm:w-84 p-4 bg-slate-900/95 dark:bg-slate-850/95 backdrop-blur-md text-white rounded-2xl shadow-xl shadow-slate-950/20 border border-slate-700/60 transition-all duration-200 animate-in fade-in zoom-in-95 pointer-events-auto"
            >
              {/* Arrow indicator */}
              <div className="absolute -top-1.5 left-3.5 w-3 h-3 bg-slate-900 dark:bg-slate-850 border-t border-l border-slate-700/60 rotate-45" />

              <div className="relative z-10 space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5" />
                  <span>Sobre esta página</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optional action buttons */}
      {actions && (
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
