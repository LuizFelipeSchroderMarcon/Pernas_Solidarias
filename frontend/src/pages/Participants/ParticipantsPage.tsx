import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { PageHeader } from '../../components/common/PageHeader';
import { ParticipantModal } from './ParticipantModal';
import { participantService } from '../../services/participantService';
import type { Cadeirante, Condutor } from '../../types';
import { formatCPF, formatPhone } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import {
  Users,
  UserCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Armchair,
  RotateCcw,
} from 'lucide-react';
import { mensagemDeErro } from '../../services/apiError';

type StatusFilter = 'todos' | 'ativos' | 'inativos';
type CadeiraFilter = 'todos' | 'com_cadeira' | 'sem_cadeira';

export const ParticipantsPage: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: 'cadeirante' | 'condutor' =
    searchParams.get('tab') === 'condutor' ? 'condutor' : 'cadeirante';

  const handleTabChange = (tab: 'cadeirante' | 'condutor') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };
  const [cadeirantes, setCadeirantes] = useState<Cadeirante[]>([]);
  const [condutores, setCondutores] = useState<Condutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [cadeiraFilter, setCadeiraFilter] = useState<CadeiraFilter>('todos');

  const hasCadeiranteFilters = Boolean(
    searchTerm.trim() || statusFilter !== 'todos' || cadeiraFilter !== 'todos'
  );
  const hasCondutorFilters = Boolean(
    searchTerm.trim() || statusFilter !== 'todos'
  );

  const handleClearCadeiranteFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setCadeiraFilter('todos');
  };

  const handleClearCondutorFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
  };

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Cadeirante | Condutor | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [cads, conds] = await Promise.all([
        participantService.getCadeirantes(),
        participantService.getCondutores(),
      ]);
      setCadeirantes(cads);
      setCondutores(conds);
    } catch {
      error('Erro ao carregar', 'Não foi possível carregar a lista de participantes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered lists
  const filteredCadeirantes = useMemo(() => {
    return cadeirantes.filter((item) => {
      const matchSearch =
        item.nm_cadeirante.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.cpf && item.cpf.includes(searchTerm));
      const matchStatus =
        statusFilter === 'todos'
          ? true
          : statusFilter === 'ativos'
          ? item.ativo
          : statusFilter === 'inativos'
          ? !item.ativo
          : true;
      const matchCadeira =
        cadeiraFilter === 'todos'
          ? true
          : cadeiraFilter === 'com_cadeira'
          ? Boolean(item.possui_cadeira_propria)
          : cadeiraFilter === 'sem_cadeira'
          ? !item.possui_cadeira_propria
          : true;
      return matchSearch && matchStatus && matchCadeira;
    });
  }, [cadeirantes, searchTerm, statusFilter, cadeiraFilter]);

  const filteredCondutores = useMemo(() => {
    return condutores.filter((item) => {
      const matchSearch =
        item.nm_condutor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.cpf && item.cpf.includes(searchTerm));
      const matchStatus =
        statusFilter === 'todos'
          ? true
          : statusFilter === 'ativos'
            ? item.ativo
            : statusFilter === 'inativos'
            ? !item.ativo
            : true;
      return matchSearch && matchStatus;
    });
  }, [condutores, searchTerm, statusFilter]);

  // Handle status toggle
  const handleToggleStatus = async (item: Cadeirante | Condutor) => {
    try {
      if (activeTab === 'cadeirante') {
        const cad = item as Cadeirante;
        const updated = await participantService.toggleCadeiranteStatus(cad.cd_cadeirante);
        setCadeirantes((prev) =>
          prev.map((c) => (c.cd_cadeirante === cad.cd_cadeirante ? updated : c))
        );
        success(
          'Status atualizado!',
          `${updated.nm_cadeirante} agora está ${updated.ativo ? 'ativo' : 'inativo'}.`
        );
      } else {
        const cond = item as Condutor;
        const updated = await participantService.toggleCondutorStatus(cond.cd_condutor);
        setCondutores((prev) =>
          prev.map((c) => (c.cd_condutor === cond.cd_condutor ? updated : c))
        );
        success(
          'Status atualizado!',
          `${updated.nm_condutor} agora está ${updated.ativo ? 'ativo' : 'inativo'}.`
        );
      }
    } catch {
      error('Falha ao atualizar status', 'Não foi possível alterar o status do participante.');
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      if (activeTab === 'cadeirante') {
        await participantService.deleteCadeirante(deletingId);
        setCadeirantes((prev) => prev.filter((c) => c.cd_cadeirante !== deletingId));
        success('Removido', 'Cadeirante excluído com sucesso.');
      } else {
        await participantService.deleteCondutor(deletingId);
        setCondutores((prev) => prev.filter((c) => c.cd_condutor !== deletingId));
        success('Removido', 'Condutor excluído com sucesso.');
      }
      setDeleteDialogOpen(false);
    } catch (err: any) {
      const msg = mensagemDeErro(err, 'Não foi possível excluir o participante (possui histórico vinculado).');
      error('Erro ao excluir', msg);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const handleOpenCreate = () => {
    setEditingParticipant(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Cadeirante | Condutor) => {
    setEditingParticipant(item);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Gestão de Participantes"
        description="Cadastre, edite e gerencie o status de cadeirantes e condutores."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {activeTab === 'cadeirante' ? 'Novo Cadeirante' : 'Novo Condutor'}
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#B9B9B9] dark:border-slate-800 pb-px">
        <button
          onClick={() => handleTabChange('cadeirante')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'cadeirante'
              ? 'border-[#166534] text-[#166534] dark:text-[#4ADE80] dark:border-[#4ADE80] bg-[#15803D]/15 dark:bg-[#15803D]/30 rounded-t-xl'
              : 'border-transparent text-[#525252] dark:text-slate-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Cadeirantes ({cadeirantes.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('condutor')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'condutor'
              ? 'border-[#166534] text-[#166534] dark:text-[#4ADE80] dark:border-[#4ADE80] bg-[#15803D]/15 dark:bg-[#15803D]/30 rounded-t-xl'
              : 'border-transparent text-[#525252] dark:text-slate-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Condutores ({condutores.length})</span>
        </button>
      </div>

      {/* Filter and Search Bar matching Figma "Barra de pesquisa" (#D9D9D9 75%) */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <Input
              placeholder="Buscar por nome ou por CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400 dark:text-slate-400" />}
              className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 text-black dark:text-white"
            />
          </div>

          {activeTab === 'cadeirante' && (
            <div className="w-full md:w-56">
              <Select
                aria-label="Filtrar por cadeira própria"
                value={cadeiraFilter}
                onChange={(e) => setCadeiraFilter(e.target.value as CadeiraFilter)}
                options={[
                  { value: 'todos', label: 'Cadeira: Todas' },
                  { value: 'com_cadeira', label: 'Com Cadeira Própria' },
                  { value: 'sem_cadeira', label: 'Sem Cadeira Própria' },
                ]}
              />
            </div>
          )}

          <div className="w-full md:w-48">
            <Select
              aria-label="Filtrar por status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              options={[
                { value: 'todos', label: 'Todos os Status' },
                { value: 'ativos', label: 'Apenas Ativos' },
                { value: 'inativos', label: 'Apenas Inativos' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Main Table / Content */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <Spinner text="Carregando participantes..." className="py-12" />
        ) : activeTab === 'cadeirante' ? (
          filteredCadeirantes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-black dark:text-slate-100">
                <thead className="bg-slate-100/90 dark:bg-slate-800 text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">CPF</th>
                    <th className="px-6 py-4">Telefone</th>
                    <th className="px-6 py-4">Camiseta</th>
                    <th className="px-6 py-4">Cadeira Própria</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredCadeirantes.map((cad) => (
                    <tr
                      key={cad.cd_cadeirante}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-black dark:text-white">
                        {cad.nm_cadeirante}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-medium text-black dark:text-white">
                        {formatCPF(cad.cpf) || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`tel:${cad.telefone}`}
                          className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-black dark:text-white hover:text-[#166534] dark:hover:text-[#4ADE80] hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#166534] dark:text-[#4ADE80]" />
                          <span>{formatPhone(cad.telefone)}</span>
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="neutral" size="sm">
                          {cad.tam_camisa}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {cad.possui_cadeira_propria ? (
                          <Badge variant="success" size="sm" className="gap-1">
                            <Armchair className="w-3 h-3" /> Sim
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Não
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <ToggleSwitch
                          checked={cad.ativo}
                          onChange={() => handleToggleStatus(cad)}
                          label={cad.ativo ? 'Ativo' : 'Inativo'}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(cad)}
                            className="p-1.5 text-[#525252] dark:text-slate-400 hover:text-[#166534] dark:hover:text-[#4ADE80] rounded-lg hover:bg-[#16A34A]/20 dark:hover:bg-[#16A34A]/30 transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(cad.cd_cadeirante)}
                            className="p-1.5 text-[#525252] dark:text-slate-400 hover:text-[#F51414] dark:hover:text-red-400 rounded-lg hover:bg-[#F51414]/15 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title={hasCadeiranteFilters ? 'Nenhum cadeirante encontrado' : 'Nenhum cadeirante cadastrado'}
              description={
                hasCadeiranteFilters
                  ? 'Nenhum resultado corresponde aos filtros aplicados.'
                  : 'Nenhum cadeirante cadastrado no sistema.'
              }
              action={
                hasCadeiranteFilters ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleClearCadeiranteFilters}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                  >
                    Limpar Filtros
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenCreate}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Cadastrar Cadeirante
                  </Button>
                )
              }
            />
          )
        ) : filteredCondutores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-black dark:text-slate-100">
              <thead className="bg-slate-100/90 dark:bg-slate-800 text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">CPF</th>
                  <th className="px-6 py-4">Telefone</th>
                  <th className="px-6 py-4">Camiseta</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredCondutores.map((cond) => (
                  <tr
                    key={cond.cd_condutor}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-black dark:text-white">
                      {cond.nm_condutor}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-medium text-black dark:text-white">
                      {formatCPF(cond.cpf) || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`tel:${cond.telefone}`}
                        className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-black dark:text-white hover:text-[#166534] dark:hover:text-[#4ADE80] hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#166534] dark:text-[#4ADE80]" />
                        <span>{formatPhone(cond.telefone)}</span>
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral" size="sm">
                        {cond.tam_camisa}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <ToggleSwitch
                        checked={cond.ativo}
                        onChange={() => handleToggleStatus(cond)}
                        label={cond.ativo ? 'Ativo' : 'Inativo'}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(cond)}
                          className="p-1.5 text-[#525252] dark:text-slate-400 hover:text-[#166534] dark:hover:text-[#4ADE80] rounded-lg hover:bg-[#16A34A]/20 dark:hover:bg-[#16A34A]/30 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(cond.cd_condutor)}
                          className="p-1.5 text-[#525252] dark:text-slate-400 hover:text-[#F51414] dark:hover:text-red-400 rounded-lg hover:bg-[#F51414]/15 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<UserCheck className="w-8 h-8" />}
            title={hasCondutorFilters ? 'Nenhum condutor encontrado' : 'Nenhum condutor cadastrado'}
            description={
              hasCondutorFilters
                ? 'Nenhum resultado corresponde aos filtros aplicados.'
                : 'Nenhum condutor cadastrado no sistema.'
            }
            action={
              hasCondutorFilters ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClearCondutorFilters}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Limpar Filtros
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenCreate}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Cadastrar Condutor
                </Button>
              )
            }
          />
        )}
      </Card>

      {/* Participant Modal */}
      <ParticipantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={activeTab}
        participant={editingParticipant}
        onSuccess={loadData}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este participante? Se houver participações em duplas vinculadas a ele, a exclusão será bloqueada para preservar o histórico."
        confirmText="Excluir"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
