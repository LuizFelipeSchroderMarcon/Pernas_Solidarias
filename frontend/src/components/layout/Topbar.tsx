import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, title }) => {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-white border-b border-[#B9B9B9] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-black hover:bg-[#D9D9D9] transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        {title && (
          <h1 className="text-xl font-bold text-black tracking-tight">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 pl-3">
          <div className="w-9 h-9 rounded-full bg-[#15803D] border border-[#166534] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.email ? user.email.slice(0, 2).toUpperCase() : 'PS'}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-black leading-none">
              {user?.email || 'Coordenador'}
            </span>
            <span className="text-[10px] text-[#7C7C7C] mt-1">
              Pernas Solidárias
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
