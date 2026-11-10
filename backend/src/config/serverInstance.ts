import crypto from 'crypto';

// Identificador único da inicialização do servidor.
// Pode ser fixado via SERVER_BOOT_ID para desenvolvimento/multi-réplicas ou gerado aleatoriamente em memória no boot.
export const SERVER_BOOT_ID = process.env.SERVER_BOOT_ID || crypto.randomUUID();
