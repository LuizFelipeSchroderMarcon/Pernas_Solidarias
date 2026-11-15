import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Topbar } from '../src/components/layout/Topbar';
import { Sidebar } from '../src/components/layout/Sidebar';
import { ProtectedRoute } from '../src/components/layout/ProtectedRoute';
import { ExportModal } from '../src/components/export/ExportModal';

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'coordenador@pernassolidarias.org.br' },
    logout: vi.fn(),
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({
    isDark: false,
    toggleTheme: vi.fn(),
  }),
}));

describe('Layout and Modals (SSR Render Tests)', () => {
  it('deve renderizar Topbar com título e botão de menu', () => {
    const html = renderToString(
      <MemoryRouter>
        <Topbar onMenuClick={() => {}} title="Pernas Solidárias" />
      </MemoryRouter>
    );
    expect(html).toContain('Pernas Solidárias');
    expect(html).toContain('button');
  });

  it('deve renderizar Sidebar aberto com itens de menu e email do usuário', () => {
    const html = renderToString(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );
    expect(html).toContain('Início');
    expect(html).toContain('Participantes');
    expect(html).toContain('Eventos');
    expect(html).toContain('coordenador@pernassolidarias.org.br');
  });

  it('deve renderizar ProtectedRoute quando autenticado', () => {
    const html = renderToString(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Área Protegida</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(html).toContain('Área Protegida');
  });

  it('deve renderizar ExportModal aberto com opções de Excel e CSV', () => {
    const html = renderToString(
      <ExportModal
        isOpen={true}
        onClose={() => {}}
        eventId={1}
        eventName="Corrida Inclusão 2026"
      />
    );
    expect(html).toContain('Exportar Relatório de Duplas');
    expect(html).toContain('Excel (.xlsx)');
    expect(html).toContain('CSV (.csv)');
    expect(html).toContain('Privacidade e Dados (LGPD)');
  });
});