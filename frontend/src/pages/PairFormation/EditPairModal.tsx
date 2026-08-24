import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import type { DuplaDetalhada, Cadeirante, Condutor } from '../../types';
import { participantService } from '../../services/participantService';
import { pairService } from '../../services/pairService';
import { useToast } from '../../hooks/useToast';

export interface EditPairModalProps {
  isOpen: boolean;
  onClose: () => void;
  pair: DuplaDetalhada | null;
  onSuccess: () => void;
}

export const EditPairModal: React.FC<EditPairModalProps> = ({
  isOpen,
  onClose,
  pair,
  onSuccess,
}) => {
  const { success, error } = useToast();

  const [cadeirantes, setCadeirantes] = useState<Cadeirante[]>([]);
  const [condutores, setCondutores] = useState<Condutor[]>([]);
  const [selectedCadeirante, setSelectedCadeirante] = useState<number | ''>('');
  const [selectedCondutor, setSelectedCondutor] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadParticipants = async () => {
        try {
          setIsLoadingParticipants(true);
          const [cads, conds] = await Promise.all([
            participantService.getCadeirantes(),
            participantService.getCondutores(),
          ]);
          setCadeirantes(cads);
          setCondutores(conds);
        } catch {
          error('Erro', 'Não foi possível carregar a lista de participantes.');
        } finally {
          setIsLoadingParticipants(false);
        }
      };

      loadParticipants();
    }
  }, [isOpen]);

  useEffect(() => {
    if (pair) {
      setSelectedCadeirante(pair.cd_cadeirante);
      setSelectedCondutor(pair.cd_condutor);
    }
  }, [pair]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair || !selectedCadeirante || !selectedCondutor) {
      error('Validação', 'Selecione um cadeirante e um condutor.');
      return;
    }

    try {
      setIsSubmitting(true);
      await pairService.editPair(pair.cd_dupla, Number(selectedCadeirante), Number(selectedCondutor));
      success('Dupla atualizada!', 'A alteração manual da dupla foi realizada com sucesso (RF05).');
      onSuccess();
      onClose();
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error ||
        'Não foi possível atualizar a dupla. Verifique se o participante já está em outra dupla.';
      error('Falha na edição', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Dupla Manualmente"
      subtitle="Altere o cadeirante ou o condutor respeitando as regras RN01 e RN02 (RF05)"
      maxWidth="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Salvar Alteração
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-200 leading-relaxed">
          💡 A alteração manual preserva a integridade de 1 cadeirante + 1 condutor por dupla no
          mesmo evento.
        </div>

        <Select
          label="Cadeirante da Dupla"
          value={selectedCadeirante}
          onChange={(e) => setSelectedCadeirante(Number(e.target.value))}
          disabled={isLoadingParticipants}
          required
          options={[
            { value: '', label: 'Selecione um cadeirante...' },
            ...cadeirantes.map((c) => ({
              value: c.cd_cadeirante,
              label: `${c.nm_cadeirante} (${c.ativo ? 'Ativo' : 'Inativo'}${
                c.possui_cadeira_propria ? ' • Cadeira Própria' : ''
              } • Camiseta ${c.tam_camisa})`,
            })),
          ]}
        />

        <Select
          label="Condutor da Dupla"
          value={selectedCondutor}
          onChange={(e) => setSelectedCondutor(Number(e.target.value))}
          disabled={isLoadingParticipants}
          required
          options={[
            { value: '', label: 'Selecione um condutor...' },
            ...condutores.map((c) => ({
              value: c.cd_condutor,
              label: `${c.nm_condutor} (${c.ativo ? 'Ativo' : 'Inativo'} • Camiseta ${c.tam_camisa})`,
            })),
          ]}
        />
      </form>
    </Modal>
  );
};
