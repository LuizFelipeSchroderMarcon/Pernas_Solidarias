import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { analyticsService } from '../../services/analyticsService';
import type { AnalyticsRankings } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import { useTheme } from '../../hooks/useTheme';
import {
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
  const { isDark } = useTheme();
  const [data, setData] = useState<AnalyticsRankings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRankings = async () => {
      try {
        setIsLoading(true);
        const result = await analyticsService.getRankings(7);
        setData(result);
      } catch {
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

  const runnerColors = ['#166534', '#15803D', '#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0'];
  const wheelchairColors = ['#166534', '#15803D', '#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0'];
  const eventColors = ['#166534', '#15803D', '#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0'];
  const gridStroke = isDark ? '#334155' : '#D9D9D9';
  const tickColor = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Gráficos e Indicadores"
        description="Acompanhe o engajamento e a participação histórica de cadeirantes, condutores e eventos na ONG Pernas Solidárias."
      />

      {/* Grid: 2 Rankings (Condutores e Cadeirantes) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col border-[#B9B9B9] dark:border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-[#D9D9D9] dark:border-slate-800">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#166534] dark:text-[#4ADE80]" />
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">
                  Corredores que mais participaram
                </h3>
                <p className="text-xs text-[#7C7C7C] dark:text-slate-400">
                  Condutores com maior número de duplas em corridas
                </p>
              </div>
            </div>
            <Badge variant="primary" size="sm">
              <Trophy className="w-3 h-3 mr-1 text-[#166534] dark:text-[#4ADE80]" /> Top {runners.length}
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
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: tickColor, fontSize: 12, fontWeight: 500 }} />
                    <YAxis
                      dataKey="nome"
                      type="category"
                      width={120}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: tickColor, fontWeight: 500 }}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val} corrida(s)`, 'Participações']}
                      contentStyle={{
                        backgroundColor: isDark ? '#0f172a' : '#FFFFFF',
                        borderRadius: '12px',
                        color: isDark ? '#f8fafc' : '#000000',
                        border: isDark ? '1px solid #334155' : '1px solid #B9B9B9',
                        fontSize: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15)',
                      }}
                      labelStyle={{ color: isDark ? '#f8fafc' : '#000000', fontWeight: 700, marginBottom: '4px' }}
                      itemStyle={{ color: isDark ? '#f8fafc' : '#000000' }}
                    />
                    <Bar dataKey="total_corridas" radius={[0, 6, 6, 0]}>
                      {runners.map((_, index) => (
                        <Cell key={`cell-runner-${index}`} fill={runnerColors[index % runnerColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="divide-y divide-[#D9D9D9] dark:divide-slate-800 pt-2 text-xs">
                {runners.slice(0, 3).map((r, i) => (
                  <div key={r.id} className="py-2 flex items-center justify-between">
                    <span className="font-semibold text-black dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#15803D] text-white flex items-center justify-center font-bold text-[11px]">
                        {i + 1}º
                      </span>
                      {r.nome}
                    </span>
                    <span className="font-bold text-[#166534] dark:text-[#4ADE80]">
                      {r.total_corridas} participação(ões)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="flex flex-col border-[#B9B9B9] dark:border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-[#D9D9D9] dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#166534] dark:text-[#4ADE80]" />
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">
                  Cadeirantes que mais participaram
                </h3>
                <p className="text-xs text-[#7C7C7C] dark:text-slate-400">
                  Cadeirantes com maior número de duplas em corridas
                </p>
              </div>
            </div>
            <Badge variant="primary" size="sm">
              <Award className="w-3 h-3 mr-1 text-[#166534] dark:text-[#4ADE80]" /> Top {wheelchairUsers.length}
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
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: tickColor, fontSize: 12, fontWeight: 500 }} />
                    <YAxis
                      dataKey="nome"
                      type="category"
                      width={120}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: tickColor, fontWeight: 500 }}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val} corrida(s)`, 'Participações']}
                      contentStyle={{
                        backgroundColor: isDark ? '#0f172a' : '#FFFFFF',
                        borderRadius: '12px',
                        color: isDark ? '#f8fafc' : '#000000',
                        border: isDark ? '1px solid #334155' : '1px solid #B9B9B9',
                        fontSize: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15)',
                      }}
                      labelStyle={{ color: isDark ? '#f8fafc' : '#000000', fontWeight: 700, marginBottom: '4px' }}
                      itemStyle={{ color: isDark ? '#f8fafc' : '#000000' }}
                    />
                    <Bar dataKey="total_corridas" radius={[0, 6, 6, 0]}>
                      {wheelchairUsers.map((_, index) => (
                        <Cell key={`cell-wheelchair-${index}`} fill={wheelchairColors[index % wheelchairColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="divide-y divide-[#D9D9D9] dark:divide-slate-800 pt-2 text-xs">
                {wheelchairUsers.slice(0, 3).map((c, i) => (
                  <div key={c.id} className="py-2 flex items-center justify-between">
                    <span className="font-semibold text-black dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#15803D] text-white flex items-center justify-center font-bold text-[11px]">
                        {i + 1}º
                      </span>
                      {c.nome}
                    </span>
                    <span className="font-bold text-[#166534] dark:text-[#4ADE80]">
                      {c.total_corridas} participação(ões)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card className="border-[#B9B9B9] dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-[#D9D9D9] dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#166534] dark:text-[#4ADE80]" />
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">
                Eventos com mais inscrições
              </h3>
              <p className="text-xs text-[#7C7C7C] dark:text-slate-400">
                Corridas que reuniram o maior volume de duplas formadas
              </p>
            </div>
          </div>
          <Badge variant="primary" size="sm">
            <TrendingUp className="w-3 h-3 mr-1 text-[#166534] dark:text-[#4ADE80]" /> Top {events.length} Corridas
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis
                    dataKey="nome"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: tickColor, fontWeight: 500 }}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: tickColor, fontSize: 12, fontWeight: 500 }} />
                  <Tooltip
                    formatter={(val: any) => [`${val} duplas`, 'Total de Duplas']}
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#FFFFFF',
                      borderRadius: '12px',
                      color: isDark ? '#f8fafc' : '#000000',
                      border: isDark ? '1px solid #334155' : '1px solid #B9B9B9',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15)',
                    }}
                    labelStyle={{ color: isDark ? '#f8fafc' : '#000000', fontWeight: 700, marginBottom: '4px' }}
                    itemStyle={{ color: isDark ? '#f8fafc' : '#000000' }}
                  />
                  <Bar dataKey="total_duplas" radius={[6, 6, 0, 0]}>
                    {events.map((_, index) => (
                      <Cell key={`cell-event-${index}`} fill={eventColors[index % eventColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {events.slice(0, 3).map((evt, idx) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#166534] dark:text-[#4ADE80]">
                      {idx + 1}º Lugar em Inscrições
                    </span>
                    <h4 className="font-bold text-sm text-black dark:text-white mt-1 line-clamp-1">
                      {evt.nome}
                    </h4>
                    <p className="text-xs text-[#7C7C7C] dark:text-slate-400 mt-0.5">
                      Data: {formatDate(evt.data)}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-[#525252] dark:text-slate-400">Total emparelhado:</span>
                    <span className="font-extrabold text-[#166534] dark:text-[#4ADE80]">
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
