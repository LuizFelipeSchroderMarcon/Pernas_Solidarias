import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { pairService } from '../../services/pairService';
import type { DuplaDetalhada } from '../../types';
import { formatPhone, formatDate } from '../../utils/formatters';
import { Armchair, Phone, Download, Users } from 'lucide-react';

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
          setPairs(data);
        } catch (error) {
          console.error('Erro ao buscar duplas do evento:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPairs();
    } else {
      setPairs([]);
    }
  }, [isOpen, eventId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventName ? `Duplas de ${eventName}` : 'Duplas Formadas'}
      subtitle={eventDate ? `Corrida realizada em ${formatDate(eventDate)}` : 'Histórico imutável de duplas'}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500 font-medium">
            Total de duplas: <strong className="text-slate-800 dark:text-white">{pairs.length}</strong>
          </span>
          <div className="flex gap-2">
            {eventId && (
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
      ) : pairs.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="Nenhuma dupla encontrada"
          description="Este evento não possui registro de duplas formadas."
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[60vh] overflow-y-auto">
          {pairs.map((pair, index) => (
            <div
              key={pair.cd_dupla}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-2 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      ♿ {pair.nm_cadeirante}
                    </span>
                    <Badge variant="neutral" size="sm">
                      Tam. {pair.tam_camisa_cadeirante}
                    </Badge>
                    {pair.possui_cadeira_propria && (
                      <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-0.5">
                        <Armchair className="w-3 h-3" /> Cadeira própria
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Telefone: {formatPhone(pair.telefone_cadeirante)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-10 sm:pl-0">
                <span className="text-xs text-slate-400 font-bold">com</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      🏃 {pair.nm_condutor}
                    </span>
                    <Badge variant="neutral" size="sm">
                      Tam. {pair.tam_camisa_condutor}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {formatPhone(pair.telefone_condutor)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};
