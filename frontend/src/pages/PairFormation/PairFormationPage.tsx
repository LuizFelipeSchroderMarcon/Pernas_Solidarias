import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useBlocker } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
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
  Save,
  UserPlus,
  Undo2,
} from 'lucide-react';
import { mensagemDeErro } from '../../services/apiError';

export const PairFormationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error, warning } = useToast();

  const [events, setEvents] = useState<Evento[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [savedPairs, setSavedPairs] = useState<DuplaDetalhada[]>([]);
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

  // Discard changes dialog
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  // Switch event with unsaved changes dialog
  const [switchEventDialogOpen, setSwitchEventDialogOpen] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<number | '' | null>(null);

  // Export modal
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const loadEventPairs = useCallback(async (eventId: number) => {
    try {
      const data = await pairService.listByEvent(eventId);
      const safeData = Array.isArray(data) ? data : (data as any)?.duplas || [];
      setSavedPairs(safeData);
      setPairs(safeData);
    } catch {
      error('Erro', 'Não foi possível carregar as duplas do evento.');
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
        if (paramEventId && evts.some((e) => e.cd_evento === Number(paramEventId))) {
          setSelectedEventId(Number(paramEventId));
        } else if (evts.length > 0) {
          setSelectedEventId(evts[0].cd_evento);
          setSearchParams({ evento: String(evts[0].cd_evento) });
        }
      } catch {
        error('Erro', 'Não foi possível carregar os dados iniciais.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load pairs when selected event changes
  useEffect(() => {
    if (selectedEventId) {
      loadEventPairs(Number(selectedEventId));
    } else {
      setSavedPairs([]);
      setPairs([]);
    }
  }, [selectedEventId, loadEventPairs]);

  const handleEventChange = (eventIdStr: string) => {
    const targetId = eventIdStr ? Number(eventIdStr) : '';
    if (hasUnsavedChanges) {
      setPendingEventId(targetId);
      setSwitchEventDialogOpen(true);
      return;
    }

    applyEventChange(targetId);
  };

  const applyEventChange = (id: number | '') => {
    setSelectedEventId(id);
    if (id) {
      setSearchParams({ evento: String(id) });
    } else {
      setSearchParams({});
    }
  };

  const handleConfirmSwitchEvent = () => {
    if (pendingEventId !== null) {
      applyEventChange(pendingEventId);
      setPendingEventId(null);
    }
    setSwitchEventDialogOpen(false);
  };

  const selectedEvent = events.find((e) => e.cd_evento === Number(selectedEventId));

  const activeCadeirantes = cadeirantes.filter((c) => c.ativo);
  const activeCondutores = condutores.filter((c) => c.ativo);
  const maxPossiblePairs = Math.min(activeCadeirantes.length, activeCondutores.length);

  // Check if a pair is newly created (preview or manual addition, not in database)
  const isNewPair = useCallback(
    (pair: DuplaDetalhada) =>
      pair.cd_dupla < 0 || !savedPairs.some((sp) => sp.cd_dupla === pair.cd_dupla),
    [savedPairs]
  );

  // Check if an existing pair was modified in draft
  const isModifiedPair = useCallback(
    (pair: DuplaDetalhada) => {
      if (pair.cd_dupla < 0) return false;
      const original = savedPairs.find((sp) => sp.cd_dupla === pair.cd_dupla);
      if (!original) return false;
      return (
        original.cd_cadeirante !== pair.cd_cadeirante ||
        original.cd_condutor !== pair.cd_condutor
      );
    },
    [savedPairs]
  );

  const newPairsCount = pairs.filter(isNewPair).length;
  const modifiedPairsCount = pairs.filter(isModifiedPair).length;
  const deletedPairsCount = savedPairs.filter(
    (sp) => !pairs.some((p) => p.cd_dupla === sp.cd_dupla)
  ).length;

  // Draft pairs count contains only altered pairs or newly created pairs
  const draftPairsCount = newPairsCount + modifiedPairsCount;
  const hasUnsavedChanges = draftPairsCount > 0 || deletedPairsCount > 0;

  // Block internal router navigation to another screen when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  // Warn before browser reload / window close if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Automatic pair generation (Preview / Draft mode)
  const handleGeneratePairs = async () => {
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
      const result = await pairService.generatePairs(Number(selectedEventId), true);
      const generatedPairs = Array.isArray(result?.duplas) ? result.duplas : [];
      setPairs(generatedPairs);
      success(
        'Duplas Geradas (Rascunho)',
        `${result?.total_duplas ?? generatedPairs.length} duplas sugeridas pelo algoritmo. Revise e clique em "Salvar Duplas" para salvar no sistema.`
      );
    } catch (err: any) {
      const msg = mensagemDeErro(err, 'Não foi possível gerar duplas automaticamente.');
      error('Falha na formação', msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Add pair manually from scratch or alongside existing pairs
  const handleAddPairManually = (cadeirante: Cadeirante, condutor: Condutor) => {
    const newPair: DuplaDetalhada = {
      cd_dupla: -Date.now(),
      cd_evento: Number(selectedEventId),
      nm_evento: selectedEvent?.nm_evento || '',
      dt_evento: selectedEvent?.dt_evento ? String(selectedEvent.dt_evento) : '',
      cd_cadeirante: cadeirante.cd_cadeirante,
      nm_cadeirante: cadeirante.nm_cadeirante,
      cpf_cadeirante: cadeirante.cpf,
      telefone_cadeirante: cadeirante.telefone,
      tam_camisa_cadeirante: cadeirante.tam_camisa,
      possui_cadeira_propria: cadeirante.possui_cadeira_propria,
      cd_condutor: condutor.cd_condutor,
      nm_condutor: condutor.nm_condutor,
      cpf_condutor: condutor.cpf,
      telefone_condutor: condutor.telefone,
      tam_camisa_condutor: condutor.tam_camisa,
      created_at: new Date().toISOString(),
    };

    setPairs((prev) => [...prev, newPair]);
    success(
      'Dupla Adicionada!',
      `Dupla "${cadeirante.nm_cadeirante}" + "${condutor.nm_condutor}" adicionada. Lembre-se de salvar ao final.`
    );
  };

  // Edit a pair locally in draft
  const handleEditPairDraft = (
    pairId: number,
    cd_cadeirante: number,
    cd_condutor: number,
    cadeirante: Cadeirante,
    condutor: Condutor
  ) => {
    setPairs((prev) =>
      prev.map((p) => {
        if (p.cd_dupla !== pairId) return p;
        return {
          ...p,
          cd_cadeirante,
          nm_cadeirante: cadeirante.nm_cadeirante,
          cpf_cadeirante: cadeirante.cpf,
          telefone_cadeirante: cadeirante.telefone,
          tam_camisa_cadeirante: cadeirante.tam_camisa,
          possui_cadeira_propria: cadeirante.possui_cadeira_propria,
          cd_condutor,
          nm_condutor: condutor.nm_condutor,
          cpf_condutor: condutor.cpf,
          telefone_condutor: condutor.telefone,
          tam_camisa_condutor: condutor.tam_camisa,
        };
      })
    );
  };

  // Request to delete a single specific pair
  const handleRequestDeletePair = (pair: DuplaDetalhada, index: number) => {
    setPairToDelete({ pair, index });
    setDeletePairDialogOpen(true);
  };

  // Confirm delete of single pair
  const handleConfirmDeletePair = () => {
    if (!pairToDelete) return;
    setPairs((prev) => prev.filter((p) => p.cd_dupla !== pairToDelete.pair.cd_dupla));
    success(
      'Dupla Removida',
      `A Dupla #${pairToDelete.index + 1} foi removida da lista. Clique em "Salvar Duplas" para persistir.`
    );
    setDeletePairDialogOpen(false);
    setPairToDelete(null);
  };

  // Clear all pairs in draft
  const handleConfirmClear = () => {
    setPairs([]);
    setClearDialogOpen(false);
    success(
      'Duplas Limpas',
      'As duplas foram removidas da lista. Clique em "Salvar Duplas" para confirmar a exclusão no banco.'
    );
  };

  // Discard local changes and revert to database
  const handleDiscardChanges = () => {
    setPairs(savedPairs);
    success(
      'Alterações Descartadas',
      'A lista foi restaurada para a última versão salva.'
    );
  };

  // Save all pairs to database
  const handleSavePairs = async () => {
    if (!selectedEventId) return;

    // Check duplicate cadeirantes or condutores before submitting
    const cadSet = new Set<number>();
    const condSet = new Set<number>();
    for (const p of pairs) {
      if (cadSet.has(p.cd_cadeirante)) {
        error(
          'Duplicidade Identificada',
          `O cadeirante "${p.nm_cadeirante}" está alocado em mais de uma dupla. Ajuste antes de salvar.`
        );
        return;
      }
      cadSet.add(p.cd_cadeirante);

      if (condSet.has(p.cd_condutor)) {
        error(
          'Duplicidade Identificada',
          `O condutor "${p.nm_condutor}" está alocado em mais de uma dupla. Ajuste antes de salvar.`
        );
        return;
      }
      condSet.add(p.cd_condutor);
    }

    try {
      setIsSaving(true);
      const payload = pairs.map((p) => ({
        cd_cadeirante: p.cd_cadeirante,
        cd_condutor: p.cd_condutor,
      }));

      const saved = await pairService.savePairs(Number(selectedEventId), payload);
      const safeSaved = Array.isArray(saved) ? saved : [];
      setSavedPairs(safeSaved);
      setPairs(safeSaved);
      success(
        'Duplas Salvas com Sucesso!',
        `${safeSaved.length} dupla(s) foram salvas com sucesso.`
      );
    } catch (err: any) {
      const msg = mensagemDeErro(err, 'Erro ao salvar as duplas.');
      error('Falha ao Salvar', msg);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Formação de Duplas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Geração inteligente automática ou criação manual das duplas para os eventos
          </p>
        </div>

        {pairs.length > 0 && selectedEvent && (
          <Button
            variant="outline"
            size="md"
            onClick={() => setExportModalOpen(true)}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Exportar Relatório
          </Button>
        )}
      </div>

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
                  ? events.map((evt) => ({
                    value: evt.cd_evento,
                    label: `${evt.nm_evento} — ${formatDate(evt.dt_evento)}`,
                  }))
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

        {/* Action button bar */}
        {selectedEvent && (
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={hasUnsavedChanges ? 'warning' : pairs.length > 0 ? 'success' : 'neutral'} size="md">
                {hasUnsavedChanges
                  ? draftPairsCount > 0
                    ? `Alterações Pendentes (${draftPairsCount} no rascunho)`
                    : deletedPairsCount > 0
                    ? `Alterações Pendentes (${deletedPairsCount} ${deletedPairsCount === 1 ? 'dupla removida' : 'duplas removidas'})`
                    : 'Alterações Pendentes'
                  : pairs.length > 0
                  ? `${pairs.length} ${pairs.length === 1 ? 'dupla salva' : 'duplas salvas'}`
                  : 'Nenhuma dupla formada'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Botão de Adicionar Dupla Manualmente */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
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
                  leftIcon={<RotateCcw className="w-4 h-4 text-rose-500" />}
                  className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200"
                >
                  Limpar Duplas
                </Button>
              )}

              {/* Botão de Descartar Alterações */}
              {hasUnsavedChanges && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDiscardDialogOpen(true)}
                  leftIcon={<Undo2 className="w-4 h-4 text-slate-500" />}
                  className="text-slate-600 dark:text-slate-300"
                >
                  Descartar
                </Button>
              )}

              {/* Botão de Salvar Duplas no Banco */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSavePairs}
                disabled={!hasUnsavedChanges || isSaving}
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4 text-white" />}
                className={'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/40'}
              >
                Salvar Duplas
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Pairs Grid */}
      {pairs.length > 0 ? (
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
                  {isNewPair(pair) ? (
                    <Badge variant="warning" size="sm">
                      Nova
                    </Badge>
                  ) : isModifiedPair(pair) ? (
                    <Badge variant="info" size="sm">
                      Alterada
                    </Badge>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPair(pair);
                      setEditModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                    title="Editar integrantes desta dupla"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestDeletePair(pair, index)}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
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
        onSaveDraft={handleEditPairDraft}
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
        message={`Tem certeza que deseja remover a Dupla #${(pairToDelete?.index ?? 0) + 1} (${pairToDelete?.pair.nm_cadeirante} + ${pairToDelete?.pair.nm_condutor}) da lista deste evento? A remoção ficará como rascunho até que você clique em "Salvar Duplas".`}
        confirmText="Excluir Dupla"
        variant="danger"
      />

      {/* Clear pairs confirm dialog */}
      <ConfirmDialog
        isOpen={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleConfirmClear}
        title="Limpar Duplas do Evento"
        message="Tem certeza que deseja desfazer todas as duplas deste evento? As alterações serão efetivadas quando você clicar em 'Salvar Duplas'."
        confirmText="Limpar Duplas"
        variant="danger"
      />

      {/* Discard Changes Confirm Dialog */}
      <ConfirmDialog
        isOpen={discardDialogOpen}
        onClose={() => setDiscardDialogOpen(false)}
        onConfirm={() => {
          handleDiscardChanges();
          setDiscardDialogOpen(false);
        }}
        title="Descartar Alterações?"
        message={`Tem certeza que deseja descartar todas as alterações feitas para o evento "${selectedEvent?.nm_evento || 'selecionado'}"? A lista de duplas será restaurada para a última versão salva.`}
        confirmText="Descartar Alterações"
        variant="danger"
      />

      {/* Switch Event With Unsaved Changes Dialog */}
      <ConfirmDialog
        isOpen={switchEventDialogOpen}
        onClose={() => {
          setSwitchEventDialogOpen(false);
          setPendingEventId(null);
        }}
        onConfirm={handleConfirmSwitchEvent}
        title="Descartar Alterações Não Salvas?"
        message={`Você possui duplas ainda não salvas no evento "${selectedEvent?.nm_evento || 'selecionado'}". Se trocar de evento agora, essas alterações serão perdidas. Deseja continuar?`}
        confirmText="Descartar e Trocar"
        variant="danger"
      />

      {/* Navigation to Another Screen Blocker Dialog */}
      <ConfirmDialog
        isOpen={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="Alterações Não Salvas"
        message={`Você possui duplas ainda não salvas para o evento "${selectedEvent?.nm_evento || 'selecionado'}". Se você sair desta tela agora, as alterações serão descartadas. Deseja realmente sair sem salvar?`}
        confirmText="Sair sem Salvar"
        variant="danger"
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
