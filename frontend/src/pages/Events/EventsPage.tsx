import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { PageHeader } from '../../components/common/PageHeader';
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
import {toInputDateFormat } from '../../utils/formatters';
import { mensagemDeErro } from '../../services/apiError';

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

  const todayDateStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
      const errMsg = mensagemDeErro(err, 'Não foi possível excluir o evento (pode possuir duplas formadas).');
      error('Falha na exclusão', errMsg);
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
      {/* Page Header */}
      <PageHeader
        title="Gestão de Eventos"
        description="Cadastre as corridas e gerencie a formação de duplas."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingEvent(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Evento
          </Button>
        }
      />

      {/* Search Filter matching Figma "Barra de pesquisa" (#D9D9D9 75%) */}
      <Card className="p-4">
        <Input
          placeholder="Buscar evento por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-[#525252]" />}
          className="bg-[#D9D9D9]/75 border-[#B9B9B9] placeholder-[#525252] text-black"
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
              className="flex flex-col justify-between hover:shadow-md transition-shadow border-[#A4A4A4]"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-[#15803D]/15 text-[#166534]">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingEvent(evt);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-[#525252] hover:text-[#166534] rounded-lg hover:bg-[#16A34A]/20 transition-colors cursor-pointer"
                      title="Editar evento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(evt.cd_evento);
                        setDeleteDialogOpen(true);
                      }}
                      className="p-1.5 text-[#525252] hover:text-[#F51414] rounded-lg hover:bg-[#F51414]/15 transition-colors cursor-pointer"
                      title="Excluir evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-black leading-snug">
                  {evt.nm_evento}
                </h3>
                <p className="text-xs font-semibold text-[#7C7C7C] mt-1">
                  📅 {formatDate(evt.dt_evento)}
                </p>

                <div className="mt-4 p-3 rounded-xl bg-[#EBEAEA]/70 border border-[#D9D9D9] flex items-center justify-between">
                  <span className="text-xs text-[#525252]">
                    Duplas Formadas
                  </span>
                  <Badge variant={evt.total_duplas ? 'success' : 'neutral'} size="sm">
                    {evt.total_duplas ?? 0} {evt.total_duplas === 1 ? 'dupla' : 'duplas'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[#D9D9D9]">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  disabled={toInputDateFormat(evt.dt_evento) < todayDateStr}
                  title={
                    toInputDateFormat(evt.dt_evento) < todayDateStr
                      ? 'Não é possível formar duplas para eventos que já ocorreram'
                      : 'Gerenciar Duplas'
                  }
                  onClick={() => navigate(`/duplas?evento=${evt.cd_evento}`)}
                  leftIcon={<Layers className="w-4 h-4" />}
                >
                  Formar duplas
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenExport(evt)}
                  title="Exportar Relatório"
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
