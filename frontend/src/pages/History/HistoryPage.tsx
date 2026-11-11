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
import { eventService } from '../../services/eventService';
import type { Evento } from '../../types';
import { formatDate, isBeforeToday, toInputDateFormat } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import {
  History as HistoryIcon,
  Search,
  Download,
  Filter,
  RotateCcw,
  Eye,
  Calendar,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { error } = useToast();

  const [events, setEvents] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const eventsList = await eventService.getEvents('passados');
      const pastEvents = eventsList.filter((e) => isBeforeToday(e.dt_evento));
      setEvents(pastEvents);
    } catch {
      error('Erro', 'Não foi possível carregar os eventos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // Filtered events for Cards view (somente eventos com data anterior a hoje)
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (!isBeforeToday(evt.dt_evento)) return false;
      const matchesSearch = search ? evt.nm_evento.toLowerCase().includes(search.toLowerCase()) : true;
      const matchesEvent = selectedEventId ? evt.cd_evento === selectedEventId : true;
      const evtDateStr = toInputDateFormat(evt.dt_evento);
      const matchesStart = startDate ? evtDateStr >= startDate : true;
      const matchesEnd = endDate ? evtDateStr <= endDate : true;
      return matchesSearch && matchesEvent && matchesStart && matchesEnd;
    });
  }, [events, search, selectedEventId, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Histórico de Participações
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Registro imutável e somente leitura de todas as corridas e duplas realizadas
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-5">
        <div className="space-y-4">
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
                  label: `${evt.nm_evento} — ${formatDate(evt.dt_evento)}`,
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
              label="Nome do Evento"
              placeholder="Digite o nome do evento"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content: Event Cards */}
      {isLoading ? (
        <Spinner text="Carregando dados históricos..." className="py-16" />
      ) : filteredEvents.length === 0 ? (
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
                  disabled={!evt.total_duplas || evt.total_duplas === 0}
                  onClick={() => handleOpenExport(evt.cd_evento, evt.nm_evento)}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  title={
                    !evt.total_duplas || evt.total_duplas === 0
                      ? 'Nenhuma dupla formada para este evento'
                      : undefined
                  }
                >
                  Gerar Relatório
                </Button>
              </div>
            </Card>
          ))}
        </div>
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
