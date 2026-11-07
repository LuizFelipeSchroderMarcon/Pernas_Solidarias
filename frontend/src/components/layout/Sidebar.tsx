import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Layers,
  BarChart3,
  History,
  LogOut,
  X,
  HeartHandshake,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();

  const navItems = [
    { label: 'Início', path: '/', icon: LayoutDashboard },
    { label: 'Participantes', path: '/participantes', icon: Users },
    { label: 'Eventos', path: '/eventos', icon: Calendar },
    { label: 'Formação de Duplas', path: '/duplas', icon: Layers },
    { label: 'Gráficos', path: '/graficos', icon: BarChart3 },
    { label: 'Histórico', path: '/historico', icon: History },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-[#15803D] text-white border-r border-[#166534] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-6 h-20 border-b-2 border-[#166534]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white text-[#166534] shadow-xs">
              <HeartHandshake className="w-6 h-6 text-[#166534]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight leading-none text-white">
                Pernas Solidárias
              </span>
              <span className="text-[11px] text-white/80 mt-1 font-semibold">
                Gestão de Corridas
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white/80 hover:text-white p-1"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-white/70 mb-3">
            Menu Principal
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#22C55E] text-white shadow-xs font-bold'
                      : 'text-white/90 hover:bg-[#16A34A] hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0 text-white" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User profile & logout footer */}
        <div className="p-4 border-t-2 border-[#166534] bg-[#166534]/50">
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#166534]">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-bold text-white truncate">
                {user?.email || 'Coordenador'}
              </span>
              <span className="text-[10px] text-[#86EFAC] font-semibold">Sessão Ativa</span>
            </div>
            <button
              onClick={logout}
              title="Sair do sistema"
              className="p-2 rounded-lg text-white hover:bg-[#F51414] hover:text-white transition-colors cursor-pointer"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
