import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { ExportModal } from '../../components/export/ExportModal';
import { EventModal } from './EventModal';
import { eventService } from '../../services/eventService';
import type { Evento } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import {
  Calendar,
  Search,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Download,
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [events, setEvents] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportEvent, setSelectedExportEvent] = useState<{ id: number; name: string } | null>(
    null
  );

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await eventService.getEvents();
      setEvents(data);
    } catch {
      error('Erro', 'Não foi possível carregar os eventos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) =>
      evt.nm_evento.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await eventService.deleteEvent(deletingId);
      setEvents((prev) => prev.filter((e) => e.cd_evento !== deletingId));
      success('Evento excluído', 'O evento foi removido com sucesso.');
      setDeleteDialogOpen(false);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        'Não foi possível excluir o evento (pode possuir duplas formadas).';
      error('Falha na exclusão', msg);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const handleOpenExport = (evt: Evento) => {
    setSelectedExportEvent({ id: evt.cd_evento, name: evt.nm_evento });
    setExportModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestão de Eventos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cadastre as corridas e gerencie a formação de duplas (RF02, RF03, RF10)
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setEditingEvent(null);
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm shadow-blue-500/20"
        >
          Novo Evento
        </Button>
      </div>

      {/* Search Filter */}
      <Card className="p-4">
        <Input
          placeholder="Buscar evento por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </Card>

      {/* Events List / Cards */}
      {isLoading ? (
        <Spinner text="Carregando eventos..." className="py-12" />
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <Card
              key={evt.cd_evento}
              className="flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingEvent(evt);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                      title="Editar evento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(evt.cd_evento);
                        setDeleteDialogOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Excluir evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {evt.nm_evento}
                </h3>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                  📅 {formatDate(evt.dt_evento)}
                </p>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Duplas Formadas
                  </span>
                  <Badge variant={evt.total_duplas ? 'success' : 'neutral'} size="sm">
                    {evt.total_duplas ?? 0} {evt.total_duplas === 1 ? 'dupla' : 'duplas'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/duplas?evento=${evt.cd_evento}`)}
                  leftIcon={<Layers className="w-4 h-4" />}
                >
                  Gerenciar Duplas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenExport(evt)}
                  title="Exportar Relatório (RF10)"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Exportar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <EmptyState
            icon={<Calendar className="w-8 h-8" />}
            title="Nenhum evento encontrado"
            description={
              searchTerm
                ? 'Nenhum evento corresponde à busca realizada.'
                : 'Nenhum evento de corrida cadastrado.'
            }
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingEvent(null);
                  setIsModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Criar Primeiro Evento
              </Button>
            }
          />
        </Card>
      )}

      {/* Event Create/Edit Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={editingEvent}
        onSuccess={loadEvents}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este evento? Todos os registros vinculados a ele serão impactados."
        confirmText="Excluir"
        variant="danger"
        isLoading={isDeleting}
      />

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
