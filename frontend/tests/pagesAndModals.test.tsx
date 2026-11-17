import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../src/pages/Auth/LoginPage';
import { MainLayout } from '../src/components/layout/MainLayout';
import { EventModal } from '../src/pages/Events/EventModal';
import { HistoryPage } from '../src/pages/History/HistoryPage';
import { HistoryPairsModal } from '../src/pages/History/HistoryPairsModal';
import { CreatePairModal } from '../src/pages/PairFormation/CreatePairModal';
import { EditPairModal } from '../src/pages/PairFormation/EditPairModal';
import { DashboardPage } from '../src/pages/Dashboard/DashboardPage';
import { ThemeProvider } from '../src/context/ThemeContext';
import { ToastProvider } from '../src/context/ToastContext';

// Mocks para hooks e serviços externos
vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false,
    isLoading: false,
  }),
}));

vi.mock('../src/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'light',
    isDark: false,
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
  }),
}));

vi.mock('../src/services/eventService', () => ({
  eventService: {
    getEvents: vi.fn().mockResolvedValue([]),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
  },
}));

vi.mock('../src/services/participantService', () => ({
  participantService: {
    getCadeirantes: vi.fn().mockResolvedValue([]),
    getCondutores: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../src/services/pairService', () => ({
  pairService: {
    listByEvent: vi.fn().mockResolvedValue([]),
    createPair: vi.fn(),
    updatePair: vi.fn(),
  },
}));

describe('Pages and Specialized Modals (SSR Tests)', () => {
  it('deve renderizar a LoginPage com campos de email, senha e botão de entrar', () => {
    const html = renderToString(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(html).toContain('Pernas Solidárias');
    expect(html).toContain('Sistema de Gerenciamento');
    expect(html).toContain('Login:');
    expect(html).toContain('Senha:');
  });

  it('deve renderizar o MainLayout com navegação e área de conteúdo', () => {
    const html = renderToString(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );

    expect(html).toContain('Pernas Solidárias');
    expect(html).toContain('Início');
    expect(html).toContain('Participantes');
  });

  it('deve renderizar EventModal em modo de criação', () => {
    const html = renderToString(
      <EventModal
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );

    expect(html).toContain('Novo Evento de Corrida');
    expect(html).toContain('Nome do Evento');
    expect(html).toContain('Cadastrar');
  });

  it('deve renderizar EventModal em modo de edição com dados pré-preenchidos', () => {
    const event = {
      cd_evento: 1,
      nm_evento: 'Corrida de Rua Joinville 2026',
      dt_evento: '2026-12-10T00:00:00.000Z',
    };

    const html = renderToString(
      <EventModal
        isOpen={true}
        onClose={() => {}}
        event={event}
        onSuccess={() => {}}
      />
    );

    expect(html).toContain('Editar Evento');
    expect(html).toContain('Salvar Alterações');
  });

  it('deve renderizar HistoryPage no estado inicial de carregamento', () => {
    const html = renderToString(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    );

    expect(html).toContain('Histórico de Participações');
    expect(html).toContain('Filtros de Pesquisa');
    expect(html).toContain('Carregando dados históricos...');
  });

  it('deve renderizar HistoryPairsModal com dados do evento selecionado', () => {
    const html = renderToString(
      <HistoryPairsModal
        isOpen={true}
        onClose={() => {}}
        eventId={10}
        eventName="Maratona Noturna"
        eventDate="2026-05-10"
        onExport={() => {}}
      />
    );

    expect(html).toContain('Duplas de Maratona Noturna');
    expect(html).toContain('Fechar');
  });

  it('deve renderizar CreatePairModal com seletores de cadeirante e condutor', () => {
    const cadeirantes = [
      {
        cd_cadeirante: 1,
        nm_cadeirante: 'Carlos Silva',
        cpf: '12345678901',
        telefone: '47999998888',
        tam_camisa: 'G',
        ativo: true,
        possui_cadeira_propria: true,
      },
    ];

    const condutores = [
      {
        cd_condutor: 2,
        nm_condutor: 'Mariana Souza',
        cpf: '98765432100',
        telefone: '47988887777',
        tam_camisa: 'M',
        ativo: true,
      },
    ];

    const html = renderToString(
      <CreatePairModal
        isOpen={true}
        onClose={() => {}}
        existingPairs={[]}
        cadeirantes={cadeirantes}
        condutores={condutores}
        onAddPair={() => {}}
      />
    );

    expect(html).toContain('Criar Dupla');
    expect(html).toContain('Carlos Silva');
    expect(html).toContain('Mariana Souza');
  });

  it('deve renderizar EditPairModal com a dupla a ser alterada', () => {
    const pair = {
      cd_dupla: 5,
      cd_evento: 1,
      cd_cadeirante: 1,
      cd_condutor: 2,
      cadeirante_nome: 'Carlos Silva',
      condutor_nome: 'Mariana Souza',
    };

    const html = renderToString(
      <EditPairModal
        isOpen={true}
        onClose={() => {}}
        pair={pair}
      />
    );

    expect(html).toContain('Editar Integrantes da Dupla');
    expect(html).toContain('Cadeirante da Dupla');
    expect(html).toContain('Condutor da Dupla');
  });

  it('deve renderizar DashboardPage no estado inicial de carregamento', () => {
    const html = renderToString(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(html).toContain('Carregando dados do painel...');
  });

  it('deve renderizar ThemeProvider e ToastProvider encapsulando nós filhos', () => {
    const htmlTheme = renderToString(
      <ThemeProvider>
        <div id="theme-child">Filho do Tema</div>
      </ThemeProvider>
    );
    expect(htmlTheme).toContain('Filho do Tema');

    const htmlToast = renderToString(
      <ToastProvider>
        <div id="toast-child">Filho do Toast</div>
      </ToastProvider>
    );
    expect(htmlToast).toContain('Filho do Toast');
  });
});
