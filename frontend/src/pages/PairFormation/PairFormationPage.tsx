import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { ExportModal } from '../../components/export/ExportModal';
import { EditPairModal } from './EditPairModal';
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
  AlertTriangle,
  RotateCcw,
  Download,
  Edit2,
  Phone,
  Armchair,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

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

  // Edit pair modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<DuplaDetalhada | null>(null);

  // Clear pairs dialog
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Export modal
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const loadEventPairs = useCallback(async (eventId: number) => {
    try {
      const data = await pairService.listByEvent(eventId);
      setPairs(data);
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
      setPairs([]);
    }
  }, [selectedEventId, loadEventPairs]);

  const handleEventChange = (eventIdStr: string) => {
    const id = eventIdStr ? Number(eventIdStr) : '';
    setSelectedEventId(id);
    if (id) {
      setSearchParams({ evento: String(id) });
    } else {
      setSearchParams({});
    }
  };

  const selectedEvent = events.find((e) => e.cd_evento === Number(selectedEventId));

  const activeCadeirantes = cadeirantes.filter((c) => c.ativo);
  const activeCondutores = condutores.filter((c) => c.ativo);
  const maxPossiblePairs = Math.min(activeCadeirantes.length, activeCondutores.length);

  // Generate Automatic Pairs (RF03, RF04)
  const handleGeneratePairs = async () => {
    if (!selectedEventId) {
      warning('Atenção', 'Selecione um evento para formar as duplas.');
      return;
    }

    if (activeCadeirantes.length === 0 || activeCondutores.length === 0) {
      error(
        'Participantes Insuficientes (FA02)',
        'É necessário ter ao menos um cadeirante e um condutor ativos cadastrados no sistema.'
      );
      return;
    }

    try {
      setIsGenerating(true);
      const result = await pairService.generatePairs(Number(selectedEventId));
      setPairs(result.duplas);
      success(
        'Duplas Formadas com Sucesso! (RF03/RF04)',
        `${result.total_duplas} duplas foram geradas com base no histórico de participações.`
      );
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao gerar duplas automaticamente.';
      error('Falha na formação', msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear pairs
  const handleConfirmClear = async () => {
    if (!selectedEventId) return;
    try {
      setIsClearing(true);
      await pairService.clearPairs(Number(selectedEventId));
      setPairs([]);
      success('Duplas Limpas', 'As duplas deste evento foram desfeitas.');
      setClearDialogOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao limpar duplas do evento.';
      error('Falha ao limpar', msg);
    } finally {
      setIsClearing(false);
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
            Algoritmo inteligente com priorização por histórico de corrida (RF03, RF04, RF05)
          </p>
        </div>

        {pairs.length > 0 && selectedEvent && (
          <Button
            variant="outline"
            size="md"
            onClick={() => setExportModalOpen(true)}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Exportar Relatório (RF10/RF11)
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
            <div className="flex items-center gap-2">
              <Badge variant={pairs.length > 0 ? 'success' : 'warning'} size="md">
                {pairs.length > 0
                  ? `${pairs.length} duplas formadas`
                  : 'Nenhuma dupla formada ainda'}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
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

              <Button
                variant="primary"
                size="sm"
                onClick={handleGeneratePairs}
                isLoading={isGenerating}
                leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
                className="shadow-sm shadow-blue-600/30"
              >
                {pairs.length > 0 ? 'Regerar Duplas Automaticamente' : 'Gerar Duplas Automaticamente'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Disparity Warning (FA02) */}
      {selectedEvent && activeCadeirantes.length !== activeCondutores.length && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="leading-relaxed">
            <strong>Aviso de Participantes (FA02):</strong> Existem {activeCadeirantes.length}{' '}
            cadeirantes ativos e {activeCondutores.length} condutores ativos. O algoritmo formará{' '}
            <strong>{maxPossiblePairs} duplas</strong>, priorizando os participantes com maior tempo
            sem correr.
          </p>
        </div>
      )}

      {/* Pairs Grid */}
      {pairs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pairs.map((pair, index) => (
            <Card
              key={pair.cd_dupla}
              className="relative overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between"
            >
              {/* Header: Dupla number + Edit action */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-xs">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Dupla #{index + 1}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setEditingPair(pair);
                    setEditModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                  title="Trocar integrante (RF05)"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Dupla</span>
                </button>
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

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2">
                <span>RN01: 1 Cadeirante + 1 Condutor</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Válida
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : selectedEvent ? (
        <Card className="p-0 overflow-hidden">
          <EmptyState
            icon={<Layers className="w-8 h-8" />}
            title="Nenhuma dupla formada para este evento"
            description="Clique no botão abaixo para executar o algoritmo de pareamento com base no histórico de participações (RF03, RF04)."
            action={
              <Button
                variant="primary"
                size="md"
                onClick={handleGeneratePairs}
                isLoading={isGenerating}
                leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
              >
                Gerar Duplas Automaticamente
              </Button>
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

      {/* Edit Pair Modal (RF05) */}
      <EditPairModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        pair={editingPair}
        onSuccess={() => {
          if (selectedEventId) loadEventPairs(Number(selectedEventId));
        }}
      />

      {/* Clear pairs confirm dialog */}
      <ConfirmDialog
        isOpen={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleConfirmClear}
        title="Limpar Duplas do Evento"
        message="Tem certeza que deseja desmanchar as duplas deste evento? Esta ação removerá a formação atual."
        confirmText="Limpar Duplas"
        variant="danger"
        isLoading={isClearing}
      />

      {/* Export Modal (RF07, RF10, RF11) */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        eventId={selectedEvent?.cd_evento || null}
        eventName={selectedEvent?.nm_evento}
      />
    </div>
  );
};
