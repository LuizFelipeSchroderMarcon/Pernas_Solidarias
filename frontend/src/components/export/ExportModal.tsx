import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { exportService } from '../../services/exportService';
import { useToast } from '../../hooks/useToast';
import { mensagemDeErro } from '../../services/apiError';
import { FileSpreadsheet, FileText, Shield, ShieldAlert, Download } from 'lucide-react';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number | null;
  eventName?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventName,
}) => {
  const { success, error } = useToast();
  const [includeCpf, setIncludeCpf] = useState<boolean>(false);
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExport = async () => {
    if (!eventId) {
      error('Erro na exportação', 'Nenhum evento selecionado.');
      return;
    }

    try {
      setIsExporting(true);
      await exportService.exportEventReport(eventId, includeCpf, format, eventName);
      success(
        'Relatório exportado!',
        `O download do arquivo (${format.toUpperCase()}) foi iniciado com sucesso.`
      );
      onClose();
    } catch (err: unknown) {
      const errMsg = mensagemDeErro(err, 'Não foi possível gerar o relatório do evento.');
      error('Falha na exportação', errMsg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exportar Relatório de Duplas"
      subtitle={eventName ? `Evento: ${eventName}` : 'Selecione as opções de exportação para a organização'}
      maxWidth="xl"
      footer={
        <>
          <Button variant="danger" size="sm" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={handleExport}
            isLoading={isExporting}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Baixar Relatório
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6 py-2">
        {/* Formato de Exportação */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#525252] dark:text-slate-400">
            1. Formato do Arquivo
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat('xlsx')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                format === 'xlsx'
                  ? 'border-[#166534] dark:border-[#22C55E] bg-[#15803D]/15 dark:bg-[#15803D]/30 text-black dark:text-white ring-2 ring-[#166534]/30'
                  : 'border-[#B7B7B7] dark:border-slate-700 hover:border-[#7C7C7C] dark:hover:border-slate-600 text-black dark:text-slate-200'
              }`}
            >
              <div className="p-2 rounded-lg bg-[#15803D]/20 dark:bg-[#15803D]/30 text-[#166534] dark:text-[#4ADE80]">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Excel (.xlsx)</p>
                <p className="text-xs text-[#7C7C7C] dark:text-slate-400">Padrão para planilhas</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                format === 'csv'
                  ? 'border-[#166534] dark:border-[#22C55E] bg-[#15803D]/15 dark:bg-[#15803D]/30 text-black dark:text-white ring-2 ring-[#166534]/30'
                  : 'border-[#B7B7B7] dark:border-slate-700 hover:border-[#7C7C7C] dark:hover:border-slate-600 text-black dark:text-slate-200'
              }`}
            >
              <div className="p-2 rounded-lg bg-[#D9D9D9] dark:bg-slate-700 text-black dark:text-slate-200">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">CSV (.csv)</p>
                <p className="text-xs text-[#7C7C7C] dark:text-slate-400">Texto separado por vírgula</p>
              </div>
            </button>
          </div>
        </div>

        {/* Confirmação de inclusão de CPF */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#525252] dark:text-slate-400">
            2. Privacidade e Dados (LGPD)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIncludeCpf(false)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                !includeCpf
                  ? 'border-[#166534] dark:border-[#22C55E] bg-[#15803D]/15 dark:bg-[#15803D]/30 text-black dark:text-white ring-2 ring-[#166534]/30'
                  : 'border-[#B7B7B7] dark:border-slate-700 hover:border-[#7C7C7C] dark:hover:border-slate-600 text-black dark:text-slate-200'
              }`}
            >
              <div className="p-2 rounded-lg bg-[#15803D]/20 dark:bg-[#15803D]/30 text-[#166534] dark:text-[#4ADE80] shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Sem CPF (Recomendado)</p>
                <p className="text-xs text-[#7C7C7C] dark:text-slate-400 mt-0.5 leading-relaxed">
                  Oculta CPFs para maior privacidade
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIncludeCpf(true)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                includeCpf
                  ? 'border-[#F51414] dark:border-red-500 bg-[#F51414]/15 dark:bg-[#F51414]/30 text-black dark:text-white ring-2 ring-[#F51414]/20'
                  : 'border-[#B7B7B7] dark:border-slate-700 hover:border-[#7C7C7C] dark:hover:border-slate-600 text-black dark:text-slate-200'
              }`}
            >
              <div className="p-2 rounded-lg bg-[#F51414]/20 dark:bg-[#F51414]/30 text-[#F51414] dark:text-red-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Com CPF</p>
                <p className="text-xs text-[#7C7C7C] dark:text-slate-400 mt-0.5 leading-relaxed">
                  Apenas se exigido pela organização
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
