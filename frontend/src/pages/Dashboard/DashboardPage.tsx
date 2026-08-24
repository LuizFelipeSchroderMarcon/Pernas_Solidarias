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
import { formatDate } from '../../utils/formatters';
import {
  Users,
  UserCheck,
  Calendar,
  Layers,
  PlusCircle,
  Download,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

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

  // Next upcoming event
  const upcomingEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.dt_evento).getTime();
    const dateB = new Date(b.dt_evento).getTime();
    return dateA - dateB;
  });
  const nextEvent = upcomingEvents[0];

  // Shirt size distribution for active participants
  const shirtDistribution = ['P', 'M', 'G', 'GG', 'XG'].map((size) => {
    const cCount = cadeirantes.filter((c) => c.ativo && c.tam_camisa === size).length;
    const rCount = condutores.filter((c) => c.ativo && c.tam_camisa === size).length;
    return {
      tamanho: size,
      Cadeirantes: cCount,
      Condutores: rCount,
      Total: cCount + rCount,
    };
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
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 sm:p-8 text-white shadow-xl shadow-blue-600/15">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Sistema de Gestão de Corridas
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Painel do Coordenador
          </h2>
          <p className="text-sm text-blue-100 mt-2 leading-relaxed">
            Bem-vindo ao Pernas Solidárias! Automatize a formação de duplas priorizando o histórico de
            participações e exporte relatórios oficiais para as corridas.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/duplas')}
              leftIcon={<Layers className="w-4 h-4 text-blue-600" />}
              className="bg-white text-blue-900 hover:bg-blue-50 font-semibold"
            >
              Formar Duplas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/participantes')}
              className="text-white border-white/40 hover:bg-white/10"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Cadastrar Participante
            </Button>
          </div>
        </div>

        {/* Decorative circle shapes */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-10 w-48 h-48 bg-indigo-400/20 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Cadeirantes Ativos"
          value={activeCadeirantes}
          subtitle={`Total de ${cadeirantes.length} cadastrados`}
          icon={<Users className="w-6 h-6" />}
          variant="blue"
          onClick={() => navigate('/participantes')}
        />
        <StatCard
          title="Condutores Ativos"
          value={activeCondutores}
          subtitle={`Total de ${condutores.length} cadastrados`}
          icon={<UserCheck className="w-6 h-6" />}
          variant="indigo"
          onClick={() => navigate('/participantes')}
        />
        <StatCard
          title="Eventos Cadastrados"
          value={events.length}
          subtitle="Corridas no sistema"
          icon={<Calendar className="w-6 h-6" />}
          variant="purple"
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

      {/* Main Dashboard Content: Next Event + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Next Event / Actions (1 Col) */}
        <div className="space-y-6">
          <Card className="flex flex-col h-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Próximo Evento
                </h3>
              </div>
              <Badge variant="primary" size="sm">
                Destaque
              </Badge>
            </div>

            {nextEvent ? (
              <div className="flex-1 flex flex-col justify-between pt-5 space-y-4">
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                    {nextEvent.nm_evento}
                  </h4>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                    📅 {formatDate(nextEvent.dt_evento)}
                  </p>
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Duplas formadas:
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {nextEvent.total_duplas ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/duplas?evento=${nextEvent.cd_evento}`)}
                    leftIcon={<Layers className="w-4 h-4" />}
                  >
                    Gerenciar Duplas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleOpenExport(nextEvent)}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Exportar Relatório (RF10)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <Calendar className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Nenhum evento futuro
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/eventos')}
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                >
                  Criar Primeiro Evento
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Chart: Shirt Distribution & Analytics (2 Cols) */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Distribuição de Tamanhos de Camiseta (Ativos)
                </h3>
              </div>
              <Badge variant="neutral" size="sm">
                Total: {activeCadeirantes + activeCondutores}
              </Badge>
            </div>

            <div className="flex-1 pt-6 min-h-[260px] w-full">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={shirtDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="tamanho" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  />
                  <Bar dataKey="Cadeirantes" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Condutores" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-600 dark:text-slate-400 font-medium">Cadeirantes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-slate-600 dark:text-slate-400 font-medium">Condutores</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Events List Card */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Eventos Recentes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
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

        <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
          {events.slice(0, 5).map((evt) => (
            <div
              key={evt.cd_evento}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 px-2 rounded-xl transition-colors"
            >
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {evt.nm_evento}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Data: {formatDate(evt.dt_evento)}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenExport(evt)}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Exportar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/duplas?evento=${evt.cd_evento}`)}
                  leftIcon={<Layers className="w-3.5 h-3.5" />}
                >
                  Duplas
                </Button>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-6">
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
