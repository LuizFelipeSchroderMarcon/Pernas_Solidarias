// Aliases for compatibility
export type WheelchairUser = Cadeirante;
export type Runner = Condutor;
export type EventItem = Evento;
export type Pair = Dupla;
export type DetailedPair = DuplaDetalhada;
export type ParticipantePriorizado = PrioritizedParticipant;
export type ResultadoFormacaoDuplas = PairFormationResult;

export interface User {
  cd_user: number;
  email: string;
  senha?: string;
  tentativas_falhas?: number;
  bloqueado_ate?: Date | null;
  created_at: Date;
}

export interface Cadeirante {
  cd_cadeirante: number;
  nm_cadeirante: string;
  cpf: string;
  telefone: string;
  tam_camisa: string;
  data_nascimento?: string | Date;
  sexo?: string;
  possui_cadeira_propria: boolean;
  ativo: boolean;
  created_at: Date;
}

export interface Condutor {
  cd_condutor: number;
  nm_condutor: string;
  cpf: string;
  telefone: string;
  tam_camisa: string;
  data_nascimento?: string | Date;
  sexo?: string;
  ativo: boolean;
  created_at: Date;
}

export interface Evento {
  cd_evento: number;
  nm_evento: string;
  dt_evento: string | Date;
  created_at: Date;
  total_duplas?: number;
}

export interface Dupla {
  cd_dupla: number;
  cd_evento: number;
  cd_cadeirante: number;
  cd_condutor: number;
  created_at: Date;
}

export interface DuplaDetalhada {
  cd_dupla: number;
  cd_evento: number;
  nm_evento: string;
  dt_evento: string | Date;
  cd_cadeirante: number;
  nm_cadeirante: string;
  cpf_cadeirante: string;
  telefone_cadeirante: string;
  tam_camisa_cadeirante: string;
  data_nascimento_cadeirante?: string | Date;
  sexo_cadeirante?: string;
  possui_cadeira_propria: boolean;
  cd_condutor: number;
  nm_condutor: string;
  cpf_condutor: string;
  telefone_condutor: string;
  tam_camisa_condutor: string;
  data_nascimento_condutor?: string | Date;
  sexo_condutor?: string;
  created_at: Date;
}

export interface PrioritizedParticipant {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  tam_camisa: string;
  ativo: boolean;
  created_at: Date;
  possui_cadeira_propria?: boolean;
  dt_ultima_participacao: Date | null;
  total_participacoes: number;
}

export interface PairFormationResult {
  evento: Evento;
  total_duplas: number;
  duplas: DetailedPair[];
  cadeirantes_restantes: number;
  condutores_restantes: number;
}

export interface HistoryFilters {
  eventId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ExportOptions {
  includeCpf: boolean;
  format?: 'xlsx' | 'csv';
}

export interface RankingParticipant {
  id: number;
  nome: string;
  total_corridas: number;
}

export interface RankingEvent {
  id: number;
  nome: string;
  data: string | Date;
  total_duplas: number;
}

export interface AnalyticsRankingsResponse {
  top_runners: RankingParticipant[];
  top_wheelchair_users: RankingParticipant[];
  top_events: RankingEvent[];
}
