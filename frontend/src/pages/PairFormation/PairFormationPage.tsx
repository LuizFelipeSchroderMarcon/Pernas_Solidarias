import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { PageHeader } from '../../components/common/PageHeader';
import { ExportModal } from '../../components/export/ExportModal';
import { EditPairModal } from './EditPairModal';
import { CreatePairModal } from './CreatePairModal';
import { eventService } from '../../services/eventService';
import { participantService } from '../../services/participantService';
import { pairService } from '../../services/pairService';
import type { Evento, Cadeirante, Condutor, DuplaDetalhada } from '../../types';
import { formatDate, formatPhone } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import {
  Layers,
  Sparkles,
  Users,
  UserCheck,
  RotateCcw,
  Download,
  Edit2,
  Trash2,
  Phone,
  Armchair,
  Calendar,
  UserPlus,
} from 'lucide-react';
import { mensagemDeErro } from '../../services/apiError';

const LAST_SELECTED_EVENT_KEY = 'pernas_solidarias_selected_event';

export const PairFormationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error, warning } = useToast();

  const [events, setEvents] = useState<Evento[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [pairs, setPairs] = useState<DuplaDetalhada[]>([]);
  const [cadeirantes, setCadeirantes] = useState<Cadeirante[]>([]);
  const [condutores, setCondutores] = useState<Condutor[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Manual create pair modal
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Edit pair modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<DuplaDetalhada | null>(null);

  // Delete single pair confirm dialog
  const [deletePairDialogOpen, setDeletePairDialogOpen] = useState(false);
  const [pairToDelete, setPairToDelete] = useState<{ pair: DuplaDetalhada; index: number } | null>(null);

  // Clear all pairs dialog
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // Regenerate confirm dialog
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);

  // Export modal
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isLoadingPairs, setIsLoadingPairs] = useState(false);

  const loadEventPairs = useCallback(async (eventId: number) => {
    try {
      setIsLoadingPairs(true);
      const data = await pairService.listByEvent(eventId);
      const safeData = Array.isArray(data) ? data : (data as any)?.duplas || [];
      setPairs(safeData);
    } catch {
      error('Erro', 'Não foi possível carregar as duplas do evento.');
    } finally {
      setIsLoadingPairs(false);
    }
  }, [error]);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [evts, cads, conds] = await Promise.all([
          eventService.getEvents(),
          participantService.getCadeirantes(),
          participantService.getCondutores(),
        ]);

        setEvents(evts);
        setCadeirantes(cads);
        setCondutores(conds);

        const paramEventId = searchParams.get('evento');
        const savedEventId = localStorage.getItem(LAST_SELECTED_EVENT_KEY);

        if (paramEventId && evts.some((e) => e.cd_evento === Number(paramEventId))) {
          const numId = Number(paramEventId);
          setSelectedEventId(numId);
          localStorage.setItem(LAST_SELECTED_EVENT_KEY, String(numId));
        } else if (!paramEventId && savedEventId && evts.some((e) => e.cd_evento === Number(savedEventId))) {
          const numId = Number(savedEventId);
          setSelectedEventId(numId);
          setSearchParams({ evento: String(numId) }, { replace: true });
        } else {
          setSelectedEventId('');
          if (savedEventId) {
            localStorage.removeItem(LAST_SELECTED_EVENT_KEY);
          }
        }
      } catch {
        error('Erro', 'Não foi possível carregar os dados iniciais.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Sync when searchParams change externally (ex: browser back/forward or direct navigation)
  useEffect(() => {
    if (events.length === 0) return;

    const paramEventId = searchParams.get('evento');
    if (paramEventId) {
      const numId = Number(paramEventId);
      if (events.some((e) => e.cd_evento === numId)) {
        setSelectedEventId(numId);
        localStorage.setItem(LAST_SELECTED_EVENT_KEY, String(numId));
      } else {
        setSelectedEventId('');
        localStorage.removeItem(LAST_SELECTED_EVENT_KEY);
      }
    } else {
      setSelectedEventId('');
      localStorage.removeItem(LAST_SELECTED_EVENT_KEY);
    }
  }, [searchParams, events]);

  // Load pairs when selected event changes
  useEffect(() => {
    if (selectedEventId) {
      loadEventPairs(Number(selectedEventId));
    } else {
      setPairs([]);
    }
  }, [selectedEventId, loadEventPairs]);

  const handleEventChange = (eventIdStr: string) => {
    const targetId = eventIdStr ? Number(eventIdStr) : '';
    setSelectedEventId(targetId);
    if (targetId) {
      setSearchParams({ evento: String(targetId) });
      localStorage.setItem(LAST_SELECTED_EVENT_KEY, String(targetId));
    } else {
      setSearchParams({});
      localStorage.removeItem(LAST_SELECTED_EVENT_KEY);
      setPairs([]);
    }
  };

  const selectedEvent = events.find((e) => e.cd_evento === Number(selectedEventId));

  const activeCadeirantes = cadeirantes.filter((c) => c.ativo);
  const activeCondutores = condutores.filter((c) => c.ativo);
  const maxPossiblePairs = Math.min(activeCadeirantes.length, activeCondutores.length);

  // Automatic pair generation (persisted directly to database)
  const executeGeneratePairs = async () => {
    if (!selectedEventId) {
      warning('Atenção', 'Selecione um evento para formar as duplas.');
      return;
    }

    if (activeCadeirantes.length === 0 || activeCondutores.length === 0) {
      error(
        'Participantes Insuficientes',
        'É necessário ter ao menos um cadeirante e um condutor ativos cadastrados no sistema.'
      );
      return;
    }

    try {
      setIsGenerating(true);
      setIsSaving(true);
      const result = await pairService.generatePairs(Number(selectedEventId), false);
      const generatedPairs = Array.isArray(result?.duplas) ? result.duplas : [];
      setPairs(generatedPairs);
      success(
        'Duplas Geradas e Salvas!',
        `${result?.total_duplas ?? generatedPairs.length} duplas formadas e salvas automaticamente com base no histórico.`
      );
    } catch (err: any) {
      const msg = mensagemDeErro(err, 'Não foi possível gerar as duplas automaticamente.');
      error('Falha na formação', msg);
    } finally {
      setIsGenerating(false);
      setIsSaving(false);
      setRegenerateDialogOpen(false);
    }
  };

  const handleGeneratePairs = () => {
    if (pairs.length > 0) {
      setRegenerateDialogOpen(true);
    } else {
      executeGeneratePairs();
    }
  };

  // Add pair manually and save immediately
  const handleAddPairManually = async (cadeirante: Cadeirante, condutor: Condutor) => {
    if (!selectedEventId) return;

    try {
      setIsSaving(true);
      const created = await pairService.createPair(
        Number(selectedEventId),
        cadeirante.cd_cadeirante,
        condutor.cd_condutor
      );
      setPairs((prev) => [...prev, created]);
      success(
        'Dupla Salva com Sucesso!',
        `Dupla "${cadeirante.nm_cadeirante}" + "${condutor.nm_condutor}" adicionada e salva automaticamente.`
      );
    } catch (err: any) {
      const msg = mensagemDeErro(err, 'Não foi possível criar a dupla.');
      error('Falha ao Salvar', msg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Edit a pair and save immediately
  const handleEditPair = async (
    pairId: number,
    cd_cadeirante: number,
    cd_condutor: number
  ) => {
    try {
      setIsSaving(true);
      const updated = await pairService.editPair(pairId, cd_cadeirante, cd_condutor);
      setPairs((prev) => prev.map((p) => (p.cd_dupla === pairId ? updated : p)));
      success('Dupla Atualizada!', 'A alteração foi salva automaticamente no sistema.');
    } catch (err: any) {
      const msg = mensagemDeErro(err, 'Não foi possível atualizar a dupla.');
      error('Falha na Edição', msg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Request to delete a single specific pair
  const handleRequestDeletePair = (pair: DuplaDetalhada, index: number) => {
    setPairToDelete({ pair, index });
    setDeletePairDialogOpen(true);
  };

  // Confirm delete of single pair and delete immediately in database
  const handleConfirmDeletePair = async () => {
    if (!pairToDelete) return;
    try {
      setIsSaving(true);
      await pairService.deletePair(pairToDelete.pair.cd_dupla);
      setPairs((prev) => prev.filter((p) => p.cd_dupla !== pairToDelete.pair.cd_dupla));
      success(
        'Dupla Removida',
        `A Dupla #${pairToDelete.index + 1} foi excluída com sucesso.`
      );
      setDeletePairDialogOpen(false);
      setPairToDelete(null);
    } catch (err: any) {
      const msg = mensagemDeErro(err, 'Não foi possível excluir a dupla.');
      error('Falha ao Excluir', msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Clear all pairs of the event immediately in database
  const handleConfirmClear = async () => {
    if (!selectedEventId) return;
    try {
      setIsSaving(true);
      await pairService.clearPairs(Number(selectedEventId));
      setPairs([]);
      setClearDialogOpen(false);
      success(
        'Duplas Removidas',
        'Todas as duplas deste evento foram removidas com sucesso.'
      );
    } catch (err: any) {
      const msg = mensagemDeErro(err, 'Não foi possível limpar as duplas.');
      error('Falha ao Limpar', msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Spinner size="lg" text="Carregando módulo de duplas..." className="min-h-[60vh]" />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Formação de Duplas"
        description="Geração inteligente automática com priorização baseada no histórico de participações ou criação manual com salvamento automático."
        actions={
          pairs.length > 0 && selectedEvent ? (
            <Button
              variant="outline"
              size="md"
              onClick={() => setExportModalOpen(true)}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Exportar Relatório
            </Button>
          ) : undefined
        }
      />

      {/* Event Selection & Metrics Control Bar */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Event Selector */}
          <div className="w-full lg:max-w-md">
            <Select
              label="Selecione o Evento / Corrida"
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              options={
                events.length > 0
                  ? [
                      { value: '', label: 'Selecione um evento...' },
                      ...events.map((evt) => ({
                        value: evt.cd_evento,
                        label: `${evt.nm_evento} — ${formatDate(evt.dt_evento)}`,
                      })),
                    ]
                  : [{ value: '', label: 'Nenhum evento cadastrado' }]
              }
            />
          </div>

          {/* Quick counts */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 text-xs">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-slate-600 dark:text-slate-300">Cadeirantes Ativos:</span>
              <span className="font-bold text-blue-700 dark:text-blue-300">
                {activeCadeirantes.length}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 text-xs">
              <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-slate-600 dark:text-slate-300">Condutores Ativos:</span>
              <span className="font-bold text-indigo-700 dark:text-indigo-300">
                {activeCondutores.length}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 text-xs">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-slate-600 dark:text-slate-300">Capacidade Máxima:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                {maxPossiblePairs} duplas
              </span>
            </div>
          </div>
        </div>

        {/* Action button bar with auto-save indicator */}
        {selectedEvent && (
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant={pairs.length > 0 ? 'success' : 'neutral'} size="md">
                {pairs.length > 0
                  ? `${pairs.length} ${pairs.length === 1 ? 'dupla formada' : 'duplas formadas'}`
                  : 'Nenhuma dupla formada'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Botão de Adicionar Dupla Manualmente */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                disabled={isSaving || isGenerating}
                leftIcon={<UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              >
                Criar Dupla Manualmente
              </Button>

              {/* Botão de Gerar Automaticamente */}
              <Button
                variant={pairs.length > 0 ? 'outline' : 'primary'}
                size="sm"
                onClick={handleGeneratePairs}
                isLoading={isGenerating}
                disabled={isSaving}
                leftIcon={<Sparkles className="w-4 h-4 text-amber-500" />}
              >
                {pairs.length > 0 ? 'Regerar Automaticamente' : 'Gerar Automaticamente'}
              </Button>

              {/* Botão de Limpar Duplas */}
              {pairs.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClearDialogOpen(true)}
                  disabled={isSaving || isGenerating}
                  leftIcon={<RotateCcw className="w-4 h-4 text-rose-500" />}
                  className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200"
                >
                  Limpar Duplas
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Pairs Grid */}
      {isLoadingPairs ? (
        <Card className="p-12 flex items-center justify-center">
          <Spinner size="md" text="Carregando duplas do evento..." />
        </Card>
      ) : pairs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pairs.map((pair, index) => (
            <Card
              key={pair.cd_dupla}
              className="relative overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between"
            >
              {/* Header: Dupla number + Edit & Delete actions */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-xs">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Dupla #{index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPair(pair);
                      setEditModalOpen(true);
                    }}
                    disabled={isSaving}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors disabled:opacity-50"
                    title="Editar integrantes desta dupla"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestDeletePair(pair, index)}
                    disabled={isSaving}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors disabled:opacity-50"
                    title="Excluir esta dupla específica"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>

              {/* Pair composition details: Cadeirante | Condutor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                {/* Left: Cadeirante */}
                <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Cadeirante
                      </span>
                      <Badge variant="neutral" size="sm">
                        {pair.tam_camisa_cadeirante}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {pair.nm_cadeirante}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-blue-100/60 dark:border-blue-900/40 flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <a
                      href={`tel:${pair.telefone_cadeirante}`}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 dark:text-slate-300 hover:underline"
                    >
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{formatPhone(pair.telefone_cadeirante)}</span>
                    </a>
                    {pair.possui_cadeira_propria && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                        <Armchair className="w-3.5 h-3.5" /> Cadeira Própria
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Condutor */}
                <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Condutor
                      </span>
                      <Badge variant="neutral" size="sm">
                        {pair.tam_camisa_condutor}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {pair.nm_condutor}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-indigo-100/60 dark:border-indigo-900/40 flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <a
                      href={`tel:${pair.telefone_condutor}`}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 dark:text-slate-300 hover:underline"
                    >
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{formatPhone(pair.telefone_condutor)}</span>
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : selectedEvent ? (
        <Card className="p-0 overflow-hidden">
          <EmptyState
            icon={<Layers className="w-8 h-8" />}
            title="Nenhuma dupla para este evento"
            description="Você pode formar as duplas usando o algoritmo inteligente com base no histórico ou criar manualmente cada dupla."
            action={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleGeneratePairs}
                  isLoading={isGenerating}
                  leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
                >
                  Gerar Automaticamente
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setCreateModalOpen(true)}
                  leftIcon={<UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                >
                  Criar Dupla Manualmente
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <EmptyState
            icon={<Calendar className="w-8 h-8" />}
            title="Nenhum evento selecionado"
            description="Cadastre ou selecione um evento no topo da página para gerenciar as duplas."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/eventos')}
                leftIcon={<Calendar className="w-4 h-4" />}
              >
                Ir para Eventos
              </Button>
            }
          />
        </Card>
      )}

      {/* Create Pair Modal */}
      <CreatePairModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        existingPairs={pairs}
        cadeirantes={cadeirantes}
        condutores={condutores}
        onAddPair={handleAddPairManually}
      />

      {/* Edit Pair Modal */}
      <EditPairModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingPair(null);
        }}
        pair={editingPair}
        allPairs={pairs}
        cadeirantesList={cadeirantes}
        condutoresList={condutores}
        onSave={handleEditPair}
      />

      {/* Delete Single Pair Confirm Dialog */}
      <ConfirmDialog
        isOpen={deletePairDialogOpen}
        onClose={() => {
          setDeletePairDialogOpen(false);
          setPairToDelete(null);
        }}
        onConfirm={handleConfirmDeletePair}
        title="Excluir Dupla Específica"
        message={`Tem certeza que deseja remover a Dupla #${(pairToDelete?.index ?? 0) + 1} (${pairToDelete?.pair.nm_cadeirante} + ${pairToDelete?.pair.nm_condutor}) deste evento? A exclusão será salva automaticamente.`}
        confirmText="Excluir Dupla"
        variant="danger"
      />

      {/* Clear pairs confirm dialog */}
      <ConfirmDialog
        isOpen={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleConfirmClear}
        title="Limpar Duplas do Evento"
        message="Tem certeza que deseja remover todas as duplas deste evento? A exclusão será salva automaticamente no banco de dados."
        confirmText="Limpar Duplas"
        variant="danger"
      />

      {/* Regenerate confirm dialog */}
      <ConfirmDialog
        isOpen={regenerateDialogOpen}
        onClose={() => setRegenerateDialogOpen(false)}
        onConfirm={executeGeneratePairs}
        title="Regerar Duplas Automaticamente?"
        message="Já existem duplas cadastradas para este evento. Ao regerar, as duplas atuais serão substituídas pelas novas duplas calculadas pelo sistema e salvas automaticamente. Deseja continuar?"
        confirmText="Regerar e Salvar"
        variant="primary"
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        eventId={selectedEvent?.cd_evento || null}
        eventName={selectedEvent?.nm_evento}
      />
    </div>
  );
};
