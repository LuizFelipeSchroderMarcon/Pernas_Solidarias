import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { formatDate, formatPhone, toInputDateFormat } from '../../utils/formatters';
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
  const latestRequestRef = useRef(0);

  const loadEventPairs = useCallback(async (eventId: number) => {
    const requestId = ++latestRequestRef.current;
    try {
      setIsLoadingPairs(true);
      const data = await pairService.listByEvent(eventId);
      if (requestId === latestRequestRef.current) {
        setPairs(Array.isArray(data) ? data : []);
      }
    } catch {
      if (requestId === latestRequestRef.current) {
        error('Erro', 'Não foi possível carregar as duplas do evento.');
      }
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsLoadingPairs(false);
      }
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

        const todayDateStr = (() => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })();

        const availableEvents = evts.filter(
          (e) => toInputDateFormat(e.dt_evento) >= todayDateStr
        );

        setEvents(availableEvents);
        setCadeirantes(cads);
        setCondutores(conds);

        const paramEventId = searchParams.get('evento');
        const savedEventId = localStorage.getItem(LAST_SELECTED_EVENT_KEY);

        if (paramEventId && availableEvents.some((e) => e.cd_evento === Number(paramEventId))) {
          const numId = Number(paramEventId);
          setSelectedEventId(numId);
          localStorage.setItem(LAST_SELECTED_EVENT_KEY, String(numId));
        } else if (!paramEventId && savedEventId && availableEvents.some((e) => e.cd_evento === Number(savedEventId))) {
          const numId = Number(savedEventId);
          setSelectedEventId(numId);
          setSearchParams({ evento: String(numId) }, { replace: true });
        } else {
          setSelectedEventId('');
          if (paramEventId) {
            setSearchParams({}, { replace: true });
          }
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
      latestRequestRef.current += 1;
      setIsLoadingPairs(false);
      setPairs([]);
    }
  }, [selectedEventId, loadEventPairs]);

  const handleEventChange = (eventIdStr: string) => {
    const id = eventIdStr ? Number(eventIdStr) : '';
    setSelectedEventId(id);
    if (id) {
      setSearchParams({ evento: String(id) });
      localStorage.setItem(LAST_SELECTED_EVENT_KEY, String(id));
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
      {/* Page Header */}
      <PageHeader
        title="Formação de Duplas"
        description="Geração inteligente automática ou criação manual com salvamento automático."
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
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#D9D9D9] dark:bg-slate-800 border border-[#B9B9B9] dark:border-slate-700 text-xs">
              <Users className="w-4 h-4 text-black dark:text-slate-200" />
              <span className="text-black dark:text-slate-300">Cadeirantes Ativos:</span>
              <span className="font-bold text-black dark:text-white">
                {activeCadeirantes.length}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#D9D9D9] dark:bg-slate-800 border border-[#B9B9B9] dark:border-slate-700 text-xs">
              <UserCheck className="w-4 h-4 text-black dark:text-slate-200" />
              <span className="text-black dark:text-slate-300">Condutores Ativos:</span>
              <span className="font-bold text-black dark:text-white">
                {activeCondutores.length}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#15803D]/15 dark:bg-[#15803D]/30 border border-[#166534] dark:border-[#22C55E] text-xs">
              <Layers className="w-4 h-4 text-[#166534] dark:text-[#4ADE80]" />
              <span className="text-black dark:text-slate-200">Capacidade Máxima:</span>
              <span className="font-bold text-[#166534] dark:text-[#4ADE80]">
                {maxPossiblePairs} duplas
              </span>
            </div>
          </div>
        </div>

        {/* Action button bar with auto-save indicator */}
        {selectedEvent && (
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-[#D9D9D9] dark:border-slate-800">
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
                leftIcon={<UserPlus className="w-4 h-4 text-[#166534]" />}
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
                  variant="danger"
                  size="sm"
                  onClick={() => setClearDialogOpen(true)}
                  disabled={isSaving || isGenerating}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
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
              className="relative overflow-hidden border border-[#B9B9B9] shadow-xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between"
            >
              {/* Header: Dupla number + Edit & Delete actions */}
              <div className="flex items-center justify-between pb-3 border-b border-[#D9D9D9] dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#15803D] border border-[#166534] text-white font-extrabold text-xs">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
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
                    className="flex items-center gap-1 text-xs font-semibold text-black dark:text-slate-200 bg-white dark:bg-slate-800 border border-[#B9B9B9] dark:border-slate-700 px-2.5 py-1 rounded-lg hover:bg-[#16A34A] hover:text-white dark:hover:bg-[#16A34A] transition-colors cursor-pointer disabled:opacity-50"
                    title="Editar integrantes desta dupla"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestDeletePair(pair, index)}
                    disabled={isSaving}
                    className="flex items-center gap-1 text-xs font-semibold text-[#F51414] dark:text-red-400 bg-white dark:bg-slate-800 border border-[#B9B9B9] dark:border-slate-700 px-2.5 py-1 rounded-lg hover:bg-[#F51414] hover:text-white dark:hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
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
                <div className="p-3.5 rounded-xl bg-[#D9D9D9]/70 dark:bg-slate-800/80 border border-[#B9B9B9] dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-black dark:text-slate-300">
                        Cadeirante
                      </span>
                      <Badge variant="neutral" size="sm">
                        {pair.tam_camisa_cadeirante}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-black dark:text-white leading-snug">
                      {pair.nm_cadeirante}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#B9B9B9] dark:border-slate-700 flex flex-col gap-1.5 text-xs text-black dark:text-slate-300">
                    <a
                      href={`tel:${pair.telefone_cadeirante}`}
                      className="inline-flex items-center gap-1 text-black dark:text-slate-200 hover:text-[#166534] dark:hover:text-[#4ADE80] hover:underline"
                    >
                      <Phone className="w-3 h-3 text-[#525252] dark:text-slate-400" />
                      <span>{formatPhone(pair.telefone_cadeirante)}</span>
                    </a>
                    {pair.possui_cadeira_propria && (
                      <span className="inline-flex items-center gap-1 text-[#166534] dark:text-[#4ADE80] font-bold text-[11px]">
                        <Armchair className="w-3.5 h-3.5" /> Cadeira Própria
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Condutor */}
                <div className="p-3.5 rounded-xl bg-[#D9D9D9]/70 dark:bg-slate-800/80 border border-[#B9B9B9] dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-black dark:text-slate-300">
                        Condutor
                      </span>
                      <Badge variant="neutral" size="sm">
                        {pair.tam_camisa_condutor}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-black dark:text-white leading-snug">
                      {pair.nm_condutor}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#B9B9B9] dark:border-slate-700 flex flex-col gap-1.5 text-xs text-black dark:text-slate-300">
                    <a
                      href={`tel:${pair.telefone_condutor}`}
                      className="inline-flex items-center gap-1 text-black dark:text-slate-200 hover:text-[#166534] dark:hover:text-[#4ADE80] hover:underline"
                    >
                      <Phone className="w-3 h-3 text-[#525252] dark:text-slate-400" />
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
                  leftIcon={<Sparkles className="w-4 h-4 text-white" />}
                >
                  Gerar Automaticamente
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setCreateModalOpen(true)}
                  leftIcon={<UserPlus className="w-4 h-4 text-[#166534]" />}
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
