import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
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
} from 'lucide-react';

export const ParticipantsPage: React.FC = () => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'cadeirante' | 'condutor'>('cadeirante');
  const [cadeirantes, setCadeirantes] = useState<Cadeirante[]>([]);
  const [condutores, setCondutores] = useState<Condutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');

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
          : !item.ativo;
      return matchSearch && matchStatus;
    });
  }, [cadeirantes, searchTerm, statusFilter]);

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
          : !item.ativo;
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
      const msg =
        err.response?.data?.error ||
        'Não foi possível excluir o participante (possui histórico vinculado).';
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
      {/* Header with Title and Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestão de Participantes
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cadastre, edite e gerencie o status de cadeirantes e condutores
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm shadow-blue-500/20"
        >
          {activeTab === 'cadeirante' ? 'Novo Cadeirante' : 'Novo Condutor'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('cadeirante')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'cadeirante'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Cadeirantes ({cadeirantes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('condutor')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'condutor'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Condutores ({condutores.length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
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
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCadeirantes.map((cad) => (
                    <tr
                      key={cad.cd_cadeirante}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {cad.nm_cadeirante}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {formatCPF(cad.cpf) || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`tel:${cad.telefone}`}
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
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
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(cad.cd_cadeirante)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
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
              title="Nenhum cadeirante encontrado"
              description={
                searchTerm || statusFilter !== 'todos'
                  ? 'Nenhum resultado corresponde aos filtros aplicados.'
                  : 'Nenhum cadeirante cadastrado no sistema.'
              }
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenCreate}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Cadastrar Cadeirante
                </Button>
              }
            />
          )
        ) : filteredCondutores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">CPF</th>
                  <th className="px-6 py-4">Telefone</th>
                  <th className="px-6 py-4">Camiseta</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCondutores.map((cond) => (
                  <tr
                    key={cond.cd_condutor}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {cond.nm_condutor}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {formatCPF(cond.cpf) || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`tel:${cond.telefone}`}
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
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
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(cond.cd_condutor)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
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
            title="Nenhum condutor encontrado"
            description={
              searchTerm || statusFilter !== 'todos'
                ? 'Nenhum resultado corresponde aos filtros aplicados.'
                : 'Nenhum condutor cadastrado no sistema.'
            }
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreate}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Cadastrar Condutor
              </Button>
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
