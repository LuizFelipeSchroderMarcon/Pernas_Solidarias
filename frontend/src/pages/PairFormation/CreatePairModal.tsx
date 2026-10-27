import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import type { Cadeirante, Condutor, DuplaDetalhada } from '../../types';
import { useToast } from '../../hooks/useToast';
import { UserPlus, CheckCircle2 } from 'lucide-react';

export interface CreatePairModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPairs: DuplaDetalhada[];
  cadeirantes: Cadeirante[];
  condutores: Condutor[];
  onAddPair: (cadeirante: Cadeirante, condutor: Condutor) => Promise<void> | void;
}

export const CreatePairModal: React.FC<CreatePairModalProps> = ({
  isOpen,
  onClose,
  existingPairs,
  cadeirantes,
  condutores,
  onAddPair,
}) => {
  const { error } = useToast();

  const [selectedCadeiranteId, setSelectedCadeiranteId] = useState<number | ''>('');
  const [selectedCondutorId, setSelectedCondutorId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedCadeiranteId('');
      setSelectedCondutorId('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const safeExistingPairs = Array.isArray(existingPairs) ? existingPairs : [];
  const allocatedCadIds = new Set(safeExistingPairs.map((p) => p.cd_cadeirante));
  const allocatedCondIds = new Set(safeExistingPairs.map((p) => p.cd_condutor));

  const safeCadeirantes = Array.isArray(cadeirantes) ? cadeirantes : [];
  const safeCondutores = Array.isArray(condutores) ? condutores : [];

  const activeCadeirantes = safeCadeirantes.filter((c) => c.ativo);
  const activeCondutores = safeCondutores.filter((c) => c.ativo);

  const availableCadeirantesCount = activeCadeirantes.filter(
    (c) => !allocatedCadIds.has(c.cd_cadeirante)
  ).length;

  const availableCondutoresCount = activeCondutores.filter(
    (c) => !allocatedCondIds.has(c.cd_condutor)
  ).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCadeiranteId || !selectedCondutorId) {
      error('Validação', 'Por favor, selecione um cadeirante e um condutor para formar a dupla.');
      return;
    }

    if (allocatedCadIds.has(Number(selectedCadeiranteId))) {
      error('Participante Já Alocado', 'O cadeirante selecionado já faz parte de outra dupla neste evento.');
      return;
    }

    if (allocatedCondIds.has(Number(selectedCondutorId))) {
      error('Participante Já Alocado', 'O condutor selecionado já faz parte de outra dupla neste evento.');
      return;
    }

    const cad = activeCadeirantes.find((c) => c.cd_cadeirante === Number(selectedCadeiranteId));
    const cond = activeCondutores.find((c) => c.cd_condutor === Number(selectedCondutorId));

    if (!cad || !cond) {
      error('Erro', 'Participante não encontrado.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddPair(cad, cond);
      onClose();
    } catch {
      // Error handling is managed by onAddPair / toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCad = activeCadeirantes.find((c) => c.cd_cadeirante === Number(selectedCadeiranteId));
  const selectedCond = activeCondutores.find((c) => c.cd_condutor === Number(selectedCondutorId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Dupla"
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} type="button" disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Salvar Dupla
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>Disponíveis para parear:</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {availableCadeirantesCount} cadeirantes • {availableCondutoresCount} condutores
          </span>
        </div>

        <Select
          label="Cadeirante da Dupla"
          value={selectedCadeiranteId}
          onChange={(e) => setSelectedCadeiranteId(e.target.value ? Number(e.target.value) : '')}
          required
          options={[
            { value: '', label: 'Selecione um cadeirante...' },
            ...activeCadeirantes.map((c) => {
              const isAllocated = allocatedCadIds.has(c.cd_cadeirante);
              return {
                value: c.cd_cadeirante,
                label: `${c.nm_cadeirante}${isAllocated ? ' (Já alocado)' : ''}${
                  c.possui_cadeira_propria ? ' • Cadeira Própria' : ''
                } • Camiseta ${c.tam_camisa}`,
                disabled: isAllocated,
              };
            }),
          ]}
        />

        <Select
          label="Condutor da Dupla"
          value={selectedCondutorId}
          onChange={(e) => setSelectedCondutorId(e.target.value ? Number(e.target.value) : '')}
          required
          options={[
            { value: '', label: 'Selecione um condutor...' },
            ...activeCondutores.map((c) => {
              const isAllocated = allocatedCondIds.has(c.cd_condutor);
              return {
                value: c.cd_condutor,
                label: `${c.nm_condutor}${isAllocated ? ' (Já alocado)' : ''} • Camiseta ${c.tam_camisa}`,
                disabled: isAllocated,
              };
            }),
          ]}
        />

        {selectedCad && selectedCond && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Dupla pronta: <strong>{selectedCad.nm_cadeirante}</strong> + <strong>{selectedCond.nm_condutor}</strong>
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
};
