import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import type { Cadeirante, Condutor } from '../../types';
import { formatCPF, formatPhone, cleanDigits, toInputDateFormat } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import { participantService } from '../../services/participantService';

export interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'cadeirante' | 'condutor';
  participant?: Cadeirante | Condutor | null;
  onSuccess: () => void;
}

export const ParticipantModal: React.FC<ParticipantModalProps> = ({
  isOpen,
  onClose,
  type,
  participant,
  onSuccess,
}) => {
  const { success, error } = useToast();

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tamCamisa, setTamCamisa] = useState('M');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('Masculino');
  const [possuiCadeiraPropria, setPossuiCadeiraPropria] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!participant;

  useEffect(() => {
    if (participant) {
      const isCadeirante = 'possui_cadeira_propria' in participant;
      setNome(isCadeirante ? (participant as Cadeirante).nm_cadeirante : (participant as Condutor).nm_condutor);
      setCpf(formatCPF(participant.cpf || ''));
      setTelefone(formatPhone(participant.telefone || ''));
      setTamCamisa(participant.tam_camisa || 'M');
      setDataNascimento(participant.data_nascimento ? toInputDateFormat(participant.data_nascimento) : '');
      setSexo(participant.sexo || 'Masculino');
      setAtivo(participant.ativo !== undefined ? participant.ativo : true);
      setPossuiCadeiraPropria(
        isCadeirante ? !!(participant as Cadeirante).possui_cadeira_propria : false
      );
    } else {
      setNome('');
      setCpf('');
      setTelefone('');
      setTamCamisa('M');
      setDataNascimento('');
      setSexo('Masculino');
      setPossuiCadeiraPropria(false);
      setAtivo(true);
    }
    setErrors({});
  }, [participant, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = 'O nome completo é obrigatório.';
    
    const cleanCpf = cleanDigits(cpf);
    if (!cleanCpf) {
      newErrors.cpf = 'O CPF é obrigatório.';
    } else if (cleanCpf.length !== 11) {
      newErrors.cpf = 'O CPF deve conter exatamente 11 dígitos.';
    }

    if (!telefone.trim()) newErrors.telefone = 'O telefone é obrigatório.';
    if (!tamCamisa) newErrors.tamCamisa = 'Selecione o tamanho da camiseta.';
    if (!dataNascimento) newErrors.dataNascimento = 'A data de nascimento é obrigatória.';
    if (!sexo) newErrors.sexo = 'Selecione o sexo.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const rawCpf = cleanDigits(cpf);
      const rawTelefone = cleanDigits(telefone);

      if (type === 'cadeirante') {
        const payload = {
          nm_cadeirante: nome.trim(),
          cpf: rawCpf,
          telefone: rawTelefone,
          tam_camisa: tamCamisa,
          data_nascimento: dataNascimento,
          sexo,
          possui_cadeira_propria: possuiCadeiraPropria,
          ativo,
        };

        if (isEditing) {
          const id = (participant as Cadeirante).cd_cadeirante;
          await participantService.updateCadeirante(id, payload);
          success('Sucesso!', 'Cadeirante atualizado com sucesso.');
        } else {
          await participantService.createCadeirante(payload);
          success('Sucesso!', 'Cadeirante cadastrado com sucesso.');
        }
      } else {
        const payload = {
          nm_condutor: nome.trim(),
          cpf: rawCpf,
          telefone: rawTelefone,
          tam_camisa: tamCamisa,
          data_nascimento: dataNascimento,
          sexo,
          ativo,
        };

        if (isEditing) {
          const id = (participant as Condutor).cd_condutor;
          await participantService.updateCondutor(id, payload);
          success('Sucesso!', 'Condutor atualizado com sucesso.');
        } else {
          await participantService.createCondutor(payload);
          success('Sucesso!', 'Condutor cadastrado com sucesso.');
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Erro ao salvar participante.';
      error('Falha na operação', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = `${isEditing ? 'Editar' : 'Cadastrar'} ${
    type === 'cadeirante' ? 'Cadeirante' : 'Condutor'
  }`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Preencha os dados do participante"
      maxWidth="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {isEditing ? 'Salvar Alterações' : 'Cadastrar'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome Completo"
          placeholder="Ex: João da Silva"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          error={errors.nome}
          required
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="CPF"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            maxLength={14}
            error={errors.cpf}
            required
          />

          <Input
            label="Telefone / WhatsApp"
            placeholder="(00) 00000-0000"
            value={telefone}
            onChange={(e) => setTelefone(formatPhone(e.target.value))}
            maxLength={15}
            error={errors.telefone}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Data de Nascimento"
            type="date"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            error={errors.dataNascimento}
            required
          />

          <Select
            label="Sexo"
            value={sexo}
            onChange={(e) => setSexo(e.target.value)}
            error={errors.sexo}
            required
            options={[
              { value: 'Masculino', label: 'Masculino' },
              { value: 'Feminino', label: 'Feminino' },
              { value: 'Outro', label: 'Outro' },
            ]}
          />
        </div>

        <Select
          label="Tamanho de Camiseta"
          value={tamCamisa}
          onChange={(e) => setTamCamisa(e.target.value)}
          error={errors.tamCamisa}
          required
          options={[
            { value: 'P', label: 'P' },
            { value: 'M', label: 'M' },
            { value: 'G', label: 'G' },
            { value: 'GG', label: 'GG' },
            { value: 'XG', label: 'XG' },
          ]}
        />

        {type === 'cadeirante' && (
          <div className="pt-2">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                checked={possuiCadeiraPropria}
                onChange={(e) => setPossuiCadeiraPropria(e.target.checked)}
              />
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Possui Cadeira Própria de Corrida
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Marque caso o participante tenha seu próprio equipamento
                </span>
              </div>
            </label>
          </div>
        )}
      </form>
    </Modal>
  );
};
