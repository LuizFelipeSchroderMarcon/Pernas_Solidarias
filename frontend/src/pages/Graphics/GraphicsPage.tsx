import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { analyticsService } from '../../services/analyticsService';
import type { AnalyticsRankings } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import {
  BarChart3,
  Award,
  UserCheck,
  Users,
  Calendar,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

export const GraphicsPage: React.FC = () => {
  const { error } = useToast();
  const [data, setData] = useState<AnalyticsRankings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRankings = async () => {
      try {
        setIsLoading(true);
        const result = await analyticsService.getRankings(7);
        setData(result);
      } catch (err) {
        error('Erro ao carregar gráficos', 'Não foi possível buscar as estatísticas.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRankings();
  }, []);

  if (isLoading) {
    return <Spinner size="lg" text="Carregando estatísticas da ONG..." className="min-h-[60vh]" />;
  }

  const runners = data?.top_runners || [];
  const wheelchairUsers = data?.top_wheelchair_users || [];
  const events = data?.top_events || [];

  const runnerColors = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#eef2ff'];
  const wheelchairColors = ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', '#f0f9ff'];
  const eventColors = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5'];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/15">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white mb-3">
            <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
            Estatísticas Oficiais da ONG
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Gráficos e Indicadores
          </h2>
          <p className="text-sm text-blue-100 mt-2 leading-relaxed">
            Acompanhe o engajamento e a participação histórica de cadeirantes, condutores e eventos na ONG Pernas Solidárias.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Grid: 2 Rankings (Condutores e Cadeirantes) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Corredores que mais participaram */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Corredores que Mais Participaram
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Condutores com maior número de duplas em corridas
                </p>
              </div>
            </div>
            <Badge variant="neutral" size="sm">
              <Trophy className="w-3 h-3 mr-1 text-amber-500" /> Top {runners.length}
            </Badge>
          </div>

          {runners.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<UserCheck className="w-8 h-8" />}
                title="Sem participações registradas"
                description="Assim que as duplas forem formadas e eventos realizados, o ranking aparecerá aqui."
              />
            </div>
          ) : (
            <div className="pt-6 space-y-6 flex-1 flex flex-col justify-between">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={runners}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="nome"
                      type="category"
                      width={120}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val} corrida(s)`, 'Participações']}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="total_corridas" radius={[0, 6, 6, 0]}>
                      {runners.map((_, index) => (
                        <Cell key={`cell-runner-${index}`} fill={runnerColors[index % runnerColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Lista dos líderes */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2 text-xs">
                {runners.slice(0, 3).map((r, i) => (
                  <div key={r.id} className="py-2 flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[11px]">
                        {i + 1}º
                      </span>
                      {r.nome}
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {r.total_corridas} participação(ões)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Gráfico 2: Cadeirantes que mais participaram */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Cadeirantes que Mais Participaram
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cadeirantes com maior número de duplas em corridas
                </p>
              </div>
            </div>
            <Badge variant="neutral" size="sm">
              <Award className="w-3 h-3 mr-1 text-blue-500" /> Top {wheelchairUsers.length}
            </Badge>
          </div>

          {wheelchairUsers.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<Users className="w-8 h-8" />}
                title="Sem participações registradas"
                description="Assim que as duplas forem formadas e eventos realizados, o ranking aparecerá aqui."
              />
            </div>
          ) : (
            <div className="pt-6 space-y-6 flex-1 flex flex-col justify-between">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={wheelchairUsers}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="nome"
                      type="category"
                      width={120}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val} corrida(s)`, 'Participações']}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="total_corridas" radius={[0, 6, 6, 0]}>
                      {wheelchairUsers.map((_, index) => (
                        <Cell key={`cell-wheelchair-${index}`} fill={wheelchairColors[index % wheelchairColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Lista dos líderes */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2 text-xs">
                {wheelchairUsers.slice(0, 3).map((c, i) => (
                  <div key={c.id} className="py-2 flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px]">
                        {i + 1}º
                      </span>
                      {c.nome}
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {c.total_corridas} participação(ões)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Gráfico 3: Eventos com mais inscrições */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Eventos com Mais Inscrições
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Corridas que reuniram o maior volume de duplas formadas
              </p>
            </div>
          </div>
          <Badge variant="neutral" size="sm">
            <TrendingUp className="w-3 h-3 mr-1 text-emerald-500" /> Top {events.length} Corridas
          </Badge>
        </div>

        {events.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<Calendar className="w-8 h-8" />}
              title="Nenhum evento com duplas formadas"
              description="Quando você formar duplas para eventos, eles serão ranqueados aqui por adesão."
            />
          </div>
        ) : (
          <div className="pt-6 space-y-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={events} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="nome"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`${val} duplas`, 'Total de Duplas']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="total_duplas" radius={[6, 6, 0, 0]}>
                    {events.map((_, index) => (
                      <Cell key={`cell-event-${index}`} fill={eventColors[index % eventColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Grid de destaques dos eventos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {events.slice(0, 3).map((evt, idx) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {idx + 1}º Lugar em Inscrições
                    </span>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">
                      {evt.nome}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Data: {formatDate(evt.data)}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Total emparelhado:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {evt.total_duplas} duplas ({evt.total_duplas * 2} atletas)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
