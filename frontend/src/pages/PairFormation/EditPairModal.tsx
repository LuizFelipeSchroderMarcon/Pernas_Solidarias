import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import type { DuplaDetalhada, Cadeirante, Condutor } from '../../types';
import { participantService } from '../../services/participantService';
import { pairService } from '../../services/pairService';
import { useToast } from '../../hooks/useToast';
import { mensagemDeErro } from '../../services/apiError';

export interface EditPairModalProps {
  isOpen: boolean;
  onClose: () => void;
  pair: DuplaDetalhada | null;
  allPairs?: DuplaDetalhada[];
  cadeirantesList?: Cadeirante[];
  condutoresList?: Condutor[];
  onSaveDraft?: (
    pairId: number,
    cd_cadeirante: number,
    cd_condutor: number,
    cadeirante: Cadeirante,
    condutor: Condutor
  ) => void;
  onSuccess?: () => void;
}

export const EditPairModal: React.FC<EditPairModalProps> = ({
  isOpen,
  onClose,
  pair,
  allPairs = [],
  cadeirantesList,
  condutoresList,
  onSaveDraft,
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
      if (cadeirantesList && condutoresList && cadeirantesList.length > 0) {
        setCadeirantes(cadeirantesList);
        setCondutores(condutoresList);
      } else {
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
    }
  }, [isOpen, cadeirantesList, condutoresList]);

  useEffect(() => {
    if (pair) {
      setSelectedCadeirante(pair.cd_cadeirante);
      setSelectedCondutor(pair.cd_condutor);
    }
  }, [pair]);

  const safeAllPairs = Array.isArray(allPairs) ? allPairs : [];
  const otherPairs = pair ? safeAllPairs.filter((p) => p.cd_dupla !== pair.cd_dupla) : safeAllPairs;
  const otherAllocatedCadIds = new Set(otherPairs.map((p) => p.cd_cadeirante));
  const otherAllocatedCondIds = new Set(otherPairs.map((p) => p.cd_condutor));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair || !selectedCadeirante || !selectedCondutor) {
      error('Validação', 'Selecione um cadeirante e um condutor.');
      return;
    }

    if (otherAllocatedCadIds.has(Number(selectedCadeirante))) {
      error('Participante Já Alocado', 'O cadeirante selecionado já faz parte de outra dupla neste evento.');
      return;
    }

    if (otherAllocatedCondIds.has(Number(selectedCondutor))) {
      error('Participante Já Alocado', 'O condutor selecionado já faz parte de outra dupla neste evento.');
      return;
    }

    const cadObj = cadeirantes.find((c) => c.cd_cadeirante === Number(selectedCadeirante));
    const condObj = condutores.find((c) => c.cd_condutor === Number(selectedCondutor));

    if (!cadObj || !condObj) {
      error('Erro', 'Participante não encontrado.');
      return;
    }

    if (onSaveDraft) {
      onSaveDraft(pair.cd_dupla, Number(selectedCadeirante), Number(selectedCondutor), cadObj, condObj);
      success('Dupla alterada!', 'Alteração aplicada como rascunho. Lembre-se de salvar as duplas.');
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);
      await pairService.editPair(pair.cd_dupla, Number(selectedCadeirante), Number(selectedCondutor));
      success('Dupla atualizada!', 'A alteração manual da dupla foi realizada com sucesso.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const errMsg = mensagemDeErro(err, 'Não foi possível atualizar a dupla. Verifique se o participante já está em outra dupla.');
      error('Falha na edição', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Integrantes da Dupla"
      subtitle="Altere o cadeirante ou o condutor desta dupla."
      maxWidth="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Confirmar Alteração
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Select
          label="Cadeirante da Dupla"
          value={selectedCadeirante}
          onChange={(e) => setSelectedCadeirante(e.target.value ? Number(e.target.value) : '')}
          disabled={isLoadingParticipants}
          required
          options={[
            { value: '', label: 'Selecione um cadeirante...' },
            ...cadeirantes
              .filter((c) => c.ativo || c.cd_cadeirante === pair?.cd_cadeirante)
              .map((c) => {
                const isAllocated = otherAllocatedCadIds.has(c.cd_cadeirante);
                return {
                  value: c.cd_cadeirante,
                  label: `${c.nm_cadeirante}${isAllocated ? ' (Já alocado)' : ''} (${
                    c.ativo ? 'Ativo' : 'Inativo'
                  }${c.possui_cadeira_propria ? ' • Cadeira Própria' : ''} • Camiseta ${c.tam_camisa})`,
                  disabled: isAllocated,
                };
              }),
          ]}
        />

        <Select
          label="Condutor da Dupla"
          value={selectedCondutor}
          onChange={(e) => setSelectedCondutor(e.target.value ? Number(e.target.value) : '')}
          disabled={isLoadingParticipants}
          required
          options={[
            { value: '', label: 'Selecione um condutor...' },
            ...condutores
              .filter((c) => c.ativo || c.cd_condutor === pair?.cd_condutor)
              .map((c) => {
                const isAllocated = otherAllocatedCondIds.has(c.cd_condutor);
                return {
                  value: c.cd_condutor,
                  label: `${c.nm_condutor}${isAllocated ? ' (Já alocado)' : ''} (${
                    c.ativo ? 'Ativo' : 'Inativo'
                  } • Camiseta ${c.tam_camisa})`,
                  disabled: isAllocated,
                };
              }),
          ]}
        />
      </form>
    </Modal>
  );
};

