export interface User {
  cd_user: number;
  email: string;
  created_at?: string | Date;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Cadeirante {
  cd_cadeirante: number;
  nm_cadeirante: string;
  cpf: string;
  telefone: string;
  tam_camisa: string;
  data_nascimento?: string;
  sexo?: string;
  possui_cadeira_propria: boolean;
  ativo: boolean;
  created_at?: string | Date;
}

export interface Condutor {
  cd_condutor: number;
  nm_condutor: string;
  cpf: string;
  telefone: string;
  tam_camisa: string;
  data_nascimento?: string;
  sexo?: string;
  ativo: boolean;
  created_at?: string | Date;
}

export interface Evento {
  cd_evento: number;
  nm_evento: string;
  dt_evento: string;
  created_at?: string | Date;
  total_duplas?: number;
}

export interface Dupla {
  cd_dupla: number;
  cd_evento: number;
  cd_cadeirante: number;
  cd_condutor: number;
  created_at?: string | Date;
}

export interface DuplaDetalhada {
  cd_dupla: number;
  cd_evento: number;
  nm_evento?: string;
  dt_evento?: string;
  cd_cadeirante: number;
  nm_cadeirante: string;
  cpf_cadeirante?: string;
  telefone_cadeirante: string;
  tam_camisa_cadeirante: string;
  data_nascimento_cadeirante?: string;
  sexo_cadeirante?: string;
  possui_cadeira_propria: boolean;
  cd_condutor: number;
  nm_condutor: string;
  cpf_condutor?: string;
  telefone_condutor: string;
  tam_camisa_condutor: string;
  data_nascimento_condutor?: string;
  sexo_condutor?: string;
  created_at?: string | Date;
}

export interface PrioritizedParticipant {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  tam_camisa: string;
  ativo: boolean;
  possui_cadeira_propria?: boolean;
  dt_ultima_participacao?: string | null;
  total_participacoes: number;
}

export interface PairFormationResult {
  evento: Evento;
  total_duplas: number;
  duplas: DuplaDetalhada[];
  cadeirantes_restantes: number;
  condutores_restantes: number;
}

export interface HistoryFilters {
  cd_evento?: number;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}

export interface ExportOptions {
  includeCpf: boolean;
  format: 'xlsx' | 'csv';
}

export interface RankingParticipant {
  id: number;
  nome: string;
  total_corridas: number;
}

export interface RankingEvent {
  id: number;
  nome: string;
  data: string;
  total_duplas: number;
}

export interface AnalyticsRankings {
  top_runners: RankingParticipant[];
  top_wheelchair_users: RankingParticipant[];
  top_events: RankingEvent[];
}

export interface ApiSuccessResponse<T> {
  message?: string;
  data: T;
}

export interface ApiMessageResponse {
  message: string;
}

export interface ApiErrorResponse {
  error: string;
}
