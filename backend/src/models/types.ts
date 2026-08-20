export interface User {
  cd_user: number;
  email: string;
  senha?: string;
  created_at: Date;
}

export interface Cadeirante {
  cd_cadeirante: number;
  nm_cadeirante: string;
  cpf: string;
  telefone: string;
  tam_camisa: string;
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
  ativo: boolean;
  created_at: Date;
}

export interface Evento {
  cd_evento: number;
  nm_evento: string;
  dt_evento: string | Date;
  created_at: Date;
}

export interface Dupla {
  cd_dupla: number;
  cd_evento: number;
  cd_cadeirante: number;
  cd_condutor: number;
  created_at: Date;
  // Campos auxiliares opcionais para joins
  nm_evento?: string;
  dt_evento?: string | Date;
  nm_cadeirante?: string;
  nm_condutor?: string;
}
