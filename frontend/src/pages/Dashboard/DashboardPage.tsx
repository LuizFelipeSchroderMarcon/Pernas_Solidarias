import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { ExportModal } from '../../components/export/ExportModal';
import { participantService } from '../../services/participantService';
import { eventService } from '../../services/eventService';
import { pairService } from '../../services/pairService';
import type { Cadeirante, Condutor, Evento } from '../../types';
import { formatDate, toInputDateFormat } from '../../utils/formatters';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Users,
  UserCheck,
  Calendar,
  Layers,
  PlusCircle,
  Download,
  ArrowRight,
  Award,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [cadeirantes, setCadeirantes] = useState<Cadeirante[]>([]);
  const [condutores, setCondutores] = useState<Condutor[]>([]);
  const [events, setEvents] = useState<Evento[]>([]);
  const [totalPairs, setTotalPairs] = useState<number>(0);

  // Export Modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportEvent, setSelectedExportEvent] = useState<{ id: number; name: string } | null>(
    null
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [cads, conds, evts, history] = await Promise.all([
          participantService.getCadeirantes(),
          participantService.getCondutores(),
          eventService.getEvents(),
          pairService.getHistory(),
        ]);

        setCadeirantes(cads);
        setCondutores(conds);
        setEvents(evts);
        setTotalPairs(history.length);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const activeCadeirantes = cadeirantes.filter((c) => c.ativo).length;
  const activeCondutores = condutores.filter((c) => c.ativo).length;

  // Próximos eventos (data >= hoje no horário local)
  const todayDateStr = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  const upcomingEvents = events
    .filter((e) => {
      const eventDateStr = toInputDateFormat(e.dt_evento);
      return eventDateStr >= todayDateStr;
    })
    .sort((a, b) => {
      const dateA = toInputDateFormat(a.dt_evento);
      const dateB = toInputDateFormat(b.dt_evento);
      return dateA.localeCompare(dateB);
    });

  const handleOpenExport = (event: Evento) => {
    setSelectedExportEvent({ id: event.cd_evento, name: event.nm_evento });
    setExportModalOpen(true);
  };

  if (isLoading) {
    return <Spinner size="lg" text="Carregando dados do painel..." className="min-h-[60vh]" />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Painel do Coordenador"
        description="Bem-vindo ao Pernas Solidárias! Automatize a formação de duplas priorizando o histórico de participações e exporte relatórios oficiais para as corridas."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/participantes')}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Cadastrar Participante
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/duplas')}
              leftIcon={<Layers className="w-4 h-4" />}
            >
              Formar Duplas
            </Button>
          </div>
        }
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Cadeirantes Ativos"
          value={activeCadeirantes}
          subtitle={`Total de ${cadeirantes.length} cadastrados`}
          icon={<Users className="w-6 h-6" />}
          variant="blue"
          onClick={() => navigate('/participantes?tab=cadeirante')}
        />
        <StatCard
          title="Condutores Ativos"
          value={activeCondutores}
          subtitle={`Total de ${condutores.length} cadastrados`}
          icon={<UserCheck className="w-6 h-6" />}
          variant="indigo"
          onClick={() => navigate('/participantes?tab=condutor')}
        />
        <StatCard
          title="Eventos Cadastrados"
          value={events.length}
          subtitle="Corridas no sistema"
          icon={<Calendar className="w-6 h-6" />}
          variant="indigo"
          onClick={() => navigate('/eventos')}
        />
        <StatCard
          title="Duplas Formadas"
          value={totalPairs}
          subtitle="Histórico total de duplas"
          icon={<Award className="w-6 h-6" />}
          variant="emerald"
          onClick={() => navigate('/historico')}
        />
      </div>

      {/* Próximos Eventos */}
      <Card className="flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D9D9D9] dark:border-slate-800 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#15803D]/15 dark:bg-[#15803D]/30 text-[#166534] dark:text-[#4ADE80]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">
                Próximos Eventos
              </h3>
              <p className="text-xs text-[#7C7C7C] dark:text-slate-400">
                Corridas agendadas a partir de hoje
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {upcomingEvents.length > 0 && (
              <Badge variant="primary" size="sm">
                {upcomingEvents.length === 1 ? '1 evento agendado' : `${upcomingEvents.length} eventos agendados`}
              </Badge>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/eventos')}
              leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            >
              Novo Evento
            </Button>
          </div>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-5">
            {upcomingEvents.map((evt, index) => (
              <div
                key={evt.cd_evento}
                className="relative flex flex-col justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 shadow-xs hover:shadow-md hover:border-[#166534] dark:hover:border-[#22C55E] transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C7C7C] dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-black dark:text-slate-300" />
                      {formatDate(evt.dt_evento)}
                    </span>
                    {index === 0 && (
                      <Badge variant="primary" size="sm">
                        Mais Próximo
                      </Badge>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-black dark:text-white leading-snug">
                    {evt.nm_evento}
                  </h4>
                  <div className="mt-3.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-[#525252] dark:text-slate-400">
                      Duplas formadas:
                    </span>
                    <span className="text-sm font-bold text-black dark:text-white">
                      {evt.total_duplas ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/duplas?evento=${evt.cd_evento}`)}
                    leftIcon={<Layers className="w-4 h-4" />}
                  >
                    Formar duplas
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={(evt.total_duplas ?? 0) === 0}
                    title={
                      (evt.total_duplas ?? 0) === 0
                        ? 'Não é possível exportar relatório de evento sem duplas formadas'
                        : 'Exportar Relatório'
                    }
                    onClick={() => handleOpenExport(evt)}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Exportar Relatório
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-[#D9D9D9] dark:bg-slate-800 flex items-center justify-center text-[#525252] dark:text-slate-300 mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-black dark:text-white">
              Nenhum evento futuro agendado
            </h4>
            <p className="text-xs text-[#7C7C7C] dark:text-slate-400 max-w-sm mt-1">
              Todas as corridas cadastradas já ocorreram ou ainda não há eventos agendados para hoje ou datas futuras.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => navigate('/eventos')}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Criar Novo Evento
            </Button>
          </div>
        )}
      </Card>

      {/* Recent Events List Card */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-[#D9D9D9] dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-black dark:text-white">
              Eventos Recentes
            </h3>
            <p className="text-xs text-[#7C7C7C] dark:text-slate-400">
              Últimas corridas registradas no sistema
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/eventos')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Ver todos
          </Button>
        </div>

        <div className="divide-y divide-[#D9D9D9] dark:divide-slate-800 mt-2">
          {events.slice(0, 5).map((evt) => (
            <div
              key={evt.cd_evento}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors"
            >
              <div>
                <h4 className="text-sm font-semibold text-black dark:text-white">
                  {evt.nm_evento}
                </h4>
                <p className="text-xs text-[#7C7C7C] dark:text-slate-400 mt-0.5">
                  Data: {formatDate(evt.dt_evento)}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={(evt.total_duplas ?? 0) === 0}
                  title={
                    (evt.total_duplas ?? 0) === 0
                      ? 'Não é possível exportar relatório de evento sem duplas formadas'
                      : 'Exportar'
                  }
                  onClick={() => handleOpenExport(evt)}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Exportar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={toInputDateFormat(evt.dt_evento) < todayDateStr}
                  title={
                    toInputDateFormat(evt.dt_evento) < todayDateStr
                      ? 'Não é possível formar duplas para eventos que já ocorreram'
                      : 'Gerenciar Duplas'
                  }
                  onClick={() => navigate(`/duplas?evento=${evt.cd_evento}`)}
                  leftIcon={<Layers className="w-3.5 h-3.5" />}
                >
                  Duplas
                </Button>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <p className="text-xs text-[#7C7C7C] dark:text-slate-400 text-center py-6">
              Nenhum evento registrado até o momento.
            </p>
          )}
        </div>
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
