import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, title }) => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-[#B9B9B9] dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-black dark:text-slate-200 hover:bg-[#D9D9D9] dark:hover:bg-slate-800 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        {title && (
          <h1 className="text-xl font-bold text-black dark:text-white tracking-tight">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-black dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 cursor-pointer"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-xs font-semibold">Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline text-xs font-semibold">Modo Escuro</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-[#B9B9B9] dark:border-slate-800">
          <div className="w-9 h-9 rounded-full bg-[#15803D] border border-[#166534] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.email ? user.email.slice(0, 2).toUpperCase() : 'PS'}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-black dark:text-white leading-none">
              {user?.email || 'Coordenador'}
            </span>
            <span className="text-[10px] text-[#7C7C7C] dark:text-slate-400 mt-1">
              Pernas Solidárias
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
