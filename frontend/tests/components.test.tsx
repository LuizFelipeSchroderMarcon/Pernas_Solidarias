import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Badge } from '../src/components/common/Badge';
import { Button } from '../src/components/common/Button';
import { Card } from '../src/components/common/Card';
import { EmptyState } from '../src/components/common/EmptyState';
import { Input } from '../src/components/common/Input';
import { Modal } from '../src/components/common/Modal';
import { PageHeader } from '../src/components/common/PageHeader';
import { Select } from '../src/components/common/Select';
import { Spinner } from '../src/components/common/Spinner';
import { StatCard } from '../src/components/common/StatCard';
import { ToggleSwitch } from '../src/components/common/ToggleSwitch';
import { ConfirmDialog } from '../src/components/feedback/ConfirmDialog';
import { SHIRT_SIZES, SHIRT_SIZE_OPTIONS } from '../src/constants/shirtSizes';

describe('Common Components Unit Tests (SSR Render)', () => {
  it('deve renderizar Badge com diferentes variantes', () => {
    const htmlSuccess = renderToString(<Badge variant="success">Ativo</Badge>);
    expect(htmlSuccess).toContain('Ativo');

    const htmlDanger = renderToString(<Badge variant="danger">Inativo</Badge>);
    expect(htmlDanger).toContain('Inativo');

    const htmlWarning = renderToString(<Badge variant="warning">Pendente</Badge>);
    expect(htmlWarning).toContain('Pendente');
  });

  it('deve renderizar Button com estados de loading e variantes', () => {
    const htmlBtn = renderToString(<Button variant="primary">Clique Aqui</Button>);
    expect(htmlBtn).toContain('Clique Aqui');
    expect(htmlBtn).toContain('button');

    const htmlLoading = renderToString(<Button isLoading>Salvando</Button>);
    expect(htmlLoading).toContain('disabled');

    const htmlOutline = renderToString(<Button variant="outline">Voltar</Button>);
    expect(htmlOutline).toContain('Voltar');
  });

  it('deve renderizar Card tanto estático quanto interativo', () => {
    const htmlStatic = renderToString(<Card>Conteúdo do Card</Card>);
    expect(htmlStatic).toContain('Conteúdo do Card');

    const htmlInteractive = renderToString(<Card onClick={() => {}}>Card Botão</Card>);
    expect(htmlInteractive).toContain('button');
  });

  it('deve renderizar EmptyState com título e descrição', () => {
    const html = renderToString(<EmptyState title="Nenhum dado" description="Cadastre algo para ver aqui." />);
    expect(html).toContain('Nenhum dado');
    expect(html).toContain('Cadastre algo para ver aqui.');
  });

  it('deve renderizar Input com label e erro', () => {
    const html = renderToString(<Input label="Nome Completo" error="Campo obrigatório" />);
    expect(html).toContain('Nome Completo');
    expect(html).toContain('Campo obrigatório');
  });

  it('deve renderizar Modal e ConfirmDialog quando abertos', () => {
    const htmlModal = renderToString(
      <Modal isOpen={true} onClose={() => {}} title="Meu Modal">
        <p>Corpo</p>
      </Modal>
    );
    expect(htmlModal).toContain('Meu Modal');
    expect(htmlModal).toContain('Corpo');

    const htmlClosed = renderToString(
      <Modal isOpen={false} onClose={() => {}} title="Fechado">
        <p>Invisivel</p>
      </Modal>
    );
    expect(htmlClosed).toBe('');

    const htmlDialog = renderToString(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja apagar?"
      />
    );
    expect(htmlDialog).toContain('Confirmar Exclusão');
    expect(htmlDialog).toContain('Tem certeza');
  });

  it('deve renderizar PageHeader com título, descrição e ações', () => {
    const html = renderToString(
      <PageHeader
        title="Participantes"
        description="Gerenciamento geral"
        actions={<button>Novo</button>}
      />
    );
    expect(html).toContain('Participantes');
    expect(html).toContain('Novo');
  });

  it('deve renderizar Select com opções e erro', () => {
    const html = renderToString(
      <Select
        label="Tamanho"
        options={[
          { label: 'Pequeno', value: 'P' },
          { label: 'Médio', value: 'M' },
        ]}
      />
    );
    expect(html).toContain('Tamanho');
    expect(html).toContain('Pequeno');
    expect(html).toContain('Médio');
  });

  it('deve renderizar Spinner em múltiplos tamanhos', () => {
    expect(renderToString(<Spinner size="sm" />)).toContain('svg');
    expect(renderToString(<Spinner size="lg" />)).toContain('svg');
  });

  it('deve renderizar StatCard estático e interativo', () => {
    const html = renderToString(
      <StatCard title="Total" value={100} icon={<span>*</span>} />
    );
    expect(html).toContain('Total');
    expect(html).toContain('100');

    const htmlBtn = renderToString(
      <StatCard title="Cliques" value={50} icon={<span>*</span>} onClick={() => {}} />
    );
    expect(htmlBtn).toContain('button');
  });

  it('deve renderizar ToggleSwitch', () => {
    const html = renderToString(<ToggleSwitch checked={true} onChange={() => {}} label="Ativo" />);
    expect(html).toContain('Ativo');
    expect(html).toContain('checkbox');
  });

  it('deve validar tamanhos de camiseta e opções', () => {
    expect(SHIRT_SIZES.length).toBeGreaterThan(0);
    expect(SHIRT_SIZE_OPTIONS.length).toBe(SHIRT_SIZES.length);
    expect(SHIRT_SIZE_OPTIONS[0]).toHaveProperty('value');
  });
});