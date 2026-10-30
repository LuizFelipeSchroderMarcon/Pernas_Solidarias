import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { pairService } from '../../services/pairService';
import type { DuplaDetalhada } from '../../types';
import { formatDate } from '../../utils/formatters';
import { Armchair, Download, Users } from 'lucide-react';

export interface HistoryPairsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number | null;
  eventName?: string;
  eventDate?: string;
  onExport: (eventId: number, eventName: string) => void;
}

export const HistoryPairsModal: React.FC<HistoryPairsModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventName,
  eventDate,
  onExport,
}) => {
  const [pairs, setPairs] = useState<DuplaDetalhada[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      const fetchPairs = async () => {
        try {
          setIsLoading(true);
          const data = await pairService.listByEvent(eventId);
          setPairs(Array.isArray(data) ? data : (data as any)?.duplas || []);
        } catch (error) {
          console.error('Erro ao buscar duplas do evento:', error);
          setPairs([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPairs();
    } else {
      setPairs([]);
    }
  }, [isOpen, eventId]);

  const pairsList = Array.isArray(pairs) ? pairs : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventName ? `Duplas de ${eventName}` : 'Duplas Formadas'}
      subtitle={eventDate ? `Corrida realizada em ${formatDate(eventDate)}` : 'Histórico imutável de duplas'}
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500 font-medium">
            Total de duplas: <strong className="text-slate-800 dark:text-white">{pairsList.length}</strong>
          </span>
          <div className="flex gap-2">
            {eventId && pairsList.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onExport(eventId, eventName || `Evento #${eventId}`)}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Gerar Relatório
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <Spinner text="Carregando duplas deste evento..." className="py-12" />
      ) : pairsList.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="Nenhuma dupla encontrada"
          description="Este evento não possui registro de duplas formadas."
        />
      ) : (
        <div className="flex flex-col max-h-[60vh]">
          {/* Cabeçalho da tabela com as colunas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2.5 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-7 text-center shrink-0">#</span>
              <span>Cadeirante</span>
            </div>
            <div className="pl-10 sm:pl-0">
              <span>Condutor</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
            {pairsList.map((pair, index) => (
              <div
                key={pair.cd_dupla}
                className="py-3.5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-2 rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {pair.nm_cadeirante}
                    </span>
                    {pair.possui_cadeira_propria && (
                      <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium flex items-center gap-0.5 whitespace-nowrap">
                        <Armchair className="w-3 h-3" /> Cadeira própria
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-10 sm:pl-0 min-w-0">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {pair.nm_condutor}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};
