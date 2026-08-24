import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ExportModal } from '../../components/export/ExportModal';
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
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { error } = useToast();

  const [history, setHistory] = useState<DuplaDetalhada[]>([]);
  const [events, setEvents] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters (RF09)
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  // Export Modal
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportEvent, setSelectedExportEvent] = useState<{ id: number; name: string } | null>(
    null
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Histórico de Participações
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registro imutável e somente leitura de todas as corridas e duplas realizadas (RF06, RN05)
          </p>
        </div>
      </div>

      {/* Filter Bar (RF09) */}
      <Card className="p-5">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Filter className="w-4 h-4" />
            <span>Filtros de Pesquisa (RF09)</span>
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
              label="Participante"
              placeholder="Nome ou CPF..."
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

      {/* History Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <Spinner text="Carregando histórico de duplas..." className="py-12" />
        ) : history.length > 0 ? (
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

                    {/* Action: Export Event (RF10) */}
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenExport(item.cd_evento, item.nm_evento)}
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                        title="Exportar relatório deste evento (RF10)"
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

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        eventId={selectedExportEvent?.id || null}
        eventName={selectedExportEvent?.name}
      />
    </div>
  );
};
