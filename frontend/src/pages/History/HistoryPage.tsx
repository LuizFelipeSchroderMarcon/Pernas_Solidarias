import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ExportModal } from '../../components/export/ExportModal';
import { HistoryPairsModal } from './HistoryPairsModal';
import { pairService } from '../../services/pairService';
import { eventService } from '../../services/eventService';
import type { DuplaDetalhada, Evento } from '../../types';
import { formatDate, formatPhone } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import {
  History as HistoryIcon,
  Search,
  Download,
  Filter,
  RotateCcw,
  Armchair,
  Phone,
  Eye,
  Calendar,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { error } = useToast();

  const [history, setHistory] = useState<DuplaDetalhada[]>([]);
  const [events, setEvents] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab view: 'events' (Cards conforme Mockup 15) vs 'pairs' (Tabela detalhada de duplas)
  const [viewMode, setViewMode] = useState<'events' | 'pairs'>('events');

  // Filters
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  // Event Pairs Modal (Mockup 16)
  const [pairsModalOpen, setPairsModalOpen] = useState(false);
  const [selectedPairsEvent, setSelectedPairsEvent] = useState<{
    id: number;
    name: string;
    date: string;
  } | null>(null);

  // Export Modal (Mockup 18)
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportEvent, setSelectedExportEvent] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [eventsList, historyList] = await Promise.all([
        eventService.getEvents(),
        pairService.getHistory({
          cd_evento: selectedEventId ? Number(selectedEventId) : undefined,
          data_inicio: startDate || undefined,
          data_fim: endDate || undefined,
          search: search.trim() || undefined,
        }),
      ]);

      setEvents(eventsList);
      setHistory(historyList);
    } catch {
      error('Erro', 'Não foi possível carregar o histórico de duplas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedEventId, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleClearFilters = () => {
    setSelectedEventId('');
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  const handleOpenExport = (eventId: number, eventName?: string) => {
    setSelectedExportEvent({ id: eventId, name: eventName || `Evento #${eventId}` });
    setExportModalOpen(true);
  };

  const handleOpenPairsModal = (evt: Evento) => {
    setSelectedPairsEvent({
      id: evt.cd_evento,
      name: evt.nm_evento,
      date: evt.dt_evento,
    });
    setPairsModalOpen(true);
  };

  // Filtered events for Cards view
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchesSearch = search ? evt.nm_evento.toLowerCase().includes(search.toLowerCase()) : true;
      const matchesEvent = selectedEventId ? evt.cd_evento === selectedEventId : true;
      const evtDate = new Date(evt.dt_evento);
      const matchesStart = startDate ? evtDate >= new Date(startDate) : true;
      const matchesEnd = endDate ? evtDate <= new Date(endDate) : true;
      return matchesSearch && matchesEvent && matchesStart && matchesEnd;
    });
  }, [events, search, selectedEventId, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Histórico de Participações
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registro imutável e somente leitura de todas as corridas e duplas realizadas
          </p>
        </div>

        {/* Toggle View Mode */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('events')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'events'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Visão por Eventos
          </button>
          <button
            onClick={() => setViewMode('pairs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'pairs'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Lista de Duplas
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-5">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Filter className="w-4 h-4" />
            <span>Filtros de Pesquisa</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Evento"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : '')}
              options={[
                { value: '', label: 'Todos os Eventos' },
                ...events.map((evt) => ({
                  value: evt.cd_evento,
                  label: `${evt.nm_evento} (${formatDate(evt.dt_evento)})`,
                })),
              ]}
            />

            <Input
              label="Data Inicial"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="Data Final"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            <Input
              label="Participante / Evento"
              placeholder="Nome ou busca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Limpar Filtros
            </Button>
            <Button type="submit" variant="primary" size="sm" leftIcon={<Search className="w-3.5 h-3.5" />}>
              Aplicar Filtro
            </Button>
          </div>
        </form>
      </Card>

      {/* Main Content: Event Cards (Mockup 15) vs Table */}
      {isLoading ? (
        <Spinner text="Carregando dados históricos..." className="py-16" />
      ) : viewMode === 'events' ? (
        /* Event Cards View (Mockup 15) */
        filteredEvents.length === 0 ? (
          <EmptyState
            icon={<HistoryIcon className="w-8 h-8" />}
            title="Nenhum evento histórico encontrado"
            description="Tente ajustar os filtros aplicados para localizar os eventos passados."
            action={
              (selectedEventId || startDate || endDate || search) && (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Limpar Filtros
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => (
              <Card key={evt.cd_evento} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(evt.dt_evento)}
                    </span>
                    <Badge variant="primary" size="sm">
                      {evt.total_duplas ?? 0} duplas
                    </Badge>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mt-3 leading-snug">
                    {evt.nm_evento}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Registrado em {formatDate(evt.created_at)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenPairsModal(evt)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Exibir Duplas
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenExport(evt.cd_evento, evt.nm_evento)}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Gerar Relatório
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        /* History Table View */
        <Card className="p-0 overflow-hidden">
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Evento / Data</th>
                    <th className="px-6 py-4">Cadeirante</th>
                    <th className="px-6 py-4">Condutor</th>
                    <th className="px-6 py-4">Data Registro</th>
                    <th className="px-6 py-4 text-right">Relatório</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.map((item) => (
                    <tr
                      key={item.cd_dupla}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors"
                    >
                      {/* Event info */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.nm_evento || `Evento #${item.cd_evento}`}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                          📅 {formatDate(item.dt_evento)}
                        </div>
                      </td>

                      {/* Cadeirante info */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.nm_cadeirante}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <Badge variant="neutral" size="sm">
                            Camiseta {item.tam_camisa_cadeirante}
                          </Badge>
                          {item.possui_cadeira_propria && (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-semibold">
                              <Armchair className="w-3 h-3" /> Cadeira Própria
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Condutor info */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.nm_condutor}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <Badge variant="neutral" size="sm">
                            Camiseta {item.tam_camisa_condutor}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-slate-500 text-[11px]">
                            <Phone className="w-3 h-3" /> {formatPhone(item.telefone_condutor)}
                          </span>
                        </div>
                      </td>

                      {/* Registration date */}
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        {formatDate(item.created_at)}
                      </td>

                      {/* Action: Export Event */}
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenExport(item.cd_evento, item.nm_evento)}
                          leftIcon={<Download className="w-3.5 h-3.5" />}
                          title="Exportar relatório deste evento"
                        >
                          Exportar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<HistoryIcon className="w-8 h-8" />}
              title="Nenhum registro histórico encontrado"
              description="Não foram encontradas duplas com os filtros aplicados."
              action={
                (selectedEventId || startDate || endDate || search) && (
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    Limpar Filtros
                  </Button>
                )
              }
            />
          )}
        </Card>
      )}

      {/* Pairs Modal (Mockup 16) */}
      <HistoryPairsModal
        isOpen={pairsModalOpen}
        onClose={() => setPairsModalOpen(false)}
        eventId={selectedPairsEvent?.id || null}
        eventName={selectedPairsEvent?.name}
        eventDate={selectedPairsEvent?.date}
        onExport={handleOpenExport}
      />

      {/* Export Modal (Mockup 18) */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        eventId={selectedExportEvent?.id || null}
        eventName={selectedExportEvent?.name}
      />
    </div>
  );
};
