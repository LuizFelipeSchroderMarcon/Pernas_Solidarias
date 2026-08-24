import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import type { Evento } from '../../types';
import { toInputDateFormat } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import { eventService } from '../../services/eventService';

export interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Evento | null;
  onSuccess: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  event,
  onSuccess,
}) => {
  const { success, error } = useToast();

  const [nome, setNome] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!event;

  useEffect(() => {
    if (event) {
      setNome(event.nm_evento);
      setDataEvento(toInputDateFormat(event.dt_evento));
    } else {
      setNome('');
      setDataEvento('');
    }
    setErrors({});
  }, [event, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = 'O nome do evento é obrigatório.';
    if (!dataEvento) newErrors.dataEvento = 'A data do evento é obrigatória.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        nm_evento: nome.trim(),
        dt_evento: dataEvento,
      };

      if (isEditing) {
        await eventService.updateEvent(event.cd_evento, payload);
        success('Evento atualizado!', 'As informações do evento foram alteradas com sucesso.');
      } else {
        await eventService.createEvent(payload);
        success('Evento cadastrado!', 'Novo evento criado e disponível para duplas.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Erro ao salvar evento.';
      error('Falha ao salvar', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Evento' : 'Novo Evento de Corrida'}
      subtitle="Informe o nome e a data da corrida (RF02)"
      maxWidth="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            {isEditing ? 'Salvar Alterações' : 'Criar Evento'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome do Evento"
          placeholder="Ex: Corrida Rústica de Joinville"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          error={errors.nome}
          required
          autoFocus
        />

        <Input
          label="Data da Corrida"
          type="date"
          value={dataEvento}
          onChange={(e) => setDataEvento(e.target.value)}
          error={errors.dataEvento}
          required
        />
      </form>
    </Modal>
  );
};
