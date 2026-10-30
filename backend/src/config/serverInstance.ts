import crypto from 'crypto';

// Identificador único da inicialização do servidor.
// É renovado toda vez que a aplicação backend sobe (ex: reinício dos containers Docker), garantindo que tokens de instâncias anteriores sejam invalidados.
export const SERVER_BOOT_ID = crypto.randomUUID();
