import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { exportService } from '../../services/exportService';
import { useToast } from '../../hooks/useToast';
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
      await exportService.exportEventReport(eventId, includeCpf, format);
      success(
        'Relatório exportado!',
        `O download do arquivo (${format.toUpperCase()}) foi iniciado com sucesso.`
      );
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Não foi possível gerar o relatório do evento.';
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
      maxWidth="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
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
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            1. Formato do Arquivo
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat('xlsx')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                format === 'xlsx'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20 dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-500'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Excel (.xlsx)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Padrão para planilhas</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                format === 'csv'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20 dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-500'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">CSV (.csv)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Texto separado por vírgula</p>
              </div>
            </button>
          </div>
        </div>

        {/* Confirmação de inclusão de CPF (RF11 / LGPD) */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            2. Privacidade e Dados (LGPD)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIncludeCpf(false)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                !includeCpf
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20 dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-500'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Sem CPF (Recomendado)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Oculta CPFs para maior privacidade
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIncludeCpf(true)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                includeCpf
                  ? 'border-amber-600 bg-amber-50/50 text-amber-900 ring-2 ring-amber-500/20 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-500'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Com CPF</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
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
