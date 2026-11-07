import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  // Edit pair modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<DuplaDetalhada | null>(null);

  // Clear pairs dialog
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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
        setPairs(data);
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
      const result = await pairService.generatePairs(Number(selectedEventId));
      setPairs(result.duplas);
      success(
        'Duplas Formadas com Sucesso!',
        `${result.total_duplas} duplas foram geradas com base no histórico de participações.`
      );
    } catch (err: any) {
      const msg = mensagemDeErro(err, 'Não foi possível atualizar a dupla. Verifique se o participante já está em outra dupla.');
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
      const msg = mensagemDeErro(err, 'Erro ao limpar duplas do evento.');
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
          <h2 className="text-2xl font-extrabold text-black tracking-tight">
            Formação de Duplas
          </h2>
          <p className="text-xs sm:text-sm text-[#525252] mt-1">
            Forme as duplas para os eventos e exporte o relatório no formato necessário
          </p>
        </div>

        {pairs.length > 0 && selectedEvent && (
          <Button
            variant="success"
            size="md"
            onClick={() => setExportModalOpen(true)}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Gerar Relatório
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
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#D9D9D9] border border-[#B9B9B9] text-xs">
              <Users className="w-4 h-4 text-black" />
              <span className="text-black">Cadeirantes Ativos:</span>
              <span className="font-bold text-black">
                {activeCadeirantes.length}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#D9D9D9] border border-[#B9B9B9] text-xs">
              <UserCheck className="w-4 h-4 text-black" />
              <span className="text-black">Condutores Ativos:</span>
              <span className="font-bold text-black">
                {activeCondutores.length}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#15803D]/15 border border-[#166534] text-xs">
              <Layers className="w-4 h-4 text-[#166534]" />
              <span className="text-black">Capacidade Máxima:</span>
              <span className="font-bold text-[#166534]">
                {maxPossiblePairs} duplas
              </span>
            </div>
          </div>
        </div>

        {/* Action button bar */}
        {selectedEvent && (
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-[#D9D9D9]">
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
                  variant="danger"
                  size="sm"
                  onClick={() => setClearDialogOpen(true)}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Limpar Duplas
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={handleGeneratePairs}
                isLoading={isGenerating}
                leftIcon={<Sparkles className="w-4 h-4 text-white" />}
              >
                {pairs.length > 0 ? 'Regerar Duplas Automaticamente' : 'Gerar Duplas Automaticamente'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Disparity Warning */}
      {selectedEvent && activeCadeirantes.length !== activeCondutores.length && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-100 border border-amber-400 text-black text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
          <p className="leading-relaxed">
            <strong>Aviso de Participantes:</strong> Existem {activeCadeirantes.length}{' '}
            cadeirantes ativos e {activeCondutores.length} condutores ativos. O algoritmo formará{' '}
            <strong>{maxPossiblePairs} duplas</strong>, priorizando os participantes com maior tempo
            sem correr.
          </p>
        </div>
      )}

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
              {/* Header: Dupla number + Edit action */}
              <div className="flex items-center justify-between pb-3 border-b border-[#D9D9D9]">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#15803D] border border-[#166534] text-white font-extrabold text-xs">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-black">
                    Dupla #{index + 1}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setEditingPair(pair);
                    setEditModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-black bg-white border border-black/50 px-2.5 py-1 rounded-lg hover:bg-[#16A34A] hover:text-white transition-colors cursor-pointer"
                  title="Trocar integrante"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Dupla</span>
                </button>
              </div>

              {/* Pair composition details: Cadeirante | Condutor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                {/* Left: Cadeirante */}
                <div className="p-3.5 rounded-xl bg-[#D9D9D9]/70 border border-[#B9B9B9] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-black">
                        Cadeirante
                      </span>
                      <Badge variant="neutral" size="sm">
                        {pair.tam_camisa_cadeirante}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-black leading-snug">
                      {pair.nm_cadeirante}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#B9B9B9] flex flex-col gap-1.5 text-xs text-black">
                    <a
                      href={`tel:${pair.telefone_cadeirante}`}
                      className="inline-flex items-center gap-1 text-black hover:text-[#166534] hover:underline"
                    >
                      <Phone className="w-3 h-3 text-[#525252]" />
                      <span>{formatPhone(pair.telefone_cadeirante)}</span>
                    </a>
                    {pair.possui_cadeira_propria && (
                      <span className="inline-flex items-center gap-1 text-[#166534] font-bold text-[11px]">
                        <Armchair className="w-3.5 h-3.5" /> Cadeira Própria
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Condutor */}
                <div className="p-3.5 rounded-xl bg-[#D9D9D9]/70 border border-[#B9B9B9] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-black">
                        Condutor
                      </span>
                      <Badge variant="neutral" size="sm">
                        {pair.tam_camisa_condutor}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-black leading-snug">
                      {pair.nm_condutor}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#B9B9B9] flex flex-col gap-1.5 text-xs text-black">
                    <a
                      href={`tel:${pair.telefone_condutor}`}
                      className="inline-flex items-center gap-1 text-black hover:text-[#166534] hover:underline"
                    >
                      <Phone className="w-3 h-3 text-[#525252]" />
                      <span>{formatPhone(pair.telefone_condutor)}</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#525252] pt-2">
                <span>1 Cadeirante + 1 Condutor</span>
                <span className="flex items-center gap-1 text-[#166534] font-bold">
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
            description="Clique no botão abaixo para executar o algoritmo de pareamento com base no histórico de participações."
            action={
              <Button
                variant="primary"
                size="md"
                onClick={handleGeneratePairs}
                isLoading={isGenerating}
                leftIcon={<Sparkles className="w-4 h-4 text-white" />}
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

      {/* Edit Pair Modal */}
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
